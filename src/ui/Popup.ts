/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../decl/jquery.d.ts'/>

namespace WebMolKit /* BOF */ {

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
    // content information that can be accessed after opening
    protected obscureBackground:JQuery; // grey covering banner
    protected panelBoundary:JQuery; // the dialog outline itself
    protected bodyDiv:JQuery; // the main area, for content
    
	public callbackClose:(source?:Popup) => void = null;
	public callbackPopulate:(source?:Popup) => void = null;

    constructor(private parent:JQuery)
    {
        installInlineCSS('popup', CSS_POPUP);
    }
    
	public onClose(callback:(source?:Popup) => void)
	{
		this.callbackClose = callback;
	}

    // creates all the DOM objects and shows the dialog; details such as title should be setup before calling this
    public open():void
    {
        let body = $(document.documentElement);
        /*let bodyW = body.outerWidth(true), margW = 0.5 * (bodyW - body.outerWidth());
        let bodyH = body.outerHeight(true), margH = 0.5 * (bodyH - body.outerHeight());*/
        
        let bg = this.obscureBackground = $('<div></div>').appendTo(body);
        bg.css('width', '100%');
        bg.css('height', document.documentElement.clientHeight + 'px');
        bg.css('background-color', 'black');
        bg.css('opacity', 0.2);
        bg.css('position', 'absolute');
        bg.css('left', 0);
        bg.css('top', 0);
        bg.css('z-index', 9999);
		bg.click(() => this.close());
        this.obscureBackground = bg;
        
		let pb = this.panelBoundary = $('<div class="wmk-popup"></div>').appendTo(body);
		pb.click((event:JQueryEventObject) => event.stopPropagation()); // don't let the click percolate upward to the close event
        pb.css('background-color', 'white');
        pb.css('border', '1px solid black');
        pb.css('position', 'absolute');
        pb.css('z-index', 10000);

		let bd = this.bodyDiv = $('<div></div>').appendTo(pb);
		bd.css('padding', '0.5em');

        bg.show();

        this.populate();
        this.positionAndShow();
    }
    
    // closes and hides the dialog
    public close():void
    {
        this.panelBoundary.remove();
        this.obscureBackground.remove();

        if (this.callbackClose) this.callbackClose(this);
    }
    
    // sizes may have changed, so adjust if necessary
    public bump():void
    {
        this.positionAndShow();
    }
    
    // use this to obtain the parts of the dialog box intended for modification 
    public body():JQuery {return this.bodyDiv;}
        
    // either subclass and override this, or provide the callback
    protected populate():void
    {
		if (this.callbackPopulate) 
			this.callbackPopulate(this);
		else
        	this.body().text('Empty popup.');
    }
    
    // have this called when the size may have changed, and need to update position
    private positionAndShow():void
    {
        let winW = $(window).width(), winH = $(window).height();
        const GAP = 2;
        let wx1 = this.parent.offset().left, wy1 = this.parent.offset().top;
        let wx2 = wx1 + this.parent.width(), wy2 = wy1 + this.parent.height();
        
		let pb = this.panelBoundary;

		let maxW = Math.max(wx1, winW - wx2) - 4;
		pb.css('max-width', maxW + '.px');

        let setPosition = () =>
        {
            let popW = pb.width(), popH = pb.height();
            let posX = 0, posY = 0;
            if (wx1 + popW < winW) posX = wx1;
            else if (popW < wx2) posX = wx2 - popW;
            if (wy2 + GAP + popH < winH) posY = wy2 + GAP;
            else if (wy1 - GAP - popH > 0) posY = wy1 - GAP - popH;
            else posY = wy2 + GAP;
            
            pb.css('left', `${posX}px`);
            pb.css('top', `${posY}px`);
        }

        setPosition();
        pb.show();
        window.setTimeout(setPosition());
    }
}


/* EOF */ }