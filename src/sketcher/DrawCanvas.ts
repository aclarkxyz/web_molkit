/*
    WebMolKit

    (c) 2010-2019 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../decl/corrections.d.ts'/>
///<reference path='../util/util.ts'/>
///<reference path='../util/Cookies.ts'/>
///<reference path='../util/Geom.ts'/>
///<reference path='../data/Molecule.ts'/>
///<reference path='../data/MolUtil.ts'/>
///<reference path='../data/SketchUtil.ts'/>
///<reference path='../gfx/Rendering.ts'/>
///<reference path='../gfx/MetaVector.ts'/>
///<reference path='../gfx/ArrangeMolecule.ts'/>
///<reference path='../ui/ButtonView.ts'/>
///<reference path='../ui/ClipboardProxy.ts'/>
///<reference path='MoleculeActivity.ts'/>
///<reference path='CommandBank.ts'/>
///<reference path='TemplateBank.ts'/>
///<reference path='ToolBank.ts'/>
///<reference path='EditAtom.ts'/>
///<reference path='EditBond.ts'/>
///<reference path='ContextSketch.ts'/>

namespace WebMolKit /* BOF */ {

/*
	DrawCanvas: base class for the sketcher, which handles all of the rendering functionality for the live object.
*/

export enum DraggingTool
{
	None = 0,
	Press,
	Lasso,
	Pan,
	Zoom,
	Rotate,
	Move,
	Erasor,
	Atom,
	Bond,
	Charge,
	Ring
}

export enum DrawCanvasDecoration
{
	None = 0,
	Stereochemistry,
	MappingNumber,
	AtomIndex,
}

export class DrawCanvas extends Widget implements ArrangeMeasurement
{
	protected offsetX = 0;
	protected offsetY = 0;
	protected pointScale = 1;

	// ------------ public methods ------------

	constructor()
	{
		super();
	}

	// functions for converting between coordinates within the widget (pixels) & molecular position (Angstroms)
	public scale() {return this.pointScale;}
	public angToX(ax:number):number
	{
		return ax * this.pointScale + this.offsetX;
	}
	public angToY(ay:number):number
	{
		return ay * -this.pointScale + this.offsetY;
	}
	public xToAng(px:number):number
	{
		return (px - this.offsetX) / this.pointScale;
	}
	public yToAng(py:number):number
	{
		return (py - this.offsetY) / -this.pointScale;
	}
	public scaleToAng(scale:number):number {return scale / this.pointScale;}
	public angToScale(ang:number):number {return ang * this.pointScale;}
	public yIsUp():boolean {return false;}
	public measureText(str:string, fontSize:number):number[] {return FontData.main.measureText(str, fontSize);}

	// ------------ private methods ------------

}



/* EOF */ }