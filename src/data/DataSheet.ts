/*
    WebMolKit

    (c) 2010-2017 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

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

interface DataSheetContent
{
	title?:string;
	description?:string;
	numCols?:number;
	numRows?:number;
	numExtens?:number;
	colData?:any[];
	rowData?:any[][];
	extData?:any[];
}

class DataSheet
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

		if (data.numCols == null) data.numCols = 0;
		if (data.numRows == null) data.numRows = 0;
		if (data.numExtens == null) data.numExtens = 0;

		if (data.colData == null) data.colData = [];
		if (data.rowData == null) data.rowData = [];
		if (data.extData == null) data.extData = [];

		this.data = data;
	}

	// constants
	public static COLTYPE_MOLECULE = 'molecule';
	public static COLTYPE_STRING = 'string';
	public static COLTYPE_REAL = 'real';
	public static COLTYPE_INTEGER = 'integer';
	public static COLTYPE_BOOLEAN = 'boolean';
	public static COLTYPE_EXTEND = 'extend';

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
	public getTitle():string
	{
		return this.data.title;
	}
	public getDescription():string
	{
		return this.data.description;
	}
	public setTitle(val:string)
	{
		this.data.title = val;
	}
	public setDescription(val:string)
	{
		this.data.description = val;
	}
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
	public setExtName(idx:number, val:string)
	{
		this.data.extData[idx].name = val;
	}
	public setExtType(idx:number, val:string)
	{
		this.data.extData[idx].type = val;
	}
	public setExtData(idx:number, val:string)
	{
		this.data.extData[idx].data = val;
	}
	public appendExtension(name:string, type:string, data:string):number
	{
		this.data.numExtens++;
		this.data.extData.push({'name': name, 'type': type, 'data':data});
		return this.data.numExtens - 1;
	}
	public deleteExtension(idx:number):void
	{
		this.data.extData.splice(idx, 1);
	}
	public colName(col:number):string
	{
		return this.data.colData[col].name;
	}
	public colType(col:number):string
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
	public notNull(row:number, col:number | string):boolean {return !this.isNull(row, col);}
	public getObject(row:number, col:number | string):any
	{
		if (typeof col === 'string') col = this.findColByName(col);
		return this.data.rowData[row][col];
	}
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
	public getString(row:number, col:number | string):string
	{
		if (typeof col === 'string') col = this.findColByName(col);
		if (col < 0) return null;
		let str = <string>this.data.rowData[row][col]; 
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
		this.data.rowData[row][col] = mol.clone();
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
	public appendColumn(name:string, type:string, descr:string):number
	{
		this.data.numCols++;
		this.data.colData.push({'name': name, 'type': type, 'descr': descr});
		for (let n = 0; n < this.data.numRows; n++) this.data.rowData[n].push(null);
		return this.data.numCols - 1;
	}
	public deleteColumn(col:number):void
	{
		this.data.numCols--;
		this.data.colData.splice(col, 1);
		for (let n = 0; n < this.data.numRows; n++) this.data.rowData[n].splice(col, 1); 
	}
	public changeColumnName(col:number, name:string, descr:string):void
	{
		this.data.colData[col].name = col;
		this.data.colData[col].descr = descr;
	}
	public changeColumnType(col:number, newType:string):void
	{
		let oldType = this.colType(col);
		if (oldType == newType) return;

    	let incompatible = oldType == DataSheet.COLTYPE_MOLECULE || newType == DataSheet.COLTYPE_MOLECULE ||
    	    	    	   oldType == DataSheet.COLTYPE_EXTEND || newType == DataSheet.COLTYPE_EXTEND;
		
		for (let n = this.data.rowData.length - 1; n >= 0; n--)
		{
			let row = this.data.rowData[n];
			if (row[col] == null) continue;
			if (incompatible) {row[col] = null; continue;}

			let val = '';
			if (oldType == DataSheet.COLTYPE_STRING) val = <string>row[col];
			else if (oldType == DataSheet.COLTYPE_INTEGER) val = (<number>row[col]).toString();
			else if (oldType == DataSheet.COLTYPE_REAL) val = (<number>row[col]).toString();
			else if (oldType == DataSheet.COLTYPE_BOOLEAN) val = <boolean>row[col] ? 'true' : 'false';

			row[col] = null;
    	    
			if (newType == DataSheet.COLTYPE_STRING) row[col] = val;
			else if (newType == DataSheet.COLTYPE_INTEGER) {let num = parseInt(val); row[col] = isFinite(num) ? num : null;} 
			else if (newType == DataSheet.COLTYPE_REAL) {let num = parseFloat(val); row[col] = isFinite(num) ? num : null;}
			else if (newType == DataSheet.COLTYPE_BOOLEAN) row[col] = val.toLowerCase() == 'true' ? true : false;
		}

		this.data.colData[col].type = newType;
	}
	public ensureColumn(name:string, type:string, descr:string):number
	{
		for (let n = 0; n < this.data.numCols; n++) if (this.data.colData[n].name == name)
		{
			if (this.data.colData[n].type != type) this.changeColumnType(n, type);
			this.data.colData[n].descr = descr;
			return n;
		}
		return this.appendColumn(name, type, descr);
	}
	/* !! TBD
	public abstract void reorderColumns(int[] order);
	*/
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

	// converts a cell to a string by whatever means necessary (or returns null)
	public toString(row:number, col:number):string
	{
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