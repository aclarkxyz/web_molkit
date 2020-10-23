/*
    WebMolKit

    (c) 2010-2020 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	Given a metal centre, and some number of atoms that are (or should be) connected to the metal, finds an aesthetically acceptable arrangement. It
	assumes that the ligands themselves are arranged and only need to be oriented. If there are metal-bonded atoms that are not listed in the parameter,
	these will be treated as fixed obstacles.
*/

interface Ligand
{
	atoms:number[]; // all atoms of the ligand
	attach:number[]; // attachment points to the metal
	avgTheta?:number; // average extension of the ligand attachment point(s)
}

export class MetalLigate
{
	private mol:Molecule;
	private ligands:Ligand[] = [];

	// ----------------- public methods -----------------

	constructor(mol:Molecule, private metalAtom:number, private ligandAttach:number[])
	{
		this.mol = mol.clone();
	}

	// creates enough fragments to cover all of the incoming atoms; throws a DepictorFaultException if anything goes wrong
	public generate():Molecule
	{
		const {mol, metalAtom, ligandAttach, ligands} = this;

		let g = Graph.fromMolecule(mol);
		g.isolateNode(metalAtom - 1);
		for (let cc of g.calculateComponentGroups())
		{
			Vec.addTo(cc, 1);
			let anything = false;
			for (let a of ligandAttach) if (cc.indexOf(a) >= 0) {anything = true; break;}
			if (!anything) continue;

			let lig:Ligand = {'atoms': cc, 'attach': []};
			lig.atoms = cc;
			let anyAttached = false;
			for (let a of lig.atoms) if (mol.findBond(a, metalAtom) > 0) {anyAttached = true; break;}
			for (let a of lig.atoms)
			{
				let bonded = mol.findBond(a, metalAtom) > 0;
				if (bonded || (!anyAttached && ligandAttach.includes(a))) lig.attach.push(a);
			}
			ligands.push(lig);

			for (let a of lig.attach) if (mol.findBond(a, metalAtom) == 0) this.makeLigandBond(a);
		}

		if (ligands.length == 0) throw new Error('No ligand atoms');

		// figure out angular projections for ligands (both fixed and motile)

		let otherLigands = mol.atomAdjList(metalAtom);
		for (let lig of ligands) otherLigands = Vec.exclude(otherLigands, lig.attach);

		let mx = mol.atomX(metalAtom), my = mol.atomY(metalAtom);

		let otherTheta:number[] = new Array(otherLigands.length);
		for (let n = 0; n < otherLigands.length; n++) otherTheta[n] = Math.atan2(mol.atomY(otherLigands[n]) - my, mol.atomX(otherLigands[n]) - mx);

		for (let lig of ligands)
		{
			if (lig.attach.length == 1)
			{
				let a = lig.attach[0];
				lig.avgTheta = Math.atan2(mol.atomY(a) - my, mol.atomX(a) - mx);
				this.orientLigand(lig);
			}
			else
			{
				// figure out the average, without recursion errors
				let theta:number[] = new Array(lig.attach.length);
				for (let n = 0; n < lig.attach.length; n++)
				{
					let a = lig.attach[n];
					theta[n] = Math.atan2(mol.atomY(a) - my, mol.atomX(a) - mx);
				}
				theta = GeomUtil.sortAngles(theta);
				let base = theta[0];
				for (let n = 0; n < theta.length; n++) theta[n] = angleDiffPos(theta[n], base);
				lig.avgTheta = base + Vec.sum(theta) / theta.length;

				this.orientLigand(lig);
			}
		}

		// overall cases: arrange around as many fixed references as necessary

		if (otherLigands.length == 0)
		{
			ligands.sort((l1, l2) => signum(l1.avgTheta - l2.avgTheta));
			this.arrangeLigandsFree(ligands);
		}
		else if (otherLigands.length == 1)
		{
			ligands.sort((l1, l2) =>
			{
				let diff1 = angleDiffPos(l1.avgTheta, otherTheta[0]);
				let diff2 = angleDiffPos(l2.avgTheta, otherTheta[0]);
				return signum(diff1 - diff2);
			});
			this.arrangeLigandsRange(ligands, otherTheta[0], TWOPI, true);
		}
		else
		{
			let otherOrder = Vec.idxSort(otherTheta);
			for (let n = 0; n < otherOrder.length; n++)
			{
				let nn = (n + 1) % otherOrder.length;
				let theta = otherTheta[otherOrder[n]];
				let extent = angleDiffPos(otherTheta[otherOrder[nn]], theta);

				let batch:Ligand[] = [];
				for (let lig of ligands)
				{
					let diff = angleDiffPos(lig.avgTheta, theta);
					if (diff < extent) batch.push(lig);
				}
				if (batch.length == 0) continue;
				batch.sort((l1, l2) =>
				{
					let diff1 = angleDiffPos(l1.avgTheta, theta);
					let diff2 = angleDiffPos(l2.avgTheta, theta);
					return signum(diff1 - diff2);
				});
				this.arrangeLigandsRange(batch, theta, extent, true);
			}
		}

		this.resolveClashes();

		return mol;
	}

	// ----------------- private methods -----------------

	// make ligand atom bonded to metal; pick a reasonable bond order
	private makeLigandBond(ligAtom:number):void
	{
		const {mol, metalAtom} = this;

		let mchg = mol.atomCharge(metalAtom), lchg = mol.atomCharge(ligAtom);
		if (mchg > 0 && lchg < 0)
		{
			mol.setAtomCharge(metalAtom, mchg - 1);
			mol.setAtomCharge(ligAtom, lchg + 1);
			mol.addBond(metalAtom, ligAtom, 1);
			return;
		}
		if (mchg < 0 && lchg > 0)
		{
			mol.setAtomCharge(metalAtom, mchg + 1);
			mol.setAtomCharge(ligAtom, lchg - 1);
			mol.addBond(metalAtom, ligAtom, 1);
			return;
		}

		let order = 0;
		if (mol.atomHExplicit(ligAtom) == Molecule.HEXPLICIT_UNKNOWN && mol.atomHydrogens(ligAtom) > 0) order = 1;
		mol.addBond(metalAtom, ligAtom, order);
	}

	// assuming multiple attachment points, orient the ligand so that each of its attachment points are equidistant from the metal, using the average
	// theta value as the guideline
	private orientLigand(lig:Ligand):void
	{
		const {mol, metalAtom} = this;

		let mx = mol.atomX(metalAtom), my = mol.atomY(metalAtom);

		let lsz = lig.atoms.length, asz = lig.attach.length;
		let idxAttach:number[] = new Array(asz);
		for (let n = 0; n < asz; n++) idxAttach[n] = lig.atoms.indexOf(lig.attach[n]);

		// step 1: extend the ligand out along its axis, so the bonds are long
		let lx:number[] = new Array(lsz), ly:number[] = new Array(lsz);
		let ax = MolUtil.arrayAtomX(mol), ay = MolUtil.arrayAtomY(mol);
		let molExtent = Vec.max(ax) - Vec.min(ax) + Vec.max(ay) - Vec.min(ay);
		let dx = molExtent * Math.cos(lig.avgTheta), dy = molExtent * Math.sin(lig.avgTheta);
		for (let n = 0; n < lsz; n++)
		{
			lx[n] = mol.atomX(lig.atoms[n]) + dx;
			ly[n] = mol.atomY(lig.atoms[n]) + dy;
		}

		// step 2: rotate in increments to get approximately the best orientation, in order to find the preferred ordering
		let cx = Vec.sum(lx) / lsz, cy = Vec.sum(ly) / lsz;
		let weight:number[] = [];
		for (let n = 0; n < lsz; n++)
		{
			let closest = Number.POSITIVE_INFINITY;
			for (let idx of idxAttach) closest = Math.min(closest, norm2_xy(lx[n] - lx[idx], ly[n] - ly[idx]));
			weight.push(1.0 / (1 + Math.sqrt(closest)));
		}
		let bestScore = Number.POSITIVE_INFINITY;
		let bestLX:number[] = null, bestLY:number[] = null;
		for (let theta = 0; theta < 360; theta += 15)
		{
			let cosTheta = Math.cos(theta * DEGRAD), sinTheta = Math.sin(theta * DEGRAD);
			let rx:number[] = new Array(lsz), ry:number[] = new Array(lsz);
			let score = 0;
			for (let n = 0; n < lsz; n++)
			{
				let x = lx[n] - cx, y = ly[n] - cy;
				rx[n] = cx + x * cosTheta - y * sinTheta;
				ry[n] = cy + x * sinTheta + y * cosTheta;
				let dist = norm_xy(rx[n] - mx, ry[n] - my);
				if (lig.attach.indexOf(lig.atoms[n]) >= 0) score += dist; else score -= dist * weight[n];
			}
			if (score < bestScore)
			{
				bestScore = score;
				bestLX = rx;
				bestLY = ry;
			}
		}
		lx = bestLX;
		ly = bestLY;

		if (asz == 1)
		{
			// shrink the bond length back down to normal
			dx = Molecule.IDEALBOND * Math.cos(lig.avgTheta);
			dy = Molecule.IDEALBOND * Math.sin(lig.avgTheta);
			Vec.addTo(lx, mx + dx - lx[idxAttach[0]]);
			Vec.addTo(ly, my + dy - ly[idxAttach[0]]);
		}
		else
		{
			// step 3: get an ordering of the attachment angles
			let attTheta:number[] = new Array(asz), attDist = Vec.numberArray(0, asz), attDX = Vec.numberArray(0, asz), attDY = Vec.numberArray(0, asz);
			for (let n = 0; n < asz; n++)
			{
				let ox = lx[idxAttach[n]] - mx, oy = ly[idxAttach[n]] - my;
				attTheta[n] = Math.atan2(oy, ox);
				if (asz > 2)
				{
					attDist[n] = norm_xy(ox, oy);
					attDX[n] = ox / attDist[n];
					attDY[n] = oy / attDist[n];
				}
			}
			Vec.addTo(attDist, -Vec.min(attDist));
			let orderAttach = GeomUtil.idxSortAngles(attTheta);

			// step 4: get a mapping onto desired coords, and run with it
			let srcX:number[] = new Array(asz), srcY:number[] = new Array(asz);
			let dstX:number[] = new Array(asz), dstY:number[] = new Array(asz);
			let dtheta = 45 * DEGRAD / (asz - 1), theta = lig.avgTheta - 0.5 * dtheta;
			for (let n = 0; n < asz; n++)
			{
				srcX[n] = lx[idxAttach[orderAttach[n]]];
				srcY[n] = ly[idxAttach[orderAttach[n]]];
				dstX[n] = mx + Molecule.IDEALBOND * Math.cos(theta) + attDist[n] * attDX[n];
				dstY[n] = my + Molecule.IDEALBOND * Math.sin(theta) + attDist[n] * attDY[n];

				theta += dtheta / (asz - 1);
			}
			let tfm = GeomUtil.superimpose(srcX, srcY, dstX, dstY);
			for (let n = 0; n < lsz; n++)
			{
				let [x, y] = GeomUtil.applyAffine(lx[n], ly[n], tfm);
				lx[n] = x;
				ly[n] = y;
			}
		}

		for (let n = 0; n < lsz; n++) mol.setAtomPos(lig.atoms[n], lx[n], ly[n]);
	}

	// arrange the given ligands in order, given that there are no reference constraints, so use the initial vectors
	private arrangeLigandsFree(batch:Ligand[]):void
	{
		if (batch.length == 1) return; // leave it be

		let refTheta = Vec.last(batch).avgTheta;
		refTheta += 0.5 * angleDiffPos(Vec.first(batch).avgTheta, refTheta);
		this.arrangeLigandsRange(batch, refTheta, TWOPI, false);
	}

	// arrange the given ligands in order, between the indicated range
	private arrangeLigandsRange(batch:Ligand[], refTheta:number, refSpan:number, bounded:boolean):void
	{
		const {mol, metalAtom} = this;

		let mx = mol.atomX(metalAtom), my = mol.atomY(metalAtom);

		let bsz = batch.length;
		let thetaMin:number[] = new Array(bsz), thetaSpan:number[] = new Array(bsz);

		let ligandSpan = 0;

		for (let n = 0; n < bsz; n++)
		{
			let [theta1, theta2] = this.determineThetaBounds(batch[n]);
			thetaMin[n] = theta1;
			thetaSpan[n] = angleDiffPos(theta2, theta1);
			ligandSpan += thetaSpan[n];
		}

		let residual = (refSpan - ligandSpan) / (bsz + (bounded ? 1 : 0));
		let theta = refTheta + (bounded ? residual : 0.5 * residual);
		for (let n = 0; n < bsz; n++)
		{
			let rotTheta = theta - thetaMin[n];
			let cosTheta = Math.cos(rotTheta), sinTheta = Math.sin(rotTheta);

			for (let a of batch[n].atoms)
			{
				let x = mol.atomX(a) - mx, y = mol.atomY(a) - my;
				mol.setAtomPos(a, mx + x * cosTheta - y * sinTheta, my + x * sinTheta + y * cosTheta);
			}

			theta += thetaSpan[n] + residual;
		}
	}

	// returns {lowTheta,highTheta} for the ligand based on its attachment points
	private determineThetaBounds(lig:Ligand):[number, number]
	{
		const {mol, metalAtom} = this;
		let theta:number[] = [];
		let mx = mol.atomX(metalAtom), my = mol.atomY(metalAtom);
		for (let n = 0; n < lig.attach.length; n++)
		{
			let x = mol.atomX(lig.attach[n]) - mx;
			let y = mol.atomY(lig.attach[n]) - my;
			theta.push(Math.atan2(y, x));
		}
		Vec.sort(theta);

		let bestScore = Number.POSITIVE_INFINITY, bestMin = 0, bestMax = 0;

		for (let n = 0; n < theta.length; n++)
		{
			let score = 0;
			for (let i = 0; i < theta.length - 1; i++) score += angleDiffPos(theta[i + 1], theta[i]);
			if (score < bestScore)
			{
				bestScore = score;
				bestMin = Vec.first(theta);
				bestMax = Vec.last(theta);
			}
			theta.push(theta.shift());
		}

		return [bestMin, bestMax];
	}

	// if any of the ligand blocks clash, keep pushing them outward until resolution
	private resolveClashes():void
	{
		const {mol, metalAtom, ligands} = this;

		const na = mol.numAtoms, nb = mol.numBonds, lsz = this.ligands.length;

		let ablk = Vec.numberArray(-1, na), bblk = Vec.numberArray(-1, nb); // -1=other component, 0=metal, >0=ligand
		for (let n = 1; n <= na; n++) if (mol.atomConnComp(n) == mol.atomConnComp(metalAtom)) ablk[n - 1] = 0;
		for (let n = 0; n < lsz; n++) for (let a of ligands[n].atoms) ablk[a - 1] = n + 1;
		for (let n = 1; n <= nb; n++)
		{
			let blk1 = ablk[mol.bondFrom(n) - 1], blk2 = ablk[mol.bondTo(n) - 1];
			if (blk1 < 0 || blk2 < 0) {}
			else if (blk1 == blk2) bblk[n - 1] = blk1;
		}

		let bumpDX:number[] = new Array(lsz), bumpDY:number[] = new Array(lsz);
		let mx = mol.atomX(metalAtom), my = mol.atomY(metalAtom);
		for (let n = 0; n < lsz; n++)
		{
			let lig = ligands[n];
			let dx = 0, dy = 0;
			for (let a of lig.attach)
			{
				dx += mol.atomX(a) - mx;
				dy += mol.atomY(a) - my;
			}
			dx /= lig.attach.length;
			dy /= lig.attach.length;
			let invDist = 1.0 / norm_xy(dx, dy);
			bumpDX[n] = dx * 0.5 * invDist;
			bumpDY[n] = dy * 0.5 * invDist;
		}

		const CLOSE_SQ = sqr(0.5);

		for (let count = 0; count < 12; count++)
		{
			let tainted = Vec.booleanArray(false, lsz);
			outer: for (let i = 0; i < na - 1; i++)
			{
				if (ablk[i] < 0) continue;
				for (let j = i + 1; j < na; j++) if (ablk[j] >= 0 && ablk[j] != ablk[i])
				{
					if (norm2_xy(mol.atomX(i + 1) - mol.atomX(j + 1), mol.atomY(i + 1) - mol.atomY(j + 1)) < CLOSE_SQ)
					{
						if (ablk[i] > 0) tainted[ablk[i] - 1] = true;
						if (ablk[j] > 0) tainted[ablk[j] - 1] = true;
					}
					if (Vec.allTrue(tainted)) break outer;
				}
			}
			if (Vec.anyFalse(tainted)) outer: for (let i = 0; i < nb - 1; i++)
			{
				if (bblk[i] < 0) continue;
				let x1 = mol.atomX(mol.bondFrom(i + 1)), y1 = mol.atomY(mol.bondFrom(i + 1));
				let x2 = mol.atomX(mol.bondTo(i + 1)), y2 = mol.atomY(mol.bondTo(i + 1));

				for (let j = i + 1; j < nb; j++) if (bblk[j] >= 0 && bblk[j] != bblk[i])
				{
					let x3 = mol.atomX(mol.bondFrom(j + 1)), y3 = mol.atomY(mol.bondFrom(j + 1));
					let x4 = mol.atomX(mol.bondTo(j + 1)), y4 = mol.atomY(mol.bondTo(j + 1));
					if (GeomUtil.doLineSegsIntersect(x1, y1, x2, y2, x3, y3, x4, y4))
					{
						if (bblk[i] > 0) tainted[bblk[i] - 1] = true;
						if (bblk[j] > 0) tainted[bblk[j] - 1] = true;
					}
					if (Vec.allTrue(tainted)) break outer;
				}
			}

			if (Vec.allFalse(tainted)) break;

			for (let n = 0; n < lsz; n++) if (tainted[n])
			{
				for (let a of ligands[n].atoms)
				{
					mol.setAtomPos(a, mol.atomX(a) + bumpDX[n], mol.atomY(a) + bumpDY[n]);
				}
			}
		}
	}
}

/* EOF */ }