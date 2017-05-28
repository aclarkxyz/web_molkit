/*
    WebMolKit

    (c) 2010-2017 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../util/Geom.ts'/>
///<reference path='Molecule.ts'/>
///<reference path='SketchUtil.ts'/>

/*
	MolUtil: static methods for calculating molecule properties.
*/

class MolUtil
{
    public static isBlank(mol:Molecule):boolean
    {
        //return mol == null || mol.numAtoms == 0;
		if (mol == null) return true;
		return mol.numAtoms == 0;
    }
    public static notBlank(mol:Molecule):boolean
    {
        //return mol != null || mol.numAtoms > 0;
		if (mol == null) return false;
		return mol.numAtoms > 0;
    }

    // substitutes an empty molecule for null
	public static orBlank(mol:Molecule):Molecule {return mol == null ? new Molecule() : mol;}

	// conventions for special-atoms
	public static TEMPLATE_ATTACHMENT = 'X'; // use the label 'X' to denote attachments when defining templates
	public static ABBREV_ATTACHMENT = '*'; // within abbreviations, use '*' to denote the placeholder superimposition

	// returns true if there are any abbreviations
	public static hasAnyAbbrev(mol:Molecule):boolean
	{
		for (let n = 1; n <= mol.numAtoms; n++) if (MolUtil.hasAbbrev(mol, n)) return true;
		return false;
	}

	// returns true if the atom index is an inline abbreviation
	public static hasAbbrev(mol:Molecule, atom:number):boolean
	{
		let extra = mol.atomExtra(atom);
		for (let n = 0; n < (extra == null ? 0 : extra.length); n++) if (extra[n].startsWith('a')) return true;
		return false;
	}

    // if the molecule has a template abbreviation encoded at the given atom, it will be parsed into a fragment instance and
    // returned; for the embedded fragment, atom#1 is considered to be the site of attachment
    public static getAbbrev(mol:Molecule, atom:number):Molecule
    {
		let extra = mol.atomExtra(atom);
		for (let n = 0; n < (extra != null ? extra.length : 0); n++) if (extra[n].startsWith("a"))
		{
			return Molecule.fromString(extra[n].substring(1));
		}
    	return null;
    }
    
    // sets the abbreviation-template for the given atom number, eliminating any existing template at that point
	public static setAbbrev(mol:Molecule, atom:number, frag:Molecule):void
	{
		let attidx = 0;
		for (let n = 1; n <= frag.numAtoms; n++) if (frag.atomElement(n) == MolUtil.ABBREV_ATTACHMENT)
    	{
			if (attidx > 0) throw 'Multiple attachment points indicated: invalid.';
			attidx = n;
    	}
		if (attidx == 0) throw 'No attachment points indicated.';
		if (attidx >= 2)
    	{
			frag = frag.clone();
			frag.swapAtoms(attidx, 1);
    	}
        
		let adj = mol.atomAdjList(atom);
		if (adj.length > 1) throw 'Setting abbreviation for non-terminal atom.';
		if (frag.atomAdjCount(1) == 1 && mol.atomAdjCount(atom) > 0)
		{
			let b1 = mol.findBond(atom, mol.atomAdjList(atom)[0]);
			let b2 = frag.findBond(1, frag.atomAdjList(1)[0]);
			mol.setBondOrder(b1, frag.bondOrder(b2));
		}
        
        // finally we're allowed to set it
		let extra = mol.atomExtra(atom);
		let idx = -1;
    	for (let n = 0; n < (extra != null ? extra.length : 0); n++) if (extra[n].startsWith("a")) {idx = n; break;}
    	if (idx < 0) idx = extra.push(null) - 1; 
    	
		extra[idx] = "a" + frag.toString();

		mol.setAtomExtra(atom, extra);
    }

    // any invalid abbreviations will be cleared out
    public static validateAbbrevs(mol:Molecule):void
    {
		for (let n = 1; n <= mol.numAtoms; n++) if (MolUtil.hasAbbrev(mol, n))
    	{
			if (mol.atomAdjCount(n) > 1) MolUtil.clearAbbrev(mol, n);
			if (mol.atomCharge(n) != 0) mol.setAtomCharge(n, 0);
			if (mol.atomUnpaired(n) != 0) mol.setAtomUnpaired(n, 0);
			if (mol.atomIsotope(n) != 0) mol.setAtomIsotope(n, Molecule.ISOTOPE_NATURAL);
			if (mol.atomHExplicit(n) != Molecule.HEXPLICIT_UNKNOWN) mol.setAtomHExplicit(n, Molecule.HEXPLICIT_UNKNOWN);
    	}
    }
    
    // converts a partitioned molecule into a molecule with a subsumed abbreviation; srcmask defines all the atoms which are NOT part
    // of the abbreviation; the resulting molecule will contain all of these, plus a new one that has been created to hold the 
    // abbreviation; the molecule  must be partitioned so that there is exactly 1 source atom attached to all of the abbreviations
    // NOTE: returns null if the template creation is invalid
	public static convertToAbbrev(mol:Molecule, srcmask:boolean[], abbrevName:string):Molecule
	{
		let junction = 0;
		for (let n = 1; n <= mol.numBonds; n++)
		{
			let b1 = mol.bondFrom(n), b2 = mol.bondTo(n), atom = 0;
			if (srcmask[b1 - 1] && !srcmask[b2 - 1]) atom = b1;
			else if (!srcmask[b1 - 1] && srcmask[b2 - 1]) atom = b2;
			if (atom == 0) continue;

			if (junction > 0 && atom != junction) return null;
			junction = atom;
		}
		if (junction == 0) return null;
    	
		// refine the partition based on the junction, and derive reference indices
		let na = mol.numAtoms, molidx = 0, fragidx = 0;
		let maskmol = Vec.booleanArray(false, na), maskfrag = Vec.booleanArray(false, na);
		for (let n = 0; n < na; n++)
		{
			maskmol[n] = srcmask[n];
			maskfrag[n] = !srcmask[n] || n + 1 == junction;
			if (maskmol[n] && n + 1 <= junction) molidx++;
			if (maskfrag[n] && n + 1 <= junction) fragidx++;
		}
    	
		// create and analyse the fragment
		let frag = MolUtil.subgraphMask(mol, maskfrag);
		frag.setAtomElement(fragidx, MolUtil.ABBREV_ATTACHMENT);
		frag.setAtomCharge(fragidx, 0);
		frag.setAtomUnpaired(fragidx, 0);
		frag.setAtomHExplicit(fragidx, Molecule.HEXPLICIT_UNKNOWN);
		frag.setAtomMapNum(fragidx, 0);
		frag.setAtomExtra(fragidx, []);
		frag.setAtomTransient(fragidx, []);
		let adj = frag.atomAdjList(fragidx);
		let x = 0, y = 0, inv = 1.0 / adj.length;
		let bondOrder = 1;
		for (let n = 0; n < adj.length; n++)
		{
			x += frag.atomX(adj[n]);
			y += frag.atomY(adj[n]);
			let b = frag.findBond(fragidx, adj[n]);
			if (n == 0) bondOrder = frag.bondOrder(b);
			else if (bondOrder != frag.bondOrder(b)) bondOrder = 1;
		}
		x *= inv; y *= inv;
    
		// create the excised molecule, and add in the fragment
		let newmol = MolUtil.subgraphMask(mol, maskmol);
		let	 newatom = newmol.addAtom(abbrevName, x, y);
		newmol.addBond(molidx, newatom, bondOrder);
		MolUtil.setAbbrev(newmol, newatom, frag);
    
    	return newmol;
    }
    
    // hunts through any abbreviations, and expands them out to form actual atoms; the resulting representation is fair game for things 
    // like MF/MW calculations, or any other pure-atom property calculation; if alignCoords is true, it will line up the positions of
    // the new atoms; if false, the algorithm will burn up less cycles; note that abbreviations-within-abbreviations are handled by 
    // repeated iteration until there are none left
	public static expandAbbrevs(mol:Molecule, alignCoords:boolean):void
	{
		while (true)
		{
			let anything = false;
			for (let n = 1; n <= mol.numAtoms; n++) if (MolUtil.hasAbbrev(mol, n))
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
	public static expandOneAbbrev(mol:Molecule, atom:number, alignCoords:boolean):boolean
	{
		let frag = MolUtil.getAbbrev(mol, atom);
		if (frag == null) return false;
		if (mol.atomAdjCount(atom) != 1 || frag.numAtoms == 0)
		{
			MolUtil.clearAbbrev(mol, atom);
			return false;
		}
		
    	let m = mol.atomMapNum(atom);
    	if (m > 0) for (let n of frag.atomAdjList(1)) frag.setAtomMapNum(n, m);

		MolUtil.expandOneAbbrevFrag(mol, atom, frag, alignCoords);
		return true;
	}
	public static expandOneAbbrevFrag(mol:Molecule, atom:number, frag:Molecule, alignCoords:boolean):void
	{
		let nbr = mol.atomAdjCount(atom) == 1 ? mol.atomAdjList(atom)[0] : 0;
    
		if (alignCoords)
		{
			let vx1 = mol.atomX(atom) - mol.atomX(nbr), vy1 = mol.atomY(atom) - mol.atomY(nbr);
			let adj = frag.atomAdjList(1);
			let vx2 = 0, vy2 = 0, inv = 1.0 / adj.length;
			for (let n = 0; n < adj.length; n++)
			{
				vx2 += frag.atomX(adj[n]) - frag.atomX(1);
				vy2 += frag.atomY(adj[n]) - frag.atomY(1);
			}
			vx2 *= inv;
			vy2 *= inv;
			let th1 = Math.atan2(vy1, vx1), th2 = Math.atan2(vy2, vx2);
			CoordUtil.rotateMolecule(frag, th1 - th2);
			CoordUtil.translateMolecule(frag, mol.atomX(nbr) - frag.atomX(1), mol.atomY(nbr) - frag.atomY(1));
		}
    	
		let join = mol.numAtoms + 1;
		mol.append(frag);
		for (let n = 1; n <= mol.numBonds; n++)
		{
			if (mol.bondFrom(n) == join) mol.setBondFrom(n, nbr);
			if (mol.bondTo(n) == join) mol.setBondTo(n, nbr);
		}
		mol.deleteAtomAndBonds(join);
		mol.deleteAtomAndBonds(atom);
    }

    // removes the abbreviation from a molecule, if there is one; also, the element symbol will be set to "C" when there is
    // any clearing to be done
	public static clearAbbrev(mol:Molecule, atom:number):void
	{
		let extra = mol.atomExtra(atom);
		for (let n = 0; n < (extra != null ? extra.length : 0); n++) if (extra[n].startsWith("a"))
		{
			extra.splice(n, 1);
			mol.setAtomExtra(atom, extra);
			mol.setAtomElement(atom, 'C');
			return;
		}
	}
    
    // equivalent to the Molecule method of same name, except trashes the abbreviation of the "element" symbol has changed
	public static setAtomElement(mol:Molecule, atom:number, el:string):void
	{
		if (mol.atomElement(atom) == el) return;
		this.clearAbbrev(mol, atom);
		mol.setAtomElement(atom, el);
	}
    
    // equivalent to the Molecule method of same name, except that if either of the atoms are about to exceed divalence, its
    // abbreviation gets zapped; also, if the bond was already there, zaps the old one
	public static addBond(mol:Molecule, bfr:number, bto:number, order:number, type?:number):number
	{
		if (type == null) type = Molecule.BONDTYPE_NORMAL;
		if (mol.atomAdjCount(bfr) >= 1) this.clearAbbrev(mol, bfr);
		if (mol.atomAdjCount(bto) >= 1) this.clearAbbrev(mol, bto);
		let b = mol.findBond(bfr, bto);
		if (b > 0) mol.deleteBond(b);
		return mol.addBond(bfr, bto, order, type);
	}

   	// returns a molecule which is smaller than the current one, according to the mask (which must be of size #atoms); boundary cases
    // are a null molecule or cloned copy
	public static subgraphMask(mol:Molecule, mask:boolean[]):Molecule
	{
		let invidx:number[] = [];
		let sum = 0;
		for (let n = 0; n < mol.numAtoms; n++) 
		{
			if (mask[n]) invidx.push(++sum); else invidx.push(0);
		}
		if (sum == 0) return new Molecule();
		if (sum == mol.numAtoms) return mol.clone();
    	
		let frag = new Molecule();
		for (let n = 1; n <= mol.numAtoms; n++) if (mask[n - 1])
		{
			let num = frag.addAtom(mol.atomElement(n), mol.atomX(n), mol.atomY(n), mol.atomCharge(n), mol.atomUnpaired(n));
			frag.setAtomIsotope(num, mol.atomIsotope(n));
			frag.setAtomHExplicit(num, mol.atomHExplicit(n));
			frag.setAtomMapNum(num, mol.atomMapNum(n));
			frag.setAtomExtra(num, mol.atomExtra(n));
		}
		for (let n = 1; n <= mol.numBonds; n++)
		{
			let bfr = invidx[mol.bondFrom(n) - 1], bto = invidx[mol.bondTo(n) - 1];
			if (bfr > 0 && bto > 0)
			{
				let num = frag.addBond(bfr, bto, mol.bondOrder(n), mol.bondType(n));
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
	public static subgraphIndex(mol:Molecule, idx:number[]):Molecule
	{
		let invidx = Vec.numberArray(0, mol.numAtoms);
		for (let n = 0; n < invidx.length; n++) invidx[n] = 0;
		for (let n = 0; n < idx.length; n++) invidx[idx[n] - 1] = n + 1;
    	
		let frag = new Molecule();
		for (let n = 0; n < idx.length; n++)
		{
			let num = frag.addAtom(mol.atomElement(idx[n]), mol.atomX(idx[n]), mol.atomY(idx[n]), mol.atomCharge(idx[n]), mol.atomUnpaired(idx[n]));
			frag.setAtomIsotope(num, mol.atomIsotope(idx[n]));
			frag.setAtomHExplicit(num, mol.atomHExplicit(idx[n]));
			frag.setAtomMapNum(num, mol.atomMapNum(idx[n]));
			frag.setAtomExtra(num, mol.atomExtra(idx[n]));
		}
		for (let n = 1; n <= mol.numBonds; n++)
		{
			let bfr = invidx[mol.bondFrom(n) - 1], bto = invidx[mol.bondTo(n) - 1];
			if (bfr > 0 && bto > 0)
			{
				let num = frag.addBond(bfr, bto, mol.bondOrder(n), mol.bondType(n));
				frag.setBondExtra(num, mol.bondExtra(n));
			}
		}
	
		return frag;
    }
    
    // a specialised version of mask subgraph: any atoms which are not in the mask, but are bonded to atoms which are in the
    // mask, are converted to the element "X" and included in the result; this makes them potentially more useful as template fragments
	public static subgraphWithAttachments(mol:Molecule, mask:boolean[]):Molecule
	{
		let xmask = mask.slice(0);
		for (let n = 1; n <= mol.numBonds; n++)
		{
			let bfr = mol.bondFrom(n) - 1, bto = mol.bondTo(n) - 1;
			if (mask[bfr] && !mask[bto]) xmask[bto] = true;
			else if (mask[bto] && !mask[bfr]) xmask[bfr] = true;
		}
		let xmol = mol.clone();
		for (let n = 1; n <= xmol.numAtoms; n++) if (xmask[n - 1] && !mask[n - 1]) xmol.setAtomElement(n, 'X');
		return MolUtil.subgraphMask(xmol, xmask);
    }
    
    // appends the fragment to the molecule, and makes a token effort to arrange the atom positions so they are along the X-axis
    public static append(mol:Molecule, frag:Molecule):void
    {
		let boxm = mol.boundary(), boxf = frag.boundary();
    	let dx = boxm.maxX() + Molecule.IDEALBOND - boxm.minX();
    	let dy = 0.5 * (boxm.minY() + boxm.maxY() - boxf.minY() - boxf.maxY());
    	let top = mol.numAtoms;
    	mol.append(frag);
    	for (let n = top + 1; n <= mol.numAtoms; n++) mol.setAtomPos(n, mol.atomX(n) + dx, mol.atomY(n) + dy);
    }
    
	/*
    // works similarly to reorderAtoms(..) above, except operates on the order of the bond list; the atoms are unaffected
	public Molecule reorderedBonds(Molecule mol, int[] idx)
	{
		Molecule newmol = new Molecule();
		for (int n = 1; n <= mol.numAtoms; n++)
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
    }*/

    // returns a new molecule which has the indicated atom indices removed; note that the index list does not need to be ordered, and
    // duplicates are OK
	public static deleteAtoms(mol:Molecule, idx:number[]):Molecule
	{
		let mask = Vec.booleanArray(true, mol.numAtoms);
		for (let n = 0; n < idx.length; n++) mask[idx[n] - 1] = false;
		return MolUtil.subgraphMask(mol, mask);
	}
	
	// produces a list of connected components for the molecule; the immediate size of the return value is the number of components;
	// each of the sub arrays is a list of indices for that component; the return value has 1-based indices
	public static componentList(mol:Molecule):number[][]
	{
		let sz = mol.numAtoms;
		if (sz == 0) return null;
		let g = Graph.fromMolecule(mol);
		
		let groups = g.calculateComponentGroups();
		for (let grp of groups) Vec.addTo(grp, 1); // 1-based rather than zero
		return groups;
	}
	
	// obtain groups of atom indices, each of which represents a "side" of atoms which are hanging "off" a central atom; if the central
	// atom has N neighbors and is not in a ring, then there will be N groups of atoms returned; if the atom is part of a ring block,
	// then the number of sides will be less than the number of neighbours; the returned arrays are 1-based
	public static getAtomSides(mol:Molecule, atom:number):number[][]
	{
		let g = Graph.fromMolecule(mol);
		let cc = g.calculateComponents();
		let mask:boolean[] = [];
		for (let n = 0; n < cc.length; n++) mask.push(cc[n] == cc[atom - 1]);
		mask[atom - 1] = false;

		let oldmap = Vec.maskIdx(mask);
		g.keepNodesMask(mask);
		cc = g.calculateComponents();
		let ccmax = Vec.max(cc);

		let grps:number[][] = [];
		for (let n = 0; n < ccmax; n++) grps.push([atom]);
		for (let n = 0; n < cc.length; n++) grps[cc[n] - 1].push(oldmap[n] + 1);

		return grps;
	}
	
	// returns the groups of atoms which are on the "bond from" and "bond to" sides of the indicated bond, if bond is not a ring:
	//   A   B
	//    \_/			2 groups returned: (A,A) and (B,B)
	//    / \			the number of groups returned is guaranteed to be 0, 1 or 2
	//   A   B
	// if the bond is in a ring, then the groups are composed by disconnecting the bond and returning each remaining component, chopped
	// up according to ring block membership
	public static getBondSides(mol:Molecule, bond:number):number[][]
	{
		let bf = mol.bondFrom(bond), bt = mol.bondTo(bond);
		let inRing = mol.bondInRing(bond); // !! mol.atomRingBlock(bf)>0 && mol.atomRingBlock(bf)==mol.atomRingBlock(bt);
	
		let g = Graph.fromMolecule(mol);
		let cc = g.calculateComponents();
		let mask:boolean[] = [];
		for (let n = 0; n < cc.length; n++) mask.push(cc[n] == cc[bf - 1]);
		if (!inRing) g.removeEdge(bf - 1, bt - 1);
		else {mask[bf - 1] = false; mask[bt - 1] = false;}
		
		let oldmap = Vec.maskIdx(mask);
		g.keepNodesMask(mask);
		cc = g.calculateComponents();
		let ccmax = Vec.max(cc);

		let grps:number[][] = [];
		for (let n = 0; n < ccmax; n++)
		{
			grps[n] = [];
			if (inRing) {grps[n].push(bf); grps[n].push(bt);}
		}
		for (let n = 0; n < cc.length; n++) grps[cc[n] - 1].push(oldmap[n] + 1);
		
		return grps;
	}
	
	// returning flat arrays of atom properties: doing this before a geometry operation can boost performance considerably
	public static arrayAtomX(mol:Molecule):number[] 
	{
        let x = Vec.numberArray(0, mol.numAtoms);
        for (let n = x.length - 1; n >= 0; n--) x[n] = mol.atomX(n + 1);
        return x;
	}
	public static arrayAtomY(mol:Molecule):number[]
	{
        let y = Vec.numberArray(0, mol.numAtoms);
        for (let n = y.length - 1; n >= 0; n--) y[n] = mol.atomY(n + 1);
        return y;
	}

	// calculates the molecular formula
	public static molecularFormula(mol:Molecule, punctuation?:boolean|string[]):string
	{
		let puncEnter = '', puncExit = '', puncEnterSuper = '', puncExitSuper = '';
		if (punctuation == true) [puncEnter, puncExit] = ['{', '}', '{^', '}'];
		else if (punctuation instanceof Array)
		{
			puncEnter = punctuation[0];
			puncExit = punctuation[1];
			puncEnterSuper = punctuation[2];
			puncExitSuper = punctuation[3];
		}

		for (let n = 1; n <= mol.numAtoms; n++) if (MolUtil.hasAbbrev(mol, n))
		{
			mol = mol.clone();
			MolUtil.expandAbbrevs(mol, false);
			break;
		}

		let countC = 0, countH = 0;
		let elements = Vec.stringArray('', mol.numAtoms);
		for (let n = 1; n <= mol.numAtoms; n++)
		{
			countH += mol.atomHydrogens(n);
			let el = mol.atomElement(n);

			// this is hacky, but at least isotopes are separated out; they should ideally be sorted just after their non-isotopes, in
			// numerical order
			if (mol.atomIsotope(n) != Molecule.ISOTOPE_NATURAL) el = puncEnterSuper + mol.atomIsotope(n) + puncExitSuper + el;

			if (el == 'C') countC++;
			else if (el == 'H') countH++;
			else elements[n - 1] = el;
		}
		
		elements.sort();
		
		let formula = '';
		
		if (countC > 0) formula += 'C';
		if (countC > 1)
		{
			if (punctuation) formula += puncEnter;
			formula += countC;
			if (punctuation) formula += puncExit;
		}
		if (countH > 0) formula += 'H';
		if (countH > 1)
		{
			if (punctuation) formula += puncEnter;
			formula += countH;
			if (punctuation) formula += puncExit;
		}
		for (let n = 0; n < elements.length; n++) if (elements[n].length > 0)
		{
			let count = 1;
			for (; n + 1 < elements.length && elements[n] == elements[n + 1]; n++) count++;
			formula += elements[n];
			if (count > 1)
			{
				if (punctuation) formula += puncEnter;
				formula += count;
				if (punctuation) formula += puncExit;
			}
		}
		
		return formula.toString();
	}
	
	// calculates the molecular weight, using natural abundance as the default, or specific isotope otherwise
	public static molecularWeight(mol:Molecule):number
	{
		for (let n = 1; n <= mol.numAtoms; n++) if (MolUtil.hasAbbrev(mol, n))
    	{
    		mol = mol.clone();
    		MolUtil.expandAbbrevs(mol, false);
    		break;
    	}

		let mw = 0;
		
		for (let n = 1; n <= mol.numAtoms; n++)
		{
			mw += mol.atomHydrogens(n) * Chemistry.NATURAL_ATOMIC_WEIGHTS[1];
		
			let iso = mol.atomIsotope(n);
			if (iso != Molecule.ISOTOPE_NATURAL) {mw += iso; continue;}

			let an = Molecule.elementAtomicNumber(mol.atomElement(n));
			if (an > 0 && an < Chemistry.NATURAL_ATOMIC_WEIGHTS.length) mw += Chemistry.NATURAL_ATOMIC_WEIGHTS[an];
		}
		
		return mw;
	}

    // looks for all cases where a bond {a1,a2} has duplicate(s), either of the {a1,a2} or {a2,a1} flavours; when this happens,
    // the duplicates are removed; if one of the bond violates maximum Lewis octet rule for (C/N/O), it gets zapped;
    // otherwise, keeps the bond with the highest order (second priority); or the most exotic type (third priority); or 
    // failing that, first in first served
    public static removeDuplicateBonds(mol:Molecule):void
    {
		let bpri:number[] = [];
		for (let n = 1; n <= mol.numBonds; n++)
		{
			let p = Math.min(mol.bondFrom(n), mol.bondTo(n)) * mol.numAtoms + Math.max(mol.bondFrom(n), mol.bondTo(n));
			bpri.push(p);
		}
		let bidx = Vec.idxSort(bpri);
    	
		let keepmask = Vec.booleanArray(false, bidx.length);
		let p = 0;
		while (p < bidx.length)
    	{
			let sz = 1;
			while (p + sz < bidx.length && bpri[bidx[p]] == bpri[bidx[p + sz]]) sz++;
    	    
			let best = p;
			for (let n = p + 1; n < p + sz; n++) // (does nothing if not degenerate)
    	    {
				let b1 = bidx[best] + 1, b2 = bidx[n] + 1;
        	    
        		// see if just one of the bonds assures Lewis violation on C/N/O
				let a1 = mol.bondFrom(b1), a2 = mol.bondTo(b1);
				let el1 = mol.atomElement(a1), el2 = mol.atomElement(a2);
				let limit1 = 0, limit2 = 0;
        		if (el1 == 'C' || el1 == 'N') limit1 = 4;
        		else if (el1 == 'O') limit1 = 3;
        		if (el2 == 'C' || el2 == 'N') limit2 = 4;
        		else if (el2 == 'O') limit2 = 3;
        		
        		if (limit1 > 0 || limit2 > 0)
        		{
        		    let boB1A1 = 0, boB1A2 = 0, boB2A1 = 0, boB2A2 = 0;
					for (let i = 1; i <= mol.numBonds; i++)
        		    {
						if (i != b2 && (mol.bondFrom(i) == a1 || mol.bondTo(i) == a1)) boB1A1 += mol.bondOrder(i);
						if (i != b2 && (mol.bondFrom(i) == a2 || mol.bondTo(i) == a2)) boB1A2 += mol.bondOrder(i);
						if (i != b1 && (mol.bondFrom(i) == a1 || mol.bondTo(i) == a1)) boB2A1 += mol.bondOrder(i);
						if (i != b1 && (mol.bondFrom(i) == a2 || mol.bondTo(i) == a2)) boB2A2 += mol.bondOrder(i);
        		    }
					let bad1 = 0, bad2 = 0;
					if (limit1 > 0 && boB1A1 > limit1) bad1++;
					if (limit2 > 0 && boB1A2 > limit2) bad1++;
					if (limit1 > 0 && boB2A1 > limit1) bad2++;
					if (limit2 > 0 && boB2A2 > limit2) bad2++;
        		    
        		    if (bad1 < bad2) continue; // stick with current best
        		    if (bad1 > bad2) {best = n; continue;} // switch to new best
        		}
        	    
        		// otherwise pick the most interesting
				let exotic1 = 2 * mol.bondOrder(b1), exotic2 = 2 * mol.bondOrder(b2);
				exotic1 += (exotic1 == 0 ? 4 : 0) + (mol.bondType(b1) != Molecule.BONDTYPE_NORMAL ? 1 : 0);
				exotic2 += (exotic2 == 0 ? 4 : 0) + (mol.bondType(b2) != Molecule.BONDTYPE_NORMAL ? 1 : 0);
        		
				if (exotic2 > exotic1) best = n;
    	    }
			keepmask[bidx[best]] = true;
    	    
			p += sz;
    	}
		for (let n = mol.numBonds; n >= 1; n--)
			if (!keepmask[n - 1] || mol.bondFrom(n) == mol.bondTo(n)) mol.deleteBond(n);
    }

    // calculates a weight for each atom relative to a starting atom, N; this is useful when deciding which atoms to move around,
    // i.e. those with higher weight should probably stay where they are; the algorithm is Morgan-like, in that atom values are
    // sequentially added to their neighbours, with the exception of atom N, which is a separating point
    public static calculateWalkWeight(mol:Molecule, atom:number):number[]
    {
		let ccsz = 0, cc = Graph.fromMolecule(mol).calculateComponents();
		for (let n = 0; n < cc.length; n++) if (cc[n] == cc[atom - 1]) ccsz++;

		let w = Vec.numberArray(1, mol.numAtoms), wn = Vec.numberArray(0, mol.numAtoms);
		w[atom - 1] = 0;
		for (; ccsz > 0; ccsz--)
    	{
			for (let n = 0; n < mol.numAtoms; n++) wn[n] = w[n];
			for (let n = 1; n <= mol.numBonds; n++)
    	    {
				let a1 = mol.bondFrom(n) - 1, a2 = mol.bondTo(n) - 1;
				w[a1] += wn[a2] * 0.1;
				w[a2] += wn[a1] * 0.1;
    	    }
			w[atom - 1] = 0;
    	}
    	return w;
    }

/*
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
		final int nb = mol.numBonds;
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
	}*/
    
    // return the total number of attached hydrogens: implicit/explicit + any actual atoms connected to it
    public static totalHydrogens(mol:Molecule, atom:number):number
    {
		let hc = mol.atomHydrogens(atom);
		let adj = mol.atomAdjList(atom);
		for (let n = 0; n < adj.length; n++) if (mol.atomElement(adj[n]) == 'H') hc++;
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
    public static stripHydrogens(mol:Molecule, force?:boolean)
    {
		if (force == null) force = false;

		for (let n = mol.numAtoms; n >= 1; n--)
		{
			if (mol.atomElement(n) != 'H') continue;
			if (!force)
			{
				if (mol.atomCharge(n) != 0 || mol.atomUnpaired(n) != 0) continue;
				if (mol.atomIsotope(n) != Molecule.ISOTOPE_NATURAL) continue;
				if (mol.atomExtra(n) != null || mol.atomTransient(n) != null) continue;
				if (mol.atomAdjCount(n) != 1) continue;
				let other = mol.atomAdjList(n)[0];
				if (mol.atomElement(other) == 'H') continue;
				let bond = mol.atomAdjBonds(n)[0];
				if (mol.bondOrder(bond) != 1 || mol.bondType(bond) != Molecule.BONDTYPE_NORMAL) continue;
				if (mol.atomHExplicit(other) != Molecule.HEXPLICIT_UNKNOWN) continue;
				if (Molecule.HYVALENCE_EL.indexOf(mol.atomElement(other)) < 0) continue;
			}
    		
    		mol.deleteAtomAndBonds(n);
    	}
    }
    
    // looks through each atom's hydrogen count, and converts the number into actual hydrogen atoms, which are added
    // to the end of the atom list in the order encountered; returns the number of new atoms appended
	//
    // if the 'position' parameter is false, then hydrogens are simply added at their parents position (computationally
    // cheap); if true, a reasonable sketch layout method is used
    public static createHydrogens(mol:Molecule, position?:boolean):number
    {
		if (position == null) position = false;

		let na = mol.numAtoms;
		for (let n = 1; n <= na; n++)
    	{
			let hc = mol.atomHydrogens(n);
			if (hc == 0) continue;
			if (mol.atomHExplicit(n) != Molecule.HEXPLICIT_UNKNOWN) mol.setAtomHExplicit(n, 0);

			if (!position)
			{
				for (; hc > 0; hc--)
				{
					let a = mol.addAtom("H", mol.atomX(n), mol.atomY(n));
					mol.addBond(n, a, 1);
				}
			}
			else SketchUtil.placeAdditionalHydrogens(mol, n, hc);
		}
		return mol.numAtoms - na;
    }
    
    // returns atom position as a 3D vector
    public static atomVec3(mol:Molecule, atom:number):number[]
    {
    	if (mol.is3D())
    		return [mol.atomX(atom), mol.atomY(atom), mol.atomZ(atom)];
    	else
    		return [mol.atomX(atom), mol.atomY(atom), 0];
    }
}