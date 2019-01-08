/*
    WebMolKit

    (c) 2010-2017 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	Utilities to supplement the rather rudimentary DOM.
*/

export class XML
{
	// DOM <--> String
	public static parseXML(xml:string):Document
	{
		return $.parseXML(xml);
	}
	public static toString(doc:Document):string
	{
		return new XMLSerializer().serializeToString(doc);
	}

	// composes all of the text nodes and returns them
	public static nodeText(el:Node):string
	{
		let text = '';
		for (let child of Array.from(el.childNodes))
		{
			if (child.nodeType == Node.TEXT_NODE || child.nodeType == Node.CDATA_SECTION_NODE) text += child.nodeValue;
		}
		return text;
	}

	// convenient method for finding a child element and returning its text content; note that if the parent is null or the child cannot be found,
	// returns null, but if the child exists and has no text, returns a blank string
	public static childText(parent:Element, tagName:string):string
	{
		if (parent == null) return null;
		let el = this.findElement(parent, tagName);
		if (el == null) return null;
		return nodeText(el);
	}
	
	// creates and appends an element
	public static appendElement(parent:Node, name:string):Element
	{
		let el = parent.ownerDocument.createElement(name);
		parent.appendChild(el);
		return el;
	}
	
	// creates and appends an element and makes sure that it occurs immediately after the 'presib' node
	public static appendElementAfter(presib:Node, name:string):Element
	{
		let el = presib.ownerDocument.createElement(name);
		let postsib = presib.nextSibling;
		if (postsib == null) 
			presib.parentNode.appendChild(el);
		else
			presib.parentNode.insertBefore(el, postsib);
		return el;
	}

	// creates and appends text, maybe in a CDATA section
	//public static appendText(Node parent, String text):void {appendText(parent, text, false);}
	public static appendText(parent:Node, text:string, isCDATA:boolean = false):void
	{
		if (text == null || text.length == 0) return;
		if (!isCDATA)
			parent.appendChild(parent.ownerDocument.createTextNode(text));
		else
			parent.appendChild(parent.ownerDocument.createCDATASection(text));
	}

	// appends an XML entity (e.g. "&nbsp;")
	/*public static appendEntity(parent:Node, entity:string):void
	{
		if (entity.startsWith('&')) entity = entity.substring(1);
		if (entity.endsWith(';')) entity = entity.substring(0, entity.length - 1);
		parent.appendChild(parent.ownerDocument.createEntityReference(entity));
	}*/
	
	// creates an element child with a particular name and populates it with text
	public static createTextChild(parent:Node, name:string, text:string, isCDATA:boolean = false):void
	{
		let el = <Element>parent.ownerDocument.createElement(name);
		parent.appendChild(el);
		if (!isCDATA) el.textContent = text; else el.appendChild(parent.ownerDocument.createCDATASection(text));
	}
	
	// defines the current notes contents as being only the provided text
	public static setText(parent:Node, text:string, isCDATA:boolean = false):void
	{
		while (parent.firstChild != null) parent.removeChild(parent.firstChild);
		this.appendText(parent, text, isCDATA);
	}
	
	// returns the first element with the given tag name, or null if none
	public static findElement(parent:Element, tagName:string):Element
	{
		if (parent == null) return null;
		let node = parent.firstChild;
		while (node != null)
		{
			if (node.nodeType == Node.ELEMENT_NODE && node.nodeName == tagName) return <Element>node;
			node = <any>node.nextSibling;
		}
		return null;
	}

	// find child elements with the given tag name, or an empty array if invalid
	public static findChildElements(parent:Element, tagName:string):Element[]
	{
		if (parent == null) return [];
		let list:Element[] = [];
		let node = parent.firstChild;
		while (node != null)
		{
			if (node.nodeType == Node.ELEMENT_NODE && node.nodeName === tagName) list.push(<Element>node);
			node = <any>node.nextSibling;
		}
		return list;
	}

	// returns a list of all child elements, or an empty array if none
	public static childElements(parent:Element):Element[]
	{
		if (parent == null) return [];
		let list:Element[] = [];
		let node = parent.firstChild;
		while (node != null)
		{
			if (node.nodeType == Node.ELEMENT_NODE) list.push(<Element>node);
			node = <any>node.nextSibling;
		}
		return list;
	}
}

/* EOF */ }