/*
    MolSync

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=molsync]
*/

//import $ from "JQuery";

/*// shorthand for element-by-id
function node(id)
{
	return goog.dom.getElement(id);
}*/

// creates a new element, with a specific parent (raw or jQuery); returns the child node - the raw DOM element, not the
// jQuery wrapper
function newElement(parent:any, tag:string, attr?:any):Element
{
	/*if (!goog.isDef(attr)) attr = {};
	var el = goog.dom.createDom(tag, attr, stuff);
	goog.dom.appendChild(parent, el);
	return el;*/
	
	let el = $(`<${tag}>`);
	if (attr) el.attr(attr);
	$(parent).append(el);
	return el[0];
}

// appends child text to the node
function addText(parent:any, text:string)
{
	let el:Element = parent instanceof jQuery ? (<JQuery>parent)[0] : <Element>parent;
	//if (parent instanceof jQuery) el = (<JQuery>parent)[0]; else el = <Element>parent;
	//let el:Element = parent instanceof JQuery ? (<JQuery>parent[0]) : <Element>parent;
	el.appendChild(document.createTextNode(text)); 
}

// convenience wrapper
function setVisible(node:any, visible:boolean)
{
	if (visible) $(node).show(); else $(node).hide();
}

// convenience function for adding the plural modifier, i.e. "1 thing" vs "N things"
function plural(count:number):string
{
	return count == 1 ? '' : 's';
}


// converts an integer colour (0xTTRRGGBB) to the HTML style; transparency info is stripped out
function colourCode(col:number):string
{
	var hex = (col & 0xFFFFFF).toString(16);
	while (hex.length < 6) hex = '0' + hex;
	return '#' + hex;
}
// returns the alpha value for a colour, assuming that it is an integer of the 0xTTRRGGBB format
function colourAlpha(col:number):number
{
	var transp = (col >>> 24) & 0xFF;
	return transp == 0 ? 1 : transp == 0xFF ? 0 : 1 - (transp * (1.0 / 255));
}
// turns a TRGB integer into the style used by the canvas node
const ONE_OVER_255 = 1.0 / 255;
function colourCanvas(col:number):string
{
	// simple cases first
	if (col == 0xFFFFFF) return 'white';
	if (col == 0x000000) return 'black';
	if (col == -1) return undefined; //return 'rgba(0,0,0,0)';
	if (col >= 0 && col <= 0xFFFFFF) return colourCode(col);
	
	// if there's transparency, use the long-winded syntax
	const t = ((col >> 24) & 0xFF) * ONE_OVER_255;
	const r = ((col >> 16) & 0xFF);// * ONE_OVER_255;
	const g = ((col >> 8) & 0xFF);// * ONE_OVER_255;
	const b = (col & 0xFF);// * ONE_OVER_255;
	return 'rgba(' + r + ',' + g + ',' + b + ',' + (1 - t) + ')';
}

// takes a GMT date formatted as yyyy-mm-dd hh:mm:ss and converts it to the local timezone, and displays it
// nicely (not including the time)
/*function formatGMTDateNicely(gmtDate:string)
{
	if (!gmtDate) return '';
	var regex = /^(\d\d\d\d)-(\d\d)-(\d\d) (\d\d):(\d\d):(\d\d)/;
	var bits:string[] = gmtDate.match(regex);
	if (!bits) return '';
	for (var n = 1; n <= 6; n++) bits[n] = parseFloat(bits[n]);

	var date = new goog.date.DateTime(bits[1], bits[2] - 1, bits[3], bits[4], bits[5], bits[6]);
	var offset = new goog.date.Interval(goog.date.Interval.MINUTES, -date.getTimezoneOffset());
	date.add(offset);

	var day = date.getDate(), mon = date.getMonth(), year = date.getYear();
	var MONTHS =
	[
		'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
	];
	return day + '-' + MONTHS[mon] + '-' + year;
}*/

// goes through all text-node children and splices them together
function nodeText(node:Node)
{
	var ret = '';
	if (!node) return;
	node = node.firstChild;
	while (node)
	{
		if (node.nodeType == 3 || node.nodeType == 4) ret += node.nodeValue;
		node = node.nextSibling;
	}
	return ret;
}

// convenience functions to abstract the unreasonably longwinded closures function
function isDef(v:any)
{
	return !(v === null || typeof v === 'undefined');
}
function notDef(v:any)
{
	return v === null || typeof v === 'undefined';
}
/*function indexOf(obj, arr)
{
	return goog.array.indexOf(arr,obj);
}*/

// given a particular event, picks out the (x,y) coordinates, and offsets them until they are in the space of the given
// node container, which must be a parent
function eventCoords(event:JQueryEventObject, container:any):number[]
{
	var parentOffset = $(container).offset(); 
	var relX = event.pageX - parentOffset.left;
	var relY = event.pageY - parentOffset.top;
	return [relX, relY];	
	
	/*var epos = goog.style.getClientPosition(event);
	var cpos = goog.style.getClientPosition(container);
	return [epos.x - cpos.x, epos.y - cpos.y];*/
}

// geometry functions
function norm_xy(dx:number, dy:number):number
{
	return Math.sqrt(dx * dx + dy * dy);
}
function norm_xyz(dx:number, dy:number, dz:number):number
{
	return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
function norm2_xy(dx:number, dy:number):number
{
	return dx * dx + dy * dy;
}
function norm2_xyz(dx:number, dy:number, dz:number):number
{
	return dx * dx + dy * dy + dz * dz;
}
function sqr(v:number):number
{
	return v * v;
}

// angle helpers
const TWOPI = 2 * Math.PI;
const INV_TWOPI = 1.0 / TWOPI;
const DEGRAD = Math.PI / 180;
const RADDEG = 180 / Math.PI;

// normalised angle, guaranteed to be -PI <= th < PI
function angleNorm(th:number):number
{
	if (th == -Math.PI) return Math.PI;
	if (th < -Math.PI) {let mod = Math.ceil((-th - Math.PI) * INV_TWOPI); return th + mod * TWOPI;}
	if (th > Math.PI) {let mod = Math.ceil((th - Math.PI) * INV_TWOPI); return th - mod * TWOPI;}
	return th;
}

// angular difference, guaranteed to be normalised
function angleDiff(th1:number, th2:number):number
{
	let theta = angleNorm(th1) - angleNorm(th2);
	return theta - (theta > Math.PI ? TWOPI : 0) + (theta <= -Math.PI ? TWOPI : 0);
}

// angular difference, which is normalised from 0 <= th < 2 * PI 
function angleDiffPos(th1:number, th2:number):number
{
	let theta = angleNorm(th1) - angleNorm(th2);
	return theta + (theta < 0 ? TWOPI : 0);
}

// for an array of angles (in radians), sorts them in order; then, rotates the array around as many times as is necessary
// so that the difference between the first & last angles is >= than the difference between the first & second
function sortAngles(theta:number[]):number[]
{
	if (theta == null || theta.length < 2) return theta;
	theta = theta.slice(0);
	for (let n = 0; n < theta.length; n++) theta[n] = angleNorm(theta[n]);
	theta.sort();
	while (true)
	{
		let a = theta[theta.length - 1], b = theta[0], c = theta[1];
		if (angleDiff(b, a) <= angleDiff(c, b)) break;
		for (let n = theta.length - 1; n > 0; n--) theta[n] = theta[n - 1];
		theta[0] = a;
	}
	return theta;
}

// calculates a list of unique angles (based on the threshold parameter, in radians), and returns it; the returned list of 
// angles will be sorted in order, as described by sortAngles(..); note that there is no fancy clustering, so a sequence of 
// angles which are a bit below the threshold is not guaranteed to be stable; there is also a boundary case which bumps the 
// sort rotation status slightly out of whack
function uniqueAngles(theta:number[], threshold:number):number[]
{
	theta = sortAngles(theta);
	for (let n = 1; n < theta.length; n++)
	{
		if (Math.abs(angleDiff(theta[n], theta[n - 1])) <= threshold) {theta.splice(n, 1); n--;} 
	}
	return theta;
}

// array bounds
function minArray(a:number[]):number
{
	if (a == null || a.length == 0) return 0;
	var v = a[0];
	for (var n = 1; n < a.length; n++) v = Math.min(v, a[n]);
	return v;
}
function maxArray(a:number[]):number
{
	if (a == null || a.length == 0) return 0;
	var v = a[0];
	for (var n = 1; n < a.length; n++) v = Math.max(v, a[n]);
	return v;
}

/*
// returns an array of all the keys within an object
function getKeys(obj)
{
   return goog.object.getKeys(obj);
}*/

// convenience function: finds a child node by name
function findNode(parent:Node, name:string):Element
{
	if (parent == null) return null;
	var node = parent.firstChild;
	while (node)
	{
		if (node.nodeType == Node.ELEMENT_NODE && node.nodeName == name) return <Element>node;
		node = node.nextSibling;
	}
	return null;
}

// as above, but returns a list; may be empty
function findNodes(parent:Node, name:string):Element[]
{
	if (parent == null) return null;
	var node = parent.firstChild;
	var list:Element[] = [];
	while (node)
	{
		if (node.nodeType == Node.ELEMENT_NODE && node.nodeName == name) list.push(<Element>node);
		node = node.nextSibling;
	}
	return list;
}

/*
// render an object as a string for debuggering purposes
function dump(obj)
{
	return goog.debug.expose(obj);
}
*/

// creates a rounded rectangle path using splines
function pathRoundedRect(x1:number, y1:number, x2:number, y2:number, rad:number):Path2D
{
	var path = new Path2D();
	//path.moveTo(x1 + rad, y1);
	//path.lineTo(x2 - rad, y1);
	path.moveTo(x2 - rad, y1);
	path.quadraticCurveTo(x2, y1, x2, y1 + rad);
	path.lineTo(x2, y2 - rad);
	path.quadraticCurveTo(x2, y2, x2 - rad, y2);
	path.lineTo(x1 + rad, y2);
	path.quadraticCurveTo(x1, y2, x1, y2 - rad);
	path.lineTo(x1, y1 + rad);
	path.quadraticCurveTo(x1, y1, x1 + rad, y1);
	path.closePath();
	return path;
}

// convenience functions
function drawLine(ctx:CanvasRenderingContext2D, x1:number, y1:number, x2:number, y2:number)
{
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
}

// for HTML canvas, approximates the conversion of height to ascent ratio (i.e. pass in ascent * ASCENT_FUDGE to the font height)
const ASCENT_FUDGE = 1.4;
function fontSansSerif(ascent:number) {return `${ascent * ASCENT_FUDGE}px sans`;}

// returns the density of pixels, i.e. 1 for a regular screen, 2 for retina, etc.
function pixelDensity():number
{
    if ('devicePixelRatio' in window && window.devicePixelRatio > 1) return window.devicePixelRatio;
    return 1;
}

// performs a shallow copy of the object: as long as the values are effectively immutable, this will do the trick
function clone(obj:{[id:string] : any})
{
	let dup:{[id:string] : any} = {};
	for (let key in obj) dup[key] = obj[key];
	return dup;
}

// HTML-to-escape; gets most of the basics
function escapeHTML(text:string):string
{
	if (!text) return '';
	const map:{[id:string] : string} = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'};
	return text.replace(/[&<>"']/g, function(m) {return map[m];});
}
