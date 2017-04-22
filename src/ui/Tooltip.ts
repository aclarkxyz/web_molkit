/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

/*
	Tooltips: adding popovers to widgets.
*/

var globalPopover:JQuery = null;
var globalTooltip:Tooltip = null;
var globalPopWatermark = 0;

// adds a well behaved tooltip to the given node (element or JQuery object)
function addTooltip(parent:any, bodyHTML:string, titleHTML?:string, delay?:number):void
{
    let widget = $(parent);
    
    if (globalPopover == null)
    {
        globalPopover = $(document.createElement('div'));
        globalPopover.css('position', 'absolute');
        globalPopover.css('background-color', '#F0F0FF');
        globalPopover.css('color', 'black');
        //globalPopover.css('opacity', 0.9);
        globalPopover.css('border', '1px solid black');
        globalPopover.css('padding', '0.3em');
        globalPopover.hide();
        globalPopover.appendTo(document.body);
    }
    
    const tooltip = new Tooltip(widget, bodyHTML, titleHTML, delay == null ? 1000 : delay);
    
    let prevEnter:any = widget.attr('onmouseenter'), prevLeave:any = widget.attr('onmouseleave');
    widget.mouseenter(function(e) {tooltip.start(); if (prevEnter) prevEnter(e);});
    widget.mouseleave(function(e) {tooltip.stop(); if (prevLeave) prevLeave(e);}); 
}

// rudely shutdown the tooltip
function clearTooltip():void
{
    if (globalTooltip == null) return;
    globalPopWatermark++;
    globalTooltip.lower();
}

class Tooltip
{
    watermark:number;
    
    constructor(private widget:JQuery, private bodyHTML:string, private titleHTML:string, private delay:number)
    {
    }
    
    // raise the tooltip after a delay, assuming someone else hasn't bogarted it in the meanwhile
    public start()
    {
        globalPopover.hide();
        this.watermark = ++globalPopWatermark;
        //console.log('START:[' + this.bodyHTML + '] watermark=' + this.watermark);
        
        let self = this;
        window.setTimeout(function()
        {
            if (self.watermark == globalPopWatermark) self.raise(); 
        }, this.delay);
    }
    
    // lower the tooltip, if it is still owned by this widget
    public stop()
    {
        //console.log('STOP:[' + this.bodyHTML + '] watermark=' + this.watermark + '/' + globalPopWatermark);        
        if (this.watermark == globalPopWatermark) this.lower();
        globalPopWatermark++;
    }
    
    public raise()
    {
        //let pageWidth = $(document).width(), pageHeight = $(document).height();
        globalTooltip = this;

        let pop = globalPopover;
        pop.css('max-width', '20em');
        pop.empty();
        
        let hasTitle = this.titleHTML != null && this.titleHTML.length > 0, hasBody = this.bodyHTML != null && this.bodyHTML.length > 0;
        
        if (hasTitle) ($('<div></div>').appendTo(pop)).html('<b>' + this.titleHTML + '</b>');
        if (hasTitle && hasBody) pop.append('<hr>');
        if (hasBody) ($('<div></div>').appendTo(pop)).html(this.bodyHTML);
        
        // to-do: title, if any
        
        let popW = pop.width(), popH = pop.height();
        let wpos = this.widget.offset(), width = this.widget.width(), height = this.widget.height();
        
        // (smart positioning?)
        //let posX = wpos.left + width + 2;
        //let posY = wpos.top;
        let posX = wpos.left;
        let posY = wpos.top + height + 2;
        
        pop.css('left', `${posX}px`);
        pop.css('top', `${posY}px`);
        
        pop.show();
    }
    
    public lower()
    {
        let pop = globalPopover;
        pop.hide();
    }
}