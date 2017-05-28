/*
    WebMolKit

    (c) 2010-2017 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='Molecule.ts'/>
///<reference path='Stereochemistry.ts'/>

/*
	A "meta-molecule" is a container for a molecule which stores derived information about it. This is a compensation for the
	fact that the molecular datastructure is extremely minimalistic, and includes only very low level chemical interpretation.
	The low level molecule object is intended to represent a work in progress, something that is likely being sketched or chopped up
	and reassembled by algorithms. The meta-molecule wrapper is based on the assumption that the molecule is "done", and is
	ready to be compared to other fully described molecules.

	Each of the fields contained within may or may not be defined, and should be calculated as necessary, which means that
	this class basically operates as a cache.
	
	Typical use case:
	
		MetaMolecule meta=new MetaMolecule(mol);
		calculateStrictAromaticity();
		calculateStereoRubric();

	Note that the calculations are not necessarily independent, so order of calling can be important.

	Can also be used as a convenient storage place for the "skeleton hash", which is useful for screening isomorphisms.
*/


class MetaMolecule
{
	public atomArom:boolean[] = null;
	public bondArom:boolean[] = null;
	public rubricTetra:number[][] = null;
	public rubricSquare:number[][] = null;
	public rubricOcta:number[][] = null;
	public rubricSides:number[][] = null;
	public hash:string = null;
	public heavyHash:string = null;
	public uniqueElements:string[] = null;

	private piAtom:boolean[] = null; // true for all atoms that have at least one double bond attached


	// --------------------- public methods ---------------------

	constructor(public mol:Molecule)
	{
	}

	// strict aromaticity: considers only rings with pure alternating single/double bonds, i.e. benzene-style; fused ring
	// systems like naphthalene are handled iteratively; many types of aromaticity are excluded, e.g. thiophene (lone pair), 
	// imidazolium (ions) and larger rings (e.g. porphyrins); this calculation is reasonably fast
	public calculateStrictAromaticity():void
	{
		let mol = this.mol;
		this.atomArom = Vec.booleanArray(false, mol.numAtoms);
		this.bondArom = Vec.booleanArray(false, mol.numBonds);

		let rings = mol.findRingsOfSize(6);
		const nr = rings.length;
		if (nr == 0) return;

		// assign the potentially-aromatic rings
		this.ensurePiAtoms();
		let mask = Vec.booleanArray(false, nr); // false=not decided; true=already processed
		for (let n = 0; n < nr; n++)
		{
			for (let i = 0; i < rings[n].length; i++)
			{
				let a = rings[n][i];
				if (!this.piAtom[a - 1])
				{
					mask[n] = true;
					break;
				}
				let b = mol.findBond(a, rings[n][i == rings[n].length - 1 ? 0 : i + 1]);
				let bo = mol.bondOrder(b);
				if (bo != 1 && bo != 2)
				{
					mask[n] = true;
					break;
				}
			}
		}

		// keep classifying rings as aromatic until no change; this needs to be done iteratively, for the benefit of highly
		// embedded ring systems, that can't be classified as aromatic until it is known that their neighbours obviously are
		while (true)
		{
			let anyChange = false;

			for (let n = 0; n < nr; n++) if (!mask[n])
			{
				let phase1 = true, phase2 = true; // has to go 121212 or 212121; already arom=either is OK
				for (let i = 0; i < rings[n].length; i++)
				{
					let b = mol.findBond(rings[n][i], rings[n][i == rings[n].length - 1 ? 0 : i + 1]);
					if (this.bondArom[b - 1]) continue; // valid for either phase
					let bo = mol.bondOrder(b);
					phase1 = phase1 && bo == (2 - (i & 1));
					phase2 = phase2 && bo == (1 + (i & 1));
				}
				if (!phase1 && !phase2) continue;

				for (let i = 0; i < rings[n].length; i++)
				{
					let b = mol.findBond(rings[n][i], rings[n][i == rings[n].length - 1 ? 0 : i + 1]);
					this.bondArom[b - 1] = true;
				}

				mask[n] = true;
				anyChange = true;
			}

			if (!anyChange) break;
		}

		// update the atom aromaticity flags
		for (let n = 0; n < this.bondArom.length; n++) if (this.bondArom[n])
		{
			this.atomArom[mol.bondFrom(n + 1) - 1] = true;
			this.atomArom[mol.bondTo(n + 1) - 1] = true;
		}
	}

/*
	// relaxed aromaticity: based on strict aromaticity, but extends to other small ring sizes; it is also reasonably
	// fast - there are no opportunities for exponential graph-walk blowups
	public void calculateRelaxedAromaticity() throws MoleculeCalcException
	{
		// setup

		atomArom = Vec.booleanArray(false, mol.numAtoms());
		bondArom = Vec.booleanArray(false, mol.numBonds());
		ensurePiAtoms();
		final int na = mol.numAtoms(), nb = mol.numBonds();
		int[] electrons = new int[mol.numAtoms()]; // # lone pair electrons available for donating into the ring; >=2 qualifies
		boolean[] exocyclic = Vec.booleanArray(false, na); // true=has a double bond that sticks out of the ring block
		for (int n = 1; n <= mol.numAtoms(); n++)
		{
			int atno = mol.atomicNumber(n);
			electrons[n - 1] = (Chemistry.ELEMENT_BLOCKS[atno] == 2 ? Chemistry.ELEMENT_VALENCE[atno] : 0) - mol.atomCharge(n) - mol.atomHydrogens(n)
							- mol.atomUnpaired(n);
		}
		for (int n = 1; n <= mol.numBonds(); n++)
		{
			final int bfr = mol.bondFrom(n), bto = mol.bondTo(n), bo = mol.bondOrder(n);
			electrons[bfr - 1] -= bo;
			electrons[bto - 1] -= bo;
			if (bo == 2)
			{
				int rblk1 = mol.atomRingBlock(bfr), rblk2 = mol.atomRingBlock(bto);
				if (rblk1 > 0 && rblk1 != rblk2) exocyclic[bfr - 1] = true;
				if (rblk2 > 0 && rblk2 != rblk1) exocyclic[bto - 1] = true;
			}
		}

		// compile candidate rings: all atoms must have some potentially qualifying pi-action doing on

		List<int[]> rings = new ArrayList<>();
		for (int rsz = 3; rsz <= 7; rsz++) for (int[] rng : mol.findRingsOfSize(rsz))
		{
			boolean valid = true;
			for (int n = 0; n < rsz; n++)
			{
				final int a = rng[n];
				if (!piAtom[a - 1] && electrons[a - 1] < 2 && !exocyclic[a - 1])
				{
					valid = false;
					break;
				}
				int b = mol.findBond(a, rng[n < rsz - 1 ? n + 1 : 0]);
				int bo = mol.bondOrder(b);
				if (bo != 1 && bo != 2)
				{
					valid = false;
					break;
				}
			}
			if (valid) rings.add(rng);
		}

		// keep processing rings, until no new ones are found

		while (rings.size() > 0)
		{
			boolean anyChange = false;

			for (int n = 0; n < rings.size(); n++)
			{
				int[] r = rings.get(n);

				int[] paths = new int[]{0};
				for (int i = 0; i < r.length; i++)
				{
					final int a = r[i];
					final int b1 = mol.findBond(a, r[i < r.length - 1 ? i + 1 : 0]);
					final int b2 = mol.findBond(a, r[i > 0 ? i - 1 : r.length - 1]);
					if (bondArom[b1 - 1])
					{
						// contemplate with or without extra pi-bond
						for (int j = paths.length - 1; j >= 0; j--)
						{
							int e = paths[j] + 2;
							if (Vec.indexOf(e, paths) < 0) paths = Vec.append(paths, e);
						}
					}
					else if (mol.bondOrder(b1) == 2) Vec.addTo(paths, 2);
					else if (electrons[a - 1] >= 2 && mol.bondOrder(b1) == 1 && mol.bondOrder(b2) == 1) Vec.addTo(paths, 2);
				}

				// see if there's anything Hueckel (4N+2) buried in there
				boolean arom = false;
				for (int e : paths)
				{
					if (e == 2 && r.length == 3)
					{
						arom = true;
						break;
					} // N==0 case only for 3 membered rings, e.g. cyclopropylium
					if (e == 6)
					{
						arom = true;
						break;
					}
					// (anything bigger does not apply, because only using small rings)
				}
				if (arom)
				{
					for (int i = 0; i < r.length; i++)
					{
						int a = r[i], b = mol.findBond(a, r[i < r.length - 1 ? i + 1 : 0]);
						atomArom[a - 1] = true;
						bondArom[b - 1] = true;
					}
					rings.remove(n);
					n--;
					anyChange = true;
				}
			}

			if (!anyChange) break;
		}
	}

	// extended Hueckel aromaticity: any ring pathway which meets the 4n+2 PI electron rule, counting double bonds and 
	// lone pairs, is classified as aromatic
	public void calculateExtendedAromaticity() throws MoleculeCalcException
	{
		// !!
		throw new MoleculeCalcException("Hueckel aromaticity: not implemented yet");
	}*/

	// goes through the atoms and bonds, and determines "geometry rubric" sequences for those that are considered to
	// be potentially stereo-active; chemical judgment calls are made within this method
	// NOTE: it is a good idea to calculate aromaticity first, since it can affect atom classification
	public calculateStereoRubric():void
	{
		const mol = this.mol, na = mol.numAtoms, nb = mol.numBonds;
		this.rubricTetra = new Array(na);
		this.rubricSquare = new Array(na);
		this.rubricOcta = new Array(na);
		this.rubricSides = new Array(nb);

		for (let n = 1; n <= na; n++)
		{
			let blk = Chemistry.ELEMENT_BLOCKS[mol.atomicNumber(n)];
			let adjc = mol.atomAdjCount(n), hc = mol.atomHydrogens(n);

			// p-block atoms with 4 neighbours (1 of which can be implicit H) are allowed tetrahedral chirality
			if (blk == 2 && ((adjc == 3 && hc == 1) || (adjc == 4 && hc == 0)))
			{
				this.rubricTetra[n - 1] = Stereochemistry.rubricTetrahedral(mol, n);
			}

			// d- & f-block atoms with 4 neighbours can have square planar constraints
			if (blk >= 3 && adjc == 4 && hc == 0)
			{
				this.rubricSquare[n - 1] = Stereochemistry.rubricSquarePlanar(mol, n);
			}

			// d- & f-block atoms with 5 or 6 neighbours can have octahedral constraints
			if (blk >= 3 && (adjc == 5 || adjc == 6) && hc == 0)
			{
				this.rubricOcta[n - 1] = Stereochemistry.rubricOctahedral(mol, n);
			}
		}

		// certain double bonds are considered to have restricted rotation constraints
		for (let n = 1; n <= mol.numBonds; n++)
		{
			if (mol.bondOrder(n) != 2 || this.isBondAromatic(n)) continue;

			let bfr = mol.bondFrom(n), bto = mol.bondTo(n);
			let blk1 = Chemistry.ELEMENT_BLOCKS[mol.atomicNumber(bfr)];
			let blk2 = Chemistry.ELEMENT_BLOCKS[mol.atomicNumber(bto)];
			let adjc1 = mol.atomAdjCount(bfr), hc1 = mol.atomHydrogens(bfr);
			let adjc2 = mol.atomAdjCount(bto), hc2 = mol.atomHydrogens(bto);

			// if both sides of the bond are p-block atoms, and have 2 substituents, can be side-constrained
			// (note: things like C=N-, with potentially constrained lone pairs, are not considered)
			if (blk1 == 2 && blk2 == 2 && (adjc1 + hc1 == 3 && hc1 <= 1) && (adjc2 + hc2 == 3 && hc2 <= 1))
			{
				this.rubricSides[n - 1] = Stereochemistry.rubricBondSides(mol, n);
			}
		}
	}

/*
	// defines the "skeleton hash" field, for prescreening
	public void calculateSkeletonHash()
	{
		hash = new SkeletonHash(mol).generate();
	}

	// define the "heavy hash": like for skeleton, but with explicit hydrogens removed
	public void calculateHeavyHash()
	{	
		boolean anyH = false;
		for (int n = 1; n <= mol.numAtoms(); n++) if (mol.atomElement(n).equals("H")) {anyH = true; break;}
		if (!anyH)
		{
			heavyHash = getSkeletonHash();
			return;
		}
		
		Molecule hvy = mol.clone();
		for (int n = hvy.numAtoms(); n >= 1; n--) if (hvy.atomElement(n).equals("H")) hvy.deleteAtomAndBonds(n);
		heavyHash = new SkeletonHash(hvy).generate();
	}*/
	
	// access to aromaticity: either by 1-based single index, or grabbing the whole array
	public isAtomAromatic(atom:number):boolean
	{
		return this.atomArom == null ? false : this.atomArom[atom - 1];
	}
	public isBondAromatic(bond:number):boolean
	{
		return this.bondArom == null ? false : this.bondArom[bond - 1];
	}
	
	// modified version of bond order: returns -1 to encode for aromaticity; if not aromatic, or aromaticity wasn't calculated,
	// this is the same as the regular bond order
	public bondOrderArom(bond:number):number
	{
		return this.bondArom != null && this.bondArom[bond - 1] ? -1 : this.mol.bondOrder(bond);
	}

	public getAtomAromaticity():boolean[]
	{
		return this.atomArom == null ? null : this.atomArom.slice(0);
	}
	public getBondAromaticity():boolean[]
	{
		return this.bondArom == null ? null : this.bondArom.slice(0);
	}

/*
	// cached access to hash-type properties: first invocation slow, after that fast
	public String getSkeletonHash()
	{
		if (hash == null) calculateSkeletonHash();
		return hash;
	}
	public String getHeavyHash()
	{
		if (heavyHash == null) calculateHeavyHash();
		return heavyHash;
	}
	public DotPath getDotPath()
	{
		if (dots == null) dots = new DotPath(mol);
		return dots;
	}*/

	public getUniqueElements():string[]
	{
		if (this.uniqueElements == null)
		{
			this.uniqueElements = [];
			for (let n = 1; n <= this.mol.numAtoms; n++)
			{
				let el = this.mol.atomElement(n);
				if (this.uniqueElements.indexOf(el) < 0) this.uniqueElements.push(el);
			}
		}
		return this.uniqueElements;
	}

/*
	// equivalence: assumes that both metavectors have been marked up according to the same additional into, i.e.
	// aromaticity, stereo, etc.; it will try to resolve the equivalence and get to the answer as quickly as possible,
	// with the isomorphism test being the final option
	public boolean equivalentTo(MetaMolecule other)
	{
		return equivalentTo(other, 1000);
	}

	public boolean equivalentTo(MetaMolecule other, int timeout)
	{
		// phase 1: different atom/bond counts, don't waste any time
		if (mol.numAtoms() != other.mol.numAtoms() || mol.numBonds() != other.mol.numBonds()) return false;

		// phase 2: make sure both hashes are generated, and use to screen
		if (hash == null) calculateSkeletonHash();
		if (other.hash == null) other.calculateSkeletonHash();
		if (!hash.equals(other.hash)) return false;

		// phase 3: if molecules are literally equal, no need to get fancy
		if (new CompareMolecules(mol,other.mol).compare() == 0) return true;

		// phase 4: check if any elements are unique on either side
		String[] uniq1 = getUniqueElements(), uniq2 = other.getUniqueElements();
		for (int n = 0; n < uniq1.length; n++)
		{
			if (Vec.indexOf(uniq1[n], uniq2) < 0) return false;
		}

		// phase 5: the most laborious part, finding any isomorphism
		SubstructureSearch ss = new SubstructureSearch(this, other);
		ss.setTimeout(timeout);
		return ss.searchNext() == SubstructureSearch.SEARCH_FOUND;
	}*/

	// convenience constructor alternatives
	public static createRubric(mol:Molecule):MetaMolecule
	{
		if (mol == null) return null;
		let meta = new MetaMolecule(mol);
		meta.calculateStereoRubric();
		return meta;
	}

	public static createStrict(mol:Molecule):MetaMolecule
	{
		if (mol == null) return null;
		let meta = new MetaMolecule(mol);
		meta.calculateStrictAromaticity();
		return meta;
	}

	public static createStrictRubric(mol:Molecule):MetaMolecule
	{
		if (mol == null) return null;
		let meta = new MetaMolecule(mol);
		meta.calculateStrictAromaticity();
		meta.calculateStereoRubric();
		return meta;
	}

	/*public static createRelaxedRubric(mol:Molecule):MetaMolecule
	{
		if (mol == null) return null;
		MetaMolecule meta = new MetaMolecule(mol);
		meta.calculateRelaxedAromaticity();
		meta.calculateStereoRubric();
		return meta;
	}*/

	// ------------------ private methods --------------------

	// define pi-atoms, if not already
	private ensurePiAtoms():void
	{
		if (this.piAtom != null) return;
		this.piAtom = Vec.booleanArray(false, this.mol.numAtoms);
		for (let n = 1; n <= this.mol.numBonds; n++) if (this.mol.bondOrder(n) == 2)
		{
			{
				this.piAtom[this.mol.bondFrom(n) - 1] = true;
				this.piAtom[this.mol.bondTo(n) - 1] = true;
			}
		}
	}
}