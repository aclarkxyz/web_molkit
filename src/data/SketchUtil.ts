/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='Molecule.ts'/>
///<reference path='CoordUtil.ts'/>
///<reference path='../util/util.ts'/>

/*
	SketchUtil: static methods for calculating properties of molecules, typically of the geometric variety.
*/

interface GuidelineSprout
{
	atom:number; // source atom (0 if free-drawing)
	orders:number[]; // applicable bond orders
	x:number[]; // destination in molecular coordinates
	y:number[]; // "
	sourceX?:number; // source position in screen coordinates 
	sourceY?:number; // "
	destX?:number[]; // destination positions in screen coordinates
	destY?:number[];
}

enum Geometry
{
	Linear = 0,
	Bent,
	Trigonal,
	Tetra1,
	Tetra2,
	SqPlan,
	BasePyram,
	TrigBip,
	Octa1,
	Octa2
}

class SketchUtil
{
	public static GEOM_ANGLES =
	[ // (these match the Geometry* constants)
    	[0, 180*DEGRAD],
    	[0, 120*DEGRAD],
    	[0, 120*DEGRAD, 240*DEGRAD],
    	[0, 90*DEGRAD, 150*DEGRAD, 240*DEGRAD],
    	[0, 120*DEGRAD, 180*DEGRAD, 240*DEGRAD],
    	[0, 90*DEGRAD, 180*DEGRAD, 270*DEGRAD],
    	[0, 90*DEGRAD, 150*DEGRAD, 210*DEGRAD, 270*DEGRAD],
    	[0, 60*DEGRAD, 90*DEGRAD, 180*DEGRAD, 210*DEGRAD],
    	[0, 60*DEGRAD, 120*DEGRAD, 180*DEGRAD, 240*DEGRAD, 300*DEGRAD],
    	[0, 45*DEGRAD, 90*DEGRAD, 180*DEGRAD, 225*DEGRAD, 270*DEGRAD]
	];


/* // adds a new atom to the molecule, and returns its index; the new atom is placed in a reasonable position
	public static int placeNewAtom(Molecule mol, String el)
	{
		float x = mol.maxX() + Molecule.IDEALBOND, y = mol.maxY();
		// MAYBE: see if the highest-indexed atom is a loner, and maybe line the new one up with it?
		return mol.addAtom(el, x, y);
	}
	
	// finds a nice place to put the new fragment which does not overlap existing content, then appends the atoms & bonds to
    // the mol parameter
	public static void placeNewFragment(Molecule mol, Molecule frag)
	{
		if (frag.numAtoms() == 0) return;

		final float dirX[] = {1, 0, -1, 1, -1, 1, 0, -1}, dirY[] = {1, 1, 1, 0, 0, -1, -1, -1};
		float dx[] = new float[8], dy[] = new float[8], score[] = new float[8];
	
		for (int n = 0; n < 8; n++)
		{
			float vx = dirX[n], vy = dirY[n];
    
			if (n == 0 || n == 3 || n == 5) dx[n] = mol.minX() - frag.maxX();
			else if (n == 2 || n == 4 || n == 7) dx[n] = mol.maxX() - frag.minX();
			else dx[n] = 0.5f * (mol.minX() + mol.maxX() - frag.minX() - frag.maxX());

			if (n == 5 || n == 6 || n == 7) dy[n] = mol.minY() - frag.maxY();
			else if (n == 0 || n == 1 || n == 2) dy[n] = mol.maxY() - frag.minY();
			else dy[n] = 0.5f * (mol.minY() + mol.maxY() - frag.minY() - frag.maxY());
    	    
			dx[n] -= vx;
			dy[n] -= vy;
			score[n] = fragPosScore(mol, frag, dx[n], dy[n]);
    	    
			vx *= 0.25f;
			vy *= 0.25f;
			for (int iter = 100; iter > 0; iter--)
    	    {
				float iscore = fragPosScore(mol, frag, dx[n] + vx, dy[n] + vy);
				if (iscore <= score[n]) break;
				score[n] = iscore;
				dx[n] += vx;
				dy[n] += vy;
    	    }
			for (int iter = 100; iter > 0; iter--) for (int d = 0; d < 8; d++)
			{
				vx = dirX[d] * 0.1f;
				vy = dirY[d] * 0.1f;
				float iscore = fragPosScore(mol, frag, dx[n] + vx, dy[n] + vy);
				if (iscore <= score[n]) break;
				score[n] = iscore;
				dx[n] += vx;
				dy[n] += vy;
			}
    	}
    	
		int best = 0;
		for (int n = 1; n < 8; n++) if (score[n] > score[best]) best = n;

		frag = frag.clone();
		for (int n = 1; n <= frag.numAtoms(); n++) frag.setAtomPos(n, frag.atomX(n) + dx[best], frag.atomY(n) + dy[best]);
    	
    	mol.append(frag);
    }
	
    // scoring function for above: more congested is better, but any two atoms < 1A = zero; post-biased to favour square 
    // aspect ratio
	private static float fragPosScore(Molecule mol, Molecule frag, float dx, float dy)
	{
		float score = 0;
		for (int i = 1; i <= mol.numAtoms(); i++) for (int j = 1; j <= frag.numAtoms(); j++)
		{
			double ox = frag.atomX(j) + dx - mol.atomX(i), oy = frag.atomY(j) + dy - mol.atomY(i);
			double dist2 = ox * ox + oy * oy;
			if (dist2 < 1) return 0;
			score += 1 / dist2;
		}
		float minX = Math.min(frag.minX() + dx, mol.minX()), maxX = Math.max(frag.maxX() + dx, mol.maxX());
		float minY = Math.min(frag.minY() + dy, mol.minY()), maxY = Math.max(frag.maxY() + dy, mol.maxY());
		float rangeX = Math.max(1, maxX - minX), rangeY = Math.max(1, maxY - minY);
		float ratio = Math.max(rangeX / rangeY, rangeY / rangeX);
		return score / ratio;
    }

	// reduces the number of atoms until there are none that are really close together
	public static int[] mergeOverlappingAtoms(Molecule mol) {return mergeFragments(mol, 0);}
    
    // for a molecule which has been put together from two fragments, looks for atoms which overlap; the molecule is divided up
    // into {1 .. div} and {div+1 .. #atoms}, and which are matched against each other; whenever two atoms are found to overlap,
    // they are merged together; non-carbon atoms are more likely to be retained
    // the return value is a re-mapping index, i.e. ret[old_atom_number-1]=new_atom_number; whenever two atoms are merged, they both
    // end up with the same new-atom-number.
    // NOTE: special case where div==0, which makes all atoms fair game, i.e. there is no partition
    public static int[] mergeFragments(Molecule mol, int div)
    {
    	// !! METHINKS none of the calling functions use the result; change this to a void function?
    	
		final int na = mol.numAtoms();
		boolean[] omask = CoordUtil.overlappingAtomMask(mol);

		boolean[] chopmask = Vec.booleanArray(false, na);
		final float[] mx = MolUtil.arrayAtomX(mol), my = MolUtil.arrayAtomY(mol);

		int[] remap = new int[na];
		for (int n = 0; n < na; n++) remap[n] = n + 1;
    	
		int div1 = div, div2 = div + 1;
		if (div == 0) div1 = na;
    	
    	// any atoms which overlap each other in space are made into the same
		for (int i = 1; i <= div1; i++) if (omask[i - 1] && !chopmask[i - 1])
		{
			if (div == 0) div2 = i + 1;
    		
			for (int j = div2; j <= na; j++) if (omask[j - 1] && !chopmask[j - 1])
			{
				if (Util.norm2(mx[i - 1] - mx[j - 1], my[i - 1] - my[j - 1]) > CoordUtil.OVERLAP_THRESHOLD_SQ) continue;
				int oldN = j, newN = i; // remove the later one, by default

				// want to keep the more exotic of the two
				int[] exotic = new int[2];
				for (int k = 0; k < 2; k++)
        		{
					int a = k == 0 ? i : j;
        			exotic[k] = (mol.atomElement(a).equals("C") ? 0 : 1)
            				  + (mol.atomElement(a).equals("X") ? -100 : 0)
            				  + (mol.atomCharge(a) != 0 ? 1 : 0)
            				  + (mol.atomUnpaired(a) != 0 ? 1 : 0)
            				  + (mol.atomIsotope(a) != Molecule.ISOTOPE_NATURAL ? 1 : 0)
            				  + (mol.atomHExplicit(a) != Molecule.HEXPLICIT_UNKNOWN ? 1 : 0)
            				  + (MolUtil.hasAbbrev(mol, a) ? 1000 : 0);
        		}
        		
        		if (exotic[1] > exotic[0]) {oldN = i; newN = j;}
        	    
				for (int n = 1; n <= mol.numBonds(); n++)
				{
					if (mol.bondFrom(n) == oldN) mol.setBondFrom(n, newN);
					if (mol.bondTo(n) == oldN) mol.setBondTo(n, newN);
				}
				chopmask[oldN - 1] = true;
				remap[oldN - 1] = newN;
    	    }
    	}

    	// do the actual surgery
		for (int n = na; n >= 1; n--) if (chopmask[n - 1])
		{
			if (n <= div) div--;
			mol.deleteAtomAndBonds(n);
			for (int i = 0; i < na; i++) if (remap[i] > n) remap[i]--;
		}
		for (int n = mol.numAtoms(); n > div; n--) if (mol.atomElement(n).equals("X"))
		{
			mol.deleteAtomAndBonds(n);
			for (int i = 0; i < na; i++) if (remap[i] > n) remap[i]--;
		}
    	
    	MolUtil.removeDuplicateBonds(mol);
    	
    	return remap;
    }
    
    // another variation on the merge theme: the atoms indicated by 'mask' are fair-game for joining to the atoms in the rest 
    // of the molecule
    public static void mergeFragments(Molecule mol, boolean[] mask)
    {
		boolean[] chopmask = Vec.booleanArray(false, mol.numAtoms());
		final int na = mol.numAtoms();
		final float[] mx = MolUtil.arrayAtomX(mol), my = MolUtil.arrayAtomY(mol);
    	
		for (int i = 1; i <= na; i++)
			if (mask[i - 1]) for (int j = 1; j <= na; j++)
				if (!mask[j - 1] && !chopmask[j - 1]) if (Util.norm2(mx[i - 1] - mx[j - 1], my[i - 1] - my[j - 1]) < CoordUtil.OVERLAP_THRESHOLD_SQ)
    	{
			int oldN = j, newN = i; // remove the later one, by default
			if (mol.atomElement(i).equals("C") && !mol.atomElement(j).equals("C") && !mol.atomElement(j).equals("X"))
			{
				oldN = i;
				newN = j;
			} // switch
			// (any other criteria? [if so, then sync. with above])

			for (int n = 1; n <= mol.numBonds(); n++)
			{
				if (mol.bondFrom(n) == oldN) mol.setBondFrom(n, newN);
				if (mol.bondTo(n) == oldN) mol.setBondTo(n, newN);
			}

			chopmask[oldN - 1] = true;
    	}
		for (int n = chopmask.length; n >= 1; n--) if (chopmask[n - 1]) mol.deleteAtomAndBonds(n);
		MolUtil.removeDuplicateBonds(mol);
    }*/
    
    // returns whether or not there is any way in which the given values of theta can match the indicated geometry
    public static matchAngleGeometry(geom:number, theta:number[]):boolean
    {
		if (theta.length <= 1) return true; // always possible

		let match = SketchUtil.GEOM_ANGLES[geom], mtheta = Vec.numberArray(0, theta.length);
		let hit = Vec.booleanArray(false, match.length);
		for (let n = 0; n < theta.length; n++) for (let s = 1; s >= -1; s -= 2)
		{
			for (let i = 0; i < theta.length; i++) mtheta[i] = (theta[i] - theta[0]) * s;
			Vec.setTo(hit, false);
			let gotall = true;
			for (let i = 0; i < mtheta.length; i++)
			{
				let got = false;
				for (let j = 0; j < match.length; j++) if (!hit[j] && Math.abs(angleDiff(mtheta[i], match[j])) < 3 * DEGRAD)
				{
					hit[j] = true;
					got = true;
					break;
				}
				if (!got) {gotall = false; break;}
			}
			if (gotall) return true;
		}
    	
    	return false;
    }

/*
	// for a particular atom, figures out the outgoing angles that are most likely to be good for placing a new atom+bond; these
	// are found by postulating where a single bond might be drawn based on common geometries for the hybridisation, and using
	// simple geometric median-cut angles; the results are not ordered with any kind of preference
	public static primeDirections(mol:Molecule, atom:number):number[]
	{
		let angles = SketchUtil.calculateNewBondAngles(mol, atom, 1);
		let exits = SketchUtil.exitVectors(mol, atom);
		return GeomUtil.uniqueAngles(Vec.concat(angles, exits), 2 * DEGRAD);
	}
*/

	// for a given atom, calculates a set of angles that protude outward based on positions between existing bond angles; this
	// is primarily used for proposing new bond positions when the hybridisation does not match one of the common sketch geometries
	public static exitVectors(mol:Molecule, atom:number):number[]
	{
		let adj = mol.atomAdjList(atom), sz = adj.length;
		
		// if it's a singleton, return 4 points of the compass
		if (sz == 0) return [0, 90 * DEGRAD, 180 * DEGRAD, -90 * DEGRAD];

		// if it's terminal, offer nothing
		if (sz == 1) return [];

		// there is enough content, so build the angles
		let ret:number[] = [];
		let ang = GeomUtil.sortAngles(CoordUtil.atomBondAngles(mol, atom, adj));
		for (let n = 0; n < sz; n++)
		{
			let nn = n < sz - 1 ? n + 1 : 0;
			ret.push(angleNorm(ang[n] + 0.5 * (ang[nn] - ang[n])));
		}
		
		return ret;
	}

/*
	// for a given atom, considers adding a new bond/atom of the specified bond order, and returns a list of angles
	// that are appropriate given the atom's hybridisation and current geometry; if the current geometry does not match
	// any of the common sketch patterns, an empty list will be returned
	// (note: recommend using exitVectors(..) if this method returns nothing)
	public static float[] calculateNewBondAngles(Molecule mol, int atom, int order)
	{
		int[] adj = mol.atomAdjList(atom);
		final int sz = adj.length;

		// terminal atoms
		if (sz == 0)
		{
			int atno = mol.atomicNumber(atom), atblk = Chemistry.ELEMENT_BLOCKS[atno];
			if (atblk <= 2)
				return new float[]{0, 90*DR, 180*DR, -90*DR};
			else
				return new float[]{90*DR, -90*DR, 30*DR, 150*DR, 210*DR, -30*DR, 180*DR, 0*DR};
		}
	
		// obtain the "guessed" geometry options based on hybridisation, and try to map each of them onto the current
		// geometry; if any of them works, that becomes the answer
		int[] geom = guessAtomGeometry(mol, atom, order);
		float[] ang = CoordUtil.atomBondAngles(mol, atom, adj);
		for (int n = 0; n < geom.length; n++)
		{
			float[] ret = mapAngleSubstituent(geom[n], ang);
			if (ret != null) return ret;
		}
		
		// none of them match, get an empty list back
		return new float[0];
	}*/

	// considers the hybridisation state of the atom, and the order of a new bond that is about to be added, and returns
	// a list of common geometry codes that apply to the situation; returns 0-size if none are appropriate
	public static guessAtomGeometry(mol:Molecule, atom:number, order:number):number[]
	{
		let adj = mol.atomAdjList(atom);
		let sz = adj.length, atno = mol.atomicNumber(atom);
		let atblk = Chemistry.ELEMENT_BLOCKS[atno], elrow = Chemistry.ELEMENT_ROWS[atno];
		let el = mol.atomElement(atom);
	
		// sort the neighbours by priority
		let adjBO:number[] = [], adjAN:number[] = [], pri:number[] = [];
		let allSingle = true;
		for (let n = 0; n < sz; n++)
		{
			adjBO.push(mol.bondOrder(mol.findBond(atom, adj[n])));
			adjAN.push(mol.atomicNumber(adj[n]));
			pri.push(adjBO[n] * 200 + adjAN[n]);
			if (adjBO[n] != 1) allSingle = true;
		}
		for (let p = 0; p < sz - 1;)
		{
			if (pri[p] > pri[p + 1])
			{
				Vec.swap(adj, p, p + 1);
				Vec.swap(adjBO, p, p + 1);
				Vec.swap(adjAN, p, p + 1);
				Vec.swap(pri, p, p + 1);
				if (p > 0) p--;
			}
			else p++;
		}
		let ang = CoordUtil.atomBondAngles(mol, atom, adj);
	
		// if atom is terminal...
		if (sz == 1)
		{
			if (el == 'C' || el == 'N')
			{
				// allene-like
				if (adjBO[0] == 2 && order == 2) return [Geometry.Linear];

				// alkyne-like
				if ((adjBO[0] == 3 && order == 1) || (adjBO[0] == 1 && order == 3)) return [Geometry.Linear];
			}
			
			// octahedral option for d-blocks
			if (atblk > 2) return [Geometry.Octa1, Geometry.Octa2];
			
			// row 2 organics: trigonal only
			if (order != 0 && (el == 'C' || el == 'N' || el == 'O')) return [Geometry.Trigonal];
	
			// otherwise, linear and trigonal are the best options to run with
			return [Geometry.Trigonal, Geometry.Linear];
		}

		// atom is linear: orthogonal angles are implied
		if (sz == 2 && Math.abs(angleDiff(ang[0], ang[1])) >= 175 * DEGRAD)
		{
			if (atblk <= 2)
				return [Geometry.SqPlan];
			else
				return [Geometry.Octa1, Geometry.Octa2];
		}
	
		// done with special cases: include all geometries sensible for the topology
		let geom:number[] = [];
		if (atblk == 0) geom = [Geometry.Trigonal, Geometry.SqPlan];
		else if (atblk == 1) geom = [Geometry.Trigonal, Geometry.SqPlan, Geometry.Octa1, Geometry.Octa2]; 
		else if (atblk == 2)
		{
			geom.push(Geometry.Trigonal);
			if (el == 'C' && allSingle)
			{
				geom.push(Geometry.Tetra1);
				geom.push(Geometry.Tetra2);
				geom.push(Geometry.SqPlan);
			}
			else if (el == 'C' && !allSingle)
			{
				// nop
			}
			else if (elrow <= 3)
			{
				geom.push(Geometry.Tetra1);
				geom.push(Geometry.Tetra2);
				geom.push(Geometry.SqPlan);
			}
			else
			{
				geom.push(Geometry.Tetra1);
				geom.push(Geometry.Tetra2);
				geom.push(Geometry.SqPlan);
				geom.push(Geometry.Octa1);
				geom.push(Geometry.Octa2);
			}
		}
		else
		{
			geom.push(Geometry.Octa1);
			geom.push(Geometry.Octa2);
		}
		
		// remove the ones that don't fit
		for (let n = geom.length - 1; n >= 0; n--)
		{
			if (!SketchUtil.matchAngleGeometry(geom[n], ang)) geom.splice(n, 1);
		}
	
		return geom;
	}
	
	// for a given geometry code, looks for ways to map the current set of angles onto the predefined set; when a lock is
	// found, the unoccupied positions are summarised and returned; if there is no way to perform the map, null is returned
	public static mapAngleSubstituent(geom:number, ang:number[]):number[]
	{
		let gtheta = SketchUtil.GEOM_ANGLES[geom];
		const asz = ang.length, gsz = gtheta.length;

		// if there are no vacancies, stop now
		if (asz >= gsz) return null;

		// if the atom is isolated, no need to rotate or lock anything
		if (asz == 0) return gtheta.slice(0);
		
		// collect all the angles implied by the geometry, in all its degeneracy
		let vac:number[] = [];
		for (let n = 0; n < asz; n++) for (let k = 0; k < gsz; k++) for (let s = 1; s >= -1; s -= 2)
		{
			let gang:number[] = [];
			for (let i = 0; i < gsz; i++) gang.push(angleNorm(ang[n] + s * (gtheta[i] - gtheta[k])));
			let mask = Vec.booleanArray(false, gsz);
			let mcount = 0;
			for (let i = 0; i < gsz; i++) if (!mask[i]) for (let j = 0; j < asz; j++)
				if (Math.abs(angleDiff(gang[i], ang[j])) < 3 * DEGRAD)
			{
				mask[i] = true;
				mcount++;
				break;
			}
			if (mcount != asz) continue;
			for (let i = 0; i < gsz; i++) if (!mask[i]) vac.push(gang[i]);
		}
		if (vac.length == 0) return null;
		
		// sort and remove degenerates
		vac = GeomUtil.sortAngles(vac);
		for (let n = 0; n < vac.length - 1; n++)
		{
			let th1 = vac[n], th2 = vac[n + 1], dth = angleDiff(th2, th1);
			if (Math.abs(dth) < 5 * DEGRAD)
			{
				vac[n] = th1 + 0.5 * dth;
				vac.splice(n + 1, 1);
				n--;
			}
		}
		
		return vac;	
	}

/*
    // for a given molecule, ensures that a specific atom fits a given geometry template; if so, returns null; if not, looks for
    // a way to fit the bonds into the geometry template with minimum perturbation, and applies the result by rotating the
    // bonds as necessary; bonds that occur in rings constrain the options significantly
	public static Molecule refitAtomGeometry(Molecule mol, int atom, int geom)
	{
		float[] gtheta = GEOM_ANGLES[geom];
		final int gsz = gtheta.length;

		int[] adj = mol.atomAdjList(atom);
		final int asz = adj.length;

		// must be nore than one atom, and cannot exceed the geometry extent
		if (asz <= 1 || asz > gsz) return null;

		float[] ang = CoordUtil.atomBondAngles(mol, atom, adj);
		boolean[] inRing = new boolean[asz];
		boolean allInRing = true;
		for (int n = 0; n < asz; n++)
		{
			inRing[n] = mol.bondInRing(mol.findBond(atom, adj[n]));
			if (!inRing[n]) allInRing = false;
		}
		if (allInRing) return null; // can't work with this

		// start looking for the best set-of-angles for the new geometry
		float[] bestAng = null;
		float bestScore = 0;
		float[] ww = MolUtil.calculateWalkWeight(mol, atom);
		
		for (int i = 0; i < gsz; i++) for (int j = 0; j < asz; j++) for (int s = 1; s >= -1; s -= 2)
		{
			float[] newAng = new float[asz];
			boolean[] mask = Vec.booleanArray(false, gsz);
			
			for (int n1 = 0; n1 < asz; n1++)
			{
				int best = -1;
				float bdiff = 0;
				for (int n2 = 0; n2 < gsz; n2++) if (!mask[n2])
    			{
    				float th = Util.angleNorm(gtheta[n2] * s - gtheta[i] + ang[j]);
    				float diff = Math.abs(Util.angleDiff(th, ang[n1]));
    				if (best < 0 || diff < bdiff)
    				{
    					best = n2;
    					bdiff = diff;
    					newAng[n1] = th;
    				}
    			}
				mask[best] = true;
			}
			
			boolean ringClash = false;
			for (int n = 0; n < asz; n++) if (inRing[n] && Math.abs(Util.angleDiff(newAng[n], ang[n])) > 2 * DR)
			{
				ringClash = true;
				break;
			}
			if (ringClash) continue;
			
			float score = 0;
			for (int n = 0; n < asz; n++) score += ww[adj[n] - 1] * Math.abs(Util.angleDiff(newAng[n], ang[n]));
			if (bestAng == null || score < bestScore)
			{
				bestAng = newAng;
				bestScore = score;
			}
		}
	
		if (bestAng == null) return null;

		// if the best one is basically what we already have, then fail
		boolean same = true;
		for (int n = 0; n < asz; n++) if (Math.abs(Util.angleDiff(bestAng[n], ang[n])) > 2 * DR) {same = false; break;}
		if (same) return null;
		
		// apply the changes
		mol = mol.clone();
		for (int n = 0; n < asz; n++) if (!inRing[n]) rotateBond(mol, atom, adj[n], bestAng[n] - ang[n]);
		return mol;
    }

	// for a given source atom, and one-or-more adjacent atoms, and a list of possible geometries, propose
	// a molecule in which one of the adjacent atoms has been rotated around to lock into the next geometry-valid
	// position; return value of null means that no new options were discovered
	// note: it is assumed that the adjacent atoms are terminal
	public static Molecule switchAtomGeometry(Molecule mol, int src, int[] dst, int[] geoms)
	{
		int bestAtom = 0;
		float bestAng = 0, bestX = 0, bestY = 0;
		int[] adj = mol.atomAdjList(src);
		float[] ang = CoordUtil.atomBondAngles(mol, src, adj), theta = new float[ang.length - 1];
		final float cx = mol.atomX(src), cy = mol.atomY(src);
		
		for (int i = 0; i < dst.length; i++)
		{
			int a = Vec.indexOf(dst[i], adj);
			float curth = ang[a];
			for (int n = 0, p = 0; n < adj.length; n++)
				if (n != a) theta[p++] = ang[n];
			float r = Util.norm(mol.atomX(dst[i]) - cx, mol.atomY(dst[i]) - cy);

			for (int j = 0; j < geoms.length; j++)
			{
				if (adj.length >= SketchUtil.GEOM_ANGLES[geoms[j]].length) continue;

				float[] newAng = SketchUtil.mapAngleSubstituent(geoms[j], theta);
				if (newAng != null) for (int n = 0; n < newAng.length; n++)
				{
					float dth = Util.angleDiff(newAng[n], curth);
					if (Math.abs(dth) < 3 * DR) continue;
					if (dth < 0) dth += Util.TWOPI_F;

					if (bestAtom == 0 || dth < bestAng - 2 * DR || (dth < bestAng + 2 * DR && dst[i] < bestAtom))
					{
						float x = cx + r * (float) Math.cos(newAng[n]);
						float y = cy + r * (float) Math.sin(newAng[n]);
						if (CoordUtil.atomAtPoint(mol, x, y) != 0) continue;

						bestAtom = dst[i];
						bestAng = dth;
						bestX = x;
						bestY = y;
					}
				}

				// note: this means only the first geometry is used; seems to work best this way
				break;
			}
		}
		
		if (bestAtom == 0) return null;

		// apply the changes
		mol = mol.clone();
		mol.setAtomPos(bestAtom, bestX, bestY);
		return mol;
    }
    
	// for a bond between (catom,xatom), that is presumed to be not in a ring, rotates the xatom fragment using catom
	// as the centroid
	public static void rotateBond(Molecule mol, int catom, int xatom, float angle)
	{
		angle = Util.angleNorm(angle);
		if (Math.abs(angle) < 0.1f * DR) return;

		// clone the molecule in order to get connected components minus the bond
		Molecule ccmol = mol.clone();
		int[] adj = ccmol.atomAdjList(catom);
		for (int n = 0; n < adj.length; n++) ccmol.deleteBond(ccmol.findBond(catom, adj[n]));

		// perform the rotation
		final float cx = mol.atomX(catom), cy = mol.atomY(catom);
		final float cosTheta = (float) Math.cos(angle), sinTheta = (float) Math.sin(angle);
		for (int n = 1; n <= mol.numAtoms(); n++) if (ccmol.atomConnComp(n) == ccmol.atomConnComp(xatom))
		{
			final float x = mol.atomX(n) - cx, y = mol.atomY(n) - cy;
			mol.setAtomPos(n, cx + x * cosTheta - y * sinTheta, cy + x * sinTheta + y * cosTheta);
		}
	}

	// for a list of atoms, consider all pairwise combinations for potentially connecting up; the basic idea is that atoms which are not
	// bonded, but are very near the ideal bond distance, always get connected; if there are none of these, it picks the two atoms which
	// are closest together; the return value if an array of pairs, i.e. {from1,to1,from2,to2,...}
	// NOTE: it will not add bonds between any two atoms which are in the same ring block; this makes it too easy to accidently create
	// systems which are too interconnected
	public static int[] pickAtomsToConnect(Molecule mol, int[] aidx)
	{
		if (aidx.length < 2) return null;
		if (aidx.length == 2)
		{
			if (mol.findBond(aidx[0], aidx[1]) > 0) return null;
			return aidx;
		}

		// multiple atoms, so pass down the list looking for inspiration
		final float AUTO_DSQ = Util.sqr(Molecule.IDEALBOND + 0.1f);
		float bestDSQ = Float.MAX_VALUE;
		int bestA1 = 0, bestA2 = 0;

		IntVector conn = new IntVector();
		
		for (int i = 0; i < aidx.length - 1; i++) for (int j = i + 1; j < aidx.length; j++)
		{
			if (mol.findBond(aidx[i], aidx[j]) > 0) continue;
			float dsq = Util.norm2(mol.atomX(aidx[i]) - mol.atomX(aidx[j]), mol.atomY(aidx[i]) - mol.atomY(aidx[j]));
			if (dsq < AUTO_DSQ) {conn.add(aidx[i]); conn.add(aidx[j]);}
			else if (dsq < bestDSQ) {bestDSQ = dsq; bestA1 = aidx[i]; bestA2 = aidx[j];}
		}
		if (conn.size() == 0 && bestA1 != 0) {conn.add(bestA1); conn.add(bestA2);}
		
		return conn.size() == 0 ? null : conn.getData();
	}
	
	// for a given atom and a list of directions in which a new atom+bond might be created, return which is preferable
	public static float pickNewAtomDirection(Molecule mol, int atom, float[] theta)
	{
		if (theta.length == 1) return theta[0];
	
		float bestTheta = theta[0], bestScore = Float.MAX_VALUE;
		for (int n = 0; n < theta.length; n++)
		{
			float px = mol.atomX(atom) + Molecule.IDEALBOND * (float) Math.cos(theta[n]);
			float py = mol.atomY(atom) + Molecule.IDEALBOND * (float) Math.sin(theta[n]);

			float score = CoordUtil.congestionPoint(mol, px, py);
			if (score > bestScore) continue;
			if (CoordUtil.overlapsAtom(mol, px, py, 0.2f)) score += 1E5f;
			if (score < bestScore) {bestTheta = theta[n]; bestScore = score;}
		}
		return bestTheta;
    }
    
    // for atoms qualifying with the given mask, any group of more than one atom that overlap, merges them together
	public static Molecule joinOverlappingAtoms(Molecule mol, boolean[] mask)
	{
		mask = Vec.duplicate(mask); // gonna modify it

		final int na = mol.numAtoms();
		final float[] mx = MolUtil.arrayAtomX(mol), my = MolUtil.arrayAtomY(mol);

		ArrayList<IntVector> groups = new ArrayList<>();
		FloatVector groupX = new FloatVector(), groupY = new FloatVector();

		mol = mol.clone();

		// find all the groups
		for (int i = 0; i < na - 1; i++) if (mask[i])
		{
			IntVector g = new IntVector();
			g.add(i + 1);
			float x = mx[i], y = my[i];
			for (int j = i + 1; j < na; j++) if (mask[j])
			{
				if (Util.norm2(mx[j] - mx[i], my[j] - my[i]) > CoordUtil.OVERLAP_THRESHOLD_SQ) continue;
				g.add(j + 1);
				x += mx[j];
				y += my[j];

				// repurpose all bonds from j -> i
				int[] adjb = mol.atomAdjBonds(j + 1);
				for (int n = 0; n < adjb.length; n++)
				{
					if (mol.bondFrom(adjb[n]) == j + 1) mol.setBondFrom(adjb[n], i + 1);
					else if (mol.bondTo(adjb[n]) == j + 1) mol.setBondTo(adjb[n], i + 1);
				}
			}
			if (g.size() == 1) continue;
			final float inv = 1.0f / g.size();

			groups.add(g);
			groupX.add(x * inv);
			groupY.add(y * inv);
		}
		
		if (groups.size() == 0) return null;

		// now perform the surgery
		boolean[] keepmask = Vec.booleanArray(true, na);
		for (int n = 0; n < groups.size(); n++)
		{
			IntVector g = groups.get(n);
			mol.setAtomPos(g.get(0), groupX.get(n), groupY.get(n));
			for (int i = 1; i < g.size(); i++) keepmask[g.get(i) - 1] = false;
		}
		mol = MolUtil.subgraph(mol, keepmask);
		MolUtil.removeDuplicateBonds(mol);
		return mol;
	}

	// for the group of atoms defined by the mask, moves them all out to the far edge, as defined by dx/dy (should be 0/1/-1);
	// returns null if the operation is invalid for any reason, e.g. the atoms are already along the specified edge
	public static Molecule moveToEdge(Molecule mol, boolean[] mask, int dx, int dy)
	{
		boolean gotS = false, gotN = false;
		float sx1 = 0, sy1 = 0, sx2 = 0, sy2 = 0;
		float nx1 = 0, ny1 = 0, nx2 = 0, ny2 = 0;

		for (int n = 1; n <= mol.numAtoms(); n++)
		{
			float x = mol.atomX(n), y = mol.atomY(n);
			if (mask[n - 1])
			{
				if (!gotS || x < sx1) sx1 = x;
				if (!gotS || y < sy1) sy1 = y;
				if (!gotS || x > sx2) sx2 = x;
				if (!gotS || y > sy2) sy2 = y;
				gotS = true;
			}
			else
			{
				if (!gotN || x < nx1) nx1 = x;
				if (!gotN || y < ny1) ny1 = y;
				if (!gotN || x > nx2) nx2 = x;
				if (!gotN || y > ny2) ny2 = y;
				gotN = true;
			}
		}

		// check to see if it's already at the farthest extent
		final float SEPARATE = 1.0f, SEPTEST = 0.9f;
		if ((dx < 0 && dy == 0 && sx2 <= nx1 - SEPTEST) ||
			(dx > 0 && dy == 0 && sx1 >= nx2 + SEPTEST) ||
			(dx == 0 && dy < 0 && sy2 <= ny1 - SEPTEST) ||
			(dx == 0 && dy > 0 && sy1 >= ny2 + SEPTEST))
		{
			return null;
		}

		// apply the move
		mol = mol.clone();
		float ox = 0, oy = 0;
		if (dx < 0) ox = nx1 - sx2 - SEPARATE;
		if (dx > 0) ox = nx2 - sx1 + SEPARATE;
		if (dy < 0) oy = ny1 - sy2 - SEPARATE;
		if (dy > 0) oy = ny2 - sy1 + SEPARATE;
		for (int n = 1; n <= mol.numAtoms(); n++) if (mask[n - 1]) mol.setAtomPos(n, mol.atomX(n) + ox, mol.atomY(n) + oy);
		
		return mol;
	}
	
	// adds some number of additional hydrogen atoms to a parent atom, and selects reasonable position coordinates for them
	public static void placeAdditionalHydrogens(Molecule mol, int atom, int numH)
	{
		final int base = mol.numAtoms();
		final float x0 = mol.atomX(atom), y0 = mol.atomY(atom);
    
		int[] adj = mol.atomAdjList(atom);

		// special deal: adding 2 hydrogens to a divalent atom in bent form
		if (adj.length == 2 && numH == 2)
    	{
			final float th1 = Util.atan2(mol.atomY(adj[0]) - y0, mol.atomX(adj[0]) - x0);
			final float th2 = Util.atan2(mol.atomY(adj[1]) - y0, mol.atomX(adj[1]) - x0);
			if (Math.abs(Util.angleDiff(th1, th2)) < 170 * Util.DEGRAD_F)
			{
				//float theta=GeomUtil.emergentAngle(new float[]{th1,th2})+Util.PI_F;
				final float theta = 0.5f * (th1 + th2) + Util.PI_F;
				final float th3 = theta - 30 * Util.DEGRAD_F, th4 = theta + 30 * Util.DEGRAD_F;
				mol.addAtom("H", x0 + Molecule.IDEALBOND * Util.cos(th3), y0 + Molecule.IDEALBOND * Util.sin(th3));
				mol.addAtom("H", x0 + Molecule.IDEALBOND * Util.cos(th4), y0 + Molecule.IDEALBOND * Util.sin(th4));
				mol.addBond(atom, base + 1, 1);
				mol.addBond(atom, base + 2, 1);
				return;
			}
		}
    	
    	// special deal: adding 3 hydrogens to a terminal atom
		if (adj.length == 1 && numH == 3)
		{
			final float th1 = Util.atan2(mol.atomY(adj[0]) - y0, mol.atomX(adj[0]) - x0);
			final float th2 = th1 + 90 * Util.DEGRAD_F, th3 = th1 + 180 * Util.DEGRAD_F, th4 = th1 + 270 * Util.DEGRAD_F;
			mol.addAtom("H", x0 + Molecule.IDEALBOND * Util.cos(th2), y0 + Molecule.IDEALBOND * Util.sin(th2));
			mol.addAtom("H", x0 + Molecule.IDEALBOND * Util.cos(th3), y0 + Molecule.IDEALBOND * Util.sin(th3));
			mol.addAtom("H", x0 + Molecule.IDEALBOND * Util.cos(th4), y0 + Molecule.IDEALBOND * Util.sin(th4));
			mol.addBond(atom, base + 1, 1);
			mol.addBond(atom, base + 2, 1);
			mol.addBond(atom, base + 3, 1);
			return;
		}
    	
		// otherwise: add one, then recurse
		float theta = pickNewAtomDirection(mol, atom, primeDirections(mol, atom));
		mol.addAtom("H", x0 + Molecule.IDEALBOND * Util.cos(theta), y0 + Molecule.IDEALBOND * Util.sin(theta));
		mol.addBond(atom, base + 1, 1);
		if (numH > 1) placeAdditionalHydrogens(mol, atom, numH - 1);
    }
*/

    // returns a list of outgoing angles; unlike primeDirections, which tries to narrow the list as much as possible, this function
    // tries to be generous and include anything remotely plausible: the intent is for helping out an interactive session where a precise
    // pointing device is available
    public static allViableDirections(mol:Molecule, atom:number, order:number):number[]
    {
        if (mol.atomAdjCount(atom) == 0)
        {
			let angles:number[] = [];
			for (let n = 0; n < 12; n++) angles.push(30 * DEGRAD);
        	return angles;
        }

        // all that applies
        let adj = mol.atomAdjList(atom);
        let angles = SketchUtil.exitVectors(mol, atom);
        
        let geom = SketchUtil.guessAtomGeometry(mol, atom, order);
        if (adj.length == 1 && geom.indexOf(Geometry.Linear) < 0) geom.push(Geometry.Linear);
		let bndang = CoordUtil.atomBondAngles(mol, atom, adj);
        for (let g of geom)
        {
			let map = SketchUtil.mapAngleSubstituent(g, bndang);
			if (map != null) for (let th of map) angles.push(th);
        }
        
        return GeomUtil.uniqueAngles(angles, 2 * DEGRAD);    
	}
    
    // simple new rings grafted onto existing components, or not
    public static proposeNewRing(mol:Molecule, rsz:number, x:number, y:number, dx:number, dy:number, snap:boolean):[number[], number[]]
    {
		let theta = Math.atan2(dy, dx)
		if (snap)
		{
            const chunk = 30 * DEGRAD;
			theta = Math.round(theta / chunk) * chunk;
		}
		return SketchUtil.positionSimpleRing(mol, rsz, x, y, theta)
    }
    public static proposeAtomRing(mol:Molecule, rsz:number, atom:number, dx:number, dy:number):[number[], number[]]
    {
		/*
		var thsnap:number[] = SketchUtil.allViableDirections(mol, atom, 1);
		if (mol.atomAdjCount(atom) == 1)
		{
			let nbr = mol.atomAdjList(atom)[0];
			let theta = Math.atan2(mol.atomY(nbr) - mol.atomY(atom), mol.atomX(nbr) - mol.atomX(atom));
			thsnap.push(theta);
			thsnap = uniqueAngles(thsnap, 2.0 * DEGRAD);
		}
		// (tempting to have it snap to sidebonds, but the correct way to do that is to drag from the bond rather than the atom)
        */
        
        let thsnap:number[] = [];
        let cx = mol.atomX(atom), cy = mol.atomY(atom);
        if (mol.atomAdjCount(atom) == 0)
        {
            for (let n = 0; n < 12; n++) thsnap.push(TWOPI * n / 12);
        }
        else if (mol.atomAdjCount(atom) == 1)
        {
            let nbr = mol.atomAdjList(atom)[0];
            thsnap.push(angleNorm(Math.atan2(mol.atomY(nbr) - cy, mol.atomX(nbr) - cx) + Math.PI));
        }
        else
        {
            let angs:number[] = [];
            for (let nbr of mol.atomAdjList(atom)) angs.push(Math.atan2(mol.atomY(nbr) - cy, mol.atomX(nbr) - cx));
            angs = sortAngles(angs);
            for (let n = 0; n < angs.length; n++)
            {
                let th1 = angs[n], th2 = angs[n < angs.length - 1 ? n + 1 : 0];
                thsnap.push(th1 + 0.5 * angleDiffPos(th2, th1));
            } 
        }

        let theta = Math.atan2(dy, dx);
		var bestTheta = 0, bestDelta = Number.MAX_VALUE
		for (let th of thsnap)
		{
			let delta = Math.abs(angleDiff(th, theta));
			if (delta < bestDelta) {bestTheta = th; bestDelta = delta;}
		}
        
		return SketchUtil.positionSimpleRing(mol, rsz, mol.atomX(atom), mol.atomY(atom), bestTheta);
    }
    public static proposeBondRing(mol:Molecule, rsz:number, bond:number, dx:number, dy:number):[number[], number[]]
    { 
        let bfr = mol.bondFrom(bond), bto = mol.bondTo(bond);
		let bx = mol.atomX(bto) - mol.atomX(bfr), by = mol.atomY(bto) - mol.atomY(bfr);
		let sign = dx * by - dy * bx;
		
		let delta = sign > 0 ? -90 * DEGRAD : 90 * DEGRAD;
		let theta = Math.atan2(by, bx) + delta;
		
		let dth = TWOPI / rsz;
		let rad = Molecule.IDEALBOND / (2.0 * Math.sin(0.5 * dth)), brad = rad * Math.cos(0.5 * dth);
		let cx = 0.5 * (mol.atomX(bfr) + mol.atomX(bto)) + brad * Math.cos(theta);
		let cy = 0.5 * (mol.atomY(bfr) + mol.atomY(bto)) + brad * Math.sin(theta);
		
		let rx:number[] = [], ry:number[] = [];
        for (let n = 0; n < rsz; n++)
		{
			let th = theta - Math.PI + (n - 0.5) * dth;
			rx.push(cx + Math.cos(th) * rad);
			ry.push(cy + Math.sin(th) * rad);
		}
		
		let [i1, i2] = sign < 0 ? [bfr, bto] : [bto, bfr];
		rx[0] = mol.atomX(i1);
		ry[0] = mol.atomY(i1);
		rx[1] = mol.atomX(i2);
		ry[1] = mol.atomY(i2);
		
		return [rx, ry];
	}

	// simple ring attachments, to an atom/bond/point, with a guide vector to collapse the options for direction; returns arrays for X and Y 
	// points for the ring that ought to be created from these parameters; note
	public static positionSimpleRing(mol:Molecule, rsz:number, x:number, y:number, theta:number):[number[], number[]]
	{
        let dth = TWOPI / rsz;
        let rad = Molecule.IDEALBOND / (2 * Math.sin(0.5 * dth));
		let cx = x + rad * Math.cos(theta), cy = y + rad * Math.sin(theta);
		
        let rx:number[] = [], ry:number[] = [];
        for (let n = 0; n < rsz; n++)
		{
            let th = theta - Math.PI + n * dth;
            rx.push(cx + Math.cos(th) * rad);
			ry.push(cy + Math.sin(th) * rad);
		}
		
		return [rx, ry];
	}

	// determines a list of "sprouts" for a given atom, namely exterior guides that are suitable for skething new bonds to
	public static guidelineSprouts(mol:Molecule, atom:number):GuidelineSprout[]
	{
		let sprouts:GuidelineSprout[] = [];

		// do calculations for orders 1..3, and merge any that are duplicates (1 & 2 are typically the same, while 3 is frequently different)
		let angs:number[][] = [], ords:number[][] = [];
		for (let n = 0; n < 3; n++)
		{
			angs.push(SketchUtil.allViableDirections(mol, atom, n + 1));
			ords.push([n + 1]);
			for (let i = 0; i < n; i++) if (angs[i] != null && Vec.equals(angs[n], angs[i])) 
			{
				angs[n] = null;
				ords[i].push(n + 1);
			}
		}

		// add sprouts, using Cartesian coordinates
		const cx = mol.atomX(atom), cy = mol.atomY(atom);
		for (let n = 0; n < 3; n++) if (angs[n] != null)
		{
			let sprout:GuidelineSprout =
			{
				'atom': atom,
				'orders': ords[n],
				'x': [],
				'y': [],
			};
			for (let i = 0; i < angs[n].length; i++)
			{
				sprout.x[i] = cx + Math.cos(angs[n][i]) * Molecule.IDEALBOND;
				sprout.y[i] = cy + Math.sin(angs[n][i]) * Molecule.IDEALBOND;
			}
			sprouts.push(sprout);
		}
		return sprouts;
	}
}
