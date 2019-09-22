/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='Dialog.ts'/>
///<reference path='../util/util.ts'/>
///<reference path='../ui/OptionList.ts'/>
///<reference path='../data/FormatList.ts'/>
///<reference path='../rpc/RPC.ts'/>
///<reference path='../rpc/Func.ts'/>
///<reference path='../data/DataSheetStream.ts'/>
///<reference path='../decl/jquery.d.ts'/>
///<reference path='../data/Molecule.ts'/>
///<reference path='../data/DataSheet.ts'/>
///<reference path='../gfx/Rendering.ts'/>
///<reference path='../gfx/MetaVector.ts'/>

namespace WebMolKit /* BOF */ {

/*
	Provides the ability to download structured data (molecules, datasheets) in all supported formats.
*/

export class Download extends Dialog
{
	private btnPrepare:JQuery;
	private mainArea:JQuery;
	private pictureArea:JQuery;
	private formatArea:JQuery;
	private graphicArea:JQuery;
	private downloadArea:JQuery;
	private optFormatList:OptionList;
	private optSizeType:OptionList;
	private divSizeScale:JQuery;
	private divSizeBox:JQuery;
	private lineScale:JQuery;
	private lineBoxWidth:JQuery;
	private lineBoxHeight:JQuery;
	private lineBoxMaxScale:JQuery;
	private selectRender:JQuery;

	private mol:Molecule = null;
	private ds:DataSheet = null;
	private policy = RenderPolicy.defaultColourOnWhite();
	private formatKey:string[] = [];
	private formatGfx:boolean[] = [];

	// the dialog constructor: most of the interesting content has to be provided subsequently
	constructor(private tokenID:string)
	{
		super();
	}

	// creates a new dialog, using an instance of molsync.data.Molecule as the subject; the content will be submitted to
	// the server as a "transient" datum associated with the tokenID
	public static openTransientMolecule(tokenID:string, mol:Molecule)
	{
		let dlg = new Download(tokenID);
		dlg.mol = mol;
		dlg.title = 'Download Molecule';
		dlg.open();
		return dlg;
	}

	// creates a new dialog, using an instance of molsync.data.DataSheet as the subject; the content will be submitted to
	// the server as a "transient" datum associated with the tokenID
	public static openTransientDataSheet(tokenID:string, ds:DataSheet):Download
	{
		let dlg = new Download(tokenID);
		dlg.ds = ds;
		dlg.title = 'Download DataSheet';
		dlg.open();
		return dlg;
	}

	// builds the dialog content
	protected populate():void
	{
		let body = this.body();

		this.mainArea = $('<p>Setting up...</p>').appendTo(body);

		// add buttons
		let paraBtn = $('<p align="right"></p>').appendTo(body);

		this.downloadArea = $('<span style="padding-right: 2em;"></span>').appendTo(paraBtn);
		this.btnPrepare = $('<button class="button button-primary">Prepare</button>').appendTo(paraBtn);
		this.btnPrepare.click(() => this.clickPrepare());

		// activate the dialog
		if (this.mol != null)
		{
			this.formatKey.push(FormatList.FMT_NATIVE); this.formatGfx.push(false);
			this.formatKey.push(FormatList.FMT_MDLMOL); this.formatGfx.push(false);
			this.formatKey.push(FormatList.GFX_PNG); this.formatGfx.push(true);
			this.formatKey.push(FormatList.GFX_SVG); this.formatGfx.push(true);
			this.formatKey.push(FormatList.GFX_PDF); this.formatGfx.push(true);
			this.formatKey.push(FormatList.GFX_EPS); this.formatGfx.push(true);
		}
		else if (this.ds != null)
		{
			let isReaction = false, isExperiment = false;
			for (let n = 0; n < this.ds.numExtensions; n++)
			{
				if (this.ds.getExtType(n) == 'org.mmi.aspect.Reaction') isReaction = true;
				if (this.ds.getExtType(n) == 'org.mmi.aspect.Experiment') isExperiment = true;
			}
			this.formatKey.push(FormatList.FMT_XMLDS); this.formatGfx.push(false);
			if (!isReaction)
			{
				this.formatKey.push(FormatList.FMT_MDLSDF); this.formatGfx.push(false);
			}
			if (isReaction)
			{
				this.formatKey.push(FormatList.FMT_MDLRDF); this.formatGfx.push(false);
				if (this.ds.numRows == 1)
				{
					this.formatKey.push(FormatList.FMT_MDLRXN); this.formatGfx.push(false);
				}
			}
			if (this.ds.numRows == 1 || isExperiment)
			{
				if (!isReaction && this.ds.firstColOfType(DataSheetColumn.Molecule) >= 0)
				{
					this.formatKey.push(FormatList.FMT_NATIVE); this.formatGfx.push(false);
					this.formatKey.push(FormatList.FMT_MDLMOL); this.formatGfx.push(false);
				}
				this.formatKey.push(FormatList.GFX_PNG); this.formatGfx.push(true);
				this.formatKey.push(FormatList.GFX_SVG); this.formatGfx.push(true);
				this.formatKey.push(FormatList.GFX_EPS); this.formatGfx.push(true);
				this.formatKey.push(FormatList.GFX_PDF); this.formatGfx.push(true);
			}
			this.formatKey.push(FormatList.GFX_PNGZIP); this.formatGfx.push(true);
			this.formatKey.push(FormatList.GFX_SVGZIP); this.formatGfx.push(true);
			this.formatKey.push(FormatList.GFX_PDFZIP); this.formatGfx.push(true);
			this.formatKey.push(FormatList.GFX_HTML); this.formatGfx.push(true);
		}

		this.formatKey.push(FormatList.GFX_OOXML_DOCX); this.formatGfx.push(true);
		this.formatKey.push(FormatList.GFX_OOXML_XLSX); this.formatGfx.push(true);

		// an area under the buttons, for the download link
		//this.downloadArea = $('<p></p>').appendTo(body);

		this.fillContent();
	}

	// grab the content
	private clickPrepare():void
	{
		let input:any = {'tokenID': this.tokenID};
		input.format = this.formatKey[this.optFormatList.getSelectedIndex()];
		input.policy = clone(this.policy.data);

		let sizeType = this.optSizeType.getSelectedValue();
		if (sizeType == 'Scale')
		{
			input.policy.pointScale = this.lineScale.val();
		}
		else if (sizeType == 'Box')
		{
			input.policy.pointScale = this.lineBoxMaxScale.val();
			input.box = [this.lineBoxWidth.val(), this.lineBoxHeight.val()];
		}

		this.btnPrepare.prop('disabled', true);

		if (this.mol != null)
		{
			input.molNative = this.mol.toString();
		}
		else if (this.ds != null)
		{
			input.dataXML = DataSheetStream.writeXML(this.ds);
		}
		Func.prepareDownloadable(input, (result:any, error:ErrorRPC) => this.downloadContent(result, error));
	}

	// submits the current content to get it viewed
	private fillContent():void
	{
		let input:any = {'tokenID': this.tokenID};
		input.policy = this.policy.data;
		if (this.mol != null)
		{
			input.molNative = this.mol.toString();
		}
		else if (this.ds != null)
		{
			input.dataXML = DataSheetStream.writeXML(this.ds);
			input.dataRow = 0; // !! need to make this configurable: this auto-gimps the feature
		}
		Func.renderStructure(input, (result:any, error:ErrorRPC) => this.updateStructure(result, error));
	}

	// reacts to a rendering of a structure
	private updateStructure(result:any, error:ErrorRPC)
	{
		if (!result)
		{
			alert('Request failed: ' + error.message);
			return;
		}

		let metavec = result.metavec;

		if (this.pictureArea == null) this.buildDisplay();
		this.pictureArea.empty();

		let w = metavec.size[0], h = metavec.size[1], padding = 2, scale = 1;
		if (w > 700) {let mod = 700 / w; scale *= mod; w *= mod; h *= mod;}
		if (h > 500) {let mod = 500 / h; scale *= mod; w *= mod; h *= mod;}
		let cw = Math.ceil(w) + 2 * padding, ch = Math.ceil(h) + 2 * padding;

		// background widget
		let canvas = newElement(this.pictureArea, 'canvas', {'width': cw, 'height': ch}) as HTMLCanvasElement;

		let density = pixelDensity();
		canvas.width = cw * density;
		canvas.height = ch * density;
		canvas.style.width = cw + 'px';
		canvas.style.height = ch + 'px';

		let ctx = canvas.getContext('2d');
		ctx.save();
		ctx.scale(density, density);

		let grad = ctx.createLinearGradient(0, 0, cw, ch);
		if (this.policy.data.background != 0x000000)
		{
			grad.addColorStop(0, colourCode(0xF8F8F8));
			grad.addColorStop(1, colourCode(0xE0E0E0));
		}
		else
		{
			grad.addColorStop(0, colourCode(0x404040));
			grad.addColorStop(1, colourCode(0x101010));
		}
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, cw, h + ch);
		ctx.strokeStyle = 'black';
		ctx.lineWidth = 1;
		ctx.strokeRect(0.5, 0.5, cw - 1, ch - 1);

		// draw in the structure
		let draw = new MetaVector(metavec);
		draw.offsetX = padding;
		draw.offsetY = padding;
		draw.scale = scale;
		draw.renderContext(ctx);

		let isExperiment = false;
		if (this.ds != null)
		{
			for (let n = 0; n < this.ds.numExtensions; n++)
				if (this.ds.getExtType(n) == 'org.mmi.aspect.Experiment') isExperiment = true;
		}

		if (this.ds != null && this.ds.numRows > 1 && !isExperiment)
		{
			let dstxt = '... and ' + (this.ds.numRows - 1) + ' more row' + (this.ds.numRows == 2 ? '' : 's') + '.';
			addText(newElement(this.pictureArea, 'p'), dstxt);
		}

		ctx.restore();
	}

	// replaces the "please wait" temporary content with a placeholder for the rendered picture, and fills in the
	// control widgets
	private buildDisplay():void
	{
		this.mainArea.empty();

		//let blankURL = RPC.BASE_URL + '/img/blank.gif';
		//newElement(this.mainArea, 'img', {'src': blankURL, 'width': '550', 'height': '1'}); // (... probably a nicer way to do this these days...)

		this.pictureArea = $('<p align="center"></p>').appendTo(this.mainArea);
		this.formatArea = $('<div style="text-align: left;"></div>').appendTo(this.mainArea);
		this.graphicArea = $('<div style="text-align: left;"></div>').appendTo(this.mainArea);

		// add in the formats
		this.formatArea.append($('<h2 class="tight">Choose Format</h2>'));
		this.formatArea.append($('<hr class="thin"></hr>'));

		let optList:string[] = [];
		for (let n = 0; n < this.formatKey.length; n++) optList.push('');
		let optFormatList = new OptionList(optList, true);
		optFormatList.render(this.formatArea);
		for (let n = 0; n < this.formatKey.length; n++)
		{
			let k = this.formatKey[n];
			$(optFormatList.getAuxiliaryCell(n)).append('\u00A0' + FormatList.FORMAT_DESCR[k]);
		}
		optFormatList.callbackSelect = (idx:number, source?:OptionList) => this.changeFormat(idx);

		// add in the graphics format options
		this.graphicArea.append($('<h2 class="tight">Graphic Options</h2>'));
		this.graphicArea.append($('<hr class="thin"></hr>'));

		let paraSizeType = $('<p></p>').appendTo(this.graphicArea);
		let paraSizeSpec = $('<p></p>').appendTo(this.graphicArea);
		let paraRender = $('<p></p>').appendTo(this.graphicArea);

		// size type
		let trSize = $('<table><tr></tr></table>').appendTo(paraSizeType).find('tr');
		trSize.append('<td style="vertical-align: middle; font-weight: bold;">Sizing: </td>');
		let optSizeType = new OptionList(['Scale', 'Box'], false);
		optSizeType.setSelectedIndex(0);
		optSizeType.render($('<td style="vertical-align: middle;"></td>').appendTo(trSize));
		optSizeType.callbackSelect = (idx:number, source?:OptionList) => this.changeSizeType(idx);

		// size details (one for each type)
		let divSizeScale = $('<div></div>').appendTo(paraSizeSpec);
		divSizeScale.append('<b>Angstroms-to-Points: </b>');
		let lineScale = $('<input type="text" size="6"></input>"').appendTo(divSizeScale);
		lineScale.val('30');

		let divSizeBox = $('<div style="display: none;"></div>').appendTo(paraSizeSpec);
		divSizeBox.append('<b>Width: </b>');
		let lineBoxWidth = $('<input type="text" size="6"></input>"').appendTo(divSizeBox);
		lineBoxWidth.val('400');
		divSizeBox.append('<b> Height: </b>');
		let lineBoxHeight = $('<input type="text" size="6"></input>"').appendTo(divSizeBox);
		lineBoxHeight.val('300');
		divSizeBox.append(' <b>Max Scale: </b>');
		let lineBoxMaxScale = $('<input type="text" size="6"></input>"').appendTo(divSizeBox);
		lineBoxMaxScale.val('30');

		// rendering policy
		paraRender.append('<b>Rendering: </b>');
		let selectRender = $('<select></select>').appendTo(paraRender);
		selectRender.append('<option>Black-on-White</option>');
		selectRender.append('<option>Colour-on-White</option>');
		selectRender.append('<option>White-on-Black</option>');
		selectRender.append('<option>Colour-on-Black</option>');
		selectRender.append('<option>Printed Publication</option>');
		selectRender.prop('selectedIndex', 1);
		selectRender.change(() => this.changeRender());

		// record UI objects
		this.optFormatList = optFormatList;
		this.optSizeType = optSizeType;
		this.divSizeScale = divSizeScale;
		this.divSizeBox = divSizeBox;
		this.lineScale = lineScale;
		this.lineBoxWidth = lineBoxWidth;
		this.lineBoxHeight = lineBoxHeight;
		this.lineBoxMaxScale = lineBoxMaxScale;
		this.selectRender = selectRender;
	}

	// pick a different format
	private changeFormat(idx:number):void
	{
		let ftype = this.formatKey[idx];

		// the document-style formats use a smaller default point size
		let psz = 30;
		if (ftype == FormatList.GFX_OOXML_DOCX || ftype == FormatList.GFX_OOXML_XLSX) psz = 10;
		this.lineScale.val(psz.toString());
	}

	// alter sizing type
	private changeSizeType(idx:number):void
	{
		if (idx == 0)
		{
			this.divSizeScale.css('display', 'block');
			this.divSizeBox.css('display', 'none');
		}
		else // idx == 1
		{
			this.divSizeScale.css('display', 'none');
			this.divSizeBox.css('display', 'block');
		}
	}

	// respond to a change in rendering type; this is a good time to update the picture
	private changeRender():void
	{
		let t = this.selectRender.prop('selectedIndex');

		if (t == 0) this.policy = RenderPolicy.defaultBlackOnWhite();
		else if (t == 1) this.policy = RenderPolicy.defaultColourOnWhite();
		else if (t == 2) this.policy = RenderPolicy.defaultWhiteOnBlack();
		else if (t == 3) this.policy = RenderPolicy.defaultColourOnBlack();
		else if (t == 4) this.policy = RenderPolicy.defaultPrintedPublication();

		let input:any = {'tokenID': this.tokenID};
		input.policy = this.policy.data;
		if (this.mol != null)
		{
			input.molNative = this.mol.toString();
		}
		else if (this.ds != null)
		{
			input.dataXML = DataSheetStream.writeXML(this.ds);
			input.dataRow = 0; // !! need to make this configurable: this auto-gimps the feature
		}
		Func.renderStructure(input, () => this.updateStructure);
	}

	// response from the server regarding the existence of a URL to download the content of interest
	private downloadContent(result:any, error:ErrorRPC):void
	{
		this.btnPrepare.prop('disabled', false);

		if (!result)
		{
			alert('Request failed: ' + error.message);
			return;
		}

		let format = this.formatKey[this.optFormatList.getSelectedIndex()];
		let id = result.transientID;
		let fn = 'download' + FormatList.FORMAT_EXTN[format];
		let url = RPC.BASE_URL + '/Download/' + fn + '?transientID=' + id;

		this.downloadArea.empty();
		addText(this.downloadArea, 'Temporary download link: ');
		addText(newElement(this.downloadArea, 'a', {'href': url, 'target': '_blank'}), fn);
	}
}

/* EOF */ }