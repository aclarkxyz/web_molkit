/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='Molecule.ts'/>

/*
	MolUtil: static methods for calculating molecule properties.
*/

class MolUtil
{
    public static TEMPLATE_ATTACHMENT = "X";
    public static ABBREV_ATTACHMENT = "*";
    
    public static isBlank(mol:Molecule):boolean
    {
        return mol == null || mol.numAtoms() == 0;
    }
    public static notBlank(mol:Molecule):boolean
    {
        return mol != null || mol.numAtoms() > 0;
    }

    /*	// substitutes an empty molecule for null
	public static Molecule orBlank(Molecule mol) {return mol == null ? new Molecule() : mol;}

	// conventions for special-atoms
	public static final String TEMPLATE_ATTACHMENT = "X"; // use the label 'X' to denote attachments when defining templates
	public static final String ABBREV_ATTACHMENT = "*"; // within abbreviations, use '*' to denote the placeholder superimposition

	// returns true if there are any abbreviations
	public static boolean hasAnyAbbrev(Molecule mol)
	{
		for (int n = 1; n <= mol.numAtoms(); n++) if (hasAbbrev(mol, n)) return true;
		return false;
	}

	// returns true if the atom index is an inline abbreviation
	public static boolean hasAbbrev(Molecule mol, int atom)
	{
		String[] extra = mol.atomExtra(atom);
		for (int n = 0; n < (extra == null ? 0 : extra.length); n++) if (extra[n].startsWith("a")) return true;
		return false;
	}

    // if the molecule has a template abbreviation encoded at the given atom, it will be parsed into a fragment instance and
    // returned; for the embedded fragment, atom#1 is considered to be the site of attachment
    public static Molecule getAbbrev(Molecule mol, int N)
    {
		String[] extra = mol.atomExtra(N);
		for (int n = 0; n < (extra != null ? extra.length : 0); n++) if (extra[n].startsWith("a"))
		{
			return Molecule.fromString(extra[n].substring(1));
		}
    	return null;
    }
    
    // sets the abbreviation-template for the given atom number, eliminating any existing template at that point
	public static void setAbbrev(Molecule mol, int atom, Molecule frag)
	{
		int attidx = 0;
		for (int n = 1; n <= frag.numAtoms(); n++) if (frag.atomElement(n).equals(ABBREV_ATTACHMENT))
    	{
			if (attidx > 0) throw new MoleculeCalcException("Multiple attachment points indicated: invalid.");
			attidx = n;
    	}
		if (attidx == 0) throw new MoleculeCalcException("No attachment points indicated.");
		if (attidx >= 2)
    	{
			frag = frag.clone();
			frag.swapAtoms(attidx, 1);
    	}
        
		int[] adj = mol.atomAdjList(atom);
		if (adj.length > 1) throw new MoleculeCalcException("Setting abbreviation for non-terminal atom.");
		if (frag.atomAdjCount(1) == 1 && mol.atomAdjCount(atom) > 0)
		{
			int b1 = mol.findBond(atom, mol.atomAdjList(atom)[0]);
			int b2 = frag.findBond(1, frag.atomAdjList(1)[0]);
			mol.setBondOrder(b1, frag.bondOrder(b2));
		}
        
        // finally we're allowed to set it
		String[] extra = mol.atomExtra(atom);
		int idx = -1;
    	for (int n = 0; n < (extra != null ? extra.length : 0); n++) if (extra[n].startsWith("a")) {idx = n; break;}
    	if (idx < 0) {extra = Vec.resize(extra, extra == null ? 1 : extra.length + 1); idx = extra.length - 1;}
    	
		extra[idx] = "a" + frag.toString();

		mol.setAtomExtra(atom, extra);
    }

    // any invalid abbreviations will be cleared out
    public static void validateAbbrevs(Molecule mol)
    {
		for (int n = 1; n <= mol.numAtoms(); n++) if (MolUtil.hasAbbrev(mol, n))
    	{
			if (mol.atomAdjCount(n) > 1) MolUtil.clearAbbrev(mol, n);
			if (mol.atomCharge(n) != 0) mol.setAtomCharge(n, 0);
			if (mol.atomUnpaired(n) != 0) mol.setAtomUnpaired(n, 0);
			if (mol.atomIsotope(n) != 0) mol.setAtomIsotope(n, Molecule.ISOTOPE_NATURAL);
			if (mol.atomHExplicit(n) != Molecule.HEXPLICIT_UNKNOWN) mol.setAtomHExplicit(n, Molecule.HEXPLICIT_UNKNOWN);
    	}
    }
    
    // converts a partitioned molecule into a molecule with a subsumed abbreviation; srcmask defines all the atoms which are not part
    // of the abbreviation; the resulting molecule will contain all of these, plus a new one that has been created to hold the 
    // abbreviation; the molecule  must be partitioned so that there is exactly 1 source atom attached to all of the abbreviations
    // NOTE: returns null if the template creation is invalid
	public static Molecule convertToAbbrev(Molecule mol, boolean[] srcmask, String abbrevName)
	{
		int junction = 0;
		for (int n = 1; n <= mol.numBonds(); n++)
		{
			int b1 = mol.bondFrom(n), b2 = mol.bondTo(n), atom = 0;
			if (srcmask[b1 - 1] && !srcmask[b2 - 1]) atom = b1;
			else if (!srcmask[b1 - 1] && srcmask[b2 - 1]) atom = b2;
			if (atom == 0) continue;

			if (junction > 0 && atom != junction) return null;
			junction = atom;
		}
		if (junction == 0) return null;
    	
		// refine the partition based on the junction, and derive reference indices
		int na = mol.numAtoms(), molidx = 0, fragidx = 0;
		boolean[] maskmol = new boolean[na], maskfrag = new boolean[na];
		for (int n = 0; n < na; n++)
		{
			maskmol[n] = srcmask[n];
			maskfrag[n] = !srcmask[n] || n + 1 == junction;
			if (maskmol[n] && n + 1 <= junction) molidx++;
			if (maskfrag[n] && n + 1 <= junction) fragidx++;
		}
    	
		// create and analyse the fragment
		Molecule frag = MolUtil.subgraph(mol, maskfrag);
		frag.setAtomElement(fragidx, ABBREV_ATTACHMENT);
		frag.setAtomCharge(fragidx, 0);
		frag.setAtomUnpaired(fragidx, 0);
		frag.setAtomHExplicit(fragidx, Molecule.HEXPLICIT_UNKNOWN);
		frag.setAtomMapNum(fragidx, 0);
		frag.setAtomExtra(fragidx, null);
		frag.setAtomTransient(fragidx, null);
		int[] adj = frag.atomAdjList(fragidx);
		float x = 0, y = 0, inv = 1.0f / adj.length;
		int bondOrder = 1;
		for (int n = 0; n < adj.length; n++)
		{
			x += frag.atomX(adj[n]);
			y += frag.atomY(adj[n]);
			int b = frag.findBond(fragidx, adj[n]);
			if (n == 0) bondOrder = frag.bondOrder(b);
			else if (bondOrder != frag.bondOrder(b)) bondOrder = 1;
		}
		x *= inv; y *= inv;
    
		// create the excised molecule, and add in the fragment
		Molecule newmol = MolUtil.subgraph(mol, maskmol);
		int newatom = newmol.addAtom(abbrevName, x, y);
		newmol.addBond(molidx, newatom, bondOrder);
		MolUtil.setAbbrev(newmol, newatom, frag);
    
    	return newmol;
    }
    
    // hunts through any abbreviations, and expands them out to form actual atoms; the resulting representation is fair game for things 
    // like MF/MW calculations, or any other pure-atom property calculation; if alignCoords is true, it will line up the positions of
    // the new atoms; if false, the algorithm will burn up less cycles; note that abbreviations-within-abbreviations are handled by 
    // repeated iteration until there are none left
	public static void expandAbbrevs(Molecule mol, boolean alignCoords)
	{
		while (true)
		{
			boolean anything = false;
			for (int n = 1; n <= mol.numAtoms(); n++) if (MolUtil.hasAbbrev(mol, n))
			{
				if (MolUtil.expandOneAbbrev(mol, n, alignCoords)) anything = true;
				n--;
			}
			if (!anything) break;
		}
	}

    // expands the abbreviation for a single atom; the atom itself is deleted, and the expanded content is added to the end of the molecule; if for some
    // reason the abbreviation is invalid, will clear the abbreviation instead
    // return value: true if any abbreviations were successfully expanded out
	public static boolean expandOneAbbrev(Molecule mol, int atom, boolean alignCoords)
	{
		Molecule frag = MolUtil.getAbbrev(mol, atom);
		if (frag == null) return false;
		if (mol.atomAdjCount(atom) != 1 || frag.numAtoms() == 0)
		{
			MolUtil.clearAbbrev(mol, atom);
			return false;
		}
		
    	int m = mol.atomMapNum(atom);
    	if (m > 0) for (int n : frag.atomAdjList(1)) frag.setAtomMapNum(n, m);

		expandOneAbbrev(mol, atom, frag, alignCoords);
		return true;
	}
	public static void expandOneAbbrev(Molecule mol, int atom, Molecule frag, boolean alignCoords)
	{
		int nbr = mol.atomAdjCount(atom) == 1 ? mol.atomAdjList(atom)[0] : 0;
    
		if (alignCoords)
		{
			float vx1 = mol.atomX(atom) - mol.atomX(nbr), vy1 = mol.atomY(atom) - mol.atomY(nbr);
			int[] adj = frag.atomAdjList(1);
			float vx2 = 0, vy2 = 0, inv = 1.0f / adj.length;
			for (int n = 0; n < adj.length; n++)
			{
				vx2 += frag.atomX(adj[n]) - frag.atomX(1);
				vy2 += frag.atomY(adj[n]) - frag.atomY(1);
			}
			vx2 *= inv;
			vy2 *= inv;
			float th1 = Util.atan2(vy1, vx1), th2 = Util.atan2(vy2, vx2);
			CoordUtil.rotateMolecule(frag, th1 - th2);
			CoordUtil.translateMolecule(frag, mol.atomX(nbr) - frag.atomX(1), mol.atomY(nbr) - frag.atomY(1));
		}
    	
		int join = mol.numAtoms() + 1;
		mol.append(frag);
		for (int n = 1; n <= mol.numBonds(); n++)
		{
			if (mol.bondFrom(n) == join) mol.setBondFrom(n, nbr);
			if (mol.bondTo(n) == join) mol.setBondTo(n, nbr);
		}
		mol.deleteAtomAndBonds(join);
		mol.deleteAtomAndBonds(atom);
    }

    // removes the abbreviation from a molecule, if there is one; also, the element symbol will be set to "C" when there is
    // any clearing to be done
	public static void clearAbbrev(Molecule mol, int N)
	{
		String[] extra = mol.atomExtra(N);
		for (int n = 0; n < (extra != null ? extra.length : 0); n++) if (extra[n].startsWith("a"))
		{
			extra = Vec.remove(extra, n);
			mol.setAtomExtra(N, extra);
			mol.setAtomElement(N, "C");
			return;
		}
	}
    
    // equivalent to the Molecule method of same name, except trashes the abbreviation of the "element" symbol has changed
	public static void setAtomElement(Molecule mol, int N, String el)
	{
		if (mol.atomElement(N).equals(el)) return;
		clearAbbrev(mol, N);
		mol.setAtomElement(N, el);
	}
    
    // equivalent to the Molecule method of same name, except that if either of the atoms are about to exceed divalence, its
    // abbreviation gets zapped; also, if the bond was already there, zaps the old one
	public static int addBond(Molecule mol, int bfr, int bto, int order)
	{
		return addBond(mol, bfr, bto, order, Molecule.BONDTYPE_NORMAL);
	}
	public static int addBond(Molecule mol, int bfr, int bto, int order, int type)
	{
		if (mol.atomAdjCount(bfr) >= 1) clearAbbrev(mol, bfr);
		if (mol.atomAdjCount(bto) >= 1) clearAbbrev(mol, bto);
		int b = mol.findBond(bfr, bto);
		if (b > 0) mol.deleteBond(b);
		return mol.addBond(bfr, bto, order, type);
	}

   	// returns a molecule which is smaller than the current one, according to the mask (which must be of size #atoms); boundary cases
    // are a null molecule or cloned copy
	public static Molecule subgraph(Molecule mol, boolean[] mask)
	{
		int[] invidx = new int[mol.numAtoms()];
		int sum = 0;
		for (int n = 0; n < mol.numAtoms(); n++) 
		{
			if (mask[n]) invidx[n] = ++sum; else invidx[n] = 0;
		}
		if (sum == 0) return new Molecule();
		if (sum == mol.numAtoms()) return mol.clone();
    	
		Molecule frag = new Molecule();
		for (int n = 1; n <= mol.numAtoms(); n++) if (mask[n - 1])
		{
			int num = frag.addAtom(mol.atomElement(n), mol.atomX(n), mol.atomY(n), mol.atomCharge(n), mol.atomUnpaired(n));
			frag.setAtomIsotope(num, mol.atomIsotope(n));
			frag.setAtomHExplicit(num, mol.atomHExplicit(n));
			frag.setAtomMapNum(num, mol.atomMapNum(n));
			frag.setAtomExtra(num, mol.atomExtra(n));
		}
		for (int n = 1; n <= mol.numBonds(); n++)
		{
			int from = invidx[mol.bondFrom(n) - 1], to = invidx[mol.bondTo(n) - 1];
			if (from > 0 && to > 0)
			{
				int num = frag.addBond(from, to, mol.bondOrder(n), mol.bondType(n));
				frag.setBondExtra(num, mol.bondExtra(n));
			}
		}
    	
    	return frag;
    }
    
    // given a list of indices, constructs a new molecule which has the atoms in that order; the construction of idx[n] is such
    // that the new atom at position {n+1} will be the atom previously located at idx[n]; for example, a molecule containing the
    // atoms [C,O,N,H], reordered by indices of [3,2,4,1], will produce a new molecule with atoms [N,O,H,C]; the bonds will also
    // be correctly remapped; idx.length must be equal to or less than the number of atoms; each index must be unique and 
    // in the range {1..#atoms}, otherwise the result is undefined
	public static Molecule subgraph(Molecule mol, int[] idx)
	{
		int[] invidx = new int[mol.numAtoms()];
		for (int n = 0; n < invidx.length; n++) invidx[n] = 0;
		for (int n = 0; n < idx.length; n++) invidx[idx[n] - 1] = n + 1;
    	
		Molecule frag = new Molecule();
		for (int n = 0; n < idx.length; n++)
		{
			int num = frag.addAtom(mol.atomElement(idx[n]), mol.atomX(idx[n]), mol.atomY(idx[n]), mol.atomCharge(idx[n]), mol.atomUnpaired(idx[n]));
			frag.setAtomIsotope(num, mol.atomIsotope(idx[n]));
			frag.setAtomHExplicit(num, mol.atomHExplicit(idx[n]));
			frag.setAtomMapNum(num, mol.atomMapNum(idx[n]));
			frag.setAtomExtra(num, mol.atomExtra(idx[n]));
		}
		for (int n = 1; n <= mol.numBonds(); n++)
		{
			int from = invidx[mol.bondFrom(n) - 1], to = invidx[mol.bondTo(n) - 1];
			if (from > 0 && to > 0)
			{
				int num = frag.addBond(from, to, mol.bondOrder(n), mol.bondType(n));
				frag.setBondExtra(num, mol.bondExtra(n));
			}
		}
	
		return frag;
    }
    
    // a specialised version of mask subgraph: any atoms which are not in the mask, but are bonded to atoms which are in the
    // mask, are converted to the element "X" and included in the result; this makes them potentially more useful as template fragments
	public static Molecule subgraphWithAttachments(Molecule mol, boolean[] mask)
	{
		boolean[] xmask = Vec.duplicate(mask);
		for (int n = 1; n <= mol.numBonds(); n++)
		{
			int bfr = mol.bondFrom(n) - 1, bto = mol.bondTo(n) - 1;
			if (mask[bfr] && !mask[bto]) xmask[bto] = true;
			else if (mask[bto] && !mask[bfr]) xmask[bfr] = true;
		}
		Molecule xmol = mol.clone();
		for (int n = 1; n <= xmol.numAtoms(); n++) if (xmask[n - 1] && !mask[n - 1]) xmol.setAtomElement(n, "X");
		return subgraph(xmol, xmask);
    }
    
    // appends the fragment to the molecule, and makes a token effort to arrange the atom positions so they are along the X-axis
    public static void append(Molecule mol, Molecule frag)
    {
    	float dx = mol.maxX() + Molecule.IDEALBOND - frag.minX();
    	float dy = 0.5f * (mol.minY() + mol.maxY() - frag.minY() - frag.maxY());
    	int top = mol.numAtoms();
    	mol.append(frag);
    	for (int n = top + 1; n <= mol.numAtoms(); n++) mol.setAtomPos(n, mol.atomX(n) + dx, mol.atomY(n) + dy);
    }
    
    // works similarly to reorderAtoms(..) above, except operates on the order of the bond list; the atoms are unaffected
	public Molecule reorderedBonds(Molecule mol, int[] idx)
	{
		Molecule newmol = new Molecule();
		for (int n = 1; n <= mol.numAtoms(); n++)
		{
			int num = newmol.addAtom(mol.atomElement(n), mol.atomX(n), mol.atomY(n), mol.atomCharge(n), mol.atomUnpaired(n));
			newmol.setAtomHExplicit(num, mol.atomHExplicit(n));
			newmol.setAtomMapNum(num, mol.atomMapNum(n));
			newmol.setAtomExtra(num, mol.atomExtra(n));
		}
		for (int n = 0; n < idx.length; n++)
		{
			int num = newmol.addBond(mol.bondFrom(idx[n]), mol.bondTo(idx[n]), mol.bondOrder(idx[n]), mol.bondType(idx[n]));
			newmol.setBondExtra(num, mol.bondExtra(idx[n]));
		}
    	
    	return newmol;
    }
    
    // returns a new molecule which has the indicated atom indices removed; note that the index list does not need to be ordered, and
    // duplicates are OK
	public static Molecule deleteAtoms(Molecule mol, int[] idx)
	{
		boolean[] mask = Vec.booleanArray(true, mol.numAtoms());
		for (int n = 0; n < idx.length; n++) mask[idx[n] - 1] = false;
		return subgraph(mol, mask);
	}
	
	// produces a list of connected components for the molecule; the immediate size of the return value is the number of components;
	// each of the sub arrays is a list of indices for that component; the return value has 1-based indices
	public static int[][] componentList(Molecule mol)
	{
		final int sz = mol.numAtoms();
		if (sz == 0) return null;
		Graph g = new Graph(mol);
		
		int[] cc = g.calculateComponents();
		final int ccmax = Vec.max(cc);

		int[] ccsz = Vec.intArray(0, ccmax);
		for (int n = 0; n < sz; n++) ccsz[cc[n] - 1]++;

		int[][] cclist = new int[ccmax][];
		for (int n = 0; n < ccmax; n++)
		{
			cclist[n] = new int[ccsz[n]];
			ccsz[n] = 0;
		}

		for (int n = 0; n < sz; n++)
		{
			final int i = cc[n] - 1;
			cclist[i][ccsz[i]++] = n + 1;
		}

		return cclist;
	}
	
	// obtain groups of atom indices, each of which represents a "side" of atoms which are hanging "off" a central atom; if the central
	// atom has N neighbors and is not in a ring, then there will be N groups of atoms returned; if the atom is part of a ring block,
	// then the number of sides will be less than the number of neighbours; the returned arrays are 1-based
	public static int[][] getAtomSides(Molecule mol, int atom)
	{
		Graph g = new Graph(mol);
		int[] cc = g.calculateComponents();
		boolean[] mask = new boolean[cc.length];
		for (int n = 0; n < cc.length; n++) mask[n] = cc[n] == cc[atom - 1];
		mask[atom - 1] = false;

		final int[] oldmap = Vec.maskIdx(mask);
		g.keepNodes(mask);
		cc = new int[g.numNodes()];
		final int ccmax = g.calculateComponents(cc);

		IntVector[] grps = new IntVector[ccmax];
		for (int n = 0; n < ccmax; n++)
		{
			grps[n] = new IntVector();
			grps[n].add(atom);
		}
		for (int n = 0; n < cc.length; n++) grps[cc[n] - 1].add(oldmap[n] + 1);
		int[][] ret = new int[ccmax][];
		for (int n = 0; n < ccmax; n++) ret[n] = grps[n].getData();

		return ret;
	}
	
	// returns the groups of atoms which are on the "bond from" and "bond to" sides of the indicated bond, if bond is not a ring:
	//   A   B
	//    \_/			2 groups returned: (A,A) and (B,B)
	//    / \			the number of groups returned is guaranteed to be 0, 1 or 2
	//   A   B
	// if the bond is in a ring, then the groups are composed by disconnecting the bond and returning each remaining component, chopped
	// up according to ring block membership
	public static int[][] getBondSides(Molecule mol, int bond)
	{
		int bf = mol.bondFrom(bond), bt = mol.bondTo(bond);
		boolean inRing = mol.bondInRing(bond); // !! mol.atomRingBlock(bf)>0 && mol.atomRingBlock(bf)==mol.atomRingBlock(bt);
	
		Graph g = new Graph(mol);
		int[] cc = g.calculateComponents();
		boolean[] mask = new boolean[cc.length];
		for (int n = 0; n < cc.length; n++) mask[n] = cc[n] == cc[bf - 1];
		if (!inRing) g.removeEdge(bf - 1, bt - 1);
		else {mask[bf - 1] = false; mask[bt - 1] = false;}
		
		final int[] oldmap = Vec.maskIdx(mask);
		g.keepNodes(mask);
		cc = new int[g.numNodes()];
		final int ccmax = g.calculateComponents(cc);

		IntVector[] grps = new IntVector[ccmax];
		for (int n = 0; n < ccmax; n++)
		{
			grps[n] = new IntVector();
			if (inRing) {grps[n].add(bf); grps[n].add(bt);}
		}
		for (int n = 0; n < cc.length; n++) grps[cc[n] - 1].add(oldmap[n] + 1);
		int[][] ret = new int[ccmax][];
		for (int n = 0; n < ccmax; n++) ret[n] = grps[n].getData();
	
		return ret;
	}*/
	
	// returning flat arrays of atom properties: doing this before a geometry operation can boost performance considerably
	public static arrayAtomX(mol:Molecule):number[] 
	{
        let x = Vec.numberArray(0, mol.numAtoms());
        for (let n = x.length - 1; n >= 0; n--) x[n] = mol.atomX(n + 1);
        return x;
	}
	public static arrayAtomY(mol:Molecule):number[]
	{
        let y = Vec.numberArray(0, mol.numAtoms());
        for (let n = y.length - 1; n >= 0; n--) y[n] = mol.atomY(n + 1);
        return y;
	}
/*
	// calculates the molecular formula
	public static String molecularFormula(Molecule mol) {return molecularFormula(mol, false);}
	public static String molecularFormula(Molecule mol, boolean punctuation)
	{
		for (int n = 1; n <= mol.numAtoms(); n++) if (MolUtil.hasAbbrev(mol, n))
		{
			mol = mol.clone();
			MolUtil.expandAbbrevs(mol, false);
			break;
		}

		int countC = 0, countH = 0;
		String[] elements = new String[mol.numAtoms()];
		for (int n = 1; n <= mol.numAtoms(); n++)
		{
			countH += mol.atomHydrogens(n);
			String el = mol.atomElement(n);

			elements[n - 1] = "";
			if (el.equals("C")) countC++;
			else if (el.equals("H")) countH++;
			else elements[n - 1] = el;
		}
		
		elements = Vec.sort(elements);
		
		StringBuffer formula = new StringBuffer();
		
		if (countC > 0) formula.append("C");
		if (countC > 1)
		{
			if (punctuation) formula.append("{");
			formula.append(String.valueOf(countC));
			if (punctuation) formula.append("}");
		}
		if (countH > 0) formula.append("H");
		if (countH > 1)
		{
			if (punctuation) formula.append("{");
			formula.append(String.valueOf(countH));
			if (punctuation) formula.append("}");
		}
		for (int n = 0; n < elements.length; n++) if (elements[n].length() > 0)
		{
			int count = 1;
			for (; n + 1 < elements.length && elements[n].equals(elements[n + 1]); n++) count++;
			formula.append(elements[n]);
			if (count > 1)
			{
				if (punctuation) formula.append("{");
				formula.append(String.valueOf(count));
				if (punctuation) formula.append("}");
			}
		}
		
		return formula.toString();
	}
	
	// calculates the molecular weight, using natural abundance as the default, or specific isotope otherwise
	public static double molecularWeight(Molecule mol)
	{
		for (int n = 1; n <= mol.numAtoms(); n++) if (MolUtil.hasAbbrev(mol, n))
    	{
    		mol = mol.clone();
    		MolUtil.expandAbbrevs(mol, false);
    		break;
    	}

		double mw = 0;
		
		for (int n = 1; n <= mol.numAtoms(); n++)
		{
			mw += mol.atomHydrogens(n) * Chemistry.NATURAL_ATOMIC_WEIGHTS[1];
		
			int iso = mol.atomIsotope(n);
			if (iso != Molecule.ISOTOPE_NATURAL) {mw += iso; continue;}

			int an = Molecule.atomicNumber(mol.atomElement(n));
			if (an > 0 && an < Chemistry.NATURAL_ATOMIC_WEIGHTS.length) mw += Chemistry.NATURAL_ATOMIC_WEIGHTS[an];
		}
		
		return mw;
	}

    // looks for all cases where a bond {a1,a2} has duplicate(s), either of the {a1,a2} or {a2,a1} flavours; when this happens,
    // the duplicates are removed; if one of the bond violates maximum Lewis octet rule for (C/N/O), it gets zapped;
    // otherwise, keeps the bond with the highest order (second priority); or the most exotic type (third priority); or 
    // failing that, first in first served
    public static void removeDuplicateBonds(Molecule mol)
    {
		int[] bpri = new int[mol.numBonds()];
		for (int n = 1; n <= mol.numBonds(); n++)
			bpri[n - 1] = Math.min(mol.bondFrom(n), mol.bondTo(n)) * mol.numAtoms() + Math.max(mol.bondFrom(n), mol.bondTo(n));
		int[] bidx = Vec.idxSort(bpri);
    	
		boolean[] keepmask = Vec.booleanArray(false, bidx.length);
		int p = 0;
		while (p < bidx.length)
    	{
			int sz = 1;
			while (p + sz < bidx.length && bpri[bidx[p]] == bpri[bidx[p + sz]]) sz++;
    	    
			int best = p;
			for (int n = p + 1; n < p + sz; n++) // (does nothing if not degenerate)
    	    {
				int b1 = bidx[best] + 1, b2 = bidx[n] + 1;
        	    
        		// see if just one of the bonds assures Lewis violation on C/N/O
				int a1 = mol.bondFrom(b1), a2 = mol.bondTo(b1);
				String el1 = mol.atomElement(a1), el2 = mol.atomElement(a2);
				int limit1 = 0, limit2 = 0;
        		if (el1.equals("C") || el1.equals("N")) limit1 = 4;
        		else if (el1.equals("O")) limit1 = 3;
        		if (el2.equals("C") || el2.equals("N")) limit2 = 4;
        		else if (el2.equals("O")) limit2 = 3;
        		
        		if (limit1 > 0 || limit2 > 0)
        		{
        		    int boB1A1 = 0, boB1A2 = 0, boB2A1 = 0, boB2A2 = 0;
					for (int i = 1; i <= mol.numBonds(); i++)
        		    {
						if (i != b2 && (mol.bondFrom(i) == a1 || mol.bondTo(i) == a1)) boB1A1 += mol.bondOrder(i);
						if (i != b2 && (mol.bondFrom(i) == a2 || mol.bondTo(i) == a2)) boB1A2 += mol.bondOrder(i);
						if (i != b1 && (mol.bondFrom(i) == a1 || mol.bondTo(i) == a1)) boB2A1 += mol.bondOrder(i);
						if (i != b1 && (mol.bondFrom(i) == a2 || mol.bondTo(i) == a2)) boB2A2 += mol.bondOrder(i);
        		    }
					int bad1 = 0, bad2 = 0;
					if (limit1 > 0 && boB1A1 > limit1) bad1++;
					if (limit2 > 0 && boB1A2 > limit2) bad1++;
					if (limit1 > 0 && boB2A1 > limit1) bad2++;
					if (limit2 > 0 && boB2A2 > limit2) bad2++;
        		    
        		    if (bad1 < bad2) continue; // stick with current best
        		    if (bad1 > bad2) {best = n; continue;} // switch to new best
        		}
        	    
        		// otherwise pick the most interesting
				int exotic1 = 2 * mol.bondOrder(b1), exotic2 = 2 * mol.bondOrder(b2);
				exotic1 += (exotic1 == 0 ? 4 : 0) + (mol.bondType(b1) != Molecule.BONDTYPE_NORMAL ? 1 : 0);
				exotic2 += (exotic2 == 0 ? 4 : 0) + (mol.bondType(b2) != Molecule.BONDTYPE_NORMAL ? 1 : 0);
        		
				if (exotic2 > exotic1) best = n;
    	    }
			keepmask[bidx[best]] = true;
    	    
			p += sz;
    	}
		for (int n = mol.numBonds(); n >= 1; n--)
			if (!keepmask[n - 1] || mol.bondFrom(n) == mol.bondTo(n)) mol.deleteBond(n);
    }

    // calculates a weight for each atom relative to a starting atom, N; this is useful when deciding which atoms to move around,
    // i.e. those with higher weight should probably stay where they are; the algorithm is Morgan-like, in that atom values are
    // sequentially added to their neighbours, with the exception of atom N, which is a separating point
    public static float[] calculateWalkWeight(Molecule mol, int N)
    {
		int ccsz = 0, cc[] = new Graph(mol).calculateComponents();
		for (int n = 0; n < cc.length; n++) if (cc[n] == cc[N - 1]) ccsz++;

		float[] w = Vec.floatArray(1, mol.numAtoms()), wn = new float[mol.numAtoms()];
		w[N - 1] = 0;
		for (; ccsz > 0; ccsz--)
    	{
			for (int n = 0; n < mol.numAtoms(); n++) wn[n] = w[n];
			for (int n = 1; n <= mol.numBonds(); n++)
    	    {
				int a1 = mol.bondFrom(n) - 1, a2 = mol.bondTo(n) - 1;
				w[a1] += wn[a2] * 0.1f;
				w[a2] += wn[a1] * 0.1f;
    	    }
			w[N - 1] = 0;
    	}
    	return w;
    }

	// returns the electron count of an atom: this is the sum of natural electron count, neighbouring bonds, 
	// explicit hydrogens, unpaired electrons and -charge; hydrogens inferred by the valence are included
	// only if the countImplicit parameter is true; 
	// the return value can be used to calculate the number of remaining slots for adding new substituents
	public static int atomElectronCount(Molecule mol, int N, boolean countImplicit)
	{
		int atno = mol.atomicNumber(N), blk = Chemistry.ELEMENT_BLOCKS[atno], grp = Chemistry.ELEMENT_GROUPS[atno];
		int val = blk == 0 ? 0 : blk == 1 ? grp : blk == 2 ? grp - 10 : grp;
		if (countImplicit) val += mol.atomHydrogens(N);
		else if (mol.atomHExplicit(N) != Molecule.HEXPLICIT_UNKNOWN) val += mol.atomHExplicit(N);
		val += mol.atomUnpaired(N) - mol.atomCharge(N);
		int[] adjb = mol.atomAdjBonds(N);
		for (int n = 0; n < adjb.length; n++) val += mol.bondOrder(adjb[n]);
		return val;
	}

	// for a given atomic number, returns the valence limit, considering S/P/D electrons, i.e. cuts out
	// at 18 electrons, even for f-block metals
	public static int atomMaxValenceSPD(int atno)
	{
		int blk = Chemistry.ELEMENT_BLOCKS[atno];
		//                             ?, s, p,  d, f
		final int[] BLKVAL = new int[]{2, 2, 8, 18, 18};
		return BLKVAL[blk];
	}

    // if the molecule has any bonds that are not of order 1, 2 or 3 then a new molecule will be constructed
    // which has only these bond types; if no interesting bonds, returns null; a returned molecule is
    // more suitable to writing to a format such as MDL MOL; zero bonds are typically converted into
    // double bonds or charge-separated single bonds
    public static Molecule reduceBondTypes(Molecule mol)
    {
		final int nb = mol.numBonds();
		boolean any = false;
		for (int n = 1; n <= nb; n++) if (mol.bondOrder(n) < 1 || mol.bondOrder(n) > 3) {any = true; break;}
		if (!any) return null;

		mol = mol.clone();

		for (int n = 1; n <= nb; n++)
		{
			int bo = mol.bondOrder(n);
			if (bo == 0)
			{
				int bfr = mol.bondFrom(n), bto = mol.bondTo(n);

				// non-elements do not get to charge separate
				int atno1 = mol.atomicNumber(bfr), atno2 = mol.atomicNumber(bto);
				if (atno1 == 0 || atno2 == 0)
				{
					mol.setBondOrder(n, 1);
					continue;
				}
				int val1 = atomElectronCount(mol, bfr, true), val2 = atomElectronCount(mol, bto, true);
				int max1 = atomMaxValenceSPD(atno1), max2 = atomMaxValenceSPD(atno2);
				boolean spc1 = val1 <= max1 - 2, spc2 = val2 <= max2 - 2;
				if (spc1 && spc2)
				{
					// sufficient valence exists, so call it a double bond
					mol.setBondOrder(n, 2);
					continue;
				}

				// charge separate, as long as the atom receiving the negative charge has room for it
				if (spc1)
				{
					mol.setAtomCharge(bfr, mol.atomCharge(bfr) - 1);
					mol.setAtomCharge(bto, mol.atomCharge(bto) + 1);
				}
				if (spc2)
				{
					mol.setAtomCharge(bfr, mol.atomCharge(bfr) + 1);
					mol.setAtomCharge(bto, mol.atomCharge(bto) - 1);
				}

				mol.setBondOrder(n, 1);
			}
			else if (bo > 3) mol.setBondOrder(n, 3);
			else mol.setBondOrder(n, 1);
		}

		return mol;
	}
    
    // return the total number of attached hydrogens: implicit/explicit + any actual atoms connected to it
    public static int totalHydrogens(Molecule mol, int atom)
    {
		int hc = mol.atomHydrogens(atom);
		int[] adj = mol.atomAdjList(atom);
		for (int n = 0; n < adj.length; n++) if (mol.atomElement(adj[n]).equals("H")) hc++;
		return hc;
    }
    
    // operates on the provided molecule, by removing any "boring" hydrogen atoms; boring is defined as:
    //		- bonded to an atom that auto-calculates hydrogens and is set to do so
    //		- one single non-stereo bond to a non-hydrogen atom
    //      - no charge or unpaired electrons or isotope information
    //		- no extension fields
    // the adjacent heavy atom has its explicit hydrogen count incremented, unless it is set to auto _and_ after removing
    // the hydrogen atom, the calculated value is 1
    // note: the 'force' parameter can be used to make it just chop everything
    public static void stripHydrogens(Molecule mol) {stripHydrogens(mol, false);}
    public static void stripHydrogens(Molecule mol, boolean force)
    {
		for (int n = mol.numAtoms(); n >= 1; n--)
		{
			if (!mol.atomElement(n).equals("H")) continue;
			if (!force)
			{
				if (mol.atomCharge(n) != 0 || mol.atomUnpaired(n) != 0) continue;
				if (mol.atomIsotope(n) != Molecule.ISOTOPE_NATURAL) continue;
				if (mol.atomExtra(n) != null || mol.atomTransient(n) != null) continue;
				if (mol.atomAdjCount(n) != 1) continue;
				int other = mol.atomAdjList(n)[0];
				if (mol.atomElement(other).equals("H")) continue;
				int bond = mol.atomAdjBonds(n)[0];
				if (mol.bondOrder(bond) != 1 || mol.bondType(bond) != Molecule.BONDTYPE_NORMAL) continue;
				if (mol.atomHExplicit(other) != Molecule.HEXPLICIT_UNKNOWN) continue;
				if (Vec.indexOf(mol.atomElement(other), Molecule.HYVALENCE_EL) < 0) continue;
			}
    		
    		mol.deleteAtomAndBonds(n);
    	}
    }
    
    // looks through each atom's hydrogen count, and converts the number into actual hydrogen atoms, which are added
    // to the end of the atom list in the order encountered; returns the number of new atoms appended
	//
    // if the 'position' parameter is false, then hydrogens are simply added at their parents position (computationally
    // cheap); if true, a reasonable sketch layout method is used
    public static int createHydrogens(Molecule mol) {return createHydrogens(mol, false);}
    public static int createHydrogens(Molecule mol, boolean position)
    {
		int na = mol.numAtoms();
		for (int n = 1; n <= na; n++)
    	{
			int hc = mol.atomHydrogens(n);
			if (hc == 0) continue;
			if (mol.atomHExplicit(n) != Molecule.HEXPLICIT_UNKNOWN) mol.setAtomHExplicit(n, 0);

			if (!position)
			{
				for (; hc > 0; hc--)
				{
					int a = mol.addAtom("H", mol.atomX(n), mol.atomY(n));
					mol.addBond(n, a, 1);
				}
			}
			else SketchUtil.placeAdditionalHydrogens(mol, n, hc);
		}
		return mol.numAtoms() - na;
    }
    
    // returns atom position as a 3D vector
    public static float[] atomVec3(Molecule mol, int atom)
    {
    	if (mol.is3D())
    		return new float[]{mol.atomX(atom), mol.atomY(atom), mol.atomZ(atom)};
    	else
    		return new float[]{mol.atomX(atom), mol.atomY(atom), 0};
    }
*/    
}