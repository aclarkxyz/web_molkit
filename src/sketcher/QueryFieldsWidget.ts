/*
    WebMolKit

    (c) 2010-2020 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {Molecule} from '../mol/Molecule';
import {QueryUtil} from '../mol/QueryUtil';
import {OptionList} from '../ui/OptionList';
import {Widget} from '../ui/Widget';
import {dom, DOM} from '../util/dom';
import {Vec} from '../util/Vec';

/*
	Supporting widget for editing query fields, for an atom or a bond.
*/

export class QueryFieldsWidget extends Widget
{
	private inputCharges:DOM;
	private optAromatic:OptionList;
	private optUnsaturated:OptionList;
	private chkNotElements:DOM;
	private inputElements:DOM;
	private chkNotRingSizes:DOM;
	private inputRingSizes:DOM;
	private optRingBlock:OptionList;
	private inputNumRings:DOM;
	private inputRingBonds:DOM;
	private inputAdjacency:DOM;
	private inputBondSums:DOM;
	private inputValences:DOM;
	private inputHydrogens:DOM;
	private inputIsotopes:DOM;
	//private chkSubFrags:DOM; !! ... include & exclude mutually compatible? because they can be queries...
	//private divQSubFrags:!!
	private inputOrders:DOM;

	constructor(private mol:Molecule, private atom:number, private bond:number)
	{
		super();
	}

	// create the underlying structure; the parent parameter must be jQuery-compatible
	public render(parent:any)
	{
		super.render(parent);

		let grid = dom('<div/>').appendTo(this.contentDOM);
		grid.css({'display': 'grid', 'align-items': 'center', 'justify-content': 'start'});
		grid.css({'grid-row-gap': '0.5em', 'grid-column-gap': '0.5em'});
		grid.css({'grid-template-columns': '[title] auto [value] auto [end]'});

		let row = 0;

		let makeInput = ():DOM =>
		{
			let input = dom('<input size="20"/>').appendTo(grid).css({'grid-area': `${row} / value`});
			return input;
		};
		let makeToggleInput = ():[DOM, DOM] =>
		{
			let div = dom('<div/>').appendTo(grid).css({'grid-area': `${row} / value`, 'dispkay': 'flex'});
			let lbl = dom('<label/>').appendTo(div).css({'margin-right': '0.5em'});
			let chk = dom('<input type="checkbox"/>').appendTo(lbl);
			lbl.appendText('Not');
			let input = dom('<input size="20"/>').appendTo(div).css({'flex-grow': '1'});
			return [chk, input];
		};

		if (this.atom > 0)
		{
			dom('<div>Charges</div>').appendTo(grid).css({'grid-area': `${++row} / title`});
			this.inputCharges = makeInput();

			dom('<div>Aromatic</div>').appendTo(grid).css({'grid-area': `${++row} / title`});
			this.optAromatic = new OptionList(['Maybe', 'Yes', 'No']);
			this.optAromatic.render(dom('<div/>').appendTo(grid).css({'grid-area': `${row} / value`}));

			dom('<div>Unsaturated</div>').appendTo(grid).css({'grid-area': `${++row} / title`});
			this.optUnsaturated = new OptionList(['Maybe', 'Yes', 'No']);
			this.optUnsaturated.render(dom('<div/>').appendTo(grid).css({'grid-area': `${row} / value`}));

			dom('<div>Elements</div>').appendTo(grid).css({'grid-area': `${++row} / title`});
			[this.chkNotElements, this.inputElements] = makeToggleInput();

			dom('<div>Ring Sizes</div>').appendTo(grid).css({'grid-area': `${++row} / title`});
			[this.chkNotRingSizes, this.inputRingSizes] = makeToggleInput();

			dom('<div>Ring Block</div>').appendTo(grid).css({'grid-area': `${++row} / title`});
			this.optRingBlock = new OptionList(['Maybe', 'Yes', 'No']);
			this.optRingBlock.render(dom('<div/>').appendTo(grid).css({'grid-area': `${row} / value`}));

			dom('<div># Small Rings</div>').appendTo(grid).css({'grid-area': `${++row} / title`});
			this.inputNumRings = makeInput();

			dom('<div># Ring Bonds</div>').appendTo(grid).css({'grid-area': `${++row} / title`});
			this.inputRingBonds = makeInput();

			dom('<div>Adjacency</div>').appendTo(grid).css({'grid-area': `${++row} / title`});
			this.inputAdjacency = makeInput();

			dom('<div>Bond Sums</div>').appendTo(grid).css({'grid-area': `${++row} / title`});
			this.inputBondSums = makeInput();

			dom('<div>Valences</div>').appendTo(grid).css({'grid-area': `${++row} / title`});
			this.inputValences = makeInput();

			dom('<div>Hydrogens</div>').appendTo(grid).css({'grid-area': `${++row} / title`});
			this.inputHydrogens = makeInput();

			dom('<div>Isotopes</div>').appendTo(grid).css({'grid-area': `${++row} / title`});
			this.inputIsotopes = makeInput();

			// !!! FRAGMENTS...

			this.setupAtom();
		}
		else // this.bond > 0
		{
			dom('<div>Ring Sizes</div>').appendTo(grid).css({'grid-area': `${++row} / title`});
			[this.chkNotRingSizes, this.inputRingSizes] = makeToggleInput();

			dom('<div>Ring Block</div>').appendTo(grid).css({'grid-area': `${++row} / title`});
			this.optRingBlock = new OptionList(['Maybe', 'Yes', 'No']);
			this.optRingBlock.render(dom('<div/>').appendTo(grid).css({'grid-area': `${row} / value`}));

			dom('<div># Small Rings</div>').appendTo(grid).css({'grid-area': `${++row} / title`});
			this.inputNumRings = makeInput();

			dom('<div>Num Rings</div>').appendTo(grid).css({'grid-area': `${++row} / title`});
			this.inputNumRings = makeInput();

			dom('<div>Bond Orders</div>').appendTo(grid).css({'grid-area': `${++row} / title`});
			this.inputOrders = makeInput();

			this.setupBond();
		}
	}

	public updateAtom():void
	{
		const {mol, atom} = this;

		QueryUtil.deleteQueryAtomAll(mol, atom);

		let chg = this.splitNumbers(this.inputCharges.getValue());
		if (chg) QueryUtil.setQueryAtomCharges(mol, atom, chg);

		let arom = this.optAromatic.getSelectedIndex();
		if (arom > 0) QueryUtil.setQueryAtomAromatic(mol, atom, arom == 1);

		let unsat = this.optUnsaturated.getSelectedIndex();
		if (unsat > 0) QueryUtil.setQueryAtomUnsaturated(mol, atom, unsat == 1);

		let elem = this.splitStrings(this.inputElements.getValue());
		if (elem)
		{
			if (!this.chkNotElements.elInput.checked)
				QueryUtil.setQueryAtomElements(mol, atom, elem);
			else
				QueryUtil.setQueryAtomElementsNot(mol, atom, elem);
		}

		let ringsz = this.splitNumbers(this.inputRingSizes.getValue());
		if (ringsz)
		{
			if (!this.chkNotRingSizes.elInput.checked)
				QueryUtil.setQueryAtomRingSizes(mol, atom, ringsz);
			else
				QueryUtil.setQueryAtomRingSizesNot(mol, atom, ringsz);
		}

		let ringblk = this.optRingBlock.getSelectedIndex();
		if (ringblk > 0) QueryUtil.setQueryAtomRingBlock(mol, atom, ringblk == 1);

		let nring = this.splitNumbers(this.inputNumRings.getValue());
		if (nring) QueryUtil.setQueryAtomNumRings(mol, atom, nring);

		let rbc = this.splitNumbers(this.inputRingBonds.getValue());
		if (rbc) QueryUtil.setQueryAtomRingBonds(mol, atom, rbc);

		let adj = this.splitNumbers(this.inputAdjacency.getValue());
		if (adj) QueryUtil.setQueryAtomAdjacency(mol, atom, adj);

		let bond = this.splitNumbers(this.inputBondSums.getValue());
		if (bond) QueryUtil.setQueryAtomBondSums(mol, atom, bond);

		let val = this.splitNumbers(this.inputValences.getValue());
		if (val) QueryUtil.setQueryAtomValences(mol, atom, val);

		let hyd = this.splitNumbers(this.inputHydrogens.getValue());
		if (hyd) QueryUtil.setQueryAtomHydrogens(mol, atom, hyd);

		let iso = this.splitNumbers(this.inputIsotopes.getValue());
		if (iso) QueryUtil.setQueryAtomIsotope(mol, atom, iso);

		// !! FRAGMENTS
	}

	public updateBond():void
	{
		const {mol, bond} = this;

		QueryUtil.deleteQueryBondAll(mol, bond);

		let ringsz = this.splitNumbers(this.inputRingSizes.getValue());
		if (ringsz)
		{
			if (!this.chkNotRingSizes.elInput.checked)
				QueryUtil.setQueryBondRingSizes(mol, bond, ringsz);
			else
				QueryUtil.setQueryBondRingSizesNot(mol, bond, ringsz);
		}

		let ringblk = this.optRingBlock.getSelectedIndex();
		if (ringblk > 0) QueryUtil.setQueryBondRingBlock(mol, bond, ringblk == 1);

		let nring = this.splitNumbers(this.inputNumRings.getValue());
		if (nring) QueryUtil.setQueryBondNumRings(mol, bond, nring);

		let order = this.splitNumbers(this.inputOrders.getValue());
		if (order) QueryUtil.setQueryBondOrders(mol, bond, order);
	}

	// ------------ private methods ------------

	private setupAtom():void
	{
		const {mol, atom} = this;

		let chg = QueryUtil.queryAtomCharges(mol, atom);
		let arom = QueryUtil.queryAtomAromatic(mol, atom);
		let unsat = QueryUtil.queryAtomUnsaturated(mol, atom);
		let elem = QueryUtil.queryAtomElements(mol, atom);
		let elemNot = QueryUtil.queryAtomElementsNot(mol, atom);
		let ringsz = QueryUtil.queryAtomRingSizes(mol, atom);
		let ringszNot = QueryUtil.queryAtomRingSizesNot(mol, atom);
		let ringblk = QueryUtil.queryAtomRingBlock(mol, atom);
		let nring = QueryUtil.queryAtomNumRings(mol, atom);
		let rbc = QueryUtil.queryAtomRingBonds(mol, atom);
		let adj = QueryUtil.queryAtomAdjacency(mol, atom);
		let bond = QueryUtil.queryAtomBondSums(mol, atom);
		let val = QueryUtil.queryAtomValences(mol, atom);
		let hyd = QueryUtil.queryAtomHydrogens(mol, atom);
		let iso = QueryUtil.queryAtomIsotope(mol, atom);
		let frag = QueryUtil.queryAtomSubFrags(mol, atom);
		let fragNot = QueryUtil.queryAtomSubFragsNot(mol, atom);

		this.inputCharges.setValue(Vec.notBlank(chg) ? chg.join(',') : '');
		this.optAromatic.setSelectedIndex(arom == null ? 0 : arom ? 1 : 2);
		this.optUnsaturated.setSelectedIndex(unsat == null ? 0 : unsat ? 1 : 2);
		this.chkNotElements.elInput.checked = Vec.isBlank(elem) && Vec.notBlank(elemNot);
		this.inputElements.setValue(Vec.notBlank(elem) ? elem.join(',') : Vec.notBlank(elemNot) ? elemNot.join(',') : '');
		this.chkNotRingSizes.elInput.checked = Vec.isBlank(ringsz) && Vec.notBlank(ringszNot);
		this.inputRingSizes.setValue(Vec.notBlank(ringsz) ? ringsz.join(',') : Vec.notBlank(ringszNot) ? ringszNot.join(',') : '');
		this.optRingBlock.setSelectedIndex(ringblk == null ? 0 : ringblk ? 1 : 2);
		this.inputNumRings.setValue(Vec.notBlank(nring) ? nring.join(',') : '');
		this.inputRingBonds.setValue(Vec.notBlank(rbc) ? rbc.join(',') : '');
		this.inputAdjacency.setValue(Vec.notBlank(adj) ? adj.join(',') : '');
		this.inputBondSums.setValue(Vec.notBlank(bond) ? bond.join(',') : '');
		this.inputValences.setValue(Vec.notBlank(val) ? val.join(',') : '');
		this.inputHydrogens.setValue(Vec.notBlank(hyd) ? hyd.join(',') : '');
		this.inputIsotopes.setValue(Vec.notBlank(iso) ? iso.join(',') : '');

		// TODO: frag/fragNot
	}

	private setupBond():void
	{
		const {mol, bond} = this;

		let ringsz = QueryUtil.queryBondRingSizes(mol, bond);
		let ringszNot = QueryUtil.queryBondRingSizesNot(mol, bond);
		let ringblk = QueryUtil.queryBondRingBlock(mol, bond);
		let nring = QueryUtil.queryBondNumRings(mol, bond);
		let order = QueryUtil.queryBondOrders(mol, bond);

		this.chkNotRingSizes.elInput.checked = Vec.isBlank(ringsz) && Vec.notBlank(ringszNot);
		this.inputRingSizes.setValue(Vec.notBlank(ringsz) ? ringsz.join(',') : Vec.notBlank(ringszNot) ? ringszNot.join(',') : '');
		this.optRingBlock.setSelectedIndex(ringblk == null ? 0 : ringblk ? 1 : 2);
		this.inputNumRings.setValue(Vec.notBlank(nring) ? nring.join(',') : '');
		this.inputOrders.setValue(Vec.notBlank(order) ? order.join(',') : '');
	}

	private splitStrings(str:string):string[]
	{
		let list:string[] = [];
		if (str) for (let bit of str.split(/[\s\,\;]+/)) if (bit) list.push(bit);
		return list.length ? list : null;
	}
	private splitNumbers(str:string):number[]
	{
		let list:number[] = [];
		if (str) for (let bit of str.split(/[\s\,\;]+/))
		{
			if (bit.startsWith('+')) bit = bit.substring(1);
			let num = parseInt(bit);
			if (!isNaN(num)) list.push(num);
		}
		return list.length ? list : null;
	}
}

