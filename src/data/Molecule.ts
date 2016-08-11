/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='MoleculeStream.ts'/>
///<reference path='Chemistry.ts'/>
///<reference path='../util/Vec.ts'/>

/*
	A dynamic representation of a molecule, which is analogous to the com.mmi.core.mol.Molecule class.

	The molecule representation is conveniently interconvertible with the SketchEl format, which is the "string"
	representation.
*/

class Atom
{
	element:string;
	x:number;
	y:number;
	charge:number;
	unpaired:number;
	isotope:number;
	hExplicit:number;
	mapNum:number;
	extra:string[];
	transient:string[];
}

class Bond
{
	from:number;
	to:number;
	order:number;
	type:number;
	extra:string[];
	transient:string[];
}

class Molecule
{
	private atoms:Atom[] = [];
	private bonds:Bond[] = [];

	public keepTransient = false;
	private hasTransient = false;
	
	private graph:number[][] = null;
	private graphBond:number[][] = null;
	private ringID:number[] = null;
	private compID:number[] = null;
	private ring3:number[][] = null;
	private ring4:number[][] = null;
	private ring5:number[][] = null;
	private ring6:number[][] = null;
	private ring7:number[][] = null;

	public static IDEALBOND = 1.5;
	public static HEXPLICIT_UNKNOWN = -1;
	public static ISOTOPE_NATURAL = 0;
	public static BONDTYPE_NORMAL = 0;
	public static BONDTYPE_INCLINED = 1;
	public static BONDTYPE_DECLINED = 2;
	public static BONDTYPE_UNKNOWN = 3;

	// ------------ public methods ------------

	constructor()
	{
		
	}
	
	public clone():Molecule {return Molecule.fromString(this.toString());}
	public static fromString(strData:string):Molecule {return MoleculeStream.readNative(strData);}
	public toString():string {return MoleculeStream.writeNative(this);}
	
	// takes the indicated molecular fragment and appends it to the end of the current molecule, with order preserved
	public append(frag:Molecule):void
	{
		let base = this.atoms.length;
		for (let n = 1; n <= frag.numAtoms(); n++)
		{
			let num = this.addAtom(frag.atomElement(n), frag.atomX(n), frag.atomY(n), frag.atomCharge(n), frag.atomUnpaired(n));
			this.setAtomIsotope(num, frag.atomIsotope(n));
			this.setAtomHExplicit(num, frag.atomHExplicit(n));
			this.setAtomMapNum(num, frag.atomMapNum(n));
			this.setAtomExtra(num, frag.atomExtra(n));
		}
		for (let n = 1; n <= frag.numBonds(); n++)
		{
			let num = this.addBond(frag.bondFrom(n) + base, frag.bondTo(n) + base, frag.bondOrder(n), frag.bondType(n));
			this.setBondExtra(num, frag.bondExtra(n));
		}
		this.trashTransient();
	}


	public numAtoms():number {return this.atoms.length;}
	public getAtom(idx:number):Atom 
	{
		if (idx < 1 || idx > this.atoms.length) throw `Molecule.getAtom: index ${idx} out of range (#atoms=${this.atoms.length})`;;
		return this.atoms[idx - 1];
	}
	
	public atomElement(idx:number):string {return this.getAtom(idx).element;}
	public atomX(idx:number):number {return this.getAtom(idx).x;}
	public atomY(idx:number):number {return this.getAtom(idx).y;}
	public atomCharge(idx:number):number {return this.getAtom(idx).charge;}
	public atomUnpaired(idx:number):number {return this.getAtom(idx).unpaired;}
	public atomIsotope(idx:number):number {return this.getAtom(idx).isotope;}
	public atomHExplicit(idx:number):number {return this.getAtom(idx).hExplicit;}
	public atomMapNum(idx:number):number {return this.getAtom(idx).mapNum;}
	public atomExtra(idx:number):string[] {return this.getAtom(idx).extra.slice(0);}
	public atomTransient(idx:number):string[] {return this.getAtom(idx).transient.slice(0);}
		
	public numBonds():number {return this.bonds.length;}
	public getBond(idx:number):Bond 
	{
		if (idx < 1 || idx > this.bonds.length) throw `Molecule.getBond: index ${idx} out of range (#bonds=${this.bonds.length})`;;
		return this.bonds[idx - 1];
	}
	
	public bondFrom(idx:number):number {return this.getBond(idx).from;}
	public bondTo(idx:number):number {return this.getBond(idx).to;}
	public bondOrder(idx:number):number {return this.getBond(idx).order;}
	public bondType(idx:number):number {return this.getBond(idx).type;}
	public bondExtra(idx:number):string[] {return this.getBond(idx).extra.slice(0);}
	public bondTransient(idx:number):string[] {return this.getBond(idx).transient.slice(0);}

	public addAtom(element:string, x:number, y:number, charge:number = 0, unpaired:number = 0):number
	{
		let a = new Atom();
		a.element = element;
		a.x = x;
		a.y = y;
		a.charge = charge;
		a.unpaired = unpaired;
		a.isotope = Molecule.ISOTOPE_NATURAL;
		a.hExplicit = Molecule.HEXPLICIT_UNKNOWN;
		a.mapNum = 0;
		a.extra = [];
		a.transient = [];
		this.atoms.push(a);
		this.trashTransient();
		this.trashGraph();
		return this.atoms.length;
	}

	public setAtomElement = function(idx:number, element:string)
	{
		this.getAtom(idx).element = element;
		this.trashTransient();
	}
	public setAtomPos = function(idx:number, x:number, y:number)
	{
		let a = this.getAtom(idx);
		a.x = x;
		a.y = y;
		this.trashTransient();
	}
	public setAtomX = function(idx:number, x:number)
	{
		this.getAtom(idx).x = x;
		this.trashTransient();
	}
	public setAtomY = function(idx:number, y:number)
	{
		this.getAtom(idx).y = y;
		this.trashTransient();
	}
	public setAtomCharge = function(idx:number, charge:number)
	{
		this.getAtom(idx).charge = charge;
		this.trashTransient();
	}
	public setAtomUnpaired = function(idx:number, unpaired:number)
	{
		this.getAtom(idx).unpaired = unpaired;
		this.trashTransient();
	}
	public setAtomIsotope = function(idx:number, isotope:number)
	{
		this.getAtom(idx).isotope = isotope;
		this.trashTransient();
	}
	public setAtomHExplicit = function(idx:number, hExplicit:number)
	{
		this.getAtom(idx).hExplicit = hExplicit;
		this.trashTransient();
	}
	public setAtomMapNum = function(idx:number, mapNum:number)
	{
		this.getAtom(idx).mapNum = mapNum;
		this.trashTransient();
	}
	public setAtomExtra = function(idx:number, extra:string[])
	{
		this.getAtom(idx).extra = extra.slice(0);
	}
	public setAtomTransient = function(idx:number, transi:string[])
	{
		this.getAtom(idx).transient = transi.slice(0);
		if (transi.length > 0) this.hasTransient = true;
	}

	public addBond(from:number, to:number, order:number, type:number = Molecule.BONDTYPE_NORMAL)
	{
		let b = new Bond();
		b.from = from;
		b.to = to;
		b.order = order;
		b.type = type;
		b.extra = [];
		b.transient = [];
		this.bonds.push(b);
		this.trashTransient();
		this.trashGraph();
		return this.bonds.length;
	}

	public setBondFrom(idx:number, from:number)
	{
		this.getBond(idx).from = from;
		this.trashTransient();
		this.trashGraph();
	}
	public setBondTo(idx:number, to:number)
	{
		this.getBond(idx).to = to;
		this.trashTransient();
		this.trashGraph();
	}
	public setBondOrder(idx:number, order:number)
	{
		this.getBond(idx).order = order;
		this.trashTransient();
	}
	public setBondType(idx:number, type:number)
	{
		this.getBond(idx).type = type;
		this.trashTransient();
	}
	public setBondExtra(idx:number, extra:string[])
	{
		this.getBond(idx).extra = extra.slice(0);
	}
	public setBondTransient(idx:number, transi:string[])
	{
		this.getBond(idx).transient = transi.slice(0);
		if (transi.length > 0) this.hasTransient = true;
	}

	public deleteAtomAndBonds(idx:number)
	{
		for (let n = this.numBonds(); n >= 1; n--)
		{
			if (this.bondFrom(n) == idx || this.bondTo(n) == idx)
				this.deleteBond(n);
			else
			{
				if (this.bondFrom(n) > idx) this.setBondFrom(n, this.bondFrom(n) - 1);
				if (this.bondTo(n) > idx) this.setBondTo(n, this.bondTo(n) - 1);
			}
		}
		this.atoms.splice(idx - 1, 1);
		this.trashTransient();
		this.trashGraph();
	}
	public deleteBond(idx:number)
	{
		this.bonds.splice(idx - 1, 1);
		this.trashTransient();
		this.trashGraph();
	}

	// uses either explicit or computed number to determine how many hydrogens the atom has; the field for explicit hydrogens takes
	// absolute preference, if it has its default value of 'unknown', the number is computed by looking up the hydrogen capacity for
	// the element (most of which are zero), subtracting the total of bond orders, then returning the difference, or zero; the calculation
	// tends to err on the side of too few, since the concept is just an aid to drawing organic structures, not a cheminformatic attempt
	// to compensate for 2 1/2 decades of bad file formats
	// (note: returns "implicit"+"explicit", but does NOT count "actual" hydrogens, i.e. those which have their own atom nodes)
	public atomHydrogens(idx:number):number
	{
		const HYVALENCE_EL = ['C','N','O','S','P'];
		const HYVALENCE_VAL =[ 4,  3,  2,  2,  3 ];

		let hy = this.atomHExplicit(idx);
		if (hy != Molecule.HEXPLICIT_UNKNOWN) return hy;

		for (let n = 0; n < HYVALENCE_EL.length; n++) if (HYVALENCE_EL[n] == this.atomElement(idx))
		{
			hy = HYVALENCE_VAL[n];
			break;
		}
		if (hy == Molecule.HEXPLICIT_UNKNOWN) return 0;
		let ch = this.atomCharge(idx);
		if (this.atomElement(idx) == 'C') ch = -Math.abs(ch);
		hy += ch - this.atomUnpaired(idx);
		let adjBonds = this.atomAdjBonds(idx);
		for (let n = 0; n < adjBonds.length; n++) hy -= this.bondOrder(adjBonds[n]);
		return hy < 0 ? 0 : hy;
	}

	// returns the index of the bond between the two atoms, or 0 if none
	// NOTE: uncached==>slow
	public findBond(a1:number, a2:number):number
	{
		for (let n = 1; n <= this.numBonds(); n++)
		{
			let b1 = this.bondFrom(n), b2 = this.bondTo(n);
			if ((a1 == b1 && a2 == b2) || (a1 == b2 && a2 == b1)) return n;
		}
		return 0;
	}

	// for a bond, returns the end which is not==Ref; return value will be From,To or 0    
	public bondOther(idx:number, ref:number):number
	{
		let b1 = this.bondFrom(idx), b2 = this.bondTo(idx);
		if (b1 == ref) return b2;
		if (b2 == ref) return b1;
		return 0;
	}

	// returns whether an atom logically ought to be drawn "explicitly";if false, it is a carbon which should be just a dot
	public atomExplicit(idx:number):boolean
	{
		let a = this.atoms[idx - 1];
		if (a.isotope != Molecule.ISOTOPE_NATURAL) return true;
		if (a.element != 'C' || a.charge != 0 || a.unpaired != 0) return true;
		if (this.atomAdjCount(idx) == 0) return true;
		return false;
	}

	// returns the numerical ID of the ring block in which the atom resides, or 0 if it is not in a ring   
	public atomRingBlock(idx:number):number
	{
		if (this.graph == null) this.buildGraph();
		if (this.ringID == null) this.buildRingID();
		return this.ringID[idx - 1];
	}

	// returns whether or not a bond resides in a ring (i.e. ring block of each end is the same and nonzero)
	public bondInRing(idx:number):boolean
	{
		let r1 = this.atomRingBlock(this.bondFrom(idx)), r2 = this.atomRingBlock(this.bondTo(idx));
		return r1 > 0 && r1 == r2;
	}

	// returns the connected component ID of the atom, always 1 or more
	public atomConnComp(idx:number):number
	{
		if (this.graph == null) this.buildGraph();
		if (this.compID == null) this.buildConnComp();
		return this.compID[idx - 1];
	}


	// returns the number of neighbours of an atom
	// NOTE: uncached==>slow
	public atomAdjCount(idx:number):number
	{
		this.buildGraph();
		return this.graph[idx - 1].length;
	}

	// returns the actual adjacency list of an atom; the return value is a 1-based deep copy
	public atomAdjList(idx:number):number[]
	{
		this.buildGraph();
		let adj = this.graph[idx - 1].slice(0);
		for (let n = adj.length - 1; n >= 0; n--) adj[n]++;
		return adj;
	}

	// returns the bond indices of the adjacency list for the atom; the return value is a 1-based deep copy
	public atomAdjBonds(idx:number):number[]
	{
		this.buildGraph();
		return this.graphBond[idx - 1].slice(0);
	}

	// returns _all_ rings of indicated size; each item in the array list is an array of int[Size], a consecutively ordered array of atom 
	// numbers; uses a recursive depth first search, which must be bounded above by Size being small in order to avoid exponential blowup
	public findRingsOfSize(size:number):number[][]
	{
		let rings:number[][] = null;
		if (size == 3 && this.ring3 != null) rings = this.ring3;
		if (size == 4 && this.ring4 != null) rings = this.ring4;
		if (size == 5 && this.ring5 != null) rings = this.ring5;
		if (size == 6 && this.ring6 != null) rings = this.ring6;
		if (size == 7 && this.ring7 != null) rings = this.ring7;

		if (rings == null)
		{
			if (this.graph == null) this.buildGraph();
			if (this.ringID == null) this.buildRingID();

			rings = [];
			for (let n = 1; n <= this.atoms.length; n++)
			{
				if (this.ringID[n - 1] > 0)
				{
					let path = Vec.numberArray(0, size);
					path[0] = n;
					this.recursiveRingFind(path, 1, size, this.ringID[n - 1], rings);
				}
			}

			if (size == 3) this.ring3 = rings;
			if (size == 4) this.ring4 = rings;
			if (size == 5) this.ring5 = rings;
			if (size == 6) this.ring6 = rings;
			if (size == 7) this.ring7 = rings;
		}

		let ret:number[][] = [];
		for (let n = 0; n < rings.length; n++) ret.push(rings[n].slice(0));
		return ret;
	}

	// molecule boundaries
	public boundary():Box
	{
		if (this.atoms.length == 0) return Box.zero();
		let x1 = this.atoms[0].x, x2 = x1;
		let y1 = this.atoms[0].y, y2 = y1;
		for (let n = 1; n < this.atoms.length; n++)
		{
			x1 = Math.min(x1, this.atoms[n].x);
			y1 = Math.min(y1, this.atoms[n].y);
			x2 = Math.max(x2, this.atoms[n].x);
			y2 = Math.max(y2, this.atoms[n].y);
		}
		return new Box(x1, y1, x2 - x1, y2 - y1);
	}

	// lookup the atomic number for the element, or return 0 if not in the periodic table
	public atomicNumber(idx:number):number
	{
		return Molecule.elementAtomicNumber(this.atomElement(idx));
	}

	public static elementAtomicNumber(element:string):number
	{
		return Math.max(0, Chemistry.ELEMENTS.indexOf(element));
	}

	// literal comparison to another molecule, which can be used for ordering purposes: returns -1/0/1
	public compareTo(other:Molecule):number
	{
		if (other == null || other.numAtoms() == 0) return this.numAtoms() == 0 ? 0 : 1; // null is equivalent to empty
		if (this.numAtoms() < other.numAtoms()) return -1;
		if (this.numAtoms() > other.numAtoms()) return 1;
		if (this.numBonds() < other.numBonds()) return -1;
		if (this.numBonds() > other.numBonds()) return 1;
		
		for (let n = 1;n <= this.numAtoms(); n++)
		{
			if (this.atomElement(n) < other.atomElement(n)) return -1;
			if (this.atomElement(n) > other.atomElement(n)) return 1;
			if (this.atomX(n) < other.atomX(n)) return -1; if (this.atomX(n) > other.atomX(n)) return 1;
			if (this.atomY(n) < other.atomY(n)) return -1; if (this.atomY(n) > other.atomY(n)) return 1;
			if (this.atomCharge(n) < other.atomCharge(n)) return -1; if (this.atomCharge(n) > other.atomCharge(n)) return 1;
			if (this.atomUnpaired(n) < other.atomUnpaired(n)) return -1; if (this.atomUnpaired(n) > other.atomUnpaired(n)) return 1;
			if (this.atomHExplicit(n) < other.atomHExplicit(n)) return -1; if (this.atomHExplicit(n) > other.atomHExplicit(n)) return 1;
			if (this.atomIsotope(n) < other.atomIsotope(n)) return -1; if (this.atomIsotope(n) > other.atomIsotope(n)) return 1;
			if (this.atomMapNum(n) < other.atomMapNum(n)) return -1; if (this.atomMapNum(n) > other.atomMapNum(n)) return 1;
			
			let tx1 = this.atomExtra(n), tx2 = other.atomExtra(n);
			if (tx1.length < tx2.length) return -1; if (tx1.length > tx2.length) return 1;
			for (let i = 0; i < tx1.length; i++) if (tx1[i] < tx2[i]) return -1; else if (tx1[i] > tx2[i]) return 1;
		
			tx1 = this.atomTransient(n); tx2 = other.atomTransient(n);
			if (tx1.length < tx2.length) return -1; if (tx1.length > tx2.length) return 1;
			for (let i = 0; i < tx1.length; i++) if (tx1[i] < tx2[i]) return -1; else if (tx1[i] > tx2[i]) return 1;
		}
		for (let n = 1; n <= this.numBonds(); n++)
		{
			if (this.bondFrom(n) < other.bondFrom(n)) return -1; if (this.bondFrom(n) > other.bondFrom(n)) return 1;
			if (this.bondTo(n) < other.bondTo(n)) return -1; if (this.bondTo(n) > other.bondTo(n)) return 1;
			if (this.bondOrder(n) < other.bondOrder(n)) return -1; if (this.bondOrder(n) > other.bondOrder(n)) return 1;
			if (this.bondType(n) < other.bondType(n)) return -1; if (this.bondType(n) > other.bondType(n)) return 1;
		
			let tx1 = this.bondExtra(n), tx2 = other.bondExtra(n);
			if (tx1.length < tx2.length) return -1; if (tx1.length > tx2.length) return 1;
			for (let i = 0; i < tx1.length; i++) if (tx1[i] < tx2[i]) return -1; else if (tx1[i] > tx2[i]) return 1;
			
			tx1 = this.bondTransient(n); tx2 = other.bondTransient(n);
			if (tx1.length < tx2.length) return -1; if (tx1.length > tx2.length) return 1;
			for (let i = 0; i < tx1.length; i++) if (tx1[i] < tx2[i]) return -1; else if (tx1[i] > tx2[i]) return 1;
		}
		
		return 0;
	}

	// ------------ private methods ------------
	
	// must be called when the molecule's graph changes; do not call for changing labels or coordinates
	private trashGraph()
	{
		this.graph = null;
		this.graphBond = null;
	}

	// must be called when _any_ change to the molecule is affected; the transient extension fields are cleared out
	private trashTransient()
	{
		if (this.keepTransient || !this.hasTransient) return;
		for (let a of this.atoms) a.transient = [];
		for (let b of this.bonds) b.transient = [];
		this.hasTransient = false;
	}
	
	// if the computed graph is not defined, rebuild it
	private buildGraph()
	{
		if (this.graph != null && this.graphBond != null) return;
		
		let graph:number[][] = [], graphBond:number[][] = [];
		let na = this.numAtoms(), nb = this.numBonds();

		for (let n = 0; n < na; n++)
		{
			graph.push([]);
			graphBond.push([]);
		}
		for (let n = 1; n <= nb; n++)
		{
			let b = this.getBond(n);
			graph[b.from - 1].push(b.to - 1);
			graph[b.to - 1].push(b.from - 1);
			graphBond[b.from - 1].push(n);
			graphBond[b.to - 1].push(n);
		}
		
		this.graph = graph;
		this.graphBond = graphBond;
	}

	// passes over the graph establishing which component each atom belongs to
	private buildConnComp():void
	{
		const numAtoms = this.atoms.length;

		this.compID = Vec.numberArray(0, numAtoms);
		for (let n = 0; n < numAtoms; n++) this.compID[n] = 0;
		let comp = 1;
		this.compID[0] = comp;

		// (not very efficient, should use a stack-based depth first search)
		while (true)
		{
			let anything = false;
			for (let n = 0; n < numAtoms; n++) if (this.compID[n] == comp)
			{
				for (let i = 0; i < this.graph[n].length; i++)
				{
					if (this.compID[this.graph[n][i]] == 0)
					{
						this.compID[this.graph[n][i]] = comp;
						anything = true;
					}
				}
			}

			if (!anything)
			{
				for (let n = 0; n < numAtoms; n++)
				{
					if (this.compID[n] == 0)
					{
						this.compID[n] = ++comp;
						anything = true;
						break;
					}
				}
				if (!anything) break;
			}
		}
	}

	// update the ring-block-identifier for each atom
	private buildRingID():void
	{
		const numAtoms = this.atoms.length;

		this.ringID = Vec.numberArray(0, numAtoms);
		if (numAtoms == 0) return;
		let visited = Vec.booleanArray(false, numAtoms);
		for (let n = 0; n < numAtoms; n++)
		{
			this.ringID[n] = 0;
			visited[n] = false;
		}

		let path = Vec.numberArray(0, numAtoms + 1), plen = 0, numVisited = 0;
		while (true)
		{
			let last:number, current:number;

			if (plen == 0) // find an element of a new component to visit
			{
				last = -1;
				for (current = 0; visited[current]; current++) {}
			}
			else
			{
				last = path[plen - 1];
				current = -1;
				for (let n = 0; n < this.graph[last].length; n++)
				{
					if (!visited[this.graph[last][n]])
					{
						current = this.graph[last][n];
						break;
					}
				}
			}

			if (current >= 0 && plen >= 2) // path is at least 2 items long, so look for any not-previous visited neighbours
			{
				let back = path[plen - 1];
				//System.out.println(" back="+back);
				for (let n = 0; n < this.graph[current].length; n++)
				{
					let join = this.graph[current][n];
					if (join != back && visited[join])
					{
						path[plen] = current;
						for (let i = plen; i == plen || path[i + 1] != join; i--)
						{
							let id = this.ringID[path[i]];
							if (id == 0) this.ringID[path[i]] = last;
							else if (id != last)
							{
								for (let j = 0; j < numAtoms; j++)
									if (this.ringID[j] == id) this.ringID[j] = last;
							}
						}
					}
				}
			}
			if (current >= 0) // can mark the new one as visited
			{
				visited[current] = true;
				path[plen++] = current;
				numVisited++;
			}
			else
			{
				// otherwise, found nothing and must rewind the path
				plen--;
			}

			if (numVisited == numAtoms) break;
		}

		// the ring ID's are not necessarily consecutive, so reassign them to 0=none, 1..NBlocks
		let nextID = 0;
		for (let i = 0; i < numAtoms; i++)
		{
			if (this.ringID[i] > 0)
			{
				nextID--;
				for (let j = numAtoms - 1; j >= i; j--) if (this.ringID[j] == this.ringID[i]) this.ringID[j] = nextID;
			}
		}
		for (let i = 0; i < numAtoms; i++) this.ringID[i] = -this.ringID[i];
	}

	// ring hunter: recursive step; finds, compares and collects
	private recursiveRingFind(path:number[], psize:number, capacity:number, rblk:number, rings:number[][]):void
	{
		// not enough atoms yet, so look for new possibilities
		if (psize < capacity)
		{
			let last = path[psize - 1];
			for (let n = 0; n < this.graph[last - 1].length; n++)
			{
				let adj = this.graph[last - 1][n] + 1;
				if (this.ringID[adj - 1] != rblk) continue;
				let fnd = false;
				for (let i = 0; i < psize; i++)
				{
					if (path[i] == adj)
					{
						fnd = true;
						break;
					}
				}
				if (!fnd)
				{
					let newPath = path.slice(0);
					newPath[psize] = adj;
					this.recursiveRingFind(newPath, psize + 1, capacity, rblk, rings);
				}
			}
			return;
		}

		// path is full, so make sure it eats its tail
		let last = path[psize - 1];
		let fnd = false;
		for (let n = 0; n < this.graph[last - 1].length; n++)
		{
			if (this.graph[last - 1][n] + 1 == path[0])
			{
				fnd = true;
				break;
			}
		}
		if (!fnd) return;

		// make sure every element in the path has exactly 2 neighbours within the path; otherwise it is spanning a bridge, which
		// is an undesirable ring definition
		for (let n = 0; n < path.length; n++)
		{
			let count = 0, p = path[n] - 1;
			for (let i = 0; i < this.graph[p].length; i++) if (path.indexOf(this.graph[p][i] + 1) >= 0) count++;
			if (count != 2) return; // invalid
		}

		// reorder the array then look for duplicates
		let first = 0;
		for (let n = 1; n < psize; n++) if (path[n] < path[first]) first = n;
		let fm = (first - 1 + psize) % psize, fp = (first + 1) % psize;
		let flip = path[fm] < path[fp];
		if (first != 0 || flip)
		{
			let newPath = Vec.numberArray(0, psize);
			for (let n = 0; n < psize; n++) newPath[n] = path[(first + (flip ? psize - n : n)) % psize];
			path = newPath;
		}

		for (let n = 0; n < rings.length; n++)
		{
			let look = rings[n];
			let same = true;
			for (let i = 0; i < psize; i++)
			{
				if (look[i] != path[i])
				{
					same = false;
					break;
				}
			}
			if (same) return;
		}

		rings.push(path);
	}	
}

