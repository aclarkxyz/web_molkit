/*
	WebMolKit

	(c) 2010-2022 Molecular Materials Informatics, Inc.

	All rights reserved

	http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	Encodes some number of stereochemistry groups into the molecule.

	Types:
		Racemic ("AND"): for chiral centres in the group, the configuration indicated by the wedges is present _and_ its
						 inverted racemic opposite is inverted as well (e.g. [R,R,S] & [S,S,R], but not any of the other
						 six combinations)
		Relative ("OR"): for chiral centres in the group, there is just one configuration present, and it is either the
						 configuration indicated _or_ its inversion (e.g. just one of [R,R,S] or [S,S,R])

	Any tools that ignore this stereo group metadata will just see that there's a particular configuration indicated and
	interpret that as what it is.
*/

export const STEREOGROUP_EXTRA_RACEMIC = "xCHIRAC:"; // racemic (often rendered as "and")
export const STEREOGROUP_EXTRA_RELATIVE = "xCHIREL:"; // relative (often rendered as "or")

export class StereoGroup
{
	private chiRac = new Map<number, number[]>();
	private chiRel = new Map<number, number[]>();

	// ------------ public methods ------------

	// useful pre-check to see if a molecule has any stereogroup metadata
	public static hasStereoGroups(mol:Molecule):boolean
	{
		for (let n = 1; n <= mol.numAtoms; n++)
		{
			let extra = mol.atomExtra(n);
			if (extra != null) for (let str of extra) if (str.startsWith(STEREOGROUP_EXTRA_RACEMIC) || str.startsWith(STEREOGROUP_EXTRA_RELATIVE)) return true;
		}
		return false;
	}

	public constructor(private mol:Molecule)
	{
		this.mol = mol;

		// pull out the raw content from the molecule's extra fields
		for (let n = 1; n <= mol.numAtoms; n++)
		{
			let extra = mol.atomExtra(n);
			if (extra != null) for (let str of extra)
			{
				if (str.startsWith(STEREOGROUP_EXTRA_RACEMIC))
				{
					let grp = parseInt(str.substring(STEREOGROUP_EXTRA_RACEMIC.length));
					if (grp > 0) this.chiRac.set(grp, Vec.append(this.chiRac.get(grp), n));
				}
				else if (str.startsWith(STEREOGROUP_EXTRA_RELATIVE))
				{
					let grp = parseInt(str.substring(STEREOGROUP_EXTRA_RELATIVE.length));
					if (grp > 0) this.chiRel.set(grp, Vec.append(this.chiRel.get(grp), n));
				}
			}
		}

		// clean each one up, or remove if invalid
		for (let [grp, atoms] of this.chiRac.entries())
		{
			for (let n = atoms.length - 1; n>= 0; n--) if (!this.atomHasWedge(atoms[n])) atoms.splice(n, 1);
			if (atoms.length > 0) this.chiRac.set(grp, atoms); else this.chiRac.delete(grp);
		}
		for (let [grp, atoms] of this.chiRel.entries())
		{
			for (let n = atoms.length - 1; n>= 0; n--) if (!this.atomHasWedge(atoms[n])) atoms.splice(n, 1);
			if (atoms.length > 0) this.chiRel.set(grp, atoms); else this.chiRel.delete(grp);
		}
	}

	// access to resulting content
	public getRacemicGroups():number[] {return Array.from(this.chiRac.keys());}
	public getRelativeGroups():number[] {return Array.from(this.chiRel.keys());}
	public getRacemicAtoms():number[][] {return Array.from(this.chiRac.values());}
	public getRelativeAtoms():number[][] {return Array.from(this.chiRel.values());}
	public getRacemicGroupAtoms(grp:number):number[] {return this.chiRac.get(grp);}
	public getRelativeGroupAtoms(grp:number):number[] {return this.chiRel.get(grp);}

	// replaces all artifact signifiers with those from the current list of content
	public rewriteMolecule():void
	{
		// delete everything
		for (let n = 1; n <= this.mol.numAtoms; n++)
		{
			let extra = this.mol.atomExtra(n);
			let modified = false;
			for (let i = extra.length - 1; i >= 0; i--)
			{
				if (extra[i].startsWith(STEREOGROUP_EXTRA_RACEMIC) || extra[i].startsWith(STEREOGROUP_EXTRA_RELATIVE))
				{
					extra.slice(i, 1);
					modified = true;
				}
			}
			if (modified) this.mol.setAtomExtra(n, extra);
		}

		// write back our datastructures
		for (let [grp, atoms] of this.chiRac.entries())
		{
			for (let a of atoms) this.mol.setAtomExtra(a, [...this.mol.atomExtra(a), STEREOGROUP_EXTRA_RACEMIC + grp]);
		}
		for (let [grp, atoms] of this.chiRel.entries())
		{
			for (let a of atoms) this.mol.setAtomExtra(a, [...this.mol.atomExtra(a), STEREOGROUP_EXTRA_RELATIVE + grp]);
		}
	}

	// given the numbering system used by artifacts in another object, make sure that the current ones are renumbered so that they don't clash
	public harmoniseNumbering(other:StereoGroup):void
	{
		let groups = other.getRacemicGroups();
		let stash = this.getRacemicAtoms();
		this.chiRac.clear();
		for (let atoms of stash)
		{
			let grp = this.nextIdentifier(groups);
			this.chiRac.set(grp, atoms);
			groups.push(grp);
		}

		groups = other.getRelativeGroups();
		stash = this.getRelativeAtoms();
		this.chiRel.clear();
		for (let atoms of stash)
		{
			let grp = this.nextIdentifier(groups);
			this.chiRel.set(grp, atoms);
			groups.push(grp);
		}
	}

	// creates a racemic group, returns the new identifier
	public createRacemic(atoms:number[]):number
	{
		let grp = this.nextIdentifier(this.getRacemicGroups());
		this.chiRac.set(grp, atoms);
		return grp;
	}

	// creates a relative group, returns the new identifier
	public createRelative(atoms:number[]):number
	{
		let grp = this.nextIdentifier(this.getRelativeGroups());
		this.chiRel.set(grp, atoms);
		return grp;
	}

	public removeRacemic(grp:number):void
	{
		this.chiRac.delete(grp);
	}
	public removeRelative(grp:number):void
	{
		this.chiRel.delete(grp);
	}

	// quickly strip out all bond artifacts
	public static removeAll(mol:Molecule):void
	{
		for (let n = 1; n <= mol.numAtoms; n++)
		{
			let extra = mol.atomExtra(n);
			let modified = false;
			for (let i = extra.length - 1; i >= 0; i--)
			{
				if (!extra[i].startsWith(STEREOGROUP_EXTRA_RACEMIC) && !extra[i].startsWith(STEREOGROUP_EXTRA_RELATIVE)) continue;
				extra.splice(i, 1);
				modified = true;
			}
			if (modified) mol.setAtomExtra(n, extra);
		}
	}

	// ------------ private methods ------------

	// if false, the atom definitely can't be an R/S tetrahedral chiral centre
	private atomHasWedge(atom:number):boolean
	{
		if (this.mol.is3D()) return true;

		// must have at least one wedge originating from the atom, and no squigglies
		let hasWedge = false;
		for (let b of this.mol.atomAdjBonds(atom))
		{
			let bt = this.mol.bondType(b);
			if (bt == Molecule.BONDTYPE_UNKNOWN) return false; // squiggly
			if (this.mol.bondFrom(b) != atom) continue;
			if (bt == Molecule.BONDTYPE_INCLINED || bt == Molecule.BONDTYPE_DECLINED) hasWedge = true;
		}
		return hasWedge;
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