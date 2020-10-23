/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	Low level utility functions for the manipulation of molecular coordinates. These functions are fairly
	utilitarian, and don't have a lot of chemical logic encoded within them.

	Distinguished from SketchUtil in that these methods do not make chemistry-based "value judgments", they just
	stick to the numbers and do what they're told.
*/

export class CoordUtil
{
	public static OVERLAP_THRESHOLD = 0.2;// atoms closer than this are "overlapping" (i.e. this is bad)
	public static OVERLAP_THRESHOLD_SQ = CoordUtil.OVERLAP_THRESHOLD * CoordUtil.OVERLAP_THRESHOLD;

	// goes hunting for an atom close to the specified position; returns 0 if none
	public static atomAtPoint(mol:Molecule, x:number, y:number, tolerance?:number):number
	{
		if (tolerance == null) tolerance = CoordUtil.OVERLAP_THRESHOLD;
		const tolsq = tolerance * tolerance;
		for (let n = 1; n <= mol.numAtoms; n++) if (norm2_xy(mol.atomX(n) - x, mol.atomY(n) - y) < tolsq) return n;
		return 0;
	}

	// returns true of the two molecules are "the same sketch"; this means that for every atom in mol1, there is an atom in
	// mol2 at the same absolute (x,y) coordinate, with the exact same properties, and an equivalent bonding scheme; so basically
	// the atom and bond ordering can be different, but not much else

	private static DEFAULT_EQUIV_TOLERANCE = 0.2;

	public static sketchEquivalent(mol1:Molecule, mol2:Molecule, tolerance?:number):boolean
	{
		if (tolerance == null) tolerance = CoordUtil.DEFAULT_EQUIV_TOLERANCE;

		const na = mol1.numAtoms, nb = mol1.numBonds;
		if (na != mol2.numAtoms || nb != mol2.numBonds) return false;

		const tolsq = tolerance * tolerance;

		// an early-out scheme: if the min/max positions are different, we can bug out straight away; doesn't help when they've been
		// modified in the middle of the drawing, but it's a big gain
		let box1 = mol1.boundary(), box2 = mol2.boundary();
		if (Math.abs(box1.minX() - box2.minX()) > tolerance) return false;
		if (Math.abs(box1.minY() - box2.minY()) > tolerance) return false;
		if (Math.abs(box1.maxX() - box2.maxX()) > tolerance) return false;
		if (Math.abs(box1.maxY() - box2.maxY()) > tolerance) return false;

		let mx1 = MolUtil.arrayAtomX(mol1), my1 = MolUtil.arrayAtomY(mol1);
		let mx2 = MolUtil.arrayAtomX(mol2), my2 = MolUtil.arrayAtomY(mol2);

		// find an atom mapping scheme based on proximity; any mapping failure results in early termination
		// NOTE: this is O(N^2); could be linearised by sorting by major/minor axis
		let map = Vec.numberArray(0, na);
		let mask = Vec.booleanArray(false, na);

		for (let i = 0; i < na; i++)
		{
			// find the closest matching atom; start with a special trick: frequently the corresponding atom is at exactly the
			// same index (because of the types of operations which precede this method call); if it is real close, then just go with it
			let j = -1;
			if (norm2_xy(mx1[i] - mx2[i], my1[i] - my2[i]) < tolsq) j = i;

			// if that didn't work, then scan through the unmatched possibilities
			if (j < 0)
			{
				let bestdsq = Number.MAX_VALUE;
				for (let n = 0; n < na; n++) if (!mask[n])
				{
					let dsq = norm2_xy(mx1[i] - mx2[n], my1[i] - my2[n]);
					if (dsq < bestdsq) {bestdsq = dsq; j = n;}
				}
				if (j < 0 || bestdsq > tolsq) return false;
			}

			map[i] = j + 1;
			mask[j] = true;

			// while we're here, make sure the atoms have the same properties
			if (mol1.atomElement(i + 1) != mol2.atomElement(j + 1)) return false;
			if (mol1.atomCharge(i + 1) != mol2.atomCharge(j + 1)) return false;
			if (mol1.atomUnpaired(i + 1) != mol2.atomUnpaired(j + 1)) return false;
			if (mol1.atomHExplicit(i + 1) != mol2.atomHExplicit(j + 1) &&
				mol1.atomHExplicit(i + 1) != Molecule.HEXPLICIT_UNKNOWN &&
				mol2.atomHExplicit(j + 1) != Molecule.HEXPLICIT_UNKNOWN) return false;
		}

		// now that we have the mapping, make sure the bonds are also equivalent
		// NOTE: this is O(N), because Molecule.findBond(..) is O(1)
		for (let i = 1; i <= nb; i++)
		{
			let i1 = mol1.bondFrom(i), i2 = mol1.bondTo(i), j1 = map[i1 - 1], j2 = map[i2 - 1];
			let j = mol2.findBond(j1, j2);

			if (j == 0) return false;

			if (mol1.bondOrder(i) != mol2.bondOrder(j) || mol1.bondType(i) != mol2.bondType(j)) return false;

			if (mol2.bondFrom(j) == j1 && mol2.bondTo(j) == j2) {} // same
			else if (mol2.bondType(j) != Molecule.BONDTYPE_INCLINED &&
					mol2.bondType(j) != Molecule.BONDTYPE_DECLINED &&
					mol2.bondFrom(j) == j2 && mol2.bondTo(j) == j1) {} // reversed is OK
			else return false;
		}

		return true;
	}

	// similar to sketchEquivalent(..) above, except this version will translate the coordinates so that they overlay on top of
	// each other
	// NOTE: the overlay method is trivial; if the coordinates are collectively different enough to blow the tolerance unless
	// the overlay is jiggled around a bit, this method can return a false negative
	public static sketchMappable(mol1:Molecule, mol2:Molecule, tolerance?:number):boolean
	{
		if (tolerance == null) tolerance = CoordUtil.DEFAULT_EQUIV_TOLERANCE;

		let box1 = mol1.boundary(), box2 = mol2.boundary();
		let dx = box1.minX() - box2.minX(), dy = box1.minY() - box2.minY();
		if (Math.abs(dx) > tolerance * 0.1 || Math.abs(dy) > tolerance * 0.1)
		{
			mol2 = mol2.clone();
			for (let n = 1; n <= mol2.numAtoms; n++) mol2.setAtomPos(n, mol2.atomX(n) + dx, mol2.atomY(n) + dy);
		}

		return CoordUtil.sketchEquivalent(mol1, mol2, tolerance);
	}

	// returns a list of the angles of the bonds emanating from the given atom; the order of the angles returned is guaranteed to
	// correspond to the order found in mol.atomAdjList(N)
	public static atomBondAngles(mol:Molecule, atom:number, adj?:number[]):number[]
	{
		if (adj == null) adj = mol.atomAdjList(atom);
		let bndang:number[] = [];
		let cx = mol.atomX(atom), cy = mol.atomY(atom);
		for (let a of adj) bndang.push(Math.atan2(mol.atomY(a) - cy, mol.atomX(a) - cx));
		return bndang;
	}

	// returns true if the indicated position happens to be on top of an atom, within the given radial tolerance
	public static overlapsAtom(mol:Molecule, x:number, y:number, tol:number):boolean
	{
		const tolsq = tol * tol;
		for (let n = 1; n <= mol.numAtoms; n++) if (norm2_xy(mol.atomX(n) - x, mol.atomY(n) - y) < tolsq) return true;
		return false;
	}

	// returns a list of all the atoms which are considered to be "overlapping"; because this is O(N^2) and typically called during
	// screen updates, it is somewhat optimised
	public static overlappingAtomMask(mol:Molecule, thresh?:number):boolean[]
	{
		if (thresh == null) thresh = CoordUtil.OVERLAP_THRESHOLD;

		const sz = mol.numAtoms;
		let box = mol.boundary();
		let p1:number[], p2:number[];
		if (box.w > box.h)
		{
			p1 = MolUtil.arrayAtomX(mol);
			p2 = MolUtil.arrayAtomY(mol);
		}
		else
		{
			p1 = MolUtil.arrayAtomY(mol);
			p2 = MolUtil.arrayAtomX(mol);
		}

		let omask = Vec.booleanArray(false, sz);
		let idx = Vec.idxSort(p1);
		const threshSQ = thresh * thresh;
		for (let i = 1; i < sz - 1; i++)
		{
			for (let j = i - 1; j >= 0; j--)
			{
				let d1 = p1[idx[i]] - p1[idx[j]];
				if (d1 > thresh) break;
				if (norm2_xy(d1, p2[idx[i]] - p2[idx[j]]) < threshSQ) {omask[idx[i]] = true; omask[idx[j]] = true;}
			}
			for (let j = i + 1; j < sz; j++)
			{
				let d1 = p1[idx[j]] - p1[idx[i]];
				if (d1 > thresh) break;
				if (norm2_xy(d1, p2[idx[j]] - p2[idx[i]]) < threshSQ) {omask[idx[i]] = true; omask[idx[j]] = true;}
			}
		}

		return omask;
	}
	public static overlappingAtomList(mol:Molecule, thresh?:number):number[]
	{
		if (thresh == null) thresh = CoordUtil.OVERLAP_THRESHOLD;
		return Vec.add(Vec.maskIdx(CoordUtil.overlappingAtomMask(mol, thresh)), 1);
	}

	// for the given position, returns a measure of how congested it is, based on the sum of the reciprocal square of distances
	// to each of the atoms; the 'approach' parameter is the minimum distance, so 1/approach is hence the maximum score;
	// higher values mean more congested; approach should always be >0; lower numbers mean less congested
	public static congestionPoint(mol:Molecule, x:number, y:number, approach?:number):number
	{
		if (approach == null) approach = 1E-5;
		let score = 0;
		let na = mol.numAtoms;
		for (let n = 1; n <= na; n++)
			score += 1.0 / (approach + norm2_xy(mol.atomX(n) - x, mol.atomY(n) - y));
		return score;
	}

	// returns congestion calculated for the whole molecule (or rather, sum(i,j) where i<j); 'approach' works like above;
	// higher values mean more congested
	public static congestionMolecule(mol:Molecule, approach?:number):number
	{
		if (approach == null) approach = 1E-5;
		let score = 0;
		const na = mol.numAtoms;
		let mx = MolUtil.arrayAtomX(mol), my = MolUtil.arrayAtomY(mol);
		for (let i = 0; i < na - 1; i++) for (let j = i + 1; j < na; j++)
			score += 1.0 / (approach + norm2_xy(mx[i] - mx[j], my[i] - my[j]));
		return score;
	}

	// translates all atoms in the molecule by the indicated amount
	public static translateMolecule(mol:Molecule, ox:number, oy:number):void
	{
		for (let n = 1; n <= mol.numAtoms; n++) mol.setAtomPos(n, mol.atomX(n) + ox, mol.atomY(n) + oy);
	}

	// rotates the molecule about geographic centre
	public static rotateMolecule(mol:Molecule, theta:number, cx?:number, cy?:number):void
	{
		if (cx == null || cy == null)
		{
			let box = mol.boundary();
			cx = box.midX();
			cy = box.midY();
		}

		let cosTheta = Math.cos(theta), sinTheta = Math.sin(theta);
		for (let n = 1; n <= mol.numAtoms; n++)
		{
			let x = mol.atomX(n) - cx, y = mol.atomY(n) - cy;
			mol.setAtomPos(n, cx + x * cosTheta - y * sinTheta, cy + x * sinTheta + y * cosTheta);
		}
	}

	// with atom C as the central point, rotates the substituent
	public static rotateBond(mol:Molecule, centre:number, atom:number, theta:number):void
	{
		theta = angleNorm(theta);
		if (Math.abs(theta) < 0.1 * DEGRAD) return;

		let g = Graph.fromMolecule(mol);
		g.isolateNode(centre - 1);
		let cc = g.calculateComponents();

		let cx = mol.atomX(centre), cy = mol.atomY(centre);
		let cosTheta = Math.cos(theta), sinTheta = Math.sin(theta);

		for (let n = 1; n <= mol.numAtoms; n++) if (cc[n - 1] == cc[atom - 1])
		{
			let x = mol.atomX(n) - cx, y = mol.atomY(n) - cy;
			mol.setAtomPos(n, cx + x * cosTheta - y * sinTheta, cy + x * sinTheta + y * cosTheta);
		}
	}

	// rotates only the atoms specified by the mask, by theta about the central point (cx,cy)
	public static rotateAtoms(mol:Molecule, mask:boolean[], cx:number, cy:number, theta:number):void
	{
		let cosTheta = Math.cos(theta), sinTheta = Math.sin(theta);
		for (let n = 1; n <= mol.numAtoms; n++) if (mask[n - 1])
		{
			let x = mol.atomX(n) - cx, y = mol.atomY(n) - cy;
			mol.setAtomPos(n, cx + x * cosTheta - y * sinTheta, cy + x * sinTheta + y * cosTheta);
		}
	}

	// considers the adjacency list for an atom, and returns a form of the list in a sequence suitable for representing interior
	// angles; null means no angles; for those with two neighbours, returns them ordered such that ang(1)..ang(2) is the
	// interior angle; if 3 or more neighbours, orders them so that ang(N)..ang(N+1) has no other angles _between_ them
	public static angleNeighbours(mol:Molecule, atom:number):number[]
	{
		let adj = mol.atomAdjList(atom);
		if (adj.length <= 1) return null;
		let th:number[] = [];
		for (let n = 0; n < adj.length; n++) th.push(Math.atan2(mol.atomY(adj[n]) - mol.atomY(atom), mol.atomX(adj[n]) - mol.atomX(atom)));

		if (adj.length == 2)
		{
			if (angleDiff(th[1], th[0]) > 0) return adj;
			return [adj[1], adj[0]];
		}

		let idx = Vec.idxSort(th);
		return Vec.idxGet(adj, idx);
	}

	// assimilates two atoms together; the "old" atom has its bonds reassigned to the "new" atom, then gets deleted
	public static mergeAtoms(mol:Molecule, oldN:number, newN:number):void
	{
		for (let n = 1; n <= mol.numBonds; n++)
		{
			if (mol.bondFrom(n) == oldN) mol.setBondFrom(n, newN);
			if (mol.bondTo(n) == oldN) mol.setBondTo(n, newN);
		}
		mol.deleteAtomAndBonds(oldN);
	}

	// runs through the molecule to see if the median bond distance is reasonably close to the ideal bond length, and if so, leaves
	// it alone; if not, everything gets rescaled; this is particularly useful when importing, because not all formats use quasi-
	// realistic Angstrom-like units
	public static normaliseBondDistances(mol:Molecule):void
	{
		const nb = mol.numBonds;
		if (nb == 0) return;

		let dsq:number[] = [];
		for (let n = 1; n <= nb; n++)
		{
			let bfr = mol.bondFrom(n), bto = mol.bondTo(n);
			dsq.push(norm2_xy(mol.atomX(bto) - mol.atomX(bfr), mol.atomY(bto) - mol.atomY(bfr)));
		}
		Vec.sort(dsq);
		let median = (nb & 1) == 1 ? Math.sqrt(dsq[nb >> 1]) : 0.5 * (Math.sqrt(dsq[nb >> 1]) + Math.sqrt(dsq[(nb >> 1) - 1]));
		if (median < 0.1 || (median > Molecule.IDEALBOND * 0.9 && median < Molecule.IDEALBOND * 1.1)) return;

		let box = mol.boundary();
		let cx = box.midX(), cy = box.midY();
		let scale = Molecule.IDEALBOND / median;
		for (let n = mol.numAtoms; n >= 1; n--)
		{
			let x = (mol.atomX(n) - cx) * scale + cx;
			let y = (mol.atomY(n) - cy) * scale + cy;
			mol.setAtomPos(n, x, y);
		}
	}

	// returns an inverted version of the molecule, by switching one axis (X); if there are any inclined/declined bonds, they are
	// also inverted
	public static mirrorImage(mol:Molecule):Molecule
	{
		mol = mol.clone();

		for (let n = 1; n <= mol.numAtoms; n++) mol.setAtomX(n, -mol.atomX(n));
		for (let n = 1; n <= mol.numBonds; n++)
		{
			if (mol.bondType(n) == Molecule.BONDTYPE_DECLINED) mol.setBondType(n, Molecule.BONDTYPE_INCLINED);
			else if (mol.bondType(n) == Molecule.BONDTYPE_INCLINED) mol.setBondType(n, Molecule.BONDTYPE_DECLINED);
		}

		return mol;
	}

	// given two molecules (mol1,mol2), and a mapping between them, performs a specialised superimposition: the first
	// index:index mapping is the translation reference point, so mol2 is moved; then a rotation/flip operation is determined,
	// based on the directional orientation of the remaining mapping substituents; if the molecule is flipped, the wedge bonds
	// will all be inverted
	// NOTE: the mol2 parameter is modified, and contains the results of the operation
	public static alignOrientFlip(mol1:Molecule, idx1:number[], mol2:Molecule, idx2:number[]):void
	{
		if (idx1.length < 2 || idx1.length != idx2.length) throw 'Invalid mapping indices.';

		let x0 = mol1.atomX(idx1[0]), y0 = mol1.atomY(idx1[0]);

		CoordUtil.translateMolecule(mol2, x0 - mol2.atomX(idx2[0]), y0 - mol2.atomY(idx2[0]));
		const sz = idx1.length - 1;

		let th1:number[] = [], th2:number[] = [];
		let deltaA = 0, deltaB = 0;
		for (let n = 0; n < sz; n++)
		{
			th1.push(Math.atan2(mol1.atomY(idx1[n + 1]) - y0, mol1.atomX(idx1[n + 1]) - x0));
			th2.push(Math.atan2(mol2.atomY(idx2[n + 1]) - y0, mol2.atomX(idx2[n + 1]) - x0));
			let dthA = angleDiff(th1[n], th2[n]), dthB = angleDiff(th1[n], -th2[n]);

			// correction to avoid cancellation, e.g. (180-180) === (180+180)
			if (dthA < -175 * DEGRAD && deltaA > 0) dthA += TWOPI;
			else if (dthA > 175 * DEGRAD && deltaA < 0) dthA -= TWOPI;
			if (dthB < -175 * DEGRAD && deltaB > 0) dthB += TWOPI;
			else if (dthB > 175 * DEGRAD && deltaB < 0) dthB -= TWOPI;

			deltaA += dthA;
			deltaB += dthB;
		}
		if (sz > 1) {let inv = 1.0 / sz; deltaA *= inv; deltaB *= inv;}
		let scoreA = 0, scoreB = 0;
		for (let n = 0; n < sz; n++)
		{
			scoreA += Math.abs(angleDiff(th1[n], th2[n] + deltaA));
			scoreB += Math.abs(angleDiff(th1[n], -th2[n] + deltaB));
		}
		if (scoreB < scoreA)
		{
			for (let n = 1; n <= mol2.numAtoms; n++) mol2.setAtomY(n, 2 * y0 - mol2.atomY(n));
			for (let n = 1; n <= mol2.numBonds; n++)
			{
				if (mol2.bondType(n) == Molecule.BONDTYPE_DECLINED) mol2.setBondType(n, Molecule.BONDTYPE_INCLINED);
				else if (mol2.bondType(n) == Molecule.BONDTYPE_INCLINED) mol2.setBondType(n, Molecule.BONDTYPE_DECLINED);
			}
			CoordUtil.rotateMolecule(mol2, x0, y0, deltaB);
		}
		else CoordUtil.rotateMolecule(mol2, x0, y0, deltaA);
	}
}

/* EOF */ }