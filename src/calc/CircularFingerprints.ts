/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../data/Molecule.ts'/>

/*
	Circular fingerprints: for generating ECFP-2/4/6 and FCFP-2/4/6 fingerprints. These are described by:

    	Original proprietary version:
    		J. Chem. Inf. Model., 50, 742–754 (2010)
    		http://pubs.acs.org/doi/abs/10.1021/ci100050t
    		
    	Open source version (implemented in this module):
    		J. Cheminf., 6:38 (2014)
    		http://www.jcheminf.com/content/6/1/38

	Note that integer hashing is done using the CRC32 algorithm, using the Java CRC32 class, which is the same
	formula/parameters as used by PNG files, and described in: http://www.w3.org/TR/PNG/#D-CRCAppendix

	Implicit vs. explicit hydrogens are handled, i.e. it doesn't matter whether the incoming molecule is hydrogen
	suppressed or not. However, inline abbreviations do need to be expanded out prior to doing the calculation.
*/

let crc_table:number[] = [];
function make_crc_table():number
{
	if (crc_table.length > 0) return;
	for (let n = 0; n < 256; n++)
	{
		let c = n
		for (let i = 0; i < 8; i++) if ((c & 1) != 0) c = 0xEDB88320 ^ (c >> 1); else c >>= 1;
		crc_table.push(c);
	}
}
const BOOT_CRC = 0xFFFFFFFF;
function start_crc():number {return BOOT_CRC;}
function feed_crc(crc:number, byte:number):number
{
	let idx = (crc ^ byte) & 0xFF;
	return crc_table[idx] ^ (crc >> 8);
}
function end_crc(crc:number):number {return crc ^ BOOT_CRC}

interface CircularFP
{
	hashCode:number;
	iteration:number;
	atoms:number[];
}

class CircularFingerprints
{
	public static CLASS_ECFP0 = 1;
	public static CLASS_ECFP2 = 2;
	public static CLASS_ECFP4 = 3;
	public static CLASS_ECFP6 = 4;

	private identity:number[] = [];
	private resolvedChiral:boolean[] = [];
	private atomGroup:number[][] = [];
	private fplist:CircularFP[] = [];
	private amask:boolean[] = [];
	private atomAdj:number[][] = [];
	private bondAdj:number[][] = [];

	// --------------------- public methods ---------------------

	constructor(private meta:MetaMolecule, private kind:number)
	{
		make_crc_table() // (nop if already made)
	}

/*	// performs the calculation; after completion, the results may be fetched
	open func calculate()
	{
		let mol = meta.mol, na = mol.numAtoms
		identity = [Int](repeating:0, count:na)
		resolvedChiral = boolArray(false, na)
		atomGroup = [[Int]](repeating:[], count:na)

		// setup the potential correction between explicit vs. implicit hydrogens, and the stashed adjacency list
		amask = boolArray(false,na)
		for n in 0 ..< na {amask[n] = mol.atomicNumber(n+1) >= 2 && !MolUtil.hasAbbrev(meta.mol, atom:n+1)}
		atomAdj = [[Int]](repeating:[], count:na)
		bondAdj = [[Int]](repeating:[], count:na)
		for n in 0 ..< na
		{
			if !amask[n] {continue}
			atomAdj[n] = mol.atomAdjList(n+1)
			bondAdj[n] = mol.atomAdjBonds(n+1)
			for i in stride(from:(atomAdj[n].count - 1), through:0, by:-1) {if !amask[atomAdj[n][i]-1]
			{
				atomAdj[n].remove(at:i)
				bondAdj[n].remove(at:i)
			}}
		}
		
		// seed the initial atom identities, at iteration zero
		for n in 0 ..< na {if amask[n]
		{
			identity[n] = initialIdentityECFP(n+1)
			atomGroup[n] = [n+1]
			applyNewFP(FP(hashCode:identity[n], iteration:0, atoms:atomGroup[n]))
		}}

		let niter = kind // (corresponds: numeric value is # iterations)

		// iterate outward
		for iter in stride(from:1, through:niter, by:1)
		{
			var newident = [Int](repeating:0, count:na)
			for n in 0 ..< na {if amask[n] {newident[n] = circularIterate(iter, atom:n+1)}}
			identity = newident

			for n in 0 ..< na {if amask[n]
			{
				atomGroup[n] = growAtoms(atomGroup[n])
				considerNewFP(FP(hashCode:identity[n], iteration:iter, atoms:atomGroup[n]))
			}}
		}
	}

	// convenience constructors
	open class func create(meta:MetaMolecule, kind:Int) -> CircularFingerprints
	{
		let circ = CircularFingerprints(meta:meta, kind:kind)
		circ.calculate()
		return circ
	}
	open class func create(mol:Molecule, kind:Int) -> CircularFingerprints
	{
		return create(meta:MetaMolecule.createStrictRubric(mol), kind:kind)
	}
	
	// access to the results/input content
	open func getMolecule() -> Molecule {return meta.mol}
	open func numFP() -> Int {return fplist.count}
	open func getFP(_ N:Int) -> FP {return fplist[N]}
	
	// pulls out just the unique instances of each hash code, and returns the sorted list
	open func getUniqueHashes() -> [Int]
	{
		var hashes = Set<Int>()
		for fp in fplist {hashes.insert(fp.hashCode)}
		//return sort(Array(hashes))
		return Array(hashes).sorted()
	}
	
	// as above, except cuts off the bits to a certain folding; note that the folding size must be an exponent of 2
	open func getFoldedHashes(_ maxBits:Int) -> [Int]
	{
		var mask = boolArray(false, maxBits)
		let andBits = maxBits-1
		for fp in fplist
		{
			let i = fp.hashCode & andBits
			mask[i] = true
		}
		return maskIdx(mask)
	}*/
	
	// calculates the Tanimoto coefficient for two lists of hash codes: these are assumed to be sorted and unique, which
	// allows the calculation to be done in O(N) time
	public static tanimoto(hash1:number[], hash2:number[]):number
	{
		let shared = 0, total = 0;
		let sz1 = hash1.length, sz2 = hash2.length
		if (sz1 == 0 && sz2 == 0) return 0;
		let i1 = 0, i2 = 0;
		while (i1 < sz1 || i2 < sz2)
		{
			if (i1 == sz1) {total += sz2-i2; break;}
			if (i2 == sz2) {total += sz1-i1; break;}
			let v1 = hash1[i1], v2 = hash2[i2];
			if (v1 == v2) {shared += 1; i1 += 1; i2 += 1;}
			else if (v1 < v2) i1 += 1; else i2 += 1;
			total += 1
		}
		return shared / total;
	}

	// ----------------- private methods -----------------
	
	// calculates an integer number that stores the bit-packed identity of the given atom
	private initialIdentityECFP(atom:number):number
	{
		const mol = this.meta.mol;
		let adj = mol.atomAdjList(atom); // (note: want them all)
	
		/*
			Atom properties from the source reference:
				(1) number of heavy atom neighbours
				(2) atom degree: valence minus # hydrogens
				(3) atomic number
				(4) atom charge
				(5) number of hydrogen neighbours
				(6) whether the atom is in a ring
		*/

        let nheavy = 0, nhydr = mol.atomHydrogens(atom);
		for (let n = 0; n < adj.length; n++)
        {
			if (mol.atomElement(adj[n]) == 'H') nhydr++; else nheavy++;
        }
		let atno = mol.atomicNumber(atom);
		let degree = Math.max(0, Chemistry.ELEMENT_BONDING[atno] - nhydr);
		let chg = mol.atomCharge(atom);
		let inring = mol.atomRingBlock(atom) > 0 ? 1 : 0;
		
		let crc = start_crc();
        crc = feed_crc(crc, (nheavy << 4) | degree);
        crc = feed_crc(crc, atno);
        crc = feed_crc(crc, chg + 0x80);
        crc = feed_crc(crc, (nhydr << 4) | inring);
        return end_crc(crc);
	}

	// takes the current identity values
	private circularIterate(iter:number, atom:number):number
	{
		let adj = this.atomAdj[atom - 1], adjb = this.bondAdj[atom - 1];
		
		// build out a sequence, formulated as
		//     {iteration,original#, adj0-bondorder,adj0-identity, ..., [chiral?]}
		var seq = Vec.numberArray(0, 2 + 2 * adj.length);
		seq[0] = iter;
		seq[1] = this.identity[atom - 1];
		for (let n = 0; n < adj.length; n++)
		{
			seq[2 * n + 2] = this.meta.isBondAromatic(adjb[n]) ? 0xF : this.meta.mol.bondOrder(adjb[n]);
			seq[2 * n + 3] = this.identity[adj[n] - 1];
		}
		
		// now sort the adjacencies by bond order first, then identity second
		let p = 0
		while (p < adj.length - 1)
		{
			let i = 2 + 2 * p;
			if (seq[i] > seq[i+2] || (seq[i] == seq[i + 2] && seq[i + 1] > seq[i + 3]))
			{
				Vec.swap(seq, i, i+2)
				Vec.swap(seq, i+1, i+3)
				if (p > 0) p--;
			}
			else p++;
		}

		// roll it up into a hash code
		var crc = start_crc();
		for (let n = 0; n < seq.length; n += 2)
		{
			crc = feed_crc(crc, seq[n]);
			let v = seq[n + 1];
			crc = feed_crc(crc, v >> 24);
			crc = feed_crc(crc, (v >> 16) & 0xFF);
			crc = feed_crc(crc, (v >> 8) & 0xFF);
			crc = feed_crc(crc, v & 0xFF);
		}

		// chirality flag: one chance to resolve it
		if (!this.resolvedChiral[atom - 1] && Vec.arrayLength(this.meta.rubricTetra) > 0)
		{
			let ru = this.meta.rubricTetra[atom-1]
			let par =
			[
    			ru[0] == 0 ? 0 : this.identity[ru[0] - 1],
    			ru[1] == 0 ? 0 : this.identity[ru[1] - 1],
    			ru[2] == 0 ? 0 : this.identity[ru[2] - 1],
    			ru[3] == 0 ? 0 : this.identity[ru[3] - 1]
			];
			if (par[0] != par[1] && par[0] != par[2] && par[0] != par[3] && par[1] != par[2] && par[1] != par[3] && par[2] != par[3])
			{
				// add 1 or 2 to the end of the list, depending on the parity
				crc = feed_crc(crc, Permutation.parityOrder(par) + 1);
				this.resolvedChiral[atom - 1] = true;
			}
		}

		return end_crc(crc);
	}
	
	// takes a set of atom indices and adds all atoms that are adjacent to at least one of them; the resulting list of
	// atom indices is sorted
	private growAtoms(atoms:number[]):number[]
	{
		let mask = Vec.booleanArray(false, this.meta.mol.numAtoms);
		for (let n = 0; n < atoms.length; n++)
		{
			mask[atoms[n] - 1] = true;
			for (let a of this.atomAdj[atoms[n] - 1]) mask[a - 1] = true;
		}
		return Vec.add(Vec.maskIdx(mask), 1)
	}

	// add a new fingerprint, with no duplicate check (initial seed round); is only a separate function so it can be trapped
	private applyNewFP(newFP:CircularFP):void
	{
		this.fplist.push(newFP);
	}
	
	// consider adding a new fingerprint: if it's a duplicate with regard to the atom list, either replace the match or
	// discard it
	private considerNewFP(newFP:CircularFP):void
	{
		let hit = -1;
		let fp:CircularFP = null;
		for (let n = 0; n < this.fplist.length; n++)
		{
			let lookFP = this.fplist[n];
			if (Vec.equals(lookFP.atoms, newFP.atoms)) {fp = lookFP; hit = n; break}
		}
		if (hit < 0)
		{
			this.fplist.push(newFP);
			return
		}
		
		// if the preexisting fingerprint is from an earlier iteration, or has a lower hashcode, discard
		if (fp.iteration < newFP.iteration || fp!.hashCode < newFP.hashCode) return;
		this.fplist[hit] = newFP;
	}
}