/*
    WebMolKit

    (c) 2010-2021 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {Chemistry} from '../data/Chemistry';
import {Graph} from '../data/Graph';
import {Molecule} from '../data/Molecule';
import {Vec} from '../util/Vec';

/*
	Resonance bond removal: certain algorithms/file formats store alternating single/double bonds in resonance
	form, most commonly the bonds of aromatic rings. The native molecule format does not support resonance style
	bonds, so these must be localised ("Kekule form"). This algorithm can be used to post-process a molecule,
	with the help of a support array that indicates the bonds which were described as resonance (order=1.5).

	The algorithm corrects for some SMILES-esque weirdness, e.g. "aromatic" rings with outgoing carbonyls, and
	also artifacts like hydrogen-specification used explicitly to correct for heteroatoms in not-really-aromatics.

	NOTE: the algorithm will probably barf on some boundary cases, e.g. fullerenes; the max iteration limit is
	the primary method of protection against this.
*/

export class ResonanceRemover
{
	public maxIter = 1000;
	public bondOrders:number[] = []; // this is the deliverable output
	public tolerant = false; // if set to true, will fail silently

	// ------------------ public methods --------------------

	// setup: mol & resBonds have to be defined, but atomHyd can be null
	constructor(private mol:Molecule, private resBonds:boolean[], private atomHyd:number[] = [])
	{
		this.mol = mol;
		this.resBonds = resBonds;
		this.atomHyd = atomHyd;

		for (let n = 1; n <= mol.numBonds; n++) this.bondOrders.push(mol.bondOrder(n));
	}

	// runs the algorithm, and updates the replacement bond orders; critical failures throws a GraphFaultException, and
	// this includes running over max # of iterations as well as invalid/unsolvable resonance regions, so it should always
	// be explicitly checked by the caller
	public perform():void
	{
		const {mol} = this;

		if (this.atomHyd == null)
		{
			this.atomHyd = [];
			for (let n = 1; n <= mol.numAtoms; n++) this.atomHyd.push(mol.atomHExplicit(n));
		}

		this.correctInputMask();

		let g = new Graph(mol.numAtoms);
		for (let n = 1; n <= mol.numBonds; n++) if (this.resBonds[n - 1]) g.addEdge(mol.bondFrom(n) - 1, mol.bondTo(n) - 1);
		let cc = g.calculateComponentGroups();

		for (let n = 0; n < cc.length; n++) if (cc[n].length >= 2) this.processComponent(cc[n]);
	}

	// ------------------ private methods --------------------

	// sometimes the incoming mask can include things like aromatic rings with emerging =O and valence-saturated heteroatoms
	// (you know who you are, SMILES): remove these from consideration
	private correctInputMask():void
	{
		const {mol, atomHyd} = this;
		const na = mol.numAtoms, nb = mol.numBonds;
		let exclude = Vec.booleanArray(false, na);
		for (let n = 1; n <= na; n++)
		{
			let atno = mol.atomicNumber(n);
			let val = atno == Chemistry.ELEMENT_C ? 4 :
					atno == Chemistry.ELEMENT_N || atno == Chemistry.ELEMENT_P || atno == Chemistry.ELEMENT_B ? 3 :
					atno == Chemistry.ELEMENT_O || atno == Chemistry.ELEMENT_S ? 2 : -1;
			if (val < 0) {exclude[n - 1] = true; continue;}

			val += mol.atomCharge(n);
			if (atomHyd[n - 1] > 0) val -= atomHyd[n - 1];
			if (mol.atomAdjCount(n) >= val) exclude[n - 1] = true;
		}
		for (let n = 1; n <= nb; n++) if (!this.resBonds[n - 1] && mol.bondOrder(n) != 1)
		{
			exclude[mol.bondFrom(n) - 1] = true;
			exclude[mol.bondTo(n) - 1] = true;
		}

		this.resBonds = this.resBonds.slice(0);
		for (let n = 0; n < nb; n++) if (this.resBonds[n] && (exclude[mol.bondFrom(n + 1) - 1] || exclude[mol.bondTo(n + 1) - 1]))
		{
			this.bondOrders[n] = 1;
			this.resBonds[n] = false;
		}
	}

	// handle a subset; nodes are 0-based; returns true if any bonds were assigned
	private processComponent(nodes:number[]):void
	{
		const {mol, resBonds, bondOrders, atomHyd} = this;

		let sz = nodes.length;
		if (sz == 2)
		{
			let b = mol.findBond(nodes[0] + 1, nodes[1] + 1);
			bondOrders[b - 1] = 2;
			return;
		}

		// optional hydrogens: in cases where H-counts were not provided, need to consider divalent nitrogens as valid for either X2NH of X=N-X
		let optionalH = Vec.booleanArray(false, sz);
		for (let n = 0; n < sz; n++)
		{
			let i = nodes[n], a = i + 1;
			optionalH[n] = atomHyd[i] == Molecule.HEXPLICIT_UNKNOWN && mol.atomElement(a) == 'N' && mol.atomAdjCount(a) - mol.atomCharge(a) <= 2;
		}

		// prepare graph metrics to assist the search
		let g = new Graph(sz);
		let gravity = g.calculateGravity();
		let mask = Vec.idxMask(nodes, mol.numAtoms);
		let bsz = 0;
		for (let n = 1; n <= mol.numBonds; n++) if (resBonds[n - 1] && mask[mol.bondFrom(n) - 1] && mask[mol.bondTo(n) - 1]) bsz++;
		let bfr = Vec.numberArray(0, bsz), bto = Vec.numberArray(0, bsz), bgrav = Vec.numberArray(0, bsz), bidx = Vec.numberArray(0, bsz);
		bsz = 0;
		for (let n = 1; n <= mol.numBonds; n++) if (resBonds[n - 1] && mask[mol.bondFrom(n) - 1] && mask[mol.bondTo(n) - 1])
		{
			let f = nodes.indexOf(mol.bondFrom(n) - 1), t = nodes.indexOf(mol.bondTo(n) - 1);
			bfr[bsz] = f;
			bto[bsz] = t;
			bgrav[bsz] = gravity[f] + gravity[t];
			bidx[bsz] = n;
			g.addEdge(f, t);
			bsz++;
		}

		// select the first bond
		let seq = Vec.numberArray(0, bsz);
		seq[0] = Vec.idxMax(bgrav);
		let visited = Vec.booleanArray(false, bsz);
		visited[seq[0]] = true;
		for (let i = 1; i < bsz; i++)
		{
			let b = -1;
			for (let j = i - 1; j >= 0; j--)
			{
				for (let n = 0; n < bsz; n++)
				{
					if (!visited[n]) if (bfr[n] == bfr[seq[j]] || bfr[n] == bto[seq[j]] || bto[n] == bfr[seq[j]] || bto[n] == bto[seq[j]])
					{
						if (b < 0 || bgrav[n] > bgrav[b]) b = n;
					}
				}
				if (b >= 0) break;
			}
			if (b < 0) throw 'Graph walk failed';

			seq[i] = b;
			visited[b] = true;
		}

		// grow path candidates until something works
		let paths:boolean[][] = [];
		paths.push([true]);
		paths.push([false]);
		let result:boolean[] = null;
		let resultCount = 0;
		let definiteMatch = Math.ceil(0.5 * bsz); // once # double bonds >= ceil(#bonds/2), definitely locked on

		let iter = 0;
		while (paths.length > 0)
		{
			let p = paths[0];
			let p1 = Vec.append(p, false), p2 = Vec.append(p, true);
			if (!this.validPath(p1, seq, bfr, bto, g, optionalH)) p1 = null;
			if (!this.validPath(p2, seq, bfr, bto, g, optionalH)) p2 = null;

			if (Vec.len(p1) == bsz)
			{
				let c = Vec.maskCount(p1);
				if (c > resultCount)
				{
					result = p1;
					resultCount = c;
				}
				p1 = null;
			}
			if (Vec.len(p2) == bsz)
			{
				let c = Vec.maskCount(p2);
				if (c > resultCount)
				{
					result = p2;
					resultCount = c;
				}
				p2 = null;
			}
			if (resultCount >= definiteMatch) break;

			if (p1 == null && p2 == null) paths.shift();
			else if (p1 != null && p2 != null)
			{
				// the {..,true} one goes in first
				paths[0] = p1;
				paths.splice(1, 0, p2);
			}
			else if (p1 != null) paths[0] = p1;
			else /* p2!=null */paths[0] = p2;

			iter++;
			if (iter > this.maxIter)
			{
				if (result != null) break; // run with it
				if (this.tolerant) return;
				throw 'Resonance localisation exceeded maximum iteration count';
			}
		}

		if (result == null)
		{
			if (this.tolerant) return;
			throw 'Unable to find a solution to the resonance block.';
		}
		for (let n = 0; n < bsz; n++) bondOrders[bidx[seq[n]] - 1] = result[n] ? 2 : 1;
	}

	// for a path sequence (usually incomplete), determine whether it has any chance of success
	private validPath(path:boolean[], seq:number[], bfr:number[], bto:number[], g:Graph, optionalH:boolean[]):boolean
	{
		let sz = g.numNodes;
		let count1 = Vec.numberArray(0, sz), count2 = Vec.numberArray(0, sz);
		for (let n = 0; n < path.length; n++)
		{
			let a1 = bfr[seq[n]], a2 = bto[seq[n]];
			if (path[n])
			{
				count2[a1]++;
				count2[a2]++;
			}
			else
			{
				count1[a1]++;
				count1[a2]++;
			}
		}
		for (let n = 0; n < sz; n++)
		{
			if (count2[n] > 1) return false; // can't have 2 double bonds on the same atom: fail
			if (!optionalH[n] && g.numEdges(n) > 1 && count1[n] == g.numEdges(n)) return false; // no double bonds & no room for one: fail
		}
		return true;
	}
}
