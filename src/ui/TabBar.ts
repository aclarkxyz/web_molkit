/*
    WebMolKit

    (c) 2010-2020 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	TabBar: a series of option buttons with a common area underneath it, of which just one can be selected & visible.
*/

export class TabBar extends Widget
{
	private unionHeight = false; // if true, height of tab bar will be set to the maximum of all components

	private selidx = 0;
	private buttonDiv:JQuery[] = [];
	private panelDiv:JQuery[] = [];
	private padding = 6; // pixels

	public callbackSelect:(idx:number, source?:TabBar) => void = null;

	// ------------ public methods ------------

	constructor(public options:string[])
	{
		super();

		if (!hasInlineCSS('tabbar')) installInlineCSS('tabbar', this.composeCSS());
	}

	// control over selected index
	public getSelectedIndex():number
	{
		return this.selidx;
	}
	public getSelectedValue():string
	{
		return this.options[this.selidx];
	}

	// return the panel: each of these needs to be individually filled
	public getPanel(idxOrName:number | string):JQuery
	{
		let idx = typeof idxOrName == 'number' ? idxOrName as number : this.options.indexOf(idxOrName);
		if (idx < 0) return null;
		return this.panelDiv[idx];
	}

	// create the underlying structure; the parent parameter must be jQuery-compatible
	public render(parent:any):void
	{
		super.render(parent);

		let grid = $('<div/>').appendTo(this.content).css('display', 'grid');
		grid.css({'align-items': 'center', 'justify-content': 'start', 'grid-row-gap': '0.5em'});
		let columns = '[start] 1fr ';
		for (let n = 0; n < this.options.length; n++) columns += '[btn' + n + '] auto ';
		columns += '[btnX] 1fr [end]';
		grid.css('grid-template-columns', columns);

		let underline = $('<div/>').appendTo(grid);
		underline.css({'grid-column': 'start / end', 'grid-row': '1', 'height': '100%'});
		underline.css('border-bottom', '1px solid #C0C0C0');

		for (let n = 0; n < this.options.length; n++)
		{
			let outline = $('<div class="wmk-tabbar-cell"/>').appendTo(grid);
			outline.css({'grid-column': 'btn' + n, 'grid-row': '1'});
			let btn = $('<div class="wmk-tabbar"/>').appendTo(outline);
			btn.css('padding', this.padding + 'px');
			this.buttonDiv.push(btn);

			let panel = $('<div/>').appendTo(grid);
			panel.css({'grid-column': 'start / end', 'grid-row': '2'});
			panel.css({'align-self': 'start', 'justify-self': 'center', 'width': '100%'});
			this.panelDiv.push(panel);
		}

		this.updateButtons();
	}

	// tab-button clicked, so change content
	public clickButton(idx:number):void
	{
		if (idx == this.selidx) return; // (shouldn't happen)

		this.setSelectedIndex(idx);

		if (this.callbackSelect) this.callbackSelect(idx, this);
	}

	// change selected index, update widgets
	public setSelectedIndex(idx:number):void
	{
		if (this.selidx == idx) return;
		this.selidx = idx;
		this.updateButtons();
	}
	public setSelectedValue(val:string):void
	{
		let idx = this.options.indexOf(val);
		if (idx >= 0) this.setSelectedIndex(idx);
	}

	// ------------ private methods ------------

	// updates selection state of buttons, either first time or after change
	private updateButtons():void
	{
		for (let n = 0; n < this.options.length && n < this.buttonDiv.length; n++)
		{
			let div = this.buttonDiv[n];

			let txt = this.options[n];
			if (txt.length == 0 && n == this.selidx) div.text('\u00A0\u2716\u00A0');
			else if (txt.length == 0) div.text('\u00A0\u00A0\u00A0');
			else div.text(txt);

			div.off('mouseover');
			div.off('mouseout');
			div.off('mousedown');
			div.off('mouseup');
			div.off('mouseleave');
			div.off('mousemove');
			div.off('click');
			div.removeClass('wmk-tabbar-hover wmk-tabbar-active wmk-tabbar-unselected wmk-tabbar-selected');

			if (n != this.selidx)
			{
				div.addClass('wmk-tabbar-unselected');
				div.mouseover(() => div.addClass('wmk-tabbar-hover'));
				div.mouseout(() => div.removeClass('wmk-tabbar-hover wmk-tabbar-active'));
				div.mousedown(() => div.addClass('wmk-tabbar-active'));
				div.mouseup(() => div.removeClass('wmk-tabbar-active'));
				div.mouseleave(() => div.removeClass('wmk-tabbar-hover wmk-tabbar-active'));
				div.mousemove(() => false);
				div.click(() => this.clickButton(n));
			}
			else div.addClass('wmk-tabbar-selected');

			if (this.unionHeight)
				this.panelDiv[n].css('visibility', n == this.selidx ? 'visible' : 'hidden');
			else
				this.panelDiv[n].css('display', n == this.selidx ? 'block': 'none');
		}
	}

	// one-time instantiation of necessary styles
	private composeCSS():string
	{
		let lowlight = colourCode(Theme.lowlight), lowlightEdge1 = colourCode(Theme.lowlightEdge1), lowlightEdge2 = colourCode(Theme.lowlightEdge2);
		let highlight = colourCode(Theme.highlight), highlightEdge1 = colourCode(Theme.highlightEdge1), highlightEdge2 = colourCode(Theme.highlightEdge2);

		return `
			.wmk-tabbar
			{
				margin-bottom: 0;
				font-family: 'Open Sans', sans-serif;
				font-size: 14px;
				font-weight: normal;
				text-align: center;
				white-space: nowrap;
				vertical-align: middle;
				-ms-touch-action: manipulation; touch-action: manipulation;
				cursor: pointer;
				-webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;
			}
			.wmk-tabbar-selected
			{
				color: white;
				background-color: #008FD2;
				background-image: linear-gradient(to right bottom, ${lowlightEdge1}, ${lowlightEdge2});
			}
			.wmk-tabbar-unselected
			{
				color: #333;
				background-color: white;
				background-image: linear-gradient(to right bottom, #FFFFFF, #E0E0E0);
			}
			.wmk-tabbar-table
			{
				margin: 1px;
				padding: 0;
				border-width: 0;
				border-collapse: collapse;
			}
			.wmk-tabbar-cell
			{
				margin: 0 -1px -1px 0;
				padding: 0;
				border-width: 0;
				border-width: 1px;
				border-style: solid;
				border-color: #808080;
			}
			.wmk-tabbar-hover
			{
				background-color: #808080;
				background-image: linear-gradient(to right bottom, #F0F0F0, #D0D0D0);
			}
			.wmk-tabbar-active
			{
				background-color: #00C000;
				background-image: linear-gradient(to right bottom, ${highlightEdge1}, ${highlightEdge2});
			}
		`;
	}
}

/* EOF */ }