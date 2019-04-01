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
	Provides prefabricated RPC functions for the 'Pile' category.
*/

export class Pile
{
	public static uploadMolecule(input:any, callback:(result:any, error:ErrorRPC) => void):void
	{
		new RPC('pile.uploadMolecule', input, callback).invoke();
	}
	public static uploadDataSheet(input:any, callback:(result:any, error:ErrorRPC) => void):void
	{
		new RPC('pile.uploadDataSheet', input, callback).invoke();
	}
	public static downloadMolecule(input:any, callback:(result:any, error:ErrorRPC) => void):void
	{
		new RPC('pile.downloadMolecule', input, callback).invoke();
	}
	public static downloadDataSheet(input:any, callback:(result:any, error:ErrorRPC) => void):void
	{
		new RPC('pile.downloadDataSheet', input, callback).invoke();
	}
	public static fetchSelection(input:any, callback:(result:any, error:ErrorRPC) => void):void
	{
		new RPC('pile.fetchSelection', input, callback).invoke();
	}
	public static fetchMolecules(input:any, callback:(result:any, error:ErrorRPC) => void):void
	{
		new RPC('pile.fetchMolecules', input, callback).invoke();
	}
}

/* EOF */ }