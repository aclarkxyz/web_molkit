/*
    MolSync

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=molsync]
*/

/*
	Wraps the RenderPolicy and RenderEffects objects, which are JSON-encoded analogs to the eponymous Java classes.

	RenderPolicy properties:

		.data
			.name: policy name (optional)
			.pointScale: default Angstrom-to-pixel conversion
			.resolutionDPI: an indication of how far to scaleup bitmaps
			.fontSize: ascent height of font (Angtroms)
			.lineSize: width of bond lines (Angstroms)
			.bondSep: distance between lines of multiple bonds (Angstroms)
			.defaultPadding: minimum size around atoms (Angstroms)
			.foreground: standard foreground colour (0xRRGGBB)
			.background: expected background colour (0xRRGGBB)
			.atomCols: array of colours for elements, where 0 is for those not on the periodic table
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
	public static defaultBlackOnWhite = function()
	{
		var policy = new RenderPolicy();
		/* (actually this is what the null constructor does)
		policy.data.foreground=0x000000;
		policy.data.background=0xFFFFFF;
		for (var n=0;n<=111;n++) policy.data.atomCols[n]=0x000000;*/
		return policy;
	};
	public static defaultWhiteOnBlack = function()
	{
		var policy = new RenderPolicy();
		policy.data.foreground = 0xFFFFFF;
		policy.data.background = 0x000000;
		for (var n = 0; n <= 111; n++) policy.data.atomCols[n] = 0xFFFFFF;
		return policy;
	};
	public static defaultColourOnWhite = function()
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
	public static defaultColourOnBlack = function()
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
	public static defaultPrintedPublication = function()
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
}