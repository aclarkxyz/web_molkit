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

// generic creator: converts a compatible object into a DOM
export function dom(obj:Element | DOM | string):DOM
{
	if (typeof obj == 'string') return DOM.parse(obj);
	if (obj instanceof DOM) return obj;
	return new DOM(obj);
}

// a more permissive version of the above, which also looks for JQuery inputs, for compatibility purposes; type checking is
// limited, so buyer-beware
export function domLegacy(obj:any):DOM
{
	if (obj == null) return null;
	if (obj.jquery) return dom(obj[0]);
	return dom(obj);
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

	// finds just one qualifying in the child herarchy based on the selector string; returns null if nothing
	public find(selector:string):DOM
	{
		let el = this.el.querySelector(selector);
		return el ? new DOM(el) : null;
	}

	// finds all instances matching the selector string in the child hierarchy, or empty array if nothing
	public findAll(selector:string):DOM[]
	{
		let nodeList = this.el.querySelectorAll(selector);
		let domList:DOM[] = [];
		for (let n = 0; n < nodeList.length; n++) domList.push(new DOM(nodeList.item(n)));
		return domList;
	}

	// returns true if this element still exists in the overall HTML DOM, i.e. hasn't been removed and left dangling
	public exists():boolean
	{
		return document.documentElement.contains(this.el);
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

	// getting & setting values of interactive widgets, like <input>
	public getValue():string
	{
		return (this.el as HTMLInputElement).value;
	}
	public setValue(str:string):void
	{
		(this.el as HTMLInputElement).value = str || '';
	}

	// getting & setting disabled property, for interactive widgets like <input>
	public getDisabled():boolean
	{
		return (this.el as HTMLInputElement).disabled;
	}
	public setDisabled(disabled:boolean):void
	{
		if (disabled == null) return;
		(this.el as HTMLInputElement).disabled = disabled;
	}

	// getting & setting checked property, for interactive widgets like <checkbox>
	public getChecked():boolean
	{
		return (this.el as HTMLInputElement).checked;
	}
	public setChecked(checked:boolean):void
	{
		if (checked == null) return;
		(this.el as HTMLInputElement).checked = checked;
	}

	// getting & setting readonly property, for interactive widgets like <input>
	public getReadOnly():boolean
	{
		return (this.el as HTMLInputElement).readOnly;
	}
	public setReadOnly(readOnly:boolean):void
	{
		if (readOnly == null) return;
		(this.el as HTMLInputElement).readOnly = readOnly;
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
	public attr(dict:Record<string, string | number | boolean>):DOM
	{
		for (let key in dict) this.setAttr(key, dict[key].toString());
		return this;
	}

	// getting & setting CSS classes
	public addClass(clsnames:string):void
	{
		for (let cls of clsnames.split(' ')) if (cls) (this.el as HTMLElement).classList.add(cls);
	}
	public removeClass(clsnames:string):void
	{
		for (let cls of clsnames.split(' ')) if (cls) (this.el as HTMLElement).classList.remove(cls);
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
	public offset():Pos
	{
		let rect = this.el.getBoundingClientRect();
		let win = this.el.ownerDocument.defaultView;
		return new Pos(rect.left + win.pageXOffset, rect.top + win.pageYOffset);
	}
	public size():Size
	{
		return new Size(this.width(), this.height());
	}

	// shorthand for defining the precise rectangle in pixels
	public setBoundaryPixels(x:number, y:number, w:number, h:number):void
	{
		this.css({'left': `${x}px`, 'top': `${y}px`, 'width': `${w}px`, 'height': `${h}px`});
	}

	// focus: testing and taking focus; note that focus grabbing often works better with a short delay, hence the convenient option
	public hasFocus():boolean
	{
		return this.el === document.activeElement;
	}
	public grabFocus(delay = false):void
	{
		if (delay)
			setTimeout(() => this.grabFocus(), 10);
		else
			(this.el as HTMLElement).focus();
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
	public onChange(callback:(event?:MouseEvent) => boolean | void):void
	{
		this.el.addEventListener('change', callback);
	}
	public onInput(callback:(event?:MouseEvent) => boolean | void):void
	{
		this.el.addEventListener('input', callback);
	}
}

/* EOF */ }