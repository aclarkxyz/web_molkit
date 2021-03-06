/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='Widget.ts'/>
///<reference path='../gfx/Rendering.ts'/>
///<reference path='../gfx/MetaVector.ts'/>
///<reference path='../gfx/ArrangeMolecule.ts'/>
///<reference path='../gfx/DrawMolecule.ts'/>
///<reference path='../data/Molecule.ts'/>

namespace WebMolKit /* BOF */ {

/*
	ViewStructure: a middleweight widget that renders a 2D structure non-interactively.

	The rendering is done using an HTML canvas.

	The content can be either a molecule or a single row from a datasheet. DataSheets with embedded aspects (e.g. reactions)
	will display that content.
*/

export class ViewStructure extends Widget
{
	private canvas:HTMLCanvasElement;
	private metavec:any;
	private naturalWidth = 0;
	private naturalHeight = 0;
	private width = 0;
	private height = 0;
	public padding = 2;
	public borderCol = 0x000000;
	private borderRadius = 8; // for rounded rects
	public backgroundCol1 = 0xFFFFFF;
	public backgroundCol2 = 0xE0E0E0;
	private molstr:string = null;
	private datastr:string = null;
	private datarow = 0;
	private policy:RenderPolicy = null;

	// ------------ public methods ------------

	// setup: note that tokenID is optional
	constructor(private tokenID?:string)
	{
		super();
	}

	// takes an instance of molsync.data.Molecule as the content
	public defineMolecule(mol:Molecule):void
	{
		this.molstr = mol.toString();
	}

	// define the molecule that is to be displayed, which will be sent via RPC for a rendering; the format
	// must be native, i.e. SketchEl, in the form of a plain string
	public defineMoleculeString(molsk:string):void
	{
		this.molstr = molsk;
	}

	// define the datasheet for which a portion is to be displayed; the dsxml parameter must be an XML-encoded string;
	// the row index defaults to 0 is not specified
	public defineDataSheetString(dsxml:string, rowidx:number):void
	{
		this.datastr = dsxml;
		this.datarow = rowidx != null ? rowidx : 0;
	}

	// provides a rendering policy; the parameter should be a RenderPolicy object
	public defineRenderPolicy(policy:RenderPolicy):void
	{
		this.policy = policy;
	}

	// create the objects necessary to render the widget; this function should be called after basic pre-initialisation settings, e.g.
	// specifying the starting molecule, initial size, etc.
	public render(parent:any):void
	{
		super.render(parent);


/* !! RECODE this...
		let canvas = newElement(this.content, 'canvas', {'width': this.width, 'height': this.height}) as HTMLCanvasElement;

		let density = pixelDensity();
		canvas.width = this.width * density;
		canvas.height = this.height * density;
		canvas.style.width = this.width + 'px';
		canvas.style.height = this.height + 'px';

		let ctx = canvas.getContext('2d');
		ctx.save();
		ctx.scale(density, density);

		// predraw the surrounding border
		let path:Path2D;
		if (this.borderRadius == 0)
		{
			path = new Path2D();
			path.rect(1.5, 1.5, this.width - 3, this.height - 3);
		}
		else path = pathRoundedRect(1.5, 1.5, this.width - 1.5, this.height - 1.5, this.borderRadius);

		if (this.backgroundCol1 != null)
		{
			if (this.backgroundCol2 == null)
			{
				ctx.fillStyle = colourCanvas(this.backgroundCol1);
			}
			else
			{
				let grad = ctx.createLinearGradient(0, 0, this.width, this.height);
				grad.addColorStop(0, colourCanvas(this.backgroundCol1));
				grad.addColorStop(1, colourCanvas(this.backgroundCol2));
				ctx.fillStyle = grad;
			}
			ctx.fill(path);
		}
		if (this.borderCol != -1)
		{
			ctx.strokeStyle = colourCanvas(this.borderCol);
			ctx.lineWidth = 1;
			ctx.stroke(path);
		}

		// determine a transform and render the molecule
		let limW = this.width - 2 * this.padding, limH = this.height - 2 * this.padding;
		let natW = this.naturalWidth, natH = this.naturalHeight;
		let scale = 1;
		if (natW > limW)
		{
			let down = limW / natW;
			scale *= down;
			natW *= down;
			natH *= down;
		}
		if (natH > limH)
		{
			let down = limH / natH;
			scale *= down;
			natW *= down;
			natH *= down;
		}

		this.metavec.offsetX = 0.5 * (this.width - natW);
		this.metavec.offsetY = 0.5 * (this.height - natH);
		this.metavec.scale = scale;
		this.metavec.renderContext(ctx);

		ctx.restore();*/
	}

	// ------------ private methods ------------
}

/* EOF */ }