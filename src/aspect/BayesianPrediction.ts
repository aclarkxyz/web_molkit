/*
    WebMolKit

    (c) 2010-2017 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../util/util.ts'/>
///<reference path='../data/DataSheet.ts'/>
///<reference path='../data/MoleculeStream.ts'/>
///<reference path='Aspect.ts'/>

/*
	Bayesian prediction: records some number of outcomes from Bayesian models, noting the columns that hold the predictions themselves and
	keeping some metadata about each.
*/

class BayesianPredictionModel
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

class BayesianPredictionOutcome
{
	public raw:number;
	public scaled:number;
	public arctan:number;
	public domain:number;
	public atoms:number[];
}

class BayesianPrediction extends Aspect
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
		super(ds, allowModify);
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
				m = <BayesianPredictionModel>{};
    			continue;
    		}
    		
    		if (m == null) continue;
    		let eq = line.indexOf('=');
    		if (eq < 0) continue;
    		
            if (line.startsWith('colMolecule=')) m.colMolecule = MoleculeStream.sk_unescape(line.substring(eq + 1));
            else if (line.startsWith('colRaw=')) m.colRaw = MoleculeStream.sk_unescape(line.substring(eq + 1));
            else if (line.startsWith('colScaled=')) m.colScaled = MoleculeStream.sk_unescape(line.substring(eq + 1));
            else if (line.startsWith('colArcTan=')) m.colArcTan = MoleculeStream.sk_unescape(line.substring(eq + 1));
            else if (line.startsWith('colDomain=')) m.colDomain = MoleculeStream.sk_unescape(line.substring(eq + 1));
            else if (line.startsWith('colAtoms=')) m.colAtoms = MoleculeStream.sk_unescape(line.substring(eq + 1));
            else if (line.startsWith('name=')) m.name = MoleculeStream.sk_unescape(line.substring(eq + 1));
            else if (line.startsWith('description=')) m.description = MoleculeStream.sk_unescape(line.substring(eq + 1));
            else if (line.startsWith('targetName=')) m.targetName = MoleculeStream.sk_unescape(line.substring(eq + 1));
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
            lines.push('colMolecule=' + MoleculeStream.sk_escape(m.colMolecule));
            lines.push('colRaw=' + MoleculeStream.sk_escape(m.colRaw));
            lines.push('colScaled=' + MoleculeStream.sk_escape(m.colScaled));
            lines.push('colArcTan=' + MoleculeStream.sk_escape(m.colArcTan));
            lines.push('colDomain=' + MoleculeStream.sk_escape(m.colDomain));
            lines.push('colAtoms=' + MoleculeStream.sk_escape(m.colAtoms));
            lines.push('name=' + MoleculeStream.sk_escape(m.name));
            lines.push('description=' + MoleculeStream.sk_escape(m.description));
            lines.push('targetName=' + MoleculeStream.sk_escape(m.targetName));
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
			for (let b of strAtoms.split(','))  outcome.atoms.push(parseFloat(b));
		}
		
		return outcome;
	}
	public setOutcome(row:number, model:BayesianPredictionModel, outcome:BayesianPredictionOutcome):void
	{
		let col = this.ds.findColByName(model.colRaw, DataSheet.COLTYPE_REAL);
		if (col >= 0) this.ds.setReal(row, col, outcome.raw);

		col = this.ds.findColByName(model.colScaled, DataSheet.COLTYPE_REAL);
		if (col >= 0) this.ds.setReal(row, col, outcome.scaled);

		col = this.ds.findColByName(model.colArcTan, DataSheet.COLTYPE_REAL);
		if (col >= 0) this.ds.setReal(row, col, outcome.arctan);

		col = this.ds.findColByName(model.colDomain, DataSheet.COLTYPE_REAL);
		if (col >= 0) this.ds.setReal(row, col, outcome.domain);

		col = this.ds.findColByName(model.colAtoms, DataSheet.COLTYPE_STRING);
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
