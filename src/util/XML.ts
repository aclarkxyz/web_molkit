/*
    WebMolKit

    (c) 2010-2017 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

/*
	Utilities to supplement the rather rudimentary DOM.
*/

// these are defined locally, in case DOM has to be used as a plugin (in NodeJS mode)

const ELEMENT_NODE = 1;
const ATTRIBUTE_NODE = 2;
const TEXT_NODE = 3;
const CDATA_SECTION_NODE = 4;
const ENTITY_REFERENCE_NODE = 5;
const ENTITY_NODE = 6;
const PROCESSING_INSTRUCTION_NODE = 7;
const COMMENT_NODE = 8;
const DOCUMENT_NODE = 9;
const DOCUMENT_TYPE_NODE = 10;
const DOCUMENT_FRAGMENT_NODE = 11;
const NOTATION_NODE = 12;

export class XML
{
	// these need to be defined when running under a raw NodeJS or worker thread environment, which has the XML parsing functionality stripped out of
	// the API; not necessary when running in regular web browser mode or Electron main task
	public static customParser:any = null;
	public static customSerial:any = null;

	// DOM <--> String
	public static parseXML(strXML:string):Document
	{
		let xmlDoc:Document;
		if (this.customParser)
			xmlDoc = new this.customParser().parseFromString(strXML, 'application/xml');
		else
			xmlDoc = new DOMParser().parseFromString(strXML, 'application/xml');
		if (xmlDoc == null) return null;
		return xmlDoc;
	}
	public static toString(doc:Document):string
	{
		if (this.customSerial)
			return new this.customSerial().serializeToString(doc.documentElement);
		else
			return new XMLSerializer().serializeToString(doc.documentElement);
	}
	public static toPrettyString(doc:Document):string
	{
		let xslt =
		[
			'<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
			'  <xsl:strip-space elements="*"/>',
			'  <xsl:template match="para[content-style][not(text())]">',
			'    <xsl:value-of select="normalize-space(.)"/>',
			'  </xsl:template>',
			'  <xsl:template match="node()|@*">',
			'    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
			'  </xsl:template>',
			'  <xsl:output indent="yes"/>',
			'</xsl:stylesheet>',
		].join('\n');
		let xsltDoc = this.parseXML(xslt);
		let xsltProc = new XSLTProcessor();
		xsltProc.importStylesheet(xsltDoc);
		let resultDoc = xsltProc.transformToDocument(doc);
		return new XMLSerializer().serializeToString(resultDoc);
	}

	// composes all of the text nodes and returns them
	public static nodeText(el:Node):string
	{
		let text = '';
		for (let child of Array.from(el.childNodes))
		{
			if (child.nodeType == TEXT_NODE || child.nodeType == CDATA_SECTION_NODE) text += child.nodeValue;
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
		return this.nodeText(el);
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
		let el = parent.ownerDocument.createElement(name) as Element;
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
			if (node.nodeType == ELEMENT_NODE && node.nodeName == tagName) return node as Element;
			node = node.nextSibling as any;
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
			if (node.nodeType == ELEMENT_NODE && node.nodeName === tagName) list.push(node as Element);
			node = node.nextSibling as any;
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
			if (node.nodeType == ELEMENT_NODE) list.push(node as Element);
			node = node.nextSibling as any;
		}
		return list;
	}
}

