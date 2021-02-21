/*
    WebMolKit

    (c) 2010-2019 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../ui/Widget.ts'/>

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

interface DrawCanvasViewOpt
{
	decoration:DrawCanvasDecoration;
	showOxState:boolean;
	showQuery:boolean;
	showArtifacts:boolean;
}

export class DrawCanvas extends Widget implements ArrangeMeasurement
{
	protected offsetX = 0;
	protected offsetY = 0;
	protected pointScale = 1;

	protected viewOpt:DrawCanvasViewOpt =
	{
		'decoration': DrawCanvasDecoration.Stereochemistry,
		'showOxState': true,
		'showQuery': true,
		'showArtifacts': true,
	};

	protected width = 0;
	protected height = 0;
	protected border = 0x808080;
	protected borderRadius = 4;
	protected background = 0xF8F8F8;

	protected container:DOM;
	protected canvasUnder:DOM = null;
	protected canvasMolecule:DOM = null;
	protected canvasOver:DOM = null;
	protected divMessage:DOM = null;

	// ------------ public methods ------------

	constructor()
	{
		super();
	}

	public render(parent:any):void
	{
		if (!this.width || !this.height) throw 'Sketcher.render called without width and height';

		super.render(parent);

		this.container = dom('<div/>').appendTo(this.contentDOM);
		this.container.css({'position': 'relative', 'width': this.width + 'px', 'height': this.height + 'px'});
		this.container.css({'background-color': colourCanvas(this.background)});
		if (this.border != MetaVector.NOCOLOUR)
		{
			this.container.css({'border': '1px solid ' + colourCanvas(this.border)});
			this.container.css({'border-radius': this.borderRadius + 'px'});
		}
		this.container.css({'outline': 'none'});

		this.container.attr({'tabindex': '0'});

		let canvasStyle = {'position': 'absolute', 'left': '0', 'top': '0', 'width': `${this.width}px`, 'height': `${this.height}`, 'pointer-events': 'none'};

		this.canvasUnder = dom('<canvas/>').appendTo(this.container).css(canvasStyle);
		this.canvasMolecule = dom('<canvas/>').appendTo(this.container).css(canvasStyle);
		this.canvasOver = dom('<canvas/>').appendTo(this.container).css(canvasStyle);

		this.divMessage = dom('<div/>').appendTo(this.container).css(canvasStyle);
		this.divMessage.css({'text-align': 'center', 'vertical-align': 'middle', 'font-weight': 'bold', 'font-size': '120%'});
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