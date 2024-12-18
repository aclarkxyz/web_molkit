/*
	WebMolKit

	(c) 2010-2024 Molecular Materials Informatics, Inc.

	All rights reserved

	http://molmatinf.com

	[PKG=webmolkit]
*/

import {ResonanceRemover} from '../calc/ResonanceRemover';
import {Vec} from '../util/Vec';
import {BondArtifact} from './BondArtifact';
import {CoordUtil} from './CoordUtil';
import {DataSheet, DataSheetColumn} from './DataSheet';
import {ForeignMolecule, ForeignMoleculeTemplateDefn, ForeignMoleculeTransient} from './ForeignMolecule';
import {Molecule} from './Molecule';
import {MolUtil} from './MolUtil';
import {PolymerBlock, PolymerBlockConnectivity, PolymerBlockUnit} from './PolymerBlock';
import {QueryUtil} from './QueryUtil';
import {StereoGroup} from './StereoGroup';

/* eslint-disable key-spacing */

/*
	MDL Molfile reader: a somewhat flexible input parser that can turn V2000 and V3000 Molfiles into the internal molecule
	representation. The molfile format has several official variants, and a much larger number of mutant strains that
	exist in the wild: mileage may vary. If the structure is unreadable, an exception will be thrown. For information on
	anything interesting that happened during the parsing process, consult the "openmol" member.

	MDL SDfile reader: doing the best it can to pull out the auxiliary fields in SDfiles, which can be abused in endless ways,
	but one does one's best to deal with it.
*/

// valence options used by MDL/CTAB, which is much more promiscuous than the internal format
export const MDLMOL_VALENCE:Record<string, number[]> =
{
	'H':  [1],
	'B':  [3],
	'C':  [4],
	'Si': [4],
	'N':  [3],
	'P':  [3, 5],
	'As': [3, 5],
	'O':  [2],
	'S':  [2, 4, 6],
	'Se': [2, 4, 6],
	'Te': [2, 4, 6],
	'F':  [1],
	'Cl': [1, 3, 5, 7],
	'Br': [1],
	'I':  [1, 3, 5, 7],
	'At': [1, 3, 5, 7],
};

export interface MDLReaderLinkNode
{
	atom:number;
	nbrs:number[];
	minRep:number;
	maxRep:number;
}

export interface MDLReaderGroupMixture
{
	index:number;
	parent:number;
	type:string;
	atoms:number[];
}

export interface MDLReaderSuperAtom
{
	atoms:number[];
	name:string;

	// for polymers
	bracketType?:string;
	connectType?:string;
	bonds?:number[];
	bondConn?:number[];

	// data groups
	value?:string;
	unit?:string;
	query?:string;

	// for SCSR templates
	templateClass?:string;
	natReplace?:string;
	attachPoints?:string[];
}

export class MDLMOLReader
{
	// options
	public parseHeader = true; // if on, the first 3 lines are the pre-ctab header
	public parseExtended = true; // if on, extended fields are parsed; otherwise legacy MDL
	public allowV3000 = true; // if on, will diverge to a separate track for V3000
	public considerRescale = true; // if on, bond lengths will be rescaled if they are funky
	public keepAromatic = false; // set this to retain "type 4" bonds and other queries, instead of de-rezzing
	public keepParity = false; // set this to bring in the "parity" labels for atoms
	public keepQuery = true; // set this to translate query-type properties into the native equivalent

	// deliverables
	public mol:Molecule = null; // the result (or partial result, if not successful)
	public molName = ''; // molecule name from the header, if any
	public overallStereoAbsolute = true; // from the counts block, overall true=interpret stereo as absolute; false=interpret as relative

	// hydrogen count & resonance bonds supposed to be query-only, but some software abuses them to get around the structural limitations
	public resBonds:boolean[] = null;

	// "modern" features of CTAB which are not part of the lowest common denominator
	public groupAttachAny = new Map<number, number[]>(); // bond -> list of atom indices
	public groupAttachAll = new Map<number, number[]>(); // ditto
	public groupStereoAbsolute:number[] = []; // atom centres that have absolute stereochemistry
	public groupStereoRacemic:number[][] = []; // blocks of atoms which are racemic
	public groupStereoRelative:number[][] = []; // blocks of atoms which exist in their drawn configuration OR the opposite
	public groupLinkNodes:MDLReaderLinkNode[] = []; // so-called link nodes, aka repeating atom
	public groupMixtures:MDLReaderGroupMixture[] = []; // mixture collections, which may overlap
	public scsrTemplates:ForeignMoleculeTemplateDefn[] = null; // templates (SCSR = self-contained sequence representation)

	private pos = 0;
	private lines:string[];

	// ----------------- public methods -----------------

	constructor(strData:string)
	{
		this.lines = strData.split(/\r?\n/);
	}

	// perform the parsing operation, and populate the result fields
	public parse():Molecule
	{
		if (this.parseHeader)
		{
			this.molName = this.lines[0];
			this.pos = 3;
		}
		this.parseCTAB();
		return this.mol;
	}

	// ----------------- private methods -----------------

	private nextLine():string
	{
		if (this.pos >= this.lines.length) throw 'MDL Molfile parser: premature end, at line ' + (this.pos + 1);
		return this.lines[this.pos++];
	}

	// pull out the main CTAB block: this is where the real action is
	private parseCTAB():void
	{
		this.mol = new Molecule();
		this.mol.keepTransient = true;

		// check out the counts line
		let line = this.nextLine();
		let version = line.length >= 39 ? line.substring(34, 39) : '';
		if (this.allowV3000 && version == 'V3000')
		{
			this.parseV3000();
			this.mol.keepTransient = false;
			return;
		}
		if (version != 'V2000') throw 'Invalid MDL MOL: no Vx000 tag.';

		let numAtoms = parseInt(line.substring(0, 3).trim());
		let numBonds = parseInt(line.substring(3, 6).trim());
		if (line.length >= 15) this.overallStereoAbsolute = parseInt(line.substring(12, 15).trim()) == 1;

		// read out each atom
		for (let n = 0; n < numAtoms; n++)
		{
			line = this.nextLine();
			if (line.length < 34) throw 'Invalid MDL MOL: atom line' + (n + 1);

			let x = parseFloat(line.substring(0, 10).trim());
			let y = parseFloat(line.substring(10, 20).trim());
			let z = parseFloat(line.substring(20, 30).trim());
			let el = line.substring(31, 34).trim();
			let chg = line.length < 39 ? 0 : parseInt(line.substring(36, 39).trim()), rad = 0;
			let stereo = line.length < 42 ? 0 : parseInt(line.substring(39, 42).trim());
			let hyd = line.length < 45 ? 0 : parseInt(line.substring(42, 45).trim());
			let val = line.length < 51 ? 0 : parseInt(line.substring(48, 51).trim());
			let mapnum = line.length < 63 ? 0 : parseInt(line.substring(60, 63).trim());

			if (chg >= 1 && chg <= 3) chg = 4 - chg;
			else if (chg == 4) {chg = 0; rad = 2;}
			else if (chg >= 5 && chg <= 7) chg = 4 - chg;
			else chg = 0;

			let a = this.mol.addAtom(el, x, y, chg, rad);
			if (z != 0)
			{
				this.mol.setAtomZ(a, z);
				this.mol.setIs3D(true);
			}
			this.mol.setAtomMapNum(a, mapnum);

			if (hyd > 0) QueryUtil.setQueryAtomHydrogens(this.mol, a, [hyd - 1]);

			if (stereo > 0 && this.keepParity)
			{
				let trans = this.mol.atomTransient(a);
				if (stereo == 1) this.mol.setAtomTransient(a, Vec.append(trans, ForeignMoleculeTransient.AtomChiralMDLOdd));
				else if (stereo == 2) this.mol.setAtomTransient(a, Vec.append(trans, ForeignMoleculeTransient.AtomChiralMDLEven));
				else if (stereo == 3) this.mol.setAtomTransient(a, Vec.append(trans, ForeignMoleculeTransient.AtomChiralMDLRacemic));
			}

			if (val != 0) ForeignMolecule.markExplicitValence(this.mol, n + 1, val > 14 ? 0 : val);
		}

		// read out each bond
		for (let n = 0; n < numBonds; n++)
		{
			line = this.nextLine();
			if (line.length >= 9 && line.length < 12) line = line.substring(0, 9) + '  0';
			if (line.length < 12) throw 'Invalid MDL MOL: bond line' + (n + 1);

			let bfr = parseInt(line.substring(0, 3).trim()), bto = parseInt(line.substring(3, 6).trim());
			let type = parseInt(line.substring(6, 9).trim()), stereo = parseInt(line.substring(9, 12).trim());

			if (bfr == bto || bfr < 1 || bfr > numAtoms || bto < 1 || bto > numAtoms) throw 'Invalid MDL MOL: bond line' + (n + 1);

			let order = type >= 1 && type <= 3 ? type : type == 8 || type == 9 || type == 10 ? 0 : 1;
			let style = Molecule.BONDTYPE_NORMAL;
			if (stereo == 1) style = Molecule.BONDTYPE_INCLINED;
			else if (stereo == 6) style = Molecule.BONDTYPE_DECLINED;
			else if (stereo == 3 || stereo == 4) style = Molecule.BONDTYPE_UNKNOWN;

			let b = this.mol.addBond(bfr, bto, order, style);
			if (type == 9) this.mol.appendBondTransient(b, ForeignMoleculeTransient.BondZeroDative);
			if (type == 9) this.mol.appendBondTransient(b, ForeignMoleculeTransient.BondZeroHydrogen);

			if (this.keepQuery)
			{
				if (type == 4) QueryUtil.setQueryBondOrders(this.mol, b, [-1]); // aromatic query type
				else if (type == 5) QueryUtil.setQueryBondOrders(this.mol, b, [1, 2]); // single-or-double query type
				else if (type == 6) QueryUtil.setQueryBondOrders(this.mol, b, [-1, 1]); // single-or-aromatic query type
				else if (type == 7) QueryUtil.setQueryBondOrders(this.mol, b, [-1, 2]); // double-or-aromatic query type
				else if (type == 8) QueryUtil.setQueryBondOrders(this.mol, b, [-1, 0, 1, 2, 3]); // any
			}
			else
			{
				// type "4" is special: it is defined to be a special query type to match aromatic bonds, but it is sometimes used
				// to store actual molecules; in this case, it is necessary to either "deresonate" the rings, or to stash the property
				if (type == 4)
				{
					if (this.keepAromatic) this.mol.setBondTransient(b, Vec.append(this.mol.bondTransient(b), ForeignMoleculeTransient.BondAromatic));
					else
					{
						if (this.resBonds == null) this.resBonds = Vec.booleanArray(false, numBonds);
						this.resBonds[n] = true;
					}
				}
			}
		}

		// examine anything in the M-block
		const MBLK_CHG = 1, MBLK_RAD = 2, MBLK_ISO = 3, MBLK_RGP = 4, MBLK_HYD = 5, MBLK_ZCH = 6, MBLK_ZBO = 7,
			  MBLK_ZPA = 8, MBLK_ZRI = 9, MBLK_ZAR = 10, MBLK_RBC = 11, MBLK_SUB = 12, MBLK_UNS = 13;
		let resPaths = new Map<number, number[]>(), resRings = new Map<number, number[]>(), arenes = new Map<number, number[]>();
		let superatoms = new Map<number, MDLReaderSuperAtom>(), mixtures = new Map<number, MDLReaderGroupMixture>();

		while (true)
		{
			line = this.nextLine();
			if (line.startsWith('M  END')) break;

			let type = 0;
			if (line.startsWith('M  CHG')) type = MBLK_CHG;
			else if (line.startsWith('M  RAD')) type = MBLK_RAD;
			else if (line.startsWith('M  ISO')) type = MBLK_ISO;
			else if (line.startsWith('M  RGP')) type = MBLK_RGP;
			else if (this.parseExtended && line.startsWith('M  HYD')) type = MBLK_HYD;
			else if (this.parseExtended && line.startsWith('M  ZCH')) type = MBLK_ZCH;
			else if (this.parseExtended && line.startsWith('M  ZBO')) type = MBLK_ZBO;
			else if (this.parseExtended && line.startsWith('M  ZPA')) type = MBLK_ZPA;
			else if (this.parseExtended && line.startsWith('M  ZRI')) type = MBLK_ZRI;
			else if (this.parseExtended && line.startsWith('M  ZAR')) type = MBLK_ZAR;
			else if (this.parseExtended && line.startsWith('M  RBC')) type = MBLK_RBC;
			else if (this.parseExtended && line.startsWith('M  SUB')) type = MBLK_SUB;
			else if (this.parseExtended && line.startsWith('M  UNS')) type = MBLK_UNS;
			else if (line.startsWith('A  ') && line.length >= 6)
			{
				let anum = parseInt(line.substring(3, 6).trim());
				if (anum >= 1 && anum <= this.mol.numAtoms)
				{
					line = this.nextLine();
					if (line == null) break;
					this.mol.setAtomElement(anum, line);
					continue;
				}
			}
			else if (line.startsWith('M  STY'))
			{
				let len = parseInt(line.substring(6, 9).trim());
				for (let n = 0; n < len; n++)
				{
					let idx = parseInt(line.substring(9 + 8 * n, 13 + 8 * n).trim());
					let stype = line.substring(14 + 8 * n, 17 + 8 * n);
					if (stype == 'SUP') superatoms.set(idx, {atoms: [], name: null});
					else if (stype == 'MIX' || stype == 'FOR') mixtures.set(idx, {index: idx, parent: 0, atoms: [], type: stype});
					else if (stype == 'SRU' || stype == 'COP' || stype == 'MUL' || stype == 'DAT') superatoms.set(idx, {atoms: [], name: null, bracketType: stype});
				}
			}
			else if (line.startsWith('M  SPL'))
			{
				let len = parseInt(line.substring(6, 9).trim());
				for (let n = 0; n < len; n++)
				{
					let child = parseInt(line.substring(9 + 8 * n, 13 + 8 * n).trim());
					let parent = parseInt(line.substring(13 + 8 * n, 17 + 8 * n).trim());
					let mix = mixtures.get(child);
					if (mix != null) mix.parent = parent;
				}
			}
			else if (line.startsWith('M  SAL'))
			{
				let idx = parseInt(line.substring(6, 10).trim());
				let sup = superatoms.get(idx);
				if (sup != null)
				{
					let len = parseInt(line.substring(10, 13).trim());
					let atoms = Vec.numberArray(0, len);
					for (let n = 0; n < len; n++) atoms[n] = parseInt(line.substring(13 + 4 * n, 17 + 4 * n).trim());
					sup.atoms = Vec.concat(sup.atoms, atoms);
				}
				let mix = mixtures.get(idx);
				if (mix != null)
				{
					let len = parseInt(line.substring(10, 13).trim());
					let atoms = Vec.numberArray(0, len);
					for (let n = 0; n < len; n++) atoms[n] = parseInt(line.substring(13 + 4 * n, 17 + 4 * n).trim());
					mix.atoms = Vec.concat(mix.atoms, atoms);
				}
			}
			else if (line.startsWith('M  SBL'))
			{
				let idx = parseInt(line.substring(6, 10).trim());
				let sup = superatoms.get(idx);
				if (sup != null)
				{
					let len = parseInt(line.substring(10, 13).trim());
					let bonds = Vec.numberArray(0, len);
					for (let n = 0; n < len; n++) bonds[n] = parseInt(line.substring(13 + 4 * n, 17 + 4 * n).trim());
					sup.bonds = Vec.concat(sup.bonds, bonds);
				}
			}
			else if (line.startsWith('M  SMT'))
			{
				let idx = parseInt(line.substring(6, 10).trim());
				let sup = superatoms.get(idx);
				if (sup != null) sup.name = line.substring(11).trim();
			}
			else if (line.startsWith('M  SDT'))
			{
				let idx = parseInt(line.substring(6, 10).trim());
				let sup = superatoms.get(idx);
				if (sup)
				{
					sup.name = line.substring(11, 41).trim();
					sup.unit = line.substring(43, 63).trim();
					sup.query = line.substring(63).trim();
				}
			}
			else if (line.startsWith('M  SED'))
			{
				let idx = parseInt(line.substring(6, 10).trim());
				let sup = superatoms.get(idx);
				if (sup) sup.value = line.substring(11).trim();
			}
			else if (line.startsWith('M  SCN'))
			{
				let len = parseInt(line.substring(6, 9).trim());
				for (let n = 0; n < len; n++)
				{
					let idx = parseInt(line.substring(9 + 8 * n, 13 + 8 * n).trim());
					let stype = line.substring(14 + 8 * n, 17 + 8 * n);
					let sup = superatoms.get(idx);
					if (sup != null) sup.connectType = stype.trim();
				}
			}
			else if (line.startsWith('M  CRS'))
			{
				let idx = parseInt(line.substring(6, 10).trim());
				let sup = superatoms.get(idx);
				if (sup != null)
				{
					let len = parseInt(line.substring(10, 13).trim());
					sup.bondConn = Vec.numberArray(0, len);
					for (let n = 0; n < len; n++) sup.bondConn[n] = parseInt(line.substring(13 + 4 * n, 17 + 4 * n).trim());
				}
			}
			else if (line.startsWith('M  LIN'))
			{
				let len = parseInt(line.substring(6, 9).trim());
				for (let n = 0; n < len; n++)
				{
					let node:MDLReaderLinkNode =
					{
						atom: parseInt(line.substring(9 + 8 * n, 13 + 8 * n).trim()),
						nbrs: [],
						minRep: 1,
						maxRep: parseInt(line.substring(13 + 8 * n, 17 + 8 * n).trim()),
					};

					let nbr1 = parseInt(line.substring(17 + 8 * n, 21 + 8 * n).trim());
					let nbr2 = parseInt(line.substring(21 + 8 * n, 25 + 8 * n).trim());
					if (nbr1 > 0) node.nbrs.push(nbr1);
					if (nbr2 > 0) node.nbrs.push(nbr2);

					this.groupLinkNodes.push(node);
				}
			}
			else if (line.startsWith('M  ALS'))
			{
				let atom = parseInt(line.substring(7, 10).trim());
				let len = parseInt(line.substring(10, 13).trim());
				let logic = line.charAt(14);
				let elements:string[] = [];
				for (let n = 0; n < len; n++) elements.push(line.substring(16 + n * 4, 20 + n * 4).trim());

				this.mol.setAtomElement(atom, '*');
				if (logic == 'F') QueryUtil.setQueryAtomElements(this.mol, atom, elements);
				else if (logic == 'T') QueryUtil.setQueryAtomElementsNot(this.mol, atom, elements);
			}

			if (type == MBLK_ZPA || type == MBLK_ZRI || type == MBLK_ZAR)
			{
				let len = parseInt(line.substring(6, 9).trim()), blk = parseInt(line.substring(9, 13).trim());
				let map = type == MBLK_ZPA ? resPaths : type == MBLK_ZRI ? resRings : /* type == MBLK_ZAR */ arenes;
				for (let n = 0; n < len; n++)
				{
					let val = parseInt(line.substring(13 + 4 * n, 17 + 4 * n).trim());
					if (val < 1 || val > numAtoms) throw 'Invalid MDL MOL: M-block';
					let atoms = map.get(blk);
					if (!atoms) map.set(blk, atoms = []);
					atoms.push(val);
				}
			}
			else if (type > 0)
			{
				let len = parseInt(line.substring(6, 9).trim());
				for (let n = 0; n < len; n++)
				{
					let pos = parseInt(line.substring(9 + 8 * n, 13 + 8 * n).trim());
					let val = parseInt(line.substring(13 + 8 * n, 17 + 8 * n).trim());
					if (pos < 1) throw 'Invalid MDL MOL: M-block';

					if (type == MBLK_CHG) this.mol.setAtomCharge(pos, val);
					else if (type == MBLK_RAD)
					{
						if (val == 1 || val == 3) this.mol.setAtomUnpaired(pos, 2);
						else if (val == 2) this.mol.setAtomUnpaired(pos, 1);
					}
					else if (type == MBLK_ISO) this.mol.setAtomIsotope(pos, val);
					else if (type == MBLK_RGP) this.mol.setAtomElement(pos, 'R' + val);
					else if (type == MBLK_HYD) this.mol.setAtomHExplicit(pos, val);
					else if (type == MBLK_ZCH) this.mol.setAtomCharge(pos, val);
					else if (type == MBLK_ZBO) this.mol.setBondOrder(pos, val);
					else if (type == MBLK_RBC && val != 0)
					{
						if (val == -2) val = this.countRingBonds(pos);
						else if (val == -1) val = 0;
						QueryUtil.setQueryAtomRingBonds(this.mol, pos, [val]);
					}
					else if (type == MBLK_SUB && val != 0)
					{
						if (val == -2) val = this.countSubstitutions(pos);
						else if (val == -1) val = 0;
						QueryUtil.setQueryAtomAdjacency(this.mol, pos, [val]);
					}
					else if (type == MBLK_UNS)
					{
						if (val == 1) QueryUtil.setQueryAtomUnsaturated(this.mol, pos, true);
					}
				}
			}
		}

		this.postFix();

		if (this.parseExtended)
		{
			let artifacts = new BondArtifact(this.mol);
			for (let atoms of resPaths.values()) artifacts.createPath(atoms);
			for (let atoms of resRings.values()) artifacts.createRing(atoms);
			for (let atoms of arenes.values()) artifacts.createArene(atoms);
			artifacts.rewriteMolecule();
		}

		// process polymer superblocks first
		for (let key of Vec.sorted(Array.from(superatoms.keys())))
		{
			let value = superatoms.get(key);
			if (value.bracketType)
			{
				superatoms.delete(key);
				this.applyPolymerBlock(value);
			}
		}

		// process non-polymer superblocks
		for (let key of Vec.sorted(Array.from(superatoms.keys())))
		{
			let value = superatoms.get(key);
			superatoms.delete(key);
			this.applySuperAtom(value, Array.from(superatoms.values()));
		}

		for (let key of Vec.sorted(Array.from(mixtures.keys()))) this.groupMixtures.push(mixtures.get(key));

		this.mol.keepTransient = false;
	}

	// performs some intrinsic post-parse fixing
	private postFix():void
	{
		const mol = this.mol;

		// post-fixing
		for (let n = 1; n <= mol.numAtoms; n++)
		{
			if (MolUtil.hasAbbrev(mol, n) || mol.atomTransient(n).some((str) => str.startsWith(ForeignMoleculeTransient.AtomSCSRClass))) continue;

			let el = mol.atomElement(n);

			// shortcuts for isotope "elements"
			if (el == 'D') {mol.setAtomElement(n, 'H'); mol.setAtomIsotope(n, 2);}
			else if (el == 'T') {mol.setAtomElement(n, 'H'); mol.setAtomIsotope(n, 3);}

			if (mol.is3D && mol.atomZ(n) === undefined) mol.setAtomZ(n, 0);

			// valence, two correction scenarios
			let valence = ForeignMolecule.noteExplicitValence(this.mol, n);
			let options = MDLMOL_VALENCE[el];
			if (valence != null)
			{
				let hcount = valence < 0 || valence > 14 ? 0 : valence;
				for (let b of mol.atomAdjBonds(n)) hcount -= mol.bondOrder(b);
				if (hcount != mol.atomHydrogens(n)) mol.setAtomHExplicit(n, Math.max(0, hcount));
			}
			else if (options)
			{
				let chg = mol.atomCharge(n);
				let chgmod = (el == 'C' || el == 'H') ? Math.abs(chg) : el == 'B' ? -Math.abs(chg) : -chg;
				let usedValence = chgmod;
				let unp = mol.atomUnpaired(n);
				if (unp > 0 && (el == 'C' || el == 'O' || el == 'S' || el == 'N' || el == 'P')) usedValence += unp;
				for (let b of mol.atomAdjBonds(n)) usedValence += mol.bondOrder(b);
				for (let v of options) if (usedValence <= v)
				{
					let hcount = v - usedValence;
					if (hcount != mol.atomHydrogens(n)) mol.setAtomHExplicit(n, Math.max(0, hcount));
					break;
				}
			}
		}

		if (this.considerRescale && Vec.isBlank(this.scsrTemplates)) CoordUtil.normaliseBondDistances(mol);

		if (this.resBonds != null)
		{
			let derez = new ResonanceRemover(mol, this.resBonds, null);
			try
			{
				derez.perform();
				for (let n = 0; n < mol.numBonds; n++) mol.setBondOrder(n + 1, derez.bondOrders[n]);
			}
			catch (ex)
			{
				// silent failure: de-resonance Kekulisation failed; the aromatic bonds will be left as single
			}
		}
	}

	// alternate track: only look at the specially marked V3000 tags
	private parseV3000():void
	{
		enum Section {Atom, Bond, Coll, SGroup, Template}
		let inCTAB = false, inTemplate = false;
		let section:Section = null;

		let lineCounts:string = null;
		let lineAtom:string[] = [], lineBond:string[] = [], lineColl:string[] = [], lineSgroup:string[] = [];
		let asdrawnRBC:number[] = [], asdrawnSUB:number[] = [];

		let templateBlocks:string[][] = [];

		const ERRPFX = 'Invalid MDL MOL V3000: ';

		while (true)
		{
			let fullLine = this.nextLine();
			if (fullLine == 'M  END') break; // graceful end

			if (!fullLine.startsWith('M  V30 ')) continue;
			let line = fullLine.substring(7);

			if (line.startsWith('BEGIN TEMPLATE')) inTemplate = true;
			else if (line.startsWith('END TEMPLATE')) inTemplate = false;
			else if (line.startsWith('TEMPLATE ') && inTemplate) templateBlocks.push([fullLine]);
			else if (inTemplate && templateBlocks != null) Vec.last(templateBlocks).push(fullLine);
			else if (line.startsWith('COUNTS ')) lineCounts = line.substring(7);
			else if (line.startsWith('BEGIN CTAB')) inCTAB = true;
			else if (line.startsWith('BEGIN ATOM')) section = Section.Atom;
			else if (line.startsWith('BEGIN BOND')) section = Section.Bond;
			else if (line.startsWith('BEGIN COLLECTION')) section = Section.Coll;
			else if (line.startsWith('BEGIN SGROUP')) section = Section.SGroup;
			else if (line.startsWith('END ')) section = null;
			// TO DO: make sure these are nested properly, bug out if not
			else if (inCTAB && section == Section.Atom) lineAtom.push(line);
			else if (inCTAB && section == Section.Bond) lineBond.push(line);
			else if (inCTAB && section == Section.Coll) lineColl.push(line);
			else if (inCTAB && section == Section.SGroup) lineSgroup.push(line);
			else if (inCTAB && section == null)
			{
				if (line.startsWith('LINKNODE '))
				{
					let bits = this.splitWithQuotes(line.substring(9));

					let node:MDLReaderLinkNode =
					{
						atom: 0,
						nbrs: [],
						minRep: parseInt(bits[0]),
						maxRep: parseInt(bits[1])
					};

					// convert the list of bond {a1,a2} into central atom / neighbours
					let nb = parseInt(bits[2]);
					let atoms:number[] = [];
					for (let n = 0; n < nb * 2; n++) atoms.push(parseInt(bits[3 + n]));
					Vec.sort(atoms);
					for (let n = 0; n < atoms.length; n++)
					{
						if (n < atoms.length - 1 && atoms[n] == atoms[n + 1])
							node.atom = atoms[n++];
						else
							node.nbrs.push(atoms[n]);
					}

					this.groupLinkNodes.push(node);
				}
			}
			// (silently ignore other stuff; don't care)
		}

		let counts = lineCounts.trim().split(/\s+/);
		if (counts.length < 2) throw ERRPFX + 'counts line malformatted';
		let numAtoms = parseInt(counts[0]), numBonds = parseInt(counts[1]);
		if (numAtoms < 0 || numAtoms > lineAtom.length) throw ERRPFX + 'unreasonable atom count: ' + numAtoms;
		if (numBonds < 0 || numBonds > lineBond.length) throw ERRPFX + 'unreasonable bond count: ' + numBonds;

		let atomBits:string[][] = [], bondBits:string[][] = [];

		// extract atom & bond content
		for (let n = 0; n < lineAtom.length; n++)
		{
			let line = lineAtom[n];
			while (n < lineAtom.length - 1 && line.endsWith('-'))
			{
				n++;
				line = line.substring(0, line.length - 1) + lineAtom[n];
			}
			let bits = this.splitWithQuotes(line);
			if (bits.length < 6) throw ERRPFX + 'atom line has too few components: ' + line;
			let idx = parseInt(bits[0], 0);
			if (idx < 1 || idx > numAtoms) throw ERRPFX + 'invalid atom index: ' + bits[0];
			if (atomBits[idx - 1] != null) throw ERRPFX + 'duplicate atom index: ' + idx;
			atomBits[idx - 1] = bits;
		}
		for (let n = 0; n < lineBond.length; n++)
		{
			let line = lineBond[n];
			while (n < lineBond.length - 1 && line.endsWith('-'))
			{
				n++;
				line = line.substring(0, line.length - 1) + lineBond[n];
			}
			let bits = this.splitWithQuotes(line);
			if (bits.length < 4) throw ERRPFX + 'bond line has too few components: ' + line;
			let idx = parseInt(bits[0], 0);
			if (idx < 1 || idx > numBonds) throw ERRPFX + 'invalid bond index: ' + bits[0];
			if (bondBits[idx - 1] != null) throw ERRPFX + 'duplicate bond index: ' + idx;
			bondBits[idx - 1] = bits;
		}

		// process each atom
		for (let a = 1; a <= numAtoms; a++)
		{
			let bits = atomBits[a - 1];
			if (bits == null) throw ERRPFX + 'atom definition missing for #' + a;

			let type = bits[1];
			if (type.length > 2 && type.startsWith('"') && type.endsWith('"')) type = type.substring(1, type.length - 1);

			let x = parseFloat(bits[2]), y = parseFloat(bits[3]), z = parseFloat(bits[4]);
			let map = parseInt(bits[5]);
			this.mol.addAtom(type, x, y);
			if (z != 0)
			{
				this.mol.setAtomZ(a, z);
				this.mol.setIs3D(true);
			}
			this.mol.setAtomMapNum(a, map);

			this.parseQueryAtomList(this.mol, a);

			for (let i = 6; i < bits.length; i++)
			{
				let eq = bits[i].indexOf('=');
				if (eq < 0) continue;
				let key = bits[i].substring(0, eq), val = bits[i].substring(eq + 1);
				if (key == 'CHG') this.mol.setAtomCharge(a, parseInt(val));
				else if (key == 'RAD')
				{
					let spin = parseInt(val);
					if (spin == 1 || spin == 3) this.mol.setAtomUnpaired(a, 2);
					else if (spin == 2) this.mol.setAtomUnpaired(a, 1);
				}
				else if (key == 'MASS') this.mol.setAtomIsotope(a, parseInt(val));
				else if (key == 'CFG')
				{
					let stereo = parseInt(val);
					if (stereo > 0 && this.keepParity)
					{
						/* todo: record incoming parity
						let trans = this.mol.atomTransient(n);
						if (stereo == 1) mol.setAtomTransient(n, Vec.append(trans, ForeignMolecule.ATOM_CHIRAL_MDL_ODD));
						else if (stereo == 2) mol.setAtomTransient(n, Vec.append(trans, ForeignMolecule.ATOM_CHIRAL_MDL_EVEN));
						else if (stereo == 3) mol.setAtomTransient(n, Vec.append(trans, ForeignMolecule.ATOM_CHIRAL_MDL_RACEMIC));*/
					}
				}
				else if (key == 'VAL') ForeignMolecule.markExplicitValence(this.mol, a, parseInt(val));
				else if (key == 'CLASS')
				{
					this.mol.appendAtomTransient(a, ForeignMoleculeTransient.AtomSCSRClass + ':' + val);
				}
				else if (key == 'SEQID')
				{
					this.mol.appendAtomTransient(a, ForeignMoleculeTransient.AtomSCSRSeqID + ':' + val);
				}
				else if (key == 'ATTCHORD')
				{
					let attch = this.unpackStrings(val);
					if (attch != null) this.mol.appendAtomTransient(a, ForeignMoleculeTransient.AtomSCSRAttchOrd + ':' + attch.join(','));
				}
				else if (key == 'HCOUNT')
				{
					let hyd = parseInt(val);
					if (hyd != 0) QueryUtil.setQueryAtomHydrogens(this.mol, a, [Math.max(hyd, 0)]);
				}
				else if (key == 'RBCNT')
				{
					let rbc = parseInt(val);
					if (rbc == -2) asdrawnRBC.push(a);
					else if (rbc != 0) QueryUtil.setQueryAtomRingBonds(this.mol, a, [Math.max(rbc, 0)]);
				}
				else if (key == 'SUBST')
				{
					let sub = parseInt(val);
					if (sub == -2) asdrawnSUB.push(a);
					else if (sub != 0) QueryUtil.setQueryAtomAdjacency(this.mol, a, [Math.max(sub, 0)]);
				}
				else if (key == 'UNSAT')
				{
					let uns = parseInt(val);
					if (uns == 1) QueryUtil.setQueryAtomUnsaturated(this.mol, a, true);
				}
			}
		}

		// process each bond
		for (let b = 1; b <= numBonds; b++)
		{
			let bits = bondBits[b - 1];
			if (bits == null) throw ERRPFX + 'bond definition missing for #' + b;

			let type = parseInt(bits[1]), bfr = parseInt(bits[2]), bto = parseInt(bits[3]);
			let order = type >= 1 && type <= 3 ? type : type == 9 || type == 10 ? 0 : 1;
			this.mol.addBond(bfr, bto, order);
			if (type == 9) this.mol.appendBondTransient(b, ForeignMoleculeTransient.BondZeroDative);
			if (type == 10) this.mol.appendBondTransient(b, ForeignMoleculeTransient.BondZeroHydrogen);

			if (this.keepQuery)
			{
				if (type == 4) QueryUtil.setQueryBondOrders(this.mol, b, [-1]); // aromatic query type
				else if (type == 5) QueryUtil.setQueryBondOrders(this.mol, b, [1, 2]); // single-or-double query type
				else if (type == 6) QueryUtil.setQueryBondOrders(this.mol, b, [-1, 1]); // single-or-aromatic query type
				else if (type == 7) QueryUtil.setQueryBondOrders(this.mol, b, [-1, 2]); // double-or-aromatic query type
				else if (type == 8) QueryUtil.setQueryBondOrders(this.mol, b, [-1, 0, 1, 2, 3]); // anything
			}
			else
			{
				// type "4" is special: it is defined to be a special query type to match aromatic bonds, but it is sometimes used
				// to store actual molecules; in this case, it is necessary to either "deresonate" the rings, or to stash the property
				if (type == 4)
				{
					if (this.keepAromatic) this.mol.setBondTransient(b, Vec.append(this.mol.bondTransient(b), ForeignMoleculeTransient.BondAromatic));
					else
					{
						if (this.resBonds == null) this.resBonds = Vec.booleanArray(false, numBonds);
						this.resBonds[b - 1] = true;
					}
				}
			}

			let endpts:number[] = null;
			let attach:string = null;

			for (let i = 4; i < bits.length; i++)
			{
				let eq = bits[i].indexOf('=');
				if (eq < 0) continue;
				let key = bits[i].substring(0, eq), val = bits[i].substring(eq + 1);
				if (key == 'CFG')
				{
					let dir = parseInt(val);
					this.mol.setBondType(b, dir == 1 ? Molecule.BONDTYPE_INCLINED :
											dir == 2 ? Molecule.BONDTYPE_UNKNOWN :
											dir == 3 ? Molecule.BONDTYPE_DECLINED : Molecule.BONDTYPE_NORMAL);
				}
				else if (key == 'DISP')
				{
					if (val == 'COORD') this.mol.setBondOrder(b, 0);
				}
				else if (key == 'ENDPTS') endpts = this.unpackList(val);
				else if (key == 'ATTACH') attach = val;
			}

			if (attach != null && endpts != null)
			{
				if (attach == 'ALL') this.groupAttachAll.set(b, endpts);
				else if (attach == 'ANY') this.groupAttachAny.set(b, endpts);
			}
		}

		for (let atom of asdrawnRBC) QueryUtil.setQueryAtomRingBonds(this.mol, atom, [this.countRingBonds(atom)]);
		for (let atom of asdrawnSUB) QueryUtil.setQueryAtomAdjacency(this.mol, atom, [this.countSubstitutions(atom)]);

		this.postFix();

		// extract collection info
		for (let n = 0; n < lineColl.length; n++)
		{
			let line = lineColl[n];
			while (n < lineColl.length - 1 && line.endsWith('-'))
			{
				n++;
				line = line.substring(0, line.length - 1) + lineColl[n];
			}
			let bits = this.splitWithQuotes(line);
			if (bits[0].startsWith('MDLV30/STEABS'))
			{
				if (bits[1].startsWith('ATOMS=')) this.groupStereoAbsolute = this.unpackList(bits[1].substring(5));
			}
			else if (bits[0].startsWith('MDLV30/STERAC'))
			{
				if (bits[1].startsWith('ATOMS=')) this.groupStereoRacemic.push(this.unpackList(bits[1].substring(6)));
			}
			else if (bits[0].startsWith('MDLV30/STEREL'))
			{
				if (bits[1].startsWith('ATOMS=')) this.groupStereoRelative.push(this.unpackList(bits[1].substring(6)));
			}
		}

		let stereoGroup = new StereoGroup(this.mol);
		for (let atoms of this.groupStereoRacemic) stereoGroup.createRacemic(atoms);
		for (let atoms of this.groupStereoRelative) stereoGroup.createRelative(atoms);
		stereoGroup.rewriteMolecule();

		// extract S-groups
		let superatoms = new Map<number, MDLReaderSuperAtom>();
		for (let n = 0; n < lineSgroup.length; n++)
		{
			let line = lineSgroup[n];
			while (n < lineSgroup.length - 1 && line.endsWith('-'))
			{
				n++;
				line = line.substring(0, line.length - 1) + lineSgroup[n];
			}
			let bits = this.splitWithQuotes(line);

			let idx = parseInt(bits[0]);
			if (bits.length > 3 && idx > 0 && bits[1] == 'SUP')
			{
				let sup:MDLReaderSuperAtom = {atoms: [], name: null};
				for (let i = 3; i < bits.length; i++)
				{
					if (bits[i].startsWith('ATOMS=')) sup.atoms = this.unpackList(bits[i].substring(6));
					else if (bits[i].startsWith('LABEL=')) sup.name = this.withoutQuotes(bits[i].substring(6));
					else if (bits[i].startsWith('XBONDS=')) sup.bonds = this.unpackList(bits[i].substring(7));
					else if (bits[i].startsWith('CLASS=')) sup.templateClass = this.withoutQuotes(bits[i].substring(6));
					else if (bits[i].startsWith('NATREPLACE=')) sup.natReplace = this.withoutQuotes(bits[i].substring(11));
					else if (bits[i].startsWith('SAP=')) 
					{
						const pts = this.unpackStrings(bits[i].substring(4));
						sup.attachPoints = [...(sup.attachPoints ?? []), ...pts];
					}
				}
				superatoms.set(idx, sup);
			}
			else if (bits.length > 3 && idx > 0 && (bits[1] == 'MIX' || bits[1] == 'FOR') && parseInt(bits[2]) == idx)
			{
				let mix:MDLReaderGroupMixture = {index: idx, parent: 0, atoms: null, type: bits[1]};
				for (let i = 3; i < bits.length; i++)
				{
					if (bits[i].startsWith('ATOMS=')) mix.atoms = this.unpackList(bits[i].substring(6));
					else if (bits[i].startsWith('PARENT=')) mix.parent = parseInt(bits[i].substring(7));
				}
				this.groupMixtures.push(mix);
			}
			else if (bits.length > 3 && idx > 0 && (bits[1] == 'SRU' || bits[1] == 'COP' || bits[1] == 'MUL' || bits[1] == 'DAT'))
			{
				let sup:MDLReaderSuperAtom = {atoms: [], name: null, bracketType: bits[1]};
				for (let i = 3; i < bits.length; i++)
				{
					if (bits[i].startsWith('ATOMS=')) sup.atoms = this.unpackList(bits[i].substring(6));
					else if (bits[i].startsWith('BONDS=')) sup.bonds = this.unpackList(bits[i].substring(6));
					else if (bits[i].startsWith('LABEL=')) sup.name = this.withoutQuotes(bits[i].substring(6));
					else if (bits[i].startsWith('CONNECT=')) sup.connectType = bits[i].substring(8);
					else if (bits[i].startsWith('XBCORR=')) sup.bondConn = this.unpackList(bits[i].substring(7));
					else if (bits[i].startsWith('MULT=')) sup.name = this.withoutQuotes(bits[i].substring(5));
					else if (bits[i].startsWith('FIELDNAME=')) sup.name = this.withoutQuotes(bits[i].substring(10));
					else if (bits[i].startsWith('FIELDDATA=')) sup.value = this.withoutQuotes(bits[i].substring(10));
				}
				superatoms.set(idx, sup);
			}
		}

		// process polymer superblocks first
		for (let key of Vec.sorted(Array.from(superatoms.keys())))
		{
			let value = superatoms.get(key);
			if (value.bracketType)
			{
				superatoms.delete(key);
				this.applyPolymerBlock(value);
			}
		}

		// process non-polymer superblocks
		for (let key of Vec.sorted(Array.from(superatoms.keys())))
		{
			let value = superatoms.get(key);
			superatoms.delete(key);
			this.applySuperAtom(value, Array.from(superatoms.values()));
		}

		if (templateBlocks.length > 0)
		{
			this.scsrTemplates = templateBlocks.map((lines) => this.parseV3000Template(lines));
		}
	}

	// if it's a V3000-style atom list, mark it up
	private parseQueryAtomList(mol:Molecule, atom:number):void
	{
		let label = mol.atomElement(atom);
		let not = false;
		if (label.startsWith('NOT ')) {label = label.substring(4); not = true;}
		if (label.length < 2 || !label.startsWith('[') || !label.endsWith(']')) return;
		label = label.substring(1, label.length - 1);
		let elements = label.split(',');

		mol.setAtomElement(atom, '*');
		if (!not)
			QueryUtil.setQueryAtomElements(mol, atom, elements);
		else
			QueryUtil.setQueryAtomElementsNot(mol, atom, elements);
	}

	// applies a superatom block: turns the definition itself into an abbreviation if possible; also modifies any remaining superatoms so that their indexes
	// are still current
	private applySuperAtom(sup:MDLReaderSuperAtom, residual:MDLReaderSuperAtom[]):void
	{
		if (sup.name == null || Vec.isBlank(sup.atoms)) return;
		let mask = Vec.booleanArray(true, this.mol.numAtoms);
		for (let a of sup.atoms) mask[a - 1] = false;

		let name = sup.name;
		let i:number;
		while ((i = name.indexOf('\\S')) >= 0) name = name.substring(0, i) + '{^' + name.substring(i + 2);
		while ((i = name.indexOf('\\s')) >= 0) name = name.substring(0, i) + '{' + name.substring(i + 2);
		while ((i = name.indexOf('\\n')) >= 0) name = name.substring(0, i) + '}' + name.substring(i + 2);

		let [mod, abvAtom] = !sup.templateClass ? MolUtil.convertToAbbrevIndex(this.mol, mask, name) : [null, null];
		if (mod == null)
		{
			let keyval:Record<string, string> = {};
			if (sup.bonds) keyval['bonds'] = sup.bonds.join(' ');
			if (sup.templateClass) keyval['templateClass'] = sup.templateClass;
			if (sup.natReplace) keyval['natReplace'] = sup.natReplace;
			if (sup.attachPoints) keyval['attachPoints'] = sup.attachPoints.join(' ');

			ForeignMolecule.markSgroupMultiAttach(this.mol, name, sup.atoms, keyval);
			return;
		}
		this.mol = mod;

		// correct atom indices for ensuing superatom blocks
		let map = Vec.maskMap(mask);
		for (let res of residual)
		{
			let subsumed = false;
			for (let n = res.atoms.length - 1; n >= 0; n--)
			{
				let atom = map[res.atoms[n] - 1] + 1;
				if (atom == 0)
				{
					res.atoms = Vec.remove(res.atoms, n);
					subsumed = true;
				}
				else res.atoms[n] = atom;
			}
			if (subsumed) res.atoms = Vec.sorted(Vec.append(res.atoms, abvAtom));
		}
	}

	// deals with a superatom block that is marked as
	private applyPolymerBlock(sup:MDLReaderSuperAtom):void
	{
		if (sup.bracketType == 'MUL')
		{
			let mult = parseInt(sup.name);
			ForeignMolecule.markSgroupMultiRepeat(this.mol, mult, sup.atoms);
			return;
		}
		if (sup.bracketType == 'DAT')
		{
			if (sup.atoms != null) ForeignMolecule.markSgroupData(this.mol, sup.name, sup.value, sup.unit, sup.query, sup.atoms);
			return;
		}

		let poly = new PolymerBlock(this.mol);
		let connect:PolymerBlockConnectivity = null;
		if (sup.connectType == null) {}
		else if (sup.connectType == 'HT') connect = PolymerBlockConnectivity.HeadToTail;
		else if (sup.connectType == 'HH') connect = PolymerBlockConnectivity.HeadToHead;
		else if (sup.connectType == 'EU') connect = PolymerBlockConnectivity.Random;
		else return;

		let bondConn:number[] = null;
		if (Vec.len(sup.bondConn) == 3)
		{
			// the V2000 style of specifying 2x2 connectivity (by leaving one out...)
			let b1 = sup.bondConn[0], b2 = sup.bondConn[2], b3 = sup.bondConn[1], b4 = 0;
			for (let n = 1; n <= this.mol.numBonds; n++) if (n != b1 && n != b2 && n != b3)
			{
				let in1 = sup.atoms.indexOf(this.mol.bondFrom(n)) >= 0, in2 = sup.atoms.indexOf(this.mol.bondTo(n)) >= 0;
				if ((in1 && !in2) || (!in1 && in2))
				{
					if (b4 > 0) {b4 = 0; break;}
					b4 = n;
				}
			}
			bondConn = [b1, b2, b3, b4];
		}
		else if (Vec.len(sup.bondConn) == 4)
		{
			// the V3000 style of specifying 2x2 connectivity, which is the same as what we're using
			bondConn = sup.bondConn;
		}

		let unit = new PolymerBlockUnit(sup.atoms);
		unit.connect = connect;
		unit.bondConn = bondConn;
		poly.createUnit(unit);
	}

	// parse out the sub-molecule SCSR template from V3000
	private parseV3000Template(lines:string[]):ForeignMoleculeTemplateDefn
	{
		let header = lines[0];
		let bits = this.splitWithQuotes(header.substring('M  V30 TEMPLATE '.length));
		let name = bits[1], natReplace:string = null;
		for (let n = 2; n < bits.length; n++)
		{
			if (bits[n].startsWith('NATREPLACE=')) natReplace = bits[n].substring(11);
		}
		
		lines[0] = '  0  0  0  0  0  0  0  0  0  0  0 V3000';
		lines.push('M  END');

		let mdl = new MDLMOLReader(lines.join('\n'));
		mdl.parseHeader = false;
		mdl.parse();

		return {name, natReplace, mol: mdl.mol};
	}

	// removes surrounding quotes, if any
	private withoutQuotes(str:string):string
	{
		if (str.length >= 2 && str.startsWith('"') && str.endsWith('"')) return str.substring(1, str.length - 1);
		return str;
	}

	// takes a line of whitespace-separated stuff and breaks it into pieces
	private splitWithQuotes(line:string):string[]
	{
		let segments:string[] = [];

		let seg = '';
		let depth = 0, quote = false;
		for (let n = 0; n < line.length; n++)
		{
			let ch = line.charAt(n);
			if (ch == ' ' && depth == 0 && !quote)
			{
				if (seg.length > 0) segments.push(seg);
				seg = '';
			}
			else
			{
				seg += ch;
				if (ch == '"') quote = !quote;
				else if (ch == '(' || ch == '[') depth++;
				else if (ch == ')' || ch == ']') depth--;
			}
		}
		if (seg.length > 0) segments.push(seg);

		return segments;
	}

	// converts a string of the form "(sz v1 v2 ...)" into an array of just the values
	private unpackList(str:string):number[]
	{
		if (!str.startsWith('(') || !str.endsWith(')')) return null;

		str = str.substring(1, str.length - 1);
		let values:number[] = [];
		for (let bit of str.split(' ')) values.push(parseInt(bit));
		if (values[0] != values.length - 1) return null;
		return Vec.remove(values, 0);
	}
	private unpackStrings(str:string):string[]
	{
		if (!str.startsWith('(') || !str.endsWith(')')) return null;

		str = str.substring(1, str.length - 1);
		let values = str.split(' ');
		if (parseInt(values[0]) != values.length - 1) return null;
		return Vec.remove(values, 0);
	}

	// used when an incoming property is designated "as drawn"
	private countRingBonds(atom:number):number
	{
		let count = 0;
		for (let b of this.mol.atomAdjBonds(atom)) if (this.mol.bondInRing(b)) count++;
		return count;
	}
	private countSubstitutions(atom:number):number
	{
		let count = 0;
		for (let adj of this.mol.atomAdjList(atom)) if (this.mol.atomElement(adj) != 'H') count++;
		return count;
	}
}

export class MDLSDFReader
{
	public ds = new DataSheet();
	public upcastColumns = true; // if on, tries to decide on column types based on their data values; otherwise leaves as strings

	private pos = 0;
	private lines:string[];

	// ----------------- public methods -----------------

	constructor(strData:string)
	{
		this.lines = strData.split(/\r?\n/);
	}

	// perform the parsing operation, and populate the result fields
	public parse():DataSheet
	{
		this.parseStream();
		if (this.upcastColumns) this.upcastStringColumns();
		return this.ds;
	}

	// ----------------- private methods -----------------

	private parseStream():void
	{
		let ds = this.ds;
		ds.appendColumn('Molecule', DataSheetColumn.Molecule, 'Molecular structure');
		let colName = -1;
		let entry:string[] = [];

		// read the lines from the SD file, and every time a field is encountered, add it as type "string"
		while (this.pos < this.lines.length)
		{
			let line = this.lines[this.pos++];
			if (!line.startsWith('$$$$')) {entry.push(line); continue;}

			let rn = ds.appendRow();

			let molstr = '';
			let pos = 0;
			while (pos < entry.length)
			{
				line = entry[pos];
				if (line.startsWith('> ')) break;
				molstr += line + '\n';
				pos++;
				if (line.startsWith('M	END')) break;
			}

			let mol:Molecule = null, name:string = null;
			try
			{
				if (molstr.length > 0)
				{
					let mdl = new MDLMOLReader(molstr);
					mdl.parse();
					mol = mdl.mol;
					name = mdl.molName;
				}
			}
			catch (ex)
			{
				/*let msg = "Failed to parse CTAB, row#" + (rn + 1) + ":\n" + molstr;
				if (fatalMolFailures) throw new IOException(msg,ex);
				else if (reportMolFailures) Util.errmsg(msg, ex);*/
				// (leave the molecule null
			}
			if (mol != null) ds.setMolecule(rn, 0, mol);
			if (name)
			{
				if (colName < 0) colName = ds.appendColumn('Name', DataSheetColumn.String, 'Molecule name');
				ds.setString(rn, colName, name);
			}

			if (rn == 0 && mol != null)
			{
				let str1 = entry[0], str3 = entry[2];
				if (str1.length >= 7 && str1.startsWith('$name='))
				{
					ds.changeColumnName(0, str1.substring(6), ds.colDescr(0));
				}
				if (str3.length >= 8 && str3.startsWith('$title='))
				{
					ds.title = str3.substring(7);
				}
			}

			for (; pos + 1 < entry.length; pos += 3)
			{
				let key = entry[pos], val = entry[pos + 1];
				if (!key.startsWith('>')) continue;
				let z = key.indexOf('<');
				if (z < 0) continue;
				key = key.substring(z + 1);
				z = key.indexOf('>');
				if (z < 0) continue;
				key = key.substring(0, z);
				if (key.length == 0) continue;

				while (pos + 2 < entry.length && entry[pos + 2].length > 0)
				{
					val += '\n' + entry[pos + 2];
					pos++;
				}

				let cn = ds.findColByName(key);
				if (cn < 0) cn = ds.appendColumn(key, DataSheetColumn.String, '');

				if (val.length == 0) ds.setToNull(rn, cn);
				else ds.setString(rn, cn, val);
			}

			entry = [];
		}

		if (ds.numRows == 0) this.ds = null;
	}

	private upcastStringColumns():void
	{
		let ds = this.ds;
		for (let i = 0; i < ds.numCols; i++) if (ds.colType(i) == DataSheetColumn.String)
		{
			let allnull = true, allreal = true, allint = true, allbool = true;
			for (let j = 0; j < ds.numRows; j++)
			{
				if (!allreal && !allint && !allbool) break;
				if (ds.isNull(j, i)) continue;

				allnull = false;

				let val = ds.getString(j, i);
				if (allbool)
				{
					let lc = val.toLowerCase();
					if (lc != 'true' && lc != 'false') allbool = false;
				}
				if (allint)
				{
					let int = parseInt(val);
					if (!isFinite(int) || int != parseFloat(val)) allint = false;
				}
				if (allreal)
				{
					if (!isFinite(parseFloat(val))) allreal = false;
				}
			}

			if (allnull) {} // do nothing
			else if (allint) ds.changeColumnType(i, DataSheetColumn.Integer);
			else if (allreal) ds.changeColumnType(i, DataSheetColumn.Real);
			else if (allbool) ds.changeColumnType(i, DataSheetColumn.Boolean);
		}
	}
}

