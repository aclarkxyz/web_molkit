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
///<reference path='../gfx/ArrangeExperiment.ts'/>
///<reference path='../gfx/DrawExperiment.ts'/>
///<reference path='../data/Molecule.ts'/>
///<reference path='../data/DataSheet.ts'/>
///<reference path='../data/DataSheetStream.ts'/>
///<reference path='../aspect/Experiment.ts'/>
///<reference path='EmbedChemistry.ts'/>

/*
	Embedded reaction: renders a single reaction Experiment entry (can be multistep). Various formats are acceptable, but only one
	reaction is applicable; a datasheet with many reactions will only show the first one.
	
	The rendering parameters are quite raw, and presumed to be passed from an un-typed source, directly from the user:

        format: MIME, or shortcuts for "datasheet" or "sdfile"
		facet: one of 'header', 'scheme', 'quantity' or 'metrics' (default is 'scheme')
        scheme: molecule colouring schema (wob/cob/bow/cow)
        scale: points per angstrom
        padding: number of pixels to space around the content
		border: border colour, HTML-style colour code or 'transparent' for none
		radius: zero for square, higher for rounder corners
        background: 'transparent' for none; HTML-style for solid; for a gradient, specify as 'col1,col2'
		tight: if true, reduces the padding underneath
		stoichiometry: if false, doesn't display non-unit stoichiometry
		annotations: if true, adds annotations for component types
		maximumWidth: optionally constrain the width in pixels (guideline only)

    ... these ones TBD
		(option to limitW/H?)

        (parameters to control interactivity?)
*/

class EmbedReaction extends EmbedChemistry
{
	private entry:ExperimentEntry = null;
	private failmsg = '';
	private tight = false;
	private facet = 'scheme';
	private limitTotalW = 800;
	private includeStoich = true;
	private includeAnnot = false;

	// ------------ public methods ------------

	constructor(private datastr:string, options?:any)
	{
		super();

		if (!options) options = {};

		let xs:Experiment = null;
		if (options.format == 'datasheet' || options.format == 'chemical/x-datasheet') 
		{
			let ds = DataSheetStream.readXML(datastr);
			if (ds != null && Experiment.isExperiment(ds)) xs = new Experiment(ds);
		}
		// (... else MDL formats ...)
		else // free for all
		{
			// (same as explicit DS for now: but later add MDL formats)
			let ds = DataSheetStream.readXML(datastr);
			if (ds != null && Experiment.isExperiment(ds)) xs = new Experiment(ds);
		}

		if (xs == null || xs.ds.numRows == 0) return;
		this.entry = xs.getEntry(0);

		if (options.facet) this.facet = options.facet;

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

		if (options.scheme == 'wob') this.policy = RenderPolicy.defaultWhiteOnBlack();
		else if (options.scheme == 'cob') this.policy = RenderPolicy.defaultColourOnBlack();
		else if (options.scheme == 'bow') this.policy = RenderPolicy.defaultBlackOnWhite();
		else if (options.scheme == 'cow') this.policy = RenderPolicy.defaultColourOnWhite();

		if (options.scale) this.policy.data.pointScale = options.scale;

		if (options.tight == true || options.tight == 'true') this.tight = true;
		if (options.maximumWidth > 0) this.limitTotalW = options.maximumWidth;
		if (options.stoichiometry == false || options.stoichiometry == 'false') this.includeStoich = true;
		if (options.annotations == true || options.annotations == 'true') this.includeAnnot = true;
	}

	// create the objects necessary to render the widget; this function should be called after basic pre-initialisation settings, e.g.
	// specifying the starting molecule, initial size, etc.
	public render(parent:any):void
	{
		this.tagType = 'span';
		super.render(parent);
		
		let span = this.content;

		span.css('display', 'inline-block');
		span.css('line-height', '0');
		if (!this.tight) span.css('margin-bottom', '1.5em'); 

		if (this.entry != null)
		{
			if (this.facet == 'header') this.renderHeader(span);
			else if (this.facet == 'scheme') this.renderScheme(span); 
			else if (this.facet == 'quantity') this.renderQuantity(span); 
			else if (this.facet == 'metrics') this.renderMetrics(span); 
		}
		else
		{
			span.css('color', 'red');
			span.text('Unable to parse datasheet: ' + this.failmsg);
			let pre = $('<pre></pre>').appendTo(span);
			pre.css('line-height', '1.1');
			pre.text(this.datastr);
			console.log('Unparseable datasheet source string:\n[' + this.datastr + ']');
		}
	}

	// ------------ private methods ------------

	// display summary information from the header
	private renderHeader(span:JQuery):void
	{
	}

	// render the schema, using preferred chemist-style diagram
	private renderScheme(span:JQuery):void
	{
		let measure = new OutlineMeasurement(0, 0, this.policy.data.pointScale);
		let layout = new ArrangeExperiment(this.entry, measure, this.policy);
		layout.limitTotalW = this.limitTotalW;
		layout.includeStoich = this.includeStoich;
		layout.includeAnnot = this.includeAnnot;

		layout.arrange();

		let metavec = new MetaVector();
		new DrawExperiment(layout, metavec).draw();
		metavec.normalise();
		let svg = $(metavec.createSVG()).appendTo(span);
	}

	// render all the quantities by listing out each component in a table
	private renderQuantity(span:JQuery):void
	{
		// TODO
	}

	// display calculated green chemistry metrics
	private renderMetrics(span:JQuery):void
	{
		// TODO
	}

/*
	// rendering specifics for individual cells
	private renderPrimitive(td:JQuery, row:number, col:number):void
	{
		let txt = '', ct = this.ds.colType(col), align = 'center';
		if (ct == DataSheet.COLTYPE_STRING) {txt = this.ds.getString(row, col); align = 'left';}
		else if (ct == DataSheet.COLTYPE_INTEGER) txt = this.ds.getInteger(row, col).toString(); 
		else if (ct == DataSheet.COLTYPE_REAL) txt = this.ds.getReal(row, col).toString(); 
		else if (ct == DataSheet.COLTYPE_BOOLEAN) txt = this.ds.getBoolean(row, col) ? 'true' : 'false';
		td.text(txt);
		td.css('text-align', align);
	}
	private renderMolecule(td:JQuery, row:number, col:number):void
	{
		td.css('text-align', 'center');

		let effects = new RenderEffects();
		let measure = new OutlineMeasurement(0, 0, this.policy.data.pointScale);
		let layout = new ArrangeMolecule(this.ds.getMolecule(row, col), measure, this.policy, effects);
		layout.arrange();

		let metavec = new MetaVector();
		new DrawMolecule(layout, metavec).draw();
		metavec.normalise();
		let svg = $(metavec.createSVG()).appendTo(td);
	}
	private renderTextAspect(td:JQuery, row:number, aspect:Aspect, idx:number)
	{
		let rend = aspect.produceTextRendering(row, idx);
		if (!rend.text) td.text(' ');
		else if (rend.type == Aspect.TEXT_PLAIN) td.text(rend.text);
		else if (rend.type == Aspect.TEXT_LINK)
		{
			let ahref = $('<a target="_blank"></a>').appendTo(td);
			ahref.attr('href', rend.text);
			ahref.text(rend.text);
		}
		else if (rend.type == Aspect.TEXT_HTML) td.html(rend.text);
	}
	private renderGraphicAspect(td:JQuery, row:number, aspect:Aspect, idx:number)
	{
		let [name, metavec] = aspect.produceGraphicRendering(row, idx, this.policy);
		if (metavec == null) {td.text(' '); return;}

		td.css('text-align', 'center');
		metavec.normalise();
		$(metavec.createSVG()).appendTo(td);		
	}*/
}

