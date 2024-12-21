/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {ButtonBank, ButtonBankItem} from '../ui/ButtonBank';

/*
	ToolBank: buttons for the Sketcher main command bank.
*/

export enum ToolBankItem
{
	Arrow = 'arrow',
	Rotate = 'rotate',
	Pan = 'pan',
	Drag = 'drag',
	Erasor = 'erasor',
	BondOrder0 = 'bond:Order0',
	BondOrder1 = 'bond:Order1',
	BondOrder2 = 'bond:Order2',
	BondOrder3 = 'bond:Order3',
	BondUnknown = 'bond:Unknown',
	BondInclined = 'bond:Inclined',
	BondDeclined = 'bond:Declined',
	RingAliph = 'ringAliph',
	RingArom = 'ringArom',
	AtomPlus = 'atomPlus',
	AtomMinus = 'atomMinus',

	BondPfx = 'bond:',
	ElementPfx = 'element:',
}

import svgToolSelect from '@reswmk/img/actions/ToolSelect.svg';
import svgToolRotate from '@reswmk/img/actions/ToolRotate.svg';
import svgToolPan from '@reswmk/img/actions/ToolPan.svg';
import svgToolDrag from '@reswmk/img/actions/ToolDrag.svg';
import svgToolErasor from '@reswmk/img/actions/ToolErasor.svg';
import svgBondZero from '@reswmk/img/actions/BondZero.svg';
import svgBondOne from '@reswmk/img/actions/BondOne.svg';
import svgBondTwo from '@reswmk/img/actions/BondTwo.svg';
import svgBondThree from '@reswmk/img/actions/BondThree.svg';
import svgBondSquig from '@reswmk/img/actions/BondSquig.svg';
import svgBondUp from '@reswmk/img/actions/BondUp.svg';
import svgBondDown from '@reswmk/img/actions/BondDown.svg';
import svgToolRing from '@reswmk/img/actions/ToolRing.svg';
import svgToolArom from '@reswmk/img/actions/ToolArom.svg';
import svgAtomPlus from '@reswmk/img/actions/AtomPlus.svg';
import svgAtomMinus from '@reswmk/img/actions/AtomMinus.svg';

const TOOLS_MAIN:ButtonBankItem[] =
[
	{id: ToolBankItem.Arrow, svg: svgToolSelect, helpText: 'Selection tool.', mnemonic: 'Escape'},
	{id: ToolBankItem.Rotate, svg: svgToolRotate, helpText: 'Rotate subject atoms.', mnemonic: ''},
	{id: ToolBankItem.Pan, svg: svgToolPan, helpText: 'Pan the viewport around the screen.', mnemonic: ''},
	{id: ToolBankItem.Drag, svg: svgToolDrag, helpText: 'Drag selected atoms to new positions.', mnemonic: ''},
	{id: ToolBankItem.Erasor, svg: svgToolErasor, helpText: 'Delete atoms or bonds by selecting.', mnemonic: 'Delete'},
	{id: ToolBankItem.BondOrder0, svg: svgBondZero, helpText: 'Create or change a bond to zero order.', mnemonic: 'Shift+0', 'key': ')'},
	{id: ToolBankItem.BondOrder1, svg: svgBondOne, helpText: 'Create or change a bond to single.', mnemonic: 'Shift+1', 'key': '!'},
	{id: ToolBankItem.BondOrder2, svg: svgBondTwo, helpText: 'Create or change a bond to double.', mnemonic: 'Shift+2', 'key': '@'},
	{id: ToolBankItem.BondOrder3, svg: svgBondThree, helpText: 'Create or change a bond to triple.', mnemonic: 'Shift+3', 'key': '#'},
	{id: ToolBankItem.BondUnknown, svg: svgBondSquig, helpText: 'Create or change a bond to unknown stereochemistry.', mnemonic: 'Shift+4', 'key': '$'},
	{id: ToolBankItem.BondInclined, svg: svgBondUp, helpText: 'Create or change a bond to up-wedge.', mnemonic: 'Shift+5', 'key': '%'},
	{id: ToolBankItem.BondDeclined, svg: svgBondDown, helpText: 'Create or change a bond to down-wedge.', mnemonic: 'Shift+6', 'key': '^'},
	{id: ToolBankItem.RingAliph, svg: svgToolRing, helpText: 'Create plain ring.', mnemonic: 'Shift+7', 'key': '&'},
	{id: ToolBankItem.RingArom, svg: svgToolArom, helpText: 'Create aromatic ring.', mnemonic: 'Shift+8', 'key': '*'},
	{id: ToolBankItem.AtomPlus, svg: svgAtomPlus, helpText: 'Increase charge on atom.', mnemonic: ''},
	{id: ToolBankItem.AtomMinus, svg: svgAtomMinus, helpText: 'Decrease charge on atom.', mnemonic: ''},
	{id: ToolBankItem.ElementPfx + 'C', text: 'C', helpText: 'Change elements to Carbon.', mnemonic: ''},
	{id: ToolBankItem.ElementPfx + 'N', text: 'N', helpText: 'Change elements to Nitrogen.', mnemonic: ''},
	{id: ToolBankItem.ElementPfx + 'O', text: 'O', helpText: 'Change elements to Oxygen.', mnemonic: ''},
	{id: ToolBankItem.ElementPfx + 'S', text: 'S', helpText: 'Change elements to Sulfur.', mnemonic: ''},
	{id: ToolBankItem.ElementPfx + 'P', text: 'P', helpText: 'Change elements to Phosphorus.', mnemonic: ''},
	{id: ToolBankItem.ElementPfx + 'H', text: 'H', helpText: 'Change elements to Hydrogen.', mnemonic: ''},
	{id: ToolBankItem.ElementPfx + 'F', text: 'F', helpText: 'Change elements to Fluorine.', mnemonic: ''},
	{id: ToolBankItem.ElementPfx + 'Cl', text: 'Cl', helpText: 'Change elements to Chlorine.', mnemonic: ''},
	{id: ToolBankItem.ElementPfx + 'Br', text: 'Br', helpText: 'Change elements to Bromine.', mnemonic: ''},
	{id: ToolBankItem.ElementPfx + 'A', text: 'A', helpText: 'Pick other element.', mnemonic: ''}
];

export class ToolBank extends ButtonBank
{
	constructor(protected owner:any)
	{
		super();
	}

	// populate the buttons
	public update():void
	{
		for (let btn of TOOLS_MAIN) this.buttons.push(btn);

		this.buttonView.setSelectedButton('arrow');
	}

	// react to a button click
	public hitButton(id:string):void
	{
		this.buttonView.setSelectedButton(id);
	}

	public claimKey(event:KeyboardEvent):boolean
	{
		//let ch = String.fromCharCode(event.keyCode || event.charCode);
		//console.log('Claim/Command['+ch+'] key='+event.keyCode+' chcode='+event.charCode);

		for (let item of TOOLS_MAIN)
		{
			if (ButtonBank.matchKey(event, item.mnemonic, item.key))
			{
				this.hitButton(item.id);
				return true;
			}
		}
		return false;
	}
}

