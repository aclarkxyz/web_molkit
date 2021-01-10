/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	Bayesian prediction: records some number of outcomes from Bayesian models, noting the columns that hold the predictions themselves and
	keeping some metadata about each.
*/

export class BayesianPredictionModel
{
	public colMolecule:string;
	public colRaw:string;
	public colScaled:string;
	public colArcTan:string;
	public colDomain:string;
	public colAtoms:string;
	public name:string;
	public description:string;
	public targetName:string;
	public isOffTarget:boolean;
}

export class BayesianPredictionOutcome
{
	public raw:number;
	public scaled:number;
	public arctan:number;
	public domain:number;
	public atoms:number[];
}

export class BayesianPrediction extends Aspect
{
	public static CODE = 'org.mmi.aspect.BayesianPrediction';
	public static NAME = 'Bayesian Prediction';

	// ----------------- public methods -----------------

	// used to test if a datasheet has the appropriate metadata flagging it as this aspect
	public static isBayesianPrediction(ds:DataSheet):boolean
	{
		for (let n = 0; n < ds.numExtensions; n++) if (ds.getExtType(n) == BayesianPrediction.CODE) return true;
		return false;
	}

	constructor(ds?:DataSheet, allowModify?:boolean)
	{
		super(BayesianPrediction.CODE, ds, allowModify);
		this.setup();
	}

	public getModels():BayesianPredictionModel[]
	{
		let content = '';
		for (let n = 0; n < this.ds.numExtensions; n++) if (this.ds.getExtType(n) == BayesianPrediction.CODE)
		{
			content = this.ds.getExtData(n);
			break;
		}

		let models:BayesianPredictionModel[] = [];
		let m:BayesianPredictionModel = null;

		for (let line of content.split('\n'))
		{
			if (line == 'model:')
			{
				if (m != null) models.push(m);
				m = {} as BayesianPredictionModel;
				continue;
			}

			if (m == null) continue;
			let eq = line.indexOf('=');
			if (eq < 0) continue;

			if (line.startsWith('colMolecule=')) m.colMolecule = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('colRaw=')) m.colRaw = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('colScaled=')) m.colScaled = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('colArcTan=')) m.colArcTan = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('colDomain=')) m.colDomain = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('colAtoms=')) m.colAtoms = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('name=')) m.name = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('description=')) m.description = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('targetName=')) m.targetName = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('isOffTarget=')) m.isOffTarget = line.substring(eq + 1) == 'true';
		}

		if (m != null) models.push(m);
		return models;
	}
	public setModels(models:BayesianPredictionModel[]):void
	{
		let lines:string[] = [];

		for (let m of models)
		{
			lines.push('model:');
			lines.push('colMolecule=' + MoleculeStream.skEscape(m.colMolecule));
			lines.push('colRaw=' + MoleculeStream.skEscape(m.colRaw));
			lines.push('colScaled=' + MoleculeStream.skEscape(m.colScaled));
			lines.push('colArcTan=' + MoleculeStream.skEscape(m.colArcTan));
			lines.push('colDomain=' + MoleculeStream.skEscape(m.colDomain));
			lines.push('colAtoms=' + MoleculeStream.skEscape(m.colAtoms));
			lines.push('name=' + MoleculeStream.skEscape(m.name));
			lines.push('description=' + MoleculeStream.skEscape(m.description));
			lines.push('targetName=' + MoleculeStream.skEscape(m.targetName));
			lines.push('isOffTarget=' + m.isOffTarget);
		}

		let content = lines.join('\n');
		for (let n = 0; n < this.ds.numExtensions; n++) if (this.ds.getExtType(n) == BayesianSource.CODE)
		{
			this.ds.setExtData(n, content.toString());
			return;
		}
		this.ds.appendExtension('BayesianPrediction', BayesianPrediction.CODE, content.toString());
	}

	// rowdata access
	public getOutcome(row:number, model:BayesianPredictionModel):BayesianPredictionOutcome
	{
		let outcome = new BayesianPredictionOutcome();
		outcome.raw = this.ds.getReal(row, model.colRaw);
		outcome.scaled = this.ds.getReal(row, model.colScaled);
		outcome.arctan = this.ds.getReal(row, model.colArcTan);
		outcome.domain = this.ds.getReal(row, model.colDomain);

		let strAtoms = this.ds.getString(row, model.colAtoms);
		if (strAtoms)
		{
			outcome.atoms = [];
			for (let b of strAtoms.split(',')) outcome.atoms.push(parseFloat(b));
		}

		return outcome;
	}
	public setOutcome(row:number, model:BayesianPredictionModel, outcome:BayesianPredictionOutcome):void
	{
		let col = this.ds.findColByName(model.colRaw, DataSheetColumn.Real);
		if (col >= 0) this.ds.setReal(row, col, outcome.raw);

		col = this.ds.findColByName(model.colScaled, DataSheetColumn.Real);
		if (col >= 0) this.ds.setReal(row, col, outcome.scaled);

		col = this.ds.findColByName(model.colArcTan, DataSheetColumn.Real);
		if (col >= 0) this.ds.setReal(row, col, outcome.arctan);

		col = this.ds.findColByName(model.colDomain, DataSheetColumn.Real);
		if (col >= 0) this.ds.setReal(row, col, outcome.domain);

		col = this.ds.findColByName(model.colAtoms, DataSheetColumn.String);
		if (col >= 0) this.ds.setString(row, col, outcome.atoms ? outcome.atoms.toString() : null);
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

registerAspect(BayesianPrediction);

/* EOF */ }