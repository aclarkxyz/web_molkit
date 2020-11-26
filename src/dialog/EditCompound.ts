/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	Provides a wrapper dialog for the editing of a molecule. The main feature is an instance of molsync.ui.EditMolecule, but it also adds
	various other widgets.
*/

export class EditCompound extends Dialog
{
	protected btnClear:JQuery;
	//private btnPaste:JQuery; // (restore this when proxy allows paste on request?)
	protected btnCopy:JQuery;
	protected btnSave:JQuery;
	protected sketcher = new Sketcher();

	private proxyClip:ClipboardProxy = null;
	private proxyMenu:MenuProxy = null;

	private callbackSave:(source?:EditCompound) => void = null;

	// ------------ public methods ------------

	constructor(private mol:Molecule, parent:JQuery = null)
	{
		super(parent);

		this.title = 'Edit Compound';
		this.minPortionWidth = 20;
		this.maxPortionWidth = 95;
	}

	public onSave(callback:(source?:EditCompound) => void)
	{
		this.callbackSave = callback;
	}

	public getMolecule():Molecule {return this.sketcher.getMolecule();}

	public defineClipboard(proxy:ClipboardProxy):void
	{
		this.proxyClip = proxy;

		let handler = new ClipboardProxyHandler();
		handler.copyEvent = (andCut:boolean, proxy:ClipboardProxy):boolean =>
		{
			this.sketcher.performCopySelection(andCut);
			return true;
		};
		handler.pasteEvent = (proxy:ClipboardProxy):boolean =>
		{
			this.sketcher.pasteText(proxy.getString());
			return true;
		};
		proxy.pushHandler(handler);
		this.sketcher.defineClipboard(proxy);
	}

	public defineContext(proxy:MenuProxy):void
	{
		this.proxyMenu = proxy;
		this.sketcher.defineContext(proxy);
	}

	public close():void
	{
		if (this.proxyClip) this.proxyClip.popHandler();

		super.close();
	}

	// builds the dialog content
	protected populate():void
	{
		let buttons = this.buttons(), body = this.body();

		this.btnClear = $('<button class="wmk-button wmk-button-default">Clear</button>').appendTo(buttons).css({'margin-left': '0.5em'});
		this.btnClear.click(() => this.sketcher.clearMolecule());

		this.btnCopy = $('<button class="wmk-button wmk-button-default">Copy</button>').appendTo(buttons).css({'margin-left': '0.5em'});
		this.btnCopy.click(() => this.actionCopy());

		buttons.append(this.btnClose); // easy way to reorder
		this.btnClose.css({'margin-left': '0.5em'});

		this.btnSave = $('<button class="wmk-button wmk-button-primary">Save</button>').appendTo(buttons).css({'margin-left': '0.5em'});
		this.btnSave.click(() => {if (this.callbackSave) this.callbackSave(this);});

		let skw = 800, skh = 650;
		let skdiv = $('<div/>').appendTo(body);
		skdiv.css('width', skw + 'px');
		skdiv.css('height', skh + 'px');

		this.sketcher.setSize(skw, skh);
		this.sketcher.defineMolecule(this.mol);
		this.sketcher.setup(() => this.sketcher.render(skdiv));
	}

	public actionCopy():void
	{
		this.sketcher.performCopySelection(false);
	}
	public actionCut():void
	{
		this.sketcher.performCopySelection(true);
	}
	public actionPaste():void
	{
		this.sketcher.performPaste();
	}
	public actionUndo():void
	{
		this.sketcher.performUndo();
	}
	public actionRedo():void
	{
		this.sketcher.performRedo();
	}

	// ------------ private methods ------------

}

/* EOF */ }