/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {Molecule} from '../mol/Molecule';
import {Geometry} from '../mol/SketchUtil';
import {ButtonBank, ButtonBankItem} from '../ui/ButtonBank';
import {KeyCode} from '../util/util';
import {ActivityType, MoleculeActivity} from './MoleculeActivity';

/* eslint-disable no-multi-spaces, comma-spacing */

/*
	CommandBank: the various bank styles that correspond to actions (select-then-do, as opposed to toolbank style which
	is pick-then-interact).
*/

const ELEMENTS_NOBLE:string[] =
[
	'He', 'Ar', 'Kr', 'Xe', 'Rn'
];

const ELEMENTS_S_BLOCK:string[] =
[
	'Li', 'Na', 'K',  'Rb', 'Cs', 'Fr', 'Sc',
	'Be', 'Mg', 'Ca', 'Sr', 'Ba', 'Ra', 'Y'
];

const ELEMENTS_P_BLOCK:string[] =
[
	'B',  'Al', 'Si', 'Ga', 'Ge', 'As', 'Se',
	'In', 'Sn', 'Sb', 'Te', 'Tl', 'Pb', 'Bi', 'Po', 'At'
];

const ELEMENTS_D_BLOCK:string[] =
[
	'Ti', 'V' , 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn',
	'Zr', 'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd',
	'Hf', 'Ta', 'W',  'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg'
];

const ELEMENTS_F_BLOCK:string[] =
[
	'La', 'Ce', 'Pr', 'Nd', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy',
	'Ho', 'Er', 'Tm', 'Yb', 'Lu', 'Ac', 'Th', 'Pa', 'U'
];

const ELEMENTS_ABBREV:string[] =
[
	'*', 'A', 'X', 'Y', 'Z', 'Q', 'M', 'T', 'E', 'L', 'R',
	'R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'
];

enum CommandType
{
	Main = 0,
	Atom,
	Bond,
	Select,
	Move,
	Abbrev,
	SBlock,
	PBlock,
	DBlock,
	FBlock,
	Noble
}

import svgMainUndo from '@reswmk/img/actions/MainUndo.svg';
import svgMainRedo from '@reswmk/img/actions/MainRedo.svg';
import svgMainZoomIn from '@reswmk/img/actions/MainZoomIn.svg';
import svgMainZoomOut from '@reswmk/img/actions/MainZoomOut.svg';
import svgMainZoomFit from '@reswmk/img/actions/MainZoomFit.svg';
import svgMainSelSide from '@reswmk/img/actions/MainSelSide.svg';
import svgMainSelAll from '@reswmk/img/actions/MainSelAll.svg';
import svgMainSelNone from '@reswmk/img/actions/MainSelNone.svg';
import svgMainDelete from '@reswmk/img/actions/MainDelete.svg';
import svgMainCut from '@reswmk/img/actions/MainCut.svg';
import svgMainCopy from '@reswmk/img/actions/MainCopy.svg';
import svgMainPaste from '@reswmk/img/actions/MainPaste.svg';
import svgMainAtom from '@reswmk/img/actions/MainAtom.svg';
import svgMainBond from '@reswmk/img/actions/MainBond.svg';
import svgMainSelect from '@reswmk/img/actions/MainSelect.svg';
import svgMainMove from '@reswmk/img/actions/MainMove.svg';

const COMMANDS_MAIN:ButtonBankItem[] =
[
	{id: 'undo', svg: svgMainUndo, helpText: 'Undo last change.', mnemonic: 'CmdOrCtrl+Z'},
	{id: 'redo', svg: svgMainRedo, helpText: 'Cancel last undo.', mnemonic: 'CmdOrCtrl+Shift+Z'},
	{id: 'zoomin', svg: svgMainZoomIn, helpText: 'Zoom in.', mnemonic: '='},
	{id: 'zoomout', svg: svgMainZoomOut, helpText: 'Zoom out.', mnemonic: '-'},
	{id: 'zoomfit', svg: svgMainZoomFit, helpText: 'Show whole diagram onscreen.', mnemonic: ''},
	{id: 'selside', svg: svgMainSelSide, helpText: 'Select alternate side of current atom or bond.', mnemonic: 'E'},
	{id: 'selall', svg: svgMainSelAll, helpText: 'Select all atoms.', mnemonic: 'Shift+A'},
	{id: 'selnone', svg: svgMainSelNone, helpText: 'Clear selection.', mnemonic: 'Shift+Q'},
	{id: 'delete', svg: svgMainDelete, helpText: 'Delete selected atoms and bonds.', mnemonic: 'D'},
	{id: 'cut', svg: svgMainCut, helpText: 'Copy selection to clipboard, and remove.', mnemonic: 'CmdOrCtrl+X'},
	{id: 'copy', svg: svgMainCopy, helpText: 'Copy selection to clipboard.', mnemonic: 'CmdOrCtrl+C'},
	{id: 'paste', svg: svgMainPaste, helpText: 'Paste clipboard contents.'/*, mnemonic: 'Ctrl+V'*/}, // TODO: web-specific behaviour
	{id: 'atom', svg: svgMainAtom, helpText: 'Open the Atom submenu.', isSubMenu: true, mnemonic: 'A'},
	{id: 'bond', svg: svgMainBond, helpText: 'Open the Bond submenu.', isSubMenu: true, mnemonic: 'B'},
	{id: 'select', svg: svgMainSelect, helpText: 'Open the Selection submenu.', isSubMenu: true, mnemonic: 'S'},
	{id: 'move', svg: svgMainMove, helpText: 'Open the Move submenu.', isSubMenu: true, mnemonic: 'M'},
];

import svgAtomPlus from '@reswmk/img/actions/AtomPlus.svg';
import svgAtomMinus from '@reswmk/img/actions/AtomMinus.svg';
import svgAtomAbbrev from '@reswmk/img/actions/AtomAbbrev.svg';
import svgAtomSBlock from '@reswmk/img/actions/AtomSBlock.svg';
import svgAtomPBlock from '@reswmk/img/actions/AtomPBlock.svg';
import svgAtomDBlock from '@reswmk/img/actions/AtomDBlock.svg';
import svgAtomFBlock from '@reswmk/img/actions/AtomFBlock.svg';
import svgAtomNoble from '@reswmk/img/actions/AtomNoble.svg';

const COMMANDS_ATOM:ButtonBankItem[] =
[
	{id: 'element:C', text: 'C', helpText: 'Change elements to Carbon.', mnemonic: 'Shift+C'},
	{id: 'element:N', text: 'N', helpText: 'Change elements to Nitrogen.', mnemonic: 'Shift+N'},
	{id: 'element:O', text: 'O', helpText: 'Change elements to Oxygen.', mnemonic: 'Shift+O'},
	{id: 'element:S', text: 'S', helpText: 'Change elements to Sulfur.', mnemonic: 'Shift+S'},
	{id: 'element:P', text: 'P', helpText: 'Change elements to Phosphorus.', mnemonic: 'Shift+P'},
	{id: 'element:H', text: 'H', helpText: 'Change elements to Hydrogen.', mnemonic: 'Shift+H'},
	{id: 'element:F', text: 'F', helpText: 'Change elements to Fluorine.', mnemonic: 'Shift+F'},
	{id: 'element:Cl', text: 'Cl', helpText: 'Change elements to Chlorine.', mnemonic: 'Shift+L'},
	{id: 'element:Br', text: 'Br', helpText: 'Change elements to Bromine.', mnemonic: 'Shift+B'},
	{id: 'element:I', text: 'I', helpText: 'Change elements to Iodine.', mnemonic: 'Shift+I'},
	{id: 'plus', svg: svgAtomPlus, helpText: 'Increase the atom charge.', mnemonic: 'Shift+=', key: '+'},
	{id: 'minus', svg: svgAtomMinus, helpText: 'Decrease the atom charge.', mnemonic: 'Shift+-', key: '_'},
	{id: 'abbrev', svg: svgAtomAbbrev, helpText: 'Open list of common labels.', isSubMenu: true, mnemonic: ''},
	{id: 'sblock', svg: svgAtomSBlock, helpText: 'Open list of s-block elements.', isSubMenu: true, mnemonic: ''},
	{id: 'pblock', svg: svgAtomPBlock, helpText: 'Open list of p-block elements.', isSubMenu: true, mnemonic: ''},
	{id: 'dblock', svg: svgAtomDBlock, helpText: 'Open list of d-block elements.', isSubMenu: true, mnemonic: ''},
	{id: 'fblock', svg: svgAtomFBlock, helpText: 'Open list of f-block elements.', isSubMenu: true, mnemonic: ''},
	{id: 'noble', svg: svgAtomNoble, helpText: 'Open list of noble elements.', isSubMenu: true, mnemonic: ''},
];

import svgBondOne from '@reswmk/img/actions/BondOne.svg';
import svgBondTwo from '@reswmk/img/actions/BondTwo.svg';
import svgBondThree from '@reswmk/img/actions/BondThree.svg';
import svgBondFour from '@reswmk/img/actions/BondFour.svg';
import svgBondZero from '@reswmk/img/actions/BondZero.svg';
import svgBondUp from '@reswmk/img/actions/BondUp.svg';
import svgBondDown from '@reswmk/img/actions/BondDown.svg';
import svgBondSquig from '@reswmk/img/actions/BondSquig.svg';
import svgBondQAny from '@reswmk/img/actions/BondQAny.svg';
import svgBondAddTwo from '@reswmk/img/actions/BondAddTwo.svg';
import svgBondInsert from '@reswmk/img/actions/BondInsert.svg';
import svgBondSwitch from '@reswmk/img/actions/BondSwitch.svg';
import svgBondRotate from '@reswmk/img/actions/BondRotate.svg';
import svgBondLinear from '@reswmk/img/actions/BondLinear.svg';
import svgBondTrigonal from '@reswmk/img/actions/BondTrigonal.svg';
import svgBondTetra1 from '@reswmk/img/actions/BondTetra1.svg';
import svgBondTetra2 from '@reswmk/img/actions/BondTetra2.svg';
import svgBondSqPlan from '@reswmk/img/actions/BondSqPlan.svg';
import svgBondOcta1 from '@reswmk/img/actions/BondOcta1.svg';
import svgBondOcta2 from '@reswmk/img/actions/BondOcta2.svg';
import svgBondMetalLigate from '@reswmk/img/actions/BondMetalLigate.svg';
import svgBondArtifactPath from '@reswmk/img/actions/BondArtifactPath.svg';
import svgBondArtifactRing from '@reswmk/img/actions/BondArtifactRing.svg';
import svgBondArtifactArene from '@reswmk/img/actions/BondArtifactArene.svg';
import svgBondArtifactClear from '@reswmk/img/actions/BondArtifactClear.svg';
import svgBondPolymer from '@reswmk/img/actions/BondPolymer.svg';

const COMMANDS_BOND:ButtonBankItem[] =
[
	{id: 'one', svg: svgBondOne, helpText: 'Create or set bonds to single.', mnemonic: '1'},
	{id: 'two', svg: svgBondTwo, helpText: 'Create or set bonds to double.', mnemonic: '2'},
	{id: 'three', svg: svgBondThree, helpText: 'Create or set bonds to triple.', mnemonic: '3'},
	{id: 'four', svg: svgBondFour, helpText: 'Create or set bonds to quadruple.', mnemonic: ''},
	{id: 'zero', svg: svgBondZero, helpText: 'Create or set bonds to zero-order.', mnemonic: '0'},
	{id: 'inclined', svg: svgBondUp, helpText: 'Create or set bonds to inclined.', mnemonic: '5'},
	{id: 'declined', svg: svgBondDown, helpText: 'Create or set bonds to declined.', mnemonic: '6'},
	{id: 'squig', svg: svgBondSquig, helpText: 'Create or set bonds to unknown stereochemistry.', mnemonic: '4'},
	{id: 'bondQAny', svg: svgBondQAny, helpText: 'Query bond that matches anything.'},
	{id: 'addtwo', svg: svgBondAddTwo, helpText: 'Add two new bonds to the subject atom.', mnemonic: 'Shift+D'},
	{id: 'insert', svg: svgBondInsert, helpText: 'Insert a methylene into the subject bond.', mnemonic: ''},
	{id: 'switch', svg: svgBondSwitch, helpText: 'Cycle through likely bond geometries.', mnemonic: '\''},
	{id: 'rotate', svg: svgBondRotate, helpText: 'Rotate bond to invert substituent orientation.', mnemonic: ''},
	{id: 'linear', svg: svgBondLinear, helpText: 'Apply linear geometry.', mnemonic: 'Shift+V'},
	{id: 'trigonal', svg: svgBondTrigonal, helpText: 'Apply trigonal geometry.', mnemonic: 'Shift+W'},
	{id: 'tetra1', svg: svgBondTetra1, helpText: 'Apply tetrahedral geometry #1.', mnemonic: 'Shift+E'},
	{id: 'tetra2', svg: svgBondTetra2, helpText: 'Apply tetrahedral geometry #2.', mnemonic: 'Shift+R'},
	{id: 'sqplan', svg: svgBondSqPlan, helpText: 'Apply square planar geometry.', mnemonic: 'Shift+T'},
	{id: 'octa1', svg: svgBondOcta1, helpText: 'Apply octahedral geometry #1.', mnemonic: 'Shift+Y'},
	{id: 'octa2', svg: svgBondOcta2, helpText: 'Apply octahedral geometry #2.', mnemonic: 'Shift+U'},
	{id: 'metalligate', svg: svgBondMetalLigate, helpText: 'Arrange ligands around metal centre.', mnemonic: ''},
	{id: 'artifactpath', svg: svgBondArtifactPath, helpText: 'Add a path bond artifact.', mnemonic: ''},
	{id: 'artifactring', svg: svgBondArtifactRing, helpText: 'Add a ring bond artifact.', mnemonic: ''},
	{id: 'artifactarene', svg: svgBondArtifactArene, helpText: 'Add an arene bond artifact.', mnemonic: ''},
	{id: 'artifactclear', svg: svgBondArtifactClear, helpText: 'Remove a bond artifact.', mnemonic: ''},
	{id: 'polymer', svg: svgBondPolymer, helpText: 'Create a polymer block.', mnemonic: ''},
];

import svgSelectionGrow from '@reswmk/img/actions/SelectionGrow.svg';
import svgSelectionShrink from '@reswmk/img/actions/SelectionShrink.svg';
import svgSelectionChain from '@reswmk/img/actions/SelectionChain.svg';
import svgSelectionSmRing from '@reswmk/img/actions/SelectionSmRing.svg';
import svgSelectionRingBlk from '@reswmk/img/actions/SelectionRingBlk.svg';
import svgSelectionCurElement from '@reswmk/img/actions/SelectionCurElement.svg';
import svgMainSelPrev from '@reswmk/img/actions/MainSelPrev.svg';
import svgMainSelNext from '@reswmk/img/actions/MainSelNext.svg';
import svgSelectionToggle from '@reswmk/img/actions/SelectionToggle.svg';
import svgSelectionUncurrent from '@reswmk/img/actions/SelectionUncurrent.svg';
import svgMoveJoin from '@reswmk/img/actions/MoveJoin.svg';
import svgMainNew from '@reswmk/img/actions/MainNew.svg';
import svgAtomInline from '@reswmk/img/actions/AtomInline.svg';
import svgAtomFormula from '@reswmk/img/actions/AtomFormula.svg';
import svgAtomExpandAbbrev from '@reswmk/img/actions/AtomExpandAbbrev.svg';
import svgAtomClearAbbrev from '@reswmk/img/actions/AtomClearAbbrev.svg';

const COMMANDS_SELECT:ButtonBankItem[] =
[
	{id: 'selgrow', svg: svgSelectionGrow, helpText: 'Add adjacent atoms to selection.', mnemonic: ''},
	{id: 'selshrink', svg: svgSelectionShrink, helpText: 'Unselect exterior atoms.', mnemonic: ''},
	{id: 'selchain', svg: svgSelectionChain, helpText: 'Extend selection to non-ring atoms.', mnemonic: ''},
	{id: 'smallring', svg: svgSelectionSmRing, helpText: 'Extend selection to small rings.', mnemonic: ''},
	{id: 'ringblock', svg: svgSelectionRingBlk, helpText: 'Extend selection to ring blocks.', mnemonic: ''},
	{id: 'curelement', svg: svgSelectionCurElement, helpText: 'Select all atoms of current element type.', mnemonic: ''},
	{id: 'selprev', svg: svgMainSelPrev, helpText: 'Select previous connected component.', mnemonic: '['},
	{id: 'selnext', svg: svgMainSelNext, helpText: 'Select next connected component.', mnemonic: ']'},
	{id: 'toggle', svg: svgSelectionToggle, helpText: 'Toggle selection of current.', mnemonic: ','},
	{id: 'uncurrent', svg: svgSelectionUncurrent, helpText: 'Undefine current object.', mnemonic: '.'},
	{id: 'join', svg: svgMoveJoin, helpText: 'Overlapping atoms will be joined as one.', mnemonic: ''},
	{id: 'new', svg: svgMainNew, helpText: 'Clear the molecular structure.', mnemonic: ''},
	{id: 'inline', svg: svgAtomInline, helpText: 'Make selected atoms into an inline abbreviation.', mnemonic: '/'},
	{id: 'formula', svg: svgAtomFormula, helpText: 'Make selected atoms into their molecule formula.', mnemonic: '\\'},
	{id: 'expandabbrev', svg: svgAtomExpandAbbrev, helpText: 'Expand out the inline abbreviation.', mnemonic: 'Shift+/', key: '?'},
	{id: 'clearabbrev', svg: svgAtomClearAbbrev, helpText: 'Remove inline abbreviation.', mnemonic: 'Shift+\\', key: '|'},
];

import svgMoveUp from '@reswmk/img/actions/MoveUp.svg';
import svgMoveDown from '@reswmk/img/actions/MoveDown.svg';
import svgMoveLeft from '@reswmk/img/actions/MoveLeft.svg';
import svgMoveRight from '@reswmk/img/actions/MoveRight.svg';
import svgMoveUpLots from '@reswmk/img/actions/MoveUpLots.svg';
import svgMoveDownLots from '@reswmk/img/actions/MoveDownLots.svg';
import svgMoveLeftLots from '@reswmk/img/actions/MoveLeftLots.svg';
import svgMoveRightLots from '@reswmk/img/actions/MoveRightLots.svg';
import svgMoveUpFar from '@reswmk/img/actions/MoveUpFar.svg';
import svgMoveDownFar from '@reswmk/img/actions/MoveDownFar.svg';
import svgMoveLeftFar from '@reswmk/img/actions/MoveLeftFar.svg';
import svgMoveRightFar from '@reswmk/img/actions/MoveRightFar.svg';
import svgMoveRotP01 from '@reswmk/img/actions/MoveRotP01.svg';
import svgMoveRotM01 from '@reswmk/img/actions/MoveRotM01.svg';
import svgMoveRotP05 from '@reswmk/img/actions/MoveRotP05.svg';
import svgMoveRotM05 from '@reswmk/img/actions/MoveRotM05.svg';
import svgMoveRotP15 from '@reswmk/img/actions/MoveRotP15.svg';
import svgMoveRotM15 from '@reswmk/img/actions/MoveRotM15.svg';
import svgMoveRotP30 from '@reswmk/img/actions/MoveRotP30.svg';
import svgMoveRotM30 from '@reswmk/img/actions/MoveRotM30.svg';
import svgMoveHFlip from '@reswmk/img/actions/MoveHFlip.svg';
import svgMoveVFlip from '@reswmk/img/actions/MoveVFlip.svg';
import svgMoveShrink from '@reswmk/img/actions/MoveShrink.svg';
import svgMoveGrow from '@reswmk/img/actions/MoveGrow.svg';

const COMMANDS_MOVE:ButtonBankItem[] =
[
	{id: 'up', svg: svgMoveUp, helpText: 'Move subject atoms up slightly.', mnemonic: 'Shift+Up', key: KeyCode.Up},
	{id: 'down', svg: svgMoveDown, helpText: 'Move subject atoms down slightly.', mnemonic: 'Shift+Down', key: KeyCode.Down},
	{id: 'left', svg: svgMoveLeft, helpText: 'Move subject atoms slightly to the left.', mnemonic: 'Shift+Left', key: KeyCode.Left},
	{id: 'right', svg: svgMoveRight, helpText: 'Move subject atoms slightly to the right.', mnemonic: 'Shift+Right', key: KeyCode.Right},
	{id: 'uplots', svg: svgMoveUpLots, helpText: 'Move subject atoms up somewhat.', mnemonic: ''},
	{id: 'downlots', svg: svgMoveDownLots, helpText: 'Move subject atoms down somewhat.', mnemonic: ''},
	{id: 'leftlots', svg: svgMoveLeftLots, helpText: 'Move subject atoms somewhat to the left.', mnemonic: ''},
	{id: 'rightlots', svg: svgMoveRightLots, helpText: 'Move subject atoms somewhat to the right.', mnemonic: ''},
	{id: 'upfar', svg: svgMoveUpFar, helpText: 'Move subject atoms far up.', mnemonic: ''},
	{id: 'downfar', svg: svgMoveDownFar, helpText: 'Move subject atoms far down.', mnemonic: ''},
	{id: 'leftfar', svg: svgMoveLeftFar, helpText: 'Move subject atoms far to the left.', mnemonic: ''},
	{id: 'rightfar', svg: svgMoveRightFar, helpText: 'Move subject atoms far to the right.', mnemonic: ''},
	{id: 'rotp01', svg: svgMoveRotP01, helpText: 'Rotate 1\u00B0 counter-clockwise.', mnemonic: ''},
	{id: 'rotm01', svg: svgMoveRotM01, helpText: 'Rotate 1\u00B0 clockwise.', mnemonic: ''},
	{id: 'rotp05', svg: svgMoveRotP05, helpText: 'Rotate 5\u00B0 counter-clockwise.', mnemonic: ''},
	{id: 'rotm05', svg: svgMoveRotM05, helpText: 'Rotate 5\u00B0 clockwise.', mnemonic: ''},
	{id: 'rotp15', svg: svgMoveRotP15, helpText: 'Rotate 15\u00B0 counter-clockwise.', mnemonic: ''},
	{id: 'rotm15', svg: svgMoveRotM15, helpText: 'Rotate 15\u00B0 clockwise.', mnemonic: ''},
	{id: 'rotp30', svg: svgMoveRotP30, helpText: 'Rotate 30\u00B0 counter-clockwise.', mnemonic: 'Shift+[', key: '{'},
	{id: 'rotm30', svg: svgMoveRotM30, helpText: 'Rotate 30\u00B0 clockwise.', mnemonic: 'Shift+]', key: '}'},
	{id: 'hflip', svg: svgMoveHFlip, helpText: 'Flip subject atoms horizontally.', mnemonic: 'Shift+,', key: '<'},
	{id: 'vflip', svg: svgMoveVFlip, helpText: 'Flip subject atoms vertically.', mnemonic: 'Shift+.', key: '>'},
	{id: 'shrink', svg: svgMoveShrink, helpText: 'Decrease subject bond distances.', mnemonic: 'Shift+Z'},
	{id: 'grow', svg: svgMoveGrow, helpText: 'Increase subject bond distances.', mnemonic: 'Shift+X'},
];

export class CommandBank extends ButtonBank
{
	constructor(protected owner:any, protected cmdType = CommandType.Main)
	{
		super();
	}

	// populate the buttons
	public update():void
	{
		if (this.cmdType == CommandType.Main) for (let btn of COMMANDS_MAIN) this.buttons.push(btn);
		else if (this.cmdType == CommandType.Atom) for (let btn of COMMANDS_ATOM) this.buttons.push(btn);
		else if (this.cmdType == CommandType.Bond) for (let btn of COMMANDS_BOND) this.buttons.push(btn);
		else if (this.cmdType == CommandType.Select) for (let btn of COMMANDS_SELECT) this.buttons.push(btn);
		else if (this.cmdType == CommandType.Move) for (let btn of COMMANDS_MOVE) this.buttons.push(btn);
		else if (this.cmdType == CommandType.Abbrev) this.populateElements(ELEMENTS_ABBREV);
		else if (this.cmdType == CommandType.SBlock) this.populateElements(ELEMENTS_S_BLOCK);
		else if (this.cmdType == CommandType.PBlock) this.populateElements(ELEMENTS_P_BLOCK);
		else if (this.cmdType == CommandType.DBlock) this.populateElements(ELEMENTS_D_BLOCK);
		else if (this.cmdType == CommandType.FBlock) this.populateElements(ELEMENTS_F_BLOCK);
		else if (this.cmdType == CommandType.Noble) this.populateElements(ELEMENTS_NOBLE);
	}

	private populateElements(elements:string[]):void
	{
		for (let el of elements)
		{
			this.buttons.push({id: `element:${el}`, text: el, helpText: `Change elements to ${el}.`});
		}
	}

	// react to a button click
	public hitButton(id:string):void
	{
		let actv = 0, param:any = null;

		if (id.startsWith('element:'))
		{
			let el = id.substring(8);
			actv = ActivityType.Element;
			param = {element: el};
		}
		else if (id == 'delete') actv = ActivityType.Delete;
		else if (id == 'undo')
		{
			if (this.owner.canUndo()) this.owner.performUndo();
			else this.owner.showMessage('Nothing to undo.');
		}
		else if (id == 'redo')
		{
			if (this.owner.canRedo()) this.owner.performRedo();
			else this.owner.showMessage('Nothing to redo.');
		}
		else if (id == 'cut') actv = ActivityType.Cut;
		else if (id == 'copy') actv = ActivityType.Copy;
		else if (id == 'paste') this.owner.performPaste();
		else if (id == 'new') actv = ActivityType.Clear;
		else if (id == 'zoomfit') this.owner.autoScale();
		else if (id == 'zoomout') this.owner.zoom(0.8);
		else if (id == 'zoomin') this.owner.zoom(1.25);
		else if (id == 'selall') actv = ActivityType.SelectAll;
		else if (id == 'selnone') actv = ActivityType.SelectNone;
		else if (id == 'selprev') actv = ActivityType.SelectPrevComp;
		else if (id == 'selnext') actv = ActivityType.SelectNextComp;
		else if (id == 'selside') actv = ActivityType.SelectSide;
		else if (id == 'plus') {actv = ActivityType.Charge; param = {delta: 1};}
		else if (id == 'minus') {actv = ActivityType.Charge; param = {delta: -1};}
		else if (id == 'one') {actv = ActivityType.BondOrder; param = {order: 1};}
		else if (id == 'two') {actv = ActivityType.BondOrder; param = {order: 2};}
		else if (id == 'three') {actv = ActivityType.BondOrder; param = {order: 3};}
		else if (id == 'four') {actv = ActivityType.BondOrder; param = {order: 4};}
		else if (id == 'zero') {actv = ActivityType.BondOrder; param = {order: 0};}
		else if (id == 'inclined') {actv = ActivityType.BondType; param = {type: Molecule.BONDTYPE_INCLINED};}
		else if (id == 'declined') {actv = ActivityType.BondType; param = {type: Molecule.BONDTYPE_DECLINED};}
		else if (id == 'squig') {actv = ActivityType.BondType; param = {type: Molecule.BONDTYPE_UNKNOWN};}
		else if (id == 'linear') {actv = ActivityType.BondGeom; param = {geom: Geometry.Linear};}
		else if (id == 'trigonal') {actv = ActivityType.BondGeom; param = {geom: Geometry.Trigonal};}
		else if (id == 'tetra1') {actv = ActivityType.BondGeom; param = {geom: Geometry.Tetra1};}
		else if (id == 'tetra2') {actv = ActivityType.BondGeom; param = {geom: Geometry.Tetra2};}
		else if (id == 'sqplan') {actv = ActivityType.BondGeom; param = {geom: Geometry.SqPlan};}
		else if (id == 'octa1') {actv = ActivityType.BondGeom; param = {geom: Geometry.Octa1};}
		else if (id == 'octa2') {actv = ActivityType.BondGeom; param = {geom: Geometry.Octa2};}
		else if (id == 'switch') actv = ActivityType.BondSwitch;
		else if (id == 'rotate') actv = ActivityType.BondRotate;
		else if (id == 'connect') actv = ActivityType.Connect;
		else if (id == 'disconnect') actv = ActivityType.Disconnect;
		else if (id == 'metalligate') actv = ActivityType.MetalLigate;
		else if (id == 'artifactpath') actv = ActivityType.BondArtifactPath;
		else if (id == 'artifactring') actv = ActivityType.BondArtifactRing;
		else if (id == 'artifactarene') actv = ActivityType.BondArtifactArene;
		else if (id == 'artifactclear') actv = ActivityType.BondArtifactClear;
		else if (id == 'polymer') actv = ActivityType.PolymerBlock;
		else if (id == 'addtwo') actv = ActivityType.BondAddTwo;
		else if (id == 'insert') actv = ActivityType.BondInsert;
		else if (id == 'curelement') actv = ActivityType.SelectCurElement;
		else if (id == 'selgrow') actv = ActivityType.SelectGrow;
		else if (id == 'selshrink') actv = ActivityType.SelectShrink;
		else if (id == 'selprev') actv = ActivityType.SelectPrevComp;
		else if (id == 'selnext') actv = ActivityType.SelectNextComp;
		else if (id == 'selchain') actv = ActivityType.SelectChain;
		else if (id == 'smallring') actv = ActivityType.SelectSmRing;
		else if (id == 'ringblock') actv = ActivityType.SelectRingBlk;
		else if (id == 'toggle') actv = ActivityType.SelectToggle;
		else if (id == 'uncurrent') actv = ActivityType.SelectUnCurrent;
		else if (id == 'join') actv = ActivityType.Join;
		else if (id == 'inline') actv = ActivityType.AbbrevGroup;
		else if (id == 'formula') actv = ActivityType.AbbrevFormula;
		else if (id == 'clearabbrev') actv = ActivityType.AbbrevClear;
		else if (id == 'expandabbrev') actv = ActivityType.AbbrevExpand;
		else if (id == 'up') {actv = ActivityType.Nudge; param = {dir: 'up'};}
		else if (id == 'down') {actv = ActivityType.Nudge; param = {dir: 'down'};}
		else if (id == 'left') {actv = ActivityType.Nudge; param = {dir: 'left'};}
		else if (id == 'right') {actv = ActivityType.Nudge; param = {dir: 'right'};}
		else if (id == 'uplots') {actv = ActivityType.NudgeLots; param = {dir: 'up'};}
		else if (id == 'downlots') {actv = ActivityType.NudgeLots; param = {dir: 'down'};}
		else if (id == 'leftlots') {actv = ActivityType.NudgeLots; param = {dir: 'left'};}
		else if (id == 'rightlots') {actv = ActivityType.NudgeLots; param = {dir: 'right'};}
		else if (id == 'upfar') {actv = ActivityType.NudgeFar; param = {dir: 'up'};}
		else if (id == 'downfar') {actv = ActivityType.NudgeFar; param = {dir: 'down'};}
		else if (id == 'leftfar') {actv = ActivityType.NudgeFar; param = {dir: 'left'};}
		else if (id == 'rightfar') {actv = ActivityType.NudgeFar; param = {dir: 'right'};}
		else if (id == 'rotp01') {actv = ActivityType.Rotate; param = {theta: 1};}
		else if (id == 'rotm01') {actv = ActivityType.Rotate; param = {theta: -1};}
		else if (id == 'rotp05') {actv = ActivityType.Rotate; param = {theta: 5};}
		else if (id == 'rotm05') {actv = ActivityType.Rotate; param = {theta: -5};}
		else if (id == 'rotp15') {actv = ActivityType.Rotate; param = {theta: 15};}
		else if (id == 'rotm15') {actv = ActivityType.Rotate; param = {theta: -15};}
		else if (id == 'rotp30') {actv = ActivityType.Rotate; param = {theta: 30};}
		else if (id == 'rotm30') {actv = ActivityType.Rotate; param = {theta: -30};}
		else if (id == 'hflip') {actv = ActivityType.Flip; param = {axis: 'hor'};}
		else if (id == 'vflip') {actv = ActivityType.Flip; param = {axis: 'ver'};}
		else if (id == 'shrink') {actv = ActivityType.Scale; param = {mag: 1 / 1.1};}
		else if (id == 'grow') {actv = ActivityType.Scale; param = {mag: 1.1};}
		else if (id == 'bondQAny') actv = ActivityType.QueryBondAny;
		else if (id == 'atom') this.buttonView.pushBank(new CommandBank(this.owner, CommandType.Atom));
		else if (id == 'bond') this.buttonView.pushBank(new CommandBank(this.owner, CommandType.Bond));
		else if (id == 'select') this.buttonView.pushBank(new CommandBank(this.owner, CommandType.Select));
		else if (id == 'move') this.buttonView.pushBank(new CommandBank(this.owner, CommandType.Move));
		else if (id == 'abbrev') this.buttonView.pushBank(new CommandBank(this.owner, CommandType.Abbrev));
		else if (id == 'sblock') this.buttonView.pushBank(new CommandBank(this.owner, CommandType.SBlock));
		else if (id == 'pblock') this.buttonView.pushBank(new CommandBank(this.owner, CommandType.PBlock));
		else if (id == 'dblock') this.buttonView.pushBank(new CommandBank(this.owner, CommandType.DBlock));
		else if (id == 'fblock') this.buttonView.pushBank(new CommandBank(this.owner, CommandType.FBlock));
		else if (id == 'noble') this.buttonView.pushBank(new CommandBank(this.owner, CommandType.Noble));
		else alert('Unhandled command: "' + id + '"');

		if (actv > 0)
		{
			new MoleculeActivity(this.owner.getState(), actv, param, this.owner).execute();
		}
	}

	public claimKey(event:KeyboardEvent):boolean
	{
		//let ch = String.fromCharCode(event.keyCode || event.charCode);
		//console.log('Claim/Command['+ch+'] key='+event.keyCode+' chcode='+event.charCode);
	
		// special deal: in case it's a mac, convert Cmd-Z/Cmd-Shift-Z into the Winux convention of using Ctrl
		/*if (event.metaKey && event.key == 'z')
		{
			event.metaKey = false;
			event.ctrlKey = true;
		}*/

		for (let listItems of [COMMANDS_MAIN, COMMANDS_ATOM, COMMANDS_BOND, COMMANDS_SELECT, COMMANDS_MOVE]) for (let item of listItems)
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
