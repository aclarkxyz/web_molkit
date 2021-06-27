/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

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

const TOOLS_MAIN:ButtonBankItem[] =
[
	{'id': ToolBankItem.Arrow, 'imageFN': 'ToolSelect', 'helpText': 'Selection tool.', 'mnemonic': 'Escape'},
	{'id': ToolBankItem.Rotate, 'imageFN': 'ToolRotate', 'helpText': 'Rotate subject atoms.', 'mnemonic': ''},
	{'id': ToolBankItem.Pan, 'imageFN': 'ToolPan', 'helpText': 'Pan the viewport around the screen.', 'mnemonic': ''},
	{'id': ToolBankItem.Drag, 'imageFN': 'ToolDrag', 'helpText': 'Drag selected atoms to new positions.', 'mnemonic': ''},
	{'id': ToolBankItem.Erasor, 'imageFN': 'ToolErasor', 'helpText': 'Delete atoms or bonds by selecting.', 'mnemonic': 'Delete'},
	{'id': ToolBankItem.BondOrder0, 'imageFN': 'BondZero', 'helpText': 'Create or change a bond to zero order.', 'mnemonic': 'Shift+0', 'key': ')'},
	{'id': ToolBankItem.BondOrder1, 'imageFN': 'BondOne', 'helpText': 'Create or change a bond to single.', 'mnemonic': 'Shift+1', 'key': '!'},
	{'id': ToolBankItem.BondOrder2, 'imageFN': 'BondTwo', 'helpText': 'Create or change a bond to double.', 'mnemonic': 'Shift+2', 'key': '@'},
	{'id': ToolBankItem.BondOrder3, 'imageFN': 'BondThree', 'helpText': 'Create or change a bond to triple.', 'mnemonic': 'Shift+3', 'key': '#'},
	{'id': ToolBankItem.BondUnknown, 'imageFN': 'BondSquig', 'helpText': 'Create or change a bond to unknown stereochemistry.', 'mnemonic': 'Shift+4', 'key': '$'},
	{'id': ToolBankItem.BondInclined, 'imageFN': 'BondUp', 'helpText': 'Create or change a bond to up-wedge.', 'mnemonic': 'Shift+5', 'key': '%'},
	{'id': ToolBankItem.BondDeclined, 'imageFN': 'BondDown', 'helpText': 'Create or change a bond to down-wedge.', 'mnemonic': 'Shift+6', 'key': '^'},
	{'id': ToolBankItem.RingAliph, 'imageFN': 'ToolRing', 'helpText': 'Create plain ring.', 'mnemonic': 'Shift+7', 'key': '&'},
	{'id': ToolBankItem.RingArom, 'imageFN': 'ToolArom', 'helpText': 'Create aromatic ring.', 'mnemonic': 'Shift+8', 'key': '*'},
	{'id': ToolBankItem.AtomPlus, 'imageFN': 'AtomPlus', 'helpText': 'Increase charge on atom.', 'mnemonic': ''},
	{'id': ToolBankItem.AtomMinus, 'imageFN': 'AtomMinus', 'helpText': 'Decrease charge on atom.', 'mnemonic': ''},
	{'id': ToolBankItem.ElementPfx + 'C', 'text': 'C', 'helpText': 'Change elements to Carbon.', 'mnemonic': ''},
	{'id': ToolBankItem.ElementPfx + 'N', 'text': 'N', 'helpText': 'Change elements to Nitrogen.', 'mnemonic': ''},
	{'id': ToolBankItem.ElementPfx + 'O', 'text': 'O', 'helpText': 'Change elements to Oxygen.', 'mnemonic': ''},
	{'id': ToolBankItem.ElementPfx + 'S', 'text': 'S', 'helpText': 'Change elements to Sulfur.', 'mnemonic': ''},
	{'id': ToolBankItem.ElementPfx + 'P', 'text': 'P', 'helpText': 'Change elements to Phosphorus.', 'mnemonic': ''},
	{'id': ToolBankItem.ElementPfx + 'H', 'text': 'H', 'helpText': 'Change elements to Hydrogen.', 'mnemonic': ''},
	{'id': ToolBankItem.ElementPfx + 'F', 'text': 'F', 'helpText': 'Change elements to Fluorine.', 'mnemonic': ''},
	{'id': ToolBankItem.ElementPfx + 'Cl', 'text': 'Cl', 'helpText': 'Change elements to Chlorine.', 'mnemonic': ''},
	{'id': ToolBankItem.ElementPfx + 'Br', 'text': 'Br', 'helpText': 'Change elements to Bromine.', 'mnemonic': ''},
	{'id': ToolBankItem.ElementPfx + 'A', 'text': 'A', 'helpText': 'Pick other element.', 'mnemonic': ''}
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

/* EOF */ }