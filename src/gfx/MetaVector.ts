/*
	WebMolKit

	(c) 2010-2018 Molecular Materials Informatics, Inc.

	All rights reserved

	http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

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

const PRIM_LINE = 1;
const PRIM_RECT = 2;
const PRIM_OVAL = 3;
const PRIM_PATH = 4;
const PRIM_TEXT = 5;
const PRIM_TEXTNATIVE = 6;

interface TypeObjLine
{
	thickness:number;
	colour:number;
}
interface TypeObjRect
{
	edgeCol:number;
	fillCol:number;
	thickness:number;
}
interface TypeObjOval
{
	edgeCol:number;
	fillCol:number;
	thickness:number;
}
interface TypeObjPath
{
	edgeCol:number;
	fillCol:number;
	thickness:number;
	hardEdge:boolean;
}
interface TypeObjText
{
	size:number;
	colour:number;
}
interface TypeObjTextNative
{
	family:string;
	size:number;
	colour:number;
	opt:FontDataNativeOpt;
}

export class MetaVector
{
	//private ONE_THIRD = 1.0 / 3;

	public static NOCOLOUR = -1;

	private types:any[] = [];
	private prims:any[] = [];
	private typeObj:(TypeObjLine | TypeObjRect | TypeObjOval | TypeObjPath | TypeObjText | TypeObjTextNative)[];
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
			for (let p of this.prims) if (p[0] == PRIM_TEXT)
			{
				let txt = p[4];
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
		let typeidx = this.findOrCreateType([PRIM_LINE, thickness, colour]);

		const bump = 0.5 * thickness;
		this.updateBounds(Math.min(x1, x2) - bump, Math.min(y1, y2) - bump);
		this.updateBounds(Math.max(x1, x2) + bump, Math.max(y1, y2) + bump);

		this.prims.push([PRIM_LINE, typeidx, x1, y1, x2, y2]);
	}
	public drawRect(x:number, y:number, w:number, h:number, edgeCol:number, thickness:number, fillCol:number):void
	{
		if (edgeCol == null) edgeCol = MetaVector.NOCOLOUR;
		if (fillCol == null) fillCol = MetaVector.NOCOLOUR;
		if (thickness == null) thickness = 1;
		let typeidx = this.findOrCreateType([PRIM_RECT, edgeCol, fillCol, thickness]);

		const bump = 0.5 * thickness;
		this.updateBounds(x - bump, y - bump);
		this.updateBounds(x + w + bump, y + h + bump);

		this.prims.push([PRIM_RECT, typeidx, x, y, w, h]);
	}
	public drawOval(cx:number, cy:number, rw:number, rh:number, edgeCol:number, thickness:number, fillCol:number):void
	{
		if (edgeCol == null) edgeCol = MetaVector.NOCOLOUR;
		if (fillCol == null) fillCol = MetaVector.NOCOLOUR;
		if (thickness == null) thickness = 1;

		const bump = 0.5 * thickness;
		this.updateBounds(cx - rw - bump, cy - rh - bump);
		this.updateBounds(cx + rw + bump, cy + rh + bump);

		let typeidx = this.findOrCreateType([PRIM_OVAL, edgeCol, fillCol, thickness]);
		this.prims.push([PRIM_OVAL, typeidx, cx, cy, rw, rh]);
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

		let typeidx = this.findOrCreateType([PRIM_PATH, edgeCol, fillCol, thickness, hardEdge]);
		this.prims.push([PRIM_PATH, typeidx, xpoints.length, clone(xpoints), clone(ypoints), clone(ctrlFlags), isClosed]);
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

		let typeidx = this.findOrCreateType([PRIM_TEXT, size, colour]);
		this.prims.push([PRIM_TEXT, typeidx, x + bx, y + by, txt, direction]);
	}

	// render *native* text, which is defined by an HTML/CSS font specifier; this is different from the built-in text in that it presumes that the device
	// can locate the font at render-time, and that whatever methods were used to measure the font at draw-time are synced; this is a fair assumption when
	// creating graphics for immediate output to a canvas or inline-rendered SVG object, but anything else has to be taken on a case by case basis
	public drawTextNative(x:number, y:number, txt:string, fontFamily:string, fontSize:number, colour:number, align?:number, opt?:FontDataNativeOpt):void
	{
		if (!opt) opt = {};

		if (align == null) align = TextAlign.Left | TextAlign.Baseline;
		const font = FontData.main;
		for (let n = 0; n < txt.length; n++)
		{
			let i = font.getIndex(txt.charAt(n));
			if (i >= 0) this.charMask[i] = true; else this.charMissing = true;
		}

		let metrics = font.measureTextNative(txt, fontFamily, fontSize, opt);
		let bx = 0, by = 0;

		if ((align & TextAlign.Left) != 0) {}
		else if ((align & TextAlign.Right) != 0) bx = -metrics[0];
		else /* centre */ bx = -0.5 * metrics[0];

		if ((align & TextAlign.Middle) != 0) by += 0.5 * metrics[1];
		else if ((align & TextAlign.Top) != 0) by += metrics[1];
		else if ((align & TextAlign.Bottom) != 0) by -= metrics[2];
		// else: baseline

		this.updateBounds(x, y - metrics[1]);
		this.updateBounds(x + metrics[0], y + metrics[2]);

		let typeidx = this.findOrCreateType([PRIM_TEXTNATIVE, fontFamily, fontSize, colour, opt]);
		this.prims.push([PRIM_TEXTNATIVE, typeidx, x + bx, y + by, txt]);
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
			const type = a[0];
			if (type == PRIM_LINE)
			{
				a[2] = ox + a[2] * sw;
				a[3] = oy + a[3] * sh;
				a[4] = ox + a[4] * sw;
				a[5] = oy + a[5] * sh;
			}
			else if (type == PRIM_RECT)
			{
				a[2] = ox + a[2] * sw;
				a[3] = oy + a[3] * sh;
				a[4] = a[4] * sw;
				a[5] = a[5] * sh;
			}
			else if (type == PRIM_OVAL)
			{
				a[2] = ox + a[2] * sw;
				a[3] = oy + a[3] * sh;
				a[4] *= sw;
				a[5] *= sh;
			}
			else if (type == PRIM_PATH)
			{
				let sz = a[2], px = a[3], py = a[4];
				for (let n = 0; n < sz; n++)
				{
					px[n] = ox + px[n] * sw;
					py[n] = oy + py[n] * sh;
				}
			}
			else if (type == PRIM_TEXT || type == PRIM_TEXTNATIVE)
			{
				a[2] = ox + a[2] * sw;
				a[3] = oy + a[3] * sh;
			}
		}
		let swsh = 0.5 * (sw + sh);
		if (swsh != 1) for (let t of this.types)
		{
			const type = t[0];
			if (type == PRIM_LINE) t[1] *= swsh;
			else if (type == PRIM_RECT) t[3] *= swsh;
			else if (type == PRIM_OVAL) t[3] *= swsh;
			else if (type == PRIM_PATH) t[3] *= swsh;
			else if (type == PRIM_TEXT) t[1] *= swsh;
			else if (type == PRIM_TEXTNATIVE) t[2] *= swsh;
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

		let w = canvas.style.width ? parseInt(canvas.style.width) : canvas.width / this.density;
		let h = canvas.style.height ? parseInt(canvas.style.height) : canvas.height / this.density;

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
			if (t[0] == PRIM_LINE) this.typeObj[n] = this.setupTypeLine(t);
			else if (t[0] == PRIM_RECT) this.typeObj[n] = this.setupTypeRect(t);
			else if (t[0] == PRIM_OVAL) this.typeObj[n] = this.setupTypeOval(t);
			else if (t[0] == PRIM_PATH) this.typeObj[n] = this.setupTypePath(t);
			else if (t[0] == PRIM_TEXT) this.typeObj[n] = this.setupTypeText(t);
			else if (t[0] == PRIM_TEXTNATIVE) this.typeObj[n] = this.setupTypeTextNative(t);
		}
		for (let n = 0; n < this.prims.length; n++)
		{
			let p = this.prims[n];
			if (p[0] == PRIM_LINE) this.renderLine(ctx, p);
			else if (p[0] == PRIM_RECT) this.renderRect(ctx, p);
			else if (p[0] == PRIM_OVAL) this.renderOval(ctx, p);
			else if (p[0] == PRIM_PATH) this.renderPath(ctx, p);
			else if (p[0] == PRIM_TEXT) this.renderText(ctx, p);
			else if (p[0] == PRIM_TEXTNATIVE) this.renderTextNative(ctx, p);
		}

		ctx.restore();
	}

	// builds a new DOM containing an <svg> element, and everything underneath it is a representation of the graphic; the most common UI use case for this method is:
	//			let domSVG = $(gfx.createSVG()).appendTo(div);
	//			domSVG.css({'display': 'block', 'pointer-events': 'none'});
	// note that setting the display style to 'block' prevents the layout from adding descender padding for baseline alignment, which is never useful; and disabling
	// pointer events for individual SVG elements is generally a good idea
	public createSVG(prettyPrint = false):string
	{
		let xml = XML.parseXML('<svg/>');
		let svg = xml.documentElement;
		svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
		svg.setAttribute('width', this.width.toString());
		svg.setAttribute('height', this.height.toString());
		svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);

		this.renderSVG(svg);

		return prettyPrint ? XML.toPrettyString(xml) : XML.toString(xml);
	}

	// given a DOM that represents an <svg> element, or some sub-container (such as <g>), populates it with all of the
	// content from the graphic
	public renderSVG(svg:Element):void
	{
		this.typeObj = [];

		const font = FontData.main;
		let defs = XML.appendElement(svg, 'defs');
		if (this.charMissing)
		{
			let path = XML.appendElement(defs, 'path');
			path.setAttribute('id', 'missing');
			path.setAttribute('d', font.MISSING_DATA);
			path.setAttribute('edge', 'none');
		}
		for (let n = 0; n < font.UNICODE.length; n++) if (this.charMask[n])
		{
			let path = XML.appendElement(defs, 'path');
			path.setAttribute('id', 'char' + n);
			path.setAttribute('d', font.GLYPH_DATA[n]);
			path.setAttribute('edge', 'none');
		}

		for (let n = 0; n < this.types.length; n++)
		{
			let t = this.types[n];
			if (t[0] == PRIM_LINE) this.typeObj[n] = this.setupTypeLine(t);
			else if (t[0] == PRIM_RECT) this.typeObj[n] = this.setupTypeRect(t);
			else if (t[0] == PRIM_OVAL) this.typeObj[n] = this.setupTypeOval(t);
			else if (t[0] == PRIM_PATH) this.typeObj[n] = this.setupTypePath(t);
			else if (t[0] == PRIM_TEXT) this.typeObj[n] = this.setupTypeText(t);
			else if (t[0] == PRIM_TEXTNATIVE) this.typeObj[n] = this.setupTypeTextNative(t);
		}
		for (let n = 0; n < this.prims.length;)
		{
			let p = this.prims[n], num = 1;
			if (p[0] != PRIM_PATH && p[0] != PRIM_TEXT && p[0] != PRIM_TEXTNATIVE)
			{
				for (; n + num < this.prims.length; num++) if (this.prims[n + num][0] != p[0] || this.prims[n + num][1] != p[1]) break;
			}
			if (p[0] == PRIM_LINE)
			{
				if (num == 1) this.svgLine1(svg, p); else this.svgLineN(svg, p, n, num);
			}
			else if (p[0] == PRIM_RECT)
			{
				if (num == 1) this.svgRect1(svg, p); else this.svgRectN(svg, p, n, num);
			}
			else if (p[0] == PRIM_OVAL)
			{
				if (num == 1) this.svgOval1(svg, p); else this.svgOvalN(svg, p, n, num);
			}
			else if (p[0] == PRIM_PATH) this.svgPath(svg, p);
			else if (p[0] == PRIM_TEXT) this.svgText(svg, p);
			else if (p[0] == PRIM_TEXTNATIVE) this.svgTextNative(svg, p);

			n += num;
		}
	}

	// for duplication purposes: emits all the primitives into another builder instance
	public spool(into:MetaVector):void
	{
		for (let p of this.prims)
		{
			if (p[0] == PRIM_LINE)
			{
				let [_, typeidx, x1, y1, x2, y2] = p;
				let [, thickness, colour] = this.types[typeidx];
				into.drawLine(x1, y1, x2, y2, colour, thickness);
			}
			else if (p[0] == PRIM_RECT)
			{
				let [_, typeidx, x, y, w, h] = p;
				let [, edgeCol, fillCol, thickness] = this.types[typeidx];
				into.drawRect(x, y, w, h, edgeCol, thickness, fillCol);
			}
			else if (p[0] == PRIM_OVAL)
			{
				let [_, typeidx, x, y, w, h] = p;
				let [, edgeCol, fillCol, thickness] = this.types[typeidx];
				into.drawOval(x, y, w, h, edgeCol, thickness, fillCol);
			}
			else if (p[0] == PRIM_PATH)
			{
				let [_, typeidx, numPoints, xpoints, ypoints, ctrlFlags, isClosed] = p;
				let [, edgeCol, fillCol, thickness, hardEdge] = this.types[typeidx];
				into.drawPath(xpoints, ypoints, ctrlFlags, isClosed, edgeCol, thickness, fillCol, hardEdge);
			}
			else if (p[0] == PRIM_TEXT)
			{
				let [_, typeidx, x, y, txt, direction] = p;
				let [, size, colour] = this.types[typeidx];
				into.drawText(x, y, txt, size, colour, null, direction);
			}
			else if (p[0] == PRIM_TEXTNATIVE)
			{
				let [_, typeidx, x, y, txt] = p;
				let [, fontFamily, fontSize, colour] = this.types[typeidx];
				into.drawTextNative(x, y, txt, fontFamily, fontSize, colour);
			}
		}
	}

	// ------------ private methods ------------

	// transform stored types into renderables
	public setupTypeLine(t:any[]):TypeObjLine
	{
		let thickness = t[1] * this.scale;
		let colour = t[2];
		return {'thickness': thickness, 'colour': colour};
	}
	public setupTypeRect(t:any[]):TypeObjRect
	{
		let edgeCol = t[1];
		let fillCol = t[2];
		let thickness = t[3] * this.scale;
		return {'edgeCol': edgeCol, 'fillCol': fillCol, 'thickness': thickness};
	}
	public setupTypeOval(t:any[]):TypeObjOval
	{
		let edgeCol = t[1];
		let fillCol = t[2];
		let thickness = t[3] * this.scale;
		return {'edgeCol': edgeCol, 'fillCol': fillCol, 'thickness': thickness};
	}
	public setupTypePath(t:any[]):TypeObjPath
	{
		let edgeCol = t[1];
		let fillCol = t[2];
		let thickness = t[3] * this.scale;
		let hardEdge = t[4];
		return {'edgeCol': edgeCol, 'fillCol': fillCol, 'thickness': thickness, 'hardEdge': hardEdge};
	}
	public setupTypeText(t:any[]):TypeObjText
	{
		let sz = t[1] * this.scale;
		let colour = t[2];
		return {'colour': colour, 'size': sz};
	}
	public setupTypeTextNative(t:any[]):TypeObjTextNative
	{
		let family = t[1];
		let sz = t[2] * this.scale;
		let colour = t[3];
		let opt = t[4];
		return {'colour': colour, 'family': family, 'size': sz, 'opt': opt};
	}

	// perform actual rendering for the primitives
	public renderLine(ctx:CanvasRenderingContext2D, p:any):void
	{
		let type = this.typeObj[p[1]] as TypeObjLine;
		let x1:number = p[2], y1:number = p[3];
		let x2:number = p[4], y2:number = p[5];
		let colour:number = type.colour;

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
			ctx.lineWidth = type.thickness;
			ctx.lineCap = 'round';
			ctx.stroke();
		}
	}
	public renderRect(ctx:CanvasRenderingContext2D, p:any):void
	{
		let type = this.typeObj[p[1]] as TypeObjRect;
		let x:number = p[2], y:number = p[3];
		let w:number = p[4], h:number = p[5];
		let edgeCol:number = type.edgeCol, fillCol:number = type.fillCol;

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
			ctx.lineWidth = type.thickness;
			ctx.lineCap = 'square';
			ctx.strokeRect(x, y, w, h);
		}
	}
	public renderOval(ctx:CanvasRenderingContext2D, p:any):void
	{
		let type = this.typeObj[p[1]] as TypeObjOval;
		let cx:number = p[2], cy:number = p[3];
		let rw:number = p[4], rh:number = p[5];
		let edgeCol:number = type.edgeCol, fillCol:number = type.fillCol;

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
			ctx.lineWidth = type.thickness;
			ctx.beginPath();
			ctx.ellipse(cx, cy, rw, rh, 0, 0, 2 * Math.PI, true);
			ctx.stroke();
		}
	}
	public renderPath(ctx:CanvasRenderingContext2D, p:any):void
	{
		let type = this.typeObj[p[1]] as TypeObjPath;
		let npts:number = p[2];
		if (npts == 0) return;
		let x = Vec.duplicate(p[3] as number[]), y = Vec.duplicate(p[4] as number[]);
		let ctrl:boolean[] = p[5];
		let isClosed:boolean = p[6];
		let edgeCol:number = type.edgeCol, fillCol:number = type.fillCol;

		for (let n = 0; n < npts; n++)
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
			for (let i = 1; i < npts; i++)
			{
				if (!ctrl || !ctrl[i])
				{
					ctx.lineTo(x[i], y[i]);
				}
				else if (i < npts - 1 && !ctrl[i + 1])
				{
					ctx.quadraticCurveTo(x[i], y[i], x[i + 1], y[i + 1]);
					i++;
				}
				else if (i < npts - 1 && !ctrl[i + 2])
				{
					ctx.bezierCurveTo(x[i], y[i], x[i + 1], y[i + 1], x[i + 2], y[i + 2]);
					i += 2;
				}
			}
			if (isClosed) ctx.closePath();

			if (layer == 1)
			{
				ctx.fillStyle = colourCanvas(type.fillCol);
				ctx.fill();
			}
			else
			{
				ctx.strokeStyle = colourCanvas(type.edgeCol);
				ctx.lineWidth = type.thickness;
				ctx.lineCap = type.hardEdge ? 'square' : 'round';
				ctx.lineJoin = type.hardEdge ? 'miter' : 'round';
				ctx.stroke();
			}
		}
	}
	private renderText(ctx:CanvasRenderingContext2D, p:any):void
	{
		let type = this.typeObj[p[1]] as TypeObjText;
		let x:number = p[2], y:number = p[3];
		let txt:string = p[4];

		let sz = type.size;
		let fill = colourCanvas(type.colour);

		x = this.offsetX + this.scale * x;
		y = this.offsetY + this.scale * y;

		let font = FontData.main;

		let scale = sz / font.UNITS_PER_EM;
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
				ctx.translate(x + dx * scale, y);
				ctx.scale(scale, -scale);
				ctx.fillStyle = fill;
				ctx.fill(path);
				ctx.restore();
			}

			dx += font.HORIZ_ADV_X[i];
			if (n < txt.length - 1) dx += font.getKerning(ch, txt.charAt(n + 1));
		}
	}
	private renderTextNative(ctx:CanvasRenderingContext2D, p:any):void
	{
		let type = this.typeObj[p[1]] as TypeObjTextNative;
		let x:number = p[2], y:number = p[3];
		let txt:string = p[4];

		let family:string = type.family, sz:number = type.size, opt:FontDataNativeOpt = type.opt;
		let fill = colourCanvas(type.colour);

		x = this.offsetX + this.scale * x;
		y = this.offsetY + this.scale * y;

		ctx.save();

		let pfx = '';
		if (opt.bold) pfx += 'bold ';
		if (opt.italic) pfx += 'italic ';
		ctx.font = pfx + sz + 'px ' + family;
		ctx.fillStyle = fill;
		ctx.fillText(txt, x, y);
		ctx.restore();
	}

	// create SVG object for each primitive
	// perform actual rendering for the primitives
	public svgLine1(svg:Element, p:any):void
	{
		let type = this.typeObj[p[1]] as TypeObjLine;
		let x1:number = p[2], y1:number = p[3];
		let x2:number = p[4], y2:number = p[5];

		x1 = this.offsetX + this.scale * x1;
		y1 = this.offsetY + this.scale * y1;
		x2 = this.offsetX + this.scale * x2;
		y2 = this.offsetY + this.scale * y2;

		if (type.colour != MetaVector.NOCOLOUR)
		{
			let line = XML.appendElement(svg, 'line');
			line.setAttribute('x1', x1.toString());
			line.setAttribute('y1', y1.toString());
			line.setAttribute('x2', x2.toString());
			line.setAttribute('y2', y2.toString());
			this.defineSVGStroke(line, type.colour);
			line.setAttribute('stroke-width', type.thickness.toString());
			line.setAttribute('stroke-linecap', 'round');
		}
	}
	public svgLineN(svg:Element, p:any, pos:number, sz:number):void
	{
		let type = this.typeObj[p[1]] as TypeObjLine;
		if (type.colour == MetaVector.NOCOLOUR) return;

		let g = XML.appendElement(svg, 'g');
		this.defineSVGStroke(g, type.colour);
		g.setAttribute('stroke-width', type.thickness.toString());
		g.setAttribute('stroke-linecap', 'round');

		for (let n = 0; n < sz; n++)
		{
			let p = this.prims[pos + n];
			let x1:number = p[2], y1:number = p[3];
			let x2:number = p[4], y2:number = p[5];

			x1 = this.offsetX + this.scale * x1;
			y1 = this.offsetY + this.scale * y1;
			x2 = this.offsetX + this.scale * x2;
			y2 = this.offsetY + this.scale * y2;

			let line = XML.appendElement(g, 'line');
			line.setAttribute('x1', x1.toString());
			line.setAttribute('y1', y1.toString());
			line.setAttribute('x2', x2.toString());
			line.setAttribute('y2', y2.toString());
		}
	}
	public svgRect1(svg:Element, p:any):void
	{
		let type = this.typeObj[p[1]] as TypeObjRect;
		let x:number = p[2], y:number = p[3];
		let w:number = p[4], h:number = p[5];

		x = this.offsetX + this.scale * x;
		y = this.offsetY + this.scale * y;
		w *= this.scale;
		h *= this.scale;

		let rect = XML.appendElement(svg, 'rect');
		rect.setAttribute('x', x.toString());
		rect.setAttribute('y', y.toString());
		rect.setAttribute('width', w.toString());
		rect.setAttribute('height', h.toString());

		this.defineSVGStroke(rect, type.edgeCol);
		if (type.edgeCol != MetaVector.NOCOLOUR)
		{
			rect.setAttribute('stroke-width', type.thickness.toString());
			rect.setAttribute('stroke-linecap', 'square');
		}
		this.defineSVGFill(rect, type.fillCol);
	}
	public svgRectN(svg:Element, p:any, pos:number, sz:number):void
	{
		let type = this.typeObj[p[1]] as TypeObjRect;

		let g = XML.appendElement(svg, 'g');
		this.defineSVGStroke(g, type.edgeCol);
		if (type.edgeCol != MetaVector.NOCOLOUR)
		{
			g.setAttribute('stroke-width', type.thickness.toString());
			g.setAttribute('stroke-linecap', 'square');
		}
		this.defineSVGFill(g, type.fillCol);

		for (let n = 0; n < sz; n++)
		{
			let p = this.prims[pos + n];
			let x:number = p[2], y:number = p[3];
			let w:number = p[4], h:number = p[5];

			x = this.offsetX + this.scale * x;
			y = this.offsetY + this.scale * y;
			w *= this.scale;
			h *= this.scale;

			let rect = XML.appendElement(g, 'rect');
			rect.setAttribute('x', x.toString());
			rect.setAttribute('y', y.toString());
			rect.setAttribute('width', w.toString());
			rect.setAttribute('height', h.toString());
		}
	}
	public svgOval1(svg:Element, p:any):void
	{
		let type = this.typeObj[p[1]] as TypeObjOval;
		let cx:number = p[2], cy:number = p[3];
		let rw:number = p[4], rh:number = p[5];

		cx = this.offsetX + this.scale * cx;
		cy = this.offsetY + this.scale * cy;
		rw *= this.scale;
		rh *= this.scale;

		let oval = XML.appendElement(svg, 'ellipse');
		oval.setAttribute('cx', cx.toString());
		oval.setAttribute('cy', cy.toString());
		oval.setAttribute('rx', rw.toString());
		oval.setAttribute('ry', rh.toString());

		this.defineSVGStroke(oval, type.edgeCol);
		if (type.edgeCol != MetaVector.NOCOLOUR)
		{
			oval.setAttribute('stroke-width', type.thickness.toString());
		}
		this.defineSVGFill(oval, type.fillCol);
	}
	public svgOvalN(svg:Element, p:any, pos:number, sz:number):void
	{
		let type = this.typeObj[p[1]] as TypeObjOval;
		let g = XML.appendElement(svg, 'g');
		this.defineSVGStroke(g, type.edgeCol);
		if (type.edgeCol != MetaVector.NOCOLOUR)
		{
			g.setAttribute('stroke-width', type.thickness.toString());
		}
		this.defineSVGFill(g, type.fillCol);

		for (let n = 0; n < sz; n++)
		{
			let p = this.prims[pos + n];
			let cx:number = p[2], cy:number = p[3];
			let rw:number = p[4], rh:number = p[5];

			cx = this.offsetX + this.scale * cx;
			cy = this.offsetY + this.scale * cy;
			rw *= this.scale;
			rh *= this.scale;

			let oval = XML.appendElement(g, 'oval');
			oval.setAttribute('cx', cx.toString());
			oval.setAttribute('cy', cy.toString());
			oval.setAttribute('rx', rw.toString());
			oval.setAttribute('ry', rh.toString());
		}
	}
	public svgPath(svg:Element, p:any):void
	{
		let type = this.typeObj[p[1]] as TypeObjPath;
		let npts = p[2];
		if (npts == 0) return;
		let x:number[] = p[3].slice(0), y:number[] = p[4].slice(0);
		let ctrl:boolean[] = p[5];
		let isClosed:boolean = p[6];

		for (let n = 0; n < npts; n++)
		{
			x[n] = this.offsetX + this.scale * x[n];
			y[n] = this.offsetY + this.scale * y[n];
		}

		let shape = 'M ' + x[0] + ' ' + y[0];
		let n = 1;
		while (n < npts)
		{
			if (!ctrl || !ctrl[n])
			{
				shape += ' L ' + x[n] + ' ' + y[n];
				n++;
			}
			else if (ctrl[n] && n < npts - 1 && !ctrl[n + 1])
			{
				shape += ' Q ' + x[n] + ' ' + y[n] + ' ' + x[n + 1] + ' ' + y[n + 1];
				n += 2;
			}
			else if (ctrl[n] && n < npts - 2 && ctrl[n + 1] && !ctrl[n + 2])
			{
				shape += ' C ' + x[n] + ' ' + y[n] + ' ' + x[n + 1] + ' ' + y[n + 1] + ' ' + x[n + 2] + ' ' + y[n + 2];
				n += 3;
			}
			else n++; // (dunno, so skip)
		}
		if (isClosed) shape += ' Z';

		let path = XML.appendElement(svg, 'path');
		path.setAttribute('d', shape);

		this.defineSVGStroke(path, type.edgeCol);
		if (type.edgeCol != MetaVector.NOCOLOUR)
		{
			path.setAttribute('stroke-width', type.thickness.toString());
			path.setAttribute('stroke-linejoin', type.hardEdge ? 'miter' : 'round');
			path.setAttribute('stroke-linecap', 'square');
		}
		this.defineSVGFill(path, type.fillCol);
	}
	private svgText(svg:Element, p:any):void
	{
		let type = this.typeObj[p[1]] as TypeObjText;
		let x:number = p[2], y:number = p[3];
		let txt:string = p[4];
		let direction:number = p[5];

		let sz = type.size;

		x = this.offsetX + this.scale * x;
		y = this.offsetY + this.scale * y;

		let font = FontData.main;

		let scale = sz / font.UNITS_PER_EM;

		let parent = svg;
		if (direction != 0)
		{
			parent = XML.appendElement(parent, 'g');
			parent.setAttribute('transform', `rotate(${direction},${x},${y})`);
		}

		let gdelta = XML.appendElement(parent, 'g');
		gdelta.setAttribute('transform', 'translate(' + x + ',' + y + ')');
		this.defineSVGFill(gdelta, type.colour);
		let gscale = XML.appendElement(gdelta, 'g');
		gscale.setAttribute('transform', 'scale(' + scale + ',' + (-scale) + ')');

		let dx = 0;
		for (let n = 0; n < txt.length; n++)
		{
			let ch = txt.charAt(n);
			let i = font.getIndex(ch);

			let use = XML.appendElement(gscale, 'use');
			let ref = i < 0 ? '#missing' : '#char' + i;
			use.setAttribute('xlink:href', ref);
			use.setAttribute('x', dx.toString());

			if (i >= 0)
			{
				dx += font.HORIZ_ADV_X[i];
				if (n < txt.length - 1) dx += font.getKerning(ch, txt.charAt(n + 1));
			}
			else dx += font.MISSING_HORZ;
		}
	}
	private svgTextNative(svg:Element, p:any):void
	{
		let type = this.typeObj[p[1]] as TypeObjTextNative;
		let x = p[2], y = p[3];
		let txt = p[4];

		let family = type.family, sz = type.size, opt:FontDataNativeOpt = type.opt;

		x = this.offsetX + this.scale * x;
		y = this.offsetY + this.scale * y;

		let colour = colourCanvas(type.colour);
		let style = `fill: ${colour}; font-family: ${family}; font-size: ${sz};`;
		if (opt.bold) style += ' font-weight: bold;';
		if (opt.italic) style += ' font-style: italic;';

		let node = XML.appendElement(svg, 'text');
		node.setAttribute('xml:space', 'preserve');
		node.setAttribute('x', x.toString());
		node.setAttribute('y', y.toString());
		node.setAttribute('style', style);
		XML.setText(node, txt);
	}

	// utility for SVG
	private defineSVGStroke(obj:Element, col:number):void
	{
		if (col == MetaVector.NOCOLOUR)
		{
			obj.setAttribute('stroke-opacity', '0');
			return;
		}
		obj.setAttribute('stroke', colourCode(col));
		let alpha = colourAlpha(col);
		if (alpha != 1) obj.setAttribute('stroke-opacity', alpha.toString());

	}
	private defineSVGFill(obj:Element, col:number):void
	{
		if (col == MetaVector.NOCOLOUR)
		{
			obj.setAttribute('fill-opacity', '0');
			return;
		}
		obj.setAttribute('fill', colourCode(col));
		let alpha = colourAlpha(col);
		if (alpha != 1) obj.setAttribute('fill-opacity', alpha.toString());
	}

	// for a type definition array, see if it exists in the list, and return that index - or if not, push it on
	private findOrCreateType(typeDef:any)
	{
		for (let i = 0; i < this.types.length; i++)
		{
			if (this.types[i].length != typeDef.length) continue;
			let match = true;
			for (let j = 0; j < typeDef.length; j++) if (typeDef[j] != this.types[i][j])
			{
				match = false;
				break;
			}
			if (match) return i;
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

/* EOF */ }