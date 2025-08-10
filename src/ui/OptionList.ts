/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {dom, DOM} from '../util/dom';
import {hasInlineCSS, installInlineCSS, Theme} from '../util/Theme';
import {colourCode} from '../util/util';
import {Widget} from './Widget';

/*
	OptionList: a replacement for the ghetto native HTML radio buttons. Can be used in either horizontal or vertical mode. Rendering
	style looks like several custom buttons that are joined together, and the current one is highlighted and unclickable. For
	vertical mode, slots are reserved so that text can be added to the right each option.

	Note that there is always one index selected. It is

	Content:
		.options: array of strings for use as labels
		.isVertical: boolean (default: false)
		.selidx: selected option (0 .. options.length-1)
		.buttonDiv1, .buttonDiv2: arrays of DOM elements, one for each option
		.auxCell: vertical only; a list of <td> DOM elements for optional associated content
*/

export class OptionList extends Widget
{
	public padding = 6; // pixels
	public htmlLabels = false; // switch this on if the labels are HTML rather than text
	public numCols = 0; // optional: if 0, everything is on one line

	private selidx = 0;
	private buttonDiv:DOM[] = [];
	private auxCell:DOM[] = [];
	private isDisabled:boolean[] = null;

	public callbackSelect:(idx:number, source?:OptionList) => void = null;

	constructor(public options:string[], private isVertical:boolean = false)
	{
		super();
		if (options.length == 0) throw 'molsync.ui.OptionList: must provide a list of option labels.';

		if (!hasInlineCSS('option')) installInlineCSS('option', this.composeCSS());
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

	// requests an "auxiliary cell" for a vertical control, into which additional information may be placed
	public getAuxiliaryCell(idx:number):Element
	{
		return this.auxCell[idx].el;
	}

	// provide the change of state handler
	public onSelect(callback:(idx:number, source?:OptionList) => void):void
	{
		this.callbackSelect = callback;
	}

	// optionally set some of the formats to being disabled
	public setDisabled(isDisabled:boolean[]):void
	{
		this.isDisabled = isDisabled;
		this.updateButtons();
	}

	// create the underlying structure; the parent parameter must be jQuery-compatible
	public render(parent:any):void
	{
		super.render(parent);

		this.contentDOM.css({'display': 'block', 'baseline-shift': '1.5em'});

		this.buttonDiv = [];
		this.auxCell = [];

		let table = dom('<table class="wmk-option-table"/>').appendTo(this.contentDOM);
		let tr = this.isVertical ? null : dom('<tr/>').appendTo(table);

		for (let n = 0; n < this.options.length; n++)
		{
			if (this.isVertical || (this.numCols > 0 && n > 0 && n % this.numCols == 0)) tr = dom('<tr/>').appendTo(table);
			let td = dom('<td class="wmk-option-cell"/>').appendTo(tr);
			let div = dom('<div class="wmk-option"/>').appendTo(td);
			div.css({'padding': `${this.padding}px`});

			div.onClick(() => this.clickButton(n));

			this.buttonDiv.push(div);

			if (this.isVertical)
			{
				td = dom('<td style="vertical-align: middle;"/>').appendTo(tr);
				this.auxCell.push(td);
			}
		}

		this.updateButtons();
	}

	// perform some checks before rendering
	public clickButton(idx:number):void
	{
		if (idx == this.selidx) return;
		if (this.isDisabled && this.isDisabled[idx]) return;

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
			if (txt.length == 0 && n == this.selidx) div.setText('\u00A0\u2716\u00A0');
			else if (txt.length == 0) div.setText('\u00A0\u00A0\u00A0');
			else if (this.htmlLabels) div.setHTML(txt);
			else div.setText(txt);

			div.removeClass('wmk-option-unselected wmk-option-selected');

			if (this.isDisabled && this.isDisabled[n]) div.addClass('wmk-option-disabled');
			else if (n != this.selidx) div.addClass('wmk-option-unselected');
			else div.addClass('wmk-option-selected');
		}
	}

	// one-time instantiation of necessary styles
	private composeCSS():string
	{
		let lowlight = colourCode(Theme.lowlight), lowlightEdge1 = colourCode(Theme.lowlightEdge1), lowlightEdge2 = colourCode(Theme.lowlightEdge2);
		let highlight = colourCode(Theme.highlight), highlightEdge1 = colourCode(Theme.highlightEdge1), highlightEdge2 = colourCode(Theme.highlightEdge2);

		return `
			.wmk-option
			{
				margin-bottom: 0;
				font-family: 'Open Sans', sans-serif;
				font-size: 14px;
				font-weight: normal;
				text-align: center;
				white-space: nowrap;
				line-height: 1.2em;
				cursor: pointer;
			}
			.wmk-option-selected
			{
				color: white;
				background-color: #008FD2;
				background-image: linear-gradient(to right bottom, ${lowlightEdge1}, ${lowlightEdge2});
			}
			.wmk-option-unselected
			{
				color: #333;
				background-color: white;
				background-image: linear-gradient(to right bottom, #FFFFFF, #E0E0E0);
			}
			.wmk-option-unselected:hover
			{
				background-color: #808080;
				background-image: linear-gradient(to right bottom, #F0F0F0, #D0D0D0);
			}
			.wmk-option-unselected:active
			{
				color: white;
				background-color: #00C000;
				background-image: linear-gradient(to right bottom, ${highlightEdge1}, ${highlightEdge2});
			}
			.wmk-option-disabled
			{
				color: #C0C0C0;
				cursor: not-allowed;
			}
			.wmk-option-table
			{
				margin: 1px;
				padding: 0;
				border-width: 0;
				border-collapse: collapse;
			}
			.wmk-option-cell
			{
				margin: 0;
				padding: 0;
				border-width: 0;
				border-width: 1px;
				border-style: solid;
				border-color: #808080;
			}
		`;
	}
}

