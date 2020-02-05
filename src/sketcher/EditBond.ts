/*
	WebMolKit

	(c) 2010-2018 Molecular Materials Informatics, Inc.

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

		this.populateBond(this.tabs.getPanel('Bond'));
		this.populateGeometry(this.tabs.getPanel('Geometry'));
		this.populateQuery(this.tabs.getPanel('Query'));
		this.populateExtra(this.tabs.getPanel('Extra'));
	}

	// ------------ private methods ------------

	// trigger the apply/save sequence
	private applyChanges():void
	{
		this.updateMolecule();

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
		$('<input size="6"/>').appendTo(grid).css({'grid-area': '3 / col1', 'font': 'inherit'}).attr('readonly', true).val(mol.bondFrom(bond).toString());

		$('<div/>').appendTo(grid).css({'grid-area': '3 / col2'}).text('To');
		$('<input size="6"/>').appendTo(grid).css({'grid-area': '3 / col3', 'font': 'inherit'}).attr('readonly', true).val(mol.bondTo(bond).toString());

		$('<div/>').appendTo(grid).css({'grid-area': '4 / col2'}).text('Index');
		$('<input size="6"/>').appendTo(grid).css({'grid-area': '4 / col3', 'font': 'inherit'}).attr('readonly', true).val(bond.toString());

		grid.children('input').each((idx, dom) => 
		{
			if (idx == 0) $(dom).focus();
			$(dom).keydown((event:KeyboardEvent) =>
			{
				let keyCode = event.keyCode || event.which;
				if (keyCode == 13) this.applyChanges();
				if (keyCode == 27) this.close();
			});
		});
	}

	private populateGeometry(panel:JQuery):void
	{
		panel.append('Geometry: TODO');
	}

	private populateQuery(panel:JQuery):void
	{
		panel.append('Query: TODO');
	}

	private populateExtra(panel:JQuery):void
	{
		panel.append('Extra: TODO');
	}

	// read everything back in from the dialog objects
	private updateMolecule():void
	{
		let {mol, bond} = this;

		mol.setBondOrder(bond, this.optionOrder.getSelectedIndex());
		mol.setBondType(bond, this.optionStereo.getSelectedIndex());
	}
}

/* EOF */ }