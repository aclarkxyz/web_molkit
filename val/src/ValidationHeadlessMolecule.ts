/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

import {Molecule} from '@wmk/mol/Molecule';
import {Validation} from './Validation';
import {DataSheet, DataSheetColumn} from '@wmk/ds/DataSheet';
import {escapeHTML, orBlank, readTextURL} from '@wmk/util/util';
import {DataSheetStream} from '@wmk/io/DataSheetStream';
import {MoleculeStream} from '@wmk/io/MoleculeStream';
import {MDLMOLReader, MDLSDFReader} from '@wmk/io/MDLReader';
import {MetaMolecule} from '@wmk/mol/MetaMolecule';
import {Stereochemistry} from '@wmk/mol/Stereochemistry';
import {Vec} from '@wmk/util/Vec';
import {CircularFingerprints} from '@wmk/calc/CircularFingerprints';
import {MDLMOLWriter} from '@wmk/io/MDLWriter';
import {RenderEffects, RenderMnemonics, RenderPolicy} from '@wmk/gfx/Rendering';
import {OutlineMeasurement} from '@wmk/gfx/ArrangeMeasurement';
import {ArrangeMolecule} from '@wmk/gfx/ArrangeMolecule';
import {DrawMolecule} from '@wmk/gfx/DrawMolecule';
import {MetaVector} from '@wmk/gfx/MetaVector';

/*
	Headless validation: molecule tests - algorithms that apply to molecular connection tables.
*/

const BUMP = '?ver=' + new Date().getTime(); // to bust the cache


export class ValidationHeadlessMolecule extends Validation
{
	private strSketchEl:string;
	private strMolfile:string;
	private strDataXML:string;
	private strSDfile:string;
	private molStereo:Molecule;
	private dsCircular:DataSheet;
	private dsRoundtrip:DataSheet;
	private dsRendering:DataSheet;
	private dsFormat:DataSheet;

	constructor(private urlBase:string)
	{
		super();
		this.add('Parse SketchEl molecule (native format)', this.parseSketchEl);
		this.add('Parse MDL Molfile', this.parseMolfile);
		this.add('Parse DataSheet XML', this.parseDataXML);
		this.add('Parse MDL SDfile', this.parseSDfile);
		this.add('Calculate strict aromaticity', this.calcStrictArom);
		this.add('Calculate stereochemistry', this.calcStereoChem);
		this.add('Circular ECFP6 fingerprints', this.calcFingerprints);
		this.add('Molfile Round-trip', this.molfileRoundTrip);
		this.add('Rendering structures', this.renderingStructures);
		this.add('Molecule Format', this.moleculeFormat);
		this.add('Parse slightly exotic molfiles', this.parseExoticMolfiles);
	}


	public async init():Promise<void>
	{
		this.strSketchEl = await readTextURL(this.referenceURL('molecule.el'));
		this.strMolfile = await readTextURL(this.referenceURL('molecule.mol'));
		this.strDataXML = await readTextURL(this.referenceURL('datasheet.ds'));
		this.strSDfile = await readTextURL(this.referenceURL('datasheet.sdf'));
		this.molStereo = Molecule.fromString(await readTextURL(this.referenceURL('stereo.el')));
		this.dsCircular = DataSheetStream.readXML(await readTextURL(this.referenceURL('circular.ds')));
		this.dsRoundtrip = DataSheetStream.readXML(await readTextURL(this.referenceURL('roundtrip.ds')));
		this.dsRendering = DataSheetStream.readXML(await readTextURL(this.referenceURL('rendering.ds')));
		this.dsFormat = DataSheetStream.readXML(await readTextURL(this.referenceURL('formatelements.ds')));
	}

	public async parseSketchEl():Promise<void>
	{
		this.assert(!!this.strSketchEl, 'molecule not loaded');
		let mol = MoleculeStream.readNative(this.strSketchEl);
		this.assert(mol != null, 'parsing failed');
		this.assert(mol.numAtoms == 10 && mol.numBonds == 10, 'wrong atom/bond count');
	}

	public async parseMolfile():Promise<void>
	{
		this.assert(!!this.strMolfile, 'molecule not loaded');
		let mol = MoleculeStream.readMDLMOL(this.strMolfile);
		this.assert(mol != null, 'parsing failed');
		this.assert(mol.numAtoms == 10 && mol.numBonds == 10, 'wrong atom/bond count');
	}

	public async parseDataXML():Promise<void>
	{
		this.assert(!!this.strDataXML, 'datasheet not loaded');
		let ds = DataSheetStream.readXML(this.strDataXML);
		this.assert(ds != null, 'parsing failed');
		this.assert(ds.numRows == 2 && ds.numCols == 5, 'wrong row/column count');
		let colTypes = [DataSheetColumn.Molecule, DataSheetColumn.String, DataSheetColumn.Integer, DataSheetColumn.Real, DataSheetColumn.Boolean];
		for (let n = 0; n < colTypes.length; n++) this.assert(ds.colType(n) == colTypes[n], 'column#' + (n + 1) + ' wrong type');
		
		this.assert(ds.getMolecule(0, 0).numAtoms == 1, 'row 1: invalid molecule');
		this.assert(ds.getString(0, 1) == 'string', 'row 1: invalid string');
		this.assert(ds.getInteger(0, 2) == 1, 'row 1: invalid integer');
		this.assert(ds.getReal(0, 3) == 1.5, 'row 1: invalid real');
		this.assert(ds.getBoolean(0, 4) == true, 'row 1: invalid boolean');

		this.assert(ds.getMolecule(1, 0).numAtoms == 1, 'row 2: invalid molecule');
		for (let n = 1; n < ds.numCols; n++) this.assert(ds.isNull(1, n), 'row 2, column#' + (n + 1) + ' supposed to be null');		
	}

	public async parseSDfile():Promise<void>
	{
		this.assert(!!this.strSDfile, 'datasheet not loaded');
		let rdr = new MDLSDFReader(this.strSDfile);
		rdr.parse();
		let ds = rdr.ds;
		this.assert(ds != null, 'parsing failed');
		this.assert(ds.numRows == 2 && ds.numCols == 5, 'wrong row/column count');
		let colTypes = [DataSheetColumn.Molecule, DataSheetColumn.String, DataSheetColumn.Integer, DataSheetColumn.Real, DataSheetColumn.Boolean];

		for (let n = 0; n < colTypes.length; n++) this.assert(ds.colType(n) == colTypes[n], 'column#' + (n + 1) + ' wrong type');
		
		this.assert(ds.getMolecule(0, 0).numAtoms == 1, 'row 1: invalid molecule');
		this.assert(ds.getString(0, 1) == 'string', 'row 1: invalid string');
		this.assert(ds.getInteger(0, 2) == 1, 'row 1: invalid integer');
		this.assert(ds.getReal(0, 3) == 1.5, 'row 1: invalid real');
		this.assert(ds.getBoolean(0, 4) == true, 'row 1: invalid boolean');

		this.assert(ds.getMolecule(1, 0).numAtoms == 1, 'row 2: invalid molecule');
		for (let n = 1; n < ds.numCols; n++) this.assert(ds.isNull(1, n), 'row 2, column#' + (n + 1) + ' supposed to be null');		
	}

	public async calcStrictArom():Promise<void>
	{
		this.assert(this.molStereo != null, 'molecule not loaded');
		let meta = MetaMolecule.createStrict(this.molStereo);
		this.assert(meta.atomArom != null, 'no aromaticity obtained');
		for (let n = 1; n <= 10; n++) this.assert(meta.isAtomAromatic(n), 'atom #' + n + ' supposed to be aromatic');
		for (let n = 1; n <= 10; n++) this.assert(meta.isBondAromatic(n), 'bond #' + n + ' supposed to be aromatic');
	}

	public async calcStereoChem():Promise<void>
	{
		this.assert(this.molStereo != null, 'molecule not loaded');
		let meta = MetaMolecule.createStrictRubric(this.molStereo);
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

	public async calcFingerprints():Promise<void>
	{
		this.assert(this.dsCircular != null, 'datasheet not loaded');
		
		const ds = this.dsCircular;
		for (let n = 0; n < ds.numRows; n++)
		{
			this.context = {row: n + 1, count: ds.numRows, notes: []};

			let mol = ds.getMolecule(n, 'Molecule');
			let ecfp0:number[] = [], ecfp2:number[] = [], ecfp4:number[] = [], ecfp6:number[] = [];
			for (let fp of ds.getString(n, 'ECFP0').split(',')) if (fp.length > 0) ecfp0.push(parseInt(fp));
			for (let fp of ds.getString(n, 'ECFP2').split(',')) if (fp.length > 0) ecfp2.push(parseInt(fp));
			for (let fp of ds.getString(n, 'ECFP4').split(',')) if (fp.length > 0) ecfp4.push(parseInt(fp));
			for (let fp of ds.getString(n, 'ECFP6').split(',')) if (fp.length > 0) ecfp6.push(parseInt(fp));
			Vec.sort(ecfp0);
			Vec.sort(ecfp2);
			Vec.sort(ecfp4);
			Vec.sort(ecfp6);

			let circ = CircularFingerprints.create(mol, CircularFingerprints.CLASS_ECFP6);
			let got:number[][] = [[], [], [], []];
			for (let fp of circ.getFingerprints()) if (got[fp.iteration].indexOf(fp.hashCode) < 0) got[fp.iteration].push(fp.hashCode);
			for (let ecfp of got) Vec.sort(ecfp);

			this.assert(Vec.equals(ecfp0, got[0]), 'row#' + (n + 1) + ', iter#0: wanted ' + ecfp0 + ', got ' + got[0]);
			this.assert(Vec.equals(ecfp2, got[1]), 'row#' + (n + 1) + ', iter#1: wanted ' + ecfp2 + ', got ' + got[1]);
			this.assert(Vec.equals(ecfp4, got[2]), 'row#' + (n + 1) + ', iter#2: wanted ' + ecfp4 + ', got ' + got[2]);
			this.assert(Vec.equals(ecfp6, got[3]), 'row#' + (n + 1) + ', iter#3: wanted ' + ecfp6 + ', got ' + got[3]);
		}
	}

	public async molfileRoundTrip():Promise<void>
	{
		const findProblems = (mol:Molecule, alt:Molecule):string[] =>
		{
			let problems:string[] = [];
			for (let n = 1; n <= mol.numAtoms; n++)
			{
				if (mol.atomElement(n) != alt.atomElement(n)) problems.push('/atom #' + n + ': elements different');
				if (mol.atomCharge(n) != alt.atomCharge(n)) problems.push('/atom #' + n + ': charges different');
				if (mol.atomUnpaired(n) != alt.atomUnpaired(n)) problems.push('/atom #' + n + ': unpaired different');
				if (mol.atomIsotope(n) != alt.atomIsotope(n)) problems.push('/atom #' + n + ': isotope different');
				if (mol.atomMapNum(n) != alt.atomMapNum(n)) problems.push('/atom #' + n + ': mapnum different');
				if (mol.atomHydrogens(n) != alt.atomHydrogens(n)) problems.push('/atom #' + n + ': hydrogens different');
				if (mol.atomHExplicit(n) != alt.atomHExplicit(n)) problems.push('/atom #' + n + ': explicitH different');
			}
			for (let n = 1; n <= mol.numBonds; n++)
			{
				if (mol.bondOrder(n) != alt.bondOrder(n)) problems.push('/bond #' + n + ': bond orders different');
				if (mol.bondType(n) != alt.bondType(n)) problems.push('/bond #' + n + ': bond types different');
			}
			return problems;
		};

		const ds = this.dsRoundtrip;
		for (let n = 0; n < ds.numRows; n++)
		{
			this.context = {row: n + 1, count: ds.numRows, notes: []};

			let mol = ds.getMolecule(n, 'Molecule');
			let mdl = new MDLMOLWriter(mol).write();

			let alt = new MDLMOLReader(mdl).parse();
			this.assert(mol.numAtoms == alt.numAtoms && mol.numBonds == alt.numBonds, 'atom/bond count differs');
			
			let problems = findProblems(mol, alt);
			if (problems.length > 0)
			{
				this.context.notes.push('Round trip problems:');
				for (let p of problems) this.context.notes.push(p);
				this.context.notes.push('Original molecule:\n' + mol);
				this.context.notes.push('MDL Molfile CTAB:\n' + mdl);
				this.context.notes.push('Parsed back molecule:\n' + alt);
			}
			this.assert(problems.length == 0, problems.join('; '));

			let wantMDL = ds.getString(n, 'Molfile');
			if (mdl.trim() != orBlank(wantMDL).trim())
			{
				if (!wantMDL) 
					this.context.notes.push('Molfile missing from validation data.');
				else 
					this.context.notes.push(...['Desired Molfile:', `<pre>${wantMDL}</pre>`]);
				this.context.notes.push(...['Got Molfile:', `<pre>${mdl}</pre>`]);

				let linesWant = wantMDL.split('\n'), linesGot = mdl.split('\n');
				for (let i = 0; i < Math.max(linesWant.length, linesGot.length); i++) if (linesWant[i] != linesGot[i])
				{
					this.context.notes.push(`Line #${i + 1}: want [${linesWant[i]}], got [${linesGot[i]}]`);
					break;
				}

				this.assert(false, 'initial Molfile invalid');
			}

			let wantV3000 = ds.getString(n, 'V3000');
			if (wantV3000)
			{
				let gotV3000 = new MDLMOLWriter(mol).writeV3000();
				if (wantV3000.trim() != gotV3000.trim())
				{
					this.context.notes.push(...['Desired V3000:', `<pre>${wantV3000}</pre>`]);
					this.context.notes.push(...['Got V3000:', `<pre>${gotV3000}</pre>`]);
					this.assert(false, 'initial V3000 invalid');				
				}
			}
		}
	}

	public async renderingStructures():Promise<void>
	{
		const ds = this.dsRendering;

		let policy = RenderPolicy.defaultColourOnWhite();
		policy.data.pointScale = 15;
		let effects = new RenderEffects();
		let measure = new OutlineMeasurement(0, 0, policy.data.pointScale);

		for (let n = 0; n < ds.numRows; n++)
		{
			this.context = {row: n + 1, count: ds.numRows, notes: []};

			let mol = ds.getMolecule(n, 'Molecule');
			let wantMnemonic = ds.getString(n, 'Mnemonic').trim();

			let layout = new ArrangeMolecule(mol, measure, policy, effects);
			layout.arrange();

			let metavec = new MetaVector();
			let draw = new DrawMolecule(layout, metavec);
			draw.mnemonics = new RenderMnemonics();
			draw.draw();
			metavec.normalise();

			let gotMnemonic = draw.mnemonics.packWithCoords();

			this.context.notes.push(metavec.createSVG());
			this.context.notes.push('Got Mnemonic:');
			this.context.notes.push(`<div><tt>${escapeHTML(gotMnemonic)}</tt></div>`);
			this.context.notes.push('Want Mnemonic:');
			this.context.notes.push(`<div><tt>${escapeHTML(wantMnemonic || 'not provided')}</tt></div>`);

			this.assertEqual(gotMnemonic, wantMnemonic, 'mnemonics did not match');
		}
	}

	public async moleculeFormat():Promise<void>
	{
		const ds = this.dsFormat;
		let colMol = ds.findColByName('Molecule'), colSerial = ds.findColByName('Serial');

		let prevFormat = MoleculeStream.formatV2Elements;
		MoleculeStream.formatV2Elements = true;

		for (let n = 0; n < ds.numRows; n++)
		{
			this.context = {row: n + 1, count: ds.numRows, notes: []};

			var mol = ds.getMolecule(n, colMol);
			let wantSerial = (ds.getString(n, colSerial) ?? '').trim()
			let gotSerial = MoleculeStream.writeNative(mol).trim();
			
			this.context.notes =
			[
				'Got serialised:',
				`<pre>${gotSerial}</pre>`,
				'Want serialised:',
				`<pre>${wantSerial}</pre>`,
			];
			this.assertEqual(gotSerial, wantSerial);

			let molBack = MoleculeStream.readNative(gotSerial);
			this.context.notes =
			[
				'Reading serialised molfile. Got:',
				`<pre>${molBack.toString()}</pre>`,
				'Want:',
				`<pre>${mol.toString()}</pre>`,
			];
			this.assertEqual(mol.compareTo(molBack), 0, 'molecules are different');
		}

		MoleculeStream.formatV2Elements = prevFormat;
	}

	public async parseExoticMolfiles():Promise<void>
	{
		const convertAndCompare = async (base:string):Promise<void> =>
		{
			this.context = {subcategory: `Base=${base}`};

			let inRaw = await readTextURL(this.referenceURL(`molfile/${base}.mol`));
			let mol = MoleculeStream.readMDLMOL(inRaw);
			this.assert(mol != null, `${base}: parsing failed`);

			let elstr = mol.toString();

			let outRaw:string = null;
			try {outRaw = await readTextURL(this.referenceURL(`molfile/${base}.el`));}
			catch (ex) {}

			this.context.notes =
			[
				'Produced serialised molecule:',
				`<pre>${elstr}</pre>`,
				'Want:',
				`<pre>${outRaw}</pre>`,
			];
			this.assertEqual(elstr.trim(), (outRaw ?? '').trim(), 'output mismatch');
		};

		let prevFormat = MoleculeStream.formatV2Elements;
		MoleculeStream.formatV2Elements = true;

		const FILE_COMPARISONS = ['nucleotide2000', 'nucleotide3000'];
		for (let base of FILE_COMPARISONS) await convertAndCompare(base);

		MoleculeStream.formatV2Elements = prevFormat;
	}

	private referenceURL(fn:string):string {return this.urlBase + fn + BUMP;}
}

