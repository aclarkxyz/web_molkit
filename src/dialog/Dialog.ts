/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	Dialog: base class for popup dialogs.
*/

const CSS_DIALOG = `
    *.wmk-dialog
    {
        font-family: 'Open Sans', sans-serif;
		font-size: 16px;
		color: black;
    }
`;

export class Dialog
{
	private parent:DOM;

	// configuration parameters to modify before opening
	public minPortionWidth = 80; // percentage width of page to occupy
	public maxPortionWidth = 80; //  ...
	public maximumWidth = 0; // optional pixel-specific maximum
	public maximumHeight = 0;
	public minPortionHeight = 20; // minimum % vertical height, if too small
	public maxPortionHeight = 0; // optional % of vertical height allowed
	public topMargin = 50; // pixels to reserve along the top
	public title = 'Dialog';
	public allowScroller = true; // if true, vertical scrolling is enabled

	// content information that can be accessed after opening
	protected domObscureBackground:DOM; // grey covering banner
	protected domObscureForeground:DOM; // transparent second cover
	protected domPanelBoundary:DOM; // the dialog outline itself
	protected domTitle:DOM; // section that contains the title and mini-buttons
	protected domTitleButtons:DOM; // table cell where the top-right buttons go
	protected domBody:DOM; // the main area, for content
	protected domClose:DOM; // the close button, in case anyone wants to know

	// legacy versions for compatibility
	protected get obscureBackground():JQuery {return $(this.domObscureBackground.el as HTMLElement);}
	protected get obscureForeground():JQuery {return $(this.domObscureForeground.el as HTMLElement);}
	protected get panelBoundary():JQuery {return $(this.domPanelBoundary.el as HTMLElement);}
	protected get titleDiv():JQuery {return $(this.domTitle.el as HTMLElement);}
	protected get titleButtons():JQuery {return $(this.domTitleButtons.el as HTMLElement);}
	protected get bodyDiv():JQuery {return $(this.domBody.el as HTMLElement);}
	protected get btnClose():JQuery {return $(this.domClose.el as HTMLElement);}

	public callbackClose:(source?:Dialog) => void = null;
	public callbackShown:(source?:Dialog) => void = null;

	// ------------ public methods ------------

	constructor(parent:any = null)
	{
		this.parent = domLegacy(parent);

		installInlineCSS('dialog', CSS_DIALOG);
	}

	public onClose(callback:(source?:Dialog) => void)
	{
		this.callbackClose = callback;
	}

	public onShown(callback:(source?:Dialog) => void)
	{
		this.callbackShown = callback;
	}

	// creates all the DOM objects and shows the dialog; details such as title should be setup before calling this
	public open():void
	{
		let body = this.parent || dom(document.body);

		let zindex = 20000;

		let bg = this.domObscureBackground = dom('<div/>').appendTo(body);
		bg.css({'position': 'fixed', 'z-index': zindex});
		bg.css({'left': '0', 'right': '0', 'top': '0', 'bottom': '0'});
		bg.css({'background-color': 'black', 'opacity': 0.8});
		bg.onClick(() => this.close());

		let fg = this.domObscureForeground = dom('<div/>').appendTo(body);
		fg.css({'position': 'fixed', 'z-index': zindex + 1});
		fg.css({'left': '0', 'right': '0', 'top': '0', 'bottom': '0'});

		let pb = this.domPanelBoundary = dom('<div class="wmk-dialog"/>').appendTo(fg);
		pb.css({'min-width': this.minPortionWidth + '%'});
		if (this.maximumWidth > 0) pb.css({'max-width': this.maximumWidth + 'px'});
		else if (this.maxPortionWidth != null) pb.css({'max-width': this.maxPortionWidth + '%'});
		if (this.maximumHeight > 0) pb.css({'max-height': this.maximumHeight + 'px'});
		else if (this.maxPortionHeight > 0) pb.css({'max-height': this.maxPortionHeight + 'vh'});

		pb.css({'background-color': 'white', 'border-radius': '6px', 'border': '1px solid black'});
		pb.css({'position': 'absolute'});
		pb.css({'left': (50 - 0.5 * this.minPortionWidth) + '%'});
		pb.css({'top': this.topMargin + 'px'});
		pb.css({'min-height': this.minPortionHeight + '%'});

		let divOuter = dom('<div/>').appendTo(pb).css({'display': 'flex'});
		divOuter.css({'flex-direction': 'column', 'align-items': 'stretch'});
		if (this.maximumHeight > 0) divOuter.css({'max-height': this.maximumHeight + 'px'});
		else if (this.maxPortionHeight > 0) divOuter.css({'max-height': this.maxPortionHeight + 'vh'});
		let tdiv = this.domTitle = dom('<div/>').appendTo(divOuter);
		tdiv.css({'flex-shrink': '0', 'flex-grow': '0'});
		tdiv.css({'margin': '0', 'padding': '0'});
		tdiv.css({'background-color': '#F0F0F0'});
		tdiv.css({'background-image': 'linear-gradient(to right bottom, #FFFFFF, #E0E0E0)'});
		tdiv.css({'border-bottom': '1px solid #C0C0C0'});
		tdiv.css({'border-radius': '6px 6px 0 0'});

		let bdiv = dom('<div/>').appendTo(divOuter).css({'width': '100%'});
		bdiv.css({'flex-shrink': '1', 'flex-grow': '0'});
		if (this.allowScroller) bdiv.css({'overflow-y': 'auto'});

		this.domBody = dom('<div/>').appendTo(bdiv).css({'padding': '0.5em'}); // (has to be nested, otherwise runs over)

		let ttlTable = dom('<table/>').appendTo(tdiv), tr = dom('<tr/>').appendTo(ttlTable);
		ttlTable.attr({'width': '100%'});

		let tdTitle = dom('<td valign="center"/>').appendTo(tr).css({'padding': '0.5em'});
		let ttl = dom('<font/>').appendTo(tdTitle).css({'font-size': '1.5em', 'font-weight': '600'});
		ttl.setText(this.title);

		let tdButtons = this.domTitleButtons = dom('<td align="right" valign="center"/>').appendTo(tr).css({'padding': '0.5em'});
		this.domClose = dom('<button class="wmk-button wmk-button-default">Close</button>').appendTo(tdButtons);
		this.domClose.onClick(() => this.close());

		this.populate();

		this.repositionSize();

		/*bg.show();
		pb.show();*/

		if (this.callbackShown) this.callbackShown(this); // currently there's no delay so it's fine to just call it
	}

	// closes and hides the dialog
	public close():void
	{
		this.obscureBackground.remove();
		this.obscureForeground.remove();

		if (this.callbackClose) this.callbackClose(this);
	}

	// sizes may have changed, so adjust if necessary
	public bump():void
	{
		this.repositionSize();
	}

	// use this to obtain the parts of the dialog box intended for modification
	public body():JQuery {return this.bodyDiv;}
	public buttons():JQuery {return this.titleButtons;}
	public bodyDOM():DOM {return this.domBody;}
	public buttonsDOM():DOM {return this.domTitleButtons;}

	// override this function to create the content; this gets called right before the dialog box is shown
	protected populate():void
	{
		this.bodyDOM().setText('Empty dialog box.');
	}

	// ------------ private methods ------------

	// have this called when the size may have changed, and need to update position
	private repositionSize():void
	{
		let docW = window.innerWidth, dlgW = this.domPanelBoundary.width();
		this.domPanelBoundary.css({'left': (0.5 * (docW - dlgW)) + 'px'});
	}
}

/* EOF */ }