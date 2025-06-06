/*
    WebMolKit

    (c) 2010-2021 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {Box, Pos, Size} from './Geom';
import {XML} from './XML';

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

export type CSSDictionary = Record<string, string | number | boolean> |
{
	'display': 'none' | 'block' | 'inline-block' | 'flex' | 'inline-flex' | 'grid' | 'inline-grid';
};

export class DOM
{
	constructor(public el:Element)
	{
	}

	public get elHTML():HTMLElement {return this.el as HTMLElement;}
	public get elInput():HTMLInputElement {return this.el as HTMLInputElement;}
	public get elCanvas():HTMLCanvasElement {return this.el as HTMLCanvasElement;}

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

	// returns the first object in the parent's ancestry that matches the selector
	public ancestor(selector:string):DOM
	{
		let el = this.el.closest(selector);
		return el ? new DOM(el) : null;
	}

	// return all the node's element children
	public children(tag?:string):DOM[]
	{
		let domList:DOM[] = [];
		for (let child = this.el.firstElementChild; child; child = child.nextElementSibling)
		{
			if (tag && child.tagName.toLocaleLowerCase() != tag.toLocaleLowerCase()) continue;
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

	// returns true if the element is currently being shown onscreen
	public isVisible():boolean
	{
		return this.elHTML.offsetWidth > 0 || this.elHTML.offsetHeight > 0 || this.elHTML.getClientRects().length > 0;
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
			(parent as DOM).el.append(this.el);
		else
			(parent as Element).appendChild(this.el);
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
			(parent as DOM).el.prepend(this.el);
		else
			(parent as Element).append(this.el);
		return this;
	}

	// inserts this object right before the reference DOM, in the reference DOM's parent list
	public insertBefore(ref:DOM):DOM
	{
		ref.el.parentElement.insertBefore(this.el, ref.el);
		return this;
	}

	// inserts this object right after the reference DOM, in the reference DOM's parent list
	public insertAfter(ref:DOM):DOM
	{
		let before = ref.el.nextElementSibling;
		if (before)
			ref.el.parentElement.insertBefore(this.el, before);
		else
			ref.el.parentElement.append(this.el);
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
		let xml = XML.parseXML('<z>' + xhtml + '</z>');
		if (xml == null) throw 'Invalid XHTML string: ' + xhtml;
		let html = xml.documentElement.innerHTML;
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
		//this.el.innerHTML += escapeHTML(text);
		let content = document.createTextNode(text);
		this.el.appendChild(content);
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

	// getting & setting CSS values
	public getCSS(key:string):string
	{
		return this.elHTML.style.getPropertyValue(key);
	}
	public setCSS(key:string, value:string | number):void
	{
		this.elHTML.style.setProperty(key, value?.toString());
	}
	public css(dict:CSSDictionary):DOM
	{
		for (let key in dict) this.setCSS(key, (dict as Record<string, any>)[key].toString());
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
		for (let cls of clsnames.split(' ')) if (cls) this.elHTML.classList.add(cls);
	}
	public removeClass(clsnames:string):void
	{
		for (let cls of clsnames.split(' ')) if (cls) this.elHTML.classList.remove(cls);
	}
	public hasClass(clsname:string):boolean
	{
		return this.elHTML.classList.contains(clsname);
	}
	public setClass(clsname:string, flag:boolean):void
	{
		if (flag) this.addClass(clsname); else this.removeClass(clsname);
	}
	public class(clsnames:string | string[]):DOM
	{
		if (Array.isArray(clsnames))
		{
			for (let cls of clsnames) this.addClass(cls);
		}
		else
		{
			for (let cls of clsnames.split(' ')) this.addClass(cls);
		}
		return this;
	}
	public toggleClass(dict:Record<string, boolean>):void
	{
		for (let key in dict)
		{
			if (dict[key]) this.elHTML.classList.add(key); else this.elHTML.classList.remove(key);
		}
	}

	// position & size
	public width():number
	{
		return this.elHTML.offsetWidth;
	}
	public height():number
	{
		return this.elHTML.offsetHeight;
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
	public area():Box
	{
		let pos = this.offset();
		return new Box(pos.x, pos.y, this.width(), this.height());
	}

	// shorthand for defining the precise rectangle in pixels
	public setBoundaryPixels(x:number, y:number, w:number, h:number):void
	{
		this.css({'left': `${x}px`, 'top': `${y}px`, 'width': `${w}px`, 'height': `${h}px`});
	}

	// similar convenience for size in hard pixels
	public setSizePixels(w:number, h:number):void
	{
		this.css({'width': `${w}px`, 'height': `${h}px`});
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
			this.elHTML.focus();
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
	public onTouchStart(callback:(event?:TouchEvent) => boolean | void):void
	{
		this.el.addEventListener('touchstart', callback);
	}
	public onTouchMove(callback:(event?:TouchEvent) => boolean | void):void
	{
		this.el.addEventListener('touchmove', callback);
	}
	public onTouchCancel(callback:(event?:TouchEvent) => boolean | void):void
	{
		this.el.addEventListener('touchcancel', callback);
	}
	public onTouchEnd(callback:(event?:TouchEvent) => boolean | void):void
	{
		this.el.addEventListener('touchend', callback);
	}
}

