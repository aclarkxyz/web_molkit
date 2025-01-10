/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {FontData} from './FontData';

/*
	Interface for providing information about the device onto which a molecule is to be drawn, without it needing to
	know what the device actually is.
*/

export interface ArrangeMeasurement
{
	// conversion between angstrom units of molecules, and device units
	scale():number;
	angToX(ax:number):number;
	angToY(ay:number):number;
	xToAng(px:number):number;
	yToAng(py:number):number;

	// return true for math-style Y-axis, false for screen-style Y-axis
	yIsUp():boolean;

	// returns an array of 3 numbers: [ascent, descent, width]
	measureText(str:string, fontSize:number):number[];
}

// a suitable default which is useful for creating offline renderings
export class OutlineMeasurement implements ArrangeMeasurement
{
	private invScale:number;

	constructor(private offsetX:number, private offsetY:number, private pointScale:number)
	{
		this.invScale = 1 / pointScale;
	}

	public scale():number {return this.pointScale;}
	public angToX(ax:number):number {return ax * this.pointScale + this.offsetX;}
	public angToY(ay:number):number {return ay * -this.pointScale + this.offsetY;}
	public xToAng(px:number):number {return (px - this.offsetX) * this.invScale;}
	public yToAng(py:number):number {return (py - this.offsetY) * -this.invScale;}

	// return true for math-style Y-axis, false for screen-style Y-axis
	public yIsUp():boolean {return false;}

	// returns an array of 3 numbers: [ascent, descent, width]
	public measureText(str:string, fontSize:number):number[] {return FontData.main.measureText(str, fontSize);}
}

