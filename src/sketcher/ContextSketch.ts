/*
    WebMolKit

    (c) 2010-2020 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {Molecule} from '../data/Molecule';
import {PolymerBlock} from '../data/PolymerBlock';
import {ClipboardProxy} from '../ui/ClipboardProxy';
import {MenuProxyContext} from '../ui/MenuProxy';
import {Vec} from '../util/Vec';
import {ActivityType, MoleculeActivity, SketchState} from './MoleculeActivity';
import {Sketcher} from './Sketcher';

/*
	Population of a context menu for the sketcher, which depends on current state.
*/

export class ContextSketch
{
	constructor(private state:SketchState, private sketcher:Sketcher, private proxyClip:ClipboardProxy)
	{
	}

	public populate():MenuProxyContext[]
	{
		const {state, sketcher} = this;

		let menu:MenuProxyContext[] = [];

		if (sketcher.canUndo() || sketcher.canRedo())
		{
			if (sketcher.canUndo()) menu.push({label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => sketcher.performUndo()});
			if (sketcher.canRedo()) menu.push({label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z', click: () => sketcher.performRedo()});
			menu.push(null);
		}

		if (state.currentAtom > 0 || state.currentBond > 0) menu.push({label: 'Edit', 'accelerator': 'Enter', click: () => sketcher.editCurrent()});

		this.maybeAppend(menu, 'Delete', 'D', ActivityType.Delete);

		this.maybeAppend(menu, 'Cut', 'CmdOrCtrl+X', ActivityType.Cut);
		this.maybeAppend(menu, 'Copy', 'CmdOrCtrl+C', ActivityType.Copy);
		if (this.proxyClip.canAlwaysGet()) menu.push({label: 'Paste', 'accelerator': 'CmdOrCtrl+V', click: () => sketcher.performPaste()});
		//this.maybeAppend(state, ActivityType.Paste, title:"Paste");

		this.maybeAppend(menu, 'Charge +', 'Shift+=', ActivityType.Charge, {delta: 1});
		this.maybeAppend(menu, 'Charge -', 'Shift+-', ActivityType.Charge, {delta: -1});

		this.maybeAppend(menu, 'Bond Order 0', '0', ActivityType.BondOrder, {order: 0});
		this.maybeAppend(menu, 'Bond Order 1', '1', ActivityType.BondOrder, {order: 1});
		this.maybeAppend(menu, 'Bond Order 2', '2', ActivityType.BondOrder, {order: 2});
		this.maybeAppend(menu, 'Bond Order 3', '3', ActivityType.BondOrder, {order: 3});
		this.maybeAppend(menu, 'Bond Order 4', null, ActivityType.BondOrder, {order: 4});

		this.maybeAppend(menu, 'Unknown Stereochemistry', '4', ActivityType.BondType, {type: Molecule.BONDTYPE_UNKNOWN});
		this.maybeAppend(menu, 'Bond Wedge Up', '5', ActivityType.BondType, {type: Molecule.BONDTYPE_INCLINED});
		this.maybeAppend(menu, 'Bond Wedge Down', '6', ActivityType.BondType, {type: Molecule.BONDTYPE_DECLINED});

		this.maybeAppend(menu, 'Switch Geometry', null, ActivityType.BondSwitch);
		this.maybeAppend(menu, 'Add Two Bonds', 'Shift+D', ActivityType.BondAddTwo);
		this.maybeAppend(menu, 'Insert Atom', null, ActivityType.BondInsert);
		this.maybeAppend(menu, 'Join Atoms', null, ActivityType.Join);
		// !! this.maybeAppend(menu, ActivityType.BondFix, 'Fix Geometry');

		this.maybeAppend(menu, 'Abbreviate Group', '/', ActivityType.AbbrevGroup);
		this.maybeAppend(menu, 'Abbreviate Formula', '\\', ActivityType.AbbrevFormula);
		this.maybeAppend(menu, 'Clear Abbreviation', 'Shift+\\', ActivityType.AbbrevClear);
		this.maybeAppend(menu, 'Expand Abbreviation', 'Shift+/', ActivityType.AbbrevExpand);
		//if state.currentAtom > 0 || state.currentBond > 0 {append(cmdID:Command.Query, title:"Query Properties")};

		let rotateSub = this.rotateSubMenu();
		if (Vec.notBlank(rotateSub)) menu.push({label: 'Rotate', subMenu: rotateSub});

		let querySub = this.querySubMenu();
		if (Vec.notBlank(querySub)) menu.push({label: 'Query', subMenu: querySub});

		let poly = new PolymerBlock(state.mol);
		for (let units of poly.getUnits())
		{
			let a1 = state.currentAtom, a2 = 0;
			if (state.currentBond > 0) [a1, a2] = state.mol.bondFromTo(state.currentBond);
			if (units.atoms.includes(a1) || units.atoms.includes(a2))
			{
				let label = 'Polymer Block (' + units.atoms.length + ' atom' + (units.atoms.length == 1 ? '' : 's') + ')';
				menu.push({label: label, click: () => sketcher.performPolymerBlock(units.atoms)});
			}
		}

		if (menu.length > 0) menu.push(null);

		menu.push({label: 'Scale to Fit', click: () => sketcher.autoScale()});
		menu.push({label: 'Zoom In', 'accelerator': '=', click: () => sketcher.zoom(1.25)});
		menu.push({label: 'Zoom Out', 'accelerator': '-', click: () => sketcher.zoom(0.8)});

		return menu;
	}

	// ------------ private methods ------------

	private maybeAppend(menu:MenuProxyContext[], title:string, accelerator:string, activ:ActivityType, param:Record<string, any> = null):void
	{
		let molact = new MoleculeActivity(this.state, activ, param);
		molact.execute();
		if (!molact.output.mol && !molact.toClipboard) return;

		menu.push({label: title, 'accelerator': accelerator, click: () =>
		{
			this.sketcher.setState(molact.output, true);
			if (molact.toClipboard) this.proxyClip.setString(molact.toClipboard);
		}});
	}

	private rotateSubMenu():MenuProxyContext[]
	{
		let menu:MenuProxyContext[] = [];

		this.maybeAppend(menu, 'Bond', null, ActivityType.BondRotate);
		this.maybeAppend(menu, '+1 \u{00B0}', null, ActivityType.Rotate, {theta: 1});
		this.maybeAppend(menu, '-1 \u{00B0}', null, ActivityType.Rotate, {theta: -1});
		this.maybeAppend(menu, '+5 \u{00B0}', null, ActivityType.Rotate, {theta: 5});
		this.maybeAppend(menu, '-5 \u{00B0}', null, ActivityType.Rotate, {theta: -5});
		this.maybeAppend(menu, '+15 \u{00B0}', null, ActivityType.Rotate, {theta: 15});
		this.maybeAppend(menu, '-15 \u{00B0}', null, ActivityType.Rotate, {theta: -15});
		this.maybeAppend(menu, '+30 \u{00B0}', 'Shift+[', ActivityType.Rotate, {theta: 30});
		this.maybeAppend(menu, '-30 \u{00B0}', 'Shift+]', ActivityType.Rotate, {theta: -30});
		this.maybeAppend(menu, 'H-Flip', 'Shift+,', ActivityType.Flip, {axis: 'hor'});
		this.maybeAppend(menu, 'V-Flip', 'Shift+.', ActivityType.Flip, {axis: 'ver'});
		this.maybeAppend(menu, 'Align', null, ActivityType.AlignRegular);

		return menu;
	}

	private querySubMenu():MenuProxyContext[]
	{
		let menu:MenuProxyContext[] = [];

		this.maybeAppend(menu, 'Clear', null, ActivityType.QueryClear);
		this.maybeAppend(menu, 'Copy', null, ActivityType.QueryCopy);

		// TODO: add common use cases; implement in MoleculeActivity

		return menu;
	}
}

