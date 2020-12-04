/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	The AspectList class is used as a way to fetch all of the recognised aspects that are installed within a given datasheet, without
	having to manually invoke each of the classes individually. Each aspect that is implemented within the toolkit needs to be added
	explicitly here, if it is going to get automatically considered during routine operations (e.g. rendering arbitrary datasheets).
*/

let SUPPORTED_ASPECTS:Record<string, string> = {};

export class AspectList
{
	constructor(public ds:DataSheet)
	{
		if ($.isEmptyObject(SUPPORTED_ASPECTS))
		{
			SUPPORTED_ASPECTS[SARTable.CODE] = SARTable.NAME;
			SUPPORTED_ASPECTS[Experiment.CODE] = Experiment.NAME;
			SUPPORTED_ASPECTS[AssayProvenance.CODE] = AssayProvenance.NAME;
			SUPPORTED_ASPECTS[BayesianSource.CODE] = BayesianSource.NAME;
			SUPPORTED_ASPECTS[BayesianPrediction.CODE] = BayesianPrediction.NAME;
			SUPPORTED_ASPECTS[MeasurementData.CODE] = MeasurementData.NAME;
			SUPPORTED_ASPECTS[BinaryData.CODE] = BinaryData.NAME;
		}
	}

	// returns two arrays: the first is a list of aspect codes that exist within the datasheet's header already; the second is a list of
	// codes from the recognised list that are not; note that any aspects that are not in either of these lists are missing because they're
	// not encoded within this class, which means that they're probably not supported at all by this toolkit
	public list():[string[], string[]]
	{
		let present:string[] = [], absent:string[] = [];

		let codes = new Set<string>();
		for (let n = 0; n < this.ds.numExtensions; n++) codes.add(this.ds.getExtType(n));

		for (let code in SUPPORTED_ASPECTS) if (codes.has(code)) present.push(code); else absent.push(code);

		return [present, absent];
	}

	// instantiates an aspect by creating the class instance that matches the given code; if the code is not in the supported list,
	// returns null; note that calling this function takes action that can modify the datasheet: it will be inducted if it does not
	// already exist; if it does exist, it is given the chance to make corrective changes to the content
	public instantiate(code:string):Aspect
	{
		if (code == SARTable.CODE) return new SARTable(this.ds);
		if (code == Experiment.CODE) return new Experiment(this.ds);
		if (code == AssayProvenance.CODE) return new AssayProvenance(this.ds);
		if (code == BayesianSource.CODE) return new BayesianSource(this.ds);
		if (code == BayesianPrediction.CODE) return new BayesianPrediction(this.ds);
		if (code == MeasurementData.CODE) return new MeasurementData(this.ds);
		if (code == BinaryData.CODE) return new BinaryData(this.ds);
		return null;
	}

	// goes through the header and instantiates every applicable aspect that is inducted (equivalent to using list & instantiate each)
	public enumerate():Aspect[]
	{
		let aspects:Aspect[] = [];
		for (let n = 0; n < this.ds.numExtensions; n++)
		{
			let code = this.ds.getExtType(n);
			if (SUPPORTED_ASPECTS[code]) aspects.push(this.instantiate(code));
		}
		return aspects;
	}

	// fetches just the name of an aspect, without instantiating it
	public aspectName(code:string):string
	{
		return SUPPORTED_ASPECTS[code];
	}
}

/* EOF */ }
