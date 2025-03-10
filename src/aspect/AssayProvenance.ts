/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

    [PKG=webmolkit]
*/

import {DataSheet, DataSheetColumn} from '../ds/DataSheet';
import {Molecule} from '../mol/Molecule';
import {MoleculeStream} from '../io/MoleculeStream';
import {Aspect, AspectTextRendering} from './Aspect';
import {registerAspect} from './AspectList';

/* eslint-disable @typescript-eslint/naming-convention */

/*
	AssayProvenance: informs that a datasheet originates from a distinct assay measurement of a particular
	biological target or property, and that each row represents a compound and a measurement. There is some
	latitude to the specifics of each row, but most of the information has defaults that are stored in the
	header.
*/

export class AssayProvenanceHeader
{
	public prefixes:Record<string, string> = {};
	public targetName = '';
	public targetURI = '';
	public organismName = '';
	public organismURI = '';
	public targetTypeName = '';
	public targetTypeURI = '';
	public cellName = '';
	public cellURI = '';
	public assayTypeName = '';
	public assayTypeURI = '';
	public assayDescription = '';
	public sourceName = '';
	public sourceURI = '';
	public sourceVersion = '';
	public documentName = '';
	public documentURI = '';
	public measureTypeName = '';
	public measureTypeURI = '';
	public unitNames:string[] = [];
	public unitURIs:string[] = [];
}

export class AssayProvenance extends Aspect
{
	public static CODE = 'org.mmi.aspect.AssayProvenance';
	public static NAME = 'Assay Provenance';

	public static COLNAME_MOLECULE = 'Molecule'; // molecule
	public static COLNAME_NAME = 'Name'; // string
	public static COLNAME_VALUE = 'Value'; // real
	public static COLNAME_ERROR = 'Error'; // real
	public static COLNAME_UNITS = 'Units'; // string
	public static COLNAME_RELATION = 'Relation'; // string
	public static COLNAME_SOURCEURI = 'SourceURI'; // string

	//	private static final String[] RESERVED_COLUMNS = {COLNAME_MOLECULE, COLNAME_NAME, COLNAME_VALUE, COLNAME_ERROR, COLNAME_UNITS, COLNAME_RELATION, COLNAME_SOURCEURI};

	// convenient suggestions for unit URIs
	public static URI_UNIT_M = 'http://purl.obolibrary.org/obo/UO_0000062'; // moles per litre (mol/L)
	public static URI_UNIT_mM = 'http://purl.obolibrary.org/obo/UO_0000063'; // milli-moles per litre
	public static URI_UNIT_uM = 'http://purl.obolibrary.org/obo/UO_0000064'; // micro-moles per litre
	public static URI_UNIT_nM = 'http://purl.obolibrary.org/obo/UO_0000065'; // nano-moles per litre
	public static URI_UNIT_pM = 'http://purl.obolibrary.org/obo/UO_0000066'; // pico-moles per litre
	public static URI_UNIT_logM = 'http://www.bioassayontology.org/bao#BAO_0000101'; // log10 of mol/L
	public static URI_UNIT_perM = 'http://www.bioassayontology.org/bao#BAO_0000102'; // -log10 of mol/L
	public static URI_UNIT_gL = 'http://purl.obolibrary.org/obo/UO_0000175'; // grams per litre (g/L)
	public static URI_UNIT_mgL = 'http://purl.obolibrary.org/obo/UO_0000273'; // milligrams per litre
	public static URI_UNIT_ugL = 'http://purl.obolibrary.org/obo/UO_0000275'; // micrograms per litre
	public static URI_UNIT_binary = 'http://www.bioassayontology.org/bao#BAO_0080023'; // true/false

	// ----------------- public methods -----------------

	// used to test if a datasheet has the appropriate metadata flagging it as a feedstock-containing datasheet
	public static isAssayProvenance(ds:DataSheet):boolean
	{
		for (let n = 0; n < ds.numExtensions; n++) if (ds.getExtType(n) == AssayProvenance.CODE) return true;
		return false;
	}

	constructor(ds?:DataSheet, allowModify?:boolean)
	{
		super(AssayProvenance.CODE, ds, allowModify);
		this.setup();
	}

	// data access
	public getHeader():AssayProvenanceHeader
	{
		for (let n = 0; n < this.ds.numExtensions; n++) if (this.ds.getExtType(n) == AssayProvenance.CODE)
			return this.parseMetaData(this.ds.getExtData(n));
		return null;
	}
	public setHeader(header:AssayProvenanceHeader):void
	{
		let content = this.formatMetaData(header);
		for (let n = 0; n < this.ds.numExtensions; n++) if (this.ds.getExtType(n) == AssayProvenance.CODE)
		{
			this.ds.setExtData(n, content);
			return;
		}
		this.ds.appendExtension(AssayProvenance.NAME, AssayProvenance.CODE, content);
	}

	public getMolecule(row:number):Molecule
	{
		let col = this.ds.findColByName(AssayProvenance.COLNAME_MOLECULE);
		return col < 0 ? null : this.ds.getMolecule(row, col);
	}
	public getName(row:number):string
	{
		let col = this.ds.findColByName(AssayProvenance.COLNAME_NAME);
		return col < 0 ? null : this.ds.getString(row, col);
	}
	public getValue(row:number):number
	{
		let col = this.ds.findColByName(AssayProvenance.COLNAME_VALUE);
		return col < 0 ? null : this.ds.isNull(row, col) ? Number.NaN : this.ds.getReal(row, col);
	}
	public getError(row:number):number
	{
		let col = this.ds.findColByName(AssayProvenance.COLNAME_ERROR);
		if (col < 0) return null;
		if (this.ds.isNull(row, col)) return Number.NaN;
		let err = this.ds.getReal(row, col);
		if (err <= 0) return Number.NaN;
		return err;
	}
	public getUnits(row:number):string
	{
		let col = this.ds.findColByName(AssayProvenance.COLNAME_UNITS);
		return col < 0 ? null : this.ds.getString(row, col);
	}
	public getRelation(row:number):string
	{
		let col = this.ds.findColByName(AssayProvenance.COLNAME_RELATION);
		return col < 0 ? null : this.ds.getString(row, col);
	}
	public getSourceURI(row:number):string
	{
		let col = this.ds.findColByName(AssayProvenance.COLNAME_SOURCEURI);
		return col < 0 ? null : this.ds.getString(row, col);
	}
	public setMolecule(row:number, v:Molecule):void
	{
		let col = this.ds.findColByName(AssayProvenance.COLNAME_MOLECULE);
		if (col >= 0) this.ds.setMolecule(row, col, v);
	}
	public setName(row:number, v:string):void
	{
		let col = this.ds.findColByName(AssayProvenance.COLNAME_NAME);
		if (col >= 0) this.ds.setString(row, col, v);
	}
	public setValue(row:number, v:number):void
	{
		let col = this.ds.findColByName(AssayProvenance.COLNAME_VALUE);
		if (col < 0) {}
		else if (Number.isNaN(v)) this.ds.setToNull(row, col);
		else this.ds.setReal(row, col, v);
	}
	public setError(row:number, v:number):void
	{
		let col = this.ds.findColByName(AssayProvenance.COLNAME_ERROR);
		if (col < 0) {}
		else if (Number.isNaN(v)) this.ds.setToNull(row, col);
		else this.ds.setReal(row, col, v);
	}
	public setUnits(row:number, v:string):void
	{
		let col = this.ds.findColByName(AssayProvenance.COLNAME_UNITS);
		if (col >= 0) this.ds.setString(row, col, v);
	}
	public setRelation(row:number, v:string):void
	{
		let col = this.ds.findColByName(AssayProvenance.COLNAME_RELATION);
		if (col >= 0) this.ds.setString(row, col, v);
	}
	public setSourceURI(row:number, v:string):void
	{
		let col = this.ds.findColByName(AssayProvenance.COLNAME_SOURCEURI);
		if (col >= 0) this.ds.setString(row, col, v);
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
		let header = new AssayProvenanceHeader();

		let got = false;
		for (let n = 0; n < this.ds.numExtensions; n++) if (this.ds.getExtType(n) == AssayProvenance.CODE)
		{
			header = this.parseMetaData(this.ds.getExtData(n));
			got = true;
			break;
		}

		if (this.allowModify)
		{
			this.ds.ensureColumn(AssayProvenance.COLNAME_MOLECULE, DataSheetColumn.Molecule, 'Molecular structure of compound being measured');
			this.ds.ensureColumn(AssayProvenance.COLNAME_NAME, DataSheetColumn.String, 'Name of compound');
			this.ds.ensureColumn(AssayProvenance.COLNAME_VALUE, DataSheetColumn.Real, 'Measured value');
			this.ds.ensureColumn(AssayProvenance.COLNAME_ERROR, DataSheetColumn.Real, 'Experimental error of measurement');
			this.ds.ensureColumn(AssayProvenance.COLNAME_UNITS, DataSheetColumn.String, 'Units of measurement');
			this.ds.ensureColumn(AssayProvenance.COLNAME_RELATION, DataSheetColumn.String, 'Relation: exact, greater or less');
			this.ds.ensureColumn(AssayProvenance.COLNAME_SOURCEURI, DataSheetColumn.String, 'Source identifier for activity measurement');
		}

		if (!got && this.allowModify)
		{
			let content = this.formatMetaData(header);
			this.ds.appendExtension(AssayProvenance.NAME, AssayProvenance.CODE, content);
		}
	}

	// interprets the string metadata from the extensions
	private parseMetaData(content:string):AssayProvenanceHeader
	{
		let header = new AssayProvenanceHeader();

		for (let line of content.split(/\r?\n/))
		{
			let eq = line.indexOf('=');
			if (eq < 0) continue;
			if (line.startsWith('pfx:')) header.prefixes[MoleculeStream.skUnescape(line.substring(4, eq))] = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('targetName=')) header.targetName = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('targetURI=')) header.targetURI = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('organismName=')) header.organismName = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('organismURI=')) header.organismURI = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('targetTypeName=')) header.targetTypeName = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('targetTypeURI=')) header.targetTypeURI = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('cellName=')) header.cellName = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('cellURI=')) header.cellURI = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('assayTypeName=')) header.assayTypeName = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('assayTypeURI=')) header.assayTypeURI = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('assayDescription=')) header.assayDescription = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('sourceName=')) header.sourceName = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('sourceURI=')) header.sourceURI = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('sourceVersion=')) header.sourceVersion = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('documentName=')) header.documentName = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('documentURI=')) header.documentURI = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('measureTypeName=')) header.measureTypeName = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('measureTypeURI=')) header.measureTypeURI = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('unit:'))
			{
				header.unitNames.push(MoleculeStream.skUnescape(line.substring(5, eq)));
				header.unitURIs.push(MoleculeStream.skUnescape(line.substring(eq + 1)));
			}
		}

		return header;
	}

	// deserialises the header metadata
	private formatMetaData(header:AssayProvenanceHeader):string
	{
		let content = '';

		for (let pfx in header.prefixes) content += 'pfx:' + MoleculeStream.skEscape(pfx) + '=' + MoleculeStream.skEscape(header.prefixes[pfx]) + '\n';
		content += 'targetName=' + MoleculeStream.skEscape(header.targetName) + '\n';
		content += 'targetURI=' + MoleculeStream.skEscape(header.targetURI) + '\n';
		content += 'organismName=' + MoleculeStream.skEscape(header.organismName) + '\n';
		content += 'organismURI=' + MoleculeStream.skEscape(header.organismURI) + '\n';
		content += 'targetTypeName=' + MoleculeStream.skEscape(header.targetTypeName) + '\n';
		content += 'targetTypeURI=' + MoleculeStream.skEscape(header.targetTypeURI) + '\n';
		content += 'cellName=' + MoleculeStream.skEscape(header.cellName) + '\n';
		content += 'cellURI=' + MoleculeStream.skEscape(header.cellURI) + '\n';
		content += 'assayTypeName=' + MoleculeStream.skEscape(header.assayTypeName) + '\n';
		content += 'assayTypeURI=' + MoleculeStream.skEscape(header.assayTypeURI) + '\n';
		content += 'assayDescription=' + MoleculeStream.skEscape(header.assayDescription) + '\n';
		content += 'sourceName=' + MoleculeStream.skEscape(header.sourceName) + '\n';
		content += 'sourceURI=' + MoleculeStream.skEscape(header.sourceURI) + '\n';
		content += 'sourceVersion=' + MoleculeStream.skEscape(header.sourceVersion) + '\n';
		content += 'documentName=' + MoleculeStream.skEscape(header.documentName) + '\n';
		content += 'documentURI=' + MoleculeStream.skEscape(header.documentURI) + '\n';
		content += 'measureTypeName=' + MoleculeStream.skEscape(header.measureTypeName) + '\n';
		content += 'measureTypeURI=' + MoleculeStream.skEscape(header.measureTypeURI) + '\n';
		for (let n = 0, num = Math.min(header.unitNames.length, header.unitURIs.length); n < num; n++)
			content += 'unit:' + MoleculeStream.skEscape(header.unitNames[n]) + '=' + MoleculeStream.skEscape(header.unitURIs[n]) + '\n';

		return content;
	}

	// ------------------ aspect implementation --------------------

	public plainHeading():string {return AssayProvenance.NAME;}

	public isColumnReserved(colName:string):boolean
	{
		return colName == AssayProvenance.COLNAME_VALUE || colName == AssayProvenance.COLNAME_ERROR ||
				colName == AssayProvenance.COLNAME_UNITS || colName == AssayProvenance.COLNAME_RELATION ||
				colName == AssayProvenance.COLNAME_SOURCEURI;
	}

	public numTextRenderings(row:number):number {return 2;}
	public produceTextRendering(row:number, idx:number):AspectTextRendering
	{
		let header = this.getHeader();

		if (idx == 0)
		{
			let tr:AspectTextRendering =
			{
				name: 'Activity',
				descr: 'Activity measurement details for this record',
				text: '',
				type: Aspect.TEXT_PLAIN
			};

			let val = this.getValue(row), error = this.getError(row);
			let units = this.getUnits(row), rel = this.getRelation(row);

			tr.text = '';
			if (!Number.isNaN(val))
			{
				if (rel) tr.text += rel + ' ';
				tr.text += val;
				if (!Number.isNaN(error)) tr.text += ' \u{00B1} ' + error;
				if (units) tr.text += ' ' + units;
			}
			return tr;
		}
		else if (idx == 1)
		{
			let tr:AspectTextRendering =
			{
				name: 'Source',
				descr: 'Origin of the structure and activity measurement',
				text: '',
				type: Aspect.TEXT_LINK
			};

			let url = this.getSourceURI(row);
			for (let pfx in header.prefixes) if (url.startsWith(pfx + ':'))
			{
				url = header.prefixes[pfx] + url.substring(pfx.length + 1);
				break;
			}
			tr.text = url;
			return tr;
		}

		return null;
	}
}

registerAspect(AssayProvenance);

