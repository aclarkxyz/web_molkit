/*
	WebMolKit

	(c) 2010-2020 Molecular Materials Informatics, Inc.

	All rights reserved

	http://molmatinf.com

	[PKG=webmolkit]
*/

import {AbbrevContainer, AbbrevContainerFrag} from '../data/AbbrevContainer';
import {Molecule} from '../data/Molecule';
import {MolUtil} from '../data/MolUtil';
import {Dialog} from '../dialog/Dialog';
import {OutlineMeasurement} from '../gfx/ArrangeMeasurement';
import {ArrangeMolecule} from '../gfx/ArrangeMolecule';
import {DrawMolecule} from '../gfx/DrawMolecule';
import {MetaVector} from '../gfx/MetaVector';
import {RenderEffects, RenderPolicy} from '../gfx/Rendering';
import {ClipboardProxy, ClipboardProxyHandler} from '../ui/ClipboardProxy';
import {OptionList} from '../ui/OptionList';
import {TabBar} from '../ui/TabBar';
import {DOM, dom} from '../util/dom';
import {Theme} from '../util/Theme';
import {angleDiffPos, colourCode, DEGRAD, KeyCode, norm_xy, RADDEG} from '../util/util';
import {Vec} from '../util/Vec';
import {ExtraFieldsWidget} from './ExtraFieldsWidget';
import {GeomWidget, GeomWidgetSelection, GeomWidgetSelType, GeomWidgetType} from './GeomWidget';
import {ActivityType, MoleculeActivity, SketchState} from './MoleculeActivity';
import {PeriodicTableWidget} from './PeriodicTableWidget';
import {QueryFieldsWidget} from './QueryFieldsWidget';

/*
	Options for editing a single atom within a molecule.
*/

interface EditAtomAbbrev
{
	tr:DOM;
	idx:number;
	bgcol:string;
}

export class EditAtom extends Dialog
{
	public mol:Molecule; // copy of original: may or may not be different
	public newX = 0;
	public newY = 0;

	private initMol:Molecule;
	private btnApply:DOM;
	private tabs:TabBar = null;

	private inputSymbol:DOM;
	private inputCharge:DOM;
	private inputUnpaired:DOM;
	private optionHydrogen:OptionList;
	private inputHydrogen:DOM;
	private optionIsotope:OptionList;
	private inputIsotope:DOM;
	private inputMapping:DOM;
	private inputIndex:DOM;
	private periodicWidget:PeriodicTableWidget;

	private abbrevList:AbbrevContainerFrag[] = null;
	private inputAbbrevSearch:DOM;
	private tableAbbrev:DOM;
	private svgAbbrev:string[] = null;
	private abbrevEntries:EditAtomAbbrev[];
	private abbrevIndices:number[] = [];
	private currentAbbrev = -1;

	private inputGeom1:DOM;
	private inputGeom2:DOM;
	private geomWidget:GeomWidget;
	private refGeom1:string;
	private refGeom2:string;

	private queryWidget:QueryFieldsWidget;
	private fieldsWidget:ExtraFieldsWidget;

	constructor(mol:Molecule, public atom:number, private proxyClip:ClipboardProxy, private callbackApply:(source?:EditAtom) => void)
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
		this.proxyClip.pushHandler(new ClipboardProxyHandler());

		let buttons = this.buttonsDOM(), body = this.bodyDOM();

		this.btnApply = dom('<button class="wmk-button wmk-button-primary">Apply</button>').appendTo(buttons).css({'margin-left': '0.5em'});
		this.btnApply.onClick(() => this.applyChanges());

		if (this.atom > 0)
		{
			this.tabs = new TabBar(['Atom', 'Abbreviation', 'Geometry', 'Query', 'Extra']);
			this.tabs.render(body);
			this.tabs.onSelect((idx) => this.selectedTab(idx));

			this.populateAtom(this.tabs.getPanelDOM('Atom'));
			this.populateAbbreviation(this.tabs.getPanelDOM('Abbreviation'));
			if (this.atom > 0) this.populateGeometry(this.tabs.getPanelDOM('Geometry'));
			this.populateQuery(this.tabs.getPanelDOM('Query'));
			this.populateExtra(this.tabs.getPanelDOM('Extra'));
		}
		else
		{
			this.populateAtom(body);
		}

		let focusable = body.findAll('input,textarea');
		if (focusable.length > 0) focusable[0].grabFocus(true);
		for (let dom of focusable)
		{
			dom.css({'font': 'inherit'});
			dom.onKeyDown((event:KeyboardEvent) =>
			{
				if (event.key == KeyCode.Enter) this.applyChanges();
				else if (event.key == KeyCode.Escape) this.close();
				else if (event.key == KeyCode.PageUp)
				{
					this.tabs.rotateSelected(-1);
					this.selectedTab(this.tabs.getSelectedIndex());
					event.preventDefault();
				}
				else if (event.key == KeyCode.PageDown)
				{
					this.tabs.rotateSelected(1);
					this.selectedTab(this.tabs.getSelectedIndex());
					event.preventDefault();
				}
				event.stopPropagation();
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
		let selTab = this.tabs ? this.tabs.getSelectedValue() : null;
		if (selTab == 'Abbreviation') this.updateAbbrev();
		if (selTab == 'Geometry') this.updateGeometry();
		if (selTab == 'Query') this.updateQuery();
		if (selTab == 'Extra') this.updateExtra();

		this.mol.keepTransient = false;

		if (this.callbackApply) this.callbackApply(this);
	}

	private populateAtom(panel:DOM):void
	{
		let grid = dom('<div/>').appendTo(panel);
		grid.css({'display': 'grid', 'align-items': 'center', 'justify-content': 'start'});
		grid.css({'grid-row-gap': '0.5em', 'grid-column-gap': '0.5em'});
		grid.css({'grid-template-columns': '[start col0] auto [col1] auto [col2] auto [col3] auto [col4 end]'});

		grid.appendHTML('<div style="grid-area: 1 / col0;">Symbol</div>');
		this.inputSymbol = dom('<input size="20"/>').appendTo(grid);
		this.inputSymbol.css({'grid-area': '1 / col1 / auto / col4}'});
		this.inputSymbol.onInput(() => this.periodicWidget.changeElement(this.inputSymbol.getValue()));

		grid.appendHTML('<div style="grid-area: 2 / col0;">Charge</div>');
		this.inputCharge = dom('<input type="number" size="6"/>').appendTo(grid);
		this.inputCharge.css({'grid-area': '2 / col1'});

		grid.appendHTML('<div style="grid-area: 2 / col2;">Unpaired</div>');
		this.inputUnpaired = dom('<input type="number" size="6"/>').appendTo(grid);
		this.inputUnpaired.css({'grid-area': '2 / col3'});

		grid.appendHTML('<div style="grid-area: 3 / col0;">Hydrogens</div>');
		this.optionHydrogen = new OptionList(['Auto', 'None', '1', '2', '3', '4', 'Other']);
		this.optionHydrogen.render(dom('<div style="grid-area: 3 / col1 / auto / col3"/>').appendTo(grid));
		this.optionHydrogen.onSelect((idx) => this.inputHydrogen.elInput.disabled = idx != 6);
		this.inputHydrogen = dom('<input type="number" size="4"/>').appendTo(grid);
		this.inputHydrogen.css({'grid-area': '3 / col3'});
		this.inputHydrogen.elInput.disabled = true;

		grid.appendHTML('<div style="grid-area: 4 / col0;">Isotope</div>');
		this.optionIsotope = new OptionList(['Natural', 'Enriched']);
		this.optionIsotope.render(dom('<div style="grid-area: 4 / col1 / auto / col3"/>').appendTo(grid));
		this.optionIsotope.onSelect((idx) => this.inputIsotope.elInput.disabled = idx == 0);
		this.inputIsotope = dom('<input type="number" size="6"/>').appendTo(grid);
		this.inputIsotope.css({'grid-area': '4 / col3'});
		this.inputIsotope.elInput.disabled = true;

		grid.appendHTML('<div style="grid-area: 5 / col0;">Mapping</div>');
		this.inputMapping = dom('<input type="number" size="6"/>').appendTo(grid);
		this.inputMapping.css({'grid-area': '5 / col1'});

		grid.appendHTML('<div style="grid-area: 5 / col2;">Index</div>');
		this.inputIndex = dom('<input type="number" size="6" readonly="readonly"/>').appendTo(grid);
		this.inputIndex.css({'grid-area': '5 / col3'});

		let divPeriodic = dom('<div/>').appendTo(grid).css({'grid-area': '6 / start / 6 / end'});
		this.periodicWidget = new PeriodicTableWidget();
		this.periodicWidget.onSelect((element) => this.inputSymbol.setValue(element));
		this.periodicWidget.onDoubleClick(() => this.applyChanges());
		this.periodicWidget.render(divPeriodic);

		const mol = this.mol, atom = this.atom;
		if (atom > 0)
		{
			this.inputSymbol.setValue(mol.atomElement(atom));
			this.inputCharge.setValue(mol.atomCharge(atom).toString());
			this.inputUnpaired.setValue(mol.atomUnpaired(atom).toString());

			let hc = mol.atomHExplicit(atom);
			if (hc == Molecule.HEXPLICIT_UNKNOWN)
			{
				this.optionHydrogen.setSelectedIndex(0);
				this.inputHydrogen.setValue(mol.atomHydrogens(atom).toString());
				this.inputHydrogen.elInput.disabled = true;
			}
			else if (hc <= 4)
			{
				this.optionHydrogen.setSelectedIndex(hc + 1);
				this.inputHydrogen.setValue(hc.toString());
				this.inputHydrogen.elInput.disabled = true;
			}
			else
			{
				this.optionHydrogen.setSelectedIndex(6);
				this.inputHydrogen.setValue(hc.toString());
				this.inputHydrogen.elInput.disabled = false;
			}
			//this.optionHydrogen.setSelectedIndex(mol.atomHExplicit(atom) == Molecule.HEXPLICIT_UNKNOWN ? 0 : 1);
			//if (mol.atomHExplicit(atom) != Molecule.HEXPLICIT_UNKNOWN) this.inputHydrogen.val(mol.atomHExplicit(atom).toString());

			this.optionIsotope.setSelectedIndex(mol.atomIsotope(atom) == Molecule.ISOTOPE_NATURAL ? 0 : 1);
			if (mol.atomIsotope(atom) != Molecule.ISOTOPE_NATURAL) this.inputIsotope.setValue(mol.atomIsotope(atom).toString());
			this.inputIsotope.elInput.disabled = mol.atomIsotope(atom) == Molecule.ISOTOPE_NATURAL;

			this.inputMapping.setValue(mol.atomMapNum(atom).toString());
			this.inputIndex.setValue(atom.toString());

			this.periodicWidget.changeElement(mol.atomElement(atom));
		}
	}

	private populateAbbreviation(panel:DOM):void
	{
		let divFlex = dom('<div/>').appendTo(panel).css({'display': 'flex', 'align-items': 'flex-start'});
		divFlex.css({'max-width': '60vw', 'max-height': '50vh', 'overflow-y': 'scroll'});

		let spanSearch = dom('<div/>').appendTo(divFlex).css({'margin-right': '0.5em', 'flex': '0 0'});
		let spanList = dom('<div/>').appendTo(divFlex).css({'flex': '1 1 100%'});

		this.inputAbbrevSearch = dom('<input size="10"/>').appendTo(spanSearch);
		this.inputAbbrevSearch.setAttr('placeholder', 'Search');
		let lastSearch = '';
		this.inputAbbrevSearch.onKeyDown((event) =>
		{
			if (event.key == KeyCode.Up) this.cycleAbbreviation(-1);
			else if (event.key == KeyCode.Down) this.cycleAbbreviation(1);
		});
		this.inputAbbrevSearch.onInput(() =>
		{
			let search = this.inputAbbrevSearch.getValue();
			if (search == lastSearch) return;
			lastSearch = search;
			this.fillAbbreviations();
		});

		let divButtons = dom('<div/>').appendTo(spanSearch).css({'margin-top': '0.5em'});
		let btnClear = dom('<button class="wmk-button wmk-button-default">Clear</button>').appendTo(divButtons);
		btnClear.onClick(() =>
		{
			this.selectAbbreviation(-1);
			if (this.atom > 0 && MolUtil.hasAbbrev(this.mol, this.atom)) this.applyChanges();
		});

		this.tableAbbrev = dom('<table/>').appendTo(spanList).css({'border-collapse': 'collapse', 'width': '100%'});
		this.fillAbbreviations();
	}

	private populateGeometry(panel:DOM):void
	{
		const {mol, atom} = this;

		let divContainer1 = dom('<div/>').appendTo(panel).css({'text-align': 'center'});
		let divContainer2 = dom('<div/>').appendTo(divContainer1).css({'display': 'inline-block'});
		let grid = dom('<div/>').appendTo(divContainer2);
		grid.css({'display': 'grid', 'align-items': 'center', 'justify-content': 'start'});
		grid.css({'grid-row-gap': '0.5em', 'grid-column-gap': '0.5em'});
		grid.css({'grid-template-columns': '[start col0] auto [col1] auto [col2] auto [col3] auto [col4 end]'});

		this.geomWidget = new GeomWidget(GeomWidgetType.Atom, mol, atom);
		this.geomWidget.render(dom('<div/>').appendTo(grid).css({'grid-area': '1 / col0 / auto / col4', 'text-align': 'center'}));

		let label1 = dom('<div/>').appendTo(grid).css({'grid-area': '2 / col0'});
		this.inputGeom1 = dom('<input type="number" size="8"/>').appendTo(grid).css({'grid-area': '2 / col1'});
		let label2 = dom('<div/>').appendTo(grid).css({'grid-area': '2 / col2'});
		this.inputGeom2 = dom('<input type="number" size="8"/>').appendTo(grid).css({'grid-area': '2 / col3'});

		this.geomWidget.callbackSelect = (sel:GeomWidgetSelection) =>
		{
			let atoms = this.geomWidget.selectionAtoms(sel);
			if (sel.type == GeomWidgetSelType.Position)
			{
				label1.setText('Position X');
				label2.setText('Y');
				this.inputGeom1.setValue(this.refGeom1 = mol.atomX(atoms[0]).toFixed(3));
				this.inputGeom2.setValue(this.refGeom2 = mol.atomY(atoms[0]).toFixed(3));
			}
			else if (sel.type == GeomWidgetSelType.Link)
			{
				let dx = mol.atomX(atoms[1]) - mol.atomX(atoms[0]), dy = mol.atomY(atoms[1]) - mol.atomY(atoms[0]);
				label1.setText('Distance');
				label2.setText('Angle');
				this.inputGeom1.setValue(this.refGeom1 = norm_xy(dx, dy).toFixed(3));
				this.inputGeom2.setValue(this.refGeom2 = (Math.atan2(dy, dx) * RADDEG).toFixed(1));
			}
			else if (sel.type == GeomWidgetSelType.Torsion)
			{
				let cx = mol.atomX(atoms[0]), cy = mol.atomY(atoms[0]);
				let th2 = Math.atan2(mol.atomY(atoms[1]) - cy, mol.atomX(atoms[1]) - cx);
				let th1 = Math.atan2(mol.atomY(atoms[2]) - cy, mol.atomX(atoms[2]) - cx);
				label1.setText('Angle');
				label2.setText('');
				this.inputGeom1.setValue(this.refGeom1 = (angleDiffPos(th2, th1) * RADDEG).toFixed(1));
				this.inputGeom2.setValue(this.refGeom2 = '');
			}
			label2.setCSS('display', sel.type == GeomWidgetSelType.Torsion ? 'none' : 'block');
			this.inputGeom2.setCSS('display', sel.type == GeomWidgetSelType.Torsion ? 'none' : 'block');
		};
		this.geomWidget.callbackSelect(this.geomWidget.selected); // trigger initial definition
	}

	private populateQuery(panel:DOM):void
	{
		this.queryWidget = new QueryFieldsWidget(this.mol, this.atom, 0);
		this.queryWidget.render(panel);
	}

	private populateExtra(panel:DOM):void
	{
		let fields = [...this.mol.atomExtra(this.atom), ...this.mol.atomTransient(this.atom)];
		this.fieldsWidget = new ExtraFieldsWidget(fields);
		this.fieldsWidget.render(panel);
	}

	// read everything back in from the dialog objects
	private updateMolecule():void
	{
		let {mol, atom} = this;

		if (atom == 0) atom = this.atom = mol.addAtom('C', this.newX, this.newY);

		let sym = this.inputSymbol.getValue();
		if (sym != '') mol.setAtomElement(atom, sym);

		let chg = parseInt(this.inputCharge.getValue());
		if (chg > -20 && chg < 20) mol.setAtomCharge(atom, chg);

		let unp = parseInt(this.inputUnpaired.getValue());
		if (unp >= 0 && unp < 20) mol.setAtomUnpaired(atom, unp);

		let hcidx = this.optionHydrogen.getSelectedIndex();
		if (hcidx == 0) mol.setAtomHExplicit(atom, Molecule.HEXPLICIT_UNKNOWN);
		else if (hcidx <= 5) mol.setAtomHExplicit(atom, hcidx - 1);
		else
		{
			let hyd = parseInt(this.inputHydrogen.getValue());
			if (hyd >= 0 && hyd < 20) mol.setAtomHExplicit(atom, hyd);
		}

		if (this.optionIsotope.getSelectedIndex() == 1)
		{
			let iso = parseInt(this.inputIsotope.getValue());
			if (iso >= 0 && iso < 300) mol.setAtomIsotope(atom, iso);
		}
		else mol.setAtomIsotope(atom, Molecule.ISOTOPE_NATURAL);

		let map = parseInt(this.inputMapping.getValue());
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

	private updateGeometry():void
	{
		let strval1 = this.inputGeom1.getValue(), strval2 = this.inputGeom2.getValue();
		if (this.refGeom1 == strval1 && this.refGeom2 == strval2) return;

		const {mol} = this;
		let sel = this.geomWidget.selected, atoms = this.geomWidget.selectionAtoms(sel);

		if (sel.type == GeomWidgetSelType.Position)
		{
			let x = parseFloat(strval1), y = parseFloat(strval2);
			if (isNaN(x) || isNaN(y) || Math.abs(x) > 1E6 || Math.abs(y) > 1E6) return; // non-sane
			mol.setAtomPos(atoms[0], x, y);
		}
		else if (sel.type == GeomWidgetSelType.Link)
		{
			if (this.refGeom1 != strval1)
			{
				let dist = parseFloat(strval1);
				if (isNaN(dist) || Math.abs(dist) > 100) return; // non-sane
				let mask = Vec.booleanArray(false, mol.numAtoms);
				mask[atoms[1] - 1] = true;
				let instate:SketchState = {'mol': mol, 'currentAtom': 0, 'currentBond': mol.findBond(atoms[0], atoms[1]), 'selectedMask': mask};
				let molact = new MoleculeActivity(instate, ActivityType.BondDist, {'dist': dist});
				molact.execute();
				if (molact.output.mol) this.mol = molact.output.mol;
				return;
			}
			else if (this.refGeom2 != strval2)
			{
				let angle = parseFloat(strval2);
				if (isNaN(angle)) return; // non-sane
				let mask = Vec.booleanArray(false, mol.numAtoms);
				mask[atoms[1] - 1] = true;
				let instate:SketchState = {'mol': mol, 'currentAtom': 0, 'currentBond': mol.findBond(atoms[0], atoms[1]), 'selectedMask': mask};
				let molact = new MoleculeActivity(instate, ActivityType.AlignAngle, {'angle': angle * DEGRAD});
				molact.execute();
				if (molact.output.mol) this.mol = molact.output.mol;
				return;
			}
		}
		else if (sel.type == GeomWidgetSelType.Torsion)
		{
			let angle = parseFloat(strval1);
			if (isNaN(angle)) return; // non-sane
			let mask = Vec.booleanArray(false, mol.numAtoms);
			for (let a of atoms) mask[a - 1] = true;
			let instate:SketchState = {'mol': mol, 'currentAtom': atoms[2], 'currentBond': 0, 'selectedMask': mask};
			let molact = new MoleculeActivity(instate, ActivityType.AdjustTorsion, {'angle': angle * DEGRAD});
			molact.execute();
			if (molact.output.mol) this.mol = molact.output.mol;
			return;
		}
	}

	private updateQuery():void
	{
		this.queryWidget.updateAtom();
	}

	private updateExtra():void
	{
		this.mol.setAtomExtra(this.atom, this.fieldsWidget.getExtraFields());
		this.mol.setAtomTransient(this.atom, this.fieldsWidget.getTransientFields());
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
				let mol = abbrev.frag.clone();
				effects.atomCircleSz = Vec.numberArray(0, mol.numAtoms);
				effects.atomCircleCol = Vec.numberArray(0, mol.numAtoms);
				for (let n = 1; n <= mol.numAtoms; n++) if (mol.atomElement(n) == MolUtil.ABBREV_ATTACHMENT)
				{
					mol.setAtomElement(n, 'C');
					effects.atomCircleSz[n - 1] = 0.2;
					effects.atomCircleCol[n - 1] = 0x00C000;
				}
				let layout = new ArrangeMolecule(mol, measure, policy, effects);
				layout.arrange();
				// !! max size
				let gfx = new MetaVector();
				new DrawMolecule(layout, gfx).draw();
				gfx.normalise();
				this.svgAbbrev.push(gfx.createSVG());
			}

			// see if the current abbreviation matches anything
			const {mol, atom} = this;
			if (atom > 0 && MolUtil.hasAbbrev(mol, atom))
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

		let tr = dom('<tr/>').appendTo(this.tableAbbrev);
		tr.appendHTML('<td><u>Label</u></td>');
		tr.appendHTML('<td><u>Structure</u></td>');

		this.abbrevEntries = [];
		this.abbrevIndices = [];
		let search = this.inputAbbrevSearch.getValue().toLowerCase();

		for (let n = 0; n < this.abbrevList.length; n++)
		{
			if (this.currentAbbrev != n && !this.abbrevList[n].nameSearch.includes(search)) continue;

			let entry:EditAtomAbbrev =
			{
				'tr': dom('<tr/>').appendTo(this.tableAbbrev),
				'idx': n,
				'bgcol': this.abbrevEntries.length % 2 == 0 ? '#FFFFFF' : '#F8F8F8'
			};
			entry.tr.setCSS('background-color', this.currentAbbrev == entry.idx ? colourCode(Theme.lowlight) : entry.bgcol);
			let tdLabel = dom('<td/>').appendTo(entry.tr), tdStruct = dom('<td/>').appendTo(entry.tr);
			tdLabel.setHTML(this.abbrevList[n].nameHTML);

			dom(this.svgAbbrev[n]).appendTo(tdStruct).css({'display': 'block', 'pointer-events': 'none'});

			entry.tr.css({'cursor': 'pointer'});
			entry.tr.onClick(() => this.selectAbbreviation(n));
			entry.tr.onDblClick((event) => this.applyChanges());

			this.abbrevEntries.push(entry);
			this.abbrevIndices.push(n);
		}
	}

	// change currently selected abbreviation
	private selectAbbreviation(idx:number):void
	{
		if (this.currentAbbrev == idx) return;
		this.currentAbbrev = idx;

		for (let entry of this.abbrevEntries)
		{
			entry.tr.setCSS('background-color', this.currentAbbrev == entry.idx ? colourCode(Theme.lowlight) : entry.bgcol);
			if (this.currentAbbrev == entry.idx) entry.tr.el.scrollIntoView({'block': 'nearest'});
		}
	}

	// move abbreviation selection up or down
	private cycleAbbreviation(dir:number):void
	{
		let sz = this.abbrevIndices.length;
		if (sz == 0) return;

		let idx = this.abbrevIndices.indexOf(this.currentAbbrev);
		if (idx < 0)
		{
			if (dir < 0) idx = sz - 1; else idx = 0;
		}
		else idx = (idx + sz + dir) % sz;

		this.selectAbbreviation(this.abbrevIndices[idx]);
	}

	private selectedTab(idx:number):void
	{
		if (idx == 0) this.inputSymbol.grabFocus();
		else if (idx == 1) this.inputAbbrevSearch.grabFocus();
		else if (idx == 2) this.inputGeom1.grabFocus();
	}
}

