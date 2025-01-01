/*
	WebMolKit

	(c) 2010-2024 Molecular Materials Informatics, Inc.

	All rights reserved

	http://molmatinf.com

	[PKG=webmolkit]
*/

import {GeomUtil} from '@wmk/util/Geom';
import {Vec} from '../util/Vec';
import {Molecule} from './Molecule';
import {Graph} from './Graph';
import {norm2_xy, norm_xy} from '@wmk/util/util';

/*
	Calculates a "pseudo-embedding" for a molecule, for the purposes of classifying bonds that intersect, by deciding which
	one is "higher" than the other. This is useful for rendering purposes, when lines need to be drawn as disconnected
	instances.
*/

export interface LineCrossing
{
	bond1:number;
	bond2:number;
	higher:number; // 0=neither, 1 or 2
}

export class PseudoEmbedding
{
	public bondMask:boolean[] = null; // optional bond mask: setting a bond to false excludes it from consideration
	public crossings:LineCrossing[] = [];

	// ------------ public methods ------------

	constructor(private mol:Molecule)
	{
	}

	// perform the embedding calculation, based on components that involve some number of line-crossings
	public calculateCrossings():void
	{
		const {mol, bondMask, crossings} = this;
		let na = mol.numAtoms, nb = mol.numBonds;

		// enumerate all the bond-crossings, and keep a mask of atoms that are involved
		let maskCross = Vec.booleanArray(false, na);
		for (let i = 1; i < nb; i++)
		{
			if (bondMask && !bondMask[i - 1]) continue;

			let x1 = mol.atomX(mol.bondFrom(i)), y1 = mol.atomY(mol.bondFrom(i));
			let x2 = mol.atomX(mol.bondTo(i)), y2 = mol.atomY(mol.bondTo(i));
			let dx = x2 - x1, dy = y2 - y1;
			x1 += dx * 0.001;
			y1 += dy * 0.001;
			x2 -= dx * 0.001;
			y2 -= dy * 0.001;

			for (let j = i + 1; j <= nb; j++)
			{
				if (bondMask && !bondMask[j - 1]) continue;

				let x3 = mol.atomX(mol.bondFrom(j)), y3 = mol.atomY(mol.bondFrom(j));
				let x4 = mol.atomX(mol.bondTo(j)), y4 = mol.atomY(mol.bondTo(j));
				dx = x4 - x3;
				dy = y4 - y3;
				x3 += dx * 0.001;
				y3 += dy * 0.001;
				x4 -= dx * 0.001;
				y4 -= dy * 0.001;

				if (GeomUtil.doLineSegsIntersect(x1, y1, x2, y2, x3, y3, x4, y4))
				{
					crossings.push({bond1: i, bond2: j, higher: 0});

					maskCross[mol.bondFrom(i) - 1] = true;
					maskCross[mol.bondTo(i) - 1] = true;
					maskCross[mol.bondFrom(j) - 1] = true;
					maskCross[mol.bondTo(j) - 1] = true;
				}
			}
		}

		if (crossings.length == 0) return; // nothing to do

		// extend the atom mask to include ring blocks thereof
		let crossRblk = new Set<number>();
		for (let n = 1; n <= na; n++)
		{
			let rblk = mol.atomRingBlock(n);
			if (rblk > 0) crossRblk.add(rblk);
		}
		for (let n = 1; n <= na; n++) if (!maskCross[n - 1])
		{
			let rblk = mol.atomRingBlock(n);
			if (rblk > 0 && crossRblk.has(rblk)) maskCross[n - 1] = true;
		}

		// connect up islands within components, then divide the whole thing into groups
		let maskComp = this.connectMaskedComponents(maskCross);
		let g = Graph.fromMoleculeMask(mol, maskComp);
		let ccgrp = g.calculateComponentGroups();
		for (let n = 0; n < ccgrp.length; n++)
		{
			for (let i = 0; i < ccgrp[n].length; i++) ccgrp[n][i] = g.getIndex(ccgrp[n][i]);
			this.embedComponent(ccgrp[n]);
		}
	}

	// ------------ private methods ------------

	// for an incoming mask that specifies some number of atoms, returns a new mask which joins up any connections between
	// these groups, i.e. any atom that is on a path between two originally masked atoms is included in the result
	private connectMaskedComponents(imask:boolean[]):boolean[]
	{
		const {mol} = this;

		let omask = Vec.duplicate(imask);
		let gmol = Graph.fromMolecule(mol); // will be duplicated many times; faster to clone than to build from mol

		let na = mol.numAtoms, nb = mol.numBonds;
		let maskNever = Vec.booleanArray(false, na);

		// until no further changes: keep looking for bonds that bridge between mask/not-mask; create a graph with the edge
		// missing, and see if the not-mask atom is now in a connected component that shares a masked atom; if it is, then
		// set its mask, because it lies along a path between two disconnected groups

		while (true)
		{
			let anything = false;

			for (let n = 1; n <= nb; n++)
			{
				let bfr = mol.bondFrom(n), bto = mol.bondTo(n);
				let aidx = 0;
				if (omask[bfr - 1] && !omask[bto - 1]) aidx = bto;
				else if (omask[bto - 1] && !omask[bfr - 1]) aidx = bfr;
				else continue;
				if (maskNever[aidx - 1]) continue; // don't want to reinvestigate unless we have to

				// test the components of the disconnection
				// (note: this is relatively expensive, and could be optimised somewhat, if this becomes a problem)
				let g = gmol.clone();
				g.removeEdge(bfr - 1, bto - 1);
				let cc = g.calculateComponents();
				let hit = false;
				for (let i = 0; i < na; i++) if (omask[i] && cc[i] == cc[aidx - 1])
				{
					hit = true;
					break;
				}

				if (hit)
				{
					omask[aidx - 1] = true;
					anything = true;
				}
				else maskNever[aidx - 1] = true;
			}

			if (!anything) break;
		}

		return omask;
	}

	// for a group of atoms (1-based), perform the embedding
	private embedComponent(atoms:number[]):boolean[]
	{
		const {mol, crossings} = this;
		let na = mol.numAtoms, gsz = atoms.length;
		let amask = Vec.booleanArray(false, na);
		for (let n = 0; n < gsz; n++) amask[atoms[n] - 1] = true;

		let z = Vec.numberArray(0, gsz), newZ = new Array(gsz);

		if (this.seedFromInternalWedges(atoms, amask, z)) {}
		else if (this.seedFromExternalWedges(atoms, amask, z)) {}
		else if (this.seedFromPerspective(atoms, amask, z)) {}
		else if (this.seedFromDensity(atoms, amask, z)) {}
		else return; // do nothing

		let ucount = this.normaliseHeights(z);

		while (ucount < gsz)
		{
			this.expandOutward(z, newZ, atoms, amask);
			let ncount = this.normaliseHeights(newZ);
			if (ncount == ucount) break;

			for (let n = 0; n < gsz; n++) z[n] = newZ[n];
			ucount = ncount;
		}

		for (let cross of crossings)
		{
			if (amask[mol.bondFrom(cross.bond1) - 1]) this.updateCrossing(cross, atoms, z);
		}
	}

	// computes initial Z-positions from wedge bonds within the group, or returns false
	private seedFromInternalWedges(atoms:number[], amask:boolean[], z:number[]):boolean
	{
		const {mol} = this;
		let nb = mol.numBonds;
		let success = false;

		for (let n = 1; n <= nb; n++)
		{
			let bt = mol.bondType(n);
			if (bt != Molecule.BONDTYPE_INCLINED && bt != Molecule.BONDTYPE_DECLINED) continue;
			let bfr = mol.bondFrom(n), bto = mol.bondTo(n);
			if (!amask[bfr - 1] || !amask[bto - 1]) continue;

			if (bt == Molecule.BONDTYPE_INCLINED)
			{
				// source atom lowered, destination atom raised
				z[atoms.indexOf(bfr)] -= 0.5;
				z[atoms.indexOf(bto)] += 0.5;
			}
			else
			{
				// source atom raised, destination atom lowered
				z[atoms.indexOf(bfr)] += 0.5;
				z[atoms.indexOf(bto)] -= 0.5;
			}
			success = true;
		}

		return success;
	}

	// computes initial Z-positions from wedge bonds exterior to the group, or returns false
	private seedFromExternalWedges(atoms:number[], amask:boolean[], z:number[]):boolean
	{
		const {mol} = this;
		let nb = mol.numBonds;
		let success = false;

		for (let n = 1; n <= nb; n++)
		{
			let bt = mol.bondType(n);
			if (bt != Molecule.BONDTYPE_INCLINED && bt != Molecule.BONDTYPE_DECLINED) continue;
			let bfr = mol.bondFrom(n), bto = mol.bondTo(n);

			if (amask[bfr - 1])
			{
				z[atoms.indexOf(bfr)] += bt == Molecule.BONDTYPE_INCLINED ? 1 : -1;
				success = true;
			}
			else if (amask[bto - 1])
			{
				z[atoms.indexOf(bto)] += bt == Molecule.BONDTYPE_INCLINED ? -1 : 1;
				success = true;
			}
		}

		return success;
	}

	// tries to infer up/down from perspective drawing, by elevating atoms with longer bond lengths
	private seedFromPerspective(atoms:number[], amask:boolean[], z:number[]):boolean
	{
		const {mol} = this;
		let nb = mol.numBonds;

		let avgdist = 0, maxdist = 0;
		let count = 0, bidx = 0;
		for (let n = 1; n <= nb; n++)
		{
			let bfr = mol.bondFrom(n), bto = mol.bondTo(n);
			if (!amask[bfr - 1] || !amask[bto - 1]) continue;
			let d = norm_xy(mol.atomX(bfr) - mol.atomX(bto), mol.atomY(bfr) - mol.atomY(bto));
			avgdist += d;
			count++;
			if (d > maxdist)
			{
				maxdist = d;
				bidx = n;
			}
		}
		if (count == 0 || bidx == 0) return false;
		avgdist /= count;

		if (maxdist < avgdist * 1.02) return false;

		z[atoms.indexOf(mol.bondFrom(bidx))] = 1;
		z[atoms.indexOf(mol.bondTo(bidx))] = 1;
		return true;
	}

	// looks for densely-clustered atoms to raise above the rest
	private seedFromDensity(atoms:number[], amask:boolean[], z:number[]):boolean
	{
		const {mol} = this;
		let highIdx = 0;
		let highCongest = 0;
		for (let i = 0; i < atoms.length; i++)
		{
			let x1 = mol.atomX(atoms[i]), y1 = mol.atomY(atoms[i]);
			let congest = 0;
			for (let j = 0; j < atoms.length; j++) if (i != j)
				congest += 1.0 / (0.001 + norm2_xy(mol.atomX(atoms[j]) - x1, mol.atomY(atoms[j]) - y1));
			if (congest > highCongest)
			{
				highIdx = atoms[i];
				highCongest = congest;
			}
		}

		if (highIdx == 0) return false;

		z[atoms.indexOf(highIdx)] = 1;
		return true;
	}

	// for a set of arbitrary Z-axis values, normalises them so that they are integral, where the lowest value is 1, and the
	// highest value is equal to the number of {approximately} unique values, which will be equal to the array length if they
	// have fully distinguished themselves; and then it shifts them down so that the median point is at 0
	private normaliseHeights(z:number[]):number
	{
		Vec.addTo(z, -Vec.min(z)); // lowest value is now 0
		let eps = Vec.max(z) * 1E-6; // close enough to numerical precision

		let idx = Vec.idxSort(z);
		let prevZ = -1;
		let mark = 0;
		for (let n = 0; n < idx.length; n++)
		{
			if (prevZ < 0 || Math.abs(prevZ - z[idx[n]]) > eps) mark++;
			prevZ = z[idx[n]];
			z[idx[n]] = mark;
		}

		Vec.addTo(z, -0.5 * (1 + Vec.max(z))); // set it so that 0 is the midpoint

		return mark;
	}

	// for the indicated atom subset, walk through and splash a portion of each atom's height onto each of its neighbours
	private expandOutward(z:number[], newZ:number[], atoms:number[], amask:boolean[]):void
	{
		const {mol} = this;
		let gsz = atoms.length;
		for (let n = 0; n < gsz; n++) newZ[n] = z[n];
		for (let n = 0; n < gsz; n++)
		{
			let adj = mol.atomAdjList(atoms[n]);
			for (let i = 0; i < adj.length; i++) if (amask[adj[i] - 1]) newZ[atoms.indexOf(adj[i])] += 0.1 * z[n];
		}
	}

	// updates the line crossing with the results of Z coordinates, to decide which one gets to go on top
	private updateCrossing(cross:LineCrossing, atoms:number[], z:number[]):void
	{
		const {mol} = this;
		let bfr1 = mol.bondFrom(cross.bond1), bto1 = mol.bondTo(cross.bond1);
		let bfr2 = mol.bondFrom(cross.bond2), bto2 = mol.bondTo(cross.bond2);
		let idx1 = atoms.indexOf(bfr1), idx2 = atoms.indexOf(bto1);
		let idx3 = atoms.indexOf(bfr2), idx4 = atoms.indexOf(bto2);
		if (idx1 < 0 || idx2 < 0 || idx3 < 0 || idx4 < 0) return;
		let x1a = mol.atomX(bfr1), y1a = mol.atomY(bfr1), x1b = mol.atomX(bto1), y1b = mol.atomY(bto1);
		let x2a = mol.atomX(bfr2), y2a = mol.atomY(bfr2), x2b = mol.atomX(bto2), y2b = mol.atomY(bto2);
		let xy = GeomUtil.lineIntersect(x1a, y1a, x1b, y1b, x2a, y2a, x2b, y2b);
		let dx1 = x1b - x1a, dy1 = y1b - y1a, dx2 = x2b - x2a, dy2 = y2b - y2a;
		let ext1 = Math.abs(dx1) > Math.abs(dy1) ? (xy[0] - x1a) / dx1 : (xy[1] - y1a) / dy1;
		let ext2 = Math.abs(dx2) > Math.abs(dy2) ? (xy[0] - x2a) / dx2 : (xy[1] - y2a) / dy2;

		// sanity check: if either of them isn't in the range 0..1, this is a bug (should be impossible)
		if (ext1 < 0 || ext1 > 1 || ext2 < 0 || ext2 > 1) return; // (nah) throw new GraphFaultException("Bug in calculating line-crossings");

		let z1a = z[idx1], z1b = z[idx2], z2a = z[idx3], z2b = z[idx4];
		let z1 = z1a + ext1 * (z1b - z1a), z2 = z2a + ext2 * (z2b - z2a);
		cross.higher = z1 > z2 ? 1 : 2;
	}
}


