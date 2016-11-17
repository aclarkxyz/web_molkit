/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../data/Molecule.ts'/>
///<reference path='../aspect/Experiment.ts'/>
///<reference path='../util/util.ts'/>

/*
	Quantity interconversions: for an Experiment entry, figure out all of the real-and-converted quantities, and
	mark them as such for convenient recall.
*/

class QuantityCalc
{
	/*protected Entry entry;

	public static final float UNSPECIFIED = -1;
	
	public static final int ROLE_PRIMARY = 1; // a reactant upon which ratios depend
	public static final int ROLE_SECONDARY = 2; // a stoichiometric reactant, intermediate or waste product
	public static final int ROLE_PRODUCT = 3; // a final product for which yield should be calculated
	public static final int ROLE_INDEPENDENT = 4; // a nonstoichiometric reagent or waste product

	public static final int STAT_UNKNOWN = 0; // no data, i.e. not provided and cannot be calculated
	public static final int STAT_ACTUAL = 1; // user-provided data
	public static final int STAT_VIRTUAL = 2; // calculated data
	public static final int STAT_CONFLICT = 3; // user-provided data that clashes
	
	public static final class QuantComp
	{
		public Component comp;
		public int step; // references the entry
		public int type; // one of RxnComponent.*
		public int idx; // index into in the entry source
		
		public int role = 0;
		public float molw = 0;
		public float valueEquiv = 0;
		public int statEquiv = STAT_UNKNOWN;
		public float valueMass = UNSPECIFIED;
		public int statMass = STAT_UNKNOWN;
		public float valueVolume = UNSPECIFIED;
		public int statVolume = STAT_UNKNOWN;
		public float valueMoles = UNSPECIFIED;
		public int statMoles = STAT_UNKNOWN;
		public float valueDensity = UNSPECIFIED;
		public int statDensity = STAT_UNKNOWN;
		public float valueConc = UNSPECIFIED;
		public int statConc = STAT_UNKNOWN;
		public float valueYield = UNSPECIFIED;
		public int statYield = STAT_UNKNOWN;
		
		public QuantComp(Component comp, int step, int type, int idx)		
		{
			this.comp = comp;
			this.step = step;
			this.type = type;
			this.idx = idx;
		}
	}
	protected List<QuantComp> quantities = new ArrayList<>();
	
	protected IntVector idxPrimary = new IntVector(), idxYield = new IntVector();
	protected FloatVector allMassReact = new FloatVector(), allMassProd = new FloatVector(), allMassWaste = new FloatVector();

	public class GreenMetrics
	{
		public int step = 0; // reaction step
		public int idx = 0; // index into the overall quantity list
		public float[] massReact = null, massProd = null, massWaste = null, massProdWaste = null;
		public float[] molwReact = null, molwProd = null;
		public float impliedWaste = 0;
		public boolean isBlank = false; // set to true if there's no content (blank entries can still be useful as placeholders)
	}
	protected List<GreenMetrics> greenMetrics = new ArrayList<>();*/

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
	
	/*
	// if the given reagent has a molecule with mapping numbers, checks to see if they line up with product(s), and derives stoichiometry from
	// there; a value of 0 means that nothing could be determined
	public static float impliedReagentStoich(Component reagent, Experiment.Component[] products)
	{
		if (MolUtil.isBlank(reagent.mol) || products.length == 0) return 0;
		
		float[] pstoich = Vec.floatArray(-1, products.length);
		Molecule rmol = reagent.mol;
		float highest = 0;
		
		for (int n = 1; n <= rmol.numAtoms(); n++)
		{
			int m = rmol.atomMapNum(n);
			if (m == 0) continue;
			float total = 0;
			for (int i = 0; i < products.length; i++)
			{
				Molecule pmol = products[i].mol;
				if (MolUtil.isBlank(pmol)) continue;
				
				int pcount = 0;
				for (int j = 1; j <= pmol.numAtoms(); j++) if (pmol.atomMapNum(j) == m) pcount++;
				if (pcount > 0)
				{
					int rcount = 0;
					for (int k = 1; k <= rmol.numAtoms(); k++) if (rmol.atomMapNum(k) == m) rcount++;
					if (pstoich[i] < 0) pstoich[i] = QuantityCalc.extractStoichValue(products[i].stoich);
					total += pcount * pstoich[i] / rcount;
				}
			}
			highest = Math.max(highest, total);
		}
		return highest;
	}
	
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

/*
	// fill in all the details
	public void calculate()
	{
		// the basic quantities: iteratively ifer everything possible
		classifyTypes();
		while (calculateSomething()) {}
		
		// work out green metrics, where applicable
		allMassReact.clear();
		allMassProd.clear();
		allMassWaste.clear();
		for (int n = 0; n < quantities.size(); n++)
    	{
    		QuantComp qc = quantities.get(n);
			if (qc.type == Reaction.REACTANT || qc.type == Reaction.REAGENT)
			{
				if (qc.valueEquiv == 0 && qc.type == Reaction.REAGENT) continue;
				allMassReact.add(qc.valueMass);
			}
			else if (qc.type == Reaction.PRODUCT)
			{
				if (!qc.comp.waste)
				{
					allMassProd.add(qc.valueMass);
					calculateGreenMetrics(n);
				}
				else
				{
					allMassWaste.add(qc.valueMass);
				}
			}
		}
	}

	// access to determined results
	public int numQuantities() {return quantities.size();}
	public QuantComp getQuantity(int N) {return quantities.get(N);}
	public QuantComp[] getAllQuantities() {return quantities.toArray(new QuantComp[quantities.size()]);}
	public int numGreenMetrics() {return greenMetrics.size();}
	public GreenMetrics getGreenMetrics(int N) {return greenMetrics.get(N);}
	public GreenMetrics[] getAllGreenMetrics() {return greenMetrics.toArray(new GreenMetrics[greenMetrics.size()]);}
	public float[] getAllMassReact() {return allMassReact.getData();}
	public float[] getAllMassProd() {return allMassProd.getData();}
	public float[] getAllMassWaste() {return allMassWaste.getData();}
	
	
	// convenience: locate a component somewhere within the entry
	public QuantComp findComponent(int step, int type, int idx)
	{
		for (QuantComp qc : quantities) if (qc.step == step && qc.type == type && qc.idx == idx) return qc;
		return null;
	}

	// convenience formatting tools, which pick appropriate units
	public static String formatMolWeight(double value)
    {
    	if (value == UNSPECIFIED) return "";
    	return Util.formatDouble(value,6) + " g/mol";
    }
	public static String formatMass(double value)
    {
    	if (value == UNSPECIFIED) return "";
    	if (value <= 1E-6) return Util.formatDouble(value*1E6,6) + " \u03BCg";
    	if (value <= 1E-3) return Util.formatDouble(value*1E3,6) + " mg";
    	if (value >= 1E3) return Util.formatDouble(value*1E-3,6) + " kg";
    	return Util.formatDouble(value,6) + " g";
    }
	public static String formatVolume(double value)
    {
		if (value == UNSPECIFIED) return "";
		if (value <= 1E-6) return Util.formatDouble(value * 1E6, 6) + " nL";
		if (value <= 1E-3) return Util.formatDouble(value * 1E3, 6) + " \u03BCL";
		if (value >= 1E3) return Util.formatDouble(value * 1E-3, 6) + " L";
		return Util.formatDouble(value, 6) + " mL";
    }
	public static String formatMoles(double value)
    {
		if (value == UNSPECIFIED) return "";
		if (value <= 1E-9) return Util.formatDouble(value * 1E9, 6) + " nmol";
		if (value <= 1E-6) return Util.formatDouble(value * 1E6, 6) + " \u03BCmol";
		if (value <= 1E-3) return Util.formatDouble(value * 1E3, 6) + " mmol";
		return Util.formatDouble(value, 6) + " mol";
    }
	public static String formatDensity(float value)
    {
		if (value == UNSPECIFIED) return "";
		return Util.formatDouble(value, 6) + " g/mL";
    }
	public static String formatConc(double value)
    {
		if (value == UNSPECIFIED) return "";
		if (value <= 1E-9) return Util.formatDouble(value * 1E9, 6) + " nmol/L";
		if (value <= 1E-6) return Util.formatDouble(value * 1E6, 6) + " \u03BCmol/L";
		if (value <= 1E-3) return Util.formatDouble(value * 1E3, 6) + " mmol/L";
		return Util.formatDouble(value, 6) + " mol/L";
    }
	public static String formatPercent(double value)
    {
		if (value == UNSPECIFIED) return "";
		return Util.formatDouble(value, 6) + " mol/L";
    }

	// ---------------- private methods -----------------

	// do a first pass of pulling out the raw data
	private void classifyTypes()
    {
    	for (int s = 0; s < entry.steps.length; s++)
		{
			Experiment.Step step = entry.steps[s];
			for (int n = 0; n < step.reactants.length; n++) quantities.add(new QuantComp(step.reactants[n], s, Reaction.REACTANT, n));
			for (int n = 0; n < step.reagents.length; n++) quantities.add(new QuantComp(step.reagents[n], s, Reaction.REAGENT, n));
			for (int n = 0; n < step.products.length; n++) quantities.add(new QuantComp(step.products[n], s, Reaction.PRODUCT, n));
		}

		// classify each component into roles, and fill in some basic properties
		for (int n = 0; n < quantities.size(); n++)
		{
			QuantComp qc = quantities.get(n);

			if (qc.type == Reaction.REAGENT)
			{
				if (qc.comp.equiv != null) qc.valueEquiv = qc.comp.equiv.floatValue();
				else
				{
					float eq = QuantityCalc.impliedReagentStoich(qc.comp, entry.steps[qc.step].products);
					if (eq > 0) qc.valueEquiv = eq;
				}
			}
			else
			{
				qc.valueEquiv = extractStoichValue(qc.comp.stoich);
			}
			
			if (qc.comp.mol != null) qc.molw = (float)MolUtil.molecularWeight(qc.comp.mol);
			
			qc.role = ROLE_INDEPENDENT;
			if (qc.step == 0 && qc.type == Reaction.REACTANT)
			{
				if (qc.comp.primary)
				{
					qc.role = ROLE_PRIMARY;
					idxPrimary.add(n);
				}
				else qc.role = ROLE_SECONDARY;
			}
			else if (qc.type == Reaction.REAGENT)
			{
				if (qc.valueEquiv > 0) qc.role = ROLE_SECONDARY;
			}
			else if (qc.type == Reaction.PRODUCT && !qc.comp.waste)
			{
				qc.role = ROLE_PRODUCT;
				idxYield.add(n);
			}
			else if (qc.valueEquiv > 0)
			{
				qc.role = ROLE_SECONDARY;
			}
			
			// fill in any user-specified values
			if (qc.comp.mass != null) qc.valueMass = qc.comp.mass.floatValue();
			if (qc.comp.volume != null) qc.valueVolume = qc.comp.volume.floatValue();
			if (qc.comp.moles != null) qc.valueMoles = qc.comp.moles.floatValue();
			if (qc.comp.density != null) qc.valueDensity = qc.comp.density.floatValue();
			if (qc.comp.conc != null) qc.valueConc = qc.comp.conc.floatValue();
			if (qc.comp.yield != null) qc.valueYield = qc.comp.yield.floatValue();
			
			qc.statEquiv = qc.valueEquiv == UNSPECIFIED ? STAT_UNKNOWN : STAT_ACTUAL;
			qc.statMass = qc.valueMass == UNSPECIFIED ? STAT_UNKNOWN : STAT_ACTUAL;
			qc.statVolume = qc.valueVolume == UNSPECIFIED ? STAT_UNKNOWN : STAT_ACTUAL;
			qc.statMoles = qc.valueMoles == UNSPECIFIED ? STAT_UNKNOWN : STAT_ACTUAL;
			qc.statDensity = qc.valueDensity == UNSPECIFIED ? STAT_UNKNOWN : STAT_ACTUAL;
			qc.statConc = qc.valueConc == UNSPECIFIED ? STAT_UNKNOWN : STAT_ACTUAL;
			qc.statYield = qc.valueYield == UNSPECIFIED ? STAT_UNKNOWN : STAT_ACTUAL;
		}

		// if no rate limiting reactants, pick everything from step 1
		if (idxPrimary.size() == 0)
		{
			for (int n = 0; n < quantities.size(); n++)
			{
				QuantComp qc = quantities.get(n);
				if (qc.type == Reaction.REACTANT && qc.step == 0)
				{
					qc.role = ROLE_PRIMARY;
					idxPrimary.add(n);
				}
			}
		}
    }
	
    // attempt to replace at least one unknown value with an inferred value; returns true if anything happened, which
    // signals that another round should be repeated, in case more possibilities come online
    private boolean calculateSomething()
    {
    	boolean anything = false;

		// ---- part 1: look for any interconversions that are internal to a component

		for (QuantComp qc : quantities)
		{
			// molar interconversion
			if (qc.molw > 0 && qc.valueMass == UNSPECIFIED && qc.statMoles == STAT_ACTUAL)
			{
				qc.valueMass = qc.valueMoles * qc.molw;
				qc.statMass = STAT_VIRTUAL;
				anything = true;
			}
			if (qc.molw > 0 && qc.valueMass != UNSPECIFIED && qc.valueMoles == UNSPECIFIED)
			{
				qc.valueMoles = qc.valueMass / qc.molw;
				qc.statMoles = STAT_VIRTUAL;
				anything = true;
			}
			if (qc.molw > 0 && qc.statMass == STAT_ACTUAL && qc.statMoles == STAT_ACTUAL)
			{
				float calcMoles = qc.valueMass / qc.molw;
				if (!closeEnough(qc.valueMoles, calcMoles))
				{
					qc.statMass = STAT_CONFLICT;
					qc.statMoles = STAT_CONFLICT;
				}
    		}
			
			boolean isSoln = qc.statConc == STAT_ACTUAL ||
					(qc.statVolume == STAT_ACTUAL && (qc.statMass == STAT_ACTUAL || qc.statMoles == STAT_ACTUAL));

    		// non solutions, mass/density/volume
    		if (!isSoln)
    		{
				if (qc.valueDensity > 0 && qc.valueMass == UNSPECIFIED && qc.valueVolume != UNSPECIFIED)
				{
					qc.valueMass = qc.valueVolume * qc.valueDensity;
					qc.statMass = STAT_VIRTUAL;
					anything = true;
				}
				if (qc.valueDensity > 0 && qc.valueMass != UNSPECIFIED && qc.valueVolume == UNSPECIFIED)
				{
					qc.valueVolume = qc.valueMass / qc.valueDensity;
					qc.statVolume = STAT_VIRTUAL;
					anything = true;
				}
				if (qc.valueDensity == UNSPECIFIED && qc.valueMass != UNSPECIFIED && qc.valueVolume != UNSPECIFIED && qc.valueConc == UNSPECIFIED)
				{
					if (qc.statMass == STAT_ACTUAL || qc.statMoles == STAT_ACTUAL) // don't guess density from stoichoimetry
					{
						qc.valueDensity = qc.valueMass / qc.valueVolume;
						qc.statDensity = STAT_VIRTUAL;
						anything = true;
					}
				}
    		}
    		
    		// solutions, moles/conc/volume
    		if (isSoln)
    		{
				if (qc.valueConc > 0 && qc.valueMoles == UNSPECIFIED && qc.valueVolume != UNSPECIFIED)
				{
					qc.valueMoles = 0.001f * qc.valueVolume * qc.valueConc;
					qc.statMoles = STAT_VIRTUAL;
					anything = true;
				}
				if (qc.valueConc > 0 && qc.valueMoles != UNSPECIFIED && qc.valueVolume == UNSPECIFIED)
				{
					qc.valueVolume = 1000 * qc.valueMoles / qc.valueConc;
					qc.statVolume = STAT_VIRTUAL;
					anything = true;
				}
				if (qc.valueConc == UNSPECIFIED && qc.valueMass != UNSPECIFIED && qc.valueVolume != UNSPECIFIED)
				{
					qc.valueConc = 1000 * qc.valueMoles / qc.valueVolume;
					qc.statConc = STAT_VIRTUAL;
					anything = true;
				}
				if (qc.statConc == STAT_ACTUAL && qc.valueMoles > 0 && qc.statVolume == STAT_ACTUAL)
				{
					float calcVolume = 1000 * qc.valueMoles / qc.valueConc;
					if (!closeEnough(qc.valueVolume, calcVolume))
					{
						qc.statConc = STAT_CONFLICT;
						if (qc.statMass == STAT_ACTUAL) qc.statMass = STAT_CONFLICT;
						if (qc.statMoles == STAT_ACTUAL) qc.statMoles = STAT_CONFLICT;
						qc.statVolume = STAT_CONFLICT;
					}
				}
    		}
			
			// calculating mass from virtual molar mass
			if (qc.molw > 0 && qc.valueMass == UNSPECIFIED && qc.valueMoles != UNSPECIFIED)
			{
				qc.valueMass = qc.valueMoles * qc.molw;
				qc.statMass = STAT_VIRTUAL;
				anything = true;
			}
			
    		// providing a concentration and density is disallowed
			if (qc.statDensity == STAT_ACTUAL && qc.statConc == STAT_ACTUAL)
			{
				qc.statDensity = STAT_CONFLICT;
				qc.statConc = STAT_CONFLICT;
			}
    	}
	
    	if (anything) return true; // want to make it cycle over all the reactants before moving on
    	
    	// ---- part 2: determine the molar quantity baseline, for each step, where applicable
    	
		boolean hasRef = false;
		int numSteps = entry.steps.length;
		float[] primaryCounts = Vec.floatArray(0, numSteps);
		float[] primaryEquivs = Vec.floatArray(0, numSteps);
		float[] primaryMoles = Vec.floatArray(0, numSteps);
    	
    	// go over components: first step uses reactants; next steps use products from previous
    	for (QuantComp qc : quantities)
		{
			int ref = -1;
			if (qc.step == 0 && qc.type == Reaction.REACTANT && qc.comp.primary) ref = qc.step;
			else if (qc.step < numSteps - 1 && qc.type == Reaction.PRODUCT && !qc.comp.waste) ref = qc.step + 1;
			else continue;
			if (primaryEquivs[ref] < 0) continue;
			
			if (qc.statMoles == STAT_UNKNOWN)
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
			for (int i : idxPrimary)
			{
				QuantComp qc = quantities.get(i);
				if (qc.statMoles == STAT_UNKNOWN)
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
		float[] refMoles = Vec.floatArray(0, numSteps);
		for (int n = 0; n < numSteps; n++)
		{
			refMoles[n] = primaryCounts[n] == 0 || primaryEquivs[n] <= 0 ? 0 : primaryMoles[n] / primaryEquivs[n];
			if (refMoles[n] > 0) hasRef = true;
		}

		// if no reference moles at all, try formulating some by making use of product quantities
		if (!hasRef)
		{
			for (int n = 0; n < numSteps; n++)
			{
				float[] prodMolar = null;
				for (QuantComp qc : quantities)
				{
					if (qc.step != n || qc.role != ROLE_PRODUCT) continue;
					if (qc.statMoles == STAT_UNKNOWN || qc.valueMoles <= 0 || qc.valueEquiv <= 0) continue;
					float yield = qc.valueYield > 0 ? qc.valueYield * 0.01f : 1;
					prodMolar = Vec.append(prodMolar, qc.valueMoles / (qc.valueEquiv * yield));
				}
				if (prodMolar != null)
				{
					refMoles[n] = Vec.sum(prodMolar) / prodMolar.length;
					hasRef = true;
				}
			}
		}
		
		if (!hasRef) return false; // can't do anything else
		
    	// ---- part 3: look for ways to apply the yield
		
		for (QuantComp qc : quantities)
		{
			if (qc.type != Reaction.PRODUCT) continue;
			
			if (refMoles[qc.step] == 0) continue;

			if (qc.valueYield == UNSPECIFIED && qc.valueMoles != UNSPECIFIED)
			{
				qc.valueYield = 100 * qc.valueMoles / (refMoles[qc.step] * qc.valueEquiv);
				qc.statYield = STAT_VIRTUAL;
				anything = true;
			}
			if (qc.valueYield != UNSPECIFIED && qc.valueMoles == UNSPECIFIED)
			{
				qc.valueMoles = qc.valueYield * 0.01f * (refMoles[qc.step] * qc.valueEquiv);
				qc.statMoles = STAT_VIRTUAL;
				anything = true;
			}
			if (qc.valueMoles > 0 && qc.statYield == STAT_ACTUAL)
			{
				float calcYield = 100 * qc.valueMoles / (refMoles[qc.step] * qc.valueEquiv);
				if (!closeEnough(qc.valueYield, calcYield))
				{
					if (qc.statMass == STAT_ACTUAL) qc.statMass = STAT_CONFLICT;
					if (qc.statMoles == STAT_ACTUAL) qc.statMoles = STAT_CONFLICT;
					qc.statYield = STAT_CONFLICT;
				}
    		}
    	}
    
    	if (anything) return true;
    	
    	// ---- part 4: look for stoichiometric components where molarity can be filled in

		for (QuantComp qc : quantities)
		{
			if (refMoles[qc.step] == 0) continue;

			if (qc.valueMass == UNSPECIFIED && qc.valueMoles == UNSPECIFIED && qc.valueEquiv > 0)
			{
				qc.valueMoles = refMoles[qc.step] * qc.valueEquiv;
				qc.statMoles = STAT_VIRTUAL;
				anything = true;
			}
			if (qc.valueMoles != UNSPECIFIED && qc.valueEquiv == UNSPECIFIED)
			{
				qc.valueEquiv = qc.valueMoles / refMoles[qc.step];
				qc.statEquiv = STAT_VIRTUAL;
				anything = true;
			}
		}

    	return anything;
    }

	// work out all available green metrics for a particular product index
	private void calculateGreenMetrics(int idx)
    {
    	QuantComp qc = quantities.get(idx);
    	GreenMetrics gm = new GreenMetrics();

		gm.step = qc.step;
		gm.idx = idx;
		gm.isBlank = true;
	
		for (int n = 0; n < quantities.size(); n++)
		{
			QuantComp sub = quantities.get(n);
			if (sub.step > gm.step) continue;
			
			float eq = sub.valueEquiv;
			if (eq == 0 && sub.type == Reaction.REAGENT) continue;

			if (sub.valueMass != UNSPECIFIED) gm.isBlank = false;
			
			if (sub.type == Reaction.REACTANT || sub.type == Reaction.REAGENT)
			{
				gm.massReact = Vec.append(gm.massReact, sub.valueMass);
				if (sub.step == gm.step && eq > 0 && sub.molw > 0) gm.molwReact = Vec.append(gm.molwReact, eq * sub.molw);
			}
			else if (sub.type == Reaction.PRODUCT)
			{
				if (!sub.comp.waste)
				{
					if (sub.step == gm.step) gm.massProd = Vec.append(gm.massProd, sub.valueMass);
					if (eq > 0 && sub.molw > 0)
					{
						if (sub.step == gm.step) gm.molwProd = Vec.append(gm.molwProd, eq * sub.molw);
						else if (sub.step == gm.step - 1) gm.molwReact = Vec.append(gm.molwReact, eq * sub.molw);
					}
				}
				else
				{
					gm.massWaste = Vec.append(gm.massWaste, sub.valueMass);
				}
				if (sub.step == gm.step) gm.massProdWaste = Vec.append(gm.massProdWaste, sub.valueMass);
			}
		}
		
		gm.impliedWaste = Vec.sum(gm.massReact) - Vec.sum(gm.massProdWaste);
		if (Math.abs(gm.impliedWaste) > 1E-3) gm.impliedWaste = 0;

    	greenMetrics.add(gm);
	}

	// figure out if two values are not in conflict
	private static boolean closeEnough(float value1, float value2)
	{
		if (value1 <= 0 || value2 <= 0) return true;
		float ratio = value1 / value2;
		return ratio >= 0.99 && ratio <= 1.01;
	}*/
}