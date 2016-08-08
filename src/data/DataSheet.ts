/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

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


class DataSheet
{
	data:any;
	
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
	};

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
	};

	public numCols():number
	{
		return this.data.numCols;
	};
	public numRows():number
	{
		return this.data.numRows;
	};
	public getTitle():string
	{
		return this.data.title;
	};
	public getDescription():string
	{
		return this.data.description;
	};
	public setTitle(val:string)
	{
		this.data.title = val;
	};
	public setDescription(val:string)
	{
		this.data.description = val;
	};
	public numExtensions():number
	{
		return this.data.numExtens;
	};
	public getExtName(N:number):string
	{
		return this.data.extData[N].name;
	};
	public getExtType(N:number):string
	{
		return this.data.extData[N].type;
	};
	public getExtData(N:number):string
	{
		return this.data.extData[N].data;
	};
	public setExtName(N:number, val:string)
	{
		this.data.extData[N].name = val;
	};
	public setExtType(N:number, val:string)
	{
		this.data.extData[N].type = val;
	};
	public setExtData(N:number, val:string)
	{
		this.data.extData[N].data = val;
	};
	public appendExtension(name:string, type:string, data:string):number
	{
		this.data.numExtens++;
		this.data.extData.push({'name': name, 'type': type, 'data':data});
		return this.data.numExtens - 1;
	};
	public deleteExtension(N:number)
	{
		this.data.extData.splice(N, 1);
	};
	public colName(N:number):string
	{
		return this.data.colData[N].name;
	};
	public colType(N:number):string
	{
		return this.data.colData[N].type;
	};
	public colDescr(N:number):string
	{
		return this.data.colData[N].descr;
	};
	public isNull(RN:number, CN:number):boolean
	{
		return this.data.rowData[RN][CN] == null;
	};
	public getMolecule(RN:number, CN:number):string
	{
		return this.data.rowData[RN][CN];
	};
	public getString(RN:number, CN:number):string
	{
		return this.data.rowData[RN][CN];
	};
	public getInteger(RN:number, CN:number):number
	{
		return this.data.rowData[RN][CN];
	};
	public getReal(RN:number, CN:number):number
	{
		return this.data.rowData[RN][CN];
	};
	public getBoolean(RN:number, CN:number):boolean
	{
		return this.data.rowData[RN][CN];
	};
	public getExtend(RN:number, CN:number):string
	{
		return this.data.rowData[RN][CN];
	};
	public setToNull(RN:number, CN:number)
	{
		this.data.rowData[RN][CN] = null;
	};
	public setMolecule(RN:number, CN:number, val:string)
	{
		this.data.rowData[RN][CN] = val;
	};
	public setString(RN:number, CN:number, val:string)
	{
		this.data.rowData[RN][CN] = val;
	};
	public setInteger(RN:number, CN:number, val:number)
	{
		this.data.rowData[RN][CN] = val;
	};
	public setReal(RN:number, CN:number, val:number)
	{
		this.data.rowData[RN][CN] = val;
	};
	public setBoolean(RN:number, CN:number, val:boolean)
	{
		this.data.rowData[RN][CN] = val;
	};
	public setExtend(RN:number, CN:number, val:string)
	{
		this.data.rowData[RN][CN] = val;
	};
	public isEqualMolecule(RN:number, CN:number, val:string)
	{
		if (this.isNull(RN, CN) != (val == null)) return false;
		if (val == null) return true;
		return this.getMolecule(RN, CN) == val;
	};
	public isEqualString(RN:number, CN:number, val:string)
	{
		if (this.isNull(RN, CN) != (val == null || val == '')) return false;
		if (val == null || val == '') return true;
		return this.getString(RN, CN) == val;
	};
	public isEqualInteger(RN:number, CN:number, val:number)
	{
		if (this.isNull(RN, CN) != (val == null)) return false;
		if (val == null) return true;
		return this.getInteger(RN, CN) == val;
	};
	public isEqualReal(RN:number, CN:number, val:number)
	{
		if (this.isNull(RN, CN) != (val == null)) return false;
		if (val == null) return true;
		return this.getReal(RN, CN) == val;
	};
	public isEqualBoolean(RN:number, CN:number, val:boolean)
	{
		if (this.isNull(RN, CN) != (val == null)) return false;
		if (val == null) return true;
		return this.getBoolean(RN, CN) == val;
	};
	public appendColumn(name:string, type:string, descr:string)
	{
		this.data.numCols++;
		this.data.colData.push({'name': name, 'type': type, 'descr': descr});
		for (var n = 0; n < this.data.numRows; n++) this.data.rowData[n].push(null);
		return this.data.numCols - 1;
	};
	public deleteColumn(N:number)
	{
		this.data.numCols--;
		this.data.colData.splice(N, 1);
		for (var n = 0; n < this.data.numRows; n++) this.data.rowData[n].splice(N, 1); 
	};
	public changeColumnName(N:number, name:string, descr:string)
	{
		this.data.colData[N].name = N;
		this.data.colData[N].descr = descr;
	};
	public changeColumnType(N:number, newType:string)
	{
		this.data.colData[N].type = newType;
		// (NOTE: doesn't actually do the cast conversion...)
	};
	/* !! TBD
	public abstract void reorderColumns(int[] order);
	*/
	public appendRow()
	{
		this.data.numRows++;
		var row = new Array();
		for (var n = 0; n < this.data.numCols; n++) row.push(null);
		this.data.rowData.push(row);
		return this.data.numRows - 1;
	};
	public appendRowFrom(srcDS:DataSheet, RN:number):number
	{
		this.data.numRows++;
		this.data.rowData.push(srcDS.data.rowData[RN].slice(0));
		return this.data.numRows - 1;
	};
	public insertRow(N:number)
	{
		this.data.numRows++;
		var row = new Array();
		for (var n = 0; n < this.data.numCols; n++) row.push(null);
		this.data.rowData.splice(N, 0, row);
	};
	public deleteAllRows()
	{
		this.data.numRows = 0;
		this.data.rowData = new Array();
	};
	public moveRowUp(N:number)
	{
		var row = this.data.rowData[N];
		this.data.rowData[N] = this.data.rowData[N - 1];
		this.data.rowData[N - 1] = row;
	};
	public moveRowDown(N:number)
	{
		var row = this.data.rowData[N];
		this.data.rowData[N] = this.data.rowData[N + 1];
		this.data.rowData[N + 1] = row;
	};
	public exciseSingleRow(N:number)
	{
		var newData =
		{
			'title': this.data.title,
			'description': this.data.description,
			'numCols': this.data.numCols,
			'numRows': 1,
			'numExtens': this.data.numExtens,
			'colData': this.data.colData.slice(0),
			'rowData': [this.data.rowData[N].slice(0)],
			'extData': this.data.extData.slice(0)
		};
		return new DataSheet(newData);
	};
	public colIsPrimitive(N:number)
	{
		var ct = this.data.colData[N].type;
		return ct == 'string' || ct == 'real' || ct == 'integer' || ct == 'boolean';
	};
	public findColByName(name:string)
	{
		for (var n = 0; n < this.data.numCols; n++) if (this.data.colData[n].name == name) return n;
		return -1;
	};
	public firstColOfType(type:string)
	{
		for (var n = 0; n < this.data.numCols; n++) if (this.data.colData[n].type == type) return n;
		return -1;
	};
}