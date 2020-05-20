/*
	WebMolKit

	(c) 2010-2018 Molecular Materials Informatics, Inc.

	All rights reserved

	http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../data/Molecule.ts'/>
///<reference path='../data/CoordUtil.ts'/>
///<reference path='../gfx/Rendering.ts'/>
///<reference path='../gfx/FontData.ts'/>
///<reference path='../util/Geom.ts'/>
///<reference path='ArrangeMeasurement.ts'/>
///<reference path='Rendering.ts'/>

namespace WebMolKit /* BOF */ {

/*
	The algorithm for examining the contents of a molecule representation, and converting this into graphics primitives
	which are arranged on some virtual canvas, according to layout metrics. Most of the hard work of displaying a
	molecular structure is done within this class.
*/

export interface APoint
{
	anum:number; // corresponds to molecule atom index
	text:string; // the primary label, or null if invisible
	fsz:number; // font size for label
	bold:boolean;
	col:number;
	oval:Oval;
}

export enum BLineType
{
	Normal = 1, // a line segment; may be single bond, part of a multiple bond, or dissected bond
	Inclined, // an up-wedge bond
	Declined, // a down-wedge bond
	Unknown, // a squiggly bond
	Dotted, // dotted line
	DotDir, // dotted line, with inclined destination
	IncDouble, // inclined destination, order=2
	IncTriple, // inclined destination, order=3
	IncQuadruple // inclined destination, order=4
}

export interface BLine
{
	bnum:number; // molecule bond index
	bfr:number;
	bto:number;
	type:BLineType;
	line:Line;
	size:number; // line or dot size, where it applies
	head:number; // the maximum width of a wedge-type bond
	col:number;
}

export interface XRing
{
	atoms:number[];
	cx:number;
	cy:number;
	rw:number;
	rh:number;
	size:number; // line size
}

export interface XPath
{
	atoms:number[];
	px:number[];
	py:number[];
	ctrl:boolean[];
	size:number; // line size
}

export interface SpaceFiller
{
	anum:number; // origin, if any
	bnum:number;
	box:Box; // bounding limit
	px:number[];
	py:number[];
}

export class ArrangeMolecule
{
	private scale:number; // extracted from the measurement instance: useful to note when it changes

	// extracts, for efficiency
	private bondSepPix:number;
	private lineSizePix:number;
	private fontSizePix:number;
	private ymul:number; // -1 if Y is up, +1 if it is down

	// try to avoid compressing bonds too much; simple-line bonds are more resilient than things like dotted lines
	private MINBOND_LINE = 0.25;
	private MINBOND_EXOTIC = 0.5;

	// the angstrom-to-ascent height is corrected by this factor
	private static FONT_CORRECT = 1.5;

	// note: the first {#atoms} entries in the points array correspond to the atoms - and likewise for the space array; anything
	// listed after that is arbitrary; the lines are not listed in any kind of order
	private points:APoint[] = [];
	private lines:BLine[] = [];
	private rings:XRing[] = [];
	private paths:XPath[] = [];
	private space:SpaceFiller[] = [];

	// bond artifacts: by default they are derived automatically, but can also be disabled; these properties are also used to
	// override the default rendering of atom/bond properties
	private wantArtifacts = true;
	private artifacts:BondArtifact = null;
	private bondOrder:number[] = []; // replacement bond orders; special case: -1 for do-not-draw
	private atomCharge:number[] = [];
	private atomUnpaired:number[] = [];
	private artifactCharge = new Map<object, number>();
	private artifactUnpaired = new Map<object, number>();
	private artifactFract = new Map<object, boolean>();// bond order < 1: replaces the bond itself

	// --------------------- static methods ---------------------

	// when it is necessary to define a boundary box in which to draw a molecule, the only way to get it right is to do a
	// full arrangement, but this is computationally intensive; this method is fast, and delivers an approximate estimate
	public static guestimateSize(mol:Molecule, policy:RenderPolicy, maxW?:number, maxH?:number):number[]
	{
		let box = mol.boundary();
		let minX = box.minX(), minY = box.minY(), maxX = box.maxX(), maxY = box.maxY();
		let fontSize = policy.data.fontSize * this.FONT_CORRECT;

		for (let n = 1; n <= mol.numAtoms; n++) if (mol.atomExplicit(n))
		{
			let plusH = mol.atomHydrogens(n) > 0 ? 1 : 0;
			const aw = 0.5 * 0.7 * fontSize * (mol.atomElement(n).length + plusH);
			const ah = 0.5 * fontSize * (1 + plusH);
			const ax = mol.atomX(n), ay = mol.atomY(n);
			minX = Math.min(minX, ax - aw);
			maxX = Math.max(maxX, ax + aw);
			minY = Math.min(minY, ay - ah);
			maxY = Math.max(maxY, ay + ah);
		}
		let w = Math.max(1, (maxX - minX)) * policy.data.pointScale;
		let h = Math.max(1, (maxY - minY)) * policy.data.pointScale;
		if (maxW > 0 && w > maxW) {h *= maxW / w; w = maxW;}
		if (maxH > 0 && h > maxH) {w *= maxH / h; h = maxH;}
		return [w, h];
	}

	// --------------------- public methods ---------------------

	constructor(private mol:Molecule, private measure:ArrangeMeasurement, private policy:RenderPolicy,
				private effects:RenderEffects = new RenderEffects())
	{
	}

	// access to setup info
	public getMolecule():Molecule {return this.mol;}
	public getMeasure():ArrangeMeasurement {return this.measure;}
	public getPolicy():RenderPolicy {return this.policy;}
	public getEffects():RenderEffects {return this.effects;}
	public getScale():number {return this.scale;} // may be different from measure.scale() if modified after layout

	// bond artifacts: can decide whether they're to be derived, or provide them already
	public setWantArtifacts(want:boolean) {this.wantArtifacts = want;}
	public getArtifacts():BondArtifact {return this.artifacts;}
	public setArtifacts(artifacts:BondArtifact):void {this.artifacts = artifacts;}

	// the action method: call this before accessing any of the resultant data
	public arrange():void
	{
		const mol = this.mol;

		this.scale = this.measure.scale();
		this.bondSepPix = this.policy.data.bondSep * this.measure.scale();
		this.lineSizePix = this.policy.data.lineSize * this.measure.scale();
		this.fontSizePix = this.policy.data.fontSize * this.measure.scale() * ArrangeMolecule.FONT_CORRECT;
		this.ymul = this.measure.yIsUp() ? -1 : 1;

		let artmask:boolean[] = null;
		if (this.wantArtifacts && this.artifacts == null)
		{
			this.artifacts = new BondArtifact(mol);

			artmask = Vec.booleanArray(false, mol.numAtoms);
			for (let path of this.artifacts.getResPaths()) for (let a of path.atoms) artmask[a - 1] = true;
			for (let ring of this.artifacts.getResRings()) for (let a of ring.atoms) artmask[a - 1] = true;
			for (let arene of this.artifacts.getArenes()) {artmask[arene.centre - 1] = true; for (let a of arene.atoms) artmask[a - 1] = true;}
		}

		this.setupBondOrders();

		// fill in each of the atom centres
		for (let n = 1; n <= mol.numAtoms; n++)
		{
			// atom symbols which are more than 2 characters long are labels rather than elements, and get different treatment;
			// note we put in a null placeholder here, so that the points will be kept in their original atom order
			if (mol.atomElement(n).length > 2 && mol.atomHydrogens(n) == 0)
			{
				this.points.push(null);
				this.space.push(null);
				continue;
			}

			// proceed with a regular atom symbol
			let a:APoint =
			{
				'anum': n,
				'text': /*this.effects.showCarbon ||*/ mol.atomExplicit(n) || this.atomIsWeirdLinear(n) ? mol.atomElement(n) : null,
				'fsz': this.fontSizePix,
				'bold': mol.atomMapNum(n) > 0,
				'col': this.policy.data.atomCols[mol.atomicNumber(n)],
				'oval': new Oval(this.measure.angToX(mol.atomX(n)), this.measure.angToY(mol.atomY(n)), 0, 0)
			};
			let overCol = this.effects.colAtom[n];
			if (overCol) a.col = overCol;

			//if (policy.mappedColour >= 0 && mol.atomMapNum(n) > 0) a.col = policy.mappedColour;

			// decide whether this atom is to have a label
			//let explicit = mol.atomExplicit(n) /*|| this.effects.showCarbon;*/
			//if (explicit && /*!effects.showCarbon &&*/ mol.atomElement(n) == 'C' && !this.atomIsWeirdLinear(n)) explicit = !artmask[n - 1];
			//a.text = explicit ? mol.atomElement(n) : null;
			if (artmask[n - 1] && mol.atomElement(n) == 'C') a.text = null;

			// if it has a label, then how big
			if (a.text != null)
			{
				let wad = this.measure.measureText(a.text, a.fsz);
				const PADDING = 1.1; // want a bit more room
				a.oval.rw = 0.5 * wad[0] * PADDING;
				a.oval.rh = 0.5 * wad[1] * PADDING;
			}

			this.points.push(a);
			this.space.push(this.computeSpacePoint(a));
		}

		// pick up the label-style elements, and deal with them
		for (let n = 1; n <= mol.numAtoms; n++) if (this.points[n - 1] == null) this.processLabel(n);

		// resolve the bonds which can be analyzed immediately
		let bdbl = Vec.booleanArray(false, mol.numBonds); // gets set to true if bond is awaiting a double bond assignment

		for (let n = 1; n <= mol.numBonds; n++)
		{
			let bfr = mol.bondFrom(n), bto = mol.bondTo(n);
			let bt = mol.bondType(n), bo = this.bondOrder[n - 1];
			if (bo < 0) continue; // do not draw

			let col = this.effects.colBond[n];
			if (!col) col = this.policy.data.foreground;

			//if (this.policy.data.mappedColour >= 0 && mol.atomMapNum(mol.bondFrom(bfr)) > 0 && mol.atomMapNum(mol.bondTo(bto)) > 0) col = policy.mappedColour;
			bdbl[n - 1] = bo == 2 && (bt == Molecule.BONDTYPE_NORMAL || bt == Molecule.BONDTYPE_UNKNOWN);

			let a1 = this.points[bfr - 1], a2 = this.points[bto - 1];
			let x1 = a1.oval.cx, y1 = a1.oval.cy, x2 = a2.oval.cx, y2 = a2.oval.cy;

			 // miniscule resolution: do not give it a bond line; and remove the double bond flag so it doesn't get processed later either
			if (Math.abs(x2 - x1) <= 1 && Math.abs(y2 - y1) <= 1)
			{
				bdbl[n - 1] = false;
				continue;
			}

			// for non-double bonds, can add the constituents right away
			if (bdbl[n - 1]) continue;

			let minDist = (bo == 1 && bt == Molecule.BONDTYPE_NORMAL ? this.MINBOND_LINE : this.MINBOND_EXOTIC) * this.measure.scale();
			let xy1 = this.backOffAtom(bfr, x1, y1, x2, y2, minDist);
			let xy2 = this.backOffAtom(bto, x2, y2, x1, y1, minDist);
			this.ensureMinimumBondLength(xy1, xy2, x1, y1, x2, y2, minDist);

			// !! this is not good... make sure that it doesn't happen
			// (handled, above) if (Math.abs(xy1[0]-xy2[0])<=1 && Math.abs(xy1[1]-xy2[1])<=1) continue; // miniscule resolution: no bond line

			let sz = this.lineSizePix, head = 0;
			//if (mol.atomMapNum(mol.bondFrom(n))>0 && mol.atomMapNum(mol.bondTo(n))>0) sz*=5.0/3;

			let ltype = BLineType.Normal;
			if (bo == 1 && bt == Molecule.BONDTYPE_INCLINED)
			{
				ltype = BLineType.Inclined;
				head = 0.15 * this.measure.scale();
			}
			else if (bo == 1 && bt == Molecule.BONDTYPE_DECLINED)
			{
				ltype = BLineType.Declined;
				head = 0.15 * this.measure.scale();
			}
			else if (bt == Molecule.BONDTYPE_UNKNOWN)
			{
				ltype = BLineType.Unknown;
				head = 0.2 * this.measure.scale();
			}
			else if (bo == 0)
			{
				if (bt == Molecule.BONDTYPE_INCLINED || bt == Molecule.BONDTYPE_DECLINED) ltype = BLineType.DotDir;
				else ltype = BLineType.Dotted;
			}
			else if ((bo == 2 || bo == 3 || bo == 4) && (bt == Molecule.BONDTYPE_INCLINED || bt == Molecule.BONDTYPE_DECLINED))
			{
				ltype = bo == 2 ? BLineType.IncDouble : bo == 3 ? BLineType.IncTriple : BLineType.IncQuadruple;
				head = (bo == 2 ? 0.20 : 0.25) * this.measure.scale();
			}

			// for dotted lines, back off intersections if non-terminal
			if (bo == 0)
			{
				let dx = xy2[0] - xy1[0], dy = xy2[1] - xy1[1];
				let d = norm_xy(dx, dy), invD = 1 / d;
				let ox = 0.5 * dx * invD * this.bondSepPix, oy = 0.5 * dy * invD * this.bondSepPix;
				if (mol.atomAdjCount(bfr) > 1) {xy1[0] += ox; xy1[1] += oy;}
				if (mol.atomAdjCount(bto) > 1) {xy2[0] -= ox; xy2[1] -= oy;}
			}

			// for dotted/declined, swap the sides
			if (bo != 1 && bt == Molecule.BONDTYPE_DECLINED) [xy1, xy2] = [xy2, xy1];

			// for flat multi-order bonds, add multiple lines
			if (bo > 1 && (bt == Molecule.BONDTYPE_NORMAL || bt == Molecule.BONDTYPE_UNKNOWN))
			{
				let oxy = this.orthogonalDelta(xy1[0], xy1[1], xy2[0], xy2[1], this.bondSepPix);
				let v = -0.5 * (bo - 1);
				for (let i = 0; i < bo; i++, v++)
				{
					let lx1 = xy1[0] + v * oxy[0], ly1 = xy1[1] + v * oxy[1], lx2 = xy2[0] + v * oxy[0], ly2 = xy2[1] + v * oxy[1];
					let b:BLine =
					{
						'bnum': n,
						'bfr': bfr,
						'bto': bto,
						'type': ltype,
						'line': new Line(lx1, ly1, lx2, ly2),
						'size': sz,
						'head': head,
						'col': col
					};
					this.lines.push(b);
					this.space.push(this.computeSpaceLine(b));
				}
			}
			else
			{
				// just one line, of whatever style was determined
				let b:BLine =
				{
					'bnum': n,
					'bfr': bfr,
					'bto': bto,
					'type': ltype,
					'line': new Line(xy1[0], xy1[1], xy2[0], xy2[1]),
					'size': sz,
					'head': head,
					'col': col
				};
				this.lines.push(b);
				this.space.push(this.computeSpaceLine(b));
			}
		}

		// process double bonds in rings
		let rings = this.orderedRingList();
		for (let i = 0; i < rings.length; i++)
		{
			for (let j = 0; j < rings[i].length; j++)
			{
				let k = mol.findBond(rings[i][j], rings[i][j < rings[i].length - 1 ? j + 1 : 0]);
				if (bdbl[k - 1])
				{
					this.processDoubleBond(k, rings[i]);
					bdbl[k - 1] = false;
				}
			}
		}

		// process all remaining double bonds
		for (let i = 1; i <= mol.numBonds; i++) if (bdbl[i - 1]) this.processDoubleBond(i, this.priorityDoubleSubstit(i));

		// place hydrogen labels as explicit "atom centres"
		let hcount = Vec.numberArray(0, mol.numAtoms);
		for (let n = 1; n <= mol.numAtoms; n++) hcount[n - 1] = /*!effects.showHydrogen ||*/ this.points[n - 1].text == null ? 0 : mol.atomHydrogens(n);
		for (let n = 0; n < mol.numAtoms; n++) if (hcount[n] > 0 && this.placeHydrogen(n, hcount[n], true)) hcount[n] = 0;
		for (let n = 0; n < mol.numAtoms; n++) if (hcount[n] > 0) this.placeHydrogen(n, hcount[n], false);

		// look for atoms with isotope labels, and place them
		for (let n = 1; n <= mol.numAtoms; n++) if (mol.atomIsotope(n) != Molecule.ISOTOPE_NATURAL)
		{
			let isostr = mol.atomIsotope(n).toString();
			let col = this.policy.data.atomCols[mol.atomicNumber(n)];
			this.placeAdjunct(n, isostr, this.fontSizePix * 0.6, col, 150 * DEGRAD);
		}

		// do atomic charges/radical notation
		for (let n = 1; n <= mol.numAtoms; n++)
		{
			let str = '';
			let chg = this.atomCharge[n - 1];
			if (chg == -1) str = '-';
			else if (chg == 1) str = '+';
			else if (chg < -1) str = Math.abs(chg) + '-';
			else if (chg > 1) str = chg + '+';
			for (let i = this.atomUnpaired[n - 1]; i > 0; i--) str += '.';
			if (str.length == 0) continue;
			let col = this.policy.data.atomCols[mol.atomicNumber(n)];
			this.placeAdjunct(n, str, str.length == 1 ? 0.8 * this.fontSizePix : 0.6 * this.fontSizePix, col, 30 * DEGRAD);
		}

		if (this.artifacts != null)
		{
			for (let path of this.artifacts.getResPaths())
			{
				this.createCurvedPath(path.atoms, this.artifactFract.get(path), 0);
				this.delocalisedAnnotation(path.atoms, this.artifactCharge.get(path), this.artifactUnpaired.get(path));
			}
			for (let ring of this.artifacts.getResRings())
			{
				this.createCircularRing(ring.atoms);
				this.delocalisedAnnotation(ring.atoms, this.artifactCharge.get(ring), this.artifactUnpaired.get(ring));
			}
			for (let arene of this.artifacts.getArenes())
			{
				let isRing = arene.atoms.length > 2;
				if (isRing) for (let n = 0; n < arene.atoms.length; n++)
				{
					let nn = n < arene.atoms.length - 1 ? n + 1 : 0;
					if (mol.findBond(arene.atoms[n], arene.atoms[nn]) == 0) {isRing = false; break;}
				}
				this.createBondCentroid(arene.centre, arene.atoms);
				if (isRing) this.createCircularRing(arene.atoms); else this.createCurvedPath(arene.atoms, false, arene.centre);
				this.delocalisedAnnotation(arene.atoms, this.artifactCharge.get(arene), this.artifactUnpaired.get(arene));
			}
		}

		// perform a pseudo-embedding of the structure to resolve line-crossings
/* ... to be done....
		PseudoEmbedding emb = new PseudoEmbedding(mol);
		emb.calculateCrossings();
		for (int n = 0; n < emb.numCrossings(); n++)
		{
			PseudoEmbedding.LineCrossing c = emb.getCrossing(n);
			if (c.higher == 1) resolveLineCrossings(c.bond1, c.bond2);
			else if (c.higher == 2) resolveLineCrossings(c.bond2, c.bond1);
		}
*/
	}

   	// access to atom information; it is valid to assume that {atomcentre}[N-1] matches {moleculeatom}[N], if N<=mol.numAtoms
	public numPoints():number {return this.points.length;}
	public getPoint(idx:number):APoint {return this.points[idx];}
	public getPoints():APoint[] {return this.points;}

	// access to bond information; it is _NOT_ valid to read anything into the indices; they do not correlate with bond numbers
	public numLines():number {return this.lines.length;}
	public getLine(idx:number):BLine {return this.lines[idx];}
	public getLines():BLine[] {return this.lines;}

	// access to extra ring/resonance information
	public numRings():number {return this.rings.length;}
	public getRing(idx:number):XRing {return this.rings[idx];}
	public getRings():XRing[] {return this.rings;}
	public numPaths():number {return this.paths.length;}
	public getPath(idx:number):XPath {return this.paths[idx];}
	public getPaths():XPath[] {return this.paths;}

	// access to space-fillers (useful for calculating bounding boxes)
	public numSpace():number {return this.space.length;}
	public getSpace(idx:number):SpaceFiller {return this.space[idx];}
	public getSpaces():SpaceFiller[] {return this.space;}

	// goes through all the objects and nudges them by the given offset
	public offsetEverything(dx:number, dy:number):void
	{
		for (let a of this.points) a.oval.offsetBy(dx, dy);
		for (let b of this.lines) b.line.offsetBy(dx, dy);
		for (let r of this.rings)
		{
			r.cx += dx;
			r.cy += dy;
		}
		for (let p of this.paths)
		{
			Vec.addTo(p.px, dx);
			Vec.addTo(p.py, dy);
		}
		for (let spc of this.space)
		{
			spc.box.offsetBy(dx, dy);
			Vec.addTo(spc.px, dx);
			Vec.addTo(spc.py, dy);
		}
	}

	// ensure that the origin is at (0,0)
	public offsetOrigin():void
	{
		let bounds = this.determineBoundary();
		if (bounds[0] != 0 || bounds[1] != 0) this.offsetEverything(-bounds[0], -bounds[1]);
	}

	// goes through all of the objects and scales them by the provided factor
	public scaleEverything(scaleBy:number):void
	{
		this.scale *= scaleBy;
		for (let a of this.points)
		{
			a.oval.scaleBy(scaleBy);
			a.fsz *= scaleBy;
		}
		for (let b of this.lines)
		{
			b.line.scaleBy(scaleBy);
			b.size *= scaleBy;
			b.head *= scaleBy;
		}
		for (let r of this.rings)
		{
			r.cx *= scaleBy;
			r.cy *= scaleBy;
			r.rw *= scaleBy;
			r.rh *= scaleBy;
		}
		for (let p of this.paths)
		{
			Vec.mulBy(p.px, scaleBy);
			Vec.mulBy(p.py, scaleBy);
		}
		for (let spc of this.space)
		{
			spc.box.scaleBy(scaleBy);
			Vec.mulBy(spc.px, scaleBy);
			Vec.mulBy(spc.py, scaleBy);
		}
	}

	// goes through all of the primitives and works out {minX,minY,maxX,maxY}
	public determineBoundary(padding?:number):number[]
	{
		if (padding == null) padding = 0;
		if (this.space.length == 0) return [0, 0, 2 * padding, 2 * padding];

		let bounds = Vec.numberArray(0, 4);
		let spc = this.space[0];
		bounds[0] = spc.box.x;
		bounds[1] = spc.box.y;
		bounds[2] = spc.box.x + spc.box.w;
		bounds[3] = spc.box.y + spc.box.h;

		for (let n = this.space.length - 1; n > 0; n--)
		{
			spc = this.space[n];
			bounds[0] = Math.min(bounds[0], spc.box.x);
			bounds[1] = Math.min(bounds[1], spc.box.y);
			bounds[2] = Math.max(bounds[2], spc.box.x + spc.box.w);
			bounds[3] = Math.max(bounds[3], spc.box.y + spc.box.h);
		}

		// !! factor in the boundary...

		return bounds;
	}
	public determineBoundaryBox():Box
	{
		let [x1, y1, x2, y2] = this.determineBoundary();
		return new Box(x1, y1, x2 - x1, y2 - y1);
	}

	// convenience method: determines the boundaries of the arrangement, and makes sure that it all fits into the given
	// box; will be scaled down if necessary, but not scaled up
	public squeezeInto(x:number, y:number, w:number, h:number, padding?:number):void
	{
		if (padding != null && padding > 0)
		{
			x += padding;
			y += padding;
			w -= 2 * padding;
			h -= 2 * padding;
		}
		let bounds = this.determineBoundary(0);
		let bw = bounds[2] - bounds[0], bh = bounds[3] - bounds[1];
		if (bw > w || bh > h)
		{
			let downScale = 1;
			if (bw > w) downScale = w / bw;
			if (bh > h) downScale = Math.min(downScale, h / bh);
			this.scaleEverything(downScale);
			Vec.mulBy(bounds, downScale);
		}
		this.offsetEverything(x - bounds[0] + 0.5 * (w - bounds[2] + bounds[0]), y - bounds[1] + 0.5 * (h - bounds[3] + bounds[1]));
	}

	// converts all drawing objects to a single colour
	public monochromate(col:number):void
	{
		for (let a of this.points) a.col = col;
		for (let b of this.lines) b.col = col;
	}

	// makes a moderately deep copy: the layout metrics can be tinkered with, but not the core ingredients
	public clone():ArrangeMolecule
	{
		let dup = new ArrangeMolecule(this.mol, this.measure, this.policy, this.effects);
		dup.scale = this.scale;
		dup.bondSepPix = this.bondSepPix;
		dup.lineSizePix = this.lineSizePix;
		dup.fontSizePix = this.fontSizePix;
		dup.ymul = this.ymul;
		for (let a of this.points) dup.points.push(clone(a));
		for (let b of this.lines) dup.lines.push(clone(b));
		for (let s of this.space) dup.space.push(clone(s));
		return dup;
	}

	// --------------------- private methods ---------------------

	// extract bond orders and other artifact-overriden content, and then overwrite them if an artifact applies
	private setupBondOrders():void
	{
		const mol = this.mol;

		for (let n = 0; n < mol.numBonds; n++) this.bondOrder[n] = mol.bondOrder(n + 1);

		for (let n = 0; n < mol.numAtoms; n++)
		{
			this.atomCharge[n] = mol.atomCharge(n + 1);
			this.atomUnpaired[n] = mol.atomUnpaired(n + 1);
		}

		let delocalise = (obj:any, atoms:number[]) =>
		{
			let charge = 0, unpaired = 0;
			for (let a of atoms)
			{
				charge += this.atomCharge[a - 1];
				unpaired += this.atomUnpaired[a - 1];
				this.atomCharge[a - 1] = this.atomUnpaired[a - 1] = 0;
			}
			this.artifactCharge.set(obj, charge);
			this.artifactUnpaired.set(obj, unpaired);
		};

		// any bond that's affected by an artifact gets set to single-order for rendering purposes
		if (this.artifacts == null) return;

		for (let path of this.artifacts.getResPaths())
		{
			// figure out if the average bond order is less than 1 (using the original values)
			let charge = 0, unpaired = 0, orders = 0;
			for (let n = 0; n < path.atoms.length; n++)
			{
				charge += mol.atomCharge(path.atoms[n]);
				unpaired += mol.atomUnpaired(path.atoms[n]);
				let b = mol.findBond(path.atoms[n], path.atoms[n < path.atoms.length - 1 ? n + 1 : 0]);
				if (b > 0) orders += mol.bondOrder(b);
			}
			let fractional = (2 * orders - charge + unpaired) / path.atoms.length < 1;
			this.artifactFract.set(path, fractional);

			for (let n = 0; n < path.atoms.length - 1; n++)
			{
				let b = mol.findBond(path.atoms[n], path.atoms[n + 1]);
				if (b > 0) this.bondOrder[b - 1] = fractional ? -1 : 1;
			}
			delocalise(path, path.atoms);
		}
		for (let ring of this.artifacts.getResRings())
		{
			for (let n = 0; n < ring.atoms.length; n++)
			{
				let b = mol.findBond(ring.atoms[n], ring.atoms[n < ring.atoms.length - 1 ? n + 1 : 0]);
				if (b > 0) this.bondOrder[b - 1] = 1;
			}
			delocalise(ring, ring.atoms);
		}
		for (let arene of this.artifacts.getArenes())
		{
			for (let n = 0; n < arene.atoms.length; n++)
			{
				let b = mol.findBond(arene.atoms[n], arene.atoms[n < arene.atoms.length - 1 ? n + 1 : 0]);
				if (b > 0) this.bondOrder[b - 1] = 1;
				b = mol.findBond(arene.centre, arene.atoms[n]);
				if (b > 0) this.bondOrder[b - 1] = -1;
			}
			delocalise(arene, arene.atoms);
		}
	}
		// for a given adjunct to an atom, find a suitable position for it, based on the provided direction (angdir, radians);
	// the placement algorithm will try pretty hard to find a suitable position which is close to the parent atom, not
	// overlapping anything, and projected in the requested direction
	private placeAdjunct(atom:number, str:string, fsz:number, col:number, angdir:number):void
	{
		let wad = this.measure.measureText(str, fsz);
		let a = this.points[atom - 1];
		let cx = a.oval.cx, cy = a.oval.cy, rw = 0.55 * wad[0], rh = 0.55 * wad[1];

		// begin the circular sweep
		let bestScore = 0, bestDX = 0, bestDY = 0;
		let px = Vec.numberArray(0, 4), py = Vec.numberArray(0, 4);
		let angThresh = 10; // angular threshold for short-circuiting
		let shorted = false;
		for (let ext = 0.5 * (a.oval.rw + a.oval.rh); !shorted && ext < 1.5 * this.measure.scale(); ext += 0.1 * this.measure.scale())
		{
			const DELTA = 5 * DEGRAD;
			for (let d = 0; !shorted && d < Math.PI - 0.0001; d += DELTA) for (let s = -1; s <= 1; s += 2)
			{
				let dang = d * s + (s > 0 ? DELTA : 0), ang = angdir + dang;
				let dx = ext * Math.cos(ang), dy = ext * Math.sin(ang) * -this.ymul;
				let x1 = cx + dx - rw, x2 = cx + dx + rw, y1 = cy + dy - rh, y2 = cy + dy + rh;
				px[0] = x1; py[0] = y1;
				px[1] = x2; py[1] = y1;
				px[2] = x2; py[2] = y2;
				px[3] = x1; py[3] = y2;
				let viol = this.countPolyViolations(px, py, false);
				let score = 10 * viol + Math.abs(dang) + 10 * ext;

				let shortCircuit = viol == 0 && Math.abs(dang) < (angThresh + 1) * DEGRAD;

				if (bestScore == 0 || shortCircuit || score < bestScore)
				{
					bestScore = score;
					bestDX = dx;
					bestDY = dy;
				}
				if (shortCircuit) {shorted = true; break;}
			}

			angThresh += 5;
		}

		// create a point for it
		a =
		{
			'anum': 0,
			'text': str,
			'fsz': fsz,
			'bold': false,
			'col': col,
			'oval': new Oval(cx + bestDX, cy + bestDY, rw, rh)
		};
		this.points.push(a);

		// create a square spacefiller
		// TODO: spacefiller should use the glyph rather than just a box...
		let spc:SpaceFiller =
		{
			'anum': 0,
			'bnum': 0,
			'box': new Box(a.oval.cx - rw, a.oval.cy - rh, 2 * rw, 2 * rh),
			'px': [a.oval.cx - rw, a.oval.cx + rw, a.oval.cx + rw, a.oval.cx - rw],
			'py': [a.oval.cy - rh, a.oval.cy - rh, a.oval.cy + rh, a.oval.cy + rh]
		};
		this.space.push(spc);
	}

	// deals with an atom symbol which is a label rather than an element/short token
	private processLabel(anum:number):void
	{
		let ax = this.mol.atomX(anum), ay = this.mol.atomY(anum);

		// decide whether the label goes on the left, or the right, or is centred
		let left = 0, right = 0;
		let adj = this.mol.atomAdjList(anum);
		for (let n = 0; n < adj.length; n++)
		{
			let theta = Math.atan2(this.mol.atomY(adj[n]) - ay, this.mol.atomX(adj[n]) - ax) * RADDEG;
			if (theta >= -15 && theta <= 15) right += 3;
			else if (theta >= -85 && theta <= 85) right++;
			else if (theta > 85 && theta < 95) {} // orthogonal
			else if (theta < -85 && theta > -95) {} // orthogonal
			else if (theta > 165 || theta < -165) left += 3;
			else left++;
		}

		let label = this.mol.atomElement(anum);
		let ibar = label.indexOf('|'), ibrace = label.indexOf('{');

		let side = 0;
		if (left == 0 && right == 0 && ibar < 0 && ibrace < 0) {} // stay in middle
		else if (left < right) side = -1;
		else if (right < left) side = 1;
		else
		{
			// pick based on congestion; notice the bias toward placing on the right
			// !! if (spatialCongestion(ax-1,ay)<0.5f*spatialCongestion(ax+1,ay)) side=-1; else side=1;
			let score1 = CoordUtil.congestionPoint(this.mol, ax - 1, ay);
			let score2 = CoordUtil.congestionPoint(this.mol, ax + 1, ay);
			if (score1 < 0.5 * score2) side = -1; else side = 1;
		}

		// break up the label, if special characters are being used, and measure each
		let chunks:string[] = null;
		let position:number[] = null;
		let primary:boolean[] = null;
		let refchunk = 0;

		if (ibar < 0 && ibrace < 0) // one piece: it's simple
		{
			if (side == 0) chunks = [label];
			else if (side < 0)
			{
				chunks = [label.substring(0, label.length - 1), label.substring(label.length - 1)];
				refchunk = 1;
			}
			else chunks = [label.substring(0, 1), label.substring(1)];
		}
		else // multiple pieces: split it up
		{
			let bits:string[] = [];
			let bpos:number[] = [];
			let bpri:boolean[] = [];

			let blocks:string[] = label.split('|');
			if (side < 0) blocks = Vec.reverse(blocks);

			let buff = '';
			for (let i = 0; i < blocks.length; i++)
			{
				let isPrimary = (side >= 0 && i == 0) || (side < 0 && i == blocks.length - 1);

				if (side < 0 && refchunk == 0 && i == blocks.length - 1) refchunk = bits.length;
				let pos = 0;
				buff = '';
				for (let j = 0; j < blocks[i].length; j++)
				{
					let ch = blocks[i].charAt(j);
					if (ch == '{' || ch == '}')
					{
						if (buff.length > 0)
						{
							bits.push(buff.toString());
							bpos.push(pos);
							bpri.push(isPrimary);
						}
						buff = '';
						pos = ch == '{' ? -1 : 0;
					}
					// NOTE: to do this, have to also protect the split by '|' part above...
					//else if (ch == '\\' && j < blocks[i].length() - 1) {buff.append(blocks[i].charAt(j + 1)); j++;}
					else if (ch == '^' && pos == -1 && buff.length == 0) pos = 1;
					else buff += ch;
				}
				if (buff.length > 0)
				{
					bits.push(buff.toString());
					bpos.push(pos);
					bpri.push(isPrimary);
				}
			}

			chunks = bits;
			position = bpos;
			primary = bpri;

			// in case it leads with sub/superscript
			while (refchunk < chunks.length - 1 && position[refchunk] != 0) refchunk++;
		}

		let PADDING = 1.1;
		let SSFRACT = 0.6;

		let chunkw = Vec.numberArray(0, chunks.length);
		let tw = 0;
		for (let n = 0; n < chunks.length; n++)
		{
			chunkw[n] = this.measure.measureText(chunks[n], this.fontSizePix)[0];
			if (position != null && position[n] != 0) chunkw[n] *= SSFRACT;
			tw += chunkw[n];
		}

		let x = this.measure.angToX(ax), y = this.measure.angToY(ay);
		for (let n = 0; n < refchunk; n++) x -= chunkw[n];
		x -= 0.5 * chunkw[refchunk];

		for (let n = 0; n < chunks.length; n++)
		{
			let a:APoint =
			{
				'anum': (n == refchunk || (primary != null && primary[n])) ? anum : 0,
				'text': chunks[n],
				'fsz': this.fontSizePix,
				'bold': false,
				'col': this.policy.data.atomCols[this.mol.atomicNumber(anum)],
				'oval': new Oval(x + 0.5 * chunkw[n], y, 0.5 * chunkw[n] * PADDING, 0.5 * this.fontSizePix * PADDING)
			};

			if (position != null && position[n] != 0)
			{
				a.fsz *= SSFRACT;
				//a.cy += a.fsz * 0.7f * (measure.yIsUp() ? -1 : 1);

				if (position[n] < 0)
					a.oval.cy += a.fsz * 0.7 * (this.measure.yIsUp() ? -1 : 1);
				else
					a.oval.cy -= a.fsz * 0.3 * (this.measure.yIsUp() ? -1 : 1);
			}
			if (n == refchunk)
			{
				this.points[anum - 1] = a;
				this.space[anum - 1] = this.computeSpacePoint(a);
			}
			else
			{
				this.points.push(a);
				this.space.push(this.computeSpacePoint(a));
			}

			x += chunkw[n];
		}
	}

	// returns true if the atom has two neighbours at almost 180 degree separation, such that it is a bit on the unusual side, and
	// should have its carbon atoms drawn explicitly
	private atomIsWeirdLinear(idx:number):boolean
	{
		let bonds = this.mol.atomAdjBonds(idx);
		if (bonds.length != 2) return false;
		for (let n = 0; n < bonds.length; n++) if (this.mol.bondOrder(bonds[n]) == 3) return false; // triple bonds don't trigger this

		let adj = this.mol.atomAdjList(idx);
		let th1 = Math.atan2(this.mol.atomY(adj[0]) - this.mol.atomY(idx), this.mol.atomX(adj[0]) - this.mol.atomX(idx));
		let th2 = Math.atan2(this.mol.atomY(adj[1]) - this.mol.atomY(idx), this.mol.atomX(adj[1]) - this.mol.atomX(idx));
		return Math.abs(angleDiff(th1, th2)) >= 175 * DEGRAD;
	}

	// given that the position (X,Y) connects with atom N, and is part of a bond that connects at the other end
	// with (FX,FY), considers the possibility that a new (X,Y) may need to be calculated by backing up along the line;
	private backOffAtom(atom:number, x:number, y:number, fx:number, fy:number, minDist:number):number[]
	{
		if (x == fx && y == fy) return [x, y]; // can happen when really small

		let active = false;
		let dx = 0, dy = 0, dst = 0, ext = 0;

		for (let s = 0; s < this.space.length; s++)
		{
			let spc = this.space[s];
			if (spc.anum != atom) continue;

			const sz = spc.px.length;
			if (sz == 0) continue;

			for (let n = 0; n < sz; n++)
			{
				let nn = n < sz - 1 ? n + 1 : 0;
				let x1 = spc.px[n], y1 = spc.py[n], x2 = spc.px[nn], y2 = spc.py[nn];
				if (!GeomUtil.doLineSegsIntersect(x, y, fx, fy, x1, y1, x2, y2)) continue;
				let xy = GeomUtil.lineIntersect(x, y, fx, fy, x1, y1, x2, y2);

				if (!active)
				{
					dx = x - fx;
					dy = y - fy;
					dst = norm_xy(dx, dy);
					ext = dst;
					active = true;
				}
				ext = Math.min(ext, norm_xy(xy[0] - fx, xy[1] - fy));
			}
		}

		if (active)
		{
			ext = Math.max(minDist, ext - 0.1 * this.measure.scale());
			let idst = 1.0 / dst;
			return [fx + ext * idst * dx, fy + ext * idst * dy];
		}
		else return [x, y];
	}

	// for bond begin/end points, compares the current distance to the original distance, to make sure that it hasn't been
	// squished below a certain length, which tends to render badly
	private ensureMinimumBondLength(xy1:number[], xy2:number[], x1:number, y1:number, x2:number, y2:number, minDist:number):void
	{
		let dx = xy2[0] - xy1[0], dy = xy2[1] - xy1[1];
		let dsq = norm2_xy(dx, dy);
		minDist = Math.min(minDist, norm_xy(x2 - x1, y2 - y1));
		if (dsq >= sqr(minDist - 0.0001)) return;

		// scale the bond back up to its minimum size
		let d12 = Math.sqrt(dsq), d1 = norm_xy(xy1[0] - x1, xy1[1] - y1), d2 = norm_xy(x2 - xy2[0], y2 - xy2[1]);
		let mag = 1 - minDist / d12, invD12 = 1.0 / (d1 + d2), mag1 = d1 * mag * invD12, mag2 = d2 * mag * invD12;
		xy1[0] -= dx * mag1;
		xy1[1] -= dy * mag1;
		xy2[0] += dx * mag2;
		xy2[1] += dy * mag2;
	}

	// produces a list of small rings, ordered in a terminal-first manner, which is to be used as the sequence for assigning sides
	// of bond orders
	private orderedRingList():number[][]
	{
		let rings:number[][] = [];
		let SIZE_ORDER = [6, 5, 7, 4, 3];
		for (let i = 0; i < SIZE_ORDER.length; i++)
		{
			let nring = this.mol.findRingsOfSize(SIZE_ORDER[i]);
			for (let j = 0; j < nring.length; j++) rings.push(nring[j]);
		}
		let ringsz = rings.length;

		// for each atom add up the number of times it occurs in a small ring
		let ringbusy = Vec.numberArray(0, this.mol.numAtoms);
		for (let n = 0; n < ringsz; n++)
		{
			let r = rings[n];
			for (let i = 0; i < r.length; i++) ringbusy[r[i] - 1]++;
		}

		// score the rings by the sum of the busy quotient
		let ringscore = Vec.numberArray(0, ringsz);
		for (let n = 0; n < ringsz; n++)
		{
			let r = rings[n];
			for (let i = 0; i < r.length; i++) ringscore[n] += ringbusy[r[i] - 1];
		}
		let ringorder = Vec.idxSort(ringscore);

		// count the number of double bonds in each ring, and use this to override the primary sort order (most=first)
		let resbcount = Vec.numberArray(0, ringsz), maxbcount = 0;
		for (let n = 0; n < ringsz; n++)
		{
			let r = rings[ringorder[n]];
			for (let i = 0; i < r.length; i++)
			{
				let j = this.mol.findBond(r[i], r[i + 1 < r.length ? i + 1 : 0]);
				if (this.mol.bondOrder(j) == 2) resbcount[n]++;
			}
			maxbcount = Math.max(maxbcount, resbcount[n]);
		}

		let pos = 0, ret:number[][] = [];
		for (let sz = maxbcount; sz >= 0; sz--)
		{
			for (let n = 0; n < ringsz; n++) if (resbcount[n] == sz) ret.push(rings[ringorder[n]]);
		}

		return ret;
	}

	// convenience function which returns {ox,oy} which is orthogonal to the direction of the input vector, of magnitude D; the
	// direction of {ox,oy} is to the "left" of the input vector
	private orthogonalDelta(x1:number, y1:number, x2:number, y2:number, d:number):number[]
	{
		let ox = y1 - y2, oy = x2 - x1, dsq = norm2_xy(ox, oy);
		let sc = dsq > 0 ? d / Math.sqrt(dsq) : 1;
		return [ox * sc, oy * sc];
	}

	// given the guideline index of a double bond, and some information about the atoms which are on the "important side", creates
	// the appropriate line segments
	private processDoubleBond(idx:number, priority:number[]):void
	{
		let bfr = this.mol.bondFrom(idx), bto = this.mol.bondTo(idx);
		let nfr = this.mol.atomAdjList(bfr), nto = this.mol.atomAdjList(bto);

		let a1 = this.points[bfr - 1], a2 = this.points[bto - 1];
		let x1 = a1.oval.cx, y1 = a1.oval.cy, x2 = a2.oval.cx, y2 = a2.oval.cy;

		const minDist = this.MINBOND_EXOTIC * this.measure.scale();
		let xy1 = this.backOffAtom(bfr, x1, y1, x2, y2, minDist);
		let xy2 = this.backOffAtom(bto, x2, y2, x1, y1, minDist);
		this.ensureMinimumBondLength(xy1, xy2, x1, y1, x2, y2, minDist);
		x1 = xy1[0]; y1 = xy1[1]; x2 = xy2[0]; y2 = xy2[1];

		let dx = x2 - x1, dy = y2 - y1, btheta = Math.atan2(dy, dx);

		// count number of priority atoms on either side of the bond vector
		let countFLeft = 0, countFRight = 0, countTLeft = 0, countTRight = 0;
		let idxFLeft = 0, idxFRight = 0, idxTLeft = 0, idxTRight = 0;
		let noshift = false; // true if definitely not alkene-ish
		for (let n = 0; n < nfr.length; n++) if (nfr[n] != bto)
		{
			let bo = this.mol.bondOrder(this.mol.findBond(bfr, nfr[n]));
			if (bo == 0) continue;
			if (bo > 1) {noshift = true; break;}

			let ispri = false;
			for (let i = 0; i < (priority == null ? 0 : priority.length); i++) if (priority[i] == nfr[n]) ispri = true;

			let theta = angleDiff(Math.atan2(this.points[nfr[n] - 1].oval.cy - y1, this.points[nfr[n] - 1].oval.cx - x1), btheta);
			if (Math.abs(theta) * RADDEG > 175) {noshift = true; break;} // linear

			if (theta > 0)
			{
				if (ispri) countFLeft++;
				idxFLeft = nfr[n];
			}
			else
			{
				if (ispri) countFRight++;
				idxFRight = nfr[n];
			}
		}
		for (let n = 0; n < nto.length; n++) if (nto[n] != bfr)
		{
			let bo = this.mol.bondOrder(this.mol.findBond(bto, nto[n]));
			if (bo == 0) continue;
			if (bo > 1) {noshift = true; break;}

			let ispri = false;
			for (let i = 0; i < (priority == null ? 0 : priority.length); i++) if (priority[i] == nto[n]) ispri = true;

			let theta = angleDiff(Math.atan2(this.points[nto[n] - 1].oval.cy - y2, this.points[nto[n] - 1].oval.cx - x2), btheta);
			if (Math.abs(theta) * RADDEG > 175) {noshift = true; break;} // linear

			if (theta > 0)
			{
				if (ispri) countTLeft++;
				idxTLeft = nto[n];
			}
			else
			{
				if (ispri) countTRight++;
				idxTRight = nto[n];
			}
		}

		// decide which side the bond should be shifted to, if either
		let side = 0;
		if (noshift || countFLeft > 1 || countFRight > 1 || countTLeft > 1 || countTRight > 1) {} // inappropriate
		else if (countFLeft > 0 && countFRight > 0) {} // ambiguous
		else if (countTLeft > 0 && countTRight > 0) {} // ambiguous
		else if (countFLeft > 0 || countTLeft > 0) side = 1; // left
		else if (countFRight > 0 || countTRight > 0) side = -1; // right

		// create the bond lines

		let sz = this.lineSizePix;
		let oxy = this.orthogonalDelta(x1, y1, x2, y2, this.bondSepPix);
		let ax1 = x1, ay1 = y1, ax2 = x2, ay2 = y2;
		let bx1 = 0, by1 = 0, bx2 = 0, by2 = 0;

		// side==0 means that the double bond straddles the line between the two points; !=0 means that the first line (A) is like a
		// regular single bond, while the second line is an adjunct off to one side
		if (side == 0)
		{
			ax1 = x1 + 0.5 * oxy[0]; ay1 = y1 + 0.5 * oxy[1];
			ax2 = x2 + 0.5 * oxy[0]; ay2 = y2 + 0.5 * oxy[1];
			bx1 = x1 - 0.5 * oxy[0]; by1 = y1 - 0.5 * oxy[1];
			bx2 = x2 - 0.5 * oxy[0]; by2 = y2 - 0.5 * oxy[1];
		}
		else if (side > 0)
		{
			bx1 = x1 + oxy[0]; by1 = y1 + oxy[1];
			bx2 = x2 + oxy[0]; by2 = y2 + oxy[1];
			if (nfr.length > 1 && this.points[bfr - 1].text == null) {bx1 += oxy[1]; by1 -= oxy[0];}
			if (nto.length > 1 && this.points[bto - 1].text == null) {bx2 -= oxy[1]; by2 += oxy[0];}
		}
		else if (side < 0)
		{
			bx1 = x1 - oxy[0]; by1 = y1 - oxy[1];
			bx2 = x2 - oxy[0]; by2 = y2 - oxy[1];
			if (nfr.length > 1 && this.points[bfr - 1].text == null) {bx1 += oxy[1]; by1 -= oxy[0];}
			if (nto.length > 1 && this.points[bto - 1].text == null) {bx2 -= oxy[1]; by2 += oxy[0];}
		}

		// if there's shifting happening, check to see if either end has a terminal heteroatom
		if (side != 0)
		{
			if (this.mol.atomElement(bfr).length <= 2 && this.mol.atomAdjCount(bfr) == 1 && this.points[bfr - 1].text != null)
			{
				this.bumpAtomPosition(bfr, 0.5 * oxy[0] * side, 0.5 * oxy[1] * side);
			}
			if (this.mol.atomElement(bto).length <= 2 && this.mol.atomAdjCount(bto) == 1 && this.points[bto - 1].text != null)
			{
				this.bumpAtomPosition(bto, 0.5 * oxy[0] * side, 0.5 * oxy[1] * side);
			}
		}

		// if both sides are evenly balanced, want to make the double bonds intersect with their adjacent bonds
		if (side == 0 && !noshift)
		{
			let xy:number[] = null;
			if (this.points[bfr - 1].text == null && !this.mol.bondInRing(idx))
			{
				xy = this.adjustBondPosition(idxFLeft, bfr, ax1, ay1, ax2, ay2);
				if (xy != null) {ax1 = xy[0]; ay1 = xy[1];}
				xy = this.adjustBondPosition(idxFRight, bfr, bx1, by1, bx2, by2);
				if (xy != null) {bx1 = xy[0]; by1 = xy[1];}
			}
			if (this.points[bto - 1].text == null && !this.mol.bondInRing(idx))
			{
				xy = this.adjustBondPosition(idxTLeft, bto, ax2, ay2, ax1, ay1);
				if (xy != null) {ax2 = xy[0]; ay2 = xy[1];}
				xy = this.adjustBondPosition(idxTRight, bto, bx2, by2, bx1, by1);
				if (xy != null) {bx2 = xy[0]; by2 = xy[1];}
			}
		}

		let lt = this.mol.bondType(idx) == Molecule.BONDTYPE_UNKNOWN ? BLineType.Unknown : BLineType.Normal;
		let head = lt == BLineType.Unknown ? 0.1 * this.scale : 0;
		let col = this.effects.colBond[idx];
		if (!col) col = this.policy.data.foreground;
		//(do mapped colour?)
		//if (this.policy.mappedColour >= 0 && this.mol.atomMapNum(this.mol.bondFrom(bfr)) > 0 && this.mol.atomMapNum(this.mol.bondTo(bto)) > 0) col = this.policy.mappedColour;

		let b1:BLine =
		{
			'bnum': idx,
			'bfr': bfr,
			'bto': bto,
			'type': lt,
			'line': new Line(ax1, ay1, ax2, ay2),
			'size': sz,
			'head': head,
			'col': col
		};
		let b2:BLine =
		{
			'bnum': idx,
			'bfr': bfr,
			'bto': bto,
			'type': lt,
			'line': new Line(bx1, by1, bx2, by2),
			'size': sz,
			'head': head,
			'col': col
		};

		this.lines.push(b1);
		this.lines.push(b2);
		this.space.push(this.computeSpaceLine(b1));
		this.space.push(this.computeSpaceLine(b2));
	}

	// for a point index (0-based), attempt to place some number of hydrogen atoms as a label (H, H2, H3, etc.); if the fussy
	// parameter is set, will insist on placing it in one of the 4 axial directions, starting with the atom's default preference;
	// will return false if this cannot be accomplished without stepping on something; if fussy is not enabled, will just try to
	// get it as close as possible
	private placeHydrogen(idx:number, hcount:number, fussy:boolean):boolean
	{
		let font = FontData.main;
		const SSFRACT = 0.6;
		const GLYPH_H = font.getIndex('H');

		let a = this.points[idx];
		let emscale = a.fsz * font.INV_UNITS_PER_EM;
		let sub = hcount >= 2 ? hcount.toString() : '';

		// create polygonal outline: start with the precomputed convex hull of the letter 'H', then grow as necessary
		let outlineX = font.getOutlineX(GLYPH_H), outlineY = font.getOutlineY(GLYPH_H);

		let firstEMW = font.HORIZ_ADV_X[GLYPH_H], emw = firstEMW;
		for (let n = 0; n < sub.length; n++)
		{
			let ch = sub.charAt(n), g = font.getIndex(ch);
			if (n == 0)
			{
				emw += font.getKerning('H', ch);
			}
			else
			{
				let chp = sub.charAt(n - 1);
				emw += font.getKerning(chp, ch) * SSFRACT;
			}

			let extraX = font.getOutlineX(g), extraY = font.getOutlineY(g);
			Vec.addTo(extraX, emw / SSFRACT);
			Vec.addTo(extraY, (SSFRACT - 1) * font.ASCENT);
			Vec.mulBy(extraX, SSFRACT);
			Vec.mulBy(extraY, SSFRACT);
			outlineX = outlineX.concat(extraX);
			outlineY = outlineY.concat(extraY);
			emw += font.HORIZ_ADV_X[g] * SSFRACT;
		}

		// if multiple, take the convex hull of all of the above
		if (sub.length > 0)
		{
			let qh = new QuickHull(outlineX, outlineY, 0);
			outlineX = qh.hullX;
			outlineY = qh.hullY;
		}

		// transform the outline into the right position
		let emdx = -0.5 * firstEMW, emdy = 0.5 * font.ASCENT;
		for (let n = 0; n < outlineX.length; n++)
		{
			outlineX[n] = a.oval.cx + (emdx + outlineX[n]) * emscale;
			outlineY[n] = a.oval.cy + (emdy - outlineY[n]) * emscale * this.ymul;
		}

		// for the "fussy" cases, only attempt the 4 axis-oriented directions
		let dx = 0, dy = 0;
		let srcWAD = this.measure.measureText(a.text, a.fsz);
		if (fussy)
		{
			// decide on the order: {0,1,2,3} is right,left,up,down; but priority can vary
			let RIGHTLEFT = [0, 1, 2, 3];
			let LEFTRIGHT = [1, 0, 2, 3];
			let UPDOWN = [2, 3, 0, 1];
			let DOWNUP = [3, 2, 0, 1];
			let quad = RIGHTLEFT, adj = this.mol.atomAdjList(a.anum);

			if (adj.length == 0)
			{
				let LEFTIES = ['O', 'S', 'F', 'Cl', 'Br', 'I'];
				if (this.mol.atomCharge(a.anum) == 0 && this.mol.atomUnpaired(a.anum) == 0 &&
					LEFTIES.indexOf(this.mol.atomElement(a.anum)) >= 0) quad = LEFTRIGHT; // e.g. H2O, H2S
				else quad = RIGHTLEFT; // e.g. NH3, -OH
			}
			else
			{
				let allLeft = true, allRight = true, allUp = true, allDown = true;
				const ax = this.mol.atomX(a.anum), ay = this.mol.atomY(a.anum);
				for (let n = 0; n < adj.length; n++)
				{
					const bx = this.mol.atomX(adj[n]), by = this.mol.atomY(adj[n]);
					if (bx > ax + 0.01) allLeft = false;
					if (bx < ax - 0.01) allRight = false;
					if (by < ay - 0.01) allUp = false;
					if (by > ay + 0.01) allDown = false;
				}
				if (allLeft) {}
				else if (allRight) quad = LEFTRIGHT;
				else if (allUp) quad = DOWNUP;
				else if (allDown) quad = UPDOWN;
			}
			for (let n = 0; n < 4; n++)
			{
				let tx = 0, ty = 0;
				if (quad[n] == 0) tx = 0.5 * srcWAD[0] + 0.5 * firstEMW * emscale; // right
				else if (quad[n] == 1) tx = -0.5 * srcWAD[0] - (emw - 0.5 * firstEMW) * emscale; // left
				else if (quad[n] == 2) ty = (1.1 * srcWAD[1] + 0.5 * srcWAD[2]) * -this.ymul; // up
				else if (quad[n] == 3) ty = (1.1 * srcWAD[1] + 0.5 * srcWAD[2]) * this.ymul; // down

				// if it can be placed without overlap, we'll take it
				Vec.addTo(outlineX, tx);
				Vec.addTo(outlineY, ty);
				let viol = this.countPolyViolations(outlineX, outlineY, true);
				Vec.addTo(outlineX, -tx);
				Vec.addTo(outlineY, -ty);

				if (viol == 0)
				{
					dx = tx;
					dy = ty;
					break;
				}
			}
			if (dx == 0 && dy == 0) return false;
		}
		else
		{
			// for this one, we need a version of the outline polygon that's slightly bigger so it's not adjacent
			const mx1 = Vec.min(outlineY), mx2 = Vec.max(outlineX), my1 = Vec.min(outlineY), my2 = Vec.max(outlineY), cx = 0.5 * (mx1 + mx2), cy = 0.5 * (my1 + my2);
			const mag = 1 + this.measure.scale() * this.policy.data.fontSize * ArrangeMolecule.FONT_CORRECT * 0.1 / Math.max(mx2 - cx, my2 - cy);
			const psz = outlineX.length;

			let magPX = outlineX.slice(0), magPY = outlineY.slice(0);
			for (let n = 0; n < psz; n++)
			{
				magPX[n] = (magPX[n] - cx) * mag + cx;
				magPY[n] = (magPY[n] - cy) * mag + cy;
			}

			// do a circular sweep, with an extending radius; if at any extension there's a non-overlapping
			let bestScore = 0, bestExt = 0, bestAng = 0;
			for (let ext = 0.5 * (a.oval.rw + a.oval.rh); ext < 1.5 * this.measure.scale(); ext += 0.1 * this.measure.scale())
			{
				let anyNoClash = false;

				for (let ang = 0; ang < 2 * Math.PI; ang += 5 * DEGRAD)
				{
					let tx = ext * Math.cos(ang), ty = ext * Math.sin(ang);
					Vec.addTo(magPX, tx);
					Vec.addTo(magPY, ty);
					let viol = this.countPolyViolations(magPX, magPY, false);
					Vec.addTo(magPX, -tx);
					Vec.addTo(magPY, -ty);
					if (viol == 0) anyNoClash = true;
					let score = 10 * viol + this.spatialCongestion(a.oval.cx + tx, a.oval.cy + ty, 0.5) + 2 * ext;
					if (bestScore == 0 || score < bestScore)
					{
						bestScore = score;
						bestExt = ext;
						bestAng = ang;
						dx = tx;
						dy = ty;
					}
				}

				if (anyNoClash) break;
			}
		}

		// apply the result
		let wad = this.measure.measureText('H', a.fsz);
		const PADDING = 1.1;
		let ah:APoint =
		{
			'anum': 0,
			'text': 'H',
			'fsz': a.fsz,
			'bold': a.bold,
			'col': a.col,
			'oval': new Oval(a.oval.cx + dx, a.oval.cy + dy, 0.5 * wad[0] * PADDING, 0.5 * wad[1] * PADDING)
		};
		this.points.push(ah);

		if (sub.length > 0)
		{
			const subFsz = SSFRACT * a.fsz;
			wad = this.measure.measureText(sub, subFsz);
			let an:APoint =
			{
				'anum': 0,
				'text': sub,
				'fsz': subFsz,
				'bold': a.bold,
				'col': a.col,
				'oval': new Oval(ah.oval.cx + 0.5 * firstEMW * a.fsz * font.INV_UNITS_PER_EM + 0.5 * wad[0],
								 ah.oval.cy + (1 - SSFRACT) * a.fsz, 0.5 * wad[0] * PADDING, 0.5 * wad[1] * PADDING)
			};
			this.points.push(an);
		}

		// the space-filler is for the H and its label
		Vec.addTo(outlineX, dx);
		Vec.addTo(outlineY, dy);
		let minX = Vec.min(outlineX), minY = Vec.min(outlineY);
		let spc:SpaceFiller =
		{
			'anum': 0,
			'bnum': 0,
			'box': new Box(minX, minY, Vec.max(outlineX) - minX, Vec.max(outlineY) - minY),
			'px': outlineX,
			'py': outlineY
		};
		this.space.push(spc);

		return true;
	}

	// creates a "space filling" outline for a point, which provides sufficient detail to maneuvre other objects around it
	private computeSpacePoint(a:APoint):SpaceFiller
	{
		let s:SpaceFiller =
		{
			'anum': a.anum,
			'bnum': 0,
			'box': new Box(),
			'px': [],
			'py': []
		};

		const font = FontData.main;
		let outlineX:number[] = [], outlineY:number[] = [];
		let emw = 0, nglyphs = 0;
		if (a.text != null)
		{
			for (let n = 0; n < a.text.length; n++)
			{
				let ch1 = a.text.charAt(n);
				let i = font.getIndex(ch1);
				if (i >= 0)
				{
					if (emw == 0)
					{
						outlineX = font.getOutlineX(i);
						outlineY = font.getOutlineY(i);
						nglyphs = 1;
					}
					else
					{
						let extraX = font.getOutlineX(i), extraY = font.getOutlineY(i);
						if (extraX.length > 0)
						{
							Vec.addTo(extraX, emw);
							outlineX = outlineX.concat(extraX);
							outlineY = outlineY.concat(extraY);
							nglyphs++;
						}
					}
					emw += font.HORIZ_ADV_X[i];
				}
				else emw += font.MISSING_HORZ;

				if (n < a.text.length - 1)
				{
					let ch2 = a.text.charAt(n + 1);
					emw += font.getKerning(ch1, ch2);
				}
			}
		}

		if (outlineX.length > 0)
		{
			if (nglyphs > 1)
			{
				let qh = new QuickHull(outlineX, outlineY, 0);
				outlineX = qh.hullX;
				outlineY = qh.hullY;
			}

			let emdx = -0.5 * emw, emdy = 0.5 * font.ASCENT;
			let emscale = a.fsz * font.INV_UNITS_PER_EM;
			for (let n = 0; n < outlineX.length; n++)
			{
				outlineX[n] = a.oval.cx + (emdx + outlineX[n]) * emscale;
				outlineY[n] = a.oval.cy + (emdy - outlineY[n]) * emscale * this.ymul;
			}

			s.px = outlineX;
			s.py = outlineY;
			let minX = Vec.min(outlineX), minY = Vec.min(outlineY);
			s.box = new Box(minX, minY, Vec.max(outlineX) - minX, Vec.max(outlineY) - minY);
		}
		else
		{
			s.box = Box.fromOval(a.oval);
			if (s.box.w > 0 && s.box.h > 0)
			{
				s.px = [s.box.minX(), s.box.maxX(), s.box.maxX(), s.box.minX()];
				s.py = [s.box.minY(), s.box.minY(), s.box.maxY(), s.box.maxY()];
			}
		}

		return s;
	}

	// creates a "space filling" outline for a line, which may end up being described as a line segment or a polygon
	private computeSpaceLine(b:BLine):SpaceFiller
	{
		let s:SpaceFiller =
		{
			'anum': 0,
			'bnum': b.bnum,
			'box': new Box(),
			'px': [],
			'py': []
		};
		if (b.type == BLineType.Normal || b.type == BLineType.Dotted || b.type == BLineType.DotDir)
		{
			// line segment
			s.px = [b.line.x1, b.line.x2];
			s.py = [b.line.y1, b.line.y2];
		}
		else
		{
			// create a wedge of fat-body outline
			const dx = b.line.x2 - b.line.x1, dy = b.line.y2 - b.line.y1;
			const norm = b.head / Math.sqrt(dx * dx + dy * dy);
			const ox = norm * dy, oy = -norm * dx;

			if (b.type == BLineType.Unknown)
			{
				s.px = [b.line.x1 + ox, b.line.x1 - ox, b.line.x2 - ox, b.line.x2 + ox];
				s.py = [b.line.y1 + oy, b.line.y1 - oy, b.line.y2 - oy, b.line.y2 + oy];
			}
			else
			{
				s.px = [b.line.x1, b.line.x2 - ox, b.line.x2 + ox];
				s.py = [b.line.y1, b.line.y2 - oy, b.line.y2 + oy];
			}
		}

		s.box.x = Vec.min(s.px) - b.size;
		s.box.y = Vec.min(s.py) - b.size;
		s.box.w = Vec.max(s.px) - s.box.x + b.size;
		s.box.h = Vec.max(s.py) - s.box.y + b.size;
		return s;
	}

	// adjusts the point, and associated spacefillers, for an atom
	private bumpAtomPosition(atom:number, dx:number, dy:number):void
	{
		let p = this.points[atom - 1];
		p.oval.cx += dx;
		p.oval.cy += dy;

		for (let n = this.space.length - 1; n >= 0; n--)
		{
			let s = this.space[n - 1];
			if (s == null || s.anum != atom) continue;
			s.box.x += dx;
			s.box.y += dy;
			Vec.addTo(s.px, dx);
			Vec.addTo(s.py, dy);
		}
	}

	// for a provided polygon, counts the number of times each of its lines intersects with the lines of one of the space-filling
	// polygons already placed; if the shortCircuit parameter is true, will return as soon as one is found
	private countPolyViolations(px:number[], py:number[], shortCircuit:boolean):number
	{
		let hits = 0;
		const psz = px.length, nspc = this.space.length;

		// check for line-crossings first: this is the usual way that collisions happen
		let pr = new Box(), sr = new Box();
		for (let i1 = 0; i1 < psz; i1++)
		{
			let i2 = i1 < psz - 1 ? i1 + 1 : 0;
			pr.x = Math.min(px[i1], px[i2]) - 1;
			pr.y = Math.min(py[i1], py[i2]) - 1;
			pr.w = Math.max(px[i1], px[i2]) - pr.x + 2;
			pr.h = Math.max(py[i1], py[i2]) - pr.y + 2;

			for (let j = 0; j < nspc; j++)
			{
				let spc = this.space[j];
				if (spc.px == null) continue;
				sr.x = spc.box.x - 1;
				sr.y = spc.box.y - 1;
				sr.w = spc.box.w + 1;
				sr.h = spc.box.h + 1;
				if (!pr.intersects(sr)) continue; // will eliminate almost everything

				let ssz = spc.px.length;
				for (let j1 = 0; j1 < ssz; j1++)
				{
					let j2 = j1 < ssz - 1 ? j1 + 1 : 0;
					sr.x = Math.min(spc.px[j1], spc.px[j2]) - 1;
					sr.y = Math.min(spc.py[j1], spc.py[j2]) - 1;
					sr.w = Math.max(spc.px[j1], spc.px[j2]) - sr.x + 2;
					sr.h = Math.max(spc.py[j1], spc.py[j2]) - sr.y + 2;
					if (!pr.intersects(sr)) continue; // almost everything else

					if (GeomUtil.doLineSegsIntersect(px[i1], py[i1], px[i2], py[i2], spc.px[j1], spc.py[j1], spc.px[j2], spc.py[j2]))
					{
						if (shortCircuit) return 1;
						hits++;
						break; // (no need to count all the lines in this spacefiller)
					}

					if (ssz == 1) break; // it's a line, not a polygon; one pass only
				}
			}
		}

		// now iterate over the spacefillers, and see if it's possible for either polygon to enclose the other
		pr.x = Vec.min(px);
		pr.y = Vec.min(py);
		pr.w = Vec.max(px) - pr.x;
		pr.h = Vec.max(py) - pr.y;

		for (let n = nspc - 1; n >= 0; n--)
		{
			let spc = this.space[n];
			sr.x = spc.box.x;
			sr.y = spc.box.y;
			sr.w = spc.box.w;
			sr.h = spc.box.h;
			if (!pr.intersects(sr)) continue; // eliminates most

			// see if the spacefiller is inside the parameter polygon
			for (let i = spc.px.length - 1; i >= 0; i--) if (GeomUtil.pointInPolygon(spc.px[i], spc.py[i], px, py))
			{
				if (shortCircuit) return 1;
				hits++;
				break;
			}

			// see if the parameter polygon is inside the spacefiller
			for (let i = 0; i < psz; i++) if (GeomUtil.pointInPolygon(px[i], py[i], spc.px, spc.py))
			{
				if (shortCircuit) return 1;
				hits++;
				break;
			}
		}

		return hits;
	}

	// considering any bonds between (bf,bt), given that 'bt' is the source of a double bond line at position (x,y) and heading
	// out in the direction (dx,dy), make sure that two lines are adjusted to their intersection position; the position of
	// the line involving 'bf' is modified directly, while the new position is returned as an array of [x,y], for the caller
	// to update
	private adjustBondPosition(bf:number, bt:number, x1:number, y1:number, x2:number, y2:number):number[]
	{
		if (bf == 0 || bt == 0) return null;

		for (let n = 0; n < this.lines.length; n++)
		{
			let b = this.lines[n];
			if (this.mol.bondOrder(b.bnum) != 1 || this.mol.bondType(b.bnum) != Molecule.BONDTYPE_NORMAL) continue;

			let alt = false;
			if (this.mol.bondFrom(b.bnum) == bf && this.mol.bondTo(b.bnum) == bt) {}
			else if (this.mol.bondFrom(b.bnum) == bt && this.mol.bondTo(b.bnum) == bf) alt = true;
			else continue;

			// if lines are anywhere near parallel, don't do this
			//if (GeomUtil.areLinesParallel(b.x1,b.y1,b.x2,b.y2,x1,y1,x2,y2)) continue; (this is too precise)
			let th = angleDiff(Math.atan2(b.line.y2 - b.line.y1, b.line.x2 - b.line.x1), Math.atan2(y2 - y1, x2 - x1)) * RADDEG;
			if ((th > -5 && th < 5) || th > 175 || th < -175) continue;

			let xy = GeomUtil.lineIntersect(b.line.x1, b.line.y1, b.line.x2, b.line.y2, x1, y1, x2, y2);

			// separate the non-double bond attachments (but only if not in a ring)
			if (this.mol.atomRingBlock(bt) == 0)
			{
				if (alt)
					{b.line.x1 = xy[0]; b.line.y1 = xy[1];}
				else
					{b.line.x2 = xy[0]; b.line.y2 = xy[1];}
			}

			return xy;
		}
		return null;
	}

	// for the guideline index of a double bond, determines which side has weighting priority for the drawing of the bond;
	// assumes a chain-like bond (though it could still be in a large ring); a null/empty/ambiguous set implies that there
	// is no priority, and that the bond should not be drawn in a side-shifted manner...
	private priorityDoubleSubstit(idx:number):number[]
	{
		let bf = this.mol.bondFrom(idx), bt = this.mol.bondTo(idx);
		let nf = this.mol.atomAdjList(bf), nt = this.mol.atomAdjList(bt);
		let a1 = this.points[bf - 1], a2 = this.points[bt - 1];
		let x1 = a1.oval.cx, y1 = a1.oval.cy, x2 = a2.oval.cx, y2 = a2.oval.cy;
		let dx = x2 - x1, dy = y2 - y1, btheta = Math.atan2(dy, dx);

		let idxFLeft = 0, idxFRight = 0, idxTLeft = 0, idxTRight = 0;

		for (let n = 0; n < nf.length; n++) if (nf[n] != bt)
		{
			let theta = angleDiff(Math.atan2(this.points[nf[n] - 1].oval.cy - y1, this.points[nf[n] - 1].oval.cx - x1), btheta);
			if (theta > 0) {if (idxFLeft != 0) return null; idxFLeft = nf[n];}
			else {if (idxFRight != 0) return null; idxFRight = nf[n];}
		}
		for (let n = 0; n < nt.length; n++) if (nt[n] != bf)
		{
			let theta = angleDiff(Math.atan2(this.points[nt[n] - 1].oval.cy - y2, this.points[nt[n] - 1].oval.cx - x2), btheta);
			if (theta > 0) {if (idxTLeft != 0) return null; idxTLeft = nt[n];}
			else {if (idxTRight != 0) return null; idxTRight = nt[n];}
		}

		let sumFrom = (idxFLeft > 0 ? 1 : 0) + (idxFRight > 0 ? 1 : 0), sumTo = (idxTLeft > 0 ? 1 : 0) + (idxTRight > 0 ? 1 : 0);

		if (sumFrom == 1 && sumTo == 0) return [idxFLeft > 0 ? idxFLeft : idxFRight];
		if (sumFrom == 0 && sumTo == 1) return [idxTLeft > 0 ? idxTLeft : idxTRight];
		if (sumFrom == 1 && sumTo == 1)
		{
			// cis? if so, then side is obvious
			if (idxFLeft > 0 && idxTLeft > 0) return [idxFLeft, idxTLeft];
			if (idxFRight > 0 && idxTRight > 0) return [idxFRight, idxTRight];

			// trans? either is fine, so go with congestion
			let oxy = this.orthogonalDelta(x1, y1, x2, y2, this.bondSepPix);
			let congestLeft = this.spatialCongestion(0.5 * (x1 + x2) + oxy[0], 0.5 * (y1 + y2) + oxy[1]);
			let congestRight = this.spatialCongestion(0.5 * (x1 + x2) - oxy[0], 0.5 * (y1 + y2) - oxy[1]);
			if (congestLeft < congestRight) return [idxFLeft > 0 ? idxFLeft : idxTLeft];
			else return [idxFRight > 0 ? idxFRight : idxTRight];
		}
		if (sumFrom == 2 && sumTo == 1)
		{
			// side with the majority
			if (idxTLeft == 0) return [idxFRight, idxTRight];
			else return [idxFLeft, idxTLeft];
		}
		if (sumFrom == 1 && sumTo == 2)
		{
			// side with the majority
			if (idxFLeft == 0) return [idxFRight, idxTRight];
			else return [idxFLeft, idxTLeft];
		}

		return null;
	}

	// for a specific location, returns a measure of how "congested" it is; lower values mean that the point is generally far away
	// from things
	private spatialCongestion(x:number, y:number, thresh?:number):number
	{
		if (thresh == null) thresh = 0.001;
		let congest = 0;
		for (let n = 0; n < this.points.length; n++)
		{
			let a = this.points[n];
			if (a == null) continue;
			let dx = a.oval.cx - x, dy = a.oval.cy - y;
			congest += 1 / (dx * dx + dy * dy + thresh);
		}
		return congest;
	}

	// returns true if the indicated box intersects with any of the currently defined atom centres or bond lines; can optionally
	// pass masks for the points & lines which we could possibly care about
	private boxOverlaps(x:number, y:number, w:number, h:number, pointmask?:boolean[], linemask?:boolean[]):boolean
	{
		let vx1 = x, vy1 = y, vx2 = x + w, vy2 = y + h;

		for (let n = 0; n < this.points.length; n++)
		{
			if (pointmask != null && !pointmask[n]) continue;

			let a = this.points[n];
			let wx1 = a.oval.cx - a.oval.rw, wy1 = a.oval.cy - a.oval.rh, wx2 = a.oval.cx + a.oval.rw, wy2 = a.oval.cy + a.oval.rh;

			// test for any intersection of rectangles
			if (vx2 < wx1 || vx1 > wx2 || vy2 < wy1 || vy1 > wy2) continue; // no intersection of rectangles

			return true;
		}

		for (let n = 0; n < this.lines.length; n++)
		{
			if (linemask != null && !linemask[n]) continue;

			let b = this.lines[n];

			let wx1 = b.line.x1, wy1 = b.line.y1, wx2 = b.line.x2, wy2 = b.line.y2;

			// test for any intersection with line's rectangle
			if (vx2 < Math.min(wx1, wx2) || vx1 > Math.max(wx1, wx2) || vy2 < Math.min(wy1, wy2) || vy1 > Math.max(wy1, wy2)) continue; // no intersection of rectangles

			// if either point is completely in the box, then fast-out
			if (wx1 >= vx1 && wx1 <= vx2 && wy1 >= vy1 && wy1 <= vy2) return true;
			if (wx2 >= vx1 && wx2 <= vx2 && wy2 >= vy1 && wy2 <= vy2) return true;

			if (GeomUtil.doLineSegsIntersect(wx1, wy1, wx2, wy2, vx1, vy1, vx2, vy1)) return true;
			if (GeomUtil.doLineSegsIntersect(wx1, wy1, wx2, wy2, vx1, vy2, vx2, vy2)) return true;
			if (GeomUtil.doLineSegsIntersect(wx1, wy1, wx2, wy2, vx1, vy1, vx1, vy2)) return true;
			if (GeomUtil.doLineSegsIntersect(wx1, wy1, wx2, wy2, vx2, vy1, vx2, vy2)) return true;
		}

		return false;
	}

	// given the predetermined fact that {bondHigher} crosses {bondLower} with the original coordinates, looks for
	// arranged lines matching these indices, so that they might be split up
	private resolveLineCrossings(bondHigher:number, bondLower:number):void
	{
		while (true)
		{
			let anything = false;

			for (let i1 = 0; i1 < this.lines.length; i1++)
			{
				let b1 = this.lines[i1];
				if (b1.bnum != bondHigher) continue;
				if (b1.type != BLineType.Normal && b1.type != BLineType.Dotted && b1.type != BLineType.DotDir) continue;

				for (let i2 = 0; i2 < this.lines.length; i2++)
				{
					let b2 = this.lines[i2];
					// note: b1 is on top, b2 is on bottom

					if (b2.bnum != bondLower) continue;
					if (b2.type == BLineType.DotDir) b2.type = BLineType.Dotted; // zap the directionality when splitting in two
					if (b2.type != BLineType.Normal && b2.type != BLineType.Dotted) continue;

					// make sure they don't share an atom
					if (b1.bfr == b2.bfr || b1.bfr == b2.bto || b1.bto == b2.bfr || b1.bto == b2.bto) continue;

					if (!GeomUtil.doLineSegsIntersect(b1.line.x1, b1.line.y1, b1.line.x2, b1.line.y2, b2.line.x1, b2.line.y1, b2.line.x2, b2.line.y2)) continue;
					let xy = GeomUtil.lineIntersect(b1.line.x1, b1.line.y1, b1.line.x2, b1.line.y2, b2.line.x1, b2.line.y1, b2.line.x2, b2.line.y2);

					let dx = b2.line.x2 - b2.line.x1, dy = b2.line.y2 - b2.line.y1;
					let ext = Math.abs(dx) > Math.abs(dy) ? (xy[0] - b2.line.x1) / dx : (xy[1] - b2.line.y1) / dy;

					let dist = norm_xy(dx, dy);
					let delta = b2.size / dist * (b2.type == BLineType.Normal ? 2 : 4);
					if (ext > delta && ext < 1 - delta)
					{
						let b3:BLine =
						{
							'bnum': b2.bnum,
							'bfr': b2.bfr,
							'bto': b2.bto,
							'type': b2.type,
							'line': b2.line.clone(),
							'size': b2.size,
							'head': b2.head,
							'col': b2.col
						};
						this.lines.push(b3);
						b2.line.x2 = b2.line.x1 + dx * (ext - delta);
						b2.line.y2 = b2.line.y1 + dy * (ext - delta);
						b3.line.x1 = b3.line.x1 + dx * (ext + delta);
						b3.line.y1 = b3.line.y1 + dy * (ext + delta);
						anything = true;
					}
					else if (ext > delta)
					{
						b2.line.x2 = b2.line.x1 + dx * (ext - delta);
						b2.line.y2 = b2.line.y1 + dy * (ext - delta);
						anything = true;
					}
					else if (ext < 1 - delta)
					{
						b2.line.x1 = b2.line.x1 + dx * (ext + delta);
						b2.line.y1 = b2.line.y1 + dy * (ext + delta);
						anything = true;
					}
				}
			}
			if (!anything) break;
		}
	}

	// draw a circle at the interior of a group of atoms, as in, ring-style benzene
	private createCircularRing(atoms:number[]):void
	{
		let cx = 0, cy = 0;
		for (let a of atoms)
		{
			let pt = this.points[a - 1];
			cx += pt.oval.cx;
			cy += pt.oval.cy;
		}
		cx /= atoms.length;
		cy /= atoms.length;

		let bx:number[] = [], by:number[] = [];
		let isRegular = true;
		let regDist = Number.NaN;
		for (let a of atoms)
		{
			let pt = this.points[a - 1];
			let x0 = pt.oval.cx - cx, y0 = pt.oval.cy - cy, x1 = x0 - pt.oval.rw, x2 = x0 + pt.oval.rw, y1 = y0 - pt.oval.rh, y2 = y0 + pt.oval.rh;
			bx.push(x1); by.push(y0);
			bx.push(x1); by.push(y1);
			bx.push(x1); by.push(y2);
			bx.push(x0); by.push(y1);
			bx.push(x0); by.push(y2);
			bx.push(x2); by.push(y0);
			bx.push(x2); by.push(y1);
			bx.push(x2); by.push(y2);
			let dist = norm_xy(x0, y0), theta = Math.atan2(y0, x0);
			const FRACT = 0.7;
			bx.push(FRACT * dist * Math.cos(theta));
			by.push(FRACT * dist * Math.sin(theta));

			for (let b of this.mol.atomAdjList(a)) if (atoms.indexOf(b) >= 0)
			{
				let pb = this.points[b - 1];
				let mx = 0.5 * (pt.oval.cx + pb.oval.cx) - cx, my = 0.5 * (pt.oval.cy + pb.oval.cy) - cy;
				let mdist = norm_xy(mx, my), mtheta = Math.atan2(my, mx);
				bx.push(FRACT * mdist * Math.cos(mtheta));
				by.push(FRACT * mdist * Math.sin(mtheta));
			}

			// check if it's still considered regular
			if (!isRegular) {}
			else if (Number.isFinite(regDist)) {if (Math.abs(regDist - dist) > 1) isRegular = false;}
			else regDist = dist;
		}

		let r:XRing = {'atoms': atoms, 'cx': cx, 'cy': cy, 'rw': 0, 'rh': 0, 'size': 0};
		if (isRegular)
		{
			r.rw = r.rh = GeomUtil.fitCircle(bx, by);
		}
		else
		{
			let lowX = Vec.min(bx) - 10 * Vec.range(bx), highX = Vec.max(bx) + 10 * Vec.range(bx);
			let lowY = Vec.min(by) - 10 * Vec.range(by), highY = Vec.max(by) + 10 * Vec.range(by);
			let minX = Number.POSITIVE_INFINITY, maxX = Number.NEGATIVE_INFINITY, minY = Number.POSITIVE_INFINITY, maxY = Number.NEGATIVE_INFINITY;
			for (let n = 0; n < atoms.length; n++)
			{
				let nn = n < atoms.length - 1 ? n + 1 : 0;
				let p1 = this.points[atoms[n] - 1], p2 = this.points[atoms[nn] - 1];
				let x1 = p1.oval.cx - cx - 0.1 * (p2.oval.cx - p1.oval.cx), y1 = p1.oval.cy - cy - 0.1 * (p2.oval.cy - p1.oval.cy);
				let x2 = p2.oval.cx - cx + 0.1 * (p2.oval.cx - p1.oval.cx), y2 = p2.oval.cy - cy + 0.1 * (p2.oval.cy - p1.oval.cy);
				if (GeomUtil.doLineSegsIntersect(x1, y1, x2, y2, lowX, 0, highX, 0))
				{
					let xy = GeomUtil.lineIntersect(x1, y1, x2, y2, lowX, 0, highX, 0);
					minX = Math.min(minX, xy[0]);
					maxX = Math.max(maxX, xy[0]);
				}
				if (GeomUtil.doLineSegsIntersect(x1, y1, x2, y2, 0, lowY, 0, highY))
				{
					let xy = GeomUtil.lineIntersect(x1, y1, x2, y2, 0, lowY, 0, highY);
					minY = Math.min(minY, xy[1]);
					maxY = Math.max(maxY, xy[1]);
				}
			}

			let rwh = GeomUtil.fitEllipse(bx, by, minX, minY, maxX, maxY);
			r.rw = rwh[0];
			r.rh = rwh[1];
		}
		r.size = this.lineSizePix;
		this.rings.push(r);
	}

	// draw a continuous fractional bond for resonance-style paths
	private createCurvedPath(atoms:number[], fractional:boolean, extAtom:number):void
	{
		const sz = atoms.length, szn = sz - 1;
		let x:number[] = [], y:number[] = [], symbol:boolean[] = [];
		for (let n = 0; n < sz; n++)
		{
			let pt = this.points[atoms[n] - 1];
			x.push(pt.oval.cx);
			y.push(pt.oval.cy);
			symbol.push(pt.text != null);
		}

		// calculate offsets that can be used (+/-) to put the fraction on one side of the path
		let ox:number[] = [], oy:number[] = [];
		const EXT = Molecule.IDEALBOND * 0.25 * this.scale;
		for (let n = 0; n < sz - 1; n++)
		{
			let dx = x[n + 1] - x[n], dy = y[n + 1] - y[n], invD = EXT * invZ(norm_xy(dx, dy));
			ox.push(dy * invD);
			oy.push(-dx * invD);
		}

		// create two paths with these offsets
		const FAR = 1.2, CLOSE = 0.7;
		let sx1 = Vec.numberArray(0, sz), sy1 = Vec.numberArray(0, sz), sx2 = Vec.numberArray(0, sz), sy2 = Vec.numberArray(0, sz);
		const capA = symbol[0] ? FAR : CLOSE;
		if (!fractional)
		{
			sx1[0] = x[0] + ox[0] * capA; sy1[0] = y[0] + oy[0] * capA;
			sx2[0] = x[0] - ox[0] * capA; sy2[0] = y[0] - oy[0] * capA;
		}
		else
		{
			const dx = -oy[0], dy = ox[0];
			sx1[0] = x[0] + dx * capA; sy1[0] = y[0] + dy * capA;
			sx2[0] = x[0] + dx * capA; sy2[0] = y[0] + dy * capA;
		}

		let ncross1 = 0, ncross2 = 0;
		for (let n = 1; n < sz - 1; n++)
		{
			const fr1 = symbol[n] ? FAR : CLOSE, fr2 = fr1;
			sx1[n] = x[n] + fr1 * (ox[n - 1] + ox[n]); sy1[n] = y[n] + fr1 * (oy[n - 1] + oy[n]);
			sx2[n] = x[n] - fr2 * (ox[n - 1] + ox[n]); sy2[n] = y[n] - fr2 * (oy[n - 1] + oy[n]);

			// every other bond "crosses" one side or the other
			for (let a of this.mol.atomAdjList(atoms[n])) if (atoms.indexOf(a) < 0 && a != extAtom)
			{
				let pt = this.points[a - 1];
				let dx = pt.oval.cx - x[n], dy = pt.oval.cy - y[n];
				let dot1 = dx * (sx1[n] - x[n]) + dy * (sy1[n] - x[n]);
				let dot2 = dy * (sx2[n] - x[n]) + dy * (sy2[n] - x[n]);
				if (dot1 > dot2) ncross1++; else ncross2++; // higher means that the vectors align, hence this is the crosser
			}
		}

		let nn = sz - 1;
		let capB = symbol[nn] ? FAR : CLOSE;
		if (!fractional)
		{
			sx1[nn] = x[nn] + ox[nn - 1] * capB; sy1[nn] = y[nn] + oy[nn - 1] * capB;
			sx2[nn] = x[nn] - ox[nn - 1] * capB; sy2[nn] = y[nn] - oy[nn - 1] * capB;
		}
		else
		{
			let dx = -oy[nn - 1], dy = ox[nn - 1];
			sx1[nn] = x[nn] - dx * capB; sy1[nn] = y[nn] - dy * capB;
			sx2[nn] = x[nn] - dx * capB; sy2[nn] = y[nn] - dy * capB;
		}

		// come up with a score for each one, and pick the best (shortest with fewest bond crossings)
		let score1 = 0, score2 = 0;
		for (let n = 0; n < sz - 1; n++)
		{
			score1 += norm_xy(sx1[n + 1] - sx1[n], sy1[n + 1] - sy1[n]);
			score2 += norm_xy(sx2[n + 1] - sx2[n], sy2[n + 1] - sy2[n]);
		}
		score1 *= ncross1 + 1;
		score2 *= ncross2 + 1;

		let sx = score1 < score2 ? sx1 : sx2;
		let sy = score1 < score2 ? sy1 : sy2;

		let p:XPath = {'atoms': atoms, 'px': null, 'py': null, 'ctrl': null, 'size': this.lineSizePix};
		this.splineInterpolate(p, sx, sy);
		this.paths.push(p);

		// NOTE: no spacefiller; consider adding one
	}

	// create a bond emerging from an atom to a centroid of multiple atoms
	private createBondCentroid(from:number, to:number[]):void
	{
		let pt = this.points[from - 1];
		let x1 = pt.oval.cx, y1 = pt.oval.cy, x2 = 0, y2 = 0;
		for (let a of to)
		{
			pt = this.points[a - 1];
			x2 += pt.oval.cx;
			y2 += pt.oval.cy;
		}
		x2 /= to.length; y2 /= to.length;

		// if the "centroid" is a point or line, don't want to hit the middle
		if (to.length <= 2)
		{
			x2 -= 0.1 * (x2 - x1);
			y2 -= 0.1 * (y2 - y1);
		}

		const minDist = this.MINBOND_LINE * this.measure.scale();
		let xy1 = this.backOffAtom(from, x1, y1, x2, y2, minDist);
		this.ensureMinimumBondLength(xy1, [x2, y2], x1, y1, x2, y2, minDist);

		let b:BLine =
		{
			'bnum': 0, 'bfr': from, 'bto': 0,
			'type': BLineType.Normal, 'line': new Line(xy1[0], xy1[1], x2, y2),
			'size': this.lineSizePix, 'head': 0, 'col': this.policy.data.foreground
		};
		this.lines.push(b);
		this.space.push(this.computeSpaceLine(b));
	}

	// turns a series of points into a smooth spline
	private splineInterpolate(path:XPath, x:number[], y:number[]):void
	{
		const sz = x.length;
		const scale = 0.25; // empirical
		for (let n = 0; n < sz; n++)
		{
			if (n == 0)
			{
				let dx = x[n + 1] - x[n], dy = y[n + 1] - y[n];
				let qx = x[n] + scale * dx, qy = y[n] + scale * dy;
				path.px = Vec.append(path.px, x[n]); path.py = Vec.append(path.py, y[n]); path.ctrl = Vec.append(path.ctrl, false);
				path.px = Vec.append(path.px, qx); path.py = Vec.append(path.py, qy); path.ctrl = Vec.append(path.ctrl, true);
			}
			else if (n == sz - 1)
			{
				let dx = x[n] - x[n - 1], dy = y[n] - y[n - 1];
				let qx = x[n] - scale * dx, qy = y[n] - scale * dy;
				path.px = Vec.append(path.px, qx); path.py = Vec.append(path.py, qy); path.ctrl = Vec.append(path.ctrl, true);
				path.px = Vec.append(path.px, x[n]); path.py = Vec.append(path.py, y[n]); path.ctrl = Vec.append(path.ctrl, false);
			}
			else
			{
				let dx = x[n + 1] - x[n - 1], dy = y[n + 1] - y[n - 1];
				let invD = invZ(norm_xy(dx, dy));
				dx *= invD; dy *= invD;

				let d1 = scale * norm_xy(x[n] - x[n - 1], y[n] - y[n - 1]), d2 = scale * norm_xy(x[n + 1] - x[n], y[n + 1] - y[n]);
				let qx1 = x[n] - dx * d1, qy1 = y[n] - dy * d1;
				let qx2 = x[n] + dx * d2, qy2 = y[n] + dy * d2;

				path.px = Vec.append(path.px, qx1); path.py = Vec.append(path.py, qy1); path.ctrl = Vec.append(path.ctrl, true);
				path.px = Vec.append(path.px, x[n]); path.py = Vec.append(path.py, y[n]); path.ctrl = Vec.append(path.ctrl, false);
				path.px = Vec.append(path.px, qx2); path.py = Vec.append(path.py, qy2); path.ctrl = Vec.append(path.ctrl, true);
			}
		}
	}

	// create a "delocalised" charge or unpaired state, which hovers in between a sequence of atoms that are resonance related
	private delocalisedAnnotation(atoms:number[], charge:number, unpaired:number):void
	{
		const mol = this.mol;

		let str = '';
		if (charge == -1) str = '-';
		else if (charge == 1) str = '+';
		else if (charge < -1) str = Math.abs(charge) + '-';
		else if (charge > 1) str = charge + '+';
		if (unpaired > 0) for (let n = 0; n < unpaired; n++) str += '.';
		if (str.length == 0) return;

		// find the least congested point; overall average is first
		const sz = atoms.length;
		let bestX = 0, bestY = 0;
		for (let a of atoms) {bestX += mol.atomX(a); bestY += mol.atomY(a);}
		bestX /= sz; bestY /= sz;
		let bestScore = CoordUtil.congestionPoint(mol, bestX, bestY);

		for (let n = 1; n < sz - 1; n++)
		{
			let x = 0.5 * (mol.atomX(atoms[n - 1]) + mol.atomX(atoms[n + 1])), y = 0.5 * (mol.atomY(atoms[n - 1]) + mol.atomY(atoms[n + 1]));
			let score = CoordUtil.congestionPoint(mol, x, y);
			if (score < bestScore) {bestScore = score; bestX = x; bestY = y;}
		}

		let fsz = 0.8 * this.fontSizePix;
		let wad = this.measure.measureText(str, fsz);
		let rw = 0.55 * wad[0], rh = 0.55 * wad[1];

		// create a point for it
		let a:APoint =
		{
			'anum': 0,
			'text': str,
			'fsz': fsz,
			'bold': false,
			'col': this.policy.data.foreground,
			'oval': new Oval(this.measure.angToX(bestX), this.measure.angToY(bestY), rw, rh)
		};
		this.points.push(a);

		// create a square spacefiller
		let spc:SpaceFiller =
		{
			'anum': 0,
			'bnum': 0,
			'box': new Box(a.oval.cx - rw, a.oval.cy - rh, 2 * rw, 2 * rh),
			'px': [a.oval.cx - rw, a.oval.cx + rw, a.oval.cx + rw, a.oval.cx - rw],
			'py': [a.oval.cy - rh, a.oval.cy - rh, a.oval.cy + rh, a.oval.cy + rh]
		};
		this.space.push(spc);
	}
}

/* EOF */ }