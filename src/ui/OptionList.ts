/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

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
	selidx = 0;
	buttonDiv:any[] = [];
	auxCell:any[] = [];
	
	callback:(idx:number, source?:OptionList) => void = null;
	master:any;
	
	constructor(private options:string[], private isVertical:boolean = false)
	{
		super();
		if (options.length == 0) throw 'molsync.ui.OptionList: must provide a list of option labels.';
	}
	
	public onSelect(callback:(idx:number, source?:OptionList) => void, master:any)
	{
		this.callback = callback;
		this.master = master;
	}

	// control over selected index
	public getSelectedIndex():number
	{
		return this.selidx;
	};
	public getSelectedValue():string
	{
		return this.options[this.selidx];
	};

	// requests an "auxiliary cell" for a vertical control, into which additional information may be placed
	public getAuxiliaryCell(idx:number):Element
	{
		return this.auxCell[idx];
	};

	// create the underlying structure; the parent parameter must be jQuery-compatible
	public render(parent:any)
	{
		super.render(parent);
		
		/*
		let span = $('<span></span>').appendTo($(parent));
		span.css('position', 'relative');
		span.css('display', 'inline-block');
		span.attr('tabIndex', -1);
		*/
		
		let table = $('<table class="option-table"></table>').appendTo(this.content /*span*/);
		let tr = this.isVertical ? null : $('<tr></tr>').appendTo(table);
		
		for (var n = 0; n < this.options.length; n++)
		{
			if (this.isVertical) tr = $('<tr></tr>').appendTo(table);
			let td = $('<td class="option-cell"></td>').appendTo(tr); 
			let div = $('<div class="option"></div>').appendTo(td);

			if (n != this.selidx)
				div.addClass('option-unselected');
			else
				div.addClass('option-selected');
			
			let txt = this.options[n];
			if (txt.length == 0 && n == this.selidx) div.append('\u00A0\u2716\u00A0');
			else if (txt.length == 0) div.append('\u00A0\u00A0\u00A0');
			else div.append(txt); 

			if (n != this.selidx)
			{
				div.mouseover(function() {$(this).addClass('option-hover');});
				div.mouseout(function() {$(this).removeClass('option-hover option-active');});
				div.mousedown(function() {$(this).addClass('option-active');});
				div.mouseup(function() {$(this).removeClass('option-active');});
				div.mouseleave(function() {$(this).removeClass('option-hover option-active');});
				div.mousemove(function() {return false;});
				
				const idx = n, self = this;
				div.click(function() {self.clickButton(idx);});
			}
			
			this.buttonDiv.push(div);
			
			if (this.isVertical)
			{
				td = $('<td style="vertical-align: middle;"></td>').appendTo(tr);
				this.auxCell.push(td);
			}
		}
	};

	// perform some checks before rendering
	public clickButton(idx:number)
	{
		if (idx == this.selidx) return; // (shouldn't happen)
		
		this.setSelectedIndex(idx);

		if (this.callback) this.callback.call(this.master, idx, this);		
	};	
		
	// change selected index, update widgets
	public setSelectedIndex(idx:number)
	{
		if (this.selidx == idx) return;
		
		// unadorn old selection
		
		let div = this.buttonDiv[this.selidx];
		//this.content = div;
		div.attr('class', 'option option-unselected');
		if (this.options[this.selidx].length == 0) div.text('\u00A0\u00A0\u00A0');
		
		div.mouseover(function() {$(this).addClass('option-hover');});
		div.mouseout(function() {$(this).removeClass('option-hover option-active');});
		div.mousedown(function() {$(this).addClass('option-active');});
		div.mouseup(function() {$(this).removeClass('option-active');});
		div.mouseleave(function() {$(this).removeClass('option-hover option-active');});
		div.mousemove(function() {return false;});
		
		const clickidx = this.selidx, self = this;
		div.click(function() {self.clickButton(clickidx);});

		// adorn new selection
		
		this.selidx = idx;
		div = this.buttonDiv[this.selidx];

		div.attr('class', 'option option-selected');
		if (this.options[this.selidx].length == 0) div.text('\u00A0\u2716\u00A0');

		div.off('mouseover');
		div.off('mouseout');
		div.off('mousedown');
		div.off('mouseup');
		div.off('mouseleave');
		div.off('mousemove');
		div.off('click');
	};
}