/*
    MolSync

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=molsync]
*/

///<reference path='RPC.ts'/>

/*
	Provides prefabricated RPC functions for the 'Func' category.
*/

class Func
{
	public static renderStructure(input:Object, callback:(result:any, error:ErrorRPC) => void, master?:Object):void
	{
		new RPC('func.renderStructure', input, callback, master).invoke();
	}
	public static arrangeMolecule(input:Object, callback:(result:any, error:ErrorRPC) => void, master?:Object):void
	{
		new RPC('func.arrangeMolecule', input, callback, master).invoke();
	}
	public static renderRowDetail(input:Object, callback:(result:any, error:ErrorRPC) => void, master?:Object):void
	{
		new RPC('func.renderRowDetail', input, callback, master).invoke();
	}
	public static renderYieldDetail(input:Object, callback:(result:any, error:ErrorRPC) => void, master?:Object):void
	{
		new RPC('func.renderYieldDetail', input, callback, master).invoke();
	}
	public static composeDocument(input:Object, callback:(result:any, error:ErrorRPC) => void, master?:Object):void
	{
		new RPC('func.composeDocument', input, callback, master).invoke();
	}
	public static getMoleculeProperties(input:Object, callback:(result:any, error:ErrorRPC) => void, master?:Object):void
	{
		new RPC('func.getMoleculeProperties', input, callback, master).invoke();
	}
	public static atomMapping(input:Object, callback:(result:any, error:ErrorRPC) => void, master?:Object):void
	{
		new RPC('func.atomMapping', input, callback, master).invoke();
	}
	public static prepareDownloadable(input:Object, callback:(result:any, error:ErrorRPC) => void, master?:Object):void
	{
		new RPC('func.prepareDownloadable', input, callback, master).invoke();
	}
	public static downloadFromSource(input:Object, callback:(result:any, error:ErrorRPC) => void, master?:Object):void
	{
		new RPC('func.downloadFromSource', input, callback, master).invoke();
	}
	public static getDefaultTemplateGroups(input:Object, callback:(result:any, error:ErrorRPC) => void, master?:Object):void
	{
		new RPC('func.getDefaultTemplateGroups', input, callback, master).invoke();
	}
	public static getDefaultTemplateStructs(input:Object, callback:(result:any, error:ErrorRPC) => void, master?:Object):void
	{
		new RPC('func.getDefaultTemplateStructs', input, callback, master).invoke();
	}
	public static getActionIcons(input:Object, callback:(result:any, error:ErrorRPC) => void, master?:Object):void
	{
		new RPC('func.getActionIcons', input, callback, master).invoke();
	}
}