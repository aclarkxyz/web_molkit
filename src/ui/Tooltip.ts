/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../decl/jquery/index.d.ts'/>

namespace WebMolKit /* BOF */ {

/*
	Tooltips: adding popovers to widgets.
*/

let globalPopover:JQuery = null;
let globalTooltip:Tooltip = null;
let globalPopWatermark = 0;

// adds a well behaved tooltip to the given node (element or JQuery object)
export function addTooltip(parent:any, bodyHTML:string, titleHTML?:string, delay?:number):void
{
	Tooltip.ensureGlobal();

	let widget = $(parent);

	const tooltip = new Tooltip(widget, bodyHTML, titleHTML, delay == null ? 1000 : delay);

	widget.mouseenter(() => tooltip.start());
	widget.mouseleave(() => tooltip.stop());
}

// immediately raise a tooltip, with a position relative to a given widget
export function raiseToolTip(widget:any, avoid:Box, bodyHTML:string, titleHTML?:string):void
{
	clearTooltip();
	Tooltip.ensureGlobal();
	new Tooltip($(widget), bodyHTML, titleHTML, 0).raise(avoid);
}

// rudely shutdown the tooltip
export function clearTooltip():void
{
	if (globalTooltip == null) return;
	globalPopWatermark++;
	globalTooltip.lower();
}

export class Tooltip
{
	private watermark:number;

	public static ensureGlobal()
	{
		if (globalPopover == null)
		{
			globalPopover = $(document.createElement('div'));
			globalPopover.css('position', 'absolute');
			globalPopover.css('background-color', '#F0F0FF');
			globalPopover.css('background-image', 'linear-gradient(to right bottom, #FFFFFF, #D0D0FF)');
			globalPopover.css('color', 'black');
			globalPopover.css('border', '1px solid black');
			globalPopover.css('z-index', 22000);
			globalPopover.css('border-radius', '4px');
			globalPopover.hide();
			globalPopover.appendTo(document.body);
		}
	}

	constructor(private widget:JQuery, private bodyHTML:string, private titleHTML:string, private delay:number)
	{
	}

	// raise the tooltip after a delay, assuming someone else hasn't bogarted it in the meanwhile
	public start()
	{
		globalPopover.hide();
		this.watermark = ++globalPopWatermark;
		//console.log('START:[' + this.bodyHTML + '] watermark=' + this.watermark);

		window.setTimeout(() =>
		{
			if (this.watermark == globalPopWatermark) this.raise();
		}, this.delay);
	}

	// lower the tooltip, if it is still owned by this widget
	public stop()
	{
		//console.log('STOP:[' + this.bodyHTML + '] watermark=' + this.watermark + '/' + globalPopWatermark);
		if (this.watermark == globalPopWatermark) this.lower();
		globalPopWatermark++;
	}

	public raise(avoid?:Box)
	{
		//let pageWidth = $(document).width(), pageHeight = $(document).height();
		globalTooltip = this;

		let pop = globalPopover;
		pop.css('max-width', '20em');
		pop.empty();
		let div = $('<div></div>').appendTo(pop);
		div.css('padding', '0.3em');

		let hasTitle = this.titleHTML != null && this.titleHTML.length > 0, hasBody = this.bodyHTML != null && this.bodyHTML.length > 0;

		if (hasTitle) ($('<div></div>').appendTo(div)).html('<b>' + this.titleHTML + '</b>');
		if (hasTitle && hasBody) div.append('<hr>');
		if (hasBody) ($('<div></div>').appendTo(div)).html(this.bodyHTML);

		// to-do: title, if any

		let winW = $(window).width(), winH = $(window).height();
		const GAP = 2;
		let wx1 = this.widget.offset().left, wy1 = this.widget.offset().top;
		let wx2 = wx1 + this.widget.width(), wy2 = wy1 + this.widget.height();

		// if more specific positioning is requested within the widget, adjust accordingly
		if (avoid)
		{
			wx1 += avoid.x;
			wy1 += avoid.y;
			wx2 = wx1 + avoid.w;
			wy2 = wy1 + avoid.h;
		}

		let setPosition = () =>
		{
			let popW = pop.width(), popH = pop.height();
			let posX = 0, posY = 0;
			if (wx1 + popW < winW) posX = wx1;
			else if (popW < wx2) posX = wx2 - popW;
			if (wy2 + GAP + popH < winH) posY = wy2 + GAP;
			else if (wy1 - GAP - popH > 0) posY = wy1 - GAP - popH;
			else posY = wy2 + GAP;

			pop.css('left', `${posX}px`);
			pop.css('top', `${posY}px`);
		};

		setPosition();
		pop.show();
		window.setTimeout(() => setPosition(), 1);
	}

	public lower()
	{
		let pop = globalPopover;
		pop.hide();
	}
}

/* EOF */ }