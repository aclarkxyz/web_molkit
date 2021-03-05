/*
	WebMolKit

	(c) 2010-2020 Molecular Materials Informatics, Inc.

	All rights reserved

	http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	Options for editing a single bond within a molecule.
*/

export class EditBond extends Dialog
{
	public mol:Molecule; // copy of original: may or may not be different

	private initMol:Molecule;
	private btnApply:DOM;
	private tabs:TabBar;

	private optionOrder:OptionList;
	private optionStereo:OptionList;
	private inputFrom:DOM;
	private inputTo:DOM;
	private inputIndex:DOM;

	private inputGeom1:DOM;
	private geomWidget:GeomWidget;
	private refGeom1:string;

	private fieldsWidget:ExtraFieldsWidget;

	constructor(mol:Molecule, public bond:number, private proxyClip:ClipboardProxy, private callbackApply:(source?:EditBond) => void)
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
		this.proxyClip.pushHandler(new ClipboardProxyHandler());

		let buttons = this.buttonsDOM(), body = this.bodyDOM();

		this.btnApply = dom('<button class="wmk-button wmk-button-primary">Apply</button>').appendTo(buttons).css({'margin-left': '0.5em'});
		this.btnApply.onClick(() => this.applyChanges());

		this.tabs = new TabBar(['Bond', 'Geometry', 'Query', 'Extra']);
		this.tabs.render(body);
		this.tabs.callbackSelect = (idx) =>
		{
			if (idx == 0) this.inputFrom.grabFocus();
			else if (idx == 1) this.inputGeom1.grabFocus();
		};

		this.populateBond(this.tabs.getPanelDOM('Bond'));
		this.populateGeometry(this.tabs.getPanelDOM('Geometry'));
		this.populateQuery(this.tabs.getPanelDOM('Query'));
		this.populateExtra(this.tabs.getPanelDOM('Extra'));

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
		this.mol.keepTransient = true;

		this.updateMolecule();
		if (this.tabs.getSelectedValue() == 'Geometry') this.updateGeometry();
		// ... query ...
		if (this.tabs.getSelectedValue() == 'Extra') this.updateExtra();

		this.mol.keepTransient = false;

		if (this.callbackApply) this.callbackApply(this);
	}

	private populateBond(panel:DOM):void
	{
		const {mol, bond} = this;

		let grid = dom('<div/>').appendTo(panel);
		grid.css({'display': 'grid', 'align-items': 'center', 'justify-content': 'start'});
		grid.css({'grid-row-gap': '0.5em', 'grid-column-gap': '0.5em'});
		grid.css({'grid-template-columns': '[start col0] auto [col1] auto [col2] auto [col3] auto [col4 end]'});

		dom('<div/>').appendTo(grid).css({'grid-area': '1 / col0'}).setText('Order');
		let ordersHTML:string[] = [];
		for (let o = 0; o <= 4; o++) ordersHTML.push(`&nbsp;&nbsp;${o}&nbsp;&nbsp;`);
		this.optionOrder = new OptionList(ordersHTML);
		this.optionOrder.htmlLabels = true;
		this.optionOrder.setSelectedIndex(mol.bondOrder(bond));
		this.optionOrder.render(dom('<div/>').appendTo(grid).css({'grid-column': 'col1 / col4', 'grid-row': '1'}));

		dom('<div/>').appendTo(grid).css({'grid-area': '2 / col0'}).setText('Stereo');
		this.optionStereo = new OptionList(['None', 'Up', 'Down', 'Unknown']);
		this.optionStereo.setSelectedIndex(mol.bondType(bond));
		this.optionStereo.render(dom('<div/>').appendTo(grid).css({'grid-column': 'col1 / col4', 'grid-row': '2'}));

		dom('<div/>').appendTo(grid).css({'grid-area': '3 / col0'}).setText('From');
		this.inputFrom = dom('<input size="6"/>').appendTo(grid).css({'grid-area': '3 / col1', 'font': 'inherit'});
		this.inputFrom.elInput.readOnly = true;
		this.inputFrom.setValue(mol.bondFrom(bond).toString());

		dom('<div/>').appendTo(grid).css({'grid-area': '3 / col2'}).setText('To');
		this.inputTo = dom('<input size="6"/>').appendTo(grid).css({'grid-area': '3 / col3', 'font': 'inherit'});
		this.inputTo.elInput.readOnly = true;
		this.inputTo.setValue(mol.bondTo(bond).toString());

		dom('<div/>').appendTo(grid).css({'grid-area': '4 / col2'}).setText('Index');
		this.inputIndex = dom('<input size="6"/>').appendTo(grid).css({'grid-area': '4 / col3', 'font': 'inherit'});
		this.inputIndex.elInput.readOnly = true;
		this.inputIndex.setValue(bond.toString());
	}

	private populateGeometry(panel:DOM):void
	{
		const {mol, bond} = this;

		let divContainer1 = dom('<div/>').appendTo(panel).css({'text-align': 'center'});
		let divContainer2 = dom('<div/>').appendTo(divContainer1).css({'display': 'inline-block'});
		let grid = dom('<div/>').appendTo(divContainer2);
		grid.css({'display': 'grid', 'align-items': 'center', 'justify-content': 'start'});
		grid.css({'grid-row-gap': '0.5em', 'grid-column-gap': '0.5em'});
		grid.css({'grid-template-columns': '[start col0] auto [col1] auto [col2]'});

		this.geomWidget = new GeomWidget(GeomWidgetType.Bond, mol, bond);
		this.geomWidget.render(dom('<div/>').appendTo(grid).css({'grid-area': '1 / col0 / auto / col2', 'text-align': 'center'}));

		let label1 = dom('<div/>').appendTo(grid).css({'grid-area': '2 / col0'});
		this.inputGeom1 = dom('<input type="number" size="8"/>').appendTo(grid).css({'grid-area': '2 / col1'});

		this.geomWidget.callbackSelect = (sel:GeomWidgetSelection) =>
		{
			if (sel.type == GeomWidgetSelType.Link)
			{
				let a1 = mol.bondFrom(bond), a2 = mol.bondTo(bond);
				let dx = mol.atomX(a2) - mol.atomX(a1), dy = mol.atomY(a2) - mol.atomY(a1);
				label1.setText('Distance');
				this.inputGeom1.setValue(this.refGeom1 = norm_xy(dx, dy).toFixed(3));
			}
		};
		this.geomWidget.callbackSelect(this.geomWidget.selected); // trigger initial definition
	}

	private populateQuery(panel:DOM):void
	{
		panel.appendText('Query: TODO');
	}

	private populateExtra(panel:DOM):void
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
		let strval1 = this.inputGeom1.getValue();
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