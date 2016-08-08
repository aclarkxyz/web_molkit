/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../ui/ButtonBank.ts'/>

/*
	ToolBank: buttons for the Sketcher main command bank.

	Content:
		.owner: the instance of molsync.ui.EditMolecule that owns this buttonbank
*/

class ToolBank extends ButtonBank
{
	initiallySelected = 'arrow';
	
	constructor(protected owner:any)
	{
		super();
	}

	// populate the buttons
	public update():void
	{
		this.buttons = [];
		this.buttons.push({'id': 'arrow', 'imageFN': 'ToolSelect', 'helpText': 'Selection tool.'});
		this.buttons.push({'id': 'rotate', 'imageFN': 'ToolRotate', 'helpText': 'Rotate subject atoms.'});
		this.buttons.push({'id': 'pan', 'imageFN': 'ToolPan', 'helpText': 'Pan the viewport around the screen.'});
		this.buttons.push({'id': 'drag', 'imageFN': 'ToolDrag', 'helpText': 'Drag selected atoms to new positions.'});
		this.buttons.push({'id': 'erasor', 'imageFN': 'ToolErasor', 'helpText': 'Delete atoms or bonds by selecting.'});
		this.buttons.push({'id': 'bondOrder0', 'imageFN': 'BondZero', 'helpText': 'Create or change a bond to zero order.'});
		this.buttons.push({'id': 'bondOrder1', 'imageFN': 'BondOne', 'helpText': 'Create or change a bond to single.'});
		this.buttons.push({'id': 'bondOrder2', 'imageFN': 'BondTwo', 'helpText': 'Create or change a bond to double.'});
		this.buttons.push({'id': 'bondOrder3', 'imageFN': 'BondThree', 'helpText': 'Create or change a bond to triple.'});
		this.buttons.push({'id': 'bondUnknown', 'imageFN': 'BondSquig', 'helpText': 'Create or change a bond to down-wedge.'});
		this.buttons.push({'id': 'bondInclined', 'imageFN': 'BondUp', 'helpText': 'Create or change a bond to up-wedge.'});
		this.buttons.push({'id': 'bondDeclined', 'imageFN': 'BondDown', 'helpText': 'Create or change a bond to down-wedge.'});
		this.buttons.push({'id': 'ringAliph', 'imageFN': 'ToolRing', 'helpText': 'Create plain ring.'});
		this.buttons.push({'id': 'ringArom', 'imageFN': 'ToolArom', 'helpText': 'Create aromatic ring.'});
		this.buttons.push({'id': 'atomPlus', 'imageFN': 'AtomPlus', 'helpText': 'Increase charge on atom.'});
		this.buttons.push({'id': 'atomMinus', 'imageFN': 'AtomMinus', 'helpText': 'Decrease charge on atom.'});
		this.buttons.push({'id': 'elementC', 'text': 'C', 'helpText': 'Change elements to Carbon.'});
		this.buttons.push({'id': 'elementN', 'text': 'N', 'helpText': 'Change elements to Nitrogen.'});
		this.buttons.push({'id': 'elementO', 'text': 'O', 'helpText': 'Change elements to Oxygen.'});
		this.buttons.push({'id': 'elementS', 'text': 'S', 'helpText': 'Change elements to Sulfur.'});
		this.buttons.push({'id': 'elementP', 'text': 'P', 'helpText': 'Change elements to Phosphorus.'});
		this.buttons.push({'id': 'elementH', 'text': 'H', 'helpText': 'Change elements to Hydrogen.'});
		this.buttons.push({'id': 'elementF', 'text': 'F', 'helpText': 'Change elements to Fluorine.'});
		this.buttons.push({'id': 'elementCl', 'text': 'Cl', 'helpText': 'Change elements to Chlorine.'});
		this.buttons.push({'id': 'elementBr', 'text': 'Br', 'helpText': 'Change elements to Bromine.'});
		this.buttons.push({'id': 'elementA', 'text': 'A', 'helpText': 'Pick other element.'});
		
		this.buttonView.setSelectedButton('arrow');
	};

	// react to a button click
	public hitButton(id:string):void
	{
		this.buttonView.setSelectedButton(id);
	}
}