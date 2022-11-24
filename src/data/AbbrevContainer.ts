/*
	WebMolKit

	(c) 2010-2020 Molecular Materials Informatics, Inc.

	All rights reserved

	http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

export const TEMPLATE_FILES =
[
	'rings',
	'termgrp',
	'funcgrp',
	'protgrp',
	'nonplrings',
	'largerings',
	'crownethers',
	'ligmonodent',
	'ligbident',
	'ligtrident',
	'ligmultident',
	'cagecmplx',
	'aminoacids',
	'biomolecules',
	'saccharides'
];

/*
	Abbreviation container: a singleton list of inline abbreviations which are initially bootstrapped from the available templates.
*/

export interface AbbrevContainerFrag
{
	name:string;
	frag:Molecule;
	nameHTML:string; // label in HTML format, with sub & superscripts
	nameSearch:string; // label in lower case with formatting characters stripped
}

export class AbbrevContainer
{
	public static main:AbbrevContainer = null;

	private abbrevs:AbbrevContainerFrag[] = [];

	// ----------------- static methods -----------------

	// needs to be called once per lifecycle, in order to ensure that the necessary resources are loaded
	public static needsSetup() {return !this.main;}
	public static async setupData()
	{
		if (this.main) return;

		if (!Theme.RESOURCE_URL) throw ('RPC resource URL not defined.');

		this.main = new AbbrevContainer();

		for (let tfn of TEMPLATE_FILES)
		{
			let url = Theme.RESOURCE_URL + '/data/templates/' + tfn + '.ds';
			let dsstr = await readTextURL(url);
			let ds = DataSheetStream.readXML(dsstr);

			let colMol = ds.firstColOfType(DataSheetColumn.Molecule), colAbbrev = ds.findColByName('Abbrev', DataSheetColumn.String);
			if (colMol < 0 || colAbbrev < 0) continue;
			for (let n = 0; n < ds.numRows; n++)
			{
				let frag = ds.getMoleculeClone(n, colMol), name = ds.getString(n, colAbbrev);
				if (!frag || !name) continue;

				let attcount = 0, firstConn = 0;
				for (let i = 1; i <= frag.numAtoms; i++) if (frag.atomElement(i) == MolUtil.TEMPLATE_ATTACHMENT)
				{
					if (firstConn == 0) firstConn = i;
					frag.setAtomElement(i, MolUtil.ABBREV_ATTACHMENT);
					attcount++;
				}
				if (attcount != 1) continue; // (don't want abbreviations with two attachment points; they are sort of valid, but not appropriate for here)
				if (firstConn > 1) frag.swapAtoms(1, firstConn);
				this.main.submitAbbreviation(name, frag);
			}

		}
	}

	// returns a shallow copy of the abbreviations (because the original list can grow in the meanwhile)
	public getAbbrevs():AbbrevContainerFrag[]
	{
		return this.abbrevs.slice(0);
	}

	// adds an abbreviation explicitly to the collection, if not there already; returns control immediately (background thread)
	public submitAbbreviation(name:string, infrag:Molecule, promote:boolean = false):void
	{
		let frag = infrag.clone();
		this.submitFragment(name, frag, promote);
	}

	// pulls apart the contents of a molecule, looking for abbreviations; anything that is new gets added to the background; this function returns control immediately
	public submitMolecule(inmol:Molecule, promote:boolean = false):void
	{
		let mol = inmol.clone();
		for (let n = 1; n <= mol.numAtoms; n++)
		{
			let frag = MolUtil.getAbbrev(mol, n);
			if (!frag) continue;
			this.submitFragment(mol.atomElement(n), frag, promote);
		}
	}

	// given that an atom has been turned into an abbreviation, searches through the list to see if the fragment structure matches anything; if so, borrows the name
	// and modifies the molecule accordingly
	public substituteAbbrevName(mol:Molecule, atom:number):boolean
	{
		let frag = MolUtil.getAbbrev(mol, atom);
		if (!frag) return false;

		let fragExp = MolUtil.expandedAbbrevs(frag);
		let fragMF = MolUtil.molecularFormula(fragExp);
		let fragFP = CircularFingerprints.create(MetaMolecule.createStrictRubric(fragExp), CircularFingerprints.CLASS_ECFP6).getUniqueHashes();

		for (let abbrev of this.abbrevs) if (abbrev.frag.numAtoms == frag.numAtoms)
		{
			let match = CoordUtil.sketchEquivalent(frag, abbrev.frag);
			if (!match)
			{
				let afragExp = MolUtil.expandedAbbrevs(abbrev.frag);
				if (fragMF == MolUtil.molecularFormula(afragExp))
				{
					let afragFP = CircularFingerprints.create(MetaMolecule.createStrictRubric(afragExp), CircularFingerprints.CLASS_ECFP6).getUniqueHashes();
					if (Vec.equals(fragFP, afragFP)) match = true;
				}
			}
			if (match)
			{
				mol.setAtomElement(atom, abbrev.name);
				return true;
			}
		}

		return false;
	}

	// ----------------- private methods -----------------

	// considers the abbrevation for inclusion in the list; it is assumed that this is being called in a background thread, and also that 'frag' has already been
	// copied and is safely owned by this instance
	private submitFragment(name:string, frag:Molecule, promote:boolean):void
	{
		if (name == '?') return; // no thanks!

		// rotate the fragment so that the attachment (atom 1) is oriented "west"
		let vx = 0, vy = 0;
		let adj = frag.atomAdjList(1);
		for (let a of adj)
		{
			vx += frag.atomX(a) - frag.atomX(1);
			vy += frag.atomY(a) - frag.atomY(1);
		}
		if (adj.length > 1) {let inv = 1.0 / adj.length; vx *= inv; vy *= inv;}
		if (norm_xy(vx, vy) > 0.1 * 0.1)
		{
			let theta = Math.atan2(vy, vx);
			if (Math.abs(theta) > 2 * DEGRAD) CoordUtil.rotateMolecule(frag, -theta);
		}

		let hit = -1;
		for (let n = 0; n < this.abbrevs.length; n++)
		{
			let a = this.abbrevs[n];
			if (a.name != name) continue;
			// Q: what to do if same name but different thing? esp. if just a different orientation...
			//if a.frag.compareTo(frag) == 0 || CoordUtil.sketchMappable(mol1:frag, mol2:a.frag) {hit = n; break}
			hit = n;
			break;
		}

		let [html, search] = this.formatAbbrevLabel(name);
		let abv:AbbrevContainerFrag = {name, frag, nameHTML: html, nameSearch: search};
		if (hit < 0)
		{
			if (promote) this.abbrevs.unshift(abv); else this.abbrevs.push(abv);
		}
		else
		{
			if (promote && hit > 0)
			{
				this.abbrevs.splice(hit, 1);
				this.abbrevs.unshift(abv);
			}
			else this.abbrevs[hit] = abv;
		}
	}

	// prepare the HTML & searchable forms of an abbreviation label
	private formatAbbrevLabel(name:string):[string, string]
	{
		let html = '', search = '';

		let append = (bit:string, tag:string):void =>
		{
			if (tag) html += '<' + tag + '>';
			html += escapeHTML(bit);
			search += bit;
			if (tag) html += '</' + tag + '>';
		};

		for (let bit of name.split('|'))
		{
			while (true)
			{
				let match = bit.match(/^(.*?)\{(.*?)\}(.*)$/);
				if (!match) break;
				let pre = match[1], mid = match[2], post = match[3];
				append(pre, null);
				if (mid.startsWith('^')) append(mid.substring(1), 'sup'); else append(mid, 'sub');
				bit = post;
			}
			append(bit, null);
		}

		return [html, search.toLowerCase()];
	}
}

/* EOF */ }