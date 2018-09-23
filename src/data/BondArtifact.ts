/*
	WebMolKit

	(c) 2010-2018 Molecular Materials Informatics, Inc.

	All rights reserved
	
	http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='Molecule.ts'/>
///<reference path='MolUtil.ts'/>
///<reference path='Graph.ts'/>
///<reference path='../util/util.ts'/>

namespace WebMolKit /* BOF */ {

/*
	Bond artifacts: looks for metadata instructions that indicate that certain core bond types should be drawn in some way other than
	the minimalistic bond primitives that are available in the core datastructure.
	
	Types:
		ResPath: a linear resonance pathway, where the bond order and total charge are depicted as a continuous average
		ResRing: a ring pathway, where the bond order and total charge are circularly delocalised
		Arene: an atom having a bond that protrudes into the centre of a group of resonance-delocalised atoms (usually a ring)
		
	The atom orderings are guaranteed to be in a sensible order, i.e. path/ring traversal.
*/

export const BONDARTIFACT_EXTRA_RESPATH = 'xRESPATH:';
export const BONDARTIFACT_EXTRA_RESRING = 'xRESRING:';
export const BONDARTIFACT_EXTRA_ARENE = 'xARENE:';

export interface BondArtifactResPath
{
	atoms:number[]; // line of resonance-style bonding
}
export interface BondArtifactResRing
{
	atoms:number[]; // single ring of resonating bonds (ring can be any size)
}
export interface BondArtifactArene
{
	centre:number; // atom to which the arene is bonded
	atoms:number[]; // ring (or partial ring) that is side-bonded
}

export class BondArtifact
{
	private resPaths = new Map<number, BondArtifactResPath>();
	private resRings = new Map<number, BondArtifactResRing>();
	private arenes = new Map<number, BondArtifactArene>();

	// ------------ public methods ------------
	
	constructor(public mol:Molecule)
	{
		// pull out the raw content from the molecule's extra fields
		for (let n = 1; n <= this.mol.numAtoms; n++)
		{
			for (let str of this.mol.atomExtra(n))
			{
				if (str.startsWith(BONDARTIFACT_EXTRA_RESPATH)) this.appendResPath(n, str.substring(BONDARTIFACT_EXTRA_RESPATH.length).split(':'));
				else if (str.startsWith(BONDARTIFACT_EXTRA_RESRING)) this.appendResRing(n, str.substring(BONDARTIFACT_EXTRA_RESRING.length).split(':'));
				else if (str.startsWith(BONDARTIFACT_EXTRA_ARENE)) this.appendArene(n, str.substring(BONDARTIFACT_EXTRA_ARENE.length).split(':'));
			}
		}
		
		// clean each one up, or remove if invalid
		for (let [blk, res] of this.resPaths.entries())
		{
			res.atoms = this.pack(res.atoms);
			if (!this.pathify(res.atoms, false)) this.resPaths.delete(blk);
		}
		for (let [blk, res] of this.resRings.entries())
		{
			res.atoms = this.pack(res.atoms);
			if (!this.pathify(res.atoms, true)) this.resRings.delete(blk);
		}
		for (let [blk, res] of this.arenes.entries())
		{
			res.atoms = this.pack(res.atoms);
			if (res.atoms.length > 1) res.centre = res.atoms.shift();
			if (!this.pathify(res.atoms, false)) this.arenes.delete(blk);
		}
	}

	// access to resulting content	
	public getPathBlocks():number[] {return Array.from(this.resPaths.keys());}
	public getRingBlocks():number[] {return Array.from(this.resRings.keys());}
	public getAreneBlocks():number[] {return Array.from(this.arenes.keys());}
	public getResPaths():BondArtifactResPath[] {return Array.from(this.resPaths.values());}
	public getResRings():BondArtifactResRing[] {return Array.from(this.resRings.values());}
	public getArenes():BondArtifactArene[] {return Array.from(this.arenes.values());}

	// replaces all artifact signifiers with those from the current list of content
	public rewriteMolecule():void
	{
		const mol = this.mol;

		// delete everything
		for (let n = 1; n <= mol.numAtoms; n++)
		{
			var extra = mol.atomExtra(n), modified = false;
			for (let i = extra.length - 1; i >= 0; i--)
			{
				if (extra[i].startsWith(BONDARTIFACT_EXTRA_RESPATH) || extra[i].startsWith(BONDARTIFACT_EXTRA_RESRING) || extra[i].startsWith(BONDARTIFACT_EXTRA_ARENE))
				{
					extra.splice(i);
					modified = true;
				}
			}
			if (modified) mol.setAtomExtra(n, extra);
		}

		
		// write back our datastructures
		for (let [blk, path] of this.resPaths.entries())
		{
			for (let n = 0; n < path.atoms.length; n++)
			{
				let extra = mol.atomExtra(path.atoms[n]);
				extra.push(BONDARTIFACT_EXTRA_RESPATH + blk + ':' + (n + 1));
				mol.setAtomExtra(path.atoms[n], extra);
			}
		}
		for (let [blk, ring] of this.resRings.entries())
		{
			for (let n = 0; n < ring.atoms.length; n++)
			{
				let extra = mol.atomExtra(ring.atoms[n]);
				extra.push(BONDARTIFACT_EXTRA_RESRING + blk + ':' + (n + 1));
				mol.setAtomExtra(ring.atoms[n], extra);
			}
		}
		for (let [blk, arene] of this.arenes.entries())
		{
			for (let n = -1; n < arene.atoms.length; n++)
			{
				let atom = n < 0 ? arene.centre : arene.atoms[n];
				let extra = mol.atomExtra(atom);
				extra.push(BONDARTIFACT_EXTRA_ARENE + blk + ':' + (n + 2));
				mol.setAtomExtra(atom, extra);
			}
		}
	}
	
	// given the numbering system used by artifacts in another object, make sure that the current ones are renumbered so that they don't clash
	public harmoniseNumbering(other:BondArtifact):void
	{
		let blocks = other.getPathBlocks();
		let stashPaths = this.getResPaths();
		this.resPaths.clear();
		for (let path of stashPaths)
		{
			let blk = this.nextIdentifier(blocks);
			this.resPaths.set(blk, path);
			blocks.push(blk);
		}
		
		blocks = other.getRingBlocks();
		let stashRings = this.getResRings();
		this.resRings.clear();
		for (let ring of stashRings)
		{
			let blk = this.nextIdentifier(blocks);
			this.resRings.set(blk, ring);
			blocks.push(blk);
		}

		blocks = other.getAreneBlocks()
		let stashArenes = this.getArenes();
		this.arenes.clear();
		for (let arene of stashArenes)
		{
			let blk = this.nextIdentifier(blocks);
			this.arenes.set(blk, arene);
			blocks.push(blk)
		}
	}
	
	// creates a new path using the given atoms, or returns false if invalid
	public createPath(atoms:number[]):boolean
	{
		if (this.alreadyExists(atoms)) return false;
		let path = this.atomsAsPath(atoms);
		if (path) 
		{
			let id = this.nextIdentifier(Array.from(this.resPaths.keys()));
			this.resPaths.set(id, path);
			return true;
		}
		return false;
	}

	// creates a new ring using the given atoms, or returns false if invalid
	public createRing(atoms:number[]):boolean
	{
		if (this.alreadyExists(atoms)) return false;
		let ring = this.atomsAsRing(atoms);
		if (ring) 
		{
			let id = this.nextIdentifier(Array.from(this.resRings.keys()));
			this.resRings.set(id, ring);
			return true;
		}
		return false;
	}
	
	// creates a new arene using the given atoms, or returns false if invalid
	public createArene(atoms:number[]):boolean
	{
		if (this.alreadyExists(atoms)) return false;
		let arene = this.atomsAsArene(atoms);
		if (arene) 
		{
			let id = this.nextIdentifier(Array.from(this.arenes.keys()));
			this.arenes.set(id, arene);
			return true;
		}
		return false;
	}

	// removes one artifact as affected by the given atoms (selected by best overlap), or returns false if nothing removed
	public removeArtifact(atoms:number[]):boolean
	{
		let type = 0, pick = 0, overlap = 0;
		for (let [blk, path] of this.resPaths.entries())
		{
			let count = 0;
			for (let a of path.atoms) if (atoms.indexOf(a) >= 0) count++;
			if (count > overlap) {type = 1; pick = blk; overlap = count;}
		}
		for (let [blk, ring] of this.resRings.entries())
		{
			let count = 0;
			for (let a of ring.atoms) if (atoms.indexOf(a) >= 0) count++;
			if (count > overlap) {type = 2; pick = blk; overlap = count;}
		}
		for (let [blk, arene] of this.arenes.entries())
		{
			let count = atoms.indexOf(arene.centre) >= 0 ? 1 : 0;
			for (let a of arene.atoms) if (atoms.indexOf(a) >= 0) count++;
			if (count > overlap) {type = 3; pick = blk; overlap = count;}
		}

		if (type == 0) return false;
		else if (type == 1) this.resPaths.delete(pick);
		else if (type == 2) this.resRings.delete(pick);
		else if (type == 3) this.arenes.delete(pick);
		return true;
	}

	// ------------ private methods ------------
	
	// handle a single atom being concatenated onto a putative instance
	private appendResPath(atom:number, bits:string[]):void
	{
		let blk = safeInt(bits[0], 0);
		if (blk <= 0) return;

		let res = this.resPaths.get(blk);
		if (res == null) this.resPaths.set(blk, res = {'atoms': Vec.numberArray(0, this.mol.numAtoms)});

		let idx = bits.length >= 2 ? safeInt(bits[1], 0) : 0;
		if (res.atoms.indexOf(atom) >= 0) return;
		if (idx >= 1 && idx <= this.mol.numAtoms) res.atoms[idx - 1] = atom; else res.atoms.push(atom);
	}
	private appendResRing(atom:number, bits:string[]):void
	{
		let blk = safeInt(bits[0], 0);
		if (blk <= 0) return;

		let res = this.resRings.get(blk);
		if (res == null) this.resRings.set(blk, res = {'atoms': Vec.numberArray(0, this.mol.numAtoms)});

		let idx = bits.length >= 2 ? safeInt(bits[1], 0) : 0;
		if (res.atoms.indexOf(atom) >= 0) return;
		if (idx >= 1 && idx <= this.mol.numAtoms) res.atoms[idx - 1] = atom; else res.atoms.push(atom);
	}
	private appendArene(atom:number, bits:string[]):void
	{
		let blk = safeInt(bits[0], 0);
		if (blk <= 0) return;

		let res = this.arenes.get(blk);
		if (res == null) this.arenes.set(blk, res = {'centre': 0, 'atoms': Vec.numberArray(0, this.mol.numAtoms)});

		let idx = bits.length >= 2 ? safeInt(bits[1], 0) : 0;
		if (res.atoms.indexOf(atom) >= 0) return;
		if (idx >= 1 && idx <= this.mol.numAtoms) res.atoms[idx - 1] = atom; else res.atoms.push(atom);
	}
	
	// condense an array by removing zero's
	private pack(arr:number[]):number[]
	{
		let ret:number[] = [];
		for (let v of arr) if (v != 0) ret.push(v);
		return ret;
	}
	
	// takes an array of atom indices and makes sure it's a path of some sort; this may involve reordering the atoms; it must be possible to start at
	// some atom and walk along the path; the first atom has the lowest adjacency; the given order of the atoms will inform tiebreakers; if the method
	// returns true, then the atoms may be have been reordered
	private pathify(atoms:number[], requireRing:boolean):boolean
	{
		let sz = atoms.length;
		if (sz < 2) return false;
		
		let g = Graph.fromMolecule(this.mol);
		for (let n = 0; n < this.mol.numAtoms; n++) g.setIndex(n, n + 1);
		g = g.subgraphIndex(Vec.add(atoms, -1));
		let pos = 0;
		for (let n = 1; n < sz; n++) if (g.numEdges(n) < g.numEdges(pos)) pos = n;
		
		Vec.setTo(atoms, -1); // filling this with subgraph indices
		for (let n = 0; n < sz; n++)
		{
			atoms[n] = pos;
			if (n == sz - 1)
			{
				if (requireRing) if (g.getEdges(pos).indexOf(atoms[0]) < 0) return false; // must be joined
			}
			else
			{
				let next = sz;
				for (let i of g.getEdges(pos)) if (atoms.indexOf(i) < 0 && i < next) next = i;
				if (next == sz) return false; // bad
				pos = next;
			}
		}
		
		for (let n = 0; n < sz; n++) atoms[n] = g.getIndex(atoms[n]);
		return true;
	}

	// check to see if a set of atoms exists already as an artifact
	private alreadyExists(atoms:number[]):boolean
	{
		atoms = Vec.sorted(atoms);
		for (let path of this.resPaths.values())
		{
			if (Vec.equals(atoms, Vec.sorted(path.atoms))) return true;
		}
		for (let ring of this.resRings.values())
		{
			if (Vec.equals(atoms, Vec.sorted(ring.atoms))) return true;
		}
		for (let arene of this.arenes.values())
		{
			let areneAtoms = Vec.append(arene.atoms, arene.centre);
			if (Vec.equals(atoms, Vec.sorted(areneAtoms))) return true;
		}
		return false
	}
	
	// make a list of atoms (arbitrary order) into an artifact of the given type
	private atomsAsPath(atoms:number[]):BondArtifactResPath
	{
		if (atoms.length < 2) return null;
		let path:BondArtifactResPath = {'atoms': atoms};
		if (!this.pathify(path.atoms, false)) return null;
		return path;
	}
	private atomsAsRing(atoms:number[]):BondArtifactResRing
	{
		if (atoms.length < 3) return null;
		let ring:BondArtifactResRing = {'atoms': atoms};
		if (!this.pathify(ring.atoms, true)) return null;
		return ring;
	}
	private atomsAsArene(atoms:number[]):BondArtifactArene
	{
		const sz = atoms.length;
		if (sz < 3) return null;

		let g = Graph.fromMolecule(this.mol).subgraphIndex(Vec.add(atoms, -1))
		let best = 0;
		if (sz == 3)
		{
			// if just 3 atoms, it must be a ring, and we pick the one with the lowest bond order sum
			let bsum = [0, 0, 0];
			for (let n = 0; n < sz; n++)
			{
				if (g.numEdges(n) != 2) return null;
				for (let e of g.getEdges(n)) bsum[n] += this.mol.bondOrder(this.mol.findBond(atoms[n], atoms[e]));
				best = Vec.idxMin(bsum);
			}
		}
		else
		{
			// the "centre" (aka metal) is the one with the highest adjacency within the subgraph
			for (let n = 1; n < sz; n++) if (g.numEdges(n) > g.numEdges(best)) best = n;
		}
	
		let arene:BondArtifactArene = {'centre': atoms[best], 'atoms': Vec.remove(atoms, best)};
		if (!this.pathify(arene.atoms, false)) return null;
		return arene;
	}

	// using a disposable array, finds the next suitable identifier given that some number may already been taken
	private nextIdentifier(inkeys:number[]):number
	{
		if (inkeys.length == 0) return 1;
		let keys = Vec.sorted(inkeys);
		for (let n = 0; n < keys.length - 1; n++) if (keys[n + 1] != keys[n] + 1) return keys[n] + 1;
		return keys[keys.length - 1] + 1;
	}	
}

/* EOF */ }