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
	Proxy functionality for menus, particularly the context menu.
*/

export interface MenuProxyContext
{
	label:string;
	click:() => void;
}

export class MenuProxy
{
	// override this with true when the context menu is available
	public hasContextMenu():boolean {return false;}

	public openContextMenu(menuItems:MenuProxyContext[], event:JQueryMouseEventObject):void {}
}

/* EOF */ }