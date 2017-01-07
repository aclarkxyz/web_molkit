/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../util/util.ts'/>
///<reference path='../data/DataSheet.ts'/>
///<reference path='../gfx/MetaVector.ts'/>
///<reference path='../gfx/Rendering.ts'/>

/*
	Abstract base class for all "Aspects".

	An aspect is a piece of functionality that sits on top of an existing datasheet and provides an extra layer of
	interpretation. The scalar datatypes used by datasheets are very basic, and can be used or abused with relatively
	little implied structure.

	Aspects can be created explicitly in code, and they will be handed a datasheet instance to operate on. They are
	expected to install whatever metadata they need, within the constructor (e.g. extensions, and additional fields).

	If the aspect installs an extension which is given the type "org.mmi.aspect.{something}", then it is possible for the
	aspect to be installed automatically at key points (by the AspectList class), as long as the class named
	"com.mmi.core.aspect.{something"} or "com.mmi.aspect.{something}" can be found (note the switch from 'org' to 'com').

	An aspect must always be pessimistic about the integrity of its data. DataSheets can be modified by non-aspect-aware
	editors. On creation it must be prepared to create its metadata/necessary fields from scratch, or to repair _any_ kind of
	corruption performed by an external process. Implementation of certain methods in the Aspect class can help to
	prevent these conflicts, but they should not be relied on.
*/

interface AspectTextRendering
{
	name:string;
	descr:string;
	text:string;
	type:number; // one of Aspect.TEXT_* 
}
interface AspectGraphicRendering
{
	name:string;
	metavec:MetaVector;
}

abstract class Aspect
{
	public ds:DataSheet;
	protected allowModify = true; // if set to false, aspect is not allowed to modify any part of the header

	// usually provide an existing datasheet with the aspect already installed; if not, it will be added (as long as
	// modification is allowed); if no datasheet, creates a blank one
	constructor(ds?:DataSheet, allowModify?:boolean)
	{
		this.ds = ds ? ds : new DataSheet();
		if (allowModify != null) this.allowModify = allowModify; 
	}

	// must return a simple, short string describing the aspect
	public abstract plainHeading():string;
	
	// if the aspect wants to "claim" any column names (whether they exist or not) for its own purposes - nominally both
	// rendering and editing - it should override this method and return true; various implementations may or may not choose
	// to honour this
	public isColumnReserved(colName:string):boolean {return false;}

	// a bulk version of above: override this only if is overhead per determination
	public areColumnsReserved(colNames:string[]):boolean[]
	{
		let reserved = Vec.booleanArray(false, colNames.length);
		for (let n = 0; n < colNames.length; n++) reserved[n] = this.isColumnReserved(colNames[n]);
		return reserved;
	}	
	
	// some aspects reserve multiple rows as a "block" (e.g. multistep reaction experiments); the following two methods must
	// be overidden to achieve this: a row must be able to indicate whether it is the beginning of a block; and the block size
	// must be countable; the default implementation implies each row is a singleton; note that both of these methods are
	// required, because the implied results may be inconsistent with inconsistent datasheets (e.g. streams)
	public rowFirstBlock(row:number):boolean {return true;}
	public rowBlockCount(row:number):number {return 1;}
	
	// given another aspect (presumed to be the same type), make sure the parameters of the current aspect are such that it can
	// accommodate data from the new one; various header settings and columns must be modified as necessary
	public aspectUnion(other:Aspect):void {}
	
	// rendering:
	//		an aspect may optionally volunteer to provide some static visualisation data to describe itself; this balances
	//		out against the aspect's ability to reserve columns, which typically means that they will not be displayed; the
	//		number and types of renderings can vary from row to row

	// text rendering: this is analogous to a pseudocolumn, and so name & description may optionally be manufactured as well
	// as text content
	public static TEXT_PLAIN = 0;
	public static TEXT_LINK = 1;
	public static TEXT_HTML = 2;

	public numTextRenderings(row:number):number {return 0;}
	public produceTextRendering(row:number, idx:number):AspectTextRendering {return null;}
	
	// graphical rendering: the caller must provide a vector graphics context, into which will be drawn a visual representation 
	// of the rendering; a render policy is provided, and the implementation is expected make use of it (e.g. scale, foreground
	// colour); the returned object provides additional metadata: the vector graphics builder object is typically the
	// same object as provided as the parameter
	public numGraphicRenderings(row:number):number {return 0;}
	public produceGraphicRendering(row:number, idx:number, policy:RenderPolicy):[string, MetaVector] {return [null, null];}
	
	// header rendering: some number of text items that describe the datasheet overall; these are typically {name:value} pairs, which
	// are shown at the beginning of the datasheet, and supplement the universal title & description fields
	public numHeaderRenderings():number {return 0;}
	public produceHeaderRendering(idx:number):AspectTextRendering {return null;}
}

