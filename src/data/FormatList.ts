/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

/*
	Provides fixed constants for dataformats.

	(Note: presence in this file does not imply that they are all implemented yet)
*/

class FormatList
{
	public static FMT_NATIVE = 'native'; // SketchEl molecule format
	public static FMT_XMLDS = 'xmlds'; // XML datasheet format
	public static FMT_MDLMOL = 'mdlmol'; // MDL MOLfile (slightly lossy)
	public static FMT_MDLSDF = 'mdlsdf'; // MDL SDfile (very lossy)
	public static FMT_MDLRDF = 'mdlrdf'; // MDL RDfile (very lossy)
	public static FMT_MDLRXN = 'mdlrxn'; // MDL RXNfile (extremely lossy)

	public static GFX_PNG = 'png'; // raster graphics (single image)
	public static GFX_PNGZIP = 'pngzip'; // zip file containing multiple PNG images
	public static GFX_SVG = 'svg'; // scalable vector graphics (single diagram)
	public static GFX_SVGZIP = 'svgzip'; // zip file containing multiple SVG diagrams
	public static GFX_PDF = 'pdf'; // portable document format (single diagram)
	public static GFX_PDFZIP = 'pdfzip'; // zip file containing multiple PDF diagrams
	public static GFX_EPS = 'eps'; // encapsulated postscript (single diagram)
	public static GFX_HTML = 'html'; // HTML file with embedded SVG diagrams
	public static GFX_OPENDOC_ODG = 'odg'; // OpenDocument: graphic (single)
	public static GFX_OPENDOC_ODT = 'odt'; // OpenDocument: text
	public static GFX_OPENDOC_ODS = 'ods'; // OpenDocument: spreadsheet
	public static GFX_OOXML_DOCX = 'docx'; // Microsoft Word XML
	public static GFX_OOXML_XLSX = 'xlsx'; // Microsoft Excel XML

	public static FORMAT_DESCR:{[id:string] : string} =
	{
		'native':	'SketchEl Molecule',
		'xmlds':	'DataSheet XML',
		'mdlmol':	'MDL MOL (single molecule)',
		'mdlsdf':	'MDL SDF (molecules + data)',
		'mdlrdf':	'MDL RDF (reactions + data)',
		'mdlrxn':	'MDL RXN (single reaction)',

		'png':		'PNG image (raster)',
		'pngzip':	'ZIP (multiple PNG files)',
		'svg':		'SVG picture (vector)',
		'svgzip':	'ZIP (multiple SVG files)',
		'pdf':		'PDF diagram (vector)',
		'pdfzip':	'ZIP (multiple PDF files)',
		'eps':		'Encapsulated PostScript (vector)',
		'html':		'HTML with embedded SVG',
		'odg':		'OpenDocument Graphic',
		'odt':		'OpenDocument Text',
		'ods':		'OpenDocument SpreadSheet',
		'docx':		'Microsoft Word',
		'xlsx':		'Microsoft Excel'
	}
	public static FORMAT_EXTN:{[id:string] : string} =
	{
		'native':	'.el',
		'xmlds':	'.ds',
		'mdlmol':	'.mol',
		'mdlsdf':	'.sdf',
		'mdlrdf':	'.rdf',
		'mdlrxn':	'.rxn',
		'png':		'.png',
		'pngzip':	'_png.zip',
		'svg':		'.svg',
		'svgzip':	'_svg.zip',
		'pdf':		'.pdf',
		'pdfzip':	'_pdf.zip',
		'eps':		'.eps',
		'html':		'.html',
		'odg':		'.odg',
		'odt':		'.odt',
		'ods':		'.ods',
		'docx':		'.docx',
		'xlsx':		'.xlsx'
	}
	public static FORMAT_MIMETYPE:{[id:string] : string} =
	{
		'native':	'chemical/x-sketchel',
		'xmlds':	'chemical/x-datasheet',
		'mdlmol':	'chemical/x-mdl-molfile',
		'mdlsdf':	'chemical/x-mdl-sdfile',
		'mdlrdf':	'chemical/x-mdl-rdfile',
		'mdlrxn':	'chemical/x-mdl-rxnfile',
		'png':		'image/png',
		'pngzip':	'application/zip',
		'svg':		'image/png',
		'svgzip':	'application/zip',
		'pdf':		'application/pdf',
		'pdfzip':	'application/zip',
		'eps':		'image/eps',
		'html':		'text/html',
		'odg':		'application/vnd.oasis.opendocument.graphics',
		'odt':		'application/vnd.oasis.opendocument.text',
		'ods':		'application/vnd.oasis.opendocument.spreadsheet',
		'docx':		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'xlsx':		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
	}
}
