/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../../src/util/util.ts'/>
///<reference path='../../src/util/Vec.ts'/>
///<reference path='../../src/data/Molecule.ts'/>
///<reference path='../../src/data/MetaMolecule.ts'/>
///<reference path='../../src/data/MoleculeStream.ts'/>
///<reference path='../../src/data/Stereochemistry.ts'/>
///<reference path='Validation.ts'/>

/*
    Headless validation: basic tests - simple things like vector operators and common utilities.
*/

class ValidationHeadlessMolecule extends Validation
{
	private strSketchEl:string;
	private strMolfile:string;
	private strStereo:string;

	constructor(private urlBase:string)
	{
		super();
		this.add('Parse SketchEl molecule (native format)', this.parseSketchEl);
		this.add('Parse MDL Molfile', this.parseMolfile);
		this.add('Calculate strict aromaticity', this.calcStrictArom);
		this.add('Calculate stereochemistry', this.calcStereoChem);
	}

    public init(donefunc:() => void):void
    {
		const self = this;

		$.get(self.urlBase + 'molecule.el', function(data)
		{
			self.strSketchEl = data;
			$.get(self.urlBase + 'molecule.mol', function(data)
			{
				self.strMolfile = data;
				$.get(self.urlBase + 'stereo.el', function(data)
				{
					self.strStereo = data;
					donefunc.call(self);
				});
			});
		});
    }
	

	public parseSketchEl()
	{
		this.assert(!!this.strSketchEl, 'molecule not loaded');
		let mol = MoleculeStream.readNative(this.strSketchEl);
		this.assert(mol != null, 'parsing failed');
		this.assert(mol.numAtoms == 10 && mol.numBonds == 10, 'wrong atom/bond count');
		//console.log(this.strSketchEl);
	}

	public parseMolfile()
	{
		this.assert(!!this.strMolfile, 'molecule not loaded');
		let mol = MoleculeStream.readMDLMOL(this.strMolfile);
		this.assert(mol != null, 'parsing failed');
		this.assert(mol.numAtoms == 10 && mol.numBonds == 10, 'wrong atom/bond count');
		//console.log(this.strMolfile);
	}

	public calcStrictArom()
	{
		this.assert(!!this.strStereo, 'molecule not loaded');
		let meta = MetaMolecule.createStrict(Molecule.fromString(this.strStereo));
		this.assert(meta.atomArom != null, 'no aromaticity obtained');
		for (let n = 1; n <= 10; n++) this.assert(meta.isAtomAromatic(n), 'atom #' + n + ' supposed to be aromatic');
		for (let n = 1; n <= 10; n++) this.assert(meta.isBondAromatic(n), 'bond #' + n + ' supposed to be aromatic');
	}

	public calcStereoChem()
	{
		this.assert(!!this.strStereo, 'molecule not loaded');
		let meta = MetaMolecule.createStrictRubric(Molecule.fromString(this.strStereo));
		this.assert(meta.rubricTetra != null, 'no tetrahedral rubric obtained');
		this.assert(meta.rubricSides != null, 'no cis/trans rubric obtained');
		let stereo = Stereochemistry.create(meta);
		
		let tet11 = stereo.atomTetraChirality(11); 
		this.assert(tet11 == Stereochemistry.STEREO_NEG, 'atom 11: incorrect stereochemistry, got ' + tet11);
		let tet19 = stereo.atomTetraChirality(19);
		this.assert(tet19 == Stereochemistry.STEREO_POS, 'atom 19: incorrect stereochemistry, got ' + tet19);
		let tet20 = stereo.atomTetraChirality(20);
		this.assert(tet20 == Stereochemistry.STEREO_POS, 'atom 20: incorrect stereochemistry, got ' + tet20);
		let side26 = stereo.bondSideStereo(26);
		this.assert(side26 == Stereochemistry.STEREO_NEG, 'bond 26: incorrect stereochemistry, got ' + side26);
	}
}
