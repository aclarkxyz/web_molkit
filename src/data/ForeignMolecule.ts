/*
    WebMolKit

    (c) 2010-2019 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

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

export enum ForeignMoleculeExtra
{
	// generic flags for remarking that an atom/bond is aromatic; commonly used by SMILES, for MDL Molfile queries (and illegal structures)
	// and a number of other formats which use this concept
	AtomAromatic = 'yAROMATIC',
	BondAromatic = 'yAROMATIC',

	// the atom-centred chirality settings, used explicitly by MDL Molfiles to denote chirality, or mixtures
	AtomChiralMDLOdd = 'yCHIRAL_MDL_ODD',
	AtomChiralMDLEven= 'yCHIRAL_MDL_EVEN',
	AtomChiralMDLRacemic = 'yCHIRAL_MDL_RACEMIC',

	// annotations that carry over from supplementary MDL parsing
	AtomExplicitValence = 'yMDL_EXPLICIT_VALENCE',
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
		for (let n = 1; n <= sz; n++) mask[n - 1] = mol.atomTransient(n).indexOf(ForeignMoleculeExtra.AtomAromatic) >= 0;
		return mask;
	}

	// returns a mask for any bonds that have been explicitly marked as aromatic
	public static noteAromaticBonds(mol:Molecule):boolean[]
	{
		const sz = mol.numBonds;
		let mask = Vec.booleanArray(false, sz);
		for (let n = 1; n <= sz; n++) mask[n - 1] = mol.bondTransient(n).indexOf(ForeignMoleculeExtra.BondAromatic) >= 0;
		return mask;
	}

	// TODO: convert MDL chirality to/from rubric

	// explicit valence: 0=no information; -1=zero; >0=explicit
	public static markExplicitValence(mol:Molecule, atom:number, valence:number):void
	{
		let trans = mol.atomTransient(atom).filter((tr) => !tr.startsWith(ForeignMoleculeExtra.AtomExplicitValence));
		trans.push(`${ForeignMoleculeExtra.AtomExplicitValence}:${valence}`);
		mol.setAtomTransient(atom, trans);
	}
	public static noteExplicitValence(mol:Molecule, atom:number):number
	{
		let trans = mol.atomTransient(atom);
		for (let tr of trans) if (tr.startsWith(ForeignMoleculeExtra.AtomExplicitValence)) return parseInt(tr.substring(ForeignMoleculeExtra.AtomExplicitValence.length + 1));
		return null;
	}

	// ----------------- private methods -----------------

}

/* EOF */ }