/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {DOM, dom} from '../util/dom';
import {Box} from '../util/Geom';

/*
	Tooltips: adding popovers to widgets.
*/

let globalPopover:DOM = null;
let globalTooltip:Tooltip = null;
let globalPopWatermark = 0;

// adds a well behaved tooltip to the given node (element or DOM object)
export function addTooltip(parent:any, bodyHTML:string, titleHTML?:string, delay?:number):void
{
	Tooltip.ensureGlobal();

	if (parent.jquery) parent = parent[0];

	let widget = dom(parent);
	let tooltip = new Tooltip(widget, bodyHTML, titleHTML, delay == null ? 1000 : delay);

	widget.onMouseEnter(() => tooltip.start());
	widget.onMouseLeave(() => tooltip.stop());
}

// immediately raise a tooltip, with a position relative to a given widget
export function raiseToolTip(parent:any, avoid:Box, bodyHTML:string, titleHTML?:string):void
{
	if (parent.jquery) parent = parent[0];

	clearTooltip();
	Tooltip.ensureGlobal();
	new Tooltip(dom(parent), bodyHTML, titleHTML, 0).raise(avoid);
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
			globalPopover = dom('<div/>').css({'position': 'absolute', 'z-index': 22000, 'display': 'none'});
			globalPopover.css({'background-color': '#F0F0FF', 'background-image': 'linear-gradient(to right bottom, #FFFFFF, #D0D0FF)'});
			globalPopover.css({'color': 'black', 'border': '1px solid black', 'border-radius': '4px'});
			globalPopover.appendTo(document.body);
		}
	}

	constructor(private widget:DOM, private bodyHTML:string, private titleHTML:string, private delay:number)
	{
	}

	// raise the tooltip after a delay, assuming someone else hasn't bogarted it in the meanwhile
	public start()
	{
		globalPopover.setCSS('display', 'none');
		this.watermark = ++globalPopWatermark;

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
		if (!this.widget.exists()) return; // 'tis gone

		globalTooltip = this;

		let pop = globalPopover;
		pop.css({'max-width': '20em'});
		pop.empty();
		let div = dom('<div/>').appendTo(pop).css({'padding': '0.3em'});

		let hasTitle = this.titleHTML != null && this.titleHTML.length > 0, hasBody = this.bodyHTML != null && this.bodyHTML.length > 0;

		if (hasTitle) dom('<div/>').appendTo(div).setHTML('<b>' + this.titleHTML + '</b>');
		if (hasTitle && hasBody) div.appendHTML('<hr/>');
		if (hasBody) dom('<div/>').appendTo(div).setHTML(this.bodyHTML);

		// to-do: title, if any

		let winW = window.innerWidth, winH = window.innerHeight;
		const GAP = 2;
		let boundDiv = this.widget.el.getBoundingClientRect();
		let wx1 = boundDiv.left, wy1 = boundDiv.top;
		let wx2 = wx1 + boundDiv.width, wy2 = wy1 + boundDiv.height;

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

			posX += window.pageXOffset;
			posY += window.pageYOffset;

			pop.css({'left': `${posX}px`, 'top': `${posY}px`});
		};

		setPosition();
		pop.setCSS('display', 'block');
		setTimeout(() => setPosition(), 1);

		let checkParent = () =>
		{
			if (this.watermark != globalPopWatermark) return; // someone else owns it now
			if (!this.widget.isVisible())
				pop.setCSS('display', 'none');
			else
				setTimeout(checkParent, 100);
		};
		setTimeout(checkParent, 100);
	}

	public lower()
	{
		let pop = globalPopover;
		pop.setCSS('display', 'none');
	}
}

