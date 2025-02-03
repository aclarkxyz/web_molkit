/*
	WebMolKit

	(c) 2010-2018 Molecular Materials Informatics, Inc.

	All rights reserved

	http://molmatinf.com

	[PKG=webmolkit]
*/

import {Box} from '../util/Geom';
import {colourAlpha, colourCanvas, colourCode, DEGRAD, newElement, pixelDensity} from '../util/util';
import {Vec} from '../util/Vec';
import {FontData, FontDataNativeOpt} from './FontData';

/*
	MetaVector: allows the construction of a set of drawing primitives of the most basic variety. These are collected together so that they can be analyzed,
	e.g. finding the precise boundary, and optionally transformed or spooled into other such instances.

	Rendering can be done by creating an SVG instance reflecting the content, or writing onto an HTML canvas using drawing primitives.

	Separation of type & object is done in order to optimise SVG creation: when a lot of objects with the same characteristics (e.g. fill/outline) are consecutive,
	this allows them to be grouped together without repeating unnecessary information.

	Line, Rect & Oval objects are fairly self-explanatory.

	Text objects are handled unusually: they correspond to internally-defined paths, so they can be measured *precisely* without knowing the rendering context
	ahead of time. This means that the font options are limited, but for most chemistry rendering tasks, this is not a dealbreaker.

	TextNative is to be used in cases where the font should match other renderings on the device, e.g. HTML text & MetaVector text should be drawn in the same
	way. The font is specified using the CSS style, which is the same for SVG & canvas. Measurement of the native text is done by making a fake invisible background
	canvas which is specific to the current HTML environment. Rendering on another device does not guarantee the same metrics, so caution must be exercised.
*/

export enum TextAlign
{
	Centre = 0,
	Left = 1,
	Right = 2,
	Baseline = 0,
	Middle = 4,
	Top = 8,
	Bottom = 16
}

enum PrimClass
{
	Line = 1,
	Rect = 2,
	Oval = 3,
	Path = 4,
	Text = 5,
	TextNative = 6,
}

interface PrimBase
{
	primClass:PrimClass;
	typeidx:number;
}
interface TypeBase
{
	primClass:PrimClass;
}

interface LinePrim extends PrimBase
{
	x1:number;
	y1:number;
	x2:number;
	y2:number;
}
interface LineType extends TypeBase
{
	thickness:number;
	colour:number;
}

interface RectPrim extends PrimBase
{
	x:number;
	y:number;
	w:number;
	h:number;
}
interface RectType extends TypeBase
{
	edgeCol:number;
	fillCol:number;
	thickness:number;
}

interface OvalPrim extends PrimBase
{
	cx:number;
	cy:number;
	rw:number;
	rh:number;
}
interface OvalType extends TypeBase
{
	edgeCol:number;
	fillCol:number;
	thickness:number;
}

interface PathPrim extends PrimBase
{
	count:number;
	x:number[];
	y:number[];
	ctrl:boolean[];
	closed:boolean;
}
interface PathType extends TypeBase
{
	edgeCol:number;
	fillCol:number;
	thickness:number;
	hardEdge:boolean;
}

interface TextPrim extends PrimBase
{
	x:number;
	y:number;
	txt:string;
	direction:number;
}
interface TextType extends TypeBase
{
	size:number;
	colour:number;
}

interface TextNativePrim extends PrimBase
{
	x:number;
	y:number;
	txt:string;
}
interface TextNativeType extends TypeBase
{
	family:string;
	size:number;
	colour:number;
	opt:FontDataNativeOpt;
}

function pixelCoord(val:number):string
{
	let str = val.toFixed(4);
	let match = /^(.*\.\d*?[1-9]+)0+$/.exec(str) ?? /^(.*)\.0+$/.exec(str);
	if (match) str = match[1];
	return str;
}

class SpoolSVG
{
	private lines:string[] = [];
	private depth = 0;

	constructor(private prettyPrint:boolean) {}
	public spool(str:string) {if (str?.length > 0) this.lines.push(str);}
	public start(str:string):void
	{
		if (this.prettyPrint && this.depth > 0) this.lines.push('  '.repeat(this.depth));
		this.spool(str);
	}
	public stop(str:string):void
	{
		this.spool(str);
		if (this.prettyPrint) this.lines.push('\n');
	}
	public whole(str:string):void
	{
		if (this.prettyPrint && this.depth > 0) this.lines.push('  '.repeat(this.depth));
		this.spool(str);
		if (this.prettyPrint) this.lines.push('\n');

	}
	public attr(key:string, val:string | number):void
	{
		if (typeof val == 'number')
		{
			val = pixelCoord(val);
		}
		this.spool(` ${key}="${val}"`);
	}
	public inc():void {this.depth++;}
	public dec():void {this.depth--;}
	public toString():string {return this.lines.join('');}
}

export class MetaVector
{
	//private ONE_THIRD = 1.0 / 3;

	public static NOCOLOUR = -1;

	private types:TypeBase[] = [];
	private prims:PrimBase[] = [];
	private typeObj:TypeBase[];
	public width:number = 0;
	public height:number = 0;
	public offsetX = 0;
	public offsetY = 0;
	public scale = 1;
	public density = 1;

	private charMask:boolean[];
	private charMissing = false;
	private lowX:number = null;
	private lowY:number = null;
	private highX:number = null;
	private highY:number = null;

	// ------------ public methods ------------

	constructor(vec?:any)
	{
		const font = FontData.main;

		this.charMask = Vec.booleanArray(false, font.UNICODE.length);

		if (vec != null)
		{
			if (vec.size != null)
			{
				this.width = vec.size[0];
				this.height = vec.size[1];
			}
			if (vec.types != null) this.types = vec.types;
			if (vec.prims != null) this.prims = vec.prims;

			// extract char-mask
			for (let p of this.prims) if (p.primClass == PrimClass.Text)
			{
				let {txt} = (p as TextPrim);
				for (let n = 0; n < txt.length; n++)
				{
					let i = font.getIndex(txt.charAt(n));
					if (i >= 0) this.charMask[i] = true; else this.charMissing = true;
				}
			}
		}
	}

	// methods for adding a primitive (and possibly a type to go with it)
	public drawLine(x1:number, y1:number, x2:number, y2:number, colour:number, thickness:number):void
	{
		if (thickness == null) thickness = 1;
		let typeidx = this.findOrCreateType({primClass: PrimClass.Line, thickness, colour} as LineType);

		const bump = 0.5 * thickness;
		this.updateBounds(Math.min(x1, x2) - bump, Math.min(y1, y2) - bump);
		this.updateBounds(Math.max(x1, x2) + bump, Math.max(y1, y2) + bump);

		this.prims.push({primClass: PrimClass.Line, typeidx, x1, y1, x2, y2} as LinePrim);
	}
	public drawRect(x:number, y:number, w:number, h:number, edgeCol:number, thickness:number, fillCol:number):void
	{
		if (edgeCol == null) edgeCol = MetaVector.NOCOLOUR;
		if (fillCol == null) fillCol = MetaVector.NOCOLOUR;
		if (thickness == null) thickness = 1;
		let typeidx = this.findOrCreateType({primClass: PrimClass.Rect, edgeCol, fillCol, thickness} as RectType);

		const bump = 0.5 * thickness;
		this.updateBounds(x - bump, y - bump);
		this.updateBounds(x + w + bump, y + h + bump);

		this.prims.push({primClass: PrimClass.Rect, typeidx, x, y, w, h} as RectPrim);
	}
	public drawOval(cx:number, cy:number, rw:number, rh:number, edgeCol:number, thickness:number, fillCol:number):void
	{
		if (edgeCol == null) edgeCol = MetaVector.NOCOLOUR;
		if (fillCol == null) fillCol = MetaVector.NOCOLOUR;
		if (thickness == null) thickness = 1;

		const bump = 0.5 * thickness;
		this.updateBounds(cx - rw - bump, cy - rh - bump);
		this.updateBounds(cx + rw + bump, cy + rh + bump);

		let typeidx = this.findOrCreateType({primClass: PrimClass.Oval, edgeCol, fillCol, thickness} as OvalType);
		this.prims.push({primClass: PrimClass.Oval, typeidx, cx, cy, rw, rh} as OvalPrim);
	}
	public drawPath(xpoints:number[], ypoints:number[], ctrlFlags:boolean[], isClosed:boolean,
					edgeCol:number, thickness:number, fillCol:number, hardEdge:boolean):void
	{
		if (edgeCol == null) edgeCol = MetaVector.NOCOLOUR;
		if (fillCol == null) fillCol = MetaVector.NOCOLOUR;
		if (thickness == null) thickness = 1;
		if (hardEdge == null) hardEdge = false;

		const bump = 0.5 * thickness;
		for (let n = 0; n < xpoints.length; n++)
		{
			// NOTE: treats control points as literals; this could cause glitches, but hasn't yet
			this.updateBounds(xpoints[n] - bump, ypoints[n] - bump);
			if (bump != 0) this.updateBounds(xpoints[n] + bump, ypoints[n] + bump);
		}

		let typeidx = this.findOrCreateType({primClass: PrimClass.Path, edgeCol, fillCol, thickness, hardEdge} as PathType);
		this.prims.push({primClass: PrimClass.Path, typeidx, count: xpoints.length,
						 x: Vec.duplicate(xpoints), y: Vec.duplicate(ypoints), ctrl: ctrlFlags && [...ctrlFlags], closed: isClosed} as PathPrim);
	}
	public drawPoly(xpoints:number[], ypoints:number[], edgeCol:number, thickness:number, fillCol:number, hardEdge:boolean):void
	{
		this.drawPath(xpoints, ypoints, null, true, edgeCol, thickness, fillCol, hardEdge);
	}
	public drawText(x:number, y:number, txt:string, size:number, colour:number, align?:number, direction?:number):void
	{
		if (align == null) align = TextAlign.Left | TextAlign.Baseline;
		if (direction == null) direction = 0;

		let cosTheta = 1, sinTheta = 0;
		if (direction != 0) [cosTheta, sinTheta] = [Math.cos(direction * DEGRAD), Math.sin(direction * DEGRAD)];

		const font = FontData.main;
		for (let n = 0; n < txt.length; n++)
		{
			let i = font.getIndex(txt.charAt(n));
			if (i >= 0) this.charMask[i] = true; else this.charMissing = true;
		}

		let metrics = font.measureText(txt, size);
		let bx = 0, by = 0;

		let dx = 0;
		if ((align & TextAlign.Left) != 0) {}
		else if ((align & TextAlign.Right) != 0) dx = -metrics[0];
		else /* centre */ dx = -0.5 * metrics[0];
		if (dx != 0)
		{
			bx += dx * cosTheta;
			by += dx * sinTheta;
		}

		let dy = 0;
		if ((align & TextAlign.Middle) != 0) dy = 0.5 * metrics[1];
		else if ((align & TextAlign.Top) != 0) dy = metrics[1];
		else if ((align & TextAlign.Bottom) != 0) dy = -metrics[2];
		// else: baseline
		if (dy != 0)
		{
			bx -= dy * sinTheta;
			by += dy * cosTheta;
		}

		// mainstaking measurement of the boundaries (looks like overkill, but it really isn't)
		let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
		let tx = 0;
		for (let n = 0; n < txt.length; n++)
		{
			let ch = txt.charAt(n);
			let i = font.getIndex(ch);
			if (i >= 0)
			{
				let outlineX = font.getOutlineX(i), outlineY = font.getOutlineY(i);
				x1 = Math.min(x1, tx + Vec.min(outlineX));
				x2 = Math.max(x2, tx + Vec.max(outlineX));
				y1 = Math.min(y1, -Vec.max(outlineY));
				y2 = Math.max(y2, -Vec.min(outlineY));

				tx += font.HORIZ_ADV_X[i];
				if (n < txt.length - 1) tx += font.getKerning(ch, txt.charAt(n + 1));

				// !! TODO: compensate for direction if !0 and !baseline/left
			}
			else tx += font.MISSING_HORZ;
		}
		const mscale = size * font.INV_UNITS_PER_EM;
		if (direction == 0)
		{
			this.updateBounds(x + bx + x1 * mscale, y + by + y1 * mscale);
			this.updateBounds(x + bx + x2 * mscale, y + by + y2 * mscale);
		}
		else
		{
			let rx1 = x1 * mscale, ry1 = y1 * mscale;
			let rx2 = x2 * mscale, ry2 = y2 * mscale;
			this.updateBounds(x + bx + rx1 * cosTheta - ry1 * sinTheta, y + by + rx1 * sinTheta + ry1 * cosTheta);
			this.updateBounds(x + bx + rx2 * cosTheta - ry1 * sinTheta, y + by + rx2 * sinTheta + ry1 * cosTheta);
			this.updateBounds(x + bx + rx2 * cosTheta - ry2 * sinTheta, y + by + rx2 * sinTheta + ry2 * cosTheta);
			this.updateBounds(x + bx + rx1 * cosTheta - ry2 * sinTheta, y + by + rx1 * sinTheta + ry2 * cosTheta);
		}

		let typeidx = this.findOrCreateType({primClass: PrimClass.Text, size, colour} as TextType);
		this.prims.push({primClass: PrimClass.Text, typeidx, x: x + bx, y: y + by, txt, direction} as TextPrim);
	}

	// render *native* text, which is defined by an HTML/CSS font specifier; this is different from the built-in text in that it presumes that the device
	// can locate the font at render-time, and that whatever methods were used to measure the font at draw-time are synced; this is a fair assumption when
	// creating graphics for immediate output to a canvas or inline-rendered SVG object, but anything else has to be taken on a case by case basis
	public drawTextNative(x:number, y:number, txt:string, fontFamily:string, fontSize:number, colour:number, align?:number, opt?:FontDataNativeOpt):void
	{
		if (!opt) opt = {};

		if (align == null) align = TextAlign.Left | TextAlign.Baseline;
		const font = FontData.main;

		let metrics = font.measureTextNative(txt, fontFamily, fontSize, opt);

		if ((align & TextAlign.Left) != 0) {}
		else if ((align & TextAlign.Right) != 0) x -= metrics[0];
		else /* centre */ x -= 0.5 * metrics[0];

		if ((align & TextAlign.Middle) != 0) y += 0.5 * metrics[1];
		else if ((align & TextAlign.Top) != 0) y += metrics[1];
		else if ((align & TextAlign.Bottom) != 0) y -= metrics[2];
		// else: baseline

		this.updateBounds(x, y - metrics[1]);
		this.updateBounds(x + metrics[0], y + metrics[2]);

		let typeidx = this.findOrCreateType({primClass: PrimClass.TextNative, family: fontFamily, size: fontSize, colour, opt} as TextNativeType);
		this.prims.push({primClass: PrimClass.TextNative, typeidx, x, y, txt} as TextNativePrim);
	}

	// query the boundaries of the drawing, post factum
	public boundLowX():number {return this.lowX;}
	public boundLowY():number {return this.lowY;}
	public boundHighX():number {return this.highX;}
	public boundHighY():number {return this.highY;}
	public getBounds():Box {return new Box(this.lowX, this.lowY, this.highX - this.lowX, this.highY - this.lowY);}

	// update width/height (this isn't done automatically, as it can be considered a parameter)
	public measure():void
	{
		this.width = Math.ceil(this.highX - this.lowX);
		this.height = Math.ceil(this.highY - this.lowY);
	}

	// for a metavector that has been drawn programmatically, makes sure that origin is (0,0) and that the size is set
	public normalise():void
	{
		if (this.lowX != 0 || this.lowY != 0) this.transformPrimitives(-this.lowX, -this.lowY, 1, 1);
		this.width = Math.ceil(this.highX - this.lowX);
		this.height = Math.ceil(this.highY - this.lowY);
	}

	// convenience
	public setSize(width:number, height:number) {this.width = width; this.height = height;}

	// makes sure everything fits into the indicated box, scaling down if necessary (but not up)
	public transformIntoBox(box:Box):void
	{
		this.transformPrimitives(-this.lowX, -this.lowY, 1, 1);
		let nw = Math.ceil(this.highX - this.lowX), nh = Math.ceil(this.highY - this.lowY);
		let scale = 1;
		if (nw > box.w)
		{
			let mod = box.w / nw;
			nw = box.w;
			nh *= mod;
			scale *= mod;
		}
		if (nh > box.h)
		{
			let mod = box.h / nh;
			nh = box.h;
			nw *= mod;
			scale *= mod;
		}
		let ox = 0.5 * (box.w - nw), oy = 0.5 * (box.h - nh);
		this.transformPrimitives(box.x + ox, box.y + oy, scale, scale);
	}

	// if the width/height of the content exceeds either of the indicated maximum dimensions, it is scaled down accordingly;
	// does not correct for the origin
	public scaleExtent(maxWidth:number, maxHeight:number):void
	{
		let w = this.highX - this.lowX, h = this.highY - this.lowY;
		if (w <= maxWidth && h <= maxHeight) return; // already in bounds
		let scale = Math.min(maxWidth / w, maxHeight / h);
		this.transformPrimitives(0, 0, scale, scale);
	}

	// transforms the sizes and positions of the primitives; a transform of [0,0,1,1] is the identity; the position of each coordinate
	// is rescaled based on: p' = p*scale + offset
	public transformPrimitives(ox:number, oy:number, sw:number, sh:number):void
	{
		if (ox == 0 && oy == 0 && sw == 1 && sh == 1) return;

		for (let a of this.prims)
		{
			const type = a.primClass;
			if (type == PrimClass.Line)
			{
				let line = a as LinePrim;
				line.x1 = ox + line.x1 * sw;
				line.y1 = oy + line.y1 * sh;
				line.x2 = ox + line.x2 * sw;
				line.y2 = oy + line.y2 * sh;
			}
			else if (type == PrimClass.Rect)
			{
				let rect = a as RectPrim;
				rect.x = ox + rect.x * sw;
				rect.y = oy + rect.y * sh;
				rect.w = rect.w * sw;
				rect.h = rect.h * sh;
			}
			else if (type == PrimClass.Oval)
			{
				let oval = a as OvalPrim;
				oval.cx = ox + oval.cx * sw;
				oval.cy = oy + oval.cy * sh;
				oval.rw *= sw;
				oval.rh *= sh;
			}
			else if (type == PrimClass.Path)
			{
				let path = a as PathPrim;
				let sz = path.count, px = path.x, py = path.y;
				for (let n = 0; n < sz; n++)
				{
					px[n] = ox + px[n] * sw;
					py[n] = oy + py[n] * sh;
				}
			}
			else if (type == PrimClass.Text || type == PrimClass.TextNative)
			{
				let text = a as TextPrim | TextNativePrim;
				text.x = ox + text.x * sw;
				text.y = oy + text.y * sh;
			}
		}
		let swsh = 0.5 * (sw + sh);
		if (swsh != 1) for (let t of this.types)
		{
			const type = t.primClass;
			if (type == PrimClass.Line) (t as LineType).thickness *= swsh;
			else if (type == PrimClass.Rect) (t as RectType).thickness *= swsh;
			else if (type == PrimClass.Oval) (t as OvalType).thickness *= swsh;
			else if (type == PrimClass.Path) (t as PathType).thickness *= swsh;
			else if (type == PrimClass.Text) (t as TextType).size *= swsh;
			else if (type == PrimClass.TextNative) (t as TextNativeType).size *= swsh;
		}

		this.lowX = ox + this.lowX * sw;
		this.lowY = oy + this.lowY * sh;
		this.highX = ox + this.highX * sw;
		this.highY = oy + this.highY * sh;
	}

	// renders the meta vector by creating a new canvas
	public renderInto(parent:any)
	{
		let canvas = newElement(parent, 'canvas', {'width': this.width, 'height': this.height}) as HTMLCanvasElement;
		this.renderCanvas(canvas);
		return canvas;
	}

	// renders the meta vector into an existing canvas
	public renderCanvas(canvas:HTMLCanvasElement, clearFirst?:boolean)
	{
		let ctx = canvas.getContext('2d');
		if (clearFirst) ctx.clearRect(0, 0, canvas.width, canvas.height);

		let w = this.width, h = this.height;

		this.density = pixelDensity();

		canvas.style.width = w + 'px';
		canvas.style.height = h + 'px';
		canvas.width = w * this.density;
		canvas.height = h * this.density;

		this.renderContext(ctx);
	}

	// renders the meta vector into a context (this is useful when there's stuff to draw above or below)
	public renderContext(ctx:CanvasRenderingContext2D)
	{
		ctx.save();
		ctx.scale(this.density, this.density);

		this.typeObj = [];
		for (let n = 0; n < this.types.length; n++)
		{
			let t = this.types[n];
			if (t.primClass == PrimClass.Line) this.typeObj[n] = this.setupTypeLine(t as LineType);
			else if (t.primClass == PrimClass.Rect) this.typeObj[n] = this.setupTypeRect(t as RectType);
			else if (t.primClass == PrimClass.Oval) this.typeObj[n] = this.setupTypeOval(t as OvalType);
			else if (t.primClass == PrimClass.Path) this.typeObj[n] = this.setupTypePath(t as PathType);
			else if (t.primClass == PrimClass.Text) this.typeObj[n] = this.setupTypeText(t as TextType);
			else if (t.primClass == PrimClass.TextNative) this.typeObj[n] = this.setupTypeTextNative(t as TextNativeType);
		}
		for (let n = 0; n < this.prims.length; n++)
		{
			let p = this.prims[n];
			if (p.primClass == PrimClass.Line) this.renderLine(ctx, p as LinePrim);
			else if (p.primClass == PrimClass.Rect) this.renderRect(ctx, p as RectPrim);
			else if (p.primClass == PrimClass.Oval) this.renderOval(ctx, p as OvalPrim);
			else if (p.primClass == PrimClass.Path) this.renderPath(ctx, p as PathPrim);
			else if (p.primClass == PrimClass.Text) this.renderText(ctx, p as TextPrim);
			else if (p.primClass == PrimClass.TextNative) this.renderTextNative(ctx, p as TextNativePrim);
		}

		ctx.restore();
	}

	// builds a new DOM containing an <svg> element, and everything underneath it is a representation of the graphic; the most common UI use case for this method is:
	//			let domSVG = dom(gfx.createSVG()).appendTo(div);
	//			domSVG.css({'display': 'block', 'pointer-events': 'none'});
	// note that setting the display style to 'block' prevents the layout from adding descender padding for baseline alignment, which is never useful; and disabling
	// pointer events for individual SVG elements is generally a good idea
	public createSVG(prettyPrint = false, withXlink = false):string
	{
		let svg = new SpoolSVG(prettyPrint);
		svg.start('<svg xmlns="http://www.w3.org/2000/svg"');
		if (withXlink) svg.attr('xmlns:xlink', 'http://www.w3.org/1999/xlink');
		svg.attr('width', this.width);
		svg.attr('height', this.height);
		svg.attr('viewBox', `0 0 ${this.width} ${this.height}`);
		svg.stop('>');
		svg.inc();

		this.renderSVG(svg, withXlink);

		svg.dec();
		svg.whole('</svg>');
		return svg.toString();
	}

	// given a DOM that represents an <svg> element, or some sub-container (such as <g>), populates it with all of the
	// content from the graphic
	public renderSVG(svg:SpoolSVG, withXlink = false):void
	{
		this.typeObj = [];

		const font = FontData.main;
		svg.whole('<defs>');
		svg.inc();
		if (this.charMissing)
		{
			svg.start('<path');
			svg.attr('id', 'missing');
			svg.attr('d', font.MISSING_DATA);
			svg.attr('edge', 'none');
			svg.stop('/>');
		}
		for (let n = 0; n < font.UNICODE.length; n++) if (this.charMask[n])
		{
			svg.start('<path');
			svg.attr('id', 'char' + n);
			svg.attr('d', font.GLYPH_DATA[n]);
			svg.attr('edge', 'none');
			svg.stop('/>');
		}
		svg.dec();
		svg.whole('</defs>');

		for (let n = 0; n < this.types.length; n++)
		{
			let t = this.types[n];
			if (t.primClass == PrimClass.Line) this.typeObj[n] = this.setupTypeLine(t as LineType);
			else if (t.primClass == PrimClass.Rect) this.typeObj[n] = this.setupTypeRect(t as RectType);
			else if (t.primClass == PrimClass.Oval) this.typeObj[n] = this.setupTypeOval(t as OvalType);
			else if (t.primClass == PrimClass.Path) this.typeObj[n] = this.setupTypePath(t as PathType);
			else if (t.primClass == PrimClass.Text) this.typeObj[n] = this.setupTypeText(t as TextType);
			else if (t.primClass == PrimClass.TextNative) this.typeObj[n] = this.setupTypeTextNative(t as TextNativeType);
		}
		for (let n = 0; n < this.prims.length;)
		{
			let p = this.prims[n], num = 1;
			if (p.primClass != PrimClass.Path && p.primClass != PrimClass.Text && p.primClass != PrimClass.TextNative)
			{
				for (; n + num < this.prims.length; num++) if (this.prims[n + num].primClass != p.primClass || this.prims[n + num].typeidx != p.typeidx) break;
			}
			if (p.primClass == PrimClass.Line)
			{
				if (num == 1)
					this.svgLine1(svg, p as LinePrim);
				else
					this.svgLineN(svg, this.prims.slice(n, n + num) as LinePrim[]);
			}
			else if (p.primClass == PrimClass.Rect)
			{
				if (num == 1)
					this.svgRect1(svg, p as RectPrim);
				else
					this.svgRectN(svg, this.prims.slice(n, n + num) as RectPrim[]);
			}
			else if (p.primClass == PrimClass.Oval)
			{
				if (num == 1)
					this.svgOval1(svg, p as OvalPrim);
				else
					this.svgOvalN(svg, this.prims.slice(n, n + num) as OvalPrim[]);
			}
			else if (p.primClass == PrimClass.Path) this.svgPath(svg, p as PathPrim);
			else if (p.primClass == PrimClass.Text) this.svgText(svg, p as TextPrim, withXlink);
			else if (p.primClass == PrimClass.TextNative) this.svgTextNative(svg, p as TextNativePrim);

			n += num;
		}
	}

	// for duplication purposes: emits all the primitives into another builder instance
	public spool(into:MetaVector):void
	{
		for (let p of this.prims)
		{
			if (p.primClass == PrimClass.Line)
			{
				let {typeidx, x1, y1, x2, y2} = p as LinePrim;
				let {thickness, colour} = this.types[typeidx] as LineType;
				into.drawLine(x1, y1, x2, y2, colour, thickness);
			}
			else if (p.primClass == PrimClass.Rect)
			{
				let {typeidx, x, y, w, h} = p as RectPrim;
				let {edgeCol, fillCol, thickness} = this.types[typeidx] as RectType;
				into.drawRect(x, y, w, h, edgeCol, thickness, fillCol);
			}
			else if (p.primClass == PrimClass.Oval)
			{
				let {typeidx, cx, cy, rw, rh} = p as OvalPrim;
				let {edgeCol, fillCol, thickness} = this.types[typeidx] as OvalType;
				into.drawOval(cx, cy, rw, rh, edgeCol, thickness, fillCol);
			}
			else if (p.primClass == PrimClass.Path)
			{
				let {typeidx, count, x, y, ctrl, closed} = p as PathPrim;
				let {edgeCol, fillCol, thickness, hardEdge} = this.types[typeidx] as PathType;
				into.drawPath(x, y, ctrl, closed, edgeCol, thickness, fillCol, hardEdge);
			}
			else if (p.primClass == PrimClass.Text)
			{
				let {typeidx, x, y, txt, direction} = p as TextPrim;
				let {size, colour} = this.types[typeidx] as TextType;
				into.drawText(x, y, txt, size, colour, null, direction);
			}
			else if (p.primClass == PrimClass.TextNative)
			{
				let {typeidx, x, y, txt} = p as TextNativePrim;
				let {family, size, colour} = this.types[typeidx] as TextNativeType;
				into.drawTextNative(x, y, txt, family, size, colour);
			}
		}
	}

	// ------------ private methods ------------

	// transform stored types into renderables
	public setupTypeLine(t:LineType):LineType
	{
		let thickness = t.thickness * this.scale;
		let colour = t.colour;
		return {primClass: t.primClass, thickness, colour};
	}
	public setupTypeRect(t:RectType):RectType
	{
		let edgeCol = t.edgeCol;
		let fillCol = t.fillCol;
		let thickness = t.thickness * this.scale;
		return {primClass: t.primClass, edgeCol, fillCol, thickness};
	}
	public setupTypeOval(t:OvalType):OvalType
	{
		let edgeCol = t.edgeCol;
		let fillCol = t.fillCol;
		let thickness = t.thickness * this.scale;
		return {primClass: t.primClass, edgeCol, fillCol, thickness};
	}
	public setupTypePath(t:PathType):PathType
	{
		let edgeCol = t.edgeCol;
		let fillCol = t.fillCol;
		let thickness = t.thickness * this.scale;
		let hardEdge = t.hardEdge;
		return {primClass: t.primClass, edgeCol, fillCol, thickness, hardEdge};
	}
	public setupTypeText(t:TextType):TextType
	{
		let size = t.size * this.scale;
		let colour = t.colour;
		return {primClass: t.primClass, colour, size};
	}
	public setupTypeTextNative(t:TextNativeType):TextNativeType
	{
		let family = t.family;
		let size = t.size * this.scale;
		let colour = t.colour;
		let opt = t.opt;
		return {primClass: t.primClass, colour, family, size, opt};
	}

	// perform actual rendering for the primitives
	public renderLine(ctx:CanvasRenderingContext2D, line:LinePrim):void
	{
		let {x1, y1, x2, y2} = line;
		let {colour, thickness} = this.typeObj[line.typeidx] as LineType;

		x1 = this.offsetX + this.scale * x1;
		y1 = this.offsetY + this.scale * y1;
		x2 = this.offsetX + this.scale * x2;
		y2 = this.offsetY + this.scale * y2;
		if (colour != null)
		{
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.strokeStyle = colourCanvas(colour);
			ctx.lineWidth = thickness;
			ctx.lineCap = 'round';
			ctx.stroke();
		}
	}
	public renderRect(ctx:CanvasRenderingContext2D, rect:RectPrim):void
	{
		let {x, y, w, h} = rect;
		let {edgeCol, fillCol, thickness} = this.typeObj[rect.typeidx] as RectType;

		x = this.offsetX + this.scale * x;
		y = this.offsetY + this.scale * y;
		w *= this.scale;
		h *= this.scale;

		if (fillCol != MetaVector.NOCOLOUR)
		{
			ctx.fillStyle = colourCanvas(fillCol);
			ctx.fillRect(x, y, w, h);
		}
		if (edgeCol != MetaVector.NOCOLOUR)
		{
			ctx.strokeStyle = colourCanvas(edgeCol);
			ctx.lineWidth = thickness;
			ctx.lineCap = 'square';
			ctx.strokeRect(x, y, w, h);
		}
	}
	public renderOval(ctx:CanvasRenderingContext2D, oval:OvalPrim):void
	{
		let {cx, cy, rw, rh} = oval;
		let {edgeCol, fillCol, thickness} = this.typeObj[oval.typeidx] as OvalType;

		cx = this.offsetX + this.scale * cx;
		cy = this.offsetY + this.scale * cy;
		rw *= this.scale;
		rh *= this.scale;

		if (fillCol != MetaVector.NOCOLOUR)
		{
			ctx.fillStyle = colourCanvas(fillCol);
			ctx.beginPath();
			ctx.ellipse(cx, cy, rw, rh, 0, 0, 2 * Math.PI, true);
			ctx.fill();
		}
		if (edgeCol != MetaVector.NOCOLOUR)
		{
			ctx.strokeStyle = colourCanvas(edgeCol);
			ctx.lineWidth = thickness;
			ctx.beginPath();
			ctx.ellipse(cx, cy, rw, rh, 0, 0, 2 * Math.PI, true);
			ctx.stroke();
		}
	}
	public renderPath(ctx:CanvasRenderingContext2D, path:PathPrim):void
	{
		let {count, x, y, ctrl, closed} = path;
		let {edgeCol, fillCol, thickness, hardEdge} = this.typeObj[path.typeidx] as PathType;

		x = [...x];
		y = [...y];
		for (let n = 0; n < count; n++)
		{
			x[n] = this.offsetX + this.scale * x[n];
			y[n] = this.offsetY + this.scale * y[n];
		}

		for (let layer = 1; layer <= 2; layer++)
		{
			if (layer == 1 && fillCol == MetaVector.NOCOLOUR) continue;
			if (layer == 2 && edgeCol == MetaVector.NOCOLOUR) continue;

			ctx.beginPath();
			ctx.moveTo(x[0], y[0]);
			for (let i = 1; i < count; i++)
			{
				if (!ctrl || !ctrl[i])
				{
					ctx.lineTo(x[i], y[i]);
				}
				else if (i < count - 1 && !ctrl[i + 1])
				{
					ctx.quadraticCurveTo(x[i], y[i], x[i + 1], y[i + 1]);
					i++;
				}
				else if (i < count - 1 && !ctrl[i + 2])
				{
					ctx.bezierCurveTo(x[i], y[i], x[i + 1], y[i + 1], x[i + 2], y[i + 2]);
					i += 2;
				}
			}
			if (closed) ctx.closePath();

			if (layer == 1)
			{
				ctx.fillStyle = colourCanvas(fillCol);
				ctx.fill();
			}
			else
			{
				ctx.strokeStyle = colourCanvas(edgeCol);
				ctx.lineWidth = thickness;
				ctx.lineCap = hardEdge ? 'square' : 'round';
				ctx.lineJoin = hardEdge ? 'miter' : 'round';
				ctx.stroke();
			}
		}
	}
	private renderText(ctx:CanvasRenderingContext2D, text:TextPrim):void
	{
		let {x, y, txt, direction} = text;
		let {size, colour} = this.typeObj[text.typeidx] as TextType;

		let fill = colourCanvas(colour);

		x = this.offsetX + this.scale * x;
		y = this.offsetY + this.scale * y;

		let font = FontData.main;

		let scale = size * this.scale / font.UNITS_PER_EM;
		let dx = 0;
		for (let n = 0; n < txt.length; n++)
		{
			let ch = txt.charAt(n);
			let i = font.getIndex(ch);
			let path:Path2D = null;
			if (i < 0)
			{
				dx += font.MISSING_HORZ;
				path = font.getMissingPath();
			}
			else path = font.getGlyphPath(i);

			if (path)
			{
				ctx.save();
				let theta = direction != 0 ? direction * DEGRAD : 0;
				if (theta == 0)
					ctx.translate(x + dx * scale, y);
				else
					ctx.translate(x + Math.cos(theta) * dx * scale, y + Math.sin(theta) * dx * scale);
				ctx.scale(scale, -scale);
				if (theta != 0) ctx.rotate(-theta);
				ctx.fillStyle = fill;
				ctx.fill(path);
				ctx.restore();
			}

			dx += font.HORIZ_ADV_X[i];
			if (n < txt.length - 1) dx += font.getKerning(ch, txt.charAt(n + 1));
		}
	}
	private renderTextNative(ctx:CanvasRenderingContext2D, text:TextNativePrim):void
	{
		let {x, y, txt} = text;
		let {size, colour, family, opt} = this.typeObj[text.typeidx] as TextNativeType;

		let fill = colourCanvas(colour);

		x = this.offsetX + this.scale * x;
		y = this.offsetY + this.scale * y;

		ctx.save();

		let pfx = '';
		if (opt.bold) pfx += 'bold ';
		if (opt.italic) pfx += 'italic ';
		ctx.font = pfx + (size * this.scale) + 'px ' + family;
		ctx.fillStyle = fill;
		ctx.fillText(txt, x, y);
		ctx.restore();
	}

	// create SVG object for each primitive
	// perform actual rendering for the primitives
	public svgLine1(svg:SpoolSVG, line:LinePrim):void
	{
		let {x1, y1, x2, y2} = line;
		let {colour, thickness} = this.typeObj[line.typeidx] as LineType;

		x1 = this.offsetX + this.scale * x1;
		y1 = this.offsetY + this.scale * y1;
		x2 = this.offsetX + this.scale * x2;
		y2 = this.offsetY + this.scale * y2;

		if (colour != MetaVector.NOCOLOUR)
		{
			svg.start('<line');
			svg.attr('x1', x1);
			svg.attr('y1', y1);
			svg.attr('x2', x2);
			svg.attr('y2', y2);
			this.defineSVGStroke(svg, colour);
			svg.attr('stroke-width', thickness);
			svg.attr('stroke-linecap', 'round');
			svg.stop('/>');
		}
	}
	public svgLineN(svg:SpoolSVG, lines:LinePrim[]):void
	{
		let {colour, thickness} = this.typeObj[lines[0].typeidx] as LineType;

		svg.start('<g');
		this.defineSVGStroke(svg, colour);
		svg.attr('stroke-width', thickness);
		svg.attr('stroke-linecap', 'round');
		svg.stop('>');
		svg.inc();

		for (let line of lines)
		{
			let {x1, y1, x2, y2} = line;

			x1 = this.offsetX + this.scale * x1;
			y1 = this.offsetY + this.scale * y1;
			x2 = this.offsetX + this.scale * x2;
			y2 = this.offsetY + this.scale * y2;

			svg.start('<line');
			svg.attr('x1', x1);
			svg.attr('y1', y1);
			svg.attr('x2', x2);
			svg.attr('y2', y2);
			svg.stop('/>');
		}

		svg.dec();
		svg.whole('</g>');
	}
	public svgRect1(svg:SpoolSVG, rect:RectPrim):void
	{
		let {x, y, w, h} = rect;
		let {edgeCol, fillCol, thickness} = this.typeObj[rect.typeidx] as RectType;

		x = this.offsetX + this.scale * x;
		y = this.offsetY + this.scale * y;
		w *= this.scale;
		h *= this.scale;

		svg.start('<rect');
		svg.attr('x', x);
		svg.attr('y', y);
		svg.attr('width', w);
		svg.attr('height', h);

		this.defineSVGStroke(svg, edgeCol);
		if (edgeCol != MetaVector.NOCOLOUR)
		{
			svg.attr('stroke-width', thickness);
			svg.attr('stroke-linecap', 'square');
		}
		this.defineSVGFill(svg, fillCol);
		svg.stop('/>');
	}
	public svgRectN(svg:SpoolSVG, rects:RectPrim[]):void
	{
		let {edgeCol, fillCol, thickness} = this.typeObj[rects[0].typeidx] as RectType;

		svg.start('<g');
		this.defineSVGStroke(svg, edgeCol);
		if (edgeCol != MetaVector.NOCOLOUR)
		{
			svg.attr('stroke-width', thickness);
			svg.attr('stroke-linecap', 'square');
		}
		this.defineSVGFill(svg, fillCol);
		svg.stop('>');
		svg.inc();

		for (let rect of rects)
		{
			let {x, y, w, h} = rect;

			x = this.offsetX + this.scale * x;
			y = this.offsetY + this.scale * y;
			w *= this.scale;
			h *= this.scale;

			svg.start('<rect');
			svg.attr('x', x);
			svg.attr('y', y);
			svg.attr('width', w);
			svg.attr('height', h);
			svg.stop('/>');
		}

		svg.dec();
		svg.whole('</g>');
	}
	public svgOval1(svg:SpoolSVG, oval:OvalPrim):void
	{
		let {cx, cy, rw, rh} = oval;
		let {edgeCol, fillCol, thickness} = this.typeObj[oval.typeidx] as OvalType;

		cx = this.offsetX + this.scale * cx;
		cy = this.offsetY + this.scale * cy;
		rw *= this.scale;
		rh *= this.scale;

		svg.start('<ellipse');
		svg.attr('cx', cx);
		svg.attr('cy', cy);
		svg.attr('rx', rw);
		svg.attr('ry', rh);

		this.defineSVGStroke(svg, edgeCol);
		if (edgeCol != MetaVector.NOCOLOUR)
		{
			svg.attr('stroke-width', thickness);
		}
		this.defineSVGFill(svg, fillCol);
		svg.stop('/>');
	}
	public svgOvalN(svg:SpoolSVG, ovals:OvalPrim[]):void
	{
		let {edgeCol, fillCol, thickness} = this.typeObj[ovals[0].typeidx] as OvalType;

		svg.start('<g');
		this.defineSVGStroke(svg, edgeCol);
		if (edgeCol != MetaVector.NOCOLOUR)
		{
			svg.attr('stroke-width', thickness);
		}
		this.defineSVGFill(svg, fillCol);
		svg.stop('>');
		svg.inc();

		for (let oval of ovals)
		{
			let {cx, cy, rw, rh} = oval;

			cx = this.offsetX + this.scale * cx;
			cy = this.offsetY + this.scale * cy;
			rw *= this.scale;
			rh *= this.scale;

			svg.start('<ellipse');
			svg.attr('cx', cx);
			svg.attr('cy', cy);
			svg.attr('rx', rw);
			svg.attr('ry', rh);
			svg.stop('/>');
		}

		svg.dec();
		svg.whole('</g>');
	}
	public svgPath(svg:SpoolSVG, path:PathPrim):void
	{
		let {count, x, y, ctrl, closed} = path;
		let {edgeCol, fillCol, thickness, hardEdge} = this.typeObj[path.typeidx] as PathType;

		x = [...x];
		y = [...y];
		for (let n = 0; n < count; n++)
		{
			x[n] = this.offsetX + this.scale * x[n];
			y[n] = this.offsetY + this.scale * y[n];
		}

		let shape = 'M ' + pixelCoord(x[0]) + ' ' + pixelCoord(y[0]);
		let n = 1;
		while (n < count)
		{
			if (!ctrl || !ctrl[n])
			{
				shape += ' L ' + pixelCoord(x[n]) + ' ' + pixelCoord(y[n]);
				n++;
			}
			else if (ctrl[n] && n < count - 1 && !ctrl[n + 1])
			{
				shape += ' Q ' + pixelCoord(x[n]) + ' ' + pixelCoord(y[n]) + ' '
						       + pixelCoord(x[n + 1]) + ' ' + pixelCoord(y[n + 1]);
				n += 2;
			}
			else if (ctrl[n] && n < count - 2 && ctrl[n + 1] && !ctrl[n + 2])
			{
				shape += ' C ' + pixelCoord(x[n]) + ' ' + pixelCoord(y[n]) + ' '
							   + pixelCoord(x[n + 1]) + ' ' + pixelCoord(y[n + 1]) + ' '
							   + pixelCoord(x[n + 2]) + ' ' + pixelCoord(y[n + 2]);
				n += 3;
			}
			else n++; // (dunno, so skip)
		}
		if (closed) shape += ' Z';

		svg.start('<path');
		svg.attr('d', shape);

		this.defineSVGStroke(svg, edgeCol);
		if (edgeCol != MetaVector.NOCOLOUR)
		{
			svg.attr('stroke-width', thickness);
			svg.attr('stroke-linejoin', hardEdge ? 'miter' : 'round');
			svg.attr('stroke-linecap', hardEdge ? 'square' : 'round');
		}
		this.defineSVGFill(svg, fillCol);
		svg.stop('/>');
	}
	private svgText(svg:SpoolSVG, text:TextPrim, withXlink = true):void
	{
		let {x, y, txt, direction} = text;
		let {size, colour} = this.typeObj[text.typeidx] as TextType;

		x = this.offsetX + this.scale * x;
		y = this.offsetY + this.scale * y;

		let font = FontData.main;

		let scale = size * this.scale / font.UNITS_PER_EM;

		if (direction != 0)
		{
			svg.start('<g');
			svg.attr('transform', `rotate(${direction},${pixelCoord(x)},${pixelCoord(y)})`);
			svg.stop('>');
			svg.inc();
		}

		svg.start('<g');
		svg.attr('transform', `translate(${pixelCoord(x)},${pixelCoord(y)})`);
		this.defineSVGFill(svg, colour);
		svg.stop('>');
		svg.inc();

		svg.start('<g');
		svg.attr('transform', `scale(${pixelCoord(scale)},${pixelCoord(-scale)})`);
		svg.stop('>');
		svg.inc();

		let dx = 0;
		for (let n = 0; n < txt.length; n++)
		{
			let ch = txt.charAt(n);
			let i = font.getIndex(ch);

			svg.start('<use');
			let ref = i < 0 ? '#missing' : '#char' + i;
			if (withXlink) svg.attr('xlink:href', ref); else svg.attr('href', ref);
			svg.attr('x', dx);
			svg.stop('/>');

			if (i >= 0)
			{
				dx += font.HORIZ_ADV_X[i];
				if (n < txt.length - 1) dx += font.getKerning(ch, txt.charAt(n + 1));
			}
			else dx += font.MISSING_HORZ;
		}

		svg.dec();
		svg.whole('</g>');

		svg.dec();
		svg.whole('</g>');

		if (direction != 0)
		{
			svg.dec();
			svg.whole('</g>');
		}
	}
	private svgTextNative(svg:SpoolSVG, text:TextNativePrim):void
	{
		let {x, y, txt} = text;
		let {size, colour, family, opt} = this.typeObj[text.typeidx] as TextNativeType;

		x = this.offsetX + this.scale * x;
		y = this.offsetY + this.scale * y;

		let fill = colourCanvas(colour);
		let style = `fill: ${fill}; font-family: ${family}; font-size: ${size * this.scale};`;
		if (opt.bold) style += ' font-weight: bold;';
		if (opt.italic) style += ' font-style: italic;';

		const escapeXML = (str:string):string =>
		{
			return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
		};

		svg.start('<text');
		svg.attr('xml:space', 'preserve');
		svg.attr('x', x);
		svg.attr('y', y);
		svg.attr('style', style);
		svg.stop('>' + escapeXML(txt) + '</text>');
	}

	// utility for SVG
	private defineSVGStroke(svg:SpoolSVG, col:number):void
	{
		if (col == MetaVector.NOCOLOUR)
		{
			svg.attr('stroke-opacity', '0');
			return;
		}
		svg.attr('stroke', colourCode(col));
		let alpha = colourAlpha(col);
		if (alpha != 1) svg.attr('stroke-opacity', alpha);
	}
	private defineSVGFill(svg:SpoolSVG, col:number):void
	{
		if (col == MetaVector.NOCOLOUR)
		{
			svg.attr('fill-opacity', '0');
			return;
		}
		svg.attr('fill', colourCode(col));
		let alpha = colourAlpha(col);
		if (alpha != 1) svg.attr('fill-opacity', alpha);
	}

	// for a type definition array, see if it exists in the list, and return that index - or if not, push it on
	private findOrCreateType(typeDef:TypeBase)
	{
		for (let n = 0; n < this.types.length; n++)
		{
			if (this.types[n].primClass != typeDef.primClass) continue;
			let keys = Object.keys(typeDef);
			let match = keys.every((k) => (typeDef as any)[k] == (this.types[n] as any)[k]);
			if (match) return n;
		}
		this.types.push(typeDef);
		return this.types.length - 1;
	}

	// ensures boundaries move whenever something out of range is added
	private updateBounds(x:number, y:number):void
	{
		if (this.lowX == null)
		{
			this.lowX = x;
			this.lowY = y;
			this.highX = x;
			this.highY = y;
			return;
		}
		this.lowX = Math.min(this.lowX, x);
		this.lowY = Math.min(this.lowY, y);
		this.highX = Math.max(this.highX, x);
		this.highY = Math.max(this.highY, y);
	}
}

