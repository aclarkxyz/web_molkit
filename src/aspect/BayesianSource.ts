/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	BayesianSource: tracks some number of numeric columns which can be used to create Bayesian models. Keeps track of various pre-processing
	requirements (e.g. threshold), parameters (e.g. folding) and metadata (e.g. description).
*/

export class BayesianSourceModel
{
	public colNameMolecule = ''; // where to grab the molecules from
	public colNameValue = ''; // name of column with numeric source content (integer/real/boolean)
	public thresholdValue = 0.5; // threshold for turning free numbers into booleans
	public thresholdRelation = '>='; // one of "<", ">", "<=", ">="
	// (wouldn't it be a good idea to put the fingerprint type in here?)
	public folding = 0; // bitscale: 0=no folding, 2^n=folding into a bitmask range
	public noteField = ''; // field name for output model; defaults to value column name
	public noteTitle = ''; // model title: defaults to datasheet title
	public noteOrigin = ''; // model origin: defaults to filename
	public noteComment = ''; // totally optional, no default
}

export class BayesianSource extends Aspect
{
	public static CODE = 'org.mmi.aspect.BayesianSource';
	public static NAME = 'Bayesian Source';

	// ----------------- public methods -----------------

	// used to test if a datasheet has the appropriate metadata flagging it as this aspect
	public static isBayesianSource(ds:DataSheet):boolean
	{
		for (let n = 0; n < ds.numExtensions; n++) if (ds.getExtType(n) == BayesianSource.CODE) return true;
		return false;
	}

	constructor(ds?:DataSheet, allowModify?:boolean)
	{
		super(BayesianSource.CODE, ds, allowModify);
		this.setup();
	}

	// data access
	public getModels():BayesianSourceModel[]
	{
		let content = '';
		for (let n = 0; n < this.ds.numExtensions; n++) if (this.ds.getExtType(n) == BayesianSource.CODE)
		{
			content = this.ds.getExtData(n);
			break;
		}

		let models:BayesianSourceModel[] = [];
		let m:BayesianSourceModel = null;

		for (let line of content.split('\n'))
		{
			if (line == 'model:')
			{
				if (m != null) models.push(m);
				m = {} as BayesianSourceModel;
				continue;
			}

			if (m == null) continue;
			let eq = line.indexOf('=');
			if (eq < 0) continue;

			if (line.startsWith('colNameMolecule=')) m.colNameMolecule = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('colNameValue=')) m.colNameValue = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('thresholdValue=')) m.thresholdValue = parseFloat(line.substring(eq + 1));
			else if (line.startsWith('thresholdRelation=')) m.thresholdRelation = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('folding=')) m.folding = parseInt(line.substring(eq + 1));
			else if (line.startsWith('noteField=')) m.noteField = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('noteTitle=')) m.noteTitle = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('noteOrigin=')) m.noteOrigin = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('noteComment=')) m.noteComment = MoleculeStream.skUnescape(line.substring(eq + 1));
		}

		if (m != null) models.push(m);
		return models;
	}
	public setModels(models:BayesianSourceModel[]):void
	{
		let lines:string[] = [];

		for (let m of models)
		{
			lines.push('model:');
			lines.push('colNameMolecule=' + MoleculeStream.skEscape(m.colNameMolecule));
			lines.push('colNameValue=' + MoleculeStream.skEscape(m.colNameValue));
			lines.push('thresholdValue=' + m.thresholdValue);
			lines.push('thresholdRelation=' + MoleculeStream.skEscape(m.thresholdRelation));
			lines.push('folding=%d' + m.folding);
			lines.push('noteField=' + MoleculeStream.skEscape(m.noteField));
			lines.push('noteTitle=' + MoleculeStream.skEscape(m.noteTitle));
			lines.push('noteOrigin=' + MoleculeStream.skEscape(m.noteOrigin));
			lines.push('noteComment=' + MoleculeStream.skEscape(m.noteComment));
		}

		let content = lines.join('\n');
		for (let n = 0; n < this.ds.numExtensions; n++) if (this.ds.getExtType(n) == BayesianSource.CODE)
		{
			this.ds.setExtData(n, content.toString());
			return;
		}
		this.ds.appendExtension('BayesianSource', BayesianSource.CODE, content.toString());
	}

	// ----------------- private methods -----------------

	// workhorse for the constructor
	private setup():void
	{
		if (this.allowModify)
		{
			let models = this.getModels();
			this.setModels(models);
		}
	}

	// ------------------ aspect implementation --------------------

	public plainHeading():string {return BayesianSource.NAME;}
}

registerAspect(BayesianSource);

/* EOF */ }