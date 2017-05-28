/*
    WebMolKit

    (c) 2010-2017 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

/*
	Wraps the RenderPolicy and RenderEffects objects, which are JSON-encoded analogs to the eponymous Java classes.
*/

interface RenderData
{
	name:string;
	pointScale:number;
	resolutionDPI:number;
	fontSize:number;
	lineSize:number;
	bondSep:number,
	defaultPadding:number;
	foreground:number;
	background:number;
	atomCols:number[];
}

class RenderPolicy
{
	public data:RenderData;
	
	// constructor: either provide an existing JSON representation of a RenderPolicy,
	constructor(data?:RenderData)
	{
		if (!data)
		{
			data =
			{
				'name': 'default',
				'pointScale': 20,
				'resolutionDPI': 100,
				'fontSize': 0.65,
				'lineSize': 0.075,
				'bondSep': 0.2,
				'defaultPadding': 0.2,
				'foreground': 0x000000,
				'background': 0xFFFFFF,
				'atomCols': new Array(112)
			}
			for (var n = 0; n <= 111; n++) data.atomCols[n] = 0x000000;
			this.data=data;
		}
		else
		{
			this.data = <RenderData>clone(data);
		}
	};

	// static methods for creating new default schemes
	public static defaultBlackOnWhite():RenderPolicy
	{
		var policy = new RenderPolicy();
		/* (actually this is what the null constructor does)
		policy.data.foreground=0x000000;
		policy.data.background=0xFFFFFF;
		for (var n=0;n<=111;n++) policy.data.atomCols[n]=0x000000;*/
		return policy;
	};
	public static defaultWhiteOnBlack():RenderPolicy
	{
		var policy = new RenderPolicy();
		policy.data.foreground = 0xFFFFFF;
		policy.data.background = 0x000000;
		for (var n = 0; n <= 111; n++) policy.data.atomCols[n] = 0xFFFFFF;
		return policy;
	};
	public static defaultColourOnWhite():RenderPolicy
	{
		var policy = RenderPolicy.defaultBlackOnWhite();
		policy.data.atomCols[0] = 0x404040;
		policy.data.atomCols[1] = 0x808080;
		policy.data.atomCols[6] = 0x000000;
		policy.data.atomCols[7] = 0x0000FF;
		policy.data.atomCols[8] = 0xFF0000;
		policy.data.atomCols[9] = 0xFF8080;
		policy.data.atomCols[15] = 0xFF8000;
		policy.data.atomCols[16] = 0x808000;
		policy.data.atomCols[17] = 0x00C000;
		policy.data.atomCols[35] = 0xC04000;
		return policy;
	};
	public static defaultColourOnBlack():RenderPolicy
	{
		var policy = RenderPolicy.defaultWhiteOnBlack();
		policy.data.atomCols[0] = 0xA0A0A0;
		policy.data.atomCols[1] = 0x808080;
		policy.data.atomCols[6] = 0xFFFFFF;
		policy.data.atomCols[7] = 0x4040FF;
		policy.data.atomCols[8] = 0xFF4040;
		policy.data.atomCols[9] = 0xFF8080;
		policy.data.atomCols[15] = 0xFF8000;
		policy.data.atomCols[16] = 0xFFFF00;
		policy.data.atomCols[17] = 0x40FF40;
		policy.data.atomCols[35] = 0xFF8040;
		return policy;
	};
	public static defaultPrintedPublication():RenderPolicy
	{
		var policy = RenderPolicy.defaultBlackOnWhite();
		policy.data.pointScale = 9.6;
		policy.data.resolutionDPI = 600;
		policy.data.fontSize = 0.80;
		policy.data.bondSep = 0.27;
		policy.data.lineSize = 0.0625;
		return policy;
	};
}

class RenderEffects
{
	// optional replacement colours, by object index: to override defaults
	public colAtom:{[id:number] : number} = {};
	public colBond:{[id:number] : number} = {};
	
	// atoms that should be surrounded by a dotted rectangular outline (atom = colour)
	public dottedRectOutline:{[id:number] : number} = {};
	
	// bonds that should have a dotted line plotted across them (bond = colour)
	public dottedBondCross:{[id:number] : number} = {};
	
	// list of atom/bond indices to NOT draw
	public hideAtoms = new Set<number>();
	public hideBonds = new Set<number>(); 
	
	// rectangular frames to draw around atoms
	public atomFrameDotSz:number[] = [];
	public atomFrameCol:number[] = [];
	
	// solid dots to draw over top of atoms
	public atomCircleSz:number[] = [];
	public atomCircleCol:number[] = []
	
	// atom & bond decoration: text to display, colour, and font size (in Angstrom units)
	public atomDecoText:string[] = []; 
	public atomDecoCol:number[] = [];
	public atomDecoSize:number[] = [];
	public bondDecoText:string[] = [];
	public bondDecoCol:number[] = []; 
	public bondDecoSize:number[] = [];
	
	// list of atom indices which are considered to be "overlapping", i.e. this is bad
	public overlapAtoms:number[] = []; 
}