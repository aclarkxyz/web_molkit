/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../decl/jquery.d.ts'/>
///<reference path='../util/util.ts'/>
///<reference path='Tooltip.ts'/>

/*
	Base class for widgets. Maintains the wrapping <div> element into which everything is rendered.
*/

class Widget
{
	protected tagType = 'div';
	public content:JQuery = null;
	
	constructor() {}
	
	// create the underlying structure; the parent parameter must be jQuery-compatible
	public render(parent:any)
	{
		let tag = this.tagType;
		this.content = $(`<${tag}></${tag}>`).appendTo($(parent));
	}

	// convenience function: attaches a tooltip to the main content element, after rendering	
	public addTooltip(bodyHTML:string, titleHTML?:string):void
	{
		addTooltip(this.content, bodyHTML, titleHTML);
	}
}