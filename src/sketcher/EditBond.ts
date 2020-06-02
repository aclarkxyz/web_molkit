/*
	WebMolKit

	(c) 2010-2020 Molecular Materials Informatics, Inc.

	All rights reserved

	http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../dialog/Dialog.ts'/>
///<reference path='../data/Molecule.ts'/>
///<reference path='../data/AbbrevContainer.ts'/>
///<reference path='../gfx/Rendering.ts'/>
///<reference path='../gfx/ArrangeMolecule.ts'/>
///<reference path='../gfx/DrawMolecule.ts'/>
///<reference path='../ui/TabBar.ts'/>
///<reference path='../ui/OptionList.ts'/>
///<reference path='GeomWidget.ts'/>
///<reference path='ExtraFieldsWidget.ts'/>

namespace WebMolKit /* BOF */ {

/*
	Options for editing a single bond within a molecule.
*/

export class EditBond extends Dialog
{
	public mol:Molecule; // copy of original: may or may not be different

	private initMol:Molecule;
	private btnApply:JQuery;
	private tabs:TabBar;

	private optionOrder:OptionList;
	private optionStereo:OptionList;
	private inputFrom:JQuery;
	private inputTo:JQuery;
	private inputIndex:JQuery;

	private inputGeom1:JQuery;
	private geomWidget:GeomWidget;
	private refGeom1:string;

	private fieldsWidget:ExtraFieldsWidget;

	constructor(mol:Molecule, public bond:number, private callbackApply:(source?:EditBond) => void)
	{
		super();

		this.initMol = mol;
		this.mol = mol.clone();

		this.title = 'Edit Bond';
		this.minPortionWidth = 20;
		this.maxPortionWidth = 95;
	}

	// builds the dialog content
	protected populate():void
	{
		let buttons = this.buttons(), body = this.body();

		buttons.append(this.btnClose); // easy way to reorder
		buttons.append(' ');
		this.btnApply = $('<button class="wmk-button wmk-button-primary">Apply</button>').appendTo(buttons);
		this.btnApply.click(() => this.applyChanges());

		this.tabs = new TabBar(['Bond', 'Geometry', 'Query', 'Extra']);
		this.tabs.render(body);
		this.tabs.callbackSelect = (idx) =>
		{
			if (idx == 0) this.inputFrom.focus();
			else if (idx == 1) this.inputGeom1.focus();
		};

		this.populateBond(this.tabs.getPanel('Bond'));
		this.populateGeometry(this.tabs.getPanel('Geometry'));
		this.populateQuery(this.tabs.getPanel('Query'));
		this.populateExtra(this.tabs.getPanel('Extra'));

		body.find('input').each((idx, child) =>
		{
			let dom = $(child).css({'font': 'inherit'});
			if (idx == 0) dom.focus();
			dom.keydown((event:JQueryKeyEventObject) =>
			{
				let keyCode = event.keyCode || event.which;
				if (keyCode == 13) this.applyChanges();
				if (keyCode == 27) this.close();
			});
		});
	}

	// ------------ private methods ------------

	// trigger the apply/save sequence
	private applyChanges():void
	{
		this.mol.keepTransient = true;

		this.updateMolecule();
		if (this.tabs.getSelectedValue() == 'Geometry') this.updateGeometry();
		// ... query ...
		if (this.tabs.getSelectedValue() == 'Extra') this.updateExtra();

		this.mol.keepTransient = false;

		if (this.callbackApply) this.callbackApply(this);
	}

	private populateBond(panel:JQuery):void
	{
		const {mol, bond} = this;

		let grid = $('<div/>').appendTo(panel);
		grid.css({'display': 'grid', 'align-items': 'center', 'justify-content': 'start'});
		grid.css({'grid-row-gap': '0.5em', 'grid-column-gap': '0.5em'});
		grid.css('grid-template-columns', '[start col0] auto [col1] auto [col2] auto [col3] auto [col4 end]');

		$('<div/>').appendTo(grid).css({'grid-area': '1 / col0'}).text('Order');
		let ordersHTML:string[] = [];
		for (let o = 0; o <= 4; o++) ordersHTML.push(`&nbsp;&nbsp;${o}&nbsp;&nbsp;`);
		this.optionOrder = new OptionList(ordersHTML);
		this.optionOrder.htmlLabels = true;
		this.optionOrder.setSelectedIndex(mol.bondOrder(bond));
		this.optionOrder.render($('<div/>').appendTo(grid).css({'grid-column': 'col1 / col4', 'grid-row': '1'}));

		$('<div/>').appendTo(grid).css({'grid-area': '2 / col0'}).text('Stereo');
		this.optionStereo = new OptionList(['None', 'Up', 'Down', 'Unknown']);
		this.optionStereo.setSelectedIndex(mol.bondType(bond));
		this.optionStereo.render($('<div/>').appendTo(grid).css({'grid-column': 'col1 / col4', 'grid-row': '2'}));

		$('<div/>').appendTo(grid).css({'grid-area': '3 / col0'}).text('From');
		this.inputFrom = $('<input size="6"/>').appendTo(grid).css({'grid-area': '3 / col1', 'font': 'inherit'}).attr('readonly', 'true');
		this.inputFrom.val(mol.bondFrom(bond).toString());

		$('<div/>').appendTo(grid).css({'grid-area': '3 / col2'}).text('To');
		this.inputTo = $('<input size="6"/>').appendTo(grid).css({'grid-area': '3 / col3', 'font': 'inherit'}).attr('readonly', 'true');
		this.inputTo.val(mol.bondTo(bond).toString());

		$('<div/>').appendTo(grid).css({'grid-area': '4 / col2'}).text('Index');
		this.inputIndex = $('<input size="6"/>').appendTo(grid).css({'grid-area': '4 / col3', 'font': 'inherit'}).attr('readonly', 'true');
		this.inputIndex.val(bond.toString());
	}

	private populateGeometry(panel:JQuery):void
	{
		const {mol, bond} = this;

		let divContainer1 = $('<div/>').appendTo(panel).css({'text-align': 'center'});
		let divContainer2 = $('<div/>').appendTo(divContainer1).css({'display': 'inline-block'});
		let grid = $('<div/>').appendTo(divContainer2);
		grid.css({'display': 'grid', 'align-items': 'center', 'justify-content': 'start'});
		grid.css({'grid-row-gap': '0.5em', 'grid-column-gap': '0.5em'});
		grid.css('grid-template-columns', '[start col0] auto [col1] auto [col2]');

		this.geomWidget = new GeomWidget(GeomWidgetType.Bond, mol, bond);
		this.geomWidget.render($('<div/>').appendTo(grid).css({'grid-area': '1 / col0 / auto / col2', 'text-align': 'center'}));

		let label1 = $('<div/>').appendTo(grid).css({'grid-area': '2 / col0'});
		this.inputGeom1 = $('<input type="number" size="8"/>').appendTo(grid).css({'grid-area': '2 / col1'});

		this.geomWidget.callbackSelect = (sel:GeomWidgetSelection) =>
		{
			if (sel.type == GeomWidgetSelType.Link)
			{
				let a1 = mol.bondFrom(bond), a2 = mol.bondTo(bond);
				let dx = mol.atomX(a2) - mol.atomX(a1), dy = mol.atomY(a2) - mol.atomY(a1);
				label1.text('Distance');
				this.inputGeom1.val(this.refGeom1 = norm_xy(dx, dy).toFixed(3));
			}
		};
		this.geomWidget.callbackSelect(this.geomWidget.selected); // trigger initial definition
	}

	private populateQuery(panel:JQuery):void
	{
		panel.append('Query: TODO');
	}

	private populateExtra(panel:JQuery):void
	{
		let fields = [...this.mol.bondExtra(this.bond), ...this.mol.bondTransient(this.bond)];
		this.fieldsWidget = new ExtraFieldsWidget(fields);
		this.fieldsWidget.render(panel);
	}

	// read everything back in from the dialog objects
	private updateMolecule():void
	{
		let {mol, bond} = this;

		mol.setBondOrder(bond, this.optionOrder.getSelectedIndex());
		mol.setBondType(bond, this.optionStereo.getSelectedIndex());
	}

	private updateGeometry():void
	{
		let strval1 = this.inputGeom1.val().toString();
		if (this.refGeom1 == strval1) return;

		const {mol} = this;
		let sel = this.geomWidget.selected, atoms = this.geomWidget.selectionAtoms(sel);

		if (sel.type == GeomWidgetSelType.Link)
		{
			if (this.refGeom1 != strval1)
			{
				let dist = parseFloat(strval1);
				if (isNaN(dist) || Math.abs(dist) > 100) return; // non-sane
				let instate:SketchState = {'mol': mol, 'currentAtom': 0, 'currentBond': mol.findBond(atoms[0], atoms[1]), 'selectedMask': null};
				let molact = new MoleculeActivity(instate, ActivityType.BondDist, {'dist': dist});
				molact.execute();
				this.mol = molact.output.mol;
				return;
			}
		}
	}

	private updateExtra():void
	{
		this.mol.setBondExtra(this.bond, this.fieldsWidget.getExtraFields());
		this.mol.setBondTransient(this.bond, this.fieldsWidget.getTransientFields());
	}
}

/* EOF */ }