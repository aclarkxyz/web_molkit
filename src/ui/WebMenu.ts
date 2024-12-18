/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

/*
	WebMenu: constructs a menu bar that's useful for embedding inside web pages. The control datastructure is
	analogous to that used by Electron, so this can be used as an explicit substitution.
*/

/*
const CSS_WEBMENU = `
	*.wmk-webmenubar
	{
		font-family: 'Open Sans', sans-serif;
		background-color: black;
		color: white;
		width: 100%;
	}
	*.wmk-webmenudrop
	{
		font-family: 'Open Sans', sans-serif;
		background-color: rgba(0,0,0,0.7);
		color: white;
	}
	*.wmk-webmenuitem
	{
		font-family: 'Open Sans', sans-serif;
		color: white;
		padding: 0 0.5em 0 0.5em;
	}
	*.wmk-webmenuitem:hover
	{
		background-color: #0000FF;
		cursor: pointer;
	}
`;

export interface WebMenuItem
{
	label:string;
	type?:string;
	click?:() => void;
	submenu?:WebMenuItem[];
}

export class WebMenu extends Widget
{
	private topItems:JQuery[] = [];
	private obscureBackground:JQuery;

	// ------------ public methods ------------

	constructor(private barItems:WebMenuItem[])
	{
		super();

		if (!hasInlineCSS('webmenu')) installInlineCSS('webmenu', CSS_WEBMENU);
	}

	public render(parent:any)
	{
		super.render(parent);

		this.content.addClass('wmk-webmenubar');

		for (let item of this.barItems)
		{
			let span = dom('<span/>').appendTo(this.content);
			span.addClass('wmk-webmenuitem');
			span.setText(item.label ? item.label : '?');
			span.onClick((event) => {this.activateMenu(dom, item); event.preventDefault();});
			span.onDblClick((event) => event.preventDefault());
		}
	}

	// ------------ private methods ------------

	private activateMenu(parent:DOM, item:WebMenuItem)
	{
		if (item.click)
		{
			item.click();
			return;
		}
		if (Vec.len(item.submenu) == 0)
		{
			// neither action nor submenu: technically a bug, but silently ignore
			return;
		}

		let wx1 = parent.offset().x, wy1 = parent.offset().y;
		let wx2 = wx1 + parent.width(), wy2 = wy1 + parent.height();
		let menuX = 0, menuY = 0;
		if (this.obscureBackground)
		{
			menuX = wx2;
			menuY = wy1;
		}
		else
		{
			menuX = wx1;
			menuY = wy2;

			let bg = this.obscureBackground = dom('<span/>').appendTo(document.documentElement);
			bg.setCSS('width', '100%');
			bg.setCSS('height', document.documentElement.clientHeight + 'px');
			bg.setCSS('position', 'absolute');
			bg.setCSS('left', 0);
			bg.setCSS('top', 0);

			bg.css('z-index', 9999);
			bg.onClick(() => this.deactivateMenu());
			bg.show();
			this.obscureBackground = bg;
		}

		let container = $('<div></div>');
		container.addClass('wmk-webmenudrop');
		container.css('position', 'absolute');
		container.css('left', `${menuX}px`);
		container.css('top', `${menuY}px`);

		for (let subitem of item.submenu)
		{
			let dom = $('<div></div>').appendTo(container);
			dom.addClass('wmk-webmenuitem');
			dom.text(subitem.label ? subitem.label : '?');
			dom.click((event:JQueryEventObject) => {this.activateMenu(dom, subitem); event.preventDefault();});
			dom.dblclick((event:JQueryEventObject) => event.preventDefault());
		}

		this.obscureBackground.append(container);
	}

	private deactivateMenu():void
	{
		this.obscureBackground.remove();
		this.obscureBackground = null;
	}
}
*/

