/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {Experiment, ExperimentEntry} from '../aspect/Experiment';
import {DataSheetStream} from '../data/DataSheetStream';
import {MolUtil} from '../data/MolUtil';
import {QuantityCalc, QuantityCalcComp, QuantityCalcStat} from '../data/QuantityCalc';
import {ArrangeExperiment} from '../gfx/ArrangeExperiment';
import {OutlineMeasurement} from '../gfx/ArrangeMeasurement';
import {ArrangeMolecule} from '../gfx/ArrangeMolecule';
import {DrawExperiment} from '../gfx/DrawExperiment';
import {DrawMolecule} from '../gfx/DrawMolecule';
import {MetaVector, TextAlign} from '../gfx/MetaVector';
import {RenderEffects, RenderPolicy} from '../gfx/Rendering';
import {DOM, dom} from '../util/dom';
import {escapeHTML, formatDouble, fromUTF8, htmlToRGB} from '../util/util';
import {EmbedChemistry} from './EmbedChemistry';

/*
	Embedded reaction: renders a single reaction Experiment entry (can be multistep). Various formats are acceptable, but only one
	reaction is applicable; a datasheet with many reactions will only show the first one.

	The rendering parameters are quite raw, and presumed to be passed from an un-typed source, directly from the user:

		format: MIME, or shortcuts for "datasheet" (... and others?)
		encoding: raw by default, but can be set to "base64"
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
		row: row of first step (default 0)

    ... these ones TBD
		(option to limitW/H?)

        (parameters to control interactivity?)
*/

export enum EmbedReactionFacet
{
	HEADER = 'header',
	SCHEME = 'scheme',
	QUANTITY = 'quantity',
	METRICS = 'metrics'
}

export class EmbedReaction extends EmbedChemistry
{
	private row = 0;
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

		if (options.encoding == 'base64') datastr = fromUTF8(atob(datastr.trim()));

		let xs:Experiment = null;
		if (options.format == 'datasheet' || options.format == 'chemical/x-datasheet')
		{
			let ds = DataSheetStream.readXML(datastr);
			if (ds == null) {this.failmsg = 'Unable to parse raw XML datasheet.'; return;}
			if (Experiment.isExperiment(ds)) xs = new Experiment(ds);
		}
		// (... else MDL formats ...)
		else // free for all
		{
			// (same as explicit DS for now: but later add MDL formats)
			let ds = DataSheetStream.readXML(datastr);
			if (ds == null) {this.failmsg = 'Unable to parse raw XML datasheet.'; return;}
			if (Experiment.isExperiment(ds)) xs = new Experiment(ds);
		}

		if (xs == null) {this.failmsg = 'Unable to instantiate Experiment aspect.'; return;}
		if (xs.ds.numRows == 0) {this.failmsg = 'Experiment datasheet has no rows.'; return;}

		if (options.row) this.row = options.row;
		if (this.row < 0 || this.row >= xs.ds.numRows) {this.failmsg = 'Requested row ' + this.row + ' out of bounds.'; return;}
		this.entry = xs.getEntry(this.row);

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
		if (options.stoichiometry == false || options.stoichiometry == 'false') this.includeStoich = true;
		if (options.annotations == true || options.annotations == 'true') this.includeAnnot = true;
	}

	// create the objects necessary to render the widget; this function should be called after basic pre-initialisation settings, e.g.
	// specifying the starting molecule, initial size, etc.
	public render(parent:any):void
	{
		this.tagType = 'span';
		super.render(parent);

		let span = this.contentDOM;
		span.css({'display': 'inline-block', 'line-height': '0'});
		if (!this.tight) span.setCSS('margin-bottom', '1.5em');

		if (this.entry != null)
		{
			if (this.facet == EmbedReactionFacet.HEADER) this.renderHeader(span);
			else if (this.facet == EmbedReactionFacet.SCHEME) this.renderScheme(span);
			else if (this.facet == EmbedReactionFacet.QUANTITY) this.renderQuantity(span);
			else if (this.facet == EmbedReactionFacet.METRICS) this.renderMetrics(span);
		}
		else
		{
			span.css({'color': 'red'});
			span.setText('Failure to acquire data: ' + this.failmsg);
			let pre = dom('<pre/>').appendTo(span).css({'line-height': '1.1'});
			pre.setText(this.datastr);
			console.log('Unparseable datasheet source string:\n[' + this.datastr + ']');
		}
	}

	// ------------ private methods ------------

	// display summary information from the header
	private renderHeader(span:DOM):void
	{
		let table = dom('<table/>').appendTo(span);
		table.css({'font-family': '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif'});
		table.css({'border-collapse': 'collapse', 'line-height': '1', 'margin': '2px', 'border': '0'});

		let titles = ['Title', 'Created', 'Modified', 'DOI'];
		for (let n = 0; n < 4; n++)
		{
			if (n == 3 && !this.entry.doi) continue;

			let tr = dom('<tr/>').appendTo(table).css({'line-height': '1'});

			let th = dom('<th/>').appendTo(tr);
			th.css({'white-space': 'nowrap', 'font-weight': '600', 'color': 'black', 'text-align': 'left', 'vertical-align': 'middle'});
			th.css({'padding': '0.2em 0.5em 0.2em 0.5em', 'border': '1px solid #D0D0D0'});
			th.setText(titles[n]);

			let td = dom('<td/>').appendTo(tr);
			td.css({'border': '1px solid #D0D0D0', 'padding': '0.2em', 'vertical-align': 'middle'});

			if (n == 0)
			{
				if (!this.entry.title) td.setCSS('font-style', 'italic');
				td.setText(this.entry.title ? this.entry.title : '(none)');
			}
			else if (n == 1 || n == 2)
			{
				let date = n == 1 ? this.entry.createDate : this.entry.modifyDate;
				if (date == null) td.setCSS('font-style', 'italic');
				td.setText(date == null ? '(none)' : date.toLocaleString());
			}
			else if (n == 3)
			{
				let url = this.doiToLink(this.entry.doi);

				if (url != null && (url.startsWith('http://') || url.startsWith('https://')))
				{
					let ahref = dom('<a target="_blank"/>').appendTo(td);
					ahref.setAttr('href', url);
					ahref.setText(this.entry.doi);
				}
				else td.setText(this.entry.doi);
			}
		}
	}

	// render the schema, using preferred chemist-style diagram
	private renderScheme(span:DOM):void
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
		let svg = dom(metavec.createSVG()).appendTo(span);
	}

	// render all the quantities by listing out each component in a table
	private renderQuantity(span:DOM):void
	{
		let quant = new QuantityCalc(this.entry);
		quant.calculate();

		let table = dom('<table/>').appendTo(span);
		table.css({'font-family': '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif'});
		table.css({'border-collapse': 'collapse', 'line-height': '1', 'margin': '2px', 'border': '0'});

		let effects = new RenderEffects();
		let measure = new OutlineMeasurement(0, 0, this.policy.data.pointScale);

		for (let n = 0; n < quant.numQuantities; n++)
		{
			let qc = quant.getQuantity(n);

			let tr = dom('<tr/>').appendTo(table).css({'line-height': '1'});

			let td = dom('<td/>').appendTo(tr);
			td.css({'border': '1px solid #D0D0D0', 'padding': '0.2em', 'text-align': 'center', 'vertical-align': 'middle'});
			if (MolUtil.notBlank(qc.comp.mol))
			{
				let layout = new ArrangeMolecule(qc.comp.mol, measure, this.policy, effects);
				layout.arrange();

				let metavec = new MetaVector();
				new DrawMolecule(layout, metavec).draw();
				metavec.normalise();
				let svg = dom(metavec.createSVG()).appendTo(td);
			}

			td = dom('<td/>').appendTo(tr);
			td.css({'border': '1px solid #D0D0D0', 'padding': '0.2em', 'text-align': 'left', 'vertical-align': 'top'});

			this.renderComponentText(td, qc);
		}
	}

	// renders lines representing the component's text-like properties
	private renderComponentText(parent:DOM, qc:QuantityCalcComp)
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
			if (stat == QuantityCalcStat.Virtual) text = '<i>(' + text + ')</i>';
			else if (stat == QuantityCalcStat.Conflict) text += ' (conflicting)';
			title.push('Stoichiometry');
			content.push(text);
		}
		if (qc.valueMass > 0)
		{
			let text = QuantityCalc.formatMass(qc.valueMass), stat = qc.statMass;
			if (stat == QuantityCalcStat.Virtual) text = '<i>(' + text + ')</i>';
			else if (stat == QuantityCalcStat.Conflict) text += ' (conflicting)';
			title.push('Mass');
			content.push(text);
		}
		if (qc.valueVolume > 0)
		{
			let text = QuantityCalc.formatVolume(qc.valueVolume), stat = qc.statVolume;
			if (stat == QuantityCalcStat.Virtual) text = '<i>(' + text + ')</i>';
			else if (stat == QuantityCalcStat.Conflict) text += ' (conflicting)';
			title.push('Volume');
			content.push(text);
		}
		if (qc.valueMoles > 0)
		{
			let text = QuantityCalc.formatMoles(qc.valueMoles), stat = qc.statMoles;
			if (stat == QuantityCalcStat.Virtual) text = '<i>(' + text + ')</i>';
			else if (stat == QuantityCalcStat.Conflict) text += ' (conflicting)';
			title.push('Moles');
			content.push(text);
		}
		if (qc.valueDensity > 0)
		{
			let text = QuantityCalc.formatDensity(qc.valueDensity), stat = qc.statDensity;
			if (stat == QuantityCalcStat.Virtual) text = '<i>(' + text + ')</i>';
			else if (stat == QuantityCalcStat.Conflict) text += ' (conflicting)';
			title.push('Density');
			content.push(text);
		}
		if (qc.valueConc > 0)
		{
			let text = QuantityCalc.formatConc(qc.valueConc), stat = qc.statConc;
			if (stat == QuantityCalcStat.Virtual) text = '<i>(' + text + ')</i>';
			else if (stat == QuantityCalcStat.Conflict) text += ' (conflicting)';
			title.push('Concentration');
			content.push(text);
		}
		if (qc.valueYield > 0 && !qc.comp.waste)
		{
			let text = QuantityCalc.formatPercent(qc.valueYield), stat = qc.statYield;
			if (stat == QuantityCalcStat.Virtual) text = '<i>(' + text + ')</i>';
			else if (stat == QuantityCalcStat.Conflict) text += ' (conflicting)';
			title.push('Yield');
			content.push(text);
		}

		for (let n = 0; n < title.length; n++)
		{
			let p = dom('<p/>').appendTo(parent);
			p.setCSS('margin', '0.1em');
			p.append(dom('<b>' + title[n] + '</b>'));
			p.appendText(': ');
			p.appendHTML(content[n]);
		}
	}

	// display calculated green chemistry metrics
	private renderMetrics(span:DOM):void
	{
		let quant = new QuantityCalc(this.entry);
		quant.calculate();

		let table = dom('<table/>').appendTo(span);
		table.css({'font-family': '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif'});
		table.css({'border-collapse': 'collapse', 'line-height': '1', 'margin': '2px', 'border': '0'});

		let effects = new RenderEffects();
		let measure = new OutlineMeasurement(0, 0, this.policy.data.pointScale);

		// display overall summary totals
		if (quant.numGreenMetrics > 0) for (let n = 0; n < 3; n++)
		{
			let tr = dom('<tr/>').appendTo(table).css({'line-height': '1'});

			let th = dom('<th/>').appendTo(tr);
			th.css({'border': '1px solid #D0D0D0', 'padding': '0.5em', 'font-weight': 'bold'});
			th.css({'text-align': 'right', 'vertical-align': 'middle', 'white-space': 'nowrap'});
			th.setText(n == 0 ? 'All Reactants' : n == 1 ? 'All Products' : /* n == 2 */ 'All Waste');

			let td = dom('<td/>').appendTo(tr);
			td.css({'border': '1px solid #D0D0D0', 'padding': '0.5em', 'white-space': 'nowrap'});
			td.css({'text-align': 'left', 'vertical-align': 'middle'});
			if (n == 0)
			{
				td.setText(this.combineQuant(quant.getAllMassReact(), 'g') + ' = ' + this.sumQuant(quant.getAllMassReact(), 'g', true));
			}
			else if (n == 1)
			{
				td.setText(this.combineQuant(quant.getAllMassProd(), 'g') + ' = ' + this.sumQuant(quant.getAllMassProd(), 'g', true));
			}
			else if (n == 2)
			{
				if (quant.getAllMassWaste().length > 0)
					td.setText(this.combineQuant(quant.getAllMassWaste(), 'g') + ' = ' + this.sumQuant(quant.getAllMassWaste(), 'g', false));
				else
					td.setText('none');
			}
		}
		else
		{
			let tr = dom('<tr/>').appendTo(table);
			let td = dom('<td/>').appendTo(tr);
			td.setText('No metrics to show.');
		}

		// show each relevant entity (i.e. products)
		for (let n = 0; n < quant.numGreenMetrics; n++)
		{
			let gm = quant.getGreenMetrics(n);
			let qc = quant.getQuantity(gm.idx);

			let tr = dom('<tr/>').appendTo(table).css({'line-height': '1'});

			let td = dom('<td/>').appendTo(tr);
			td.css({'border': '1px solid #D0D0D0', 'padding': '0.2em', 'text-align': 'center', 'vertical-align': 'middle'});
			if (MolUtil.notBlank(qc.comp.mol))
			{
				let layout = new ArrangeMolecule(qc.comp.mol, measure, this.policy, effects);
				layout.arrange();

				let metavec = new MetaVector();
				new DrawMolecule(layout, metavec).draw();
				metavec.normalise();
				dom(metavec.createSVG()).appendTo(td);
			}

			td = dom('<td/>').appendTo(tr);
			td.css({'border': '1px solid #D0D0D0', 'padding': '0.5em', 'text-align': 'left', 'vertical-align': 'top'});

			let pmi1 = this.combineQuant(gm.massReact, 'g'), pmi2 = this.combineQuant(gm.massProd, 'g');
			let pmi3 = this.sumQuantExt(gm.massReact, gm.massProd, 1, Number.NaN, null);
			let vg = this.drawTotals('PMI', pmi1, pmi2, pmi3);
			vg.normalise();
			let para = dom('<p/>').appendTo(td);
			dom(vg.createSVG()).appendTo(para);

			let ef1 = this.combineQuant(gm.massWaste, 'g'), ef2 = this.combineQuant(gm.massProd, 'g');
			let ef3 = this.sumQuantExt(gm.massWaste, gm.massProd, 1, Number.NaN, null);
			vg = this.drawTotals('E-factor', ef1, ef2, ef3);
			vg.normalise();
			para = dom('<p/>').appendTo(td);
			dom(vg.createSVG()).appendTo(para);

			let ae1 = this.combineQuant(gm.molwProd, null), ae2 = this.combineQuant(gm.molwReact, null);
			let ae3 = this.sumQuantExt(gm.molwProd, gm.molwReact, 100, 100, '%');
			vg = this.drawTotals('Atom-E', ae1, ae2, ae3);
			vg.normalise();
			para = dom('<p/>').appendTo(td);
			dom(vg.createSVG()).appendTo(para);
		}
	}

	// strings together a bunch of values with a separator & units
	private combineQuant(values:number[], units:string):string
	{
		if (values.length == 0) return '?';

		let str = '';
		for (let n = 0; n < values.length; n++)
		{
			if (n > 0) str += ' + ';
			if (values[n] == QuantityCalc.UNSPECIFIED)
			{
				str += '?';
			}
			else
			{
				str += formatDouble(values[n], 4);
				if (units) str += ' ' + units;
			}
		}
		return str;
	}

	// sums a bunch of values, with optional units
	private sumQuant(values:number[], units:string, requireSomething:boolean):string
	{
		if (values.length == 0) return requireSomething ? '?' : '0';

		let sum = 0;
		for (let n = 0; n < values.length; n++)
		{
			if (values[n] == QuantityCalc.UNSPECIFIED) return '?';
			sum += values[n];
		}
		let ret = formatDouble(sum, 4);
		if (units) ret += ' ' + units;
		return ret;
	}
	private sumQuantExt(numer:number[], denom:number[], mul:number, max:number, units:string):string
	{
		if (numer.length == 0 || denom.length == 0) return '?';
		let sum1 = 0, sum2 = 0;
		for (let n = 0; n < numer.length; n++)
		{
			if (numer[n] == QuantityCalc.UNSPECIFIED) return '?';
			sum1 += numer[n];
		}
		for (let n = 0; n < denom.length; n++)
		{
			if (denom[n] == QuantityCalc.UNSPECIFIED) return '?';
			sum2 += denom[n];
		}
		if (sum2 <= 0) return '?';
		let val = mul * sum1 / sum2;
		if (!Number.isNaN(max)) val = Math.min(val, max);

		let ret = formatDouble(val, 4);
		if (units) ret += ' ' + units;
		return ret;
	}

	// renders green metrics as a formula
	private drawTotals(heading:string, over:string, under:string, answer:string):MetaVector
	{
		let vg = new MetaVector();
		let measure = new OutlineMeasurement(0, 0, this.policy.data.pointScale);

		let sep = ' = ';
		let fsz = this.policy.data.pointScale * 0.8;
		let wadHeading = measure.measureText(heading, fsz);
		let wadOver = measure.measureText(over, fsz), wadUnder = measure.measureText(under, fsz);
		let wadAnswer = measure.measureText(answer, fsz);
		let wadSep = measure.measureText(sep, fsz);

		let x = 0;
		vg.drawText(x, 0, heading, fsz, 0x000000, TextAlign.Left | TextAlign.Middle);
		x += wadHeading[0];
		vg.drawText(x, 0, sep, fsz, 0x000000, TextAlign.Left | TextAlign.Middle);
		x += wadSep[0];

		vg.drawText(x, 0, answer, fsz, 0x000000, TextAlign.Left | TextAlign.Middle);
		x += wadAnswer[0];
		vg.drawText(x, 0, sep, fsz, 0x000000, TextAlign.Left | TextAlign.Middle);
		x += wadSep[0];

		let lw = Math.max(wadOver[0], wadUnder[0]);
		vg.drawLine(x, 0, x + lw, 0, 0x000000, 1);
		vg.drawText(x + 0.5 * lw, -2, over, fsz, 0x000000, TextAlign.Centre | TextAlign.Bottom);
		vg.drawText(x + 0.5 * lw, 2, under, fsz, 0x000000, TextAlign.Centre | TextAlign.Top);
		//x += lw;

		return vg;
	}

	// turns a DOI (or whatever got stuffed into the placeholder) into a clickable link, if possible
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
}

