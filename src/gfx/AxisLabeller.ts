/*
    WebMolKit

    (c) 2010-2017 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../util/util.ts'/>

/*
	Determines a series of numeric labels to describe an axis, and makes sure all these labels fit within the given width.
	The caller provides a width measurement for the text, and a transformation from real units to axis units (e.g. log). The
	full capabilities are appropriate for labelling an X-axis; for a Y-axis, typically set the textWidth function to the
	height of the standard font.
*/

interface AxisLabellerNotch
{
	label:string; // what precisely to display (null = just a notch, no label)
	value:number; // value in the original space
	pos:number; // axis position of notch, and the centre of the text label
}

class AxisLabeller
{
	public notches:AxisLabellerNotch[] = [];

	constructor(private width:number, private minVal:number, private maxVal:number,
			    public textWidth?:(str:string) => number, public transform?:(val:number) => number, public inverse?:(val:number) => number)
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

		const width = this.width;
		let minT = this.transform(this.minVal), maxT = this.transform(this.maxVal);
		let dir = maxT > minT ? 1 : -1;
		let rangeT = maxT - minT, invRangeT = 1.0 / rangeT;
		
		let position = (valT:number):number => width * (valT - minT) * invRangeT;

		// find boundaries by rounding the minimum & maximum values, such that they can be squeezed into the edge zones of the axis
		let loT:number = null, hiT:number = null;
		const bumpLess = 1 - (dir * 1E-5), bumpMore = 1 + (dir * 1E-5);
//console.log('TVALUES:'+minT+','+maxT+', DIR='+dir);		
		got: for (let outer = 1E-10; outer <= 1E11; outer *= 10) for (let inner of [0.2, 0.5, 1])
		{
			let mag = outer * inner, inv = 1.0 / mag;
//console.log('outer:'+outer+' inner:'+inner+' mag:'+mag);

			let t1 = Math.floor(minT * mag * bumpLess) * inv, t2 = Math.round(minT * mag) * inv, t3 = Math.ceil(minT * mag * bumpMore) * inv;
			let t4 = Math.floor(maxT * mag * bumpLess) * inv, t5 = Math.round(maxT * mag) * inv, t6 = Math.ceil(maxT * mag * bumpMore) * inv;
			let p1 = position(t1), p2 = position(t2), p3 = position(t3);
			let p4 = position(t4), p5 = position(t5), p6 = position(t6);
//console.log(' t:'+[t1,t2,t3,t4,t5,t6]+' p:'+[p1,p2,p3,p4,p5,p6]);

			//if (dir > 0)
			//{
				if ((fltEqual(p1, 0) || p1 >= 0) && p1 <= 0.1 * width) loT = t1;
				else if ((fltEqual(p2, 0) || p2 >= 0) && p2 <= 0.1 * width) loT = t2;
				else if ((fltEqual(p3, 0) || p3 >= 0) && p3 <= 0.1 * width) loT = t3;
				else continue;
				
				if (p6 >= 0.9 * width && (fltEqual(p6, width) || p6 <= width)) hiT = t6;
				else if (p5 >= 0.9 * width && (fltEqual(p5, width) || p5 <= width)) hiT = t5;
				else if (p4 >= 0.9 * width && (fltEqual(p4, width) || p4 <= width)) hiT = t4;
				else continue;
			/*}
			else
			{
				if ((fltEqual(p6, 0) || p6 >= 0) && p6 <= 0.1 * width) loT = t6;
				else if ((fltEqual(p5, 0) || p5 >= 0) && p5 <= 0.1 * width) loT = t5;
				else if ((fltEqual(p4, 0) || p4 >= 0) && p4 <= 0.1 * width) loT = t4;
				else continue;
				
				if (p1 >= 0.9 * width && (fltEqual(p1, width) || p1 <= width)) hiT = t1;
				else if (p2 >= 0.9 * width && (fltEqual(p2, width) || p2 <= width)) hiT = t2;
				else if (p3 >= 0.9 * width && (fltEqual(p3, width) || p3 <= width)) hiT = t3;
				else continue;
			}*/
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