/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

/*
	The AspectList class is used as a way to fetch all of the recognised aspects that are installed within a given datasheet, without
	having to manually invoke each of the classes individually. Each aspect that is implemented within the toolkit needs to be added
	explicitly here, if it is going to get automatically considered during routine operations (e.g. rendering arbitrary datasheets).
*/

interface SupportedAspect
{
	code:string;
	name:string;
	classdef:any;
}
let supportedAspects:Record<string, SupportedAspect> = {}; // code-to-definition

//	each aspect has to call this method globally as early as possible in order to be recognised; e.g.
//		class CustomAspect extends Aspect {...}
//		registerAspect(CustomAspect);
export function registerAspect(classdef:any):void
{
	let code = classdef.CODE as string, name = classdef.NAME as string;
	supportedAspects[code] = {code, name, classdef};
}

export class AspectList
{
	constructor(public ds:DataSheet)
	{
	}

	// returns two arrays: the first is a list of aspect codes that exist within the datasheet's header already; the second is a list of
	// codes from the recognised list that are not; note that any aspects that are not in either of these lists are missing because they're
	// not encoded within this class, which means that they're probably not supported at all by this toolkit
	public list():[string[], string[]]
	{
		let present:string[] = [], absent:string[] = [];

		let codes = new Set<string>();
		for (let n = 0; n < this.ds.numExtensions; n++) codes.add(this.ds.getExtType(n));

		for (let code in supportedAspects) if (codes.has(code)) present.push(code); else absent.push(code);

		return [present, absent];
	}

	// instantiates an aspect by creating the class instance that matches the given code; if the code is not in the supported list,
	// returns null; note that calling this function takes action that can modify the datasheet: it will be inducted if it does not
	// already exist; if it does exist, it is given the chance to make corrective changes to the content
	public instantiate(code:string):Aspect
	{
		let supp = supportedAspects[code];
		if (supp) return new supp.classdef(this.ds) as Aspect;
		return null;
	}

	// goes through the header and instantiates every applicable aspect that is inducted (equivalent to using list & instantiate each)
	public enumerate():Aspect[]
	{
		let aspects:Aspect[] = [];
		for (let n = 0; n < this.ds.numExtensions; n++)
		{
			let code = this.ds.getExtType(n);
			if (supportedAspects[code]) aspects.push(this.instantiate(code));
		}
		return aspects;
	}

	// fetches just the name of an aspect, without instantiating it
	public aspectName(code:string):string
	{
		let supp = supportedAspects[code];
		return supp ? supp.name : null;
	}
}

