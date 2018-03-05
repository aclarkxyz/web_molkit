/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../data/Molecule.ts'/>
///<reference path='../aspect/Experiment.ts'/>
///<reference path='../util/util.ts'/>

namespace WebMolKit /* BOF */ {

/*
	Quantity interconversions: for an Experiment entry, figure out all of the real-and-converted quantities, and
	mark them as such for convenient recall.
*/

export class QuantityComp
{
	public role = 0;
	public molw = 0;
	public valueEquiv = 0;
	public statEquiv = QuantityCalc.STAT_UNKNOWN;
	public valueMass = QuantityCalc.UNSPECIFIED;
	public statMass = QuantityCalc.STAT_UNKNOWN;
	public valueVolume = QuantityCalc.UNSPECIFIED;
	public statVolume = QuantityCalc.STAT_UNKNOWN;
	public valueMoles = QuantityCalc.UNSPECIFIED;
	public statMoles = QuantityCalc.STAT_UNKNOWN;
	public valueDensity = QuantityCalc.UNSPECIFIED;
	public statDensity = QuantityCalc.STAT_UNKNOWN;
	public valueConc = QuantityCalc.UNSPECIFIED;
	public statConc = QuantityCalc.STAT_UNKNOWN;
	public valueYield = QuantityCalc.UNSPECIFIED;
	public statYield = QuantityCalc.STAT_UNKNOWN;
	
	constructor(public comp:ExperimentComponent, public step:number, public type:number, public idx:number)
	{
	}
}

export class GreenMetrics
{
	public step = 0; // reaction step
	public idx = 0; // index into the overall quantity list
	public massReact:number[] = [];
	public massProd:number[] = [];
	public massWaste:number[] = [];
	public massProdWaste:number[] = [];
	public molwReact:number[] = [];
	public molwProd:number[] = [];
	public impliedWaste = 0;
	public isBlank = false; // set to true if there's no content (blank entries can still be useful as placeholders)
}

export class QuantityCalc
{
	public static UNSPECIFIED = -1;
	
	public static ROLE_PRIMARY = 1; // a reactant upon which ratios depend
	public static ROLE_SECONDARY = 2; // a stoichiometric reactant, intermediate or waste product
	public static ROLE_PRODUCT = 3; // a final product for which yield should be calculated
	public static ROLE_INDEPENDENT = 4; // a nonstoichiometric reagent or waste product

	public static STAT_UNKNOWN = 0; // no data, i.e. not provided and cannot be calculated
	public static STAT_ACTUAL = 1; // user-provided data
	public static STAT_VIRTUAL = 2; // calculated data
	public static STAT_CONFLICT = 3; // user-provided data that clashes
	
	public quantities:QuantityComp[] = [];

	private idxPrimary:number[] = [];
	private idxYield:number[] = [];
	private allMassReact:number[] = [];
	private allMassProd:number[] = [];
	private allMassWaste:number[] = [];	

	public greenMetrics:GreenMetrics[] = [];

	// ---------------- static methods -----------------
	
	// returns true if the stoichiometry string is equivalent to zero, i.e. non-stoichiometric
	public static isStoichZero(stoich:string):boolean
	{
		if (this.isStoichUnity(stoich)) return false;
		if (parseFloat(stoich) == 0) return true;
		return false;
	}
	// returns true if the stoichiometry string is equivalent to one, which is the default state
	public static isStoichUnity(stoich:string):boolean
	{
		if (!stoich || stoich == '1') return true;
		let [numer, denom] = this.extractStoichFraction(stoich);
		return numer != 0 && numer == denom;
	}
	// extracts the numerator and denominator from the stoichiometry and expresses them as numerator/denominator; makes
	// up suitable values if it is not expressed as a fraction
	public static extractStoichFraction(stoich:string):[number, number]
	{
		if (!stoich) return [1, 1];

		let numer = 1, denom = 1;
		
		let i = stoich.indexOf('/');
		if (i < 0)
		{
			let v = parseFloat(stoich);
			if (v >= 0) numer = v;
		}
		else
		{
			let v1 = parseFloat(stoich.substring(0, i)), v2 = parseFloat(stoich.substring(i + 1));
			if (v1 >= 0) numer = v1;
			if (v2 >= 0) denom = v2;
		}
		return [numer, denom];
	}

	// as above, but just returns the number, as a decimal ratio
	public static extractStoichValue(stoich:string):number
	{
		let [numer, denom] = this.extractStoichFraction(stoich);
		return denom <= 1 ? numer : numer / denom;
	}
	
	// attempts to express the stoichiometry as a ratio; ideally this involves pulling out the numbers, but when they are provided
	// as a floating point number, has to have a go at finding the closest fraction; it will lock onto the closest match with a small-ish
	// denominator, so for obscure ratios, it may be an approximation
	private static MAX_DENOM = 16;
	private static RATIO_FRACT:number[] = null;
	public static stoichAsRatio(stoich:string):[number, number]
	{
		let [numer, denom] = this.extractStoichFraction(stoich);
		if (numer == Math.floor(numer)) return [numer, denom];
		return this.stoichFractAsRatio(numer);
	}
	public static stoichFractAsRatio(fract:number):[number, number]
	{
		if (fract == Math.floor(fract)) return [fract, 1];
		
		const MAX_DENOM = QuantityCalc.MAX_DENOM;
		if (QuantityCalc.RATIO_FRACT == null)
		{
			QuantityCalc.RATIO_FRACT = [];
			for (let p = 0, j = 2; j <= MAX_DENOM; j++) for (let i = 1; i < j && i < MAX_DENOM - 1; i++) QuantityCalc.RATIO_FRACT.push(i * 1.0 / j);
		}
		
		let whole = Math.floor(fract);
		let resid = fract - whole;
		
		let bestDiff = Number.MAX_VALUE;
		let bestOver = 1, bestUnder = 1;
		for (let p = 0, j = 2; j <= MAX_DENOM; j++) for (let i = 1; i < j && i < MAX_DENOM - 1; i++)
		{
			let diff = Math.abs(QuantityCalc.RATIO_FRACT[p++] - resid);
			if (diff < bestDiff) {bestDiff = diff; bestOver = i; bestUnder = j;}
		}
		
		return [bestOver + (whole * bestUnder), bestUnder];
	}
	
	// if the given reagent has a molecule with mapping numbers, checks to see if they line up with product(s), and derives stoichiometry from
	// there; a value of 0 means that nothing could be determined
	public static impliedReagentStoich(reagent:ExperimentComponent, products:ExperimentComponent[]):number
	{
		if (MolUtil.isBlank(reagent.mol) || products.length == 0) return 0;
		
		let pstoich = Vec.numberArray(-1, products.length);
		let rmol = reagent.mol;
		let highest = 0;
		
		for (let n = 1; n <= rmol.numAtoms; n++)
		{
			let m = rmol.atomMapNum(n);
			if (m == 0) continue;
			let total = 0;
			for (let i = 0; i < products.length; i++)
			{
				let pmol = products[i].mol;
				if (MolUtil.isBlank(pmol)) continue;
				
				let pcount = 0;
				for (let j = 1; j <= pmol.numAtoms; j++) if (pmol.atomMapNum(j) == m) pcount++;
				if (pcount > 0)
				{
					let rcount = 0;
					for (let k = 1; k <= rmol.numAtoms; k++) if (rmol.atomMapNum(k) == m) rcount++;
					if (pstoich[i] < 0) pstoich[i] = QuantityCalc.extractStoichValue(products[i].stoich);
					total += pcount * pstoich[i] / rcount;
				}
			}
			highest = Math.max(highest, total);
		}
		return highest;
	}
	
	/*
	// for a given step in a reaction, adds up all the structures on both the left and right hand sides; the structures on each side are combined
	// into a single molecule instance, and are expanded out based on the relative ratio of stoichiometry; zero stoichiometry is treated as 1
	public static Molecule[] combinedSides(Experiment.Entry entry, int step)
	{
		List<Molecule> left = new ArrayList<>(), right = new ArrayList<>();
		IntVector numer = new IntVector(), denom = new IntVector();
		
		Component[] reactants = step == 0 ? entry.steps[0].reactants : entry.steps[step - 1].products;
		for (Component comp : reactants) if (MolUtil.notBlank(comp.mol))
		{
			PairTwoInt ratio = stoichAsRatio(comp.stoich);
			left.add(comp.mol);
			numer.add(ratio.val1 == 0 ? 1 : ratio.val1);
			denom.add(ratio.val2);
		}
		for (Component comp : entry.steps[step].reagents) if (MolUtil.notBlank(comp.mol))
		{
			float fract = impliedReagentStoich(comp, entry.steps[step].products);
			PairTwoInt ratio = fract == 0 ? new PairTwoInt(1, 1) : stoichAsRatio(fract);
			left.add(comp.mol);
			numer.add(ratio.val1 == 0 ? 1 : ratio.val1);
			denom.add(ratio.val2);
		}

		for (Component comp : entry.steps[step].products) if (MolUtil.notBlank(comp.mol))
		{
			PairTwoInt ratio = stoichAsRatio(comp.stoich);
			right.add(comp.mol);
			numer.add(ratio.val1 == 0 ? 1 : ratio.val1);
			denom.add(ratio.val2);
		}
		
		int bigDenom = 1;
		for (int n = 0; n < numer.size(); n++)
		{
			int d = denom.get(n);
			if (d == 1) continue;
			if (bigDenom % d != 0) bigDenom *= d;
		}
		// (any way to bring it back down?)
		
		Molecule mol1 = new Molecule(), mol2 = new Molecule();
		for (int n = 0; n < left.size(); n++)
		{
			int num = numer.get(n) * bigDenom / denom.get(n);
			for (int i = 0; i < num; i++) MolUtil.append(mol1, left.get(n));
		}
		for (int n = 0; n < right.size(); n++)
		{
			int nn = left.size() + n, num = numer.get(nn) * bigDenom / denom.get(nn);
			for (int i = 0; i < num; i++) MolUtil.append(mol2, right.get(n));
		}
		
		return new Molecule[]{mol1, mol2};
	}
	
	// for a given step, works out the integral stoichiometry of {reactants, reagents, components}
	public static int[][] componentRatio(Experiment.Entry entry, int step)
	{
		IntVector numer = new IntVector(), denom = new IntVector();
		
		Component[] reactants = step == 0 ? entry.steps[0].reactants : entry.steps[step - 1].products;
		for (Component comp : reactants)
		{
			PairTwoInt ratio = stoichAsRatio(comp.stoich);
			numer.add(ratio.val1 == 0 ? 1 : ratio.val1);
			denom.add(ratio.val2);
		}
		for (Component comp : entry.steps[step].reagents)
		{
			float fract = impliedReagentStoich(comp, entry.steps[step].products);
			PairTwoInt ratio = fract == 0 ? new PairTwoInt(1, 1) : stoichAsRatio(fract);
			numer.add(ratio.val1 == 0 ? 1 : ratio.val1);
			denom.add(ratio.val2);
		}
		for (Component comp : entry.steps[step].products)
		{
			PairTwoInt ratio = stoichAsRatio(comp.stoich);
			numer.add(ratio.val1 == 0 ? 1 : ratio.val1);
			denom.add(ratio.val2);
		}
		
		int bigDenom = 1;
		for (int n = 0; n < numer.size(); n++)
		{
			int d = denom.get(n);
			if (d == 1) continue;
			if (bigDenom % d != 0) bigDenom *= d;
		}
		// (any way to bring it back down?)
		
		int[] ratio1 = new int[reactants.length], ratio2 = new int[entry.steps[step].reagents.length], ratio3 = new int[entry.steps[step].products.length];
		int p = 0;
		for (int n = 0; n < ratio1.length; n++, p++) ratio1[n] = numer.get(p) * bigDenom / denom.get(p);
		for (int n = 0; n < ratio2.length; n++, p++) ratio2[n] = numer.get(p) * bigDenom / denom.get(p);
		for (int n = 0; n < ratio3.length; n++, p++) ratio3[n] = numer.get(p) * bigDenom / denom.get(p);
		return new int[][]{ratio1, ratio2, ratio3};
	}*/

	// ---------------- public methods -----------------

	constructor(public entry:ExperimentEntry)
	{
	}

	// fill in all the details
	public calculate():void
	{
		// the basic quantities: iteratively ifer everything possible
		this.classifyTypes();
		while (this.calculateSomething()) {}
		
		// work out green metrics, where applicable
		this.allMassReact = [];
		this.allMassProd = [];
		this.allMassWaste = [];
		for (let n = 0; n < this.quantities.length; n++)
    	{
    		let qc = this.quantities[n];
			if (qc.type == Experiment.REACTANT || qc.type == Experiment.REAGENT)
			{
				if (qc.valueEquiv == 0 && qc.type == Experiment.REAGENT) continue;
				this.allMassReact.push(qc.valueMass);
			}
			else if (qc.type == Experiment.PRODUCT)
			{
				if (!qc.comp.waste)
				{
					this.allMassProd.push(qc.valueMass);
					this.calculateGreenMetrics(n);
				}
				else
				{
					this.allMassWaste.push(qc.valueMass);
				}
			}
		}
	}

	// access to determined results
	public get numQuantities():number {return this.quantities.length;}
	public getQuantity(idx:number):QuantityComp {return this.quantities[idx];}
	public getAllQuantities():QuantityComp[] {return this.quantities.slice(0);}
	public get numGreenMetrics():number {return this.greenMetrics.length;}
	public getGreenMetrics(idx:number):GreenMetrics {return this.greenMetrics[idx];}
	public getAllGreenMetrics():GreenMetrics[] {return this.greenMetrics.slice(0);}
	public getAllMassReact():number[] {return this.allMassReact.slice(0);}
	public getAllMassProd():number[] {return this.allMassProd.slice(0);}
	public getAllMassWaste():number[] {return this.allMassWaste.slice(0);}
	
	// convenience: locate a component somewhere within the entry
	public findComponent(step:number, type:number, idx:number):QuantityComp
	{
		for (let qc of this.quantities) if (qc.step == step && qc.type == type && qc.idx == idx) return qc;
		return null;
	}

	// convenience formatting tools, which pick appropriate units
	public static formatMolWeight(value:number):string
    {
    	if (value == QuantityCalc.UNSPECIFIED) return '';
    	return formatDouble(value,6) + ' g/mol';
    }
	public static formatMass(value:number):string
    {
    	if (value == QuantityCalc.UNSPECIFIED) return '';
    	if (value <= 1E-6) return formatDouble(value*1E6,6) + ' \u03BCg';
    	if (value <= 1E-3) return formatDouble(value*1E3,6) + ' mg';
    	if (value >= 1E3) return formatDouble(value*1E-3,6) + ' kg';
    	return formatDouble(value,6) + ' g';
    }
	public static formatVolume(value:number):string
    {
		if (value == QuantityCalc.UNSPECIFIED) return '';
		if (value <= 1E-6) return formatDouble(value * 1E6, 6) + ' nL';
		if (value <= 1E-3) return formatDouble(value * 1E3, 6) + ' \u03BCL';
		if (value >= 1E3) return formatDouble(value * 1E-3, 6) + ' L';
		return formatDouble(value, 6) + ' mL';
    }
	public static formatMoles(value:number):string
    {
		if (value == QuantityCalc.UNSPECIFIED) return '';
		if (value <= 1E-9) return formatDouble(value * 1E9, 6) + ' nmol';
		if (value <= 1E-6) return formatDouble(value * 1E6, 6) + ' \u03BCmol';
		if (value <= 1E-3) return formatDouble(value * 1E3, 6) + ' mmol';
		return formatDouble(value, 6) + ' mol';
    }
	public static formatDensity(value:number):string
    {
		if (value == QuantityCalc.UNSPECIFIED) return '';
		return formatDouble(value, 6) + ' g/mL';
    }
	public static formatConc(value:number):string
    {
		if (value == QuantityCalc.UNSPECIFIED) return '';
		if (value <= 1E-9) return formatDouble(value * 1E9, 6) + ' nmol/L';
		if (value <= 1E-6) return formatDouble(value * 1E6, 6) + ' \u03BCmol/L';
		if (value <= 1E-3) return formatDouble(value * 1E3, 6) + ' mmol/L';
		return formatDouble(value, 6) + ' mol/L';
    }
	public static formatPercent(value:number):string
    {
		if (value == QuantityCalc.UNSPECIFIED) return '';
		return formatDouble(value, 6) + '%';
    }

	// ---------------- private methods -----------------

	// do a first pass of pulling out the raw data
	private classifyTypes():void
    {
    	for (let s = 0; s < this.entry.steps.length; s++)
		{
			let step = this.entry.steps[s];
			for (let n = 0; n < step.reactants.length; n++) this.quantities.push(new QuantityComp(step.reactants[n], s, Experiment.REACTANT, n));
			for (let n = 0; n < step.reagents.length; n++) this.quantities.push(new QuantityComp(step.reagents[n], s, Experiment.REAGENT, n));
			for (let n = 0; n < step.products.length; n++) this.quantities.push(new QuantityComp(step.products[n], s, Experiment.PRODUCT, n));
		}

		// classify each component into roles, and fill in some basic properties
		for (let n = 0; n < this.quantities.length; n++)
		{
			let qc = this.quantities[n];

			if (qc.type == Experiment.REAGENT)
			{
				if (qc.comp.equiv != null) qc.valueEquiv = qc.comp.equiv;
				else
				{
					let eq = QuantityCalc.impliedReagentStoich(qc.comp, this.entry.steps[qc.step].products);
					if (eq > 0) qc.valueEquiv = eq;
				}
			}
			else
			{
				qc.valueEquiv = QuantityCalc.extractStoichValue(qc.comp.stoich);
			}
			
			if (qc.comp.mol != null) qc.molw = MolUtil.molecularWeight(qc.comp.mol);
			
			qc.role = QuantityCalc.ROLE_INDEPENDENT;
			if (qc.step == 0 && qc.type == Experiment.REACTANT)
			{
				if (qc.comp.primary)
				{
					qc.role = QuantityCalc.ROLE_PRIMARY;
					this.idxPrimary.push(n);
				}
				else qc.role = QuantityCalc.ROLE_SECONDARY;
			}
			else if (qc.type == Experiment.REAGENT)
			{
				if (qc.valueEquiv > 0) qc.role = QuantityCalc.ROLE_SECONDARY;
			}
			else if (qc.type == Experiment.PRODUCT && !qc.comp.waste)
			{
				qc.role = QuantityCalc.ROLE_PRODUCT;
				this.idxYield.push(n);
			}
			else if (qc.valueEquiv > 0)
			{
				qc.role = QuantityCalc.ROLE_SECONDARY;
			}
			
			// fill in any user-specified values
			if (qc.comp.mass != null) qc.valueMass = qc.comp.mass;
			if (qc.comp.volume != null) qc.valueVolume = qc.comp.volume;
			if (qc.comp.moles != null) qc.valueMoles = qc.comp.moles;
			if (qc.comp.density != null) qc.valueDensity = qc.comp.density;
			if (qc.comp.conc != null) qc.valueConc = qc.comp.conc;
			if (qc.comp.yield != null) qc.valueYield = qc.comp.yield;
			
			qc.statEquiv = qc.valueEquiv == QuantityCalc.UNSPECIFIED ? QuantityCalc.STAT_UNKNOWN : QuantityCalc.STAT_ACTUAL;
			qc.statMass = qc.valueMass == QuantityCalc.UNSPECIFIED ? QuantityCalc.STAT_UNKNOWN : QuantityCalc.STAT_ACTUAL;
			qc.statVolume = qc.valueVolume == QuantityCalc.UNSPECIFIED ? QuantityCalc.STAT_UNKNOWN : QuantityCalc.STAT_ACTUAL;
			qc.statMoles = qc.valueMoles == QuantityCalc.UNSPECIFIED ? QuantityCalc.STAT_UNKNOWN : QuantityCalc.STAT_ACTUAL;
			qc.statDensity = qc.valueDensity == QuantityCalc.UNSPECIFIED ? QuantityCalc.STAT_UNKNOWN : QuantityCalc.STAT_ACTUAL;
			qc.statConc = qc.valueConc == QuantityCalc.UNSPECIFIED ? QuantityCalc.STAT_UNKNOWN : QuantityCalc.STAT_ACTUAL;
			qc.statYield = qc.valueYield == QuantityCalc.UNSPECIFIED ? QuantityCalc.STAT_UNKNOWN : QuantityCalc.STAT_ACTUAL;
		}

		// if no rate limiting reactants, pick everything from step 1
		if (this.idxPrimary.length == 0)
		{
			for (let n = 0; n < this.quantities.length; n++)
			{
				let qc = this.quantities[n];
				if (qc.type == Experiment.REACTANT && qc.step == 0)
				{
					qc.role = QuantityCalc.ROLE_PRIMARY;
					this.idxPrimary.push(n);
				}
			}
		}
    }
	
    // attempt to replace at least one unknown value with an inferred value; returns true if anything happened, which
    // signals that another round should be repeated, in case more possibilities come online
    private calculateSomething():boolean
    {
		let anything = false;

		// ---- part 1: look for any interconversions that are internal to a component

		for (let qc of this.quantities)
		{
			// molar interconversion
			if (qc.molw > 0 && qc.valueMass == QuantityCalc.UNSPECIFIED && qc.statMoles == QuantityCalc.STAT_ACTUAL)
			{
				qc.valueMass = qc.valueMoles * qc.molw;
				qc.statMass = QuantityCalc.STAT_VIRTUAL;
				anything = true;
			}
			if (qc.molw > 0 && qc.valueMass != QuantityCalc.UNSPECIFIED && qc.valueMoles == QuantityCalc.UNSPECIFIED)
			{
				qc.valueMoles = qc.valueMass / qc.molw;
				qc.statMoles = QuantityCalc.STAT_VIRTUAL;
				anything = true;
			}
			if (qc.molw > 0 && qc.statMass == QuantityCalc.STAT_ACTUAL && qc.statMoles == QuantityCalc.STAT_ACTUAL)
			{
				let calcMoles = qc.valueMass / qc.molw;
				if (!this.closeEnough(qc.valueMoles, calcMoles))
				{
					qc.statMass = QuantityCalc.STAT_CONFLICT;
					qc.statMoles = QuantityCalc.STAT_CONFLICT;
				}
    		}
			
			let isSoln = qc.statConc == QuantityCalc.STAT_ACTUAL ||
				(qc.statVolume == QuantityCalc.STAT_ACTUAL && (qc.statMass == QuantityCalc.STAT_ACTUAL || qc.statMoles == QuantityCalc.STAT_ACTUAL));

    		// non solutions, mass/density/volume
    		if (!isSoln)
    		{
				if (qc.valueDensity > 0 && qc.valueMass == QuantityCalc.UNSPECIFIED && qc.valueVolume != QuantityCalc.UNSPECIFIED)
				{
					qc.valueMass = qc.valueVolume * qc.valueDensity;
					qc.statMass = QuantityCalc.STAT_VIRTUAL;
					anything = true;
				}
				if (qc.valueDensity > 0 && qc.valueMass != QuantityCalc.UNSPECIFIED && qc.valueVolume == QuantityCalc.UNSPECIFIED)
				{
					qc.valueVolume = qc.valueMass / qc.valueDensity;
					qc.statVolume = QuantityCalc.STAT_VIRTUAL;
					anything = true;
				}
				if (qc.valueDensity == QuantityCalc.UNSPECIFIED && qc.valueMass != QuantityCalc.UNSPECIFIED && 
					qc.valueVolume != QuantityCalc.UNSPECIFIED && qc.valueConc == QuantityCalc.UNSPECIFIED)
				{
					if (qc.statMass == QuantityCalc.STAT_ACTUAL || qc.statMoles == QuantityCalc.STAT_ACTUAL) // don't guess density from stoichoimetry
					{
						qc.valueDensity = qc.valueMass / qc.valueVolume;
						qc.statDensity = QuantityCalc.STAT_VIRTUAL;
						anything = true;
					}
				}
    		}
    		
    		// solutions, moles/conc/volume
    		if (isSoln)
    		{
				if (qc.valueConc > 0 && qc.valueMoles == QuantityCalc.UNSPECIFIED && qc.valueVolume != QuantityCalc.UNSPECIFIED)
				{
					qc.valueMoles = 0.001 * qc.valueVolume * qc.valueConc;
					qc.statMoles = QuantityCalc.STAT_VIRTUAL;
					anything = true;
				}
				if (qc.valueConc > 0 && qc.valueMoles != QuantityCalc.UNSPECIFIED && qc.valueVolume == QuantityCalc.UNSPECIFIED)
				{
					qc.valueVolume = 1000 * qc.valueMoles / qc.valueConc;
					qc.statVolume = QuantityCalc.STAT_VIRTUAL;
					anything = true;
				}
				if (qc.valueConc == QuantityCalc.UNSPECIFIED && qc.valueMass != QuantityCalc.UNSPECIFIED && qc.valueVolume != QuantityCalc.UNSPECIFIED)
				{
					qc.valueConc = 1000 * qc.valueMoles / qc.valueVolume;
					qc.statConc = QuantityCalc.STAT_VIRTUAL;
					anything = true;
				}
				if (qc.statConc == QuantityCalc.STAT_ACTUAL && qc.valueMoles > 0 && qc.statVolume == QuantityCalc.STAT_ACTUAL)
				{
					let calcVolume = 1000 * qc.valueMoles / qc.valueConc;
					if (!this.closeEnough(qc.valueVolume, calcVolume))
					{
						qc.statConc = QuantityCalc.STAT_CONFLICT;
						if (qc.statMass == QuantityCalc.STAT_ACTUAL) qc.statMass = QuantityCalc.STAT_CONFLICT;
						if (qc.statMoles == QuantityCalc.STAT_ACTUAL) qc.statMoles = QuantityCalc.STAT_CONFLICT;
						qc.statVolume = QuantityCalc.STAT_CONFLICT;
					}
				}
    		}
			
			// calculating mass from virtual molar mass
			if (qc.molw > 0 && qc.valueMass == QuantityCalc.UNSPECIFIED && qc.valueMoles != QuantityCalc.UNSPECIFIED)
			{
				qc.valueMass = qc.valueMoles * qc.molw;
				qc.statMass = QuantityCalc.STAT_VIRTUAL;
				anything = true;
			}
			
    		// providing a concentration and density is disallowed
			if (qc.statDensity == QuantityCalc.STAT_ACTUAL && qc.statConc == QuantityCalc.STAT_ACTUAL)
			{
				qc.statDensity = QuantityCalc.STAT_CONFLICT;
				qc.statConc = QuantityCalc.STAT_CONFLICT;
			}
    	}
	
    	if (anything) return true; // want to make it cycle over all the reactants before moving on
    	
    	// ---- part 2: determine the molar quantity baseline, for each step, where applicable
    	
		let hasRef = false;
		let numSteps = this.entry.steps.length;
		let primaryCounts = Vec.numberArray(0, numSteps);
		let primaryEquivs = Vec.numberArray(0, numSteps);
		let primaryMoles = Vec.numberArray(0, numSteps);
    	
    	// go over components: first step uses reactants; next steps use products from previous
    	for (let qc of this.quantities)
		{
			let ref = -1;
			if (qc.step == 0 && qc.type == Experiment.REACTANT && qc.comp.primary) ref = qc.step;
			else if (qc.step < numSteps - 1 && qc.type == Experiment.PRODUCT && !qc.comp.waste) ref = qc.step + 1;
			else continue;
			if (primaryEquivs[ref] < 0) continue;
			
			if (qc.statMoles == QuantityCalc.STAT_UNKNOWN)
			{
				primaryEquivs[ref] = -1;
				continue;
			}

			primaryCounts[ref]++;
			primaryEquivs[ref] += qc.valueEquiv;
			primaryMoles[ref] += qc.valueMoles;
    	}
    	
    	// special deal: if no primary reactants, use all of the primaries
		if (primaryEquivs[0] <= 0)
		{
			primaryCounts[0] = 0;
			primaryEquivs[0] = 0;
			primaryMoles[0] = 0;
			for (let i of this.idxPrimary)
			{
				let qc = this.quantities[i];
				if (qc.statMoles == QuantityCalc.STAT_UNKNOWN)
				{
					primaryCounts[0] = 0;
					primaryEquivs[0] = -1;
					primaryMoles[0] = 0;
					break;
				}
				primaryCounts[0]++;
				primaryEquivs[0] += qc.valueEquiv;
				primaryMoles[0] += qc.valueMoles;
			}
		}
		let refMoles = Vec.numberArray(0, numSteps);
		for (let n = 0; n < numSteps; n++)
		{
			refMoles[n] = primaryCounts[n] == 0 || primaryEquivs[n] <= 0 ? 0 : primaryMoles[n] / primaryEquivs[n];
			if (refMoles[n] > 0) hasRef = true;
		}

		// if no reference moles at all, try formulating some by making use of product quantities
		if (!hasRef)
		{
			for (let n = 0; n < numSteps; n++)
			{
				let prodMolar:number[] = [];
				for (let qc of this.quantities)
				{
					if (qc.step != n || qc.role != QuantityCalc.ROLE_PRODUCT) continue;
					if (qc.statMoles == QuantityCalc.STAT_UNKNOWN || qc.valueMoles <= 0 || qc.valueEquiv <= 0) continue;
					let yld = qc.valueYield > 0 ? qc.valueYield * 0.01 : 1;
					prodMolar.push(qc.valueMoles / (qc.valueEquiv * yld));
				}
				if (prodMolar.length > 0)
				{
					refMoles[n] = Vec.sum(prodMolar) / prodMolar.length;
					hasRef = true;
				}
			}
		}
		
		if (!hasRef) return false; // can't do anything else
		
    	// ---- part 3: look for ways to apply the yield
		
		for (let qc of this.quantities)
		{
			if (qc.type != Experiment.PRODUCT) continue;
			
			if (refMoles[qc.step] == 0) continue;

			if (qc.valueYield == QuantityCalc.UNSPECIFIED && qc.valueMoles != QuantityCalc.UNSPECIFIED)
			{
				qc.valueYield = 100 * qc.valueMoles / (refMoles[qc.step] * qc.valueEquiv);
				qc.statYield = QuantityCalc.STAT_VIRTUAL;
				anything = true;
			}
			if (qc.valueYield != QuantityCalc.UNSPECIFIED && qc.valueMoles == QuantityCalc.UNSPECIFIED)
			{
				qc.valueMoles = qc.valueYield * 0.01 * (refMoles[qc.step] * qc.valueEquiv);
				qc.statMoles = QuantityCalc.STAT_VIRTUAL;
				anything = true;
			}
			if (qc.valueMoles > 0 && qc.statYield == QuantityCalc.STAT_ACTUAL)
			{
				let calcYield = 100 * qc.valueMoles / (refMoles[qc.step] * qc.valueEquiv);
				if (!this.closeEnough(qc.valueYield, calcYield))
				{
					if (qc.statMass == QuantityCalc.STAT_ACTUAL) qc.statMass = QuantityCalc.STAT_CONFLICT;
					if (qc.statMoles == QuantityCalc.STAT_ACTUAL) qc.statMoles = QuantityCalc.STAT_CONFLICT;
					qc.statYield = QuantityCalc.STAT_CONFLICT;
				}
    		}
    	}
    
    	if (anything) return true;
    	
    	// ---- part 4: look for stoichiometric components where molarity can be filled in

		for (let qc of this.quantities)
		{
			if (refMoles[qc.step] == 0) continue;

			if (qc.valueMass == QuantityCalc.UNSPECIFIED && qc.valueMoles == QuantityCalc.UNSPECIFIED && qc.valueEquiv > 0)
			{
				qc.valueMoles = refMoles[qc.step] * qc.valueEquiv;
				qc.statMoles = QuantityCalc.STAT_VIRTUAL;
				anything = true;
			}
			if (qc.valueMoles != QuantityCalc.UNSPECIFIED && qc.valueEquiv == QuantityCalc.UNSPECIFIED)
			{
				qc.valueEquiv = qc.valueMoles / refMoles[qc.step];
				qc.statEquiv = QuantityCalc.STAT_VIRTUAL;
				anything = true;
			}
		}

    	return anything;
    }

	// work out all available green metrics for a particular product index
	private calculateGreenMetrics(idx:number):void
    {
		let qc = this.quantities[idx];
    	let gm = new GreenMetrics();

		gm.step = qc.step;
		gm.idx = idx;
		gm.isBlank = true;
	
		for (let n = 0; n < this.quantities.length; n++)
		{
			let sub = this.quantities[n];
			if (sub.step > gm.step) continue;
			
			let eq = sub.valueEquiv;
			if (eq == 0 && sub.type == Experiment.REAGENT) continue;

			if (sub.valueMass != QuantityCalc.UNSPECIFIED) gm.isBlank = false;
			
			if (sub.type == Experiment.REACTANT || sub.type == Experiment.REAGENT)
			{
				gm.massReact.push(sub.valueMass);
				if (sub.step == gm.step && eq > 0 && sub.molw > 0) gm.molwReact.push(eq * sub.molw);
			}
			else if (sub.type == Experiment.PRODUCT)
			{
				if (!sub.comp.waste)
				{
					if (sub.step == gm.step) gm.massProd.push(sub.valueMass);
					if (eq > 0 && sub.molw > 0)
					{
						if (sub.step == gm.step) gm.molwProd.push(eq * sub.molw);
						else if (sub.step == gm.step - 1) gm.molwReact.push(eq * sub.molw);
					}
				}
				else
				{
					gm.massWaste.push(sub.valueMass);
				}
				if (sub.step == gm.step) gm.massProdWaste.push(sub.valueMass);
			}
		}
		
		gm.impliedWaste = Vec.sum(gm.massReact) - Vec.sum(gm.massProdWaste);
		if (Math.abs(gm.impliedWaste) > 1E-3) gm.impliedWaste = 0;

    	this.greenMetrics.push(gm);
	}

	// figure out if two values are not in conflict
	private closeEnough(value1:number, value2:number):boolean
	{
		if (value1 <= 0 || value2 <= 0) return true;
		let ratio = value1 / value2;
		return ratio >= 0.99 && ratio <= 1.01;
	}
}

/* EOF */ }