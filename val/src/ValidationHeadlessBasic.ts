/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../../src/util/util.ts'/>
///<reference path='../../src/util/Vec.ts'/>
///<reference path='../../src/gfx/AxisLabeller.ts'/>
///<reference path='Validation.ts'/>

/*
    Headless validation: basic tests - simple things like vector operators and common utilities.
*/

class ValidationHeadlessBasic extends Validation
{
	constructor()
	{
		super();
		this.add('Vector index sort', this.vectorIndexSort);
		this.add('Axis labeller', this.axisLabeller);
		//this.add('fubar', this.fubar);
	}

	public vectorIndexSort()
	{
		let array = ['b', 'c', 'a'];
		let idx = Vec.idxSort(array);
		this.assert(Vec.equals(idx, [2, 0, 1]));
	}

	public axisLabeller()
	{
		let textWidth = (str:string):number => str.length * 4; // placeholder for text measurement: good enough to test the algorithm
		let tfUnity = (val:number):number => val, tfNegLog = (val:number):number => -Math.log10(val), tfBackLog = (val:number):number => Math.pow(10, -val);

		const TESTCASES:any[][] =
		[
			// pixel width, min value, max value, transform
			[100, 1, 100, false, ['10', '100']],
			[100, 0, 1, false, ['0', '1']],
			[100, 0.01, 0.02, false, ['0.01', '0.02']],
			[100, 0.008, 0.022, false, ['0.008', '0.022']],
			[100, 0.00798, 0.0221, false, ['0.008', '0.022']],
			[100, 1E-5, 1E4, true, ['0.00001', '1e+4']]
		];
		for (let test of TESTCASES)
		{
			let asLog:boolean = test[3];
			let axis = new AxisLabeller(test[0], test[1], test[2], textWidth, asLog ? tfNegLog : tfUnity, asLog ? tfBackLog : tfUnity);
			axis.calculate();

			let wanted:string[] = test[4];
			let got:string[] = [];
			for (let notch of axis.notches) got.push(notch.label);
			if (wanted.length == 0 || !Vec.equals(wanted, got))
			{
				console.log('Test:' + JSON.stringify(test));
				console.log('Notches:' + JSON.stringify(axis.notches));
				console.log('Wanted:' + JSON.stringify(wanted));
				console.log('Got:' + JSON.stringify(got));
				this.fail('Did not get the expected axis labels.');
			}
		}
	}
}
