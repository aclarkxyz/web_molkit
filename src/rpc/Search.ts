/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='RPC.ts'/>

/*
	Provides prefabricated RPC functions for the 'Search' category.
*/

class Search
{
	public static startMolSearch(input:Object, callback:(result:any, error:ErrorRPC) => void, master?:Object):void
	{
		new RPC('search.startMolSearch', input, callback, master).invoke();
	}
	public static pollMolSearch(input:Object, callback:(result:any, error:ErrorRPC) => void, master?:Object)
	{
		new RPC('search.pollMolSearch', input, callback, master).invoke();
	}
	public static startRxnSearch(input:Object, callback:(result:any, error:ErrorRPC) => void, master?:Object):void
	{
		new RPC('search.startRxnSearch', input, callback, master).invoke();
	}
	public static pollRxnSearch(input:Object, callback:(result:any, error:ErrorRPC) => void, master?:Object)
	{
		new RPC('search.pollRxnSearch', input, callback, master).invoke();
	}
}