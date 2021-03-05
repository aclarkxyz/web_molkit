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
	private bonds:number[] = [];

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
		if (!this.unit) this.unit = {'atoms': atoms, 'connect': null, 'bondConn': null};

		for (let n = 1; n <= this.mol.numBonds; n++)
		{
			let in1 = atoms.includes(this.mol.bondFrom(n)), in2 = atoms.includes(this.mol.bondTo(n));
			if ((in1 && !in2) || (in2 && !in1)) this.bonds.push(n);
		}
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
		grid.css({'grid-template-columns': '[start col0] auto [col1] auto [col2] auto [col3] auto [col4 end]'});

		dom('<div/>').appendTo(grid).css({'grid-area': '1 / col0'}).setText('# Atoms');
		let inputNAtoms = dom('<input size="5"/>').appendTo(dom('<div/>').appendTo(grid).css({'grid-area': '1 / col1'}));
		inputNAtoms.elInput.readOnly = true;
		inputNAtoms.setValue(this.unit.atoms.length.toString());

		dom('<div/>').appendTo(grid).css({'grid-area': '1 / col2'}).setText('Out-bonds');
		let inputNBond = dom('<input size="5"/>').appendTo(dom('<div/>').appendTo(grid).css({'grid-area': '1 / col3'}));
		inputNBond.elInput.readOnly = true;
		inputNBond.setValue(this.bonds.length.toString());

		let row = 1;
		if (this.bonds.length == 2)
		{
			row++;
			dom('<div/>').appendTo(grid).css({'grid-area': `${row} / col0`}).setText('Connectivity');
			this.optionConnect = new OptionList(['Unknown', 'Head-to-Tail', 'Head-to-Head', 'Random']);
			this.optionConnect.render(dom('<div/>').appendTo(grid).css({'grid-area': `${row} / col1 / auto / col4`}));
			if (this.unit.connect == PolymerBlockConnectivity.HeadToTail) this.optionConnect.setSelectedIndex(1);
			else if (this.unit.connect == PolymerBlockConnectivity.HeadToHead) this.optionConnect.setSelectedIndex(2);
			else if (this.unit.connect == PolymerBlockConnectivity.Random) this.optionConnect.setSelectedIndex(3);
		}
		/* ... this isn't right; need to think it through
		if (this.bonds.length == 4)
		{
			row++;
			dom('<div/>').appendTo(grid).css({'grid-area': `${row} / col0`}).text('2x2 Connectivity');
			this.optionBondConn = new OptionList(['Unknown', '1-2,3-4', '1-4,2-3', '1-3,2-4', '1-4,3-2']);
			this.optionBondConn.render(dom('<div/>').appendTo(grid).css({'grid-area': `${row} / col1 / auto / col4`}));
			if (Vec.arrayLength(this.unit.bondConn) == 4)
			{
				let bpri = Vec.idxSort(this.unit.bondConn);
				if (Vec.equals(bpri, [0, 1, 2, 3])) this.optionBondConn.setSelectedIndex(1);
				else if (Vec.equals(bpri, [0, 3, 1, 2])) this.optionBondConn.setSelectedIndex(2);
				else if (Vec.equals(bpri, [0, 2, 1, 3])) this.optionBondConn.setSelectedIndex(3);
				else if (Vec.equals(bpri, [0, 3, 2, 1])) this.optionBondConn.setSelectedIndex(4);
			}
		}*/

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
		this.currentID = this.polymer.createUnit(this.atoms, this.unit.connect, this.unit.bondConn);

		this.polymer.rewriteMolecule(); // housekeeping

		this.callbackApply(this);
		this.close();
	}

	private applyRemove():void
	{
		if (this.currentID) this.polymer.removeUnit(this.currentID);

		this.callbackApply(this);
		this.close();
	}

	private renderUnit():void
	{
		let umol = this.mol.clone();
		let mask = Vec.booleanArray(false, umol.numAtoms);
		const EXTRA_TAG = 'xOUTBOND';

		for (let n = 1; n <= this.mol.numBonds; n++)
		{
			let bfr = this.mol.bondFrom(n), bto = this.mol.bondTo(n);
			let in1 = this.atoms.includes(bfr), in2 = this.atoms.includes(bto);
			if (in1 || in2) {mask[bfr - 1] = true; mask[bto - 1] = true;}
			if (in1 && !in2)
			{
				umol.setAtomElement(bto, (this.bonds.indexOf(n) + 1).toString());
				umol.setAtomExtra(bto, Vec.append(umol.atomExtra(bto), EXTRA_TAG));
			}
			if (in2 && !in1)
			{
				umol.setAtomElement(bfr, (this.bonds.indexOf(n) + 1).toString());
				umol.setAtomExtra(bfr, Vec.append(umol.atomExtra(bfr), EXTRA_TAG));
			}
		}
		umol = MolUtil.subgraphMask(umol, mask);
		new PolymerBlock(umol).removeAll();

		let policy = RenderPolicy.defaultColourOnWhite(15);
		let measure = new OutlineMeasurement(0, 0, policy.data.pointScale);

		let effects = new RenderEffects();
		effects.atomCircleSz = Vec.numberArray(0, umol.numAtoms);
		effects.atomCircleCol = Vec.numberArray(0, umol.numAtoms);
		effects.atomDecoText = Vec.stringArray(null, umol.numAtoms);
		effects.atomDecoCol = Vec.numberArray(null, umol.numAtoms);
		effects.atomDecoSize = Vec.numberArray(null, umol.numAtoms);

		for (let n = 1; n <= umol.numAtoms; n++) if (umol.atomExtra(n).includes(EXTRA_TAG))
		{
			umol.setAtomCharge(n, 0);
			umol.setAtomUnpaired(n, 0);
			umol.setAtomIsotope(n, 0);
			effects.atomCircleSz[n - 1] = 0.1;
			effects.atomCircleCol[n - 1] = 0xFF00FF;
			effects.atomDecoText[n - 1] = umol.atomElement(n);
			effects.atomDecoCol[n - 1] = 0x800080;
			effects.atomDecoSize[n - 1] = 0.5;
			umol.setAtomElement(n, 'C');
		}
		let layout = new ArrangeMolecule(umol, measure, policy, effects);
		layout.arrange();
		layout.squeezeInto(0, 0, 300, 300);
		let gfx = new MetaVector();
		new DrawMolecule(layout, gfx).draw();
		gfx.normalise();

		this.divPreview.empty();
		dom(gfx.createSVG()).appendTo(this.divPreview).css({'pointer-events': 'none'});
	}
}

/* EOF */ }