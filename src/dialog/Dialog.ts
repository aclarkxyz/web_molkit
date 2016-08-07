/*
    MolSync

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=molsync]
*/

/*
	Dialog: base class for popup dialogs.
*/

class Dialog
{
    // configuration parameters to modify before opening
    public minPortionWidth = 80; // percentage width of page to occupy
    public maxPortionWidth = 80; //  ...
    public title = 'Dialog';
    
    // content information that can be accessed after opening
    protected obscureBackground:JQuery; // grey covering banner
    protected panelBoundary:JQuery; // the dialog outline itself
    protected titleDiv:JQuery; // section that contains the title and mini-buttons
    protected titleButtons:JQuery; // table cell where the top-right buttons go
    protected bodyDiv:JQuery; // the main area, for content
    protected btnClose:JQuery; // the close button, in case anyone wants to know
    
    constructor()
    {
    }
    
    // creates all the DOM objects and shows the dialog; details such as title should be setup before calling this
    public open():void
    {
        let bg = $('<div></div>').appendTo(document.body);
        bg.css('width', '100%');
        bg.css('height', document.documentElement.clientHeight + 'px');
        bg.css('background-color', 'black');
        bg.css('opacity', 0.8);
        bg.css('position', 'absolute');
        bg.css('left', 0);
        bg.css('top', 0);
        this.obscureBackground = bg;
        
        let pb = $('<div></div>').appendTo(document.body);
        pb.css('min-width', this.minPortionWidth + '%');
        if (this.maxPortionWidth != null) pb.css('max-width', this.maxPortionWidth + '%');
        pb.css('background-color', 'white');
        pb.css('border-radius', '6px');
        pb.css('border', '1px solid black');
        pb.css('position', 'absolute');
        pb.css('left', (50 - 0.5 * this.minPortionWidth) + '%');
        pb.css('top', (document.body.scrollTop + 50) + 'px');
        pb.css('min-height', '50%');        
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
        
        let bdiv = $('<div"></div>').appendTo(pb);
        bdiv.css('width', '100%');
        this.bodyDiv = $('<div style="padding: 0.5em;"></div>').appendTo(bdiv); // (has to be nested, otherwise runs over)
        
        let ttlTable = $('<table></table>').appendTo(tdiv), tr = $('<tr></tr>').appendTo(ttlTable);
        ttlTable.attr('width', '100%');
        ttlTable.css('padding', '0.5em');
        let tdTitle = $('<td valign="center"></td>').appendTo(tr);
        tdTitle.append('<b><big>' + escapeHTML(this.title) + '</big></b>');
        
        let tdButtons = $('<td align="right" valign="center"></td>').appendTo(tr);
        this.btnClose = $('<button class="button button-default">Close</button>').appendTo(tdButtons);
        const self = this;
        this.btnClose.click(function() {self.close();});
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
