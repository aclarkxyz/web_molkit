/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

/*
	Interface for providing information about the device onto which a molecule is to be drawn, without it needing to
	know what the device actually is.
*/

abstract class ArrangeMeasurement
{
    // conversion between angstrom units of molecules, and device units
	abstract scale():number;
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
