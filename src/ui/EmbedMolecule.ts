/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../util/util.ts'/>
///<reference path='../gfx/Rendering.ts'/>
///<reference path='../gfx/MetaVector.ts'/>
///<reference path='../gfx/ArrangeMolecule.ts'/>
///<reference path='../gfx/DrawMolecule.ts'/>
///<reference path='../data/Molecule.ts'/>
///<reference path='EmbedChemistry.ts'/>

/*
	Embedded molecule: displays a single molecular structure, with a variety of available rendering options. The structure display is static
	and read-only, but it can be extracted in data format. It is rendered as SVG, so that it looks good when rendered for print quality. 
	
	The rendering parameters are quite raw, and presumed to be passed from an un-typed source, directly from the user:

        invert: boolean; inverts X (applied before rotation)
        rotate: degrees to rotate molecule
        padding: number of pixels to space around the molecule
		border: border colour, HTML-style colour code or 'transparent' for none
		radius: zero for square, higher for rounder corners
        background: 'transparent' for none; HTML-style for solid; for a gradient, specify as 'col1,col2'
        width, height: optional, either one (used as a maximum)
        box: specific size to stick with (comma-separated)
        scheme: molecule colouring schema (wob/cob/bow/cow)
        scale: points per ang

    ... these ones TBD
        format: MIME, or shortcuts for "molfile" or "sketchel"
        name: null/default = if molfile pull it out and display; blank = show nothing; text = show that
        source: URL of some kind - grab the data from there (wherever user directory is)

        (parameters to control interactivity?)
*/

class EmbedMolecule extends EmbedChemistry
{
	private mol:Molecule = null;
	private maxWidth = 0;
	private maxHeight = 0;
	private boxSize:Size = null;
	
	// ------------ public methods ------------

	constructor(private molstr:string, options?:any)
	{
		super();

		if (!options) options = {};

		let mol = Molecule.fromString(molstr); // (also check molfile/format tag)
		// .. if is molfile, or might be, try doing a linesplit to find the V2000/V3000; then pre-pad if necessary, due to lost whitespace

		if (mol == null) return;

		if (options.invert) mol = CoordUtil.mirrorImage(mol);
		if (options.rotate) CoordUtil.rotateMolecule(mol, options.rotate * DEGRAD);
		if (options.padding) this.padding = options.padding;
		
		if (options.background == 'transparent') this.clearBackground();
		else if (options.background)
		{
			let bg:string = options.background, comma = bg.indexOf(',');
			if (comma >= 0)
				this.setBackground(htmlToRGB(bg));
			else
				this.setBackgroundGradient(htmlToRGB(bg.substring(0, comma)), htmlToRGB(bg.substring(comma + 1)));
		}

		if (options.width) this.maxWidth = options.width;
		if (options.height) this.maxHeight = options.height;
		if (options.box)
		{
			let box:string = options.box, comma = box.indexOf(',');
			this.boxSize = new Size(parseInt(box.substring(0, comma)), parseInt(box.substring(comma + 1)));
		}

		if (options.policy == 'wob') this.policy = RenderPolicy.defaultWhiteOnBlack();
		else if (options.policy == 'cob') this.policy = RenderPolicy.defaultColourOnBlack();
		else if (options.policy == 'bow') this.policy = RenderPolicy.defaultBlackOnWhite();
		else if (options.policy == 'cow') this.policy = RenderPolicy.defaultColourOnWhite();

		if (options.scale) this.policy.data.pointScale = options.scale;

		this.mol = mol;
	}

	// create the objects necessary to render the widget; this function should be called after basic pre-initialisation settings, e.g.
	// specifying the starting molecule, initial size, etc.
	public render(parent:any):void
	{
		this.tagType = 'span';
		super.render(parent);
		
		let span = this.content, mol = this.mol, policy = this.policy;

		span.css('display', 'inline-block');
		span.css('line-height', '0');

		if (mol != null && mol.numAtoms > 0)
		{
			let effects = new RenderEffects();
			let measure = new OutlineMeasurement(0, 0, policy.data.pointScale);
			let layout = new ArrangeMolecule(mol, measure, policy, effects);
			layout.arrange();
			let metavec = new MetaVector();
			new DrawMolecule(layout, metavec).draw();
			metavec.normalise();

			let svg = $(metavec.createSVG()).appendTo(span);
		}
		else
		{
			span.css('color', 'red');
			span.text('Unable to parse molecule:');
			let pre = $('<pre></pre>').appendTo(span);
			pre.text(this.molstr);
		}
	}

	// ------------ private methods ------------

}

