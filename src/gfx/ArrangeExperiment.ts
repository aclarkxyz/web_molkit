/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {ExperimentComponent, ExperimentComponentType, ExperimentEntry} from '../aspect/Experiment';
import {ExperimentMeta, ExperimentMetaApplic} from '../rxn/ExperimentMeta';
import {Molecule} from '../mol/Molecule';
import {MolUtil} from '../mol/MolUtil';
import {QuantityCalc} from '../rxn/QuantityCalc';
import {Box, Pos, Size} from '../util/Geom';
import {realEqual} from '../util/util';
import {Vec} from '../util/Vec';
import {ArrangeMeasurement} from './ArrangeMeasurement';
import {ArrangeMolecule} from './ArrangeMolecule';
import {FontData} from './FontData';
import {RenderPolicy} from './Rendering';

/*
	Performs the layout of an experiment, which is a reaction that may be multistep, and contains a variety of
	optional annotations. The flow may be arranged from left-to-right or some combination of horizontal and vertical.

	There are various tweaks for things that can be included or left out. The default settings reflect the default chemistry
	rendering style, i.e. annotations and editing artifacts are not included.

	Component characteristics such as quantities, and derived properties such as green metrics, are not a part of
	the layout.
*/

export enum ArrangeComponentType
{
	Arrow = 1, // side separator (horizontal or vertical)
	Plus = 2, // component separator
	Reactant = 3, // primary reactant: molecule or name
	Reagent = 4, // primary reagent: molecule or name
	Product = 5, // primary product: molecule or name
	StepNote = 6, // additional information about the step (e.g. rxn conditions)
}

export enum ArrangeComponentAnnot
{
	None = 0,
	Primary = 1,
	Waste = 2,
	Implied = 3,
}

export class ArrangeComponent
{
	public type:ArrangeComponentType;
	public srcIdx:number; // index in underlying reactionsheet (i.e. reactants/reagents/products[srcIdx])
	public step:number;	// which step it belongs to
	public side:number; // which side of the reaction (-1=left, 1=right, 0=middle)
	public mol:Molecule; // molecule content, if applicable
	public text:string[] = []; // text content, if applicable
	public leftNumer:string; // // to the left of the structure: may be {n}/{d} form
	public leftDenom:string;
	public fszText:number; // text font sizes, if applicable
	public fszLeft:number;
	public annot = ArrangeComponentAnnot.None; // annotation glyph on the right
	public monochromeColour:number = null; // cause the rendering to be done in a specific colour
	public metaInfo:Record<string, any> = null; // user-controlled
	public box = new Box(); // bounding box
	public padding:number; // how much padding around the outer boundary

	public clone():ArrangeComponent
	{
		let dup = new ArrangeComponent();
		dup.type = this.type;
		dup.srcIdx = this.srcIdx;
		dup.step = this.step;
		dup.side = this.side;
		dup.mol = this.mol;
		dup.text = this.text;
		dup.leftNumer = this.leftNumer;
		dup.leftDenom = this.leftDenom;
		dup.fszText = this.fszText;
		dup.fszLeft = this.fszLeft;
		dup.annot = this.annot;
		dup.monochromeColour = this.monochromeColour;
		dup.metaInfo = this.metaInfo;
		dup.box = this.box.clone();
		dup.padding = this.padding;
		return dup;
	}
}

const PADDING = 0.25;
const PLUSSZ = 0.5;
const ARROW_W = 2;
const ARROW_H = 0.5;
const REAGENT_SCALE = 0.7;
const PLACEHOLDER_W = 2;
const PLACEHOLDER_H = 2;

export interface ArrangeExperimentFauxComponent
{
	step:number;
	type:ArrangeComponentType;
	mol:Molecule;
	name?:string;
	annot?:ArrangeComponentAnnot;
	colour?:number;
	metaInfo?:any;
}

export class ArrangeExperiment
{
	public scale:number;
	public width = 0;
	public height = 0;

	public components:ArrangeComponent[] = [];

	// parameters to influence the drawing
	public limitTotalW = 1000;
	public limitTotalH = 1000;
	public limitStructW = 0;
	public limitStructH = 0;
	public includeReagents = true; // drawing of reagents alongside the arrow
	public includeNames = false; // including names of components alongside structures
	public includeStoich = true; // whether to include non-unity stoichiometry labels
	public includeAnnot = false; // whether to add annotations like primary/waste
	public includeBlank = false; // any section with no components gets a blank placeholder
	public includeDetails = false; // include information like yield, amount, metadata in the layout
	public includeAtomMap = false; // display atom mapping numbers
	public colourAtomMap = 0x9D1A76; // if above, use this colour
	public allowVertical = true; // permit vertical or bent arrangements
	public padding = 0;
	public fauxComponents:ArrangeExperimentFauxComponent[] = []; // extra components to add in by request

	public static COMP_GAP_LEFT = 0.5;
	public static COMP_ANNOT_SIZE = 1;

	private extraText:Record<string, string[]> = {}; // key {step:type:idx}

	// --------------------- public methods ---------------------

	// sets up the object with the mandatory information
	constructor(public entry:ExperimentEntry, public measure:ArrangeMeasurement, public policy:RenderPolicy)
	{
		this.scale = policy.data.pointScale;
		this.limitStructW = this.limitStructH = this.scale * 10;
		this.padding = PADDING * this.scale;
	}

	// optional text decoration to add to a particular component
	public includeExtraText(step:number, type:ExperimentComponentType, idx:number, txt:string):void
	{
		if (!txt) return;
		let key = `${step}:${type}:${idx}`;
		this.extraText[key] = Vec.append(this.extraText[key], txt);
	}

	// carries out the arrangement
	public arrange():void
	{
		this.createComponents();

		let fszText = this.scale * this.policy.data.fontSize, fszLeft = this.scale * this.policy.data.fontSize * 1.5;

		// do an initial sizing of most of the components
		for (let xc of this.components)
		{
			if (xc.type == ArrangeComponentType.Plus) xc.box = new Box(0, 0, this.scale * PLUSSZ, this.scale * PLUSSZ);
			else if (xc.type == ArrangeComponentType.Arrow) {} // directional
			else
			{
				let w = 0, h = 0;
				if (MolUtil.notBlank(xc.mol))
				{
					let sz = Size.fromArray(ArrangeMolecule.guestimateSize(xc.mol, this.policy));
					if (xc.type == ArrangeComponentType.Reagent) sz.scaleBy(REAGENT_SCALE);
					if (xc.leftNumer)
					{
						xc.fszLeft = fszLeft;
						let wad = this.measure.measureText(xc.leftNumer, fszLeft);
						let lw = wad[0], lh = wad[1] + wad[2];
						if (xc.leftDenom) lw = Math.max(lw, this.measure.measureText(xc.leftDenom, fszLeft)[0]);
						sz.w += lw + ArrangeExperiment.COMP_GAP_LEFT * lh; // lineHeight=some extra spacing
						sz.h = Math.max(sz.h, lh * (xc.leftDenom ? 2 : 1));
					}
					sz.fitInto(this.limitStructW, this.limitStructH);
					w = sz.w;
					h = sz.h;
				}
				if (Vec.notBlank(xc.text))
				{
					if (MolUtil.notBlank(xc.mol)) h += 0.5 * fszText;
					for (let line of xc.text)
					{
						xc.fszText = fszText;
						let wad = this.measure.measureText(line, fszText);
						w = Math.max(w, wad[0]);
						h += wad[1] + wad[2];
					}
				}
				if (xc.annot != 0) w += ArrangeExperiment.COMP_ANNOT_SIZE * this.scale;
				if ((MolUtil.isBlank(xc.mol) && !xc.text && this.includeBlank) || w == 0 || h == 0)
				{
					w = Math.max(w, PLACEHOLDER_W * this.scale);
					h = Math.max(h, PLACEHOLDER_H * this.scale);
				}
				xc.box = new Box(0, 0, w, h);
			}

			// give it breathing room
			xc.padding = this.padding;
			xc.box = new Box(0, 0, xc.box.w + 2 * this.padding, xc.box.h + 2 * this.padding);
		}

		// build several permutations; take the best one
		// note: bend=1 for completely vertical, bend=2 for switch after first step, bend=#steps+1 for linear
		if (this.allowVertical)
		{
			let best:ArrangeComponent[] = null;
			let bestScore = 0;
			for (let bend = this.entry.steps.length + 1; bend >= 1; bend--) for (let vert = 0; vert <= 1; vert++)
			{
				let trial:ArrangeComponent[] = [];
				for (let xc of this.components) trial.push(xc.clone());
				this.arrangeComponents(trial, bend, vert > 0);

				let score = this.scoreArrangement(trial);
				if (best == null || score > bestScore)
				{
					best = trial;
					bestScore = score;
				}
			}
			this.components = best;
		}
		else
		{
			this.arrangeComponents(this.components, this.entry.steps.length + 1, false);
		}

		// ascertain the limits
		this.width = this.height = 0;
		for (let xc of this.components)
		{
			this.width = Math.max(this.width, xc.box.maxX());
			this.height = Math.max(this.height, xc.box.maxY());
		}
	}

	// access to content
	public get numComponents():number {return this.components.length;}
	public getComponent(idx:number):ArrangeComponent {return this.components[idx];}
	public getComponents():ArrangeComponent[] {return this.components;}

	// resize the whole thing
	public scaleComponents(modScale:number):void
	{
		if (modScale == 1) return;

		this.scale *= modScale;
		this.width *= modScale;
		this.height *= modScale;
		for (let xc of this.components)
		{
			xc.box.scaleBy(modScale);
			xc.fszText *= modScale;
			xc.fszLeft *= modScale;
			xc.padding *= modScale;
		}
	}

	// convenience: convert arrangment type to its experiment counterpart, if applicable
	public static toExpType(compType:ArrangeComponentType):ExperimentComponentType
	{
		if (compType == ArrangeComponentType.Reactant) return ExperimentComponentType.Reactant;
		if (compType == ArrangeComponentType.Reagent) return ExperimentComponentType.Reagent;
		if (compType == ArrangeComponentType.Product) return ExperimentComponentType.Product;
		return null;
	}

	// --------------------- private methods ---------------------

	// instantiate each component in the diagram (which includes pluses and arrows)
	private createComponents():void
	{
		// step 0: the only place where reactants come from
		for (let n = 0; n < this.entry.steps[0].reactants.length; n++)
		{
			if (n > 0) this.createSegregator(ArrangeComponentType.Plus, 0, -1);
			this.createReactant(n, 0);
		}
		if (this.components.length == 0 && this.includeBlank) this.createBlank(ArrangeComponentType.Reactant, 0);

		// reagents & products for each step
		for (let s = 0; s < this.entry.steps.length; s++)
		{
			this.createSegregator(ArrangeComponentType.Arrow, s, 0);
			if (this.includeReagents)
			{
				let any = false;
				for (let n = 0; n < this.entry.steps[s].reagents.length; n++)
				{
					this.createReagent(n, s);
					any = true;
				}
				if (!any && this.includeBlank) this.createBlank(ArrangeComponentType.Reagent, s);
			}
			if (this.includeDetails) this.createStepMeta(s);

			let any = false;
			for (let n = 0; n < this.entry.steps[s].products.length; n++)
			{
				if (n > 0) this.createSegregator(ArrangeComponentType.Plus, s, 1);
				this.createProduct(n, s);
				any = true;
			}
			if (!any && this.includeBlank) this.createBlank(ArrangeComponentType.Product, s);
		}

		// faux-components
		for (let fc of this.fauxComponents)
		{
			if (fc.type == ArrangeComponentType.Reactant) this.createSegregator(ArrangeComponentType.Plus, fc.step, -1);
			else if (fc.type == ArrangeComponentType.Product) this.createSegregator(ArrangeComponentType.Plus, fc.step, 1);
			this.createFauxComponent(fc);
		}
	}

	private createReactant(idx:number, step:number):void
	{
		let comp = this.entry.steps[step].reactants[idx];

		let xc = new ArrangeComponent();
		xc.type = ArrangeComponentType.Reactant;
		xc.srcIdx = idx;
		xc.step = step;
		xc.side = -1;
		if (MolUtil.notBlank(comp.mol)) xc.mol = comp.mol;
		if (comp.name && (this.includeNames || MolUtil.isBlank(comp.mol))) xc.text = this.wordWrapName(comp.name, xc.mol);
		if (this.includeDetails) this.supplementText(xc, comp);

		if (MolUtil.notBlank(comp.mol) && this.includeStoich && !QuantityCalc.isStoichZero(comp.stoich) && !QuantityCalc.isStoichUnity(comp.stoich))
		{
			let slash = comp.stoich.indexOf('/');
			if (slash >= 0)
			{
				xc.leftNumer = comp.stoich.substring(0, slash);
				xc.leftDenom = comp.stoich.substring(slash + 1);
			}
			else xc.leftNumer = comp.stoich;
		}
		if (this.includeAnnot && MolUtil.notBlank(comp.mol) && comp.primary) xc.annot = ArrangeComponentAnnot.Primary;

		let key = `${step}:${ExperimentComponentType.Reactant}:${idx}`;
		xc.text.push(...(this.extraText[key] ?? []));

		this.components.push(xc);
	}
	private createReagent(idx:number, step:number):void
	{
		let comp = this.entry.steps[step].reagents[idx];

		let xc = new ArrangeComponent();
		xc.type = ArrangeComponentType.Reagent;
		xc.srcIdx = idx;
		xc.step = step;
		xc.side = 0;
		if (MolUtil.notBlank(comp.mol)) xc.mol = comp.mol;
		if (comp.name && (this.includeNames || MolUtil.isBlank(comp.mol))) xc.text = this.wordWrapName(comp.name, xc.mol);
		if (this.includeDetails) this.supplementText(xc, comp);

		if (this.includeAnnot)
		{
			let stoich = QuantityCalc.impliedReagentStoich(comp, this.entry.steps[step].products);
			if (stoich > 0) xc.annot = ArrangeComponentAnnot.Implied;
			if (stoich > 0 && stoich != 1)
			{
				if (realEqual(stoich, Math.round(stoich)))
					xc.leftNumer = Math.round(stoich).toString();
				else
					xc.leftNumer = stoich.toString(); // TODO: use ratio instead, this can be ugly
			}
		}

		let key = `${step}:${ExperimentComponentType.Reagent}:${idx}`;
		xc.text.push(...(this.extraText[key] ?? []));

		this.components.push(xc);
	}
	private createProduct(idx:number, step:number):void
	{
		let comp = this.entry.steps[step].products[idx];

		let xc = new ArrangeComponent();
		xc.type = ArrangeComponentType.Product;
		xc.srcIdx = idx;
		xc.step = step;
		xc.side = 1;
		if (MolUtil.notBlank(comp.mol)) xc.mol = comp.mol;
		if (comp.name && (this.includeNames || MolUtil.isBlank(comp.mol))) xc.text = this.wordWrapName(comp.name, xc.mol);
		if (this.includeDetails) this.supplementText(xc, comp);

		if (this.includeStoich && !QuantityCalc.isStoichZero(comp.stoich) && !QuantityCalc.isStoichUnity(comp.stoich))
		{
			let slash = comp.stoich.indexOf('/');
			if (slash >= 0)
			{
				xc.leftNumer = comp.stoich.substring(0, slash);
				xc.leftDenom = comp.stoich.substring(slash + 1);
			}
			else xc.leftNumer = comp.stoich;
		}
		if (this.includeAnnot && MolUtil.notBlank(comp.mol) && comp.waste) xc.annot = ArrangeComponentAnnot.Waste;

		let key = `${step}:${ExperimentComponentType.Product}:${idx}`;
		xc.text.push(...(this.extraText[key] ?? []));

		this.components.push(xc);
	}
	private createSegregator(type:ArrangeComponentType, step:number, side:number):void
	{
		let xc = new ArrangeComponent();
		xc.type = type;
		xc.step = step;
		xc.side = side;
		this.components.push(xc);
	}
	private createStepMeta(step:number):void
	{
		let lines:string[] = [];
		for (let [type, value] of ExperimentMeta.unpackMeta(this.entry.steps[step].meta))
		{
			if (!Vec.safeArray(ExperimentMeta.APPLICABILITY[type]).includes(ExperimentMetaApplic.Step)) continue;
			let descr = ExperimentMeta.describeMeta(type, value);
			if (descr != null) lines.push(descr);
		}
		if (lines.length == 0) return;

		let xc = new ArrangeComponent();
		xc.type = ArrangeComponentType.StepNote;
		xc.step = step;
		xc.side = 0;
		xc.text = lines;
		this.components.push(xc);
	}
	private createBlank(type:number, step:number):void
	{
		let xc = new ArrangeComponent();
		xc.type = type;
		xc.step = step;
		xc.side = type == ArrangeComponentType.Reactant ? -1 : type == ArrangeComponentType.Product ? 1 : 0;
		xc.srcIdx = -1;
		this.components.push(xc);
	}
	private createFauxComponent(fc:ArrangeExperimentFauxComponent):void
	{
		let xc = new ArrangeComponent();
		xc.type = fc.type;
		xc.srcIdx = -1;
		xc.step = fc.step;
		xc.side = fc.type == ArrangeComponentType.Reactant ? -1 : fc.type == ArrangeComponentType.Product ? 1 : 0;
		xc.mol = fc.mol;
		if (fc.name) xc.text = [fc.name];
		if (fc.annot) xc.annot = fc.annot;
		xc.monochromeColour = fc.colour;
		xc.metaInfo = fc.metaInfo;
		this.components.push(xc);
	}

	private arrangeComponents(comps:ArrangeComponent[], bendStep:number, vertComp:boolean):void
	{
		let blkMain:ArrangeComponent[][] = [];
		let blkArrow:ArrangeComponent[][] = [];
		let szMain:Size[] = [], szArrow:Size[] = [];
		let midMain:Pos[] = [], midArrow:Pos[] = [];

		blkMain.push(this.gatherBlock(comps, 0, -1));
		szMain.push(this.arrangeMainBlock(blkMain[0], vertComp));
		midMain.push(this.findMidBlock(blkMain[0], szMain[0]));

		for (let n = 0; n < this.entry.steps.length; n++)
		{
			let bent = n + 1 >= bendStep;

			blkMain.push(this.gatherBlock(comps, n, 1));
			szMain.push(this.arrangeMainBlock(blkMain[n + 1], vertComp && !bent));
			midMain.push(this.findMidBlock(blkMain[n + 1], szMain[n + 1]));

			blkArrow.push(this.gatherBlock(comps, n, 0));
			if (!bent)
				szArrow.push(this.arrangeHorizontalArrowBlock(blkArrow[n]));
			else
				szArrow.push(this.arrangeVerticalArrowBlock(blkArrow[n]));
			midArrow.push(this.findMidBlock(blkArrow[n], szArrow[n]));
		}

		// part 1: arrange the first step(s) left-to-right

		let midH = 0;
		for (let n = 0; n < bendStep; n++)
		{
			midH = Math.max(midH, midMain[n].y);
			if (n > 0) midH = Math.max(midH, midArrow[n - 1].y);
		}
		let sz = Size.zero();
		for (let n = 0; n < bendStep; n++)
		{
			sz.w += szMain[n].w;
			sz.h = Math.max(sz.h, midH + (szMain[n].h - midMain[n].y));
			if (n > 0)
			{
				sz.w += szArrow[n - 1].w;
				sz.h = Math.max(sz.h, midH + (szArrow[n - 1].h - midArrow[n - 1].y));
			}
		}

		let x = 0, arrowX = 0;
		for (let n = 0; n < bendStep; n++)
		{
			if (n > 0)
			{
				this.originateBlock(blkArrow[n - 1], x, midH - midArrow[n - 1].y);
				x += szArrow[n - 1].w;
			}

			this.originateBlock(blkMain[n], x, midH - midMain[n].y);
			arrowX = x + midMain[n].x;
			x += szMain[n].w;
		}

		// part 2: arrange the remaining steps top-down

		let y = sz.h, lowX = 0;
		for (let n = bendStep; n <= this.entry.steps.length; n++)
		{
			x = arrowX - midArrow[n - 1].x;
			lowX = Math.min(lowX, x);
			this.originateBlock(blkArrow[n - 1], x, y);
			y += szArrow[n - 1].h;
			sz.w = Math.max(sz.w, x + szArrow[n - 1].w);

			x = arrowX - midMain[n].x;
			lowX = Math.min(lowX, x);
			this.originateBlock(blkMain[n], x, y);
			y += szMain[n].h;
			sz.w = Math.max(sz.w, x + szMain[n].w);
		}

		// need to post-correct sometimes with wide products
		if (lowX < 0)
		{
			for (let xc of comps) xc.box.x -= lowX;
		}
	}

	// enumerate blocks of specific type
	private gatherBlock(comps:ArrangeComponent[], step:number, side:number):ArrangeComponent[]
	{
		let block:ArrangeComponent[] = [];
		for (let xc of comps) if (xc.side == side && xc.step == step) block.push(xc);
		return block;
	}

	// fit out all individual components, horizontally or vertically
	private arrangeMainBlock(block:ArrangeComponent[], vertComp:boolean):Size
	{
		let sz = Size.zero();
		if (!vertComp)
		{
			for (let xc of block)
			{
				sz.w += xc.box.w;
				sz.h = Math.max(sz.h, xc.box.h);
			}
		}
		else
		{
			for (let xc of block)
			{
				sz.w = Math.max(sz.w, xc.box.w);
				sz.h += xc.box.h;
			}
		}

		sz.w = Math.max(sz.w, this.scale * 2.0);
		sz.h = Math.max(sz.h, this.scale * 2.0);

		if (!vertComp)
		{
			let x = 0;
			for (let xc of block)
			{
				xc.box.x = x;
				xc.box.y = 0.5 * (sz.h - xc.box.h);
				x += xc.box.w;
			}
		}
		else
		{
			let y = 0;
			for (let xc of block)
			{
				xc.box.x = 0.5 * (sz.w - xc.box.w);
				xc.box.y = y;
				y += xc.box.h;
			}
		}

		return sz;
	}

	// arrange an arrow, and the associated reagents
	private arrangeHorizontalArrowBlock(block:ArrangeComponent[]):Size
	{
		let arrow:ArrangeComponent = null;
		for (let xc of block) if (xc.type == ArrangeComponentType.Arrow)
		{
			arrow = xc;
			xc.box.w = ARROW_W * this.scale + 2 * xc.padding;
			xc.box.h = ARROW_H * this.scale + 2 * xc.padding;
		}

		let mid = block.length >> 1; // (could vote by height?)

		for (let xc of block) arrow.box.w = Math.max(xc.box.w, arrow.box.w);

		let sz = Size.zero();

		let n = 0;
		let y = 0;
		let arrowPlaced = false;
		for (let xc of block) if (xc.type != ArrangeComponentType.Arrow)
		{
			xc.box.x = 0.5 * (arrow.box.w - xc.box.w);
			xc.box.y = y;
			y += xc.box.h;

			n++;
			if (n == mid)
			{
				arrow.box.x = 0;
				arrow.box.y = y;
				y += arrow.box.h;
				arrowPlaced = true;
			}
		}
		if (!arrowPlaced)
		{
			arrow.box.x = 0;
			arrow.box.y = y;
			y += arrow.box.h;
		}
		sz.w = arrow.box.w;
		sz.h = y;

		return sz;
	}

	private arrangeVerticalArrowBlock(block:ArrangeComponent[]):Size
	{
		let arrow:ArrangeComponent = null;
		for (let xc of block) if (xc.type == ArrangeComponentType.Arrow)
		{
			arrow = xc;
			xc.box.w = ARROW_H * this.scale + 2 * xc.padding;
			xc.box.h = ARROW_W * this.scale + 2 * xc.padding;
		}

		let mid = block.length >> 1; // (could vote by height?)

		let sz1 = Size.zero(), sz2 = Size.zero();
		let n = 0;
		for (let xc of block) if (xc.type != ArrangeComponentType.Arrow)
		{
			if (n < mid)
			{
				sz1.w = Math.max(sz1.w, xc.box.w);
				sz1.h += xc.box.h;
			}
			else
			{
				sz2.w = Math.max(sz2.w, xc.box.w);
				sz2.h += xc.box.h;
			}
			n++;
		}

		let sz = new Size(sz1.w + sz2.w + arrow.box.w, Math.max(arrow.box.h, Math.max(sz1.h, sz2.h)));
		arrow.box = new Box(sz1.w, 0, arrow.box.w, sz.h);

		let y1 = 0.5 * (sz.h - sz1.h), y2 = 0.5 * (sz.h - sz2.h);
		n = 0;
		for (let xc of block) if (xc.type != ArrangeComponentType.Arrow)
		{
			if (n < mid)
			{
				xc.box.x = sz1.w - xc.box.w;
				xc.box.y = y1;
				y1 += xc.box.h;
			}
			else
			{
				xc.box.x = sz.w - sz2.w;
				xc.box.y = y2;
				y2 += xc.box.h;
			}
			n++;
		}

		return sz;
	}

	// find the "reference middle" of a block, which is based on pluses and arrows
	private findMidBlock(block:ArrangeComponent[], sz:Size):Pos
	{
		let count = 0;
		let mid = Pos.zero();
		for (let xc of block) if (xc.type == ArrangeComponentType.Plus || xc.type == ArrangeComponentType.Arrow)
		{
			mid.x += xc.box.midX();
			mid.y += xc.box.midY();
			count++;
		}
		if (count == 0)
		{
			mid.x = 0.5 * sz.w;
			mid.y = 0.5 * sz.h;
		}
		else if (count > 1)
		{
			let inv = 1.0 / count;
			mid.x *= inv;
			mid.y *= inv;
		}
		return mid;
	}

	// determine how good a particular arrangement is
	private scoreArrangement(comps:ArrangeComponent[]):number
	{
		let w = 0, h = 0;
		for (let xc of comps)
		{
			w = Math.max(w, xc.box.maxX());
			h = Math.max(h, xc.box.maxY());
		}

		let score = 0;

		// want the width to be as close as possible to the limiting width
		score -= Math.max(0, Math.abs(w - this.limitTotalW));

		// .. and height?
		//score -= Math.max(0, Math.abs(h - this.limitTotalH));

		// (anything else that matters?)

		return score;
	}

	// moves all components in a block
	private originateBlock(block:ArrangeComponent[], x:number, y:number):void
	{
		for (let xc of block)
		{
			xc.box.x += x;
			xc.box.y += y;
		}
	}

	// add in other text information about the comment, if desired
	private supplementText(xc:ArrangeComponent, comp:ExperimentComponent):void
	{
		if (comp.mass > 0) xc.text.push(QuantityCalc.formatMass(comp.mass));
		if (comp.volume > 0) xc.text.push(QuantityCalc.formatVolume(comp.volume));
		if (comp.moles > 0) xc.text.push(QuantityCalc.formatMoles(comp.moles));
		//if (comp.density > 0) xc.text.push(QuantityCalc.formatDensity(comp.density));
		if (comp.conc > 0) xc.text.push(QuantityCalc.formatConc(comp.conc));
		if (comp.yield != null && comp.yield >= 0) xc.text.push(QuantityCalc.formatPercent(comp.yield));
		if (comp.equiv > 0) xc.text.push(QuantityCalc.formatEquiv(comp.equiv));

		for (let [type, value] of ExperimentMeta.unpackMeta(comp.meta))
		{
			let descr = ExperimentMeta.describeMeta(type, value);
			if (descr) xc.text.push(descr);
		}
	}

	private wordWrapName(name:string, mol:Molecule):string[]
	{
		let minLimW = 0;
		if (MolUtil.notBlank(mol)) minLimW = (mol.boundary().w + 2) * this.scale;
		let limW = Math.max(minLimW, 10 * this.scale);
		let fsz = this.scale * this.policy.data.fontSize;

		let w = this.measure.measureText(name, fsz)[0];
		if (w < limW) return [name];

		let wrap = ():[string[], number] =>
		{
			let lines:string[] = [], residual = name, nclean = 0;
			while (residual.length > 0)
			{
				let wsz = FontData.measureWidths(residual, fsz);
				let pos = 0;
				while (pos < wsz.length && wsz[pos] < limW) pos++;
				for (let n = pos; n > 5; n--)
				{
					if (residual[n] == ' ') {pos = n; nclean++; break;}
					if (wsz[n] < limW * 0.8) break;
				}
				lines.push(residual.substring(0, pos));
				residual = residual.substring(pos).trimLeft();
			}
			return [lines, nclean];
		};

		let [lines, nclean] = wrap();
		for (; limW > 50; limW -= fsz)
		{
			let [tryLines, tryClean] = wrap();
			if (tryLines.length > lines.length) break;
			if (tryClean >= nclean) [lines, nclean] = [tryLines, tryClean];
		}
		return lines;
	}
}

