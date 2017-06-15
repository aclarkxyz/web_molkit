/*
    WebMolKit

    (c) 2010-2017 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='Dialog.ts'/>
///<reference path='../sketcher/Sketcher.ts'/>

/*
	Provides a wrapper dialog for the editing of a molecule. The main feature is an instance of molsync.ui.EditMolecule, but it also adds
	various other widgets.
*/

class EditCompound extends Dialog
{
	btnClear:JQuery;
	btnPaste:JQuery;
	btnCopy:JQuery;
	btnSave:JQuery;
	sketcher:Sketcher;
	
	fakeTextArea:HTMLTextAreaElement = null; // for temporarily bogarting the clipboard
	
	public callbackSave:(source?:EditCompound) => void = null;
		
	constructor(private tokenID:string, private mol:Molecule)
	{
		super();
		
		this.title = "Edit Compound";
		this.minPortionWidth = 20;
		this.maxPortionWidth = 95;
	}

	public onSave(callback:(source?:EditCompound) => void)
	{
		this.callbackSave = callback;
	}

	public getMolecule():Molecule {return this.sketcher.getMolecule();}

	// builds the dialog content
	protected populate():void
	{		
		let buttons = this.buttons(), body = this.body();
		
        this.btnClear = $('<button class="button button-default">Clear</button>').appendTo(buttons);
		this.btnClear.click(() => this.sketcher.clearMolecule());

		buttons.append(' ');
        this.btnCopy = $('<button class="button button-default">Copy</button>').appendTo(buttons);
		this.btnCopy.click(() => this.copyMolecule());

		buttons.append(' ');
		buttons.append(this.btnClose); // easy way to reorder
		
		buttons.append(' ');
        this.btnSave = $('<button class="button button-primary">Save</button>').appendTo(buttons);
		this.btnSave.click(() => {if (this.callbackSave) this.callbackSave(this);});
		
		let skw = 800, skh = 650;
		let skdiv = $('<div></div>').appendTo(this.body());
		skdiv.css('width', skw + 'px');
		skdiv.css('height', skh + 'px');
		
		this.sketcher = new Sketcher();
		this.sketcher.setSize(skw, skh);
		this.sketcher.defineMolecule(this.mol);
		this.sketcher.setup(() => this.sketcher.render(skdiv));
	}
	
	private pasteMolecule():void
	{
		//this.installFake();
		// (not sure how to make this work: can trap the Ctrl/Cmd-V keystroke and intercept, but grabbing clipboard arbitrarily
		// is a security problem)
	}
	
	private copyMolecule():void
	{
		// !! TODO: just call sketcher's performCopy...

		this.installFake();
		this.fakeTextArea.value = this.sketcher.getMolecule().toString();
		this.fakeTextArea.select();
		document.execCommand('copy');
	}
	
	private installFake():void
	{
		if (this.fakeTextArea != null) return;
		
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
	}
}