/*
	WebMolKit

	(c) 2010-2020 Molecular Materials Informatics, Inc.

	All rights reserved

	http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	Editing a new or existing polymer block.
*/

export class EditPolymer extends Dialog
{
	public mol:Molecule; // copy of original: may or may not be different

	private initMol:Molecule;
	private btnApply:DOM;
	private btnRemove:DOM;
	private optionConnect:OptionList = null;
	private optionBondConn:OptionList = null;
	private divPreview:DOM;

	private polymer:PolymerBlock;
	private currentID = 0;
	private unit:PolymerBlockUnit = null;

	private borderAtoms:number[] = []; // subset of atoms that have a bond going to the outside
	private outBonds:number[] = []; // list of bonds going to the outside
	private outAtoms:number[] = []; // sorted in same order as bonds

	private umap:number[];
	private umol:Molecule;

	constructor(mol:Molecule, public atoms:number[], private proxyClip:ClipboardProxy, private callbackApply:(source?:EditPolymer) => void)
	{
		super();

		this.initMol = mol;
		this.mol = mol.clone();

		this.title = 'Polymer Block';
		this.minPortionWidth = 20;
		this.maxPortionWidth = 95;

		this.polymer = new PolymerBlock(this.mol);
		atoms = Vec.sorted(atoms);

		for (let id of this.polymer.getIDList())
		{
			let look = this.polymer.getUnit(id);
			if (Vec.equals(atoms, look.atoms))
			{
				this.currentID = id;
				this.unit = look;
				break;
			}
		}
		if (!this.unit) this.unit = new PolymerBlockUnit(atoms);

		let umol = this.umol = this.mol.clone();
		let mask = Vec.booleanArray(false, this.umol.numAtoms);
		for (let n = 1; n <= this.mol.numBonds; n++)
		{
			let bfr = this.mol.bondFrom(n), bto = this.mol.bondTo(n);
			let in1 = this.atoms.includes(bfr), in2 = this.atoms.includes(bto);
			if (in1 || in2) mask[bfr - 1] = mask[bto - 1] = true;
			if (in1 && !in2)
			{
				this.borderAtoms.push(bfr);
				this.outBonds.push(n);
				this.outAtoms.push(bto);
			}
			if (in2 && !in1)
			{
				this.borderAtoms.push(bto);
				this.outBonds.push(n);
				this.outAtoms.push(bfr);
			}
		}
		this.borderAtoms = Vec.sortedUnique(this.borderAtoms);

		this.umap = Vec.maskMap(mask);
		this.umol = MolUtil.subgraphMask(this.umol, mask);
		new PolymerBlock(this.umol).removeAll();
	}

	// builds the dialog content
	protected populate():void
	{
		this.proxyClip.pushHandler(new ClipboardProxyHandler());

		let buttons = this.buttonsDOM(), body = this.bodyDOM();

		this.btnApply = dom('<button class="wmk-button wmk-button-primary">Apply</button>').appendTo(buttons).css({'margin-left': '0.5em'});
		if (this.currentID == 0) this.btnApply.setText('Create');
		this.btnApply.onClick(() => this.applyChanges());

		if (this.currentID > 0)
		{
			this.btnRemove = dom('<button class="wmk-button wmk-button-default">Remove</button>').appendTo(buttons).css({'margin-left': '0.5em'});
			this.btnRemove.onClick(() => this.applyRemove());
		}

		let grid = dom('<div/>').appendTo(body);
		grid.css({'display': 'grid', 'align-items': 'center', 'justify-content': 'start'});
		grid.css({'grid-row-gap': '0.5em', 'grid-column-gap': '0.5em'});
		grid.css({'grid-template-columns': '[start col0] auto [col1] auto [col2] auto [col3] auto [col4] auto [end]'});

		dom('<div/>').appendTo(grid).css({'grid-area': '1 / col0'}).setText('# Atoms');
		let inputNAtoms = dom('<input size="5"/>').appendTo(dom('<div/>').appendTo(grid).css({'grid-area': '1 / col1'}));
		inputNAtoms.elInput.readOnly = true;
		inputNAtoms.setValue(this.unit.atoms.length.toString());

		dom('<div/>').appendTo(grid).css({'grid-area': '1 / col2'}).setText('Out-bonds');
		let inputNBond = dom('<input size="5"/>').appendTo(dom('<div/>').appendTo(grid).css({'grid-area': '1 / col3'}));
		inputNBond.elInput.readOnly = true;
		inputNBond.setValue(this.outBonds.length.toString());

		let row = 1;
		if (this.outBonds.length == 2)
		{
			row++;
			dom('<div/>').appendTo(grid).css({'grid-area': `${row} / col0`}).setText('Connectivity');
			this.optionConnect = new OptionList(['Unknown', 'Head-to-Tail', 'Head-to-Head', 'Random']);
			this.optionConnect.render(dom('<div/>').appendTo(grid).css({'grid-area': `${row} / col1 / auto / col4`}));
			if (this.unit.connect == PolymerBlockConnectivity.HeadToTail) this.optionConnect.setSelectedIndex(1);
			else if (this.unit.connect == PolymerBlockConnectivity.HeadToHead) this.optionConnect.setSelectedIndex(2);
			else if (this.unit.connect == PolymerBlockConnectivity.Random) this.optionConnect.setSelectedIndex(3);
		}
		if (this.outBonds.length == 4 && Vec.uniqueUnstable(this.outAtoms).length == 4)
		{
			row++;
			dom('<div/>').appendTo(grid).css({'grid-area': `${row} / col0`}).setText('2x2 Connectivity');
			this.populate2x2Conn(dom('<div/>').appendTo(grid).css({'grid-area': `${row} / col1 / auto / end`}));
		}

		let getList = (str:string):number[] =>
		{
			if (!str) return null;
			let list:number[] = [];
			for (let bit of str.split(','))
			{
				let v = parseInt(bit);
				if (v > 0) list.push(v); else return undefined;
			}
			return list;
		};

		for (let n = 0; n < this.borderAtoms.length; n++)
		{
			row++;
			let label = (n == 0 ? 'Name ' : '') + (n + 1);
			dom('<div/>').appendTo(grid).css({'grid-area': `${row} / col0`, 'text-align': 'right', 'padding-right': '0.5em'}).setText(label);
			let input = dom('<input size="20"/>').appendTo(dom('<div/>').appendTo(grid).css({'grid-area': `${row} / col1 / auto / end`, 'width': '100%'}));

			let atom = this.borderAtoms[n];
			let nvals = this.unit.atomName.get(atom);
			if (nvals) input.setValue(nvals.join(','));
			input.onInput(() =>
			{
				let list = getList(input.getValue());
				if (list !== undefined) this.unit.atomName.set(atom, list);
			});
		}
		for (let n = 0; n < this.outAtoms.length; n++)
		{
			row++;
			let label = (n == 0 ? 'Link ' : '') + (n + 1);
			dom('<div/>').appendTo(grid).css({'grid-area': `${row} / col0`, 'text-align': 'right', 'padding-right': '0.5em'}).setText(label);
			dom('<div/>').appendTo(grid).css({'grid-area': `${row} / col1`}).setText('Include');
			let inputIncl = dom('<input size="10"/>').appendTo(dom('<div/>').appendTo(grid).css({'grid-area': `${row} / col2`, 'width': '100%'}));
			dom('<div/>').appendTo(grid).css({'grid-area': `${row} / col3`}).setText('Exclude');
			let inputExcl = dom('<input size="10"/>').appendTo(dom('<div/>').appendTo(grid).css({'grid-area': `${row} / col4`, 'width': '100%'}));

			let bond = this.outBonds[n];
			let ivals = this.unit.bondIncl.get(bond), evals = this.unit.bondExcl.get(bond);
			if (ivals) inputIncl.setValue(ivals.join(','));
			if (evals) inputExcl.setValue(evals.join(','));
			inputIncl.onInput(() =>
			{
				let list = getList(inputIncl.getValue());
				if (list !== undefined) this.unit.bondIncl.set(bond, list);
			});
			inputExcl.onInput(() =>
			{
				let list = getList(inputExcl.getValue());
				if (list !== undefined) this.unit.bondExcl.set(bond, list);
			});
		}

		row++;
		this.populateUncap(dom('<div/>').appendTo(grid).css({'grid-area': `${row} / col0 / auto / col4`, 'text-align': 'center'}));

		row++;
		this.divPreview = dom('<div/>').appendTo(grid).css({'grid-area': `${row} / col0 / auto / col4`, 'text-align': 'center'});
		this.renderUnit();

		let focusable = body.findAll('input,textarea');
		if (focusable.length > 0) focusable[0].grabFocus(true);
		for (let dom of focusable)
		{
			dom.css({'font': 'inherit'});
			dom.onKeyDown((event:KeyboardEvent) =>
			{
				let keyCode = event.keyCode || event.which;
				if (keyCode == 13) this.applyChanges();
				if (keyCode == 27) this.close();
			});
		}

		//setTimeout(() => inputNAtoms.focus(), 1);
	}

	public close():void
	{
		this.proxyClip.popHandler();
		super.close();
	}

	// ------------ private methods ------------

	private populate2x2Conn(div:DOM):void
	{
		const perms = [[0, 1, 2, 3], [0, 1, 3, 2], [0, 2, 1, 3], [0, 2, 3, 1], [0, 3, 1, 2], [0, 3, 2, 1]];

		let bondConnOptions:number[][] = [null];
		let optionList = ['None'];
		let selidx = 0;
		for (let perm of perms)
		{
			let bonds = Vec.idxGet(this.outBonds, perm);
			if (Vec.equals(bonds, this.unit.bondConn)) selidx = optionList.length;
			bondConnOptions.push(bonds);
			//optionList.push(`${this.outAtoms[perm[0]]},${this.outAtoms[perm[1]]}:${this.outAtoms[perm[2]]},${this.outAtoms[perm[3]]}`);
			optionList.push(`${perm[0] + 1},${perm[1] + 1}:${perm[2] + 1},${perm[3] + 1}`);
		}

		this.optionBondConn = new OptionList(optionList);
		this.optionBondConn.setSelectedIndex(selidx);
		this.optionBondConn.render(div);
		this.optionBondConn.onSelect((idx) =>
		{
			this.unit.bondConn = bondConnOptions[idx];
			this.renderUnit();
		});
	}

	// list out each outgoing atom that's terminal and could be converted into '*': if any, make a button for that
	private populateUncap(div:DOM):void
	{
		let uncapAtoms:number[] = [];
		skip: for (let a of this.outAtoms) if (this.mol.atomAdjCount(a) == 1 && this.mol.atomElement(a) != '*')
		{
			for (let unit of this.polymer.getUnits()) if (unit.atoms.includes(a)) continue skip;
			uncapAtoms.push(a);
		}
		if (uncapAtoms.length == 0) return;

		let btnUncap = dom('<button class="wmk-button wmk-button-default">Uncap Exterior</button>').appendTo(div);
		btnUncap.onClick(() =>
		{
			btnUncap.elInput.disabled = true;
			for (let a of uncapAtoms) this.mol.setAtomElement(a, '*');
		});
	}

	// trigger the apply/save sequence
	private applyChanges():void
	{
		if (this.optionConnect)
		{
			let sel = this.optionConnect.getSelectedIndex();
			if (sel == 0) this.unit.connect = null;
			else if (sel == 1) this.unit.connect = PolymerBlockConnectivity.HeadToTail;
			else if (sel == 2) this.unit.connect = PolymerBlockConnectivity.HeadToHead;
			else if (sel == 3) this.unit.connect = PolymerBlockConnectivity.Random;
		}

		if (this.currentID) this.polymer.removeUnit(this.currentID);

		this.currentID = this.polymer.createUnit(this.unit.clone());

		this.polymer.rewriteMolecule(); // housekeeping
		this.callbackApply(this);
	}

	private applyRemove():void
	{
		if (this.currentID) this.polymer.removeUnit(this.currentID);
		this.callbackApply(this);
	}

	private renderUnit():void
	{
		let umol = this.umol.clone();

		let policy = RenderPolicy.defaultColourOnWhite(20);
		let measure = new OutlineMeasurement(0, 0, policy.data.pointScale);

		let effects = new RenderEffects();
		effects.atomCircleSz = Vec.numberArray(0, umol.numAtoms);
		effects.atomCircleCol = Vec.numberArray(0, umol.numAtoms);
		effects.atomDecoText = Vec.stringArray(null, umol.numAtoms);
		effects.atomDecoCol = Vec.numberArray(null, umol.numAtoms);
		effects.atomDecoSize = Vec.numberArray(null, umol.numAtoms);

		let borderAtoms = this.borderAtoms.map((atom) => this.umap[atom - 1] + 1);
		let outAtoms = this.outAtoms.map((atom) => this.umap[atom - 1] + 1);

		for (let n = 1; n <= umol.numAtoms; n++)
		{
			let bidx = borderAtoms.indexOf(n), oidx = outAtoms.indexOf(n);
			if (bidx >= 0)
			{
				effects.atomDecoText[n - 1] = (bidx + 1).toString();
				effects.atomDecoCol[n - 1] = 0x008000;
				effects.atomDecoSize[n - 1] = 0.3;
			}
			if (oidx >= 0)
			{
				umol.setAtomCharge(n, 0);
				umol.setAtomUnpaired(n, 0);
				umol.setAtomIsotope(n, 0);
				effects.atomCircleSz[n - 1] = 0.1;
				effects.atomCircleCol[n - 1] = 0xFF00FF;
				effects.atomDecoText[n - 1] = (oidx + 1).toString();
				effects.atomDecoCol[n - 1] = 0x800080;
				effects.atomDecoSize[n - 1] = 0.3;
				umol.setAtomElement(n, 'C');
			}
		}
		let layout = new ArrangeMolecule(umol, measure, policy, effects);
		layout.arrange();
		layout.squeezeInto(0, 0, 300, 300);
		let gfx = new MetaVector();

		if (this.unit.bondConn)
		{
			const LINES:[number, number, number, number, boolean][] =
			[
				[0, 1, 0xC86D08, 2, false], [2, 3, 0xC86D08, 2, false],
				[0, 2, 0xC0C86D08, 1, true], [1, 3, 0xC0C86D08, 1, true]
			];
			for (let [i1, i2, col, sz, circle] of LINES)
			{
				let a1 = this.outAtoms[this.outBonds.indexOf(this.unit.bondConn[i1])];
				let a2 = this.outAtoms[this.outBonds.indexOf(this.unit.bondConn[i2])];
				let p1 = layout.getPoint(a1 - 1), p2 = layout.getPoint(a2 - 1);
				gfx.drawLine(p1.oval.cx, p1.oval.cy, p2.oval.cx, p2.oval.cy, col, sz);
				if (circle)
				{
					for (let f of [0.2, 0.4, 0.6, 0.8])
					{
						let mx = p1.oval.cx + f * (p2.oval.cx - p1.oval.cx), my = p1.oval.cy + f * (p2.oval.cy - p1.oval.cy);
						gfx.drawOval(mx, my, 2, 2, col, sz, null);
					}
				}
			}
		}

		new DrawMolecule(layout, gfx).draw();

		gfx.normalise();

		this.divPreview.empty();
		dom(gfx.createSVG()).appendTo(this.divPreview).css({'pointer-events': 'none'});
	}
}

/* EOF */ }