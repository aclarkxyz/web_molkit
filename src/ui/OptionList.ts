/*
    WebMolKit

    (c) 2010-2017 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='Widget.ts'/>

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

class OptionList extends Widget
{
	public selidx = 0;
	public buttonDiv:any[] = [];
	public auxCell:any[] = [];
	public padding = 6; // pixels
	
	public callbackSelect:(idx:number, source?:OptionList) => void = null;
	
	constructor(private options:string[], private isVertical:boolean = false)
	{
		super();
		if (options.length == 0) throw 'molsync.ui.OptionList: must provide a list of option labels.';
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
		return this.auxCell[idx];
	}

	// create the underlying structure; the parent parameter must be jQuery-compatible
	public render(parent:any):void
	{
		super.render(parent);
		
		let table = $('<table class="option-table"></table>').appendTo(this.content /*span*/);
		let tr = this.isVertical ? null : $('<tr></tr>').appendTo(table);
		
		for (let n = 0; n < this.options.length; n++)
		{
			if (this.isVertical) tr = $('<tr></tr>').appendTo(table);
			let td = $('<td class="option-cell"></td>').appendTo(tr); 
			let div = $('<div class="option"></div>').appendTo(td);
			div.css('padding', this.padding + 'px');
			
			this.buttonDiv.push(div);
			
			if (this.isVertical)
			{
				td = $('<td style="vertical-align: middle;"></td>').appendTo(tr);
				this.auxCell.push(td);
			}
		}

		this.updateButtons();
	}


	// perform some checks before rendering
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
			div.removeClass('option-hover option-active option-unselected option-selected');

			if (n != this.selidx)
			{
				div.addClass('option-unselected');
				div.mouseover(() => div.addClass('option-hover'));
				div.mouseout(() => div.removeClass('option-hover option-active'));
				div.mousedown(() => div.addClass('option-active'));
				div.mouseup(() => div.removeClass('option-active'));
				div.mouseleave(() => div.removeClass('option-hover option-active'));
				div.mousemove(() => {return false;});
				div.click(() => this.clickButton(n));
			}
			else div.addClass('option-selected');
		}
	}

}