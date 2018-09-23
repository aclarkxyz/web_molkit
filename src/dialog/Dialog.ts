/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../decl/jquery.d.ts'/>
///<reference path='../util/util.ts'/>
///<reference path='../util/Theme.ts'/>

namespace WebMolKit /* BOF */ {

/*
	Dialog: base class for popup dialogs.
*/

const CSS_DIALOG = `
    *.wmk-dialog
    {
        font-family: 'Open Sans', sans-serif;
    }
`;

export class Dialog
{
    // configuration parameters to modify before opening
    public minPortionWidth = 80; // percentage width of page to occupy
    public maxPortionWidth = 80; //  ...
    public maximumWidth = 0; // optional pixel-specific maximum
    public maximumHeight = 0; 
    public title = 'Dialog';
    
    // content information that can be accessed after opening
    protected obscureBackground:JQuery; // grey covering banner
    protected panelBoundary:JQuery; // the dialog outline itself
    protected titleDiv:JQuery; // section that contains the title and mini-buttons
    protected titleButtons:JQuery; // table cell where the top-right buttons go
    protected bodyDiv:JQuery; // the main area, for content
    protected btnClose:JQuery; // the close button, in case anyone wants to know
    
	public callbackClose:(source?:Dialog) => void = null;

    constructor()
    {
        installInlineCSS('dialog', CSS_DIALOG);
    }
    
	public onClose(callback:(source?:Dialog) => void)
	{
		this.callbackClose = callback;
	}

    // creates all the DOM objects and shows the dialog; details such as title should be setup before calling this
    public open():void
    {
        let body = $(document.documentElement);
        /*let bodyW = body.outerWidth(true), margW = 0.5 * (bodyW - body.outerWidth());
        let bodyH = body.outerHeight(true), margH = 0.5 * (bodyH - body.outerHeight());*/
        
        let bg = $('<div></div>').appendTo(body);
        bg.css('width', '100%');
        bg.css('height', document.documentElement.clientHeight + 'px');
        bg.css('background-color', 'black');
        bg.css('opacity', 0.8);
        bg.css('position', 'absolute');
        bg.css('left', 0);
        bg.css('top', 0);
        bg.css('z-index', 9999);
        this.obscureBackground = bg;
        
        let pb = $('<div class="wmk-dialog"></div>').appendTo(body);

        pb.css('min-width', this.minPortionWidth + '%');
        if (this.maximumWidth > 0) pb.css('max-width', this.maximumWidth + 'px');
        else if (this.maxPortionWidth != null) pb.css('max-width', this.maxPortionWidth + '%');
        if (this.maximumHeight > 0) pb.css('max-height', this.maximumHeight + 'px');

        pb.css('background-color', 'white');
        pb.css('border-radius', '6px');
        pb.css('border', '1px solid black');
        pb.css('position', 'absolute');
        pb.css('left', (50 - 0.5 * this.minPortionWidth) + '%');
        pb.css('top', (document.body.scrollTop + 50) + 'px');
        pb.css('min-height', '20%');   
        pb.css('z-index', 10000);     
        this.panelBoundary = pb;

        let tdiv = $('<div></div>').appendTo(pb);
        tdiv.css('width', '100%');
        tdiv.css('background-color', '#F0F0F0');
        tdiv.css('background-image', 'linear-gradient(to right bottom, #FFFFFF, #E0E0E0)');
        tdiv.css('border-bottom', '1px solid #C0C0C0');
        tdiv.css('border-radius', '6px 6px 0 0');
        tdiv.css('margin', 0);
        tdiv.css('padding', 0);
        this.titleDiv = tdiv;
        
        let bdiv = $('<div></div>').appendTo(pb);
        bdiv.css('width', '100%');

        this.bodyDiv = $('<div style="padding: 0.5em;"></div>').appendTo(bdiv); // (has to be nested, otherwise runs over)
        
        let ttlTable = $('<table></table>').appendTo(tdiv), tr = $('<tr></tr>').appendTo(ttlTable);
        ttlTable.attr('width', '100%');

        let tdTitle = $('<td valign="center"></td>').appendTo(tr);
        tdTitle.css('padding', '0.5em');
        let ttl = $('<font></font>').appendTo(tdTitle);
        ttl.css('font-size', '1.5em');
        ttl.css('font-weight', '600');
        ttl.text(this.title);
        
        let tdButtons = $('<td align="right" valign="center"></td>').appendTo(tr);
        tdButtons.css('padding', '0.5em');
        this.btnClose = $('<button class="wmk-button wmk-button-default">Close</button>').appendTo(tdButtons);
        this.btnClose.click(() => this.close());
        this.titleButtons = tdButtons; 

        this.populate();

        this.repositionSize();

        bg.show();
        pb.show();
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
        this.repositionSize();
    }
    
    // use this to obtain the parts of the dialog box intended for modification 
    public body():JQuery {return this.bodyDiv;}
    public buttons():JQuery {return this.titleButtons;}
        
    // override this function to create the content; this gets called right before the dialog box is shown
    protected populate():void
    {
        this.body().text('Empty dialog box.');
    }
    
    // have this called when the size may have changed, and need to update position
    private repositionSize():void
    {
        let docW = $(window).width(), dlgW = this.panelBoundary.width();
        this.panelBoundary.css('left', (0.5 * (docW - dlgW)) + 'px');
    }
}

/* EOF */ }