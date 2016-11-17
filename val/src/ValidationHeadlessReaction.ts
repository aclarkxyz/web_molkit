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
///<reference path='../../src/data/MoleculeStream.ts'/>
///<reference path='../../src/aspect/Experiment.ts'/>
///<reference path='Validation.ts'/>

/*
    Headless validation: reaction tests - validating the Experiment aspect and related functionality
*/

class ValidationHeadlessReaction extends Validation
{
	private strExperiment:string;

	constructor(private urlBase:string)
	{
		super();
		this.add('Experiment aspect', this.confirmAspect);
	}

    public init(donefunc:() => void):void
    {
		const self = this;

		let FILES = ['experiment.ds'];
		let files = FILES;

		let fetchResult = function(data:string):void
		{
			let fn = files.shift();
			if (fn == 'experiment.ds') self.strExperiment = data;

			if (files.length > 0)
				$.get(self.urlBase + files[0], fetchResult);
			else
				donefunc.call(self);
		}
		$.get(self.urlBase + files[0], fetchResult);
    }

	public confirmAspect()
	{
		this.assert(!!this.strExperiment, 'datasheet not loaded');
		let ds = DataSheetStream.readXML(this.strExperiment);
		this.assert(ds != null, 'parsing failed');
		this.assert(Experiment.isExperiment(ds), 'aspect claimed not an Experiment');

		let xs = new Experiment(ds);
		let entry = xs.getEntry(0);
		this.assert(entry != null, 'null entry returned');
		this.assert(entry.steps.length == 2, 'reaction supposed to be 2 steps, got ' + entry.steps.length);
		this.assert(entry.steps[0].reactants.length == 1, 'require step 1: #reactants = 1'); 
		this.assert(entry.steps[0].reagents.length == 3, 'require step 1: #reagents = 3'); 
		this.assert(entry.steps[0].products.length == 2, 'require step 1: #products = 2'); 
		this.assert(entry.steps[1].reactants.length == 0, 'require step 2: #reactants = 0'); 
		this.assert(entry.steps[1].reagents.length == 1, 'require step 2: #reagents = 1'); 
		this.assert(entry.steps[1].products.length == 2, 'require step 2: #products = 2'); 
	}

}
