/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	Base class for widgets. Maintains the wrapping <div> element into which everything is rendered.
*/

export class Widget
{
	protected tagType = 'div';

	//public content:JQuery = null;

	private domContent:DOM = null;
	public get contentDOM():DOM {return this.domContent;}

	constructor() {}

	// create the underlying structure; the parent parameter must be jQuery- or DOM-compatible
	public render(parent:DOM | Element):void
	{
		let tag = this.tagType;
		this.domContent = dom(`<${tag}/>`).appendTo(parent as (DOM | Element));
	}

	// deconstructs the widget; this is not a hook, rather it is for the benefit of calling code that wants the widget gone
	public remove():void
	{
		if (this.domContent) this.domContent.remove();
		this.domContent = null;
	}

	// convenience function: attaches a tooltip to the main content element, after rendering
	public addTooltip(bodyHTML:string, titleHTML?:string):void
	{
		addTooltip(this.contentDOM, bodyHTML, titleHTML);
	}

	// convenience wrapper
	public grabFocus():void
	{
		this.domContent.grabFocus();
	}
}

/* EOF */ }