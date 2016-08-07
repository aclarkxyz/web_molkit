var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var DataSheet = (function () {
    function DataSheet(data) {
        if (!data)
            data = {};
        if (!data.title)
            data.title = '';
        if (!data.description)
            data.description = '';
        if (data.numCols == null)
            data.numCols = 0;
        if (data.numRows == null)
            data.numRows = 0;
        if (data.numExtens == null)
            data.numExtens = 0;
        if (data.colData == null)
            data.colData = [];
        if (data.rowData == null)
            data.rowData = [];
        if (data.extData == null)
            data.extData = [];
        this.data = data;
    }
    ;
    DataSheet.prototype.getData = function () {
        return this.data;
    };
    ;
    DataSheet.prototype.numCols = function () {
        return this.data.numCols;
    };
    ;
    DataSheet.prototype.numRows = function () {
        return this.data.numRows;
    };
    ;
    DataSheet.prototype.getTitle = function () {
        return this.data.title;
    };
    ;
    DataSheet.prototype.getDescription = function () {
        return this.data.description;
    };
    ;
    DataSheet.prototype.setTitle = function (val) {
        this.data.title = val;
    };
    ;
    DataSheet.prototype.setDescription = function (val) {
        this.data.description = val;
    };
    ;
    DataSheet.prototype.numExtensions = function () {
        return this.data.numExtens;
    };
    ;
    DataSheet.prototype.getExtName = function (N) {
        return this.data.extData[N].name;
    };
    ;
    DataSheet.prototype.getExtType = function (N) {
        return this.data.extData[N].type;
    };
    ;
    DataSheet.prototype.getExtData = function (N) {
        return this.data.extData[N].data;
    };
    ;
    DataSheet.prototype.setExtName = function (N, val) {
        this.data.extData[N].name = val;
    };
    ;
    DataSheet.prototype.setExtType = function (N, val) {
        this.data.extData[N].type = val;
    };
    ;
    DataSheet.prototype.setExtData = function (N, val) {
        this.data.extData[N].data = val;
    };
    ;
    DataSheet.prototype.appendExtension = function (name, type, data) {
        this.data.numExtens++;
        this.data.extData.push({ 'name': name, 'type': type, 'data': data });
        return this.data.numExtens - 1;
    };
    ;
    DataSheet.prototype.deleteExtension = function (N) {
        this.data.extData.splice(N, 1);
    };
    ;
    DataSheet.prototype.colName = function (N) {
        return this.data.colData[N].name;
    };
    ;
    DataSheet.prototype.colType = function (N) {
        return this.data.colData[N].type;
    };
    ;
    DataSheet.prototype.colDescr = function (N) {
        return this.data.colData[N].descr;
    };
    ;
    DataSheet.prototype.isNull = function (RN, CN) {
        return this.data.rowData[RN][CN] == null;
    };
    ;
    DataSheet.prototype.getMolecule = function (RN, CN) {
        return this.data.rowData[RN][CN];
    };
    ;
    DataSheet.prototype.getString = function (RN, CN) {
        return this.data.rowData[RN][CN];
    };
    ;
    DataSheet.prototype.getInteger = function (RN, CN) {
        return this.data.rowData[RN][CN];
    };
    ;
    DataSheet.prototype.getReal = function (RN, CN) {
        return this.data.rowData[RN][CN];
    };
    ;
    DataSheet.prototype.getBoolean = function (RN, CN) {
        return this.data.rowData[RN][CN];
    };
    ;
    DataSheet.prototype.getExtend = function (RN, CN) {
        return this.data.rowData[RN][CN];
    };
    ;
    DataSheet.prototype.setToNull = function (RN, CN) {
        this.data.rowData[RN][CN] = null;
    };
    ;
    DataSheet.prototype.setMolecule = function (RN, CN, val) {
        this.data.rowData[RN][CN] = val;
    };
    ;
    DataSheet.prototype.setString = function (RN, CN, val) {
        this.data.rowData[RN][CN] = val;
    };
    ;
    DataSheet.prototype.setInteger = function (RN, CN, val) {
        this.data.rowData[RN][CN] = val;
    };
    ;
    DataSheet.prototype.setReal = function (RN, CN, val) {
        this.data.rowData[RN][CN] = val;
    };
    ;
    DataSheet.prototype.setBoolean = function (RN, CN, val) {
        this.data.rowData[RN][CN] = val;
    };
    ;
    DataSheet.prototype.setExtend = function (RN, CN, val) {
        this.data.rowData[RN][CN] = val;
    };
    ;
    DataSheet.prototype.isEqualMolecule = function (RN, CN, val) {
        if (this.isNull(RN, CN) != (val == null))
            return false;
        if (val == null)
            return true;
        return this.getMolecule(RN, CN) == val;
    };
    ;
    DataSheet.prototype.isEqualString = function (RN, CN, val) {
        if (this.isNull(RN, CN) != (val == null || val == ''))
            return false;
        if (val == null || val == '')
            return true;
        return this.getString(RN, CN) == val;
    };
    ;
    DataSheet.prototype.isEqualInteger = function (RN, CN, val) {
        if (this.isNull(RN, CN) != (val == null))
            return false;
        if (val == null)
            return true;
        return this.getInteger(RN, CN) == val;
    };
    ;
    DataSheet.prototype.isEqualReal = function (RN, CN, val) {
        if (this.isNull(RN, CN) != (val == null))
            return false;
        if (val == null)
            return true;
        return this.getReal(RN, CN) == val;
    };
    ;
    DataSheet.prototype.isEqualBoolean = function (RN, CN, val) {
        if (this.isNull(RN, CN) != (val == null))
            return false;
        if (val == null)
            return true;
        return this.getBoolean(RN, CN) == val;
    };
    ;
    DataSheet.prototype.appendColumn = function (name, type, descr) {
        this.data.numCols++;
        this.data.colData.push({ 'name': name, 'type': type, 'descr': descr });
        for (var n = 0; n < this.data.numRows; n++)
            this.data.rowData[n].push(null);
        return this.data.numCols - 1;
    };
    ;
    DataSheet.prototype.deleteColumn = function (N) {
        this.data.numCols--;
        this.data.colData.splice(N, 1);
        for (var n = 0; n < this.data.numRows; n++)
            this.data.rowData[n].splice(N, 1);
    };
    ;
    DataSheet.prototype.changeColumnName = function (N, name, descr) {
        this.data.colData[N].name = N;
        this.data.colData[N].descr = descr;
    };
    ;
    DataSheet.prototype.changeColumnType = function (N, newType) {
        this.data.colData[N].type = newType;
    };
    ;
    DataSheet.prototype.appendRow = function () {
        this.data.numRows++;
        var row = new Array();
        for (var n = 0; n < this.data.numCols; n++)
            row.push(null);
        this.data.rowData.push(row);
        return this.data.numRows - 1;
    };
    ;
    DataSheet.prototype.appendRowFrom = function (srcDS, RN) {
        this.data.numRows++;
        this.data.rowData.push(srcDS.data.rowData[RN].slice(0));
        return this.data.numRows - 1;
    };
    ;
    DataSheet.prototype.insertRow = function (N) {
        this.data.numRows++;
        var row = new Array();
        for (var n = 0; n < this.data.numCols; n++)
            row.push(null);
        this.data.rowData.splice(N, 0, row);
    };
    ;
    DataSheet.prototype.deleteAllRows = function () {
        this.data.numRows = 0;
        this.data.rowData = new Array();
    };
    ;
    DataSheet.prototype.moveRowUp = function (N) {
        var row = this.data.rowData[N];
        this.data.rowData[N] = this.data.rowData[N - 1];
        this.data.rowData[N - 1] = row;
    };
    ;
    DataSheet.prototype.moveRowDown = function (N) {
        var row = this.data.rowData[N];
        this.data.rowData[N] = this.data.rowData[N + 1];
        this.data.rowData[N + 1] = row;
    };
    ;
    DataSheet.prototype.exciseSingleRow = function (N) {
        var newData = {
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
    ;
    DataSheet.prototype.colIsPrimitive = function (N) {
        var ct = this.data.colData[N].type;
        return ct == 'string' || ct == 'real' || ct == 'integer' || ct == 'boolean';
    };
    ;
    DataSheet.prototype.findColByName = function (name) {
        for (var n = 0; n < this.data.numCols; n++)
            if (this.data.colData[n].name == name)
                return n;
        return -1;
    };
    ;
    DataSheet.prototype.firstColOfType = function (type) {
        for (var n = 0; n < this.data.numCols; n++)
            if (this.data.colData[n].type == type)
                return n;
        return -1;
    };
    ;
    DataSheet.COLTYPE_MOLECULE = 'molecule';
    DataSheet.COLTYPE_STRING = 'string';
    DataSheet.COLTYPE_REAL = 'real';
    DataSheet.COLTYPE_INTEGER = 'integer';
    DataSheet.COLTYPE_BOOLEAN = 'boolean';
    DataSheet.COLTYPE_EXTEND = 'extend';
    return DataSheet;
}());
var DataSheetStream = (function () {
    function DataSheetStream() {
    }
    DataSheetStream.readXML = function (strXML) {
        var xmlDoc = jQuery.parseXML(strXML);
        if (xmlDoc == null)
            return null;
        var root = xmlDoc.documentElement;
        if (root == null)
            return null;
        var ds = new DataSheet();
        var summary = findNode(root, 'Summary');
        if (summary == null)
            return null;
        ds.setTitle(nodeText(findNode(summary, 'Title')));
        ds.setDescription(nodeText(findNode(summary, 'Description')));
        var extRoot = findNode(root, 'Extension');
        if (extRoot != null) {
            var extList = findNodes(extRoot, 'Ext');
            for (var n = 0; n < extList.length; n++) {
                var ext = extList[n];
                ds.appendExtension(ext.getAttribute("name"), ext.getAttribute("type"), nodeText(ext));
            }
        }
        var header = findNode(root, 'Header');
        var numCols = parseInt(header.getAttribute("ncols")), numRows = parseInt(header.getAttribute("nrows"));
        var colList = findNodes(header, 'Column');
        if (colList.length != numCols)
            return null;
        for (var n = 0; n < numCols; n++) {
            var col = colList[n];
            var id = parseInt(col.getAttribute("id"));
            if (id != n + 1)
                return null;
            ds.appendColumn(col.getAttribute("name"), col.getAttribute("type"), nodeText(col));
        }
        var row = findNode(root, 'Content').firstElementChild;
        var rowidx = 0;
        while (row) {
            if (parseInt(row.getAttribute("id")) != rowidx + 1)
                return null;
            ds.appendRow();
            var col = row.firstElementChild;
            while (col) {
                var colidx = parseInt(col.getAttribute("id")) - 1;
                var ct = ds.colType(colidx), val = nodeText(col);
                if (val == '') { }
                else if (ct == DataSheet.COLTYPE_MOLECULE)
                    ds.setMolecule(rowidx, colidx, val);
                else if (ct == DataSheet.COLTYPE_STRING)
                    ds.setString(rowidx, colidx, val);
                else if (ct == DataSheet.COLTYPE_REAL)
                    ds.setReal(rowidx, colidx, parseFloat(val));
                else if (ct == DataSheet.COLTYPE_INTEGER)
                    ds.setInteger(rowidx, colidx, parseInt(val));
                else if (ct == DataSheet.COLTYPE_BOOLEAN)
                    ds.setBoolean(rowidx, colidx, val == 'true' ? true : val == 'false' ? false : null);
                else if (ct == DataSheet.COLTYPE_EXTEND)
                    ds.setExtend(rowidx, colidx, val);
                col = col.nextElementSibling;
                colidx++;
            }
            row = row.nextElementSibling;
            rowidx++;
        }
        return ds;
    };
    DataSheetStream.writeXML = function (ds) {
        var xml = new DOMParser().parseFromString('<DataSheet/>', 'text/xml');
        var summary = xml.createElement('Summary');
        xml.documentElement.appendChild(summary);
        var title = xml.createElement('Title'), descr = xml.createElement('Description');
        summary.appendChild(title);
        title.appendChild(xml.createTextNode(ds.getTitle()));
        summary.appendChild(descr);
        descr.appendChild(xml.createCDATASection(ds.getDescription()));
        var extension = xml.createElement('Extension');
        xml.documentElement.appendChild(extension);
        for (var n = 0; n < ds.numExtensions(); n++) {
            var ext = xml.createElement('Ext');
            extension.appendChild(ext);
            ext.setAttribute('name', ds.getExtName(n));
            ext.setAttribute('type', ds.getExtType(n));
            ext.appendChild(xml.createCDATASection(ds.getExtData(n)));
        }
        var header = xml.createElement('Header');
        xml.documentElement.appendChild(header);
        header.setAttribute('nrows', ds.numRows().toString());
        header.setAttribute('ncols', ds.numCols().toString());
        for (var n = 0; n < ds.numCols(); n++) {
            var column = xml.createElement('Column');
            header.appendChild(column);
            column.setAttribute('id', (n + 1).toString());
            column.setAttribute('name', ds.colName(n));
            column.setAttribute('type', ds.colType(n));
            column.appendChild(xml.createTextNode(ds.colDescr(n)));
        }
        var content = xml.createElement('Content');
        xml.documentElement.appendChild(content);
        for (var r = 0; r < ds.numRows(); r++) {
            var row = xml.createElement('Row');
            row.setAttribute('id', (r + 1).toString());
            content.appendChild(row);
            for (var c = 0; c < ds.numCols(); c++) {
                var cell = xml.createElement('Cell');
                cell.setAttribute('id', (c + 1).toString());
                row.appendChild(cell);
                var ct = ds.colType(c);
                var txtNode = null;
                if (ds.isNull(r, c)) { }
                else if (ct == DataSheet.COLTYPE_MOLECULE)
                    txtNode = xml.createCDATASection(ds.getMolecule(r, c));
                else if (ct == DataSheet.COLTYPE_STRING)
                    txtNode = xml.createCDATASection(ds.getString(r, c));
                else if (ct == DataSheet.COLTYPE_REAL)
                    txtNode = xml.createTextNode(ds.getReal(r, c).toString());
                else if (ct == DataSheet.COLTYPE_INTEGER)
                    txtNode = xml.createTextNode(ds.getInteger(r, c).toString());
                else if (ct == DataSheet.COLTYPE_BOOLEAN)
                    txtNode = xml.createTextNode(ds.getBoolean(r, c).toString());
                else if (ct == DataSheet.COLTYPE_EXTEND)
                    txtNode = xml.createCDATASection(ds.getExtend(r, c));
                if (txtNode != null)
                    cell.appendChild(txtNode);
            }
        }
        return new XMLSerializer().serializeToString(xml.documentElement);
    };
    ;
    return DataSheetStream;
}());
var FormatList = (function () {
    function FormatList() {
    }
    FormatList.FMT_NATIVE = 'native';
    FormatList.FMT_XMLDS = 'xmlds';
    FormatList.FMT_MDLMOL = 'mdlmol';
    FormatList.FMT_MDLSDF = 'mdlsdf';
    FormatList.FMT_MDLRDF = 'mdlrdf';
    FormatList.FMT_MDLRXN = 'mdlrxn';
    FormatList.GFX_PNG = 'png';
    FormatList.GFX_PNGZIP = 'pngzip';
    FormatList.GFX_SVG = 'svg';
    FormatList.GFX_SVGZIP = 'svgzip';
    FormatList.GFX_PDF = 'pdf';
    FormatList.GFX_PDFZIP = 'pdfzip';
    FormatList.GFX_EPS = 'eps';
    FormatList.GFX_HTML = 'html';
    FormatList.GFX_OPENDOC_ODG = 'odg';
    FormatList.GFX_OPENDOC_ODT = 'odt';
    FormatList.GFX_OPENDOC_ODS = 'ods';
    FormatList.GFX_OOXML_DOCX = 'docx';
    FormatList.GFX_OOXML_XLSX = 'xlsx';
    FormatList.FORMAT_DESCR = {
        'native': 'SketchEl Molecule',
        'xmlds': 'DataSheet XML',
        'mdlmol': 'MDL MOL (single molecule)',
        'mdlsdf': 'MDL SDF (molecules + data)',
        'mdlrdf': 'MDL RDF (reactions + data)',
        'mdlrxn': 'MDL RXN (single reaction)',
        'png': 'PNG image (raster)',
        'pngzip': 'ZIP (multiple PNG files)',
        'svg': 'SVG picture (vector)',
        'svgzip': 'ZIP (multiple SVG files)',
        'pdf': 'PDF diagram (vector)',
        'pdfzip': 'ZIP (multiple PDF files)',
        'eps': 'Encapsulated PostScript (vector)',
        'html': 'HTML with embedded SVG',
        'odg': 'OpenDocument Graphic',
        'odt': 'OpenDocument Text',
        'ods': 'OpenDocument SpreadSheet',
        'docx': 'Microsoft Word',
        'xlsx': 'Microsoft Excel'
    };
    FormatList.FORMAT_EXTN = {
        'native': '.el',
        'xmlds': '.ds',
        'mdlmol': '.mol',
        'mdlsdf': '.sdf',
        'mdlrdf': '.rdf',
        'mdlrxn': '.rxn',
        'png': '.png',
        'pngzip': '_png.zip',
        'svg': '.svg',
        'svgzip': '_svg.zip',
        'pdf': '.pdf',
        'pdfzip': '_pdf.zip',
        'eps': '.eps',
        'html': '.html',
        'odg': '.odg',
        'odt': '.odt',
        'ods': '.ods',
        'docx': '.docx',
        'xlsx': '.xlsx'
    };
    FormatList.FORMAT_MIMETYPE = {
        'native': 'chemical/x-sketchel',
        'xmlds': 'chemical/x-datasheet',
        'mdlmol': 'chemical/x-mdl-molfile',
        'mdlsdf': 'chemical/x-mdl-sdfile',
        'mdlrdf': 'chemical/x-mdl-rdfile',
        'mdlrxn': 'chemical/x-mdl-rxnfile',
        'png': 'image/png',
        'pngzip': 'application/zip',
        'svg': 'image/png',
        'svgzip': 'application/zip',
        'pdf': 'application/pdf',
        'pdfzip': 'application/zip',
        'eps': 'image/eps',
        'html': 'text/html',
        'odg': 'application/vnd.oasis.opendocument.graphics',
        'odt': 'application/vnd.oasis.opendocument.text',
        'ods': 'application/vnd.oasis.opendocument.spreadsheet',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    return FormatList;
}());
var Atom = (function () {
    function Atom() {
    }
    return Atom;
}());
var Bond = (function () {
    function Bond() {
    }
    return Bond;
}());
var Molecule = (function () {
    function Molecule() {
        this.atoms = [];
        this.bonds = [];
        this.keepTransient = false;
        this.hasTransient = false;
        this.graph = null;
        this.graphBond = null;
        this.setAtomElement = function (idx, element) {
            this.getAtom(idx).element = element;
            this.trashTransient();
        };
        this.setAtomPos = function (idx, x, y) {
            var a = this.getAtom(idx);
            a.x = x;
            a.y = y;
            this.trashTransient();
        };
        this.setAtomX = function (idx, x) {
            this.getAtom(idx).x = x;
            this.trashTransient();
        };
        this.setAtomY = function (idx, y) {
            this.getAtom(idx).y = y;
            this.trashTransient();
        };
        this.setAtomCharge = function (idx, charge) {
            this.getAtom(idx).charge = charge;
            this.trashTransient();
        };
        this.setAtomUnpaired = function (idx, unpaired) {
            this.getAtom(idx).unpaired = unpaired;
            this.trashTransient();
        };
        this.setAtomIsotope = function (idx, isotope) {
            this.getAtom(idx).isotope = isotope;
            this.trashTransient();
        };
        this.setAtomHExplicit = function (idx, hExplicit) {
            this.getAtom(idx).hExplicit = hExplicit;
            this.trashTransient();
        };
        this.setAtomMapNum = function (idx, mapNum) {
            this.getAtom(idx).mapNum = mapNum;
            this.trashTransient();
        };
        this.setAtomExtra = function (idx, extra) {
            this.getAtom(idx).extra = extra.slice(0);
        };
        this.setAtomTransient = function (idx, transi) {
            this.getAtom(idx).transient = transi.slice(0);
            if (transi.length > 0)
                this.hasTransient = true;
        };
    }
    Molecule.prototype.clone = function () { return Molecule.fromString(this.toString()); };
    Molecule.fromString = function (strData) { return MoleculeStream.readNative(strData); };
    Molecule.prototype.toString = function () { return MoleculeStream.writeNative(this); };
    Molecule.prototype.numAtoms = function () { return this.atoms.length; };
    Molecule.prototype.getAtom = function (idx) {
        if (idx < 1 || idx > this.atoms.length)
            throw "Molecule.getAtom: index " + idx + " out of range (#atoms=" + this.atoms.length + ")";
        ;
        return this.atoms[idx - 1];
    };
    Molecule.prototype.atomElement = function (idx) { return this.getAtom(idx).element; };
    Molecule.prototype.atomX = function (idx) { return this.getAtom(idx).x; };
    Molecule.prototype.atomY = function (idx) { return this.getAtom(idx).y; };
    Molecule.prototype.atomCharge = function (idx) { return this.getAtom(idx).charge; };
    Molecule.prototype.atomUnpaired = function (idx) { return this.getAtom(idx).unpaired; };
    Molecule.prototype.atomIsotope = function (idx) { return this.getAtom(idx).isotope; };
    Molecule.prototype.atomHExplicit = function (idx) { return this.getAtom(idx).hExplicit; };
    Molecule.prototype.atomMapNum = function (idx) { return this.getAtom(idx).mapNum; };
    Molecule.prototype.atomExtra = function (idx) { return this.getAtom(idx).extra.slice(0); };
    Molecule.prototype.atomTransient = function (idx) { return this.getAtom(idx).transient.slice(0); };
    Molecule.prototype.numBonds = function () { return this.bonds.length; };
    Molecule.prototype.getBond = function (idx) {
        if (idx < 1 || idx > this.bonds.length)
            throw "Molecule.getBond: index " + idx + " out of range (#bonds=" + this.bonds.length + ")";
        ;
        return this.bonds[idx - 1];
    };
    Molecule.prototype.bondFrom = function (idx) { return this.getBond(idx).from; };
    Molecule.prototype.bondTo = function (idx) { return this.getBond(idx).to; };
    Molecule.prototype.bondOrder = function (idx) { return this.getBond(idx).order; };
    Molecule.prototype.bondType = function (idx) { return this.getBond(idx).type; };
    Molecule.prototype.bondExtra = function (idx) { return this.getBond(idx).extra.slice(0); };
    Molecule.prototype.bondTransient = function (idx) { return this.getBond(idx).transient.slice(0); };
    Molecule.prototype.addAtom = function (element, x, y, charge, unpaired) {
        if (charge === void 0) { charge = 0; }
        if (unpaired === void 0) { unpaired = 0; }
        var a = new Atom();
        a.element = element;
        a.x = x;
        a.y = y;
        a.charge = charge;
        a.unpaired = unpaired;
        a.isotope = Molecule.ISOTOPE_NATURAL;
        a.hExplicit = Molecule.HEXPLICIT_UNKNOWN;
        a.mapNum = 0;
        a.extra = [];
        a.transient = [];
        this.atoms.push(a);
        this.trashTransient();
        this.trashGraph();
        return this.atoms.length;
    };
    Molecule.prototype.addBond = function (from, to, order, type) {
        if (type === void 0) { type = Molecule.BONDTYPE_NORMAL; }
        var b = new Bond();
        b.from = from;
        b.to = to;
        b.order = order;
        b.type = type;
        b.extra = [];
        b.transient = [];
        this.bonds.push(b);
        this.trashTransient();
        this.trashGraph();
        return this.bonds.length;
    };
    Molecule.prototype.setBondFrom = function (idx, from) {
        this.getBond(idx).from = from;
        this.trashTransient();
        this.trashGraph();
    };
    Molecule.prototype.setBondTo = function (idx, to) {
        this.getBond(idx).to = to;
        this.trashTransient();
        this.trashGraph();
    };
    Molecule.prototype.setBondOrder = function (idx, order) {
        this.getBond(idx).order = order;
        this.trashTransient();
    };
    Molecule.prototype.setBondType = function (idx, type) {
        this.getBond(idx).type = type;
        this.trashTransient();
    };
    Molecule.prototype.setBondExtra = function (idx, extra) {
        this.getBond(idx).extra = extra.slice(0);
    };
    Molecule.prototype.setBondTransient = function (idx, transi) {
        this.getBond(idx).transient = transi.slice(0);
        if (transi.length > 0)
            this.hasTransient = true;
    };
    Molecule.prototype.deleteAtomAndBonds = function (idx) {
        for (var n = this.numBonds(); n >= 1; n--) {
            if (this.bondFrom(n) == idx || this.bondTo(n) == idx)
                this.deleteBond(n);
            else {
                if (this.bondFrom(n) > idx)
                    this.setBondFrom(n, this.bondFrom(n) - 1);
                if (this.bondTo(n) > idx)
                    this.setBondTo(n, this.bondTo(n) - 1);
            }
        }
        this.atoms.splice(idx - 1, 1);
        this.trashTransient();
        this.trashGraph();
    };
    Molecule.prototype.deleteBond = function (idx) {
        this.bonds.splice(idx - 1, 1);
        this.trashTransient();
        this.trashGraph();
    };
    Molecule.prototype.atomHydrogens = function (idx) {
        var HYVALENCE_EL = ['C', 'N', 'O', 'S', 'P'];
        var HYVALENCE_VAL = [4, 3, 2, 2, 3];
        var hy = this.atomHExplicit(idx);
        if (hy != Molecule.HEXPLICIT_UNKNOWN)
            return hy;
        for (var n = 0; n < HYVALENCE_EL.length; n++)
            if (HYVALENCE_EL[n] == this.atomElement(idx)) {
                hy = HYVALENCE_VAL[n];
                break;
            }
        if (hy == Molecule.HEXPLICIT_UNKNOWN)
            return 0;
        var ch = this.atomCharge(idx);
        if (this.atomElement(idx) == 'C')
            ch = -Math.abs(ch);
        hy += ch - this.atomUnpaired(idx);
        var adjBonds = this.atomAdjBonds(idx);
        for (var n = 0; n < adjBonds.length; n++)
            hy -= this.bondOrder(adjBonds[n]);
        return hy < 0 ? 0 : hy;
    };
    Molecule.prototype.findBond = function (a1, a2) {
        for (var n = 1; n <= this.numBonds(); n++) {
            var b1 = this.bondFrom(n), b2 = this.bondTo(n);
            if ((a1 == b1 && a2 == b2) || (a1 == b2 && a2 == b1))
                return n;
        }
        return 0;
    };
    Molecule.prototype.bondOther = function (idx, ref) {
        var b1 = this.bondFrom(idx), b2 = this.bondTo(idx);
        if (b1 == ref)
            return b2;
        if (b2 == ref)
            return b1;
        return 0;
    };
    Molecule.prototype.atomAdjCount = function (idx) {
        this.buildGraph();
        return this.graph[idx - 1].length;
    };
    Molecule.prototype.atomAdjList = function (idx) {
        this.buildGraph();
        var adj = this.graph[idx - 1].slice(0);
        for (var n = adj.length - 1; n >= 0; n--)
            adj[n]++;
        return adj;
    };
    Molecule.prototype.atomAdjBonds = function (idx) {
        this.buildGraph();
        return this.graphBond[idx - 1].slice(0);
    };
    Molecule.prototype.compareTo = function (other) {
        if (other == null || other.numAtoms() == 0)
            return this.numAtoms() == 0 ? 0 : 1;
        if (this.numAtoms() < other.numAtoms())
            return -1;
        if (this.numAtoms() > other.numAtoms())
            return 1;
        if (this.numBonds() < other.numBonds())
            return -1;
        if (this.numBonds() > other.numBonds())
            return 1;
        for (var n = 1; n <= this.numAtoms(); n++) {
            if (this.atomElement(n) < other.atomElement(n))
                return -1;
            if (this.atomElement(n) > other.atomElement(n))
                return 1;
            if (this.atomX(n) < other.atomX(n))
                return -1;
            if (this.atomX(n) > other.atomX(n))
                return 1;
            if (this.atomY(n) < other.atomY(n))
                return -1;
            if (this.atomY(n) > other.atomY(n))
                return 1;
            if (this.atomCharge(n) < other.atomCharge(n))
                return -1;
            if (this.atomCharge(n) > other.atomCharge(n))
                return 1;
            if (this.atomUnpaired(n) < other.atomUnpaired(n))
                return -1;
            if (this.atomUnpaired(n) > other.atomUnpaired(n))
                return 1;
            if (this.atomHExplicit(n) < other.atomHExplicit(n))
                return -1;
            if (this.atomHExplicit(n) > other.atomHExplicit(n))
                return 1;
            if (this.atomIsotope(n) < other.atomIsotope(n))
                return -1;
            if (this.atomIsotope(n) > other.atomIsotope(n))
                return 1;
            if (this.atomMapNum(n) < other.atomMapNum(n))
                return -1;
            if (this.atomMapNum(n) > other.atomMapNum(n))
                return 1;
            var tx1 = this.atomExtra(n), tx2 = other.atomExtra(n);
            if (tx1.length < tx2.length)
                return -1;
            if (tx1.length > tx2.length)
                return 1;
            for (var i = 0; i < tx1.length; i++)
                if (tx1[i] < tx2[i])
                    return -1;
                else if (tx1[i] > tx2[i])
                    return 1;
            tx1 = this.atomTransient(n);
            tx2 = other.atomTransient(n);
            if (tx1.length < tx2.length)
                return -1;
            if (tx1.length > tx2.length)
                return 1;
            for (var i = 0; i < tx1.length; i++)
                if (tx1[i] < tx2[i])
                    return -1;
                else if (tx1[i] > tx2[i])
                    return 1;
        }
        for (var n = 1; n <= this.numBonds(); n++) {
            if (this.bondFrom(n) < other.bondFrom(n))
                return -1;
            if (this.bondFrom(n) > other.bondFrom(n))
                return 1;
            if (this.bondTo(n) < other.bondTo(n))
                return -1;
            if (this.bondTo(n) > other.bondTo(n))
                return 1;
            if (this.bondOrder(n) < other.bondOrder(n))
                return -1;
            if (this.bondOrder(n) > other.bondOrder(n))
                return 1;
            if (this.bondType(n) < other.bondType(n))
                return -1;
            if (this.bondType(n) > other.bondType(n))
                return 1;
            var tx1 = this.bondExtra(n), tx2 = other.bondExtra(n);
            if (tx1.length < tx2.length)
                return -1;
            if (tx1.length > tx2.length)
                return 1;
            for (var i = 0; i < tx1.length; i++)
                if (tx1[i] < tx2[i])
                    return -1;
                else if (tx1[i] > tx2[i])
                    return 1;
            tx1 = this.bondTransient(n);
            tx2 = other.bondTransient(n);
            if (tx1.length < tx2.length)
                return -1;
            if (tx1.length > tx2.length)
                return 1;
            for (var i = 0; i < tx1.length; i++)
                if (tx1[i] < tx2[i])
                    return -1;
                else if (tx1[i] > tx2[i])
                    return 1;
        }
        return 0;
    };
    Molecule.prototype.trashGraph = function () {
        this.graph = null;
        this.graphBond = null;
    };
    Molecule.prototype.trashTransient = function () {
        if (this.keepTransient || !this.hasTransient)
            return;
        for (var _i = 0, _a = this.atoms; _i < _a.length; _i++) {
            var a = _a[_i];
            a.transient = [];
        }
        for (var _b = 0, _c = this.bonds; _b < _c.length; _b++) {
            var b = _c[_b];
            b.transient = [];
        }
        this.hasTransient = false;
    };
    Molecule.prototype.buildGraph = function () {
        if (this.graph != null && this.graphBond != null)
            return;
        var graph = [], graphBond = [];
        var na = this.numAtoms(), nb = this.numBonds();
        for (var n = 0; n < na; n++) {
            graph.push([]);
            graphBond.push([]);
        }
        for (var n = 1; n <= nb; n++) {
            var b = this.getBond(n);
            graph[b.from - 1].push(b.to - 1);
            graph[b.to - 1].push(b.from - 1);
            graphBond[b.from - 1].push(n);
            graphBond[b.to - 1].push(n);
        }
        this.graph = graph;
        this.graphBond = graphBond;
    };
    Molecule.IDEALBOND = 1.5;
    Molecule.HEXPLICIT_UNKNOWN = -1;
    Molecule.ISOTOPE_NATURAL = 0;
    Molecule.BONDTYPE_NORMAL = 0;
    Molecule.BONDTYPE_INCLINED = 1;
    Molecule.BONDTYPE_DECLINED = 2;
    Molecule.BONDTYPE_UNKNOWN = 3;
    return Molecule;
}());
var MoleculeStream = (function () {
    function MoleculeStream() {
    }
    MoleculeStream.readNative = function (strData) {
        var mol = new Molecule();
        mol.keepTransient = true;
        var lines = strData.split(/\r?\n/);
        if (lines.length < 2)
            return null;
        if (!lines[0].startsWith('SketchEl!') && lines.length >= 4 && lines[3].indexOf('V2000') >= 0) {
            var i = strData.indexOf('SketchEl!');
            if (i < 0)
                return null;
            lines = strData.substring(i).split(/r?\n/);
        }
        var bits = lines[0].match(/^SketchEl\!\((\d+)\,(\d+)\)/);
        if (!bits)
            return null;
        var numAtoms = parseInt(bits[1]), numBonds = parseInt(bits[2]);
        if (lines.length < 2 + numAtoms + numBonds)
            return null;
        if (!lines[1 + numAtoms + numBonds].match(/^!End/))
            return null;
        for (var n = 0; n < numAtoms; n++) {
            bits = lines[1 + n].split(/[=,;]/);
            var num = mol.addAtom(bits[0], parseFloat(bits[1]), parseFloat(bits[2]), parseInt(bits[3]), parseInt(bits[4]));
            var extra = [], trans = [];
            for (var i = 5; i < bits.length; i++) {
                var ch = bits[i].charAt(0);
                if (bits[i].charAt(0) == 'i') { }
                else if (bits[i].charAt(0) == 'e')
                    mol.setAtomHExplicit(num, parseInt(bits[i].substring(1)));
                else if (bits[i].charAt(0) == 'm')
                    mol.setAtomIsotope(num, parseInt(bits[i].substring(1)));
                else if (bits[i].charAt(0) == 'n')
                    mol.setAtomMapNum(num, parseInt(bits[i].substring(1)));
                else if (bits[i].charAt(0) == 'x')
                    extra.push(MoleculeStream.sk_unescape(bits[i]));
                else if (bits[i].charAt(0) == 'y')
                    trans.push(MoleculeStream.sk_unescape(bits[i]));
                else
                    extra.push(MoleculeStream.sk_unescape(bits[i]));
            }
            mol.setAtomExtra(num, extra);
            mol.setAtomTransient(num, trans);
        }
        for (var n = 0; n < numBonds; n++) {
            bits = lines[1 + numAtoms + n].split(/[-=,]/);
            var num = mol.addBond(parseInt(bits[0]), parseInt(bits[1]), parseInt(bits[2]), parseInt(bits[3]));
            var extra = new Array(), trans = new Array();
            for (var i = 4; i < bits.length; i++) {
                var ch = bits[i].charAt(0);
                if (bits[i].charAt(0) == 'x')
                    extra.push(MoleculeStream.sk_unescape(bits[i]));
                else if (bits[i].charAt(0) == 'y')
                    trans.push(MoleculeStream.sk_unescape(bits[i]));
                else
                    extra.push(MoleculeStream.sk_unescape(bits[i]));
            }
            mol.setBondExtra(num, extra);
            mol.setBondTransient(num, trans);
        }
        mol.keepTransient = false;
        return mol;
    };
    MoleculeStream.writeNative = function (mol) {
        var ret = 'SketchEl!(' + mol.numAtoms() + ',' + mol.numBonds() + ')\n';
        for (var n = 1; n <= mol.numAtoms(); n++) {
            var el = mol.atomElement(n), x = mol.atomX(n), y = mol.atomY(n), charge = mol.atomCharge(n), unpaired = mol.atomUnpaired(n);
            var hy = mol.atomHExplicit(n) != Molecule.HEXPLICIT_UNKNOWN ? ('e' + mol.atomHExplicit(n)) : ('i' + mol.atomHydrogens(n));
            ret += MoleculeStream.sk_escape(el) + '=' + x.toFixed(4) + ',' + y.toFixed(4) + ';' + charge + ',' + unpaired + ',' + hy;
            if (mol.atomIsotope(n) != Molecule.ISOTOPE_NATURAL)
                ret += ',m' + mol.atomIsotope(n);
            if (mol.atomMapNum(n) > 0)
                ret += ',n' + mol.atomMapNum(n);
            ret += MoleculeStream.sk_encodeExtra(mol.atomExtra(n));
            ret += MoleculeStream.sk_encodeExtra(mol.atomTransient(n));
            ret += '\n';
        }
        for (var n = 1; n <= mol.numBonds(); n++) {
            ret += mol.bondFrom(n) + '-' + mol.bondTo(n) + '=' + mol.bondOrder(n) + ',' + mol.bondType(n);
            ret += MoleculeStream.sk_encodeExtra(mol.bondExtra(n));
            ret += MoleculeStream.sk_encodeExtra(mol.bondTransient(n));
            ret += '\n';
        }
        ret += '!End\n';
        return ret;
    };
    ;
    MoleculeStream.sk_unescape = function (str) {
        var ret = '', match;
        while (match = str.match(/^(.*?)\\([0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f])(.*)/)) {
            ret += match[1] + String.fromCharCode(parseInt("0x" + match[2]));
            str = match[3];
        }
        return ret + str;
    };
    ;
    MoleculeStream.sk_escape = function (str) {
        var ret = '';
        for (var n = 0; n < str.length; n++) {
            var ch = str.charAt(n), code = str.charCodeAt(n);
            if (code <= 32 || code > 127 || ch == '\\' || ch == ',' || ch == ';' || ch == '=') {
                var hex = (code & 0xFFFF).toString(16).toUpperCase();
                ret += '\\';
                for (var i = 4 - hex.length; i > 0; i--)
                    ret += '0';
                ret += hex;
            }
            else
                ret += ch;
        }
        return ret;
    };
    ;
    MoleculeStream.sk_encodeExtra = function (extra) {
        var ret = '';
        for (var n = 0; n < extra.length; n++)
            ret += ',' + MoleculeStream.sk_escape(extra[n]);
        return ret;
    };
    ;
    return MoleculeStream;
}());
var MolUtil = (function () {
    function MolUtil() {
    }
    MolUtil.isBlank = function (mol) {
        return mol == null || mol.numAtoms() == 0;
    };
    MolUtil.notBlank = function (mol) {
        return mol != null || mol.numAtoms() > 0;
    };
    MolUtil.TEMPLATE_ATTACHMENT = "X";
    MolUtil.ABBREV_ATTACHMENT = "*";
    return MolUtil;
}());
var RenderPolicy = (function () {
    function RenderPolicy(data) {
        if (!data) {
            data =
                {
                    'name': 'default',
                    'pointScale': 20,
                    'resolutionDPI': 100,
                    'fontSize': 0.65,
                    'lineSize': 0.075,
                    'bondSep': 0.2,
                    'defaultPadding': 0.2,
                    'foreground': 0x000000,
                    'background': 0xFFFFFF,
                    'atomCols': new Array(112)
                };
            for (var n = 0; n <= 111; n++)
                data.atomCols[n] = 0x000000;
            this.data = data;
        }
        else {
            this.data = clone(data);
        }
    }
    ;
    RenderPolicy.defaultBlackOnWhite = function () {
        var policy = new RenderPolicy();
        return policy;
    };
    RenderPolicy.defaultWhiteOnBlack = function () {
        var policy = new RenderPolicy();
        policy.data.foreground = 0xFFFFFF;
        policy.data.background = 0x000000;
        for (var n = 0; n <= 111; n++)
            policy.data.atomCols[n] = 0xFFFFFF;
        return policy;
    };
    RenderPolicy.defaultColourOnWhite = function () {
        var policy = RenderPolicy.defaultBlackOnWhite();
        policy.data.atomCols[0] = 0x404040;
        policy.data.atomCols[1] = 0x808080;
        policy.data.atomCols[6] = 0x000000;
        policy.data.atomCols[7] = 0x0000FF;
        policy.data.atomCols[8] = 0xFF0000;
        policy.data.atomCols[9] = 0xFF8080;
        policy.data.atomCols[15] = 0xFF8000;
        policy.data.atomCols[16] = 0x808000;
        policy.data.atomCols[17] = 0x00C000;
        policy.data.atomCols[35] = 0xC04000;
        return policy;
    };
    RenderPolicy.defaultColourOnBlack = function () {
        var policy = RenderPolicy.defaultWhiteOnBlack();
        policy.data.atomCols[0] = 0xA0A0A0;
        policy.data.atomCols[1] = 0x808080;
        policy.data.atomCols[6] = 0xFFFFFF;
        policy.data.atomCols[7] = 0x4040FF;
        policy.data.atomCols[8] = 0xFF4040;
        policy.data.atomCols[9] = 0xFF8080;
        policy.data.atomCols[15] = 0xFF8000;
        policy.data.atomCols[16] = 0xFFFF00;
        policy.data.atomCols[17] = 0x40FF40;
        policy.data.atomCols[35] = 0xFF8040;
        return policy;
    };
    RenderPolicy.defaultPrintedPublication = function () {
        var policy = RenderPolicy.defaultBlackOnWhite();
        policy.data.pointScale = 9.6;
        policy.data.resolutionDPI = 600;
        policy.data.fontSize = 0.80;
        policy.data.bondSep = 0.27;
        policy.data.lineSize = 0.0625;
        return policy;
    };
    return RenderPolicy;
}());
var RenderEffects = (function () {
    function RenderEffects() {
    }
    return RenderEffects;
}());
var SketchUtil = (function () {
    function SketchUtil() {
    }
    SketchUtil.proposeNewRing = function (mol, rsz, x, y, dx, dy, snap) {
        var theta = Math.atan2(dy, dx);
        if (snap) {
            var chunk = 30 * DEGRAD;
            theta = Math.round(theta / chunk) * chunk;
        }
        return SketchUtil.positionSimpleRing(mol, rsz, x, y, theta);
    };
    SketchUtil.proposeAtomRing = function (mol, rsz, atom, dx, dy) {
        var thsnap = [];
        var cx = mol.atomX(atom), cy = mol.atomY(atom);
        if (mol.atomAdjCount(atom) == 0) {
            for (var n = 0; n < 12; n++)
                thsnap.push(TWOPI * n / 12);
        }
        else if (mol.atomAdjCount(atom) == 1) {
            var nbr = mol.atomAdjList(atom)[0];
            thsnap.push(angleNorm(Math.atan2(mol.atomY(nbr) - cy, mol.atomX(nbr) - cx) + Math.PI));
        }
        else {
            var angs = [];
            for (var _i = 0, _a = mol.atomAdjList(atom); _i < _a.length; _i++) {
                var nbr = _a[_i];
                angs.push(Math.atan2(mol.atomY(nbr) - cy, mol.atomX(nbr) - cx));
            }
            angs = sortAngles(angs);
            for (var n = 0; n < angs.length; n++) {
                var th1 = angs[n], th2 = angs[n < angs.length - 1 ? n + 1 : 0];
                thsnap.push(th1 + 0.5 * angleDiffPos(th2, th1));
            }
        }
        var theta = Math.atan2(dy, dx);
        var bestTheta = 0, bestDelta = Number.MAX_VALUE;
        for (var _b = 0, thsnap_1 = thsnap; _b < thsnap_1.length; _b++) {
            var th = thsnap_1[_b];
            var delta = Math.abs(angleDiff(th, theta));
            if (delta < bestDelta) {
                bestTheta = th;
                bestDelta = delta;
            }
        }
        return SketchUtil.positionSimpleRing(mol, rsz, mol.atomX(atom), mol.atomY(atom), bestTheta);
    };
    SketchUtil.proposeBondRing = function (mol, rsz, bond, dx, dy) {
        var bfr = mol.bondFrom(bond), bto = mol.bondTo(bond);
        var bx = mol.atomX(bto) - mol.atomX(bfr), by = mol.atomY(bto) - mol.atomY(bfr);
        var sign = dx * by - dy * bx;
        var delta = sign > 0 ? -90 * DEGRAD : 90 * DEGRAD;
        var theta = Math.atan2(by, bx) + delta;
        var dth = TWOPI / rsz;
        var rad = Molecule.IDEALBOND / (2.0 * Math.sin(0.5 * dth)), brad = rad * Math.cos(0.5 * dth);
        var cx = 0.5 * (mol.atomX(bfr) + mol.atomX(bto)) + brad * Math.cos(theta);
        var cy = 0.5 * (mol.atomY(bfr) + mol.atomY(bto)) + brad * Math.sin(theta);
        var rx = [], ry = [];
        for (var n = 0; n < rsz; n++) {
            var th = theta - Math.PI + (n - 0.5) * dth;
            rx.push(cx + Math.cos(th) * rad);
            ry.push(cy + Math.sin(th) * rad);
        }
        var _a = sign < 0 ? [bfr, bto] : [bto, bfr], i1 = _a[0], i2 = _a[1];
        rx[0] = mol.atomX(i1);
        ry[0] = mol.atomY(i1);
        rx[1] = mol.atomX(i2);
        ry[1] = mol.atomY(i2);
        return [rx, ry];
    };
    SketchUtil.positionSimpleRing = function (mol, rsz, x, y, theta) {
        var dth = TWOPI / rsz;
        var rad = Molecule.IDEALBOND / (2 * Math.sin(0.5 * dth));
        var cx = x + rad * Math.cos(theta), cy = y + rad * Math.sin(theta);
        var rx = [], ry = [];
        for (var n = 0; n < rsz; n++) {
            var th = theta - Math.PI + n * dth;
            rx.push(cx + Math.cos(th) * rad);
            ry.push(cy + Math.sin(th) * rad);
        }
        return [rx, ry];
    };
    return SketchUtil;
}());
var Dialog = (function () {
    function Dialog() {
        this.minPortionWidth = 80;
        this.maxPortionWidth = 80;
        this.title = 'Dialog';
    }
    Dialog.prototype.open = function () {
        var bg = $('<div></div>').appendTo(document.body);
        bg.css('width', '100%');
        bg.css('height', document.documentElement.clientHeight + 'px');
        bg.css('background-color', 'black');
        bg.css('opacity', 0.8);
        bg.css('position', 'absolute');
        bg.css('left', 0);
        bg.css('top', 0);
        this.obscureBackground = bg;
        var pb = $('<div></div>').appendTo(document.body);
        pb.css('min-width', this.minPortionWidth + '%');
        if (this.maxPortionWidth != null)
            pb.css('max-width', this.maxPortionWidth + '%');
        pb.css('background-color', 'white');
        pb.css('border-radius', '6px');
        pb.css('border', '1px solid black');
        pb.css('position', 'absolute');
        pb.css('left', (50 - 0.5 * this.minPortionWidth) + '%');
        pb.css('top', (document.body.scrollTop + 50) + 'px');
        pb.css('min-height', '50%');
        this.panelBoundary = pb;
        var tdiv = $('<div></div>').appendTo(pb);
        tdiv.css('width', '100%');
        tdiv.css('background-color', '#F0F0F0');
        tdiv.css('background-image', 'linear-gradient(to right bottom, #FFFFFF, #E0E0E0)');
        tdiv.css('border-bottom', '1px solid #C0C0C0');
        tdiv.css('border-radius', '6px 6px 0 0');
        tdiv.css('margin', 0);
        tdiv.css('padding', 0);
        this.titleDiv = tdiv;
        var bdiv = $('<div"></div>').appendTo(pb);
        bdiv.css('width', '100%');
        this.bodyDiv = $('<div style="padding: 0.5em;"></div>').appendTo(bdiv);
        var ttlTable = $('<table></table>').appendTo(tdiv), tr = $('<tr></tr>').appendTo(ttlTable);
        ttlTable.attr('width', '100%');
        ttlTable.css('padding', '0.5em');
        var tdTitle = $('<td valign="center"></td>').appendTo(tr);
        tdTitle.append('<b><big>' + escapeHTML(this.title) + '</big></b>');
        var tdButtons = $('<td align="right" valign="center"></td>').appendTo(tr);
        this.btnClose = $('<button class="button button-default">Close</button>').appendTo(tdButtons);
        var self = this;
        this.btnClose.click(function () { self.close(); });
        this.titleButtons = tdButtons;
        this.populate();
        this.repositionSize();
        bg.show();
        pb.show();
    };
    Dialog.prototype.close = function () {
        this.panelBoundary.remove();
        this.obscureBackground.remove();
    };
    Dialog.prototype.bump = function () {
        this.repositionSize();
    };
    Dialog.prototype.body = function () { return this.bodyDiv; };
    Dialog.prototype.buttons = function () { return this.titleButtons; };
    Dialog.prototype.populate = function () {
        this.body().text('Empty dialog box.');
    };
    Dialog.prototype.repositionSize = function () {
        var docW = $(window).width(), dlgW = this.panelBoundary.width();
        this.panelBoundary.css('left', (0.5 * (docW - dlgW)) + 'px');
    };
    return Dialog;
}());
var Widget = (function () {
    function Widget() {
        this.content = null;
    }
    Widget.prototype.render = function (parent) {
        this.content = $('<div></div>').appendTo($(parent));
    };
    Widget.prototype.addTooltip = function (bodyHTML, titleHTML) {
        addTooltip(this.content, bodyHTML, titleHTML);
    };
    return Widget;
}());
var OptionList = (function (_super) {
    __extends(OptionList, _super);
    function OptionList(options, isVertical) {
        if (isVertical === void 0) { isVertical = false; }
        _super.call(this);
        this.options = options;
        this.isVertical = isVertical;
        this.selidx = 0;
        this.buttonDiv = [];
        this.auxCell = [];
        this.callback = null;
        if (options.length == 0)
            throw 'molsync.ui.OptionList: must provide a list of option labels.';
    }
    OptionList.prototype.onSelect = function (callback, master) {
        this.callback = callback;
        this.master = master;
    };
    OptionList.prototype.getSelectedIndex = function () {
        return this.selidx;
    };
    ;
    OptionList.prototype.getSelectedValue = function () {
        return this.options[this.selidx];
    };
    ;
    OptionList.prototype.getAuxiliaryCell = function (idx) {
        return this.auxCell[idx];
    };
    ;
    OptionList.prototype.render = function (parent) {
        _super.prototype.render.call(this, parent);
        var table = $('<table class="option-table"></table>').appendTo(this.content);
        var tr = this.isVertical ? null : $('<tr></tr>').appendTo(table);
        var _loop_1 = function() {
            if (this_1.isVertical)
                tr = $('<tr></tr>').appendTo(table);
            var td = $('<td class="option-cell"></td>').appendTo(tr);
            var div = $('<div class="option"></div>').appendTo(td);
            if (n != this_1.selidx)
                div.addClass('option-unselected');
            else
                div.addClass('option-selected');
            var txt = this_1.options[n];
            if (txt.length == 0 && n == this_1.selidx)
                div.append('\u00A0\u2716\u00A0');
            else if (txt.length == 0)
                div.append('\u00A0\u00A0\u00A0');
            else
                div.append(txt);
            if (n != this_1.selidx) {
                div.mouseover(function () { $(this).addClass('option-hover'); });
                div.mouseout(function () { $(this).removeClass('option-hover option-active'); });
                div.mousedown(function () { $(this).addClass('option-active'); });
                div.mouseup(function () { $(this).removeClass('option-active'); });
                div.mouseleave(function () { $(this).removeClass('option-hover option-active'); });
                div.mousemove(function () { return false; });
                var idx_1 = n, self_1 = this_1;
                div.click(function () { self_1.clickButton(idx_1); });
            }
            this_1.buttonDiv.push(div);
            if (this_1.isVertical) {
                td = $('<td style="vertical-align: middle;"></td>').appendTo(tr);
                this_1.auxCell.push(td);
            }
        };
        var this_1 = this;
        for (var n = 0; n < this.options.length; n++) {
            _loop_1();
        }
    };
    ;
    OptionList.prototype.clickButton = function (idx) {
        if (idx == this.selidx)
            return;
        this.setSelectedIndex(idx);
        if (this.callback)
            this.callback.call(this.master, idx, this);
    };
    ;
    OptionList.prototype.setSelectedIndex = function (idx) {
        if (this.selidx == idx)
            return;
        var div = this.buttonDiv[this.selidx];
        div.attr('class', 'option option-unselected');
        if (this.options[this.selidx].length == 0)
            div.text('\u00A0\u00A0\u00A0');
        div.mouseover(function () { $(this).addClass('option-hover'); });
        div.mouseout(function () { $(this).removeClass('option-hover option-active'); });
        div.mousedown(function () { $(this).addClass('option-active'); });
        div.mouseup(function () { $(this).removeClass('option-active'); });
        div.mouseleave(function () { $(this).removeClass('option-hover option-active'); });
        div.mousemove(function () { return false; });
        var clickidx = this.selidx, self = this;
        div.click(function () { self.clickButton(clickidx); });
        this.selidx = idx;
        div = this.buttonDiv[this.selidx];
        div.attr('class', 'option option-selected');
        if (this.options[this.selidx].length == 0)
            div.text('\u00A0\u2716\u00A0');
        div.off('mouseover');
        div.off('mouseout');
        div.off('mousedown');
        div.off('mouseup');
        div.off('mouseleave');
        div.off('mousemove');
        div.off('click');
    };
    ;
    return OptionList;
}(Widget));
var RPC = (function () {
    function RPC(request, parameter, callback, master) {
        this.request = request;
        this.parameter = parameter;
        this.callback = callback;
        this.master = master;
    }
    RPC.prototype.invoke = function () {
        var data = this.parameter;
        if (data == null)
            data = {};
        var url = RPC.BASE_URL + "/REST/" + this.request;
        var self = this;
        $.ajax({
            'url': url,
            'type': 'POST',
            'data': JSON.stringify(this.parameter),
            'contentType': 'application/json;charset=utf-8',
            'dataType': 'json',
            headers: { 'Access-Control-Allow-Origin': '*' },
            success: function (data, textStatus, jqXHR) {
                var result = null, error = null;
                if (!data) {
                    error =
                        {
                            'message': 'null result',
                            'code': RPC.ERRCODE_NONSPECIFIC,
                            type: 0,
                            'detail': 'unknown failure'
                        };
                }
                else {
                    if (data.error) {
                        error =
                            {
                                'message': data.error,
                                'code': data.errorCode,
                                'type': data.errorType,
                                'detail': data.errorDetail
                            };
                        console.log('RPC error communicating with: ' + url + ', content: ' + JSON.stringify(data.error) + '\nDetail:\n' + data.errorDetail);
                    }
                    else
                        result = data.result;
                }
                self.callback.call(self.master, result, error);
            },
            error: function (jqXHR, textStatus, errorThrow) {
                var error = {
                    'message': 'connection failure',
                    'code': RPC.ERRCODE_NONSPECIFIC,
                    type: 0,
                    'detail': "unable to obtain result from service: {$url}"
                };
                self.callback.call(self.master, {}, error);
            }
        });
    };
    RPC.BASE_URL = null;
    RPC.ERRCODE_CLIENT_ABORTED = -3;
    RPC.ERRCODE_CLIENT_TIMEOUT = -1;
    RPC.ERRCODE_CLIENT_OTHER = -1;
    RPC.ERRCODE_NONSPECIFIC = 0;
    RPC.ERRCODE_UNKNOWN = 1;
    RPC.ERRCODE_NOSUCHUSER = 2;
    RPC.ERRCODE_INVALIDLOGIN = 3;
    RPC.ERRCODE_INVALIDTOKEN = 4;
    RPC.ERRCODE_DATASHEETUNAVAIL = 5;
    RPC.ERRCODE_INVALIDCOMMAND = 6;
    RPC.ERRCODE_ROWDATAUNAVAIL = 7;
    RPC.ERRCODE_MISSINGPARAM = 8;
    return RPC;
}());
var Func = (function () {
    function Func() {
    }
    Func.renderStructure = function (input, callback, master) {
        new RPC('func.renderStructure', input, callback, master).invoke();
    };
    Func.arrangeMolecule = function (input, callback, master) {
        new RPC('func.arrangeMolecule', input, callback, master).invoke();
    };
    Func.renderRowDetail = function (input, callback, master) {
        new RPC('func.renderRowDetail', input, callback, master).invoke();
    };
    Func.renderYieldDetail = function (input, callback, master) {
        new RPC('func.renderYieldDetail', input, callback, master).invoke();
    };
    Func.composeDocument = function (input, callback, master) {
        new RPC('func.composeDocument', input, callback, master).invoke();
    };
    Func.getMoleculeProperties = function (input, callback, master) {
        new RPC('func.getMoleculeProperties', input, callback, master).invoke();
    };
    Func.atomMapping = function (input, callback, master) {
        new RPC('func.atomMapping', input, callback, master).invoke();
    };
    Func.prepareDownloadable = function (input, callback, master) {
        new RPC('func.prepareDownloadable', input, callback, master).invoke();
    };
    Func.downloadFromSource = function (input, callback, master) {
        new RPC('func.downloadFromSource', input, callback, master).invoke();
    };
    Func.getDefaultTemplateGroups = function (input, callback, master) {
        new RPC('func.getDefaultTemplateGroups', input, callback, master).invoke();
    };
    Func.getDefaultTemplateStructs = function (input, callback, master) {
        new RPC('func.getDefaultTemplateStructs', input, callback, master).invoke();
    };
    Func.getActionIcons = function (input, callback, master) {
        new RPC('func.getActionIcons', input, callback, master).invoke();
    };
    return Func;
}());
var Download = (function (_super) {
    __extends(Download, _super);
    function Download(tokenID) {
        _super.call(this);
        this.tokenID = tokenID;
        this.mol = null;
        this.ds = null;
        this.policy = RenderPolicy.defaultColourOnWhite();
        this.formatKey = [];
        this.formatGfx = [];
    }
    ;
    Download.openTransientMolecule = function (tokenID, mol) {
        var dlg = new Download(tokenID);
        dlg.mol = mol;
        dlg.title = 'Download Molecule';
        dlg.open();
        return dlg;
    };
    ;
    Download.prototype.populate = function () {
        var body = this.body();
        var self = this;
        this.mainArea = $('<p>Setting up...</p>').appendTo(body);
        var paraBtn = $('<p align="right"></p>').appendTo(body);
        this.downloadArea = $('<span style="padding-right: 2em;"></span>').appendTo(paraBtn);
        this.btnPrepare = $('<button class="button button-primary">Prepare</button>').appendTo(paraBtn);
        this.btnPrepare.click(function () { self.clickPrepare(); });
        if (this.mol != null) {
            this.formatKey.push(FormatList.FMT_NATIVE);
            this.formatGfx.push(false);
            this.formatKey.push(FormatList.FMT_MDLMOL);
            this.formatGfx.push(false);
            this.formatKey.push(FormatList.GFX_PNG);
            this.formatGfx.push(true);
            this.formatKey.push(FormatList.GFX_SVG);
            this.formatGfx.push(true);
            this.formatKey.push(FormatList.GFX_PDF);
            this.formatGfx.push(true);
            this.formatKey.push(FormatList.GFX_EPS);
            this.formatGfx.push(true);
        }
        else if (this.ds != null) {
            var isReaction = false, isExperiment = false;
            for (var n = 0; n < this.ds.numExtensions(); n++) {
                if (this.ds.getExtType(n) == 'org.mmi.aspect.Reaction')
                    isReaction = true;
                if (this.ds.getExtType(n) == 'org.mmi.aspect.Experiment')
                    isExperiment = true;
            }
            this.formatKey.push(FormatList.FMT_XMLDS);
            this.formatGfx.push(false);
            if (!isReaction) {
                this.formatKey.push(FormatList.FMT_MDLSDF);
                this.formatGfx.push(false);
            }
            if (isReaction) {
                this.formatKey.push(FormatList.FMT_MDLRDF);
                this.formatGfx.push(false);
                if (this.ds.numRows() == 1) {
                    this.formatKey.push(FormatList.FMT_MDLRXN);
                    this.formatGfx.push(false);
                }
            }
            if (this.ds.numRows() == 1 || isExperiment) {
                if (!isReaction && this.ds.firstColOfType(DataSheet.COLTYPE_MOLECULE) >= 0) {
                    this.formatKey.push(FormatList.FMT_NATIVE);
                    this.formatGfx.push(false);
                    this.formatKey.push(FormatList.FMT_MDLMOL);
                    this.formatGfx.push(false);
                }
                this.formatKey.push(FormatList.GFX_PNG);
                this.formatGfx.push(true);
                this.formatKey.push(FormatList.GFX_SVG);
                this.formatGfx.push(true);
                this.formatKey.push(FormatList.GFX_EPS);
                this.formatGfx.push(true);
                this.formatKey.push(FormatList.GFX_PDF);
                this.formatGfx.push(true);
            }
            this.formatKey.push(FormatList.GFX_PNGZIP);
            this.formatGfx.push(true);
            this.formatKey.push(FormatList.GFX_SVGZIP);
            this.formatGfx.push(true);
            this.formatKey.push(FormatList.GFX_PDFZIP);
            this.formatGfx.push(true);
            this.formatKey.push(FormatList.GFX_HTML);
            this.formatGfx.push(true);
        }
        this.formatKey.push(FormatList.GFX_OOXML_DOCX);
        this.formatGfx.push(true);
        this.formatKey.push(FormatList.GFX_OOXML_XLSX);
        this.formatGfx.push(true);
        this.fillContent();
    };
    Download.prototype.clickPrepare = function () {
        var input = { 'tokenID': this.tokenID };
        input.format = this.formatKey[this.optFormatList.getSelectedIndex()];
        input.policy = clone(this.policy.data);
        var sizeType = this.optSizeType.getSelectedValue();
        if (sizeType == 'Scale') {
            input.policy.pointScale = this.lineScale.val();
        }
        else if (sizeType == 'Box') {
            input.policy.pointScale = this.lineBoxMaxScale.val();
            input.box = [this.lineBoxWidth.val(), this.lineBoxHeight.val()];
        }
        this.btnPrepare.prop('disabled', true);
        if (this.mol != null) {
            input.molNative = this.mol.toString();
        }
        else if (this.ds != null) {
            input.dataXML = DataSheetStream.writeXML(this.ds);
        }
        Func.prepareDownloadable(input, this.downloadContent, this);
    };
    Download.prototype.fillContent = function () {
        var input = { 'tokenID': this.tokenID };
        input.policy = this.policy.data;
        if (this.mol != null) {
            input.molNative = this.mol.toString();
        }
        else if (this.ds != null) {
            input.dataXML = DataSheetStream.writeXML(this.ds);
            input.dataRow = 0;
        }
        Func.renderStructure(input, this.updateStructure, this);
    };
    Download.prototype.updateStructure = function (result, error) {
        if (!result) {
            alert('Request failed: ' + error.message);
            return;
        }
        var metavec = result.metavec;
        if (this.pictureArea == null)
            this.buildDisplay();
        this.pictureArea.empty();
        var w = metavec.size[0], h = metavec.size[1], padding = 2, scale = 1;
        if (w > 700) {
            var mod = 700 / w;
            scale *= mod;
            w *= mod;
            h *= mod;
        }
        if (h > 500) {
            var mod = 500 / h;
            scale *= mod;
            w *= mod;
            h *= mod;
        }
        var cw = Math.ceil(w) + 2 * padding, ch = Math.ceil(h) + 2 * padding;
        var canvas = newElement(this.pictureArea, 'canvas', { 'width': cw, 'height': ch });
        var density = pixelDensity();
        canvas.width = cw * density;
        canvas.height = ch * density;
        canvas.style.width = cw + 'px';
        canvas.style.height = ch + 'px';
        var ctx = canvas.getContext('2d');
        ctx.save();
        ctx.scale(density, density);
        var grad = ctx.createLinearGradient(0, 0, cw, ch);
        if (this.policy.data.background != 0x000000) {
            grad.addColorStop(0, colourCode(0xF8F8F8));
            grad.addColorStop(1, colourCode(0xE0E0E0));
        }
        else {
            grad.addColorStop(0, colourCode(0x404040));
            grad.addColorStop(1, colourCode(0x101010));
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, h + ch);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, cw - 1, ch - 1);
        var draw = new MetaVector(metavec);
        draw.offsetX = padding;
        draw.offsetY = padding;
        draw.scale = scale;
        draw.renderContext(ctx);
        var isExperiment = false;
        if (this.ds != null) {
            for (var n = 0; n < this.ds.numExtensions(); n++)
                if (this.ds.getExtType(n) == 'org.mmi.aspect.Experiment')
                    isExperiment = true;
        }
        if (this.ds != null && this.ds.numRows() > 1 && !isExperiment) {
            var dstxt = '... and ' + (this.ds.numRows() - 1) + ' more row' + (this.ds.numRows() == 2 ? '' : 's') + '.';
            addText(newElement(this.pictureArea, 'p'), dstxt);
        }
        ctx.restore();
    };
    ;
    Download.prototype.buildDisplay = function () {
        var self = this;
        this.mainArea.empty();
        this.pictureArea = $('<p align="center"></p>').appendTo(this.mainArea);
        this.formatArea = $('<div style="text-align: left;"></div>').appendTo(this.mainArea);
        this.graphicArea = $('<div style="text-align: left;"></div>').appendTo(this.mainArea);
        this.formatArea.append($('<h2 class="tight">Choose Format</h2>'));
        this.formatArea.append($('<hr class="thin"></hr>'));
        var optList = [];
        for (var n = 0; n < this.formatKey.length; n++)
            optList.push('');
        var optFormatList = new OptionList(optList, true);
        optFormatList.render(this.formatArea);
        for (var n = 0; n < this.formatKey.length; n++) {
            var k = this.formatKey[n];
            $(optFormatList.getAuxiliaryCell(n)).append('\u00A0' + FormatList.FORMAT_DESCR[k]);
        }
        optFormatList.onSelect(function (idx) { this.changeFormat(idx); }, this);
        this.graphicArea.append($('<h2 class="tight">Graphic Options</h2>'));
        this.graphicArea.append($('<hr class="thin"></hr>'));
        var paraSizeType = $('<p></p>').appendTo(this.graphicArea);
        var paraSizeSpec = $('<p></p>').appendTo(this.graphicArea);
        var paraRender = $('<p></p>').appendTo(this.graphicArea);
        var trSize = $('<table><tr></tr></table>').appendTo(paraSizeType).find('tr');
        trSize.append('<td style="vertical-align: middle; font-weight: bold;">Sizing: </td>');
        var optSizeType = new OptionList(['Scale', 'Box'], false);
        optSizeType.setSelectedIndex(0);
        optSizeType.render($('<td style="vertical-align: middle;"></td>').appendTo(trSize));
        optSizeType.onSelect(function (idx) { this.changeSizeType(idx); }, this);
        var divSizeScale = $('<div></div>').appendTo(paraSizeSpec);
        divSizeScale.append('<b>Angstroms-to-Points: </b>');
        var lineScale = $('<input type="text" size="6"></input>"').appendTo(divSizeScale);
        lineScale.val('30');
        var divSizeBox = $('<div style="display: none;"></div>').appendTo(paraSizeSpec);
        divSizeBox.append('<b>Width: </b>');
        var lineBoxWidth = $('<input type="text" size="6"></input>"').appendTo(divSizeBox);
        lineBoxWidth.val('400');
        divSizeBox.append('<b> Height: </b>');
        var lineBoxHeight = $('<input type="text" size="6"></input>"').appendTo(divSizeBox);
        lineBoxHeight.val('300');
        divSizeBox.append(' <b>Max Scale: </b>');
        var lineBoxMaxScale = $('<input type="text" size="6"></input>"').appendTo(divSizeBox);
        lineBoxMaxScale.val('30');
        paraRender.append('<b>Rendering: </b>');
        var selectRender = $('<select></select>').appendTo(paraRender);
        selectRender.append('<option>Black-on-White</option>');
        selectRender.append('<option>Colour-on-White</option>');
        selectRender.append('<option>White-on-Black</option>');
        selectRender.append('<option>Colour-on-Black</option>');
        selectRender.append('<option>Printed Publication</option>');
        selectRender.prop('selectedIndex', 1);
        selectRender.change(function () { self.changeRender(); });
        this.optFormatList = optFormatList;
        this.optSizeType = optSizeType;
        this.divSizeScale = divSizeScale;
        this.divSizeBox = divSizeBox;
        this.lineScale = lineScale;
        this.lineBoxWidth = lineBoxWidth;
        this.lineBoxHeight = lineBoxHeight;
        this.lineBoxMaxScale = lineBoxMaxScale;
        this.selectRender = selectRender;
    };
    Download.prototype.changeFormat = function () {
        var ftype = this.formatKey[this.optFormatList.getSelectedIndex()];
        var psz = 30;
        if (ftype == FormatList.GFX_OOXML_DOCX || ftype == FormatList.GFX_OOXML_XLSX)
            psz = 10;
        this.lineScale.val(psz.toString());
    };
    ;
    Download.prototype.changeSizeType = function (idx) {
        if (idx == 0) {
            this.divSizeScale.css('display', 'block');
            this.divSizeBox.css('display', 'none');
        }
        else {
            this.divSizeScale.css('display', 'none');
            this.divSizeBox.css('display', 'block');
        }
    };
    Download.prototype.changeRender = function () {
        var t = this.selectRender.prop('selectedIndex');
        if (t == 0)
            this.policy = RenderPolicy.defaultBlackOnWhite();
        else if (t == 1)
            this.policy = RenderPolicy.defaultColourOnWhite();
        else if (t == 2)
            this.policy = RenderPolicy.defaultWhiteOnBlack();
        else if (t == 3)
            this.policy = RenderPolicy.defaultColourOnBlack();
        else if (t == 4)
            this.policy = RenderPolicy.defaultPrintedPublication();
        var input = { 'tokenID': this.tokenID };
        input.policy = this.policy.data;
        if (this.mol != null) {
            input.molNative = this.mol.toString();
        }
        else if (this.ds != null) {
            input.dataXML = DataSheetStream.writeXML(this.ds);
            input.dataRow = 0;
        }
        Func.renderStructure(input, this.updateStructure, this);
    };
    Download.prototype.downloadContent = function (result, error) {
        this.btnPrepare.prop('disabled', false);
        if (!result) {
            alert('Request failed: ' + error.message);
            return;
        }
        var format = this.formatKey[this.optFormatList.getSelectedIndex()];
        var id = result.transientID;
        var fn = 'download' + FormatList.FORMAT_EXTN[format];
        var url = RPC.BASE_URL + '/Download/' + fn + '?transientID=' + id;
        this.downloadArea.empty();
        addText(this.downloadArea, 'Temporary download link: ');
        addText(newElement(this.downloadArea, 'a', { 'href': url, 'target': '_blank' }), fn);
    };
    Download.openTransientDataSheet = function (tokenID, ds) {
        var dlg = new Download(tokenID);
        dlg.ds = ds;
        dlg.title = 'Download DataSheet';
        dlg.open();
        return dlg;
    };
    return Download;
}(Dialog));
function newElement(parent, tag, attr) {
    var el = $("<" + tag + ">");
    if (attr)
        el.attr(attr);
    $(parent).append(el);
    return el[0];
}
function addText(parent, text) {
    var el = parent instanceof jQuery ? parent[0] : parent;
    el.appendChild(document.createTextNode(text));
}
function setVisible(node, visible) {
    if (visible)
        $(node).show();
    else
        $(node).hide();
}
function plural(count) {
    return count == 1 ? '' : 's';
}
function colourCode(col) {
    var hex = (col & 0xFFFFFF).toString(16);
    while (hex.length < 6)
        hex = '0' + hex;
    return '#' + hex;
}
function colourAlpha(col) {
    var transp = (col >>> 24) & 0xFF;
    return transp == 0 ? 1 : transp == 0xFF ? 0 : 1 - (transp * (1.0 / 255));
}
var ONE_OVER_255 = 1.0 / 255;
function colourCanvas(col) {
    if (col == 0xFFFFFF)
        return 'white';
    if (col == 0x000000)
        return 'black';
    if (col == -1)
        return undefined;
    if (col >= 0 && col <= 0xFFFFFF)
        return colourCode(col);
    var t = ((col >> 24) & 0xFF) * ONE_OVER_255;
    var r = ((col >> 16) & 0xFF);
    var g = ((col >> 8) & 0xFF);
    var b = (col & 0xFF);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + (1 - t) + ')';
}
function nodeText(node) {
    var ret = '';
    if (!node)
        return;
    node = node.firstChild;
    while (node) {
        if (node.nodeType == 3 || node.nodeType == 4)
            ret += node.nodeValue;
        node = node.nextSibling;
    }
    return ret;
}
function isDef(v) {
    return !(v === null || typeof v === 'undefined');
}
function notDef(v) {
    return v === null || typeof v === 'undefined';
}
function eventCoords(event, container) {
    var parentOffset = $(container).offset();
    var relX = event.pageX - parentOffset.left;
    var relY = event.pageY - parentOffset.top;
    return [relX, relY];
}
function norm_xy(dx, dy) {
    return Math.sqrt(dx * dx + dy * dy);
}
function norm_xyz(dx, dy, dz) {
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
function norm2_xy(dx, dy) {
    return dx * dx + dy * dy;
}
function norm2_xyz(dx, dy, dz) {
    return dx * dx + dy * dy + dz * dz;
}
function sqr(v) {
    return v * v;
}
var TWOPI = 2 * Math.PI;
var INV_TWOPI = 1.0 / TWOPI;
var DEGRAD = Math.PI / 180;
var RADDEG = 180 / Math.PI;
function angleNorm(th) {
    if (th == -Math.PI)
        return Math.PI;
    if (th < -Math.PI) {
        var mod = Math.ceil((-th - Math.PI) * INV_TWOPI);
        return th + mod * TWOPI;
    }
    if (th > Math.PI) {
        var mod = Math.ceil((th - Math.PI) * INV_TWOPI);
        return th - mod * TWOPI;
    }
    return th;
}
function angleDiff(th1, th2) {
    var theta = angleNorm(th1) - angleNorm(th2);
    return theta - (theta > Math.PI ? TWOPI : 0) + (theta <= -Math.PI ? TWOPI : 0);
}
function angleDiffPos(th1, th2) {
    var theta = angleNorm(th1) - angleNorm(th2);
    return theta + (theta < 0 ? TWOPI : 0);
}
function sortAngles(theta) {
    if (theta == null || theta.length < 2)
        return theta;
    theta = theta.slice(0);
    for (var n = 0; n < theta.length; n++)
        theta[n] = angleNorm(theta[n]);
    theta.sort();
    while (true) {
        var a = theta[theta.length - 1], b = theta[0], c = theta[1];
        if (angleDiff(b, a) <= angleDiff(c, b))
            break;
        for (var n = theta.length - 1; n > 0; n--)
            theta[n] = theta[n - 1];
        theta[0] = a;
    }
    return theta;
}
function uniqueAngles(theta, threshold) {
    theta = sortAngles(theta);
    for (var n = 1; n < theta.length; n++) {
        if (Math.abs(angleDiff(theta[n], theta[n - 1])) <= threshold) {
            theta.splice(n, 1);
            n--;
        }
    }
    return theta;
}
function minArray(a) {
    if (a == null || a.length == 0)
        return 0;
    var v = a[0];
    for (var n = 1; n < a.length; n++)
        v = Math.min(v, a[n]);
    return v;
}
function maxArray(a) {
    if (a == null || a.length == 0)
        return 0;
    var v = a[0];
    for (var n = 1; n < a.length; n++)
        v = Math.max(v, a[n]);
    return v;
}
function findNode(parent, name) {
    if (parent == null)
        return null;
    var node = parent.firstChild;
    while (node) {
        if (node.nodeType == Node.ELEMENT_NODE && node.nodeName == name)
            return node;
        node = node.nextSibling;
    }
    return null;
}
function findNodes(parent, name) {
    if (parent == null)
        return null;
    var node = parent.firstChild;
    var list = [];
    while (node) {
        if (node.nodeType == Node.ELEMENT_NODE && node.nodeName == name)
            list.push(node);
        node = node.nextSibling;
    }
    return list;
}
function pathRoundedRect(x1, y1, x2, y2, rad) {
    var path = new Path2D();
    path.moveTo(x2 - rad, y1);
    path.quadraticCurveTo(x2, y1, x2, y1 + rad);
    path.lineTo(x2, y2 - rad);
    path.quadraticCurveTo(x2, y2, x2 - rad, y2);
    path.lineTo(x1 + rad, y2);
    path.quadraticCurveTo(x1, y2, x1, y2 - rad);
    path.lineTo(x1, y1 + rad);
    path.quadraticCurveTo(x1, y1, x1 + rad, y1);
    path.closePath();
    return path;
}
function drawLine(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}
var ASCENT_FUDGE = 1.4;
function fontSansSerif(ascent) { return ascent * ASCENT_FUDGE + "px sans"; }
function pixelDensity() {
    if ('devicePixelRatio' in window && window.devicePixelRatio > 1)
        return window.devicePixelRatio;
    return 1;
}
function clone(obj) {
    var dup = {};
    for (var key in obj)
        dup[key] = obj[key];
    return dup;
}
function escapeHTML(text) {
    if (!text)
        return '';
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
}
var Cookies = (function () {
    function Cookies() {
        this.molecules = [];
        this.ASPIRIN = 'SketchEl!(13,13)\n' +
            'C=-1.6010,4.3000;0,0,i0\n' +
            'C=-2.9000,3.5500;0,0,i1\n' +
            'C=-0.3019,3.5500;0,0,i0\n' +
            'C=-2.9000,2.0500;0,0,i1\n' +
            'C=-1.6010,1.3000;0,0,i1\n' +
            'C=-0.3019,2.0500;0,0,i1\n' +
            'C=-1.6010,5.8000;0,0,i0\n' +
            'O=-0.3019,6.5500;0,0,i1\n' +
            'O=-2.9000,6.5500;0,0,i0\n' +
            'O=0.9971,4.3000;0,0,i0\n' +
            'C=2.2962,3.5500;0,0,i0\n' +
            'C=3.5952,4.3000;0,0,i3\n' +
            'O=2.2962,2.0500;0,0,i0\n' +
            '1-2=1,0\n' +
            '1-3=2,0\n' +
            '2-4=2,0\n' +
            '4-5=1,0\n' +
            '5-6=2,0\n' +
            '6-3=1,0\n' +
            '1-7=1,0\n' +
            '7-8=1,0\n' +
            '7-9=2,0\n' +
            '3-10=1,0\n' +
            '10-11=1,0\n' +
            '11-12=1,0\n' +
            '11-13=2,0\n' +
            '!End';
        this.CAFFEINE = 'SketchEl!(14,15)\n' +
            'N=-0.2062,0.7255;0,0,i0\n' +
            'C=1.0929,1.4755;0,0,i0\n' +
            'C=-1.5052,1.4755;0,0,i0\n' +
            'C=1.0929,2.9755;0,0,i0\n' +
            'C=-0.2062,3.7255;0,0,i0\n' +
            'N=-1.5052,2.9755;0,0,i0\n' +
            'N=2.5142,1.0083;0,0,i0\n' +
            'C=3.3966,2.2166;0,0,i1\n' +
            'N=2.5208,3.4370;0,0,i0\n' +
            'O=-2.8042,0.7255;0,0,i0\n' +
            'O=-0.2062,5.2255;0,0,i0\n' +
            'C=2.9896,4.8619;0,0,i3\n' +
            'C=-2.8042,3.7255;0,0,i3\n' +
            'C=-0.2062,-0.7745;0,0,i3\n' +
            '1-2=1,0\n' +
            '1-3=1,0\n' +
            '2-4=2,0\n' +
            '4-5=1,0\n' +
            '5-6=1,0\n' +
            '6-3=1,0\n' +
            '9-8=1,0\n' +
            '8-7=2,0\n' +
            '7-2=1,0\n' +
            '4-9=1,0\n' +
            '3-10=2,0\n' +
            '5-11=2,0\n' +
            '9-12=1,0\n' +
            '6-13=1,0\n' +
            '1-14=1,0\n' +
            '!End';
        this.MAX_MOL_STASH = 20;
        for (var idx = 0;; idx++) {
            var str = this.get('mol' + idx);
            if (str == null)
                break;
            var mol = Molecule.fromString(str);
            if (mol == null)
                break;
            this.molecules.push(mol);
        }
    }
    Cookies.prototype.numMolecules = function () {
        return this.molecules.length;
    };
    Cookies.prototype.getMolecule = function (idx) {
        return this.molecules[idx];
    };
    Cookies.prototype.deleteMolecule = function (idx) {
        this.molecules.splice(idx, 1);
        this.setMolecules();
    };
    Cookies.prototype.stashMolecule = function (mol) {
        if (MolUtil.isBlank(mol))
            return;
        for (var n = 0; n < this.molecules.length; n++)
            if (mol.compareTo(this.molecules[n]) == 0) {
                if (n > 0) {
                    this.molecules.splice(n, 1);
                    this.molecules.splice(0, 0, mol.clone());
                    this.setMolecules();
                }
                return;
            }
        this.molecules.splice(0, 0, mol);
        while (this.molecules.length > this.MAX_MOL_STASH)
            this.molecules.pop();
        this.setMolecules();
    };
    Cookies.prototype.promoteToTop = function (idx) {
        if (idx == 0)
            return;
        var mol = this.molecules.splice(idx, 1)[0];
        this.molecules.splice(0, 0, mol);
        this.setMolecules();
    };
    Cookies.prototype.seedMolecules = function () {
        this.molecules = [];
        this.molecules.push(Molecule.fromString(this.CAFFEINE));
        this.molecules.push(Molecule.fromString(this.ASPIRIN));
        this.setMolecules();
    };
    Cookies.prototype.setMolecules = function () {
        for (var n = 0; n < this.molecules.length; n++)
            this.set('mol' + n, this.molecules[n].toString());
        this.remove('mol' + this.molecules.length);
    };
    Cookies.prototype.get = function (key) {
        var value = "; " + document.cookie;
        var parts = value.split("; " + key + "=");
        if (parts.length == 2)
            return decodeURIComponent(parts.pop().split(";").shift());
        return null;
    };
    Cookies.prototype.set = function (key, val) {
        document.cookie = key + '=' + encodeURIComponent(val);
    };
    Cookies.prototype.remove = function (key) {
        document.cookie = key + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    };
    return Cookies;
}());
var PickRecent = (function (_super) {
    __extends(PickRecent, _super);
    function PickRecent(cookies, sides) {
        _super.call(this);
        this.cookies = cookies;
        this.sides = sides;
        this.callbackPick1 = null;
        this.masterPick1 = null;
        this.callbackPick2 = null;
        this.masterPick2 = null;
        this.tableRows = [];
        this.views = [];
        this.title = "Recent Molecules";
        this.minPortionWidth = 20;
        this.maxPortionWidth = 95;
    }
    PickRecent.prototype.onPick1 = function (callback, master) {
        this.callbackPick1 = callback;
        this.masterPick1 = master;
    };
    PickRecent.prototype.onPick2 = function (callback, master) {
        this.callbackPick2 = callback;
        this.masterPick2 = master;
    };
    PickRecent.prototype.populate = function () {
        var table = $('<table></table>').appendTo(this.body());
        var self = this;
        var _loop_2 = function(n) {
            var idx = n;
            var tr = $('<tr></tr>').appendTo(table);
            this_2.tableRows.push(tr);
            var tdHTML = '<td style="text-align: center; vertical-align: middle; padding: 0.5em;"></td>';
            var tdMol = $(tdHTML).appendTo(tr);
            var mol = this_2.cookies.getMolecule(n);
            var vs = new ViewStructure();
            this_2.views[n] = vs;
            vs.content = tdMol;
            vs.defineMolecule(mol);
            vs.borderCol = -1;
            vs.backgroundCol1 = 0xF8F8F8;
            vs.backgroundCol2 = 0xE0E0E0;
            vs.padding = 4;
            vs.setup(function () { vs.render(tdMol); this.bump(); }, this_2);
            var tdPick = $(tdHTML).appendTo(tr);
            if (this_2.sides == 1) {
                var btnPick = $('<button class="button button-primary">Pick</button>').appendTo(tdPick);
                btnPick.click(function () { self.pickMolecule(idx, 1); });
            }
            else {
                var btnPick1 = $('<button class="button button-primary">Reactant</button>').appendTo(tdPick);
                tdPick.append('&nbsp;');
                var btnPick2 = $('<button class="button button-primary">Product</button>').appendTo(tdPick);
                btnPick1.click(function () { self.pickMolecule(idx, 1); });
                btnPick2.click(function () { self.pickMolecule(idx, 2); });
            }
            tdPick.append('&nbsp;');
            var btnDelete = $('<button class="button button-default">Delete</button>').appendTo(tdPick);
            btnDelete.click(function () { self.deleteMolecule(idx); });
        };
        var this_2 = this;
        for (var n = 0; n < this.cookies.numMolecules(); n++) {
            _loop_2(n);
        }
    };
    PickRecent.prototype.pickMolecule = function (idx, which) {
        var mol = this.cookies.getMolecule(idx);
        this.cookies.promoteToTop(idx);
        if (which == 1 && this.callbackPick1)
            this.callbackPick1.call(this.masterPick1, mol);
        if (which == 2 && this.callbackPick2)
            this.callbackPick2.call(this.masterPick2, mol);
        this.close();
    };
    PickRecent.prototype.deleteMolecule = function (idx) {
        this.cookies.deleteMolecule(idx);
        this.tableRows[idx].remove();
        this.bump();
    };
    return PickRecent;
}(Dialog));
var ButtonView = (function (_super) {
    __extends(ButtonView, _super);
    function ButtonView(position, parentX, parentY, parentWidth, parentHeight) {
        _super.call(this);
        this.position = position;
        this.parentX = parentX;
        this.parentY = parentY;
        this.parentWidth = parentWidth;
        this.parentHeight = parentHeight;
        this.border = 0x808080;
        this.background = 0xFFFFFF;
        this.buttonColNorm1 = 0x47D5D2;
        this.buttonColNorm2 = 0x008FD1;
        this.buttonColActv1 = 0x30FF69;
        this.buttonColActv2 = 0x008650;
        this.buttonColSel1 = 0xFFFFFF;
        this.buttonColSel2 = 0xE0E0E0;
        this.canvas = null;
        this.stack = [];
        this.display = [];
        this.selectedButton = null;
        this.highlightButton = null;
        this.hasBigButtons = true;
        this.prefabImgSize = 44;
        this.idealSize = 50;
        this.gripHeight = 30;
        this.gripWidth = 50;
        this.isRaised = true;
        this.outPadding = 2;
        this.inPadding = 2;
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
    }
    ButtonView.prepare = function (callback, master) {
        if (ButtonView.ACTION_ICONS) {
            callback.call(master);
            return;
        }
        var fcn = function (result, error) {
            if (!result.actions) {
                alert('Fetching action icons failed: ' + error.message);
                return;
            }
            ButtonView.ACTION_ICONS = result.actions;
            callback.call(master);
        };
        Func.getActionIcons({}, fcn, this);
    };
    ButtonView.prototype.render = function (parent) {
        _super.prototype.render.call(this, parent);
        this.content.css('position', 'absolute');
        this.content.css('width', this.width + "px");
        this.content.css('height', this.height + "px");
        this.content.addClass('no_selection');
        this.layoutButtons();
        var canvasStyle = 'position: absolute; left: 0; top: 0;';
        canvasStyle += 'pointer-events: none;';
        this.canvas = newElement(this.content, 'canvas', { 'width': this.width, 'height': this.height, 'style': canvasStyle });
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        this.applyOffset();
        this.redraw();
        var self = this;
        this.content.click(function (event) { self.mouseClick(event); });
        this.content.dblclick(function (event) { self.mouseDoubleClick(event); });
        this.content.mousedown(function (event) { self.mouseDown(event); });
        this.content.mouseup(function (event) { self.mouseUp(event); });
        this.content.mouseover(function (event) { self.mouseOver(event); });
        this.content.mouseout(function (event) { self.mouseOut(event); });
        this.content.mousemove(function (event) { self.mouseMove(event); });
        this.content.keypress(function (event) { self.keyPressed(event); });
        this.content.keydown(function (event) { self.keyDown(event); });
        this.content.keyup(function (event) { self.keyUp(event); });
    };
    ButtonView.prototype.pushBank = function (bank) {
        bank.buttonView = this;
        bank.isSubLevel = this.stack.length > 0;
        bank.init();
        this.stack.push(bank);
        if (this.canvas != null) {
            this.layoutButtons();
            this.replaceCanvas();
            this.applyOffset();
            this.redraw();
        }
    };
    ButtonView.prototype.popBank = function () {
        if (this.stack.length == 0)
            return;
        this.stack[this.stack.length - 1].bankClosed();
        this.stack.length--;
        if (this.canvas != null) {
            this.layoutButtons();
            this.replaceCanvas();
            this.applyOffset();
            this.redraw();
        }
    };
    ButtonView.prototype.refreshBank = function () {
        if (this.canvas != null) {
            this.layoutButtons();
            this.replaceCanvas();
            this.applyOffset();
            this.redraw();
        }
    };
    ButtonView.prototype.getSelectedButton = function () {
        return this.selectedButton;
    };
    ButtonView.prototype.setSelectedButton = function (id) {
        if (id != this.selectedButton) {
            this.selectedButton = id;
            this.redraw();
        }
    };
    ButtonView.prototype.raiseBank = function () {
        if (this.isRaised)
            return;
        this.isRaised = true;
        if (this.content) {
            this.layoutButtons();
            this.replaceCanvas();
            this.applyOffset();
            this.redraw();
        }
    };
    ButtonView.prototype.lowerBank = function () {
        if (!this.isRaised)
            return;
        this.isRaised = false;
        if (this.content) {
            this.layoutButtons();
            this.replaceCanvas();
            this.applyOffset();
            this.redraw();
        }
    };
    ButtonView.prototype.getHasBigButtons = function () {
        return this.hasBigButtons;
    };
    ;
    ButtonView.prototype.setHasBigButtons = function (flag) {
        this.hasBigButtons = flag;
        this.prefabImgSize = flag ? 44 : 36;
        this.idealSize = flag ? 50 : 40;
    };
    ;
    ButtonView.prototype.withinOutline = function (x, y) {
        var w = this.width, h = this.height;
        if (x < 0 || x > w || y < 0 || y > h)
            return false;
        if (this.position == 'centre' || this.stack.length == 0)
            return true;
        if (this.position == 'left') {
            var my = 0.5 * h - 1, gw = this.gripHeight, hg = 0.5 * this.gripWidth;
            return x < w - gw || (y > my - hg && y < my + hg);
        }
        else if (this.position == 'right') {
            var my = 0.5 * h - 1, gw = this.gripHeight, hg = 0.5 * this.gripWidth;
            return x > gw || (y > my - hg && y < my + hg);
        }
        else if (this.position == 'top') {
            var mx = 0.5 * w - 1, gh = this.gripHeight, hg = 0.5 * this.gripWidth;
            return y < h - gh || (x > mx - hg && x < mx + hg);
        }
        else if (this.position == 'bottom') {
            var mx = 0.5 * w - 1, gh = this.gripHeight, hg = 0.5 * this.gripWidth;
            return y > gh || (x > mx - hg && x < mx + hg);
        }
        return true;
    };
    ;
    ButtonView.prototype.layoutButtons = function () {
        if (this.content == null)
            return;
        var outPadding = this.outPadding, inPadding = this.inPadding;
        this.removeDisplayButtons();
        if (this.stack.length == 0) {
            this.width = 10;
            this.height = 10;
            if (this.position == 'left' || this.position == 'right')
                this.height = this.parentHeight;
            else if (this.position == 'top' || this.position == 'bottom')
                this.width = this.parentWidth;
            return;
        }
        if (!this.isRaised) {
            if (this.position == 'left' || this.position == 'right') {
                this.width = this.gripHeight;
                this.height = this.gripWidth + 2 * outPadding;
            }
            else if (this.position == 'top' || this.position == 'bottom') {
                this.width = this.gripWidth + 2 * outPadding;
                this.height = this.gripHeight;
            }
            this.addGripButton();
            return;
        }
        var bank = this.stack[this.stack.length - 1];
        bank.buttons = [];
        bank.update();
        var popWidth = 0, popHeight = 0;
        if (this.stack.length == 1) { }
        else if (this.position == 'left' || this.position == 'right')
            popHeight = this.gripHeight + inPadding;
        else if (this.position == 'top' || this.position == 'bottom')
            popWidth = this.gripHeight + inPadding;
        var bestLayout = null, bestScore = null;
        if (this.position == 'left' || this.position == 'right') {
            var maxSlotHeight = Math.floor((this.parentHeight - 2 * outPadding - inPadding) / (this.idealSize + inPadding));
            var minSlotHeight = Math.ceil(0.5 * maxSlotHeight);
            for (var i = maxSlotHeight; i >= minSlotHeight; i--) {
                var slotWidth = Math.ceil(bank.buttons.length / i);
                for (var j = slotWidth; j <= slotWidth + 1; j++) {
                    var layout = this.layoutMaxHeight(bank, i, j);
                    var score = this.scoreLayout(layout) + 1 * layout[0].length;
                    if (bestLayout == null || score < bestScore) {
                        bestLayout = layout;
                        bestScore = score;
                    }
                }
            }
        }
        else if (this.position == 'top' || this.position == 'bottom') {
            var maxSlotWidth = Math.floor((this.parentWidth - 2 * outPadding - inPadding - popWidth) / (this.idealSize + inPadding));
            var minSlotWidth = Math.ceil(0.5 * maxSlotWidth);
            for (var n = maxSlotWidth; n >= minSlotWidth; n--) {
                var layout = this.layoutMaxWidth(bank, n);
                var score = this.scoreLayout(layout) + 1 * layout.length;
                if (bestLayout == null || score < bestScore) {
                    bestLayout = layout;
                    bestScore = score;
                }
            }
        }
        else {
        }
        var ncols = bestLayout[0].length, nrows = bestLayout.length;
        this.width = 2 * outPadding + inPadding + (this.idealSize + inPadding) * ncols + popWidth;
        this.height = 2 * outPadding + inPadding + (this.idealSize + inPadding) * nrows + popHeight;
        if (this.position == 'left' || this.position == 'right')
            this.width += this.gripHeight;
        else if (this.position == 'top' || this.position == 'bottom')
            this.height += this.gripHeight;
        this.addGripButton();
        if (popWidth > 0 || popHeight > 0) {
            var d = {
                'id': '!',
                'x': outPadding + inPadding,
                'y': outPadding + inPadding,
                'width': popWidth - inPadding,
                'height': popHeight - inPadding
            };
            if (this.position == 'right')
                d.x += this.gripHeight;
            else if (this.position == 'bottom')
                d.y += this.gripHeight;
            if (popWidth == 0)
                d.width = ncols * this.idealSize + inPadding * (ncols - 1);
            if (popHeight == 0)
                d.height = nrows * this.idealSize + inPadding * (nrows - 1);
            this.display.push(d);
        }
        for (var y = 0; y < nrows; y++)
            for (var x = 0; x < ncols; x++) {
                for (var n = 0; n < bank.buttons.length; n++)
                    if (bestLayout[y][x] == bank.buttons[n].id) {
                        var b = bank.buttons[n], d = { 'id': b.id };
                        d.x = outPadding + inPadding + popWidth + (this.idealSize + inPadding) * x;
                        d.y = outPadding + inPadding + popHeight + (this.idealSize + inPadding) * y;
                        if (this.position == 'right')
                            d.x += this.gripHeight;
                        else if (this.position == 'bottom')
                            d.y += this.gripHeight;
                        d.width = this.idealSize;
                        d.height = this.idealSize;
                        this.display.push(d);
                    }
            }
    };
    ButtonView.prototype.addGripButton = function () {
        if (this.position == 'centre')
            return;
        var d = { 'id': '*' }, spc = 3;
        if (this.position == 'left') {
            d.width = this.gripHeight - spc;
            d.height = this.gripWidth - 2 * spc;
            d.x = this.width - d.width - spc - 1;
            d.y = 0.5 * (this.height - d.height);
        }
        else if (this.position == 'right') {
            d.width = this.gripHeight - spc;
            d.height = this.gripWidth - 2 * spc;
            d.x = spc + 1;
            d.y = 0.5 * (this.height - d.height);
        }
        else if (this.position == 'top') {
            d.width = this.gripWidth - 2 * spc;
            d.height = this.gripHeight - spc;
            d.x = 0.5 * (this.width - d.width);
            d.y = this.height - d.height - spc - 1;
        }
        else if (this.position == 'bottom') {
            d.width = this.gripWidth - 2 * spc;
            d.height = this.gripHeight - spc;
            d.x = 0.5 * (this.width - d.width);
            d.y = spc + 1;
        }
        this.display.push(d);
    };
    ButtonView.prototype.replaceCanvas = function () {
        this.content.empty();
        for (var n = 0; n < this.display.length; n++) {
            this.display[n].svgDOM = null;
            this.display[n].helpSpan = null;
        }
        var canvasStyle = 'position: absolute; left: 0; top: 0;';
        canvasStyle += 'pointer-events: none;';
        this.canvas = newElement(this.content, 'canvas', { 'width': this.width, 'height': this.height, 'style': canvasStyle });
    };
    ButtonView.prototype.removeDisplayButtons = function () {
        this.content.empty();
        this.display = [];
    };
    ButtonView.prototype.applyOffset = function () {
        var x, y;
        if (this.position == 'left') {
            x = 0;
            y = 0.5 * (this.parentHeight - this.height);
        }
        else if (this.position == 'right') {
            x = this.parentWidth - this.width;
            y = 0.5 * (this.parentHeight - this.height);
        }
        else if (this.position == 'top') {
            x = 0.5 * (this.parentWidth - this.width);
            y = 0;
        }
        else if (this.position == 'bottom') {
            x = 0.5 * (this.parentWidth - this.width);
            y = this.parentHeight - this.height;
        }
        else {
            x = 0.5 * (this.parentWidth - this.width);
            y = 0.5 * (this.parentHeight - this.height);
        }
        this.x = this.parentX + x;
        this.y = this.parentY + y;
        this.content.css('position', 'absolute');
        this.content.css('width', this.width + 'px');
        this.content.css('height', this.height + 'px');
        this.content.css('left', this.x + 'px');
        this.content.css('top', this.y + 'px');
    };
    ButtonView.prototype.redraw = function () {
        if (!this.content || !this.canvas)
            return;
        var density = pixelDensity();
        this.canvas.width = this.width * density;
        this.canvas.height = this.height * density;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        var ctx = this.canvas.getContext('2d');
        ctx.save();
        ctx.scale(density, density);
        ctx.clearRect(0, 0, this.width, this.height);
        var path = this.traceOutline();
        ctx.fillStyle = colourCanvas(this.background);
        ctx.fill(path);
        ctx.strokeStyle = colourCanvas(this.border);
        ctx.lineWidth = 1;
        ctx.stroke(path);
        var bank = this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
        this.content.css('width', this.width + 'px');
        this.content.css('height', this.height + 'px');
        for (var n = 0; n < this.display.length; n++) {
            var d = this.display[n], b = this.buttonFromID(d.id);
            var col1 = void 0, col2 = void 0;
            if (this.highlightButton != null && d.id == this.highlightButton) {
                col1 = this.buttonColActv1;
                col2 = this.buttonColActv2;
            }
            else if (this.selectedButton != null && d.id == this.selectedButton) {
                col1 = this.buttonColSel1;
                col2 = this.buttonColSel2;
            }
            else {
                col1 = this.buttonColNorm1;
                col2 = this.buttonColNorm2;
            }
            ctx.save();
            path = pathRoundedRect(d.x + 0.5, d.y + 0.5, d.x + d.width - 1, d.y + d.height - 1, 5);
            if (col2 != null) {
                var grad = ctx.createLinearGradient(d.x, d.y, d.x + d.width, d.y + d.height);
                grad.addColorStop(0, colourCanvas(col1));
                grad.addColorStop(1, colourCanvas(col2));
                ctx.fillStyle = grad;
            }
            else
                ctx.fillStyle = colourCanvas(col1);
            ctx.fill(path);
            ctx.strokeStyle = colourCanvas(this.border);
            ctx.lineWidth = 0.5;
            ctx.stroke(path);
            ctx.restore();
            if (d.svgDOM != null) {
                $(d.svgDOM).remove();
                d.svgDOM = null;
            }
            if (b != null) {
                if (d.helpSpan == null) {
                    d.helpSpan = $('<span style="position: absolute;"></span>').appendTo(this.content);
                    addTooltip(d.helpSpan, b.helpText);
                }
                d.helpSpan.css('left', d.x + 'px');
                d.helpSpan.css('top', d.y + 'px');
                d.helpSpan.css('width', d.width + 'px');
                d.helpSpan.css('height', d.height + 'px');
            }
            if (b == null) { }
            else if (b.imageFN != null && d.svgDOM == null) {
                var sz = this.prefabImgSize;
                var bx = d.x + Math.floor(0.5 * (d.width - sz));
                var by = d.y + Math.floor(0.5 * (d.height - sz));
                var svg = ButtonView.ACTION_ICONS[b.imageFN];
                if (svg) {
                    var extra = 'style="position: absolute; left: ' + bx + 'px; top: ' + by + 'px; width: ' + sz + 'px; height: ' + sz + 'px; pointer-events: none;"';
                    svg = svg.substring(0, 4) + ' ' + extra + svg.substring(4);
                    d.svgDOM = $(svg)[0];
                    this.content.append(d.svgDOM);
                }
                else
                    console.log('Action button "' + b.imageFN + '" not found.');
            }
            else if (b.metavec != null) {
                var draw = new MetaVector(b.metavec);
                draw.offsetX = d.x + Math.floor(0.5 * (d.width - draw.width));
                draw.offsetY = d.y + Math.floor(0.5 * (d.height - draw.height));
                draw.renderContext(ctx);
            }
            else if (b.text != null) {
                var sz = this.idealSize;
                var draw = new MetaVector({ 'size': [sz, sz] });
                var fsz = sz * 0.6;
                var wad = draw.measureText(b.text, fsz);
                if (wad[1] + wad[2] > sz) {
                    fsz *= sz / (wad[1] + wad[2]);
                    wad = draw.measureText(b.text, fsz);
                }
                if (wad[0] > sz) {
                    fsz *= sz / wad[0];
                    wad = draw.measureText(b.text, fsz);
                }
                var x = 0.5 * (sz - wad[0]), y = 0.5 * (sz + wad[1]);
                draw.drawText(x - 1, y, b.text, fsz, 0x000000);
                draw.drawText(x + 1, y, b.text, fsz, 0x000000);
                draw.drawText(x, y - 1, b.text, fsz, 0x000000);
                draw.drawText(x, y + 1, b.text, fsz, 0x000000);
                draw.drawText(x, y, b.text, fsz, 0xFFFFFF);
                draw.offsetX = d.x + Math.floor(0.5 * (d.width - draw.width));
                draw.offsetY = d.y + Math.floor(0.5 * (d.height - draw.height));
                draw.renderContext(ctx);
            }
            if (b != null && b.isSubMenu) {
                ctx.save();
                var sx = d.x + d.width - 3, sy = d.y + d.height - 3;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(sx - 6, sy);
                ctx.lineTo(sx, sy - 6);
                ctx.closePath();
                ctx.fillStyle = 'black';
                ctx.fill();
                ctx.restore();
            }
            if (d.id == '*') {
                ctx.save();
                path = new Path2D();
                var px = void 0, py = void 0, flip = this.isRaised;
                if (this.position == 'left' || this.position == 'right') {
                    px = [0.2, 0.7, 0.7];
                    py = [0.5, 0.3, 0.7];
                    if (this.position == 'left')
                        flip = !flip;
                }
                else if (this.position == 'top' || this.position == 'bottom') {
                    px = [0.5, 0.3, 0.7];
                    py = [0.2, 0.7, 0.7];
                    if (this.position == 'top')
                        flip = !flip;
                }
                if (flip) {
                    px = [1 - px[0], 1 - px[1], 1 - px[2]];
                    py = [1 - py[0], 1 - py[1], 1 - py[2]];
                }
                path.moveTo(d.x + d.width * px[0], d.y + d.height * py[0]);
                path.lineTo(d.x + d.width * px[1], d.y + d.height * py[1]);
                path.lineTo(d.x + d.width * px[2], d.y + d.height * py[2]);
                path.closePath();
                ctx.fillStyle = 'white';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 0;
                ctx.fill(path);
                ctx.stroke(path);
                ctx.restore();
            }
            else if (d.id == '!') {
                ctx.save();
                var path1 = new Path2D(), path2 = new Path2D();
                var inset = 5;
                var w = d.width - inset * 2, h = d.height - inset * 2;
                for (var z = 5; z < w + h - 1; z += 12) {
                    var x1 = 0, y1 = z, x2 = z, y2 = 0;
                    if (y1 > h) {
                        var delta = y1 - h;
                        x1 += delta;
                        y1 -= delta;
                    }
                    if (x2 > w) {
                        var delta = x2 - w;
                        x2 -= delta;
                        y2 += delta;
                    }
                    path1.moveTo(d.x + inset + x1, d.y + inset + y1);
                    path1.lineTo(d.x + inset + x2, d.y + inset + y2);
                    path2.moveTo(d.x + inset + x1 + 1, d.y + inset + y1);
                    path2.lineTo(d.x + inset + x2 + 1, d.y + inset + y2);
                }
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#404040';
                ctx.stroke(path1);
                ctx.strokeStyle = 'white';
                ctx.stroke(path2);
                ctx.restore();
            }
        }
        ctx.restore();
    };
    ;
    ButtonView.prototype.delayedRedraw = function () {
        var self = this;
        window.setTimeout(function () { self.redraw(); }, 100);
    };
    ;
    ButtonView.prototype.buttonFromID = function (id) {
        var bank = this.stack[this.stack.length - 1];
        for (var n = 0; n < bank.buttons.length; n++)
            if (bank.buttons[n].id == id)
                return bank.buttons[n];
        return null;
    };
    ButtonView.prototype.displayFromID = function (id) {
        for (var n = 0; n < this.display.length; n++)
            if (this.display[n].id == id)
                return this.display[n];
        return null;
    };
    ButtonView.prototype.traceOutline = function () {
        var w = this.width, h = this.height, uw = w - 1, uh = h - 1, r = 8;
        if (this.position == 'centre' || this.stack.length == 0)
            return pathRoundedRect(0.5, 0.5, w - 0.5, h - 0.5, r);
        var path = new Path2D();
        if (this.position == 'left') {
            var my = 0.5 * h - 1, gw = this.gripHeight, hg = 0.5 * this.gripWidth;
            path.moveTo(0.5, 0.5);
            path.lineTo(0.5 + uw - gw - r, 0.5);
            path.bezierCurveTo(0.5 + uw - gw, 0.5, 0.5 + uw - gw, 0.5, 0.5 + uw - gw, 0.5 + r);
            path.lineTo(0.5 + uw - gw, 0.5 + my - hg);
            path.lineTo(0.5 + uw - r, 0.5 + my - hg);
            path.bezierCurveTo(0.5 + uw, 0.5 + my - hg, 0.5 + uw, 0.5 + my - hg, 0.5 + uw, 0.5 + my - hg + r);
            path.lineTo(0.5 + uw, 0.5 + my + hg - r);
            path.bezierCurveTo(0.5 + uw, 0.5 + my + hg, 0.5 + uw, 0.5 + my + hg, 0.5 + uw - r, 0.5 + my + hg);
            path.lineTo(0.5 + uw - gw, 0.5 + my + hg);
            path.lineTo(0.5 + uw - gw, 0.5 + uh - r);
            path.bezierCurveTo(0.5 + uw - gw, 0.5 + uh, 0.5 + uw - gw, 0.5 + uh, 0.5 + uw - gw - r, 0.5 + uh);
            path.lineTo(0.5, 0.5 + uh);
        }
        else if (this.position == 'right') {
            var my = 0.5 * h - 1, gw = this.gripHeight, hg = 0.5 * this.gripWidth;
            path.moveTo(w - 0.5, 0.5);
            path.lineTo(w - (0.5 + uw - gw - r), 0.5);
            path.bezierCurveTo(w - (0.5 + uw - gw), 0.5, w - (0.5 + uw - gw), 0.5, w - (0.5 + uw - gw), 0.5 + r);
            path.lineTo(w - (0.5 + uw - gw), 0.5 + my - hg);
            path.lineTo(w - (0.5 + uw - r), 0.5 + my - hg);
            path.bezierCurveTo(w - (0.5 + uw), 0.5 + my - hg, w - (0.5 + uw), 0.5 + my - hg, w - (0.5 + uw), 0.5 + my - hg + r);
            path.lineTo(w - (0.5 + uw), 0.5 + my + hg - r);
            path.bezierCurveTo(w - (0.5 + uw), 0.5 + my + hg, w - (0.5 + uw), 0.5 + my + hg, w - (0.5 + uw - r), 0.5 + my + hg);
            path.lineTo(w - (0.5 + uw - gw), 0.5 + my + hg);
            path.lineTo(w - (0.5 + uw - gw), 0.5 + uh - r);
            path.bezierCurveTo(w - (0.5 + uw - gw), 0.5 + uh, w - (0.5 + uw - gw), 0.5 + uh, w - (0.5 + uw - gw - r), 0.5 + uh);
            path.lineTo(w - 0.5, 0.5 + uh);
        }
        else if (this.position == 'top') {
            var mx = 0.5 * w - 1, gh = this.gripHeight, hg = 0.5 * this.gripWidth;
            path.moveTo(0.5, h - (0.5 + uh));
            path.lineTo(0.5, h - (0.5 + gh + r));
            path.bezierCurveTo(0.5, h - (0.5 + gh), 0.5, h - (0.5 + gh), 0.5 + r, h - (0.5 + gh));
            path.lineTo(0.5 + mx - hg, h - (0.5 + gh));
            path.lineTo(0.5 + mx - hg, h - (0.5 + r));
            path.bezierCurveTo(0.5 + mx - hg, h - 0.5, 0.5 + mx - hg, h - 0.5, 0.5 + mx - hg + r, h - 0.5);
            path.lineTo(0.5 + mx + hg - r, h - 0.5);
            path.bezierCurveTo(0.5 + mx + hg, h - 0.5, 0.5 + mx + hg, h - 0.5, 0.5 + mx + hg, h - (0.5 + r));
            path.lineTo(0.5 + mx + hg, h - (0.5 + gh));
            path.lineTo(0.5 + uw - r, h - (0.5 + gh));
            path.bezierCurveTo(0.5 + uw, h - (0.5 + gh), 0.5 + uw, h - (0.5 + gh), 0.5 + uw, h - (0.5 + gh + r));
            path.lineTo(0.5 + uw, h - (0.5 + uh));
        }
        else if (this.position == 'bottom') {
            var mx = 0.5 * w - 1, gh = this.gripHeight, hg = 0.5 * this.gripWidth;
            path.moveTo(0.5, 0.5 + uh);
            path.lineTo(0.5, 0.5 + gh + r);
            path.bezierCurveTo(0.5, 0.5 + gh, 0.5, 0.5 + gh, 0.5 + r, 0.5 + gh);
            path.lineTo(0.5 + mx - hg, 0.5 + gh);
            path.lineTo(0.5 + mx - hg, 0.5 + r);
            path.bezierCurveTo(0.5 + mx - hg, 0.5, 0.5 + mx - hg, 0.5, 0.5 + mx - hg + r, 0.5);
            path.lineTo(0.5 + mx + hg - r, 0.5);
            path.bezierCurveTo(0.5 + mx + hg, 0.5, 0.5 + mx + hg, 0.5, 0.5 + mx + hg, 0.5 + r);
            path.lineTo(0.5 + mx + hg, 0.5 + gh);
            path.lineTo(0.5 + uw - r, 0.5 + gh);
            path.bezierCurveTo(0.5 + uw, 0.5 + gh, 0.5 + uw, 0.5 + gh, 0.5 + uw, 0.5 + gh + r);
            path.lineTo(0.5 + uw, 0.5 + uh);
        }
        return path;
    };
    ButtonView.prototype.layoutMaxWidth = function (bank, slotWidth) {
        if (bank.buttons.length == 0)
            return [[null]];
        var bx = new Array(bank.buttons.length), by = new Array(bank.buttons.length);
        var x = 0, y = 0, w = 0, h = 0;
        for (var n = 0; n < bank.buttons.length; n++) {
            w = Math.max(x + 1, w);
            h = Math.max(y + 1, h);
            bx[n] = x;
            by[n] = y;
            x++;
            if (x >= slotWidth) {
                x = 0;
                y++;
            }
        }
        var slot = new Array(h);
        for (var n = 0; n < h; n++)
            slot[n] = new Array(w);
        for (var n = 0; n < bank.buttons.length; n++) {
            slot[by[n]][bx[n]] = bank.buttons[n].id;
        }
        return slot;
    };
    ButtonView.prototype.layoutMaxHeight = function (bank, slotHeight, slotWidth) {
        if (bank.buttons.length == 0)
            return [[null]];
        var bx = new Array(bank.buttons.length), by = new Array(bank.buttons.length);
        var x = 0, y = 0, w = 0, h = 0;
        for (var n = 0; n < bank.buttons.length; n++) {
            w = Math.max(x + 1, w);
            h = Math.max(y + 1, h);
            bx[n] = x;
            by[n] = y;
            x++;
            if (x >= slotWidth) {
                x = 0;
                y++;
            }
        }
        var slot = new Array(h);
        for (var n = 0; n < h; n++)
            slot[n] = new Array(w);
        for (var n = 0; n < bank.buttons.length; n++) {
            slot[by[n]][bx[n]] = bank.buttons[n].id;
        }
        return slot;
    };
    ButtonView.prototype.scoreLayout = function (slots) {
        var score = 0;
        for (var y = 0; y < slots.length; y++)
            for (var x = 0; x < slots[y].length; x++) {
                if (slots[y][x] == null)
                    score++;
            }
        return score;
    };
    ButtonView.prototype.pickButtonIndex = function (x, y) {
        for (var n = 0; n < this.display.length; n++) {
            var d = this.display[n];
            if (x >= d.x && y >= d.y && x < d.x + d.width && y < d.y + d.height)
                return n;
        }
        return -1;
    };
    ButtonView.prototype.pickButtonID = function (x, y) {
        var idx = this.pickButtonIndex(x, y);
        if (idx < 0)
            return undefined;
        return this.display[idx].id;
    };
    ButtonView.prototype.triggerButton = function (id) {
        if (id == '*') {
            if (this.isRaised)
                this.lowerBank();
            else
                this.raiseBank();
            return;
        }
        else if (id == '!') {
            this.popBank();
            return;
        }
        var bank = this.stack[this.stack.length - 1];
        bank.hitButton(id);
    };
    ButtonView.prototype.mouseClick = function (event) {
    };
    ButtonView.prototype.mouseDoubleClick = function (event) {
        event.stopImmediatePropagation();
    };
    ButtonView.prototype.mouseDown = function (event) {
        var xy = eventCoords(event, this.content);
        if (!this.withinOutline(xy[0], xy[1]))
            return;
        var id = this.pickButtonID(xy[0], xy[1]);
        if (id != this.highlightButton) {
            this.highlightButton = id;
            this.redraw();
        }
        event.stopPropagation();
    };
    ButtonView.prototype.mouseUp = function (event) {
        var xy = eventCoords(event, this.content);
        if (!this.withinOutline(xy[0], xy[1]))
            return;
        var id = this.pickButtonID(xy[0], xy[1]);
        if (id != null && this.highlightButton == id) {
            this.highlightButton = undefined;
            this.triggerButton(id);
            this.delayedRedraw();
        }
        else {
            this.highlightButton = undefined;
            this.delayedRedraw();
        }
        event.stopPropagation();
    };
    ButtonView.prototype.mouseOver = function (event) {
        var xy = eventCoords(event, this.content);
        if (!this.withinOutline(xy[0], xy[1]))
            return;
        event.stopPropagation();
    };
    ButtonView.prototype.mouseOut = function (event) {
        var xy = eventCoords(event, this.content);
        if (!this.withinOutline(xy[0], xy[1])) {
            if (this.highlightButton != null) {
                this.highlightButton = null;
                this.delayedRedraw();
            }
            return;
        }
        if (this.highlightButton != null) {
            var xy_1 = eventCoords(event, this.content);
            var id = this.pickButtonID(xy_1[0], xy_1[1]);
            if (id != this.highlightButton) {
                this.highlightButton = null;
                this.delayedRedraw();
            }
        }
        event.stopPropagation();
    };
    ButtonView.prototype.mouseMove = function (event) {
        var xy = eventCoords(event, this.content);
        if (!this.withinOutline(xy[0], xy[1]))
            return;
    };
    ButtonView.prototype.keyPressed = function (event) {
    };
    ButtonView.prototype.keyDown = function (event) {
    };
    ButtonView.prototype.keyUp = function (event) {
    };
    ButtonView.ACTION_ICONS = null;
    return ButtonView;
}(Widget));
var MetaVector = (function () {
    function MetaVector(vec) {
        this.PRIM_LINE = 1;
        this.PRIM_RECT = 2;
        this.PRIM_OVAL = 3;
        this.PRIM_PATH = 4;
        this.PRIM_TEXT = 5;
        this.ONE_THIRD = 1.0 / 3;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
        this.density = 1;
        this.types = vec.types;
        this.prims = vec.prims;
        this.width = vec.size[0];
        this.height = vec.size[1];
        if (this.types == null)
            this.types = [];
        if (this.prims == null)
            this.prims = [];
    }
    MetaVector.prototype.drawLine = function (x1, y1, x2, y2, thickness, colour) {
        if (!thickness)
            thickness = 1;
        var typeidx = this.findOrCreateType([this.PRIM_LINE, thickness, colour]);
        this.prims.push([this.PRIM_LINE, typeidx, x1, y1, x2, y2]);
    };
    MetaVector.prototype.drawRect = function (x, y, w, h, edgeCol, fillCol, thickness) {
        if (!edgeCol)
            edgeCol = -1;
        if (!fillCol)
            fillCol = -1;
        if (!thickness)
            thickness = 1;
        var typeidx = this.findOrCreateType([this.PRIM_RECT, edgeCol, fillCol, thickness]);
        this.prims.push([this.PRIM_RECT, typeidx, x, y, w, h]);
    };
    MetaVector.prototype.drawOval = function (x, y, w, h, edgeCol, fillCol, thickness) {
        if (!edgeCol)
            edgeCol = -1;
        if (!fillCol)
            fillCol = -1;
        if (!thickness)
            thickness = 1;
        var typeidx = this.findOrCreateType([this.PRIM_OVAL, edgeCol, fillCol, thickness]);
        this.prims.push([this.PRIM_OVAL, typeidx, x, y, w, h]);
    };
    MetaVector.prototype.drawPath = function (xpoints, ypoints, ctrlFlags, isClosed, edgeCol, fillCol, thickness, hardEdge) {
        if (edgeCol)
            edgeCol = -1;
        if (fillCol)
            fillCol = -1;
        if (thickness)
            thickness = 1;
        if (hardEdge)
            hardEdge = false;
        var typeidx = this.findOrCreateType([this.PRIM_PATH, edgeCol, fillCol, thickness, hardEdge]);
        this.prims.push([this.PRIM_PATH, typeidx, xpoints.length, xpoints, ypoints, ctrlFlags, isClosed]);
    };
    MetaVector.prototype.drawText = function (x, y, txt, size, colour) {
        var typeidx = this.findOrCreateType([this.PRIM_TEXT, size, colour]);
        this.prims.push([this.PRIM_TEXT, typeidx, x, y, txt]);
    };
    MetaVector.prototype.measureText = function (txt, size) {
        var fd = FontData.main;
        var scale = size / fd.UNITS_PER_EM;
        var dx = 0;
        for (var n = 0; n < txt.length; n++) {
            var i = txt.charCodeAt(n) - 32;
            if (i < 0 || i >= 96) {
                dx += fd.MISSING_HORZ;
                continue;
            }
            dx += fd.HORIZ_ADV_X[i];
            if (n < txt.length - 1) {
                var j = txt.charCodeAt(n + 1) - 32;
                for (var k = 0; k < fd.KERN_K.length; k++)
                    if ((fd.KERN_G1[k] == i && fd.KERN_G2[k] == j) || (fd.KERN_G1[k] == j && fd.KERN_G2[k] == i)) {
                        dx += fd.KERN_K[k];
                        break;
                    }
            }
        }
        return [dx * scale, fd.ASCENT * scale * fd.ASCENT_FUDGE, -fd.DESCENT * scale];
    };
    MetaVector.prototype.renderInto = function (parent) {
        var canvas = newElement(parent, 'canvas', { 'width': this.width, 'height': this.height });
        this.renderCanvas(canvas);
        return canvas;
    };
    MetaVector.prototype.renderCanvas = function (canvas, clearFirst) {
        var ctx = canvas.getContext('2d');
        if (clearFirst)
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        var w = canvas.style.width ? parseInt(canvas.style.width) : canvas.width / this.density;
        var h = canvas.style.height ? parseInt(canvas.style.height) : canvas.height / this.density;
        this.density = pixelDensity();
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        canvas.width = w * this.density;
        canvas.height = h * this.density;
        this.renderContext(ctx);
    };
    MetaVector.prototype.renderContext = function (ctx) {
        ctx.save();
        ctx.scale(this.density, this.density);
        this.typeObj = [];
        for (var n = 0; n < this.types.length; n++) {
            var t = this.types[n];
            if (t[0] == this.PRIM_LINE)
                this.typeObj[n] = this.setupTypeLine(t);
            else if (t[0] == this.PRIM_RECT)
                this.typeObj[n] = this.setupTypeRect(t);
            else if (t[0] == this.PRIM_OVAL)
                this.typeObj[n] = this.setupTypeOval(t);
            else if (t[0] == this.PRIM_PATH)
                this.typeObj[n] = this.setupTypePath(t);
            else if (t[0] == this.PRIM_TEXT)
                this.typeObj[n] = this.setupTypeText(t);
        }
        for (var n = 0; n < this.prims.length; n++) {
            var p = this.prims[n];
            if (p[0] == this.PRIM_LINE)
                this.renderLine(ctx, p);
            else if (p[0] == this.PRIM_RECT)
                this.renderRect(ctx, p);
            else if (p[0] == this.PRIM_OVAL)
                this.renderOval(ctx, p);
            else if (p[0] == this.PRIM_PATH)
                this.renderPath(ctx, p);
            else if (p[0] == this.PRIM_TEXT)
                this.renderText(ctx, p);
        }
        ctx.restore();
    };
    MetaVector.prototype.setupTypeLine = function (t) {
        var thickness = t[1] * this.scale;
        var colour = t[2];
        return { 'thickness': thickness, 'colour': colourCanvas(colour) };
    };
    MetaVector.prototype.setupTypeRect = function (t) {
        var edgeCol = t[1];
        var fillCol = t[2];
        var thickness = t[3] * this.scale;
        return { 'edgeCol': colourCanvas(edgeCol), 'fillCol': colourCanvas(fillCol), 'thickness': thickness };
    };
    MetaVector.prototype.setupTypeOval = function (t) {
        var edgeCol = t[1];
        var fillCol = t[2];
        var thickness = t[3] * this.scale;
        return { 'edgeCol': colourCanvas(edgeCol), 'fillCol': colourCanvas(fillCol), 'thickness': thickness };
    };
    MetaVector.prototype.setupTypePath = function (t) {
        var edgeCol = t[1];
        var fillCol = t[2];
        var thickness = t[3] * this.scale;
        var hardEdge = t[4];
        return { 'edgeCol': colourCanvas(edgeCol), 'fillCol': colourCanvas(fillCol), 'thickness': thickness, 'hardEdge': hardEdge };
    };
    MetaVector.prototype.setupTypeText = function (t) {
        var sz = t[1] * this.scale;
        var colour = t[2];
        return { 'colour': colourCanvas(colour), 'size': sz };
    };
    MetaVector.prototype.renderLine = function (ctx, p) {
        var type = this.typeObj[p[1]];
        var x1 = p[2], y1 = p[3];
        var x2 = p[4], y2 = p[5];
        x1 = this.offsetX + this.scale * x1;
        y1 = this.offsetY + this.scale * y1;
        x2 = this.offsetX + this.scale * x2;
        y2 = this.offsetY + this.scale * y2;
        if (type.colour) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = type.colour;
            ctx.lineWidth = type.thickness;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
    };
    MetaVector.prototype.renderRect = function (ctx, p) {
        var type = this.typeObj[p[1]];
        var x = p[2], y = p[3];
        var w = p[4], h = p[5];
        x = this.offsetX + this.scale * x;
        y = this.offsetY + this.scale * y;
        w *= this.scale;
        h *= this.scale;
        if (type.fillCol) {
            ctx.fillStyle = type.fillCol;
            ctx.fillRect(x, y, w, h);
        }
        if (type.edgeCol) {
            ctx.strokeStyle = type.edgeCol;
            ctx.lineWidth = type.thickness;
            ctx.lineCap = 'square';
            ctx.strokeRect(x, y, w, h);
        }
    };
    MetaVector.prototype.renderOval = function (ctx, p) {
        var type = this.typeObj[p[1]];
        var cx = p[2], cy = p[3];
        var rw = p[4], rh = p[5];
        cx = this.offsetX + this.scale * cx;
        cy = this.offsetY + this.scale * cy;
        rw *= this.scale;
        rh *= this.scale;
        if (type.fillCol) {
            ctx.fillStyle = type.fillCol;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rw, rh, 0, 0, 2 * Math.PI, true);
            ctx.fill();
        }
        if (type.edgeCol) {
            ctx.strokeStyle = type.edgeCol;
            ctx.lineWidth = type.thickness;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rw, rh, 0, 0, 2 * Math.PI, true);
            ctx.stroke();
        }
    };
    MetaVector.prototype.renderPath = function (ctx, p) {
        var type = this.typeObj[p[1]];
        var npts = p[2];
        if (npts == 0)
            return;
        var x = p[3], y = p[4];
        var ctrl = p[5];
        var isClosed = p[6];
        for (var n = 0; n < npts; n++) {
            x[n] = this.offsetX + this.scale * x[n];
            y[n] = this.offsetY + this.scale * y[n];
        }
        for (var layer = 1; layer <= 2; layer++) {
            if (layer == 1 && !type.fillCol)
                continue;
            if (layer == 2 && !type.edgeCol)
                continue;
            ctx.beginPath();
            ctx.moveTo(x[0], y[0]);
            for (var i = 1; i < npts; i++) {
                if (!ctrl[i]) {
                    ctx.lineTo(x[i], y[i]);
                }
                else if (i < npts - 1 && !ctrl[i + 1]) {
                    ctx.quadraticCurveTo(x[i], y[i], x[i + 1], y[i + 1]);
                    i++;
                }
                else if (i < npts - 1 && !ctrl[i + 2]) {
                    ctx.bezierCurveTo(x[i], y[i], x[i + 1], y[i + 1], x[i + 2], y[i + 2]);
                    i += 2;
                }
            }
            if (isClosed)
                ctx.closePath();
            if (layer == 1) {
                ctx.fillStyle = type.fillCol;
                ctx.fill();
            }
            else {
                ctx.strokeStyle = type.edgeCol;
                ctx.lineWidth = type.thickness;
                ctx.lineCap = type.hardEdge ? 'square' : 'round';
                ctx.lineJoin = type.hardEdge ? 'miter' : 'round';
                ctx.stroke();
            }
        }
    };
    MetaVector.prototype.renderText = function (ctx, p) {
        var type = this.typeObj[p[1]];
        var x = p[2], y = p[3];
        var txt = p[4];
        var sz = type.size;
        var fill = type.colour;
        x = this.offsetX + this.scale * x;
        y = this.offsetY + this.scale * y;
        var fd = FontData.main;
        var scale = sz / fd.UNITS_PER_EM;
        var dx = 0;
        for (var n = 0; n < txt.length; n++) {
            var i = txt.charCodeAt(n) - 32;
            if (i < 0 || i >= 96) {
                dx += fd.MISSING_HORZ;
                continue;
            }
            var path = fd.getGlyphPath(i);
            if (path) {
                ctx.save();
                ctx.translate(x + dx * scale, y);
                ctx.scale(scale, -scale);
                ctx.fillStyle = fill;
                ctx.fill(path);
                ctx.restore();
            }
            dx += fd.HORIZ_ADV_X[i];
            if (n < txt.length - 1) {
                var j = txt.charCodeAt(n + 1) - 32;
                for (var k = 0; k < fd.KERN_K.length; k++)
                    if ((fd.KERN_G1[k] == i && fd.KERN_G2[k] == j) || (fd.KERN_G1[k] == j && fd.KERN_G2[k] == i)) {
                        dx += fd.KERN_K[k];
                        break;
                    }
            }
        }
    };
    MetaVector.prototype.findOrCreateType = function (typeDef) {
        for (var i = 0; i < this.types.length; i++) {
            if (this.types[i].length != typeDef.length)
                continue;
            var match = true;
            for (var j = 0; j < typeDef.length; j++)
                if (typeDef[j] != this.types[i][j]) {
                    match = false;
                    break;
                }
            if (match)
                return i;
        }
        this.types.push(typeDef);
        return this.types.length - 1;
    };
    return MetaVector;
}());
var Geom = (function () {
    function Geom() {
    }
    Geom.pointInPolygon = function (x, y, px, py) {
        if (x < minArray(px) || x > maxArray(px) || y < minArray(py) || y > maxArray(py))
            return false;
        var sz = px.length;
        for (var n = 0; n < sz; n++)
            if (px[n] == x && py[n] == y)
                return true;
        var phase = false;
        for (var n = 0; n < sz; n++) {
            var x1 = px[n], y1 = py[n], x2 = px[n + 1 < sz ? n + 1 : 0], y2 = py[n + 1 < sz ? n + 1 : 0];
            if (y > Math.min(y1, y2) && y <= Math.max(y1, y2) && x <= Math.max(x1, x2) && y1 != y2) {
                var intr = (y - y1) * (x2 - x1) / (y2 - y1) + x1;
                if (x1 == x2 || x <= intr)
                    phase = !phase;
            }
        }
        return phase;
    };
    return Geom;
}());
var ActivityType;
(function (ActivityType) {
    ActivityType[ActivityType["Delete"] = 1] = "Delete";
    ActivityType[ActivityType["Clear"] = 2] = "Clear";
    ActivityType[ActivityType["Cut"] = 3] = "Cut";
    ActivityType[ActivityType["Copy"] = 4] = "Copy";
    ActivityType[ActivityType["CopyMDLMOL"] = 5] = "CopyMDLMOL";
    ActivityType[ActivityType["CopySMILES"] = 6] = "CopySMILES";
    ActivityType[ActivityType["Paste"] = 7] = "Paste";
    ActivityType[ActivityType["SelectAll"] = 8] = "SelectAll";
    ActivityType[ActivityType["SelectNone"] = 9] = "SelectNone";
    ActivityType[ActivityType["SelectPrevComp"] = 10] = "SelectPrevComp";
    ActivityType[ActivityType["SelectNextComp"] = 11] = "SelectNextComp";
    ActivityType[ActivityType["SelectSide"] = 12] = "SelectSide";
    ActivityType[ActivityType["SelectGrow"] = 13] = "SelectGrow";
    ActivityType[ActivityType["SelectShrink"] = 14] = "SelectShrink";
    ActivityType[ActivityType["SelectChain"] = 15] = "SelectChain";
    ActivityType[ActivityType["SelectSmRing"] = 16] = "SelectSmRing";
    ActivityType[ActivityType["SelectRingBlk"] = 17] = "SelectRingBlk";
    ActivityType[ActivityType["SelectCurElement"] = 18] = "SelectCurElement";
    ActivityType[ActivityType["SelectToggle"] = 19] = "SelectToggle";
    ActivityType[ActivityType["SelectUnCurrent"] = 20] = "SelectUnCurrent";
    ActivityType[ActivityType["Element"] = 21] = "Element";
    ActivityType[ActivityType["AtomPos"] = 22] = "AtomPos";
    ActivityType[ActivityType["Charge"] = 23] = "Charge";
    ActivityType[ActivityType["Connect"] = 24] = "Connect";
    ActivityType[ActivityType["Disconnect"] = 25] = "Disconnect";
    ActivityType[ActivityType["BondOrder"] = 26] = "BondOrder";
    ActivityType[ActivityType["BondType"] = 27] = "BondType";
    ActivityType[ActivityType["BondGeom"] = 28] = "BondGeom";
    ActivityType[ActivityType["BondAtom"] = 29] = "BondAtom";
    ActivityType[ActivityType["BondSwitch"] = 30] = "BondSwitch";
    ActivityType[ActivityType["BondAddTwo"] = 31] = "BondAddTwo";
    ActivityType[ActivityType["BondInsert"] = 32] = "BondInsert";
    ActivityType[ActivityType["Join"] = 33] = "Join";
    ActivityType[ActivityType["Nudge"] = 34] = "Nudge";
    ActivityType[ActivityType["NudgeLots"] = 35] = "NudgeLots";
    ActivityType[ActivityType["NudgeFar"] = 36] = "NudgeFar";
    ActivityType[ActivityType["Flip"] = 37] = "Flip";
    ActivityType[ActivityType["Scale"] = 38] = "Scale";
    ActivityType[ActivityType["Rotate"] = 39] = "Rotate";
    ActivityType[ActivityType["Move"] = 40] = "Move";
    ActivityType[ActivityType["Ring"] = 41] = "Ring";
    ActivityType[ActivityType["TemplateFusion"] = 42] = "TemplateFusion";
    ActivityType[ActivityType["AbbrevTempl"] = 43] = "AbbrevTempl";
    ActivityType[ActivityType["AbbrevGroup"] = 44] = "AbbrevGroup";
    ActivityType[ActivityType["AbbrevInline"] = 45] = "AbbrevInline";
    ActivityType[ActivityType["AbbrevFormula"] = 46] = "AbbrevFormula";
    ActivityType[ActivityType["AbbrevClear"] = 47] = "AbbrevClear";
    ActivityType[ActivityType["AbbrevExpand"] = 48] = "AbbrevExpand";
})(ActivityType || (ActivityType = {}));
var MoleculeActivity = (function () {
    function MoleculeActivity(owner, activity, param) {
        this.owner = owner;
        this.activity = activity;
        this.param = param;
        this.input = owner.getState();
        this.output =
            {
                'mol': null,
                'currentAtom': -1,
                'currentBond': -1,
                'selectedMask': null
            };
    }
    MoleculeActivity.prototype.evaluate = function () {
        return true;
    };
    MoleculeActivity.prototype.execute = function () {
        var param = this.param;
        if (this.activity == ActivityType.Delete) {
            this.executeRPC('delete');
        }
        else if (this.activity == ActivityType.Clear) {
            this.executeRPC('clear');
        }
        else if (this.activity == ActivityType.Cut) {
            this.executeRPC('cut');
        }
        else if (this.activity == ActivityType.Copy) {
            this.executeRPC('copy');
        }
        else if (this.activity == ActivityType.CopyMDLMOL) {
        }
        else if (this.activity == ActivityType.CopySMILES) {
        }
        else if (this.activity == ActivityType.Paste) {
        }
        else if (this.activity == ActivityType.SelectAll) {
            this.executeRPC('select', { 'mode': 'all' });
        }
        else if (this.activity == ActivityType.SelectNone) {
            this.executeRPC('select', { 'mode': 'none' });
        }
        else if (this.activity == ActivityType.SelectPrevComp) {
            this.executeRPC('select', { 'mode': 'prevcomp' });
        }
        else if (this.activity == ActivityType.SelectNextComp) {
            this.executeRPC('select', { 'mode': 'nextcomp' });
        }
        else if (this.activity == ActivityType.SelectSide) {
            this.executeRPC('select', { 'mode': 'side' });
        }
        else if (this.activity == ActivityType.SelectGrow) {
            this.executeRPC('select', { 'mode': 'grow' });
        }
        else if (this.activity == ActivityType.SelectShrink) {
            this.executeRPC('select', { 'mode': 'shrink' });
        }
        else if (this.activity == ActivityType.SelectChain) {
            this.executeRPC('select', { 'mode': 'chain' });
        }
        else if (this.activity == ActivityType.SelectSmRing) {
            this.executeRPC('select', { 'mode': 'smring' });
        }
        else if (this.activity == ActivityType.SelectRingBlk) {
            this.executeRPC('select', { 'mode': 'ringblk' });
        }
        else if (this.activity == ActivityType.SelectCurElement) {
            this.executeRPC('select', { 'mode': 'curelement' });
        }
        else if (this.activity == ActivityType.SelectToggle) {
            this.executeRPC('select', { 'mode': 'toggle' });
        }
        else if (this.activity == ActivityType.SelectUnCurrent) {
            this.executeRPC('select', { 'mode': 'uncurrent' });
        }
        else if (this.activity == ActivityType.Element) {
            this.executeRPC('element', { 'element': param.element, 'position': param.position });
        }
        else if (this.activity == ActivityType.Charge) {
            this.executeRPC('charge', { 'delta': param.delta });
        }
        else if (this.activity == ActivityType.Connect) {
            this.executeRPC('connect');
        }
        else if (this.activity == ActivityType.Disconnect) {
            this.executeRPC('disconnect');
        }
        else if (this.activity == ActivityType.BondOrder) {
            this.executeRPC('bondorder', { 'order': param.order });
        }
        else if (this.activity == ActivityType.BondType) {
            this.executeRPC('bondtype', { 'type': param.type });
        }
        else if (this.activity == ActivityType.BondGeom) {
            this.executeRPC('bondgeom', { 'geom': param.geom });
        }
        else if (this.activity == ActivityType.BondAtom) {
            this.executeRPC('bondatom', param);
        }
        else if (this.activity == ActivityType.BondSwitch) {
            this.executeRPC('bondswitch');
        }
        else if (this.activity == ActivityType.BondAddTwo) {
            this.executeRPC('bondaddtwo');
        }
        else if (this.activity == ActivityType.BondInsert) {
            this.executeRPC('bondinsert');
        }
        else if (this.activity == ActivityType.Join) {
            this.executeRPC('join');
        }
        else if (this.activity == ActivityType.Nudge) {
            this.executeRPC('nudge', { 'dir': param.dir });
        }
        else if (this.activity == ActivityType.NudgeLots) {
            this.executeRPC('nudgelots', { 'dir': param.dir });
        }
        else if (this.activity == ActivityType.NudgeFar) {
            this.executeRPC('nudgefar', { 'dir': param.dir });
        }
        else if (this.activity == ActivityType.Flip) {
            this.executeRPC('flip', { 'axis': param.axis });
        }
        else if (this.activity == ActivityType.Scale) {
            this.executeRPC('scale', { 'mag': param.mag });
        }
        else if (this.activity == ActivityType.Rotate) {
            this.executeRPC('rotate', { 'theta': param.theta, 'centreX': param.centreX, 'centreY': param.centreY });
        }
        else if (this.activity == ActivityType.Move) {
            this.executeRPC('move', { 'refAtom': param.refAtom, 'deltaX': param.deltaX, 'deltaY': param.deltaY });
        }
        else if (this.activity == ActivityType.Ring) {
            this.executeRPC('ring', { 'ringX': param.ringX, 'ringY': param.ringY, 'aromatic': param.aromatic });
        }
        else if (this.activity == ActivityType.TemplateFusion) {
            this.executeRPC('templateFusion', { 'fragNative': param.fragNative });
        }
        else if (this.activity == ActivityType.AbbrevTempl) {
        }
        else if (this.activity == ActivityType.AbbrevGroup) {
        }
        else if (this.activity == ActivityType.AbbrevInline) {
        }
        else if (this.activity == ActivityType.AbbrevFormula) {
        }
        else if (this.activity == ActivityType.AbbrevClear) {
        }
        else if (this.activity == ActivityType.AbbrevExpand) {
        }
    };
    MoleculeActivity.prototype.executeRPC = function (optype, xparam) {
        if (xparam === void 0) { xparam = {}; }
        var param = {
            'tokenID': this.owner.tokenID
        };
        param.molNative = this.input.mol.toString();
        param.currentAtom = this.input.currentAtom;
        param.currentBond = this.input.currentBond;
        param.selectedMask = this.input.selectedMask;
        for (var xp in xparam)
            param[xp] = xparam[xp];
        var fcn = function (result, error) {
            if (!result) {
                alert('Sketching operation failed: ' + error.message);
                return;
            }
            if (result.molNative != null)
                this.output.mol = Molecule.fromString(result.molNative);
            if (result.currentAtom >= 0)
                this.output.currentAtom = result.currentAtom;
            if (result.currentBond >= 0)
                this.output.currentBond = result.currentBond;
            if (result.selectedMask != null)
                this.output.selectedMask = result.selectedMask;
            this.errmsg = result.errmsg;
            if (this.activity == ActivityType.TemplateFusion && result.permutations != null) {
                this.owner.setPermutations(result.permutations);
            }
            else
                this.finish();
            if ((this.activity == ActivityType.Copy || this.activity == ActivityType.Cut) && result.clipNative != null) {
                this.owner.performCopy(Molecule.fromString(result.clipNative));
            }
        };
        new RPC('sketch.' + optype, param, fcn, this).invoke();
    };
    MoleculeActivity.prototype.finish = function () {
        if (this.output.mol != null || this.output.currentAtom >= 0 || this.output.currentBond >= 0 || this.output.selectedMask != null) {
            this.owner.setState(this.output, true);
            if (this.errmsg != null)
                this.owner.showMessage(this.errmsg, false);
        }
        else {
            if (this.errmsg != null)
                this.owner.showMessage(this.errmsg, true);
        }
    };
    return MoleculeActivity;
}());
var DraggingTool;
(function (DraggingTool) {
    DraggingTool[DraggingTool["None"] = 0] = "None";
    DraggingTool[DraggingTool["Press"] = 1] = "Press";
    DraggingTool[DraggingTool["Lasso"] = 2] = "Lasso";
    DraggingTool[DraggingTool["Pan"] = 3] = "Pan";
    DraggingTool[DraggingTool["Zoom"] = 4] = "Zoom";
    DraggingTool[DraggingTool["Rotate"] = 5] = "Rotate";
    DraggingTool[DraggingTool["Move"] = 6] = "Move";
    DraggingTool[DraggingTool["Erasor"] = 7] = "Erasor";
    DraggingTool[DraggingTool["Atom"] = 8] = "Atom";
    DraggingTool[DraggingTool["Bond"] = 9] = "Bond";
    DraggingTool[DraggingTool["Charge"] = 10] = "Charge";
    DraggingTool[DraggingTool["Ring"] = 11] = "Ring";
})(DraggingTool || (DraggingTool = {}));
var globalMoleculeClipboard = null;
var Sketcher = (function (_super) {
    __extends(Sketcher, _super);
    function Sketcher(tokenID) {
        _super.call(this);
        this.tokenID = tokenID;
        this.mol = null;
        this.policy = null;
        this.width = 0;
        this.height = 0;
        this.border = 0x808080;
        this.background = 0xF8F8F8;
        this.useToolBank = true;
        this.useCommandBank = true;
        this.useTemplateBank = true;
        this.debugOutput = undefined;
        this.beenSetup = false;
        this.undoStack = [];
        this.redoStack = [];
        this.spanBackground = null;
        this.canvasUnder = null;
        this.canvasMolecule = null;
        this.canvasOver = null;
        this.divMessage = null;
        this.fadeWatermark = 0;
        this.rawvec = null;
        this.metavec = null;
        this.arrmol = null;
        this.guidelines = null;
        this.transform = null;
        this.toolView = null;
        this.commandView = null;
        this.templateView = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 0;
        this.currentAtom = 0;
        this.currentBond = 0;
        this.hoverAtom = 0;
        this.hoverBond = 0;
        this.selectedMask = null;
        this.filthy = false;
        this.dragType = DraggingTool.None;
        this.opAtom = 0;
        this.opBond = 0;
        this.opBudged = false;
        this.opShift = false;
        this.opCtrl = false;
        this.opAlt = false;
        this.toolAtomSymbol = '';
        this.toolBondOrder = 0;
        this.toolBondType = 0;
        this.toolChargeDelta = 0;
        this.toolRingArom = false;
        this.toolRingFreeform = false;
        this.toolRotateIncr = 0;
        this.lassoX = null;
        this.lassoY = null;
        this.lassoMask = null;
        this.clickX = 0;
        this.clickY = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.dragGuides = null;
        this.templatePerms = null;
        this.currentPerm = 0;
        this.fusionBank = null;
    }
    Sketcher.prototype.setSize = function (width, height) {
        this.width = width;
        this.height = height;
    };
    Sketcher.prototype.defineMolecule = function (mol, withAutoScale, withStashUndo) {
        if (withAutoScale === void 0) { withAutoScale = true; }
        if (withStashUndo === void 0) { withStashUndo = false; }
        if (withStashUndo)
            this.stashUndo();
        this.stopTemplateFusion();
        this.mol = mol.clone();
        if (!this.beenSetup)
            return;
        this.arrmol = null;
        this.rawvec = null;
        this.metavec = null;
        this.hoverAtom = 0;
        this.hoverBond = 0;
        var input = {
            'tokenID': this.tokenID,
            'policy': this.policy.data,
            'molNative': this.mol.toString(),
            'withGuidelines': true
        };
        var fcn = function (result, error) {
            if (!result) {
                alert('Arrangement of structure failed: ' + error.message);
                return;
            }
            if (this.transform != null) {
                var dx = result.transform[0] - this.transform[0];
                var dy = result.transform[1] - this.transform[1];
                this.offsetX -= dx * this.scale;
                this.offsetY -= dy * this.scale;
            }
            this.arrmol = result.arrmol;
            this.rawvec = result.metavec;
            this.metavec = new MetaVector(result.metavec);
            this.transform = result.transform;
            this.guidelines = result.guidelines;
            if (withAutoScale)
                this.autoScale();
            this.delayedRedraw();
        };
        Func.arrangeMolecule(input, fcn, this);
    };
    Sketcher.prototype.defineMoleculeString = function (molsk, withAutoScale, withStashUndo) {
        this.defineMolecule(Molecule.fromString(molsk), withAutoScale, withStashUndo);
    };
    Sketcher.prototype.defineRenderPolicy = function (policy) {
        this.policy = policy;
    };
    Sketcher.prototype.clearMolecule = function () { this.defineMolecule(new Molecule(), true, true); };
    Sketcher.prototype.getMolecule = function () { return this.mol.clone(); };
    Sketcher.prototype.setup = function (callback, master) {
        var fcnPrep = function () {
            this.beenSetup = true;
            if (this.mol == null)
                this.mol = new Molecule();
            if (this.policy == null)
                this.policy = RenderPolicy.defaultColourOnWhite();
            var input = {
                'tokenID': this.tokenID,
                'policy': this.policy.data,
                'molNative': this.mol.toString(),
                'withGuidelines': true
            };
            var fcnArrange = function (result, error) {
                if (!result) {
                    alert('Setup of EditMolecule failed: ' + error.message);
                    return;
                }
                this.arrmol = result.arrmol;
                this.rawvec = result.metavec;
                this.metavec = new MetaVector(result.metavec);
                this.transform = result.transform;
                this.guidelines = result.guidelines;
                if (callback)
                    callback.call(master);
            };
            Func.arrangeMolecule(input, fcnArrange, this);
        };
        ButtonView.prepare(fcnPrep, this);
    };
    Sketcher.prototype.render = function (parent) {
        if (!this.width || !this.height)
            throw 'Sketcher.render called without width and height';
        _super.prototype.render.call(this, parent);
        this.container = $('<div></div>').appendTo(this.content);
        this.container.attr('style', 'position: relative; width: ' + this.width + 'px; height: ' + this.height + 'px;');
        this.container.css('background-color', colourCanvas(this.background));
        this.container.css('border', '1px solid ' + colourCanvas(this.border));
        this.container.css('border-radius', '4px');
        var canvasStyle = 'position: absolute; left: 0; top: 0;';
        canvasStyle += ' pointer-events: none;';
        this.canvasUnder = newElement(this.container, 'canvas', { 'width': this.width, 'height': this.height, 'style': canvasStyle });
        this.canvasMolecule = newElement(this.container, 'canvas', { 'width': this.width, 'height': this.height, 'style': canvasStyle });
        this.canvasOver = newElement(this.container, 'canvas', { 'width': this.width, 'height': this.height, 'style': canvasStyle });
        this.divMessage = $('<div></div>').appendTo(this.container);
        this.divMessage.attr('style', canvasStyle);
        this.divMessage.css('width', this.width + 'px');
        this.divMessage.css('height', this.height + 'px');
        this.divMessage.css('text-align', 'center');
        this.divMessage.css('vertical-align', 'middle');
        this.divMessage.css('font-weight', 'bold');
        this.divMessage.css('font-size', '120%');
        this.autoScale();
        this.redraw();
        var reserveHeight = 0;
        if (this.useCommandBank) {
            this.commandView = new ButtonView('bottom', 0, 0, this.width, this.height);
            this.commandView.setHasBigButtons(false);
            this.commandView.pushBank(new CommandBank(this));
            this.commandView.render(this.container);
            reserveHeight = this.commandView.height;
        }
        if (this.useToolBank) {
            this.toolView = new ButtonView('left', 0, 0, this.width, this.height - reserveHeight);
            this.toolView.setHasBigButtons(false);
            this.toolView.pushBank(new ToolBank(this));
            this.toolView.render(this.container);
        }
        if (this.useTemplateBank) {
            this.templateView = new ButtonView('right', 0, 0, this.width, this.height - reserveHeight);
            this.templateView.setHasBigButtons(true);
            this.templateView.pushBank(new TemplateBank(this, null));
            this.templateView.render(this.container);
        }
        var self = this;
        this.container.click(function (event) { self.mouseClick(event); });
        this.container.dblclick(function (event) { self.mouseDoubleClick(event); });
        this.container.mousedown(function (event) { event.preventDefault(); self.mouseDown(event); });
        this.container.mouseup(function (event) { self.mouseUp(event); });
        this.container.mouseover(function (event) { self.mouseOver(event); });
        this.container.mouseout(function (event) { self.mouseOut(event); });
        this.container.mousemove(function (event) { self.mouseMove(event); });
        this.container.keypress(function (event) { self.keyPressed(event); });
        this.container.keydown(function (event) { self.keyDown(event); });
        this.container.keyup(function (event) { self.keyUp(event); });
        this.container[0].addEventListener('dragover', function (event) {
            event.stopPropagation();
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
        });
        this.container[0].addEventListener('drop', function (event) {
            event.stopPropagation();
            event.preventDefault();
            self.dropInto(event.dataTransfer);
        });
        document.addEventListener('paste', function (e) {
            var wnd = window;
            if (wnd.clipboardData && wnd.clipboardData.getData)
                self.pasteText(wnd.clipboardData.getData('Text'));
            else if (e.clipboardData && e.clipboardData.getData)
                self.pasteText(e.clipboardData.getData('text/plain'));
            e.preventDefault();
            return false;
        });
    };
    Sketcher.prototype.showMessage = function (msg, isError) {
        var watermark = ++this.fadeWatermark;
        this.divMessage.css('color', isError ? '#FF0000' : '#008000');
        this.divMessage.text(msg);
        var szLeft = (this.toolView == null ? 0 : this.toolView.width) + 2;
        var szRight = (this.templateView == null ? 0 : this.templateView.width) + 2;
        var szBottom = (this.commandView == null ? 0 : this.commandView.height) + 2;
        this.divMessage.css('left', szLeft + 'px');
        this.divMessage.css('width', (this.width - szLeft - szRight) + 'px');
        this.divMessage.css('height', (this.height - szBottom) + 'px');
        var self = this;
        window.setTimeout(function () {
            if (watermark == self.fadeWatermark)
                self.divMessage.text('');
        }, 5000);
    };
    Sketcher.prototype.clearMessage = function () {
        if (this.divMessage.text() == '')
            return;
        this.fadeWatermark++;
        this.divMessage.text('');
    };
    Sketcher.prototype.autoScale = function () {
        if (this.metavec == null)
            return;
        var limW = this.width - 6, limH = this.height - 6;
        var natW = this.metavec.width, natH = this.metavec.height;
        var scale = 1;
        if (natW > limW) {
            var down = limW / natW;
            scale *= down;
            natW *= down;
            natH *= down;
        }
        if (natH > limH) {
            var down = limH / natH;
            scale *= down;
            natW *= down;
            natH *= down;
        }
        this.offsetX = 0.5 * (this.width - natW);
        this.offsetY = 0.5 * (this.height - natH);
        this.scale = scale;
        this.delayedRedraw();
    };
    Sketcher.prototype.anySelected = function () {
        if (this.selectedMask == null)
            return false;
        for (var n = 0; n < this.selectedMask.length; n++)
            if (this.selectedMask[n])
                return true;
        return false;
    };
    Sketcher.prototype.getSelected = function (N) {
        if (this.selectedMask == null || N > this.selectedMask.length)
            return false;
        return this.selectedMask[N - 1];
    };
    Sketcher.prototype.setSelected = function (N, sel) {
        if (this.selectedMask == null) {
            this.selectedMask = new Array(this.mol.numAtoms());
            for (var n = this.selectedMask.length - 1; n >= 0; n--)
                this.selectedMask[n] = false;
        }
        while (this.selectedMask.length < this.mol.numAtoms()) {
            this.selectedMask.push(false);
        }
        this.selectedMask[N - 1] = sel;
    };
    Sketcher.prototype.getLassoed = function (N) {
        if (this.lassoMask == null || N > this.lassoMask.length)
            return false;
        return this.lassoMask[N - 1];
    };
    Sketcher.prototype.getState = function () {
        var state = {
            'mol': this.mol.clone(),
            'currentAtom': this.currentAtom,
            'currentBond': this.currentBond,
            'selectedMask': this.selectedMask == null ? null : this.selectedMask.slice(0)
        };
        return state;
    };
    Sketcher.prototype.setState = function (state, withStashUndo) {
        if (withStashUndo === void 0) { withStashUndo = true; }
        if (withStashUndo)
            this.stashUndo();
        this.stopTemplateFusion();
        if (state.mol != null)
            this.defineMolecule(state.mol.clone(), false, withStashUndo);
        if (state.currentAtom >= 0)
            this.currentAtom = state.currentAtom;
        if (state.currentBond >= 0)
            this.currentBond = state.currentBond;
        if (state.selectedMask != null)
            this.selectedMask = state.selectedMask == null ? null : state.selectedMask.slice(0);
        this.delayedRedraw();
    };
    Sketcher.prototype.stashUndo = function () {
        if (this.undoStack.length == 0 && this.mol.numAtoms() == 0)
            return;
        var state = this.getState();
        this.undoStack.push(state);
        while (this.undoStack.length > Sketcher.UNDO_SIZE) {
            this.undoStack.splice(0, 1);
        }
        this.redoStack = [];
    };
    Sketcher.prototype.setPermutations = function (perms) {
        this.templatePerms = perms;
        this.pickTemplatePermutation(0);
        this.fusionBank = new FusionBank(this);
        this.templateView.pushBank(this.fusionBank);
    };
    Sketcher.prototype.stopTemplateFusion = function () {
        if (this.fusionBank != null)
            this.templateView.popBank();
    };
    Sketcher.prototype.clearPermutations = function () {
        if (this.templatePerms == null)
            return;
        this.templatePerms = null;
        this.delayedRedraw();
        this.fusionBank = null;
    };
    Sketcher.prototype.templateAccept = function () {
        var mol = Molecule.fromString(this.templatePerms[this.currentPerm].mol);
        this.templateView.popBank();
        this.defineMolecule(mol, false, true);
    };
    Sketcher.prototype.templateRotate = function (dir) {
        var idx = (this.currentPerm + dir) % this.templatePerms.length;
        if (idx < 0)
            idx += this.templatePerms.length;
        this.pickTemplatePermutation(idx);
    };
    Sketcher.prototype.canUndo = function () { return this.undoStack.length > 0; };
    Sketcher.prototype.canRedo = function () { return this.redoStack.length > 0; };
    Sketcher.prototype.performUndo = function () {
        if (this.undoStack.length == 0)
            return;
        var state = this.getState();
        this.redoStack.push(state);
        this.setState(this.undoStack.pop(), false);
    };
    Sketcher.prototype.performRedo = function () {
        if (this.redoStack.length == 0)
            return;
        var state = this.getState();
        this.undoStack.push(state);
        this.setState(this.redoStack.pop(), false);
    };
    Sketcher.prototype.performCopy = function (mol) {
        globalMoleculeClipboard = mol.clone();
        var cookies = new Cookies();
        if (cookies.numMolecules() > 0)
            cookies.stashMolecule(mol);
    };
    Sketcher.prototype.performPaste = function () {
        var cookies = new Cookies();
        if (cookies.numMolecules() == 0) {
            if (MolUtil.notBlank(globalMoleculeClipboard))
                this.pasteMolecule(globalMoleculeClipboard);
            return;
        }
        var dlg = new PickRecent(cookies, 1);
        dlg.onPick1(function (mol) { this.pasteMolecule(mol); }, this);
        dlg.open();
    };
    Sketcher.prototype.zoom = function (mag) {
        var cx = 0.5 * this.width, cy = 0.5 * this.height;
        var newScale = Math.min(10, Math.max(0.1, this.scale * mag));
        this.offsetX = cx - (newScale / this.scale) * (cx - this.offsetX);
        this.offsetY = cy - (newScale / this.scale) * (cy - this.offsetY);
        this.scale = newScale;
        this.delayedRedraw();
    };
    Sketcher.prototype.pasteText = function (str) {
        var mol = Molecule.fromString(str);
        if (mol != null)
            this.pasteMolecule(mol);
        else
            alert('Text from clipboard is not a valid molecule.');
    };
    Sketcher.prototype.pasteMolecule = function (mol) {
        if (this.mol.numAtoms() == 0) {
            this.defineMolecule(mol, true, true);
            return;
        }
        var param = { 'fragNative': mol.toString() };
        new MoleculeActivity(this, ActivityType.TemplateFusion, param).execute();
    };
    Sketcher.prototype.pickTemplatePermutation = function (idx) {
        var perm = this.templatePerms[idx];
        if (perm.metavec == null) {
            var tpolicy = new RenderPolicy(this.policy.data);
            tpolicy.data.foreground = 0x808080;
            tpolicy.data.atomCols = tpolicy.data.atomCols.slice(0);
            for (var n in tpolicy.data.atomCols)
                tpolicy.data.atomCols[n] = 0x808080;
            var input = {
                'tokenID': this.tokenID,
                'policy': tpolicy.data,
                'molNative': perm.display,
                'transform': this.transform
            };
            Func.arrangeMolecule(input, function (result, error) {
                if (!result) {
                    alert('Arrangement of template overlay failed: ' + error.message);
                    return;
                }
                perm.metavec = new MetaVector(result.metavec);
                this.currentPerm = idx;
                this.delayedRedraw();
            }, this);
            return;
        }
        this.currentPerm = idx;
        this.delayedRedraw();
    };
    Sketcher.prototype.redraw = function () {
        this.filthy = false;
        this.redrawUnder();
        this.redrawMolecule();
        this.redrawOver();
    };
    Sketcher.prototype.redrawUnder = function () {
        var HOVER_COL = 0x80808080;
        var CURRENT_COL = 0x40FFC0, CURRENT_BORD = 0x00A43C;
        var SELECT_COL = 0x40C4A8;
        var LASSO_COL = 0xA0D4C8;
        var density = pixelDensity();
        this.canvasUnder.width = this.width * density;
        this.canvasUnder.height = this.height * density;
        this.canvasUnder.style.width = this.width + 'px';
        this.canvasUnder.style.height = this.height + 'px';
        var ctx = this.canvasUnder.getContext('2d');
        ctx.save();
        ctx.scale(density, density);
        ctx.clearRect(0, 0, this.width, this.height);
        if (this.hoverAtom > 0) {
            var sz = 0;
            if (this.hoverAtom == this.currentAtom)
                sz += 0.1;
            if (this.getSelected(this.hoverAtom))
                sz += 0.1;
            if (this.currentBond > 0 && (this.mol.bondFrom(this.currentBond) == this.hoverAtom || this.mol.bondTo(this.currentBond) == this.hoverAtom))
                sz += 0.1;
            this.drawAtomShade(ctx, this.hoverAtom, HOVER_COL, -1, sz);
        }
        if (this.hoverBond > 0) {
            var sz = 0, bfr = this.mol.bondFrom(this.hoverBond), bto = this.mol.bondTo(this.hoverBond);
            if (this.hoverBond == this.currentBond)
                sz += 0.1;
            if (this.getSelected(bfr) && this.getSelected(bto))
                sz += 0.1;
            this.drawBondShade(ctx, this.hoverBond, HOVER_COL, -1, sz);
        }
        for (var n = 1; n <= this.mol.numBonds(); n++) {
            var sz = n == this.currentBond ? 0.1 : 0;
            var bfr = this.mol.bondFrom(n), bto = this.mol.bondTo(n);
            var sfr = this.getSelected(bfr), sto = this.getSelected(bto), lfr = this.getLassoed(bfr), lto = this.getLassoed(bto);
            if (sfr && sto)
                this.drawBondShade(ctx, n, SELECT_COL, -1, sz);
            else if ((sfr || lfr) && (sto || lto))
                this.drawBondShade(ctx, n, LASSO_COL, -1, sz);
        }
        for (var n = 1; n <= this.mol.numAtoms(); n++) {
            var sz = this.currentAtom == n ? 0.1 : 0;
            if (this.getSelected(n))
                this.drawAtomShade(ctx, n, SELECT_COL, -1, sz);
            else if (this.getLassoed(n))
                this.drawAtomShade(ctx, n, LASSO_COL, -1, sz);
        }
        if (this.currentAtom > 0) {
            this.drawAtomShade(ctx, this.currentAtom, CURRENT_COL, CURRENT_BORD, 0);
        }
        if (this.currentBond > 0) {
            var bfr = this.mol.bondFrom(this.currentBond), bto = this.mol.bondTo(this.currentBond);
            this.drawBondShade(ctx, this.currentBond, CURRENT_COL, CURRENT_BORD, 0);
        }
        if (this.dragType == DraggingTool.Move || (this.dragType == DraggingTool.Atom && this.opAtom > 0) || this.dragType == DraggingTool.Bond) {
            if (this.dragGuides != null && this.dragGuides.length > 0) {
                var scale = this.scale * this.policy.data.pointScale;
                for (var _i = 0, _a = this.dragGuides; _i < _a.length; _i++) {
                    var g = _a[_i];
                    for (var n = 0; n < g.x.length; n++) {
                        var lw = this.policy.data.lineSize * scale;
                        ctx.strokeStyle = '#C0C0C0';
                        ctx.lineWidth = lw;
                        drawLine(ctx, g.sourceX, g.sourceY, g.destX[n], g.destY[n]);
                        ctx.beginPath();
                        ctx.ellipse(g.destX[n], g.destY[n], 2 * lw, 2 * lw, 0, 0, TWOPI, false);
                        ctx.fillStyle = '#C0C0C0';
                        ctx.fill();
                    }
                }
            }
        }
        if (this.dragType == DraggingTool.Ring) {
            var _b = this.determineFauxRing(), ringX = _b[0], ringY = _b[1];
            var rsz = ringX == null ? 0 : ringX.length;
            if (rsz > 0) {
                var scale = this.scale * this.policy.data.pointScale;
                var lw = this.policy.data.lineSize * scale;
                ctx.strokeStyle = '#C0C0C0';
                ctx.lineWidth = lw;
                for (var n = 0; n < rsz; n++) {
                    var nn = n < rsz - 1 ? n + 1 : 0;
                    var x1 = this.angToX(ringX[n]), y1 = this.angToY(ringY[n]);
                    var x2 = this.angToX(ringX[nn]), y2 = this.angToY(ringY[nn]);
                    drawLine(ctx, x1, y1, x2, y2);
                }
                if (this.toolRingArom) {
                    var cx = 0, cy = 0;
                    for (var n = 0; n < rsz; n++) {
                        cx += ringX[n];
                        cy += ringY[n];
                    }
                    cx /= rsz;
                    cy /= rsz;
                    var rad = 0;
                    for (var n = 0; n < rsz; n++)
                        rad += norm_xy(ringX[n] - cx, ringY[n] - cy);
                    rad = this.angToScale(rad * 0.5 / rsz);
                    ctx.beginPath();
                    ctx.ellipse(this.angToX(cx), this.angToY(cy), rad, rad, 0, 0, TWOPI, false);
                    ctx.stroke();
                }
            }
        }
        ctx.restore();
    };
    Sketcher.prototype.redrawMolecule = function () {
        var density = pixelDensity();
        this.canvasMolecule.width = this.width * density;
        this.canvasMolecule.height = this.height * density;
        this.canvasMolecule.style.width = this.width + 'px';
        this.canvasMolecule.style.height = this.height + 'px';
        var ctx = this.canvasMolecule.getContext('2d');
        ctx.save();
        ctx.scale(density, density);
        ctx.clearRect(0, 0, this.width, this.height);
        if (this.metavec != null) {
            var draw = new MetaVector(this.rawvec);
            draw.offsetX = this.offsetX;
            draw.offsetY = this.offsetY;
            draw.scale = this.scale;
            draw.renderContext(ctx);
        }
        if (this.templatePerms != null) {
            var perm = this.templatePerms[this.currentPerm];
            if (perm.metavec != null) {
                perm.metavec.offsetX = this.offsetX;
                perm.metavec.offsetY = this.offsetY;
                perm.metavec.scale = this.scale;
                perm.metavec.renderContext(ctx);
            }
        }
        ctx.restore();
    };
    Sketcher.prototype.redrawOver = function () {
        var density = pixelDensity();
        this.canvasOver.width = this.width * density;
        this.canvasOver.height = this.height * density;
        this.canvasOver.style.width = this.width + 'px';
        this.canvasOver.style.height = this.height + 'px';
        var ctx = this.canvasOver.getContext('2d');
        ctx.save();
        ctx.scale(density, density);
        ctx.clearRect(0, 0, this.width, this.height);
        if ((this.dragType == DraggingTool.Lasso || this.dragType == DraggingTool.Erasor) && this.lassoX.length > 1) {
            var erasing = this.dragType == DraggingTool.Erasor;
            var path = new Path2D();
            path.moveTo(this.lassoX[0], this.lassoY[0]);
            for (var n = 1; n < this.lassoX.length; n++)
                path.lineTo(this.lassoX[n], this.lassoY[n]);
            path.closePath();
            ctx.fillStyle = colourCanvas(erasing ? 0xD0FF0000 : 0xD00000FF);
            ctx.fill(path);
            ctx.strokeStyle = erasing ? '#804040' : '#404080';
            ctx.lineWidth = 0.5;
            ctx.stroke(path);
        }
        if (this.dragType == DraggingTool.Rotate) {
            var _a = this.determineDragTheta(), x0 = _a[0], y0 = _a[1], theta = _a[2], magnitude = _a[3];
            var scale = this.scale * this.policy.data.pointScale;
            var lw = this.policy.data.lineSize * scale;
            ctx.strokeStyle = '#E0E0E0';
            ctx.lineWidth = 0.5 * lw;
            drawLine(ctx, x0, y0, x0 + magnitude, y0);
            ctx.strokeStyle = '#808080';
            ctx.lineWidth = lw;
            drawLine(ctx, x0, y0, x0 + magnitude * Math.cos(theta), y0 + magnitude * Math.sin(theta));
            ctx.beginPath();
            ctx.ellipse(x0, y0, 2 * lw, 2 * lw, 0, 0, TWOPI, false);
            ctx.fillStyle = '#808080';
            ctx.fill();
            for (var _i = 0, _b = this.subjectAtoms(true, false); _i < _b.length; _i++) {
                var atom = _b[_i];
                var ax = this.angToX(this.mol.atomX(atom)), ay = this.angToY(this.mol.atomY(atom));
                var ang = Math.atan2(ay - y0, ax - x0), dist = norm_xy(ax - x0, ay - y0);
                var nx = x0 + dist * Math.cos(ang + theta), ny = y0 + dist * Math.sin(ang + theta);
                ctx.beginPath();
                ctx.ellipse(nx, ny, 2 * lw, 2 * lw, 0, 0, TWOPI, false);
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
        if (this.dragType == DraggingTool.Move) {
            var _c = this.determineMoveDelta(), dx = _c[0], dy = _c[1];
            var scale = this.scale * this.policy.data.pointScale;
            var lw = this.policy.data.lineSize * scale;
            for (var _d = 0, _e = this.subjectAtoms(false, true); _d < _e.length; _d++) {
                var atom = _e[_d];
                var ax = this.angToX(this.mol.atomX(atom)), ay = this.angToY(this.mol.atomY(atom));
                ctx.beginPath();
                ctx.ellipse(ax + dx, ay + dy, 2 * lw, 2 * lw, 0, 0, TWOPI, false);
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
        if ((this.dragType == DraggingTool.Atom && this.opAtom > 0) || this.dragType == DraggingTool.Bond) {
            var element = this.dragType == DraggingTool.Atom ? this.toolAtomSymbol : 'C';
            var order = this.dragType == DraggingTool.Bond ? this.toolBondOrder : 1;
            var type = this.dragType == DraggingTool.Bond ? this.toolBondType : Molecule.BONDTYPE_NORMAL;
            this.drawOriginatingBond(ctx, element, order, type);
        }
        ctx.restore();
    };
    Sketcher.prototype.delayedRedraw = function () {
        if (this.canvasMolecule == null)
            return;
        this.filthy = true;
        var self = this;
        var redrawAction = function () {
            if (self.filthy)
                self.redraw();
        };
        window.setTimeout(redrawAction, 10);
    };
    Sketcher.prototype.pickObject = function (x, y) {
        if (this.arrmol == null)
            return 0;
        if (this.toolView != null) {
            var pos1 = this.container.position(), pos2 = this.toolView.content.position();
            if (this.toolView.withinOutline(x + pos1.left - pos2.left, y + pos1.top - pos2.top))
                return 0;
        }
        if (this.commandView != null) {
            var pos1 = this.container.position(), pos2 = this.commandView.content.position();
            if (this.toolView.withinOutline(x + pos1.left - pos2.left, y + pos1.top - pos2.top))
                return 0;
        }
        if (this.templateView != null) {
            var pos1 = this.container.position(), pos2 = this.templateView.content.position();
            if (this.toolView.withinOutline(x + pos1.left - pos2.left, y + pos1.top - pos2.top))
                return 0;
        }
        var limitDSQ = sqr(0.5 * this.scale * this.policy.data.pointScale);
        var bestItem = 0, bestDSQ;
        for (var n = 0; n < this.arrmol.points.length; n++) {
            var p = this.arrmol.points[n];
            if (p.anum == 0)
                continue;
            var dx = Math.abs(x - (p.cx * this.scale + this.offsetX)), dy = Math.abs(y - (p.cy * this.scale + this.offsetY));
            var dsq = norm2_xy(dx, dy);
            if (dsq > limitDSQ)
                continue;
            if (bestItem == 0 || dsq < bestDSQ) {
                bestItem = p.anum;
                bestDSQ = dsq;
            }
        }
        for (var n = 0; n < this.arrmol.lines.length; n++) {
            var l = this.arrmol.lines[n];
            if (l.bnum == 0)
                continue;
            var x1 = l.x1 * this.scale + this.offsetX, y1 = l.y1 * this.scale + this.offsetY;
            var x2 = l.x2 * this.scale + this.offsetX, y2 = l.y2 * this.scale + this.offsetY;
            var bondDSQ = norm2_xy(x2 - x1, y2 - y1) * 0.25;
            var dsq = norm2_xy(x - 0.5 * (x1 + x2), y - 0.5 * (y1 + y2));
            if (dsq > bondDSQ)
                continue;
            if (bestItem == 0 || dsq < bestDSQ) {
                bestItem = -l.bnum;
                bestDSQ = dsq;
            }
        }
        return bestItem;
    };
    Sketcher.prototype.log = function (str, zap) {
        if (this.debugOutput) {
            if (zap)
                this.debugOutput.value = '';
            this.debugOutput.value = this.debugOutput.value + '' + str + '\n';
        }
    };
    Sketcher.prototype.drawAtomShade = function (ctx, atom, fillCol, borderCol, anghalo) {
        if (this.arrmol == null)
            return;
        var p = undefined;
        for (var n = 0; n < this.arrmol.points.length; n++)
            if (this.arrmol.points[n].anum == atom) {
                p = this.arrmol.points[n];
                break;
            }
        if (p == null)
            return;
        var minRad = 0.2 * this.scale * this.policy.data.pointScale, minRadSq = sqr(minRad);
        var cx = p.cx * this.scale + this.offsetX, cy = p.cy * this.scale + this.offsetY;
        var rad = Math.max(minRad, Math.max(p.rw, p.rh) * this.scale) + (0.1 + anghalo) * this.scale * this.policy.data.pointScale;
        if (fillCol != -1) {
            ctx.beginPath();
            ctx.ellipse(cx, cy, rad, rad, 0, 0, TWOPI, true);
            ctx.fillStyle = colourCanvas(fillCol);
            ctx.fill();
        }
        if (borderCol != -1) {
            ctx.beginPath();
            ctx.ellipse(cx, cy, rad, rad, 0, 0, TWOPI, true);
            ctx.strokeStyle = colourCanvas(borderCol);
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    };
    Sketcher.prototype.drawBondShade = function (ctx, bond, fillCol, borderCol, anghalo) {
        if (this.arrmol == null)
            return;
        var x1 = 0, y1 = 0, x2 = 0, y2 = 0, nb = 0, sz = 0;
        for (var n = 0; n < this.arrmol.lines.length; n++) {
            var l = this.arrmol.lines[n];
            if (l.bnum != bond)
                continue;
            x1 += l.x1;
            y1 += l.y1;
            x2 += l.x2;
            y2 += l.y2;
            nb++;
            sz += l.size + (0.2 + anghalo) * this.policy.data.pointScale;
        }
        if (nb == 0)
            return;
        var invNB = 1 / nb;
        sz *= this.scale * invNB;
        x1 = x1 * this.scale * invNB + this.offsetX;
        y1 = y1 * this.scale * invNB + this.offsetY;
        x2 = x2 * this.scale * invNB + this.offsetX;
        y2 = y2 * this.scale * invNB + this.offsetY;
        var dx = x2 - x1, dy = y2 - y1, invDist = 1 / norm_xy(dx, dy);
        dx *= invDist;
        dy *= invDist;
        var ox = dy, oy = -dx;
        var path = new Path2D(), mx, my, CIRC = 0.8;
        path.moveTo(x1 + ox * sz, y1 + oy * sz);
        mx = x1 + (ox * sz - dx * sz) * CIRC;
        my = y1 + (oy * sz - dy * sz) * CIRC;
        path.quadraticCurveTo(mx, my, x1 - dx * sz, y1 - dy * sz);
        mx = x1 + (-ox * sz - dx * sz) * CIRC;
        my = y1 + (-oy * sz - dy * sz) * CIRC;
        path.quadraticCurveTo(mx, my, x1 - ox * sz, y1 - oy * sz);
        path.lineTo(x2 - ox * sz, y2 - oy * sz);
        mx = x2 + (-ox * sz + dx * sz) * CIRC;
        my = y2 + (-oy * sz + dy * sz) * CIRC;
        path.quadraticCurveTo(mx, my, x2 + dx * sz, y2 + dy * sz);
        mx = x2 + (ox * sz + dx * sz) * CIRC;
        my = y2 + (oy * sz + dy * sz) * CIRC;
        path.quadraticCurveTo(mx, my, x2 + ox * sz, y2 + oy * sz);
        path.closePath();
        if (fillCol != -1) {
            ctx.beginPath();
            ctx.fillStyle = colourCanvas(fillCol);
            ctx.fill(path);
        }
        if (borderCol != -1) {
            ctx.beginPath();
            ctx.strokeStyle = colourCanvas(borderCol);
            ctx.lineWidth = 1;
            ctx.stroke(path);
        }
    };
    Sketcher.prototype.drawOriginatingBond = function (ctx, element, order, type) {
        var x1 = this.clickX, y1 = this.clickY;
        if (this.opAtom > 0) {
            x1 = this.arrmol.points[this.opAtom - 1].cx * this.scale + this.offsetX;
            y1 = this.arrmol.points[this.opAtom - 1].cy * this.scale + this.offsetY;
        }
        var x2 = this.mouseX, y2 = this.mouseY;
        var snapTo = this.snapToGuide(x2, y2);
        if (snapTo != null) {
            x2 = snapTo[0];
            y2 = snapTo[1];
        }
        var scale = this.scale * this.policy.data.pointScale;
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = this.policy.data.lineSize * scale;
        drawLine(ctx, x1, y1, x2, y2);
        if (element != 'C') {
            var fh = this.policy.data.fontSize * scale;
            ctx.font = fontSansSerif(fh);
            var metrics = ctx.measureText(element);
            ctx.fillStyle = '#808080';
            ctx.fillText(element, x2 - 0.5 * metrics.width, y2 + 0.5 * fh);
        }
    };
    Sketcher.prototype.updateHoverCursor = function (event) {
        var tool = 'finger';
        if (this.toolView != null)
            tool = this.toolView.selectedButton;
        var toolApplies = tool != 'finger' && tool != 'pan' && tool != 'zoom' && tool != 'rotate';
        var mouseObj = 0;
        if (this.dragType == DraggingTool.None && toolApplies) {
            var xy = eventCoords(event, this.container);
            mouseObj = this.pickObject(xy[0], xy[1]);
        }
        var mouseAtom = mouseObj > 0 ? mouseObj : 0, mouseBond = mouseObj < 0 ? -mouseObj : 0;
        if (mouseAtom != this.hoverAtom || mouseBond != this.hoverBond) {
            this.hoverAtom = mouseAtom;
            this.hoverBond = mouseBond;
            this.delayedRedraw();
        }
    };
    Sketcher.prototype.updateLasso = function (event) {
        if (this.dragType != DraggingTool.Lasso && this.dragType != DraggingTool.Erasor)
            return;
        var xy = eventCoords(event, this.container);
        if (xy[0] < 0 || xy[1] < 0 || xy[0] > this.width || xy[1] > this.height) {
            this.dragType = DraggingTool.None;
            this.lassoX = null;
            this.lassoY = null;
            this.lassoMask = null;
            this.delayedRedraw();
        }
        var len = this.lassoX.length;
        if (len > 0 && this.lassoX[len - 1] == xy[0] && this.lassoY[len - 1] == xy[1])
            return;
        this.lassoX.push(xy[0]);
        this.lassoY.push(xy[1]);
        this.calculateLassoMask();
        this.delayedRedraw();
    };
    Sketcher.prototype.calculateLassoMask = function () {
        this.lassoMask = new Array(this.mol.numAtoms());
        for (var n = 0; n < this.mol.numAtoms(); n++)
            this.lassoMask[n] = false;
        for (var n = 0; n < this.arrmol.points.length; n++) {
            var p = this.arrmol.points[n];
            if (p.anum == 0)
                continue;
            var x = p.cx * this.scale + this.offsetX, y = p.cy * this.scale + this.offsetY;
            this.lassoMask[p.anum - 1] = Geom.pointInPolygon(x, y, this.lassoX, this.lassoY);
        }
    };
    Sketcher.prototype.determineDragGuide = function (order) {
        if (this.opAtom == 0) {
            var g_1 = {
                'atom': 0,
                'orders': [order],
                'x': [],
                'y': [],
                'sourceX': this.clickX,
                'sourceY': this.clickY,
                'destX': [],
                'destY': []
            };
            var mx = this.xToAng(this.clickX), my = this.yToAng(this.clickY);
            for (var n = 0; n < 12; n++) {
                var theta = TWOPI * n / 12;
                var dx = Molecule.IDEALBOND * Math.cos(theta), dy = Molecule.IDEALBOND * Math.sin(theta);
                g_1.x.push(mx + dx);
                g_1.y.push(my + dy);
                g_1.destX.push(this.clickX + dx * this.scale * this.arrmol.scale);
                g_1.destY.push(this.clickY - dy * this.scale * this.arrmol.scale);
            }
            return [g_1];
        }
        if (this.guidelines == null)
            return null;
        var best = null, single = null;
        for (var n = 0; n < this.guidelines.length; n++) {
            var g_2 = this.guidelines[n];
            if (g_2.atom != this.opAtom)
                continue;
            if (g_2.orders.indexOf(order) >= 0) {
                best = g_2;
                break;
            }
            if (g_2.orders.indexOf(1) >= 0)
                single = g_2;
        }
        if (best == null)
            best = single;
        if (best == null)
            return;
        var g = clone(best);
        g.sourceX = this.angToX(this.mol.atomX(g.atom));
        g.sourceY = this.angToY(this.mol.atomY(g.atom));
        g.destX = [];
        g.destY = [];
        for (var n = 0; n < g.x.length; n++) {
            g.destX.push(this.angToX(g.x[n]));
            g.destY.push(this.angToY(g.y[n]));
        }
        return [g];
    };
    Sketcher.prototype.determineMoveGuide = function () {
        var subj = this.subjectAtoms(false, true);
        if (subj.length == 0 || subj.length == this.mol.numAtoms())
            return null;
        var guides = [];
        for (var n = 0; n < this.guidelines.length; n++) {
            var g = this.guidelines[n];
            if (g.orders.indexOf(1) < 0 || subj.indexOf(g.atom) >= 0)
                continue;
            g = clone(g);
            g.sourceX = this.angToX(this.mol.atomX(g.atom));
            g.sourceY = this.angToY(this.mol.atomY(g.atom));
            g.destX = [];
            g.destY = [];
            for (var i = 0; i < g.x.length; i++) {
                g.destX.push(this.angToX(g.x[i]));
                g.destY.push(this.angToY(g.y[i]));
            }
            guides.push(g);
        }
        return guides;
    };
    Sketcher.prototype.determineDragTheta = function () {
        var x0 = this.clickX, y0 = this.clickY;
        var snap = this.snapToGuide(x0, y0);
        if (snap != null) {
            x0 = snap[0];
            y0 = snap[1];
        }
        var theta = Math.atan2(this.mouseY - y0, this.mouseX - x0), magnitude = norm_xy(this.mouseX - x0, this.mouseY - y0);
        if (this.toolRotateIncr > 0)
            theta = Math.round(theta / this.toolRotateIncr) * this.toolRotateIncr;
        return [x0, y0, theta, magnitude];
    };
    Sketcher.prototype.determineMoveDelta = function () {
        var x1 = this.clickX, y1 = this.clickY, x2 = this.mouseX, y2 = this.mouseY;
        if (this.opAtom > 0) {
            x1 = this.angToX(this.mol.atomX(this.opAtom));
            y1 = this.angToY(this.mol.atomY(this.opAtom));
            var snap = this.snapToGuide(x2, y2);
            if (snap != null) {
                x2 = snap[0];
                y2 = snap[1];
            }
        }
        return [x2 - x1, y2 - y1];
    };
    Sketcher.prototype.determineFauxRing = function () {
        var atom = this.opAtom, bond = this.opBond, mol = this.mol;
        var x1 = atom > 0 ? mol.atomX(atom) : bond > 0 ? 0.5 * (mol.atomX(mol.bondFrom(bond)) + mol.atomX(mol.bondTo(bond))) : this.xToAng(this.clickX);
        var y1 = atom > 0 ? mol.atomY(atom) : bond > 0 ? 0.5 * (mol.atomY(mol.bondFrom(bond)) + mol.atomY(mol.bondTo(bond))) : this.yToAng(this.clickY);
        var x2 = this.xToAng(this.mouseX), y2 = this.yToAng(this.mouseY), dx = x2 - x1, dy = y2 - y1;
        var rsz = Math.min(9, Math.round(norm_xy(dx, dy) * 2 / Molecule.IDEALBOND) + 2);
        if (rsz < 3) { }
        else if (bond > 0) {
            return SketchUtil.proposeBondRing(mol, rsz, bond, dx, dy);
        }
        else if (atom > 0 && mol.atomAdjCount(atom) > 0 && !this.toolRingFreeform) {
            return SketchUtil.proposeAtomRing(mol, rsz, atom, dx, dy);
        }
        else {
            return SketchUtil.proposeNewRing(mol, rsz, x1, y1, dx, dy, !this.toolRingFreeform);
        }
        return [null, null];
    };
    Sketcher.prototype.snapToGuide = function (x, y) {
        var bestDSQ = Number.POSITIVE_INFINITY, bestX = 0, bestY = 0;
        var APPROACH = sqr(0.5 * this.scale * this.policy.data.pointScale);
        if (this.dragGuides != null)
            for (var i = 0; i < this.dragGuides.length; i++)
                for (var j = 0; j < this.dragGuides[i].x.length; j++) {
                    var px = this.dragGuides[i].destX[j], py = this.dragGuides[i].destY[j];
                    var dsq = norm2_xy(px - x, py - y);
                    if (dsq < APPROACH && dsq < bestDSQ) {
                        bestDSQ = dsq;
                        bestX = px;
                        bestY = py;
                    }
                }
        for (var n = 1; n <= this.mol.numAtoms(); n++) {
            var px = this.angToX(this.mol.atomX(n)), py = this.angToY(this.mol.atomY(n));
            var dsq = norm2_xy(px - x, py - y);
            if (dsq < APPROACH && dsq < bestDSQ) {
                bestDSQ = dsq;
                bestX = px;
                bestY = py;
            }
        }
        if (isFinite(bestDSQ))
            return [bestX, bestY];
        return null;
    };
    Sketcher.prototype.angToX = function (ax) {
        if (this.arrmol == null || this.arrmol.points.length == 0)
            return 0.5 * this.width + ax * this.scale * this.policy.data.pointScale;
        return this.offsetX + this.scale * (this.transform[0] + this.transform[2] * ax);
    };
    Sketcher.prototype.angToY = function (ay) {
        if (this.arrmol == null || this.arrmol.points.length == 0)
            return 0.5 * this.height - ay * this.scale * this.policy.data.pointScale;
        return this.offsetY + this.scale * (this.transform[1] - this.transform[2] * ay);
    };
    Sketcher.prototype.xToAng = function (px) {
        if (this.arrmol == null || this.arrmol.points.length == 0)
            return (px - 0.5 * this.width) / (this.scale * this.policy.data.pointScale);
        return ((px - this.offsetX) / this.scale - this.transform[0]) / this.transform[2];
    };
    Sketcher.prototype.yToAng = function (py) {
        if (this.arrmol == null || this.arrmol.points.length == 0)
            return (0.5 * this.height - py) / (this.scale * this.policy.data.pointScale);
        return (this.transform[1] - (py - this.offsetY) / this.scale) / this.transform[2];
    };
    Sketcher.prototype.scaleToAng = function (scale) { return scale / (this.scale * this.transform[2]); };
    Sketcher.prototype.angToScale = function (ang) { return ang * this.scale * this.transform[2]; };
    Sketcher.prototype.subjectAtoms = function (allIfNone, useOpAtom) {
        if (allIfNone === void 0) { allIfNone = false; }
        if (useOpAtom === void 0) { useOpAtom = false; }
        var atoms = [];
        if (this.selectedMask != null) {
            for (var n = 0; n < this.selectedMask.length; n++)
                if (this.selectedMask[n])
                    atoms.push(n + 1);
            if (atoms.length > 0)
                return atoms;
        }
        if (this.currentAtom > 0)
            atoms.push(this.currentAtom);
        else if (this.currentBond > 0) {
            atoms.push(this.mol.bondFrom(this.currentBond));
            atoms.push(this.mol.bondTo(this.currentBond));
        }
        if (useOpAtom && atoms.length == 0 && this.opAtom > 0)
            atoms.push(this.opAtom);
        if (allIfNone && atoms.length == 0) {
            for (var n = 1; n <= this.mol.numAtoms(); n++)
                atoms.push(n);
        }
        return atoms;
    };
    Sketcher.prototype.mouseClick = function (event) {
    };
    Sketcher.prototype.mouseDoubleClick = function (event) {
        event.stopImmediatePropagation();
    };
    Sketcher.prototype.mouseDown = function (event) {
        this.clearMessage();
        this.dragType = DraggingTool.Press;
        this.opBudged = false;
        this.dragGuides = null;
        var xy = eventCoords(event, this.container);
        this.mouseX = xy[0];
        this.mouseY = xy[1];
        this.clickX = xy[0];
        this.clickY = xy[1];
        var clickObj = this.pickObject(xy[0], xy[1]);
        this.opAtom = clickObj > 0 ? clickObj : 0;
        this.opBond = clickObj < 0 ? -clickObj : 0;
        this.opShift = event.shiftKey;
        this.opCtrl = event.ctrlKey;
        this.opAlt = event.altKey;
        var tool = 'finger';
        if (this.toolView != null)
            tool = this.toolView.selectedButton;
        if (tool == 'arrow') {
            if (!this.opShift && !this.opCtrl && !this.opAlt) {
                this.dragType = DraggingTool.Press;
            }
            else if (!this.opShift && this.opCtrl && !this.opAlt) {
            }
            else if (!this.opShift && !this.opCtrl && this.opAlt) {
                this.dragType = DraggingTool.Pan;
            }
            else if (!this.opShift && this.opCtrl && this.opAlt) {
                this.dragType = DraggingTool.Zoom;
            }
        }
        else if (tool == 'rotate') {
            this.dragType = DraggingTool.Rotate;
            this.toolRotateIncr = this.opShift ? 0 : 15 * DEGRAD;
        }
        else if (tool == 'pan') {
            this.dragType = DraggingTool.Pan;
        }
        else if (tool == 'drag') {
            this.dragType = DraggingTool.Move;
            if (this.opAtom > 0)
                this.dragGuides = this.determineMoveGuide();
            this.delayedRedraw();
        }
        else if (tool == 'erasor') {
            this.dragType = DraggingTool.Erasor;
            this.lassoX = [xy[0]];
            this.lassoY = [xy[1]];
            this.lassoMask = [];
        }
        else if (tool == 'ringAliph') {
            this.dragType = DraggingTool.Ring;
            this.toolRingArom = false;
            this.toolRingFreeform = this.opShift;
        }
        else if (tool == 'ringArom') {
            this.dragType = DraggingTool.Ring;
            this.toolRingArom = true;
            this.toolRingFreeform = this.opShift;
        }
        else if (tool == 'atomPlus') {
            this.dragType = DraggingTool.Charge;
            this.toolChargeDelta = 1;
        }
        else if (tool == 'atomMinus') {
            this.dragType = DraggingTool.Charge;
            this.toolChargeDelta = -1;
        }
        else if (tool.startsWith('bond')) {
            this.dragType = DraggingTool.Bond;
            this.toolBondOrder = 1;
            this.toolBondType = Molecule.BONDTYPE_NORMAL;
            if (tool == 'bondOrder0')
                this.toolBondOrder = 0;
            else if (tool == 'bondOrder2')
                this.toolBondOrder = 2;
            else if (tool == 'bondOrder3')
                this.toolBondOrder = 3;
            else if (tool == 'bondUnknown')
                this.toolBondType = Molecule.BONDTYPE_UNKNOWN;
            else if (tool == 'bondInclined')
                this.toolBondType = Molecule.BONDTYPE_INCLINED;
            else if (tool == 'bondDeclined')
                this.toolBondType = Molecule.BONDTYPE_DECLINED;
            this.dragGuides = this.determineDragGuide(this.toolBondOrder);
        }
        else if (tool.startsWith('element')) {
            this.dragType = DraggingTool.Atom;
            this.toolAtomSymbol = tool.substring(7);
            this.dragGuides = this.determineDragGuide(1);
        }
    };
    Sketcher.prototype.mouseUp = function (event) {
        if (!this.opBudged) {
            var xy = eventCoords(event, this.container);
            var clickObj = this.pickObject(xy[0], xy[1]);
            var clickAtom = clickObj > 0 ? clickObj : 0, clickBond = clickObj < 0 ? -clickObj : 0;
            if (this.dragType == DraggingTool.Press) {
                if (!this.opShift && !this.opCtrl && !this.opAlt) {
                    if (clickAtom == 0 && clickBond == 0) {
                        if (anyTrue(this.selectedMask))
                            this.selectedMask = null;
                        else if (this.currentAtom > 0)
                            this.currentAtom = 0;
                        else if (this.currentBond > 0)
                            this.currentBond = 0;
                    }
                    else if (clickAtom != this.currentAtom || clickBond != this.currentBond) {
                        this.currentAtom = clickAtom;
                        this.currentBond = clickBond;
                        this.delayedRedraw();
                    }
                    else if (clickAtom == 0 && clickBond == 0 && this.anySelected()) {
                        this.selectedMask = null;
                        this.delayedRedraw();
                    }
                }
                else if (this.opShift && !this.opCtrl && !this.opAlt) {
                }
            }
            else if (this.dragType == DraggingTool.Erasor) {
                if (this.opAtom > 0 || this.opBond > 0) {
                    var molact = new MoleculeActivity(this, ActivityType.Delete, {});
                    molact.input.currentAtom = this.opAtom;
                    molact.input.currentBond = this.opBond;
                    molact.input.selectedMask = null;
                    molact.execute();
                }
            }
            else if (this.dragType == DraggingTool.Atom) {
                var element = this.toolAtomSymbol;
                if (element == 'A') {
                    element = window.prompt('Enter element symbol:', this.opAtom == 0 ? '' : this.mol.atomElement(this.opAtom));
                }
                if (element != '') {
                    var param = { 'element': element };
                    if (this.opAtom == 0) {
                        var x = this.xToAng(this.clickX), y = this.yToAng(this.clickY);
                        if (this.mol.numAtoms() == 0) {
                            this.offsetX = this.clickX;
                            this.offsetY = this.clickY;
                            x = 0;
                            y = 0;
                        }
                        param.position = [x, y];
                    }
                    var molact = new MoleculeActivity(this, ActivityType.Element, param);
                    molact.input.currentAtom = this.opAtom;
                    molact.input.currentBond = 0;
                    molact.input.selectedMask = null;
                    molact.execute();
                }
            }
            else if (this.dragType == DraggingTool.Charge) {
                if (this.opAtom > 0 || this.opBond > 0) {
                    var molact = new MoleculeActivity(this, ActivityType.Charge, { 'delta': this.toolChargeDelta });
                    molact.input.currentAtom = this.opAtom;
                    molact.input.currentBond = this.opBond;
                    molact.input.selectedMask = null;
                    molact.execute();
                }
            }
            else if (this.dragType == DraggingTool.Bond) {
                var molact = void 0;
                if (this.toolBondType == Molecule.BONDTYPE_NORMAL)
                    molact = new MoleculeActivity(this, ActivityType.BondOrder, { 'order': this.toolBondOrder });
                else
                    molact = new MoleculeActivity(this, ActivityType.BondType, { 'type': this.toolBondType });
                molact.input.currentAtom = this.opAtom;
                molact.input.currentBond = this.opBond;
                molact.input.selectedMask = null;
                molact.execute();
            }
        }
        else {
            if (this.dragType == DraggingTool.Lasso) {
                if (this.lassoX.length >= 2) {
                    this.calculateLassoMask();
                    for (var n = 1; n <= this.mol.numAtoms(); n++)
                        if (this.getLassoed(n) && !this.getSelected(n))
                            this.setSelected(n, true);
                }
                this.lassoX = null;
                this.lassoY = null;
                this.lassoMask = null;
                this.delayedRedraw();
            }
            else if (this.dragType == DraggingTool.Erasor) {
                var any = false;
                for (var n = 0; n < this.lassoMask.length; n++)
                    if (this.lassoMask[n]) {
                        any = true;
                        break;
                    }
                if (any) {
                    var molact = new MoleculeActivity(this, ActivityType.Delete, {});
                    molact.input.currentAtom = 0;
                    molact.input.currentBond = 0;
                    molact.input.selectedMask = this.lassoMask;
                    molact.execute();
                }
            }
            else if (this.dragType == DraggingTool.Rotate) {
                var _a = this.determineDragTheta(), x0 = _a[0], y0 = _a[1], theta = _a[2], magnitude = _a[3];
                var degrees = -theta * DEGRAD;
                var mx = this.xToAng(x0), my = this.yToAng(y0);
                var molact = new MoleculeActivity(this, ActivityType.Rotate, { 'theta': degrees, 'centreX': mx, 'centreY': my });
                molact.execute();
            }
            else if (this.dragType == DraggingTool.Move) {
                var _b = this.determineMoveDelta(), dx = _b[0], dy = _b[1];
                var scale = this.scale * this.policy.data.pointScale;
                var molact = new MoleculeActivity(this, ActivityType.Move, { 'refAtom': this.opAtom, 'deltaX': dx / scale, 'deltaY': -dy / scale });
                molact.execute();
            }
            else if (this.dragType == DraggingTool.Ring) {
                var _c = this.determineFauxRing(), ringX = _c[0], ringY = _c[1];
                if (ringX != null) {
                    var param = {
                        'ringX': ringX,
                        'ringY': ringY,
                        'aromatic': this.toolRingArom
                    };
                    var molact = new MoleculeActivity(this, ActivityType.Ring, param);
                    molact.execute();
                }
            }
            else if (this.dragType == DraggingTool.Atom && this.opAtom > 0) {
                var x2 = this.mouseX, y2 = this.mouseY;
                var snapTo = this.snapToGuide(x2, y2);
                if (snapTo != null) {
                    x2 = snapTo[0];
                    y2 = snapTo[1];
                }
                var param = {
                    'order': 1,
                    'type': Molecule.BONDTYPE_NORMAL,
                    'element': this.toolAtomSymbol,
                    'x1': this.mol.atomX(this.opAtom),
                    'y1': this.mol.atomY(this.opAtom),
                    'x2': this.xToAng(x2),
                    'y2': this.yToAng(y2)
                };
                if (this.toolAtomSymbol == 'A')
                    param.element = window.prompt('Enter element symbol:', '');
                if (param.element != '') {
                    var molact = new MoleculeActivity(this, ActivityType.BondAtom, param);
                    molact.execute();
                }
            }
            else if (this.dragType == DraggingTool.Bond) {
                var x2 = this.mouseX, y2 = this.mouseY;
                var snapTo = this.snapToGuide(x2, y2);
                if (snapTo != null) {
                    x2 = snapTo[0];
                    y2 = snapTo[1];
                }
                var param = {
                    'order': this.toolBondOrder,
                    'type': this.toolBondType,
                    'element': "C",
                    'x1': this.opAtom == 0 ? this.xToAng(this.clickX) : this.mol.atomX(this.opAtom),
                    'y1': this.opAtom == 0 ? this.yToAng(this.clickY) : this.mol.atomY(this.opAtom),
                    'x2': this.xToAng(x2),
                    'y2': this.yToAng(y2)
                };
                var molact = new MoleculeActivity(this, ActivityType.BondAtom, param);
                molact.execute();
            }
        }
        this.dragType = DraggingTool.None;
        this.lassoX = null;
        this.lassoY = null;
        this.lassoMask = null;
        this.dragGuides = null;
        this.delayedRedraw();
    };
    Sketcher.prototype.mouseOver = function (event) {
        this.updateHoverCursor(event);
        this.updateLasso(event);
    };
    Sketcher.prototype.mouseOut = function (event) {
        this.updateHoverCursor(event);
        this.updateLasso(event);
    };
    Sketcher.prototype.mouseMove = function (event) {
        this.updateHoverCursor(event);
        if (this.dragType == DraggingTool.None)
            return;
        var xy = eventCoords(event, this.container);
        if (!this.opBudged) {
            var dx = xy[0] - this.clickX, dy = xy[1] - this.clickY;
            if (dx * dx + dy * dy > 2 * 2)
                this.opBudged = true;
        }
        if (this.dragType == DraggingTool.Press && this.opAtom == 0 && this.opBond == 0 && this.opBudged) {
            this.dragType = DraggingTool.Lasso;
            this.lassoX = [xy[0]];
            this.lassoY = [xy[1]];
            this.lassoMask = [];
        }
        if (this.dragType == DraggingTool.Lasso || this.dragType == DraggingTool.Erasor) {
            this.updateLasso(event);
        }
        else if (this.dragType == DraggingTool.Pan) {
            var xy_2 = eventCoords(event, this.container);
            var dx = xy_2[0] - this.mouseX, dy = xy_2[1] - this.mouseY;
            if (dx != 0 || dy != 0) {
                this.offsetX += dx;
                this.offsetY += dy;
                this.delayedRedraw();
            }
            this.mouseX = xy_2[0];
            this.mouseY = xy_2[1];
        }
        else if (this.dragType == DraggingTool.Zoom) {
            var xy_3 = eventCoords(event, this.container);
            var dy = xy_3[1] - this.mouseY;
            if (dy != 0) {
                dy = Math.min(50, Math.max(-50, dy));
                var newScale = this.scale * (1 - dy * 0.01);
                newScale = Math.min(10, Math.max(0.1, newScale));
                var newOX = this.clickX - (newScale / this.scale) * (this.clickX - this.offsetX);
                var newOY = this.clickY - (newScale / this.scale) * (this.clickY - this.offsetY);
                this.scale = newScale;
                this.offsetX = newOX;
                this.offsetY = newOY;
                this.delayedRedraw();
            }
            this.mouseX = xy_3[0];
            this.mouseY = xy_3[1];
        }
        else if (this.dragType == DraggingTool.Rotate ||
            this.dragType == DraggingTool.Move ||
            this.dragType == DraggingTool.Atom ||
            this.dragType == DraggingTool.Bond ||
            this.dragType == DraggingTool.Ring) {
            this.mouseX = xy[0];
            this.mouseY = xy[1];
            this.delayedRedraw();
        }
    };
    Sketcher.prototype.keyPressed = function (event) {
    };
    Sketcher.prototype.keyDown = function (event) {
    };
    Sketcher.prototype.keyUp = function (event) {
    };
    Sketcher.prototype.mouseWheel = function (event) {
    };
    Sketcher.prototype.dropInto = function (transfer) {
        var self = this;
        var items = transfer.items, files = transfer.files;
        for (var n = 0; n < items.length; n++) {
            if (items[n].type.startsWith('text/plain')) {
                items[n].getAsString(function (str) {
                    var mol = Molecule.fromString(str);
                    if (mol != null) {
                        self.defineMolecule(mol, true, true);
                    }
                    else
                        console.log('Dragged data is not a SketchEl molecule: ' + str);
                });
                return;
            }
        }
        var _loop_3 = function(n) {
            if (files[n].name.endsWith('.el')) {
                var reader_1 = new FileReader();
                reader_1.onload = function (event) {
                    var str = reader_1.result;
                    var mol = Molecule.fromString(str);
                    if (mol != null) {
                        self.defineMolecule(mol, true, true);
                    }
                    else
                        console.log('Dragged file is not a SketchEl molecule: ' + str);
                };
                reader_1.readAsText(files[n]);
                return { value: void 0 };
            }
        };
        for (var n = 0; n < files.length; n++) {
            var state_3 = _loop_3(n);
            if (typeof state_3 === "object") return state_3.value;
        }
    };
    Sketcher.UNDO_SIZE = 20;
    return Sketcher;
}(Widget));
var EditCompound = (function (_super) {
    __extends(EditCompound, _super);
    function EditCompound(tokenID, mol) {
        _super.call(this);
        this.tokenID = tokenID;
        this.mol = mol;
        this.fakeTextArea = null;
        this.callbackSave = null;
        this.masterSave = null;
        this.title = "Edit Compound";
        this.minPortionWidth = 20;
        this.maxPortionWidth = 95;
    }
    EditCompound.prototype.onSave = function (callback, master) {
        this.callbackSave = callback;
        this.masterSave = master;
    };
    EditCompound.prototype.getMolecule = function () { return this.sketcher.getMolecule(); };
    EditCompound.prototype.populate = function () {
        var buttons = this.buttons(), body = this.body();
        var self = this;
        this.btnClear = $('<button class="button button-default">Clear</button>').appendTo(buttons);
        this.btnClear.click(function () { self.sketcher.clearMolecule(); });
        buttons.append(' ');
        this.btnCopy = $('<button class="button button-default">Copy</button>').appendTo(buttons);
        this.btnCopy.click(function () { self.copyMolecule(); });
        buttons.append(' ');
        buttons.append(this.btnClose);
        buttons.append(' ');
        this.btnSave = $('<button class="button button-primary">Save</button>').appendTo(buttons);
        this.btnSave.click(function () { if (self.callbackSave)
            self.callbackSave.call(self.masterSave, self); });
        var skw = 800, skh = 700;
        var skdiv = $('<div></div>').appendTo(this.body());
        skdiv.css('width', skw + 'px');
        skdiv.css('height', skh + 'px');
        this.sketcher = new Sketcher(this.tokenID);
        this.sketcher.setSize(skw, skh);
        this.sketcher.defineMolecule(this.mol);
        this.sketcher.setup(function () { this.sketcher.render(skdiv); }, this);
    };
    EditCompound.prototype.pasteMolecule = function () {
    };
    EditCompound.prototype.copyMolecule = function () {
        this.installFake();
        this.fakeTextArea.value = this.sketcher.getMolecule().toString();
        this.fakeTextArea.select();
        document.execCommand('copy');
    };
    EditCompound.prototype.installFake = function () {
        if (this.fakeTextArea != null)
            return;
        this.fakeTextArea = document.createElement('textarea');
        this.fakeTextArea.style.fontSize = '12pt';
        this.fakeTextArea.style.border = '0';
        this.fakeTextArea.style.padding = '0';
        this.fakeTextArea.style.margin = '0';
        this.fakeTextArea.style.position = 'fixed';
        this.fakeTextArea.style['left'] = '-9999px';
        this.fakeTextArea.style.top = (window.pageYOffset || document.documentElement.scrollTop) + 'px';
        this.fakeTextArea.setAttribute('readonly', '');
        document.body.appendChild(this.fakeTextArea);
    };
    return EditCompound;
}(Dialog));
var MapReaction = (function (_super) {
    __extends(MapReaction, _super);
    function MapReaction(mol1, mol2) {
        _super.call(this);
        this.callbackSave = null;
        this.masterSave = null;
        this.rawvec1 = null;
        this.metavec1 = null;
        this.arrmol1 = null;
        this.transform1 = null;
        this.rawvec2 = null;
        this.metavec2 = null;
        this.arrmol2 = null;
        this.transform2 = null;
        this.scale = 1;
        this.ARROWWIDTH = 30;
        this.COLCYCLE = ['#89A54E', '#71588F', '#4198AF', '#DB843D', '#93A9CF', '#D19392', '#4572A7', '#AA4643'];
        this.highlighted = [0, 0];
        this.pressed = [0, 0];
        this.mol1 = mol1.clone();
        this.mol2 = mol2.clone();
        this.policy = RenderPolicy.defaultBlackOnWhite();
        this.policy.data.pointScale = 40;
        this.title = "Map Reaction Atoms";
        this.minPortionWidth = 20;
        this.maxPortionWidth = 95;
    }
    MapReaction.prototype.onSave = function (callback, master) {
        this.callbackSave = callback;
        this.masterSave = master;
    };
    MapReaction.prototype.getMolecule1 = function () { return this.mol1; };
    MapReaction.prototype.getMolecule2 = function () { return this.mol2; };
    MapReaction.prototype.populate = function () {
        var buttons = this.buttons(), body = this.body();
        var self = this;
        this.btnClear = $('<button class="button button-default">Clear</button>').appendTo(buttons);
        this.btnClear.click(function () { self.clearAllMappings(); });
        buttons.append(' ');
        buttons.append(this.btnClose);
        buttons.append(' ');
        this.btnSave = $('<button class="button button-primary">Save</button>').appendTo(buttons);
        this.btnSave.click(function () { if (self.callbackSave)
            self.callbackSave.call(self.masterSave, self); });
        Func.arrangeMolecule({ 'policy': this.policy.data, 'molNative': this.mol1.toString() }, function (result, error) {
            this.arrmol1 = result.arrmol;
            this.rawvec1 = result.metavec;
            this.metavec1 = new MetaVector(result.metavec);
            this.transform1 = result.transform;
            Func.arrangeMolecule({ 'policy': this.policy.data, 'molNative': this.mol2.toString() }, function (result, error) {
                this.arrmol2 = result.arrmol;
                this.rawvec2 = result.metavec;
                this.metavec2 = new MetaVector(result.metavec);
                this.transform2 = result.transform;
                this.setupPanel();
            }, this);
        }, this);
    };
    MapReaction.prototype.setupPanel = function () {
        var maxWidth = 0.9 * $(window).width(), maxHeight = 0.8 * $(window).height();
        this.padding = 1 * this.policy.data.pointScale;
        var scale1 = (maxWidth - this.ARROWWIDTH) / (this.metavec1.width + this.metavec2.width + 4 * this.padding);
        var scale2 = maxHeight / (this.metavec1.height + 2 * this.padding);
        var scale3 = maxHeight / (this.metavec2.height + 2 * this.padding);
        this.scale = Math.min(1, Math.min(scale1, Math.min(scale2, scale3)));
        this.canvasW = Math.ceil((this.metavec1.width + this.metavec2.width + 4 * this.padding) * this.scale + this.ARROWWIDTH);
        this.canvasH = Math.ceil((Math.max(this.metavec1.height, this.metavec2.height) + 2 * this.padding) * this.scale);
        this.offsetX1 = this.padding * this.scale;
        this.offsetY1 = 0.5 * (this.canvasH - this.metavec1.height * this.scale);
        this.offsetX2 = (this.metavec1.width + 3 * this.padding) * this.scale + this.ARROWWIDTH;
        this.offsetY2 = 0.5 * (this.canvasH - this.metavec2.height * this.scale);
        var div = $('<div></div>').appendTo(this.body());
        div.css('position', 'relative');
        div.css('width', this.canvasW + 'px');
        div.css('height', this.canvasH + 'px');
        var density = pixelDensity();
        var styleCanvas = 'position: absolute; left: 0; top: 0; width: ' + this.canvasW + 'px; height: ' + this.canvasH + 'px;';
        var styleOverlay = styleCanvas + 'pointer-events: none;';
        this.canvas = newElement(div, 'canvas', { 'width': this.canvasW * density, 'height': this.canvasH * density, 'style': styleCanvas });
        var ctx = this.canvas.getContext('2d');
        ctx.scale(density, density);
        this.redrawCanvas();
        var self = this;
        $(this.canvas).mousedown(function (event) { event.preventDefault(); self.mouseDown(event); });
        $(this.canvas).mouseup(function (event) { self.mouseUp(event); });
        $(this.canvas).mouseenter(function (event) { self.mouseEnter(event); });
        $(this.canvas).mouseleave(function (event) { self.mouseLeave(event); });
        $(this.canvas).mousemove(function (event) { self.mouseMove(event); });
        this.drawnMols = newElement(div, 'canvas', { 'width': this.canvasW * density, 'height': this.canvasH * density, 'style': styleOverlay });
        ctx = this.drawnMols.getContext('2d');
        ctx.scale(density, density);
        var draw = new MetaVector(this.rawvec1);
        draw.offsetX = this.offsetX1;
        draw.offsetY = this.offsetY1;
        draw.scale = this.scale;
        draw.renderContext(ctx);
        draw = new MetaVector(this.rawvec2);
        draw.offsetX = this.offsetX2;
        draw.offsetY = this.offsetY2;
        draw.scale = this.scale;
        draw.renderContext(ctx);
        this.bump();
    };
    MapReaction.prototype.redrawCanvas = function () {
        var ctx = this.canvas.getContext('2d');
        var w = this.canvasW, h = this.canvasH;
        ctx.clearRect(0, 0, w, h);
        var arrowX1 = (2 * this.padding + this.metavec1.width) * this.scale;
        var arrowX2 = arrowX1 + this.ARROWWIDTH;
        var arrowY = 0.5 * this.canvasH;
        ctx.beginPath();
        ctx.moveTo(arrowX1, arrowY);
        ctx.lineTo(arrowX2 - 2, arrowY);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(arrowX2, arrowY);
        ctx.lineTo(arrowX2 - 8, arrowY - 5);
        ctx.lineTo(arrowX2 - 8, arrowY + 5);
        ctx.fillStyle = 'black';
        ctx.fill();
        this.drawHighlights(ctx, 1, this.highlighted[0] == 1 ? this.highlighted[1] : 0);
        this.drawHighlights(ctx, 2, this.highlighted[0] == 2 ? this.highlighted[1] : 0);
        if (this.pressed[0] > 0) {
            var compatMask = this.compatibilityMask(this.pressed[0], this.pressed[1]);
            ctx.strokeStyle = '#808080';
            ctx.lineWidth = 1;
            if (this.pressed[0] == 1) {
                for (var n = 1; n <= this.mol2.numAtoms(); n++)
                    if (compatMask[n - 1]) {
                        var _a = this.getAtomPos(2, n), cx = _a[0], cy = _a[1], rw = _a[2], rh = _a[3];
                        ctx.beginPath();
                        ctx.ellipse(cx, cy, rw, rh, 0, 0, TWOPI, false);
                        ctx.stroke();
                    }
            }
            else {
                for (var n = 1; n <= this.mol1.numAtoms(); n++)
                    if (compatMask[n - 1]) {
                        var _b = this.getAtomPos(1, n), cx = _b[0], cy = _b[1], rw = _b[2], rh = _b[3];
                        ctx.beginPath();
                        ctx.ellipse(cx, cy, rw, rh, 0, 0, TWOPI, false);
                        ctx.stroke();
                    }
            }
            var _c = this.getAtomPos(this.pressed[0], this.pressed[1]), cx1 = _c[0], cy1 = _c[1], rw1 = _c[2], rh1 = _c[3];
            ctx.beginPath();
            ctx.ellipse(cx1, cy1, rw1, rh1, 0, 0, TWOPI, false);
            ctx.fillStyle = '#808080';
            ctx.fill();
            var dx = this.dragToX, dy = this.dragToY;
            var dest = this.pickAtom(dx, dy, this.pressed[0] == 2 ? compatMask : null, this.pressed[0] == 1 ? compatMask : null);
            if (dest[0] == 3 - this.pressed[0]) {
                var _d = this.getAtomPos(dest[0], dest[1]), cx2 = _d[0], cy2 = _d[1], rw2 = _d[2], rh2 = _d[3];
                ctx.beginPath();
                ctx.ellipse(cx2, cy2, rw2, rh2, 0, 0, TWOPI, false);
                ctx.fillStyle = '#808080';
                ctx.fill();
                dx = cx2;
                dy = cy2;
            }
            ctx.beginPath();
            ctx.moveTo(cx1, cy1);
            ctx.lineTo(dx, dy);
            ctx.strokeStyle = '#808080';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    };
    MapReaction.prototype.drawHighlights = function (ctx, side, highlight) {
        var mol = side == 1 ? this.mol1 : this.mol2;
        var arrmol = side == 1 ? this.arrmol1 : this.arrmol2;
        var offsetX = side == 1 ? this.offsetX1 : this.offsetX2;
        var offsetY = side == 1 ? this.offsetY1 : this.offsetY2;
        var scale = this.scale;
        for (var n = 1; n <= mol.numAtoms(); n++) {
            var mapnum = mol.atomMapNum(n);
            if (mapnum == 0 && n != highlight)
                continue;
            var pt = arrmol.points[n - 1];
            var cx = offsetX + pt.cx * scale, cy = offsetY + pt.cy * scale;
            var rw = Math.max(0.5 * this.policy.data.pointScale, pt.rw) * scale, rh = Math.max(0.5 * this.policy.data.pointScale, pt.rh) * scale;
            if (mapnum > 0) {
                var col = this.COLCYCLE[(mapnum - 1) % this.COLCYCLE.length];
                ctx.beginPath();
                ctx.ellipse(cx, cy, rw, rh, 0, 0, TWOPI, false);
                ctx.fillStyle = col;
                ctx.fill();
                if (n == highlight) {
                    var oside = 3 - side, omol = side == 1 ? this.mol2 : this.mol1;
                    for (var i = 1; i <= omol.numAtoms(); i++)
                        if (omol.atomMapNum(i) == mapnum) {
                            var _a = this.getAtomPos(oside, i), dx = _a[0], dy = _a[1];
                            ctx.beginPath();
                            ctx.moveTo(cx, cy);
                            ctx.lineTo(dx, dy);
                            ctx.strokeStyle = col;
                            ctx.lineWidth = 1;
                            ctx.stroke();
                        }
                }
            }
            if (n == highlight) {
                ctx.beginPath();
                ctx.ellipse(cx, cy, rw, rh, 0, 0, TWOPI, false);
                ctx.strokeStyle = '#404040';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    };
    MapReaction.prototype.pickAtom = function (x, y, mask1, mask2) {
        var ret = [0, 0];
        var scale = this.scale, thresh2 = sqr(this.scale * 1.0 * this.policy.data.pointScale);
        var bestDist = Number.POSITIVE_INFINITY;
        for (var n = 1; n <= this.mol1.numAtoms(); n++) {
            if (mask1 != null && !mask1[n - 1])
                continue;
            var pt = this.arrmol1.points[n - 1];
            var cx = this.offsetX1 + pt.cx * scale, cy = this.offsetY1 + pt.cy * scale;
            var dsq = norm2_xy(x - cx, y - cy);
            if (dsq < thresh2 && dsq < bestDist) {
                ret = [1, n];
                bestDist = dsq;
            }
        }
        for (var n = 1; n <= this.mol2.numAtoms(); n++) {
            if (mask2 != null && !mask2[n - 1])
                continue;
            var pt = this.arrmol2.points[n - 1];
            var cx = this.offsetX2 + pt.cx * scale, cy = this.offsetY2 + pt.cy * scale;
            var dsq = norm2_xy(x - cx, y - cy);
            if (dsq < thresh2 && dsq < bestDist) {
                ret = [2, n];
                bestDist = dsq;
            }
        }
        return ret;
    };
    MapReaction.prototype.getAtomPos = function (side, atom) {
        var arrmol = side == 1 ? this.arrmol1 : this.arrmol2;
        var ox = side == 1 ? this.offsetX1 : this.offsetX2, oy = side == 1 ? this.offsetY1 : this.offsetY2;
        var pt = arrmol.points[atom - 1];
        var cx = ox + pt.cx * this.scale, cy = oy + pt.cy * this.scale;
        var rw = Math.max(0.5 * this.policy.data.pointScale, pt.rw) * this.scale, rh = Math.max(0.5 * this.policy.data.pointScale, pt.rh) * this.scale;
        return [cx, cy, rw, rh];
    };
    MapReaction.prototype.compatibilityMask = function (side, atom) {
        var mask = [];
        var mol1 = side == 1 ? this.mol1 : this.mol2, mol2 = side == 1 ? this.mol2 : this.mol1;
        var el = mol1.atomElement(atom), iso = mol1.atomIsotope(atom), map = mol1.atomMapNum(atom);
        for (var n = 1; n <= mol2.numAtoms(); n++) {
            var match = el == mol2.atomElement(n) && iso == mol2.atomIsotope(n);
            match = match && (map == 0 || mol2.atomMapNum(n) == 0);
            mask.push(match);
        }
        return mask;
    };
    MapReaction.prototype.connectAtoms = function (side, atom1, atom2) {
        var mol1 = side == 1 ? this.mol1 : this.mol2, mol2 = side == 1 ? this.mol2 : this.mol1;
        var map = mol1.atomMapNum(atom1);
        if (map == 0)
            map = mol2.atomMapNum(atom2);
        if (map == 0) {
            var allnums = new Set();
            for (var n = 1; n <= mol1.numAtoms(); n++)
                allnums.add(mol1.atomMapNum(n));
            for (var n = 1; n <= mol2.numAtoms(); n++)
                allnums.add(mol2.atomMapNum(n));
            for (map = 1; allnums.has(map); map++)
                ;
        }
        mol1.setAtomMapNum(atom1, map);
        mol2.setAtomMapNum(atom2, map);
    };
    MapReaction.prototype.autoConnect = function () {
        Func.atomMapping({ 'leftNative': this.mol1.toString(), 'rightNative': this.mol2.toString() }, function (result, error) {
            if (!result)
                return;
            var map1 = result.map1, map2 = result.map2;
            if (map1 == null || map2 == null)
                return;
            var modified = false;
            for (var n = 1; n <= this.mol1.numAtoms() && n <= map1.length; n++)
                if (map1[n - 1] > 0 && this.mol1.atomMapNum(n) == 0) {
                    this.mol1.setAtomMapNum(n, map1[n - 1]);
                    modified = true;
                }
            for (var n = 1; n <= this.mol2.numAtoms() && n <= map2.length; n++)
                if (map2[n - 1] > 0 && this.mol2.atomMapNum(n) == 0) {
                    this.mol2.setAtomMapNum(n, map2[n - 1]);
                    modified = true;
                }
            if (modified)
                this.redrawCanvas();
        }, this);
    };
    MapReaction.prototype.clearAllMappings = function () {
        var anything = false;
        for (var n = 1; n <= this.mol1.numAtoms(); n++)
            if (this.mol1.atomMapNum(n) > 0) {
                this.mol1.setAtomMapNum(n, 0);
                anything = true;
            }
        for (var n = 1; n <= this.mol2.numAtoms(); n++)
            if (this.mol2.atomMapNum(n) > 0) {
                this.mol2.setAtomMapNum(n, 0);
                anything = true;
            }
        if (anything)
            this.redrawCanvas();
    };
    MapReaction.prototype.clearMapping = function (side, atom) {
        var map = side == 1 ? this.mol1.atomMapNum(atom) : this.mol2.atomMapNum(atom);
        if (map == 0)
            return;
        for (var n = 1; n <= this.mol1.numAtoms(); n++)
            if (this.mol1.atomMapNum(n) == map)
                this.mol1.setAtomMapNum(n, 0);
        for (var n = 1; n <= this.mol2.numAtoms(); n++)
            if (this.mol2.atomMapNum(n) == map)
                this.mol2.setAtomMapNum(n, 0);
    };
    MapReaction.prototype.mouseDown = function (event) {
        var xy = eventCoords(event, this.canvas);
        this.pressed = this.pickAtom(xy[0], xy[1]);
        this.dragToX = xy[0];
        this.dragToY = xy[1];
        this.redrawCanvas();
    };
    MapReaction.prototype.mouseUp = function (event) {
        var xy = eventCoords(event, this.canvas);
        if (this.pressed[0] > 0) {
            var dest = this.pickAtom(xy[0], xy[1]);
            if (dest[0] == this.pressed[0] && dest[1] == this.pressed[1]) {
                this.clearMapping(dest[0], dest[1]);
            }
            else {
                var compatMask = this.compatibilityMask(this.pressed[0], this.pressed[1]);
                dest = this.pickAtom(xy[0], xy[1], this.pressed[0] == 2 ? compatMask : null, this.pressed[0] == 1 ? compatMask : null);
                if (dest[0] == 3 - this.pressed[0]) {
                    this.connectAtoms(this.pressed[0], this.pressed[1], dest[1]);
                    this.autoConnect();
                }
            }
            this.pressed = [0, 0];
        }
        this.highlighted = this.pickAtom(xy[0], xy[1]);
        this.redrawCanvas();
    };
    MapReaction.prototype.mouseEnter = function (event) {
    };
    MapReaction.prototype.mouseLeave = function (event) {
        if (this.highlighted[0] > 0 || this.pressed[0] > 0) {
            this.highlighted = [0, 0];
            this.pressed = [0, 0];
            this.redrawCanvas();
        }
    };
    MapReaction.prototype.mouseMove = function (event) {
        var xy = eventCoords(event, this.canvas);
        if (this.pressed[0] > 0) {
            this.dragToX = xy[0];
            this.dragToY = xy[1];
            this.redrawCanvas();
        }
        else {
            var high = this.pickAtom(xy[0], xy[1]);
            if (high[0] != this.highlighted[0] || high[1] != this.highlighted[1]) {
                this.highlighted = high;
                this.redrawCanvas();
            }
        }
    };
    return MapReaction;
}(Dialog));
var FontData = (function () {
    function FontData() {
        this.FONT_ADV = 1041;
        this.UNITS_PER_EM = 2048;
        this.INV_UNITS_PER_EM = 1.0 / this.UNITS_PER_EM;
        this.ASCENT = 2059;
        this.DESCENT = -430;
        this.MISSING_HORZ = 2048;
        this.MISSING_DATA = "M256 0V1536H1792V0H256ZM384 128H1664V1408H384V128Z";
        this.ASCENT_FUDGE = 0.75;
        this.UNICODE = [
            " ", "!", "&quot;", "#", "$", "%", "&amp;", "&apos;", "(", ")", "*", "+", ",", "-", ".", "/", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "&lt;", "=", "&gt;", "?", "@",
            "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\\", "]", "^", "_", "`", "a", "b", "c", "d", "e",
            "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~", "&#x80;"
        ];
        this.GLYPH_NAME = [
            "space", "exclam", "quotedbl", "numbersign", "dollar", "percent", "ampersand", "quotesingle", "parenleft", "parenright", "asterisk", "plus", "comma", "hyphen", "period", "slash", "zero",
            "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "colon", "semicolon", "less", "equal", "greater", "question", "at", "A", "B", "C", "D", "E", "F", "G", "H", "I",
            "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "bracketleft", "backslash", "bracketright", "asciicircum", "underscore", "grave", "a", "b", "c", "d",
            "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "braceleft", "bar", "braceright", "asciitilde", "Adieresis"
        ];
        this.HORIZ_ADV_X = [
            720, 806, 940, 1676, 1302, 2204, 1488, 550, 930, 930, 1302, 1676, 745, 930, 745, 930, 1302, 1302, 1302, 1302, 1302, 1302, 1302, 1302, 1302, 1302, 930, 930, 1676, 1676, 1676, 1117, 2048,
            1400, 1404, 1430, 1578, 1295, 1177, 1588, 1539, 862, 931, 1419, 1140, 1726, 1532, 1612, 1235, 1612, 1424, 1400, 1262, 1499, 1400, 2025, 1403, 1260, 1403, 930, 930, 930, 1676, 1302, 1302,
            1230, 1276, 1067, 1276, 1220, 720, 1276, 1296, 562, 705, 1212, 562, 1992, 1296, 1243, 1276, 1276, 874, 1067, 807, 1296, 1212, 1676, 1212, 1212, 1076, 1300, 930, 1300, 1676, 1400
        ];
        this.GLYPH_DATA = [
            "",
            "M515 1489L489 410H319L291 1489H515ZM505 0H301V211H505V0Z",
            "M772 1556L729 977H597L554 1556H772ZM386 1556L343 977H211L168 1556H386Z",
            "M1481 932H1148L1056 556H1364V421H1021L917 0H788L892 421H622L518 0H389L493 421H195V556H528L620 932H312V1067H655L760 1489H889L784 1067H1054L1159 1489H1288L1183 1067H1481V932ZM1022 "
                + "934H748L654 554H928L1022 934Z",
            "M1160 380Q1160 225 1039 123T722 1V-361H604V-4Q472 -3 356 21T155 85V283H171Q190 269 239 243T334 199Q386 180 455 164T604 144V577Q564 585 530 592T467 608Q304 649 233 731T162 935Q162 1083 "
                + "278 1185T604 1304V1576H722V1306Q823 1304 929 1282T1107 1231V1035H1093Q1018 1081 937 1116T722 1161V730Q752 725 787 717T848 703Q997 671 1078 593T1160 380ZM604 747V1160Q497 1152 424 1102T351 961Q351 870 405 824T604 747ZM971 354Q971 448 913 491T722 "
                + "560V146Q842 158 906 207T971 354Z",
            "M884 1076Q884 852 790 743T517 634Q335 634 242 743T149 1075Q149 1299 244 1408T517 1517Q698 1517 791 1407T884 1076ZM1575 1489L795 0H630L1410 1489H1575ZM2055 413Q2055 189 1960 80T1687 "
                + "-29Q1506 -29 1413 81T1320 412Q1320 636 1414 745T1687 854Q1869 854 1962 745T2055 413ZM706 1076Q706 1248 662 1316T517 1384Q415 1384 371 1316T327 1075Q327 902 371 835T517 767Q617 767 661 834T706 1076ZM1877 413Q1877 585 1833 653T1688 721Q1586 721 "
                + "1542 653T1498 412Q1498 239 1542 172T1688 104Q1788 104 1832 171T1877 413Z",
            "M792 1191Q792 1286 736 1340T591 1395Q499 1395 441 1334T383 1183Q383 1108 422 1050T593 913Q691 948 741 1015T792 1191ZM986 315L508 781Q477 766 446 742T384 675Q356 636 338 581T320 "
                + "457Q320 311 405 222T648 132Q741 132 832 177T986 315ZM1287 909V813Q1287 717 1262 597T1177 368L1555 0H1309L1080 224Q965 82 845 26T598 -31Q390 -31 253 90T115 409Q115 501 141 568T202 684Q237 731 289 772T394 845Q284 917 236 990T187 1174Q187 1241 "
                + "213 1301T293 1412Q343 1460 423 1490T601 1520Q774 1520 881 1433T988 1211Q988 1167 976 1112T935 1012Q903 963 844 918T691 841L1062 479Q1076 519 1083 567T1091 667Q1093 723 1093 792T1092 909H1287Z",
            "M386 1556L343 977H207L164 1556H386Z",
            "M783 -412H554Q377 -209 279 31T181 572Q181 873 279 1113T554 1556H783V1546Q702 1473 629 1378T492 1155Q432 1032 395 884T357 572Q357 401 393 259T492 -11Q552 -134 629 -233T783 -402V-412Z",
            "M749 572Q749 271 651 31T376 -412H147V-402Q224 -333 301 -234T438 -11Q500 117 536 259T573 572Q573 736 536 884T438 1155Q375 1282 302 1377T147 1546V1556H376Q553 1353 651 1113T749 572Z",
            "M1137 887L1073 777L711 990L717 630H588L593 990L232 776L167 886L548 1093L167 1300L232 1410L594 1197L588 1556H717L710 1197L1073 1409L1137 1299L757 1094L1137 887Z",
            "M1466 572H921V27H755V572H210V732H755V1277H921V732H1466V572Z",
            "M575 285L293 -370H147L321 285H575Z",
            "M777 561H153V742H777V561Z",
            "M492 0H253V285H492V0Z",
            "M860 1556L143 -304H-30L684 1556H860Z",
            "M1167 745Q1167 344 1042 157T652 -31Q384 -31 261 159T137 743Q137 1140 262 1329T652 1519Q920 1519 1043 1327T1167 745ZM904 291Q939 372 951 481T964 745Q964 897 952 1009T903 1199Q868 1276 "
                + "808 1315T652 1354Q558 1354 497 1315T399 1197Q365 1123 353 1004T340 743Q340 587 351 482T398 294Q431 216 491 175T652 134Q746 134 808 173T904 291Z",
            "M1084 0H278V152H588V1150H278V1286Q341 1286 413 1296T522 1327Q568 1352 594 1390T625 1494H780V152H1084V0Z",
            "M1169 0H161V209Q266 299 371 389T568 568Q760 754 831 863T902 1100Q902 1216 826 1281T612 1347Q521 1347 415 1315T208 1217H198V1427Q269 1462 387 1491T617 1520Q846 1520 976 1410T1106 1110Q1106 "
                + "1025 1085 952T1021 812Q982 750 930 690T802 557Q695 452 581 354T368 171H1169V0Z",
            "M1038 717Q1086 674 1117 609T1148 441Q1148 339 1111 254T1007 106Q932 36 831 3T608 -31Q484 -31 364 -2T167 63V272H182Q267 216 382 179T604 142Q667 142 738 163T853 225Q899 269 921 322T944 "
                + "456Q944 536 919 588T848 671Q803 702 739 713T601 725H511V891H581Q733 891 823 954T914 1140Q914 1194 891 1234T827 1301Q784 1327 735 1337T624 1347Q529 1347 422 1313T220 1217H210V1426Q281 1461 399 1490T629 1520Q738 1520 821 1500T971 1436Q1043 1388 "
                + "1080 1320T1117 1161Q1117 1037 1030 945T823 828V814Q871 806 933 781T1038 717Z",
            "M1203 419H982V0H790V419H77V649L798 1489H982V579H1203V419ZM790 579V1251L213 579H790Z",
            "M1157 473Q1157 369 1119 274T1015 114Q943 44 844 7T613 -31Q491 -31 378 -6T187 56V267H201Q283 215 393 179T609 142Q680 142 746 162T865 232Q909 275 931 335T954 474Q954 551 928 604T854 689Q802 "
                + "727 728 742T561 758Q473 758 392 746T251 722V1489H1147V1314H444V918Q487 922 532 924T610 926Q731 926 822 906T989 833Q1069 778 1113 691T1157 473Z",
            "M1191 483Q1191 256 1042 113T675 -31Q565 -31 475 3T316 104Q230 187 184 324T137 654Q137 852 179 1005T315 1277Q403 1390 542 1453T866 1517Q925 1517 965 1512T1046 1494V1303H1036Q1008 1318 "
                + "952 1331T836 1345Q621 1345 493 1211T344 847Q428 898 509 924T698 951Q793 951 865 934T1014 863Q1102 802 1146 709T1191 483ZM988 475Q988 568 961 629T870 735Q824 767 768 777T651 787Q566 787 493 767T343 705Q341 683 340 663T339 611Q339 453 371 362T461 "
                + "217Q507 173 560 153T677 132Q822 132 905 220T988 475Z",
            "M1173 1266L499 0H285L1002 1314H154V1489H1173V1266Z",
            "M1180 415Q1180 222 1030 94T651 -34Q409 -34 266 91T122 411Q122 535 194 635T397 795V801Q277 865 220 941T162 1131Q162 1299 300 1411T651 1523Q874 1523 1007 1416T1140 1144Q1140 1043 1077 "
                + "946T892 793V787Q1032 727 1106 639T1180 415ZM943 1142Q943 1249 861 1312T650 1376Q524 1376 444 1316T363 1154Q363 1082 403 1030T526 936Q563 918 632 889T768 841Q867 907 905 978T943 1142ZM974 396Q974 488 934 543T775 655Q728 677 672 696T523 749Q433 "
                + "700 379 616T324 426Q324 291 417 203T653 115Q799 115 886 190T974 396Z",
            "M1167 834Q1167 639 1123 480T988 209Q897 95 760 33T438 -29Q386 -29 340 -24T258 -6V185H268Q297 170 350 157T468 143Q689 143 814 275T960 641Q867 585 785 561T606 537Q514 537 440 555T290 625Q202 "
                + "686 158 780T113 1005Q113 1233 263 1376T629 1519Q737 1519 829 1486T990 1385Q1075 1302 1121 1172T1167 834ZM965 877Q965 1032 933 1126T845 1272Q798 1317 744 1336T627 1356Q483 1356 400 1266T316 1013Q316 918 343 858T434 753Q479 722 533 712T653 701Q731 "
                + "701 811 722T961 783Q962 804 963 824T965 877Z",
            "M585 832H346V1117H585V832ZM585 0H346V285H585V0Z",
            "M585 832H346V1117H585V832ZM658 285L376 -370H230L404 285H658Z",
            "M1408 77L254 590V714L1408 1227V1047L498 652L1408 257V77Z",
            "M1431 782H245V942H1431V782ZM1431 362H245V522H1431V362Z",
            "M1422 590L268 77V257L1178 652L268 1047V1227L1422 714V590Z",
            "M1005 1139Q1005 1041 970 965T878 829Q822 772 749 722T594 625V400H415V705Q480 742 555 786T679 875Q737 927 769 982T801 1124Q801 1237 725 1292T527 1348Q419 1348 323 1314T170 1245H160V1449Q230 "
                + "1476 337 1497T541 1519Q756 1519 880 1415T1005 1139ZM610 0H406V211H610V0Z",
            "M1870 663Q1870 524 1830 394T1714 157H1274L1247 273Q1173 213 1105 181T949 149Q781 149 681 276T580 631Q580 858 703 993T997 1128Q1070 1128 1126 1112T1247 1062V1110H1406V268H1649Q1691 343 "
                + "1712 455T1734 657Q1734 821 1689 955T1555 1185Q1467 1281 1337 1332T1042 1384Q882 1384 750 1326T522 1170Q426 1072 372 936T317 645Q317 480 369 344T516 110Q615 9 748 -42T1038 -94Q1124 -94 1215 -83T1391 -48V-190Q1294 -211 1210 -218T1037 -226Q851 "
                + "-226 692 -163T419 15Q304 130 240 291T176 647Q176 832 243 991T426 1268Q542 1385 701 1452T1041 1519Q1237 1519 1391 1457T1651 1283Q1757 1171 1813 1014T1870 663ZM1245 408V926Q1182 955 1132 967T1025 980Q896 980 823 890T750 634Q750 471 808 388T989 "
                + "304Q1056 304 1123 335T1245 408Z",
            "M1374 0H1163L1017 415H373L227 0H26L568 1489H832L1374 0ZM956 585L695 1316L433 585H956Z",
            "M1323 458Q1323 347 1281 262T1168 122Q1084 56 984 28T728 0H200V1489H641Q804 1489 885 1477T1040 1427Q1122 1384 1159 1317T1196 1155Q1196 1049 1142 975T998 855V847Q1149 816 1236 715T1323 458ZM990 "
                + "1129Q990 1183 972 1220T914 1280Q867 1307 800 1313T634 1320H398V890H654Q747 890 802 899T904 939Q951 969 970 1016T990 1129ZM1117 450Q1117 540 1090 593T992 683Q944 708 876 715T709 723H398V169H660Q790 169 873 182T1009 232Q1065 271 1091 321T1117 "
                + "450Z",
            "M1350 108Q1295 84 1251 63T1134 19Q1073 0 1002 -13T844 -27Q682 -27 550 18T319 161Q223 256 169 402T115 743Q115 927 167 1072T317 1317Q412 1414 546 1465T845 1516Q965 1516 1084 1487T1350 1385V1150H1335Q1212 "
                + "1253 1091 1300T832 1347Q719 1347 629 1311T467 1197Q398 1122 360 1008T321 743Q321 586 363 473T473 289Q543 215 636 180T834 144Q977 144 1102 193T1336 340H1350V108Z",
            "M1458 743Q1458 540 1370 375T1134 119Q1032 56 907 28T576 0H200V1489H572Q790 1489 918 1458T1136 1371Q1288 1276 1373 1118T1458 743ZM1251 746Q1251 921 1190 1041T1008 1230Q920 1280 821 1299T584 "
                + "1319H398V170H584Q727 170 833 191T1029 269Q1140 340 1195 456T1251 746Z",
            "M1181 0H200V1489H1181V1313H398V905H1181V729H398V176H1181V0Z",
            "M1151 1313H398V893H1045V717H398V0H200V1489H1151V1313Z",
            "M1442 110Q1320 54 1176 13T896 -29Q722 -29 577 19T330 163Q227 260 171 405T115 746Q115 1103 323 1309T896 1516Q1023 1516 1155 1486T1441 1382V1147H1423Q1392 1171 1333 1210T1217 1275Q1148 1306 "
                + "1061 1326T862 1347Q612 1347 467 1187T321 752Q321 463 473 303T887 142Q983 142 1078 161T1246 210V575H847V749H1442V110Z",
            "M1339 0H1141V729H398V0H200V1489H398V905H1141V1489H1339V0Z",
            "M725 0H137V152H332V1337H137V1489H725V1337H530V152H725V0Z",
            "M746 387Q746 191 627 85T306 -21Q258 -21 178 -13T44 8V193H55Q96 179 156 164T279 149Q371 149 425 170T506 230Q533 270 540 328T548 462V1331H233V1489H746V387Z",
            "M1397 0H1140L551 663L403 505V0H205V1489H403V712L1126 1489H1366L701 789L1397 0Z",
            "M1142 0H200V1489H398V176H1142V0Z",
            "M1526 0H1328V1283L914 410H796L385 1283V0H200V1489H470L867 660L1251 1489H1526V0Z",
            "M1336 0H1091L385 1332V0H200V1489H507L1151 273V1489H1336V0Z",
            "M1310 1318Q1401 1218 1449 1073T1498 744Q1498 560 1449 415T1310 172Q1218 71 1093 20T806 -31Q649 -31 521 21T302 172Q212 271 164 415T115 744Q115 926 163 1070T303 1318Q391 1416 521 1468T806 "
                + "1520Q966 1520 1093 1468T1310 1318ZM1292 744Q1292 1034 1162 1191T807 1349Q580 1349 451 1192T321 744Q321 451 453 296T807 140Q1029 140 1160 295T1292 744Z",
            "M1174 1039Q1174 940 1140 856T1043 709Q966 632 861 594T596 555H398V0H200V1489H604Q738 1489 831 1467T996 1396Q1081 1339 1127 1254T1174 1039ZM968 1034Q968 1111 941 1168T859 1261Q811 1292 750 "
                + "1305T594 1319H398V724H565Q685 724 760 745T882 814Q929 862 948 915T968 1034Z",
            "M1528 -365Q1468 -380 1410 -386T1290 -393Q1116 -393 1011 -298T896 -24Q872 -28 850 -29T806 -31Q649 -31 521 21T302 172Q212 271 164 415T115 744Q115 926 163 1070T303 1318Q391 1416 521 1468T806 "
                + "1520Q966 1520 1093 1468T1310 1318Q1401 1218 1449 1073T1498 744Q1498 471 1387 284T1087 22Q1091 -92 1141 -155T1323 -218Q1364 -218 1420 -206T1501 -183H1528V-365ZM1292 744Q1292 1034 1162 1191T807 1349Q580 1349 451 1192T321 744Q321 451 453 296T807 "
                + "140Q1029 140 1160 295T1292 744Z",
            "M1432 0H1175L677 592H398V0H200V1489H617Q752 1489 842 1472T1004 1409Q1085 1358 1130 1281T1176 1084Q1176 923 1095 815T872 651L1432 0ZM969 1070Q969 1134 947 1183T872 1267Q829 1296 770 1307T631 "
                + "1319H398V757H598Q692 757 762 773T881 835Q926 877 947 931T969 1070Z",
            "M1282 425Q1282 338 1242 253T1128 109Q1048 45 942 9T685 -27Q524 -27 396 3T134 92V340H148Q261 246 409 195T687 144Q871 144 973 213T1076 397Q1076 496 1028 543T880 616Q805 636 718 649T532 682Q334 "
                + "724 239 825T143 1090Q143 1277 301 1396T702 1516Q859 1516 990 1486T1222 1412V1178H1208Q1123 1250 985 1297T701 1345Q542 1345 446 1279T349 1109Q349 1016 397 963T566 882Q630 868 748 848T948 807Q1114 763 1198 674T1282 425Z",
            "M1262 1313H730V0H532V1313H0V1489H1262V1313Z",
            "M1321 598Q1321 436 1286 316T1169 115Q1092 39 989 4T749 -31Q609 -31 505 6T330 115Q249 197 214 313T178 598V1489H376V588Q376 467 392 397T448 270Q492 205 567 172T749 139Q856 139 931 171T1051 "
                + "270Q1090 327 1106 400T1123 583V1489H1321V598Z",
            "M1374 1489L832 0H568L26 1489H238L705 179L1172 1489H1374Z",
            "M1933 1489L1546 0H1323L1010 1236L704 0H486L92 1489H295L608 251L916 1489H1117L1428 239L1739 1489H1933Z",
            "M1336 1489L822 753L1335 0H1106L700 613L284 0H68L587 744L80 1489H308L709 884L1119 1489H1336Z",
            "M1254 1489L730 653V0H532V632L6 1489H225L632 823L1043 1489H1254Z",
            "M1288 0H126V184L1039 1313H160V1489H1266V1310L344 176H1288V0Z",
            "M759 -392H239V1556H759V1413H413V-249H759V-392Z",
            "M960 -304H787L70 1556H246L960 -304Z",
            "M691 -392H171V-249H517V1413H171V1556H691V-392Z",
            "M1490 684H1292L837 1311L383 682H186L775 1489H901L1490 684Z",
            "M1306 -300H-4V-180H1306V-300Z",
            "M762 1302H613L340 1676H583L762 1302Z",
            "M1053 0H866V119Q841 102 799 72T716 23Q669 0 608 -15T465 -31Q314 -31 209 69T104 324Q104 451 158 529T314 653Q416 698 559 714T866 738V767Q866 831 844 873T779 939Q739 962 683 970T566 978Q492 "
                + "978 401 959T213 902H203V1093Q258 1108 362 1126T567 1144Q685 1144 772 1125T924 1058Q987 1012 1020 939T1053 758V0ZM866 275V586Q780 581 664 571T479 542Q398 519 348 471T298 337Q298 241 356 193T533 144Q632 144 714 182T866 275Z",
            "M1168 567Q1168 427 1129 315T1022 127Q951 48 866 9T679 -31Q584 -31 513 -9T373 52L361 0H185V1556H373V1000Q452 1065 541 1106T741 1148Q939 1148 1053 996T1168 567ZM974 562Q974 762 908 865T695 "
                + "969Q613 969 529 934T373 842V202Q453 166 510 152T641 138Q797 138 885 240T974 562Z",
            "M1011 70Q917 25 833 0T653 -25Q532 -25 431 10T258 118Q185 190 145 300T105 557Q105 831 255 987T653 1143Q749 1143 841 1116T1011 1050V841H1001Q915 908 824 944T645 980Q485 980 393 873T300 557Q300 "
                + "355 390 247T645 138Q702 138 761 153T867 192Q908 213 944 236T1001 277H1011V70Z",
            "M1091 0H903V117Q822 47 734 8T543 -31Q343 -31 226 123T108 550Q108 692 148 803T258 992Q326 1068 416 1108T604 1148Q692 1148 760 1130T903 1072V1556H1091V0ZM903 275V916Q827 950 767 963T636 976Q478 "
                + "976 390 866T302 554Q302 355 370 252T588 148Q668 148 750 183T903 275Z",
            "M1120 539H297Q297 436 328 360T413 234Q465 186 536 162T694 138Q808 138 923 183T1088 273H1098V68Q1003 28 904 1T696 -26Q418 -26 262 124T106 552Q106 826 255 987T649 1148Q875 1148 997 1016T1120 "
                + "641V539ZM937 683Q936 831 863 912T639 993Q488 993 399 904T297 683H937Z",
            "M786 1374H776Q745 1383 695 1392T607 1402Q486 1402 432 1349T377 1155V1117H716V959H383V0H195V959H68V1117H195V1154Q195 1353 294 1459T580 1566Q643 1566 693 1560T786 1546V1374Z",
            "M1091 127Q1091 -157 962 -290T565 -423Q476 -423 392 -411T225 -375V-183H235Q281 -201 381 -227T581 -254Q677 -254 740 -231T838 -167Q873 -128 888 -73T903 50V152Q818 84 741 51T543 17Q343 17 226 "
                + "161T108 569Q108 713 148 817T259 998Q324 1069 417 1108T602 1148Q699 1148 764 1129T903 1069L915 1117H1091V127ZM903 307V916Q828 950 764 964T635 979Q480 979 391 875T302 573Q302 385 368 288T587 191Q669 191 751 222T903 307Z",
            "M1119 0H931V636Q931 713 922 780T889 886Q864 928 817 948T695 969Q618 969 534 931T373 834V0H185V1556H373V993Q461 1066 555 1107T748 1148Q929 1148 1024 1039T1119 725V0Z",
            "M387 1304H175V1499H387V1304ZM375 0H187V1117H375V0Z",
            "M533 1304H321V1499H533V1304ZM521 -27Q521 -223 421 -323T153 -423Q113 -423 48 -415T-62 -395V-216H-52Q-24 -227 23 -241T116 -255Q188 -255 232 -235T298 -175Q320 -135 326 -79T333 59V959H100V1117H521V-27Z",
            "M1199 0H951L503 489L381 373V0H193V1556H381V558L924 1117H1161L642 601L1199 0Z",
            "M375 0H187V1556H375V0Z",
            "M1815 0H1627V636Q1627 708 1621 775T1593 882Q1570 925 1527 947T1403 969Q1324 969 1245 930T1087 829Q1090 806 1092 776T1094 715V0H906V636Q906 710 900 776T872 883Q849 926 806 947T682 969Q605 "
                + "969 528 931T373 834V0H185V1117H373V993Q461 1066 548 1107T735 1148Q849 1148 928 1100T1047 967Q1161 1063 1255 1105T1456 1148Q1640 1148 1727 1037T1815 725V0Z",
            "M1119 0H931V636Q931 713 922 780T889 886Q864 928 817 948T695 969Q618 969 534 931T373 834V0H185V1117H373V993Q461 1066 555 1107T748 1148Q929 1148 1024 1039T1119 725V0Z",
            "M1137 558Q1137 285 997 127T622 -31Q385 -31 246 127T106 558Q106 831 245 989T622 1148Q857 1148 997 990T1137 558ZM943 558Q943 775 858 880T622 986Q469 986 385 881T300 558Q300 348 385 240T622 "
                + "131Q772 131 857 238T943 558Z",
            "M1168 572Q1168 436 1129 324T1019 133Q953 59 864 19T674 -22Q587 -22 517 -3T373 56V-412H185V1117H373V1000Q448 1063 541 1105T741 1148Q943 1148 1055 996T1168 572ZM974 567Q974 769 905 869T693 "
                + "969Q612 969 530 934T373 842V209Q453 173 510 160T641 147Q798 147 886 253T974 567Z",
            "M1091 -412H903V126Q816 51 730 15T544 -22Q345 -22 227 131T108 555Q108 699 149 809T259 995Q325 1068 414 1108T602 1148Q692 1148 761 1128T903 1069L915 1117H1091V-412ZM903 284V916Q825 951 765 "
                + "965T635 979Q472 979 387 869T302 564Q302 368 370 263T586 157Q668 157 750 192T903 284Z",
            "M882 912H872Q830 922 791 926T697 931Q610 931 529 893T373 793V0H185V1117H373V952Q485 1042 570 1079T745 1117Q794 1117 816 1115T882 1105V912Z",
            "M983 322Q983 169 857 71T511 -27Q387 -27 284 2T110 67V278H120Q209 211 318 172T527 132Q651 132 721 172T791 298Q791 364 753 398Q715 432 607 456Q567 465 503 477T385 503Q238 542 177 617T115 "
                + "803Q115 872 143 933T230 1042Q286 1089 372 1116T566 1144Q666 1144 768 1120T939 1060V859H929Q857 912 754 948T552 985Q449 985 378 946T307 828Q307 759 350 724Q392 689 486 667Q538 655 602 643T710 621Q841 591 912 518Q983 444 983 322Z",
            "M765 10Q712 -4 650 -13T538 -22Q367 -22 278 70T189 365V959H62V1117H189V1438H377V1117H765V959H377V450Q377 362 381 313T409 220Q431 180 469 162T587 143Q633 143 683 156T755 179H765V10Z",
            "M1111 0H923V124Q828 49 741 9T549 -31Q373 -31 275 76T177 392V1117H365V481Q365 396 373 336T407 232Q434 188 477 168T602 148Q675 148 761 186T923 283V1117H1111V0Z",
            "M1151 1117L699 0H510L61 1117H265L611 228L954 1117H1151Z",
            "M1590 1117L1299 0H1125L838 861L553 0H380L86 1117H282L487 252L766 1117H921L1207 252L1401 1117H1590Z",
            "M1152 0H915L598 429L279 0H60L496 557L64 1117H301L616 695L932 1117H1152L713 567L1152 0Z",
            "M1151 1117L499 -412H298L506 54L61 1117H265L608 289L954 1117H1151Z",
            "M995 0H93V139L744 960H107V1117H978V983L324 159H995V0Z",
            "M1113 -392H963Q784 -392 673 -293T561 -5V144Q561 313 478 408T224 504H173V660H224Q395 660 478 755T561 1020V1169Q561 1357 672 1456T963 1556H1113V1418H999Q863 1418 802 1355T740 1152V977Q740 "
                + "838 663 744T449 594V570Q586 515 663 421T740 187V12Q740 -128 801 -191T999 -254H1113V-392Z",
            "M552 -392H378V1556H552V-392Z",
            "M1127 504H1076Q905 504 822 409T739 144V-5Q739 -193 628 -292T337 -392H187V-254H301Q437 -254 498 -191T560 12V187Q560 326 637 420T851 570V594Q714 649 637 743T560 977V1152Q560 1292 "
                + "499 1355T301 1418H187V1556H337Q516 1556 627 1457T739 1169V1020Q739 851 822 756T1076 660H1127V504Z",
            "M1489 927Q1487 828 1467 732T1401 561Q1355 484 1290 440T1125 396Q1031 396 958 435T801 577Q699 702 653 734T557 766Q463 766 413 679T354 395H187Q189 495 209 589T274 761Q317 835 386 "
                + "880T551 926Q644 926 717 888T876 745Q956 647 1007 602T1119 556Q1222 556 1270 657T1322 927H1489Z",
            "M1374 0H1163L1017 415H373L227 0H26L568 1489H832L1374 0ZM956 585L695 1316L433 585H956ZM1005 1677H806V1872H1005V1677ZM592 1677H393V1872H592V1677Z"
        ];
        this.KERN_G1 = [
            7, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 14, 14, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 34, 34, 34, 34, 35, 36, 36, 36, 36, 36, 36, 36, 38, 38, 38, 38,
            38, 38, 38, 38, 38, 38, 41, 42, 42, 42, 43, 43, 43, 43, 43, 43, 43, 43, 43, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 47, 47, 47, 47, 47, 47, 48, 48, 48, 48, 48, 48, 48, 49, 49, 50,
            50, 50, 50, 50, 50, 50, 50, 51, 51, 51, 51, 51, 51, 51, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 53, 53, 53, 54, 54, 54, 54, 54, 54,
            54, 54, 54, 54, 54, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 56, 56, 56, 56, 56, 56, 56, 56, 56, 57, 57, 57, 57, 57, 57, 57, 57, 57, 57, 57, 57, 57, 57, 57, 57, 57, 57, 57, 57, 58,
            58, 58, 58, 58, 58, 58, 58, 58, 58, 65, 65, 65, 66, 66, 66, 67, 67, 69, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 72, 72, 72, 75, 75, 75, 77, 77, 77, 78, 78, 78, 79, 79, 79, 79, 79,
            80, 80, 80, 82, 82, 82, 82, 84, 84, 86, 86, 86, 86, 86, 86, 87, 87, 87, 87, 88, 88, 88, 88, 88, 88, 89, 89, 89, 89, 89, 89, 89, 89, 89, 89, 90, 90, 90, 90, 90, 90, 90
        ];
        this.KERN_G2 = [
            33, 33, 41, 42, 51, 52, 54, 55, 56, 57, 58, 65, 86, 87, 88, 89, 90, 12, 13, 13, 51, 52, 53, 54, 55, 57, 84, 85, 86, 87, 89, 12, 13, 14, 52, 13, 12, 14, 52, 55, 56, 57, 58, 12, 14, 26, 27,
            31, 33, 52, 65, 69, 79, 13, 12, 14, 33, 13, 47, 65, 69, 79, 85, 86, 87, 89, 7, 13, 35, 39, 42, 47, 52, 54, 55, 57, 86, 89, 12, 14, 52, 56, 57, 58, 12, 14, 33, 57, 65, 69, 79, 12, 14, 13,
            52, 57, 65, 69, 79, 85, 89, 12, 14, 33, 51, 86, 87, 89, 12, 13, 14, 26, 27, 31, 33, 35, 39, 47, 51, 52, 65, 67, 69, 71, 79, 82, 83, 85, 86, 87, 89, 90, 12, 14, 33, 12, 13, 14, 26, 27, 33,
            65, 69, 79, 85, 89, 12, 13, 14, 26, 27, 33, 65, 69, 79, 82, 85, 89, 13, 35, 39, 47, 65, 69, 79, 85, 89, 12, 13, 14, 26, 27, 33, 47, 65, 68, 69, 71, 77, 78, 79, 80, 81, 82, 83, 85, 86, 13,
            35, 39, 47, 58, 65, 69, 79, 87, 89, 86, 87, 89, 12, 14, 89, 13, 52, 52, 2, 7, 9, 10, 12, 13, 14, 31, 60, 61, 89, 93, 86, 87, 89, 13, 69, 79, 86, 87, 89, 86, 87, 89, 12, 14, 86, 88, 89,
            12, 14, 89, 12, 13, 14, 65, 13, 89, 12, 13, 14, 65, 69, 79, 12, 13, 14, 65, 13, 67, 68, 69, 71, 79, 12, 13, 14, 65, 67, 68, 69, 71, 79, 81, 13, 67, 68, 69, 71, 79, 81
        ];
        this.KERN_K = [
            100, 50, 30, 100, 20, 150, 50, 50, 80, 140, 30, 20, 40, 20, 50, 40, 40, 130, 160, 50, 10, 120, 10, 60, 50, 80, 20, 10, 50, 30, 50, 20, -10, 20, 60, 50, 50, 50, 50, 20, 10, 20, 20, 300,
            300, 60, 60, -60, 100, -30, 100, 50, 50, 30, 20, 20, 10, 110, 20, 60, 70, 70, 50, 80, 70, 80, 120, 160, 20, 20, -100, 20, 170, 110, 100, 160, 110, 110, 30, 30, 50, 10, 20, 20, 300, 300,
            50, -20, 50, 50, 50, 30, 30, 100, 60, 20, 40, 50, 50, 20, 55, 20, 20, 20, 22, 30, 20, 30, 290, 150, 290, 200, 200, -60, 120, 40, 40, 50, 12, 70, 240, 220, 220, 210, 220, 200, 180, 200,
            200, 200, 200, 170, 20, 20, 10, 290, 50, 290, 80, 80, 60, 100, 100, 100, 60, 65, 290, 50, 220, 80, 80, 50, 100, 100, 100, 60, 60, 65, 80, 10, 10, 10, 50, 60, 60, 30, 80, 290, 140, 290,
            200, 200, 80, 20, 140, 120, 130, 130, 100, 100, 130, 100, 130, 100, 110, 110, 100, 60, 20, 20, 20, 10, 50, 60, 60, 40, 65, 16, 10, 16, 30, 20, 5, 20, 60, 140, -60, -60, -100, -50, 130,
            50, 120, -110, -100, -100, 10, -100, 20, 10, 20, 100, 20, 20, 20, 10, 20, 20, 10, 20, 30, 20, 15, 20, 15, 30, 20, 5, 290, 20, 290, 36, 40, 10, 180, 40, 180, 40, 18, 18, 70, 20, 70, 20,
            50, 20, 10, 24, 10, 24, 190, 40, 190, 40, 18, 10, 18, 10, 18, 10, 20, 10, 10, 12, 10, 12, 10
        ];
        this.pathCache = [];
        for (var n = this.GLYPH_DATA.length - 1; n >= 0; n--)
            this.pathCache[n] = undefined;
    }
    FontData.prototype.getRawGlyph = function (idx) {
        return this.GLYPH_DATA[idx];
    };
    ;
    FontData.prototype.getGlyphPath = function (idx) {
        path = this.pathCache[idx];
        if (path != null)
            return path;
        var path = new Path2D(this.GLYPH_DATA[idx]);
        this.pathCache[idx] = path;
        return path;
    };
    FontData.main = new FontData();
    return FontData;
}());
;
var Account = (function () {
    function Account() {
    }
    Account.connectTransient = function (callback, master) {
        new RPC('account.connectTransient', {}, callback, master).invoke();
    };
    Account.refreshTransient = function (input, callback, master) {
        new RPC('account.refreshTransient', input, callback, master).invoke();
    };
    return Account;
}());
var Pile = (function () {
    function Pile() {
    }
    Pile.uploadMolecule = function (input, callback, master) {
        new RPC('pile.uploadMolecule', input, callback, master).invoke();
    };
    Pile.uploadDataSheet = function (input, callback, master) {
        new RPC('pile.uploadDataSheet', input, callback, master).invoke();
    };
    Pile.downloadMolecule = function (input, callback, master) {
        new RPC('pile.downloadMolecule', input, callback, master).invoke();
    };
    Pile.downloadDataSheet = function (input, callback, master) {
        new RPC('pile.downloadDataSheet', input, callback, master).invoke();
    };
    Pile.fetchSelection = function (input, callback, master) {
        new RPC('pile.fetchSelection', input, callback, master).invoke();
    };
    Pile.fetchMolecules = function (input, callback, master) {
        new RPC('pile.fetchMolecules', input, callback, master).invoke();
    };
    return Pile;
}());
var Search = (function () {
    function Search() {
    }
    Search.startMolSearch = function (input, callback, master) {
        new RPC('search.startMolSearch', input, callback, master).invoke();
    };
    Search.pollMolSearch = function (input, callback, master) {
        new RPC('search.pollMolSearch', input, callback, master).invoke();
    };
    Search.startRxnSearch = function (input, callback, master) {
        new RPC('search.startRxnSearch', input, callback, master).invoke();
    };
    Search.pollRxnSearch = function (input, callback, master) {
        new RPC('search.pollRxnSearch', input, callback, master).invoke();
    };
    return Search;
}());
var ButtonBank = (function () {
    function ButtonBank() {
        this.isSubLevel = false;
        this.buttons = [];
    }
    ButtonBank.prototype.init = function () { };
    ButtonBank.prototype.bankClosed = function () { };
    return ButtonBank;
}());
var ELEMENTS_NOBLE = [
    "He", "Ar", "Kr", "Xe", "Rn"
];
var ELEMENTS_S_BLOCK = [
    "Li", "Na", "K", "Rb", "Cs", "Fr", "Sc",
    "Be", "Mg", "Ca", "Sr", "Ba", "Ra", "Y"
];
var ELEMENTS_P_BLOCK = [
    "B", "Al", "Si", "Ga", "Ge", "As", "Se",
    "In", "Sn", "Sb", "Te", "Tl", "Pb", "Bi", "Po", "At"
];
var ELEMENTS_D_BLOCK = [
    "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn",
    "Zr", "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd",
    "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg"
];
var ELEMENTS_F_BLOCK = [
    "La", "Ce", "Pr", "Nd", "Sm", "Eu", "Gd", "Tb", "Dy",
    "Ho", "Er", "Tm", "Yb", "Lu", "Ac", "Th", "Pa", "U"
];
var ELEMENTS_ABBREV = [
    "X", "Y", "Z", "Q", "M", "L", "E", "A", "R",
    "R0", "R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8"
];
var CommandType;
(function (CommandType) {
    CommandType[CommandType["Main"] = 0] = "Main";
    CommandType[CommandType["Atom"] = 1] = "Atom";
    CommandType[CommandType["Bond"] = 2] = "Bond";
    CommandType[CommandType["Select"] = 3] = "Select";
    CommandType[CommandType["Move"] = 4] = "Move";
    CommandType[CommandType["Abbrev"] = 5] = "Abbrev";
    CommandType[CommandType["SBlock"] = 6] = "SBlock";
    CommandType[CommandType["PBlock"] = 7] = "PBlock";
    CommandType[CommandType["DBlock"] = 8] = "DBlock";
    CommandType[CommandType["FBlock"] = 9] = "FBlock";
    CommandType[CommandType["Noble"] = 10] = "Noble";
})(CommandType || (CommandType = {}));
var CommandBank = (function (_super) {
    __extends(CommandBank, _super);
    function CommandBank(owner, cmdType) {
        if (cmdType === void 0) { cmdType = CommandType.Main; }
        _super.call(this);
        this.owner = owner;
        this.cmdType = cmdType;
    }
    CommandBank.prototype.update = function () {
        if (this.cmdType == CommandType.Main) {
            this.buttons.push({ 'id': 'undo', 'imageFN': 'MainUndo', 'helpText': 'Undo last change.' });
            this.buttons.push({ 'id': 'redo', 'imageFN': 'MainRedo', 'helpText': 'Cancel last undo.' });
            this.buttons.push({ 'id': 'zoomin', 'imageFN': 'MainZoomIn', 'helpText': 'Zoom in.' });
            this.buttons.push({ 'id': 'zoomout', 'imageFN': 'MainZoomOut', 'helpText': 'Zoom out.' });
            this.buttons.push({ 'id': 'zoomfit', 'imageFN': 'MainZoomFit', 'helpText': 'Show whole diagram onscreen.' });
            this.buttons.push({ 'id': 'selside', 'imageFN': 'MainSelSide', 'helpText': 'Select alternate side of current atom or bond.' });
            this.buttons.push({ 'id': 'selall', 'imageFN': 'MainSelAll', 'helpText': 'Select all atoms.' });
            this.buttons.push({ 'id': 'selnone', 'imageFN': 'MainSelNone', 'helpText': 'Clear selection.' });
            this.buttons.push({ 'id': 'delete', 'imageFN': 'MainDelete', 'helpText': 'Delete selected atoms and bonds.' });
            this.buttons.push({ 'id': 'cut', 'imageFN': 'MainCut', 'helpText': 'Copy selection to clipboard, and remove.' });
            this.buttons.push({ 'id': 'copy', 'imageFN': 'MainCopy', 'helpText': 'Copy selection to clipboard.' });
            this.buttons.push({ 'id': 'paste', 'imageFN': 'MainPaste', 'helpText': 'Paste clipboard contents.' });
            this.buttons.push({ 'id': 'atom', 'imageFN': 'MainAtom', 'helpText': 'Open the Atom submenu.', 'isSubMenu': true });
            this.buttons.push({ 'id': 'bond', 'imageFN': 'MainBond', 'helpText': 'Open the Bond submenu.', 'isSubMenu': true });
            this.buttons.push({ 'id': 'select', 'imageFN': 'MainSelect', 'helpText': 'Open the Selection submenu.', 'isSubMenu': true });
            this.buttons.push({ 'id': 'move', 'imageFN': 'MainMove', 'helpText': 'Open the Move submenu.', 'isSubMenu': true });
        }
        else if (this.cmdType == CommandType.Atom) {
            this.buttons.push({ 'id': 'element:C', 'text': 'C', 'helpText': 'Change elements to Carbon.' });
            this.buttons.push({ 'id': 'element:N', 'text': 'N', 'helpText': 'Change elements to Nitrogen.' });
            this.buttons.push({ 'id': 'element:O', 'text': 'O', 'helpText': 'Change elements to Oxygen.' });
            this.buttons.push({ 'id': 'element:S', 'text': 'S', 'helpText': 'Change elements to Sulfur.' });
            this.buttons.push({ 'id': 'element:P', 'text': 'P', 'helpText': 'Change elements to Phosphorus.' });
            this.buttons.push({ 'id': 'element:H', 'text': 'H', 'helpText': 'Change elements to Hydrogen.' });
            this.buttons.push({ 'id': 'element:F', 'text': 'F', 'helpText': 'Change elements to Fluorine.' });
            this.buttons.push({ 'id': 'element:Cl', 'text': 'Cl', 'helpText': 'Change elements to Chlorine.' });
            this.buttons.push({ 'id': 'element:Br', 'text': 'Br', 'helpText': 'Change elements to Bromine.' });
            this.buttons.push({ 'id': 'element:I', 'text': 'I', 'helpText': 'Change elements to Iodine.' });
            this.buttons.push({ 'id': 'plus', 'imageFN': 'AtomPlus', 'helpText': 'Increase the atom charge.' });
            this.buttons.push({ 'id': 'minus', 'imageFN': 'AtomMinus', 'helpText': 'Decrease the atom charge.' });
            this.buttons.push({ 'id': 'abbrev', 'imageFN': 'AtomAbbrev', 'helpText': 'Open list of common labels.', 'isSubMenu': true });
            this.buttons.push({ 'id': 'sblock', 'imageFN': 'AtomSBlock', 'helpText': 'Open list of s-block elements.', 'isSubMenu': true });
            this.buttons.push({ 'id': 'pblock', 'imageFN': 'AtomPBlock', 'helpText': 'Open list of p-block elements.', 'isSubMenu': true });
            this.buttons.push({ 'id': 'dblock', 'imageFN': 'AtomDBlock', 'helpText': 'Open list of d-block elements.', 'isSubMenu': true });
            this.buttons.push({ 'id': 'fblock', 'imageFN': 'AtomFBlock', 'helpText': 'Open list of f-block elements.', 'isSubMenu': true });
            this.buttons.push({ 'id': 'noble', 'imageFN': 'AtomNoble', 'helpText': 'Open list of noble elements.', 'isSubMenu': true });
        }
        else if (this.cmdType == CommandType.Bond) {
            this.buttons.push({ 'id': 'one', 'imageFN': 'BondOne', 'helpText': 'Create or set bonds to single.' });
            this.buttons.push({ 'id': 'two', 'imageFN': 'BondTwo', 'helpText': 'Create or set bonds to double.' });
            this.buttons.push({ 'id': 'three', 'imageFN': 'BondThree', 'helpText': 'Create or set bonds to triple.' });
            this.buttons.push({ 'id': 'four', 'imageFN': 'BondFour', 'helpText': 'Create or set bonds to quadruple.' });
            this.buttons.push({ 'id': 'zero', 'imageFN': 'BondZero', 'helpText': 'Create or set bonds to zero-order.' });
            this.buttons.push({ 'id': 'inclined', 'imageFN': 'BondUp', 'helpText': 'Create or set bonds to inclined.' });
            this.buttons.push({ 'id': 'declined', 'imageFN': 'BondDown', 'helpText': 'Create or set bonds to declined.' });
            this.buttons.push({ 'id': 'squig', 'imageFN': 'BondSquig', 'helpText': 'Create or set bonds to unknown stereochemistry.' });
            this.buttons.push({ 'id': 'addtwo', 'imageFN': 'BondAddTwo', 'helpText': 'Add two new bonds to the subject atom.' });
            this.buttons.push({ 'id': 'insert', 'imageFN': 'BondInsert', 'helpText': 'Insert a methylene into the subject bond.' });
            this.buttons.push({ 'id': 'switch', 'imageFN': 'BondSwitch', 'helpText': 'Cycle through likely bond geometries.' });
            this.buttons.push({ 'id': 'linear', 'imageFN': 'BondLinear', 'helpText': 'Apply linear geometry.' });
            this.buttons.push({ 'id': 'trigonal', 'imageFN': 'BondTrigonal', 'helpText': 'Apply trigonal geometry.' });
            this.buttons.push({ 'id': 'tetra1', 'imageFN': 'BondTetra1', 'helpText': 'Apply tetrahedral geometry #1.' });
            this.buttons.push({ 'id': 'tetra2', 'imageFN': 'BondTetra2', 'helpText': 'Apply tetrahedral geometry #2.' });
            this.buttons.push({ 'id': 'sqplan', 'imageFN': 'BondSqPlan', 'helpText': 'Apply square planar geometry.' });
            this.buttons.push({ 'id': 'octa1', 'imageFN': 'BondOcta1', 'helpText': 'Apply octahedral geometry #1.' });
            this.buttons.push({ 'id': 'octa2', 'imageFN': 'BondOcta2', 'helpText': 'Apply octahedral geometry #2.' });
            this.buttons.push({ 'id': 'connect', 'imageFN': 'BondConnect', 'helpText': 'Connect selected atoms, by proximity.' });
            this.buttons.push({ 'id': 'disconnect', 'imageFN': 'BondDisconnect', 'helpText': 'Disconnect selected atoms.' });
        }
        else if (this.cmdType == CommandType.Select) {
            this.buttons.push({ 'id': 'selgrow', 'imageFN': 'SelectionGrow', 'helpText': 'Add adjacent atoms to selection.' });
            this.buttons.push({ 'id': 'selshrink', 'imageFN': 'SelectionShrink', 'helpText': 'Unselect exterior atoms.' });
            this.buttons.push({ 'id': 'selchain', 'imageFN': 'SelectionChain', 'helpText': 'Extend selection to non-ring atoms.' });
            this.buttons.push({ 'id': 'smallring', 'imageFN': 'SelectionSmRing', 'helpText': 'Extend selection to small rings.' });
            this.buttons.push({ 'id': 'ringblock', 'imageFN': 'SelectionRingBlk', 'helpText': 'Extend selection to ring blocks.' });
            this.buttons.push({ 'id': 'curelement', 'imageFN': 'SelectionCurElement', 'helpText': 'Select all atoms of current element type.' });
            this.buttons.push({ 'id': 'selprev', 'imageFN': 'MainSelPrev', 'helpText': 'Select previous connected component.' });
            this.buttons.push({ 'id': 'selnext', 'imageFN': 'MainSelNext', 'helpText': 'Select next connected component.' });
            this.buttons.push({ 'id': 'toggle', 'imageFN': 'SelectionToggle', 'helpText': 'Toggle selection of current.' });
            this.buttons.push({ 'id': 'uncurrent', 'imageFN': 'SelectionUncurrent', 'helpText': 'Undefine current object.' });
            this.buttons.push({ 'id': 'join', 'imageFN': 'MoveJoin', 'helpText': 'Overlapping atoms will be joined as one.' });
            this.buttons.push({ 'id': 'new', 'imageFN': 'MainNew', 'helpText': 'Clear the molecular structure..' });
            this.buttons.push({ 'id': 'inline', 'imageFN': 'AtomInline', 'helpText': 'Make selected atoms into an inline abbreviation.' });
            this.buttons.push({ 'id': 'formula', 'imageFN': 'AtomFormula', 'helpText': 'Make selected atoms into their molecule formula.' });
            this.buttons.push({ 'id': 'clearabbrev', 'imageFN': 'AtomClearAbbrev', 'helpText': 'Remove inline abbreviation.' });
            this.buttons.push({ 'id': 'expandabbrev', 'imageFN': 'AtomExpandAbbrev', 'helpText': 'Expand out the inline abbreviation.' });
        }
        else if (this.cmdType == CommandType.Move) {
            this.buttons.push({ 'id': 'up', 'imageFN': 'MoveUp', 'helpText': 'Move subject atoms up slightly.' });
            this.buttons.push({ 'id': 'down', 'imageFN': 'MoveDown', 'helpText': 'Move subject atoms down slightly.' });
            this.buttons.push({ 'id': 'left', 'imageFN': 'MoveLeft', 'helpText': 'Move subject atoms slightly to the left.' });
            this.buttons.push({ 'id': 'right', 'imageFN': 'MoveRight', 'helpText': 'Move subject atoms slightly to the right.' });
            this.buttons.push({ 'id': 'uplots', 'imageFN': 'MoveUpLots', 'helpText': 'Move subject atoms up somewhat.' });
            this.buttons.push({ 'id': 'downlots', 'imageFN': 'MoveDownLots', 'helpText': 'Move subject atoms down somewhat.' });
            this.buttons.push({ 'id': 'leftlots', 'imageFN': 'MoveLeftLots', 'helpText': 'Move subject atoms somewhat to the left.' });
            this.buttons.push({ 'id': 'rightlots', 'imageFN': 'MoveRightLots', 'helpText': 'Move subject atoms somewhat to the right.' });
            this.buttons.push({ 'id': 'upfar', 'imageFN': 'MoveUpFar', 'helpText': 'Move subject atoms far up.' });
            this.buttons.push({ 'id': 'downfar', 'imageFN': 'MoveDownFar', 'helpText': 'Move subject atoms far down.' });
            this.buttons.push({ 'id': 'leftfar', 'imageFN': 'MoveLeftFar', 'helpText': 'Move subject atoms far to the left.' });
            this.buttons.push({ 'id': 'rightfar', 'imageFN': 'MoveRightFar', 'helpText': 'Move subject atoms far to the right.' });
            this.buttons.push({ 'id': 'rotp01', 'imageFN': 'MoveRotP01', 'helpText': 'Rotate 1\u00B0 counter-clockwise.' });
            this.buttons.push({ 'id': 'rotm01', 'imageFN': 'MoveRotM01', 'helpText': 'Rotate 1\u00B0 clockwise.' });
            this.buttons.push({ 'id': 'rotp05', 'imageFN': 'MoveRotP05', 'helpText': 'Rotate 5\u00B0 counter-clockwise.' });
            this.buttons.push({ 'id': 'rotm05', 'imageFN': 'MoveRotM05', 'helpText': 'Rotate 5\u00B0 clockwise.' });
            this.buttons.push({ 'id': 'rotp15', 'imageFN': 'MoveRotP15', 'helpText': 'Rotate 15\u00B0 counter-clockwise.' });
            this.buttons.push({ 'id': 'rotm15', 'imageFN': 'MoveRotM15', 'helpText': 'Rotate 15\u00B0 clockwise.' });
            this.buttons.push({ 'id': 'rotp30', 'imageFN': 'MoveRotP30', 'helpText': 'Rotate 30\u00B0 counter-clockwise.' });
            this.buttons.push({ 'id': 'rotm30', 'imageFN': 'MoveRotM30', 'helpText': 'Rotate 30\u00B0 clockwise.' });
            this.buttons.push({ 'id': 'hflip', 'imageFN': 'MoveHFlip', 'helpText': 'Flip subject atoms horizontally.' });
            this.buttons.push({ 'id': 'vflip', 'imageFN': 'MoveVFlip', 'helpText': 'Flip subject atoms vertically.' });
            this.buttons.push({ 'id': 'shrink', 'imageFN': 'MoveShrink', 'helpText': 'Decrease subject bond distances.' });
            this.buttons.push({ 'id': 'grow', 'imageFN': 'MoveGrow', 'helpText': 'Increase subject bond distances.' });
        }
        else if (this.cmdType == CommandType.Abbrev)
            this.populateElements(ELEMENTS_NOBLE);
        else if (this.cmdType == CommandType.SBlock)
            this.populateElements(ELEMENTS_S_BLOCK);
        else if (this.cmdType == CommandType.PBlock)
            this.populateElements(ELEMENTS_P_BLOCK);
        else if (this.cmdType == CommandType.DBlock)
            this.populateElements(ELEMENTS_D_BLOCK);
        else if (this.cmdType == CommandType.FBlock)
            this.populateElements(ELEMENTS_F_BLOCK);
        else if (this.cmdType == CommandType.Noble)
            this.populateElements(ELEMENTS_ABBREV);
    };
    CommandBank.prototype.populateElements = function (elements) {
        for (var _i = 0, elements_1 = elements; _i < elements_1.length; _i++) {
            var el = elements_1[_i];
            this.buttons.push({ 'id': "element:" + el, 'text': el, 'helpText': "Change elements to " + el + "." });
        }
    };
    CommandBank.prototype.hitButton = function (id) {
        var actv = 0, param = null;
        if (id.startsWith('element:')) {
            var el = id.substring(8);
            actv = ActivityType.Element;
            param = { 'element': el };
        }
        else if (id == 'delete')
            actv = ActivityType.Delete;
        else if (id == 'undo') {
            if (this.owner.canUndo())
                this.owner.performUndo();
            else
                this.owner.showMessage('Nothing to undo.');
        }
        else if (id == 'redo') {
            if (this.owner.canRedo())
                this.owner.performRedo();
            else
                this.owner.showMessage('Nothing to redo.');
        }
        else if (id == 'cut')
            actv = ActivityType.Cut;
        else if (id == 'copy')
            actv = ActivityType.Copy;
        else if (id == 'paste')
            this.owner.performPaste();
        else if (id == 'new')
            actv = ActivityType.Clear;
        else if (id == 'zoomfit')
            this.owner.autoScale();
        else if (id == 'zoomout')
            this.owner.zoom(0.8);
        else if (id == 'zoomin')
            this.owner.zoom(1.25);
        else if (id == 'selall')
            actv = ActivityType.SelectAll;
        else if (id == 'selnone')
            actv = ActivityType.SelectNone;
        else if (id == 'selprev')
            actv = ActivityType.SelectPrevComp;
        else if (id == 'selnext')
            actv = ActivityType.SelectNextComp;
        else if (id == 'selside')
            actv = ActivityType.SelectSide;
        else if (id == 'plus') {
            actv = ActivityType.Charge;
            param = { 'delta': 1 };
        }
        else if (id == 'minus') {
            actv = ActivityType.Charge;
            param = { 'delta': -1 };
        }
        else if (id == 'one') {
            actv = ActivityType.BondOrder;
            param = { 'order': 1 };
        }
        else if (id == 'two') {
            actv = ActivityType.BondOrder;
            param = { 'order': 2 };
        }
        else if (id == 'three') {
            actv = ActivityType.BondOrder;
            param = { 'order': 3 };
        }
        else if (id == 'four') {
            actv = ActivityType.BondOrder;
            param = { 'order': 4 };
        }
        else if (id == 'zero') {
            actv = ActivityType.BondOrder;
            param = { 'order': 0 };
        }
        else if (id == 'inclined') {
            actv = ActivityType.BondType;
            param = { 'type': Molecule.BONDTYPE_INCLINED };
        }
        else if (id == 'declined') {
            actv = ActivityType.BondType;
            param = { 'type': Molecule.BONDTYPE_DECLINED };
        }
        else if (id == 'squig') {
            actv = ActivityType.BondType;
            param = { 'type': Molecule.BONDTYPE_UNKNOWN };
        }
        else if (id == 'linear') {
            actv = ActivityType.BondGeom;
            param = { 'geom': 'linear' };
        }
        else if (id == 'trigonal') {
            actv = ActivityType.BondGeom;
            param = { 'geom': 'trigonal' };
        }
        else if (id == 'tetra1') {
            actv = ActivityType.BondGeom;
            param = { 'geom': 'tetra1' };
        }
        else if (id == 'tetra2') {
            actv = ActivityType.BondGeom;
            param = { 'geom': 'tetra2' };
        }
        else if (id == 'sqplan') {
            actv = ActivityType.BondGeom;
            param = { 'geom': 'sqplan' };
        }
        else if (id == 'octa1') {
            actv = ActivityType.BondGeom;
            param = { 'geom': 'octa1' };
        }
        else if (id == 'octa2') {
            actv = ActivityType.BondGeom;
            param = { 'geom': 'octa2' };
        }
        else if (id == 'switch')
            actv = ActivityType.BondSwitch;
        else if (id == 'connect')
            actv = ActivityType.Connect;
        else if (id == 'disconnect')
            actv = ActivityType.Disconnect;
        else if (id == 'addtwo')
            actv = ActivityType.BondAddTwo;
        else if (id == 'insert')
            actv = ActivityType.BondInsert;
        else if (id == 'curelement')
            actv = ActivityType.SelectCurElement;
        else if (id == 'selgrow')
            actv = ActivityType.SelectGrow;
        else if (id == 'selshrink')
            actv = ActivityType.SelectShrink;
        else if (id == 'selprev')
            actv = ActivityType.SelectPrevComp;
        else if (id == 'selnext')
            actv = ActivityType.SelectNextComp;
        else if (id == 'selchain')
            actv = ActivityType.SelectChain;
        else if (id == 'smallring')
            actv = ActivityType.SelectSmRing;
        else if (id == 'ringblock')
            actv = ActivityType.SelectRingBlk;
        else if (id == 'toggle')
            actv = ActivityType.SelectToggle;
        else if (id == 'uncurrent')
            actv = ActivityType.SelectUnCurrent;
        else if (id == 'join')
            actv = ActivityType.Join;
        else if (id == 'inline')
            actv = ActivityType.AbbrevInline;
        else if (id == 'formula')
            actv = ActivityType.AbbrevFormula;
        else if (id == 'clearabbrev')
            actv = ActivityType.AbbrevClear;
        else if (id == 'expandabbrev')
            actv = ActivityType.AbbrevExpand;
        else if (id == 'up') {
            actv = ActivityType.Nudge;
            param = { 'dir': 'up' };
        }
        else if (id == 'down') {
            actv = ActivityType.Nudge;
            param = { 'dir': 'down' };
        }
        else if (id == 'left') {
            actv = ActivityType.Nudge;
            param = { 'dir': 'left' };
        }
        else if (id == 'right') {
            actv = ActivityType.Nudge;
            param = { 'dir': 'right' };
        }
        else if (id == 'uplots') {
            actv = ActivityType.NudgeLots;
            param = { 'dir': 'up' };
        }
        else if (id == 'downlots') {
            actv = ActivityType.NudgeLots;
            param = { 'dir': 'down' };
        }
        else if (id == 'leftlots') {
            actv = ActivityType.NudgeLots;
            param = { 'dir': 'left' };
        }
        else if (id == 'rightlots') {
            actv = ActivityType.NudgeLots;
            param = { 'dir': 'right' };
        }
        else if (id == 'upfar') {
            actv = ActivityType.NudgeFar;
            param = { 'dir': 'up' };
        }
        else if (id == 'downfar') {
            actv = ActivityType.NudgeFar;
            param = { 'dir': 'down' };
        }
        else if (id == 'leftfar') {
            actv = ActivityType.NudgeFar;
            param = { 'dir': 'left' };
        }
        else if (id == 'rightfar') {
            actv = ActivityType.NudgeFar;
            param = { 'dir': 'right' };
        }
        else if (id == 'rotp01') {
            actv = ActivityType.Rotate;
            param = { 'theta': 1 };
        }
        else if (id == 'rotm01') {
            actv = ActivityType.Rotate;
            param = { 'theta': -1 };
        }
        else if (id == 'rotp05') {
            actv = ActivityType.Rotate;
            param = { 'theta': 5 };
        }
        else if (id == 'rotm05') {
            actv = ActivityType.Rotate;
            param = { 'theta': -5 };
        }
        else if (id == 'rotp15') {
            actv = ActivityType.Rotate;
            param = { 'theta': 15 };
        }
        else if (id == 'rotm15') {
            actv = ActivityType.Rotate;
            param = { 'theta': -15 };
        }
        else if (id == 'rotp30') {
            actv = ActivityType.Rotate;
            param = { 'theta': 30 };
        }
        else if (id == 'rotm30') {
            actv = ActivityType.Rotate;
            param = { 'theta': -30 };
        }
        else if (id == 'hflip') {
            actv = ActivityType.Flip;
            param = { 'axis': 'hor' };
        }
        else if (id == 'vflip') {
            actv = ActivityType.Flip;
            param = { 'axis': 'ver' };
        }
        else if (id == 'shrink') {
            actv = ActivityType.Scale;
            param = { 'mag': 1 / 1.1 };
        }
        else if (id == 'grow') {
            actv = ActivityType.Scale;
            param = { 'mag': 1.1 };
        }
        else if (id == 'atom')
            this.buttonView.pushBank(new CommandBank(this.owner, CommandType.Atom));
        else if (id == 'bond')
            this.buttonView.pushBank(new CommandBank(this.owner, CommandType.Bond));
        else if (id == 'select')
            this.buttonView.pushBank(new CommandBank(this.owner, CommandType.Select));
        else if (id == 'move')
            this.buttonView.pushBank(new CommandBank(this.owner, CommandType.Move));
        else if (id == 'abbrev')
            this.buttonView.pushBank(new CommandBank(this.owner, CommandType.Abbrev));
        else if (id == 'sblock')
            this.buttonView.pushBank(new CommandBank(this.owner, CommandType.SBlock));
        else if (id == 'pblock')
            this.buttonView.pushBank(new CommandBank(this.owner, CommandType.PBlock));
        else if (id == 'dblock')
            this.buttonView.pushBank(new CommandBank(this.owner, CommandType.DBlock));
        else if (id == 'fblock')
            this.buttonView.pushBank(new CommandBank(this.owner, CommandType.FBlock));
        else if (id == 'noble')
            this.buttonView.pushBank(new CommandBank(this.owner, CommandType.Noble));
        else
            alert('Unhandled command: "' + id + '"');
        if (actv > 0) {
            new MoleculeActivity(this.owner, actv, param).execute();
        }
    };
    return CommandBank;
}(ButtonBank));
var TemplateBank = (function (_super) {
    __extends(TemplateBank, _super);
    function TemplateBank(owner, group) {
        _super.call(this);
        this.owner = owner;
        this.group = group;
        this.subgroups = null;
        this.templates = null;
    }
    TemplateBank.prototype.init = function () {
        var policy = RenderPolicy.defaultBlackOnWhite();
        policy.data.pointScale = 10;
        policy.data.lineSize *= 1.5;
        policy.data.bondSep *= 1.5;
        var sz = this.buttonView.idealSize;
        if (this.group == null) {
            var input = { 'tokenID': this.owner.tokenID, 'policy': policy.data, 'size': [sz - 4, sz - 4] };
            var fcn = function (result, error) {
                if (!result) {
                    alert('Setup of TemplateBank failed: ' + error.message);
                    return;
                }
                this.subgroups = result;
                this.buttonView.refreshBank();
            };
            Func.getDefaultTemplateGroups(input, fcn, this);
        }
        else {
            var input = { 'tokenID': this.owner.tokenID, 'policy': policy.data, 'size': [sz - 4, sz - 4], 'group': this.group };
            var fcn = function (result, error) {
                if (!result) {
                    alert('Setup of TemplateBank failed: ' + error.message);
                    return;
                }
                this.templates = result;
                this.buttonView.refreshBank();
            };
            Func.getDefaultTemplateStructs(input, fcn, this);
        }
    };
    TemplateBank.prototype.update = function () {
        if (this.subgroups == null && this.templates == null)
            return;
        this.buttons = [];
        if (this.group == null)
            this.populateGroups();
        else
            this.populateTemplates();
    };
    TemplateBank.prototype.populateGroups = function () {
        var groups = this.subgroups.groups, titles = this.subgroups.titles, preview = this.subgroups.preview;
        for (var n = 0; n < groups.length; n++) {
            this.buttons.push({ 'id': groups[n], 'metavec': preview[n], 'helpText': titles[n] });
        }
    };
    TemplateBank.prototype.populateTemplates = function () {
        var names = this.templates.names, abbrev = this.templates.abbrev, mnemonic = this.templates.mnemonic, preview = this.templates.preview;
        for (var n = 0; n < names.length; n++) {
            this.buttons.push({ 'id': n.toString(), 'metavec': preview[n], 'helpText': names[n] });
        }
    };
    TemplateBank.prototype.hitButton = function (id) {
        if (this.group == null) {
            this.buttonView.pushBank(new TemplateBank(this.owner, id));
        }
        else {
            var idx = parseInt(id);
            var param = { 'fragNative': this.templates.molecules[idx] };
            new MoleculeActivity(this.owner, ActivityType.TemplateFusion, param).execute();
        }
    };
    return TemplateBank;
}(ButtonBank));
var FusionBank = (function (_super) {
    __extends(FusionBank, _super);
    function FusionBank(owner) {
        _super.call(this);
        this.owner = owner;
    }
    FusionBank.prototype.update = function () {
        this.buttons = [];
        this.buttons.push({ 'id': 'accept', 'imageFN': 'GenericAccept', 'helpText': 'Apply this template.' });
        this.buttons.push({ 'id': 'prev', 'imageFN': 'TemplatePrev', 'helpText': 'Show previous fusion option.' });
        this.buttons.push({ 'id': 'next', 'imageFN': 'TemplateNext', 'helpText': 'Show next fusion option.' });
    };
    FusionBank.prototype.hitButton = function (id) {
        if (id == 'accept')
            this.owner.templateAccept();
        else if (id == 'prev')
            this.owner.templateRotate(-1);
        else if (id == 'next')
            this.owner.templateRotate(1);
    };
    FusionBank.prototype.bankClosed = function () {
        this.owner.clearPermutations();
    };
    return FusionBank;
}(ButtonBank));
var ToolBank = (function (_super) {
    __extends(ToolBank, _super);
    function ToolBank(owner) {
        _super.call(this);
        this.owner = owner;
        this.initiallySelected = 'arrow';
    }
    ToolBank.prototype.update = function () {
        this.buttons = [];
        this.buttons.push({ 'id': 'arrow', 'imageFN': 'ToolSelect', 'helpText': 'Selection tool.' });
        this.buttons.push({ 'id': 'rotate', 'imageFN': 'ToolRotate', 'helpText': 'Rotate subject atoms.' });
        this.buttons.push({ 'id': 'pan', 'imageFN': 'ToolPan', 'helpText': 'Pan the viewport around the screen.' });
        this.buttons.push({ 'id': 'drag', 'imageFN': 'ToolDrag', 'helpText': 'Drag selected atoms to new positions.' });
        this.buttons.push({ 'id': 'erasor', 'imageFN': 'ToolErasor', 'helpText': 'Delete atoms or bonds by selecting.' });
        this.buttons.push({ 'id': 'bondOrder0', 'imageFN': 'BondZero', 'helpText': 'Create or change a bond to zero order.' });
        this.buttons.push({ 'id': 'bondOrder1', 'imageFN': 'BondOne', 'helpText': 'Create or change a bond to single.' });
        this.buttons.push({ 'id': 'bondOrder2', 'imageFN': 'BondTwo', 'helpText': 'Create or change a bond to double.' });
        this.buttons.push({ 'id': 'bondOrder3', 'imageFN': 'BondThree', 'helpText': 'Create or change a bond to triple.' });
        this.buttons.push({ 'id': 'bondUnknown', 'imageFN': 'BondSquig', 'helpText': 'Create or change a bond to down-wedge.' });
        this.buttons.push({ 'id': 'bondInclined', 'imageFN': 'BondUp', 'helpText': 'Create or change a bond to up-wedge.' });
        this.buttons.push({ 'id': 'bondDeclined', 'imageFN': 'BondDown', 'helpText': 'Create or change a bond to down-wedge.' });
        this.buttons.push({ 'id': 'ringAliph', 'imageFN': 'ToolRing', 'helpText': 'Create plain ring.' });
        this.buttons.push({ 'id': 'ringArom', 'imageFN': 'ToolArom', 'helpText': 'Create aromatic ring.' });
        this.buttons.push({ 'id': 'atomPlus', 'imageFN': 'AtomPlus', 'helpText': 'Increase charge on atom.' });
        this.buttons.push({ 'id': 'atomMinus', 'imageFN': 'AtomMinus', 'helpText': 'Decrease charge on atom.' });
        this.buttons.push({ 'id': 'elementC', 'text': 'C', 'helpText': 'Change elements to Carbon.' });
        this.buttons.push({ 'id': 'elementN', 'text': 'N', 'helpText': 'Change elements to Nitrogen.' });
        this.buttons.push({ 'id': 'elementO', 'text': 'O', 'helpText': 'Change elements to Oxygen.' });
        this.buttons.push({ 'id': 'elementS', 'text': 'S', 'helpText': 'Change elements to Sulfur.' });
        this.buttons.push({ 'id': 'elementP', 'text': 'P', 'helpText': 'Change elements to Phosphorus.' });
        this.buttons.push({ 'id': 'elementH', 'text': 'H', 'helpText': 'Change elements to Hydrogen.' });
        this.buttons.push({ 'id': 'elementF', 'text': 'F', 'helpText': 'Change elements to Fluorine.' });
        this.buttons.push({ 'id': 'elementCl', 'text': 'Cl', 'helpText': 'Change elements to Chlorine.' });
        this.buttons.push({ 'id': 'elementBr', 'text': 'Br', 'helpText': 'Change elements to Bromine.' });
        this.buttons.push({ 'id': 'elementA', 'text': 'A', 'helpText': 'Pick other element.' });
        this.buttonView.setSelectedButton('arrow');
    };
    ;
    ToolBank.prototype.hitButton = function (id) {
        this.buttonView.setSelectedButton(id);
    };
    return ToolBank;
}(ButtonBank));
var CircleButton = (function (_super) {
    __extends(CircleButton, _super);
    function CircleButton(icon) {
        _super.call(this);
        this.icon = icon;
        this.BUTTON_DIAMETER = 50;
        this.BUTTON_HPADDING = 4;
        this.BUTTON_VPADDING = 2;
        this.STATE_NORMAL = 'normal';
        this.STATE_SELECTED = 'selected';
        this.STATE_DISABLED = 'disabled';
        this.content = null;
        this.state = this.STATE_NORMAL;
        this.isHighlight = false;
        this.isPressed = false;
        this.progressFraction = null;
        this.callback = null;
    }
    CircleButton.prototype.onAction = function (callback, master) {
        this.callback = callback;
        this.master = master;
    };
    CircleButton.prototype.render = function (parent) {
        _super.prototype.render.call(this, parent);
        this.content.addClass('no_selection');
        var diameter = this.BUTTON_DIAMETER;
        var width = diameter, height = diameter;
        var div = this.content;
        var density = pixelDensity();
        div.css('width', width + 2 * this.BUTTON_HPADDING);
        div.css('height', height + 2 * this.BUTTON_VPADDING);
        div.css('position', 'relative');
        var canvasStyle = 'position: absolute; left: ' + this.BUTTON_HPADDING + 'px; top: ' + this.BUTTON_VPADDING + 'px;';
        canvasStyle += 'pointer-events: none;';
        function renderSolid(col1, col2) {
            var node = newElement(div, 'canvas', { 'width': width * density, 'height': height * density, 'style': canvasStyle });
            node.style.width = width + 'px';
            node.style.height = height + 'px';
            var ctx = node.getContext('2d');
            ctx.save();
            ctx.scale(density, density);
            ctx.beginPath();
            ctx.arc(0.5 * width, 0.5 * height, 0.5 * diameter - 1, 0, 2 * Math.PI, true);
            ctx.clip();
            var grad = ctx.createLinearGradient(0, 0, width, height);
            grad.addColorStop(0, col1);
            grad.addColorStop(1, col2);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
            return node;
        }
        function renderBorder(lw) {
            var node = newElement(div, 'canvas', { 'width': width * density, 'height': height * density, 'style': canvasStyle });
            node.style.width = width + 'px';
            node.style.height = height + 'px';
            var ctx = node.getContext('2d');
            ctx.save();
            ctx.scale(density, density);
            ctx.beginPath();
            ctx.arc(0.5 * width, 0.5 * height, 0.5 * diameter - 0.5 * (1 + lw), 0, 2 * Math.PI, true);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = lw;
            ctx.stroke();
            ctx.restore();
            return node;
        }
        this.normalBackgr = renderSolid('#FFFFFF', '#D0D0D0');
        this.selectedBackgr = renderSolid('#47D5D2', '#008FD1');
        this.pressedBackgr = renderSolid('#00CA59', '#008650');
        this.disabledBackgr = renderSolid('white', 'white');
        this.ringProgress = newElement(div, 'canvas', { 'width': width * density, 'height': height * density, 'style': canvasStyle });
        this.ringProgress.style.width = width + 'px';
        this.ringProgress.style.height = height + 'px';
        this.ringProgress.getContext('2d').scale(density, density);
        this.ringProgress.hidden = true;
        this.thinBorder = renderBorder(1);
        this.thickBorder = renderBorder(2);
        var svgurl = RPC.BASE_URL + "/img/icons/" + this.icon;
        this.svg = newElement(div, 'object', { 'width': width, 'height': height, 'style': canvasStyle, 'data': svgurl, 'type': 'image/svg+xml' });
        this.updateLayers();
        var self = this;
        div.mouseenter(function () { self.mouseEnter(); ; });
        div.mouseleave(function () { self.mouseLeave(); });
        div.mousedown(function () { self.mouseDown(); });
        div.mouseup(function () { self.mouseUp(); });
        div.click(function () { self.mouseClicked(); });
    };
    ;
    CircleButton.prototype.setProgress = function (fraction) {
        if (this.progressFraction == fraction)
            return;
        this.progressFraction = fraction;
        this.ringProgress.hidden = false;
        var diameter = this.BUTTON_DIAMETER, mid = 0.5 * diameter, outer = mid - 1, inner = 0.8 * mid;
        var ctx = this.ringProgress.getContext('2d');
        ctx.clearRect(0, 0, diameter, diameter);
        ctx.strokeStyle = 'rgba(80,80,80,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(mid, mid, inner + 0.5, inner + 0.5, 0, 0, TWOPI, false);
        ctx.stroke();
        if (this.progressFraction == 0) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#47D5D2';
            drawLine(ctx, mid, mid - inner, mid, mid - outer);
            return;
        }
        var delta = TWOPI * fraction;
        var theta1 = -0.5 * Math.PI, theta2 = theta1 + delta;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(mid, mid - outer);
        ctx.arc(mid, mid, outer, theta1, theta2, false);
        ctx.lineTo(mid + inner * Math.cos(theta2), mid + inner * Math.sin(theta2));
        ctx.arc(mid, mid, inner, theta2, theta1, true);
        ctx.closePath();
        var grad = ctx.createRadialGradient(mid, mid, inner, mid, mid, outer);
        grad.addColorStop(0, '#47D5D2');
        grad.addColorStop(1, '#008FD2');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
    };
    CircleButton.prototype.clearProgress = function () {
        this.progressFraction = null;
        this.ringProgress.hidden = true;
    };
    CircleButton.prototype.updateLayers = function () {
        setVisible(this.pressedBackgr, this.isPressed);
        setVisible(this.normalBackgr, !this.isPressed && this.state == this.STATE_NORMAL);
        setVisible(this.selectedBackgr, !this.isPressed && this.state == this.STATE_SELECTED);
        setVisible(this.disabledBackgr, !this.isPressed && this.state == this.STATE_DISABLED);
        var highlight = this.isHighlight;
        if (this.state == this.STATE_DISABLED) {
            highlight = false;
            this.content.css('cursor', 'no-drop');
        }
        else
            this.content.css('cursor', 'pointer');
        setVisible(this.thinBorder, !highlight);
        setVisible(this.thickBorder, highlight);
    };
    CircleButton.prototype.mouseEnter = function () {
        this.isHighlight = true;
        this.updateLayers();
    };
    CircleButton.prototype.mouseLeave = function () {
        this.isHighlight = false;
        this.isPressed = false;
        this.updateLayers();
    };
    CircleButton.prototype.mouseDown = function () {
        this.isPressed = this.state != this.STATE_DISABLED;
        this.updateLayers();
    };
    CircleButton.prototype.mouseUp = function () {
        this.isPressed = false;
        this.updateLayers();
    };
    CircleButton.prototype.mouseClicked = function () {
        if (this.callback)
            this.callback.call(this.master, this);
    };
    return CircleButton;
}(Widget));
var RowView = (function (_super) {
    __extends(RowView, _super);
    function RowView(tokenID) {
        _super.call(this);
        this.tokenID = tokenID;
        this.entries = null;
        this.watermark = 0;
    }
    RowView.prototype.defineEntries = function (entries) {
        this.entries = entries;
    };
    RowView.prototype.render = function (parent) {
        _super.prototype.render.call(this, parent);
        if (this.entries == null)
            throw 'molsync.ui.RowView: entries must be defined before rendering';
        var tableStyle = 'border-collapse: collapse;';
        var table = $('<table></table>').appendTo(this.content);
        table.attr('style', tableStyle);
        var roster = [];
        this.watermark++;
        for (var n = 0; n < this.entries.length; n++) {
            var entry = this.entries[n];
            entry.tr = $('<tr></tr>').appendTo(table);
            entry = clone(entry);
            entry.tdStyle = '';
            if (n > 0)
                entry.tdStyle += 'border-top: 1px solid #80C080;';
            if (n < this.entries.length - 1)
                entry.tdStyle += 'border-bottom: 1px solid #80C080;';
            entry.watermark = this.watermark;
            roster.push(entry);
        }
        var fcnComposure = function (result, error) {
            var entry = roster.shift();
            if (entry.watermark != this.watermark)
                return;
            if (error != null)
                throw 'molsync.ui.RowView: failed to obtain document composition: ' + error.message;
            var nodes = [];
            for (var n = 0; n < result.doc.nodes.length; n++) {
                var node = result.doc.nodes[n];
                var src = node.src;
                if (src.startsWith('experiment:') && src != 'experiment:header' && src != 'experiment:scheme')
                    continue;
                nodes.push(node);
            }
            for (var n = 0; n < nodes.length; n++) {
                var tdStyle = entry.tdStyle + 'vertical-align: top;';
                if (n > 0)
                    tdStyle += 'border-left: 1px solid #80C080;';
                if (n < nodes.length - 1)
                    tdStyle += 'border-right: 1px solid #80C080;';
                if (nodes[n].type != 'graphics')
                    tdStyle += 'padding: 0.5em;';
                var td = $('<td></td>').appendTo(entry.tr);
                td.attr('style', tdStyle);
                this.renderNode(td, nodes[n]);
            }
            if (roster.length > 0)
                Func.composeDocument({ 'tokenID': this.tokenID, 'dataXML': roster[0].dataXML, 'subsumeTitle': true }, fcnComposure, this);
        };
        if (roster.length > 0)
            Func.composeDocument({ 'tokenID': this.tokenID, 'dataXML': roster[0].dataXML, 'subsumeTitle': true }, fcnComposure, this);
    };
    RowView.prototype.renderNode = function (parent, node) {
        if (node.type == 'line')
            this.renderLine(parent, node, true);
        else if (node.type == 'link')
            this.renderLink(parent, node);
        else if (node.type == 'graphics')
            this.renderGraphics(parent, node);
        else if (node.type == 'para')
            this.renderPara(parent, node);
        else if (node.type == 'matrix')
            this.renderMatrix(parent, node);
    };
    RowView.prototype.renderLine = function (parent, node, inPara) {
        if (inPara)
            parent = $(newElement(parent, 'p'));
        if (node.title) {
            addText(newElement(parent, 'b'), node.title);
            addText(parent[0], ': ');
        }
        if (node.bold)
            parent = $(newElement(parent, 'b'));
        if (node.italic)
            parent = $(newElement(parent, 'i'));
        if (node.underline)
            parent = $(newElement(parent, 'u'));
        if (node.formula)
            this.renderFormula(parent, node.text);
        else
            addText(parent, node.text);
    };
    RowView.prototype.renderLink = function (parent, node) {
        if (node.title) {
            addText(newElement(parent, 'b'), node.title);
            addText(parent[0], ': ');
        }
        var ahref = newElement(parent, 'a', { 'href': node.url, 'target': '_blank' });
        addText(ahref, node.url);
    };
    RowView.prototype.renderGraphics = function (parent, node) {
        var draw = new MetaVector(node.metavec);
        draw.renderInto(parent);
    };
    RowView.prototype.renderPara = function (parent, node) {
        parent = $('<p></p>').appendTo(parent);
        for (var n = 0; n < node.nodes.length; n++) {
            var sub = node.nodes[n];
            if (n > 0)
                newElement(parent, 'br');
            if (sub.type == 'line')
                this.renderLine(parent, sub, false);
            else
                this.renderNode(parent, sub);
        }
    };
    RowView.prototype.renderMatrix = function (parent, node) {
        var ncols = node.ncols, nrows = node.nrows;
        var table = newElement(parent, 'table', { 'class': 'data', 'style': 'margin: 0;' });
        var tableBody = newElement(table, 'tbody');
        for (var r = 0; r < nrows; r++) {
            var tableRow = newElement(tableBody, 'tr');
            for (var c = 0; c < ncols; c++) {
                var cell = node.matrix[r][c];
                var tableCell = newElement(tableRow, 'td', { 'class': 'data' });
                this.renderNode($(tableCell), cell);
            }
        }
    };
    RowView.prototype.renderFormula = function (parent, formula) {
        for (var n = 0; n < formula.length; n++) {
            var ch = formula.charAt(n);
            if (ch == '|') { }
            else if (ch == '{') {
                var end = formula.indexOf('}', n + 1);
                if (end >= 0) {
                    var snip = formula.substring(n + 1, end);
                    addText(newElement(parent, 'sub'), snip);
                    n = end;
                }
                else
                    addText(parent, ch);
            }
            else
                addText(parent, ch);
        }
    };
    return RowView;
}(Widget));
var SearchPanel = (function (_super) {
    __extends(SearchPanel, _super);
    function SearchPanel(type) {
        _super.call(this);
        this.type = type;
        this.highlight = 0;
        this.pressed = 0;
        this.mol1 = new Molecule();
        this.mol2 = new Molecule();
        this.HEIGHT = 50;
        this.MOLWIDTH = 80;
        this.ARROWWIDTH = 30;
        this.HPADDING = 4;
        this.VPADDING = 2;
        this.COLCYCLE = ['#89A54E', '#71588F', '#4198AF', '#DB843D', '#93A9CF', '#D19392', '#4572A7', '#AA4643'];
    }
    SearchPanel.prototype.getMolecule1 = function () { return this.mol1; };
    SearchPanel.prototype.getMolecule2 = function () { return this.mol2; };
    SearchPanel.prototype.setMolecule1 = function (mol) {
        this.mol1 = mol;
        if (this.drawnMol1 != null)
            this.renderMolecule(1);
    };
    SearchPanel.prototype.setMolecule2 = function (mol) {
        this.mol2 = mol;
        if (this.drawnMol2 != null)
            this.renderMolecule(2);
    };
    SearchPanel.prototype.render = function (parent) {
        _super.prototype.render.call(this, parent);
        this.content.addClass('no_selection');
        var height = this.HEIGHT, molw = this.MOLWIDTH, arrow = this.ARROWWIDTH;
        var density = pixelDensity();
        var hpad = this.HPADDING, vpad = this.VPADDING;
        var isRxn = this.type == SearchPanel.TYPE_REACTION, isMol = !isRxn;
        var div = this.content;
        if (isMol)
            div.css('width', (molw + 2 * hpad) + 'px');
        else
            div.css('width', (2 * molw + arrow + 4 * hpad) + 'px');
        div.css('height', (height + 2 * vpad) + 'px');
        div.css('position', 'relative');
        function renderSolid(col1, col2, style) {
            var node = newElement(div, 'canvas', { 'width': molw * density, 'height': height * density, 'style': style });
            node.style.width = molw + 'px';
            node.style.height = height + 'px';
            var ctx = node.getContext('2d');
            ctx.scale(density, density);
            var grad = ctx.createLinearGradient(0, 0, molw, height);
            grad.addColorStop(0, col1);
            grad.addColorStop(1, col2);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, molw, height);
            return node;
        }
        function renderBorder(lw, style) {
            var node = newElement(div, 'canvas', { 'width': molw * density, 'height': height * density, 'style': style });
            node.style.width = molw + 'px';
            node.style.height = height + 'px';
            var ctx = node.getContext('2d');
            ctx.scale(density, density);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = lw;
            ctx.strokeRect(0.5 * lw, 0.5 * lw, molw - lw, height - lw);
            return node;
        }
        function renderArrow(style) {
            var node = newElement(div, 'canvas', { 'width': arrow * density, 'height': height * density, 'style': style });
            node.style.width = arrow + 'px';
            node.style.height = height + 'px';
            var ctx = node.getContext('2d');
            ctx.scale(density, density);
            var midY = Math.round(0.5 * height);
            ctx.beginPath();
            ctx.moveTo(0, midY);
            ctx.lineTo(arrow - 2, midY);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(arrow, midY);
            ctx.lineTo(arrow - 8, midY - 5);
            ctx.lineTo(arrow - 8, midY + 5);
            ctx.fillStyle = 'black';
            ctx.fill();
            return node;
        }
        function renderOutlineArrow(style, col) {
            var node = newElement(div, 'canvas', { 'width': arrow * density, 'height': height * density, 'style': style });
            node.style.width = arrow + 'px';
            node.style.height = height + 'px';
            var ctx = node.getContext('2d');
            ctx.scale(density, density);
            var midY = Math.round(0.5 * height);
            var path = pathRoundedRect(0, midY - 8, arrow, midY + 8, 4);
            ctx.fillStyle = col;
            ctx.fill(path);
            return node;
        }
        var styleMol1Pos = 'position: absolute; left: ' + hpad + 'px; top: ' + vpad + 'px;';
        var styleMol1 = styleMol1Pos + 'pointer-events: none;';
        this.normalMol1 = renderSolid('#FFFFFF', '#D0D0D0', styleMol1);
        this.pressedMol1 = renderSolid('#00CA59', '#008650', styleMol1);
        this.drawnMol1 = newElement(div, 'canvas', { 'width': molw, 'height': height, 'style': styleMol1Pos });
        this.drawnMol1.style.cursor = 'pointer';
        if (this.mol1.numAtoms() > 0)
            this.renderMolecule(1);
        this.thinMol1 = renderBorder(1, styleMol1);
        this.thickMol1 = renderBorder(2, styleMol1);
        if (isRxn) {
            var styleArrowPos = 'position: absolute; left: ' + (2 * hpad + molw) + 'px; top: ' + vpad + 'px;';
            var styleArrow = styleArrowPos + 'pointer-events: none;';
            this.hoverArrow = renderOutlineArrow(styleArrow, '#C0C0C0');
            this.pressedArrow = renderOutlineArrow(styleArrow, '#00CA59');
            this.drawnArrow = renderArrow(styleArrowPos);
            var styleMol2Pos = 'position: absolute; left: ' + (3 * hpad + molw + arrow) + 'px; top: ' + vpad + 'px;';
            var styleMol2 = styleMol2Pos + 'pointer-events: none;';
            this.normalMol2 = renderSolid('#FFFFFF', '#D0D0D0', styleMol2);
            this.pressedMol2 = renderSolid('#00CA59', '#008650', styleMol2);
            this.drawnMol2 = newElement(div, 'canvas', { 'width': molw, 'height': height, 'style': styleMol2Pos });
            this.drawnMol2.style.cursor = 'pointer';
            if (this.mol2.numAtoms() > 0)
                this.renderMolecule(2);
            this.thinMol2 = renderBorder(1, styleMol2);
            this.thickMol2 = renderBorder(2, styleMol2);
        }
        this.updateLayers();
        var self = this;
        $(this.drawnMol1).mouseenter(function () { self.mouseEnter(1); });
        $(this.drawnMol1).mouseleave(function () { self.mouseLeave(1); });
        $(this.drawnMol1).mousedown(function () { self.mouseDown(1); });
        $(this.drawnMol1).mouseup(function () { self.mouseUp(1); });
        $(this.drawnMol1).attr('ondragstart', function () { return false; });
        $(this.drawnMol1).click(function () { self.editMolecule(1); });
        if (isRxn) {
            $(this.drawnArrow).mouseenter(function () { self.mouseEnter(3); });
            $(this.drawnArrow).mouseleave(function () { self.mouseLeave(3); });
            $(this.drawnArrow).mousedown(function () { self.mouseDown(3); });
            $(this.drawnArrow).mouseup(function () { self.mouseUp(3); });
            $(this.drawnArrow).attr('ondragstart', function () { return false; });
            $(this.drawnArrow).click(function () { self.editMapping(); });
            $(this.drawnMol2).mouseenter(function () { self.mouseEnter(2); });
            $(this.drawnMol2).mouseleave(function () { self.mouseLeave(2); });
            $(this.drawnMol2).mousedown(function () { self.mouseDown(2); });
            $(this.drawnMol2).mouseup(function () { self.mouseUp(2); });
            $(this.drawnMol2).attr('ondragstart', function () { return false; });
            $(this.drawnMol2).click(function () { self.editMolecule(2); });
        }
        if (!isRxn) {
            addTooltip(this.drawnMol1, 'Edit the molecular structure.');
        }
        else {
            addTooltip(this.drawnMol1, 'Edit the reactant structures.');
            addTooltip(this.drawnMol2, 'Edit the product structures.');
            addTooltip(this.drawnArrow, 'Map the reactant and product atoms, for more precise searches.');
        }
        this.drawnMol1.addEventListener('dragover', function (event) {
            event.stopPropagation();
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
        });
        this.drawnMol1.addEventListener('drop', function (event) {
            event.stopPropagation();
            event.preventDefault();
            self.dropInto(1, event.dataTransfer);
        });
        if (isRxn) {
            this.drawnMol2.addEventListener('dragover', function (event) {
                event.stopPropagation();
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
            });
            this.drawnMol2.addEventListener('drop', function (event) {
                event.stopPropagation();
                event.preventDefault();
                self.dropInto(2, event.dataTransfer);
            });
        }
    };
    ;
    SearchPanel.prototype.updateLayers = function () {
        setVisible(this.normalMol1, this.pressed != 1);
        setVisible(this.pressedMol1, this.pressed == 1);
        setVisible(this.thinMol1, this.highlight != 1);
        setVisible(this.thickMol1, this.highlight == 1);
        setVisible(this.hoverArrow, this.highlight == 3);
        setVisible(this.pressedArrow, this.pressed == 3);
        setVisible(this.normalMol2, this.pressed != 2);
        setVisible(this.pressedMol2, this.pressed == 2);
        setVisible(this.thinMol2, this.highlight != 2);
        setVisible(this.thickMol2, this.highlight == 2);
    };
    SearchPanel.prototype.renderMolecule = function (which) {
        var mol = which == 1 ? this.mol1 : this.mol2, canvas = which == 1 ? this.drawnMol1 : this.drawnMol2;
        if (mol.numAtoms() == 0) {
            canvas.width = canvas.width;
            return;
        }
        var withMapping = false;
        if (this.type == SearchPanel.TYPE_REACTION)
            for (var n = 1; n <= mol.numAtoms(); n++)
                if (mol.atomMapNum(n) > 0) {
                    withMapping = true;
                    break;
                }
        var policy = withMapping ? RenderPolicy.defaultBlackOnWhite() : RenderPolicy.defaultColourOnWhite();
        var input = { 'molNative': mol.toString(), 'policy': policy.data };
        Func.arrangeMolecule(input, function (result, error) {
            var metavec = new MetaVector(result.metavec);
            var width = this.MOLWIDTH, height = this.HEIGHT;
            var limW = width - 2, limH = height - 2;
            var natW = metavec.width, natH = metavec.height;
            var scale = 1;
            if (natW > limW) {
                var down = limW / natW;
                scale *= down;
                natW *= down;
                natH *= down;
            }
            if (natH > limH) {
                var down = limH / natH;
                scale *= down;
                natW *= down;
                natH *= down;
            }
            metavec.offsetX = 0.5 * (width - natW);
            metavec.offsetY = 0.5 * (height - natH);
            metavec.scale = scale;
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, width, height);
            metavec.density = pixelDensity();
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            canvas.width = width * metavec.density;
            canvas.height = height * metavec.density;
            var arrmol = result.arrmol;
            for (var n = 1; n <= mol.numAtoms(); n++)
                if (mol.atomMapNum(n) > 0) {
                    var col = this.COLCYCLE[(mol.atomMapNum(n) - 1) % this.COLCYCLE.length];
                    var pt = arrmol.points[n - 1];
                    var cx = metavec.offsetX + pt.cx * metavec.scale, cy = metavec.offsetY + pt.cy * metavec.scale;
                    var rw = Math.max(0.5 * policy.data.pointScale, pt.rw) * metavec.scale;
                    var rh = Math.max(0.5 * policy.data.pointScale, pt.rh) * metavec.scale;
                    ctx.beginPath();
                    ctx.ellipse(cx, cy, rw, rh, 0, 0, TWOPI, false);
                    ctx.fillStyle = col;
                    ctx.fill();
                }
            metavec.renderContext(ctx);
        }, this);
    };
    SearchPanel.prototype.mouseEnter = function (which) {
        if (this.highlight != which) {
            this.highlight = which;
            this.updateLayers();
        }
    };
    SearchPanel.prototype.mouseLeave = function (which) {
        if (this.highlight == which) {
            this.highlight = 0;
            this.pressed = 0;
            this.updateLayers();
        }
    };
    SearchPanel.prototype.mouseDown = function (which) {
        if (this.pressed != which) {
            this.pressed = which;
            this.updateLayers();
        }
    };
    SearchPanel.prototype.mouseUp = function (which) {
        if (this.pressed == which) {
            this.pressed = 0;
            this.updateLayers();
        }
    };
    SearchPanel.prototype.editMolecule = function (which) {
        Account.connectTransient(function (result, error) {
            if (!result)
                throw 'Token acquisition failed: ' + error.message;
            var tokenID = result.tokenID;
            var dlg = new EditCompound(tokenID, which == 1 ? this.mol1 : this.mol2);
            dlg.onSave(which == 1 ? this.saveMolecule1 : this.saveMolecule2, this);
            dlg.open();
        }, this);
    };
    SearchPanel.prototype.editMapping = function () {
        if (this.mol1.numAtoms() == 0 || this.mol2.numAtoms() == 0) {
            alert('Draw structures on both sides of the arrow before mapping.');
            return;
        }
        var dlg = new MapReaction(this.mol1, this.mol2);
        dlg.onSave(this.saveMapping, this);
        dlg.open();
    };
    SearchPanel.prototype.saveMolecule1 = function (dlg, which) {
        this.mol1 = dlg.getMolecule();
        dlg.close();
        this.renderMolecule(1);
        var cookies = new Cookies();
        if (cookies.numMolecules() > 0)
            cookies.stashMolecule(this.mol1);
    };
    SearchPanel.prototype.saveMolecule2 = function (dlg) {
        this.mol2 = dlg.getMolecule();
        dlg.close();
        this.renderMolecule(2);
        var cookies = new Cookies();
        if (cookies.numMolecules() > 0)
            cookies.stashMolecule(this.mol2);
    };
    SearchPanel.prototype.saveMapping = function (dlg) {
        this.mol1 = dlg.getMolecule1();
        this.mol2 = dlg.getMolecule2();
        dlg.close();
        this.renderMolecule(1);
        this.renderMolecule(2);
    };
    SearchPanel.prototype.dropInto = function (which, transfer) {
        var self = this;
        var items = transfer.items, files = transfer.files;
        for (var n = 0; n < items.length; n++) {
            if (items[n].type.startsWith('text/plain')) {
                items[n].getAsString(function (str) {
                    var mol = Molecule.fromString(str);
                    if (mol != null) {
                        if (which == 1)
                            self.setMolecule1(mol);
                        else
                            self.setMolecule2(mol);
                    }
                    else
                        console.log('Dragged data is not a SketchEl molecule: ' + str);
                });
                return;
            }
        }
        var _loop_4 = function(n) {
            if (files[n].name.endsWith('.el')) {
                var reader_2 = new FileReader();
                reader_2.onload = function (event) {
                    var str = reader_2.result;
                    var mol = Molecule.fromString(str);
                    if (mol != null) {
                        if (which == 1)
                            self.setMolecule1(mol);
                        else
                            self.setMolecule2(mol);
                    }
                    else
                        console.log('Dragged file is not a SketchEl molecule: ' + str);
                };
                reader_2.readAsText(files[n]);
                return { value: void 0 };
            }
        };
        for (var n = 0; n < files.length; n++) {
            var state_4 = _loop_4(n);
            if (typeof state_4 === "object") return state_4.value;
        }
    };
    SearchPanel.TYPE_MOLECULE = 'molecule';
    SearchPanel.TYPE_REACTION = 'reaction';
    return SearchPanel;
}(Widget));
var ViewStructure = (function (_super) {
    __extends(ViewStructure, _super);
    function ViewStructure(tokenID) {
        _super.call(this);
        this.tokenID = tokenID;
        this.naturalWidth = 0;
        this.naturalHeight = 0;
        this.width = 0;
        this.height = 0;
        this.padding = 2;
        this.borderCol = 0x000000;
        this.borderRadius = 8;
        this.backgroundCol1 = 0xFFFFFF;
        this.backgroundCol2 = 0xE0E0E0;
        this.molstr = null;
        this.datastr = null;
        this.datarow = 0;
        this.policy = null;
    }
    ViewStructure.prototype.defineMolecule = function (mol) {
        this.molstr = mol.toString();
    };
    ViewStructure.prototype.defineMoleculeString = function (molsk) {
        this.molstr = molsk;
    };
    ViewStructure.prototype.defineDataSheetString = function (dsxml, rowidx) {
        this.datastr = dsxml;
        this.datarow = rowidx != null ? rowidx : 0;
    };
    ViewStructure.prototype.defineRenderPolicy = function (policy) {
        this.policy = policy;
    };
    ViewStructure.prototype.setup = function (callback, master) {
        if (this.molstr == null && this.datastr == null)
            throw 'molsync.ui.ViewStructure.setup called without specifying a molecule or datasheet';
        var input = { 'tokenID': this.tokenID };
        if (this.policy != null)
            input.policy = this.policy.data;
        if (this.molstr != null)
            input.molNative = this.molstr;
        else if (this.datastr != null) {
            input.dataXML = this.datastr;
            input.dataRow = this.datarow;
        }
        var fcn = function (result, error) {
            if (!result) {
                alert('Setup of ViewStructure failed: ' + error.message);
                return;
            }
            this.metavec = result.metavec;
            this.naturalWidth = this.metavec.size[0];
            this.naturalHeight = this.metavec.size[1];
            if (this.width == 0)
                this.width = this.naturalWidth + 2 * this.padding;
            if (this.height == 0)
                this.height = this.naturalHeight + 2 * this.padding;
            if (callback)
                callback.call(master);
        };
        Func.renderStructure(input, fcn, this);
    };
    ViewStructure.prototype.render = function (parent) {
        if (!this.metavec)
            throw 'molsync.ui.ViewStructure.render must be preceded by a call to setup';
        _super.prototype.render.call(this, parent);
        var canvas = newElement(this.content, 'canvas', { 'width': this.width, 'height': this.height });
        var density = pixelDensity();
        canvas.width = this.width * density;
        canvas.height = this.height * density;
        canvas.style.width = this.width + 'px';
        canvas.style.height = this.height + 'px';
        var ctx = canvas.getContext('2d');
        ctx.save();
        ctx.scale(density, density);
        var path;
        if (this.borderRadius == 0) {
            path = new Path2D();
            path.rect(1.5, 1.5, this.width - 3, this.height - 3);
        }
        else
            path = pathRoundedRect(1.5, 1.5, this.width - 1.5, this.height - 1.5, this.borderRadius);
        if (this.backgroundCol1 != null) {
            if (this.backgroundCol2 == null) {
                ctx.fillStyle = colourCanvas(this.backgroundCol1);
            }
            else {
                var grad = ctx.createLinearGradient(0, 0, this.width, this.height);
                grad.addColorStop(0, colourCanvas(this.backgroundCol1));
                grad.addColorStop(1, colourCanvas(this.backgroundCol2));
                ctx.fillStyle = grad;
            }
            ctx.fill(path);
        }
        if (this.borderCol != -1) {
            ctx.strokeStyle = colourCanvas(this.borderCol);
            ctx.lineWidth = 1;
            ctx.stroke(path);
        }
        var limW = this.width - 2 * this.padding, limH = this.height - 2 * this.padding;
        var natW = this.naturalWidth, natH = this.naturalHeight;
        var scale = 1;
        if (natW > limW) {
            var down = limW / natW;
            scale *= down;
            natW *= down;
            natH *= down;
        }
        if (natH > limH) {
            var down = limH / natH;
            scale *= down;
            natW *= down;
            natH *= down;
        }
        var draw = new MetaVector(this.metavec);
        draw.offsetX = 0.5 * (this.width - natW);
        draw.offsetY = 0.5 * (this.height - natH);
        draw.scale = scale;
        draw.renderContext(ctx);
        ctx.restore();
    };
    return ViewStructure;
}(Widget));
var globalPopover = null;
var globalTooltip = null;
var globalPopWatermark = 0;
function addTooltip(parent, bodyHTML, titleHTML) {
    var widget = $(parent);
    if (globalPopover == null) {
        globalPopover = $(document.createElement('div'));
        globalPopover.css('position', 'absolute');
        globalPopover.css('background-color', '#F0F0FF');
        globalPopover.css('color', 'black');
        globalPopover.css('border', '1px solid black');
        globalPopover.css('padding', '0.3em');
        globalPopover.hide();
        globalPopover.appendTo(document.body);
    }
    var tooltip = new Tooltip(widget, bodyHTML, titleHTML);
    var prevEnter = widget.attr('onmouseenter'), prevLeave = widget.attr('onmouseleave');
    widget.mouseenter(function (e) { tooltip.start(); if (prevEnter)
        prevEnter(e); });
    widget.mouseleave(function (e) { tooltip.stop(); if (prevLeave)
        prevLeave(e); });
}
function clearTooltip() {
    if (globalTooltip == null)
        return;
    globalPopWatermark++;
    globalTooltip.lower();
}
var Tooltip = (function () {
    function Tooltip(widget, bodyHTML, titleHTML) {
        this.widget = widget;
        this.bodyHTML = bodyHTML;
        this.titleHTML = titleHTML;
    }
    Tooltip.prototype.start = function () {
        globalPopover.hide();
        this.watermark = ++globalPopWatermark;
        var self = this;
        window.setTimeout(function () {
            if (self.watermark == globalPopWatermark)
                self.raise();
        }, 1000);
    };
    Tooltip.prototype.stop = function () {
        if (this.watermark == globalPopWatermark)
            this.lower();
        globalPopWatermark++;
    };
    Tooltip.prototype.raise = function () {
        globalTooltip = this;
        var pop = globalPopover;
        pop.css('max-width', '20em');
        pop.empty();
        var hasTitle = this.titleHTML != null && this.titleHTML.length > 0, hasBody = this.bodyHTML != null && this.bodyHTML.length > 0;
        if (hasTitle)
            ($('<div></div>').appendTo(pop)).html('<b>' + this.titleHTML + '</b>');
        if (hasTitle && hasBody)
            pop.append('<hr>');
        if (hasBody)
            ($('<div></div>').appendTo(pop)).html(this.bodyHTML);
        var popW = pop.width(), popH = pop.height();
        var wpos = this.widget.offset(), width = this.widget.width(), height = this.widget.height();
        var posX = wpos.left;
        var posY = wpos.top + height + 2;
        pop.css('left', posX + "px");
        pop.css('top', posY + "px");
        pop.show();
    };
    Tooltip.prototype.lower = function () {
        var pop = globalPopover;
        pop.hide();
    };
    return Tooltip;
}());
var SearchMolecules = (function (_super) {
    __extends(SearchMolecules, _super);
    function SearchMolecules(tokenID) {
        _super.call(this);
        this.tokenID = tokenID;
        this.molsearchToken = null;
        this.cancelled = false;
        this.started = false;
        this.finished = false;
        this.progress = 0;
        this.count = 0;
        this.results = [];
        this.callbackStop = null;
        this.masterStop = null;
        this.callbackProgress = null;
        this.masterProgress = null;
        this.callbackMol = null;
        this.masterMol = null;
        this.callbackDS = null;
        this.masterDS = null;
    }
    SearchMolecules.prototype.onStop = function (callback, master) {
        this.callbackStop = callback;
        this.masterStop = master;
    };
    SearchMolecules.prototype.onProgress = function (callback, master) {
        this.callbackProgress = callback;
        this.masterProgress = master;
    };
    SearchMolecules.prototype.onClickMolecule = function (callback, master) {
        this.callbackMol = callback;
        this.masterMol = master;
    };
    SearchMolecules.prototype.onClickDataSheet = function (callback, master) {
        this.callbackDS = callback;
        this.masterDS = master;
    };
    SearchMolecules.prototype.render = function (parent) {
        _super.prototype.render.call(this, parent);
        var tableStyle = 'border-collapse: collapse;';
        this.table = $('<table></table>').appendTo(this.content);
        this.table.attr('style', tableStyle);
    };
    SearchMolecules.prototype.startSearch = function (origin, mol, type, maxResults) {
        if (maxResults === void 0) { maxResults = 100; }
        this.cancelled = false;
        this.results = [];
        this.table.empty();
        this.placeholder = $('<tr><td>Starting search...</td></tr>').appendTo(this.table);
        var molstr = mol == null ? null : mol.toString();
        var param = { 'origin': origin, 'molNative': molstr, 'type': type, 'maxResults': maxResults };
        Search.startMolSearch(param, function (result, error) {
            if (error != null)
                throw 'molsync.ui.SearchMolecules: failed to initiate search: ' + error.message;
            this.molsearchToken = result.molsearchToken;
            this.started = true;
            this.finished = false;
            Search.pollMolSearch({ 'molsearchToken': this.molsearchToken }, this.batchSearch, this);
        }, this);
    };
    SearchMolecules.prototype.stopSearch = function () {
        if (this.placeholder) {
            this.placeholder.remove();
            this.placeholder = null;
        }
        this.cancelled = true;
        this.finished = true;
        if (this.callbackStop)
            this.callbackStop.call(this.masterStop, this);
    };
    SearchMolecules.prototype.isRunning = function () {
        return this.started && !this.finished;
    };
    SearchMolecules.prototype.batchSearch = function (result, error) {
        if (this.placeholder) {
            this.placeholder.remove();
            this.placeholder = null;
        }
        if (error != null)
            throw 'molsync.ui.SearchMolecules: failed to obtain next batch: ' + error.message;
        if (this.cancelled)
            return;
        this.finished = result.finished;
        this.progress = result.progress;
        this.count = result.count;
        if (result.modified)
            this.updateResults(result.results);
        if (!this.finished) {
            Search.pollMolSearch({ 'molsearchToken': this.molsearchToken }, this.batchSearch, this);
            if (this.callbackProgress)
                this.callbackProgress.call(this.masterProgress, this.progress, this.count, this);
        }
        else {
            if (this.callbackStop)
                this.callbackStop.call(this.masterStop, this);
        }
    };
    SearchMolecules.prototype.updateResults = function (results) {
        var self = this;
        for (var n = 0; n < results.length; n++) {
            var res = results[n];
            res.tr = $('<tr></tr>').appendTo(this.table);
            res.td = $('<td></td>').appendTo(res.tr);
            if (n > 0)
                res.td.css('border-top', '1px solid #80C080');
            if (n < results.length - 1)
                res.td.css('border-bottom', '1px solid #80C080');
            var table = $('<table></table>').appendTo(res.td), tr = $('<tr></tr>').appendTo(table);
            if (res.similarity) {
                var td_1 = $('<td></td>').appendTo(tr);
                var txt = res.similarity == 1 ? '100%' : (res.similarity * 100).toFixed(1) + '%';
                td_1.text(txt);
            }
            for (var _i = 0, _a = res.sketches; _i < _a.length; _i++) {
                var sk = _a[_i];
                var td_2 = $('<td></td>').appendTo(tr);
                var vs = this.grabSketch(td_2, sk.molNative, sk.moleculeID);
                sk.viewMol = vs;
            }
            var td = $('<td></td>').appendTo(tr);
            var _loop_5 = function(src) {
                var link = $('<a href="#' + src.datasheetID + '"></a>').appendTo(td);
                link.mouseenter(function (e) { e.target.style.backgroundColor = '#D0D0D0'; });
                link.mouseleave(function (e) { e.target.style.backgroundColor = 'transparent'; });
                var title = src.subTitle ? src.subTitle : src.title ? src.title : 'DataSheet#' + src.datasheetID;
                link.text(title);
                var body = '';
                if (src.title && src.title != title)
                    body += '<div>Title: <i>' + escapeHTML(src.title) + '</i></div>';
                if (src.descr)
                    body += '<div>Description: <i>' + escapeHTML(src.descr) + '</i></div>';
                body += '<div>Row ' + src.row + '</div>';
                addTooltip(link, body, escapeHTML(title));
                link.click(function () {
                    if (self.callbackDS)
                        self.callbackDS(src.datasheetID, self);
                });
                td.append(' ');
            };
            for (var _b = 0, _c = res.sources; _b < _c.length; _b++) {
                var src = _c[_b];
                _loop_5(src);
            }
        }
        for (var _d = 0, _e = this.results; _d < _e.length; _d++) {
            var res = _e[_d];
            res.tr.remove();
        }
        this.results = results;
    };
    SearchMolecules.prototype.grabSketch = function (parent, molNative, moleculeID) {
        for (var _i = 0, _a = this.results; _i < _a.length; _i++) {
            var res = _a[_i];
            for (var _b = 0, _c = res.sketches; _b < _c.length; _b++) {
                var sk = _c[_b];
                for (var _d = 0, moleculeID_1 = moleculeID; _d < moleculeID_1.length; _d++) {
                    var mid = moleculeID_1[_d];
                    if (sk.moleculeID.indexOf(mid) >= 0 && sk.viewMol != null) {
                        sk.viewMol.content.appendTo(parent);
                        return sk.viewMol;
                    }
                }
            }
        }
        var vs = new ViewStructure(this.tokenID);
        vs.content = parent;
        vs.defineMoleculeString(molNative);
        vs.borderCol = -1;
        vs.backgroundCol1 = 0xF8F8F8;
        vs.backgroundCol2 = 0xE0E0E0;
        vs.padding = 4;
        vs.setup(function () {
            vs.render(parent);
            vs.content.css('cursor', 'pointer');
            var self = this;
            vs.content.click(function () {
                if (self.callbackMol)
                    self.callbackMol(moleculeID, Molecule.fromString(molNative), self);
            });
        }, this);
        return vs;
    };
    SearchMolecules.TYPE_EXACT = 'exact';
    SearchMolecules.TYPE_SUBSTRUCTURE = 'substructure';
    SearchMolecules.TYPE_SIMILARITY = 'similarity';
    SearchMolecules.TYPE_RANDOM = 'random';
    return SearchMolecules;
}(Widget));
var SearchReactions = (function (_super) {
    __extends(SearchReactions, _super);
    function SearchReactions(tokenID) {
        _super.call(this);
        this.tokenID = tokenID;
        this.rxnsearchToken = null;
        this.cancelled = false;
        this.started = false;
        this.finished = false;
        this.progress = 0;
        this.count = 0;
        this.results = [];
        this.callbackStop = null;
        this.masterStop = null;
        this.callbackProgress = null;
        this.masterProgress = null;
        this.callbackRxn = null;
        this.masterRxn = null;
        this.callbackDS = null;
        this.masterDS = null;
    }
    SearchReactions.prototype.onStop = function (callback, master) {
        this.callbackStop = callback;
        this.masterStop = master;
    };
    SearchReactions.prototype.onProgress = function (callback, master) {
        this.callbackProgress = callback;
        this.masterProgress = master;
    };
    SearchReactions.prototype.onClickReaction = function (callback, master) {
        this.callbackRxn = callback;
        this.masterRxn = master;
    };
    SearchReactions.prototype.onClickDataSheet = function (callback, master) {
        this.callbackDS = callback;
        this.masterDS = master;
    };
    SearchReactions.prototype.render = function (parent) {
        _super.prototype.render.call(this, parent);
        var tableStyle = 'border-collapse: collapse;';
        this.table = $('<table></table>').appendTo(this.content);
        this.table.attr('style', tableStyle);
    };
    SearchReactions.prototype.startSearch = function (origin, mol1, mol2, type, maxResults) {
        if (maxResults === void 0) { maxResults = 100; }
        this.cancelled = false;
        this.results = [];
        this.table.empty();
        this.placeholder = $('<tr><td>Starting search...</td></tr>').appendTo(this.table);
        var molstr1 = mol1 == null ? null : mol1.toString();
        var molstr2 = mol2 == null ? null : mol2.toString();
        var param = { 'origin': origin, 'molNative1': molstr1, 'molNative2': molstr2, 'type': type, 'maxResults': maxResults };
        Search.startRxnSearch(param, function (result, error) {
            if (error != null)
                throw 'molsync.ui.SearchReactions: failed to initiate search: ' + error.message;
            this.rxnsearchToken = result.rxnsearchToken;
            this.started = true;
            this.finished = false;
            Search.pollRxnSearch({ 'rxnsearchToken': this.rxnsearchToken }, this.batchSearch, this);
        }, this);
    };
    SearchReactions.prototype.stopSearch = function () {
        if (this.placeholder) {
            this.placeholder.remove();
            this.placeholder = null;
        }
        this.cancelled = true;
        this.finished = true;
        if (this.callbackStop)
            this.callbackStop.call(this.masterStop, this);
    };
    SearchReactions.prototype.isRunning = function () {
        return this.started && !this.finished;
    };
    SearchReactions.prototype.batchSearch = function (result, error) {
        if (error != null)
            throw 'molsync.ui.SearchReactions: failed to obtain next batch: ' + error.message;
        if (this.cancelled)
            return;
        this.finished = result.finished;
        this.progress = result.progress;
        this.count = result.count;
        if (result.modified) {
            if (this.placeholder) {
                this.placeholder.remove();
                this.placeholder = null;
            }
            this.updateResults(result.results);
        }
        if (!this.finished) {
            Search.pollRxnSearch({ 'rxnsearchToken': this.rxnsearchToken }, this.batchSearch, this);
            if (this.callbackProgress)
                this.callbackProgress.call(this.masterProgress, this.progress, this.count, this);
        }
        else {
            if (this.placeholder) {
                this.placeholder.remove();
                this.placeholder = null;
            }
            if (this.callbackStop)
                this.callbackStop.call(this.masterStop, this);
        }
    };
    SearchReactions.prototype.updateResults = function (results) {
        var self = this;
        var _loop_6 = function(n) {
            var res = results[n];
            res.tr = $('<tr></tr>').appendTo(this_3.table);
            res.td = $('<td></td>').appendTo(res.tr);
            if (n > 0)
                res.td.css('border-top', '1px solid #80C080');
            if (n < results.length - 1)
                res.td.css('border-bottom', '1px solid #80C080');
            var table = $('<table></table>').appendTo(res.td), tr = $('<tr></tr>').appendTo(table);
            if (res.similarity) {
                var td_3 = $('<td></td>').appendTo(tr);
                var txt = res.similarity == 1 ? '100%' : (res.similarity * 100).toFixed(1) + '%';
                td_3.text(txt);
            }
            if (res.dataXML) {
                var td_4 = $('<td></td>').appendTo(tr);
                var vs = this_3.grabSketch(td_4, res.dataXML, res.datasheetID, res.row, res.batchID);
                res.viewRxn = vs;
            }
            var td = $('<td></td>').appendTo(tr);
            var link = $('<a href="#' + res.datasheetID + '"></a>').appendTo(td);
            link.mouseenter(function (e) { e.target.style.backgroundColor = '#D0D0D0'; });
            link.mouseleave(function (e) { e.target.style.backgroundColor = 'transparent'; });
            var title = res.subTitle ? res.subTitle : res.title ? res.title : 'DataSheet#' + res.datasheetID;
            link.text(title);
            var body = '';
            if (res.title && res.title != title)
                body += '<div>Title: <i>' + escapeHTML(res.title) + '</i></div>';
            if (res.descr)
                body += '<div>Description: <i>' + escapeHTML(res.descr) + '</i></div>';
            addTooltip(link, body, escapeHTML(title));
            link.click(function () {
                if (self.callbackDS)
                    self.callbackDS(res.datasheetID, self);
            });
            td.append(' ');
        };
        var this_3 = this;
        for (var n = 0; n < results.length; n++) {
            _loop_6(n);
        }
        for (var _i = 0, _a = this.results; _i < _a.length; _i++) {
            var res = _a[_i];
            res.tr.remove();
        }
        this.results = results;
    };
    SearchReactions.prototype.grabSketch = function (parent, dataXML, datasheetID, row, batchID) {
        for (var _i = 0, _a = this.results; _i < _a.length; _i++) {
            var res = _a[_i];
            if (res.batchID == batchID) {
                res.viewRxn.content.appendTo(parent);
                return res.viewRxn;
            }
        }
        var vs = new ViewStructure(this.tokenID);
        vs.content = parent;
        vs.defineDataSheetString(dataXML, 0);
        vs.borderCol = -1;
        vs.backgroundCol1 = 0xF8F8F8;
        vs.backgroundCol2 = 0xE0E0E0;
        vs.padding = 4;
        vs.setup(function () {
            vs.render(parent);
            vs.content.css('cursor', 'pointer');
            var self = this;
            vs.content.click(function () {
                if (self.callbackRxn)
                    self.callbackRxn(dataXML, datasheetID, row, self);
            });
        }, this);
        return vs;
    };
    SearchReactions.TYPE_COMPONENT = 'component';
    SearchReactions.TYPE_TRANSFORM = 'transform';
    SearchReactions.TYPE_SIMILARITY = 'similarity';
    SearchReactions.TYPE_RANDOM = 'random';
    return SearchReactions;
}(Widget));
function anyTrue(arr) {
    if (arr == null)
        return false;
    for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
        var v = arr_1[_i];
        if (v)
            return true;
    }
    return false;
}
function allTrue(arr) {
    if (arr == null)
        return true;
    for (var _i = 0, arr_2 = arr; _i < arr_2.length; _i++) {
        var v = arr_2[_i];
        if (!v)
            return false;
    }
    return true;
}
function anyFalse(arr) {
    if (arr == null)
        return false;
    for (var _i = 0, arr_3 = arr; _i < arr_3.length; _i++) {
        var v = arr_3[_i];
        if (!v)
            return true;
    }
    return false;
}
function allFalse(arr) {
    if (arr == null)
        return true;
    for (var _i = 0, arr_4 = arr; _i < arr_4.length; _i++) {
        var v = arr_4[_i];
        if (v)
            return false;
    }
    return true;
}
//# sourceMappingURL=webmolkit-build.js.map