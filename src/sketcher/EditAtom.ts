/*
	WebMolKit

	(c) 2010-2018 Molecular Materials Informatics, Inc.

	All rights reserved

	http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../dialog/Dialog.ts'/>
///<reference path='../data/Molecule.ts'/>
///<reference path='../ui/TabBar.ts'/>
///<reference path='../ui/OptionList.ts'/>

namespace WebMolKit /* BOF */ {

/*
	Options for editing a single atom within a molecule.
*/

export class EditAtom extends Dialog
{
	public mol:Molecule; // copy of original: may or may not be different
	public newX = 0;
	public newY = 0;

	private initMol:Molecule;
	private btnApply:JQuery;
	private tabs:TabBar;

	private inputSymbol:JQuery;
	private inputCharge:JQuery;
	private inputUnpaired:JQuery;
	private optionHydrogen:OptionList;
	private inputHydrogen:JQuery;
	private optionIsotope:OptionList;
	private inputIsotope:JQuery;
	private inputMapping:JQuery;
	private inputIndex:JQuery;

	constructor(mol:Molecule, public atom:number, private callbackApply:(source?:EditAtom) => void)
	{
		super();

		this.initMol = mol;
		this.mol = mol.clone();

		this.title = 'Edit Atom';
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

		this.tabs = new TabBar(['Atom', 'Abbreviation', 'Geometry', 'Query', 'Extra']);
		this.tabs.render(body);

		this.populateAtom(this.tabs.getPanel('Atom'));
		this.populateAbbreviation(this.tabs.getPanel('Abbreviation'));
		this.populateGeometry(this.tabs.getPanel('Geometry'));
		this.populateQuery(this.tabs.getPanel('Query'));
		this.populateExtra(this.tabs.getPanel('Extra'));

		setTimeout(() => this.inputSymbol.focus(), 1);
	}

	// ------------ private methods ------------

	// trigger the apply/save sequence
	private applyChanges():void
	{
		this.updateMolecule();
		if (this.callbackApply) this.callbackApply(this);
	}

	private populateAtom(panel:JQuery):void
	{
		let grid = $('<div></div>').appendTo(panel);
		grid.css('display', 'grid');
		grid.css('align-items', 'center');
		grid.css('justify-content', 'start');
		grid.css('grid-row-gap', '0.5em');
		grid.css('grid-column-gap', '0.5em');
		grid.css('grid-template-columns', '[start col0] auto [col1] auto [col2] auto [col3] auto [col4 end]');

		grid.append('<div style="grid-area: 1 / col0;">Symbol</div>');
		this.inputSymbol = $('<input size="20"></input>').appendTo(grid);
		this.inputSymbol.css('grid-area', '1 / col1 / auto / col4');

		grid.append('<div style="grid-area: 2 / col0;">Charge</div>');
		this.inputCharge = $('<input type="number" size="6"></input>').appendTo(grid);
		this.inputCharge.css('grid-area', '2 / col1');

		grid.append('<div style="grid-area: 2 / col2;">Unpaired</div>');
		this.inputUnpaired = $('<input type="number" size="6"></input>').appendTo(grid);
		this.inputUnpaired.css('grid-area', '2 / col3');

		grid.append('<div style="grid-area: 3 / col0;">Hydrogens</div>');
		this.optionHydrogen = new OptionList(['Auto', 'Explicit']);
		this.optionHydrogen.render($('<div style="grid-area: 3 / col1 / auto / col3"></div>').appendTo(grid));
		this.inputHydrogen = $('<input type="number" size="6"></input>').appendTo(grid);
		this.inputHydrogen.css('grid-area', '3 / col3');

		grid.append('<div style="grid-area: 4 / col0;">Isotope</div>');
		this.optionIsotope = new OptionList(['Natural', 'Enriched']);
		this.optionIsotope.render($('<div style="grid-area: 4 / col1 / auto / col3"></div>').appendTo(grid));
		this.inputIsotope = $('<input type="number" size="6"></input>').appendTo(grid);
		this.inputIsotope.css('grid-area', '4 / col3');

		grid.append('<div style="grid-area: 5 / col0;">Mapping</div>');
		this.inputMapping = $('<input type="number" size="6"></input>').appendTo(grid);
		this.inputMapping.css('grid-area', '5 / col1');

		grid.append('<div style="grid-area: 5 / col2;">Index</div>');
		this.inputIndex = $('<input type="number" size="6" readonly="readonly"></input>').appendTo(grid);
		this.inputIndex.css('grid-area', '5 / col3');

		grid.find('input').css('font', 'inherit');

		const mol = this.mol, atom = this.atom;
		if (atom > 0)
		{
			this.inputSymbol.val(mol.atomElement(atom));
			this.inputCharge.val(mol.atomCharge(atom).toString());
			this.inputUnpaired.val(mol.atomUnpaired(atom).toString());
			this.optionHydrogen.setSelectedIndex(mol.atomHExplicit(atom) == Molecule.HEXPLICIT_UNKNOWN ? 0 : 1);
			if (mol.atomHExplicit(atom) != Molecule.HEXPLICIT_UNKNOWN) this.inputHydrogen.val(mol.atomHExplicit(atom).toString());
			this.optionIsotope.setSelectedIndex(mol.atomIsotope(atom) == Molecule.ISOTOPE_NATURAL ? 0 : 1);
			if (mol.atomIsotope(atom) == Molecule.ISOTOPE_NATURAL) this.inputIsotope.val(mol.atomIsotope(atom).toString());
			this.inputMapping.val(mol.atomMapNum(atom).toString());
			this.inputIndex.val(atom.toString());
		}

		this.inputSymbol.focus();

		for (let input of [this.inputSymbol, this.inputCharge, this.inputUnpaired, this.inputHydrogen, this.inputIsotope, this.inputMapping, this.inputIndex])
		{
			input.keydown((event:KeyboardEvent) =>
			{
				let keyCode = event.keyCode || event.which;
				if (keyCode == 13) this.applyChanges();
			});
		}
	}

	private populateAbbreviation(panel:JQuery):void
	{
		panel.append('Abbreviations: TODO');
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
		let mol = this.mol, atom = this.atom;

		if (atom == 0) atom = mol.addAtom('C', this.newX, this.newY);

		let sym = this.inputSymbol.val();
		if (sym != '') mol.setAtomElement(atom, sym);

		let chg = parseInt(this.inputCharge.val());
		if (chg > -20 && chg < 20) mol.setAtomCharge(atom, chg);

		let unp = parseInt(this.inputUnpaired.val());
		if (unp >= 0 && unp < 20) mol.setAtomUnpaired(atom, unp);

		if (this.optionHydrogen.getSelectedIndex() == 1)
		{
			let hyd = parseInt(this.inputHydrogen.val());
			if (hyd >= 0 && hyd < 20) mol.setAtomHExplicit(atom, hyd);
		}
		else mol.setAtomHExplicit(atom, Molecule.HEXPLICIT_UNKNOWN);

		if (this.optionIsotope.getSelectedIndex() == 1)
		{
			let iso = parseInt(this.inputIsotope.val());
			if (iso >= 0 && iso < 300) mol.setAtomIsotope(atom, iso);
		}
		else mol.setAtomIsotope(atom, Molecule.ISOTOPE_NATURAL);

		let map = parseInt(this.inputMapping.val());
		if (!isNaN(map)) mol.setAtomMapNum(atom, map);
	}
}

/* EOF */ }