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
	Provides prefabricated RPC functions for the 'Search' category.
*/

export class Search
{
	public static startMolSearch(input:any, callback:(result:any, error:ErrorRPC) => void):void
	{
		new RPC('search.startMolSearch', input, callback).invoke();
	}
	public static pollMolSearch(input:any, callback:(result:any, error:ErrorRPC) => void)
	{
		new RPC('search.pollMolSearch', input, callback).invoke();
	}
	public static startRxnSearch(input:any, callback:(result:any, error:ErrorRPC) => void):void
	{
		new RPC('search.startRxnSearch', input, callback).invoke();
	}
	public static pollRxnSearch(input:any, callback:(result:any, error:ErrorRPC) => void)
	{
		new RPC('search.pollRxnSearch', input, callback).invoke();
	}
}

/* EOF */ }