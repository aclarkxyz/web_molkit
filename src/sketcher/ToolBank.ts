/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../ui/ButtonBank.ts'/>

namespace WebMolKit /* BOF */ {

/*
	ToolBank: buttons for the Sketcher main command bank.

	Content:
		.owner: the instance of molsync.ui.EditMolecule that owns this buttonbank
*/

const TOOLS_MAIN:ButtonBankItem[] =
[
	{'id': 'arrow', 'imageFN': 'ToolSelect', 'helpText': 'Selection tool.', 'mnemonic': 'Escape'},
	{'id': 'rotate', 'imageFN': 'ToolRotate', 'helpText': 'Rotate subject atoms.', 'mnemonic': ''},
	{'id': 'pan', 'imageFN': 'ToolPan', 'helpText': 'Pan the viewport around the screen.', 'mnemonic': ''},
	{'id': 'drag', 'imageFN': 'ToolDrag', 'helpText': 'Drag selected atoms to new positions.', 'mnemonic': ''},
	{'id': 'erasor', 'imageFN': 'ToolErasor', 'helpText': 'Delete atoms or bonds by selecting.', 'mnemonic': 'Delete'},
	{'id': 'bondOrder0', 'imageFN': 'BondZero', 'helpText': 'Create or change a bond to zero order.', 'mnemonic': ''},
	{'id': 'bondOrder1', 'imageFN': 'BondOne', 'helpText': 'Create or change a bond to single.', 'mnemonic': ''},
	{'id': 'bondOrder2', 'imageFN': 'BondTwo', 'helpText': 'Create or change a bond to double.', 'mnemonic': ''},
	{'id': 'bondOrder3', 'imageFN': 'BondThree', 'helpText': 'Create or change a bond to triple.', 'mnemonic': ''},
	{'id': 'bondUnknown', 'imageFN': 'BondSquig', 'helpText': 'Create or change a bond to unknown stereochemistry.', 'mnemonic': ''},
	{'id': 'bondInclined', 'imageFN': 'BondUp', 'helpText': 'Create or change a bond to up-wedge.', 'mnemonic': ''},
	{'id': 'bondDeclined', 'imageFN': 'BondDown', 'helpText': 'Create or change a bond to down-wedge.', 'mnemonic': ''},
	{'id': 'ringAliph', 'imageFN': 'ToolRing', 'helpText': 'Create plain ring.', 'mnemonic': ''},
	{'id': 'ringArom', 'imageFN': 'ToolArom', 'helpText': 'Create aromatic ring.', 'mnemonic': ''},
	{'id': 'atomPlus', 'imageFN': 'AtomPlus', 'helpText': 'Increase charge on atom.', 'mnemonic': ''},
	{'id': 'atomMinus', 'imageFN': 'AtomMinus', 'helpText': 'Decrease charge on atom.', 'mnemonic': ''},
	{'id': 'elementC', 'text': 'C', 'helpText': 'Change elements to Carbon.', 'mnemonic': ''},
	{'id': 'elementN', 'text': 'N', 'helpText': 'Change elements to Nitrogen.', 'mnemonic': ''},
	{'id': 'elementO', 'text': 'O', 'helpText': 'Change elements to Oxygen.', 'mnemonic': ''},
	{'id': 'elementS', 'text': 'S', 'helpText': 'Change elements to Sulfur.', 'mnemonic': ''},
	{'id': 'elementP', 'text': 'P', 'helpText': 'Change elements to Phosphorus.', 'mnemonic': ''},
	{'id': 'elementH', 'text': 'H', 'helpText': 'Change elements to Hydrogen.', 'mnemonic': ''},
	{'id': 'elementF', 'text': 'F', 'helpText': 'Change elements to Fluorine.', 'mnemonic': ''},
	{'id': 'elementCl', 'text': 'Cl', 'helpText': 'Change elements to Chlorine.', 'mnemonic': ''},
	{'id': 'elementBr', 'text': 'Br', 'helpText': 'Change elements to Bromine.', 'mnemonic': ''},
	{'id': 'elementA', 'text': 'A', 'helpText': 'Pick other element.', 'mnemonic': ''}
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

	public claimKey(event:JQueryEventObject):boolean
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