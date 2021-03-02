/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	Proxy functionality for menus, particularly the context menu.
*/

export interface MenuProxyContext
{
	label:string;
	click?:() => void;
	subMenu?:MenuProxyContext[];
}

export class MenuProxy
{
	// override this with true when the context menu is available
	public hasContextMenu():boolean {return false;}
	public openContextMenu(menuItems:MenuProxyContext[], event:JQueryMouseEventObject | MouseEvent):void {}
}

/*
	Context menu handler that is compatible with a vanilla web page. It is similar but not identical to the system context
	menu, which is the preferred option for Electron-based apps.
*/

export class MenuProxyWeb extends MenuProxy
{
	public hasContextMenu():boolean {return true;}
	public openContextMenu(menuItems:MenuProxyContext[], event:JQueryMouseEventObject):void
	{
		let [x, y] = eventCoords(event, document.body);
		//let x = event.screenX, y = event.screenY;
		let divCursor = $('<div/>').appendTo(document.body).css({'position': 'absolute', 'user-select': 'none'});
		setBoundaryPixels(divCursor, x - 5, y - 5, 10, 10);
		let currentFocus = $(document.activeElement);
		let popup = new Popup(divCursor);
 		popup.callbackPopulate = () =>
		{
			popup.body().css({'user-select': 'none', 'font-size': '16px'});
			for (let menuItem of menuItems)
			{
				let div = $('<div/>').appendTo(popup.body());
				if (menuItem == null)
				{
					div.append('<hr/>');
				}
				else
				{
					div.text(menuItem.label);
					div.hover(() => div.css({'background-color': '#D0D0D0'}), () => div.css({'background-color': 'transparent'}));
					div.css({'cursor': 'pointer'});
					div.click(() =>
					{
						popup.close();
						menuItem.click();
					});
				}
			}
		};
		popup.callbackClose = () =>
		{
			divCursor.remove();
			currentFocus.focus();
		};
		popup.open();
	}
}

/* EOF */ }