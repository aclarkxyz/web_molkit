/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {DOM, dom} from '../util/dom';
import {Box} from '../util/Geom';
import {installInlineCSS} from '../util/Theme';

/*
	Tooltips: adding popovers to widgets.
*/

const CSS_TOOLTIP = `
    *.wmk-tooltip-outer
    {
		position: absolute;
		border-radius: 4px;
		border: 1px solid black;
		background-color: white;
		padding: 1px;
		pointer-events: none;
        font-family: 'Open Sans', sans-serif;
		font-size: 14px;
    }
	*.wmk-tooltip-inner
	{
		color: white;
		border-radius: 4px;
		background-color: black;
		padding: 0.3em;
		max-width: calc(min(40em, 50vw));
	}
`;

let globalTooltip:Tooltip = null;
let globalPopWatermark = 0;

// adds a well behaved tooltip to the given node (element or JQuery object)
export function addTooltip(parent:any, bodyHTML:string, titleHTML?:string, delay?:number):void
{
	installInlineCSS('tooltip', CSS_TOOLTIP);

	let widget = dom(parent);
	let tooltip = new Tooltip(widget, bodyHTML, titleHTML, delay == null ? 1000 : delay);

	widget.onMouseEnter(() => tooltip.start());
	widget.onMouseLeave(() => tooltip.stop());
}

// variation of above where the body content is created by a callback function: use when content is expensive
export function addTooltipPromise(parent:any, bodyCallback:() => Promise<string>, titleHTML?:string, delay?:number):void
{
	installInlineCSS('tooltip', CSS_TOOLTIP);

	let widget = dom(parent);
	let tooltip = new Tooltip(widget, null, titleHTML, delay == null ? 1000 : delay);
	tooltip.bodyCallback = bodyCallback;

	widget.onMouseEnter(() => tooltip.start());
	widget.onMouseLeave(() => tooltip.stop());
}

// immediately raise a tooltip, with a position relative to a given widget
export function raiseToolTip(parent:any, avoid:Box, bodyHTML:string, titleHTML?:string):void
{
	installInlineCSS('tooltip', CSS_TOOLTIP);

	clearTooltip();
	globalPopWatermark++;
	new Tooltip(dom(parent), bodyHTML, titleHTML, 0).start(avoid);
}

// rudely shutdown the tooltip
export function clearTooltip():void
{
	if (globalTooltip == null) return;
	globalPopWatermark++;
	globalTooltip.stop();
}

export class Tooltip
{
	public bodyCallback:() => Promise<string>;

	private watermark:number;
	private domTooltip:DOM = null;

	constructor(private widget:DOM, private bodyHTML:string, private titleHTML:string, private delay:number)
	{
	}

	// raise the tooltip after a delay, assuming someone else hasn't bogarted it in the meanwhile
	public start(avoid?:Box)
	{
		this.watermark = ++globalPopWatermark;

		(async () =>
		{
			if (this.bodyHTML == null && this.bodyCallback) this.bodyHTML = await this.bodyCallback();

			window.setTimeout(() =>
			{
				if (this.watermark == globalPopWatermark) this.raise(avoid);
			}, this.delay);
		})();
	}

	// lower the tooltip, if it is still owned by this widget
	public stop()
	{
		if (this.domTooltip)
		{
			this.domTooltip.remove();
			this.domTooltip = null;
		}
		//globalPopWatermark++;
		this.watermark = -1; // stop any raise in progress
	}

	public raise(avoid?:Box)
	{
		if (!this.widget.exists()) return; // 'tis gone

		globalTooltip = this;
		if (this.domTooltip) return;

		let pop = this.domTooltip = dom('<div/>').class('wmk-tooltip-outer').css({'visibility': 'hidden'}).appendTo(document.body);

		// special deal: if the parent widget has an ancestor with z-index set, then perpetuate that kludge
		let sanity = 50;
		for (let ancestor = this.widget; ancestor; ancestor = ancestor.parent())
		{
			if (--sanity == 0) break;
			let zindex = parseInt(ancestor.elHTML.style.zIndex);
			if (zindex > 0)
			{
				pop.setCSS('z-index', (zindex + 1000).toString());
				break;
			}
		}

		let div = dom('<div/>').appendTo(pop).class('wmk-tooltip-inner');

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

			pop.css({'left': `${posX}px`, 'top': `${posY}px`, 'visibility': 'visible'});
		};

		pop.css({'left': '0px', 'top': '0px'});
		setTimeout(() => setPosition(), 1);

		let checkParent = () =>
		{
			if (this.watermark != globalPopWatermark || !this.widget.isVisible() || !this.widget.exists())
				this.stop();
			else
				setTimeout(checkParent, 100);
		};
		setTimeout(checkParent, 100);
	}
}

