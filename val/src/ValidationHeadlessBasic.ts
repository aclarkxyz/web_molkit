/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

import {Vec} from '@wmk/util/Vec';
import {Validation} from './Validation';
import {AxisLabeller} from '@wmk/gfx/AxisLabeller';


/*
    Headless validation: basic tests - simple things like vector operators and common utilities.
*/

export class ValidationHeadlessBasic extends Validation
{
	constructor()
	{
		super();
		this.add('Vector index sort', this.vectorIndexSort);
		this.add('Axis labeller', this.axisLabeller);
		//this.add('fubar', this.fubar);
	}

	public async vectorIndexSort():Promise<void>
	{
		let array = ['b', 'c', 'a'];
		let idx = Vec.idxSort(array);
		this.assert(Vec.equals(idx, [2, 0, 1]));
	}

	public async axisLabeller():Promise<void>
	{
		let textWidth = (str:string):number => str.length * 4; // placeholder for text measurement: good enough to test the algorithm
		let tfUnity = (val:number):number => val, tfNegLog = (val:number):number => -Math.log10(val), tfBackLog = (val:number):number => Math.pow(10, -val);

		const TESTCASES:any[][] =
		[
			// pixel width, min value, max value, transform
			[1, 100, false, ['10', '100']],
			[0, 1, false, ['0', '1']],
			[0.01, 0.02, false, ['0.01', '0.02']],
			[0.008, 0.022, false, ['0.008', '0.022']],
			[0.00798, 0.0221, false, ['0.008', '0.022']],
			[1E-5, 1E4, true, ['1e+4', '0.00001']],
			[0.03162277660168379, 100, true, ['100', '0.03162']]
		];
		for (let test of TESTCASES)
		{
			let low:number = test[0], high:number = test[1];
			let asLog:boolean = test[2];
			if (asLog) [low, high] = [tfNegLog(high), tfNegLog(low)];
			let axis = new AxisLabeller(100, low, high, textWidth, asLog ? tfBackLog : tfUnity);
			axis.calculate();

			let wanted:string[] = test[3];
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

