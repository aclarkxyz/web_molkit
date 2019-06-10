/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='Widget.ts'/>

namespace WebMolKit /* BOF */ {

/*
	ClipboardProxy: abstract base class for two different methods for clipboard access. One is the usual web page method,
	which has serious limitations due to security concerns (i.e. a web page can't just grab the clipboard any time it wants).
	The other is the NodeJS/Electron implementation which has full access any time it wants.

*/

export class ClipboardProxy
{
	// an external menu operation has requested a copy-to-clipboard action; the owner of this object is expected
	// to furnish a string to be transferred onto the clipboard, or null if there isn't anything
	public copyEvent:() => string = null;

	// an external menu operation has activated a paste operation; for the duration of this callback, it is for sure
	// valid to fetch the clipboard content (using getString)
	public pasteEvent:(proxy:ClipboardProxyWeb) => boolean = null;

	// attach the clipboard proxy to a container, and make sure events are trapped; the uninstall should be gracefully
	// automatic, but calling it explicitly on cleanup is ideal
	public install(container:JQuery):void {}
	public uninstall():void {}

	// fetches the content currently on the clipboard; note that for the web implementation, this is disallowed for
	// security reasons, but in desktop mode it is allowed (see canAlwaysGet below)
	public getString():string {return null;}

	// places the clipboard content with the indicated string; this is allowed at any time
	public setString(str:string):void {}

	// places HTML content onto the clipboard, if available
	public canSetHTML():boolean {return false;}
	public setHTML(html:string):void {}

	// returns true if it is possible to fetch from the clipboard anytime (false when running in a web browser)
	public canAlwaysGet():boolean {return false;}

	// instantiate the downloading of a string, with a given default filename
	public downloadString(str:string, fn:string):void {}
}

/*
	Pure-web implementation. This has a defined lifespan, because it has to insert itself into a global handler
	and grab the incoming contents before anyone else can claim it.
*/

export class ClipboardProxyWeb extends ClipboardProxy
{
	private lastContent:string = null;
	private busy = false;
	private copyFunc:any = null;
	private pasteFunc:any = null;
	private fakeTextArea:HTMLTextAreaElement = null; // for temporarily bogarting the clipboard

	// ------------ public methods ------------

	// installs the event intercepts needed to deal with copy/paste; the container is taken as a parameter so that it
	// can be automatically uninstalled once the container is no longer present, though it is preferable for the caller
	// to install/uninstall
	public install(container:JQuery):void
	{
		if (!container) throw 'ClipboardProxy: need a container to install to';

		this.copyFunc = (e:any) =>
		{
			if (this.busy) return;

			let content = this.copyEvent();
			if (content == null) return;

			// if widget no longer visible, detach the copy handler
			if (!$.contains(document.documentElement, container[0]))
			{
				this.uninstall();
				return false;
			}

			document.removeEventListener('copy', this.copyFunc);
			this.performCopy(content);
			document.addEventListener('copy', this.copyFunc);

			e.preventDefault();
			return false;
		};
		document.addEventListener('copy', this.copyFunc);		 

		// pasting: captures the menu/hotkey form
		this.pasteFunc = (e:any) =>
		{
			// if widget no longer visible, detach the paste handler
			if (!$.contains(document.documentElement, container[0]))
			{
				this.uninstall();
				return false;
			}

			let wnd = window as any;
			this.lastContent = null;
			if (wnd.clipboardData && wnd.clipboardData.getData) this.lastContent = wnd.clipboardData.getData('Text');
			else if (e.clipboardData && e.clipboardData.getData) this.lastContent = e.clipboardData.getData('text/plain'); 
			this.pasteEvent(this);
			this.lastContent = null;

			e.preventDefault();
			return false;
		};
		document.addEventListener('paste', this.pasteFunc);		  
	}

	public uninstall():void
	{
		if (this.copyFunc)
		{
			document.removeEventListener('copy', this.copyFunc);
			this.copyFunc = null;
		}
		if (this.pasteFunc)
		{
			document.removeEventListener('paste', this.pasteFunc);
			this.pasteFunc = null;
		}
	}

	public getString():string
	{
		return this.lastContent;
	}
	public setString(str:string):void
	{
		this.performCopy(str);
	}

	// ------------ private methods ------------

	private performCopy(content:string):void
	{
		// now place it on the actual system clipboard
		if (this.fakeTextArea == null)
		{
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
		this.fakeTextArea.value = content;
		this.fakeTextArea.select();

		this.busy = true;
		document.execCommand('copy');
		this.busy = false;
	}
}

/* EOF */ }