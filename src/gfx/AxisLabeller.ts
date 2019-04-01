/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../util/util.ts'/>

namespace WebMolKit /* BOF */ {

/*
	Determines a series of numeric labels to describe an axis, and makes sure all these labels fit within the given width.
	The min & max is described in the units of spacing along the axis, i.e. if this is a log scale, the numbers should be
	post-log. The caller provides a function to transform the axis units back to the original units (e.g. log to pre-log).
	The caller also provides a width measurement for the text. The full capabilities are appropriate for labelling an X-axis; 
	for a Y-axis, typically set the textWidth function to the height of the standard font.
*/

export interface AxisLabellerNotch
{
	label:string; // what precisely to display (null = just a notch, no label)
	value:number; // value in the original space
	pos:number; // axis position of notch, and the centre of the text label
}

export class AxisLabeller
{
	public notches:AxisLabellerNotch[] = [];

	constructor(private width:number, private minVal:number, private maxVal:number,
				public textWidth?:(str:string) => number, public inverse?:(val:number) => number)
	{
	}

	// performs the calculation: after completion, the notches property should be interrogated for the results
	public calculate():void
	{
		if (this.minVal == this.maxVal)
		{
			this.notches.push(
			{
				'label': this.minVal.toString(),
				'value': this.minVal,
				'pos': 0.5 * this.width
			});
			return;
		}

		const width = this.width, minVal = this.minVal, maxVal = this.maxVal;
		const range = maxVal - minVal, invRange = 1.0 / range;
		
		let position = (val:number):number => width * (val - minVal) * invRange;

		// find boundaries by rounding the minimum & maximum values, such that they can be squeezed into the edge zones of the axis
		let loT:number = null, hiT:number = null;
		const bumpLess = 1 - 1E-5, bumpMore = 1 + 1E-5;
//console.log('TVALUES:'+minT+','+maxT+', DIR='+dir);		
		got: for (let outer = 1E-10; outer <= 1E11; outer *= 10) for (let inner of [0.2, 0.5, 1])
		{
			let mag = outer * inner, inv = 1.0 / mag;
//console.log('outer:'+outer+' inner:'+inner+' mag:'+mag);

			let t1 = Math.floor(minVal * mag * bumpLess) * inv, t2 = Math.round(minVal * mag) * inv, t3 = Math.ceil(minVal * mag * bumpMore) * inv;
			let t4 = Math.floor(maxVal * mag * bumpLess) * inv, t5 = Math.round(maxVal * mag) * inv, t6 = Math.ceil(maxVal * mag * bumpMore) * inv;
			let p1 = position(t1), p2 = position(t2), p3 = position(t3);
			let p4 = position(t4), p5 = position(t5), p6 = position(t6);
//console.log(' t:'+[t1,t2,t3,t4,t5,t6]+' p:'+[p1,p2,p3,p4,p5,p6]);

			if ((fltEqual(p1, 0) || p1 >= 0) && p1 <= 0.1 * width) loT = t1;
			else if ((fltEqual(p2, 0) || p2 >= 0) && p2 <= 0.1 * width) loT = t2;
			else if ((fltEqual(p3, 0) || p3 >= 0) && p3 <= 0.1 * width) loT = t3;
			else continue;
			
			if (p6 >= 0.9 * width && (fltEqual(p6, width) || p6 <= width)) hiT = t6;
			else if (p5 >= 0.9 * width && (fltEqual(p5, width) || p5 <= width)) hiT = t5;
			else if (p4 >= 0.9 * width && (fltEqual(p4, width) || p4 <= width)) hiT = t4;
			else continue;

//console.log(' GOT:'+loT+','+hiT);

			// (record the mag, for subsequent spacing purposes?)
			break got;
		}

		if (loT == null || hiT == null) return; // should be very rare

		// NOTE: this is incomplete; but putting in two anchor points is better than nothing

		let loVal = this.inverse(loT), hiVal = this.inverse(hiT);
		this.notches.push(
		{
			'label': this.formatNumber(loVal),
			'value': loVal,
			'pos': position(loT)
		});
		this.notches.push(
		{
			'label': this.formatNumber(hiVal),
			'value': hiVal,
			'pos': position(hiT)
		});
	}

	// ------------ private methods ------------

	// round to a reasonable number of significant figures, then eliminate the cruft
	private formatNumber(num:number):string
	{
		let str = num.toPrecision(4);
		str = str.replace(/^(-?\d+)\.0+$/, '$1');
		str = str.replace(/^(-?\d+\.0*[1-9]+)0+$/, '$1');
		str = str.replace(/^(-?\d+)\.0+(e[\+\-]\d+)$/, '$1$2');
		str = str.replace(/^(-?\d+\.0*[1-9]+)0+(e[\+\-]\d+)$/, '$1$2');
		return str;
	}
}

/* EOF */ }