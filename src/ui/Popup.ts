/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {dom, DOM, domLegacy} from '../util/dom';
import {installInlineCSS} from '../util/Theme';
import {empiricalScrollerSize, setBoundaryPixels} from '../util/util';
import {clearTooltip} from './Tooltip';

/*
	Popup: a semi-transient widget that appears onscreen above all of the rest of the content. Clicking outside of the popup's
	area dismisses it, but moving the mouse around does not. Functionally it's like a cross between a dialog and a tooltip.

	To provide content, either subclass and override the populate() method, or provide a callback.
*/

const CSS_POPUP = `
	*.wmk-popup
	{
		font-family: 'Open Sans', sans-serif;
	}
`;

export class Popup
{
	private parent:DOM;

	// content information that can be accessed after opening
	protected domObscureBackground:DOM; // grey covering banner	
	protected domObscureForeground:DOM;
	protected domPanelBoundary:DOM; // the dialog outline itself
	protected domBody:DOM; // the main area, for content

	public popupBackground = 'white';
	public obscureOpacity = 0.2;
	public zindex:number = null; // optionally the use of zindex, to ensure it goes on top (usually not necessary)
	public callbackClose:(source?:Popup) => void = null;
	public callbackPopulate:(source?:Popup) => void = null;

	constructor(parent:any)
	{
		this.parent = domLegacy(parent);

		installInlineCSS('popup', CSS_POPUP);
	}

	public onClose(callback:(source?:Popup) => void)
	{
		this.callbackClose = callback;
	}

	// creates all the DOM objects and shows the dialog; details such as title should be setup before calling this
	public open():void
	{
		clearTooltip();

		let body = dom(document.body);

		//let zindex = 21000;

		let bg = this.domObscureBackground = dom('<div/>').appendTo(body);
		bg.css({'position': 'fixed'/*, 'z-index': zindex*/});
		bg.css({'left': '0', 'right': '0', 'top': '0', 'bottom': '0'});
		bg.css({'background-color': 'black', 'opacity': this.obscureOpacity});

		let fg = this.domObscureForeground = dom('<div/>').appendTo(body);
		fg.css({'position': 'fixed'/*, 'z-index': zindex + 1*/});
		fg.css({'left': '0', 'right': '0', 'top': '0', 'bottom': '0'});
		fg.onClick(() => this.close());

		if (this.zindex > 0)
		{
			bg.setCSS('z-index', this.zindex);
			fg.setCSS('z-index', this.zindex + 1);
		}

		let pb = this.domPanelBoundary = dom('<div class="wmk-popup"/>').appendTo(fg).css({'visibility': 'hidden'});
		pb.onClick((event:MouseEvent) => event.stopPropagation()); // don't let the click percolate upward to the close event
		pb.css({'background-color': this.popupBackground, 'border': '1px solid black'});
		pb.css({'position': 'absolute', 'overflow': 'auto'});

		this.domBody = dom('<div/>').appendTo(pb).css({'padding': '5px'});

		//bg.show();

		this.populate();
		this.positionAndShow();
	}

	// closes and hides the dialog
	public close():void
	{
		clearTooltip();

		this.domPanelBoundary.remove();
		this.domObscureBackground.remove();
		this.domObscureForeground.remove();

		if (this.callbackClose) this.callbackClose(this);

		clearTooltip();
	}

	// sizes may have changed, so adjust if necessary
	public bump():void
	{
		this.positionAndShow();
	}

	// use this to obtain the parts of the dialog box intended for modification
	public bodyDOM():DOM {return this.domBody;}

	// either subclass and override this, or provide the callback
	protected populate():void
	{
		if (this.callbackPopulate)
			this.callbackPopulate(this);
		else
			this.bodyDOM().setText('Empty popup.');
	}

	// have this called when the size may have changed, and need to update position
	private positionAndShow():void
	{
		clearTooltip();

		let winW = window.innerWidth, winH = window.innerHeight;
		const GAP = 2;
		let client = this.parent.el.getBoundingClientRect();
		let wx1 = client.left, wy1 = client.top, wx2 = client.right, wy2 = client.bottom;

		let pb = this.domPanelBoundary;

		let maxW = Math.max(wx1, winW - wx2) - 4;
		pb.css({'max-width': maxW + 'px'});

		let scrollSize = empiricalScrollerSize();

		let setPosition = ():void =>
		{
			//let popW = pb.width(), popH = pb.height();
			let popW = this.domBody.width(), popH = this.domBody.height();
			let posX = 0, posY = 0;

			if (wy2 + GAP + popH < winH) posY = wy2 + GAP;
			else if (wy1 - GAP - popH > 0) posY = wy1 - GAP - popH;
			else if (winH - wy2 > wy1)
			{
				posY = wy2 + GAP;
				popH = winH - posY - GAP;
			}
			else // wy1 >= winH - wy2
			{
				posY = GAP;
				popH = wy1 - posY - GAP;
			}

			if (pb.height() > popH) popW += scrollSize.w + 10;

			if (wx1 + popW < winW) posX = wx1;
			else if (popW < wx2) posX = wx2 - popW;

			setBoundaryPixels(pb, posX, posY, popW, popH);
			pb.css({'visibility': 'visible'});
		};

		setTimeout(() => setPosition());
	}
}

