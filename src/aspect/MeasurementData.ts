/*
    WebMolKit

    (c) 2010-2020 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

    [PKG=webmolkit]
*/

import {DataSheet, DataSheetColumn} from '../ds/DataSheet';
import {MoleculeStream} from '../io/MoleculeStream';
import {Vec} from '../util/Vec';
import {Aspect, AspectTextRendering} from './Aspect';
import {registerAspect} from './AspectList';

/*
	Measurement: provides some number of measurement fields, which augment an ordinary numeric field to add units,
    modifier, error and overall metadata. This aspect is useful for collecting multiple columns of measurements such as
    physical properties or assay readouts.
*/

export interface MeasurementDataUnit
{
	name:string;
	uri:string;
}

export interface MeasurementDataField
{
	name:string;
	units:string[];
	defnURI:string[];
}

export interface MeasurementDataHeader
{
	units:MeasurementDataUnit[];
	fields:MeasurementDataField[];
}

export interface MeasurementDataValue
{
	value:number;
	error:number;
	units:string;
	mod:string;
}

export class MeasurementData extends Aspect
{
	public static CODE = 'org.mmi.aspect.MeasurementData';
	public static NAME = 'Measurement Data';

	public static SUFFIX_VALUE = '';
	public static SUFFIX_ERROR = '_error';
	public static SUFFIX_UNITS = '_units';
	public static SUFFIX_MOD = '_mod';

	private header:MeasurementDataHeader = {units: [], fields: []};

	// ----------------- public methods -----------------

	// used to test if a datasheet has the appropriate metadata
	public static isMeasurementData(ds:DataSheet):boolean
	{
		for (let n = 0; n < ds.numExtensions; n++) if (ds.getExtType(n) == MeasurementData.CODE) return true;
		return false;
	}

	constructor(ds?:DataSheet, allowModify?:boolean)
	{
		super(MeasurementData.CODE, ds, allowModify);
		this.setup();
	}

	// data access
	public getHeader():MeasurementDataHeader
	{
		return this.header;
	}
	public setHeader(header:MeasurementDataHeader):void
	{
		this.header = header;
		let content = this.formatMetaData(header);
		for (let n = 0; n < this.ds.numExtensions; n++) if (this.ds.getExtType(n) == MeasurementData.CODE)
		{
			this.ds.setExtData(n, content);
			return;
		}
		this.ds.appendExtension(MeasurementData.NAME, MeasurementData.CODE, content);
	}

	// applies the header, and also updates the columns if necessary
	public effectHeader(header:MeasurementDataHeader):void
	{
		this.setHeader(header);
		this.ensureFields();
	}

	// renames a field, updating both the header and the underlying columns
	public rename(fldidx:number, newName:string):void
	{
		let oldName = this.header.fields[fldidx].name;
		if (oldName == newName) return;

		this.header.fields[fldidx].name = newName;
		this.setHeader(this.header);

		for (let sfx of [MeasurementData.SUFFIX_VALUE, MeasurementData.SUFFIX_ERROR, MeasurementData.SUFFIX_UNITS, MeasurementData.SUFFIX_MOD])
		{
			let col = this.ds.findColByName(oldName + sfx);
			if (col >= 0) this.ds.changeColumnName(col, newName + sfx, this.ds.colDescr(col));
		}
	}

	// return the list of columns that's reserved for just the indicated field
	public reservedColumns(fldidx:number):string[]
	{
		let fieldName = this.header.fields[fldidx].name;
		return [fieldName + MeasurementData.SUFFIX_VALUE, fieldName + MeasurementData.SUFFIX_ERROR,
				fieldName + MeasurementData.SUFFIX_UNITS, fieldName + MeasurementData.SUFFIX_MOD];
	}

	// getting and setting values
	public getValue(row:number, fldidx:number):MeasurementDataValue
	{
		return this.getValueField(row, this.header.fields[fldidx]);
	}
	public getValueField(row:number, field:MeasurementDataField):MeasurementDataValue
	{
		let value:MeasurementDataValue = {value: Number.NaN, error: Number.NaN, units: '', mod: ''};

		let colValue = this.ds.findColByName(field.name + MeasurementData.SUFFIX_VALUE, DataSheetColumn.Real);
		let colError = this.ds.findColByName(field.name + MeasurementData.SUFFIX_ERROR, DataSheetColumn.Real);
		let colUnits = this.ds.findColByName(field.name + MeasurementData.SUFFIX_UNITS, DataSheetColumn.String);
		let colMod = this.ds.findColByName(field.name + MeasurementData.SUFFIX_MOD, DataSheetColumn.String);

		if (colValue >= 0 && this.ds.notNull(row, colValue)) value.value = this.ds.getReal(row, colValue);
		if (colError >= 0 && this.ds.notNull(row, colError)) value.error = this.ds.getReal(row, colError);
		if (colUnits >= 0) value.units = this.ds.getString(row, colUnits);
		if (colMod >= 0) value.mod = this.ds.getString(row, colMod);

		return value;
	}

	public setValue(row:number, fldidx:number, value:MeasurementDataValue):void
	{
		let fieldName = this.header.fields[fldidx].name;
		let colValue = this.ds.findColByName(fieldName + MeasurementData.SUFFIX_VALUE, DataSheetColumn.Real);
		let colError = this.ds.findColByName(fieldName + MeasurementData.SUFFIX_ERROR, DataSheetColumn.Real);
		let colUnits = this.ds.findColByName(fieldName + MeasurementData.SUFFIX_UNITS, DataSheetColumn.String);
		let colMod = this.ds.findColByName(fieldName + MeasurementData.SUFFIX_MOD, DataSheetColumn.String);

		if (colValue >= 0) if (isNaN(value.value)) this.ds.setToNull(row, colValue); else this.ds.setReal(row, colValue, value.value);
		if (colError >= 0) if (isNaN(value.error)) this.ds.setToNull(row, colError); else this.ds.setReal(row, colError, value.error);
		if (colUnits >= 0) this.ds.setString(row, colUnits, value.units);
		if (colMod >= 0) this.ds.setString(row, colMod, value.mod);
	}

	public clearValue(row:number, fldidx:number):void
	{
		let fieldName = this.header.fields[fldidx].name;
		let colValue = this.ds.findColByName(fieldName + MeasurementData.SUFFIX_VALUE, DataSheetColumn.Real);
		let colError = this.ds.findColByName(fieldName + MeasurementData.SUFFIX_ERROR, DataSheetColumn.Real);
		let colUnits = this.ds.findColByName(fieldName + MeasurementData.SUFFIX_UNITS, DataSheetColumn.String);
		let colMod = this.ds.findColByName(fieldName + MeasurementData.SUFFIX_MOD, DataSheetColumn.String);

		if (colValue >= 0) this.ds.setToNull(row, colValue);
		if (colError >= 0) this.ds.setToNull(row, colError);
		if (colUnits >= 0) this.ds.setToNull(row, colUnits);
		if (colMod >= 0) this.ds.setToNull(row, colMod);
	}

	// getting/setting description
	public getDescr(row:number, fldidx:number):string
	{
		let col = this.ds.findColByName(this.header.fields[fldidx].name);
		return col < 0 ? '' : this.ds.colDescr(col);
	}
	public setDescr(row:number, fldidx:number, descr:string):void
	{
		let col = this.ds.findColByName(this.header.fields[fldidx].name);
		if (col >= 0) this.ds.changeColumnName(col, this.ds.colName(col), descr);
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
		this.header = {units: [], fields: []};

		let got = false;
		for (let n = 0; n < this.ds.numExtensions; n++) if (this.ds.getExtType(n) == MeasurementData.CODE)
		{
			this.header = this.parseMetaData(this.ds.getExtData(n));
			got = true;
			break;
		}

		this.ensureFields();

		if (!got && this.allowModify)
		{
			let content = this.formatMetaData(this.header);
			this.ds.appendExtension(MeasurementData.NAME, MeasurementData.CODE, content);
		}
	}

	// makes sure the fields mentioned in the header are available
	private ensureFields():void
	{
		for (let f of this.header.fields)
		{
			let descr = 'Measurement';
			let colidx = this.ds.findColByName(f.name);
			if (colidx >= 0) descr = this.ds.colDescr(colidx);

			if (this.allowModify)
			{
				this.ds.ensureColumn(f.name + MeasurementData.SUFFIX_VALUE, DataSheetColumn.Real, descr);
				this.ds.ensureColumn(f.name + MeasurementData.SUFFIX_ERROR, DataSheetColumn.Real, 'Error');
				this.ds.ensureColumn(f.name + MeasurementData.SUFFIX_UNITS, DataSheetColumn.String, 'Units');
				this.ds.ensureColumn(f.name + MeasurementData.SUFFIX_MOD, DataSheetColumn.String, 'Modifier');
			}
		}
	}

	// interprets the string metadata from the extensions
	private parseMetaData(content:string):MeasurementDataHeader
	{
		let header:MeasurementDataHeader = {units: [], fields: []};

		for (let line of content.split(/\r?\n/))
		{
			let eq = line.indexOf('=');
			if (eq < 0) continue;
			if (line.startsWith('unit='))
			{
				let bits = line.substring(eq + 1).split(',');
				if (bits.length >= 2) header.units.push({name: MoleculeStream.skUnescape(bits[0]), uri: MoleculeStream.skUnescape(bits[1])});
			}
			else if (line.startsWith('field='))
			{
				let bits = line.substring(eq + 1).split(',');
				let f:MeasurementDataField = {name: MoleculeStream.skUnescape(bits[0]), units: [], defnURI: []};
				for (let n = 1; n < bits.length; n++) f.units.push(MoleculeStream.skUnescape(bits[n]));
				header.fields.push(f);
			}
			else if (line.startsWith('definition='))
			{
				let bits = line.substring(eq + 1).split(',');
				if (bits.length >= 2)
				{
					let f = header.fields.find((f) => f.name == bits[0]);
					if (!f) continue;
					for (let n = 1; n < bits.length; n++) f.defnURI.push(MoleculeStream.skUnescape(bits[n]));
				}
			}
		}
		return header;
	}

	// deserialises the header metadata
	private formatMetaData(header:MeasurementDataHeader):string
	{
		let lines:string[] = [];

		for (let u of header.units)
		{
			lines.push('unit=' + MoleculeStream.skEscape(u.name) + ',' + MoleculeStream.skEscape(u.uri));
		}
		for (let f of header.fields)
		{
			let line = 'field=' + MoleculeStream.skEscape(f.name);
			for (let u of f.units) line += ',' + MoleculeStream.skEscape(u);
			lines.push(line);

			if (Vec.notBlank(f.defnURI))
			{
				line = 'definition=' + MoleculeStream.skEscape(f.name);
				for (let d of f.defnURI) line += ',' + MoleculeStream.skEscape(d);
				lines.push(line);
			}
		}

		return lines.join('\n');
	}

	// ------------------ aspect implementation --------------------

	public plainHeading():string {return MeasurementData.NAME;}

	public isColumnReserved(colName:string):boolean
	{
		return this.areColumnsReserved([colName])[0];
	}
	public areColumnsReserved(colNames:string[]):boolean[]
	{
		let names = new Set<string>();
		for (let f of this.header.fields)
		{
			names.add(f.name + MeasurementData.SUFFIX_VALUE);
			names.add(f.name + MeasurementData.SUFFIX_ERROR);
			names.add(f.name + MeasurementData.SUFFIX_UNITS);
			names.add(f.name + MeasurementData.SUFFIX_MOD);
		}
		let resv:boolean[] = [];
		for (let col of colNames) resv.push(names.has(col));
		return resv;
	}

	public numTextRenderings(row:number):number {return this.header.fields.length;}
	public produceTextRendering(row:number, idx:number):AspectTextRendering
	{
		let field = this.header.fields[idx];
		let colField = this.ds.findColByName(field.name);

		let tr:AspectTextRendering =
		{
			name: field.name,
			descr: colField < 0 ? '' : this.ds.colDescr(colField),
			text: '',
			type: Aspect.TEXT_PLAIN
		};

		let datum = this.getValue(row, idx);
		if (!Number.isNaN(datum.value))
		{
			if (datum.mod) tr.text += datum.mod + ' ';
			tr.text += datum.value;
			if (!Number.isNaN(datum.error)) tr.text += ' \u{00B1} ' + datum.error;
			if (datum.units) tr.text += ' ' + datum.units;
		}
		return tr;
	}
}

registerAspect(MeasurementData);

