/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	Serialisation and deserialisation utilities for the DataSheet object.

	Note that the DataSheet class has a JSON property (.data) that is already suitable for sending back and forth
	between the server when a JSON-formatted datasheet is required.
*/

export class DataSheetStream
{
	// static method: reads in a string that is presumed to XML, and converts it to a datasheet, which is returned; returns null if
	// something went wrong
	public static readXML(strXML:string):DataSheet
	{
		let xmlDoc:Document;
		if (XML.customParser)
			xmlDoc = new XML.customParser().parseFromString(strXML, 'application/xml');
		else
			xmlDoc = new DOMParser().parseFromString(strXML, 'application/xml');
		if (xmlDoc == null) return null;
		let root = xmlDoc.documentElement;
		if (root == null) return null;

		let ds = new DataSheet();

		// overview
		let summary = findNode(root, 'Summary');
		if (summary == null) return null;
		ds.title = nodeText(findNode(summary, 'Title'));
		ds.description = nodeText(findNode(summary, 'Description'));

		// extensions
		let extRoot = findNode(root, 'Extension');
		if (extRoot != null)
		{
			//let extList=goog.dom.xml.selectNodes(extRoot,'Ext');
			let extList = findNodes(extRoot, 'Ext');
			for (let n = 0; n < extList.length; n++)
			{
				let ext = extList[n];
				//ds.appendExtension(ext.attributes.name.value,ext.attributes.type.value,nodeText(ext));
				ds.appendExtension(ext.getAttribute('name'), ext.getAttribute('type'), nodeText(ext));
			}
		}

		// header: columns
		let header = findNode(root, 'Header');
		let numCols = parseInt(header.getAttribute('ncols'));//, numRows = parseInt(header.getAttribute('nrows'));
		let colList = findNodes(header, 'Column');
		if (colList.length != numCols) return null;
		for (let n = 0; n < numCols; n++)
		{
			let col = colList[n];
			let id = parseInt(col.getAttribute('id'));
			if (id != n + 1) return null;
			ds.appendColumn(col.getAttribute('name'), col.getAttribute('type') as DataSheetColumn, nodeText(col));
		}

		// rows
		let rowidx = 0;
		for (let row of findNodes(findNode(root, 'Content'), 'Row'))
		{
			if (parseInt(row.getAttribute('id')) != rowidx + 1) return null;

			ds.appendRow();

			for (let col of findNodes(row, 'Cell'))
			{
				let colidx = parseInt(col.getAttribute('id')) - 1;
				let ct = ds.colType(colidx), val = nodeText(col);

				if (val == '') {}
				else if (ct == DataSheetColumn.Molecule) ds.setObject(rowidx, colidx, val);
				else if (ct == DataSheetColumn.String) ds.setString(rowidx, colidx, val);
				else if (ct == DataSheetColumn.Real) ds.setReal(rowidx, colidx, parseFloat(val));
				else if (ct == DataSheetColumn.Integer) ds.setInteger(rowidx, colidx, parseInt(val));
				else if (ct == DataSheetColumn.Boolean) ds.setBoolean(rowidx, colidx, val == 'true' ? true : val == 'false' ? false : null);
				else if (ct == DataSheetColumn.Extend) ds.setExtend(rowidx, colidx, val);

				col = col.nextElementSibling;
				colidx++;
			}

			row = row.nextElementSibling;
			rowidx++;
		}

		return ds;
	}

	// instantiate with a JSON object, which is basically the title, description, columns, rows & extensions
	public static readJSON(json:Record<string, any>):DataSheet
	{
		if (!json.colData || !json.rowData) throw 'Not a JSON-formatted datasheet.';
		return new DataSheet(deepClone(json));
	}

	// static method: converts a datasheet into an XML-formatted string
	public static writeXML(ds:DataSheet):string
	{
		//let xml = new DOMParser().parseFromString('<DataSheet/>', 'text/xml');
		let xml:Document;
		if (XML.customParser)
			xml = new XML.customParser().parseFromString('<DataSheet/>', 'application/xml');
		else
			xml = new DOMParser().parseFromString('<DataSheet/>', 'application/xml');

		// summary area
		let summary = xml.createElement('Summary');
		xml.documentElement.appendChild(summary);
		let title = xml.createElement('Title'), descr = xml.createElement('Description');
		summary.appendChild(title); title.appendChild(xml.createTextNode(ds.title));
		summary.appendChild(descr); descr.appendChild(xml.createCDATASection(ds.description));

		// extras
		let extension = xml.createElement('Extension');
		xml.documentElement.appendChild(extension);
		for (let n = 0; n < ds.numExtensions; n++)
		{
			let ext = xml.createElement('Ext');
			extension.appendChild(ext);
			ext.setAttribute('name', ds.getExtName(n));
			ext.setAttribute('type', ds.getExtType(n));
			ext.appendChild(xml.createCDATASection(ds.getExtData(n)));
		}

		// columns
		let header = xml.createElement('Header');
		xml.documentElement.appendChild(header);
		header.setAttribute('nrows', ds.numRows.toString());
		header.setAttribute('ncols', ds.numCols.toString());
		for (let n = 0; n < ds.numCols; n++)
		{
			let column = xml.createElement('Column');
			header.appendChild(column);
			column.setAttribute('id', (n + 1).toString());
			column.setAttribute('name', ds.colName(n));
			column.setAttribute('type', ds.colType(n));
			column.appendChild(xml.createTextNode(ds.colDescr(n)));
		}

		// rows
		let content = xml.createElement('Content');
		xml.documentElement.appendChild(content);
		for (let r = 0; r < ds.numRows; r++)
		{
			let row = xml.createElement('Row');
			row.setAttribute('id', (r + 1).toString());
			content.appendChild(row);

			for (let c = 0; c < ds.numCols; c++)
			{
				let cell = xml.createElement('Cell');
				cell.setAttribute('id', (c + 1).toString());
				row.appendChild(cell);
				let ct = ds.colType(c);

				let txtNode:Node = null;
				if (ds.isNull(r, c)) {}
				else if (ct == DataSheetColumn.Molecule)
				{
					let obj = ds.getObject(r, c);
					if (obj instanceof Molecule) obj = MoleculeStream.writeNative(obj);
					txtNode = xml.createCDATASection(obj as string);
				}
				else if (ct == DataSheetColumn.String) txtNode = xml.createCDATASection(ds.getString(r, c));
				else if (ct == DataSheetColumn.Real) txtNode = xml.createTextNode(ds.getReal(r, c).toString());
				else if (ct == DataSheetColumn.Integer) txtNode = xml.createTextNode(ds.getInteger(r, c).toString());
				else if (ct == DataSheetColumn.Boolean) txtNode = xml.createTextNode(ds.getBoolean(r, c).toString());
				else if (ct == DataSheetColumn.Extend) txtNode = xml.createCDATASection(ds.getExtend(r, c));

				if (txtNode != null) cell.appendChild(txtNode);
			}
		}

		if (XML.customSerial)
			return new XML.customSerial().serializeToString(xml.documentElement);
		else
			return new XMLSerializer().serializeToString(xml.documentElement);
	}

	// make a serialisation-ready JSON object with the datasheet content of interest
	public static writeJSON(ds:DataSheet):any
	{
		let data = (ds as any).data; // bogarting private member

		let nrow = ds.numRows, ncol = ds.numCols;
		let rowData:any[][] = new Array(nrow);
		for (let n = 0; n < nrow; n++) rowData[n] = new Array(ncol);
		for (let c = 0; c < ncol; c++)
		{
			let doConvert = ds.colType(c) == DataSheetColumn.Molecule;
			for (let r = 0; r < nrow; r++)
			{
				let val = data.rowData[r][c];
				if (val != null && doConvert) val = val.toString(); // turns {mol-or-string} into {string}
				rowData[r][c] = val;
			}
		}

		let json =
		{
			title: data.title,
			description: data.description,
			colData: deepClone(data.colData),
			rowData: rowData,
			extData: deepClone(data.extData),
		};
		return json;
	}

}

/* EOF */ }