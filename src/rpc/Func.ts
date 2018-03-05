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
	Provides prefabricated RPC functions for the 'Func' category.
*/

export class Func
{
	public static renderStructure(input:Object, callback:(result:any, error:ErrorRPC) => void):void
	{
		new RPC('func.renderStructure', input, callback).invoke();
	}
	public static arrangeMolecule(input:Object, callback:(result:any, error:ErrorRPC) => void):void
	{
		new RPC('func.arrangeMolecule', input, callback).invoke();
	}
	public static renderRowDetail(input:Object, callback:(result:any, error:ErrorRPC) => void):void
	{
		new RPC('func.renderRowDetail', input, callback).invoke();
	}
	public static renderYieldDetail(input:Object, callback:(result:any, error:ErrorRPC) => void):void
	{
		new RPC('func.renderYieldDetail', input, callback).invoke();
	}
	public static composeDocument(input:Object, callback:(result:any, error:ErrorRPC) => void):void
	{
		new RPC('func.composeDocument', input, callback).invoke();
	}
	public static getMoleculeProperties(input:Object, callback:(result:any, error:ErrorRPC) => void):void
	{
		new RPC('func.getMoleculeProperties', input, callback).invoke();
	}
	public static atomMapping(input:Object, callback:(result:any, error:ErrorRPC) => void):void
	{
		new RPC('func.atomMapping', input, callback).invoke();
	}
	public static prepareDownloadable(input:Object, callback:(result:any, error:ErrorRPC) => void):void
	{
		new RPC('func.prepareDownloadable', input, callback).invoke();
	}
	public static downloadFromSource(input:Object, callback:(result:any, error:ErrorRPC) => void):void
	{
		new RPC('func.downloadFromSource', input, callback).invoke();
	}
	public static getDefaultTemplateGroups(input:Object, callback:(result:any, error:ErrorRPC) => void):void
	{
		new RPC('func.getDefaultTemplateGroups', input, callback).invoke();
	}
	public static getDefaultTemplateStructs(input:Object, callback:(result:any, error:ErrorRPC) => void):void
	{
		new RPC('func.getDefaultTemplateStructs', input, callback).invoke();
	}
	public static getActionIcons(input:Object, callback:(result:any, error:ErrorRPC) => void):void
	{
		new RPC('func.getActionIcons', input, callback).invoke();
	}
}

/* EOF */ }