/*
    MolSync

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=molsync]
*/

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
}

