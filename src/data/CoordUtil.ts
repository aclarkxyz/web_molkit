/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='Molecule.ts'/>
///<reference path='MolUtil.ts'/>
///<reference path='../util/util.ts'/>

/*
	Low level utility functions for the manipulation of molecular coordinates. These functions are fairly
	utilitarian, and don't have a lot of chemical logic encoded within them.
	
	Distinguished from SketchUtil in that these methods do not make chemistry-based "value judgments", they just
	stick to the numbers and do what they're told.
*/

class CoordUtil
{
	public static OVERLAP_THRESHOLD = 0.2;// atoms closer than this are "overlapping" (i.e. this is bad)
	public static OVERLAP_THRESHOLD_SQ = CoordUtil.OVERLAP_THRESHOLD * CoordUtil.OVERLAP_THRESHOLD;

/*
	// goes hunting for an atom close to the specified position; returns 0 if none
	public static int atomAtPoint(Molecule mol, float x, float y) {return atomAtPoint(mol, x, y, OVERLAP_THRESHOLD);}
	public static int atomAtPoint(Molecule mol, float x, float y, float tolerance)
	{
		float tolsq = tolerance * tolerance;
		for (int n = 1; n <= mol.numAtoms(); n++)
			if (Util.norm2(mol.atomX(n) - x, mol.atomY(n) - y) < tolsq) return n;
		return 0;
	}

    // returns true of the two molecules are "the same sketch"; this means that for every atom in mol1, there is an atom in
    // mol2 at the same absolute (x,y) coordinate, with the exact same properties, and an equivalent bonding scheme; so basically
    // the atom and bond ordering can be different, but not much else
    
	private static final float DEFAULT_EQUIV_TOLERANCE = 0.2f;
    
    public static boolean sketchEquivalent(Molecule mol1, Molecule mol2) {return sketchEquivalent(mol1, mol2, DEFAULT_EQUIV_TOLERANCE);}
    public static boolean sketchEquivalent(Molecule mol1, Molecule mol2, final float tolerance)
    {
		final int na = mol1.numAtoms(), nb = mol1.numBonds();
		if (na != mol2.numAtoms() || nb != mol2.numBonds()) return false;
    	
		final float tolsq = tolerance * tolerance;
    	
    	// an early-out scheme: if the min/max positions are different, we can bug out straight away; doesn't help when they've been
    	// modified in the middle of the drawing, but it's a big gain
		if (Math.abs(mol1.minX() - mol2.minX()) > tolerance) return false;
		if (Math.abs(mol1.minY() - mol2.minY()) > tolerance) return false;
		if (Math.abs(mol1.maxX() - mol2.maxX()) > tolerance) return false;
		if (Math.abs(mol1.maxY() - mol2.maxY()) > tolerance) return false;

		final float[] mx1 = MolUtil.arrayAtomX(mol1), my1 = MolUtil.arrayAtomY(mol1);
		final float[] mx2 = MolUtil.arrayAtomX(mol2), my2 = MolUtil.arrayAtomY(mol2);
    	
    	// find an atom mapping scheme based on proximity; any mapping failure results in early termination
    	// NOTE: this is O(N^2); could be linearised by sorting by major/minor axis
		int[] map = Vec.intArray(0, na);
		boolean[] mask = Vec.booleanArray(false, na);
    	
		for (int i = 0; i < na; i++)
    	{
    		// find the closest matching atom; start with a special trick: frequently the corresponding atom is at exactly the
    		// same index (because of the types of operations which precede this method call); if it is real close, then just go with it
			int j = -1;
			if (Util.norm2(mx1[i] - mx2[i], my1[i] - my2[i]) < tolsq) j = i;
    	    
    	    // if that didn't work, then scan through the unmatched possibilities
			if (j < 0)
			{
				float bestdsq = Float.MAX_VALUE;
				for (int n = 0; n < na; n++)
					if (!mask[n])
					{
						float dsq = Util.norm2(mx1[i] - mx2[n], my1[i] - my2[n]);
						if (dsq < bestdsq) {bestdsq = dsq; j = n;}
					}
				if (j < 0 || bestdsq > tolsq) return false;
			}
    	    
			map[i] = j + 1;
			mask[j] = true;
    	    
			// while we're here, make sure the atoms have the same properties
			if (!mol1.atomElement(i + 1).equals(mol2.atomElement(j + 1))) return false;
			if (mol1.atomCharge(i + 1) != mol2.atomCharge(j + 1)) return false;
			if (mol1.atomUnpaired(i + 1) != mol2.atomUnpaired(j + 1)) return false;
			if (mol1.atomHExplicit(i + 1) != mol2.atomHExplicit(j + 1) && mol1.atomHExplicit(i + 1) != Molecule.HEXPLICIT_UNKNOWN
							&& mol2.atomHExplicit(j + 1) != Molecule.HEXPLICIT_UNKNOWN) return false;
    	}
        
    	// now that we have the mapping, make sure the bonds are also equivalent
    	// NOTE: this is O(N), because Molecule.findBond(..) is O(1)
		for (int i = 1; i <= nb; i++)
		{
			int i1 = mol1.bondFrom(i), i2 = mol1.bondTo(i), j1 = map[i1 - 1], j2 = map[i2 - 1];
			int j = mol2.findBond(j1, j2);
    	    
			if (j == 0) return false;

			if (mol1.bondOrder(i) != mol2.bondOrder(j) || mol1.bondType(i) != mol2.bondType(j)) return false;
    	    
			if (mol2.bondFrom(j) == j1 && mol2.bondTo(j) == j2) {} // same
			else if (mol2.bondType(j) != Molecule.BONDTYPE_INCLINED && mol2.bondType(j) != Molecule.BONDTYPE_DECLINED && mol2.bondFrom(j) == j2 && mol2.bondTo(j) == j1) {} // reversed is OK
    	    else return false;
    	}
    	
    	return true;
    }

    // similar to sketchEquivalent(..) above, except this version will translate the coordinates so that they overlay on top of
    // each other
    // NOTE: the overlay method is trivial; if the coordinates are collectively different enough to blow the tolerance unless 
    // the overlay is jiggled around a bit, this method can return a false negative
    
	public static boolean sketchMappable(Molecule mol1, Molecule mol2) {return sketchMappable(mol1, mol2, DEFAULT_EQUIV_TOLERANCE);}
    public static boolean sketchMappable(Molecule mol1, Molecule mol2, float tolerance)
    {
		float dx = mol1.minX() - mol2.minX(), dy = mol1.minY() - mol2.minY();
		if (Math.abs(dx) > tolerance * 0.1f || Math.abs(dy) > tolerance * 0.1f)
		{
			mol2 = mol2.clone();
			for (int n = 1; n <= mol2.numAtoms(); n++) mol2.setAtomPos(n, mol2.atomX(n) + dx, mol2.atomY(n) + dy);
		}

		return sketchEquivalent(mol1, mol2, tolerance);
    }
        
	// returns a list of the angles of the bonds emanating from the given atom; the order of the angles returned is guaranteed to
	// correspond to the order found in mol.atomAdjList(N)
	public static float[] atomBondAngles(Molecule mol, int N, int[] adj)
	{
		float[] bndang = new float[adj.length];
		float cx = mol.atomX(N), cy = mol.atomY(N);
		for (int n = 0; n < adj.length; n++) bndang[n] = Util.atan2(mol.atomY(adj[n]) - cy, mol.atomX(adj[n]) - cx);
		return bndang;
	}
	public static float[] atomBondAngles(Molecule mol, int N) {return atomBondAngles(mol, N, mol.atomAdjList(N));}

    // returns true if the indicated position happens to be on top of an atom, within the given radial tolerance
	public static boolean overlapsAtom(Molecule mol, float x, float y, float tol)
    {
		double tolsq = Util.sqr(tol);
		for (int n = 1; n <= mol.numAtoms(); n++) if (Util.norm2(mol.atomX(n) - x, mol.atomY(n) - y) < tolsq) return true;
		return false;
    }

	// returns a list of all the atoms which are considered to be "overlapping"; because this is O(N^2) and typically called during
	// screen updates, it is somewhat optimised
	public static boolean[] overlappingAtomMask(Molecule mol) {return overlappingAtomMask(mol, OVERLAP_THRESHOLD);}
	public static boolean[] overlappingAtomMask(Molecule mol, final float thresh)
	{
		final int sz = mol.numAtoms();
		float[] p1 = null, p2 = null;
		if (mol.rangeX() > mol.rangeY())
		{
			p1 = MolUtil.arrayAtomX(mol);
			p2 = MolUtil.arrayAtomY(mol);
		}
		else
		{
			p1 = MolUtil.arrayAtomY(mol);
			p2 = MolUtil.arrayAtomX(mol);
		}
			
		boolean[] omask = Vec.booleanArray(false, sz);
		int[] idx = Vec.idxSort(p1);
		final float threshSQ = thresh * thresh;
		for (int i = 1; i < sz - 1; i++)
		{
			for (int j = i - 1; j >= 0; j--)
			{
				float d1 = p1[idx[i]] - p1[idx[j]];
				if (d1 > thresh) break;
				if (Util.norm2(d1, p2[idx[i]] - p2[idx[j]]) < threshSQ) {omask[idx[i]] = true; omask[idx[j]] = true;}
			}
			for (int j = i + 1; j < sz; j++)
			{
				float d1 = p1[idx[j]] - p1[idx[i]];
				if (d1 > thresh) break;
				if (Util.norm2(d1, p2[idx[j]] - p2[idx[i]]) < threshSQ) {omask[idx[i]] = true; omask[idx[j]] = true;}
			}
		}
		
		return omask;
	}
	public static int[] overlappingAtomList(Molecule mol) {return overlappingAtomList(mol, OVERLAP_THRESHOLD);}
	public static int[] overlappingAtomList(Molecule mol, final float thresh)
	{
		return Vec.add(Vec.maskIdx(overlappingAtomMask(mol, thresh)), 1);
	}*/
    
    // for the given position, returns a measure of how congested it is, based on the sum of the reciprocal square of distances
    // to each of the atoms; the 'approach' parameter is the minimum distance, so 1/approach is hence the maximum score;
    // higher values mean more congested; approach should always be >0; lower numbers mean less congested
    public static congestionPoint(mol:Molecule, x:number, y:number, approach?:number):number
    {
		if (approach == null) approach = 1E-5;
		let score = 0;
		let na = mol.numAtoms();
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
		const na = mol.numAtoms();
		let mx = MolUtil.arrayAtomX(mol), my = MolUtil.arrayAtomY(mol);
		for (let i = 0; i < na - 1; i++) for (let j = i + 1; j < na; j++)
			score += 1.0 / (approach + norm2_xy(mx[i] - mx[j], my[i] - my[j]));
		return score;
    }

/*
    // translates all atoms in the molecule by the indicated amount
	public static void translateMolecule(Molecule mol, float ox, float oy)
	{
		for (int n = 1; n <= mol.numAtoms(); n++) mol.setAtomPos(n, mol.atomX(n) + ox, mol.atomY(n) + oy);
	}
    
    // rotates the molecule about geographic centre
    public static void rotateMolecule(Molecule mol, float theta)
    {
		rotateMolecule(mol, 0.5f * (mol.maxX() + mol.minX()), 0.5f * (mol.maxY() + mol.minY()), theta);
    }
    
    // rotates the molecule by the given amount, at the indicated central position
	public static void rotateMolecule(Molecule mol, float cx, float cy, float theta)
	{
		float cosTheta = Util.cos(theta), sinTheta = Util.sin(theta);
		for (int n = 1; n <= mol.numAtoms(); n++)
		{
			float x = mol.atomX(n) - cx, y = mol.atomY(n) - cy;
			mol.setAtomPos(n, cx + x * cosTheta - y * sinTheta, cy + x * sinTheta + y * cosTheta);
		}
	}
    
    // with atom C as the central point, rotates the substituent 
	public static void rotateBond(Molecule mol, int C, int N, float theta)
	{
		theta = Util.angleNorm(theta);
		if (Math.abs(theta) < 0.1f * Util.DEGRAD_F) return;
    	
		Graph g = new Graph(mol);
		g.isolateNode(C - 1);
		int[] cc = g.calculateComponents();
    	
		float cx = mol.atomX(C), cy = mol.atomY(C);
		float cosTheta = Util.cos(theta), sinTheta = Util.sin(theta);

		for (int n = 1; n <= mol.numAtoms(); n++) if (cc[n - 1] == cc[N - 1])
		{
			float x = mol.atomX(n) - cx, y = mol.atomY(n) - cy;
			mol.setAtomPos(n, cx + x * cosTheta - y * sinTheta, cy + x * sinTheta + y * cosTheta);
		}
    }
    
    // rotates only the atoms specified by the mask, by theta about the central point (cx,cy)
	public static void rotateAtoms(Molecule mol, boolean[] mask, float cx, float cy, float theta)
	{
		float cosTheta = Util.cos(theta), sinTheta = Util.sin(theta);
		for (int n = 1; n <= mol.numAtoms(); n++) if (mask[n - 1])
		{
			float x = mol.atomX(n) - cx, y = mol.atomY(n) - cy;
			mol.setAtomPos(n, cx + x * cosTheta - y * sinTheta, cy + x * sinTheta + y * cosTheta);
		}
    }
        
    // considers the adjacency list for an atom, and returns a form of the list in a sequence suitable for representing interior
    // angles; null means no angles; for those with two neighbours, returns them ordered such that ang(1)..ang(2) is the 
    // interior angle; if 3 or more neighbours, orders them so that ang(N)..ang(N+1) has no other angles _between_ them
	public static int[] angleNeighbours(Molecule mol, int N)
    {
		int[] adj = mol.atomAdjList(N);
		if (adj.length <= 1) return null;
		float[] th = new float[adj.length];
		for (int n = 0; n < adj.length; n++) th[n] = Util.atan2(mol.atomY(adj[n]) - mol.atomY(N), mol.atomX(adj[n]) - mol.atomX(N));
    	
		if (adj.length == 2)
		{
			if (Util.angleDiff(th[1], th[0]) > 0) return adj;
			return new int[]{adj[1], adj[0]};
		}
    	
		int[] idx = Vec.idxSort(th);
		return Vec.idxGet(adj, idx);
    }
    
    // assimilates two atoms together; the "old" atom has its bonds reassigned to the "new" atom, then gets deleted
	public static void mergeAtoms(Molecule mol, int oldN, int newN)
	{
		for (int n = 1; n <= mol.numBonds(); n++)
		{
			if (mol.bondFrom(n) == oldN) mol.setBondFrom(n, newN);
			if (mol.bondTo(n) == oldN) mol.setBondTo(n, newN);
		}
		mol.deleteAtomAndBonds(oldN);
    }
    
    // runs through the molecule to see if the median bond distance is reasonably close to the ideal bond length, and if so, leaves
    // it alone; if not, everything gets rescaled; this is particularly useful when importing, because not all formats use quasi-
    // realistic Angstrom-like units
    public static void normaliseBondDistances(Molecule mol)
    {
		final int nb = mol.numBonds();
		if (nb == 0) return;

		float[] dsq = new float[nb];
		for (int n = 1; n <= nb; n++)
		{
			int bfr = mol.bondFrom(n), bto = mol.bondTo(n);
			dsq[n - 1] = Util.norm2(mol.atomX(bto) - mol.atomX(bfr), mol.atomY(bto) - mol.atomY(bfr));
		}
		dsq = Vec.sort(dsq);
		float median = (nb & 1) == 1 ? Util.sqrt(dsq[nb >> 1]) : 0.5f * (Util.sqrt(dsq[nb >> 1]) + Util.sqrt(dsq[(nb >> 1) - 1]));
		if (median < 0.1f || (median > Molecule.IDEALBOND * 0.9f && median < Molecule.IDEALBOND * 1.1f)) return;
    	
		float cx = 0.5f * (mol.minX() + mol.maxX()), cy = 0.5f * (mol.minY() + mol.maxY());
		float scale = Molecule.IDEALBOND / median;
		for (int n = mol.numAtoms(); n >= 1; n--)
		{
			float x = (mol.atomX(n) - cx) * scale + cx;
			float y = (mol.atomY(n) - cy) * scale + cy;
			mol.setAtomPos(n, x, y);
		}
    }
    
    // returns an inverted version of the molecule, by switching one axis; if there are any inclined/declined bonds, they are
    // also inverted
    public static Molecule mirrorImage(Molecule mol)
    {
		mol = mol.clone();

		for (int n = 1; n <= mol.numAtoms(); n++) mol.setAtomX(n, -mol.atomX(n));
		for (int n = 1; n <= mol.numBonds(); n++)
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
	public static void alignOrientFlip(Molecule mol1,int[] idx1,Molecule mol2,int[] idx2)
	{
		if (idx1.length < 2 || idx1.length != idx2.length) throw new GraphFaultException("Invalid mapping indices.");

		final float x0 = mol1.atomX(idx1[0]), y0 = mol1.atomY(idx1[0]);

		CoordUtil.translateMolecule(mol2, x0 - mol2.atomX(idx2[0]), y0 - mol2.atomY(idx2[0]));
		final int sz = idx1.length - 1;

		final float[] th1 = new float[sz], th2 = new float[sz];
		float deltaA = 0, deltaB = 0;
		for (int n = 0; n < sz; n++)
		{
			th1[n] = Util.atan2(mol1.atomY(idx1[n + 1]) - y0, mol1.atomX(idx1[n + 1]) - x0);
			th2[n] = Util.atan2(mol2.atomY(idx2[n + 1]) - y0, mol2.atomX(idx2[n + 1]) - x0);
			float dthA = Util.angleDiff(th1[n], th2[n]), dthB = Util.angleDiff(th1[n], -th2[n]);

			// correction to avoid cancellation, e.g. (180-180) === (180+180)
			if (dthA < -175 * Util.DEGRAD_F && deltaA > 0) dthA += Util.TWOPI_F;
			else if (dthA > 175 * Util.DEGRAD_F && deltaA < 0) dthA -= Util.TWOPI_F;
			if (dthB < -175 * Util.DEGRAD_F && deltaB > 0) dthB += Util.TWOPI_F;
			else if (dthB > 175 * Util.DEGRAD_F && deltaB < 0) dthB -= Util.TWOPI_F;

			deltaA += dthA;
			deltaB += dthB;
		}
		if (sz > 1) {float inv = 1.0f / sz; deltaA *= inv; deltaB *= inv;}
		float scoreA = 0, scoreB = 0;
		for (int n = 0; n < sz; n++)
		{
			scoreA += Math.abs(Util.angleDiff(th1[n], th2[n] + deltaA));
			scoreB += Math.abs(Util.angleDiff(th1[n], -th2[n] + deltaB));
		}
		if (scoreB < scoreA)
		{
			for (int n = 1; n <= mol2.numAtoms(); n++) mol2.setAtomY(n, 2 * y0 - mol2.atomY(n));
			for (int n = 1; n <= mol2.numBonds(); n++)
			{
				if (mol2.bondType(n) == Molecule.BONDTYPE_DECLINED) mol2.setBondType(n, Molecule.BONDTYPE_INCLINED);
				else if (mol2.bondType(n) == Molecule.BONDTYPE_INCLINED) mol2.setBondType(n, Molecule.BONDTYPE_DECLINED);
			}
			CoordUtil.rotateMolecule(mol2, x0, y0, deltaB);
		}
		else CoordUtil.rotateMolecule(mol2, x0, y0, deltaA);
	}
*/	
}