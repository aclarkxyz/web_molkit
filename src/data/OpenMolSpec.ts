/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../decl/corrections.d.ts'/>
///<reference path='../util/util.ts'/>
///<reference path='Molecule.ts'/>

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

	// level 1.2
	InlineAbbreviations, // abbreviated groups wrapped into atoms

	// level 1.3
	ZeroOrderBonds, // use of bonds with order 0
	HydrogenCounting, // explicitly controlling # of virtual hydrogens

	// invalid features
	MoleculeName, // name stored in structure field (it shouldn't be)
	QueryResonance, // aromatic bond style used (query only)
	QueryHCount, // query field used for hydrogen counts
}

const OPENMOL_LEVEL_1_1 =
[
	OpenMolType.AtomCount1000,
	OpenMolType.BondCount1000,
];

const OPENMOL_LEVEL_1_2 =
[
	OpenMolType.InlineAbbreviations,
];

const OPENMOL_LEVEL_1_3 =
[
	OpenMolType.ZeroOrderBonds,
	OpenMolType.HydrogenCounting,
];

const OPENMOL_INVALID =
[
	OpenMolType.QueryResonance,
	OpenMolType.QueryHCount,
]

// refers to a segment of the input file, for tracking purposes
interface OpenMolSource
{
	row:number; // 0-based source row
	col:number; // 0-based source column
	len:number; // length (1 or more)
}

// describes an "issue" with a molecule which is linked to a level designation
interface OpenMolNote
{
	type:OpenMolType;
	atoms?:number[]; // atoms implicated
	bonds?:number[]; // bonds implicated
	level?:number; // level required for this feature
	source?:OpenMolSource[]; // where in the source file, if known
}

class OpenMolSpec
{
	public level = 1.0; // highest level required by any feature
	public invalid = false; // true if an unsupported feature is used
	public notes:OpenMolNote[] = [];

	// adding feature notes individually: this is most useful during the parsing process
	public add(type:OpenMolType, atoms?:number[], bonds?:number[], source?:OpenMolSource[]):void
	{
		this.addNote({'type': type, 'atoms': atoms, 'bonds': bonds, 'source': source});
	}
	public addNote(note:OpenMolNote):void
	{
		this.notes.push(note);
		
		note.level = 1.0;
		if (OPENMOL_LEVEL_1_1.indexOf(note.type) >= 0) note.level = 1.1;
		else if (OPENMOL_LEVEL_1_2.indexOf(note.type) >= 0) note.level = 1.2;
		else if (OPENMOL_LEVEL_1_3.indexOf(note.type) >= 0) note.level = 1.3;
		this.level = Math.max(this.level, note.level);
		
		this.invalid = this.invalid || OPENMOL_INVALID.indexOf(note.type) >= 0;
	}

	// add-or-join feature notes: glue the atom/bond list to an existing one, if possible
	public addJoin(type:OpenMolType, atoms?:number[], bonds?:number[], source?:OpenMolSource[]):void
	{
		for (let note of this.notes) if (note.type == type)
		{
			if (atoms && note.atoms) note.atoms = note.atoms.concat(atoms); else if (atoms) note.atoms = atoms;
			if (bonds && note.bonds) note.bonds = note.bonds.concat(bonds); else if (bonds) note.bonds = bonds;
			if (source && note.source) note.source = note.source.concat(source); else if (source) note.source = source;
			return;
		}
		this.add(type, atoms, bonds, source);
	}

	// deriving feature notes from an instantiated molecular datastructure
	public derive(mol:Molecule):void
	{
		if (mol.numAtoms >= 1000) this.add(OpenMolType.AtomCount1000);
		if (mol.numBonds >= 1000) this.add(OpenMolType.BondCount1000);
	}
}