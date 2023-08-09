/*
    WebMolKit

    (c) 2010-2021 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	Experiment reaction metadata: utilities and definitions.
*/

export enum ExperimentMetaType
{
	Role = 'role', // to assign an explicit role to a reagent (see ComponentClassType; default is auto)
	Pressure = 'pressure', // when a reagent is applied at a nonstandard pressure
	TurnoverNumber = 'turnover_number', // catalyst turnovers (unitless)
	EnantiomericExcess = 'enantiomeric_excess', // percent of desired enantiomer above undesired
	Time = 'time', // total time for reaction step
	Heat = 'heat', // maximum temperature of reaction step
	Light = 'light', // denotes reaction powered by EM radiation
}

export enum ExperimentMetaApplic
{
	Experiment,
	Step,
	Reactant,
	Reagent,
	Product,
}

export enum ExperimentMetaValue
{
	Boolean, // present = true, absent = false
	Number, // requires a numeric value
	Optional, // numeric value is optiona; mere presence can be used as a flag
	String, // requires a string value
}

export enum ExperimentMetaRoleType
{
	Reagent = 'reagent',
	Catalyst = 'catalyst',
	Solvent = 'solvent',
	Adjunct = 'adjunct',
}

export class ExperimentMeta
{
	public static APPLICABILITY =
	{
		[ExperimentMetaType.Role]: [ExperimentMetaApplic.Reagent],
		[ExperimentMetaType.Pressure]: [ExperimentMetaApplic.Reactant, ExperimentMetaApplic.Reagent],
		[ExperimentMetaType.TurnoverNumber]: [ExperimentMetaApplic.Reagent],
		[ExperimentMetaType.EnantiomericExcess]: [ExperimentMetaApplic.Product],
		[ExperimentMetaType.Time]: [ExperimentMetaApplic.Step],
		[ExperimentMetaType.Heat]: [ExperimentMetaApplic.Step],
		[ExperimentMetaType.Light]: [ExperimentMetaApplic.Step],
	};

	public static NAMES =
	{
		[ExperimentMetaType.Role]: 'Role',
		[ExperimentMetaType.Pressure]: 'Pressure',
		[ExperimentMetaType.TurnoverNumber]: 'Turnover Number',
		[ExperimentMetaType.EnantiomericExcess]: 'Enantiomeric Excess',
		[ExperimentMetaType.Time]: 'Time',
		[ExperimentMetaType.Heat]: 'Heat',
		[ExperimentMetaType.Light]: 'Light',
	};

	public static UNITS =
	{
		[ExperimentMetaType.Pressure]: 'atm',
		[ExperimentMetaType.TurnoverNumber]: null as string,
		[ExperimentMetaType.EnantiomericExcess]: '%',
		[ExperimentMetaType.Time]: 'hr',
		[ExperimentMetaType.Heat]: '\u{00B0}C',
		[ExperimentMetaType.Light]: 'nm',
	};

	public static VALUES =
	{
		[ExperimentMetaType.Role]: ExperimentMetaValue.String,
		[ExperimentMetaType.Pressure]: ExperimentMetaValue.Number,
		[ExperimentMetaType.TurnoverNumber]: ExperimentMetaValue.Number,
		[ExperimentMetaType.EnantiomericExcess]: ExperimentMetaValue.Number,
		[ExperimentMetaType.Time]: ExperimentMetaValue.Number,
		[ExperimentMetaType.Heat]: ExperimentMetaValue.Optional,
		[ExperimentMetaType.Light]: ExperimentMetaValue.Optional,
	};

	// given a string that contains some number of lines, returns a convenient array representation
	public static unpackMeta(str:string):[ExperimentMetaType, number | string][]
	{
		if (!str) return [];
		let list:[ExperimentMetaType, number | string][] = [];
		for (let line of str.split('\n')) if (line)
		{
			let eq = line.indexOf('=');
			let type = MoleculeStream.skUnescape(eq < 0 ? line : line.substring(0, eq)) as ExperimentMetaType;
			let value:number | string = eq < 0 ? null : MoleculeStream.skUnescape(line.substring(eq + 1));
			let vtype = this.VALUES[type];
			if (value != null && (vtype == ExperimentMetaValue.Number || vtype == ExperimentMetaValue.Optional)) value = parseFloat(value);
			list.push([type, value]);
		}
		return list;
	}

	// convert a list of type/value codes into packed string representation
	public static packMeta(list:[ExperimentMetaType, number | string][]):string
	{
		let lines:string[] = [];
		for (let [type, value] of list)
		{
			if (value == null)
				lines.push(MoleculeStream.skEscape(type));
			else
				lines.push(MoleculeStream.skEscape(type) + '=' + MoleculeStream.skEscape(value.toString()));
		}
		return lines.join('\n');
	}

	// unpacks, sets & packs, all in one go
	public static withMetaKey(metastr:string, type:ExperimentMetaType, value:string):string
	{
		let list = this.unpackMeta(metastr);
		let item = list.find((look) => look[0] == type);
		if (value != null)
		{
			if (item) item[1] = value; else list.push([type, value]);
		}
		else
		{
			list = list.filter((look) => look[0] != type);
		}
		return this.packMeta(list);
	}

	// return a short description of the instantiated value for display onscreen
	public static describeMeta(type:ExperimentMetaType, value:number | string):string
	{
		let formatFloat = (val:number, maxSigFig:number):string =>
		{
			if (val == null) return '';
			if (val == 0) return '0';
			let digits = Math.ceil(-Math.log10(Math.abs(val)));
			digits = Math.max(0, Math.max(digits, maxSigFig));
			let str = val.toFixed(digits);
			if (str.indexOf('.') < 0) return str;
			while (str.endsWith('0')) str = str.substring(0, str.length - 1);
			if (str.endsWith('.')) str = str.substring(0, str.length - 1);
			return str;
		};

		if (type == ExperimentMetaType.Role)
		{
			if (!value) return null;
			return `role: ${value}`;
		}
		else if (type == ExperimentMetaType.Pressure)
		{
			if (value == null) return null;
			return `${formatFloat(value as number, 2)} atm`;
		}
		else if (type == ExperimentMetaType.TurnoverNumber)
		{
			if (value == null) return null;
			return `${formatFloat(value as number, 2)} turnover${value == 1 ? '' : 's'}`;
		}
		else if (type == ExperimentMetaType.EnantiomericExcess)
		{
			if (value == null) return null;
			return `${formatFloat(value as number, 2)}% ee`;
		}
		else if (type == ExperimentMetaType.Time)
		{
			if (value == null) return null;
			if (value as number < 1)
			{
				let mins = value as number * 60;
				return `${formatFloat(mins, 2)} min${mins == 1 ? '' : 's'}`;
			}
			else return `${formatFloat(value as number, 2)} hour${value == 1 ? '' : 's'}`;
		}
		else if (type == ExperimentMetaType.Heat)
		{
			if (value == null) return '\u{0394}';
			return `${formatFloat(value as number, 2)} \u{00B0}C`;
		}
		else if (type == ExperimentMetaType.Light)
		{
			if (value == null) return 'h\u{03BD}';
			return `${formatFloat(value as number, 2)} nm`;
		}
		return null;
	}
}

/* EOF */ }