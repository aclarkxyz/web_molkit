/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {clone} from '../util/util';

/*
	RenderPolicy: controls the parameters of rendering for molecules (and some composites like reactions). These policies are
	general, i.e. can apply to any instantiated molecule instance.
*/

interface RenderData
{
	name:string;
	pointScale:number;
	resolutionDPI:number;
	fontSize:number;
	lineSize:number;
	bondSep:number;
	defaultPadding:number;
	foreground:number;
	background:number;
	atomCols:number[];
}

export class RenderPolicy
{
	public data:RenderData;

	constructor(data?:RenderData)
	{
		if (!data)
		{
			data =
			{
				name: 'default',
				pointScale: 20,
				resolutionDPI: 100,
				fontSize: 0.65,
				lineSize: 0.075,
				bondSep: 0.2,
				defaultPadding: 0.2,
				foreground: 0x000000,
				background: 0xFFFFFF,
				atomCols: new Array(112)
			};
			for (let n = 0; n <= 111; n++) data.atomCols[n] = 0x000000;
			this.data = data;
		}
		else
		{
			this.data = clone(data) as RenderData;
		}
	}

	public clone():RenderPolicy {return new RenderPolicy(this.data);}

	// static methods for creating new default schemes
	public static defaultBlackOnWhite(pixPerAng?:number):RenderPolicy
	{
		let policy = new RenderPolicy();
		if (pixPerAng) policy.data.pointScale = pixPerAng;
		return policy;
	}
	public static defaultWhiteOnBlack(pixPerAng?:number):RenderPolicy
	{
		let policy = new RenderPolicy();
		if (pixPerAng) policy.data.pointScale = pixPerAng;
		policy.data.foreground = 0xFFFFFF;
		policy.data.background = 0x000000;
		for (let n = 0; n <= 111; n++) policy.data.atomCols[n] = 0xFFFFFF;
		return policy;
	}
	public static defaultColourOnWhite(pixPerAng?:number):RenderPolicy
	{
		let policy = RenderPolicy.defaultBlackOnWhite(pixPerAng);
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
	}
	public static defaultColourOnBlack(pixPerAng?:number):RenderPolicy
	{
		let policy = RenderPolicy.defaultWhiteOnBlack(pixPerAng);
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
	}
	public static defaultPrintedPublication():RenderPolicy
	{
		let policy = RenderPolicy.defaultBlackOnWhite(9.6);
		policy.data.resolutionDPI = 600;
		policy.data.fontSize = 0.80;
		policy.data.bondSep = 0.27;
		policy.data.lineSize = 0.0625;
		return policy;
	}
}

/*
	RenderEffects: provides the ability to request additional drawing effects for a specific molecule instance, in
	addition to the basic rendering.
*/

export class RenderEffects
{
	// optional replacement colours, by object index: to override defaults
	public colAtom:Record<number, number> = {};
	public colBond:Record<number, number> = {};

	// atoms that should be surrounded by a dotted rectangular outline (atom = colour)
	public dottedRectOutline:Record<number, number> = {};

	// bonds that should have a dotted line plotted across them (bond = colour)
	public dottedBondCross:Record<number, number> = {};

	// list of atom/bond indices to NOT draw
	public hideAtoms = new Set<number>();
	public hideBonds = new Set<number>();

	// rectangular frames to draw around atoms
	public atomFrameDotSz:number[] = [];
	public atomFrameCol:number[] = [];

	// solid dots to draw over top of atoms
	public atomCircleSz:number[] = [];
	public atomCircleCol:number[] = [];

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

/*
	RenderMnemonics: a convenient container for recording information about a rendering process, which is useful for
	validation procedures.
*/

export enum RenderMnemonicType
{
	Atom = 'A',
	Bond = 'B',
	Artifact = 'R',
	Effect = 'E',
}

export interface RenderMnemonicItem
{
	type:RenderMnemonicType | string; // general category: known type or custom
	details:string; // arbitrary information about the payload, keep it concise, don't use the separator ('|')
	coords?:number[];
}

export class RenderMnemonics
{
	public items:RenderMnemonicItem[] = [];

	// ------------ public methods ------------

	constructor(encoded?:string)
	{
		let lines = (encoded || '').split('&');
		for (let line of lines)
		{
			let bits = line.split('|');
			if (bits.length != 3) continue;
			let item:RenderMnemonicItem =
			{
				type: bits[0],
				details: bits[1],
				coords: bits[2].split(',').map((str) => parseFloat(str)),
			};
			this.items.push(item);
		}
	}

	public append(type:RenderMnemonicType | string, details:string, coords?:number[]):void
	{
		for (let n = details.length - 1; n >= 0; n--) if (details[n] == '|' || details[n] == '&') details = details.substring(0, n) + details.substring(n + 1);
		this.items.push({type, details, coords});
	}

	public serialise():string
	{
		let lines:string[] = [];
		for (let item of this.items)
		{
			let coords = (item.coords ?? []).map((coord) => coord.toFixed(1)).join(',');
			lines.push(`${item.type}|${item.details}|${coords}`);
		}
		return lines.join('&');
	}

	// produce a quasi-human-readable representation of the mnemonics, so that two sets can be compared with each other;
	// a sans-coordinate version is provided as well, in case a rougher comparison is wanted
	public packWithCoords():string {return this.serialise();}
	public packWithoutCoords():string
	{
		return this.items.map((item) => `${item.type}|${item.details}`).join('&');
	}

	// ------------ private methods ------------
}

