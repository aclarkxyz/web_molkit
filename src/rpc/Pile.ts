/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='RPC.ts'/>

/*
	Provides prefabricated RPC functions for the 'Pile' category.
*/

class Pile
{
	public static uploadMolecule(input:Object, callback:(result:any, error:ErrorRPC) => void, master?:Object):void
	{
		new RPC('pile.uploadMolecule', input, callback, master).invoke();
	}
	public static uploadDataSheet(input:Object, callback:(result:any, error:ErrorRPC) => void, master?:Object):void
	{
		new RPC('pile.uploadDataSheet', input, callback, master).invoke();
	}
	public static downloadMolecule(input:Object, callback:(result:any, error:ErrorRPC) => void, master?:Object):void
	{
		new RPC('pile.downloadMolecule', input, callback, master).invoke();
	}
	public static downloadDataSheet(input:Object, callback:(result:any, error:ErrorRPC) => void, master?:Object):void
	{
		new RPC('pile.downloadDataSheet', input, callback, master).invoke();
	}
	public static fetchSelection(input:Object, callback:(result:any, error:ErrorRPC) => void, master?:Object):void
	{
		new RPC('pile.fetchSelection', input, callback, master).invoke();
	}
	public static fetchMolecules(input:Object, callback:(result:any, error:ErrorRPC) => void, master?:Object):void
	{
		new RPC('pile.fetchMolecules', input, callback, master).invoke();
	}
}