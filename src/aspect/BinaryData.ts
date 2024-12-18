/*
    WebMolKit

    (c) 2010-2020 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

    [PKG=webmolkit]
*/

import {DataSheet, DataSheetColumn} from '../data/DataSheet';
import {MoleculeStream} from '../data/MoleculeStream';
import {deepClone} from '../util/util';
import {Aspect} from './Aspect';
import {registerAspect} from './AspectList';
import {MeasurementData} from './MeasurementData';

/*
	BinaryData: describes how continuous numeric data can be transformed into a true/false value, which is often an effective way
	to describe data where the criteria & binary data are known, but the precursor data may or may not.
*/

export class BinaryDataField
{
	public colNameSource:string; // the input feed (should be numeric)
	public colNameDest:string; // output column: enforced to be boolean
	public thresholdValue:number; // threshold for turning free numbers into booleans
	public thresholdRelation:string; // one of "<", ">", "<=", ">="
}

export class BinaryData extends Aspect
{
	public static CODE = 'org.mmi.aspect.BinaryData';
	public static NAME = 'Binary Data';

	private fields:BinaryDataField[] = [];

	// ----------------- public methods -----------------

	// used to test if a datasheet has the appropriate metadata flagging it as a feedstock-containing datasheet
	public static isBinaryData(ds:DataSheet):boolean
	{
		for (let n = 0; n < ds.numExtensions; n++) if (ds.getExtType(n) == BinaryData.CODE) return true;
		return false;
	}

	constructor(ds?:DataSheet, allowModify?:boolean)
	{
		super(BinaryData.CODE, ds, allowModify);
		this.setup();
	}

	// data access
	public getFields():BinaryDataField[]
	{
		return deepClone(this.fields);
	}
	public setFields(fields:BinaryDataField[])
	{
		this.fields = deepClone(fields);
		let content = this.formatMetaData(fields);
		for (let n = 0; n < this.ds.numExtensions; n++) if (this.ds.getExtType(n) == MeasurementData.CODE)
		{
			this.ds.setExtData(n, content);
			return;
		}
		this.ds.appendExtension(MeasurementData.NAME, MeasurementData.CODE, content);
	}

	// obtain the value, where destination takes precedence
	public getValue(row:number, field:BinaryDataField):boolean
	{
		let value = this.getDestValue(row, field);
		if (value != null) return value;
		return this.getSourceValue(row, field);
	}
	public getSourceValue(row:number, field:BinaryDataField):boolean
	{
		let col = this.ds.findColByName(field.colNameSource);
		if (col < 0 || this.ds.isNull(row, col)) return null;

		let ct = this.ds.colType(col);
		let value = 0;
		if (ct == DataSheetColumn.Boolean) return this.ds.getBoolean(row, col);
		else if (ct == DataSheetColumn.Integer) value = this.ds.getInteger(row, col);
		else if (ct == DataSheetColumn.Real) value = this.ds.getReal(row, col);
		else return null;

		if (field.thresholdRelation == '>') return value > field.thresholdValue;
		if (field.thresholdRelation == '<') return value < field.thresholdValue;
		if (field.thresholdRelation == '>=') return value >= field.thresholdValue;
		if (field.thresholdRelation == '<=') return value <= field.thresholdValue;
		return null;
	}
	public getDestValue(row:number, field:BinaryDataField):boolean
	{
		return this.ds.getBoolean(row, field.colNameDest);
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
		let got = false;
		for (let n = 0; n < this.ds.numExtensions; n++) if (this.ds.getExtType(n) == MeasurementData.CODE)
		{
			this.fields = this.parseMetaData(this.ds.getExtData(n));
			got = true;
			break;
		}

		if (!got && this.allowModify)
		{
			let content = this.formatMetaData(this.fields);
			this.ds.appendExtension(MeasurementData.NAME, MeasurementData.CODE, content);
		}
	}

	// interprets the string metadata from the extensions
	private parseMetaData(content:string):BinaryDataField[]
	{
		let fields:BinaryDataField[] = [];
		let f:BinaryDataField = null;

		for (let line of content.split(/\r?\n/))
		{
			if (line == 'field:')
			{
				if (f != null) fields.push(f as BinaryDataField);
				f = {colNameSource: '', colNameDest: '', thresholdValue: 0.5, thresholdRelation: '>='};
				continue;
			}

			if (f == null) continue;
			let eq = line.indexOf('=');
			if (eq < 0) continue;

			if (line.startsWith('colNameSource=')) f.colNameSource = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('colNameDest=')) f.colNameDest = MoleculeStream.skUnescape(line.substring(eq + 1));
			else if (line.startsWith('thresholdValue=')) f.thresholdValue = parseFloat(line.substring(eq + 1));
			else if (line.startsWith('thresholdRelation=')) f.thresholdRelation = MoleculeStream.skUnescape(line.substring(eq + 1));
		}

		if (f != null) fields.push(f);

		return fields;
	}

	// deserialises the header metadata
	private formatMetaData(fields:BinaryDataField[]):string
	{
		let lines:string[] = [];

		for (let f of fields)
		{
			lines.push('field:');
			lines.push('colNameSource=' + MoleculeStream.skEscape(f.colNameSource));
			lines.push('colNameDest=' + MoleculeStream.skEscape(f.colNameDest));
			lines.push('thresholdValue=' + f.thresholdValue);
			lines.push('thresholdRelation=' + MoleculeStream.skEscape(f.thresholdRelation));
		}

		return lines.join('\n');
	}

	// ------------------ aspect implementation --------------------

	public plainHeading():string {return BinaryData.NAME;}

	public isColumnReserved(colName:string):boolean	{return false;}
}

registerAspect(BinaryData);

