/*
    WebMolKit

    (c) 2010-2021 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

    [PKG=webmolkit]
*/

import {DataSheet} from '../ds/DataSheet';
import {MoleculeStream} from '../io/MoleculeStream';
import {Vec} from '../util/Vec';
import {Aspect} from './Aspect';
import {registerAspect} from './AspectList';
import {MeasurementData} from './MeasurementData';

/*
	Mixture: stores metadata about various columns such that they can be corralled into a hierarchical form that represents
	a mixed group of chemical substances, where individual components and branches have structure, name, quantity and various
	other properties when available. Designed to be compatible with the Mixfile format (https://github.com/cdd/mixtures) and
	IUPAC Mixtures InChI (MInChI) notation.
*/

export enum MixtureAttributeType
{
	Structure = 'structure',
	Name = 'name',
	Quantity = 'quantity',
	Bound = 'bound',
	Error = 'error',
	Ratio = 'ratio',
	Units = 'units',
	Relation = 'relation',
	Identifier = 'identifier',
	Link = 'link',
	Property = 'property',
}

export interface MixtureAttribute
{
	column:string;
	position:number[];
	type:MixtureAttributeType;
	info?:string[];
}

export interface MixtureHeader
{
	attributes:MixtureAttribute[];
}

export class Mixture extends Aspect
{
	public static CODE = 'org.mmi.aspect.Mixture';
	public static NAME = 'Mixture';

	public static SUFFIX_VALUE = '';
	private header:MixtureHeader = {attributes: []};

	// ----------------- public methods -----------------

	// used to test if a datasheet has the appropriate metadata
	public static isMixture(ds:DataSheet):boolean
	{
		for (let n = 0; n < ds.numExtensions; n++) if (ds.getExtType(n) == Mixture.CODE) return true;
		return false;
	}

	constructor(ds?:DataSheet, allowModify?:boolean)
	{
		super(Mixture.CODE, ds, allowModify);
		this.setup();
	}

	// data access
	public getHeader():MixtureHeader
	{
		return this.header;
	}
	public setHeader(header:MixtureHeader):void
	{
		this.header = header;
		let content = this.formatMetaData(header);
		for (let n = 0; n < this.ds.numExtensions; n++) if (this.ds.getExtType(n) == Mixture.CODE)
		{
			this.ds.setExtData(n, content);
			return;
		}
		this.ds.appendExtension(Mixture.NAME, Mixture.CODE, content);
	}

	// ----------------- private methods -----------------

	// workhorse for the constructor
	private setup():void
	{
		this.parseAndCorrect();
	}

	// assuming that the underlying datasheet definitely is a datasheet, makes any necessary corrections to force it into compliance
	private parseAndCorrect():void
	{
		this.header = {attributes: []};

		let got = false;
		for (let n = 0; n < this.ds.numExtensions; n++) if (this.ds.getExtType(n) == Mixture.CODE)
		{
			this.header = this.parseMetaData(this.ds.getExtData(n));
			got = true;
			break;
		}

		if (!got && this.allowModify)
		{
			let content = this.formatMetaData(this.header);
			this.ds.appendExtension(Mixture.NAME, Mixture.CODE, content);
		}
	}

	// interprets the string metadata from the extensions
	private parseMetaData(content:string):MixtureHeader
	{
		let header:MixtureHeader = {attributes: []};

		for (let line of content.split(/\r?\n/))
		{
			let eq = line.indexOf('=');
			if (eq < 0) continue;
			if (line.startsWith('attr='))
			{
				let bits = line.substring(eq + 1).split(',');
				if (bits.length < 3) continue;
				let column = MoleculeStream.skUnescape(bits[0]);
				let position:number[] = [];
				if (bits[1] != '0') position = bits[1].split('.').map((str) => parseInt(str));
				let type = bits[2] as MixtureAttributeType;
				let info:string[] = [];
				for (let n = 3; n < bits.length; n++) info.push(MoleculeStream.skUnescape(bits[n]));

				header.attributes.push({column, position, type, info});
			}
		}
		return header;
	}

	// deserialises the header metadata
	private formatMetaData(header:MixtureHeader):string
	{
		let lines:string[] = [];

		for (let a of header.attributes)
		{
			let bits:string[] = [MoleculeStream.skEscape(a.column)];
			if (Vec.isBlank(a.position)) bits.push('0'); else bits.push(a.position.join('.'));
			bits.push(a.type);
			if (a.info) for (let str of a.info) bits.push(MoleculeStream.skEscape(str));
			lines.push('attr=' + bits.join(','));
		}

		return lines.join('\n');
	}

	// ------------------ aspect implementation --------------------

	public plainHeading():string {return MeasurementData.NAME;}

	public isColumnReserved(colName:string):boolean
	{
		return this.areColumnsReserved([colName])[0];
	}
	public areColumnsReserved(colNames:string[]):boolean[]
	{
		let names = new Set<string>();
		for (let a of this.header.attributes) names.add(a.column);
		let resv:boolean[] = [];
		for (let col of colNames) resv.push(names.has(col));
		return resv;
	}
}

registerAspect(Mixture);

