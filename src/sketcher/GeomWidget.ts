/*
    WebMolKit

    (c) 2010-2020 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	Geometry editing widget to support atom/bond editing dialogs.
*/

export enum GeomWidgetType
{
	Atom,
	Bond,
}

export enum GeomWidgetSelType
{
	Position,
	Link,
	Torsion,
}

export interface GeomWidgetSelection
{
	type:GeomWidgetSelType;
	idx:number;
}

export class GeomWidget extends Widget
{
	public callbackSelect:(sel:GeomWidgetSelection) => void;
	public selected:GeomWidgetSelection;

	private atomSubset:number[];
	private scale:number;
	private posX:number[] = [];
	private posY:number[] = [];
	private posRad:number;
	private linkA:number[] = [];
	private linkB:number[] = [];
	private torsA:number[] = [];
	private torsB:number[] = [];
	private hovered:GeomWidgetSelection = null;

	private divDiagram:DOM;

	constructor(private type:GeomWidgetType, private mol:Molecule, private idx:number)
	{
		super();

		if (type == GeomWidgetType.Atom)
		{
			const atom = idx;
			let adj = mol.atomAdjList(atom);
			this.atomSubset = [atom, ...adj];
			for (let b of mol.atomAdjBonds(atom))
			{
				this.linkA.push(0);
				this.linkB.push(this.atomSubset.indexOf(mol.bondOther(b, atom)));
			}
			let theta:number[] = [];
			for (let a of adj) theta.push(Math.atan2(-(mol.atomY(a) - mol.atomY(atom)), mol.atomX(a) - mol.atomX(atom)));
			let order = Vec.idxSort(theta);
			for (let n = 0; n < order.length; n++)
			{
				this.torsA.push(order[n] + 1);
				this.torsB.push(order[n < order.length - 1 ? n + 1 : 0] + 1);
			}
			this.selected = {'type': GeomWidgetSelType.Position, 'idx': 0};
		}
		else // Bond
		{
			const bond = idx;
			let a1 = mol.bondFrom(bond), a2 = mol.bondTo(bond);
			this.atomSubset = [...mol.atomAdjList(a1), ...mol.atomAdjList(a2)];
			let link = (a1:number, a2:number) =>
			{
				this.linkA.push(this.atomSubset.indexOf(a1));
				this.linkB.push(this.atomSubset.indexOf(a2));
			};
			link(a1, a2);
			for (let a of mol.atomAdjList(a1)) if (a != a2) link(a1, a);
			for (let a of mol.atomAdjList(a2)) if (a != a1) link(a2, a);
			this.selected = {'type': GeomWidgetSelType.Link, 'idx': 0};
		}
	}

	// create the underlying structure; the parent parameter must be jQuery-compatible
	public render(parent:any)
	{
		super.render(parent);

		let divOuter = dom('<div/>').appendTo(this.contentDOM).css({'text-align': 'center'});
		this.divDiagram = dom('<div/>').appendTo(divOuter).css({'display': 'inline-block'});
		this.contentDOM.onClick((event) => this.mouseClick(eventCoords(event, this.divDiagram)));
		this.contentDOM.onMouseMove((event) => this.mouseMove(eventCoords(event, this.divDiagram)));

		this.redraw();
	}

	// return the atom(s) that correspond to certain types
	public selectionAtoms(sel:GeomWidgetSelection):number[]
	{
		const atoms = this.atomSubset;
		if (sel.type == GeomWidgetSelType.Position) return [atoms[sel.idx]];
		if (sel.type == GeomWidgetSelType.Link) return [atoms[this.linkA[sel.idx]], atoms[this.linkB[sel.idx]]];
		if (sel.type == GeomWidgetSelType.Torsion) return [atoms[0], atoms[this.torsA[sel.idx]], atoms[this.torsB[sel.idx]]];
		return null;
	}

	// ------------ private methods ------------

	private redraw():void
	{
		this.divDiagram.empty();

		let w = 250, h = 250; // customise?
		this.posX = [];
		this.posY = [];
		const ANG_RAD = 0.25;
		for (let a of this.atomSubset)
		{
			this.posX.push(this.mol.atomX(a));
			this.posY.push(this.mol.atomY(a));
		}
		let loX = Vec.min(this.posX) - ANG_RAD, hiX = Vec.max(this.posX) + ANG_RAD;
		let loY = Vec.min(this.posY) - ANG_RAD, hiY = Vec.max(this.posY) + ANG_RAD;
		this.scale = Math.min(40, Math.min((w - 4) / (hiX - loX), (h - 4) / (hiY - loY)));
		let dx = 0.5 * (w - (hiX - loX) * this.scale), dy = 0.5 * (h - (hiY - loY) * this.scale);
		for (let n = 0; n < this.atomSubset.length; n++)
		{
			this.posX[n] = dx + (this.posX[n] - loX) * this.scale;
			this.posY[n] = h - (dy + (this.posY[n] - loY) * this.scale);
		}
		this.posRad = ANG_RAD * this.scale;

		let gfx = new MetaVector();
		gfx.setSize(w, h);

		let fg = Theme.foreground, bg = Theme.background, outerSel = 0x008FD1, innerSel = 0x47D5D2;
		for (let n = 0; n < this.atomSubset.length; n++)
		{
			if (this.hovered && this.hovered.type == GeomWidgetSelType.Position && this.hovered.idx == n)
				gfx.drawOval(this.posX[n], this.posY[n], this.posRad, this.posRad, fg, 1, bg);
			else if (this.selected && this.selected.type == GeomWidgetSelType.Position && this.selected.idx == n)
				gfx.drawOval(this.posX[n], this.posY[n], this.posRad, this.posRad, outerSel, 1, innerSel);
			else
				gfx.drawOval(this.posX[n], this.posY[n], this.posRad, this.posRad, MetaVector.NOCOLOUR, 0, fg);
		}

		for (let showsel of [1, 2, 3]) for (let n = 0; n < this.linkA.length; n++)
		{
			let x1 = this.posX[this.linkA[n]], y1 = this.posY[this.linkA[n]];
			let x2 = this.posX[this.linkB[n]], y2 = this.posY[this.linkB[n]];
			if (this.hovered && this.hovered.type == GeomWidgetSelType.Link && this.hovered.idx == n)
			{
				if (showsel == 3)
				{
					gfx.drawLine(x1, y1, x2, y2, fg, this.scale * 0.1 + 2);
					gfx.drawLine(x1, y1, x2, y2, bg, this.scale * 0.1);
				}
			}
			else if (this.selected && this.selected.type == GeomWidgetSelType.Link && this.selected.idx == n)
			{
				if (showsel == 2)
				{
					gfx.drawLine(x1, y1, x2, y2, outerSel, this.scale * 0.1 + 2);
					gfx.drawLine(x1, y1, x2, y2, innerSel, this.scale * 0.1);
				}
			}
			else
			{
				if (showsel == 1) gfx.drawLine(x1, y1, x2, y2, fg, this.scale * 0.1);
			}
		}

		for (let n = 0; n < this.torsA.length; n++)
		{
			let cx = this.posX[0], cy = this.posY[0];
			let dx1 = 0.5 * (this.posX[this.torsA[n]] - cx), dy1 = 0.5 * (this.posY[this.torsA[n]] - cy);
			let dx2 = 0.5 * (this.posX[this.torsB[n]] - cx), dy2 = 0.5 * (this.posY[this.torsB[n]] - cy);

			let rad = 0.5 * (norm_xy(dx1, dy1) + norm_xy(dx2, dy2));
			let theta1 = Math.atan2(dy1, dx1) + 10 * DEGRAD, theta2 = Math.atan2(dy2, dx2) - 10 * DEGRAD, dtheta = angleDiff(theta2, theta1);
			let ox1 = rad * Math.cos(theta1), oy1 = rad * Math.sin(theta1), ox2 = rad * Math.cos(theta2), oy2 = rad * Math.sin(theta2);

			let px:number[], py:number[], pf:boolean[];
			if (dtheta > 0) // short angle
			{
				let [ax1, ay1, ax2, ay2] = GeomUtil.arcControlPoints(rad, ox1, oy1, ox2, oy2);
				px = Vec.add([ox1, ax1, ax2, ox2], cx);
				py = Vec.add([oy1, ay1, ay2, oy2], cy);
				pf = [false, true, true, false];
			}
			else // long angle, need to do in two parts
			{
				let thetaM = theta1 + 0.5 * (dtheta + TWOPI);
				let oxM = rad * Math.cos(thetaM), oyM = rad * Math.sin(thetaM);

				let [ax1, ay1, ax2, ay2] = GeomUtil.arcControlPoints(rad, ox1, oy1, oxM, oyM);
				let [ax3, ay3, ax4, ay4] = GeomUtil.arcControlPoints(rad, oxM, oyM, ox2, oy2);
				px = Vec.add([ox1, ax1, ax2, oxM, ax3, ax4, ox2], cx);
				py = Vec.add([oy1, ay1, ay2, oyM, ay3, ay4, oy2], cy);
				pf = [false, true, true, false, true, true, false];
			}

			if (this.hovered && this.hovered.type == GeomWidgetSelType.Torsion && this.hovered.idx == n)
			{
				gfx.drawPath(px, py, pf, false, fg, this.scale * 0.1 + 2, MetaVector.NOCOLOUR, false);
				gfx.drawPath(px, py, pf, false, bg, this.scale * 0.1, MetaVector.NOCOLOUR, false);
			}
			else if (this.selected && this.selected.type == GeomWidgetSelType.Torsion && this.selected.idx == n)
			{
				gfx.drawPath(px, py, pf, false, outerSel, this.scale * 0.1 + 2, MetaVector.NOCOLOUR, false);
				gfx.drawPath(px, py, pf, false, innerSel, this.scale * 0.1, MetaVector.NOCOLOUR, false);
			}
			else gfx.drawPath(px, py, pf, false, fg, this.scale * 0.1, MetaVector.NOCOLOUR, false);
		}

		this.divDiagram.empty();
		let svg = dom(gfx.createSVG()).appendTo(this.divDiagram).css({'pointer-events': 'none'});
	}

	private mouseClick(xy:number[]):void
	{
		event.stopPropagation();
		if (this.type == GeomWidgetType.Bond) return; // no selection for bonds (for now)

		let which = this.whichSelection(xy[0], xy[1]);
		if (!which) return; // don't want clearing of selection (for now)
		if (!this.sameSelection(this.selected, which))
		{
			this.selected = which;
			this.hovered = null;
			this.redraw();
			this.callbackSelect(which);
		}
	}
	private mouseMove(xy:number[]):void
	{
		if (this.type == GeomWidgetType.Bond) return; // no selection for bonds (for now)

		let which = this.whichSelection(xy[0], xy[1]);
		if (which && this.sameSelection(which, this.selected)) which = null;
		if (!this.sameSelection(this.hovered, which))
		{
			this.hovered = which;
			this.redraw();
		}
	}

	private whichSelection(x:number, y:number):GeomWidgetSelection
	{
		let cx = this.posX[0], cy = this.posY[0];
		if (norm_xy(x - cx, y - cy) <= this.posRad) return {'type': GeomWidgetSelType.Position, 'idx': 0};
		let maxRad = 0;
		for (let n = 1; n < this.atomSubset.length; n++) maxRad = Math.max(maxRad, norm_xy(this.posX[n] - cx, this.posY[n] - cy) + this.posRad);
		if (norm_xy(x - cx, y - cy) > maxRad) return null;

		let theta = Math.atan2(y - cy, x - cx);
		let closeSel:GeomWidgetSelection = null, closeDelta = Number.POSITIVE_INFINITY;

		for (let n = 0; n < this.linkB.length; n++)
		{
			let delta = Math.abs(angleDiff(Math.atan2(this.posY[this.linkB[n]] - cy, this.posX[this.linkB[n]] - cx), theta));
			if (delta < 10 * DEGRAD && delta < closeDelta)
			{
				closeSel = {'type': GeomWidgetSelType.Link, 'idx': n};
				closeDelta = delta;
			}
		}

		for (let n = 0; n < this.torsA.length; n++)
		{
			let theta1 = Math.atan2(this.posY[this.torsA[n]] - cy, this.posX[this.torsA[n]] - cx);
			let theta2 = Math.atan2(this.posY[this.torsB[n]] - cy, this.posX[this.torsB[n]] - cx);
			let midtheta = theta1 + 0.5 * (angleDiff(theta2, theta1));
			let delta = Math.abs(angleDiff(midtheta, theta));
			if (delta < closeDelta)
			{
				closeSel = {'type': GeomWidgetSelType.Torsion, 'idx': n};
				closeDelta = delta;
			}
		}

		return closeSel;
	}

	// returns true if selections are the same
	private sameSelection(sel1:GeomWidgetSelection, sel2:GeomWidgetSelection):boolean
	{
		if (sel1 == null && sel2 == null) return true;
		if (sel1 == null || sel2 == null) return false;
		return sel1.type == sel2.type && sel1.idx == sel2.idx;
	}
}

/* EOF */ }