/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

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
function make_crc_table():void
{
	if (crc_table.length > 0) return;
	for (let n = 0; n < 256; n++)
	{
		let c = n;
		for (let i = 0; i < 8; i++) if ((c & 1) != 0) c = 0xEDB88320 ^ (c >>> 1); else c = (c >>> 1);
		crc_table.push(c);
	}
}
const BOOT_CRC = 0xFFFFFFFF;
function start_crc():number {return BOOT_CRC;}
function feed_crc(crc:number, byte:number):number
{
	let idx = (crc ^ byte) & 0xFF;
	return crc_table[idx] ^ (crc >>> 8);
}
function end_crc(crc:number):number {return crc ^ BOOT_CRC;}

export interface CircularFP
{
	hashCode:number;
	iteration:number;
	atoms:number[];
	centralAtom:number;
}

export class CircularFingerprints
{
	public static CLASS_ECFP0 = 0;
	public static CLASS_ECFP2 = 1;
	public static CLASS_ECFP4 = 2;
	public static CLASS_ECFP6 = 3;

	// plugins: interception of fingerprint addition
	public hookApplyNewFP:(newFP:CircularFP) => void = null;
	public hookConsiderNewFP:(newFP:CircularFP) => void = null;

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
		make_crc_table(); // (nop if already made)
	}

	// performs the calculation; after completion, the results may be fetched
	public calculate():void
	{
		let mol = this.meta.mol, na = mol.numAtoms;
		this.identity = Vec.numberArray(0, na);
		this.resolvedChiral = Vec.booleanArray(false, na);
		for (let n = 0; n < na; n++) this.atomGroup.push([]);

		// setup the potential correction between explicit vs. implicit hydrogens, and the stashed adjacency list
		this.amask = Vec.booleanArray(false, na);
		for (let n = 0; n < na; n++)
		{
			this.amask[n] = mol.atomicNumber(n + 1) >= 2 && !MolUtil.hasAbbrev(mol, n + 1);
			this.atomAdj.push([]);
			this.bondAdj.push([]);
		}
		for (let n = 0; n < na; n++)
		{
			if (!this.amask[n]) continue;
			this.atomAdj[n] = mol.atomAdjList(n + 1);
			this.bondAdj[n] = mol.atomAdjBonds(n + 1);
			for (let i = this.atomAdj[n].length - 1; i >= 0; i--) if (!this.amask[this.atomAdj[n][i] - 1])
			{
				this.atomAdj[n].splice(i, 1);
				this.bondAdj[n].splice(i, 1);
			}
		}

		// seed the initial atom identities, at iteration zero
		for (let n = 0; n < na; n++) if (this.amask[n])
		{
			this.identity[n] = this.initialIdentityECFP(n + 1);
			this.atomGroup[n] = [n + 1];
			this.applyNewFP({'hashCode': this.identity[n], 'iteration': 0, 'atoms': this.atomGroup[n], 'centralAtom': n + 1});
		}
		let niter = this.kind; // (corresponds: numeric value is # iterations)

		// iterate outward
		for (let iter = 1; iter <= niter; iter++)
		{
			let newident = Vec.numberArray(0, na);
			for (let n = 0; n < na; n++) if (this.amask[n]) newident[n] = this.circularIterate(iter, n + 1);
			this.identity = newident;

			for (let n = 0; n < na; n++) if (this.amask[n])
			{
				this.atomGroup[n] = this.growAtoms(this.atomGroup[n]);
				this.considerNewFP({'hashCode': this.identity[n], 'iteration': iter, 'atoms': this.atomGroup[n], 'centralAtom': n + 1});
			}
		}
	}

	// convenience constructors; note that molecules should have abbreviations expanded out beforehand
	public static create(meta:Molecule | MetaMolecule, kind:number):CircularFingerprints
	{
		if (meta instanceof Molecule) meta = MetaMolecule.createStrictRubric(meta);
		let circ = new CircularFingerprints(meta, kind);
		circ.calculate();
		return circ;
	}

	// access to the results/input content
	public getMolecule():Molecule {return this.meta.mol;}
	public get numFP():number {return this.fplist.length;}
	public getFP(idx:number):CircularFP {return this.fplist[idx];}
	public getFingerprints():CircularFP[] {return this.fplist.slice(0);}

	// pulls out just the unique instances of each hash code, and returns the sorted list
	public getUniqueHashes():number[]
	{
		let hashes = new Set<number>();
		for (let fp of this.fplist) hashes.add(fp.hashCode);
		return Vec.sorted(Array.from(hashes));
	}

	// as above, except cuts off the bits to a certain folding; note that the folding size must be an exponent of 2
	public getFoldedHashes(maxBits:number):number[]
	{
		let andBits = maxBits - 1;
		let hashes = new Set<number>();
		for (let fp of this.fplist) hashes.add(fp.hashCode & andBits);
		return Vec.sorted(Array.from(hashes));
	}

	// calculates the Tanimoto coefficient for two lists of hash codes: these are assumed to be sorted and unique, which
	// allows the calculation to be done in O(N) time
	public static tanimoto(hash1:number[], hash2:number[]):number
	{
		let shared = 0, total = 0;
		let sz1 = hash1.length, sz2 = hash2.length;
		if (sz1 == 0 && sz2 == 0) return 0;
		let i1 = 0, i2 = 0;
		while (i1 < sz1 || i2 < sz2)
		{
			if (i1 == sz1) {total += sz2 - i2; break;}
			if (i2 == sz2) {total += sz1 - i1; break;}
			let v1 = hash1[i1], v2 = hash2[i2];
			if (v1 == v2) {shared += 1; i1 += 1; i2 += 1;}
			else if (v1 < v2) i1 += 1; else i2 += 1;
			total += 1;
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
		for (let a of adj) if (mol.atomElement(a) == 'H') nhydr++; else nheavy++;

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
		let seq = Vec.numberArray(0, 2 + 2 * adj.length);
		seq[0] = iter;
		seq[1] = this.identity[atom - 1];
		for (let n = 0; n < adj.length; n++)
		{
			seq[2 * n + 2] = this.meta.isBondAromatic(adjb[n]) ? 0xF : this.meta.mol.bondOrder(adjb[n]);
			seq[2 * n + 3] = this.identity[adj[n] - 1];
		}

		// now sort the adjacencies by bond order first, then identity second
		let p = 0;
		while (p < adj.length - 1)
		{
			let i = 2 + 2 * p;
			if (seq[i] > seq[i + 2] || (seq[i] == seq[i + 2] && seq[i + 1] > seq[i + 3]))
			{
				Vec.swap(seq, i, i + 2);
				Vec.swap(seq, i + 1, i + 3);
				if (p > 0) p--;
			}
			else p++;
		}

		// roll it up into a hash code
		let crc = start_crc();
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
		if (!this.resolvedChiral[atom - 1] && Vec.arrayLength(this.meta.rubricTetra) > 0 && this.meta.rubricTetra[atom - 1] != null)
		{
			let ru = this.meta.rubricTetra[atom - 1];
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
		return Vec.add(Vec.maskIdx(mask), 1);
	}

	// add a new fingerprint, with no duplicate check (initial seed round); is only a separate function so it can be trapped
	private applyNewFP(newFP:CircularFP):void
	{
		if (this.hookConsiderNewFP) this.hookConsiderNewFP(newFP);
		if (this.hookApplyNewFP) this.hookApplyNewFP(newFP);
		this.fplist.push(newFP);
	}

	// consider adding a new fingerprint: if it's a duplicate with regard to the atom list, either replace the match or
	// discard it
	private considerNewFP(newFP:CircularFP):void
	{
		if (this.hookConsiderNewFP) this.hookConsiderNewFP(newFP);

		let hit = -1;
		let fp:CircularFP = null;
		for (let n = 0; n < this.fplist.length; n++)
		{
			let lookFP = this.fplist[n];
			if (Vec.equals(lookFP.atoms, newFP.atoms)) {fp = lookFP; hit = n; break;}
		}
		if (hit < 0)
		{
			this.fplist.push(newFP);
			return;
		}

		// if the preexisting fingerprint is from an earlier iteration, or has a lower hashcode, discard
		if (fp.iteration < newFP.iteration || fp.hashCode < newFP.hashCode) return;

		this.fplist[hit] = newFP;
		if (this.hookApplyNewFP) this.hookApplyNewFP(newFP);
	}
}

/* EOF */ }