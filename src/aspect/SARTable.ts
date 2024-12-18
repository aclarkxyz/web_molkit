/*
	WebMolKit

	(c) 2010-2018 Molecular Materials Informatics, Inc.

	All rights reserved

	http://molmatinf.com

	[PKG=webmolkit]
*/

import {DataSheet, DataSheetColumn} from '../data/DataSheet';
import {Molecule} from '../data/Molecule';
import {MoleculeStream} from '../data/MoleculeStream';
import {MolUtil} from '../data/MolUtil';
import {OutlineMeasurement} from '../gfx/ArrangeMeasurement';
import {ArrangeMolecule} from '../gfx/ArrangeMolecule';
import {DrawMolecule} from '../gfx/DrawMolecule';
import {MetaVector} from '../gfx/MetaVector';
import {RenderEffects, RenderPolicy} from '../gfx/Rendering';
import {Vec} from '../util/Vec';
import {Aspect, AspectGraphicRendering} from './Aspect';
import {registerAspect} from './AspectList';

/*
	SAR Table: provides scaffold/substituent/molecule equivalence based on fragment placeholders (R-groups).

	Note that the aspect also includes the concept of "fields", with predefined units and ranges and rendering information. This
	was put to good effect in the eponymous mobile app, but is now deprecated: these information are stored as a pass-through for
	compatibility purposes.
*/

// description of the overall structure of the aspect
interface SARTableFields
{
	// column names for underlying content
	construct:string; // molecule
	locked:string; // boolean
	scaffold:string; // molecule
	substituents:string[]; // molecule

	// additional configuration lines from the header, implemented as a passthrough: stored for compatibility, but not used anymore
	metadata:string[];
}

// a single entry, in a workable form
interface SARTableEntry
{
	construct:Molecule;
	locked:boolean;
	scaffold:Molecule;
	substNames:string[];
	substituents:Molecule[];
}

export class SARTable extends Aspect
{
	public static CODE = 'org.mmi.aspect.SARTable';
	public static NAME = 'SAR Table';

	private static DESCR_CONSTRUCT = 'Structure of constructed molecule';
	private static DESCR_LOCKED = 'Whether constructed molecule should be rebuilt';
	private static DESCR_SCAFFOLD = 'Decorated core scaffold of molecule';
	private static DESCR_SUBSTITUENT = 'Substituent fragment to be attached to scaffold';

	// indices that can be used to request specific graphics
	public static RENDER_CONSTRUCT = 0;
	public static RENDER_SCAFFOLD = 1;
	public static RENDER_SUBSTITUENT = 2; // (and beyond)

	// ----------------- public methods -----------------

	// used to test if a datasheet has the appropriate metadata flagging it as a feedstock-containing datasheet
	public static isSARTable(ds:DataSheet):boolean
	{
		for (let n = 0; n < ds.numExtensions; n++) if (ds.getExtType(n) == SARTable.CODE) return true;
		return false;
	}

	constructor(ds?:DataSheet, allowModify?:boolean)
	{
		super(SARTable.CODE, ds, allowModify);
		this.setup();
	}

	// data access
	public getFields():SARTableFields
	{
		for (let n = 0; n < this.ds.numExtensions; n++) if (this.ds.getExtType(n) == SARTable.CODE) return this.parseMetaData(this.ds.getExtData(n));
		return null;
	}
	public setFields(fields:SARTableFields):void
	{
		let content = this.formatMetaData(fields);
		for (let n = 0; n < this.ds.numExtensions; n++) if (this.ds.getExtType(n) == SARTable.CODE)
		{
			this.ds.setExtData(n, content);
			return;
		}
		this.ds.appendExtension(SARTable.NAME, SARTable.CODE, content);
	}
	public getEntry(row:number):SARTableEntry
	{
		let fields = this.getFields();
		let entry:SARTableEntry =
		{
			construct: this.ds.getMolecule(row, fields.construct),
			locked: !!this.ds.getBoolean(row, fields.locked),
			scaffold: this.ds.getMolecule(row, fields.scaffold),
			substNames: [],
			substituents: []
		};
		for (let subst of fields.substituents)
		{
			entry.substNames.push(subst);
			entry.substituents.push(this.ds.getMolecule(row, subst));
		}
		return entry;
	}
	public setEntry(row:number, entry:SARTableEntry):void
	{
		let fields = this.getFields();

		let colConstruct = this.ds.findColByName(fields.construct, DataSheetColumn.Molecule);
		if (colConstruct >= 0) this.ds.setMolecule(row, colConstruct, entry.construct);

		let colLocked = this.ds.findColByName(fields.locked, DataSheetColumn.Boolean);
		if (colLocked >= 0) this.ds.setBoolean(row, colLocked, entry.locked);

		let colScaffold = this.ds.findColByName(fields.scaffold, DataSheetColumn.Molecule);
		if (colScaffold >= 0) this.ds.setMolecule(row, colScaffold, entry.scaffold);

		for (let n = 0; n < fields.substituents.length; n++)
		{
			let colSubst = this.ds.findColByName(fields.substituents[n], DataSheetColumn.Molecule);
			if (colSubst >= 0) this.ds.setMolecule(row, colSubst, entry.substituents[n]);
		}
	}

	// goes through the list of substituent names, and makes sure that each of them is referred to in the extensions, and also that the
	// underlying column exists
	public createSubstituents(tobeAdded:string[]):void
	{
		if (tobeAdded.length == 0) return;

		let fields = this.getFields();
		let modified = false;
		for (let name of tobeAdded) if (fields.substituents.indexOf(name) < 0)
		{
			fields.substituents.push(name);
			this.ds.ensureColumn(name, DataSheetColumn.Molecule, SARTable.DESCR_SUBSTITUENT);
			modified = true;
		}
		if (modified) this.setFields(fields);
	}

	// general purpose: returns true if an atom is considered to be an attachment placeholder
	public static isAttachment(mol:Molecule, atom:number):boolean
	{
		return mol.atomicNumber(atom) == 0 && !MolUtil.hasAbbrev(mol, atom) && mol.atomAdjCount(atom) == 1;
	}

	// ----------------- private methods -----------------

	// workhorse for the constructor
	private setup():void
	{
		this.parseAndCorrect();
	}

	// assuming that the underlying datasheet definitely is a datasheet, makes any necessary corrections to force it into compliance
	private parseAndCorrect():void
	{
		let fields:SARTableFields =
		{
			construct: 'Molecule',
			locked: 'Molecule_locked',
			scaffold: 'Scaffold',
			substituents: [],
			metadata: []
		};

		let got = false;
		for (let n = 0; n < this.ds.numExtensions; n++) if (this.ds.getExtType(n) == SARTable.CODE)
		{
			fields = this.parseMetaData(this.ds.getExtData(n));
			got = true;
			break;
		}

		this.ds.ensureColumn(fields.construct, DataSheetColumn.Molecule, SARTable.DESCR_CONSTRUCT);
		this.ds.ensureColumn(fields.locked, DataSheetColumn.Boolean, SARTable.DESCR_LOCKED);
		this.ds.ensureColumn(fields.scaffold, DataSheetColumn.Molecule, SARTable.DESCR_SCAFFOLD);
		for (let subst of fields.substituents) this.ds.ensureColumn(subst, DataSheetColumn.Molecule, SARTable.DESCR_SUBSTITUENT);

		if (!got)
		{
			let content = this.formatMetaData(fields);
			this.ds.appendExtension(SARTable.NAME, SARTable.CODE, content);
		}
	}

	// interprets the string metadata from the extensions
	private parseMetaData(content:string):SARTableFields
	{
		let fields:SARTableFields = {construct: null, locked: null, scaffold: null, substituents: [], metadata: []};

		for (let line of content.split(/\r?\n/))
		{
			let pos = line.indexOf('=');
			if (pos < 0) continue;
			let key = line.substring(0, pos), val = line.substring(pos + 1);
			if (key == 'field')
			{
				let bits = val.split(',');
				if (bits.length >= 3)
				{
					let type = bits[0], name = MoleculeStream.skUnescape(bits[1]);
					if (type == 'construct')
					{
						fields.construct = name;
						fields.locked = name + '_locked';
						continue;
					}
					else if (type == 'scaffold') {fields.scaffold = name; continue;}
					else if (type == 'substituent') {fields.substituents.push(name); continue;}
				}
			}
			fields.metadata.push(line);
		}

		return fields;
	}

	// deserialises the header metadata
	private formatMetaData(fields:SARTableFields):string
	{
		let content = '';
		content += 'field=construct,' + MoleculeStream.skEscape(fields.construct) + ',\n';
		content += 'field=scaffold,' + MoleculeStream.skEscape(fields.scaffold) + ',\n';
		for (let subst of fields.substituents) content += 'field=substituent,' + MoleculeStream.skEscape(subst) + ',\n';
		for (let meta of fields.metadata) content += meta + '\n';
		return content;
	}

	// ------------------ aspect implementation --------------------

	public plainHeading():string {return SARTable.NAME;}

	public isColumnReserved(colName:string):boolean
	{
		return this.areColumnsReserved([colName])[0];
	}

	public areColumnsReserved(colNames:string[]):boolean[]
	{
		let fields = this.getFields();
		let used = new Set<string>();
		used.add(fields.construct);
		used.add(fields.locked);
		used.add(fields.scaffold);
		for (let subst of fields.substituents) used.add(subst);

		let reserved = Vec.booleanArray(false, colNames.length);
		for (let n = 0; n < colNames.length; n++) reserved[n] = used.has(colNames[n]);
		return reserved;
	}

	public numGraphicRenderings(row:number):number
	{
		let fields = this.getFields();
		return 2 + fields.substituents.length;
	}
	public produceGraphicRendering(row:number, idx:number, policy:RenderPolicy):AspectGraphicRendering
	{
		let fields = this.getFields(), ds = this.ds;

		if (idx == SARTable.RENDER_CONSTRUCT)
		{
			let mol = ds.getMolecule(row, fields.construct);
			let metavec = new MetaVector();

			if (MolUtil.notBlank(mol))
			{
				let effects = new RenderEffects();

				// recolour the core scaffold, and add boundary notation
				for (let n = 1; n <= mol.numAtoms; n++) if (mol.atomMapNum(n) > 0) effects.colAtom[n] = 0x096E6F;
				for (let n = 1; n <= mol.numBonds; n++)
				{
					let m1 = mol.atomMapNum(mol.bondFrom(n)), m2 = mol.atomMapNum(mol.bondTo(n));
					if (m1 > 0 && m2 > 0) effects.colBond[n] = 0x096E6F;
					else if (m1 > 0 || m2 > 0) effects.dottedBondCross[n] = 0x606060;
				}

				let measure = new OutlineMeasurement(0, 0, policy.data.pointScale);
				let layout = new ArrangeMolecule(mol, measure, policy, effects);
				layout.arrange();

				new DrawMolecule(layout, metavec).draw();
			}
			else metavec.drawText(0, 0, '?', 15, 0x000000);

			metavec.normalise();
			return {name: fields.construct, metavec: metavec};
		}
		else if (idx == SARTable.RENDER_SCAFFOLD)
		{
			let mol = ds.getMolecule(row, fields.scaffold);
			let metavec = new MetaVector();

			if (MolUtil.notBlank(mol))
			{
				let effects = new RenderEffects();

				// decorate substituents: different display depending on whether matching substituents are available
				for (let n = 1; n <= mol.numAtoms; n++) if (SARTable.isAttachment(mol, n))
				{
					let isDefined = false;
					let el = mol.atomElement(n);
					outer: for (let colName of fields.substituents)
					{
						let subst = ds.getMolecule(row, colName);
						if (subst != null) for (let i = 1; i <= subst.numAtoms; i++)
							if (subst.atomElement(i) == el || (subst.atomElement(i) == 'R' && el == colName))
						{
							isDefined = true;
							break outer;
						}
					}
					effects.colAtom[n] = isDefined ? 0x096E6F : 0xFF0000;
					effects.dottedRectOutline[n] = isDefined ? 0x808080 : 0xFF0000;
				}

				let measure = new OutlineMeasurement(0, 0, policy.data.pointScale);
				let layout = new ArrangeMolecule(mol, measure, policy, effects);
				layout.arrange();

				new DrawMolecule(layout, metavec).draw();
			}
			else metavec.drawText(0, 0, '?', 15, 0x000000);

			metavec.normalise();
			return {name: fields.scaffold, metavec: metavec};
		}
		else if (idx >= SARTable.RENDER_SUBSTITUENT && idx < SARTable.RENDER_SUBSTITUENT + fields.substituents.length)
		{
			let sidx = idx - SARTable.RENDER_SUBSTITUENT, sname = fields.substituents[sidx];
			let mol = ds.getMolecule(row, sname);
			let metavec = new MetaVector();

			if (MolUtil.notBlank(mol))
			{
				let effects = new RenderEffects();

				// decorated substituents
				for (let n = 1; n <= mol.numAtoms; n++) if (SARTable.isAttachment(mol, n))
				{
					effects.colAtom[n] = 0x096E6F;
					effects.dottedRectOutline[n] = 0x808080;
					// (different colours if the attachments don't line up? or just leave it?)
				}

				let measure = new OutlineMeasurement(0, 0, policy.data.pointScale);
				let layout = new ArrangeMolecule(mol, measure, policy, effects);
				layout.arrange();

				new DrawMolecule(layout, metavec).draw();
			}
			else
			{
				// empty substituents get decorated in some way, depending on whether absence is justified
				let txt = '?';
				let scaff = ds.getMolecule(row, fields.scaffold);
				if (MolUtil.notBlank(scaff))
				{
					txt = 'n/a';
					for (let n = 1; n <= scaff.numAtoms; n++) if (scaff.atomElement(n) == sname) {txt = '?'; break;}
					if (txt == '?') for (let n = 0; n < fields.substituents.length; n++) if (n != sidx)
					{
						let subst = ds.getMolecule(row, fields.substituents[n]);
						if (MolUtil.notBlank(subst))
						{
							for (let i = 1; i <= subst.numAtoms; i++) if (subst.atomElement(i) == sname) {txt = 'n/a'; break;} // multidentate
						}
					}
				}
				metavec.drawText(0, 0, txt, 15, 0x000000);
			}

			metavec.normalise();
			return {name: sname, metavec: metavec};
		}

		return null;
	}
}

registerAspect(SARTable);

