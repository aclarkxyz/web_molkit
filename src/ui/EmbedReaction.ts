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
		maximumwidth: optionally constrain the width in pixels (guideline only)

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
		if (options.maximumwidth > 0) this.limitTotalW = options.maximumwidth;
console.log('O:'+JSON.stringify(options));
console.log('OPTIONS:'+options.maximumwidth+'/'+this.limitTotalW);
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
		let table = $('<table></table>').appendTo(span);
		table.css('font-family', '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif');
		table.css('border-collapse', 'collapse');
		table.css('line-height', '1');
		table.css('margin', '2px');
		table.css('border', '0');

		let titles = ['Title', 'Created', 'Modified', 'DOI'];
		for (let n = 0; n < 4; n++)
		{
			if (n == 3 && !this.entry.doi) continue;

			let tr = $('<tr></tr>').appendTo(table);
			tr.css('line-height', '1');

			let th = $('<th></th>').appendTo(tr);
			th.css('white-space', 'nowrap');
			th.css('font-weight', '600');
			th.css('color', 'black');
			th.css('text-align', 'left');
			th.css('vertical-align', 'middle');
			th.css('padding', '0.2em 0.5em 0.2em 0.5em');
			th.css('border', '1px solid #D0D0D0');
			th.text(titles[n]);

			let td = $('<td></td>').appendTo(tr);
			td.css('border', '1px solid #D0D0D0');
			td.css('padding', '0.2em');
			td.css('vertical-align', 'middle');
			
			if (n == 0)
			{
				if (!this.entry.title) td.css('font-style', 'italic');
				td.text(this.entry.title ? this.entry.title : '(none)');
			}
			else if (n == 1 || n == 2)
			{
				let date = n == 1 ? this.entry.createDate : this.entry.modifyDate;
				if (date == null) td.css('font-style', 'italic');
				td.text(date == null ? '(none)' : date.toLocaleString());
			}
			else if (n == 3)
			{
				let url = this.doiToLink(this.entry.doi);

				if (url != null && (url.startsWith('http://') || url.startsWith('https://')))
				{
					let ahref = $('<a target="_blank"></a>').appendTo(td);
					ahref.attr('href', url);
					ahref.text(this.entry.doi);
				}
				else td.text(this.entry.doi);
			}
		}
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
		let quant = new QuantityCalc(this.entry);
		quant.calculate();
		
		let table = $('<table></table>').appendTo(span);
		table.css('font-family', '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif');
		table.css('border-collapse', 'collapse');
		table.css('line-height', '1');
		table.css('margin', '2px');
		table.css('border', '0');

		let effects = new RenderEffects();
		let measure = new OutlineMeasurement(0, 0, this.policy.data.pointScale);

		for (let n = 0; n < quant.numQuantities; n++)
		{
			let qc = quant.getQuantity(n);

			let tr = $('<tr></tr>').appendTo(table);
			tr.css('line-height', '1');

			let td = $('<td></td>').appendTo(tr);
			td.css('border', '1px solid #D0D0D0');
			td.css('padding', '0.2em');
			td.css('text-align', 'center');		
			td.css('vertical-align', 'middle');
			if (MolUtil.notBlank(qc.comp.mol))
			{
				let layout = new ArrangeMolecule(qc.comp.mol, measure, this.policy, effects);
				layout.arrange();

				let metavec = new MetaVector();
				new DrawMolecule(layout, metavec).draw();
				metavec.normalise();
				let svg = $(metavec.createSVG()).appendTo(td);
			}

			td = $('<td></td>').appendTo(tr);
			td.css('border', '1px solid #D0D0D0');
			td.css('padding', '0.2em');
			td.css('text-align', 'left');		
			td.css('vertical-align', 'top');

			this.renderComponentText(td, qc);
		}
	}

	// renders lines representing the component's text-like properties
	private renderComponentText(parent:JQuery, qc:QuantityComp)
	{
		let title:string[] = [], content:string[] = [];

		if (qc.comp.name)
		{
			title.push('Name');
			content.push('<i>' + escapeHTML(qc.comp.name) + '</i>');
		}
		if (MolUtil.notBlank(qc.comp.mol))
		{
			let mw = MolUtil.molecularWeight(qc.comp.mol);
			title.push('Weight');
			content.push(mw.toFixed(4));

			let mf = MolUtil.molecularFormula(qc.comp.mol, ['<sub>', '</sub>', '<sup>', '</sup>']);
			title.push('Formula');
			content.push(mf);
		}
		if (qc.valueEquiv > 0)
		{
			let text = qc.valueEquiv.toString(), stat = qc.statEquiv;
			if (stat == QuantityCalc.STAT_VIRTUAL) text = "<i>(" + text + ")</i>";
			else if (stat == QuantityCalc.STAT_CONFLICT) text += " (conflicting)";
			title.push('Stoichiometry');
			content.push(text);
		}
		if (qc.valueMass > 0)
		{
			let text = QuantityCalc.formatMass(qc.valueMass), stat = qc.statMass;
			if (stat == QuantityCalc.STAT_VIRTUAL) text = "<i>(" + text + ")</i>";
			else if (stat == QuantityCalc.STAT_CONFLICT) text += " (conflicting)";
			title.push('Mass');
			content.push(text);
		}
		if (qc.valueVolume > 0)
		{
			let text = QuantityCalc.formatVolume(qc.valueVolume), stat = qc.statVolume;
			if (stat == QuantityCalc.STAT_VIRTUAL) text = "<i>(" + text + ")</i>";
			else if (stat == QuantityCalc.STAT_CONFLICT) text += " (conflicting)";
			title.push('Volume');
			content.push(text);
		}
		if (qc.valueMoles > 0)
		{
			let text = QuantityCalc.formatMoles(qc.valueMoles), stat = qc.statMoles;
			if (stat == QuantityCalc.STAT_VIRTUAL) text = "<i>(" + text + ")</i>";
			else if (stat == QuantityCalc.STAT_CONFLICT) text += " (conflicting)";
			title.push('Moles');
			content.push(text);
		}
		if (qc.valueDensity > 0)
		{
			let text = QuantityCalc.formatDensity(qc.valueDensity), stat = qc.statDensity;
			if (stat == QuantityCalc.STAT_VIRTUAL) text = "<i>(" + text + ")</i>";
			else if (stat == QuantityCalc.STAT_CONFLICT) text += " (conflicting)";
			title.push('Density');
			content.push(text);
		}
		if (qc.valueConc > 0)
		{
			let text = QuantityCalc.formatConc(qc.valueConc), stat = qc.statConc;
			if (stat == QuantityCalc.STAT_VIRTUAL) text = "<i>(" + text + ")</i>";
			else if (stat == QuantityCalc.STAT_CONFLICT) text += " (conflicting)";
			title.push('Concentration');
			content.push(text);
		}
		if (qc.valueYield > 0 && !qc.comp.waste)
		{
			let text = QuantityCalc.formatPercent(qc.valueYield), stat = qc.statYield;
			if (stat == QuantityCalc.STAT_VIRTUAL) text = "<i>(" + text + ")</i>";
			else if (stat == QuantityCalc.STAT_CONFLICT) text += " (conflicting)";
			title.push('Yield');
			content.push(text);
		}

		for (let n = 0; n < title.length; n++)
		{
			let p = $('<p></p>').appendTo(parent);
			p.css('margin', '0.1em');
			p.append($('<b>' + title[n] + '</b>'));
			p.append(': ');
			p.append(content[n]);
		}
	}

	// display calculated green chemistry metrics
	private renderMetrics(span:JQuery):void
	{
		// TODO
	}

	private static PTN_DOI1 = /^doi:(\d+\.\d+\/.*)$/;
	private static PTN_DOI2 = /^(\d+\.\d+\/.*)$/;
	private static PTN_ISBN = /^(\d+-\d+-\d+-\d+-\d+)$/;
	private doiToLink(doi:string):string
	{
		if (doi.startsWith('http://') || doi.startsWith('https://')) return doi;
	
		let m = EmbedReaction.PTN_DOI1.exec(doi);
		if (m) return 'http://dx.doi.org/' + m[1];
		m = EmbedReaction.PTN_DOI2.exec(doi);
		if (m) return 'http://dx.doi.org/' + m[1];
		
		// note: there doesn't seem to be a way to turn an ISBN into a URL, which is rather unfortunate
		m = EmbedReaction.PTN_ISBN.exec(doi);
		if (m) return 'ISBN: ' + m[1];
	
		return null; // fail
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

