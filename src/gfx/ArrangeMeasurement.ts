/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../gfx/FontData.ts'/>

/*
	Interface for providing information about the device onto which a molecule is to be drawn, without it needing to
	know what the device actually is.
*/

abstract class ArrangeMeasurement
{
    // conversion between angstrom units of molecules, and device units
	abstract scale():number;
    abstract angToX(ax:number):number;
    abstract angToY(ay:number):number;
    abstract xToAng(px:number):number;
    abstract yToAng(py:number):number;

    // return true for math-style Y-axis, false for screen-style Y-axis
    abstract yIsUp():boolean;

    // returns an array of 3 numbers: [ascent, descent, width]
	abstract measureText(str:string, fontSize:number):number[];
}

// a suitable default which is useful for creating offline renderings
class OutlineMeasurement extends ArrangeMeasurement
{
    private invScale:number;

    constructor(private pointScale:number)
    {
        super();
        this.invScale = 1 / pointScale;
    }

    public scale():number {return this.pointScale;}
    public angToX(ax:number):number {return ax * this.pointScale;}
    public angToY(ay:number):number {return ay * -this.pointScale;}
    public xToAng(px:number):number {return px * this.invScale;}
    public yToAng(py:number):number {return py * -this.invScale;}

    // return true for math-style Y-axis, false for screen-style Y-axis
    public yIsUp():boolean {return false;}

    // returns an array of 3 numbers: [ascent, descent, width]
	public measureText(str:string, fontSize:number):number[] {return FontData.main.measureText(str, fontSize);}
}