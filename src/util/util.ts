/*
    WebMolKit

    (c) 2010-2017 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='Vec.ts'/>

namespace WebMolKit /* BOF */ {

/*
	General purpose functions. Note that these are not in the WebMolKit namespace.
*/

// string-to-number: control the behaviour when invalid
export function safeInt(str:string, def:number = 0):number
{
	if (str == null || str.length == 0) return def;
	let val = str.startsWith('0x') ? parseInt(str.substring(2), 16) :
			str.startsWith('#') ? parseInt(str.substring(1), 16) : parseInt(str);
	return isNaN(val) ? def : val;
}
export function safeFloat(str:string, def:number = 0):number
{
	if (str == null || str.length == 0) return def;
	let val = parseFloat(str);
	return isNaN(val) ? def : val;
}

// creates a new element, with a specific parent (raw or jQuery); returns the child node - the raw DOM element, not the
// jQuery wrapper
export function newElement(parent:any, tag:string, attr?:any):Element
{
	let el = $(`<${tag}>`);
	if (attr) el.attr(attr);
	$(parent).append(el);
	return el[0];
}

// appends child text to the node
export function addText(parent:any, text:string)
{
	let el:Element = parent instanceof jQuery ? (parent as JQuery)[0] : parent as Element;
	el.appendChild(document.createTextNode(text));
}

// convenience wrapper
export function setVisible(node:any, visible:boolean)
{
	if (visible) $(node).show(); else $(node).hide();
}

// convenience function for adding the plural modifier, i.e. "1 thing" vs "N things"
export function plural(count:number):string
{
	return count == 1 ? '' : 's';
}

// turns a number into a floating point representation with a maximum number of significant figures
export function formatDouble(value:number, sigfig:number):string
{
	if (value == null) return '';
	let str = value.toPrecision(sigfig);
	if (str.indexOf('.') > 0) while (str.endsWith('0') || str.endsWith('.')) str = str.substring(0, str.length - 1);
	return str;
}

// turns an HTML-style colour (#RRGGBB) into its numeric equivalent (0xRRGGBB), or null if invalid
export function htmlToRGB(col:string):number
{
	if (col == null || col.charAt(0) != '#' || col.length != 7) return null;
	return parseInt(col.substring(1), 16);
}

// converts an integer colour (0xTTRRGGBB) to the HTML style; transparency info is stripped out
export function colourCode(col:number):string
{
	let hex = (col & 0xFFFFFF).toString(16);
	while (hex.length < 6) hex = '0' + hex;
	return '#' + hex;
}
// returns the alpha value for a colour, assuming that it is an integer of the 0xTTRRGGBB format
export function colourAlpha(col:number):number
{
	let transp = (col >>> 24) & 0xFF;
	return transp == 0 ? 1 : transp == 0xFF ? 0 : 1 - (transp * (1.0 / 255));
}
// turns a TRGB integer into the style used by the canvas node
const ONE_OVER_255 = 1.0 / 255;
export function colourCanvas(col:number):string
{
	// simple cases first
	if (col == 0xFFFFFF) return 'white';
	if (col == 0x000000) return 'black';
	if (col == -1) return null; //return 'rgba(0,0,0,0)';
	if (col >= 0 && col <= 0xFFFFFF) return colourCode(col);

	// if there's transparency, use the long-winded syntax
	const t = ((col >> 24) & 0xFF) * ONE_OVER_255;
	const r = ((col >> 16) & 0xFF);// * ONE_OVER_255;
	const g = ((col >> 8) & 0xFF);// * ONE_OVER_255;
	const b = (col & 0xFF);// * ONE_OVER_255;
	return 'rgba(' + r + ',' + g + ',' + b + ',' + (1 - t) + ')';
}

// RGB manipulation: very convenient functions for "smearing" between fractional values
export function blendRGB(fract:number, rgb1:number, rgb2:number, rgb3?:number):number
{
	fract = Math.max(0, Math.min(1, fract));

	let r1 = ((rgb1 >> 16) & 0xFF) * ONE_OVER_255, g1 = ((rgb1 >> 8) & 0xFF) * ONE_OVER_255, b1 = (rgb1 & 0xFF) * ONE_OVER_255;
	let r2 = ((rgb2 >> 16) & 0xFF) * ONE_OVER_255, g2 = ((rgb2 >> 8) & 0xFF) * ONE_OVER_255, b2 = (rgb2 & 0xFF) * ONE_OVER_255;
	let R:number, G:number, B:number;

	if (rgb3 == null)
	{
		let f1 = 1 - fract, f2 = fract;
		R = Math.round(0xFF * (f1 * r1 + f2 * r2));
		G = Math.round(0xFF * (f1 * g1 + f2 * g2));
		B = Math.round(0xFF * (f1 * b1 + f2 * b2));
	}
	else
	{
		let r3 = ((rgb3 >> 16) & 0xFF) * ONE_OVER_255, g3 = ((rgb3 >> 8) & 0xFF) * ONE_OVER_255, b3 = (rgb3 & 0xFF) * ONE_OVER_255;

		if (fract < 0.5)
		{
			let f2 = fract * 2, f1 = 1 - f2;
			R = Math.round(0xFF * (f1 * r1 + f2 * r2));
			G = Math.round(0xFF * (f1 * g1 + f2 * g2));
			B = Math.round(0xFF * (f1 * b1 + f2 * b2));
		}
		else
		{
			let f2 = (fract - 0.5) * 2, f1 = 1 - f2;
			R = Math.round(0xFF * (f1 * r2 + f2 * r3));
			G = Math.round(0xFF * (f1 * g2 + f2 * g3));
			B = Math.round(0xFF * (f1 * b2 + f2 * b3));
		}
	}

	return (R << 16) | (G << 8) | B;
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
export function nodeText(node:Node)
{
	let ret = '';
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
export function isDef(v:any)
{
	return !(v === null || typeof v === 'undefined');
}
export function notDef(v:any)
{
	return v === null || typeof v === 'undefined';
}

// given a particular event, picks out the (x,y) coordinates, and offsets them until they are in the space of the given
// node container, which must be a parent
export function eventCoords(event:BaseJQueryEventObject, container:any):number[]
{
	let parentOffset = $(container).offset();
	let relX = event.pageX - parentOffset.left;
	let relY = event.pageY - parentOffset.top;
	return [relX, relY];
}

// sets an object's position by pixel: convenience function otherwise rather ugly code; assumes that the positioning style already configured as needed
export function setBoundaryPixels(dom:JQuery, x:number, y:number, w:number, h:number):void
{
	dom.css({'left': x + 'px', 'top': y + 'px', 'width': w + 'px', 'height': h + 'px'});
}

// geometry functions
export function norm_xy(dx:number, dy:number):number
{
	return Math.sqrt(dx * dx + dy * dy);
}
export function norm_xyz(dx:number, dy:number, dz:number):number
{
	return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
export function norm2_xy(dx:number, dy:number):number
{
	return dx * dx + dy * dy;
}
export function norm2_xyz(dx:number, dy:number, dz:number):number
{
	return dx * dx + dy * dy + dz * dz;
}

// miscellaneous math
export function sqr(v:number):number
{
	return v * v;
}
export function invZ(v:number):number {return v == 0 ? 0 : 1.0 / v;}

// returns true if the numbers are effectively equal, assuming float/double precision
export function fltEqual(v1:number, v2:number) {return v1 == v2 || Math.abs(v1 - v2) <= 1E-7 * Math.max(v1, v2);}
export function realEqual(v1:number, v2:number) {return v1 == v2 || Math.abs(v1 - v2) <= 1E-14 * Math.max(v1, v2);}

// returns a random integer between 0 and size-1
export function randomInt(size:number):number
{
	if (size <= 1) return 0;
	return Math.floor(Math.random() * size);
}

// angle helpers
export const TWOPI = 2 * Math.PI;
export const INV_TWOPI = 1.0 / TWOPI;
export const DEGRAD = Math.PI / 180;
export const RADDEG = 180 / Math.PI;

// normalised angle, guaranteed to be -PI <= th < PI
export function angleNorm(th:number):number
{
	if (th == -Math.PI) return Math.PI;
	if (th < -Math.PI) {let mod = Math.ceil((-th - Math.PI) * INV_TWOPI); return th + mod * TWOPI;}
	if (th > Math.PI) {let mod = Math.ceil((th - Math.PI) * INV_TWOPI); return th - mod * TWOPI;}
	return th;
}

// angular difference, guaranteed to be normalised
export function angleDiff(th1:number, th2:number):number
{
	let theta = angleNorm(th1) - angleNorm(th2);
	return theta - (theta > Math.PI ? TWOPI : 0) + (theta <= -Math.PI ? TWOPI : 0);
}

// angular difference, which is normalised from 0 <= th < 2 * PI
export function angleDiffPos(th1:number, th2:number):number
{
	let theta = angleNorm(th1) - angleNorm(th2);
	return theta + (theta < 0 ? TWOPI : 0);
}

// for an array of angles (in radians), sorts them in order; then, rotates the array around as many times as is necessary
// so that the difference between the first & last angles is >= than the difference between the first & second
export function sortAngles(theta:number[]):number[]
{
	if (theta == null || theta.length < 2) return theta;
	theta = theta.slice(0);
	for (let n = 0; n < theta.length; n++) theta[n] = angleNorm(theta[n]);
	Vec.sort(theta);
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
export function uniqueAngles(theta:number[], threshold:number):number[]
{
	theta = sortAngles(theta);
	for (let n = 1; n < theta.length; n++)
	{
		if (Math.abs(angleDiff(theta[n], theta[n - 1])) <= threshold) {theta.splice(n, 1); n--;}
	}
	return theta;
}

// array bounds
export function minArray(a:number[]):number
{
	if (a == null || a.length == 0) return 0;
	let v = a[0];
	for (let n = 1; n < a.length; n++) v = Math.min(v, a[n]);
	return v;
}
export function maxArray(a:number[]):number
{
	if (a == null || a.length == 0) return 0;
	let v = a[0];
	for (let n = 1; n < a.length; n++) v = Math.max(v, a[n]);
	return v;
}

// convenience function: finds a child node by name
export function findNode(parent:Node, name:string):Element
{
	if (parent == null) return null;
	let node = parent.firstChild;
	while (node)
	{
		if (node.nodeType == Node.ELEMENT_NODE && node.nodeName == name) return node as Element;
		node = node.nextSibling as any;
	}
	return null;
}

// as above, but returns a list; may be empty
export function findNodes(parent:Node, name:string):Element[]
{
	if (parent == null) return null;
	let node = parent.firstChild;
	let list:Element[] = [];
	while (node)
	{
		if (node.nodeType == Node.ELEMENT_NODE && node.nodeName == name) list.push(node as Element);
		node = node.nextSibling as any;
	}
	return list;
}

// creates a rounded rectangle path using splines
export function pathRoundedRect(x1:number, y1:number, x2:number, y2:number, rad:number):Path2D
{
	let path = new Path2D();
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
export function drawLine(ctx:CanvasRenderingContext2D, x1:number, y1:number, x2:number, y2:number)
{
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
}

// for HTML canvas, approximates the conversion of height to ascent ratio (i.e. pass in ascent * ASCENT_FUDGE to the font height)
export const ASCENT_FUDGE = 1.4;
export function fontSansSerif(ascent:number) {return `${ascent * ASCENT_FUDGE}px sans-serif`;}

// returns the density of pixels, i.e. 1 for a regular screen, 2 for retina, etc.
export function pixelDensity():number
{
	if ('devicePixelRatio' in window && window.devicePixelRatio > 1) return window.devicePixelRatio;
	return 1;
}

// performs a shallow copy of the object: the top level guarantees new objects, while anything below that may contain
// duplicate references with potential mutability issues
export function clone<T>(data:T):T
{
	if (data == null) return null;
	if (Array.isArray(data)) return (data as any).slice(0) as T;
	if (typeof data != 'object') return data;
	let result:any = {};
	for (let key in data) result[key] = data[key];
	return result as T;
}

// performs a deep clone of any kind of object: goes as deep as it has to to make sure everything is immutable; the parameter
// should not contain functions or host objects
export function deepClone<T>(data:T):T
{
	if (data == null) return null;
	if (typeof data == 'function') return null;
	if (typeof data != 'object') return data;

	let result:any = Array.isArray(data) ? [] : {};
	for (let key in data)
	{
		let val = data[key];
		result[key] = typeof val === 'object' ? deepClone(val) : val;
	}
	return result as T;
}

// HTML-to-escape; gets most of the basics
export function escapeHTML(text:string):string
{
	if (!text) return '';
	const map:{[id:string] : string} = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'};
	return text.replace(/[&<>"']/g, (m) => map[m]);
}

// convenience: make sure a string isn't null
export function orBlank(str:string):string {return str == null ? '' : str;}

// abstracts values into an array; this will be obsolete once Object.values() makes it into the typescript mappings
export function dictValues<T>(dict:{[id:string] : T}):T[]
{
	let list:T[] = [];
	for (let key in dict) list.push(dict[key]);
	return list;
}

// converts a string (which is stored by JavaScript as UCS2) to UTF8, where each character is guaranteed to be 1 byte
export function toUTF8(str:string):string
{
	let data:string[] = [], stripe = '';
	const sz = str.length;
	for (let n = 0; n < sz; n++)
	{
		let charcode = str.charCodeAt(n);
		if (charcode < 0x80) stripe += str.charAt(n);
		else if (charcode < 0x800)
		{
			stripe += String.fromCharCode(0xc0 | (charcode >> 6));
			stripe += String.fromCharCode(0x80 | (charcode & 0x3F));
		}
		else if (charcode < 0xd800 || charcode >= 0xe000)
		{
			stripe += String.fromCharCode(0xe0 | (charcode >> 12));
			stripe += String.fromCharCode(0x80 | ((charcode >> 6) & 0x3F));
			stripe += String.fromCharCode(0x80 | (charcode & 0x3F));
		}
		else // surrogate pair
		{
			n++;
			charcode = 0x10000 + (((charcode & 0x3FF) << 10) | (str.charCodeAt(n) & 0x3FF));
			stripe += String.fromCharCode(0xf0 | (charcode >> 18));
			stripe += String.fromCharCode(0x80 | ((charcode >> 12) & 0x3F));
			stripe += String.fromCharCode(0x80 | ((charcode >> 6) & 0x3F));
			stripe += String.fromCharCode(0x80 | (charcode & 0x3F));
		}
		if (stripe.length > 100)
		{
			data.push(stripe);
			stripe = '';
		}
	}
	data.push(stripe);
	return data.join('');
}

// converts a UTF8 string to a regular JavaScript string (which is UCS2-encoded)
export function fromUTF8(str:string):string
{
	let data:string[] = [], stripe = '';
	const sz = str.length;
	for (let n = 0; n < sz; n++)
	{
		let value = str.charCodeAt(n);
		if (value < 0x80) stripe += str.charAt(n);
		else if (value > 0xBF && value < 0xE0)
		{
			stripe += String.fromCharCode((value & 0x1F) << 6 | str.charCodeAt(n + 1) & 0x3F);
			n++;
		}
		else if (value > 0xDF && value < 0xF0)
		{
			str += String.fromCharCode((value & 0x0F) << 12 | (str.charCodeAt(n + 1) & 0x3F) << 6 | str.charCodeAt(n + 2) & 0x3F);
			n += 2;
		}
		else // surrogate pair
		{
			let charCode = ((value & 0x07) << 18 | (str.charCodeAt(n + 1) & 0x3F) << 12 | (str.charCodeAt(n + 2) & 0x3F) << 6 | str.charCodeAt(n + 3) & 0x3F) - 0x010000;
			stripe += String.fromCharCode(charCode >> 10 | 0xD800, charCode & 0x03FF | 0xDC00);
			n += 3;
		}
		if (stripe.length > 100)
		{
			data.push(stripe);
			stripe = '';
		}
	}
	data.push(stripe);
	return data.join('');
}

// returns a pretty-printed JSON representation with tabs and aligned braces (Allman/ANSI-style) rather than the kack-braced default
export function jsonPrettyPrint(json:any):string
{
	let lines = JSON.stringify(json, null, 1).split(/\n/);
	for (let n = 0; n < lines.length; n++)
	{
		lines[n] = lines[n].trim();
		if (lines[n].length > 1 && lines[n].endsWith('{') || lines[n].endsWith('['))
		{
			let ch = lines[n].charAt(lines[n].length - 1);
			lines[n] = lines[n].substring(0, lines[n].length - 1);
			lines.splice(n + 1, 0, ch);
			n--;
		}
	}
	let indent = 0;
	for (let n = 0; n < lines.length; n++)
	{
		let orig = lines[n];
		if (orig == ']' || orig == '}') indent--;
		lines[n] = '\t'.repeat(indent) + orig;
		if (orig == '[' || orig == '{') indent++;
	}
	return lines.join('\n');
}

// installs a handler on both of the <input> line chokepoints: change & keyup are both necessary for many functions, because this
// gets keyboard events and things like pasting in content
export function inputChanged(domInput:JQuery, callback:() => void):void
{
	domInput.keyup(callback);
	domInput.change(callback);
}

// special keycodes, which correspond to KeyboardEvent.key: for the most part anything that is written on the keyboard as a single character can
// be used literally (e.g. things like 1 , < [ {); these named constants are not all self-explanatory
export const enum KeyCode
{
	Backspace = 'Backspace',
	Tab = 'Tab',
	Enter = 'Enter',
	Escape = 'Escape',
	Space = ' ',
	PageUp = 'PageUp',
	PageDown = 'PageDown',
	End = 'End',
	Home = 'Home',
	Left = 'ArrowLeft',
	Right = 'ArrowRight',
	Up = 'ArrowUp',
	Down = 'ArrowDown',
	Delete = 'Delete',
	Insert = 'Insert',
}

/* EOF */ }