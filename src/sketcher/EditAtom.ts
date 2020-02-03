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
	Options for editing a single atom within a molecule.
*/

interface EditAtomAbbrev
{
	tr:JQuery;
	idx:number;
	bgcol:string;
}

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

	private abbrevList:AbbrevContainerFrag[] = null;
	private inputAbbrevSearch:JQuery;
	private tableAbbrev:JQuery;
	private svgAbbrev:string[] = null;
	private abbrevEntries:EditAtomAbbrev[];
	private currentAbbrev = -1;

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
		if (this.tabs.getSelectedValue() == 'Abbreviation') this.updateAbbrev();

		if (this.callbackApply) this.callbackApply(this);
	}

	private populateAtom(panel:JQuery):void
	{
		let grid = $('<div/>').appendTo(panel);
		grid.css('display', 'grid');
		grid.css('align-items', 'center');
		grid.css('justify-content', 'start');
		grid.css('grid-row-gap', '0.5em');
		grid.css('grid-column-gap', '0.5em');
		grid.css('grid-template-columns', '[start col0] auto [col1] auto [col2] auto [col3] auto [col4 end]');

		grid.append('<div style="grid-area: 1 / col0;">Symbol</div>');
		this.inputSymbol = $('<input size="20"/>').appendTo(grid);
		this.inputSymbol.css('grid-area', '1 / col1 / auto / col4');

		grid.append('<div style="grid-area: 2 / col0;">Charge</div>');
		this.inputCharge = $('<input type="number" size="6"/>').appendTo(grid);
		this.inputCharge.css('grid-area', '2 / col1');

		grid.append('<div style="grid-area: 2 / col2;">Unpaired</div>');
		this.inputUnpaired = $('<input type="number" size="6"/>').appendTo(grid);
		this.inputUnpaired.css('grid-area', '2 / col3');

		grid.append('<div style="grid-area: 3 / col0;">Hydrogens</div>');
		this.optionHydrogen = new OptionList(['Auto', 'Explicit']);
		this.optionHydrogen.render($('<div style="grid-area: 3 / col1 / auto / col3"/>').appendTo(grid));
		this.inputHydrogen = $('<input type="number" size="6"/>').appendTo(grid);
		this.inputHydrogen.css('grid-area', '3 / col3');

		grid.append('<div style="grid-area: 4 / col0;">Isotope</div>');
		this.optionIsotope = new OptionList(['Natural', 'Enriched']);
		this.optionIsotope.render($('<div style="grid-area: 4 / col1 / auto / col3"/>').appendTo(grid));
		this.inputIsotope = $('<input type="number" size="6"/>').appendTo(grid);
		this.inputIsotope.css('grid-area', '4 / col3');

		grid.append('<div style="grid-area: 5 / col0;">Mapping</div>');
		this.inputMapping = $('<input type="number" size="6"/>').appendTo(grid);
		this.inputMapping.css('grid-area', '5 / col1');

		grid.append('<div style="grid-area: 5 / col2;">Index</div>');
		this.inputIndex = $('<input type="number" size="6" readonly="readonly"/>').appendTo(grid);
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
		let divFlex = $('<div/>').appendTo(panel).css({'display': 'flex', 'align-items': 'flex-start'});
		divFlex.css({'max-width': '60vw', 'max-height': '50vh', 'overflow-y': 'scroll'});

		let spanSearch = $('<div/>').appendTo(divFlex).css({'margin-right': '0.5em', 'flex': '0 0'});
		let spanList = $('<div/>').appendTo(divFlex).css({'flex': '1 1 100%'});

		this.inputAbbrevSearch = $('<input size="10"/>').appendTo(spanSearch);
		this.inputAbbrevSearch.attr('placeholder', 'Search');
		let lastSearch = '';
		this.inputAbbrevSearch.on('input', () =>
		{
			let search = this.inputAbbrevSearch.val();
			if (search == lastSearch) return;
			lastSearch = search;
			this.fillAbbreviations();
		});

		let divButtons = $('<div/>').appendTo(spanSearch).css({'margin-top': '0.5em'});
		let btnClear = $('<button class="wmk-button wmk-button-default">Clear</button>').appendTo(divButtons);
		btnClear.click(() =>
		{
			this.selectAbbreviation(-1);
			if (this.atom > 0 && MolUtil.hasAbbrev(this.mol, this.atom)) this.applyChanges();
		});

		this.tableAbbrev = $('<table/>').appendTo(spanList).css({'border-collapse': 'collapse'});
		this.fillAbbreviations();
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
		let {mol, atom} = this;

		if (atom == 0) atom = this.atom = mol.addAtom('C', this.newX, this.newY);

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

	private updateAbbrev():void
	{
		const {mol, atom} = this;

		if (this.currentAbbrev < 0)
		{
			let el = mol.atomElement(atom);
			MolUtil.clearAbbrev(mol, atom); // (resets the element)
			mol.setAtomElement(atom, el);
		}
		else
		{
			let abbrev = this.abbrevList[this.currentAbbrev];
			mol.setAtomElement(atom, abbrev.name);
			MolUtil.setAbbrev(mol, atom, abbrev.frag);
		}
	}

	// enumerate all abbreviations compatible with the search; it will go into self-callback mode if the abbreviations need to be loaded
	private fillAbbreviations():void
	{
		if (AbbrevContainer.needsSetup())
		{
			setTimeout(() => AbbrevContainer.setupData().then(() => this.fillAbbreviations()), 1);
			return;
		}

		this.tableAbbrev.empty();

		AbbrevContainer.main.submitMolecule(this.mol, true);
		this.abbrevList = AbbrevContainer.main.getAbbrevs();
		if (!this.svgAbbrev)
		{
			this.svgAbbrev = [];
			let policy = RenderPolicy.defaultColourOnWhite(10);
			let measure = new OutlineMeasurement(0, 0, policy.data.pointScale);

			for (let abbrev of this.abbrevList)
			{
				let effects = new RenderEffects();
/* fnord
effects.atomCircleSz = floatArray(mol.numAtoms, value:0)
effects.atomCircleCol = [UInt32](repeating:0, count:mol.numAtoms)
for n in stride(from:1, through:mol.numAtoms, by:1) where mol.atomElement(n) == MolUtil.SpecialName.AbbrevAttachment
{
	mol.setAtom(n, element:"C")
	effects.atomCircleSz[n - 1] = 0.2
	effects.atomCircleCol[n - 1] = 0x00C000
}*/
				let layout = new ArrangeMolecule(abbrev.frag, measure, policy, effects);
				layout.arrange();
				// !! max size
				let gfx = new MetaVector();
				new DrawMolecule(layout, gfx).draw();
				gfx.normalise();
				this.svgAbbrev.push(gfx.createSVG());
			}

			// see if the current abbreviation matches anything
			const {mol, atom} = this;
			if (MolUtil.hasAbbrev(mol, atom))
			{
				let name = mol.atomElement(atom), mf = MolUtil.molecularFormula(MolUtil.getAbbrev(mol, atom));
				for (let n = 0; n < this.abbrevList.length; n++) if (name == this.abbrevList[n].name)
				{
					// NOTE: just going by name & basic molecule formula; using sketchMappable fails because layout can vary
					//if (CoordUtil.sketchMappable(abbrevs[n].frag, MolUtil.getAbbrev(mol, atom))) this.currentAbbrev = n;
					if (mf == MolUtil.molecularFormula(this.abbrevList[n].frag)) this.currentAbbrev = n;
					break;
				}
			}
		}

		let tr = $('<tr/>').appendTo(this.tableAbbrev);
		tr.append('<td><u>Label</u></td>');
		tr.append('<td><u>Structure</u></td>');

		this.abbrevEntries = [];
		let search = this.inputAbbrevSearch.val().toLowerCase();

		for (let n = 0; n < this.abbrevList.length; n++)
		{
			if (this.currentAbbrev != n && !this.abbrevList[n].nameSearch.includes(search)) continue;

			let entry:EditAtomAbbrev =
			{
				'tr': $('<tr/>').appendTo(this.tableAbbrev),
				'idx': n,
				'bgcol': this.abbrevEntries.length % 2 == 0 ? '#FFFFFF' : '#F8F8F8'
			};
			entry.tr.css('background-color', this.currentAbbrev == entry.idx ? colourCode(Theme.lowlight) : entry.bgcol);
			let tdLabel = $('<td/>').appendTo(entry.tr), tdStruct = $('<td/>').appendTo(entry.tr);
			tdLabel.html(this.abbrevList[n].nameHTML);

			let svg = $(this.svgAbbrev[n]).appendTo(tdStruct);
			svg.css({'pointer-events': 'none'});

			entry.tr.css({'cursor': 'pointer'});
			entry.tr.click(() => this.selectAbbreviation(n));
			entry.tr.dblclick(() => this.applyChanges());

			this.abbrevEntries.push(entry);
		}
	}

	// change currently selected abbreviation
	private selectAbbreviation(idx:number):void
	{
		if (this.currentAbbrev == idx) return;
		this.currentAbbrev = idx;

		for (let entry of this.abbrevEntries)
		{
			entry.tr.css('background-color', this.currentAbbrev == entry.idx ? colourCode(Theme.lowlight) : entry.bgcol);
		}
	}
}

/* EOF */ }