/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../gfx/MetaVector.ts'/>
///<reference path='Widget.ts'/>

namespace WebMolKit /* BOF */ {

/*
	RowView: a heavyweight widget designed to show a collection of datasheet rows, which can be manipulated fairly easily.
	It will typically be decorated by various control widgets that affect the content and style.
*/

interface RowViewEntry
{
	dataXML:string;
	datasheetID:number;
	row:number;
	len:number;

	tr?:JQuery;
	tdStyle?:string;
	watermark?:number;
}

export class RowView extends Widget
{
	private entries:RowViewEntry[] = null;
	private watermark = 0;

	constructor(private tokenID:string)
	{
		super();
	}

	// replace the content; not actioned until the render function is called
	public defineEntries(entries:any[]):void
	{
		this.entries = entries;
	}

	// create the objects necessary to render the widget; this function should be called after basic pre-initialisation settings, e.g.
	// specifying the starting molecule, initial size, etc.
	public render(parent:any):void
	{
		super.render(parent);

		//if (!this.metavec) throw 'molsync.ui.RowView.render must be preceded by a call to setup';
		if (this.entries == null) throw 'molsync.ui.RowView: entries must be defined before rendering';

		//let div = $('<div></div>').appendTo($(parent));

		let tableStyle = 'border-collapse: collapse;';
		let table = $('<table></table>').appendTo(this.content);
		table.attr('style', tableStyle);

		let roster:any[] = [];
		this.watermark++;

		for (let n = 0; n < this.entries.length; n++)
		{
			let entry = this.entries[n];
			entry.tr = $('<tr></tr>').appendTo(table);

			// make a copy for pushing onto the roster
			entry = clone(entry) as RowViewEntry;
			entry.tdStyle = '';
			if (n > 0) entry.tdStyle += 'border-top: 1px solid #80C080;';
			if (n < this.entries.length - 1) entry.tdStyle += 'border-bottom: 1px solid #80C080;';
			entry.watermark = this.watermark;
			roster.push(entry);
		}

		// process each roster line in turn to build the table; will be stopped if the watermark changes in another thread
		let fcnComposure = (result:any, error:ErrorRPC):void =>
		{
			let entry = roster.shift();
			if (entry.watermark != this.watermark) return;
			if (error != null) throw 'molsync.ui.RowView: failed to obtain document composition: ' + error.message;

			let nodes:any[] = [];
			for (let n = 0; n < result.doc.nodes.length; n++)
			{
				let node = result.doc.nodes[n];

				// for experiments, only want to show the basic content in a row view
				let src = node.src;
				if (src.startsWith('experiment:') && src != 'experiment:header' && src != 'experiment:scheme') continue;

				nodes.push(node);
			}

			for (let n = 0; n < nodes.length; n++)
			{
				let tdStyle = entry.tdStyle + 'vertical-align: top;';
				if (n > 0) tdStyle += 'border-left: 1px solid #80C080;';
				if (n < nodes.length - 1) tdStyle += 'border-right: 1px solid #80C080;';
				if (nodes[n].type != 'graphics') tdStyle += 'padding: 0.5em;';

				let td = $('<td></td>').appendTo(entry.tr);
				td.attr('style', tdStyle);
				this.renderNode(td, nodes[n]);
			}

			if (roster.length > 0) Func.composeDocument({'tokenID': this.tokenID, 'dataXML': roster[0].dataXML, 'subsumeTitle': true}, fcnComposure);
		};
		if (roster.length > 0) Func.composeDocument({'tokenID': this.tokenID, 'dataXML': roster[0].dataXML, 'subsumeTitle': true}, fcnComposure);
	}

	// instantiate a composed node, within the HTML hierarchy
	private renderNode(parent:JQuery, node:any):void
	{
		if (node.type == 'line') this.renderLine(parent, node, true);
		else if (node.type == 'link') this.renderLink(parent, node);
		else if (node.type == 'graphics') this.renderGraphics(parent, node);
		else if (node.type == 'para') this.renderPara(parent, node);
		else if (node.type == 'matrix') this.renderMatrix(parent, node);
	}

	// creates the objects for a "line" of text
	private renderLine(parent:JQuery, node:any, inPara:boolean):void
	{
		if (inPara) parent = $(newElement(parent, 'p'));

		if (node.title)
		{
			addText(newElement(parent,'b'), node.title);
			addText(parent[0], ': ');
		}

		if (node.bold) parent = $(newElement(parent, 'b'));
		if (node.italic) parent = $(newElement(parent, 'i'));
		if (node.underline) parent = $(newElement(parent, 'u'));
		if (node.formula)
			this.renderFormula(parent, node.text);
		else
			addText(parent, node.text);
	}

	// creates the objects for a URL
	private renderLink(parent:JQuery, node:any):void
	{
		if (node.title)
		{
			addText(newElement(parent,'b'), node.title);
			addText(parent[0], ': ');
		}

		let ahref = newElement(parent, 'a', {'href': node.url, 'target': '_blank'});
		addText(ahref, node.url);
	}

	// renders metagraphics as an inline graphical object
	private renderGraphics(parent:JQuery, node:any):void
	{
		let draw = new MetaVector(node.metavec);
		/*let canvas = new goog.graphics.createGraphics(draw.width, draw.height);
		canvas.render(parent);
		draw.render(canvas);*/
		draw.renderInto(parent);
	}

	// renders a paragraph (a vertical list of objects)
	private renderPara(parent:JQuery, node:any):void
	{
		//parent = newElement(parent, 'p');
		parent = $('<p></p>').appendTo(parent);
		for (let n = 0; n < node.nodes.length; n++)
		{
			let sub = node.nodes[n];
			if (n > 0) newElement(parent, 'br');
			if (sub.type == 'line')
				this.renderLine(parent, sub, false);
			else
				this.renderNode(parent, sub);
		}
	}

	// renders a matrix in the form of a table
	private renderMatrix(parent:JQuery, node:any):void
	{
		let ncols = node.ncols, nrows = node.nrows;

		let table = newElement(parent, 'table', {'class': 'data', 'style': 'margin: 0;'});
		let tableBody = newElement(table, 'tbody');

		for (let r = 0; r < nrows; r++)
		{
			let tableRow = newElement(tableBody, 'tr');
			for (let c = 0; c < ncols; c++)
			{
				let cell = node.matrix[r][c];
				let tableCell = newElement(tableRow, 'td', {'class': 'data'});
				this.renderNode($(tableCell), cell);
			}
		}
	}

	// adds a formula (with subscripts)
	private renderFormula(parent:JQuery, formula:string):void
	{
		for (let n = 0; n < formula.length; n++)
		{
			let ch = formula.charAt(n);
			if (ch == '|') {}
			else if (ch == '{')
			{
				let end = formula.indexOf('}', n + 1);
				if (end >= 0)
				{
					let snip = formula.substring(n + 1, end);
					addText(newElement(parent, 'sub'), snip);
					n = end;
				}
				else addText(parent, ch);
			}
			else addText(parent, ch);
		}
	}
}

/* EOF */ }