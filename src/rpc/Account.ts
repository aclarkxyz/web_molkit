/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='RPC.ts'/>

namespace WebMolKit /* BOF */ {

/*
	Provides prefabricated RPC functions for the 'Account' category.
*/

export class Account
{
	public static connectTransient(callback:(result:any, error:ErrorRPC) => void):void
	{
		new RPC('account.connectTransient', {}, callback).invoke();
	}
	public static refreshTransient(input:any, callback:(result:any, error:ErrorRPC) => void):void
	{
		new RPC('account.refreshTransient', input, callback).invoke();
	}
}

/* EOF */ }