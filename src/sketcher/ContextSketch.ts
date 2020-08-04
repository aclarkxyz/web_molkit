/*
    WebMolKit

    (c) 2010-2020 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../gfx/MetaVector.ts'/>
///<reference path='../data/CoordUtil.ts'/>
///<reference path='../data/SketchUtil.ts'/>
///<reference path='../ui/MenuProxy.ts'/>
///<reference path='../ui/ClipboardProxy.ts'/>
///<reference path='MoleculeActivity.ts'/>
///<reference path='Sketcher.ts'/>

namespace WebMolKit /* BOF */ {

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
			if (sketcher.canUndo()) menu.push({'label': 'Undo', 'click': () => sketcher.performUndo()});
			if (sketcher.canUndo()) menu.push({'label': 'Redo', 'click': () => sketcher.performRedo()});
			menu.push(null);
		}

		if (state.currentAtom > 0 || state.currentBond > 0) menu.push({'label': 'Edit', 'click': () => sketcher.editCurrent()});

		this.maybeAppend(menu, ActivityType.Delete, 'Delete');

		this.maybeAppend(menu, ActivityType.Cut, 'Cut');
		this.maybeAppend(menu, ActivityType.Copy, 'Copy');
		if (this.proxyClip.canAlwaysGet()) menu.push({'label': 'Paste', 'click': () => sketcher.performPaste()});
		//this.maybeAppend(state, ActivityType.Paste, title:"Paste");

		this.maybeAppend(menu, ActivityType.Charge, 'Charge +', {'delta': 1});
		this.maybeAppend(menu, ActivityType.Charge, 'Charge -', {'delta': -1});

		this.maybeAppend(menu, ActivityType.BondOrder, 'Bond Order 0', {'order': 0});
		this.maybeAppend(menu, ActivityType.BondOrder, 'Bond Order 1', {'order': 1});
		this.maybeAppend(menu, ActivityType.BondOrder, 'Bond Order 2', {'order': 2});
		this.maybeAppend(menu, ActivityType.BondOrder, 'Bond Order 3', {'order': 3});
		this.maybeAppend(menu, ActivityType.BondOrder, 'Bond Order 4', {'order': 4});

		this.maybeAppend(menu, ActivityType.BondType, 'Bond Wedge Up', {'type': Molecule.BONDTYPE_INCLINED});
		this.maybeAppend(menu, ActivityType.BondType, 'Bond Wedge Down', {'type': Molecule.BONDTYPE_DECLINED});
		this.maybeAppend(menu, ActivityType.BondType, 'Unknown Stereochemistry', {'type': Molecule.BONDTYPE_UNKNOWN});

		this.maybeAppend(menu, ActivityType.BondSwitch, 'Switch Geometry');
		this.maybeAppend(menu, ActivityType.BondAddTwo, 'Add Two Bonds');
		this.maybeAppend(menu, ActivityType.BondInsert, 'Insert Atom');
		// !! this.maybeAppend(menu, ActivityType.BondRotate, 'Rotate Substituent');
		this.maybeAppend(menu, ActivityType.Join, 'Join Atoms');
		// !! this.maybeAppend(menu, ActivityType.BondFix, 'Fix Geometry');
		
		this.maybeAppend(menu, ActivityType.AbbrevGroup, 'Abbreviate Group');
		this.maybeAppend(menu, ActivityType.AbbrevFormula, 'Abbreviate Formula');
		this.maybeAppend(menu, ActivityType.AbbrevClear, 'Clear Abbreviation');
		this.maybeAppend(menu, ActivityType.AbbrevExpand, 'Expand Abbreviation');
		//if state.currentAtom > 0 || state.currentBond > 0 {append(cmdID:Command.Query, title:"Query Properties")};

		if (menu.length > 0) menu.push(null);

		menu.push({'label': 'Scale to Fit', 'click': () => sketcher.autoScale()});
		menu.push({'label': 'Zoom In', 'click': () => sketcher.zoom(1.25)});
		menu.push({'label': 'Zoom Out', 'click': () => sketcher.zoom(0.8)});

		return menu;
	}

	// --------------------------------------- public methods ---------------------------------------

	private maybeAppend(menu:MenuProxyContext[], activ:ActivityType, title:string, param:Record<string, any> = null):void
	{
		let molact = new MoleculeActivity(this.state, activ, param);
		molact.execute();
		if (!molact.output.mol) return;

		menu.push({'label': title, 'click': () => this.sketcher.setState(molact.output, true)});
	}
}

/* EOF */ }