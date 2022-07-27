/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {deepClone, safeFloat, safeInt} from '../util/util';
import {Vec} from '../util/Vec';
import {Molecule} from './Molecule';

/*
	Wraps an object representation of a datasheet with access functions that are analogous to the Java com.mmi.core.ds.DataSheet class.

	The format of the data parameter is:

		title, description: string
		numCols, numRows, numExtens: integer
		colData: array of {name:string, type:string, descr:string}
		rowData: matrix, rowData[row][col]=value
		extData: array of {name:string, type:string, data:string}

	Important differences to remember:

	- column types are represented as strings, not integers (see constants below)
	- molecules are represented as strings, in SketchEl format, not objects
*/

export const enum DataSheetColumn
{
	Molecule = 'molecule',
	String = 'string',
	Real = 'real',
	Integer = 'integer',
	Boolean = 'boolean',
	Extend = 'extend',
}

interface DataSheetContentColumn
{
	name:string;
	type:DataSheetColumn;
	descr:string;
}

interface DataSheetContentExt
{
	name:string;
	type:string;
	data:string;
}

interface DataSheetContent
{
	title?:string;
	description?:string;
	numCols?:number;
	numRows?:number;
	numExtens?:number;
	colData?:DataSheetContentColumn[];
	rowData?:any[][];
	extData?:DataSheetContentExt[];
}

export class DataSheet
{
	private data:DataSheetContent;

	// instantiates the data using a JSON-encoded datasheet; it may be null or empty
	// note: this class reserves the right to modify the data parameter; it is the caller's responsibility to ensure that there are no
	// troublesome references elsewhere
	constructor(data?:any)
	{
		if (!data) data = {};

		if (!data.title) data.title = '';
		if (!data.description) data.description = '';

		if (data.numCols == null) data.numCols = Vec.len(data.colData);
		if (data.numRows == null) data.numRows = Vec.len(data.rowData);
		if (data.numExtens == null) data.numExtens = Vec.len(data.extData);

		if (data.colData == null) data.colData = [];
		if (data.rowData == null) data.rowData = [];
		if (data.extData == null) data.extData = [];

		this.data = data;
	}

	// make a deep clone of the datasheet that can be safely modified without consequences
	public clone(withRows = true):DataSheet
	{
		let {numCols, numRows, colData, rowData} = this.data;
		let data:DataSheetContent =
		{
			'title': this.data.title,
			'description': this.data.description,
			'numCols': numCols,
			'numRows': withRows ? numRows : 0,
			'numExtens': this.data.numExtens,
			'colData': deepClone(colData),
			'rowData': withRows ? new Array(numRows) : [],
			'extData': deepClone(this.data.extData),
		};
		if (withRows) for (let r = 0; r < numRows; r++)
		{
			let inRow = rowData[r], outRow:any[] = new Array(numCols);
			for (let c = 0; c < numCols; c++)
			{
				if (inRow[c] != null && colData[c].type == DataSheetColumn.Molecule && inRow[c] instanceof Molecule)
					outRow[c] = (inRow[c] as Molecule).clone();
				else
					outRow[c] = inRow[c];
			}
			data.rowData[r] = outRow;
		}
		return new DataSheet(data);
	}

	// clone with more detailed control about what to include; note that null rowMask is a shortcut for empty
	public cloneMask(colMask:boolean[], rowMask:boolean[] = null, inclExtn:boolean = true):DataSheet
	{
		let {numCols, numRows, colData, rowData} = this.data;
		let data:DataSheetContent =
		{
			'title': this.data.title,
			'description': this.data.description,
			'numCols': Vec.maskCount(colMask),
			'numRows': rowMask ? Vec.maskCount(rowMask) : 0,
			'numExtens': inclExtn ? this.data.numExtens : 0,
			'colData': deepClone(Vec.maskGet(colData, colMask)),
			'rowData': [],
			'extData': inclExtn ? deepClone(this.data.extData) : [],
		};

		if (rowMask) for (let r = 0; r < numRows; r++) if (rowMask[r])
		{
			let inRow = rowData[r], outRow:any[] = Vec.maskGet(inRow, colMask);
			data.rowData.push(outRow);
		}

		// molecule instances need to be cloned explicitly
		const {'colData': outCols, 'rowData': outRows} = data;
		for (let c = outCols.length - 1; c >= 0; c--) if (outCols[c].type == DataSheetColumn.Molecule)
		{
			for (let r = outRows.length - 1; r >= 0; r--) if (outRows[r][c] != null && outRows[r][c] instanceof Molecule)
				outRows[r][c] = (outRows[r][c] as Molecule).clone();
		}

		return new DataSheet(data);
	}

	// returns the data upon which is class is based; this is in the correct format for sending to the server as a
	// "JSON-formatted datasheet", and is also suitable
	public getData():any
	{
		return this.data;
	}

	public get numCols():number
	{
		return this.data.numCols;
	}
	public get numRows():number
	{
		return this.data.numRows;
	}
	public get title():string {return this.data.title;}
	public set title(title:string) {this.data.title = title;}
	public get description():string {return this.data.description;}
	public set description(description:string) {this.data.description = description;}
	public get numExtensions():number
	{
		return this.data.numExtens;
	}
	public getExtName(idx:number):string
	{
		return this.data.extData[idx].name;
	}
	public getExtType(idx:number):string
	{
		return this.data.extData[idx].type;
	}
	public getExtData(idx:number):string
	{
		return this.data.extData[idx].data;
	}
	public setExtName(idx:number, val:string):void
	{
		this.data.extData[idx].name = val;
	}
	public setExtType(idx:number, val:string):void
	{
		this.data.extData[idx].type = val;
	}
	public setExtData(idx:number, val:string):void
	{
		this.data.extData[idx].data = val;
	}
	public appendExtension(name:string, type:string, data:string):number
	{
		this.data.numExtens++;
		this.data.extData.push({'name': name, 'type': type, 'data': data});
		return this.data.numExtens - 1;
	}
	public insertExtension(idx:number, name:string, type:string, data:string):void
	{
		this.data.numExtens++;
		this.data.extData.splice(idx, 0, {'name': name, 'type': type, 'data': data});
	}
	public deleteExtension(idx:number):void
	{
		this.data.extData.splice(idx, 1);
		this.data.numExtens--;
	}
	public colName(col:number):string
	{
		return this.data.colData[col].name;
	}
	public colType(col:number):DataSheetColumn
	{
		return this.data.colData[col].type;
	}
	public colDescr(col:number):string
	{
		return this.data.colData[col].descr;
	}
	public isNull(row:number, col:number | string):boolean
	{
		if (typeof col === 'string') col = this.findColByName(col);
		if (col < 0) return null;
		return this.data.rowData[row][col] == null;
	}
	public notNull(row:number, col:number | string):boolean
	{
		return !this.isNull(row, col);
	}
	public isBlank(row:number, col:number | string):boolean
	{
		if (typeof col === 'string') col = this.findColByName(col);
		if (this.isNull(row, col)) return true;
		let ct = this.colType(col);
		if (ct == DataSheetColumn.Molecule) return this.getMolecule(row, col).numAtoms == 0;
		if (ct == DataSheetColumn.String) return this.getString(row, col).length == 0;
		if (ct == DataSheetColumn.Extend) return this.getExtend(row, col).length == 0;
		return false;
	}
	public notBlank(row:number, col:number | string):boolean
	{
		return !this.isBlank(row, col);
	}

	public getObject(row:number, col:number | string):any
	{
		if (typeof col === 'string') col = this.findColByName(col);
		return this.data.rowData[row][col];
	}
	// NOTE: the molecule object is a direct pointer, so be careful to clone before modifying frivolously
	public getMolecule(row:number, col:number | string):Molecule
	{
		if (typeof col === 'string') col = this.findColByName(col);
		if (col < 0) return null;
		let datum = this.data.rowData[row][col];
		if (datum == null) return null;
		if (typeof datum === 'string')
		{
			datum = Molecule.fromString(datum);
			this.data.rowData[row][col] = datum;
		}
		return datum;
	}
	public getMoleculeClone(row:number, col:number | string):Molecule
	{
		let mol = this.getMolecule(row, col);
		return mol == null ? null : mol.clone();
	}
	public getMoleculeBlank(row:number, col:number | string):Molecule
	{
		let mol = this.getMolecule(row, col);
		return mol ? mol : new Molecule();
	}
	public getString(row:number, col:number | string):string
	{
		if (typeof col === 'string') col = this.findColByName(col);
		if (col < 0) return null;
		let str = this.data.rowData[row][col] as string;
		return str == null ? '' : str;
	}
	public getInteger(row:number, col:number | string):number
	{
		if (typeof col === 'string') col = this.findColByName(col);
		if (col < 0) return null;
		return this.data.rowData[row][col];
	}
	public getReal(row:number, col:number | string):number
	{
		if (typeof col === 'string') col = this.findColByName(col);
		if (col < 0) return null;
		return this.data.rowData[row][col];
	}
	public getBoolean(row:number, col:number | string):boolean
	{
		if (typeof col === 'string') col = this.findColByName(col);
		if (col < 0) return null;
		return this.data.rowData[row][col];
	}
	public getExtend(row:number, col:number | string):string
	{
		if (typeof col === 'string') col = this.findColByName(col);
		if (col < 0) return null;
		return this.data.rowData[row][col];
	}
	public setToNull(row:number, col:number | string):void
	{
		if (typeof col === 'string') col = this.findColByName(col);
		if (col < 0) return;
		this.data.rowData[row][col] = null;
	}
	public setObject(row:number, col:number | string, val:any):void
	{
		if (typeof col === 'string') col = this.findColByName(col);
		if (col < 0) return;
		this.data.rowData[row][col] = val;
	}
	public setMolecule(row:number, col:number | string, mol:Molecule):void
	{
		if (typeof col === 'string') col = this.findColByName(col);
		if (col < 0) return;
		this.data.rowData[row][col] = mol ? mol.clone() : null;
	}
	public setString(row:number, col:number | string, val:string):void
	{
		if (typeof col === 'string') col = this.findColByName(col);
		if (col < 0) return;
		this.data.rowData[row][col] = val;
	}
	public setInteger(row:number, col:number | string, val:number):void
	{
		if (typeof col === 'string') col = this.findColByName(col);
		if (col < 0) return;
		this.data.rowData[row][col] = val;
	}
	public setReal(row:number, col:number | string, val:number):void
	{
		if (typeof col === 'string') col = this.findColByName(col);
		if (col < 0) return;
		this.data.rowData[row][col] = val;
	}
	public setBoolean(row:number, col:number | string, val:boolean):void
	{
		if (typeof col === 'string') col = this.findColByName(col);
		if (col < 0) return;
		this.data.rowData[row][col] = val;
	}
	public setExtend(row:number, col:number | string, val:string):void
	{
		if (typeof col === 'string') col = this.findColByName(col);
		if (col < 0) return;
		this.data.rowData[row][col] = val;
	}
	public isEqualMolecule(row:number, col:number | string, mol:Molecule):boolean
	{
		if (typeof col === 'string') col = this.findColByName(col);
		if (this.isNull(row, col) != (mol == null)) return false;
		if (mol == null) return true;
		return this.getMolecule(row, col).compareTo(mol) == 0;
	}
	public isEqualString(row:number, col:number | string, val:string):boolean
	{
		if (typeof col === 'string') col = this.findColByName(col);
		if (this.isNull(row, col) != (val == null || val == '')) return false;
		if (val == null || val == '') return true;
		return this.getString(row, col) == val;
	}
	public isEqualInteger(row:number, col:number | string, val:number):boolean
	{
		if (typeof col === 'string') col = this.findColByName(col);
		if (this.isNull(row, col) != (val == null)) return false;
		if (val == null) return true;
		return this.getInteger(row, col) == val;
	}
	public isEqualReal(row:number, col:number | string, val:number):boolean
	{
		if (typeof col === 'string') col = this.findColByName(col);
		if (this.isNull(row, col) != (val == null)) return false;
		if (val == null) return true;
		return this.getReal(row, col) == val;
	}
	public isEqualBoolean(row:number, col:number | string, val:boolean):boolean
	{
		if (typeof col === 'string') col = this.findColByName(col);
		if (this.isNull(row, col) != (val == null)) return false;
		if (val == null) return true;
		return this.getBoolean(row, col) == val;
	}
	public appendColumn(name:string, type:DataSheetColumn, descr:string):number
	{
		this.data.numCols++;
		this.data.colData.push({'name': name, 'type': type, 'descr': descr});
		for (let n = 0; n < this.data.numRows; n++) this.data.rowData[n].push(null);
		return this.data.numCols - 1;
	}
	public insertColumn(col:number, name:string, type:DataSheetColumn, descr:string):void
	{
		this.data.numCols++;
		this.data.colData.splice(col, 0, {'name': name, 'type': type, 'descr': descr});
		for (let n = 0; n < this.data.numRows; n++) this.data.rowData[n].splice(col, 0, null);
	}
	public deleteColumn(col:number):void
	{
		this.data.numCols--;
		this.data.colData.splice(col, 1);
		for (let n = 0; n < this.data.numRows; n++) this.data.rowData[n].splice(col, 1);
	}
	public changeColumnName(col:number, name:string, descr:string):void
	{
		this.data.colData[col].name = name;
		this.data.colData[col].descr = descr;
	}
	public changeColumnType(col:number, newType:DataSheetColumn):void
	{
		let oldType = this.colType(col);
		if (oldType == newType) return;

		let incompatible = oldType == DataSheetColumn.Molecule || newType == DataSheetColumn.Molecule ||
						   oldType == DataSheetColumn.Extend || newType == DataSheetColumn.Extend;

		for (let n = this.data.rowData.length - 1; n >= 0; n--)
		{
			let row = this.data.rowData[n];
			if (row[col] == null) continue;
			if (incompatible) {row[col] = null; continue;}

			let val = '';
			if (oldType == DataSheetColumn.String) val = row[col] as string;
			else if (oldType == DataSheetColumn.Integer) val = (row[col] as number).toString();
			else if (oldType == DataSheetColumn.Real) val = (row[col] as number).toString();
			else if (oldType == DataSheetColumn.Boolean) val = row[col] as boolean ? 'true' : 'false';

			row[col] = null;

			if (newType == DataSheetColumn.String) row[col] = val;
			else if (newType == DataSheetColumn.Integer) {let num = parseInt(val); row[col] = isFinite(num) ? num : null;}
			else if (newType == DataSheetColumn.Real) {let num = parseFloat(val); row[col] = isFinite(num) ? num : null;}
			else if (newType == DataSheetColumn.Boolean) row[col] = val.toLowerCase() == 'true' ? true : false;
		}

		this.data.colData[col].type = newType;
	}
	public ensureColumn(name:string, type:DataSheetColumn, descr:string):number
	{
		for (let n = 0; n < this.data.numCols; n++) if (this.data.colData[n].name == name)
		{
			if (this.data.colData[n].type != type) this.changeColumnType(n, type);
			this.data.colData[n].descr = descr;
			return n;
		}
		return this.appendColumn(name, type, descr);
	}
	public reorderColumns(order:number[]):void
	{
		let identity = true;
		for (let n = 0; n < order.length - 1; n++) if (order[n] != order[n + 1] - 1) {identity = false; break;}
		if (identity) return; // nothing to do

		this.data.colData = Vec.idxGet(this.data.colData, order);
		for (let n = 0; n < this.data.numRows; n++) this.data.rowData[n] = Vec.idxGet(this.data.rowData[n], order);
	}
	public appendRow():number
	{
		this.data.numRows++;
		let row = new Array();
		for (let n = 0; n < this.data.numCols; n++) row.push(null);
		this.data.rowData.push(row);
		return this.data.numRows - 1;
	}
	public appendRowFrom(srcDS:DataSheet, row:number):number
	{
		this.data.numRows++;
		this.data.rowData.push(srcDS.data.rowData[row].slice(0));
		return this.data.numRows - 1;
	}
	public insertRow(row:number):void
	{
		this.data.numRows++;
		let data = new Array();
		for (let n = 0; n < this.data.numCols; n++) data.push(null);
		this.data.rowData.splice(row, 0, data);
	}
	public deleteRow(row:number):void
	{
		this.data.numRows--;
		this.data.rowData.splice(row, 1);
	}
	public deleteAllRows():void
	{
		this.data.numRows = 0;
		this.data.rowData = new Array();
	}
	public moveRowUp(row:number):void
	{
		let data = this.data.rowData[row];
		this.data.rowData[row] = this.data.rowData[row - 1];
		this.data.rowData[row - 1] = data;
	}
	public moveRowDown(row:number):void
	{
		let data = this.data.rowData[row];
		this.data.rowData[row] = this.data.rowData[row + 1];
		this.data.rowData[row + 1] = data;
	}
	public swapRows(row1:number, row2:number):void
	{
		Vec.swap(this.data.rowData, row1, row2);
	}
	public exciseSingleRow(row:number):DataSheet
	{
		let newData =
		{
			'title': this.data.title,
			'description': this.data.description,
			'numCols': this.data.numCols,
			'numRows': 1,
			'numExtens': this.data.numExtens,
			'colData': this.data.colData.slice(0),
			'rowData': [this.data.rowData[row].slice(0)],
			'extData': this.data.extData.slice(0)
		};
		return new DataSheet(newData);
	}
	public colIsPrimitive(col:number | string):boolean
	{
		if (typeof col === 'string') col = this.findColByName(col);
		let ct = this.data.colData[col].type;
		return ct == 'string' || ct == 'real' || ct == 'integer' || ct == 'boolean';
	}
	public findColByName(name:string, type?:string):number
	{
		for (let n = 0; n < this.data.numCols; n++) if (this.data.colData[n].name == name)
		{
			if (type == null || this.data.colData[n].type == type) return n;
		}
		return -1;
	}
	public firstColOfType(type:string):number
	{
		for (let n = 0; n < this.data.numCols; n++) if (this.data.colData[n].type == type) return n;
		return -1;
	}

	// bring in a cell from the contents of another datasheet's cell, making an honest attempt to convert the data
	// if the type is different; completely incompatible data equates to null
	public copyCell(toRow:number, toCol:number, fromDS:DataSheet, fromRow:number, fromCol:number):void
	{
		this.setToNull(toRow, toCol);
		if (fromDS.isNull(fromRow, fromCol)) return;
		let obj = fromDS.getObject(fromRow, fromCol);
		this.setObject(toRow, toCol, DataSheet.convertType(obj, fromDS.colType(fromCol), this.colType(toCol)));
	}

	// when possibly converting between two column types, make sure that the object is compatible
	public static convertType(obj:any, fromType:DataSheetColumn, toType:DataSheetColumn):any
	{
		const ft = fromType, tt = toType;
		if (obj == null || ft == tt || (typeof obj == 'string' && obj == '')) return obj;

		if (tt == DataSheetColumn.String)
		{
			if (ft == DataSheetColumn.Integer) return obj.toString();
			else if (ft == DataSheetColumn.Real) return obj.toString();
			else if (ft == DataSheetColumn.Boolean) return obj ? 'true' : 'false';
		}
		else if (tt == DataSheetColumn.Real)
		{
			if (ft == DataSheetColumn.String) return safeFloat(obj, null);
			else if (ft == DataSheetColumn.Integer) return obj;
			else if (ft == DataSheetColumn.Boolean) return obj ? 1 : 0;
		}
		else if (tt == DataSheetColumn.Integer)
		{
			if (ft == DataSheetColumn.String) return safeInt(obj, null);
			else if (ft == DataSheetColumn.Real) return Math.round(obj);
			else if (ft == DataSheetColumn.Boolean) return obj ? 1 : 0;
		}
		else if (tt == DataSheetColumn.Boolean)
		{
			if (ft == DataSheetColumn.String) return (obj as string).toLowerCase() == 'true';
			else if (ft == DataSheetColumn.Integer) return obj > 0;
			else if (ft == DataSheetColumn.Real) return obj >= 0.5;
		}

		return null;
	}

	// converts a cell to a string by whatever means necessary (or returns null)
	public toString(row:number, col:number | string):string
	{
		if (typeof col === 'string') col = this.findColByName(col);
		let obj = this.data.rowData[row][col];
		return obj == null ? null : obj.toString();
	}

	// converts a cell to a number; returns null or NaN as appropriate
	public toInt(row:number, col:number):number
	{
		if (!this.colIsPrimitive(col)) return null;
		let obj = this.data.rowData[row][col];
		return obj == null ? null : parseInt(obj);
	}
	public toReal(row:number, col:number):number
	{
		if (!this.colIsPrimitive(col)) return null;
		let obj = this.data.rowData[row][col];
		return obj == null ? null : parseFloat(obj);
	}
}
