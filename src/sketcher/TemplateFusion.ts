/*
    WebMolKit

    (c) 2010-2020 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../data/Molecule.ts'/>
///<reference path='../data/MolUtil.ts'/>
///<reference path='../data/CoordUtil.ts'/>
///<reference path='../data/SketchUtil.ts'/>
///<reference path='../data/Graph.ts'/>
///<reference path='../data/BondArtifact.ts'/>
///<reference path='../sketcher/MoleculeActivity.ts'/>

namespace WebMolKit /* BOF */ {

/*
    Algorithm class that exists for the purpose of generating some number of template-fusion permutations,
	starting with an edit state (molecule,subject) and a template.
*/

export class FusionPermutation
{
	public mol:Molecule; // contains the fused result
	public display:Molecule; // the appended fragment, modified for display
	public molidx:number[]; // atom correspondence between starting molecule (parent.mol) and template (display)
	public temidx:number[];
	public srcidx:number[]; // for each atom in mol, >0=present in original molecule, 0=not so

	public attdist = 0;
	public guided = false;
	public bridged = false;
	public scoreModifier = 0;
	public chainSelect = 0;
}

export class TemplateFusion
{
	public perms:FusionPermutation[] = [];
	public numAttach = 0;
	public withGuideOnly = false;

	private guidetempl:Molecule = null;
	private guideidx:number[] = [];
	private guideadj:number[] = [];

	public TIME_LIMIT = 5.0; // number of seconds after which template fusion should quit with what it has
	public static RESERVED_GUIDESYMBOL = 'XXX';

	// ------------------ public methods --------------------

	constructor(public mol:Molecule, public templ:Molecule, public abbrev:string)
	{
		// renumber any incoming bond artifacts
		let artif1 = new BondArtifact(mol), artif2 = new BondArtifact(templ);
		artif2.harmoniseNumbering(artif1);
		artif2.rewriteMolecule();

		this.huntForGuides();
	}

	// place the template with no reference anchor
	public permuteNone():void
	{
		let numAttach = 0;

		let oldmol = this.mol.clone(), newmol = this.templ.clone();

		if (oldmol.numAtoms > 0)
		{
			let oldbox = oldmol.boundary(), newbox = newmol.boundary();
			let dx = oldbox.maxX() + 1 - newbox.minX();
			let dy = 0.5 * (oldbox.minY() + oldbox.maxY()) - 0.5 * (newbox.minY() + newbox.maxY());
			CoordUtil.translateMolecule(newmol, dx, dy);
		}
		else
		{
			let newbox = newmol.boundary();
			CoordUtil.translateMolecule(newmol, -newbox.midX(), -newbox.midY());
		}

		let oldbox = oldmol.boundary(), newbox = newmol.boundary();
		let cx = newbox.midX(), cy = newbox.midY();
		let ROTN = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
		duplicate: for (let n = 0; n < ROTN.length; n++)
		{
			let rotmol = newmol.clone();
			CoordUtil.rotateMolecule(rotmol, -ROTN[n] * DEGRAD, cx, cy);

			for (let i = 0; i < this.perms.length; i++)
				if (CoordUtil.sketchEquivalent(rotmol, this.perms[i].display)) continue duplicate;

			let p = new FusionPermutation();
			p.mol = oldmol.clone();
			p.mol.append(rotmol);
			p.display = rotmol;
			p.srcidx = this.sourceIndex(p.mol, oldmol);
			p.attdist = 0;
			p.guided = false;
			this.perms.push(p);
		}
	}

	// generate permutations with one atom reference point
	public permuteAtom(atom:number):void
	{
		this.numAttach = 1;

		let timeStart = new Date().getTime();
		let oldmol = this.mol.clone(), newmol = this.templ.clone();
		let newperms:FusionPermutation[] = [];

		if (this.guidetempl != null)
		{
			let fliptempl = this.guidetempl.clone();
			CoordUtil.mirrorImage(fliptempl);

			for (let n = 0; n < this.guideidx.length; n++)
			{
				if (new Date().getTime() - timeStart > this.TIME_LIMIT * 1000) break;

				this.composeGuidedOne(newperms, oldmol, this.guidetempl, atom, this.guideidx[n]);
				this.composeGuidedOne(newperms, oldmol, fliptempl, atom, this.guideidx[n]);
			}
		}

		if (!this.withGuideOnly)
		{
			let flipmol = newmol.clone();
			CoordUtil.mirrorImage(flipmol);

			for (let n = 1; n <= newmol.numAtoms; n++)
			{
				if (new Date().getTime() - timeStart > this.TIME_LIMIT * 1000) break;

				this.composeDirectOne(newperms, oldmol, newmol, atom, n);
				this.composeDirectOne(newperms, oldmol, flipmol, atom, n);

				this.composeBridge(newperms, oldmol, newmol, atom, n);
				this.composeBridge(newperms, oldmol, flipmol, atom, n);
			}
		}

		this.affixRawPermutations(newperms);
	}

	// generate permutations with a bond reference point
	public permuteBond(a1:number, a2:number):void
	{
		this.numAttach = 2;

		let timeStart = new Date().getTime();
		let oldmol = this.mol.clone(), newmol = this.templ.clone();
		let newperms:FusionPermutation[] = [];

		if (this.guidetempl != null)
		{
			let fliptempl = this.guidetempl.clone();
			CoordUtil.mirrorImage(fliptempl);
			for (let i = 0; i < this.guideidx.length; i++)
			{
				if (new Date().getTime() - timeStart > this.TIME_LIMIT * 1000) break;

				let g1 = this.guideidx[i];
				let adj = this.guidetempl.atomAdjList(g1);
				for (let j = 0; j < adj.length; j++)
				{
					let g2 = adj[j];

					this.composeGuidedTwo(newperms, oldmol, this.guidetempl, a1, a2, g1, g2, true);
					this.composeGuidedTwo(newperms, oldmol, this.guidetempl, a2, a1, g1, g2, true);
					this.composeGuidedTwo(newperms, oldmol, fliptempl, a1, a2, g1, g2, true);
					this.composeGuidedTwo(newperms, oldmol, fliptempl, a2, a1, g1, g2, true);

					this.composeGuidedTwo(newperms, oldmol, this.guidetempl, a1, a2, g1, g2, false);
					this.composeGuidedTwo(newperms, oldmol, this.guidetempl, a2, a1, g1, g2, false);
					this.composeGuidedTwo(newperms, oldmol, fliptempl, a1, a2, g1, g2, false);
					this.composeGuidedTwo(newperms, oldmol, fliptempl, a2, a1, g1, g2, false);
				}
			}
		}

		if (!this.withGuideOnly)
		{
			let flipmol = newmol.clone();
			CoordUtil.mirrorImage(flipmol);

			for (let n = 1; n <= newmol.numBonds; n++)
			{
				if (new Date().getTime() - timeStart > this.TIME_LIMIT * 1000) break;

				let nfr = newmol.bondFrom(n), nto = newmol.bondTo(n);
				this.composeDirectTwo(newperms, oldmol, newmol, a1, a2, nfr, nto);
				this.composeDirectTwo(newperms, oldmol, flipmol, a1, a2, nfr, nto);
				this.composeDirectTwo(newperms, oldmol, newmol, a1, a2, nto, nfr);
				this.composeDirectTwo(newperms, oldmol, flipmol, a1, a2, nto, nfr);
			}
		}

		this.affixRawPermutations(newperms);
	}

	// generate permutations with many reference points
	public permuteMulti(atoms:number[]):void
	{
		this.numAttach = atoms.length;

		let timeStart = new Date().getTime();
		let oldmol = this.mol.clone(), newmol = this.templ.clone();
		let newperms:FusionPermutation[] = [];

		if (this.guidetempl != null)
		{
			let fliptempl = this.guidetempl.clone();
			CoordUtil.mirrorImage(fliptempl);

			if (this.guideidx.length == atoms.length)
			{
				this.composeGuidedMulti(newperms, oldmol, this.guidetempl, atoms, this.guideidx, true);
				this.composeGuidedMulti(newperms, oldmol, fliptempl, atoms, this.guideidx, true);
			}
			if (this.guideadj.length == atoms.length)
			{
				this.composeGuidedMulti(newperms, oldmol, this.guidetempl, atoms, this.guideadj, false);
				this.composeGuidedMulti(newperms, oldmol, fliptempl, atoms, this.guideadj, false);
			}
		}

		if (!this.withGuideOnly)
		{
			let flipmol = newmol.clone();
			CoordUtil.mirrorImage(flipmol);

			for (let n = 1; n <= newmol.numAtoms; n++)
			{
				if (new Date().getTime() - timeStart > this.TIME_LIMIT * 1000) break;

				this.composeDirectMulti(newperms, oldmol, newmol, atoms, n);
				this.composeDirectMulti(newperms, oldmol, flipmol, atoms, n);
			}
		}

		this.affixRawPermutations(newperms);
	}

	// ------------------ private methods --------------------

	private huntForGuides():void
	{
		this.guideidx = [];
		this.guideadj = [];
		for (let n = 1; n <= this.templ.numAtoms; n++) if (this.templ.atomElement(n) == 'X' && this.templ.atomAdjCount(n) > 0)
		{
			this.guideidx.push(n);
			let adj = this.templ.atomAdjList(n);
			for (let i = 0; i < adj.length; i++) if (this.guideadj.indexOf(adj[i]) < 0) this.guideadj.push(adj[i]);
		}
		if (this.guideidx.length > 0)
		{
			this.guidetempl = this.templ.clone();
			for (let n = this.guideidx.length - 1; n >= 0; n--) this.templ.deleteAtomAndBonds(this.guideidx[n]);
		}
	}
	private composeDirectOne(list:FusionPermutation[], oldmol:Molecule, newmol:Molecule, o1:number, n1:number)
	{
		let otheta = SketchUtil.primeDirections(oldmol, o1);
		let ntheta = SketchUtil.primeDirections(newmol, n1);
		let ocurrent = CoordUtil.atomBondAngles(oldmol, o1);
		let ncurrent = CoordUtil.atomBondAngles(newmol, n1);

		// create the list of angle matches to try out
		let theta1:number[] = [], theta2:number[] = [], scoreMod:number[] = [];

		for (let i = 0; i < ocurrent.length; i++) for (let j = 0; j < ntheta.length; j++)
		{
			theta1.push(ocurrent[i]);
			theta2.push(ntheta[j]);
			scoreMod.push(-51);
		}
		for (let i = 0; i < otheta.length; i++) for (let j = 0; j < ncurrent.length; j++)
		{
			theta1.push(otheta[i]);
			theta2.push(ncurrent[j]);
			scoreMod.push(0);
		}
		for (let i = 0; i < otheta.length; i++) for (let j = 0; j < ntheta.length; j++)
		{
			theta1.push(otheta[i]);
			theta2.push(ntheta[j]);
			scoreMod.push(0);
		}

		// now combine them
		let bfs = Graph.fromMolecule(newmol).calculateBFS(0);
		let ox = oldmol.atomX(o1), oy = oldmol.atomY(o1), nx = newmol.atomX(n1), ny = newmol.atomY(n1);
		for (let n = 0; n < theta1.length; n++)
		{
			let dth = angleDiff(theta1[n], theta2[n]);
			let frag = newmol.clone();
			CoordUtil.translateMolecule(frag, ox - nx, oy - ny);
			CoordUtil.rotateMolecule(frag, dth, ox, oy);

			let pmol = oldmol.clone();
			let osz = pmol.numAtoms;
			pmol.append(frag);
			let srcidx = this.sourceIndex(pmol, oldmol);
			SketchUtil.mergeFragmentsMask(pmol, this.asMask(srcidx));

			if (pmol.numAtoms == osz) continue;

			let p = new FusionPermutation();
			p.mol = pmol;
			p.display = frag;
			p.srcidx = srcidx;
			p.molidx = [o1];
			p.temidx = [n1];
			p.attdist = bfs[n1 - 1];
			p.guided = false;
			p.scoreModifier = scoreMod[n];
			this.removeExtraGuides(p, oldmol);
			list.push(p);
		}
	}
	private composeDirectTwo(list:FusionPermutation[], oldmol:Molecule, newmol:Molecule, o1:number, o2:number, n1:number, n2:number):void
	{
		let oth = Math.atan2(oldmol.atomY(o2) - oldmol.atomY(o1), oldmol.atomX(o2) - oldmol.atomX(o1));
		let nth = Math.atan2(newmol.atomY(n2) - newmol.atomY(n1), newmol.atomX(n2) - newmol.atomX(n1));
		let cx = 0.5 * (oldmol.atomX(o1) + oldmol.atomX(o2)), cy = 0.5 * (oldmol.atomY(o1) + oldmol.atomY(o2));

		let frag = newmol.clone();
		CoordUtil.translateMolecule(frag, cx - 0.5 * (newmol.atomX(n1) + newmol.atomX(n2)), cy - 0.5 * (newmol.atomY(n1) + newmol.atomY(n2)));
		CoordUtil.rotateMolecule(frag, oth - nth, cx, cy);
		frag.setAtomPos(n1, oldmol.atomX(o1), oldmol.atomY(o1));
		frag.setAtomPos(n2, oldmol.atomX(o2), oldmol.atomY(o2));

		let pmol = oldmol.clone();
		let osz = pmol.numAtoms;
		pmol.append(frag);
		let srcidx = this.sourceIndex(pmol, oldmol);
		SketchUtil.mergeFragmentsMask(pmol, this.asMask(srcidx));

		if (pmol.numAtoms == osz) return;

		let bfs = Graph.fromMolecule(newmol).calculateBFS(0);

		let p = new FusionPermutation();
		p.mol = pmol;
		p.display = frag;
		p.srcidx = srcidx;
		p.molidx = [o1, o2];
		p.temidx = [n1, n2];
		p.attdist = Math.min(bfs[n1 - 1], bfs[n2 - 1]);
		p.guided = false;
		this.removeExtraGuides(p, oldmol);
		list.push(p);
	}
	private composeDirectMulti(list:FusionPermutation[], oldmol:Molecule, newmol:Molecule, oidx:number[], n1:number):void
	{
		let frag = newmol.clone();

		let x0 = oldmol.atomX(oidx[0]), y0 = oldmol.atomY(oidx[0]);
		CoordUtil.translateMolecule(frag, x0 - frag.atomX(n1), y0 - frag.atomY(n1));
		let ox = oldmol.atomX(oidx[1]) - x0, oy = oldmol.atomY(oidx[1]) - y0;
		let otheta = Math.atan2(oy, ox), orad = norm_xy(ox, oy);

		let bfs = Graph.fromMolecule(newmol).calculateBFS(1);
		let nidx:number[] = [];

		for (let n2 = 1; n2 <= frag.numAtoms; n2++) if (n1 != n2)
		{
			let nx = frag.atomX(n2) - frag.atomX(n1), ny = frag.atomY(n2) - frag.atomY(n1), nrad = norm_xy(nx, ny);
			if (Math.abs(nrad - orad) > 0.1) continue; // no point in trying to map {o1,o2} to {n1,n2}
			let ntheta = Math.atan2(ny, nx);
			CoordUtil.rotateMolecule(frag, otheta - ntheta, x0, y0);

			nidx = [n1, n2];

			for (let i = 2; i < oidx.length; i++)
			{
				let hit = false;
				for (let j = 1; j <= frag.numAtoms; j++) if (nidx.indexOf(j) < 0)
					if (norm_xy(oldmol.atomX(oidx[i]) - frag.atomX(j), oldmol.atomY(oidx[i]) - frag.atomY(j)) < 0.1 * 0.1)
				{
					hit = true;
					nidx.push(j);
					break;
				}
				if (!hit) break;
			}

			if (nidx.length < oidx.length) continue;

			let lowbfs = bfs.length;
			for (let n = 0; n < nidx.length; n++) lowbfs = Math.min(lowbfs, bfs[nidx[n] - 1]);

			let dx = 0, dy = 0;
			for (let n = 0; n < oidx.length; n++)
			{
				dx += oldmol.atomX(oidx[n]) - frag.atomX(nidx[n]);
				dy += oldmol.atomY(oidx[n]) - frag.atomY(nidx[n]);
			}
			let invsz = 1.0 / oidx.length;
			dx *= invsz;
			dy *= invsz;
			CoordUtil.translateMolecule(frag, dx, dy);

			let pmol = oldmol.clone();
			let osz = pmol.numAtoms;
			pmol.append(frag);
			let srcidx = this.sourceIndex(pmol, oldmol);

			for (let n = 0; n < nidx.length; n++)
			{
				let x = pmol.atomX(oidx[n]), y = pmol.atomY(oidx[n]);
				pmol.setAtomPos(osz + nidx[n], x, y);
			}
			SketchUtil.mergeFragmentsMask(pmol, this.asMask(srcidx));
			if (pmol.numAtoms == osz) continue;

			let p = new FusionPermutation();
			p.mol = pmol;
			p.display = frag.clone();
			p.srcidx = srcidx;
			p.molidx = oidx.slice(0);
			p.temidx = nidx.slice(0);
			p.attdist = Math.min(bfs[n1 - 1], bfs[n2 - 1]);
			p.guided = false;
			this.removeExtraGuides(p, oldmol);
			list.push(p);
		}
	}
	private composeBridge(list:FusionPermutation[], oldmol:Molecule, newmol:Molecule, o1:number, n1:number):void
	{
		let busy1 = oldmol.atomRingBlock(o1) != 0 || oldmol.atomAdjCount(o1) >= 3;
		let busy2 = newmol.atomRingBlock(n1) != 0 || newmol.atomAdjCount(n1) >= 3;
		if (!busy1 || !busy2) return;

		let otheta = SketchUtil.primeDirections(oldmol, o1);
		let ntheta = SketchUtil.primeDirections(newmol, n1);

		let bfs = Graph.fromMolecule(newmol).calculateBFS(0);

		for (let i = 0; i < otheta.length; i++) for (let j = 0; j < ntheta.length; j++)
		{
			let ox = oldmol.atomX(o1), oy = oldmol.atomY(o1), nx = newmol.atomX(n1), ny = newmol.atomY(n1);
			let dx = Molecule.IDEALBOND * Math.cos(otheta[i]), dy = Molecule.IDEALBOND * Math.sin(otheta[i]);
			let dth = angleDiff(otheta[i], Math.PI + ntheta[j]);
			let frag = newmol.clone();

			CoordUtil.translateMolecule(frag, ox - nx + dx, oy - ny + dy);
			CoordUtil.rotateMolecule(frag, dth, ox + dx, oy + dy);
			let pmol = oldmol.clone();

			let att = pmol.numAtoms + n1, osz = pmol.numAtoms;
			pmol.append(frag);
			let srcidx = this.sourceIndex(pmol, oldmol);
			pmol.addBond(o1, att, 1);

			att = frag.addAtom('C', ox, oy);
			frag.addBond(n1, att, 1);

			SketchUtil.mergeFragmentsMask(pmol, this.asMask(srcidx));
			if (pmol.numAtoms == osz) continue;

			let p = new FusionPermutation();
			p.mol = pmol;
			p.display = frag;
			p.srcidx = srcidx;
			p.molidx = [o1];
			p.temidx = [att];
			p.attdist = bfs[n1 - 1];
			p.bridged = true;
			p.guided = false;
			this.removeExtraGuides(p, oldmol);
			list.push(p);
		}
	}
	private composeGuidedOne(list:FusionPermutation[], oldmol:Molecule, newmol:Molecule, oidx:number, gidx:number):void
	{
		if (newmol.atomAdjCount(gidx) == 0) return;

		let otheta = SketchUtil.primeDirections(oldmol, oidx);

		// special deal: if the attachment is multidentate, make sure there is an out-jutting angle that is the simple average of the other
		// constituents' opposites, since regular bond angles are less definitively useful
		if (newmol.atomAdjCount(gidx) > 1 && oldmol.atomAdjCount(oidx) > 0)
		{
			let ox = 0, oy = 0;
			let adj = oldmol.atomAdjList(oidx);
			for (let n = 0; n < adj.length; n++)
			{
				ox += oldmol.atomX(adj[n]) - oldmol.atomX(oidx);
				oy += oldmol.atomY(adj[n]) - oldmol.atomY(oidx);
			}
			let ang = Math.atan2(oy, ox);
			let unique = true;
			for (let n = 0; n < otheta.length; n++) if (Math.abs(angleDiff(ang, otheta[n])) < 3 * RADDEG)
			{
				unique = false;
				break;
			}
			if (unique) otheta.push(ang);
		}

		let gx = newmol.atomX(gidx), gy = newmol.atomY(gidx);
		let dx = 0, dy = 0;
		let adj = newmol.atomAdjList(gidx);
		for (let n = 0; n < adj.length; n++)
		{
			dx += newmol.atomX(adj[n]) - gx;
			dy += newmol.atomY(adj[n]) - gy;
		}
		dx /= adj.length;
		dy /= adj.length;
		let ntheta = Math.atan2(dy, dx);

		let homoPenalty = 0;
		if (adj.length == 1)
		{
			let oel = oldmol.atomElement(oidx), nel = newmol.atomElement(adj[0]);
			if (oel != 'C' && oel == nel) homoPenalty = 1; // penalty points for het-het joining
		}

		for (let n = 0; n < otheta.length; n++)
		{
			let frag = newmol.clone();

			// special deal: if two guide indexes, would like to post-select the second one
			if (this.guideidx.length == 2)
			{
				for (let i = 1; i <= frag.numAtoms; i++) if (i != gidx && frag.atomElement(i) == 'X')
				{
					frag.setAtomElement(i, TemplateFusion.RESERVED_GUIDESYMBOL);
					break;
				}
			}

			CoordUtil.rotateMolecule(frag, otheta[n] - ntheta, gx, gy);
			CoordUtil.translateMolecule(frag, oldmol.atomX(oidx) - gx, oldmol.atomY(oidx) - gy);

			let pmol = oldmol.clone();
			let osz = pmol.numAtoms;
			pmol.append(frag);
			let srcidx = this.sourceIndex(pmol, oldmol);
			SketchUtil.mergeFragmentsMask(pmol, this.asMask(srcidx));
			if (pmol.numAtoms == osz) continue;

			// look for a next-current option
			let sel = 0;
			for (let i = 1; i <= pmol.numAtoms; i++) if (pmol.atomElement(i) == TemplateFusion.RESERVED_GUIDESYMBOL)
			{
				let padj = pmol.atomAdjList(i);
				if (padj.length == 1)
				{
					sel = padj[0];
					if (sel > i) sel--;
				}
				pmol.deleteAtomAndBonds(i);
				srcidx.splice(i - 1, 1);
				break;
			}

			let p = new FusionPermutation();
			p.mol = pmol;
			p.display = frag;
			p.srcidx = srcidx;
			p.molidx = [oidx];
			p.temidx = [gidx];
			p.attdist = 0;
			p.guided = true;
			p.scoreModifier = homoPenalty;
			p.chainSelect = sel;
			this.removeExtraGuides(p, oldmol);
			list.push(p);
		}
	}
	private composeGuidedTwo(list:FusionPermutation[], oldmol:Molecule, newmol:Molecule,
							o1:number, o2:number, gidx:number, nidx:number, snapToGuide:boolean):void
	{
		let ox = oldmol.atomX(o1), oy = oldmol.atomY(o1);
		let gx = newmol.atomX(gidx), gy = newmol.atomY(gidx);
		let nx = newmol.atomX(nidx), ny = newmol.atomY(nidx);
		let otheta = Math.atan2(oldmol.atomY(o2) - oy, oldmol.atomX(o2) - ox);
		let gtheta = Math.atan2(ny - gy, nx - gx);

		let isGuideOnTerminal = oldmol.atomAdjCount(o1) == 1; // prefer to stick the guide atom on a non-terminal atom

		let pmol = oldmol.clone(), frag = newmol.clone();
		CoordUtil.rotateMolecule(frag, otheta - gtheta, gx, gy);

		if (snapToGuide)
		{
			CoordUtil.translateMolecule(frag, ox - gx, oy - gy);
			pmol.setAtomPos(o2, frag.atomX(nidx), frag.atomY(nidx));
		}
		else
		{
			CoordUtil.translateMolecule(frag, oldmol.atomX(o2) - frag.atomX(nidx), oldmol.atomY(o2) - frag.atomY(nidx));
			frag.setAtomPos(gidx, ox, oy);
		}

		let osz = pmol.numAtoms;
		pmol.append(frag);
		let srcidx = this.sourceIndex(pmol, oldmol);
		SketchUtil.mergeFragmentsMask(pmol, this.asMask(srcidx));
		if (pmol.numAtoms == osz) return;

		let p = new FusionPermutation();
		p.mol = pmol;
		p.display = frag;
		p.srcidx = srcidx;
		p.molidx = [o1, o2];
		p.temidx = [gidx, nidx];
		p.attdist = isGuideOnTerminal ? 1 : 0;
		p.guided = true;
		this.removeExtraGuides(p, oldmol);
		list.push(p);
	}
	private composeGuidedMulti(list:FusionPermutation[], oldmol:Molecule, newmol:Molecule, oidx:number[], gidx:number[], nudgenew:boolean):void
	{
		let cx1 = 0, cy1 = 0, cx2 = 0, cy2 = 0;
		for (let n = 0; n < oidx.length; n++)
		{
			cx1 += oldmol.atomX(oidx[n]);
			cy1 += oldmol.atomY(oidx[n]);
		}
		for (let n = 0; n < gidx.length; n++)
		{
			cx2 += newmol.atomX(gidx[n]);
			cy2 += newmol.atomY(gidx[n]);
		}
		cx1 /= oidx.length;
		cy1 /= oidx.length;
		cx2 /= gidx.length;
		cy2 /= gidx.length;

		let osz = oldmol.numAtoms;

		for (let i = 0; i < oidx.length; i++) for (let j = 0; j < gidx.length; j++)
		{
			let pmol = oldmol.clone(), frag = newmol.clone();
			let th1 = Math.atan2(pmol.atomY(oidx[i]) - cy1, pmol.atomX(oidx[i]) - cx1);
			let th2 = Math.atan2(frag.atomY(gidx[j]) - cy2, frag.atomX(gidx[j]) - cx2);
			CoordUtil.rotateMolecule(frag, th1 - th2, cx2, cy2);
			CoordUtil.translateMolecule(frag, cx1 - cx2, cy1 - cy2);
			pmol.append(frag);

			let srcidx = this.sourceIndex(pmol, oldmol);
			let midx = Vec.numberArray(0, gidx.length), tidx = gidx.slice(0);
			Vec.sort(tidx);
			let mask = Vec.booleanArray(false, osz);

			for (let g = tidx.length - 1; g >= 0; g--)
			{
				let gatom = tidx[g] + osz;
				let closest = 0, closeDSQ = 0;
				for (let n = 0; n < oidx.length; n++) if (!mask[oidx[n] - 1])
				{
					let dx = pmol.atomX(oidx[n]) - pmol.atomX(gatom), dy = pmol.atomY(oidx[n]) - pmol.atomY(gatom);
					let dsq = norm_xy(dx, dy);
					if (closest == 0 || dsq < closeDSQ)
					{
						closest = oidx[n];
						closeDSQ = dsq;
					}
				}

				if (!nudgenew)
				{
					let dsq = norm_xy(pmol.atomX(gatom) - pmol.atomX(closest), pmol.atomY(gatom) - pmol.atomY(closest));
					if (dsq > 0.1 * 0.1)
					{
						let num = frag.addAtom('C', pmol.atomX(closest), pmol.atomY(closest));
						frag.addBond(num, tidx[g], 0);
					}

					pmol.setAtomPos(closest, pmol.atomX(gatom), pmol.atomY(gatom));
				}

				midx[g] = closest;
				mask[closest - 1] = true;
				let adj = pmol.atomAdjList(gatom);
				for (let n = 0; n < adj.length; n++)
				{
					let b = pmol.findBond(gatom, adj[n]);
					pmol.addBond(closest, adj[n], pmol.bondOrder(b), pmol.bondType(b));
				}
				pmol.deleteAtomAndBonds(gatom);
				srcidx.splice(gatom - 1, 1);

				frag.setAtomPos(tidx[g], pmol.atomX(closest), pmol.atomY(closest));
			}

			for (let n = pmol.numAtoms; n > osz; n--) if (pmol.atomElement(n) == 'X')
			{
				pmol.deleteAtomAndBonds(n);
				srcidx.splice(n - 1, 1);
				for (let k = 0; k < tidx.length; k++) if (n < tidx[k]) tidx[k]--;
			}
			for (let n = frag.numAtoms; n >= 1; n--) if (frag.atomElement(n) == 'X')
			{
				//[frag deleteAtomAndBonds:n];
				frag.setAtomElement(n, 'C');
			}

			let p = new FusionPermutation();
			p.mol = pmol;
			p.display = frag;
			p.srcidx = srcidx;
			p.molidx = midx;
			p.temidx = tidx;
			p.attdist = 0;
			p.guided = true;
			this.removeExtraGuides(p, oldmol);
			list.push(p);
		}
	}

	// add specified permutations to the main list, after filtering and sorting
	private affixRawPermutations(list:FusionPermutation[]):void
	{
		let npsz = list.length;
		if (npsz == 0) return;

		let umask = Vec.booleanArray(true, npsz);
		for (let i = 0; i < npsz - 1; i++) if (umask[i])
		{
			let p1 = list[i];
			for (let j = i + 1; j < npsz; j++) if (umask[j])
			{
				let p2 = list[j];
				if (CoordUtil.sketchEquivalent(p1.mol, p2.mol))
				{
					if (p1.scoreModifier + p1.attdist > p2.scoreModifier + p2.attdist)
					{
						list[i] = p2;
						list[j] = p1;
					}
					umask[j] = false;
				}
			}
		}

		let score = Vec.numberArray(0, npsz);
		let numKeep = 0;
		for (let n = 0; n < npsz; n++)
		{
			if (umask[n])
			{
				score[n] = this.scorePermutation(list[n]);
				if (score[n] < 1000) numKeep++;
			}
			else score[n] = 0;
		}

		if (numKeep > 0) for (let n = 0; n < npsz; n++) if (umask[n] && score[n] >= 1000) umask[n] = false;

		let uscore:number[] = [], uidx:number[] = [];
		for (let n = 0; n < npsz; n++) if (umask[n])
		{
			uscore.push(score[n]);
			uidx.push(n);
		}
		let sidx = Vec.idxSort(uscore);

		for (let n = 0; n < sidx.length; n++)
		{
			let p = list[uidx[sidx[n]]];
			if (p.guided)
			{
				this.perms.push(p);
				//if (DEBUG) Util.writeln("PERM#" + perms.size() + " score=" + score[uidx.get(sidx[n])] + " scoremod=" + p.scoreModifier + " attdist:" + p.attdist);
			}
		}
		for (let n = 0; n < sidx.length; n++)
		{
			let p = list[uidx[sidx[n]]];
			if (!p.guided)
			{
				this.perms.push(p);
				//if (DEBUG) Util.writeln("PERM#" + perms.size() + " score=" + score[uidx.get(sidx[n])] + " scoremod=" + p.scoreModifier + " attdist:" + p.attdist);
			}
		}
	}

	private removeExtraGuides(perm:FusionPermutation, oldmol:Molecule):void
	{
		MolUtil.removeDuplicateBonds(perm.mol);
		for (let n = perm.temidx.length - 1; n >= 0; n--)
		{
			let el = perm.display.atomElement(perm.temidx[n]);
			if (el != 'X' && el != TemplateFusion.RESERVED_GUIDESYMBOL) continue;
			perm.molidx.splice(n, 1);
			perm.temidx.splice(n, 1);
		}

		// residual guide atoms either get axed or turned into carbons, so they just display as projected lines
		for (let n = perm.display.numAtoms; n >= 1; n--)
		{
			let el = perm.display.atomElement(n);
			if (el != 'X' && el != TemplateFusion.RESERVED_GUIDESYMBOL) continue;

			let a = CoordUtil.atomAtPoint(oldmol, perm.display.atomX(n), perm.display.atomY(n));
			if (a > 0) perm.display.setAtomElement(n, 'C');
			else
			{
				perm.display.deleteAtomAndBonds(n);
				for (let i = 0; i < perm.temidx.length; i++) if (perm.temidx[i] > n) perm.temidx[i]--;
			}
		}
	}

	private scorePermutation(perm:FusionPermutation):number
	{
		// note: lower is better

		let mol = this.mol, tmol = perm.display, tunion = perm.mol; // (clarity)

		let score = 0.2 * perm.attdist + perm.scoreModifier;

		score += CoordUtil.congestionMolecule(tunion, 1e-3);
		score -= tunion.numAtoms;

		let sz1 = mol.numAtoms, sz2 = tmol.numAtoms;
		let mx1:number[] = [], my1:number[] = [], mx2:number[] = [], my2:number[] = [];
		for (let n = 0; n < sz1; n++)
		{
			mx1.push(mol.atomX(n + 1));
			my1.push(mol.atomY(n + 1));
		}
		for (let n = 0; n < sz2; n++)
		{
			mx2.push(tmol.atomX(n + 1));
			my2.push(tmol.atomY(n + 1));
		}

		for (let i = 0; i < sz1; i++) for (let j = 0; j < sz2; j++)
		{
			if (norm_xy(mx1[i] - mx2[j], my1[i] - my2[j]) > CoordUtil.OVERLAP_THRESHOLD_SQ) continue;
			let contained = false;
			for (let k = 0; k < perm.molidx.length; k++) if (perm.molidx[k] == i + 1 && perm.temidx[k] == j + 1)
			{
				contained = true;
				break;
			}
			if (contained) continue;

			score += 100;
		}

		// look for new geometries which would be a bit too funky; do not apply to guided atom fusions
		if (!perm.guided) for (let n = 0; n < perm.molidx.length; n++)
		{
			let el = mol.atomElement(perm.molidx[n]);
			if (el == 'C' || el == 'O' || el == 'S' || el == 'N' || el == 'P') continue;

			let adj1 = mol.atomAdjList(perm.molidx[n]), adj2 = tmol.atomAdjList(perm.temidx[n]);
			if (adj1.length + adj2.length >= 4) continue;

			for (let i = 0; i < adj1.length; i++) for (let j = 0; j < adj2.length; j++)
			{
				let ai = adj1[i], aj = adj2[j];
				let bo1 = mol.bondOrder(mol.findBond(perm.molidx[n], ai));
				let bo2 = tmol.bondOrder(tmol.findBond(perm.temidx[n], aj));

				let wantTheta = 0;
				if ((bo1 == 1 && bo2 == 1) || (bo1 == 1 && bo2 == 2) || (bo1 == 2 && bo2 == 1)) wantTheta = 120;
				else if ((bo1 == 2 && bo2 == 2) || (bo1 == 1 && bo2 == 3) || (bo1 == 3 && bo2 == 1)) wantTheta = 180;
				else continue;

				let dx1 = mx1[ai - 1] - mx1[perm.molidx[n] - 1];
				let dy1 = my1[ai - 1] - my1[perm.molidx[n] - 1];
				let dx2 = mx2[aj - 1] - mx2[perm.temidx[n] - 1];
				let dy2 = my2[aj - 1] - my2[perm.temidx[n] - 1];
				let theta = Math.abs(angleDiff(Math.atan2(dy1, dx1), Math.atan2(dy2, dx2))) * RADDEG;
				if (Math.abs(theta - wantTheta) > 5) score += 50; // penalty
			}
		}

		// look for creation of hypervalent lighter atoms, which is considered a big faux pas
		for (let n = 1; n <= tunion.numAtoms; n++) if (tunion.atomElement(n) == 'C' || tunion.atomElement(n) == 'N')
		{
			let adjb = tunion.atomAdjBonds(n);
			let totalBO = 0;
			for (let i = 0; i < adjb.length; i++)
			{
				let bo = tunion.bondOrder(adjb[i]);
				totalBO += bo;
				if (bo == 0)
				{
					totalBO = 0;
					break;
				} // any of these, nothing matters anymore
			}
			if (totalBO > 4) score += 1000;
		}

		// match bond orders, whenever possible
		if (perm.molidx.length >= 2)
		{
			let mmask = Vec.booleanArray(false, sz1);
			for (let n = 0; n < perm.molidx.length; n++) mmask[perm.molidx[n] - 1] = true;
			for (let n = 1; n <= mol.numBonds; n++)
			{
				let bfr = mol.bondFrom(n), bto = mol.bondTo(n);
				if (!mmask[bfr - 1] || !mmask[bto - 1]) continue;
				let tfr = perm.molidx.indexOf(bfr), tto = perm.molidx.indexOf(bto);
				let tn = tmol.findBond(perm.temidx[tfr], perm.temidx[tto]);
				if (tn == 0) continue;
				if (mol.bondOrder(n) != tmol.bondOrder(tn)) score += 1;
			}
		}

		return score;
	}

	private sourceIndex(xmol:Molecule, wmol:Molecule):number[]
	{
		let idx = Vec.numberArray(0, xmol.numAtoms);
		for (let n = wmol.numAtoms; n >= 1; n--) idx[n - 1] = n;
		return idx;
	}
	private asMask(imask:number[]):boolean[]
	{
		let ret = Vec.booleanArray(false, imask.length);
		for (let n = 0; n < imask.length; n++) ret[n] = imask[n] != 0;
		return ret;
	}
}

/* EOF */ }