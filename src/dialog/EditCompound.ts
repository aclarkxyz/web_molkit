/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {Molecule} from '../data/Molecule';
import {Sketcher} from '../sketcher/Sketcher';
import {ClipboardProxy, ClipboardProxyHandler} from '../ui/ClipboardProxy';
import {MenuProxy} from '../ui/MenuProxy';
import {dom, DOM} from '../util/dom';
import {Dialog} from './Dialog';

/*
	Provides a wrapper dialog for the editing of a molecule. The main feature is an instance of molsync.ui.EditMolecule, but it also adds
	various other widgets.
*/

export class EditCompound extends Dialog
{
	protected btnClear:DOM;
	protected btnCopy:DOM;
	protected btnSave:DOM;
	protected sketcher = new Sketcher();

	private proxyClip:ClipboardProxy = null;
	private proxyMenu:MenuProxy = null;

	private callbackSave:(source?:EditCompound) => void = null;

	// ------------ public methods ------------

	constructor(private mol:Molecule, parent:any= null)
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
	public getSketcher():Sketcher {return this.sketcher;}

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
		this.sketcher.defineContext(this.proxyMenu);
	}

	public close():void
	{
		if (this.proxyClip) this.proxyClip.popHandler();

		super.close();
	}

	// builds the dialog content
	protected populate():void
	{
		let buttons = this.buttonsDOM(), body = this.bodyDOM();

		this.btnClear = dom('<button class="wmk-button wmk-button-default">Clear</button>').appendTo(buttons).css({'margin-left': '0.5em'});
		this.btnClear.onClick(() => this.sketcher.clearMolecule());

		this.btnCopy = dom('<button class="wmk-button wmk-button-default">Copy</button>').appendTo(buttons).css({'margin-left': '0.5em'});
		this.btnCopy.onClick(() => this.actionCopy());

		buttons.append(this.domClose); // easy way to reorder
		this.domClose.css({'margin-left': '0.5em'});

		this.btnSave = dom('<button class="wmk-button wmk-button-primary">Save</button>').appendTo(buttons).css({'margin-left': '0.5em'});
		this.btnSave.onClick(() => {if (this.callbackSave) this.callbackSave(this);});

		let skw = 800, skh = 650;
		let skdiv = dom('<div/>').appendTo(body).css({'width': `${skw}px`, 'height': `${skh}px`});

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

