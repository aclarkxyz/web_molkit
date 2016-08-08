/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

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

interface ButtonBankItem
{
	id:string;
	imageFN?:string;
	metavec?:any;
	helpText:string;
	isSubMenu?:boolean;
	mnemonic?:string;
	text?:string;
}

abstract class ButtonBank
{
	public buttonView:any; // the widget parent
	public isSubLevel = false; // true if it's not the first-on-stack
	buttons:ButtonBankItem[] = [];
	
	constructor() {}

	// called when the bank is added to a view; the .ownerView property will be set at this point
	public init():void {}

	// update the list of buttons; this may be called more than once, e.g. when resizing, or being popped back off the stack; this
	// method must be overridden
	public abstract update():void;

	// this gets called when a button is activated, i.e. clicked
	public abstract hitButton(id:string):void;
	
	// override to capture the closing of the bank (a cleanup opportunity)
	public bankClosed() {}
}