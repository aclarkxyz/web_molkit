/*
    WebMolKit

    (c) 2010-2017 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='RPC.ts'/>

/*
	Provides prefabricated RPC functions for the 'Account' category.
*/

class Account
{
    public static connectTransient(callback:(result:any, error:ErrorRPC) => void):void
    {
        new RPC('account.connectTransient', {}, callback).invoke();
    }
    public static refreshTransient(input:Object, callback:(result:any, error:ErrorRPC) => void):void
    {
	    new RPC('account.refreshTransient', input, callback).invoke();
    }
}

