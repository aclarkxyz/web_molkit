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
import {Random} from '@wmk/util/Random';


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
		this.add('Random numbers', this.randomNumbers);
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

	public async randomNumbers():Promise<void>
	{
		const TESTCASES =
		[
			// simplistic random number generators often behave badly with heavily un-prime ranges, like mod 4
			{seed: 1, mod: 2, size: 10, expected: [1,1,0,0,1,0,0,0,0,1]},
			{seed: 2, mod: 2, size: 10, expected: [1,1,1,1,0,0,1,1,0,0]},
			{seed: 3, mod: 2, size: 10, expected: [0,0,0,0,1,0,0,1,0,1]},
			{seed: 1, mod: 3, size: 10, expected: [2,0,1,0,0,1,2,0,2,2]},
			{seed: 2, mod: 3, size: 10, expected: [0,0,2,2,1,2,1,2,2,1]},
			{seed: 3, mod: 3, size: 10, expected: [2,2,2,2,1,2,2,0,2,0]},
			{seed: 1, mod: 4, size: 10, expected: [3,3,2,0,3,2,0,2,0,3]},
			{seed: 2, mod: 4, size: 10, expected: [3,1,3,1,2,0,1,1,0,2]},
			{seed: 3, mod: 4, size: 10, expected: [0,2,2,0,1,0,0,3,2,3]},
			{seed: 1, mod: 5, size: 10, expected: [2,4,4,4,0,1,3,4,2,3]},
			{seed: 2, mod: 5, size: 10, expected: [4,4,4,2,0,1,0,2,2,4]},
			{seed: 3, mod: 5, size: 10, expected: [3,4,4,4,1,1,2,2,0,4]},
			{seed: 10, mod: 8, size: 10, expected: [1,2,3,4,0,2,7,7,3,5]},
			{seed: 20, mod: 8, size: 10, expected: [2,1,0,3,0,4,6,5,7,3]},
			{seed: 30, mod: 8, size: 10, expected: [1,5,1,0,4,1,1,2,3,4]},
			{seed: 1, mod: 16, size: 10, expected: [11,7,10,12,3,10,4,2,12,15]},
			{seed: 2, mod: 16, size: 10, expected: [3,1,3,9,6,4,5,5,12,10]},
			{seed: 3, mod: 16, size: 10, expected: [4,14,14,4,5,0,4,15,6,7]},
			{seed: 1, mod: 256, size: 5, expected: [11,55,202,108,163]},
			{seed: 2, mod: 256, size: 5, expected: [163,49,115,137,54]},
			{seed: 3, mod: 256, size: 5, expected: [212,78,190,100,197]},
			{seed: 1, mod: 50000, size: 5, expected: [2347,44119,874,48444,10195]},
			{seed: 2, mod: 50000, size: 5, expected: [27779,23809,39619,47337,25350]},
			{seed: 3, mod: 50000, size: 5, expected: [1348,7294,3134,14084,43301]},
			{seed: 1, mod: 0, size: 5, expected: [1117902347,1901944119,457500874,1187598444,1441260195]},
			{seed: 2, mod: 0, size: 5, expected: [284527779,362773809,1763989619,582547337,1969175350]},
			{seed: 3, mod: 0, size: 5, expected: [881051348,1706057294,3603134,932714084,1566543301]},
			{seed: 1, mod: -1, size: 5, expected: [0.521,0.886,0.213,0.553,0.671]},
			{seed: 2, mod: -1, size: 5, expected: [0.132,0.169,0.821,0.271,0.917]},
			{seed: 3, mod: -1, size: 5, expected: [0.41,0.794,0.002,0.434,0.729]},
		];
		let bad = false;
		for (const {seed, mod, size, expected} of TESTCASES)
		{
			let rnd = new Random(seed);
			let got:number[] = [];
			for (let n = 0; n < size; n++) 
			{
				if (mod == 0) got.push(rnd.next());
				else if (mod < 0) got.push(Math.round(rnd.float() * 1000) / 1000);
				else got.push(rnd.int(mod));
			}
			if (!Vec.equals(got, expected))
			{
				console.log('Input: ' + JSON.stringify({seed,mod,size}));
				console.log('  Got: ' + JSON.stringify(got));
				console.log(' Want: ' + JSON.stringify(expected));
				bad = true;
			}
		}
		if (bad) this.fail('Did not get the right number sequences.');

		let rnd1 = new Random(1);
		let state = rnd1.getState();
		let sameVal = rnd1.next();
		let rnd2 = new Random(1);
		this.assertEqual(sameVal, rnd2.next(), 'Same seed/same number');
		let rnd3 = new Random(state);
		this.assertEqual(sameVal, rnd3.next(), 'Same state/same number');

		let avgFloat = 0, numAdd = 1000;
		for (let n = 0; n < numAdd; n++) avgFloat += rnd1.float();
		avgFloat /= numAdd;
		this.assert(avgFloat > 0.49 && avgFloat < 0.51, `Floating point average is off: ${avgFloat}`);
	}
}

