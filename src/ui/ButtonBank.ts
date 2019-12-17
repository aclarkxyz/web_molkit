/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	ButtonBank: abstract base class for providing a "bank of buttons". The instance is expected to server up a list
	of renderable buttons, and to respond when buttons are pressed. A ButtonBank is always owned by a ButtonView instance,
	which calls the shots.

	Content:
		.buttons: an array of buttons, each of them an object with the following properties:
			.id: identification code supplied when a button is activated
			.imageFN: root prefix for a static image to display
			.metavec: metavector data to display instead of an image (raw data, not object)
			.helpText: explanatory text
			.isSubMenu: true if the button should be annotated with a submenu glyph
			.mnemonic: optional keyboard shortcut & annotation
		.ownerView: the molsync.ui.ButtonView object that owns this buttonbank; gets set after the constructor is called
*/

export interface ButtonBankItem
{
	id:string;
	imageFN?:string;
	metavec?:any; // either an instance of MetaVector or a dictionary that can be used to make one (server-generated: semi-deprecated)
	helpText:string;
	isSubMenu?:boolean;
	mnemonic?:string; // key combination for display with modifiers, e.g. Shift+X, which gets interpreted for action purposes
	key?:string; // from KeyCode; overrides the key part of the mnemonic
	text?:string;
}

export abstract class ButtonBank
{
	public buttonView:any; // the widget parent
	public isSubLevel = false; // true if it's not the first-on-stack
	public buttons:ButtonBankItem[] = [];

	constructor() {}

	// called when the bank is added to a view; the .ownerView property will be set at this point
	public init():void {}

	// update the list of buttons; this may be called more than once, e.g. when resizing, or being popped back off the stack; this
	// method must be overridden
	public abstract update():void;

	// this gets called when a button is activated, i.e. clicked
	public abstract hitButton(id:string):void;

	// a key has been pressed: the button bank may choose to react to it
	public claimKey(event:JQueryEventObject):boolean {return false;}

	// override to capture the closing of the bank (a cleanup opportunity)
	public bankClosed() {}

	// utility function: returns true if the system-generated keyboard event for a "keypress" action matches the mnemonic string (which is
	// used as a shorthand in the button definitions); the mnemonic format is basically:
	//
	//     {modifier1}-{modifier2}-...-{keychar}
	//
	// where the modifiers consist of Shift-, Ctrl-, Alt-; and the keychar is usually a plain keyboard character which is case insensitive - with
	// special word codes for unprintables
	public static matchKey(event:JQueryEventObject, mnemonic:string, key:string):boolean
	{
		if (mnemonic == null || mnemonic == '') return false;

		let mshift = false, mctrl = false, malt = false, mmeta = false, mkey = mnemonic;
		while (true)
		{
			if (mkey.startsWith('Shift+')) {mshift = true; mkey = mkey.substring(6);}
			else if (mkey.startsWith('Ctrl+')) {mctrl = true; mkey = mkey.substring(5);}
			else if (mkey.startsWith('Alt+')) {malt = true; mkey = mkey.substring(4);}
			else if (mkey.startsWith('Cmd+')) {mmeta = true; mkey = mkey.substring(4);}
			else break;
		}

		if (mshift != event.shiftKey) return false;
		if (mctrl != event.ctrlKey) return false;
		if (malt != event.altKey) return false;
		if (mmeta != event.metaKey) return false;

		if (key) mkey = key; // override

		return mkey.toLowerCase() == event.key.toLowerCase();

		/*let ch = String.fromCharCode(event.keyCode || event.charCode);

		if (event.keyCode == 27) ch = 'escape';
		else if (event.keyCode == 8) ch = 'backspace';
		else if (event.keyCode == 46) ch = 'delete';

		if (mshift)
		{
			// special deal: some shifted characters look better if they're displayed unshifted; have to do a switcheroo
			const SHIFT_SUBST:{[id:string] : string} =
				{'1': '!', '2': '@', '3': '#', '4': '$', '5': '%', '6': '^', '7': '&', '8': '*', '9': '(', '0': ')', '-': '_', '=': '+'};
			let subst = SHIFT_SUBST[mkey];
			if (subst) mkey = subst;
		}
		return ch.toLowerCase() == mkey.toLowerCase();*/
	}
}

/* EOF */ }