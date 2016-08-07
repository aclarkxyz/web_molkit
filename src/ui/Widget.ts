/*
    MolSync

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=molsync]
*/

/*
	Base class for widgets. Maintains the wrapping <div> element into which everything is rendered.
*/

class Widget
{
	public content:JQuery = null;
	
	constructor() {}
	
	// create the underlying structure; the parent parameter must be jQuery-compatible
	public render(parent:any)
	{
		this.content = $('<div></div>').appendTo($(parent));
	}

	// convenience function: attaches a tooltip to the main content element, after rendering	
	public addTooltip(bodyHTML:string, titleHTML?:string):void
	{
		addTooltip(this.content, bodyHTML, titleHTML);
	}
}