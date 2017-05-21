/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

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
///<reference path='../rpc/Func.ts'/>

/*
	ViewStructure: a middleweight widget that renders a 2D structure non-interactively.

	The rendering is done using an HTML canvas.

	The content can be either a molecule or a single row from a datasheet. DataSheets with embedded aspects (e.g. reactions)
	will display that content.
*/

class ViewStructure extends Widget
{
	canvas:HTMLCanvasElement;
	metavec:any;
	naturalWidth = 0;
	naturalHeight = 0;
	width = 0;
	height = 0;
	padding = 2;
	borderCol = 0x000000;
	borderRadius = 8; // for rounded rects
	backgroundCol1 = 0xFFFFFF;
	backgroundCol2 = 0xE0E0E0;
	molstr:string = null;
	datastr:string = null;
	datarow = 0;
	policy:RenderPolicy = null;
	
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

	// instantiates the widget: the molecule and its rendering properties must have been specified; the graphical content for the
	// molecule will be obtained, and information such as natural width & height filled in; note that this function executes an
	// RPC call, so it will return before the necessary information has been provided... the caller may provide its own callback for
	// when the details become available (optional)
	public setup(callback:() => void):void
	{
		if (this.molstr == null && this.datastr == null) throw 'molsync.ui.ViewStructure.setup called without specifying a molecule or datasheet';
		if (this.policy == null) this.policy = RenderPolicy.defaultColourOnWhite();

		if (this.molstr != null)
			this.setupMolecule(callback);
		else
			this.setupData(callback);
	}

	// create the objects necessary to render the widget; this function should be called after basic pre-initialisation settings, e.g.
	// specifying the starting molecule, initial size, etc.
	public render(parent:any):void
	{
		if (!this.metavec) throw 'molsync.ui.ViewStructure.render must be preceded by a call to setup';

		super.render(parent);

		let canvas = <HTMLCanvasElement>newElement(this.content /*parent*/, 'canvas', {'width': this.width, 'height': this.height});
		
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
				var grad = ctx.createLinearGradient(0, 0, this.width, this.height);
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
		
		ctx.restore();
	}

	// ------------ private methods ------------

	// rendering an individual molecule is done locally
	private setupMolecule(callback:() => void):void
	{
		let mol = Molecule.fromString(this.molstr); // note: not very efficient if mol was passed in...
		let effects = new RenderEffects();
		let measure = new OutlineMeasurement(0, 0, this.policy.data.pointScale);
		let layout = new ArrangeMolecule(mol, measure, this.policy, effects);
		layout.arrange();

		this.metavec = new MetaVector();
		new DrawMolecule(layout, this.metavec).draw();
		this.metavec.normalise();

		this.naturalWidth = this.metavec.width;
		this.naturalHeight = this.metavec.height;

		// fill in default dimensions
		if (this.width == 0) this.width = this.naturalWidth + 2 * this.padding;
		if (this.height == 0) this.height = this.naturalHeight + 2 * this.padding;

		if (callback) callback();
	}

	// when a datasheet snippet is provided, have to pass this off the RPC code
	private setupData(callback:() => void):void
	{
		let input:any = {'tokenID':this.tokenID};
		input.policy = this.policy.data;
		input.dataXML = this.datastr;
		input.dataRow = this.datarow;
		
		Func.renderStructure(input, (result:any, error:ErrorRPC) =>
		{
			if (!result) 
			{
				alert('Setup of ViewStructure failed: ' + error.message);
				return;
			}
			this.metavec = new MetaVector(result.metavec);
			this.naturalWidth = this.metavec.width;
			this.naturalHeight = this.metavec.width;
			
			// fill in default dimensions
			if (this.width == 0) this.width = this.naturalWidth + 2 * this.padding;
			if (this.height == 0) this.height = this.naturalHeight + 2 * this.padding;

			if (callback) callback();
		});
	}	
}

