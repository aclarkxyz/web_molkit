/*
	WebMolKit

	(c) 2010-2020 Molecular Materials Informatics, Inc.

	All rights reserved

	http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	Polymer blocks: handles metadata instructions that mark up sections of the molecule as being blocks that are assembled in a
	repeating pattern to build macromolecules.

	The information contained in is relatively simplistic and abstract: properties such as complex repeating sequences, splicing of
	cross linkers, molecular weight distribution etc. need to be encoded external to the molecule, but they can reference the encoded
	blocks.

	Each block consists of 1-or-more atoms. The information is repeated identically for each atom, which makes the encoding largely
	invariant to atom deletion by code that does not respect the extensions. Some initial post-correction may also be able to fix
	modifications such as atom insertion, or to delete invalid block IDs.

	Block IDs are stable, i.e. deleting block N does not cause block N+1 to be renumbered. New blocks pick the next available ID, or
	an available empty slot.

	Properties:
		id (starts at 1)
		#connecting bonds (mainly used as a checksum)
		flags: head-to-tail, head-to-head, random
		bond connectivity groups: useful sometimes when more than 2 bonds out of the block: can define how they get reconnected as bulk units
*/

export const POLYMERBLOCK_EXTRA_POLYMER = 'xPOLYMER:';

export enum PolymerBlockConnectivity
{
	HeadToTail = 'ht', // the most orderly linear arrangement
	HeadToHead = 'hh', // alternating linear arrangement
	Random = 'rnd', // explicitly random
}

export interface PolymerBlockUnit
{
	atoms:number[]; // atoms order not significant
	connect:PolymerBlockConnectivity; // null if not applicable
	bondConn:number[]; // interbond connection groups; pairwise ordering: [b1a, b1b, b2a, b2b, ...]
}

export class PolymerBlock
{
	private units = new Map<number, PolymerBlockUnit>();

	// ------------ public methods ------------

	constructor(public mol:Molecule)
	{
		// pull out the raw content from the molecule's extra fields
		let blockAtoms = new Map<number, number[]>();
		for (let n = 1; n <= mol.numAtoms; n++)
		{
			let extra = mol.atomExtra(n);
			for (let str of extra) if (str.startsWith(POLYMERBLOCK_EXTRA_POLYMER))
			{
				let bits = str.substring(POLYMERBLOCK_EXTRA_POLYMER.length).split(':');
				let id = parseInt(bits[0]);
				if (id > 0)
				{
					let atoms = blockAtoms.get(id);
					if (atoms) atoms.push(n); else atoms = [n];
					blockAtoms.set(id, atoms);
				}
			}
		}

		for (let key of Vec.sorted(Array.from(blockAtoms.keys()))) this.appendBlock(key, blockAtoms.get(key));
	}

	// access to resulting content
	public getIDList():number[] {return Vec.sorted(Array.from(this.units.keys()));}
	public getUnit(id:number):PolymerBlockUnit {return this.units.get(id);}

	// replaces all artifact signifiers with those from the current list of content
	public rewriteMolecule():void
	{
		this.purgeExtraFields();
		for (let key of Vec.sorted(Array.from(this.units.keys()))) this.writeUnit(key, this.units.get(key));
	}

	// given the numbering system used by artifacts in another object, make sure that the current ones are renumbered so that they don't clash
	public harmoniseNumbering(other:PolymerBlock):void
	{
		let allKeys = other.getIDList();
		for (let key of this.getIDList()) if (allKeys.includes(key))
		{
			let unit = this.units.get(key);
			this.units.delete(key);
			key = this.nextIdentifier(allKeys);
			this.units.set(key, unit);
			allKeys.push(key);
		}
	}

	// removes one artifact as affected by the given atoms (selected by best overlap), or returns false if nothing removed
	public removeUnit(id:number):void
	{
		let unit = this.units.get(id);
		if (unit == null) return;
		this.units.delete(id);
		let pfx = POLYMERBLOCK_EXTRA_POLYMER + id + ':';
		for (let a of unit.atoms)
		{
			let extra = this.mol.atomExtra(a);
			for (let i = extra.length - 1; i >= 0; i--) if (extra[i].startsWith(pfx)) extra = Vec.remove(extra, i);
			this.mol.setAtomExtra(a, extra);
		}
		for (let b = 1; b <= this.mol.numBonds; b++)
		{
			let extra = this.mol.bondExtra(b);
			if (Vec.isBlank(extra)) continue;
			for (let i = extra.length - 1; i >= 0; i--) if (extra[i].startsWith(pfx)) extra = Vec.remove(extra, i);
			this.mol.setBondExtra(b, extra);
		}
	}

	// quickly strip out all bond artifacts
	public removeAll():void
	{
		this.units.clear();
		this.purgeExtraFields();
	}

	// creates the block, writes content into the molecule, and returns the ID
	public createUnit(atoms:number[], connect:PolymerBlockConnectivity, bondConn:number[]):number
	{
		let id = this.nextIdentifier();
		let unit:PolymerBlockUnit = {atoms, connect, bondConn};
		this.units.set(id, unit);
		this.writeUnit(id, unit);
		return id;
	}

	public static hasPolymerExtensions(mol:Molecule):boolean
	{
		for (let n = 1; n <= mol.numAtoms; n++)
		{
			let extra = mol.atomExtra(n);
			if (extra != null) for (let str of extra) if (str.startsWith(POLYMERBLOCK_EXTRA_POLYMER)) return true;
		}
		return false;
	}

	// for a given atom, return all of the polymer designations, or null if none
	public static getPolymerExtensions(mol:Molecule, atom:number):string[]
	{
		let extra = mol.atomExtra(atom), polext:string[] = null;
		if (extra == null) return null;
		for (let str of extra) if (str.startsWith(POLYMERBLOCK_EXTRA_POLYMER)) polext = Vec.append(polext, str);
		return polext;
	}

	// remove all polymer extensions from a given atom
	public static removePolymerExtensions(mol:Molecule, atom:number):void
	{
		let extra = mol.atomExtra(atom);
		if (extra == null) return;
		let modified = false;
		for (let i = extra.length - 1; i >= 0; i--) if (extra[i].startsWith(POLYMERBLOCK_EXTRA_POLYMER))
		{
			extra = Vec.remove(extra, i);
			modified = true;
		}
		if (modified) mol.setAtomExtra(atom, extra);
	}

	// ------------ private methods ------------

	// given an ID and some atoms that correspond to it, see if it checks out: and if so, add it to the processed list
	private appendBlock(id:number, atoms:number[]):void
	{
		let nattach = 0;
		let unit:PolymerBlockUnit = {atoms, 'connect': null, 'bondConn': null};

		// process the first atom in the list, and extract its properties (assuming degeneracy)
		for (let extra of this.mol.atomExtra(atoms[0])) if (extra.startsWith(POLYMERBLOCK_EXTRA_POLYMER))
		{
			let bits = extra.substring(POLYMERBLOCK_EXTRA_POLYMER.length).split(':');
			if (bits.length < 2 || parseInt(bits[0]) != id) continue;
			nattach = parseInt(bits[1]);
			for (let n = 2; n < bits.length; n++)
			{
				if (bits[n] == PolymerBlockConnectivity.HeadToTail) unit.connect = PolymerBlockConnectivity.HeadToTail;
				else if (bits[n] == PolymerBlockConnectivity.HeadToHead) unit.connect = PolymerBlockConnectivity.HeadToHead;
				else if (bits[n] == PolymerBlockConnectivity.Random) unit.connect = PolymerBlockConnectivity.Random;
			}
		}

		// sanity check: make sure attachment count matches # bonds crossing the block
		if (nattach < 0) return;
		for (let n = 1; n <= this.mol.numBonds; n++)
		{
			let in1 = atoms.indexOf(this.mol.bondFrom(n)) >= 0, in2 = atoms.indexOf(this.mol.bondTo(n)) >= 0;
			if ((in1 && !in2) || (!in1 && in2)) nattach--;
		}
		if (nattach != 0) return;

		// pull out labelled bonds (if any) to derive the reconnection order
		let bonds:number[] = null, order:number[] = null;
		for (let n = 1; n <= this.mol.numBonds; n++)
		{
			for (let extra of this.mol.bondExtra(n)) if (extra.startsWith(POLYMERBLOCK_EXTRA_POLYMER))
			{
				let bits = extra.substring(POLYMERBLOCK_EXTRA_POLYMER.length).split(':');
				if (bits.length < 2 || parseInt(bits[0]) != id) continue;
				bonds = Vec.append(bonds, n);
				order = Vec.append(order, parseInt(bits[1]));
			}
		}
		if (bonds != null)
		{
			if (bonds.length % 2 == 1) return; // has to be an even number
			unit.bondConn = Vec.idxGet(bonds, Vec.idxSort(order));
		}

		this.units.set(id, unit);
	}

	private formatBlockAtom(id:number, unit:PolymerBlockUnit):string
	{
		let nbonds = 0;
		for (let n = 1; n <= this.mol.numBonds; n++)
		{
			let in1 = unit.atoms.indexOf(this.mol.bondFrom(n)) >= 0, in2 = unit.atoms.indexOf(this.mol.bondTo(n)) >= 0;
			if ((in1 && !in2) || (!in1 && in2)) nbonds++;
		}

		let str = POLYMERBLOCK_EXTRA_POLYMER + id + ':' + nbonds;
		if (unit.connect != null) str += ':' + unit.connect;
		return str.toString();
	}

	private formatBlockBond(id:number, unit:PolymerBlockUnit, idxConn:number):string
	{
		return POLYMERBLOCK_EXTRA_POLYMER + id + ':' + idxConn;
	}

	private purgeExtraFields():void
	{
		for (let n = 1; n <= this.mol.numAtoms; n++)
		{
			let extra = this.mol.atomExtra(n);
			let modified = false;
			for (let i = extra.length - 1; i >= 0; i--) if (extra[i].startsWith(POLYMERBLOCK_EXTRA_POLYMER))
			{
				extra = Vec.remove(extra, i);
				modified = true;
			}
			if (modified) this.mol.setAtomExtra(n, extra);
		}
		for (let n = 1; n <= this.mol.numBonds; n++)
		{
			let extra = this.mol.bondExtra(n);
			let modified = false;
			for (let i = extra.length - 1; i >= 0; i--) if (extra[i].startsWith(POLYMERBLOCK_EXTRA_POLYMER))
			{
				extra = Vec.remove(extra, i);
				modified = true;
			}
			if (modified) this.mol.setBondExtra(n, extra);
		}
	}

	private writeUnit(id:number, unit:PolymerBlockUnit):void
	{
		let codeAtom = this.formatBlockAtom(id, unit);
		for (let a of unit.atoms) this.mol.setAtomExtra(a, Vec.append(this.mol.atomExtra(a), codeAtom));
		if (unit.bondConn != null) for (let n = 0; n < unit.bondConn.length; n++)
		{
			let bond = unit.bondConn[n];
			let codeBond = this.formatBlockBond(id, unit, n + 1);
			this.mol.setBondExtra(bond, Vec.append(this.mol.bondExtra(bond), codeBond));
		}
	}

	// using a disposable array, finds the next suitable identifier given that some number may already been taken
	private nextIdentifier(keys?:number[]):number
	{
		if (!keys) keys = this.getIDList();
		if (keys.length == 0) return 1;
		for (let n = 0; n < keys.length - 1; n++) if (keys[n + 1] != keys[n] + 1) return keys[n] + 1;
		return keys[keys.length - 1] + 1;
	}
}

/* EOF */ }