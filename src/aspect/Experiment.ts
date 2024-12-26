/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='Aspect.ts'/>

import {DataSheet, DataSheetColumn} from '../ds/DataSheet';
import {Molecule} from '../mol/Molecule';
import {MolUtil} from '../mol/MolUtil';
import {ArrangeExperiment} from '../gfx/ArrangeExperiment';
import {OutlineMeasurement} from '../gfx/ArrangeMeasurement';
import {DrawExperiment} from '../gfx/DrawExperiment';
import {MetaVector} from '../gfx/MetaVector';
import {RenderPolicy} from '../gfx/Rendering';
import {Vec} from '../util/Vec';
import {Aspect, AspectGraphicRendering} from './Aspect';
import {registerAspect} from './AspectList';

/*
	Experiment aspect: transforms groups of rows from a datasheet into a collection of structures that make up a
	multistep reaction, along with accompanying quantities and other miscellaneous information.
*/

export enum ExperimentComponentType
{
	Reactant,
	Reagent,
	Product,
}

export class ExperimentComponent
{
	public mol:Molecule = null;
	public name = '';
	public stoich = '';
	public mass:number = null; // units: g
	public volume:number = null; // units: mL
	public moles:number = null; // units: mol
	public density:number = null; // units: g/mL
	public conc:number = null; // units: mol/L
	public yield:number = null; // products only; unit: %
	public primary = false; // reactants only
	public waste = false; // products only
	public equiv:number = null; // reagents only
	public meta = '';

	constructor(mol?:Molecule, name?:string)
	{
		this.mol = mol;
		if (name) this.name = name;
	}

	// makes a deep copy (assuming that molecules are treated as immutable)
	public clone():ExperimentComponent
	{
		let dup = new ExperimentComponent(this.mol, this.name);
		dup.stoich = this.stoich;
		dup.mass = this.mass;
		dup.volume = this.volume;
		dup.moles = this.moles;
		dup.density = this.density;
		dup.conc = this.conc;
		dup.yield = this.yield;
		dup.primary = this.primary;
		dup.waste = this.waste;
		dup.equiv = this.equiv;
		dup.meta = this.meta;
		return dup;
	}

	public equals(other:ExperimentComponent):boolean
	{
		if (this.name != other.name) return false;
		if (this.stoich != other.stoich || this.mass != other.mass || this.volume != other.volume || this.moles != other.moles ||
			this.density != other.density || this.conc != other.conc || this.yield != other.yield || this.primary != other.primary ||
			this.waste != other.waste || this.equiv != other.equiv || this.meta != other.meta) return false;
		if (this.mol === other.mol) return true; // if literally the same
		if (this.mol == null || other.mol == null) return false;
		return this.mol.compareTo(other.mol) == 0;
	}

	public isBlank():boolean
	{
		return MolUtil.isBlank(this.mol) && !this.name;
	}
}

export class ExperimentStep
{
	public reactants:ExperimentComponent[] = []; // non-blank only for the first step
	public reagents:ExperimentComponent[] = [];
	public products:ExperimentComponent[] = [];
	public meta = '';

	constructor() {}

	// makes a deep copy (assuming that molecules are treated as immutable)
	public clone():ExperimentStep
	{
		let dup = new ExperimentStep();
		for (let c of this.reactants) dup.reactants.push(c.clone());
		for (let c of this.reagents) dup.reagents.push(c.clone());
		for (let c of this.products) dup.products.push(c.clone());
		dup.meta = this.meta;
		return dup;
	}

	public equals(other:ExperimentStep):boolean
	{
		if (this.reactants.length != other.reactants.length) return false;
		if (this.reagents.length != other.reagents.length) return false;
		if (this.products.length != other.products.length) return false;
		if (this.meta != other.meta) return false;
		for (let n = 0; n < this.reactants.length; n++) if (!this.reactants[n].equals(other.reactants[n])) return false;
		for (let n = 0; n < this.reagents.length; n++) if (!this.reagents[n].equals(other.reagents[n])) return false;
		for (let n = 0; n < this.products.length; n++) if (!this.products[n].equals(other.products[n])) return false;
		return true;
	}
}

export class ExperimentEntry
{
	public title = '';
	public createDate:Date = null;
	public modifyDate:Date = null;
	public doi = '';
	public meta = '';

	public steps:ExperimentStep[] = [];

	constructor() {}

	// makes a deep copy (assuming that molecules are treated as immutable)
	public clone():ExperimentEntry
	{
		let dup = new ExperimentEntry();
		dup.title = this.title;
		dup.createDate = this.createDate;
		dup.modifyDate = this.modifyDate;
		dup.doi = this.doi;
		dup.meta = this.meta;
		for (let s of this.steps) dup.steps.push(s.clone());
		return dup;
	}

	// as above, but clones all the molecules too so they can be modified safely
	public deepClone():ExperimentEntry
	{
		let dup = this.clone();
		for (let step of dup.steps)
		{
			for (let comp of step.reactants) if (comp.mol != null) comp.mol = comp.mol.clone();
			for (let comp of step.reagents) if (comp.mol != null) comp.mol = comp.mol.clone();
			for (let comp of step.products) if (comp.mol != null) comp.mol = comp.mol.clone();
		}
		return dup;
	}

	public equals(other:ExperimentEntry):boolean
	{
		if (this.title != other.title) return false;
		let d1 = this.createDate == null ? 0 : this.createDate.getTime(), d2 = other.createDate == null ? 0 : other.createDate.getTime();
		if (d1 != d2) return false;
		let d3 = this.modifyDate == null ? 0 : this.modifyDate.getTime(), d4 = other.modifyDate == null ? 0 : other.modifyDate.getTime();
		if (d3 != d4) return false;
		if (this.doi != other.doi || this.meta != other.meta) return false;
		if (this.steps.length != other.steps.length) return false;
		for (let n = 0; n < this.steps.length; n++) if (!this.steps[n].equals(other.steps[n])) return false;
		return true;
	}

	// convenience: saves a switch
	public getComponent(step:number, type:ExperimentComponentType, idx:number):ExperimentComponent
	{
		if (type == ExperimentComponentType.Reactant) return this.steps[step].reactants[idx];
		if (type == ExperimentComponentType.Reagent) return this.steps[step].reagents[idx];
		if (type == ExperimentComponentType.Product) return this.steps[step].products[idx];
		return new ExperimentComponent();
	}
}

export class Experiment extends Aspect
{
	public static CODE = 'org.mmi.aspect.Experiment';
	public static CODE_RXN = 'org.mmi.aspect.Reaction';
	public static CODE_YLD = 'org.mmi.aspect.Yield';
	public static NAME = 'Experiment';
	public static NAME_RXN = 'Reaction';
	public static NAME_YLD = 'Yield';

	public static COLNAME_EXPERIMENT_TITLE = 'ExperimentTitle';
	public static COLNAME_EXPERIMENT_CREATEDATE = 'ExperimentCreateDate';
	public static COLNAME_EXPERIMENT_MODIFYDATE = 'ExperimentModifyDate';
	public static COLNAME_EXPERIMENT_DOI = 'ExperimentDOI';
	public static COLNAME_EXPERIMENT_META = 'ExperimentMeta';

	// prefixes for Steps
	public static COLNAME_STEP_META = 'ExperimentStepMeta';

	// prefixes for Reactants
	public static COLNAME_REACTANT_MOL = 'ReactantMol';
	public static COLNAME_REACTANT_NAME = 'ReactantName';
	public static COLNAME_REACTANT_STOICH = 'ReactantStoich';
	public static COLNAME_REACTANT_MASS = 'ReactantMass';
	public static COLNAME_REACTANT_VOLUME = 'ReactantVolume';
	public static COLNAME_REACTANT_MOLES = 'ReactantMoles';
	public static COLNAME_REACTANT_DENSITY = 'ReactantDensity';
	public static COLNAME_REACTANT_CONC = 'ReactantConc';
	public static COLNAME_REACTANT_PRIMARY = 'ReactantPrimary';
	public static COLNAME_REACTANT_META = 'ReactantMeta';

	// prefixes for Reagents
	public static COLNAME_REAGENT_MOL = 'ReagentMol';
	public static COLNAME_REAGENT_NAME = 'ReagentName';
	public static COLNAME_REAGENT_EQUIV = 'ReagentEquiv';
	public static COLNAME_REAGENT_MASS = 'ReagentMass';
	public static COLNAME_REAGENT_VOLUME = 'ReagentVolume';
	public static COLNAME_REAGENT_MOLES = 'ReagentMoles';
	public static COLNAME_REAGENT_DENSITY = 'ReagentDensity';
	public static COLNAME_REAGENT_CONC = 'ReagentConc';
	public static COLNAME_REAGENT_META = 'ReagentMeta';

	// prefixes for Products
	public static COLNAME_PRODUCT_MOL = 'ProductMol';
	public static COLNAME_PRODUCT_NAME = 'ProductName';
	public static COLNAME_PRODUCT_STOICH = 'ProductStoich';
	public static COLNAME_PRODUCT_MASS = 'ProductMass';
	public static COLNAME_PRODUCT_VOLUME = 'ProductVolume';
	public static COLNAME_PRODUCT_MOLES = 'ProductMoles';
	public static COLNAME_PRODUCT_DENSITY = 'ProductDensity';
	public static COLNAME_PRODUCT_CONC = 'ProductConc';
	public static COLNAME_PRODUCT_YIELD = 'ProductYield';
	public static COLNAME_PRODUCT_WASTE = 'ProductWaste';
	public static COLNAME_PRODUCT_META = 'ProductMeta';

	public static COLUMN_DESCRIPTIONS:Record<string, string> = {};

	public static ALL_COLUMN_LITERALS =
	[
		Experiment.COLNAME_EXPERIMENT_TITLE,
		Experiment.COLNAME_EXPERIMENT_CREATEDATE,
		Experiment.COLNAME_EXPERIMENT_MODIFYDATE,
		Experiment.COLNAME_EXPERIMENT_DOI,
		Experiment.COLNAME_EXPERIMENT_META,
		Experiment.COLNAME_STEP_META,
	];
	public static ALL_COLUMN_PREFIXES =
	[
		Experiment.COLNAME_REACTANT_MOL,
		Experiment.COLNAME_REACTANT_NAME,
		Experiment.COLNAME_REACTANT_STOICH,
		Experiment.COLNAME_REACTANT_MASS,
		Experiment.COLNAME_REACTANT_VOLUME,
		Experiment.COLNAME_REACTANT_MOLES,
		Experiment.COLNAME_REACTANT_DENSITY,
		Experiment.COLNAME_REACTANT_CONC,
		Experiment.COLNAME_REACTANT_PRIMARY,
		Experiment.COLNAME_REACTANT_META,
		Experiment.COLNAME_REAGENT_MOL,
		Experiment.COLNAME_REAGENT_NAME,
		Experiment.COLNAME_REAGENT_EQUIV,
		Experiment.COLNAME_REAGENT_MASS,
		Experiment.COLNAME_REAGENT_VOLUME,
		Experiment.COLNAME_REAGENT_MOLES,
		Experiment.COLNAME_REAGENT_DENSITY,
		Experiment.COLNAME_REAGENT_CONC,
		Experiment.COLNAME_REAGENT_META,
		Experiment.COLNAME_PRODUCT_MOL,
		Experiment.COLNAME_PRODUCT_NAME,
		Experiment.COLNAME_PRODUCT_STOICH,
		Experiment.COLNAME_PRODUCT_MASS,
		Experiment.COLNAME_PRODUCT_VOLUME,
		Experiment.COLNAME_PRODUCT_MOLES,
		Experiment.COLNAME_PRODUCT_DENSITY,
		Experiment.COLNAME_PRODUCT_CONC,
		Experiment.COLNAME_PRODUCT_YIELD,
		Experiment.COLNAME_PRODUCT_WASTE,
		Experiment.COLNAME_PRODUCT_META,
	];

	// ----------------- public methods -----------------

	// used to test if a datasheet has the appropriate metadata flagging it as a feedstock-containing datasheet
	public static isExperiment(ds:DataSheet):boolean
	{
		for (let n = 0; n < ds.numExtensions; n++) if (ds.getExtType(n) == Experiment.CODE) return true;
		return false;
	}

	constructor(ds?:DataSheet, allowModify?:boolean)
	{
		super(Experiment.CODE, ds, allowModify);

		if (Object.keys(Experiment.COLUMN_DESCRIPTIONS).length == 0)
		{
			let v = Experiment.COLUMN_DESCRIPTIONS;
			v[Experiment.COLNAME_EXPERIMENT_TITLE] = 'Title description for the experiment';
			v[Experiment.COLNAME_EXPERIMENT_CREATEDATE] = 'Date the experiment was created (seconds since 1970)';
			v[Experiment.COLNAME_EXPERIMENT_MODIFYDATE] = 'Date the experiment was last modified (seconds since 1970)';
			v[Experiment.COLNAME_EXPERIMENT_DOI] = 'Digital object identifiers (DOI) for the experiment (whitespace separated)';
			v[Experiment.COLNAME_EXPERIMENT_META] = 'Additional experiment metadata';
			v[Experiment.COLNAME_STEP_META] = 'Additional step metadata';
			v[Experiment.COLNAME_REACTANT_MOL] = 'Molecular structure of reactant';
			v[Experiment.COLNAME_REACTANT_NAME] = 'Name of reactant';
			v[Experiment.COLNAME_REACTANT_STOICH] = 'Stoichiometry of reactant';
			v[Experiment.COLNAME_REACTANT_MASS] = 'Mass quantity of reactant (g)';
			v[Experiment.COLNAME_REACTANT_VOLUME] = 'Volume quantity of reactant (mL)';
			v[Experiment.COLNAME_REACTANT_MOLES] = 'Molar quantity of reactant (mol)';
			v[Experiment.COLNAME_REACTANT_DENSITY] = 'Density of reactant (g/mL)';
			v[Experiment.COLNAME_REACTANT_CONC] = 'Concentration of reactant (mol/L)';
			v[Experiment.COLNAME_REACTANT_PRIMARY] = 'Whether the reactant is used for yield calculation';
			v[Experiment.COLNAME_REACTANT_META] = 'Additional reactant metadata';
			v[Experiment.COLNAME_REAGENT_MOL] = 'Molecular structure of reagent';
			v[Experiment.COLNAME_REAGENT_NAME] = 'Name of reagent';
			v[Experiment.COLNAME_REAGENT_EQUIV] = 'Molar equivalents of reagent';
			v[Experiment.COLNAME_REAGENT_MASS] = 'Mass quantity of reagent (g)';
			v[Experiment.COLNAME_REAGENT_VOLUME] = 'Volume quantity of reagent (mL)';
			v[Experiment.COLNAME_REAGENT_MOLES] = 'Molar quantity of reagent (mol)';
			v[Experiment.COLNAME_REAGENT_DENSITY] = 'Density of reagent (g/mL)';
			v[Experiment.COLNAME_REAGENT_CONC] = 'Concentration of reagent (mol/L)';
			v[Experiment.COLNAME_REAGENT_META] = 'Additional reagent metadata';
			v[Experiment.COLNAME_PRODUCT_MOL] = 'Molecular structure of product';
			v[Experiment.COLNAME_PRODUCT_NAME] = 'Name of product';
			v[Experiment.COLNAME_PRODUCT_STOICH] = 'Stoichiometry of product';
			v[Experiment.COLNAME_PRODUCT_MASS] = 'Mass quantity of reactant (g)';
			v[Experiment.COLNAME_PRODUCT_VOLUME] = 'Volume quantity of reactant (mL)';
			v[Experiment.COLNAME_PRODUCT_MOLES] = 'Molar quantity of reactant (mol)';
			v[Experiment.COLNAME_PRODUCT_DENSITY] = 'Density of reactant (g/mL)';
			v[Experiment.COLNAME_PRODUCT_CONC] = 'Concentration of reactant (mol/L)';
			v[Experiment.COLNAME_PRODUCT_YIELD] = 'Yield of product (%)';
			v[Experiment.COLNAME_PRODUCT_WASTE] = 'Whether the product is an unwanted byproduct';
			v[Experiment.COLNAME_PRODUCT_META] = 'Additional product metadata';
		}

		this.setup();
	}

	// returns true if the row is at the beginning of an experiment
	public isFirstStep(row:number):boolean
	{
		if (this.ds.notNull(row, Experiment.COLNAME_EXPERIMENT_CREATEDATE)) return true;
		let mol = this.ds.getMolecule(row, Experiment.COLNAME_REACTANT_MOL + '1');
		if (MolUtil.notBlank(mol)) return true;
		let name = this.ds.getString(row, Experiment.COLNAME_REACTANT_NAME + '1');
		if (name) return true;
		return false;
	}

	// starting at the given row, figure out how many rows ("steps") the reaction spans; always 1-or-more
	public numberOfSteps(row:number):number
	{
		if (row >= this.ds.numRows) return 0;
		let steps = 1;
		while (row + steps < this.ds.numRows)
		{
			if (this.isFirstStep(row + steps)) break;
			steps++;
		}
		return steps;
	}

	// data access
	public getEntry(row:number):ExperimentEntry
	{
		let entry = new ExperimentEntry();

		let title = this.ds.getString(row, Experiment.COLNAME_EXPERIMENT_TITLE);
		if (title) entry.title = title;
		let createDate = this.ds.getReal(row, Experiment.COLNAME_EXPERIMENT_CREATEDATE);
		if (createDate) entry.createDate = new Date(createDate * 1000);
		let modifyDate = this.ds.getReal(row, Experiment.COLNAME_EXPERIMENT_MODIFYDATE);
		if (modifyDate) entry.modifyDate = new Date(modifyDate * 1000);
		let doi = this.ds.getString(row, Experiment.COLNAME_EXPERIMENT_DOI);
		if (doi) entry.doi = doi;
		let meta = this.ds.getString(row, Experiment.COLNAME_EXPERIMENT_META);
		if (meta) entry.meta = meta;

		let [nreactants, nproducts, nreagents] = this.countComponents();

		for (let pos = row; pos < this.ds.numRows; pos++)
		{
			if (pos > row && this.isFirstStep(pos)) break;

			let step = new ExperimentStep();
			if (pos == row) for (let n = 1; n <= nreactants; n++)
			{
				let comp = this.fetchReactant(pos, n);
				if (comp != null) step.reactants.push(comp); else break;
			}
			for (let n = 1; n <= nproducts; n++)
			{
				let comp = this.fetchProduct(pos, n);
				if (comp != null) step.products.push(comp); else break;
			}
			for (let n = 1; n <= nreagents; n++)
			{
				let comp = this.fetchReagent(pos, n);
				if (comp != null) step.reagents.push(comp); else break;
			}
			step.meta = this.ds.getString(pos, Experiment.COLNAME_STEP_META);

			entry.steps.push(step);
		}

		return entry;
	}
	public setEntry(row:number, entry:ExperimentEntry):void
	{
		this.putEntry(row, entry, true);
	}
	public addEntry(entry:ExperimentEntry):void
	{
		this.putEntry(this.ds.numRows, entry, false);
	}
	public insertEntry(row:number, entry:ExperimentEntry):void
	{
		this.putEntry(row, entry, false);
	}
	public deleteEntry(row:number):void
	{
		let nsteps = this.numberOfSteps(row);
		for (let n = row + nsteps - 1; n >= row; n--) this.ds.deleteRow(n);
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
		let ds = this.ds;
		let idxRxn = -1, idxYld = -1, idxExp = -1;
		let extRxn = '', extYld = '', extExp = '';
		for (let n = 0; n < ds.numExtensions; n++)
		{
			if (ds.getExtType(n) == Experiment.CODE_RXN) {idxRxn = n; extRxn = ds.getExtData(n);}
			else if (ds.getExtType(n) == Experiment.CODE_YLD) {idxYld = n; extYld = ds.getExtData(n);}
			else if (ds.getExtType(n) == Experiment.CODE) {idxExp = n; extExp = ds.getExtData(n);}
		}

		// note: the implied Reaction aspect is the only metadata field that actually holds content
		let [nreactants, nproducts, nreagents] = this.parseReactionMetaData(extRxn);
		let meta = `nreactants=${nreactants}\nnproducts=${nproducts}\nnreagents=${nreagents}\n`;
		if (idxRxn >= 0) ds.setExtData(idxRxn, meta); else ds.appendExtension(Experiment.NAME_RXN, Experiment.CODE_RXN, meta);
		if (idxYld >= 0) ds.setExtData(idxYld, ''); else ds.appendExtension(Experiment.NAME_YLD, Experiment.CODE_YLD, '');
		if (idxExp >= 0) ds.setExtData(idxExp, ''); else ds.appendExtension(Experiment.NAME, Experiment.CODE, '');

		this.forceColumn(Experiment.COLNAME_EXPERIMENT_TITLE, DataSheetColumn.String);
		this.forceColumn(Experiment.COLNAME_EXPERIMENT_CREATEDATE, DataSheetColumn.Real);
		this.forceColumn(Experiment.COLNAME_EXPERIMENT_MODIFYDATE, DataSheetColumn.Real);
		this.forceColumn(Experiment.COLNAME_EXPERIMENT_DOI, DataSheetColumn.String);
		this.forceColumn(Experiment.COLNAME_EXPERIMENT_META, DataSheetColumn.String);

		this.forceColumn(Experiment.COLNAME_STEP_META, DataSheetColumn.String);

		for (let n = 1; n <= nreactants; n++) this.forceReactantColumns(n);
		for (let n = 1; n <= nreagents; n++) this.forceReagentColumns(n);
		for (let n = 1; n <= nproducts; n++) this.forceProductColumns(n);
	}

	// force-adds respective groups of columns as necessary
	private forceColumn(colName:string, type:DataSheetColumn, suffix?:number):void
	{
		let useName = colName + (suffix == null ? '' : suffix);
		this.ds.ensureColumn(useName, type, Experiment.COLUMN_DESCRIPTIONS[colName]);
	}
	private forceReactantColumns(suffix:number):void
	{
		this.forceColumn(Experiment.COLNAME_REACTANT_MOL, DataSheetColumn.Molecule, suffix);
		this.forceColumn(Experiment.COLNAME_REACTANT_NAME, DataSheetColumn.String, suffix);
		this.forceColumn(Experiment.COLNAME_REACTANT_STOICH, DataSheetColumn.String, suffix);
		this.forceColumn(Experiment.COLNAME_REACTANT_MASS, DataSheetColumn.Real, suffix);
		this.forceColumn(Experiment.COLNAME_REACTANT_VOLUME, DataSheetColumn.Real, suffix);
		this.forceColumn(Experiment.COLNAME_REACTANT_MOLES, DataSheetColumn.Real, suffix);
		this.forceColumn(Experiment.COLNAME_REACTANT_DENSITY, DataSheetColumn.Real, suffix);
		this.forceColumn(Experiment.COLNAME_REACTANT_CONC, DataSheetColumn.Real, suffix);
		this.forceColumn(Experiment.COLNAME_REACTANT_PRIMARY, DataSheetColumn.Boolean, suffix);
		this.forceColumn(Experiment.COLNAME_REACTANT_META, DataSheetColumn.String, suffix);
	}
	private forceReagentColumns(suffix:number):void
	{
		this.forceColumn(Experiment.COLNAME_REAGENT_MOL, DataSheetColumn.Molecule, suffix);
		this.forceColumn(Experiment.COLNAME_REAGENT_NAME, DataSheetColumn.String, suffix);
		this.forceColumn(Experiment.COLNAME_REAGENT_EQUIV, DataSheetColumn.Real, suffix);
		this.forceColumn(Experiment.COLNAME_REAGENT_MASS, DataSheetColumn.Real, suffix);
		this.forceColumn(Experiment.COLNAME_REAGENT_VOLUME, DataSheetColumn.Real, suffix);
		this.forceColumn(Experiment.COLNAME_REAGENT_MOLES, DataSheetColumn.Real, suffix);
		this.forceColumn(Experiment.COLNAME_REAGENT_DENSITY, DataSheetColumn.Real, suffix);
		this.forceColumn(Experiment.COLNAME_REAGENT_CONC, DataSheetColumn.Real, suffix);
		this.forceColumn(Experiment.COLNAME_REAGENT_META, DataSheetColumn.String, suffix);
	}
	private forceProductColumns(suffix:number):void
	{
		this.forceColumn(Experiment.COLNAME_PRODUCT_MOL, DataSheetColumn.Molecule, suffix);
		this.forceColumn(Experiment.COLNAME_PRODUCT_NAME, DataSheetColumn.String, suffix);
		this.forceColumn(Experiment.COLNAME_PRODUCT_STOICH, DataSheetColumn.String, suffix);
		this.forceColumn(Experiment.COLNAME_PRODUCT_MASS, DataSheetColumn.Real, suffix);
		this.forceColumn(Experiment.COLNAME_PRODUCT_VOLUME, DataSheetColumn.Real, suffix);
		this.forceColumn(Experiment.COLNAME_PRODUCT_MOLES, DataSheetColumn.Real, suffix);
		this.forceColumn(Experiment.COLNAME_PRODUCT_DENSITY, DataSheetColumn.Real, suffix);
		this.forceColumn(Experiment.COLNAME_PRODUCT_CONC, DataSheetColumn.Real, suffix);
		this.forceColumn(Experiment.COLNAME_PRODUCT_YIELD, DataSheetColumn.Real, suffix);
		this.forceColumn(Experiment.COLNAME_PRODUCT_WASTE, DataSheetColumn.Boolean, suffix);
		this.forceColumn(Experiment.COLNAME_PRODUCT_META, DataSheetColumn.String, suffix);
	}

	private parseReactionMetaData(content:string):[number, number, number]
	{
		let nreactants = 1, nproducts = 1, nreagents = 0;

		for (let line of content.split(/\r?\n/))
		{
			if (line.startsWith('nreactants=')) nreactants = Math.max(nreactants, Math.min(100, parseInt(line.substring(11))));
			else if (line.startsWith('nproducts=')) nproducts = Math.max(nproducts, Math.min(100, parseInt(line.substring(10))));
			else if (line.startsWith('nreagents=')) nreagents = Math.max(nreagents, Math.min(100, parseInt(line.substring(10))));
		}

		return [nreactants, nproducts, nreagents];
	}

	// more convenient version of above which scans the header; for routine use, post-setup
	private countComponents():[number, number, number]
	{
		let nreactants = 0, nproducts = 0, nreagents = 0;
		for (let n = 0; n < this.ds.numExtensions; n++) if (this.ds.getExtType(n) == Experiment.CODE_RXN)
		{
			[nreactants, nproducts, nreagents] = this.parseReactionMetaData(this.ds.getExtData(n));
			break;
		}
		return [nreactants, nproducts, nreagents];
	}

	// pulls out the respective component types from the underlying fields
	private fetchReactant(row:number, idx:number):ExperimentComponent
	{
		let mol = this.ds.getMoleculeClone(row, `${Experiment.COLNAME_REACTANT_MOL}${idx}`);
		let name = this.ds.getString(row, `${Experiment.COLNAME_REACTANT_NAME}${idx}`);
		if (MolUtil.isBlank(mol) && !name) return null;

		let comp = new ExperimentComponent(mol, name);
		let stoich = this.ds.getString(row, `${Experiment.COLNAME_REACTANT_STOICH}${idx}`);
		if (stoich) comp.stoich = stoich;
		comp.mass = this.ds.getReal(row, `${Experiment.COLNAME_REACTANT_MASS}${idx}`);
		comp.volume = this.ds.getReal(row, `${Experiment.COLNAME_REACTANT_VOLUME}${idx}`);
		comp.moles = this.ds.getReal(row, `${Experiment.COLNAME_REACTANT_MOLES}${idx}`);
		comp.density = this.ds.getReal(row, `${Experiment.COLNAME_REACTANT_DENSITY}${idx}`);
		comp.conc = this.ds.getReal(row, `${Experiment.COLNAME_REACTANT_CONC}${idx}`);
		let primary = this.ds.getBoolean(row, `${Experiment.COLNAME_REACTANT_PRIMARY}${idx}`);
		if (primary != null) comp.primary = primary;
		comp.meta = this.ds.getString(row, `${Experiment.COLNAME_REACTANT_META}${idx}`);
		return comp;
	}
	private fetchProduct(row:number, idx:number):ExperimentComponent
	{
		let mol = this.ds.getMoleculeClone(row, `${Experiment.COLNAME_PRODUCT_MOL}${idx}`);
		let name = this.ds.getString(row, `${Experiment.COLNAME_PRODUCT_NAME}${idx}`);
		if (MolUtil.isBlank(mol) && !name) return null;

		let comp = new ExperimentComponent(mol, name);
		let stoich = this.ds.getString(row, `${Experiment.COLNAME_PRODUCT_STOICH}${idx}`);
		if (stoich) comp.stoich = stoich;
		comp.mass = this.ds.getReal(row, `${Experiment.COLNAME_PRODUCT_MASS}${idx}`);
		comp.volume = this.ds.getReal(row, `${Experiment.COLNAME_PRODUCT_VOLUME}${idx}`);
		comp.moles = this.ds.getReal(row, `${Experiment.COLNAME_PRODUCT_MOLES}${idx}`);
		comp.density = this.ds.getReal(row, `${Experiment.COLNAME_PRODUCT_DENSITY}${idx}`);
		comp.conc = this.ds.getReal(row, `${Experiment.COLNAME_PRODUCT_CONC}${idx}`);
		comp.yield = this.ds.getReal(row, `${Experiment.COLNAME_PRODUCT_YIELD}${idx}`);
		let waste = this.ds.getBoolean(row, `${Experiment.COLNAME_PRODUCT_WASTE}${idx}`);
		if (waste != null) comp.waste = waste;
		comp.meta = this.ds.getString(row, `${Experiment.COLNAME_PRODUCT_META}${idx}`);
		return comp;
	}
	private fetchReagent(row:number, idx:number):ExperimentComponent
	{
		let mol = this.ds.getMoleculeClone(row, `${Experiment.COLNAME_REAGENT_MOL}${idx}`);
		let name = this.ds.getString(row, `${Experiment.COLNAME_REAGENT_NAME}${idx}`);
		if (MolUtil.isBlank(mol) && !name) return null;

		let comp = new ExperimentComponent(mol, name);
		comp.mass = this.ds.getReal(row, `${Experiment.COLNAME_REAGENT_MASS}${idx}`);
		comp.volume = this.ds.getReal(row, `${Experiment.COLNAME_REAGENT_VOLUME}${idx}`);
		comp.moles = this.ds.getReal(row, `${Experiment.COLNAME_REAGENT_MOLES}${idx}`);
		comp.density = this.ds.getReal(row, `${Experiment.COLNAME_REAGENT_DENSITY}${idx}`);
		comp.conc = this.ds.getReal(row, `${Experiment.COLNAME_REAGENT_CONC}${idx}`);
		comp.equiv = this.ds.getReal(row, `${Experiment.COLNAME_REAGENT_EQUIV}${idx}`);
		comp.meta = this.ds.getString(row, `${Experiment.COLNAME_REAGENT_META}${idx}`);
		return comp;
	}

	// returns the list of operations needed to "set" an entry: this may involve adjusting columns, modifying extensions,
	// and deleting/inserting rows... as well as replacing cell content
	private putEntry(row:number, entry:ExperimentEntry, replace:boolean):void
	{
		// make sure the metadata is in place
		let [preactants, pproducts, preagents] = this.countComponents();
		let [nreactants, nproducts, nreagents] = [preactants, pproducts, preagents];
		for (let step of entry.steps)
		{
			nreactants = Math.max(nreactants, step.reactants.length);
			nproducts = Math.max(nproducts, step.products.length);
			nreagents = Math.max(nreagents, step.reagents.length);
		}
		if (nreactants != preactants || nproducts != pproducts || nreagents != preagents)
		{
			let meta = `nreactants=${nreactants}\nnproducts=${nproducts}\nnreagents=${nreagents}`;
			let got = false;
			for (let n = 0; n < this.ds.numExtensions; n++) if (this.ds.getExtType(n) == Experiment.CODE_RXN)
			{
				this.ds.setExtData(n, meta);
				got = true;
				break;
			}
			if (!got) this.ds.appendExtension(Experiment.NAME_RXN, Experiment.CODE_RXN, meta);
		}

		// make sure all columns are present and of the right type
		for (let n = 1; n <= nreactants; n++) this.forceReactantColumns(n);
		for (let n = 1; n <= nreagents; n++) this.forceReagentColumns(n);
		for (let n = 1; n <= nproducts; n++) this.forceProductColumns(n);

		// sync up the number of steps, if necessary
		let oldSteps = replace ? this.numberOfSteps(row) : 0, newSteps = entry.steps.length;
		if (oldSteps > newSteps)
		{
			for (let n = newSteps; n < oldSteps; n++) this.ds.deleteRow(row + newSteps - 1);
		}
		else if (newSteps > oldSteps)
		{
			for (let n = oldSteps; n < newSteps; n++) this.ds.insertRow(row + oldSteps);
		}

		// emit the header
		this.ds.setString(row, Experiment.COLNAME_EXPERIMENT_TITLE, entry.title);
		this.ds.setReal(row, Experiment.COLNAME_EXPERIMENT_CREATEDATE, entry.createDate == null ? null : entry.createDate.getTime() * 1E-3);
		this.ds.setReal(row, Experiment.COLNAME_EXPERIMENT_MODIFYDATE, entry.modifyDate == null ? null : entry.modifyDate.getTime() * 1E-3);
		this.ds.setString(row, Experiment.COLNAME_EXPERIMENT_DOI, entry.doi);
		this.ds.setString(row, Experiment.COLNAME_EXPERIMENT_META, entry.meta);

		// emit the steps and components
		for (let s = 0; s < entry.steps.length; s++)
		{
			let r = row + s, step = entry.steps[s];
			if (s == 0) for (let n = 0; n < step.reactants.length; n++)
			{
				let comp = step.reactants[n], i = n + 1;
				this.ds.setMolecule(r, `${Experiment.COLNAME_REACTANT_MOL}${i}`, comp.mol);
				this.ds.setString(r, `${Experiment.COLNAME_REACTANT_NAME}${i}`, comp.name);
				this.ds.setString(r, `${Experiment.COLNAME_REACTANT_STOICH}${i}`, comp.stoich);
				this.ds.setReal(r, `${Experiment.COLNAME_REACTANT_MASS}${i}`, comp.mass);
				this.ds.setReal(r, `${Experiment.COLNAME_REACTANT_VOLUME}${i}`, comp.volume);
				this.ds.setReal(r, `${Experiment.COLNAME_REACTANT_MOLES}${i}`, comp.moles);
				this.ds.setReal(r, `${Experiment.COLNAME_REACTANT_DENSITY}${i}`, comp.density);
				this.ds.setReal(r, `${Experiment.COLNAME_REACTANT_CONC}${i}`, comp.conc);
				this.ds.setBoolean(r, `${Experiment.COLNAME_REACTANT_PRIMARY}${i}`, comp.primary);
				this.ds.setString(r, `${Experiment.COLNAME_REACTANT_META}${i}`, comp.meta);
			}
			for (let n = 0; n < step.reagents.length; n++)
			{
				let comp = step.reagents[n], i = n + 1;
				this.ds.setMolecule(r, `${Experiment.COLNAME_REAGENT_MOL}${i}`, comp.mol);
				this.ds.setString(r, `${Experiment.COLNAME_REAGENT_NAME}${i}`, comp.name);
				this.ds.setReal(r, `${Experiment.COLNAME_REAGENT_EQUIV}${i}`, comp.equiv);
				this.ds.setReal(r, `${Experiment.COLNAME_REAGENT_MASS}${i}`, comp.mass);
				this.ds.setReal(r, `${Experiment.COLNAME_REAGENT_VOLUME}${i}`, comp.volume);
				this.ds.setReal(r, `${Experiment.COLNAME_REAGENT_MOLES}${i}`, comp.moles);
				this.ds.setReal(r, `${Experiment.COLNAME_REAGENT_DENSITY}${i}`, comp.density);
				this.ds.setReal(r, `${Experiment.COLNAME_REAGENT_CONC}${i}`, comp.conc);
				this.ds.setString(r, `${Experiment.COLNAME_REAGENT_META}${i}`, comp.meta);
			}
			for (let n = 0; n < step.products.length; n++)
			{
				let comp = step.products[n], i = n + 1;
				this.ds.setMolecule(r, `${Experiment.COLNAME_PRODUCT_MOL}${i}`, comp.mol);
				this.ds.setString(r, `${Experiment.COLNAME_PRODUCT_NAME}${i}`, comp.name);
				this.ds.setString(r, `${Experiment.COLNAME_PRODUCT_STOICH}${i}`, comp.stoich);
				this.ds.setReal(r, `${Experiment.COLNAME_PRODUCT_MASS}${i}`, comp.mass);
				this.ds.setReal(r, `${Experiment.COLNAME_PRODUCT_VOLUME}${i}`, comp.volume);
				this.ds.setReal(r, `${Experiment.COLNAME_PRODUCT_MOLES}${i}`, comp.moles);
				this.ds.setReal(r, `${Experiment.COLNAME_PRODUCT_DENSITY}${i}`, comp.density);
				this.ds.setReal(r, `${Experiment.COLNAME_PRODUCT_CONC}${i}`, comp.conc);
				this.ds.setReal(r, `${Experiment.COLNAME_PRODUCT_YIELD}${i}`, comp.yield);
				this.ds.setBoolean(r, `${Experiment.COLNAME_PRODUCT_WASTE}${i}`, comp.waste);
				this.ds.setString(r, `${Experiment.COLNAME_PRODUCT_META}${i}`, comp.meta);
			}
			this.ds.setString(r, Experiment.COLNAME_STEP_META, step.meta);
		}

		// trash anything beyond the incoming limits
		for (let s = 0; s < entry.steps.length; s++)
		{
			let r = row + s;
			let start = s > 0 ? 0 : entry.steps[s].reactants.length;
			for (let n = start; n < nreactants; n++)
			{
				let i = n + 1;
				this.ds.setToNull(r, `${Experiment.COLNAME_REACTANT_MOL}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_REACTANT_NAME}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_REACTANT_STOICH}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_REACTANT_MASS}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_REACTANT_VOLUME}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_REACTANT_MOLES}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_REACTANT_DENSITY}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_REACTANT_CONC}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_REACTANT_PRIMARY}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_REACTANT_META}${i}`);
			}
			for (let n = entry.steps[s].reagents.length; n < nreagents; n++)
			{
				let i = n + 1;
				this.ds.setToNull(r, `${Experiment.COLNAME_REAGENT_MOL}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_REAGENT_NAME}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_REAGENT_EQUIV}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_REAGENT_MASS}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_REAGENT_VOLUME}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_REAGENT_MOLES}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_REAGENT_DENSITY}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_REAGENT_CONC}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_REAGENT_META}${i}`);
			}
			for (let n = entry.steps[s].products.length; n < nproducts; n++)
			{
				let i = n + 1;
				this.ds.setToNull(r, `${Experiment.COLNAME_PRODUCT_MOL}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_PRODUCT_NAME}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_PRODUCT_STOICH}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_PRODUCT_MASS}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_PRODUCT_VOLUME}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_PRODUCT_MOLES}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_PRODUCT_DENSITY}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_PRODUCT_CONC}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_PRODUCT_WASTE}${i}`);
				this.ds.setToNull(r, `${Experiment.COLNAME_PRODUCT_META}${i}`);
			}
		}
	}

	// ------------------ aspect implementation --------------------

	public plainHeading():string {return Experiment.NAME;}

	public rowFirstBlock(row:number):boolean {return this.isFirstStep(row);}
	public rowBlockCount(row:number):number {return this.numberOfSteps(row);}

	public initiateNewRow(row:number):void
	{
		let curTime = new Date().getTime() * 1E-3;
		this.ds.setReal(row, Experiment.COLNAME_EXPERIMENT_CREATEDATE, curTime);
	}

	public columnEffectivelyBlank(row:number):string[]
	{
		return [Experiment.COLNAME_EXPERIMENT_CREATEDATE];
	}

	public isColumnReserved(colName:string):boolean
	{
		return this.areColumnsReserved([colName])[0];
	}

	public areColumnsReserved(colNames:string[]):boolean[]
	{
		let resv = Vec.booleanArray(false, colNames.length);
		for (let n = 0; n < colNames.length; n++)
		{
			let name = colNames[n];
			if (Experiment.ALL_COLUMN_LITERALS.indexOf(name) >= 0)
			{
				resv[n] = true;
				continue;
			}
			for (let pfx of Experiment.ALL_COLUMN_PREFIXES) if (name.startsWith(pfx))
			{
				resv[n] = true;
				break;
			}
		}

		return resv;
	}

	// render the experiment in scheme form
	// TODO: other forms can be rendered (summary, metrics, quantity)
	public numGraphicRenderings(row:number):number {return 1;}
	public produceGraphicRendering(row:number, idx:number, policy:RenderPolicy):AspectGraphicRendering
	{
		let measure = new OutlineMeasurement(0, 0, policy.data.pointScale);
		let layout = new ArrangeExperiment(this.getEntry(row), measure, policy);
		layout.limitTotalW = 50 * policy.data.pointScale;
		layout.limitTotalH = 50 * policy.data.pointScale;
		layout.includeStoich = true;
		layout.includeAnnot = false;

		layout.arrange();

		let metavec = new MetaVector();
		new DrawExperiment(layout, metavec).draw();
		metavec.normalise();

		return {name: 'Scheme', metavec: metavec};
	}

/*	open override func numTextRenderings(row:Int) -> Int {return 1}
	open override func produceTextRendering(row:Int, idx:Int) -> (name:String, descr:String, text:String)
	{
		var retName = "", retDescr = "", retText = ""
		data.observe() {(ds:DataSheet) in (retName, retDescr, retText) = self.produceTextRendering(row:row, idx:idx, ds:ds)}
		return (name:retName, descr:retDescr, text:retText)
	}
	open override func produceTextRendering(row:Int, idx:Int, ds:DataSheet) -> (name:String, descr:String, text:String)
	{
		assert(idx == 0, "Invalid index to Experiment.produceTextRendering")

		let entry = getEntry(row, ds:ds)
		var lines:[String] = []

		if !entry.title.isEmpty {lines.append("Title: \(entry.title)")}

		let datefmt = DateFormatter()
		datefmt.dateStyle = .medium
		datefmt.timeStyle = .medium

		if let createDate = entry.createDate {lines.append("Created: \(datefmt.string(from:createDate))")}
		if let modifyDate = entry.modifyDate {lines.append("Modified: \(datefmt.string(from:modifyDate))")}

		if !entry.doi.isEmpty {lines.append("DOI: \(entry.doi)")}

		let txt = lines.joined(separator:"\n")

		return (name:"Header", descr:"Experiment description and metadata", text:txt)
	}

	open override func numGraphicRenderings(row:Int) -> Int {return 3}
	open override func produceGraphicRendering(row:Int, idx:Int, policy:RenderPolicy, vg:VectorGfxBuilder) -> (name:String, vg:VectorGfxBuilder)
	{
		var retName = "", retVG = vg
		data.observe() {(ds:DataSheet) in (retName, retVG) = self.produceGraphicRendering(row:row, idx:idx, policy:policy, vg:vg, ds:ds)}
		return (name:retName, vg:retVG)
	}
	open override func produceGraphicRendering(row:Int, idx:Int, policy:RenderPolicy, vg:VectorGfxBuilder, ds:DataSheet) -> (name:String, vg:VectorGfxBuilder)
	{
		if idx == Render.Scheme
		{
			let entry = getEntry(row, ds:ds)
			let layout = ArrangeExperiment(entry:entry, measure:OutlineMeasurement(scale:policy.pointScale, yUp:false), policy:policy)

			layout.limitTotalW = 50 * policy.pointScale
			layout.limitTotalH = 50 * policy.pointScale
			layout.arrange()

			//vg.drawLine(x1:0, y1:0, x2:layout.width, y2:layout.height, colour:0xFF0000, thickness:1)
			let vgexp = DrawExperiment(layout:layout, vg:vg)
			vgexp.draw()

			return (name:"Scheme", vg:vg)
		}
		else if idx == Render.Quantity
		{
			let entry = getEntry(row, ds:ds)
			let layout = ArrangeExpQuant(entry:entry, measure:OutlineMeasurement(scale:policy.pointScale, yUp:false), policy:policy)
			layout.idealAspect = 1.4
			layout.arrange()
			layout.render(vg)
		}
		else if idx == Render.Metrics
		{
			let entry = getEntry(row, ds:ds)
			let layout = ArrangeExpMetrics(entry:entry, measure:OutlineMeasurement(scale:policy.pointScale, yUp:false), policy:policy)
			layout.idealAspect = 1.4
			layout.arrange()
			layout.render(vg)
		}
		return (name:"", vg:vg)
	}*/
}

registerAspect(Experiment);

