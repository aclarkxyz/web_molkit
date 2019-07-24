/*
	WebMolKit

	(c) 2010-2019 Molecular Materials Informatics, Inc.

	All rights reserved

	http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='Molecule.ts'/>
///<reference path='MolUtil.ts'/>
///<reference path='Graph.ts'/>
///<reference path='Chemistry.ts'/>
///<reference path='../util/util.ts'/>

namespace WebMolKit /* BOF */ {

/*
	A meta-description of a molecule that divides the molecular graph up into chunks based on their
	ability to provide pi-like resonance electrons. Atoms that are deemed to be invariant to the passage
	of resonance electrons (most notably sp3 carbons) are considered to break up these pathways. The
	remaining components-of-resonance are assigned bond orders based on the ratio of electrons to # bonds.
*/

export interface DotPathBlock
{
	atoms:number[];
	bonds:number[];
	// (average bond order = numer/denom)
	numer:number; // # of electrons contributed to the block
	denom:number; // 2 * number of bonds
}

// discrete bond type categories (these collapse the fractional bond orders)
enum DotPathBond
{
	O0 = 0, // exactly zero
	O01 = 1, // from 0..1 (exclusive)
	O1 = 2, // exactly one
	O12 = 3, // from 1..2 (exclusive)
	O2 = 4, // exactly two
	O23 = 5, // from 2..3 (exclusive)
	O3 = 6, // exactly three
	O3X = 7, // more than three
}

// discrete charge type categories (these collapse fractional charges)
enum DotPathCharge
{
	N1X = -3, // less than -1
	N1 = -2, // exactly -1
	N01 = -1, // a bit less than zero
	Z0 = 0, // exactly zero
	P01 = 1, // a bit more than zero
	P1 = 2, // exactly +1
	P1X = 3, // more than +1
}

export class DotPath
{
	public maskBlock:boolean[]; // atoms that are considered blocking; generally not important for interpretation
	public paths:DotPathBlock[] = []; // the blocks of dots: note that only bonds that have a different bond order under the dot-scheme are listed

	// ------------------ public methods --------------------

	// instantiates the DotPath content right away, unless the molecule argument is null
	constructor(public mol:Molecule)
	{
		if (mol) this.calculate();
	}

	// shallow clone
	public clone():DotPath
	{
		let dup = new DotPath(null);
		dup.mol = this.mol;
		dup.maskBlock = this.maskBlock;
		dup.paths = this.paths.slice(0);
		return dup;
	}

	// returns recomputed bond orders: any atom that's part of a dot-path gets assigned with a fractional bond order based on
	// the path characteristics, while the rest of them get their original integral bond order
	public getBondOrders():number[]
	{
		const mol = this.mol;
		let orders:number[] = [];
		for (let n = 1; n <= mol.numBonds; n++) orders.push(mol.bondOrder(n));
		for (let path of this.paths)
		{
			// compute fractional bond order, and guard against rounding errors (i.e. want literal whole numbers when appropriate)
			let fract = path.numer / path.denom;
			for (let n = 1; n <= 5; n++) if (fltEqual(fract, n)) fract = n;
			for (let b of path.bonds) orders[b - 1] = fract;
		}
		return orders;
	}

	// as above, except returns the bond orders as predetermined bins, corresponding to ordinals and intermediates
	public getBondClasses():DotPathBond[]
	{
		const mol = this.mol;
		let classes:DotPathBond[] = [];
		for (let n = 1; n <= mol.numBonds; n++)
		{
			let bo = mol.bondOrder(n);
			classes.push(bo == 0 ? DotPathBond.O0 :
						 bo == 1 ? DotPathBond.O1 :
						 bo == 2 ? DotPathBond.O2 :
						 bo == 3 ? DotPathBond.O3 : DotPathBond.O3X);
		}
		for (let path of this.paths)
		{
			// compute fractional bond order, and guard against rounding errors (i.e. want literal whole numbers when appropriate)
			let fract = path.numer / path.denom;
			let bcls = fltEqual(fract, 0) ? DotPathBond.O0 :
					   fltEqual(fract, 1) ? DotPathBond.O1 :
					   fltEqual(fract, 2) ? DotPathBond.O2 :
					   fltEqual(fract, 3) ? DotPathBond.O3 :
					   fract < 1 ? DotPathBond.O01 :
					   fract < 2 ? DotPathBond.O12 :
					   fract < 3 ? DotPathBond.O23 : DotPathBond.O3X;
			for (let b of path.bonds) classes[b - 1] = bcls;
		}
		return classes;
	}

	// return one of the categories of fractional charges
	public getChargeClasses():DotPathCharge[]
	{
		const mol = this.mol;
		let classes:DotPathCharge[] = [];
		for (let n = 1; n <= mol.numAtoms; n++)
		{
			let chg = mol.atomCharge(n);
			classes.push(chg == 0 ? DotPathCharge.Z0 :
						 chg == -1 ? DotPathCharge.N1 :
						 chg == 1 ? DotPathCharge.P1 :
						 chg < -1 ? DotPathCharge.N1X : DotPathCharge.P1X);
		}
		for (let path of this.paths)
		{
			let chg = 0;
			for (let a of path.atoms) chg += mol.atomCharge(a);
			chg /= path.atoms.length;
			let ccls = fltEqual(chg, 0) ? DotPathCharge.Z0 :
					   fltEqual(chg, -1) ? DotPathCharge.N1 :
					   fltEqual(chg, 1) ? DotPathCharge.P1 :
					   chg > -1 && chg < 0 ? DotPathCharge.N01 :
					   chg > 0 && chg < 1 ? DotPathCharge.P01 :
					   chg < -1 ? DotPathCharge.N1X : DotPathCharge.P1X;
			for (let a of path.atoms) classes[a - 1] = ccls;
		}
		return classes;
	}

	// return for each atom the total charge of the path to which it belongs (which is related to above, but isn't binned)
	public getAggregateCharges():number[]
	{
		const mol = this.mol;
		let chg:number[] = [];
		for (let n = 1; n <= mol.numAtoms; n++) chg[n - 1] = mol.atomCharge(n);
		for (let path of this.paths)
		{
			let total = 0;
			for (let a of path.atoms) total += chg[a - 1];
			for (let a of path.atoms) chg[a - 1] = total;
		}
		return chg;
	}

	// for debugging purposes
	public toString():string
	{
		let str = 'blocking=' + JSON.stringify(this.maskBlock) + '; paths=' + this.paths.length;
		for (let p of this.paths) str += ' [' + p.numer + '/' + p.denom + ';a=' + JSON.stringify(p.atoms) + ';b=' + JSON.stringify(p.bonds) + ']';
		return str;
	}

	// ------------------ private methods --------------------

	private calculate():void
	{
		const mol = this.mol, na = mol.numAtoms, nb = mol.numBonds;

		// gather metrics
		let nonsingle = Vec.booleanArray(false, na), pibonded = Vec.booleanArray(false, na);
		let bondsum = Vec.numberArray(0, na); // explicit bond orders + virtual hydrogens
		for (let n = 0; n < na; n++) bondsum[n] = mol.atomHydrogens(n + 1);
		for (let n = 1; n <= nb; n++)
		{
			let bo = mol.bondOrder(n), bfr = mol.bondFrom(n), bto = mol.bondTo(n);
			if (bo != 1)
			{
				nonsingle[bfr - 1] = true;
				nonsingle[bto - 1] = true;
			}
			if (bo >= 2)
			{
				pibonded[bfr - 1] = true;
				pibonded[bto - 1] = true;
			}
			bondsum[bfr - 1] += bo;
			bondsum[bto - 1] += bo;
		}

		// first pass: find things that are definitely blocking, or maybe blocking
		this.maskBlock = Vec.booleanArray(false, na);
		let maskMaybe = Vec.booleanArray(false, na); // might be blocking, as long as neighbours also maybe

		// main groups which could potentially be blocking if they are neutral and have just sigma bonds that add up to the regular octet valence
		let COULD_BLOCK =
		[
			Chemistry.ELEMENT_B,  Chemistry.ELEMENT_C,  Chemistry.ELEMENT_N,  Chemistry.ELEMENT_O,  Chemistry.ELEMENT_F,
			Chemistry.ELEMENT_Al, Chemistry.ELEMENT_Si, Chemistry.ELEMENT_P,  Chemistry.ELEMENT_S,  Chemistry.ELEMENT_Cl,
			Chemistry.ELEMENT_Ga, Chemistry.ELEMENT_Ge, Chemistry.ELEMENT_As, Chemistry.ELEMENT_Se, Chemistry.ELEMENT_Br,
			Chemistry.ELEMENT_In, Chemistry.ELEMENT_Sn, Chemistry.ELEMENT_Sb, Chemistry.ELEMENT_Te, Chemistry.ELEMENT_I,
			Chemistry.ELEMENT_Tl, Chemistry.ELEMENT_Pb, Chemistry.ELEMENT_Bi, Chemistry.ELEMENT_Po, Chemistry.ELEMENT_At,
		];

		for (let n = 0; n < na; n++)
		{
			const a = n + 1;

			// must be all single bonds, uncharged, non-radical, in the list of potentially block elements, and have a bonding sum equal
			// to the valence
			if (nonsingle[n]) continue;
			if (mol.atomCharge(a) != 0 || mol.atomUnpaired(a) != 0) continue;
			const atno = mol.atomicNumber(a);
			if (atno == 0)
			{
				this.maskBlock[n] = true;
				continue;
			}
			if (COULD_BLOCK.indexOf(atno) < 0) continue;
			if (bondsum[n] != Chemistry.ELEMENT_BONDING[atno]) continue;

			// if carbon, it's sp3 and definitely blocking (unless it has two pi-neighbours); other atoms only maybe
			maskMaybe[n] = true;
			if (atno == Chemistry.ELEMENT_C)
			{
				let adjpi = 0;
				let hasMetal = false;
				for (let adj of mol.atomAdjList(a))
				{
					if (pibonded[adj - 1]) adjpi++;
					if (COULD_BLOCK.indexOf(mol.atomicNumber(adj)) < 0) hasMetal = true;
				}
				if (adjpi < 2 && !hasMetal) this.maskBlock[n] = true;
			}
		}

		// any "maybe" atom that is surrounded by other maybe atoms gets approved as a blocking atom
		// note: this is non-chaining; might need to reconsider this, i.e. make maybe-to-not propagate
		skip: for (let n = 0; n < na; n++) if (maskMaybe[n] && !this.maskBlock[n])
		{
			for (let a of mol.atomAdjList(n + 1)) if (!maskMaybe[a - 1]) continue skip;
			this.maskBlock[n] = true;
		}

		// now build the graph, and pick apart the blocked units
		let g = Graph.fromMolecule(mol);
		for (let n = 0; n < na; n++) if (this.maskBlock[n]) g.isolateNode(n);
		for (let cc of g.calculateComponentGroups())
		{
			if (cc.length == 1) continue;
			let amask = Vec.idxMask(cc, na);
			Vec.addTo(cc, 1);

			let p:DotPathBlock =
			{
				'atoms': cc,
				'bonds': [],
				'numer': 0,
				'denom': 0
			};
			for (let n = 1; n <= nb; n++) if (amask[mol.bondFrom(n) - 1] && amask[mol.bondTo(n) - 1]) p.bonds.push(n);

			let totalHave = 0, totalWant = 0;
			for (let a of p.atoms)
			{
				let others = mol.atomHydrogens(a); // bonds to atoms not in path; these are single bonds, by definition
				for (let o of mol.atomAdjList(a)) if (!amask[o - 1]) others++;

				let atno = mol.atomicNumber(a);
				let have = Chemistry.ELEMENT_VALENCE[atno] - mol.atomCharge(a) - others;
				let want = Chemistry.ELEMENT_SHELL[atno] - Chemistry.ELEMENT_VALENCE[atno] - others;
				totalHave += have;
				totalWant += want;
			}

			let electrons = Math.min(totalHave, totalWant);

			//if (cc.length == 2 && electrons == 2 * mol.bondOrder(p.bonds[0])) continue; // boring ... but... charge & rad...
			p.numer = electrons;
			p.denom = 2 * p.bonds.length;
			this.paths.push(p);
		}
	}
}

/* EOF */ }