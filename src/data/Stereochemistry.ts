/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../util/util.ts'/>
///<reference path='../util/Vec.ts'/>
///<reference path='Molecule.ts'/>
///<reference path='MetaMolecule.ts'/>
///<reference path='MolUtil.ts'/>

namespace WebMolKit /* BOF */ {

/*
	Calculation of the stereochemical properties of a molecule, such as R/S and E/Z isomer labels.
*/

export class Stereochemistry
{
	private mol:Molecule;

	// computed stereochemistry properties
	private priority:number[]; // CIP (per atom)
	private chiralTetra:number[]; // (per atom)
	private cistransBond:number[]; // (per bond)
	private squarePlanar:number[]; // (per atom)
	//private chiralOcta:number[]; // (per atom)
	private isH:boolean[]; // per atom

	// ------------------ constants --------------------

	public static STEREO_NONE = 0; // topology does not allow any stereoisomers
	public static STEREO_POS = 1; // R or Z, depending on type
	public static STEREO_NEG = 2; // S or E, depending on type
	public static STEREO_UNKNOWN = 3; // stereocentre with no specification
	public static STEREO_BROKEN = 4; // stereocentre with contradictory stereochemistry information

	// all equivalent tetrahedral permutations
	public static RUBRIC_EQUIV_TETRA =
	[
		[0, 1, 2, 3], [0, 2, 3, 1], [0, 3, 1, 2], [1, 0, 3, 2], [1, 2, 0, 3], [1, 3, 2, 0],
		[2, 0, 1, 3], [2, 1, 3, 0], [2, 3, 0, 1], [3, 0, 2, 1], [3, 1, 0, 2], [3, 2, 1, 0]
	];

	public static RUBRIC_EQUIV_SIDES =
	[
		[0, 1, 2, 3], [1, 0, 3, 2], [2, 3, 0, 1], [3, 2, 1, 0]
	];

	public static RUBRIC_EQUIV_SQUARE =
	[
		[0, 1, 2, 3], [0, 3, 2, 1], [1, 2, 3, 0], [1, 0, 3, 2],
		[2, 1, 0, 3], [2, 3, 0, 1], [3, 2, 1, 0], [3, 0, 1, 2]
	];

	public static RUBRIC_EQUIV_BIPY =
	[
		[0, 1, 2, 3, 4], [1, 2, 0, 3, 4], [2, 0, 1, 3, 4],
		[0, 2, 1, 4, 3], [1, 0, 2, 4, 3], [2, 1, 0, 4, 3],
	];

	public static RUBRIC_EQUIV_OCTA =
	[
		[0, 1, 2, 3, 4, 5], [0, 3, 2, 1, 5, 4], [0, 4, 2, 5, 3, 1], [0, 5, 2, 4, 1, 3],
		[1, 0, 3, 2, 5, 4], [1, 2, 3, 0, 4, 5], [1, 4, 3, 5, 0, 2], [1, 5, 3, 4, 2, 0],
		[2, 1, 0, 3, 5, 4], [2, 3, 0, 1, 4, 5], [2, 4, 0, 5, 1, 3], [2, 5, 0, 4, 3, 1],
		[3, 0, 1, 2, 4, 5], [3, 2, 1, 0, 5, 4], [3, 4, 1, 5, 2, 0], [3, 5, 1, 4, 0, 2],
		[4, 0, 5, 2, 1, 3], [4, 1, 5, 3, 2, 0], [4, 2, 5, 0, 3, 1], [4, 3, 5, 1, 0, 2],
		[5, 0, 4, 2, 3, 1], [5, 1, 4, 3, 0, 2], [5, 2, 4, 0, 1, 3], [5, 3, 4, 1, 2, 0]
	];

	// ------------------ public methods --------------------

	// constructor: the metamolecule should generally have aromaticity calculated, because this can affect the priority,
	// and can also exclude some cases, e.g. cis/trans labels
	constructor(public meta:MetaMolecule)
	{
		this.mol = meta.mol;

		this.priority = Vec.numberArray(0, this.mol.numAtoms);
		this.chiralTetra = Vec.numberArray(Stereochemistry.STEREO_NONE, this.mol.numAtoms);
		this.cistransBond = Vec.numberArray(Stereochemistry.STEREO_NONE, this.mol.numBonds);
		this.squarePlanar = Vec.numberArray(Stereochemistry.STEREO_NONE, this.mol.numAtoms);
		//this.chiralOcta = Vec.numberArray(Stereochemistry.STEREO_NONE, this.mol.numAtoms);
	}

	// performs the calculation by filling in the arrays
	public calculate():void
	{
		this.isH = Vec.booleanArray(false, this.mol.numAtoms);
		for (let n = this.mol.numAtoms; n >= 1; n--) this.isH[n - 1] = this.mol.atomElement(n) == 'H';

		this.buildPriority();
		this.buildTetraChirality();
		this.buildBondCisTrans();
		this.buildPlanarCisTrans();
		this.buildOctaChirality();
	}

	// access to calculated values; indices are 1-based
	public atomPriority(atom:number):number {return this.priority[atom - 1];}
	public atomTetraChirality(atom:number):number {return this.chiralTetra[atom - 1];}
	public bondSideStereo(bond:number):number {return this.cistransBond[bond - 1];}
	public atomPlanarStereo(atom:number):number {return this.squarePlanar[atom - 1];}
	//public atomOctaChirality(atom:number):number {return this.chiralOcta[atom - 1];}

	// for bulk access, sometimes more convenient
	public getPriorities():number[] {return this.priority.slice(0);}
	public getAtomTetraChiral():number[] {return this.chiralTetra.slice(0);}
	public getBondSideStereo():number[] {return this.cistransBond.slice(0);}

	// ------------------ static methods --------------------

	// convenience
	public static create(meta:MetaMolecule):Stereochemistry
	{
		let stereo = new Stereochemistry(meta);
		stereo.calculate();
		return stereo;
	}

	/*
		The Rubric Methods: each of these examines an atom/bond and ascertains whether it has sufficient substituents, and
		layout information (coordinates and/or wedges) for it to fit into a certain type of geometry-locked template, which
		can infer chirality or restricted bond stereochemistry; the return value is an array with the adjacent indices fitted
		into the mould, sometimes with 0 as a placeholder for implicit hydrogens or missing substituents; or null if there are
		insufficient neighbours or geometry clues.

		These methods do NOT make any judgment calls as to whether the atom types should limit to the geometry - the caller must
		provide this logic. They also make no judgment about degeneracy, which means that the atom/bond is not necessarily
		stereochemically active.
	*/

	//
	//                    4    3
	// assignment style:   \\ #      (3 is pointing down, 4 is pointing up)
	//                       A
	//                     /   \
	//                    1     2
	public static rubricTetrahedral(mol:Molecule, atom:number):number[]
	{
		// must have at least 3 actual neighbours, and actual+virtual H's of 4
		if (mol.atomAdjCount(atom) < 3 || mol.atomAdjCount(atom) + mol.atomHydrogens(atom) != 4) return null;

		// must have at least one wedge originating from the atom, and no squigglies
		let adjBonds = mol.atomAdjBonds(atom);
		let hasWedge = false;
		for (let n = 0; n < adjBonds.length; n++)
		{
			let bt = mol.bondType(adjBonds[n]);
			if (bt == Molecule.BONDTYPE_UNKNOWN) return null; // squiggly
			if (mol.bondFrom(adjBonds[n]) != atom) continue;
			if (bt == Molecule.BONDTYPE_INCLINED || bt == Molecule.BONDTYPE_DECLINED) hasWedge = true;
		}
		if (!hasWedge && !mol.is3D()) return null;

		// pull out coordinates, including fakes for Z
		let adj = mol.atomAdjList(atom);
		let x = [0, 0, 0, 0];
		let y = [0, 0, 0, 0];
		let z = [0, 0, 0, 0];
		let numShort = 0, numWedges = 0;
		for (let n = 0; n < adjBonds.length; n++)
		{
			const bfr = mol.bondFrom(adjBonds[n]), bt = mol.bondType(adjBonds[n]);
			x[n] = mol.atomX(adj[n]) - mol.atomX(atom);
			y[n] = mol.atomY(adj[n]) - mol.atomY(atom);
			if (mol.is3D())
			{
				z[n] = mol.atomZ(adj[n]) - mol.atomZ(atom);
			}
			else if (bfr == atom)
			{
				if (bt == Molecule.BONDTYPE_INCLINED)
				{
					z[n] = 1;
					numWedges++;
				}
				else if (bt == Molecule.BONDTYPE_DECLINED)
				{
					z[n] = -1;
					numWedges++;
				}
			}

			// normalise the length, and stop if it's insane
			let dsq = norm_xyz(x[n], y[n], z[n]);
			if (dsq < 0.01 * 0.01)
			{
				numShort++;
				if (numShort > 1) return null; // second one is a dealbreaker
			}
		}

		// build implicit-H position
		if (adjBonds.length == 3)
		{
			adj.push(0);
			if (!mol.is3D() && numWedges == 1)
			{
				// special deal it's flat, so order the bonds by angle, and push in a canonical set of coordinates; this renormalisation can
				// fix some weird drawings, which is common for sugars, and various other things
				let th0 = Math.atan2(y[0], x[0]), th1 = Math.atan2(y[1], x[1]), th2 = Math.atan2(y[2], x[2]);
				let i1 = 1, i2 = 2;
				if (angleDiffPos(th1, th0) > angleDiffPos(th2, th0))
				{
					i2 = 1;
					i1 = 2;
				}

				x[0] = 1.5;
				y[0] = 0;
				x[1] = -0.75;
				y[i1] = 1.3;
				x[2] = -0.75;
				y[i2] = -1.3;
			}
			else
			{
				// use geometry largely as-is
				x[3] = -(x[0] + x[1] + x[2]);
				y[3] = -(y[0] + y[1] + y[2]);
				z[3] = -(z[0] + z[1] + z[2]);
				let dsq = norm2_xyz(x[3], y[3], z[3]);
				if (dsq < 0.01 * 0.01) return null;
				let inv = 1.0 / Math.sqrt(dsq);
				x[3] *= inv;
				y[3] *= inv;
				z[3] *= inv;
			}
		}

		let one = 0, two = 0;
		for (let i = 1; i <= 6; i++)
		{
			let a = 0, b = 0;
			if (i == 1) {a = 1; b = 2;}
			else if (i == 2) {a = 2; b = 3;}
			else if (i == 3) {a = 3; b = 1;}
			else if (i == 4) {a = 2; b = 1;}
			else if (i == 5) {a = 3; b = 2;}
			else if (i == 6) {a = 1; b = 3;}
			let xx = y[a] * z[b] - y[b] * z[a] - x[0];
			let yy = z[a] * x[b] - z[b] * x[a] - y[0];
			let zz = x[a] * y[b] - x[b] * y[a] - z[0];
			if (i <= 3) one += xx * xx + yy * yy + zz * zz;
			else two += xx * xx + yy * yy + zz * zz;
		}

		if (two > one) Vec.swap(adj, 2, 3);
		return adj;
	}

 	//                      1   2
	// assignment style:     # #	note: the Z-axis direction is arbitrary; 1234 is equivalent to 1432
	//                        A
	//						// \\
	//                      3   4
	public static rubricSquarePlanar(mol:Molecule, atom:number):number[]
	{
		if (mol.atomAdjCount(atom) != 4) return null;

		// drawing style must be one of 3 options: 2 up + 2 down, or 2 flat + (2 up/2 down)
		if (!mol.is3D())
		{
			let ninc = 0, ndec = 0;
			for (let b of mol.atomAdjBonds(atom))
			{
				let bt = mol.bondType(b);
				if (bt == Molecule.BONDTYPE_INCLINED) ninc++;
				else if (bt == Molecule.BONDTYPE_DECLINED) ndec++;
			}
			if (ninc == 2 && ndec == 2) {}
			else if (ninc == 2 && ndec == 0) {}
			else if (ninc == 0 && ndec == 2) {}
			else return null;
		}

		// determine all the vector outgoings; ensure that position 3 is opposite position 1; other than that, the order is arbitrary
		let adj = mol.atomAdjList(atom);
		let v0 = MolUtil.atomVec3(mol, atom);
		let v1 = Vec.sub(MolUtil.atomVec3(mol, adj[0]), v0);
		let v2 = Vec.sub(MolUtil.atomVec3(mol, adj[1]), v0);
		let v3 = Vec.sub(MolUtil.atomVec3(mol, adj[2]), v0);
		let v4 = Vec.sub(MolUtil.atomVec3(mol, adj[3]), v0);

		for (let v of [v1, v2, v3, v4])
		{
			let dsq = norm2_xyz(v[0], v[1], v[2]);
			if (dsq < 0.01 * 0.01) continue;
			let inv = 1.0 / Math.sqrt(dsq);
			v[0] *= inv;
			v[1] *= inv;
			v[2] *= inv;
		}

		let d2 = GeomUtil.dist2(v1, v2), d3 = GeomUtil.dist2(v1, v3), d4 = GeomUtil.dist2(v1, v4);
		if (d2 > d3 && d2 >= d4)
		{
			Vec.swap(adj, 1, 2);
			[v2, v3] = [v3, v2];
		}
		else if (d4 > d3)
		{
			Vec.swap(adj, 3, 2);
			[v3, v4] = [v4, v3];
		}

		// circle around and make sure the acute angles are with reasonable bounds; 90 degrees is ideal, +/- 45 is OK
		// for 3D cases we don't have the wedge filter, so make the constraint tighter
		const MIN_ANGLE = (mol.is3D() ? 80 : 45) * DEGRAD;
		const MAX_ANGLE = (mol.is3D() ? 100 : 135) * DEGRAD;
		const th12 = GeomUtil.acuteAngle(v1, v2);
		if (th12 < MIN_ANGLE || th12 > MAX_ANGLE) return null;
		const th23 = GeomUtil.acuteAngle(v2, v3);
		if (th23 < MIN_ANGLE || th23 > MAX_ANGLE) return null;
		const th34 = GeomUtil.acuteAngle(v3, v4);
		if (th34 < MIN_ANGLE || th34 > MAX_ANGLE) return null;
		const th41 = GeomUtil.acuteAngle(v4, v1);
		if (th41 < MIN_ANGLE || th41 > MAX_ANGLE) return null;

		return adj;
	}

	//                        5  3
	// assignment style:      | #    (4->5 is the "axial up" and [1,2,3] follow the right hand vector rule)
	//                     1--A      (only position 1 is allowed to be vacant, and only 2 & 3 can be opposite)
	//                        |\\
	//                        4  2
	public static rubricBipyrimidal(mol:Molecule, atom:number):number[]
	{
		const nadj = mol.atomAdjCount(atom);
		if (nadj != 4 && nadj != 5) return null;

		// if sketch, must have exactly 1 up & 1 down
		let atom2 = 0, atom3 = 0;
		let adj = mol.atomAdjList(atom), bonds = mol.atomAdjBonds(atom);
		if (!mol.is3D())
		{
			for (let n = 0; n < adj.length; n++)
			{
				if (mol.bondType(bonds[n]) == Molecule.BONDTYPE_INCLINED)
				{
					if (atom2 > 0) return null;
					atom2 = adj[n];
				}
				else if (mol.bondType(bonds[n]) == Molecule.BONDTYPE_DECLINED)
				{
					if (atom3 > 0) return null;
					atom3 = adj[n];
				}
			}
			if (atom2 == 0 || atom3 == 0) return null;

			// the two bonds with opposite wedges cannot be close to opposite
			let th1 = Math.atan2(mol.atomY(atom2) - mol.atomY(atom), mol.atomX(atom2) - mol.atomX(atom));
			let th2 = Math.atan2(mol.atomY(atom3) - mol.atomY(atom), mol.atomX(atom3) - mol.atomX(atom));
			if (Math.abs(angleDiff(th1, th2)) > 160 * DEGRAD) return null;
		}

		// get all the relative emergent vectors
		let v0 = MolUtil.atomVec3(mol, atom);
		let v:number[][] = [[], [], [], [], []];
		const THRESH = 0.1; // bond lengths in general must be this long, otherwise the structure is unworthy
		for (let n = 0; n < nadj; n++)
		{
			v[n] = Vec.sub(MolUtil.atomVec3(mol, adj[n]), v0);
			const mag = GeomUtil.magnitude(v[n]);
			if (mag < THRESH) return null;
			Vec.mulBy(v[n], 1.0 / mag);

			// if it's 2D, atom2 & 3 are defined: do faux embedding
			if (adj[n] == atom2) v[n][2] += 1; // up
			else if (adj[n] == atom3) v[n][2] -= 1; // down
		}

		// figure out atoms 4 & 5; for 2D can rule out two candidates already
		let atom4 = 0, atom5 = 0;
		const ANGLE_OPPOSITE = 175 * DEGRAD;
		for (let i = 0; i < nadj - 1; i++) if (adj[i] != atom2 && adj[i] != atom3)
		{
			for (let j = i + 1; j < nadj; j++) if (adj[j] != atom2 && adj[j] != atom3)
			{
				let theta = GeomUtil.acuteAngle(v[i], v[j]);
				if (theta > ANGLE_OPPOSITE)
				{
					if (atom4 != 0) return null; // can't have two angles close to 180 degrees
					atom4 = adj[i];
					atom5 = adj[j];
				}
			}
		}
		if (!atom4 || !atom5) return null;

		let v1 = null;
		let v2 = v[adj.indexOf(atom2)];
		let v3 = v[adj.indexOf(atom3)];
		let v4 = v[adj.indexOf(atom4)];
		let v5 = v[adj.indexOf(atom5)];

		// the atom3 position is either real or virtual
		let atom1 = 0;
		if (nadj == 5)
		{
			for (let n = 0; n < nadj; n++) if (adj[n] != atom2 && adj[n] != atom3 && adj[n] != atom4 && adj[n] != atom5)
			{
				atom1 = adj[n];
				v1 = v[n];
				break;
			}
		}
		else // create a virtual atom
		{
			v1 = [0, 0, 0];
			v1 = Vec.sub(v1, v2);
			v1 = Vec.sub(v1, v3);
			const mag = GeomUtil.magnitude(v1);
			if (mag < THRESH) return null; // (is this being unfair at all?)
			Vec.mulBy(v1, 1.0 / mag);
		}

		// if the cross product of 4->5 x 0->1 is closer to 2, parity is even
		let v45 = Vec.sub(v5, v4);
		let cross = GeomUtil.crossProduct(v45, v1);
		let dsq2 = GeomUtil.dist2(cross, v2), dsq3 = GeomUtil.dist2(cross, v3);
		if (dsq2 < dsq3)
			return [atom1, atom2, atom3, atom4, atom5];
		else
			return [atom1, atom2, atom3, atom5, atom4];
	}

	//                        6 2
	// assignment style:      |#    (5->6 is the "axial up" and [1,2,3,4] follow the right hand vector rule)
	//                     3--A--1
	//						//|
	//                     4  5
	public static rubricOctahedral(mol:Molecule, atom:number):number[]
	{
		const nadj = mol.atomAdjCount(atom);
		if (nadj != 5 && nadj != 6) return null;

		let adj = mol.atomAdjList(atom), bonds = mol.atomAdjBonds(atom);
		if (nadj == 5) {adj.push(0); bonds.push(0);}

		// if a 2D sketch, make sure there are enough wedges
		if (!mol.is3D())
		{
			let numWedges = 0;
			for (let b of bonds) if (b > 0)
			{
				const bt = mol.bondType(b);
				if (bt == Molecule.BONDTYPE_INCLINED || bt == Molecule.BONDTYPE_DECLINED) numWedges++;
			}
			if ((nadj == 5 && numWedges < 1) || (nadj == 6 && numWedges < 2)) return null;
		}

		const THRESH = 0.1; // bond lengths in general must be this long, otherwise the structure is unworthy

		// get all the relative emergent vectors; generate faux embedding for wedges
		let v0 = MolUtil.atomVec3(mol, atom);
		let v:number[][] = [[], [], [], [], [], []];
		for (let n = 0; n < nadj; n++)
		{
			v[n] = MolUtil.atomVec3(mol, adj[n]);
			Vec.subFromArray(v[n], v0);
			let mag = GeomUtil.magnitude(v[n]);
			if (mag < THRESH) return null;
			Vec.mulBy(v[n], 1 / mag);

			let bt = mol.bondType(bonds[n]);
			if (bt == Molecule.BONDTYPE_INCLINED)
			{
				if (mol.bondFrom(bonds[n]) == atom) v[n][2] += 1; else v[n][2] -= 1;
			}
			else if (bt == Molecule.BONDTYPE_DECLINED)
			{
				if (mol.bondFrom(bonds[n]) == atom) v[n][2] -= 1; else v[n][2] += 1;
			}
		}

		// if there's a missing spot, compose it from the opposite of the sum of all the other directions
		if (nadj == 5)
		{
			v[5] = [0, 0, 0];
			for (let n = 0; n < 5; n++) Vec.subFromArray(v[5], v[n]);
			let mag = GeomUtil.magnitude(v[5]);
			if (mag < THRESH) return null; // (is this being unfair at all?)
			Vec.mulBy(v[5], 1 / mag);
		}

		// first reference: locate ligands that are as far away as possible from each other (i.e. 180 degrees), and stick these in the axial positions
		let slots = [-1, -1, -1, -1, 0, 1];
		let bestOpposite = GeomUtil.acuteAngle(v[0], v[1]);
		for (let i = 0; i < 5; i++) for (let j = (i == 0 ? 2 : i + 1); j < 6; j++)
		{
			let theta = GeomUtil.acuteAngle(v[i], v[j]);
			if (theta > bestOpposite)
			{
				slots[4] = i;
				slots[5] = j;
				bestOpposite = theta;
			}
		}
		let axial = Vec.sub(v[slots[5]], v[slots[4]]);

		// second reference: locate the ligand that is as close as possible to orthogonal to the axial vector, and stick this in the first equatorial position
		let bestOrthogonal = Number.POSITIVE_INFINITY;
		for (let n = 0; n < 6; n++) if (n != slots[4] && n != slots[5])
		{
			let delta = Math.abs((90 * DEGRAD) - GeomUtil.acuteAngle(v[n], axial));
			if (delta < bestOrthogonal)
			{
				slots[0] = n;
				bestOrthogonal = delta;
			}
		}

		// third reference: use the cross product between axial & current equatorial to grab the next two in sequence
		for (let s = 1; s <= 2; s++)
		{
			let cross = GeomUtil.crossProduct(axial, v[slots[s - 1]]);
			let bestOrient = Number.POSITIVE_INFINITY;

			for (let n = 0; n < 6; n++)
			{
				if (n == slots[4] || n == slots[5] || n == slots[0] || n == slots[1]) continue;
				let delta = GeomUtil.acuteAngle(v[n], cross);
				if (delta < bestOrient)
				{
					slots[s] = n;
					bestOrient = delta;
				}
			}
		}

		// the last one is implied by process of elimination
		for (let n = 0; n < 6; n++) if (slots.indexOf(n) < 0)
		{
			slots[3] = n;
			break;
		}

		/*Util.writeln("NOW slots = "+Util.arrayStr(slots));
		for (int n = 0; n < 6; n++) Util.writeln(" position "+(n+1)+" -> atom "+mol.atomElement(adj[slots[n]]));*/

		// convert to atom indices
		let rubric = [0, 0, 0, 0, 0, 0];
		for (let n = 0; n < 6; n++) rubric[n] = slots[n] < 0 ? 0 : adj[slots[n]];
		return rubric;
	}

	//                      1      3
	//                       \    /
	// assignment style:      A==B
	//                       /    \
	//					    2      4
	public static rubricBondSides(mol:Molecule, bond:number):number[]
	{
		const bfr = mol.bondFrom(bond), bto = mol.bondTo(bond);
		const nfr = mol.atomAdjCount(bfr), nto = mol.atomAdjCount(bto);
		if (nfr < 2 || nfr > 3 || nto < 2 || nto > 3) return null;
		let adj1 = mol.atomAdjList(bfr), adj2 = mol.atomAdjList(bto);
		let f1 = 0, f2 = 0, t1 = 0, t2 = 0;
		for (let i = 0; i < adj1.length; i++)
		{
			if (adj1[i] != bto)
			{
				if (f1 == 0) f1 = adj1[i];
				else f2 = adj1[i];
			}
		}
		for (let i = 0; i < adj2.length; i++)
		{
			if (adj2[i] != bfr)
			{
				if (t1 == 0) t1 = adj2[i];
				else t2 = adj2[i];
			}
		}

		if (f1 > 0 && f2 > 0 && mol.atomElement(f1) == 'H') {let f = f1; f1 = f2; f2 = f;}
		if (t1 > 0 && t2 > 0 && mol.atomElement(t1) == 'H') {let t = t1; t1 = t2; t2 = t;}

		// make a determination of whether the first substituents are on the same side, using the cross product; if there
		// are only 2 substituents, this ends up being definitive
		let vfr = MolUtil.atomVec3(mol, bfr), vto = MolUtil.atomVec3(mol, bto);
		let vbond = Vec.sub(vto, vfr);//,vt0=Vec.neg(vf0);
		let vf1 = Vec.sub(MolUtil.atomVec3(mol, f1), vfr), vt1 = Vec.sub(MolUtil.atomVec3(mol, t1), vto);

		const THRESHSQ = 0.1 * 0.1; // cross product must be this long; if not, it's either linear, or unreasonably short

		let xf1 = GeomUtil.crossProduct(vf1, vbond);
		if (GeomUtil.magnitude2(xf1) < THRESHSQ) return null;
		let xt1 = GeomUtil.crossProduct(vt1, vbond);
		if (GeomUtil.magnitude2(xt1) < THRESHSQ) return null;

		let xf1N = Vec.neg(xf1);
		let keepF1T1 = GeomUtil.dist2(xf1, xt1) < GeomUtil.dist2(xf1N, xt1);
		let keepF2T1 = keepF1T1, keepF1T2 = keepF1T1, keepF2T2 = keepF1T1;

		// check the other substituents, if they are defined: these may contradict the first determination, and hence cause
		// the stereo assignment to be rejected
		// note that the determination is tolerant of hydrogen atoms that are planted pretty much on top of their heavy
		// neighbour - this can make the algorithm more tolerant to add/create hydrogen cycles
		let vf2:number[] = null, vt2:number[] = null, xf2:number[] = null, xt2:number[] = null, xf2N:number[] = null;
		if (f2 > 0)
		{
			vf2 = Vec.sub(MolUtil.atomVec3(mol, f2), vfr);
			if (GeomUtil.magnitude2(vf2) < THRESHSQ)
			{
				if (mol.atomElement(f2) != 'H') return null;
			}
			else
			{
				xf2 = GeomUtil.crossProduct(vf2, vbond);
				if (GeomUtil.magnitude2(xf2) < THRESHSQ) return null;
				xf2N = Vec.neg(xf2);
				keepF2T1 = GeomUtil.dist2(xf2, xt1) > GeomUtil.dist2(xf2N, xt1);
			}
		}
		if (t2 > 0)
		{
			vt2 = Vec.sub(MolUtil.atomVec3(mol, t2), vto);
			if (GeomUtil.magnitude2(vt2) < THRESHSQ)
			{
				if (mol.atomElement(t2) != 'H') return null;
			}
			else
			{
				xt2 = GeomUtil.crossProduct(vt2, vbond);
				if (GeomUtil.magnitude2(xt2) < THRESHSQ) return null;
				keepF1T2 = GeomUtil.dist2(xf1, xt2) > GeomUtil.dist2(xf1N, xt2);
			}
		}
		if (/*f2>0 && t2>0*/xf2 != null && xt2 != null)
		{
			keepF2T2 = GeomUtil.dist2(xf2, xt2) < GeomUtil.dist2(xf2N, xt2);
		}

		// pick the order based on sides
		if (keepF1T1 && keepF2T1 && keepF1T2 && keepF2T2) return [f1, f2, t1, t2];
		if (!keepF1T1 && !keepF2T1 && !keepF1T2 && !keepF2T2) return [f1, f2, t2, t1];

		return null;
	}

	// ------------------ private methods --------------------

	// compute the chirality values for each atom centre
	private buildTetraChirality():void
	{
		const mol = this.mol, na = mol.numAtoms, nb = mol.numBonds;

		// !! USE THE "BROKEN" value for screwed up stuff

		let haswedge = Vec.booleanArray(false, na);
		for (let n = 1; n <= nb; n++)
		{
			if (mol.bondType(n) == Molecule.BONDTYPE_INCLINED || mol.bondType(n) == Molecule.BONDTYPE_DECLINED)
				haswedge[mol.bondFrom(n) - 1] = true;
		}

		skip_atom: for (let n = 1; n <= na; n++)
		{
			this.chiralTetra[n - 1] = Stereochemistry.STEREO_NONE;
			let adj = mol.atomAdjList(n);
			if (!(adj.length == 4 || (adj.length == 3 && mol.atomHydrogens(n) == 1))) continue;
			if (adj.length == 3 && (this.isH[adj[0] - 1] || this.isH[adj[1] - 1] || this.isH[adj[2] - 1])) continue;
			for (let i = 0; i < adj.length - 1; i++)
			{
				for (let j = i + 1; j < adj.length; j++)
				{
					if (this.priority[adj[i] - 1] == this.priority[adj[j] - 1]) continue skip_atom;
				}
			}

			if (!haswedge[n - 1] && !mol.is3D())
			{
				this.chiralTetra[n - 1] = Stereochemistry.STEREO_UNKNOWN;
				continue;
			}

			let rubric = Stereochemistry.rubricTetrahedral(mol, n);
			if (rubric == null) continue;

			let pri =
			[
				rubric[0] == 0 ? 0 : this.priority[rubric[0] - 1],
				rubric[1] == 0 ? 0 : this.priority[rubric[1] - 1],
				rubric[2] == 0 ? 0 : this.priority[rubric[2] - 1],
				rubric[3] == 0 ? 0 : this.priority[rubric[3] - 1]
			];
			pri = Vec.idxSort(pri);
			let parity = Permutation.parityIdentity(pri);

			this.chiralTetra[n - 1] = (parity & 1) == 0 ? Stereochemistry.STEREO_POS : Stereochemistry.STEREO_NEG;
		}
	}

	// compute the cis/trans stereochemistry for each bond
	private buildBondCisTrans():void
	{
		const mol = this.mol, na = mol.numAtoms, nb = mol.numBonds;
		let sf = [0, 0], st = [0, 0];

		// bonds in small rings should not get an E/Z assignment, due to geometry constraints
		let ringMask = Vec.booleanArray(false, nb);
		for (let rsz = 3; rsz <= 7; rsz++)
		{
			for (let r of mol.findRingsOfSize(rsz))
			{
				for (let n = 0; n < r.length; n++)
				{
					let b = mol.findBond(r[n], r[n < r.length - 1 ? n + 1 : 0]);
					ringMask[b - 1] = true;
				}
			}
		}

		skip_bond: for (let n = 1; n <= nb; n++)
		{
			this.cistransBond[n - 1] = Stereochemistry.STEREO_NONE;
			if (mol.bondOrder(n) != 2 || this.meta.isBondAromatic(n) || ringMask[n - 1]) continue;

			let bfr = mol.bondFrom(n), bto = mol.bondTo(n);
			let adj1 = mol.atomAdjList(bfr), adj2 = mol.atomAdjList(bto);
			if (adj1.length <= 1 || adj2.length <= 1 || adj1.length > 3 || adj2.length > 3) continue;
			if (adj1.length == 2 && (this.isH[adj1[0] - 1] || this.isH[adj1[1] - 1])) continue;
			if (adj2.length == 2 && (this.isH[adj2[0] - 1] || this.isH[adj2[1] - 1])) continue;

			// make sure neither side has two with equivalent priority
			for (let i = 0; i < adj1.length - 1; i++)
				if (adj1[i] != bfr) for (let j = i + 1; j < adj1.length; j++)
					if (adj1[j] != bfr) if (this.priority[adj1[i] - 1] == this.priority[adj1[j] - 1]) continue skip_bond;
			for (let i = 0; i < adj2.length - 1; i++)
				if (adj2[i] != bto) for (let j = i + 1; j < adj2.length; j++)
					if (adj2[j] != bto) if (this.priority[adj2[i] - 1] == this.priority[adj2[j] - 1]) continue skip_bond;

			// if it's a squiggly bond, that means unknown
			if (mol.bondType(n) == Molecule.BONDTYPE_UNKNOWN)
			{
				this.cistransBond[n - 1] = Stereochemistry.STEREO_UNKNOWN;
				continue;
			}

			let rubric = Stereochemistry.rubricBondSides(mol, n);
			if (rubric == null) continue;

			let pf1 = rubric[0] == 0 ? 0 : this.priority[rubric[0] - 1];
			let pf2 = rubric[1] == 0 ? 0 : this.priority[rubric[1] - 1];
			let pt1 = rubric[2] == 0 ? 0 : this.priority[rubric[2] - 1];
			let pt2 = rubric[3] == 0 ? 0 : this.priority[rubric[3] - 1];

			this.cistransBond[n - 1] = ((pf1 < pf2) == (pt1 < pt2)) ? Stereochemistry.STEREO_POS : Stereochemistry.STEREO_NEG;
		}
	}

	// compute the cis/trans stereochemistry for square planar atoms
	private buildPlanarCisTrans():void
	{
		const mol = this.mol, na = mol.numAtoms, nb = mol.numBonds;

		skip_atom: for (let n = 1; n <= na; n++)
		{
			this.squarePlanar[n - 1] = Stereochemistry.STEREO_NONE;
			if (mol.atomAdjCount(n) != 4) continue; // NOTE: entertain the notion of making it work with virtual hydrogens
			if (Chemistry.ELEMENT_BLOCKS[mol.atomicNumber(n)] < 3) continue; // only d- or f-blocks need apply

			let adj = mol.atomAdjList(n);

			// if 3 or more substituents are the same, nothing to see here
			for (let i = 0; i < adj.length; i++)
			{
				let count = 0;
				for (let j = 0; j < adj.length; j++)
				{
					if (this.priority[adj[i] - 1] == this.priority[adj[j] - 1]) count++;
				}
				if (count >= 3) continue skip_atom;
			}

			let rubric = Stereochemistry.rubricSquarePlanar(mol, n);
			if (rubric == null) continue;

			let pri =
			[
				rubric[0] == 0 ? 0 : this.priority[rubric[0] - 1],
				rubric[1] == 0 ? 0 : this.priority[rubric[1] - 1],
				rubric[2] == 0 ? 0 : this.priority[rubric[2] - 1],
				rubric[3] == 0 ? 0 : this.priority[rubric[3] - 1]
			];

			let parity = Permutation.parityOrder(pri);
			this.squarePlanar[n - 1] = (parity & 1) == 0 ? Stereochemistry.STEREO_POS : Stereochemistry.STEREO_NEG;
		}
	}

	// compute the R/S chirality for octahedral centres
	private buildOctaChirality():void
	{
		// !! TODO
	}

	// generates Cahn-Ingold-Prelog priority for each atom, where degeneracies are indicated by having the same number
	private buildPriority():void
	{
		const mol = this.mol, na = mol.numAtoms, nb = mol.numBonds;

		// build a graph representation which has entries replicated according to bond order, and -1 for implicit hydrogens
		let cipgr:number[][] = [];
		for (let n = 0; n < na; n++) cipgr.push(Vec.numberArray(-1, mol.atomHydrogens(n + 1)));
		for (let n = 1; n <= nb; n++)
		{
			let bf = mol.bondFrom(n) - 1, bt = mol.bondTo(n) - 1, bo = mol.bondOrder(n);
			if (this.meta.isBondAromatic(n)) bo = 2; // hacky
			if (bf != bt) for (let i = 0; i < bo; i++)
			{
				cipgr[bf].push(bt);
				cipgr[bt].push(bf);
			}
		}

		// seed the priorities with atomic number
		this.priority = Vec.numberArray(0, na);
		let anyActualH = false;
		for (let n = 0; n < na; n++)
		{
			this.priority[n] = mol.atomicNumber(n + 1);
			if (this.priority[n] == 1) anyActualH = true;
		}

		// pass through and reassign priorities as many times as necessary, until no change
		let prigr:number[][] = [];
		for (let n = 0; n < na; n++) prigr.push([]);
		while (true)
		{
			// make an equivalent to cipgr which has priorities instead of indices
			for (let n = 0; n < na; n++)
			{
				let cip = cipgr[n], pri:number[] = [];
				for (let i = 0; i < cip.length; i++) pri.push(cip[i] < 0 ? 1 : this.priority[cip[i]]);
				Vec.sort(pri);
				prigr[n] = pri;
			}

			// divide each priority category into groups, then for each of these groups, split the contents out and reassign
			let groups = this.sortAndGroup(this.priority);
			let nextpri = anyActualH ? 0 : 1;
			let repartitioned = false;

			for (let n = 0; n < groups.length; n++)
			{
				// sort the groups according to their cipgr contents
				let g = groups[n];
				for (let p = 0; p < g.length - 1;)
				{
					const i1 = g[p], i2 = g[p + 1];
					let cmp = 0, sz = Math.max(prigr[i1].length, prigr[i2].length);
					for (let i = 0; i < sz; i++)
					{
						let v1 = i < prigr[i1].length ? prigr[i1][i] : 0, v2 = i < prigr[i2].length ? prigr[i2][i] : 0;
						if (v1 < v2)
						{
							cmp = -1;
							break;
						}
						if (v1 > v2)
						{
							cmp = 1;
							break;
						}
					}
					if (cmp > 0)
					{
						g[p] = i2;
						g[p + 1] = i1;
						if (p > 0) p--;
					}
					else p++;
				}
				//Util.writeln(" after sort: "+Util.arrayStr(g));
				//for (int z : g) Util.writeln("   pri="+Util.arrayStr(prigr[z]));
				for (let i = 0; i < g.length; i++)
				{
					if (i == 0) nextpri++;
					else if (prigr[g[i]].length != prigr[g[i - 1]].length)
					{
						nextpri++;
						repartitioned = true;
					}
					else
					{
						for (let j = 0; j < prigr[g[i]].length; j++) if (prigr[g[i]][j] != prigr[g[i - 1]][j])
						{
							nextpri++;
							repartitioned = true;
							break;
						}
					}

					this.priority[g[i]] = nextpri;
				}
			}

			if (!repartitioned) break;
		}
	}

	// utility method, used during priority generation
	private sortAndGroup(val:number[]):number[][]
	{
		let uset = new Set<number>();
		for (let v of val) uset.add(v);
		let unique = Array.from(uset);
		Vec.sort(unique);
		let ret:number[][] = [];
		for (let n = 0; n < unique.length; n++) ret.push([]);

		for (let n = 0; n < val.length; n++)
		{
			let grp = unique.indexOf(val[n]);
			ret[grp].push(n);
		}

		return ret;
	}
}

/* EOF */ }