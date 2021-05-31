/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	Embedded molecule: displays a single molecular structure, with a variety of available rendering options. The structure display is static
	and read-only, but it can be extracted in data format. It is rendered as SVG, so that it looks good when rendered for print quality.

	The rendering parameters are quite raw, and presumed to be passed from an un-typed source, directly from the user:

        format: MIME, or shortcuts for "molfile" or "sketchel"
        name: null/default = if molfile pull it out and display; blank = show nothing; text = show that
        invert: boolean; inverts the coordinates (applied before rotation)
        rotate: degrees to rotate molecule
        padding: number of pixels to space around the molecule
		border: border colour, HTML-style colour code or 'transparent' for none
		radius: zero for square, higher for rounder corners
        background: 'transparent' for none; HTML-style for solid; for a gradient, specify as 'col1,col2'
        width, height: optional, either one (used as a maximum)
        box: specific size to stick with (comma-separated)
        scheme: molecule colouring schema (wob/cob/bow/cow)
        scale: points per angstrom
		tight: if true, reduces the padding underneath

    ... these ones TBD
        source: URL of some kind - grab the data from there (wherever user directory is)

        (parameters to control interactivity?)
*/

export class EmbedMolecule extends EmbedChemistry
{
	private mol:Molecule = null;
	private name = '';
	private failmsg = '';
	private maxWidth = 0;
	private maxHeight = 0;
	private boxSize:Size = null;
	private tight = false;

	// ------------ public methods ------------

	constructor(private molstr:string, options?:any)
	{
		super();

		if (!options) options = {};

		let mol:Molecule = null, name:string = options.name;
		if (options.format == 'sketchel' || options.format == 'chemical/x-sketchel')
		{
			mol = Molecule.fromString(molstr);
		}
		else if (options.format == 'molfile' || options.format == 'chemical/x-mdl-molfile')
		{
			try
			{
				let mdl = new MDLMOLReader(molstr);
				mol = mdl.parse();
				if (mol != null && name == null) name = mdl.molName;
			}
			catch (ex) {this.failmsg = ex;}
		}
		else // free for all
		{
			mol = Molecule.fromString(molstr);
			if (mol == null)
			{
				try
				{
					let mdl = new MDLMOLReader(molstr);
					mol = mdl.parse();
					if (mol != null && name == null) name = mdl.molName;
				}
				catch (ex) {} // (silent when not forcing a type)
			}
		}

		if (mol == null) return;

		if (options.invert) mol = CoordUtil.mirrorImage(mol);
		if (options.rotate) CoordUtil.rotateMolecule(mol, options.rotate * DEGRAD);
		if (options.padding) this.padding = options.padding;

		if (options.background == 'transparent') this.clearBackground();
		else if (options.background)
		{
			let bg:string = options.background, comma = bg.indexOf(',');
			if (comma < 0)
				this.setBackground(htmlToRGB(bg));
			else
				this.setBackgroundGradient(htmlToRGB(bg.substring(0, comma)), htmlToRGB(bg.substring(comma + 1)));
		}

		if (options.border == 'transparent') this.borderCol = MetaVector.NOCOLOUR;
		else if (options.border) this.borderCol = htmlToRGB(options.border);

		if (options.radius != null) this.borderRadius = parseInt(options.radius);

		if (options.width) this.maxWidth = options.width;
		if (options.height) this.maxHeight = options.height;
		if (options.box)
		{
			let box:string = options.box, comma = box.indexOf(',');
			this.boxSize = new Size(parseInt(box.substring(0, comma)), parseInt(box.substring(comma + 1)));
		}

		if (options.scheme == 'wob') this.policy = RenderPolicy.defaultWhiteOnBlack();
		else if (options.scheme == 'cob') this.policy = RenderPolicy.defaultColourOnBlack();
		else if (options.scheme == 'bow') this.policy = RenderPolicy.defaultBlackOnWhite();
		else if (options.scheme == 'cow') this.policy = RenderPolicy.defaultColourOnWhite();

		if (options.scale) this.policy.data.pointScale = options.scale;

		if (options.tight == true || options.tight == 'true') this.tight = true;

		this.mol = mol;
		this.name = name;
	}

	// create the objects necessary to render the widget; this function should be called after basic pre-initialisation settings, e.g.
	// specifying the starting molecule, initial size, etc.
	public render(parent:any):void
	{
		this.tagType = 'span';
		super.render(parent);

		let span = this.contentDOM, mol = this.mol, policy = this.policy;

		span.css({'display': 'inline-block', 'line-height': '0'});
		if (!this.tight) span.setCSS('margin-bottom', '1.5em');

		if (mol != null && mol.numAtoms > 0)
		{
			span.setCSS('text-align', 'center');

			let effects = new RenderEffects();
			let measure = new OutlineMeasurement(0, 0, policy.data.pointScale);
			let layout = new ArrangeMolecule(mol, measure, policy, effects);
			layout.arrange();

			if (this.boxSize) layout.squeezeInto(0, 0, this.boxSize.w, this.boxSize.h);
			else if (this.maxWidth > 0 || this.maxHeight > 0)
			{
				let bounds = layout.determineBoundary();
				let w = bounds[2] - bounds[0], h = bounds[3] - bounds[1];
				let limW = this.maxWidth == 0 ? w : Math.min(w, this.maxWidth);
				let limH = this.maxHeight == 0 ? h : Math.min(h, this.maxHeight);
				if (limW != w || limH != h) layout.squeezeInto(0, 0, limW, limH);
			}

			let metavec = new MetaVector();
			new DrawMolecule(layout, metavec).draw();
			if (this.boxSize == null)
				metavec.normalise();
			else
				metavec.setSize(this.boxSize.w, this.boxSize.h);

			let svg = dom(metavec.createSVG()).appendTo(span);

			if (this.name)
			{
				let p = dom('<p/>').appendTo(span);
				p.css({'padding': '0.2em 0 0 0', 'margin': '0', 'width': '100%', 'color': '#606060', 'line-height': '1'});
				p.css({'font-family': '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif'});
				p.setText(this.name);
			}
		}
		else
		{
			span.css({'color': 'red'});
			span.setText('Unable to parse molecule: ' + this.failmsg);
			let pre = dom('<pre/>').appendTo(span);
			pre.css({'line-height': '1.1'});
			pre.setText(this.molstr);
			console.log('Unparseable molecule source string:\n[' + this.molstr + ']');
		}
	}

	// ------------ private methods ------------

}

/* EOF */ }