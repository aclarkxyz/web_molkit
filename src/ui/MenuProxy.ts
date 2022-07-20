/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {dom} from '../util/dom';
import {eventCoords, setBoundaryPixels} from '../util/util';
import {Popup} from './Popup';

/*
	Proxy functionality for menus, particularly the context menu.
*/

export interface MenuProxyContext
{
	label:string;
	click?:() => void;
	subMenu?:MenuProxyContext[];
	accelerator?:string;
}

export class MenuProxy
{
	// override this with true when the context menu is available
	public hasContextMenu():boolean {return false;}
	public openContextMenu(menuItems:MenuProxyContext[], event:MouseEvent):void {}
}

/*
	Context menu handler that is compatible with a vanilla web page. It is similar but not identical to the system context
	menu, which is the preferred option for Electron-based apps.
*/

export class MenuProxyWeb extends MenuProxy
{
	public hasContextMenu():boolean {return true;}
	public openContextMenu(menuItems:MenuProxyContext[], event:MouseEvent):void
	{
		let [x, y] = eventCoords(event, document.body);
		//let x = event.screenX, y = event.screenY;
		let divCursor = dom('<div/>').appendTo(document.body).css({'position': 'absolute', 'user-select': 'none'});
		setBoundaryPixels(divCursor, x - 5, y - 5, 10, 10);
		let currentFocus = dom(document.activeElement);
		let popup = new Popup(divCursor);
 		popup.callbackPopulate = () =>
		{
			popup.bodyDOM().css({'user-select': 'none', 'font-size': '16px'});
			for (let menuItem of menuItems)
			{
				let div = dom('<div/>').appendTo(popup.bodyDOM());
				if (menuItem == null)
				{
					div.appendHTML('<hr/>');
				}
				else if (menuItem.subMenu)
				{
					div.setText(menuItem.label + ' \u{25B8}');
					div.css({'cursor': 'pointer'});
					let fcn = (event:MouseEvent) =>
					{
						event.preventDefault();
						popup.close();
						this.openContextMenu(menuItem.subMenu, event);
					};
					div.onClick(fcn);
					div.onContextMenu(fcn);
				}
				else if (menuItem.click)
				{
					div.setText(menuItem.label);
					div.onMouseEnter(() => {div.css({'background-color': '#D0D0D0'});});
					div.onMouseLeave(() => {div.css({'background-color': 'transparent'});});
					div.css({'cursor': 'pointer'});
					div.onClick(() =>
					{
						popup.close();
						menuItem.click();
					});
				}
				else
				{
					div.css({'color': '#808080'});
					div.setText(menuItem.label);
				}
			}
		};
		popup.callbackClose = () =>
		{
			divCursor.remove();
			currentFocus.grabFocus();
		};
		popup.open();
	}
}
