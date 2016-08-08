/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

/*
	Serialisation and deserialisation utilities for the DataSheet object.

	Note that the DataSheet class has a JSON property (.data) that is already suitable for sending back and forth
	between the server when a JSON-formatted datasheet is required.
*/

class DataSheetStream
{
	// static method: reads in a string that is presumed to XML, and converts it to a datasheet, which is returned; returns null if
	// something went wrong
	public static readXML(strXML:string):DataSheet
	{
		var xmlDoc = jQuery.parseXML(strXML);
		if (xmlDoc == null) return null;
		var root = xmlDoc.documentElement;
		if (root == null) return null;

		var ds = new DataSheet();

		// overview
		var summary = findNode(root, 'Summary');
		if (summary == null) return null;
		ds.setTitle(nodeText(findNode(summary, 'Title')));
		ds.setDescription(nodeText(findNode(summary, 'Description')));
		
		// extensions
		var extRoot = findNode(root, 'Extension');
		if (extRoot != null)
		{
			//var extList=goog.dom.xml.selectNodes(extRoot,'Ext');
			var extList = findNodes(extRoot, 'Ext');
			for (var n = 0; n < extList.length; n++)
			{
				var ext = extList[n];
				//ds.appendExtension(ext.attributes.name.value,ext.attributes.type.value,nodeText(ext));
				ds.appendExtension(ext.getAttribute("name"), ext.getAttribute("type"), nodeText(ext));
			}
		}

		// header: columns
		var header = findNode(root, 'Header');
		var numCols = parseInt(header.getAttribute("ncols")), numRows = parseInt(header.getAttribute("nrows"));
		var colList = findNodes(header, 'Column');
		if (colList.length != numCols) return null;
		for (var n = 0; n < numCols; n++)
		{
			var col = colList[n];
			var id = parseInt(col.getAttribute("id"));
			if (id != n + 1) return null;
			ds.appendColumn(col.getAttribute("name"), col.getAttribute("type"), nodeText(col));
		}
		
		// rows
		var row = findNode(root, 'Content').firstElementChild; 
		var rowidx = 0;
		while (row)
		{
			//if (parseInt(row.attributes.id.value)!=rowidx+1) return null;
			if (parseInt(row.getAttribute("id")) != rowidx + 1) return null;
			
			ds.appendRow();
			
			var col = row.firstElementChild;
			while (col)
			{
				var colidx = parseInt(col.getAttribute("id")) - 1;
				var ct = ds.colType(colidx), val = nodeText(col);

				if (val == '') {}
				else if (ct == DataSheet.COLTYPE_MOLECULE) ds.setMolecule(rowidx, colidx, val);
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
		var xml = new DOMParser().parseFromString('<DataSheet/>', 'text/xml');
		
		// summary area
		var summary = xml.createElement('Summary');
		xml.documentElement.appendChild(summary);
		var title = xml.createElement('Title'), descr = xml.createElement('Description');
		summary.appendChild(title); title.appendChild(xml.createTextNode(ds.getTitle()));
		summary.appendChild(descr); descr.appendChild(xml.createCDATASection(ds.getDescription()));
		
		// extras
		var extension = xml.createElement('Extension');
		xml.documentElement.appendChild(extension);
		for (var n = 0; n < ds.numExtensions(); n++)
		{
			var ext = xml.createElement('Ext');
			extension.appendChild(ext);
			ext.setAttribute('name', ds.getExtName(n));
			ext.setAttribute('type', ds.getExtType(n));
			ext.appendChild(xml.createCDATASection(ds.getExtData(n)));
		}
		
		// columns
		var header = xml.createElement('Header');
		xml.documentElement.appendChild(header);
		header.setAttribute('nrows', ds.numRows().toString());
		header.setAttribute('ncols', ds.numCols().toString());
		for (var n = 0; n < ds.numCols(); n++)
		{
			var column = xml.createElement('Column');
			header.appendChild(column);
			column.setAttribute('id', (n + 1).toString());
			column.setAttribute('name', ds.colName(n));
			column.setAttribute('type', ds.colType(n));
			column.appendChild(xml.createTextNode(ds.colDescr(n)));
		}
		
		// rows
		var content = xml.createElement('Content');
		xml.documentElement.appendChild(content);
		for (var r = 0; r < ds.numRows(); r++)
		{
			var row = xml.createElement('Row');
			row.setAttribute('id', (r + 1).toString());
			content.appendChild(row);

			for (var c = 0; c < ds.numCols(); c++)
			{
				var cell = xml.createElement('Cell');
				cell.setAttribute('id', (c + 1).toString());
				row.appendChild(cell);
				var ct = ds.colType(c);
				
				var txtNode:Node = null;
				if (ds.isNull(r, c)) {}
				else if (ct == DataSheet.COLTYPE_MOLECULE) txtNode = xml.createCDATASection(ds.getMolecule(r, c));
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