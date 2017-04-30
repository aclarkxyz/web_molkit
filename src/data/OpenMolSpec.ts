/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../decl/corrections.d.ts'/>
///<reference path='../util/util.ts'/>

/*
	Specifications for Open Molecule: when analyzing a structure, append all of the feature observations that apply. These will
	be used to determine the "level" of compatibility required. The list of possibilities also includes features that are
	considered invalid, at least for the moment.
*/

enum OpenMolType
{
	None = 0,

	// level 1.1
	AtomCount1000, // molecule has more than 999 atoms
	BondCount1000, // molecule has more than 999 bonds

	// invalid features
	QueryResonance, // aromatic bond style used (query only)
	QueryHCount, // query field used for hydrogen counts
}

const OPENMOL_LEVEL_1_1 =
[
	OpenMolType.AtomCount1000,
	OpenMolType.BondCount1000,
];

const OPENMOL_INVALID =
[
	OpenMolType.QueryResonance,
	OpenMolType.QueryHCount,
]

interface OpenMolNote
{
	type:OpenMolType;
	atoms?:number[]; // atoms implicated
	bonds?:number[]; // bonds implicated
	level?:number; // level required for this feature
}

class OpenMolSpec
{
	public level = 1.0; // highest level required by any feature
	public invalid = false; // true if an unsupported feature is used
	public notes:OpenMolNote[] = [];

	// adding feature notes individually: this is most useful during the parsing process
	public add(type:OpenMolType, atoms?:number[], bonds?:number[]):void
	{
		this.addNote({'type': type, 'atoms': atoms, 'bonds': bonds});
	}
	public addNote(note:OpenMolNote):void
	{
		this.notes.push(note);
		
		note.level = 1.0;
		if (OPENMOL_LEVEL_1_1.indexOf(note.type) >= 0) note.level = 1.1;
		this.level = Math.max(this.level, note.level);
		
		this.invalid = this.invalid || OPENMOL_INVALID.indexOf(note.type) >= 0;
	}

	// add-or-join feature notes: glue the atom/bond list to an existing one, if possible
	public addJoin(type:OpenMolType, atoms?:number[], bonds?:number[]):void
	{
		for (let note of this.notes) if (note.type == type)
		{
			if (atoms && note.atoms) note.atoms = note.atoms.concat(atoms); else note.atoms = atoms;
			if (bonds && note.bonds) note.bonds = note.bonds.concat(bonds); else note.bonds = bonds;
			return;
		}
		this.add(type, atoms, bonds);
	}

	// deriving feature notes from an instantiated molecular datastructure
	public derive(mol:Molecule):void
	{
		if (mol.numAtoms >= 1000) this.add(OpenMolType.AtomCount1000);
		if (mol.numBonds >= 1000) this.add(OpenMolType.BondCount1000);
	}
}