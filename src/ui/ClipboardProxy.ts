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

// default clipboard behaviour: override these methods to intercept incoming copy/cut/paste requests; this default implementation
// hands over the reins to the system, which is normal behaviour
export class ClipboardProxyHandler
{
	// note: return values = true if the event got consumed by privately implemented functionality; false = fall back to the default
	public copyEvent(andCut:boolean, proxy:ClipboardProxy):boolean {return false;}
	public pasteEvent(proxy:ClipboardProxy):boolean {return false;}
}

export class ClipboardProxy
{
	protected handlers = [new ClipboardProxyHandler()]; // baseline fallback is the default pass-through implementation

	// ------------ public methods ------------

	// use these two functions whenever a new focus-stealing object pops up on top of everything else, e.g. dialogs or dialog-like specialised
	// editing tools with complex clipboard behaviour
	public pushHandler(handler:ClipboardProxyHandler) 
	{
		this.handlers.push(handler);
	}
	public popHandler()
	{
		this.handlers.pop();
	}
	public currentHandler():ClipboardProxyHandler
	{
		return this.handlers[this.handlers.length - 1];
	}

	// call these methods when an external event (e.g. menu/button) triggers a cut/copy/paste event
	public triggerCopy(andCut:boolean):void
	{
		if (this.currentHandler().copyEvent(andCut, this)) return;
		document.execCommand(andCut ? 'cut' : 'copy');
	}
	public triggerPaste():void
	{
		if (this.currentHandler().pasteEvent(this)) return;
		document.execCommand('paste');
	}

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
	Clipboard handler that should be used when the browser is the runtime target, which presents a much more restricted clipboard
	use pattern (for security reasons). The action-trapping actions are installed once for the whole documented, and from that point
	they can either be trapped or allowed to fall back to the default action.
*/

export class ClipboardProxyWeb extends ClipboardProxy
{
	private lastContent:string = null;
	private fakeTextArea:HTMLTextAreaElement = null; // for temporarily bogarting the clipboard
	private busy = false; // need to block trapping during the copy workaround

	// ------------ public methods ------------

	constructor()
	{
		super();

		document.addEventListener('copy', (event:ClipboardEvent) =>
		{
			if (this.busy) return;
			if (this.currentHandler().copyEvent(false, this)) 
			{
				event.preventDefault();
				return false;
			}
		});
		document.addEventListener('cut', (event:ClipboardEvent) =>
		{
			if (this.busy) return;
			if (this.currentHandler().copyEvent(true, this)) 
			{
				event.preventDefault();
				return false;
			}
		});
		document.addEventListener('paste', (event:ClipboardEvent) =>
		{
			// this is the only time when the clipboard is allowed to be interrogated, so stash the content so the handler can access it
			let wnd = window as any;
			this.lastContent = null;
			if (wnd.clipboardData && wnd.clipboardData.getData) this.lastContent = wnd.clipboardData.getData('Text');
			else if (event.clipboardData && event.clipboardData.getData) this.lastContent = event.clipboardData.getData('text/plain');

			let consumed = this.currentHandler().pasteEvent(this);

			this.lastContent = null;

			if (consumed)
			{
				event.preventDefault();
				return false;
			}

			return true;
		});
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

		// disable event trapping, then issue the standard copy
		this.busy = true;
		document.execCommand('copy');
		this.busy = false;
	}
}

/* EOF */ }