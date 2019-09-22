/*
    WebMolKit

    (c) 2010-2019 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../util/Geom.ts'/>
///<reference path='Molecule.ts'/>
///<reference path='SketchUtil.ts'/>

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
	ATOM_AROMATIC = 'yAROMATIC',
	BOND_AROMATIC = 'yAROMATIC',

	// the atom-centred chirality settings, used explicitly by MDL Molfiles to denote chirality, or mixtures
	ATOM_CHIRAL_MDL_ODD = 'yCHIRAL_MDL_ODD',
	ATOM_CHIRAL_MDL_EVEN = 'yCHIRAL_MDL_EVEN',
	ATOM_CHIRAL_MDL_RACEMIC = 'yCHIRAL_MDL_RACEMIC',
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
		for (let n = 1; n <= sz; n++) mask[n - 1] = mol.atomTransient(n).indexOf(ForeignMoleculeExtra.ATOM_AROMATIC) >= 0;
		return mask;
	}

	// returns a mask for any bonds that have been explicitly marked as aromatic
	public static noteAromaticBonds(mol:Molecule):boolean[]
	{
		const sz = mol.numBonds;
		let mask = Vec.booleanArray(false, sz);
		for (let n = 1; n <= sz; n++) mask[n - 1] = mol.bondTransient(n).indexOf(ForeignMoleculeExtra.BOND_AROMATIC) >= 0;
		return mask;
	}

	// TODO: convert MDL chirality to/from rubric

	// ----------------- private methods -----------------

}

/* EOF */ }