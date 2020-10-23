/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	Embedded collection: obtains a datasheet representation and displays it as a group of molecules, primitive datatypes, and/or higher
	order datastructures controlled by aspects.

	The rendering parameters are quite raw, and presumed to be passed from an un-typed source, directly from the user:

        format: MIME, or shortcuts for "datasheet" or "sdfile"
		encoding: raw by default, but can be set to "base64"
        scheme: molecule colouring schema (wob/cob/bow/cow)
        scale: points per angstrom
        padding: number of pixels to space around the content
		border: border colour, HTML-style colour code or 'transparent' for none
		radius: zero for square, higher for rounder corners
        background: 'transparent' for none; HTML-style for solid; for a gradient, specify as 'col1,col2'
		tight: if true, reduces the padding underneath

    ... these ones TBD
        source: URL of some kind - grab the data from there (wherever user directory is)

        (parameters to control interactivity?)
*/

interface EmbedCollectionColumn
{
	name:string;
	aspect:Aspect; // null for primitive
	type:string; // if aspect, either 'text' or 'graphic'
	idx:number; // primitive: column#; aspect: text/graphic rendering #
}

export class EmbedCollection extends EmbedChemistry
{
	private ds:DataSheet = null;
	private failmsg = '';
	private tight = false;

	// ------------ public methods ------------

	constructor(private datastr:string, options?:any)
	{
		super();

		if (!options) options = {};

		if (options.encoding == 'base64') datastr = fromUTF8(atob(datastr.trim()));

		let ds:DataSheet = null, name:string = options.name;
		if (options.format == 'datasheet' || options.format == 'chemical/x-datasheet')
		{
			ds = DataSheetStream.readXML(datastr);
		}
		else if (options.format == 'sdfile' || options.format == 'chemical/x-mdl-sdfile')
		{
			try
			{
				let mdl = new MDLSDFReader(datastr);
				ds = mdl.parse();
			}
			catch (ex) {this.failmsg = ex;}
		}
		else // free for all
		{
			try {ds = DataSheetStream.readXML(datastr);}
			catch (ex) {}
			if (ds == null)
			{
				try
				{
					let mdl = new MDLSDFReader(datastr);
					ds = mdl.parse();
				}
				catch (ex) {} // (silent when not forcing a type)
			}
		}

		if (ds == null) return;

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

		this.ds = ds;
	}

	// create the objects necessary to render the widget; this function should be called after basic pre-initialisation settings, e.g.
	// specifying the starting molecule, initial size, etc.
	public render(parent:any):void
	{
		this.tagType = 'span';
		super.render(parent);

		let span = this.content, ds = this.ds, policy = this.policy;

		span.css('display', 'inline-block');
		span.css('line-height', '0');
		if (!this.tight) span.css('margin-bottom', '1.5em');

		if (ds != null)
		{
			let aspects = new AspectList(ds).enumerate();
			let columns:EmbedCollectionColumn[] = this.determineColumns(aspects);

			let table = $('<table></table>').appendTo(span);
			table.css('font-family', '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif');
			table.css('border-collapse', 'collapse');
			table.css('line-height', '1');
			table.css('margin', '2px');
			table.css('border', '0');

			let tr = $('<tr></tr>').appendTo(table);
			tr.css('line-height', '1');
			for (let n = 0; n < columns.length; n++)
			{
				let th = $('<th></th>').appendTo(tr);
				th.css('white-space', 'nowrap');
				th.css('font-weight', '600');
				th.css('color', 'black');
				th.css('text-decoration', 'underline');
				th.css('text-align', 'center');
				th.css('padding', '0.2em 0.5em 0.2em 0.5em');
				th.css('border', '0');
				th.text(columns[n].name);
			}

			for (let row = 0; row < ds.numRows;)
			{
				let blksz = 1;
				for (let aspect of aspects) blksz = Math.max(blksz, aspect.rowBlockCount(row));

				tr = $('<tr></tr>').appendTo(table);
				tr.css('line-height', '1');
				for (let col = 0; col < columns.length; col++)
				{
					let td = $('<td></td>').appendTo(tr);
					td.css('border', '1px solid #D0D0D0');
					td.css('padding', '0.2em');
					td.css('vertical-align', 'middle');
					let spec = columns[col];
					if (spec.aspect == null)
					{
						if (ds.isNull(row, spec.idx)) td.text(' ');
						else if (ds.colType(spec.idx) == DataSheetColumn.Molecule) this.renderMolecule(td, row, spec.idx);
						else this.renderPrimitive(td, row, spec.idx);
					}
					else if (spec.type == 'text') this.renderTextAspect(td, row, spec.aspect, spec.idx);
					else if (spec.type == 'graphic') this.renderGraphicAspect(td, row, spec.aspect, spec.idx);
				}

				row += blksz;
			}
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

	// assemble list of columns to use for the actual table: for a plain datasheet this is basically the sheet's own structure;
	// when aspects are involved, these can be switched out for dynamically produced text & graphics
	private determineColumns(aspects:Aspect[]):EmbedCollectionColumn[]
	{
		let ds = this.ds;
		let columns:EmbedCollectionColumn[] = [];

		let reserved = Vec.booleanArray(false, ds.numCols);
		let names:string[] = [];
		for (let n = 0; n < ds.numCols; n++) names.push(ds.colName(n));

		for (let aspect of aspects)
		{
			// NOTE: fetching of titles is very inefficient; redesign aspect, or cache row 0 for later use
			if (ds.numRows > 0) for (let n = 0, num = aspect.numTextRenderings(0); n < num; n++)
			{
				let title = aspect.produceTextRendering(0, n).name;
				columns.push({'name': title, 'aspect': aspect, 'type': 'text', 'idx': n});
			}
			if (ds.numRows > 0) for (let n = 0, num = aspect.numGraphicRenderings(0); n < num; n++)
			{
				let title = aspect.produceGraphicRendering(0, n, this.policy).name;
				columns.push({'name': title, 'aspect': aspect, 'type': 'graphic', 'idx': n});
			}

			let claimed = aspect.areColumnsReserved(names);
			for (let n = 0; n < names.length; n++) reserved[n] = reserved[n] || claimed[n];
		}

		for (let n = 0; n < ds.numCols; n++) if (!reserved[n] && ds.colType(n) != DataSheetColumn.Extend)
		{
			columns.push({'name': ds.colName(n), 'aspect': null, 'type': null, 'idx': n});
		}

		// TODO: reordering based on occurrence in natural order? right now aspects all go first; collect up a parallel
		// 'pri' array which is col# for primitives, and first occurrence in column name list for aspects; use to sort

		return columns;
	}

	// rendering specifics for individual cells
	private renderPrimitive(td:JQuery, row:number, col:number):void
	{
		let txt = '', ct = this.ds.colType(col), align = 'center';
		if (ct == DataSheetColumn.String) {txt = this.ds.getString(row, col); align = 'left';}
		else if (ct == DataSheetColumn.Integer) txt = this.ds.getInteger(row, col).toString();
		else if (ct == DataSheetColumn.Real) txt = this.ds.getReal(row, col).toString();
		else if (ct == DataSheetColumn.Boolean) txt = this.ds.getBoolean(row, col) ? 'true' : 'false';
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
	private renderTextAspect(td:JQuery, row:number, aspect:Aspect, idx:number):void
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
	private renderGraphicAspect(td:JQuery, row:number, aspect:Aspect, idx:number):void
	{
		let metavec = aspect.produceGraphicRendering(row, idx, this.policy).metavec;
		if (metavec == null) {td.text(' '); return;}

		td.css('text-align', 'center');
		metavec.normalise();
		$(metavec.createSVG()).appendTo(td);
	}
}

/* EOF */ }