/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../util/util.ts'/>
///<reference path='../util/Geom.ts'/>
///<reference path='../gfx/Rendering.ts'/>
///<reference path='../gfx/ArrangeMolecule.ts'/>
///<reference path='../gfx/MetaVector.ts'/>
///<reference path='../data/Molecule.ts'/>
///<reference path='Dialog.ts'/>

namespace WebMolKit /* BOF */ {

/*
	Given two sketched out molecules, allows the user to map individual atoms interactively.
*/

export class MapReaction extends Dialog
{
	private btnClear:JQuery;
	private btnSave:JQuery;

	public callbackSave:(source?:MapReaction) => void = null;

	private mol1:Molecule;
	private mol2:Molecule;

	private policy:RenderPolicy;

	// layout information about both molecules, and how to position them
	private layout1:ArrangeMolecule;
	private layout2:ArrangeMolecule;
	private box1:Box;
	private box2:Box;
	private boxArrow:Box;
	private padding:number;
	private scale = 1;
	private offsetX1:number;
	private offsetY1:number;
	private offsetX2:number;
	private offsetY2:number;

	private ARROWWIDTH = 30;
	private COLCYCLE = ['#89A54E', '#71588F', '#4198AF', '#DB843D', '#93A9CF', '#D19392', '#4572A7', '#AA4643'];

	private canvasW:number;
	private canvasH:number;
	private canvas:HTMLCanvasElement;
	private drawnMols:HTMLCanvasElement;

	private highlighted = [0, 0];
	private pressed = [0, 0];
	private dragToX:number;
	private dragToY:number;

	// --------------------------------------- public methods ---------------------------------------

	constructor(mol1:Molecule, mol2:Molecule)
	{
		super();

		this.mol1 = mol1.clone();
		this.mol2 = mol2.clone();

		this.policy = RenderPolicy.defaultBlackOnWhite();
		this.policy.data.pointScale = 40;

		this.title = 'Map Reaction Atoms';
		this.minPortionWidth = 20;
		this.maxPortionWidth = 95;
	}

	// fetch the molecules, which have the atom mappings defined
	public getMolecule1():Molecule {return this.mol1;}
	public getMolecule2():Molecule {return this.mol2;}

	// builds the dialog content
	protected populate():void
	{
		let buttons = this.buttons(), body = this.body();

		this.btnClear = $('<button class="button button-default">Clear</button>').appendTo(buttons);
		this.btnClear.click(() => this.clearAllMappings());

		buttons.append(' ');
		buttons.append(this.btnClose); // easy way to reorder

		buttons.append(' ');
		this.btnSave = $('<button class="button button-primary">Save</button>').appendTo(buttons);
		this.btnSave.click(() => {if (this.callbackSave) this.callbackSave(this);});

		let measure = new OutlineMeasurement(0, 0, this.policy.data.pointScale);
		let effects = new RenderEffects();
		this.layout1 = new ArrangeMolecule(this.mol1, measure, this.policy, effects);
		this.layout1.arrange();
		this.layout2 = new ArrangeMolecule(this.mol2, measure, this.policy, effects);
		this.layout2.arrange();

		this.setupPanel();
	}

	// --------------------------------------- private methods ---------------------------------------

	// given that both molecules have been arranged, positions and draws everything
	private setupPanel():void
	{
		let bounds1 = this.layout1.determineBoundary(), w1 = bounds1[2] - bounds1[0], h1 = bounds1[3] - bounds1[1];
		let bounds2 = this.layout2.determineBoundary(), w2 = bounds2[2] - bounds2[0], h2 = bounds2[3] - bounds2[1];

		let maxWidth = 0.9 * $(window).width(), maxHeight = 0.8 * $(window).height();
		this.padding = 1 * this.policy.data.pointScale;

		let scale1 = (maxWidth - this.ARROWWIDTH) / (w1 + w2 + 4 * this.padding);
		let scale2 = maxHeight / (h1 + 2 * this.padding);
		let scale3 = maxHeight / (bounds2[3] - bounds2[1] + 2 * this.padding);
		this.scale = Math.min(1, Math.min(scale1, Math.min(scale2, scale3)));

		this.canvasW = Math.ceil((w1 + w2 + 4 * this.padding) * this.scale + this.ARROWWIDTH);
		this.canvasH = Math.ceil((Math.max(h1, h2) + 2 * this.padding) * this.scale);
		this.box1 = new Box(0, 0, w1 + 2 * this.padding, this.canvasH);
		this.boxArrow = new Box(this.box1.maxX(), 0, this.ARROWWIDTH, this.canvasH);
		this.box2 = new Box(this.boxArrow.maxX(), 0, w2 + 2 * this.padding, this.canvasH);
		this.layout1.squeezeInto(this.box1.x, this.box1.y, this.box1.w, this.box1.h);
		this.layout2.squeezeInto(this.box2.x, this.box2.y, this.box2.w, this.box2.h);

		/*this.offsetX1 = this.padding * this.scale;
		this.offsetY1 = 0.5 * (this.canvasH - h1 * this.scale);
		this.offsetX2 = (w1 + 3 * this.padding) * this.scale + this.ARROWWIDTH;
		this.offsetY2 = 0.5 * (this.canvasH - h2 * this.scale);*/

		let div = $('<div></div>').appendTo(this.body());
		div.css('position', 'relative');
		div.css('width', this.canvasW + 'px');
		div.css('height', this.canvasH + 'px');

		let density = pixelDensity();

		let styleCanvas = 'position: absolute; left: 0; top: 0; width: ' + this.canvasW + 'px; height: ' + this.canvasH + 'px;';
		let styleOverlay = styleCanvas + 'pointer-events: none;';

		// setup the canvas, for redrawing the interactive elements
		this.canvas = newElement(div, 'canvas', {'width': this.canvasW * density, 'height': this.canvasH * density, 'style': styleCanvas}) as HTMLCanvasElement;
		let ctx = this.canvas.getContext('2d');
		ctx.scale(density, density);
		this.redrawCanvas();

		$(this.canvas).mousedown((event:JQueryEventObject) => {event.preventDefault(); this.mouseDown(event);});
		$(this.canvas).mouseup((event:JQueryEventObject) => this.mouseUp(event));
		$(this.canvas).mouseenter((event:JQueryEventObject) => this.mouseEnter(event));
		$(this.canvas).mouseleave((event:JQueryEventObject) => this.mouseLeave(event));
		$(this.canvas).mousemove((event:JQueryEventObject) => this.mouseMove(event));

		// draw the molecules, which don't change
		this.drawnMols = newElement(div, 'canvas', {'width': this.canvasW * density, 'height': this.canvasH * density, 'style': styleOverlay}) as HTMLCanvasElement;
		ctx = this.drawnMols.getContext('2d');
		ctx.scale(density, density);

		let vg1 = new MetaVector(), vg2 = new MetaVector();
		new DrawMolecule(this.layout1, vg1).draw();
		new DrawMolecule(this.layout2, vg2).draw();
		vg1.renderContext(ctx);
		vg2.renderContext(ctx);

		/*let draw = new MetaVector(this.rawvec1);
		draw.offsetX = this.offsetX1;
		draw.offsetY = this.offsetY1;
		draw.scale = this.scale;
		draw.renderContext(ctx);
		draw = new MetaVector(this.rawvec2);
		draw.offsetX = this.offsetX2;
		draw.offsetY = this.offsetY2;
		draw.scale = this.scale;
		draw.renderContext(ctx);*/

		this.bump();
	}

	private redrawCanvas():void
	{
		let ctx = this.canvas.getContext('2d');
		let w = this.canvasW, h = this.canvasH;
		ctx.clearRect(0, 0, w, h);

		let arrowX1 = this.boxArrow.minX(), arrowX2 = this.boxArrow.maxX(), arrowY = this.boxArrow.midY();

		ctx.beginPath();
		ctx.moveTo(arrowX1, arrowY);
		ctx.lineTo(arrowX2 - 2, arrowY);
		ctx.strokeStyle = 'black';
		ctx.lineWidth = 2;
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(arrowX2, arrowY);
		ctx.lineTo(arrowX2 - 8, arrowY - 5);
		ctx.lineTo(arrowX2 - 8, arrowY + 5);
		ctx.fillStyle = 'black';
		ctx.fill();

		this.drawHighlights(ctx, 1, this.highlighted[0] == 1 ? this.highlighted[1] : 0);
		this.drawHighlights(ctx, 2, this.highlighted[0] == 2 ? this.highlighted[1] : 0);

		if (this.pressed[0] > 0)
		{
			// outline everything that's compatible
			let compatMask = this.compatibilityMask(this.pressed[0], this.pressed[1]);
			ctx.strokeStyle = '#808080';
			ctx.lineWidth = 1;
			if (this.pressed[0] == 1)
			{
				for (let n = 1; n <= this.mol2.numAtoms; n++) if (compatMask[n - 1])
				{
					let [cx, cy, rw, rh] = this.getAtomPos(2, n);
					ctx.beginPath();
					ctx.ellipse(cx, cy, rw, rh, 0, 0, TWOPI, false);
					ctx.stroke();
				}
			}
			else
			{
				for (let n = 1; n <= this.mol1.numAtoms; n++) if (compatMask[n - 1])
				{
					let [cx, cy, rw, rh] = this.getAtomPos(1, n);
					ctx.beginPath();
					ctx.ellipse(cx, cy, rw, rh, 0, 0, TWOPI, false);
					ctx.stroke();
				}
			}

			// draw the highlighted
			let [cx1, cy1, rw1, rh1] = this.getAtomPos(this.pressed[0], this.pressed[1]);
			ctx.beginPath();
			ctx.ellipse(cx1, cy1, rw1, rh1, 0, 0, TWOPI, false);
			ctx.fillStyle = '#808080';
			ctx.fill();

			let dx = this.dragToX, dy = this.dragToY;
			let dest = this.pickAtom(dx, dy, this.pressed[0] == 2 ? compatMask : null, this.pressed[0] == 1 ? compatMask : null);

			if (dest[0] == 3 - this.pressed[0])
			{
				let [cx2, cy2, rw2, rh2] = this.getAtomPos(dest[0], dest[1]);
				ctx.beginPath();
				ctx.ellipse(cx2, cy2, rw2, rh2, 0, 0, TWOPI, false);
				ctx.fillStyle = '#808080';
				ctx.fill();
				dx = cx2;
				dy = cy2;
			}

			ctx.beginPath();
			ctx.moveTo(cx1, cy1);
			ctx.lineTo(dx, dy);
			ctx.strokeStyle = '#808080';
			ctx.lineWidth = 1;
			ctx.stroke();
		}
	}

	// mapped atoms get a background circle
	private drawHighlights(ctx:CanvasRenderingContext2D, side:number, highlight:number):void
	{
		const mol = side == 1 ? this.mol1 : this.mol2;
		const layout = side == 1 ? this.layout1 : this.layout2;
		const offsetX = side == 1 ? this.offsetX1 : this.offsetX2;
		const offsetY = side == 1 ? this.offsetY1 : this.offsetY2;
		const scale = this.scale;

		for (let n = 1; n <= mol.numAtoms; n++)
		{
			let mapnum = mol.atomMapNum(n);
			if (mapnum == 0 && n != highlight) continue;
			let [cx, cy, rw, rh] = this.getAtomPos(side, n);
			if (mapnum > 0)
			{
				let col = this.COLCYCLE[(mapnum - 1) % this.COLCYCLE.length];
				ctx.beginPath();
				ctx.ellipse(cx, cy, rw, rh, 0, 0, TWOPI, false);
				ctx.fillStyle = col;
				ctx.fill();

				if (n == highlight)
				{
					let oside = 3 - side, omol = side == 1 ? this.mol2 : this.mol1;
					for (let i = 1; i <= omol.numAtoms; i++) if (omol.atomMapNum(i) == mapnum)
					{
						let [dx, dy] = this.getAtomPos(oside, i);
						ctx.beginPath();
						ctx.moveTo(cx, cy);
						ctx.lineTo(dx, dy);
						ctx.strokeStyle = col;
						ctx.lineWidth = 1;
						ctx.stroke();
					}
				}
			}
			if (n == highlight)
			{
				ctx.beginPath();
				ctx.ellipse(cx, cy, rw, rh, 0, 0, TWOPI, false);
				ctx.strokeStyle = '#404040';
				ctx.lineWidth = 1;
				ctx.stroke();
			}
		}
	}

	// for a screen position, returns {side,atom#} that corresponds to it, where side is 0=nothing, 1 or 2=something
	private pickAtom(x:number, y:number, mask1?:boolean[], mask2?:boolean[]):number[]
	{
		let ret = [0, 0];

		let bestDist = Number.POSITIVE_INFINITY;

		let threshsq = sqr(this.layout1.getScale() * 1.0 * this.policy.data.pointScale);
		for (let n = 0; n < this.mol1.numAtoms; n++)
		{
			if (mask1 && !mask1[n]) continue;
			let pt = this.layout1.getPoint(n);
			let dsq = norm2_xy(x - pt.oval.cx, y - pt.oval.cy);
			if (dsq < threshsq && dsq < bestDist) {ret = [1, n + 1]; bestDist = dsq;}
		}

		threshsq = sqr(this.layout2.getScale() * 1.0 * this.policy.data.pointScale);
		for (let n = 0; n < this.mol2.numAtoms; n++)
		{
			if (mask2 && !mask2[n]) continue;
			let pt = this.layout2.getPoint(n);
			let dsq = norm2_xy(x - pt.oval.cx, y - pt.oval.cy);
			if (dsq < threshsq && dsq < bestDist) {ret = [2, n + 1]; bestDist = dsq;}
		}

		return ret;
	}

	// digs around in the given atom container for the screen position and recommended bounding size
	private getAtomPos(side:number, atom:number):[number, number, number, number]
	{
		let layout = side == 1 ? this.layout1 : this.layout2;
		let ox = side == 1 ? this.offsetX1 : this.offsetX2, oy = side == 1 ? this.offsetY1 : this.offsetY2;
		let pt = layout.getPoint(atom - 1);
		let rw = Math.max(0.5 * this.policy.data.pointScale, pt.oval.rw) * this.scale, rh = Math.max(0.5 * this.policy.data.pointScale, pt.oval.rh) * this.scale;
		return [pt.oval.cx, pt.oval.cy, rw, rh];
	}

	// returns a mask for whether or not atoms on the other side are compatible with each other
	private compatibilityMask(side:number, atom:number):boolean[]
	{
		let mask:boolean[] = [];
		let mol1 = side == 1 ? this.mol1 : this.mol2, mol2 = side == 1 ? this.mol2 : this.mol1;

		let el = mol1.atomElement(atom), iso = mol1.atomIsotope(atom), map = mol1.atomMapNum(atom);
		for (let n = 1; n <= mol2.numAtoms; n++)
		{
			let match = el == mol2.atomElement(n) && iso == mol2.atomIsotope(n);
			match = match && (map == 0 || mol2.atomMapNum(n) == 0);
			mask.push(match);
		}

		return mask;
	}

	// assign the same mapping number to the two atoms; the side parameter refers to the first molecule - this
	// second one is presumed to be the opposite
	private connectAtoms(side:number, atom1:number, atom2:number)
	{
		let mol1 = side == 1 ? this.mol1 : this.mol2, mol2 = side == 1 ? this.mol2 : this.mol1;
		let map = mol1.atomMapNum(atom1);
		if (map == 0) map = mol2.atomMapNum(atom2);

		// find an unused mapping number, if necessary
		if (map == 0)
		{
			let allnums = new Set<number>();
			for (let n = 1; n <= mol1.numAtoms; n++) allnums.add(mol1.atomMapNum(n));
			for (let n = 1; n <= mol2.numAtoms; n++) allnums.add(mol2.atomMapNum(n));
			for (map = 1; allnums.has(map); map++) ;
		}
		mol1.setAtomMapNum(atom1, map);
		mol2.setAtomMapNum(atom2, map);
	}

	// tries to match up more atoms algorithmically
	private autoConnect():void
	{
		// note: if the user does something while the webservice is operating, that's OK: it will only apply mappings that are in addition to
		// the current state of the molecules

		Func.atomMapping({'leftNative':this.mol1.toString(), 'rightNative':this.mol2.toString()}, (result:any, error:ErrorRPC) =>
		{
			if (!result) return; // (silent failure)

			let map1:number[] = result.map1, map2:number[] = result.map2;
			if (map1 == null || map2 == null) return;

			let modified = false;
			for (let n = 1; n <= this.mol1.numAtoms && n <= map1.length; n++) if (map1[n - 1] > 0 && this.mol1.atomMapNum(n) == 0)
			{
				this.mol1.setAtomMapNum(n, map1[n - 1]);
				modified = true;
			}
			for (let n = 1; n <= this.mol2.numAtoms && n <= map2.length; n++) if (map2[n - 1] > 0 && this.mol2.atomMapNum(n) == 0)
			{
				this.mol2.setAtomMapNum(n, map2[n - 1]);
				modified = true;
			}

			if (modified) this.redrawCanvas();
		});
	}

	// resets atom mapping numbers
	private clearAllMappings():void
	{
		let anything = false;
		for (let n = 1; n <= this.mol1.numAtoms; n++) if (this.mol1.atomMapNum(n) > 0) {this.mol1.setAtomMapNum(n, 0); anything = true;}
		for (let n = 1; n <= this.mol2.numAtoms; n++) if (this.mol2.atomMapNum(n) > 0) {this.mol2.setAtomMapNum(n, 0); anything = true;}
		if (anything) this.redrawCanvas();
	}

	// erases just one mapping
	private clearMapping(side:number, atom:number)
	{
		let map = side == 1 ? this.mol1.atomMapNum(atom) : this.mol2.atomMapNum(atom);
		if (map == 0) return;
		for (let n = 1; n <= this.mol1.numAtoms; n++) if (this.mol1.atomMapNum(n) == map) this.mol1.setAtomMapNum(n, 0);
		for (let n = 1; n <= this.mol2.numAtoms; n++) if (this.mol2.atomMapNum(n) == map) this.mol2.setAtomMapNum(n, 0);
	}

	// --------------------------------------- toolkit events ---------------------------------------

	private mouseDown(event:JQueryEventObject):void
	{
		let xy = eventCoords(event, this.canvas);
		this.pressed = this.pickAtom(xy[0], xy[1]);
		this.dragToX = xy[0];
		this.dragToY = xy[1];
		this.redrawCanvas();
	}
	private mouseUp(event:JQueryEventObject):void
	{
		let xy = eventCoords(event, this.canvas);
		if (this.pressed[0] > 0)
		{
			let dest = this.pickAtom(xy[0], xy[1]);
			if (dest[0] == this.pressed[0] && dest[1] == this.pressed[1])
			{
				// see if it's a click operation, which equates to clear
				this.clearMapping(dest[0], dest[1]);
			}
			else
			{
				// investigate drag operation
				let compatMask = this.compatibilityMask(this.pressed[0], this.pressed[1]);
				dest = this.pickAtom(xy[0], xy[1], this.pressed[0] == 2 ? compatMask : null, this.pressed[0] == 1 ? compatMask : null);
				if (dest[0] == 3 - this.pressed[0])
				{
					this.connectAtoms(this.pressed[0], this.pressed[1], dest[1]);
					this.autoConnect();
				}
			}
			this.pressed = [0, 0];
		}
		this.highlighted = this.pickAtom(xy[0], xy[1]);
		this.redrawCanvas();
	}
	private mouseEnter(event:JQueryEventObject):void
	{
	}
	private mouseLeave(event:JQueryEventObject):void
	{
		if (this.highlighted[0] > 0 || this.pressed[0] > 0)
		{
			this.highlighted = [0, 0];
			this.pressed = [0, 0];
			this.redrawCanvas();
		}
	}
	private mouseMove(event:JQueryEventObject):void
	{
		let xy = eventCoords(event, this.canvas);
		if (this.pressed[0] > 0)
		{
			this.dragToX = xy[0];
			this.dragToY = xy[1];
			this.redrawCanvas();
		}
		else
		{
			let high = this.pickAtom(xy[0], xy[1]);
			if (high[0] != this.highlighted[0] || high[1] != this.highlighted[1])
			{
				this.highlighted = high;
				this.redrawCanvas();
			}
		}
	}
}

/* EOF */ }