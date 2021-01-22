/*
    WebMolKit

    (c) 2010-2021 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	DOM: lightweight domain object wrapper that's intended to provide a subset of the functionality of JQuery. Most
	of what it does is for convenience rather than the historical need to workaround compatibility issues.
*/

export function dom(obj:Element | DOM | string):DOM
{
	if (typeof obj == 'string') return DOM.parse(obj);
	if (obj instanceof DOM) return obj;
	return new DOM(obj);
}

export class DOM
{
	constructor(public el:Element)
	{
	}

	public static parse(xhtml:string):DOM
	{
		let xml = XML.parseXML(xhtml);
		if (xml == null) throw 'Invalid XHTML string: ' + xhtml;
		let html = xml.documentElement.outerHTML;

		let template = document.createElement('template');
		template.innerHTML = html;
		return new DOM(template.content.firstChild as Element);
	}

	// ------------ discovery ------------

	// finds just one qualifying element based on the selector string; returns null if nothing
	public static find(selector:string):DOM
	{
		let el = document.querySelector(selector);
		return el ? new DOM(el) : null;
	}

	// finds all instances matching the selector string, or empty array if nothing
	public static findAll(selector:string):DOM[]
	{
		let nodeList = document.querySelectorAll(selector);
		let domList:DOM[] = [];
		for (let n = 0; n < nodeList.length; n++) domList.push(new DOM(nodeList.item(n)));
		return domList;
	}

	// returns object for parent, or null if this is the root
	public parent():DOM
	{
		let parent = this.el.parentElement;
		return parent ? new DOM(parent) : null;
	}

	// return all the node's element children
	public children(tag?:string):DOM[]
	{
		let domList:DOM[] = [];
		for (let child = this.el.firstElementChild; child; child = child.nextElementSibling)
		{
			if (tag && child.tagName != tag) continue;
			domList.push(new DOM(child));
		}
		return domList;
	}

	// returns true if this element still exists in the overall HTML DOM, i.e. hasn't been removed and left dangling
	public exists():boolean
	{
		return document.body.contains(this.el);
	}

	// ------------ hierarchy ------------

	// append the given node to this one's child list
	public append(child:DOM):void
	{
		this.el.append(child.el);
	}

	// append this element to the given parent, and then return itself (for convenient chaining)
	public appendTo(parent:DOM | Element):DOM
	{
		if (parent instanceof DOM)
			parent.el.append(this.el);
		else
			parent.append(this.el);
		return this;
	}

	// insert the given node at the beginning of this one's child list
	public prepend(child:DOM):void
	{
		this.el.prepend(child.el);
	}

	// prepend this element to the given parent, and then return itself (for convenient chaining)
	public prependTo(parent:DOM | Element):DOM
	{
		if (parent instanceof DOM)
			parent.el.prepend(this.el);
		else
			parent.append(this.el);
		return this;
	}

	// take this node out of the DOM
	public remove():void
	{
		this.el.remove();
	}

	// ------------ properties ------------

	public empty():void
	{
		this.el.innerHTML = '';
	}

	// getting & setting HTML content
	public getHTML():string
	{
		return this.el.innerHTML;
	}
	public setHTML(html:string):void
	{
		this.el.innerHTML = html;
	}
	public appendHTML(xhtml:string):void
	{
		let xml = XML.parseXML(xhtml);
		if (xml == null) throw 'Invalid XHTML string: ' + xhtml;
		let html = xml.documentElement.outerHTML;
		this.el.insertAdjacentHTML('beforeend', html);
	}

	// getting & setting unmarkedup text
	public getText():string
	{
		return this.el.textContent;
	}
	public setText(text:string):void
	{
		this.el.textContent = text;
	}
	public appendText(text:string):void
	{
		this.el.innerHTML += escapeHTML(text);
	}

	// getting & setting CSS values
	public getCSS(key:string):string
	{
		return (this.el as HTMLElement).style.getPropertyValue(key);
	}
	public setCSS(key:string, value:string):void
	{
		(this.el as HTMLElement).style.setProperty(key, value);
	}
	public css(dict:Record<string, string | number>):DOM
	{
		for (let key in dict) this.setCSS(key, dict[key].toString());
		return this;
	}

	// getting & setting attributes
	public getAttr(key:string):string
	{
		if (!this.el.hasAttribute(key)) return null;
		return this.el.getAttribute(key);
	}
	public setAttr(key:string, value:string):void
	{
		this.el.setAttribute(key, value);
	}
	public attr(dict:Record<string, string | number>):DOM
	{
		for (let key in dict) this.setAttr(key, dict[key].toString());
		return this;
	}

	// getting & setting CSS classes
	public addClass(clsname:string):void
	{
		(this.el as HTMLElement).classList.add(clsname);
	}
	public removeClass(clsname:string):void
	{
		(this.el as HTMLElement).classList.remove(clsname);
	}
	public hasClass(clsname:string):boolean
	{
		return (this.el as HTMLElement).classList.contains(clsname);
	}
	public setClass(clsname:string, flag:boolean):void
	{
		if (flag) this.addClass(clsname); else this.removeClass(clsname);
	}
	public class(clsname:string):DOM
	{
		this.addClass(clsname);
		return this;
	}

	// position & size
	public width():number
	{
		return (this.el as HTMLElement).offsetWidth;
	}
	public height():number
	{
		return (this.el as HTMLElement).offsetHeight;
	}

	// ------------ events ------------

	public removeEvent(id:string, callback:any):void
	{
		this.el.removeEventListener(id, callback);
	}
	public onKeyDown(callback:(event?:KeyboardEvent) => boolean | void):void
	{
		this.el.addEventListener('keydown', callback);
	}
	public onKeyUp(callback:(event?:KeyboardEvent) => boolean | void):void
	{
		this.el.addEventListener('keyup', callback);
	}
	public onKeyPress(callback:(event?:KeyboardEvent) => boolean | void):void
	{
		this.el.addEventListener('keypress', callback);
	}
	public onScroll(callback:(event?:Event) => boolean | void):void
	{
		this.el.addEventListener('scroll', callback);
	}
	public onWheel(callback:(event?:WheelEvent) => boolean | void):void
	{
		this.el.addEventListener('wheel', callback);
	}
	public onClick(callback:(event?:MouseEvent) => boolean | void):void
	{
		this.el.addEventListener('click', callback);
	}
	public onContextMenu(callback:(event?:MouseEvent) => boolean | void):void
	{
		this.el.addEventListener('contextmenu', callback);
	}
	public onDblClick(callback:(event?:MouseEvent) => boolean | void):void
	{
		this.el.addEventListener('dblclick', callback);
	}
	public onMouseDown(callback:(event?:MouseEvent) => boolean | void):void
	{
		this.el.addEventListener('mousedown', callback);
	}
	public onMouseUp(callback:(event?:MouseEvent) => boolean | void):void
	{
		this.el.addEventListener('mouseup', callback);
	}
	public onMouseEnter(callback:(event?:MouseEvent) => boolean | void):void
	{
		this.el.addEventListener('mouseenter', callback);
	}
	public onMouseLeave(callback:(event?:MouseEvent) => boolean | void):void
	{
		this.el.addEventListener('mouseleave', callback);
	}
	public onMouseMove(callback:(event?:MouseEvent) => boolean | void):void
	{
		this.el.addEventListener('mousemove', callback);
	}
	public onMouseOver(callback:(event?:MouseEvent) => boolean | void):void
	{
		this.el.addEventListener('mouseover', callback);
	}
}

/* EOF */ }