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
	
    constructor(private mol:Molecule)
	{
	}

	// populates the list of "artifacts": after this, the content can be fetched
	public extract():void
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
    public getResPaths():BondArtifactResPath[] {return Array.from(this.resPaths.values());}
    public getResRings():BondArtifactResRing[] {return Array.from(this.resRings.values());}
    public getArenes():BondArtifactArene[] {return Array.from(this.arenes.values());}

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
				if (requireRing) if (g.getAdj(pos).indexOf(atoms[0]) < 0) return false; // must be joined
			}
			else
			{
				let next = sz;
				for (let i of g.getAdj(pos)) if (atoms.indexOf(i) < 0 && i < next) next = i;
				if (next == sz) return false; // bad
				pos = next;
			}
		}
		
		for (let n = 0; n < sz; n++) atoms[n] = g.getIndex(atoms[n]);
		return true;
	}
}

/* EOF */ }