/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../util/util.ts'/>
///<reference path='../data/DataSheet.ts'/>
///<reference path='../data/MoleculeStream.ts'/>

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

class SARTable extends Aspect
{
	public static CODE = 'org.mmi.aspect.SARTable';
	public static NAME = 'SAR Table';

	private static DESCR_CONSTRUCT = 'Structure of constructed molecule';
	private static DESCR_LOCKED = 'Whether constructed molecule should be rebuilt';
	private static DESCR_SCAFFOLD = 'Decorated core scaffold of molecule';
	private static DESCR_SUBSTITUENT = 'Substituent fragment to be attached to scaffold';

	// ----------------- public methods -----------------

	// used to test if a datasheet has the appropriate metadata flagging it as a feedstock-containing datasheet
	public static isSARTable(ds:DataSheet):boolean
	{
		for (let n = 0; n < ds.numExtensions; n++) if (ds.getExtType(n) == SARTable.CODE) return true;
		return false;
	}

	constructor(ds?:DataSheet, allowModify?:boolean)
	{
		super(ds, allowModify);
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
			'construct': this.ds.getMolecule(row, fields.construct), 
			'locked': !!this.ds.getBoolean(row, fields.locked),
			'scaffold': this.ds.getMolecule(row, fields.scaffold), 
			'substNames': [], 
			'substituents': []
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
		
		let colConstruct = this.ds.findColByName(fields.construct, DataSheet.COLTYPE_MOLECULE);
		if (colConstruct >= 0) this.ds.setMolecule(row, colConstruct, entry.construct); 

		let colLocked = this.ds.findColByName(fields.locked, DataSheet.COLTYPE_BOOLEAN);
		if (colLocked >= 0) this.ds.setBoolean(row, colLocked, entry.locked);

		let colScaffold = this.ds.findColByName(fields.scaffold, DataSheet.COLTYPE_MOLECULE);
		if (colScaffold >= 0) this.ds.setMolecule(row, colScaffold, entry.scaffold); 
		 
		for (let n = 0; n < fields.substituents.length; n++)
		{
			let colSubst = this.ds.findColByName(fields.substituents[n], DataSheet.COLTYPE_MOLECULE)
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
			this.ds.ensureColumn(name, DataSheet.COLTYPE_MOLECULE, SARTable.DESCR_SUBSTITUENT);
			modified = true;
		}
		if (modified) this.setFields(fields);
	}

	// ----------------- private methods -----------------

	// workhorse for the constructor 
	private setup():void  
	{
		//this.parseAndCorrect();
	}

    // assuming that the underlying datasheet definitely is a datasheet, makes any necessary corrections to force it into compliance
	private parseAndCorrect():void
    {
		let fields:SARTableFields =
		{
			'construct': 'Molecule',
			'locked': 'Molecule_locked',
			'scaffold': 'Scaffold',
			'substituents': [],
			'metadata': []
		};

		let got = false;
		for (let n = 0; n < this.ds.numExtensions; n++) if (this.ds.getExtType(n) == SARTable.CODE)
		{
			fields = this.parseMetaData(this.ds.getExtData(n));
			got = true;
			break;
		}

		this.ds.ensureColumn(fields.construct, DataSheet.COLTYPE_MOLECULE, SARTable.DESCR_CONSTRUCT);
		this.ds.ensureColumn(fields.locked, DataSheet.COLTYPE_BOOLEAN, SARTable.DESCR_LOCKED);
		this.ds.ensureColumn(fields.scaffold, DataSheet.COLTYPE_MOLECULE, SARTable.DESCR_SCAFFOLD);
		for (let subst of fields.substituents) this.ds.ensureColumn(subst, DataSheet.COLTYPE_MOLECULE, SARTable.DESCR_SUBSTITUENT);

		if (!got)
		{
			let content = this.formatMetaData(fields);
			this.ds.appendExtension(SARTable.NAME, SARTable.CODE, content);
		}
    }
	
    // interprets the string metadata from the extensions
	private parseMetaData(content:string):SARTableFields
    {
		let fields:SARTableFields = {'construct': null, 'locked': null, 'scaffold': null, 'substituents':[], metadata: []};
	
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
					let type = bits[0], name = MoleculeStream.sk_unescape(bits[1]);
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
			fields.metadata.push(line)
		}
		
		return fields;
    }

    // deserialises the header metadata
	private formatMetaData(fields:SARTableFields):string
	{
		let content = '';
		content += 'field=construct,' + MoleculeStream.sk_escape(fields.construct) + ',\n';
		content += 'field=scaffold,' + MoleculeStream.sk_escape(fields.scaffold) + ',\n';
		for (let subst of fields.substituents) content += 'field=substituent,' + MoleculeStream.sk_escape(subst) + ',\n';
		for (let meta of fields.metadata) content += meta + '\n';
		return content;
    }

    // ------------------ aspect implementation --------------------

	public plainHeading():string {return SARTable.NAME;}
	
	public isColumnReserved(colName:string):boolean 
	{
		return this.areColumnsReserved([colName])[0];
	}
	
	/*public areColumnsReserved(colNames:string[]):boolean[]
	{
		let fields = getFields(ds:ds)
		var used = Set<String>([fields.construct, fields.locked, fields.scaffold])
		for subst in fields.substituents {used.insert(subst)}

		var reserved = boolArray(false, colNames.count)
		for n in 0 ..< colNames.count {reserved[n] = used.contains(colNames[n])}
		return reserved
	}*/
	

	/*public numTextRenderings(row:number):number {return 0;}
	public produceTextRendering(row:number, idx:number):AspectTextRendering {return null;}
	
	public numGraphicRenderings(row:number):number {return 0;}
	public produceGraphicRendering(row:number, idx:number, policy:RenderPolicy):MetaVector {return null;}
	
	public numHeaderRenderings():number {return 0;}
	public produceHeaderRendering(idx:number):AspectTextRendering {return null;}*/	


	
	/*open override func numGraphicRenderings(row:Int) -> Int
	{
		var numSubst = 0
		data.observe() {(ds:DataSheet) in numSubst = self.getFields(ds:ds).substituents.count}
		return 2 + numSubst
	}
	open override func produceGraphicRendering(row:Int, idx:Int, policy:RenderPolicy, vg:VectorGfxBuilder) -> (name:String, vg:VectorGfxBuilder)
	{
		var retName = "", retVG = vg
		data.observe() {(ds:DataSheet) in (retName, retVG) = self.produceGraphicRendering(row:row, idx:idx, policy:policy, vg:vg, ds:ds)}
		return (name:retName, vg:retVG)
	}
	open override func produceGraphicRendering(row:Int, idx:Int, policy:RenderPolicy, vg:VectorGfxBuilder, ds:DataSheet) -> (name:String, vg:VectorGfxBuilder)
	{
		let fields = getFields(ds:ds)
	
		if idx == Render.Construct
		{
			let mol:Molecule! = ds.getMoleculeWeak(row:row, colName:fields.construct)
			if mol != nil && mol.numAtoms > 0
			{
				let effects = RenderEffects()
				
				// recolour the core scaffold, and add boundary notation
				for n in stride(from:1, through:mol.numAtoms, by:1) where mol.atomMapNum(n) > 0 {effects.colAtom[n] = 0x096E6F}
				for n in stride(from:1, through:mol.numBonds, by:1)
				{
					let m1 = mol.atomMapNum(mol.bondFrom(n)), m2 = mol.atomMapNum(mol.bondTo(n))
					if m1 > 0 && m2 > 0 {effects.colBond[n] = 0x096E6F}
					else if m1 > 0 || m2 > 0 {effects.dottedBondCross[n] = 0x606060}
				}
				
				let measure = OutlineMeasurement(scale:policy.pointScale, yUp:false)
				let layout = ArrangeMolecule(mol:mol, measure:measure, policy:policy, effects:effects)
				layout.fastPlacement = true
				layout.arrange()
				DrawMolecule(layout:layout, vg:vg).draw()
			}
			else {vg.drawText(x:0, y:0, txt:"?", sz:15, colour:0x000000, align:0)}
			
			return (name:fields.construct, vg:vg)
		}
		else if idx == Render.Scaffold
		{
			let mol:Molecule! = ds.getMoleculeWeak(row:row, colName:fields.scaffold)
			if mol != nil && mol.numAtoms > 0
			{
				let effects = RenderEffects()

				// decorate substituents: different display depending on whether matching substituents are available
				for n in stride(from:1, to:mol.numAtoms, by:1) where Scaffolding.isAttachment(mol, atom:n)
				{
					var isDefined = false
					let el = mol.atomElement(n)
					outer: for colName in fields.substituents {if let subst = ds.getMoleculeWeak(row:row, colName:colName)
					{
						for i in stride(from:1, through:subst.numAtoms, by:1) where subst.atomElement(i) == el || (subst.atomElement(i) == "R" && el == colName)
						{
							isDefined = true
							break outer
						}
					}}
					effects.colAtom[n] = isDefined ? 0x096E6F : 0xFF0000
					effects.dottedRectOutline[n] = isDefined ? 0x808080 : 0xFF0000
				}
				
				let measure = OutlineMeasurement(scale:policy.pointScale, yUp:false)
				let layout = ArrangeMolecule(mol:mol, measure:measure, policy:policy, effects:effects)
				layout.fastPlacement = true
				layout.arrange()
				DrawMolecule(layout:layout, vg:vg).draw()
			}
			else {vg.drawText(x:0, y:0, txt:"?", sz:15, colour:0x000000, align:0)}
			
			return (name:fields.construct, vg:vg)
		}
		else if idx >= Render.Substituent && idx < Render.Substituent + fields.substituents.count
		{
			let sidx = idx - Render.Substituent
			let mol:Molecule! = ds.getMoleculeWeak(row:row, colName:fields.substituents[sidx])
			if mol != nil && mol.numAtoms > 0
			{
				let effects = RenderEffects()
				
				// decorated substituents
				for n in stride(from:1, to:mol.numAtoms, by:1) where Scaffolding.isAttachment(mol, atom:n)
				{
					effects.colAtom[n] = 0x096E6F
					effects.dottedRectOutline[n] = 0x808080
					// (different colours if the attachments don't line up? or just leave it?)
				}
				
				let measure = OutlineMeasurement(scale:policy.pointScale, yUp:false)
				let layout = ArrangeMolecule(mol:mol, measure:measure, policy:policy, effects:effects)
				layout.fastPlacement = true
				layout.arrange()
				DrawMolecule(layout:layout, vg:vg).draw()
			}
			else
			{
				// empty substituents get decorated in some way, depending on whether absence is justified
				var txt = "?"
				let scaff:Molecule! = ds.getMoleculeWeak(row:row, colName:fields.scaffold)
				if scaff != nil && scaff.numAtoms > 0
				{
					let sname = fields.substituents[sidx]
					txt = "n/a"
					for n in stride(from:1, through:scaff.numAtoms, by:1) where scaff.atomElement(n) == sname {txt = "?"; break}
					if txt == "?" {for n in 0 ..< fields.substituents.count where n != sidx
					{
						if let subst = ds.getMoleculeWeak(row:row, colName:fields.substituents[n])
						{
							for i in stride(from:1, through:subst.numAtoms, by:1) where subst.atomElement(i) == sname {txt = "n/a"; break} // multidentate
						}
					}}
				}
				vg.drawText(x:0, y:0, txt:txt, sz:15, colour:0x000000, align:0)
			}
		}
		return (name:"", vg:vg)
	}*/
}
