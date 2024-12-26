/*
    WebMolKit

    (c) 2010-2022 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {Vec} from '../util/Vec';
import {Molecule} from './Molecule';
import {MolUtil} from '../mol/MolUtil';

/*
	Utilities for getting & setting query features, for atoms and bonds. These are all stored within the reserved "q"
	extension prefix.
*/

export enum QueryTypeAtom
{
	Charges = 'qC:',		// allowed charges
	Aromatic = 'qA:',		// yes/no; must/not have an aromatic bond
	Unsaturated = 'qU:',	// qU: yes/no; must/must not have a multiple bond (2 or higher)
	Elements = 'qE:',		// allowed elements (in addition to atom's label, if not '*')
	ElementsNot = 'qE!',	// disallowed elements (only relevant if label is '*')
	RingSizes = 'qR:',		// list of small ring sizes that the atom must participate in
	RingSizesNot = 'qR!',	// list of small ring sizes that the atom must not participate in
	RingBlock = 'qB:',		// yes/no; whether the atom must be in a ring block
	NumRings = 'qN:',		// list of allowed numbers of small rings (3..7) the atom may occur in
	RingBonds = 'qG:',		// qG: list of allowed # of bonds that are in a ring
	Adjacency = 'qJ:',		// list of allowed adjacency counts
	BondSums = 'qO:',		// list of allowed sums of adjacent bond orders
	Valences = 'qV:',		// list of allowed valences (sum:BO - chg + unp + hyd)
	Hydrogens = 'qH:',		// list of allowed hydrogen counts (virtual and actual)
	Isotopes = 'qI:',		// list of allowed isotopes
	SubFrags = 'qX:',		// list of allowed sub-fragments (inline encoding, like abbreviations)
	SubFragsNot = 'qX!',	// list of disallowed sub-fragments
}

export enum QueryTypeBond
{
	RingSizes = 'qR:',		// list of small ring sizes that the bond must participate in
	RingSizesNot = 'qR!',	// list of small ring sizes that the bond must not participate in
	RingBlock = 'qB:',		// yes/no; whether the atom must be in a ring block
	NumRings = 'qN:',		// list of allowed numbers of small rings (3..7) the bond may occur in
	Orders = 'qO:',			// list of allowed bond orders; allowed: (0,1,2,3,4,-1) (-1==aromatic)
}

export class QueryUtil
{
	// ------------------ public methods --------------------

	// determine whether there's any kind of query info associated with the atom or bond
	public static hasAnyQueryAtom(mol:Molecule, atom:number):boolean
	{
		let extra = mol.atomExtra(atom);
		for (let n = extra.length - 1; n >= 0; n--) if (extra[n].startsWith('q')) return true;
		return false;
	}
	public static hasAnyQueryBond(mol:Molecule, bond:number):boolean
	{
		let extra = mol.bondExtra(bond);
		for (let n = extra.length - 1; n >= 0; n--) if (extra[n].startsWith('q')) return true;
		return false;
	}

	// return whether a specific kind of query is present
	public static hasQueryAtom(mol:Molecule, atom:number, type:QueryTypeAtom):boolean
	{
		let extra = mol.atomExtra(atom);
		for (let n = extra.length - 1; n >= 0; n--) if (extra[n].startsWith(type)) return true;
		return false;
	}

	public static hasQueryBond(mol:Molecule, bond:number, type:QueryTypeBond):boolean
	{
		let extra = mol.bondExtra(bond);
		for (let n = extra.length - 1; n >= 0; n--) if (extra[n].startsWith(type)) return true;
		return false;
	}

	// removes any instances of a specific kind of query
	public static deleteQueryAtom(mol:Molecule, atom:number, type:QueryTypeAtom):void
	{
		let extra = mol.atomExtra(atom);
		let modified = false;
		for (let n = extra.length - 1; n >= 0; n--) if (extra[n].startsWith(type))
		{
			extra.splice(n, 1);
			modified = true;
		}
		if (modified) mol.setAtomExtra(atom, extra);
	}
	public static deleteQueryBond(mol:Molecule, bond:number, type:QueryTypeBond):void
	{
		let extra = mol.bondExtra(bond);
		let modified = false;
		for (let n = extra.length - 1; n >= 0; n--) if (extra[n].startsWith(type))
		{
			extra.splice(n, 1);
			modified = true;
		}
		if (modified) mol.setBondExtra(bond, extra);
	}

	// remove all query features from atom/bond
	public static deleteQueryAtomAll(mol:Molecule, atom:number)
	{
		mol.setAtomExtra(atom, mol.atomExtra(atom).filter((xtra) => !xtra.startsWith('q')));
	}
	public static deleteQueryBondAll(mol:Molecule, bond:number)
	{
		mol.setBondExtra(bond, mol.bondExtra(bond).filter((xtra) => !xtra.startsWith('q')));
	}

	// fetch the payload content for a particular type, or null if not found
	public static queryAtomString(mol:Molecule, atom:number, type:QueryTypeAtom):string
	{
		let extra = mol.atomExtra(atom);
		for (let n = extra.length - 1; n >= 0; n--) if (extra[n].startsWith(type)) return extra[n].substring(type.length);
		return null;
	}
	public static queryAtomStringList(mol:Molecule, atom:number, type:QueryTypeAtom):string[]
	{
		let extra = mol.atomExtra(atom), list = null;
		if (extra != null) for (let str of extra) if (str.startsWith(type)) list = Vec.append(list, str.substring(type.length));
		return list;
	}
	public static queryBondString(mol:Molecule, bond:number, type:QueryTypeBond):string
	{
		let extra = mol.bondExtra(bond);
		for (let n = extra.length - 1; n >= 0; n--) if (extra[n].startsWith(type)) return extra[n].substring(type.length);
		return null;
	}

	// set the query payload for a particular type; null or empty string will cause it to be deleted instead
	public static setQueryAtom(mol:Molecule, atom:number, type:QueryTypeAtom, str:string):void
	{
		if (!str)
		{
			this.deleteQueryAtom(mol, atom, type);
			return;
		}
		let value = type + str;
		let extra = mol.atomExtra(atom);
		for (let n = extra.length - 1; n >= 0; n--)
		{
			if (extra[n].startsWith(type))
			{
				if (value != null)
				{
					extra[n] = value;
					value = null;
				}
				else extra.splice(n, 1);
			}
		}
		if (value != null) extra.push(value);
		mol.setAtomExtra(atom, extra);
	}
	public static setQueryAtomList(mol:Molecule, atom:number, type:QueryTypeAtom, list:string[]):void
	{
		if (Vec.isBlank(list))
		{
			this.deleteQueryAtom(mol, atom, type);
			return;
		}
		let extra = mol.atomExtra(atom);
		for (let n = extra.length - 1; n >= 0; n--) if (extra[n].startsWith(type)) extra.splice(n, 1);
		for (let str of list) extra.push(type + str);
		mol.setAtomExtra(atom, extra);
	}
	public static setQueryBond(mol:Molecule, bond:number, type:QueryTypeBond, str:string):void
	{
		if (!str)
		{
			this.deleteQueryBond(mol, bond, type);
			return;
		}
		let value = type + str;
		let extra = mol.bondExtra(bond);
		for (let n = extra.length - 1; n >= 0; n--)
		{
			if (extra[n].startsWith(type))
			{
				if (value != null)
				{
					extra[n] = value;
					value = null;
				}
				else extra.splice(n, 1);
			}
		}
		if (value != null) extra.push(value);
		mol.setBondExtra(bond, extra);
	}

	// fetching of specific query types from atoms, parsed out into the right datastructure
	public static queryAtomCharges(mol:Molecule, atom:number):number[]
		{return this.parseIntegers(this.queryAtomString(mol, atom, QueryTypeAtom.Charges));}
	public static queryAtomAromatic(mol:Molecule, atom:number):boolean
		{return this.parseBoolean(this.queryAtomString(mol, atom, QueryTypeAtom.Aromatic));}
	public static queryAtomUnsaturated(mol:Molecule, atom:number):boolean
		{return this.parseBoolean(this.queryAtomString(mol, atom, QueryTypeAtom.Unsaturated));}
	public static queryAtomElements(mol:Molecule, atom:number):string[]
		{return this.parseStrings(this.queryAtomString(mol, atom, QueryTypeAtom.Elements));}
	public static queryAtomElementsNot(mol:Molecule, atom:number):string[]
		{return this.parseStrings(this.queryAtomString(mol, atom, QueryTypeAtom.ElementsNot));}
	public static queryAtomRingSizes(mol:Molecule, atom:number):number[]
		{return this.parseIntegers(this.queryAtomString(mol, atom, QueryTypeAtom.RingSizes));}
	public static queryAtomRingSizesNot(mol:Molecule, atom:number):number[]
		{return this.parseIntegers(this.queryAtomString(mol, atom, QueryTypeAtom.RingSizesNot));}
	public static queryAtomRingBlock(mol:Molecule, atom:number):boolean
		{return this.parseBoolean(this.queryAtomString(mol, atom, QueryTypeAtom.RingBlock));}
	public static queryAtomNumRings(mol:Molecule, atom:number):number[]
		{return this.parseIntegers(this.queryAtomString(mol, atom, QueryTypeAtom.NumRings));}
	public static queryAtomRingBonds(mol:Molecule, atom:number):number[]
		{return this.parseIntegers(this.queryAtomString(mol, atom, QueryTypeAtom.RingBonds));}
	public static queryAtomAdjacency(mol:Molecule, atom:number):number[]
		{return this.parseIntegers(this.queryAtomString(mol, atom, QueryTypeAtom.Adjacency));}
	public static queryAtomBondSums(mol:Molecule, atom:number):number[]
		{return this.parseIntegers(this.queryAtomString(mol, atom, QueryTypeAtom.BondSums));}
	public static queryAtomValences(mol:Molecule, atom:number):number[]
		{return this.parseIntegers(this.queryAtomString(mol, atom, QueryTypeAtom.Valences));}
	public static queryAtomHydrogens(mol:Molecule, atom:number):number[]
		{return this.parseIntegers(this.queryAtomString(mol, atom, QueryTypeAtom.Hydrogens));}
	public static queryAtomIsotope(mol:Molecule, atom:number):number[]
		{return this.parseIntegers(this.queryAtomString(mol, atom, QueryTypeAtom.Isotopes));}
	public static queryAtomSubFrags(mol:Molecule, atom:number):Molecule[]
		{return this.parseMolecules(this.queryAtomStringList(mol, atom, QueryTypeAtom.SubFrags));}
	public static queryAtomSubFragsNot(mol:Molecule, atom:number):Molecule[]
		{return this.parseMolecules(this.queryAtomStringList(mol, atom, QueryTypeAtom.SubFragsNot));}

	// fetching of specific query types from bonds, parsed out into the right datastructure
	public static queryBondRingSizes(mol:Molecule, bond:number):number[]
		{return this.parseIntegers(this.queryBondString(mol, bond, QueryTypeBond.RingSizes));}
	public static queryBondRingSizesNot(mol:Molecule, bond:number):number[]
		{return this.parseIntegers(this.queryBondString(mol, bond, QueryTypeBond.RingSizesNot));}
	public static queryBondRingBlock(mol:Molecule, bond:number):boolean
		{return this.parseBoolean(this.queryBondString(mol, bond, QueryTypeBond.RingBlock));}
	public static queryBondNumRings(mol:Molecule, bond:number):number[]
		{return this.parseIntegers(this.queryBondString(mol, bond, QueryTypeBond.NumRings));}
	public static queryBondOrders(mol:Molecule, bond:number):number[]
		{return this.parseIntegers(this.queryBondString(mol, bond, QueryTypeBond.Orders));}

	// setting of specific query types for atoms
	public static setQueryAtomCharges(mol:Molecule, atom:number, value:number[]):void
		{this.setQueryAtom(mol, atom, QueryTypeAtom.Charges, this.formatIntegers(value));}
	public static setQueryAtomAromatic(mol:Molecule, atom:number, value:boolean):void
		{this.setQueryAtom(mol, atom, QueryTypeAtom.Aromatic, this.formatBoolean(value));}
	public static setQueryAtomUnsaturated(mol:Molecule, atom:number, value:boolean):void
		{this.setQueryAtom(mol, atom, QueryTypeAtom.Unsaturated, this.formatBoolean(value));}
	public static setQueryAtomElements(mol:Molecule, atom:number, value:string[]):void
		{this.setQueryAtom(mol, atom, QueryTypeAtom.Elements, this.formatStrings(value));}
	public static setQueryAtomElementsNot(mol:Molecule, atom:number, value:string[]):void
		{this.setQueryAtom(mol, atom, QueryTypeAtom.ElementsNot, this.formatStrings(value));}
	public static setQueryAtomRingSizes(mol:Molecule, atom:number, value:number[]):void
		{this.setQueryAtom(mol, atom, QueryTypeAtom.RingSizes, this.formatIntegers(value));}
	public static setQueryAtomRingSizesNot(mol:Molecule, atom:number, value:number[]):void
		{this.setQueryAtom(mol, atom, QueryTypeAtom.RingSizesNot, this.formatIntegers(value));}
	public static setQueryAtomRingBlock(mol:Molecule, atom:number, value:boolean):void
		{this.setQueryAtom(mol, atom, QueryTypeAtom.RingBlock, this.formatBoolean(value));}
	public static setQueryAtomNumRings(mol:Molecule, atom:number, value:number[]):void
		{this.setQueryAtom(mol, atom, QueryTypeAtom.NumRings, this.formatIntegers(value));}
	public static setQueryAtomRingBonds(mol:Molecule, atom:number, value:number[]):void
		{this.setQueryAtom(mol, atom, QueryTypeAtom.RingBonds, this.formatIntegers(value));}
	public static setQueryAtomAdjacency(mol:Molecule, atom:number, value:number[]):void
		{this.setQueryAtom(mol, atom, QueryTypeAtom.Adjacency, this.formatIntegers(value));}
	public static setQueryAtomBondSums(mol:Molecule, atom:number, value:number[]):void
		{this.setQueryAtom(mol, atom, QueryTypeAtom.BondSums, this.formatIntegers(value));}
	public static setQueryAtomValences(mol:Molecule, atom:number, value:number[]):void
		{this.setQueryAtom(mol, atom, QueryTypeAtom.Valences, this.formatIntegers(value));}
	public static setQueryAtomHydrogens(mol:Molecule, atom:number, value:number[]):void
		{this.setQueryAtom(mol, atom, QueryTypeAtom.Hydrogens, this.formatIntegers(value));}
	public static setQueryAtomIsotope(mol:Molecule, atom:number, value:number[]):void
		{this.setQueryAtom(mol, atom, QueryTypeAtom.Isotopes, this.formatIntegers(value));}
	public static setQueryAtomSubFrags(mol:Molecule, atom:number, value:Molecule[]):void
		{this.setQueryAtomList(mol, atom, QueryTypeAtom.SubFrags, this.formatMolecules(value));}
	public static setQueryAtomSubFragsNot(mol:Molecule, atom:number, value:Molecule[]):void
		{this.setQueryAtomList(mol, atom, QueryTypeAtom.SubFragsNot, this.formatMolecules(value));}

	// setting of specific query types for bonds
	public static setQueryBondRingSizes(mol:Molecule, bond:number, value:number[]):void
		{this.setQueryBond(mol, bond, QueryTypeBond.RingSizes, this.formatIntegers(value));}
	public static setQueryBondRingSizesNot(mol:Molecule, bond:number, value:number[]):void
		{this.setQueryBond(mol, bond, QueryTypeBond.RingSizesNot, this.formatIntegers(value));}
	public static setQueryBondRingBlock(mol:Molecule, bond:number, value:boolean):void
		{this.setQueryBond(mol, bond, QueryTypeBond.RingBlock, this.formatBoolean(value));}
	public static setQueryBondNumRings(mol:Molecule, bond:number, value:number[]):void
		{this.setQueryBond(mol, bond, QueryTypeBond.NumRings, this.formatIntegers(value));}
	public static setQueryBondOrders(mol:Molecule, bond:number, value:number[]):void
		{this.setQueryBond(mol, bond, QueryTypeBond.Orders, this.formatIntegers(value));}

	// ------------------ private methods --------------------

	// conversion of molecule-encoded strings into appropriate datatypes
	private static parseIntegers(str:string):number[]
	{
		if (!str) return null;
		let strlist = str.split(',');
		let intlist:number[] = new Array(strlist.length);
		for (let n = 0; n < strlist.length; n++) intlist[n] = parseInt(strlist[n]);
		return intlist;
	}
	private static parseStrings(str:string):string[]
	{
		if (!str) return null;
		return str.split(',');
	}
	private static parseBoolean(str:string):boolean
	{
		return !str ? null : str == 'yes';
	}
	public static parseMolecules(list:string[]):Molecule[]
	{
		if (!list) return null;
		let mols:Molecule[] = [];
		for (let molstr of list)
		{
			let mol = Molecule.fromString(molstr);
			if (MolUtil.notBlank(mol)) mols.push(mol);
		}
		return mols;
	}

	// conversion of appropriate datatypes into molecule-encoded strings
	private static formatIntegers(list:number[]):string
	{
		if (Vec.isBlank(list)) return null;
		let str = '';
		for (let n = 0; n < list.length; n++)
		{
			if (n > 0) str += ',';
			str += list[n];
		}
		return str;
	}
	private static formatStrings(list:string[]):string
	{
		if (Vec.isBlank(list)) return null;
		let str = '';
		for (let n = 0; n < list.length; n++)
		{
			if (n > 0) str += ',';
			str += list[n];
		}
		return str;
	}
	private static formatBoolean(value:boolean):string
	{
		return value ? 'yes' : 'no';
	}
	private static formatMolecules(mols:Molecule[]):string[]
	{
		if (Vec.isBlank(mols)) return null;
		let list:string[] = [];
		for (let mol of mols) if (MolUtil.notBlank(mol)) list.push(mol.toString());
		return list;
	}
}

