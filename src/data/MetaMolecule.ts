/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	A "meta-molecule" is a container for a molecule which stores derived information about it. This is a compensation for the
	fact that the molecular datastructure is extremely minimalistic, and includes only very low level chemical interpretation.
	The low level molecule object is intended to represent a work in progress, something that is likely being sketched or chopped up
	and reassembled by algorithms. The meta-molecule wrapper is based on the assumption that the molecule is "done", and is
	ready to be compared to other fully described molecules.

	Each of the fields contained within may or may not be defined, and should be calculated as necessary, which means that
	this class basically operates as a cache.

	Typical use case:

		MetaMolecule meta=new MetaMolecule(mol);
		calculateStrictAromaticity();
		calculateStereoRubric();

	Note that the calculations are not necessarily independent, so order of calling can be important.

	Can also be used as a convenient storage place for the "skeleton hash", which is useful for screening isomorphisms.
*/

export class MetaMolecule
{
	public static skeletonHash:(mol:Molecule) => string = null;
	public static isomorphMatch:(meta1:MetaMolecule, meta2:MetaMolecule, timeout:number) => boolean = null;

	public atomArom:boolean[] = null;
	public bondArom:boolean[] = null;
	public rubricTetra:number[][] = null;
	public rubricSquare:number[][] = null;
	public rubricBipy:number[][] = null;
	public rubricOcta:number[][] = null;
	public rubricSides:number[][] = null;
	public hash:string = null;
	public heavyHash:string = null;
	public uniqueElements:string[] = null;
	public dots:DotPath = null;

	private piAtom:boolean[] = null; // true for all atoms that have at least one double bond attached

	// --------------------- public methods ---------------------

	constructor(public mol:Molecule)
	{
	}

	// strict aromaticity: considers only rings with pure alternating single/double bonds, i.e. benzene-style; fused ring
	// systems like naphthalene are handled iteratively; many types of aromaticity are excluded, e.g. thiophene (lone pair),
	// imidazolium (ions) and larger rings (e.g. porphyrins); this calculation is reasonably fast
	public calculateStrictAromaticity():void
	{
		let mol = this.mol;
		this.atomArom = Vec.booleanArray(false, mol.numAtoms);
		this.bondArom = Vec.booleanArray(false, mol.numBonds);

		let rings = mol.findRingsOfSize(6);
		const nr = rings.length;
		if (nr == 0) return;

		// assign the potentially-aromatic rings
		this.ensurePiAtoms();
		let mask = Vec.booleanArray(false, nr); // false=not decided; true=already processed
		for (let n = 0; n < nr; n++)
		{
			for (let i = 0; i < rings[n].length; i++)
			{
				let a = rings[n][i];
				if (!this.piAtom[a - 1])
				{
					mask[n] = true;
					break;
				}
				let b = mol.findBond(a, rings[n][i == rings[n].length - 1 ? 0 : i + 1]);
				let bo = mol.bondOrder(b);
				if (bo != 1 && bo != 2)
				{
					mask[n] = true;
					break;
				}
			}
		}

		// keep classifying rings as aromatic until no change; this needs to be done iteratively, for the benefit of highly
		// embedded ring systems, that can't be classified as aromatic until it is known that their neighbours obviously are
		while (true)
		{
			let anyChange = false;

			for (let n = 0; n < nr; n++) if (!mask[n])
			{
				let phase1 = true, phase2 = true; // has to go 121212 or 212121; already arom=either is OK
				for (let i = 0; i < rings[n].length; i++)
				{
					let b = mol.findBond(rings[n][i], rings[n][i == rings[n].length - 1 ? 0 : i + 1]);
					if (this.bondArom[b - 1]) continue; // valid for either phase
					let bo = mol.bondOrder(b);
					phase1 = phase1 && bo == (2 - (i & 1));
					phase2 = phase2 && bo == (1 + (i & 1));
				}
				if (!phase1 && !phase2) continue;

				for (let i = 0; i < rings[n].length; i++)
				{
					let b = mol.findBond(rings[n][i], rings[n][i == rings[n].length - 1 ? 0 : i + 1]);
					this.bondArom[b - 1] = true;
				}

				mask[n] = true;
				anyChange = true;
			}

			if (!anyChange) break;
		}

		// update the atom aromaticity flags
		for (let n = 0; n < this.bondArom.length; n++) if (this.bondArom[n])
		{
			this.atomArom[mol.bondFrom(n + 1) - 1] = true;
			this.atomArom[mol.bondTo(n + 1) - 1] = true;
		}
	}

	// relaxed aromaticity: based on strict aromaticity, but extends to other small ring sizes; it is also reasonably
	// fast - there are no opportunities for exponential graph-walk blowups
	public calculateRelaxedAromaticity():void
	{
		let mol = this.mol;
		this.atomArom = Vec.booleanArray(false, mol.numAtoms);
		this.bondArom = Vec.booleanArray(false, mol.numBonds);

		this.ensurePiAtoms();
		const na = mol.numAtoms, nb = mol.numBonds;
		let electrons = Vec.numberArray(0, na); // # lone pair electrons available for donating into the ring; >=2 qualifies
		let exocyclic = Vec.booleanArray(false, na); // true=has a double bond that sticks out of the ring block
		for (let n = 1; n <= na; n++)
		{
			let atno = mol.atomicNumber(n);
			electrons[n - 1] = (Chemistry.ELEMENT_BLOCKS[atno] == 2 ? Chemistry.ELEMENT_VALENCE[atno] : 0) - mol.atomCharge(n) - mol.atomHydrogens(n)
							- mol.atomUnpaired(n);
		}
		for (let n = 1; n <= nb; n++)
		{
			const bfr = mol.bondFrom(n), bto = mol.bondTo(n), bo = mol.bondOrder(n);
			electrons[bfr - 1] -= bo;
			electrons[bto - 1] -= bo;
			if (bo == 2)
			{
				const rblk1 = mol.atomRingBlock(bfr), rblk2 = mol.atomRingBlock(bto);
				if (rblk1 > 0 && rblk1 != rblk2) exocyclic[bfr - 1] = true;
				if (rblk2 > 0 && rblk2 != rblk1) exocyclic[bto - 1] = true;
			}
		}

		// compile candidate rings: all atoms must have some potentially qualifying pi-action doing on

		let rings:number[][] = [];
		for (let rsz = 3; rsz <= 7; rsz++) for (let rng of mol.findRingsOfSize(rsz))
		{
			let valid = true;
			for (let n = 0; n < rsz; n++)
			{
				const a = rng[n];
				if (!this.piAtom[a - 1] && electrons[a - 1] < 2 && !exocyclic[a - 1])
				{
					valid = false;
					break;
				}
				let b = mol.findBond(a, rng[n < rsz - 1 ? n + 1 : 0]);
				let bo = mol.bondOrder(b);
				if (bo != 1 && bo != 2)
				{
					valid = false;
					break;
				}
			}
			if (valid) rings.push(rng);
		}

		// keep processing rings, until no new ones are found

		while (rings.length > 0)
		{
			let anyChange = false;

			for (let n = 0; n < rings.length; n++)
			{
				let r = rings[n];

				let paths = [0];
				for (let i = 0; i < r.length; i++)
				{
					const a = r[i];
					const b1 = mol.findBond(a, r[i < r.length - 1 ? i + 1 : 0]);
					const b2 = mol.findBond(a, r[i > 0 ? i - 1 : r.length - 1]);
					if (this.bondArom[b1 - 1])
					{
						// contemplate with or without extra pi-bond
						for (let j = paths.length - 1; j >= 0; j--)
						{
							const e = paths[j] + 2;
							if (paths.indexOf(e) < 0) paths = Vec.append(paths, e);
						}
					}
					else if (mol.bondOrder(b1) == 2) Vec.addTo(paths, 2);
					else if (electrons[a - 1] >= 2 && mol.bondOrder(b1) == 1 && mol.bondOrder(b2) == 1) Vec.addTo(paths, 2);
				}

				// see if there's anything Hueckel (4N+2) buried in there
				let arom = false;
				for (let e of paths)
				{
					if (e == 2 && r.length == 3)
					{
						arom = true;
						break;
					} // N==0 case only for 3 membered rings, e.g. cyclopropylium
					if (e == 6)
					{
						arom = true;
						break;
					}
					// (anything bigger does not apply, because only using small rings)
				}
				if (arom)
				{
					for (let i = 0; i < r.length; i++)
					{
						let a = r[i], b = mol.findBond(a, r[i < r.length - 1 ? i + 1 : 0]);
						this.atomArom[a - 1] = true;
						this.bondArom[b - 1] = true;
					}
					rings.splice(n, 1);
					n--;
					anyChange = true;
				}
			}

			if (!anyChange) break;
		}
	}

	/*
	// extended Hueckel aromaticity: any ring pathway which meets the 4n+2 PI electron rule, counting double bonds and
	// lone pairs, is classified as aromatic
	public void calculateExtendedAromaticity() throws MoleculeCalcException
	{
		// !!
		throw new MoleculeCalcException("Hueckel aromaticity: not implemented yet");
	}*/

	// goes through the atoms and bonds, and determines "geometry rubric" sequences for those that are considered to
	// be potentially stereo-active; chemical judgment calls are made within this method
	// NOTE: it is a good idea to calculate aromaticity first, since it can affect atom classification
	public calculateStereoRubric():void
	{
		const mol = this.mol, na = mol.numAtoms, nb = mol.numBonds;
		this.rubricTetra = new Array(na);
		this.rubricSquare = new Array(na);
		this.rubricBipy = new Array(na);
		this.rubricOcta = new Array(na);
		this.rubricSides = new Array(nb);

		for (let n = 1; n <= na; n++)
		{
			let blk = Chemistry.ELEMENT_BLOCKS[mol.atomicNumber(n)];
			let adjc = mol.atomAdjCount(n), hc = mol.atomHydrogens(n);
			let ninc = 0, ndec = 0;
			for (let b of mol.atomAdjBonds(n))
			{
				if (mol.bondType(b) == Molecule.BONDTYPE_INCLINED && mol.bondFrom(b) == n) ninc++;
				else if (mol.bondType(b) == Molecule.BONDTYPE_DECLINED && mol.bondFrom(b) == n) ndec++;
			}

			// p-block atoms with 4 neighbours (1 of which can be implicit H) are allowed tetrahedral chirality
			// (or more stringent requirements for d- & f-block)
			if (blk == 2 && ((adjc == 3 && hc == 1) || (adjc == 4 && hc == 0)))
			{
				this.rubricTetra[n - 1] = Stereochemistry.rubricTetrahedral(mol, n);
			}
			else if (blk >= 3 && adjc == 4 && ninc == 1 && ndec == 1)
			{
				this.rubricTetra[n - 1] = Stereochemistry.rubricTetrahedral(mol, n);
			}

			// d- & f-block atoms with 4 neighbours can have square planar constraints
			if (blk >= 3 && adjc == 4 && hc == 0)
			{
				this.rubricSquare[n - 1] = Stereochemistry.rubricSquarePlanar(mol, n);
			}

			// d- and f-block atoms with 4 or 5 neighbours can have trigonal bipyramidal constraints
			if (blk >= 3 && (adjc == 4 || adjc == 5) && hc == 0)
			{
				this.rubricBipy[n - 1] = Stereochemistry.rubricBipyrimidal(mol, n);
			}

			// d- & f-block atoms with 5 or 6 neighbours can have octahedral constraints
			// (as can p-block atoms with 6 neighbours)
			if (blk >= 3 && (adjc == 5 || adjc == 6) && hc == 0)
			{
				this.rubricOcta[n - 1] = Stereochemistry.rubricOctahedral(mol, n);
			}
			else if (blk == 2 && adjc == 6 && hc == 0)
			{
				this.rubricOcta[n - 1] = Stereochemistry.rubricOctahedral(mol, n);
			}
		}

		// certain double bonds are considered to have restricted rotation constraints
		for (let n = 1; n <= mol.numBonds; n++)
		{
			if (mol.bondOrder(n) != 2 || mol.bondType(n) == Molecule.BONDTYPE_UNKNOWN || this.isBondAromatic(n)) continue;

			let bfr = mol.bondFrom(n), bto = mol.bondTo(n);
			let blk1 = Chemistry.ELEMENT_BLOCKS[mol.atomicNumber(bfr)];
			let blk2 = Chemistry.ELEMENT_BLOCKS[mol.atomicNumber(bto)];
			let adjc1 = mol.atomAdjCount(bfr), hc1 = mol.atomHydrogens(bfr);
			let adjc2 = mol.atomAdjCount(bto), hc2 = mol.atomHydrogens(bto);

			// if both sides of the bond are p-block atoms, and have 2 substituents, can be side-constrained
			// (note: things like C=N-, with potentially constrained lone pairs, are not considered)
			if (blk1 == 2 && blk2 == 2 && (adjc1 + hc1 == 3 && hc1 <= 1) && (adjc2 + hc2 == 3 && hc2 <= 1))
			{
				this.rubricSides[n - 1] = Stereochemistry.rubricBondSides(mol, n);
			}
		}
	}

	// removes all hydrogens from the molecule, cloning it anything changes; if this is called after the aromaticity/stereochemistry is calculated, these will be
	// remapped as necessary
	public removeHydrogens():void
	{
		let mol = this.mol, na = mol.numAtoms, nb = mol.numBonds;
		let atomMask = Vec.booleanArray(true, na), bondMask = Vec.booleanArray(true, nb);
		for (let n = 1; n <= na; n++) if (MolUtil.boringHydrogen(mol, n))
		{
			atomMask[n - 1] = false;
			bondMask[mol.atomAdjBonds(n)[0] - 1] = false;
		}
		if (Vec.allTrue(atomMask)) return;

		mol = MolUtil.subgraphMask(mol, atomMask);

		if (this.atomArom) this.atomArom = Vec.maskGet(this.atomArom, atomMask);
		if (this.bondArom) this.bondArom = Vec.maskGet(this.bondArom, bondMask);

		if (this.rubricTetra || this.rubricSquare || this.rubricOcta || this.rubricSides)
		{
			if (this.rubricTetra) this.rubricTetra = Vec.maskGet(this.rubricTetra, atomMask);
			if (this.rubricSquare) this.rubricSquare = Vec.maskGet(this.rubricSquare, atomMask);
			if (this.rubricOcta) this.rubricOcta = Vec.maskGet(this.rubricOcta, atomMask);
			if (this.rubricSides) this.rubricSides = Vec.maskGet(this.rubricSides, bondMask);

			let atomMap = Vec.prepend(Vec.add(Vec.maskMap(atomMask), 1), 0);
			for (let n = 0; n < Vec.len(this.rubricTetra); n++) if (this.rubricTetra[n]) this.rubricTetra[n] = Vec.idxGet(atomMap, this.rubricTetra[n]);
			for (let n = 0; n < Vec.len(this.rubricSquare); n++) if (this.rubricSquare[n]) this.rubricSquare[n] = Vec.idxGet(atomMap, this.rubricSquare[n]);
			for (let n = 0; n < Vec.len(this.rubricOcta); n++) if (this.rubricOcta[n]) this.rubricOcta[n] = Vec.idxGet(atomMap, this.rubricOcta[n]);
			for (let n = 0; n < Vec.len(this.rubricSides); n++) if (this.rubricSides[n]) this.rubricSides[n] = Vec.idxGet(atomMap, this.rubricSides[n]);
		}

		// (... recreate anything else that's affected)
	}

	// defines the "skeleton hash" field, for prescreening
	public calculateSkeletonHash():void
	{
		if (MetaMolecule.skeletonHash == null) throw 'Skeleton hash not available.';
		this.hash = MetaMolecule.skeletonHash(this.mol);
	}

	// define the "heavy hash": like for skeleton, but with explicit hydrogens removed
	public calculateHeavyHash():void
	{
		let anyH = false;
		for (let n = 1; n <= this.mol.numAtoms; n++) if (this.mol.atomElement(n) == 'H') {anyH = true; break;}
		if (!anyH)
		{
			this.heavyHash = this.getSkeletonHash();
			return;
		}

		let hvy = this.mol.clone();
		for (let n = hvy.numAtoms; n >= 1; n--) if (hvy.atomElement(n) == 'H') hvy.deleteAtomAndBonds(n);
		this.heavyHash = MetaMolecule.skeletonHash(hvy);
	}

	// access to aromaticity: either by 1-based single index, or grabbing the whole array
	public isAtomAromatic(atom:number):boolean
	{
		return this.atomArom == null ? false : this.atomArom[atom - 1];
	}
	public isBondAromatic(bond:number):boolean
	{
		return this.bondArom == null ? false : this.bondArom[bond - 1];
	}

	// modified version of bond order: returns -1 to encode for aromaticity; if not aromatic, or aromaticity wasn't calculated,
	// this is the same as the regular bond order
	public bondOrderArom(bond:number):number
	{
		return this.bondArom != null && this.bondArom[bond - 1] ? -1 : this.mol.bondOrder(bond);
	}

	public getAtomAromaticity():boolean[]
	{
		return this.atomArom == null ? null : this.atomArom.slice(0);
	}
	public getBondAromaticity():boolean[]
	{
		return this.bondArom == null ? null : this.bondArom.slice(0);
	}

	// cached access to hash-type properties: first invocation slow, after that fast
	public getSkeletonHash():string
	{
		if (this.hash == null) this.calculateSkeletonHash();
		return this.hash;
	}
	public getHeavyHash():string
	{
		if (this.heavyHash == null) this.calculateHeavyHash();
		return this.heavyHash;
	}
	public getDotPath():DotPath
	{
		if (this.dots == null) this.dots = new DotPath(this.mol);
		return this.dots;
	}

	public getUniqueElements():string[]
	{
		if (this.uniqueElements == null)
		{
			this.uniqueElements = [];
			for (let n = 1; n <= this.mol.numAtoms; n++)
			{
				let el = this.mol.atomElement(n);
				if (this.uniqueElements.indexOf(el) < 0) this.uniqueElements.push(el);
			}
		}
		return this.uniqueElements;
	}

	// equivalence: assumes that both metavectors have been marked up according to the same additional into, i.e.
	// aromaticity, stereo, etc.; it will try to resolve the equivalence and get to the answer as quickly as possible,
	// with the isomorphism test being the final option
	public equivalentTo(other:MetaMolecule, timeout = 1000):boolean
	{
		if (MetaMolecule.isomorphMatch == null) throw 'Isomorph search unavailable.';

		// phase 1: different atom/bond counts, don't waste any time
		if (this.mol.numAtoms != other.mol.numAtoms || this.mol.numBonds != other.mol.numBonds) return false;

		// phase 2: make sure both hashes are generated, and use to screen
		if (this.hash == null) this.calculateSkeletonHash();
		if (other.hash == null) other.calculateSkeletonHash();
		if (this.hash != other.hash) return false;

		// phase 3: if molecules are literally equal, no need to get fancy
		if (this.mol.compareTo(other.mol) == 0) return true;

		// phase 4: check if any elements are unique on either side
		let uniq1 = this.getUniqueElements(), uniq2 = other.getUniqueElements();
		for (let n = 0; n < uniq1.length; n++)
		{
			if (!uniq2.includes(uniq1[n])) return false;
		}
	
		// phase 5: the most laborious part, finding any isomorphism
		return MetaMolecule.isomorphMatch(this, other, timeout);
	}

	// convenience constructor alternatives
	public static createRubric(mol:Molecule):MetaMolecule
	{
		if (mol == null) return null;
		let meta = new MetaMolecule(mol);
		meta.calculateStereoRubric();
		return meta;
	}

	public static createStrict(mol:Molecule):MetaMolecule
	{
		if (mol == null) return null;
		let meta = new MetaMolecule(mol);
		meta.calculateStrictAromaticity();
		return meta;
	}

	public static createStrictRubric(mol:Molecule):MetaMolecule
	{
		if (mol == null) return null;
		let meta = new MetaMolecule(mol);
		meta.calculateStrictAromaticity();
		meta.calculateStereoRubric();
		return meta;
	}

	public static createRelaxed(mol:Molecule):MetaMolecule
	{
		if (mol == null) return null;
		let meta = new MetaMolecule(mol);
		meta.calculateRelaxedAromaticity();
		return meta;
	}

	public static createRelaxedRubric(mol:Molecule):MetaMolecule
	{
		if (mol == null) return null;
		let meta = new MetaMolecule(mol);
		meta.calculateRelaxedAromaticity();
		meta.calculateStereoRubric();
		return meta;
	}

	// ------------------ private methods --------------------

	// define pi-atoms, if not already
	private ensurePiAtoms():void
	{
		if (this.piAtom != null) return;
		this.piAtom = Vec.booleanArray(false, this.mol.numAtoms);
		for (let n = 1; n <= this.mol.numBonds; n++) if (this.mol.bondOrder(n) == 2)
		{
			{
				this.piAtom[this.mol.bondFrom(n) - 1] = true;
				this.piAtom[this.mol.bondTo(n) - 1] = true;
			}
		}
	}
}

/* EOF */ }