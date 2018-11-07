/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../decl/jquery.d.ts'/>
///<reference path='../util/util.ts'/>
///<reference path='DataSheet.ts'/>

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
		//let xmlDoc = jQuery.parseXML(strXML);
		let xmlDoc = new DOMParser().parseFromString(strXML, 'application/xml');
		if (xmlDoc == null) return null;
		let root = xmlDoc.documentElement;
		if (root == null) return null;

		let ds = new DataSheet();

		// overview
		let summary = findNode(root, 'Summary');
		if (summary == null) return null;
		ds.setTitle(nodeText(findNode(summary, 'Title')));
		ds.setDescription(nodeText(findNode(summary, 'Description')));
		
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
				ds.appendExtension(ext.getAttribute("name"), ext.getAttribute("type"), nodeText(ext));
			}
		}

		// header: columns
		let header = findNode(root, 'Header');
		let numCols = parseInt(header.getAttribute("ncols")), numRows = parseInt(header.getAttribute("nrows"));
		let colList = findNodes(header, 'Column');
		if (colList.length != numCols) return null;
		for (let n = 0; n < numCols; n++)
		{
			let col = colList[n];
			let id = parseInt(col.getAttribute("id"));
			if (id != n + 1) return null;
			ds.appendColumn(col.getAttribute("name"), col.getAttribute("type"), nodeText(col));
		}
		
		// rows
		let row = findNode(root, 'Content').firstElementChild; 
		let rowidx = 0;
		while (row)
		{
			//if (parseInt(row.attributes.id.value)!=rowidx+1) return null;
			if (parseInt(row.getAttribute("id")) != rowidx + 1) return null;
			
			ds.appendRow();
			
			let col = row.firstElementChild;
			while (col)
			{
				let colidx = parseInt(col.getAttribute("id")) - 1;
				let ct = ds.colType(colidx), val = nodeText(col);

				if (val == '') {}
				else if (ct == DataSheet.COLTYPE_MOLECULE) ds.setObject(rowidx, colidx, val);
				else if (ct == DataSheet.COLTYPE_STRING) ds.setString(rowidx, colidx, val);
				else if (ct == DataSheet.COLTYPE_REAL) ds.setReal(rowidx, colidx, parseFloat(val));
				else if (ct == DataSheet.COLTYPE_INTEGER) ds.setInteger(rowidx, colidx, parseInt(val));
				else if (ct == DataSheet.COLTYPE_BOOLEAN) ds.setBoolean(rowidx, colidx, val == 'true' ? true : val == 'false' ? false : null);
				else if (ct == DataSheet.COLTYPE_EXTEND) ds.setExtend(rowidx, colidx, val);
			
				col = col.nextElementSibling;
				colidx++;
			}
			
			row = row.nextElementSibling;
			rowidx++;
		}

		return ds;
	}

	// static method: converts a datasheet into an XML-formatted string
	public static writeXML(ds:DataSheet):string
	{
		let xml = new DOMParser().parseFromString('<DataSheet/>', 'text/xml');
		
		// summary area
		let summary = xml.createElement('Summary');
		xml.documentElement.appendChild(summary);
		let title = xml.createElement('Title'), descr = xml.createElement('Description');
		summary.appendChild(title); title.appendChild(xml.createTextNode(ds.getTitle()));
		summary.appendChild(descr); descr.appendChild(xml.createCDATASection(ds.getDescription()));
		
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
				else if (ct == DataSheet.COLTYPE_MOLECULE) 
				{
					let obj = ds.getObject(r, c);
					if (obj instanceof Molecule) obj = MoleculeStream.writeNative(obj);
					txtNode = xml.createCDATASection(<string>obj);
				}
				else if (ct == DataSheet.COLTYPE_STRING) txtNode = xml.createCDATASection(ds.getString(r, c));
				else if (ct == DataSheet.COLTYPE_REAL) txtNode = xml.createTextNode(ds.getReal(r, c).toString());
				else if (ct == DataSheet.COLTYPE_INTEGER) txtNode = xml.createTextNode(ds.getInteger(r, c).toString());
				else if (ct == DataSheet.COLTYPE_BOOLEAN) txtNode = xml.createTextNode(ds.getBoolean(r, c).toString());
				else if (ct == DataSheet.COLTYPE_EXTEND) txtNode = xml.createCDATASection(ds.getExtend(r, c));
							
				if (txtNode != null) cell.appendChild(txtNode);
			}
		}
		
		return new XMLSerializer().serializeToString(xml.documentElement);		
	};
}

/* EOF */ }