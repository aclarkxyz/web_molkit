/*
    WebMolKit

    (c) 2010-2019 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {Vec} from '../util/Vec';
import {Molecule} from './Molecule';

/*
	Handles some of the custom extensions that are brought in for molecules when imported from other
	sources, such as MDL Molfiles, which support a number of features that are not part of the core
	representation of a molecule.

	These additional properties are included in the transient extension collection for atoms and
	bonds, i.e. they get cleared out as soon as the structure is modified in any way, because their
	effects are not localised to a single atom/bond.

	A molecule that contains foreign annotations is expected to either import them to a more well
	specified definition, or to have a brief lifetime and only need to survive a round trip, rather than
	being used or modified.
*/

export enum ForeignMoleculeTransient
{
	// generic flags for remarking that an atom/bond is aromatic; commonly used by SMILES, for MDL Molfile queries (and illegal structures)
	// and a number of other formats which use this concept
	AtomAromatic = 'yAROMATIC',
	BondAromatic = 'yAROMATIC',

	// specialisations of zero-order bonds: the MDL world supports "dative" and "hydrogen" which are both 0-order but have particular meaning
	BondZeroDative = 'yZERO_DATIVE',
	BondZeroHydrogen = 'yZERO_HYDROGEN',

	// the atom-centred chirality settings, used explicitly by MDL Molfiles to denote chirality, or mixtures
	AtomChiralMDLOdd = 'yCHIRAL_MDL_ODD',
	AtomChiralMDLEven= 'yCHIRAL_MDL_EVEN',
	AtomChiralMDLRacemic = 'yCHIRAL_MDL_RACEMIC',

	// annotations that carry over from supplementary MDL parsing
	AtomExplicitValence = 'yMDL_EXPLICIT_VALENCE',
	AtomSgroupMultiAttach = 'yMDL_SGROUP_MULTIATTACH',
	AtomSgroupMultiRepeat = 'yMDL_SGROUP_MULTIREPEAT',
	AtomSgroupData = 'yMDL_SGROUP_DATA',

	// references to SCSR templates
	AtomSCSRClass = 'yMDL_SCSR_CLASS',
	AtomSCSRSeqID = 'yMDL_SCSR_SEQID',
	AtomSCSRAttchOrd = 'yMDL_SCSR_ATTCHORD',
}

export interface ForeignMoleculeSgroupMultiAttach
{
	name:string;
	atoms:number[];
	keyval:Record<string, string>;
}

export interface ForeignMoleculeSgroupMultiRepeat
{
	mult:number;
	unit:number;
	atoms:number[];
}

export interface ForeignMoleculeSgroupData
{
	name:string;
	value:string;
	unit:string;
	query:string;
	atoms:number[];
}

export interface ForeignMoleculeTemplateDefn
{
	name:string;
	natReplace:string;
	mol:Molecule;
}

export class ForeignMolecule
{
	// ----------------- public methods -----------------

	// returns a mask for any atoms that have been explicitly marked as aromatic; note that this does not look at the
	// marking of aromatic bonds, which is separate
	public static noteAromaticAtoms(mol:Molecule):boolean[]
	{
		const sz = mol.numAtoms;
		let mask = Vec.booleanArray(false, sz);
		for (let n = 1; n <= sz; n++) mask[n - 1] = mol.atomTransient(n).indexOf(ForeignMoleculeTransient.AtomAromatic) >= 0;
		return mask;
	}

	// returns a mask for any bonds that have been explicitly marked as aromatic
	public static noteAromaticBonds(mol:Molecule):boolean[]
	{
		const sz = mol.numBonds;
		let mask = Vec.booleanArray(false, sz);
		for (let n = 1; n <= sz; n++) mask[n - 1] = mol.bondTransient(n).indexOf(ForeignMoleculeTransient.BondAromatic) >= 0;
		return mask;
	}

	// returns a mask for zero-order bonds that are marked as dative/hydrogen respectively
	public static noteZeroDativeBonds(mol:Molecule):boolean[]
	{
		const sz = mol.numBonds;
		let mask = Vec.booleanArray(false, sz);
		for (let n = 1; n <= sz; n++) mask[n - 1] = mol.bondTransient(n).includes(ForeignMoleculeTransient.BondZeroDative);
		return mask;
	}
	public static noteZeroHydrogenBonds(mol:Molecule):boolean[]
	{
		const sz = mol.numBonds;
		let mask = Vec.booleanArray(false, sz);
		for (let n = 1; n <= sz; n++) mask[n - 1] = mol.bondTransient(n).includes(ForeignMoleculeTransient.BondZeroHydrogen);
		return mask;
	}

	// TODO: convert MDL chirality to/from rubric

	// explicit valence: 0=no information; -1=zero; >0=explicit
	public static markExplicitValence(mol:Molecule, atom:number, valence:number):void
	{
		let trans = mol.atomTransient(atom).filter((tr) => !tr.startsWith(ForeignMoleculeTransient.AtomExplicitValence + ':'));
		trans.push(`${ForeignMoleculeTransient.AtomExplicitValence}:${valence}`);
		mol.setAtomTransient(atom, trans);
	}
	public static noteExplicitValence(mol:Molecule, atom:number):number
	{
		let trans = mol.atomTransient(atom);
		for (let tr of trans) if (tr.startsWith(ForeignMoleculeTransient.AtomExplicitValence + ':')) return parseInt(tr.substring(ForeignMoleculeTransient.AtomExplicitValence.length + 1));
		return null;
	}

	// S-groups with either no attachments or multiple attachments; only single-attachment S-groups are handled naturally
	public static markSgroupMultiAttach(mol:Molecule, name:string, atoms:number[], keyval:Record<string, string> = {}):void
	{
		let idxHigh = 0;
		for (let n = 1; n <= mol.numAtoms; n++) for (let tag of mol.atomTransient(n)) if (tag.startsWith(ForeignMoleculeTransient.AtomSgroupMultiAttach + ':'))
		{
			let payload = tag.substring(ForeignMoleculeTransient.AtomSgroupMultiAttach.length + 1);
			let comma = payload.indexOf(',');
			let bits = payload.split(',');
			let idx = parseInt(bits[0]);
			if (!(idx > 0)) continue;
			idxHigh = Math.max(idxHigh, idx);
		}

		let tag = `${ForeignMoleculeTransient.AtomSgroupMultiAttach}:${idxHigh + 1},${name ?? ''}`;
		for (let [key, val] of Object.entries(keyval)) tag += ',' + key + '=' + val;
		for (let a of atoms) mol.setAtomTransient(a, Vec.append(mol.atomTransient(a), tag));
	}
	public static hasAnySgroupMultiAttach(mol:Molecule):boolean
	{
		for (let n = 1; n <= mol.numAtoms; n++)
			if (mol.atomTransient(n).some((tag) => tag.startsWith(ForeignMoleculeTransient.AtomSgroupMultiAttach + ':'))) return true;
		return false;
	}
	public static noteAllSgroupMultiAttach(mol:Molecule):ForeignMoleculeSgroupMultiAttach[]
	{
		let map:Record<number, ForeignMoleculeSgroupMultiAttach> = {};

		for (let n = 1; n <= mol.numAtoms; n++) for (let tag of mol.atomTransient(n)) if (tag.startsWith(ForeignMoleculeTransient.AtomSgroupMultiAttach + ':'))
		{
			let payload = tag.substring(ForeignMoleculeTransient.AtomSgroupMultiAttach.length + 1);
			let bits = payload.split(',');
			if (bits.length < 2) continue;
			let idx = parseInt(bits[0]), name = bits[1];
			if (!(idx > 0)) continue;

			let keyval:Record<string, string> = {};
			for (let i = 2; i < bits.length; i++)
			{
				let eq = bits[i].indexOf('=');
				if (eq < 0) continue;
				keyval[bits[i].substring(0, eq)] = bits[i].substring(eq + 1);
			}

			let sgm = map[idx];
			if (sgm) sgm.atoms.push(n); else map[idx] = {name, atoms: [n], keyval};
		}

		return Object.values(map);
	}

	// S-groups that mark repeating units, where the "parent" set is rendered with a bracket+suffix "[]n"; the molecule is fully expanded out, so that the
	// graph connectivity is that of the real molecule, with the non-parent atoms being hidden & finagled for rendering purposes
	public static markSgroupMultiRepeat(mol:Molecule, mult:number, atoms:number[]):void
	{
		let idxHigh = 0;
		for (let n = 1; n <= mol.numAtoms; n++) for (let tag of mol.atomTransient(n)) if (tag.startsWith(ForeignMoleculeTransient.AtomSgroupMultiRepeat + ':'))
		{
			let payload = tag.substring(ForeignMoleculeTransient.AtomSgroupMultiRepeat.length + 1);
			let comma = payload.indexOf(',');
			if (comma <= 0) continue;
			let idx = parseInt(payload.substring(0, comma));
			if (idx <= 0) continue;
			idxHigh = Math.max(idxHigh, idx);
		}

		let unit = atoms.length / mult;
		let tag = `${ForeignMoleculeTransient.AtomSgroupMultiRepeat}:${idxHigh + 1},${mult},${unit},`;
		for (let n = 0; n < atoms.length; n++) mol.setAtomTransient(atoms[n], Vec.append(mol.atomTransient(atoms[n]), tag + (n + 1)));
	}
	public static hasAnySgroupMultiRepeat(mol:Molecule):boolean
	{
		for (let n = 1; n <= mol.numAtoms; n++)
			if (mol.atomTransient(n).some((tag) => tag.startsWith(ForeignMoleculeTransient.AtomSgroupMultiRepeat + ':'))) return true;
		return false;
	}
	public static noteAllSgroupMultiRepeat(mol:Molecule):ForeignMoleculeSgroupMultiRepeat[]
	{
		let map:Record<number, ForeignMoleculeSgroupMultiRepeat> = {};

		for (let n = 1; n <= mol.numAtoms; n++) for (let tag of mol.atomTransient(n)) if (tag.startsWith(ForeignMoleculeTransient.AtomSgroupMultiRepeat + ':'))
		{
			let payload = tag.substring(ForeignMoleculeTransient.AtomSgroupMultiRepeat.length + 1);
			let bits = payload.split(',');
			if (bits.length < 4) continue;
			let idx = parseInt(bits[0]), mult = parseInt(bits[1]), unit = parseInt(bits[2]), pos = parseInt(bits[3]);
			if (!(idx > 0) || mult < 2 || unit < 1 || pos < 1 || pos > mult * unit) continue;

			let mr = map[idx];
			if (mr == null) map[idx] = mr = {mult, unit, atoms: Vec.numberArray(0, mult * unit)};
			else if (mr.mult != mult || mr.unit != unit) continue;

			mr.atoms[pos - 1] = n;
		}

		return Object.values(map);
	}

	// data S-groups can attach arbitrary data concepts to a group of atoms
	public static markSgroupData(mol:Molecule, name:string, value:string, unit:string, query:string, atoms:number[]):void
	{
		let idxHigh = 0;
		for (let n = 1; n <= mol.numAtoms; n++) for (let tag of mol.atomTransient(n)) if (tag.startsWith(ForeignMoleculeTransient.AtomSgroupData + ':'))
		{
			let payload = tag.substring(ForeignMoleculeTransient.AtomSgroupData.length + 1);
			let comma = payload.indexOf(',');
			if (comma <= 0) continue;
			let idx = parseInt(payload.substring(0, comma));
			if (idx <= 0) continue;
			idxHigh = Math.max(idxHigh, idx);
		}

		let bits = [(idxHigh + 1).toString(), name, value, unit, query];
		for (let n = 1; n < bits.length; n++) bits[n] = (bits[n] ?? '').replace(/\,/g, '@@');
		let tag = ForeignMoleculeTransient.AtomSgroupData + ':' + bits.join(',');
		for (let n = 0; n < atoms.length; n++) mol.setAtomTransient(atoms[n], Vec.append(mol.atomTransient(atoms[n]), tag));
	}
	public static hasAnySgroupData(mol:Molecule):boolean
	{
		for (let n = 1; n <= mol.numAtoms; n++)
			if (mol.atomTransient(n).some((tag) => tag.startsWith(ForeignMoleculeTransient.AtomSgroupData + ':'))) return true;
		return false;
	}
	public static noteAllSgroupData(mol:Molecule):ForeignMoleculeSgroupData[]
	{
		let map:Record<number, ForeignMoleculeSgroupData> = {};

		for (let n = 1; n <= mol.numAtoms; n++) for (let tag of mol.atomTransient(n)) if (tag.startsWith(ForeignMoleculeTransient.AtomSgroupData + ':'))
		{
			let payload = tag.substring(ForeignMoleculeTransient.AtomSgroupData.length + 1);
			let bits = payload.split(',');
			if (bits.length < 5) continue;
			let idx = parseInt(bits[0]);
			for (let i = 1; i < 5; i++) bits[i] = bits[i].replace(/\@\@/g, ',');
			if (!(idx > 0)) continue;

			let sd = map[idx];
			if (sd)
				sd.atoms.push(n);
			else
				map[idx] = {name: bits[1], value: bits[2], unit: bits[3], query: bits[4], atoms: [n]};
		}

		return Object.values(map);
	}

	// ----------------- private methods -----------------

}

