/*
    WebMolKit

    (c) 2010-2019 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../ui/Widget.ts'/>

namespace WebMolKit /* BOF */ {

/*
	DrawCanvas: base class for the sketcher, which handles all of the rendering functionality for the live object.
*/

export enum DraggingTool
{
	None = 0,
	Press,
	Lasso,
	Pan,
	Zoom,
	Rotate,
	Move,
	Erasor,
	Atom,
	Bond,
	Charge,
	Ring
}

export enum DrawCanvasDecoration
{
	None = 0,
	Stereochemistry,
	MappingNumber,
	AtomIndex,
}

interface DrawCanvasViewOpt
{
	decoration:DrawCanvasDecoration;
	showOxState:boolean;
	showQuery:boolean;
	showArtifacts:boolean;
}

export class DrawCanvas extends Widget implements ArrangeMeasurement
{
	protected mol:Molecule = null;
	protected policy:RenderPolicy = null;

	protected offsetX = 0;
	protected offsetY = 0;
	protected pointScale = 1;

	protected viewOpt:DrawCanvasViewOpt =
	{
		'decoration': DrawCanvasDecoration.Stereochemistry,
		'showOxState': true,
		'showQuery': true,
		'showArtifacts': true,
	};

	protected width = 0;
	protected height = 0;
	protected border = 0x808080;
	protected borderRadius = 4;
	protected background = 0xF8F8F8;

	protected container:DOM;
	protected canvasUnder:DOM = null;
	protected canvasMolecule:DOM = null;
	protected canvasOver:DOM = null;
	protected divMessage:DOM = null;

	protected layout:ArrangeMolecule = null;
	protected metavec:MetaVector = null; // instantiated version of above
	protected stereo:Stereochemistry = null;
	protected guidelines:GuidelineSprout[] = null;

	protected filthy = false;
	protected dragType = DraggingTool.None;
	protected currentAtom = 0;
	protected currentBond = 0;
	protected hoverAtom = 0;
	protected hoverBond = 0;
	protected selectedMask:boolean[] = null;
	protected opAtom = 0;
	protected opBond = 0;
	protected opBudged = false; // flips to true when the user starts dragging
	protected opShift = false;
	protected opCtrl = false;
	protected opAlt = false;
	protected lassoX:number[] = null;
	protected lassoY:number[] = null;
	protected lassoMask:boolean[] = null;
	protected clickX = 0; // position of initial mouse click
	protected clickY = 0;
	protected mouseX = 0; // last known position of mouse
	protected mouseY = 0;
	protected dragGuides:GuidelineSprout[] = null; // guidelines pertinent to the current dragging operation
	protected templatePerms:TemplatePermutation[] = null; // if fusing templates, these are the options in play
	protected currentPerm = 0; // currently viewed permutation (if applicable)
	protected fusionBank:FusionBank = null;
	protected cursorWatermark = 0;
	protected cursorDX = 0;
	protected cursorDY = 0;
	protected toolAtomSymbol = '';
	protected toolBondOrder = 0;
	protected toolBondType = 0;
	protected toolChargeDelta = 0;
	protected toolRingArom = false;
	protected toolRingFreeform = false;
	protected toolRotateIncr = 0;

	// ------------ public methods ------------

	constructor()
	{
		super();
	}

	public render(parent:any):void
	{
		if (!this.width || !this.height) throw 'Sketcher.render called without width and height';

		super.render(parent);

		this.container = dom('<div/>').appendTo(this.contentDOM);
		this.container.css({'position': 'relative', 'width': this.width + 'px', 'height': this.height + 'px'});
		this.container.css({'background-color': colourCanvas(this.background)});
		if (this.border != MetaVector.NOCOLOUR)
		{
			this.container.css({'border': '1px solid ' + colourCanvas(this.border)});
			this.container.css({'border-radius': this.borderRadius + 'px'});
		}
		this.container.css({'outline': 'none'});

		this.container.attr({'tabindex': '0'});

		let canvasStyle = {'position': 'absolute', 'left': '0', 'top': '0', 'width': `${this.width}px`, 'height': `${this.height}`, 'pointer-events': 'none'};

		this.canvasUnder = dom('<canvas/>').appendTo(this.container).css(canvasStyle);
		this.canvasMolecule = dom('<canvas/>').appendTo(this.container).css(canvasStyle);
		this.canvasOver = dom('<canvas/>').appendTo(this.container).css(canvasStyle);

		this.divMessage = dom('<div/>').appendTo(this.container).css(canvasStyle);
		this.divMessage.css({'text-align': 'center', 'vertical-align': 'middle', 'font-weight': 'bold', 'font-size': '120%'});
	}

	// returns true if atom is selected (1-based)
	public getSelected(atom:number):boolean
	{
		if (this.selectedMask == null || atom > this.selectedMask.length) return false;
		return this.selectedMask[atom - 1];
	}

	// returns true if atom is grabbed by the lasso, if any (1-based)
	public getLassoed(atom:number):boolean
	{
		if (this.lassoMask == null || atom > this.lassoMask.length) return false;
		return this.lassoMask[atom - 1];
	}

	// functions for converting between coordinates within the widget (pixels) & molecular position (Angstroms)
	public scale() {return this.pointScale;}
	public angToX(ax:number):number
	{
		return ax * this.pointScale + this.offsetX;
	}
	public angToY(ay:number):number
	{
		return ay * -this.pointScale + this.offsetY;
	}
	public xToAng(px:number):number
	{
		return (px - this.offsetX) / this.pointScale;
	}
	public yToAng(py:number):number
	{
		return (py - this.offsetY) / -this.pointScale;
	}
	public scaleToAng(scale:number):number {return scale / this.pointScale;}
	public angToScale(ang:number):number {return ang * this.pointScale;}
	public yIsUp():boolean {return false;}
	public measureText(str:string, fontSize:number):number[] {return FontData.main.measureText(str, fontSize);}

	// ------------ private methods ------------

	// rebuilds the canvas content
	protected redraw():void
	{
		this.filthy = false;
		//this.redrawBackground();
		this.redrawUnder();
		this.redrawMolecule();
		this.redrawOver();
	}

	protected redrawUnder():void
	{
		let HOVER_COL = 0xE0E0E0;
		let CURRENT_COL = 0xA0A0A0, CURRENT_BORD = 0x808080;
		let SELECT_COL = 0xC0C0C0;
		let LASSO_COL = 0xD0D0D0;

		let density = pixelDensity();
		(this.canvasUnder.el as HTMLCanvasElement).width = this.width * density;
		(this.canvasUnder.el as HTMLCanvasElement).height = this.height * density;
		this.canvasUnder.css({'width': `${this.width}px`, 'height': `${this.height}px`});

		let ctx = (this.canvasUnder.el as HTMLCanvasElement).getContext('2d');
		ctx.save();
		ctx.scale(density, density);
		ctx.clearRect(0, 0, this.width, this.height);

		// draw hover effects
		if (this.hoverAtom > 0)
		{
			let sz = 0;
			if (this.hoverAtom == this.currentAtom) sz += 0.1;
			if (this.getSelected(this.hoverAtom)) sz += 0.1;
			if (this.currentBond > 0 && (this.mol.bondFrom(this.currentBond) == this.hoverAtom || this.mol.bondTo(this.currentBond) == this.hoverAtom)) sz += 0.1;
			this.drawAtomShade(ctx, this.hoverAtom, HOVER_COL, -1, sz);
		}
		if (this.hoverBond > 0)
		{
			let sz = 0, bfr = this.mol.bondFrom(this.hoverBond), bto = this.mol.bondTo(this.hoverBond);
			if (this.hoverBond == this.currentBond) sz += 0.1;
			if (this.getSelected(bfr) && this.getSelected(bto)) sz += 0.1;
			this.drawBondShade(ctx, this.hoverBond, HOVER_COL, -1, sz);
		}

		// draw selection and lasso preselection
		for (let n = 1; n <= this.mol.numBonds; n++)
		{
			let sz = n == this.currentBond ? 0.1 : 0;
			let bfr = this.mol.bondFrom(n), bto = this.mol.bondTo(n);
			let sfr = this.getSelected(bfr), sto = this.getSelected(bto), lfr = this.getLassoed(bfr), lto = this.getLassoed(bto);
			if (sfr && sto) this.drawBondShade(ctx, n, SELECT_COL, -1, sz);
			else if ((sfr || lfr) && (sto || lto)) this.drawBondShade(ctx, n, LASSO_COL, -1, sz);
		}
		for (let n = 1; n <= this.mol.numAtoms; n++)
		{
			let sz = this.currentAtom == n ? 0.1 : 0;
			if (this.getSelected(n)) this.drawAtomShade(ctx, n, SELECT_COL, -1, sz);
			else if (this.getLassoed(n)) this.drawAtomShade(ctx, n, LASSO_COL, -1, sz);
		}

		// draw current atom/bond
		if (this.currentAtom > 0)
		{
			this.drawAtomShade(ctx, this.currentAtom, CURRENT_COL, CURRENT_BORD, 0);
		}
		if (this.currentBond > 0)
		{
			let bfr = this.mol.bondFrom(this.currentBond), bto = this.mol.bondTo(this.currentBond);
			this.drawBondShade(ctx, this.currentBond, CURRENT_COL, CURRENT_BORD, 0);
		}

		// if moving or dragging a new atom/bond, draw the guides
		if (this.dragType == DraggingTool.Move || (this.dragType == DraggingTool.Atom && this.opAtom > 0) || this.dragType == DraggingTool.Bond)
		{
			if (this.dragGuides != null && this.dragGuides.length > 0)
			{
				for (let g of this.dragGuides) for (let n = 0; n < g.x.length; n++)
				{
					let lw = this.policy.data.lineSize * this.pointScale;
					ctx.strokeStyle = '#C0C0C0';
					ctx.lineWidth = lw;
					drawLine(ctx, g.sourceX, g.sourceY, g.destX[n], g.destY[n]);
					ctx.beginPath();
					ctx.ellipse(g.destX[n], g.destY[n], 2 * lw, 2 * lw, 0, 0, TWOPI, false);
					ctx.fillStyle = '#C0C0C0';
					ctx.fill();
				}
			}
		}

		// if creating a new ring, draw it
		if (this.dragType == DraggingTool.Ring)
		{
			let [ringX, ringY] = this.determineFauxRing();
			let rsz = ringX == null ? 0 : ringX.length;
			if (rsz > 0)
			{
				let scale = this.pointScale;
				let lw = this.policy.data.lineSize * scale;
				ctx.strokeStyle = '#C0C0C0';
				ctx.lineWidth = lw;

				for (let n = 0; n < rsz; n++)
				{
					let nn = n < rsz - 1 ? n + 1 : 0;
					let x1 = this.angToX(ringX[n]), y1 = this.angToY(ringY[n]);
					let x2 = this.angToX(ringX[nn]), y2 = this.angToY(ringY[nn]);
					drawLine(ctx, x1, y1, x2, y2);
				}

				if (this.toolRingArom)
				{
					let cx = 0, cy = 0;
					for (let n = 0; n < rsz; n++) {cx += ringX[n]; cy += ringY[n];}
					cx /= rsz; cy /= rsz;
					let rad = 0;
					for (let n = 0; n < rsz; n++) rad += norm_xy(ringX[n] - cx, ringY[n] - cy);
					rad = this.angToScale(rad * 0.5 / rsz);
					ctx.beginPath();
					ctx.ellipse(this.angToX(cx), this.angToY(cy), rad, rad, 0, 0, TWOPI, false);
					ctx.stroke();
				}
			}
		}

		ctx.restore();
	}
	protected redrawMolecule():void
	{
		let density = pixelDensity();
		(this.canvasMolecule.el as HTMLCanvasElement).width = this.width * density;
		(this.canvasMolecule.el as HTMLCanvasElement).height = this.height * density;
		this.canvasMolecule.css({'width': `${this.width}px`, 'height': `${this.height}px`});

		let ctx = (this.canvasMolecule.el as HTMLCanvasElement).getContext('2d');
		ctx.save();
		ctx.scale(density, density);
		ctx.clearRect(0, 0, this.width, this.height);

		if (this.metavec != null) this.metavec.renderContext(ctx);

		// debugging only
		/*for (let n = 1; n <= this.mol.numBonds; n++)
		{
			let bfr = this.mol.bondFrom(n), bto = this.mol.bondTo(n);
			let x1 = this.angToX(this.mol.atomX(bfr)), y1 = this.angToY(this.mol.atomY(bfr));
			let x2 = this.angToX(this.mol.atomX(bto)), y2 = this.angToY(this.mol.atomY(bto));
			ctx.strokeStyle = 'red';
			ctx.lineWidth = 1;
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();
		}*/

		if (this.templatePerms != null)
		{
			let perm = this.templatePerms[this.currentPerm];
			if (perm.metavec != null) perm.metavec.renderContext(ctx);
		}

		ctx.restore();
	}
	protected redrawOver():void
	{
		let density = pixelDensity();
		(this.canvasOver.el as HTMLCanvasElement).width = this.width * density;
		(this.canvasOver.el as HTMLCanvasElement).height = this.height * density;
		this.canvasOver.css({'width': `${this.width}px`, 'height': `${this.height}px`});

		let ctx = (this.canvasOver.el as HTMLCanvasElement).getContext('2d');
		ctx.save();
		ctx.scale(density, density);
		ctx.clearRect(0, 0, this.width, this.height);

		// draw the lasso
		if ((this.dragType == DraggingTool.Lasso || this.dragType == DraggingTool.Erasor) && this.lassoX.length > 1)
		{
			let erasing = this.dragType == DraggingTool.Erasor;

			let path = new Path2D();
			path.moveTo(this.lassoX[0], this.lassoY[0]);
			for (let n = 1; n < this.lassoX.length; n++) path.lineTo(this.lassoX[n], this.lassoY[n]);
			path.closePath();

			ctx.fillStyle = colourCanvas(erasing ? 0xD0FF0000 : 0xF0000000);
			ctx.fill(path);

			ctx.strokeStyle = erasing ? '#804040' : '#808080';
			ctx.lineWidth = 0.5;
			ctx.stroke(path);
		}

		// draw the rotation theta
		if (this.dragType == DraggingTool.Rotate)
		{
			let [x0, y0, theta, magnitude] = this.determineDragTheta();
			let scale = this.pointScale;
			let lw = this.policy.data.lineSize * scale;
			ctx.strokeStyle = '#E0E0E0';
			ctx.lineWidth = 0.5 * lw;
			drawLine(ctx, x0, y0, x0 + magnitude, y0);
			ctx.strokeStyle = '#808080';
			ctx.lineWidth = lw;
			drawLine(ctx, x0, y0, x0 + magnitude * Math.cos(theta), y0 + magnitude * Math.sin(theta));
			ctx.beginPath();
			ctx.ellipse(x0, y0, 2 * lw, 2 * lw, 0, 0, TWOPI, false);
			ctx.fillStyle = '#808080';
			ctx.fill();
			// !! draw 0 degrees and a nice arc...

			for (let atom of this.subjectAtoms(true, false))
			{
				let ax = this.angToX(this.mol.atomX(atom)), ay = this.angToY(this.mol.atomY(atom));
				//let ax = this.arrmol.points[atom - 1].cx, ay = this.arrmol.points[atom - 1].cy;
				let ang = Math.atan2(ay - y0, ax - x0), dist = norm_xy(ax - x0, ay - y0);
				let nx = x0 + dist * Math.cos(ang + theta), ny = y0 + dist * Math.sin(ang + theta);
				ctx.beginPath();
				ctx.ellipse(nx, ny, 2 * lw, 2 * lw, 0, 0, TWOPI, false);
				ctx.strokeStyle = 'black';
				ctx.lineWidth = 0.5;
				ctx.stroke();
			}
		}

		// draw the displacement of subject atoms
		if (this.dragType == DraggingTool.Move)
		{
			let [dx, dy] = this.determineMoveDelta();
			let scale = this.pointScale;
			let lw = this.policy.data.lineSize * scale;
			for (let atom of this.subjectAtoms(false, true))
			{
				let ax = this.angToX(this.mol.atomX(atom)), ay = this.angToY(this.mol.atomY(atom));
				ctx.beginPath();
				ctx.ellipse(ax + dx, ay + dy, 2 * lw, 2 * lw, 0, 0, TWOPI, false);
				ctx.strokeStyle = 'black';
				ctx.lineWidth = 0.5;
				ctx.stroke();
			}
		}

		// draw the dragging of a bond-and-atom to a new position
		if ((this.dragType == DraggingTool.Atom && this.opAtom > 0) || this.dragType == DraggingTool.Bond)
		{
			let element = this.dragType == DraggingTool.Atom ? this.toolAtomSymbol : 'C';
			let order = this.dragType == DraggingTool.Bond ? this.toolBondOrder : 1;
			let type = this.dragType == DraggingTool.Bond ? this.toolBondType : Molecule.BONDTYPE_NORMAL;
			this.drawOriginatingBond(ctx, element, order, type);
		}

		if (this.viewOpt.showQuery) this.drawQueryFeatures(ctx);

		ctx.restore();
	}

	// draws an ellipse around an atom/bond, for highlighting purposes
	private drawAtomShade(ctx:CanvasRenderingContext2D, atom:number, fillCol:number, borderCol:number, anghalo:number):void
	{
		if (this.layout == null) return;

		let p:APoint = null;
		for (let n = 0; n < this.layout.numPoints(); n++) if (this.layout.getPoint(n).anum == atom)
		{
			p = this.layout.getPoint(n);
			break;
		}
		if (p == null) return;

		let minRad = 0.2 * this.pointScale, minRadSq = sqr(minRad);
		let cx = p.oval.cx, cy = p.oval.cy;
		let rad = Math.max(minRad, Math.max(p.oval.rw, p.oval.rh)) + (0.1 + anghalo) * this.pointScale;

		if (fillCol != -1)
		{
			ctx.beginPath();
			ctx.ellipse(cx, cy, rad, rad, 0, 0, TWOPI, true);
			ctx.fillStyle = colourCanvas(fillCol);
			ctx.fill();
		}
		if (borderCol != -1)
		{
			ctx.beginPath();
			ctx.ellipse(cx, cy, rad, rad, 0, 0, TWOPI, true);
			ctx.strokeStyle = colourCanvas(borderCol);
			ctx.lineWidth = 1;
			ctx.stroke();
		}
	}
	private drawBondShade(ctx:CanvasRenderingContext2D, bond:number, fillCol:number, borderCol:number, anghalo:number):void
	{
		if (this.layout == null) return;

		let x1 = 0, y1 = 0, x2 = 0, y2 = 0, nb = 0, sz = 0;
		for (let n = 0; n < this.layout.numLines(); n++)
		{
			let l = this.layout.getLine(n);
			if (l.bnum != bond) continue;
			x1 += l.line.x1; y1 += l.line.y1; x2 += l.line.x2; y2 += l.line.y2;
			nb++;
			sz += l.size + (0.2 + anghalo) * this.pointScale;
		}
		if (nb == 0) return;

		let invNB = 1 / nb;
		sz *= invNB;
		x1 *= invNB;
		y1 *= invNB;
		x2 *= invNB;
		y2 *= invNB;

		let dx = x2 - x1, dy = y2 - y1, invDist = 1 / norm_xy(dx, dy);
		dx *= invDist;
		dy *= invDist;
		let ox = dy, oy = -dx;

		let path = new Path2D(), mx:number, my:number, CIRC = 0.8;
		path.moveTo(x1 + ox * sz, y1 + oy * sz);

		mx = x1 + (ox * sz - dx * sz) * CIRC;
		my = y1 + (oy * sz - dy * sz) * CIRC;
		path.quadraticCurveTo(mx, my, x1 - dx * sz, y1 - dy * sz);

		mx = x1 + (-ox * sz - dx * sz) * CIRC;
		my = y1 + (-oy * sz - dy * sz) * CIRC;
		path.quadraticCurveTo(mx, my, x1 - ox * sz, y1 - oy * sz);
		path.lineTo(x2 - ox * sz, y2 - oy * sz);

		mx = x2 + (-ox * sz + dx * sz) * CIRC;
		my = y2 + (-oy * sz + dy * sz) * CIRC;
		path.quadraticCurveTo(mx, my, x2 + dx * sz, y2 + dy * sz);

		mx = x2 + (ox * sz + dx * sz) * CIRC;
		my = y2 + (oy * sz + dy * sz) * CIRC;
		path.quadraticCurveTo(mx, my, x2 + ox * sz, y2 + oy * sz);

		path.closePath();

		if (fillCol != -1)
		{
			ctx.beginPath();
			ctx.fillStyle = colourCanvas(fillCol);
			ctx.fill(path);
		}
		if (borderCol != -1)
		{
			ctx.beginPath();
			ctx.strokeStyle = colourCanvas(borderCol);
			ctx.lineWidth = 1;
			ctx.stroke(path);
		}
	}

	// draws an in-progress bond, originating either from the clicked-upon atom, or a point in space
	protected drawOriginatingBond(ctx:CanvasRenderingContext2D, element:string, order:number, type:number)
	{
		let x1 = this.clickX, y1 = this.clickY;
		if (this.opAtom > 0)
		{
			x1 = this.angToX(this.mol.atomX(this.opAtom));
			y1 = this.angToY(this.mol.atomY(this.opAtom));
		}
		let x2 = this.mouseX, y2 = this.mouseY;

		let snapTo = this.snapToGuide(x2, y2);
		if (snapTo != null) {x2 = snapTo[0]; y2 = snapTo[1];}

		let scale = this.pointScale;

		ctx.strokeStyle = '#808080';
		ctx.lineWidth = this.policy.data.lineSize * scale;
		drawLine(ctx, x1, y1, x2, y2);

		// !! TODO: draw multiple bonds

		if (element != 'C')
		{
			let fh = this.policy.data.fontSize * scale;
			ctx.font = fontSansSerif(fh);
			let metrics = ctx.measureText(element);
			ctx.fillStyle = '#808080';
			ctx.fillText(element, x2 - 0.5 * metrics.width, y2 + 0.5 * fh);
		}
	}

	// render query metadata for any atoms/bonds
	private drawQueryFeatures(ctx:CanvasRenderingContext2D):void
	{
		const {layout, mol} = this;

		interface Annotation
		{
			txt:string;
			x:number;
			y:number;
		}
		let annots:Annotation[] = [];

		for (let n = 1; n <= mol.numAtoms; n++) if (QueryUtil.hasAnyQueryAtom(mol, n))
		{
			let bits:string[] = [];
			for (let xtra of mol.atomExtra(n)) if (xtra.startsWith('q')) bits.push(xtra);
			let ap = layout.getPoint(n - 1);

			annots.push({'txt': bits.join(','), 'x': ap.oval.cx + ap.oval.rw, 'y': ap.oval.cy});
		}

		for (let n = 1; n <= mol.numBonds; n++) if (QueryUtil.hasAnyQueryBond(mol, n))
		{
			let bits:string[] = [];
			for (let xtra of mol.bondExtra(n)) if (xtra.startsWith('q')) bits.push(xtra);

			let num = 0, cx = 0, cy = 0;
			for (let bl of layout.getLines()) if (bl.bnum == n)
			{
				num += 2;
				cx += bl.line.x1 + bl.line.x2;
				cy += bl.line.y1 + bl.line.y2;
			}

			annots.push({'txt': bits.join(','), 'x': cx / num, 'y': cy / num});
		}

		// NOTE: displaying the encoded syntax directly; this should ideally be replaced by a nicer rendering mnemonic
		let fh = 0.7 * this.policy.data.fontSize * this.pointScale;
		for (let annot of annots)
		{
			ctx.font = fontSansSerif(fh);
			//let metrics = ctx.measureText(annot.txt);
			ctx.fillStyle = '#FF40C0';
			ctx.fillText(annot.txt, annot.x, annot.y);
		}
	}

	// based on drag state, calculates a ring that's fused & locked to the origination
	protected determineFauxRing():[number[], number[]]
	{
		let atom = this.opAtom, bond = this.opBond, mol = this.mol;
		let x1 = atom > 0 ? mol.atomX(atom) : bond > 0 ? 0.5 * (mol.atomX(mol.bondFrom(bond)) + mol.atomX(mol.bondTo(bond))) : this.xToAng(this.clickX);
		let y1 = atom > 0 ? mol.atomY(atom) : bond > 0 ? 0.5 * (mol.atomY(mol.bondFrom(bond)) + mol.atomY(mol.bondTo(bond))) : this.yToAng(this.clickY);
		let x2 = this.xToAng(this.mouseX), y2 = this.yToAng(this.mouseY), dx = x2 - x1, dy = y2 - y1;
		let rsz = Math.min(9, Math.round(norm_xy(dx, dy) * 2 / Molecule.IDEALBOND) + 2);

		if (rsz < 3) {}
		else if (bond > 0) return SketchUtil.proposeBondRing(mol, rsz, bond, dx, dy);
		else if (atom > 0 && mol.atomAdjCount(atom) > 0 && !this.toolRingFreeform) return SketchUtil.proposeAtomRing(mol, rsz, atom, dx, dy);
		else return SketchUtil.proposeNewRing(mol, rsz, x1, y1, dx, dy, !this.toolRingFreeform);

		return [null, null];
	}

	// based on the mouse position, determine the implied rotation for the interactive operation
	protected determineDragTheta():[number, number, number, number]
	{
		let x0 = this.clickX, y0 = this.clickY;
		let snap = this.snapToGuide(x0, y0);
		if (snap != null) {x0 = snap[0]; y0 = snap[1];}
		let theta = Math.atan2(this.mouseY - y0, this.mouseX - x0), magnitude = norm_xy(this.mouseX - x0, this.mouseY - y0);
		if (this.toolRotateIncr > 0) theta = Math.round(theta / this.toolRotateIncr) * this.toolRotateIncr;
		return [x0, y0, theta, magnitude];
	}

	// determine the delta, in pixels, for a drag-move operation: the source and destination may be snapped
	protected determineMoveDelta():[number, number]
	{
		let x1 = this.clickX, y1 = this.clickY, x2 = this.mouseX, y2 = this.mouseY;
		if (this.opAtom > 0)
		{
			x1 = this.angToX(this.mol.atomX(this.opAtom));
			y1 = this.angToY(this.mol.atomY(this.opAtom));
			let snap = this.snapToGuide(x2, y2);
			if (snap != null) {x2 = snap[0]; y2 = snap[1];}
		}
		return [x2 - x1, y2 - y1];
	}

	// if the mouse position is close to one of the snap-to points, or an existing atom, return that position
	protected snapToGuide(x:number, y:number):number[]
	{
		//if (this.dragGuides == null) return null;

		let bestDSQ = Number.POSITIVE_INFINITY, bestX = 0, bestY = 0;
		const APPROACH = sqr(0.5 * this.pointScale);
		if (this.dragGuides != null) for (let i = 0; i < this.dragGuides.length; i++) for (let j = 0; j < this.dragGuides[i].x.length; j++)
		{
			let px = this.dragGuides[i].destX[j], py = this.dragGuides[i].destY[j];
			let dsq = norm2_xy(px - x, py - y);
			if (dsq < APPROACH && dsq < bestDSQ) {bestDSQ = dsq; bestX = px; bestY = py;}
		}
		for (let n = 1; n <= this.mol.numAtoms; n++)
		{
			let px = this.angToX(this.mol.atomX(n)), py = this.angToY(this.mol.atomY(n));
			let dsq = norm2_xy(px - x, py - y);
			if (dsq < APPROACH && dsq < bestDSQ) {bestDSQ = dsq; bestX = px; bestY = py;}
		}
		if (isFinite(bestDSQ)) return [bestX, bestY];

		return null;
	}

	// returns an array of atom indices that make up the selection/current, or empty if nothing; if the "allIfNone" flag
	// is set, all of the atoms will be returned if otherwise would have been none; if "useOpAtom" is true, an empty
	// selection will be beefed up by the current mouseunder atom
	protected subjectAtoms(allIfNone = false, useOpAtom = false):number[]
	{
		let atoms:number[] = [];
		if (this.selectedMask != null)
		{
			for (let n = 0; n < this.selectedMask.length; n++) if (this.selectedMask[n]) atoms.push(n + 1);
			if (atoms.length > 0) return atoms;
		}
		if (this.currentAtom > 0) atoms.push(this.currentAtom);
		else if (this.currentBond > 0)
		{
			atoms.push(this.mol.bondFrom(this.currentBond));
			atoms.push(this.mol.bondTo(this.currentBond));
		}
		if (useOpAtom && atoms.length == 0 && this.opAtom > 0) atoms.push(this.opAtom);
		if (allIfNone && atoms.length == 0)
		{
			for (let n = 1; n <= this.mol.numAtoms; n++) atoms.push(n);
		}
		return atoms;
	}
}

/* EOF */ }