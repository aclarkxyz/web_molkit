/*
	WebMolKit

	(c) 2010-2019 Molecular Materials Informatics, Inc.

	All rights reserved

	http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path="DrawCanvas.ts"/>

namespace WebMolKit /* BOF */ {

/*
	Sketcher: a very heavyweight widget that provides 2D structure editing for a molecule.
*/

export class Sketcher extends DrawCanvas
{
	// callbacks
	public onChangeMolecule:(mol:Molecule) => void;

	public inDialog = false; // set to true while a modal dialog is open
	public initialFocus = true; // normally want to bogart the focus upon creation, but not always

	// tweakable properties
	public useToolBank = true;
	public lowerToolBank = false;
	public useCommandBank = true;
	public lowerCommandBank = false;
	public useTemplateBank = true;
	public lowerTemplateBank = false;
	public debugOutput:any = undefined;

	private beenSetup = false;
	private undoStack:SketchState[] = [];
	private redoStack:SketchState[] = [];
	private fadeWatermark = 0;
	private toolView:ButtonView = null;
	private commandView:ButtonView = null;
	private templateView:ButtonView = null;

	private proxyClip:ClipboardProxy = null;
	private proxyMenu:MenuProxy = null;
	private static UNDO_SIZE = 20;

	// ------------ public methods ------------

	constructor()
	{
		super();
	}

	// the sketcher needs to know what size to be, prior to rendering
	public setSize(width:number, height:number):void
	{
		this.width = width;
		this.height = height;
	}

	// takes an instance of molsync.data.Molecule as the content; note that it is not cloned - the caller must do this if
	// it could be modified elsewhere; note that the 'withStashUndo' parameter is a flag, which defaults to _false_, because
	// this function is usually used for things like initial state; during-edit modifications are more typically done via
	// the setState(..) function
	public defineMolecule(mol:Molecule, withAutoScale = true, withStashUndo = false, keepSelect = false):void
	{
		if (mol.compareTo(this.mol) == 0) return;

		if (withStashUndo) this.stashUndo();
		this.stopTemplateFusion();

		this.mol = mol.clone();
		if (this.onChangeMolecule) this.onChangeMolecule(this.mol);

		// note: inefficient; make it compute on demand
		this.guidelines = [];
		for (let n = 1; n <= this.mol.numAtoms; n++)
		{
			for (let sprout of SketchUtil.guidelineSprouts(this.mol, n)) this.guidelines.push(sprout);
		}

		if (!this.beenSetup) return;

		if (!keepSelect)
		{
			this.currentAtom = this.currentBond = 0;
			this.selectedMask = null;
		}
		this.stereo = null;
		this.hoverAtom = 0;
		this.hoverBond = 0;

		if (!withAutoScale)
			this.renderMolecule();
		else
			this.autoScale();
	}

	// provides the mechanism for interacting with the clipboard (which is quite different for web vs. app mode)
	public defineClipboard(proxy:ClipboardProxy):void
	{
		this.proxyClip = proxy;
	}
	public defineContext(proxy:MenuProxy):void
	{
		this.proxyMenu = proxy;
	}

	// define the molecule as a SketchEl-formatted string
	public defineMoleculeString(molsk:string, withAutoScale:boolean, withStashUndo:boolean):void
	{
		this.defineMolecule(Molecule.fromString(molsk), withAutoScale, withStashUndo);
	}

	// provides a rendering policy; the parameter should be a RenderPolicy object; note that it is not cloned
	public defineRenderPolicy(policy:RenderPolicy):void
	{
		this.policy = policy;
		this.pointScale = policy.data.pointScale;
	}

	// defines the colours used for border & background; note that a border of MetaVector.NOCOLOUR is an instruction to not have one
	public defineBackground(borderCol?:number, borderRad?:number, bgCol?:number):void
	{
		if (borderCol != null) this.border = borderCol;
		if (borderRad != null) this.borderRadius = borderRad;
		if (bgCol != null) this.background = bgCol;
	}

	// zappy zap
	public clearMolecule():void {this.defineMolecule(new Molecule(), true, true);}

	// retrieves a copy of the molecule
	public getMolecule():Molecule {return this.mol.clone();}

	// instantiates the widget: any of the immutable setup properties are now cast in stone
	public setup(callback:() => void):void
	{
		this.beenSetup = true;
		if (this.mol == null) this.mol = new Molecule();
		if (this.policy == null)
		{
			this.policy = RenderPolicy.defaultColourOnWhite();
			this.pointScale = this.policy.data.pointScale;
		}

		this.layoutMolecule();
		this.centreAndShrink();
		this.redrawMetaVector();

		if (callback) callback();
	}
	public async setupAsync():Promise<void>
	{
		return new Promise<void>((resolve) => this.setup(() => resolve()));
	}

	// create the objects necessary to render the widget; this function should be called after basic pre-initialisation settings, e.g.
	// specifying the starting molecule, initial size, etc.
	public render(parent:any):void
	{
		super.render(parent);

		this.centreAndShrink();
		this.redraw();

		// create the buttonviews
		let reserveHeight = 0;
		if (this.useCommandBank)
		{
			this.commandView = new ButtonView(ButtonViewPosition.Bottom, 0, 0, this.width, this.height);
			if (this.lowerCommandBank) this.commandView.lowerBank();
			// (put this back) this.commandView.lowerBank();
			this.commandView.setHasBigButtons(false);
			this.commandView.pushBank(new CommandBank(this));
			this.commandView.render(this.container);
			reserveHeight = this.commandView.height;
		}
		if (this.useToolBank)
		{
			this.toolView = new ButtonView(ButtonViewPosition.Left, 0, 0, this.width, this.height - reserveHeight);
			if (this.lowerToolBank) this.toolView.lowerBank();
			this.toolView.setHasBigButtons(false);
			this.toolView.pushBank(new ToolBank(this));
			this.toolView.render(this.container);
		}
		if (this.useTemplateBank)
		{
			this.templateView = new ButtonView(ButtonViewPosition.Right, 0, 0, this.width, this.height - reserveHeight);
			if (this.lowerTemplateBank) this.templateView.lowerBank();
			this.templateView.setHasBigButtons(true); // big buttons for templates is a good thing
			this.templateView.pushBank(new TemplateBank(this, null));
			this.templateView.render(this.container);
		}

		// setup all the interactive events
		this.container.onClick((event) => this.mouseClick(event));
		this.container.onDblClick((event) => this.mouseDoubleClick(event));
		this.container.onMouseDown((event) => this.mouseDown(event));
		this.container.onMouseUp((event) => this.mouseUp(event));
		this.container.onMouseOver((event) => this.mouseOver(event));
		this.container.onMouseLeave((event) => this.mouseOut(event));
		this.container.onMouseMove((event) => this.mouseMove(event));
		this.container.onKeyPress((event) => this.keyPressed(event));
		this.container.onKeyDown((event) => this.keyDown(event));
		this.container.onKeyUp((event) => this.keyUp(event));
		this.container.onTouchStart((event) => this.touchStart(event));
		this.container.onTouchMove((event) => this.touchMove(event));
		this.container.onTouchCancel((event) => this.touchCancel(event));
		this.container.onTouchEnd((event) => this.touchEnd(event));
		this.contentDOM.onContextMenu((event:MouseEvent) => this.contextMenu(event));

		// setup the wheel handler
		/* ...
		let mwh = new goog.events.MouseWheelHandler(this.container);
		goog.events.listen(mwh, goog.events.MouseWheelHandler.EventType.MOUSEWHEEL, this.mouseWheel, false, this);
		*/

		// setup drop events
		this.container.el.addEventListener('dragover', (event:DragEvent) =>
		{
			event.stopPropagation();
			event.preventDefault();
			event.dataTransfer.dropEffect = 'copy';
		});
		this.container.el.addEventListener('drop', (event:DragEvent) =>
		{
			event.stopPropagation();
			event.preventDefault();
			this.dropInto(event.dataTransfer);
		});

		if (this.initialFocus) this.grabFocus();
	}

	// viewing options: changing any of them triggers a redraw
	public get decoration():DrawCanvasDecoration {return this.viewOpt.decoration;}
	public set decoration(decoration:DrawCanvasDecoration) {if (this.viewOpt.decoration != decoration) {this.viewOpt.decoration = decoration; this.renderMolecule();}}
	public get showOxState():boolean {return this.viewOpt.showOxState;}
	public set showOxState(showOxState:boolean) {if (this.viewOpt.showOxState != showOxState) {this.viewOpt.showOxState = showOxState; this.renderMolecule();}}
	public get showQuery():boolean {return this.viewOpt.showQuery;}
	public set showQuery(showQuery:boolean) {if (this.viewOpt.showQuery != showQuery) {this.viewOpt.showQuery = showQuery; this.renderMolecule();}}
	public get showArtifacts():boolean {return this.viewOpt.showArtifacts;}
	public set showArtifacts(showArtifacts:boolean) {if (this.viewOpt.showArtifacts != showArtifacts) {this.viewOpt.showArtifacts = showArtifacts; this.renderMolecule();}}

	// change the size of the sketcher after instantiation
	public changeSize(width:number, height:number):void
	{
		if (width == this.width && height == this.height) return;
		this.width = width;
		this.height = height;

		for (let widget of [this.container, this.canvasUnder, this.canvasMolecule, this.canvasOver])
		{
			widget.css({'width': `${width}px`, 'height': `${height}px`});
		}

		for (let btnv of [this.commandView, this.toolView, this.templateView]) if (btnv)
		{
			btnv.setParentSize(width, height);
			btnv.refreshBank();
		}

		this.autoScale();
	}

	// displays a message, which may be an error or just something helpful
	public showMessage(msg:string, isError:boolean = false):void
	{
		let watermark = ++this.fadeWatermark;

		this.divMessage.css({'color': isError ? '#FF0000' : '#008000'});
		this.divMessage.setText(msg);
		let szLeft = (this.toolView == null ? 0 : this.toolView.width) + 2;
		let szRight = (this.templateView == null ? 0 : this.templateView.width) + 2;
		let szBottom = (this.commandView == null ? 0 : this.commandView.height) + 2;
		this.divMessage.css({'left': szLeft + 'px'});
		this.divMessage.css({'width': (this.width - szLeft - szRight) + 'px'});
		this.divMessage.css({'height': (this.height - szBottom) + 'px'});

		window.setTimeout(() =>
		{
			if (watermark == this.fadeWatermark) this.divMessage.setText('');
		}, 5000);
	}

	// boots the message immediately
	public clearMessage()
	{
		if (this.divMessage.getText() == '') return;
		this.fadeWatermark++;
		this.divMessage.setText('');
	}

	// rescales and aligns to the middle of the screen
	public autoScale()
	{
		// note: this is inefficient; can just scale the primitives...

		this.pointScale = this.policy.data.pointScale;

		this.layoutMolecule();
		this.centreAndShrink();
		this.redrawMetaVector();
		this.layoutTemplatePerm();
		this.delayedRedraw();
	}

	// returns true if there are any selected atoms
	public anySelected():boolean
	{
		if (this.selectedMask == null) return false;
		for (let n = 0; n < this.selectedMask.length; n++) if (this.selectedMask[n]) return true;
		return false;
	}

	// changes selection state for atom
	public setSelected(atom:number, sel:boolean):void
	{
		if (this.selectedMask == null)
		{
			this.selectedMask = new Array(this.mol.numAtoms);
			for (let n = this.selectedMask.length - 1; n >= 0; n--) this.selectedMask[n] = false;
		}
		while (this.selectedMask.length < this.mol.numAtoms) {this.selectedMask.push(false);}
		this.selectedMask[atom - 1] = sel;
		this.delayedRedraw();
	}

	// convenience: sets current and redraws
	private changeCurrentAtom(atom:number):void
	{
		if (this.currentAtom == atom) return;
		this.currentAtom = atom;
		this.currentBond = 0;
		this.delayedRedraw();
	}
	private changeCurrentBond(bond:number):void
	{
		if (this.currentBond == bond) return;
		this.currentBond = bond;
		this.currentAtom = 0;
		this.delayedRedraw();
	}

	// select & current are zapped
	public clearSubject():void
	{
		if (this.currentAtom == 0 && this.currentBond == 0 && Vec.allFalse(this.selectedMask)) return;
		this.currentAtom = 0;
		this.currentBond = 0;
		this.selectedMask = Vec.booleanArray(false, this.mol.numAtoms);
		this.delayedRedraw();
	}

	// sets the current state; see getState() function above for the format of the object; the 'withStashUndo' parameter is a
	// flag, which defaults to true: determines whether the current state will be pushed onto the undo-stack before making the change
	public setState(state:SketchState, withStashUndo:boolean = true):void
	{
		//if (withStashUndo) this.stashUndo();
		this.stopTemplateFusion();

		if (state.mol != null) this.defineMolecule(state.mol.clone(), false, withStashUndo, true);
		if (state.currentAtom >= 0) this.currentAtom = state.currentAtom;
		if (state.currentBond >= 0) this.currentBond = state.currentBond;
		if (state.selectedMask != null) this.selectedMask = state.selectedMask == null ? null : state.selectedMask.slice(0);

		this.delayedRedraw();
	}

	// appends the current state to the undo-stack
	public stashUndo():void
	{
		if (this.undoStack.length == 0 && this.mol.numAtoms == 0) return; // don't put empty stuff at the beginning
		let state = this.getState();

		this.undoStack.push(state);
		while (this.undoStack.length > Sketcher.UNDO_SIZE)
		{
			this.undoStack.splice(0, 1);
		}
		this.redoStack = [];
	}

	// a bunch of template fusion permutations has arrived: display the first one, and allow them to be traversed
	public setPermutations(perms:TemplatePermutation[]):void
	{
		this.templatePerms = perms;
		this.pickTemplatePermutation(0);
		this.fusionBank = new FusionBank(this);
		this.templateView.pushBank(this.fusionBank);

		if (this.mol.numAtoms == 0) this.centreAndShrink();
	}

	// stop fusing templates, and clear out the fusion bank as well
	public stopTemplateFusion():void
	{
		if (this.fusionBank != null) this.templateView.popBank();
	}

	// get rid of the template overlay
	public clearPermutations()
	{
		if (this.templatePerms == null) return;
		this.templatePerms = null;
		this.delayedRedraw();
		this.fusionBank = null;
	}

	// accept the current template permutation: make it the new molecule
	public templateAccept():void
	{
		let mol = Molecule.fromString(this.templatePerms[this.currentPerm].mol);
		this.templateView.popBank();
		this.defineMolecule(mol, false, true, true);
	}

	// rotate the template display up or down
	public templateRotate(dir:number)
	{
		let idx = (this.currentPerm + dir) % this.templatePerms.length;
		if (idx < 0) idx += this.templatePerms.length;
		this.pickTemplatePermutation(idx);
	}

	// reports on the state of the undo/redo buffers
	public canUndo():boolean {return this.undoStack.length > 0;}
	public canRedo():boolean {return this.redoStack.length > 0;}

	// actually does the undo/redo operation
	public performUndo():void
	{
		if (this.undoStack.length == 0) return;
		let state = this.getState();
		this.redoStack.push(state);
		this.setState(this.undoStack.pop(), false);
	}
	public performRedo():void
	{
		if (this.redoStack.length == 0) return;
		let state = this.getState();
		this.undoStack.push(state);
		this.setState(this.redoStack.pop(), false);
	}

	// copying to clipboard: sticks the content in several different places, for subsequent recall
	public performCopy(mol?:Molecule):void
	{
		if (!mol) mol = this.getMolecule();

		if (this.proxyClip) this.proxyClip.setString(mol.toString());
	}

	// perform a more surgical copy/cut operation
	public performCopySelection(andCut:boolean):void
	{
		new MoleculeActivity(this.getState(), andCut ? ActivityType.Cut : ActivityType.Copy, {}, this).execute();
	}

	// pasting from clipboard, initiated by the user via non-system commands: this can't necessarily grab the system
	// clipboard, so have to get a bit more creative
	public performPaste():void
	{
		// see if we have access to the system clipboard
		if (this.proxyClip && this.proxyClip.canAlwaysGet())
		{
			let txt = this.proxyClip.getString();
			this.pasteText(txt);
		}
	}

	// executes an arbitrary activity on the current molecule/selection state
	public performActivity(activity:ActivityType, param:Record<string, any> = {}):void
	{
		new MoleculeActivity(this.getState(), activity, param, this).execute();
	}

	// zooms in or out, depending on the magnifier
	public zoom(mag:number)
	{
		let cx = 0.5 * this.width, cy = 0.5 * this.height;
		let newScale = Math.min(10 * this.policy.data.pointScale, Math.max(0.1 * this.policy.data.pointScale, this.pointScale * mag));
		if (newScale == this.pointScale) return;

		this.offsetX = cx - (newScale / this.pointScale) * (cx - this.offsetX);
		this.offsetY = cy - (newScale / this.pointScale) * (cy - this.offsetY);
		this.pointScale = newScale;

		// --- begin inefficient: rewrite this to just transform the constituents...
		this.layoutMolecule();
		this.redrawMetaVector();
		this.layoutTemplatePerm();
		// --- end inefficient

		this.delayedRedraw();
	}

	// bring up the interactive editing mode for current object, if any
	public editCurrent():void
	{
		if (this.currentAtom > 0) this.editAtom(this.currentAtom);
		else if (this.currentBond > 0) this.editBond(this.currentBond);
	}

	// pasted text from clipboard (can be activated from outside the widget, so is public)
	public pasteText(str:string):void
	{
		let mol = MoleculeStream.readUnknown(str);
		if (!mol)
		{
			let ds = DataSheetStream.readXML(str);
			if (ds)
			{
				outer: for (let r = 0; r < ds.numRows; r++) for (let c = 0; c < ds.numCols; c++) if (ds.colType(c) == DataSheetColumn.Molecule && ds.notNull(r, c))
				{
					mol = ds.getMolecule(r, c);
					break outer;
				}
			}
		}

		if (mol != null) this.pasteMolecule(mol);
		else alert('Text from clipboard is not a valid molecule.');
	}
	public pasteMolecule(mol:Molecule):void
	{
		if (this.mol.numAtoms == 0)
		{
			this.defineMolecule(mol, true, true, true);
			return;
		}

		// special deal for pasting query-only features
		let molact = new MoleculeActivity(this.getState(), ActivityType.QueryPaste, {'qmol': mol});
		molact.execute();
		if (molact.output.mol)
		{
			this.defineMolecule(molact.output.mol, false, true, true);
			return;
		}

		let param = {'fragNative': mol.toString()};
		new MoleculeActivity(this.getState(), ActivityType.TemplateFusion, param, this).execute();
	}

	// changes the template permutation: if necessary requests the layout, and redraws the screen
	public pickTemplatePermutation(idx:number)
	{
		let perm = this.templatePerms[idx];
		this.currentPerm = idx;

		this.layoutTemplatePerm();
		this.delayedRedraw();
	}

	// bring up the dialog for converting the subject atoms into a polymer block repeating unit
	public performPolymerBlock(atoms:number[]):void
	{
		let dlg = new EditPolymer(this.mol, atoms, this.proxyClip, () =>
		{
			if (this.mol.compareTo(dlg.mol) != 0) this.defineMolecule(dlg.mol, false, true, true);
			dlg.close();
		});
		dlg.callbackClose = () =>
		{
			this.inDialog = false;
			this.grabFocus();
		};
		this.inDialog = true;
		dlg.open();
	}

	// ensure that focus is happening
	public grabFocus():void
	{
		this.container.grabFocus();
	}

	// returns true if the sketcher is focused; the display of focus is not visible, but it is still recorded
	public hasFocus():boolean
	{
		return this.container.hasFocus();
	}

	// ------------ private methods ------------

	// redetermines the offset and scale so that the molecular structure fits cleanly
	private centreAndShrink():void
	{
		if (this.mol.numAtoms == 0 || this.layout == null)
		{
			this.offsetX = 0.5 * this.width;
			this.offsetY = 0.5 * this.height;
			this.pointScale = this.policy.data.pointScale;
			return;
		}

		let bounds = this.layout.determineBoundary(0);

		let limW = this.width - 6, limH = this.height - 6;
		let natW = bounds[2] - bounds[0], natH = bounds[3] - bounds[1];

		let scale = 1;
		if (natW > limW)
		{
			let down = limW / natW;
			scale *= down;
			natW *= down;
			natH *= down;
		}
		if (natH > limH)
		{
			let down = limH / natH;
			scale *= down;
			natW *= down;
			natH *= down;
		}

		if (scale < 1)
		{
			this.pointScale *= scale;
			this.layout.offsetEverything(this.offsetX * scale, this.offsetY * scale);
			this.layout.scaleEverything(scale);
			bounds = this.layout.determineBoundary(0);
		}

		let dx = 0.5 * (limW - natW) - bounds[0], dy = 0.5 * (limH - natH) - bounds[1];
		this.offsetX += dx;
		this.offsetY += dy;
		this.layout.offsetEverything(dx, dy);
	}

	// creates the template permutation rendering object using the same transform as the main molecule
	private layoutTemplatePerm():void
	{
		if (this.currentPerm < 0 || this.templatePerms == null) return;
		let perm = this.templatePerms[this.currentPerm];

		let tpolicy = new RenderPolicy(this.policy.data);
		tpolicy.data.foreground = 0x808080;
		tpolicy.data.atomCols = tpolicy.data.atomCols.slice(0);
		for (let n in tpolicy.data.atomCols) tpolicy.data.atomCols[n] = 0x808080;

		let effects = new RenderEffects();
		let layout = new ArrangeMolecule(Molecule.fromString(perm.display), this, tpolicy, effects);
		layout.arrange();
		perm.metavec = new MetaVector();
		new DrawMolecule(layout, perm.metavec).draw();
	}

	// re-render the molecule into its graphical state buffers, then trigger a delayed re-splat onto the canvas; this is useful when the molecule
	// is to be displayed differently even though the molecule itself has not actually changed
	private renderMolecule():void
	{
		this.layoutMolecule();
		this.redrawMetaVector();
		this.delayedRedraw();
	}

	// locates a molecular object at the given position: returns N for atom, -N for bond, 0 for nothing, or null for not-on-canvas (e.g. button banks)
	protected pickObjectCanvas(x:number, y:number):number
	{
		if (this.layout == null) return 0;

		// if the position is over a buttonview, return zero (yes, this does happen)
		if (this.toolView != null)
		{
			let pos1 = this.container.offset(), pos2 = this.toolView.contentDOM.offset();
			if (this.toolView.withinOutline(x + pos1.x - pos2.x, y + pos1.y - pos2.y)) return null;
		}
		if (this.commandView != null)
		{
			let pos1 = this.container.offset(), pos2 = this.commandView.contentDOM.offset();
			if (this.commandView.withinOutline(x + pos1.x - pos2.x, y + pos1.y - pos2.y)) return null;
		}
		if (this.templateView != null)
		{
			let pos1 = this.container.offset(), pos2 = this.templateView.contentDOM.offset();
			if (this.templateView.withinOutline(x + pos1.x - pos2.x, y + pos1.y - pos2.y)) return null;
		}

		return super.pickObjectCanvas(x, y);
	}

	// response to some mouse event: hovering cursor restated
	private updateHoverCursor(x:number, y:number):void
	{
		let tool = this.toolView ? this.toolView.selectedButton : '';
		let toolApplies = tool && tool != ToolBankItem.Pan && tool != ToolBankItem.Rotate;

		let mouseObj = 0;

		if (this.dragType == DraggingTool.None && toolApplies)
		{
			mouseObj = this.pickObject(x, y);
		}
		let mouseAtom = mouseObj > 0 ? mouseObj : 0, mouseBond = mouseObj < 0 ? -mouseObj : 0;

		let abbrevThen = this.hoverAtom > 0 && MolUtil.hasAbbrev(this.mol, this.hoverAtom) ? this.hoverAtom : 0;
		let abbrevNow = mouseAtom > 0 && MolUtil.hasAbbrev(this.mol, mouseAtom) ? mouseAtom : 0;

		if (mouseAtom != this.hoverAtom || mouseBond != this.hoverBond)
		{
			this.hoverAtom = mouseAtom;
			this.hoverBond = mouseBond;
			if (abbrevThen != abbrevNow)
			{
				this.layoutMolecule();
				this.redrawMetaVector();
			}
			this.delayedRedraw();
		}
	}

	// looks through the current list of available guidelines, and picks out the sprouting(s) that relate to the clicked atom, if any
	private determineDragGuide(order:number):GuidelineSprout[]
	{
		// special deal: if no atom clicked, create a fake one with 30 degree angles from the click position
		if (this.opAtom == 0 || this.mol.atomAdjCount(this.opAtom) == 0)
		{
			let g:GuidelineSprout =
			{
				'atom': this.opAtom,
				'orders': [order],
				'x': [],
				'y': [],
				'sourceX': this.opAtom == 0 ? this.clickX : this.angToX(this.mol.atomX(this.opAtom)),
				'sourceY': this.opAtom == 0 ? this.clickY : this.angToY(this.mol.atomY(this.opAtom)),
				'destX': [],
				'destY': []
			};

			let mx = this.opAtom == 0 ? this.xToAng(this.clickX) : this.mol.atomX(this.opAtom);
			let my = this.opAtom == 0 ? this.yToAng(this.clickY) : this.mol.atomY(this.opAtom);
			for (let n = 0; n < 12; n++)
			{
				let theta = TWOPI * n / 12;
				let dx = Molecule.IDEALBOND * Math.cos(theta), dy = Molecule.IDEALBOND * Math.sin(theta);
				g.x.push(mx + dx);
				g.y.push(my + dy);
				g.destX.push(g.sourceX + dx * this.pointScale);
				g.destY.push(g.sourceY - dy * this.pointScale);
			}

			return [g];
		}

		if (this.guidelines == null) return null;

		let best:GuidelineSprout = null, single:GuidelineSprout = null;
		for (let n = 0; n < this.guidelines.length; n++)
		{
			let g = this.guidelines[n];
			if (g.atom != this.opAtom) continue;
			if (g.orders.indexOf(order) >= 0) {best = g; break;}
			if (g.orders.indexOf(1) >= 0) single = g;
		}
		if (best == null) best = single;
		if (best == null) return [];

		let g = clone(best) as GuidelineSprout;
		g.sourceX = this.angToX(this.mol.atomX(g.atom));
		g.sourceY = this.angToY(this.mol.atomY(g.atom));
		g.destX = [];
		g.destY = [];
		for (let n = 0; n < g.x.length; n++)
		{
			g.destX.push(this.angToX(g.x[n]));
			g.destY.push(this.angToY(g.y[n]));
		}
		return [g];
	}

	// activates drag guidelines for moving atoms - this is anything besides the atoms that are being moved
	private determineMoveGuide():GuidelineSprout[]
	{
		let subj = this.subjectAtoms(false, true);
		if (subj.length == 0 || subj.length == this.mol.numAtoms) return null;

		let guides:GuidelineSprout[] = [];
		for (let n = 0; n < this.guidelines.length; n++)
		{
			let g = this.guidelines[n];
			if (g.orders.indexOf(1) < 0 || subj.indexOf(g.atom) >= 0) continue;

			g = clone(g) as GuidelineSprout;
			g.sourceX = this.angToX(this.mol.atomX(g.atom));
			g.sourceY = this.angToY(this.mol.atomY(g.atom));
			g.destX = [];
			g.destY = [];
			for (let i = 0; i < g.x.length; i++)
			{
				g.destX.push(this.angToX(g.x[i]));
				g.destY.push(this.angToY(g.y[i]));
			}
			guides.push(g);
		}
		return guides;
	}

	// interactively edit the given atom/bond
	private editAtom(atom:number):void
	{
		if (atom == 0) return;

		let dlg = new EditAtom(this.mol, atom, this.proxyClip, () =>
		{
			if (this.mol.compareTo(dlg.mol) != 0) this.defineMolecule(dlg.mol, false, true, true);
			dlg.close();
		});
		dlg.callbackClose = () =>
		{
			this.inDialog = false;
			this.grabFocus();
		};
		this.inDialog = true;
		dlg.open();
	}
	private editBond(bond:number):void
	{
		if (bond == 0) return;

		let dlg = new EditBond(this.mol, bond, this.proxyClip, () =>
		{
			if (this.mol.compareTo(dlg.mol) != 0) this.defineMolecule(dlg.mol, false, true, true);
			dlg.close();
		});
		dlg.callbackClose = () =>
		{
			this.inDialog = false;
			this.grabFocus();
		};
		this.inDialog = true;
		dlg.open();
	}

	// move the current selection in one of the cardinal directions
	private hitArrowKey(dx:number, dy:number):void
	{
		let watermark = ++this.cursorWatermark;
		this.cursorDX += dx;
		this.cursorDY += dy;
		setTimeout(() =>
		{
			if (watermark == this.cursorWatermark) this.cursorJumpDirection();
		}, 100);
	}

	// given the direction of the cursor offset, try to move the current position in that direction
	private cursorJumpDirection():void
	{
		let theta = Math.atan2(this.cursorDY, this.cursorDX);
		if (this.currentAtom > 0) this.jumpFromCurrentAtom(theta);
		else if (this.currentBond > 0) this.jumpFromCurrentBond(theta);
		else this.jumpFromNowhere(theta);

		this.cursorDX = 0;
		this.cursorDY = 0;
		this.cursorWatermark = 0;
	}
	private jumpFromCurrentAtom(theta:number):void
	{
		// see if we can follow a bond
		let adj = this.mol.atomAdjList(this.currentAtom);
		let closest = 0, closestDelta = Number.MAX_VALUE;
		for (let a of adj)
		{
			let dx = this.mol.atomX(a) - this.mol.atomX(this.currentAtom), dy = this.mol.atomY(a) - this.mol.atomY(this.currentAtom);
			let adjTheta = Math.atan2(dy, dx), delta = Math.abs(angleDiff(adjTheta, theta));
			if (delta < 35.0 * DEGRAD && delta < closestDelta) [closest, closestDelta] = [a, delta];
		}
		if (closest > 0)
		{
			this.changeCurrentBond(this.mol.findBond(this.currentAtom, closest));
			return;
		}

		// no bond to hop onto, so try jumping across a chasm
		let best = 0, bestScore = Number.MIN_VALUE;
		for (let n = 1; n <= this.mol.numAtoms; n++) if (n != this.currentAtom && adj.indexOf(n) < 0)
		{
			let dx = this.mol.atomX(n) - this.mol.atomX(this.currentAtom), dy = this.mol.atomY(n) - this.mol.atomY(this.currentAtom);
			let adjTheta = Math.atan2(dy, dx), delta = Math.abs(angleDiff(adjTheta, theta));
			if (delta > 45.0 * DEGRAD) continue; // must be in the cone
			let cosdelta = Math.cos(delta);
			let score = Math.pow(cosdelta, 2) / (norm2_xy(dx, dy) + 0.001);
			if (score > bestScore) [best, bestScore] = [n, score];
		}
		if (best > 0) this.changeCurrentAtom(best);
	}
	private jumpFromCurrentBond(theta:number):void
	{
		let [bfr, bto] = this.mol.bondFromTo(this.currentBond);
		let bondTheta = Math.atan2(this.mol.atomY(bto) - this.mol.atomY(bfr), this.mol.atomX(bto) - this.mol.atomX(bfr));
		if (Math.abs(angleDiff(theta, bondTheta)) < 50.0 * DEGRAD) this.changeCurrentAtom(bto);
		if (Math.abs(angleDiff(theta, bondTheta + Math.PI)) < 50.0 * DEGRAD) this.changeCurrentAtom(bfr);
		//  (otherwise do nothing)
	}
	private jumpFromNowhere(theta:number):void
	{
		if (this.mol.numAtoms == 0) return;
		if (this.mol.numAtoms == 1) {this.changeCurrentAtom(1); return;}

		let cx = 0, cy = 0;
		for (let n = 1; n <= this.mol.numAtoms; n++) {cx += this.mol.atomX(n); cy += this.mol.atomY(n);}
		let inv = 1.0 / this.mol.numAtoms;
		cx *= inv; cy *= inv;

		let best = 0, bestScore = Number.MIN_VALUE;
		for (let n = 1; n <= this.mol.numAtoms; n++)
		{
			let dx = this.mol.atomX(n) - cx, dy = this.mol.atomY(n) - cy, atheta = Math.atan2(dy, dx);
			let cosdelta = Math.cos(Math.abs(angleDiff(theta + Math.PI, atheta)));
			let score = cosdelta * norm_xy(dx, dy);
			if (score > bestScore) [best, bestScore] = [n, score];
		}
		if (best > 0) this.changeCurrentAtom(best);
	}

	// manufactures a ring of given size based on context
	private createRing(rsz:number, aromatic:boolean):void
	{
		const {mol} = this;
		let rx:number[] = null, ry:number[] = null;
		if (this.currentAtom > 0)
		{
			let dx = 0, dy = 0, adj = mol.atomAdjList(this.currentAtom);
			let x0 = mol.atomX(this.currentAtom), y0 = mol.atomY(this.currentAtom);
			for (let a of adj)
			{
				dx -= mol.atomX(a) - x0;
				dy -= mol.atomY(a) - y0;
			}
			if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001)
			{
				if (adj.length >= 2)
				{
					let theta = adj.map((a) => Math.atan2(mol.atomY(a) - x0, mol.atomX(a) - y0));
					Vec.sort(theta);
					let best = Number.POSITIVE_INFINITY;
					for (let n = 0; n < theta.length; n++)
					{
						let th = angleDiff(theta[(n + 1) % theta.length], theta[n]);
						let lx = Math.cos(th), ly = Math.sin(th), score = CoordUtil.congestionPoint(mol, x0 + lx, y0 + ly);
						if (score < best) [best, dx, dy] = [score, lx, ly];
					}
				}
				else [dx, dy] = [1, 0];
			}
			[rx, ry] = SketchUtil.proposeAtomRing(this.mol, rsz, this.currentAtom, dx, dy);
		}
		else if (this.currentBond > 0)
		{
			let a1 = mol.bondFrom(this.currentBond), a2 = mol.bondTo(this.currentBond);
			let x1 = mol.atomX(a1), y1 = mol.atomY(a1), x2 = mol.atomX(a2), y2 = mol.atomY(a2);
			let cx = 0.5 * (x1 + x2), cy = 0.5 * (y1 + y2), ox = y1 - y2, oy = x2 - x1;
			let [dx, dy] = CoordUtil.congestionPoint(mol, cx - ox, cy - oy) < CoordUtil.congestionPoint(mol, cx + ox, cy + oy) ? [-ox, -oy] : [ox, oy];
			[rx, ry] = SketchUtil.proposeBondRing(this.mol, rsz, this.currentBond, dx, dy);
		}
		else
		{
			let x = 0, y = 0;
			if (mol.numAtoms > 0)
			{
				let bound = mol.boundary();
				[x, y] = [bound.maxX() + Molecule.IDEALBOND, bound.midY()];
			}
			[rx, ry] = SketchUtil.proposeNewRing(this.mol, rsz, x, y, 1, 0, false);
		}

		if (!rx) return;

		let param:any =
		{
			'ringX': rx,
			'ringY': ry,
			'aromatic': aromatic
		};
		let molact = new MoleculeActivity(this.getState(), ActivityType.Ring, param, this);
		molact.execute();
	}

	// --------------------------------------- toolkit events ---------------------------------------

	// event responses
	private mouseClick(event:MouseEvent):boolean
	{
		event.stopPropagation();
		this.grabFocus(); // just in case it wasn't already
		return false;
	}
	private mouseDoubleClick(event:MouseEvent):boolean
	{
		event.stopPropagation();
		event.preventDefault();

		if (this.toolView.selectedButton != ToolBankItem.Arrow) return;

		let xy = eventCoords(event, this.container);
		let clickObj = this.pickObject(xy[0], xy[1]);
		if (clickObj > 0)
		{
			let atom = clickObj;
			this.editAtom(atom);
		}
		else
		{
			let bond = -clickObj;
			this.editBond(bond);
		}
		return false;
	}
	private mouseDown(event:MouseEvent):boolean
	{
		event.stopPropagation();
		event.preventDefault();

		this.clearMessage();

		if (event.ctrlKey && !event.shiftKey && !event.altKey)
		{
			this.contextMenu(event);
			return;
		}

		let [x, y] = eventCoords(event, this.container);
		this.interactStart(x, y, event.shiftKey, event.ctrlKey, event.altKey);

		return false;
	}
	private mouseUp(event:MouseEvent):boolean
	{
		event.stopPropagation();

		let [x, y] = eventCoords(event, this.container);
		this.interactEnd(x, y);

		return false;
	}
	private mouseOver(event:MouseEvent):boolean
	{
		event.stopPropagation();
		let [x, y] = eventCoords(event, this.container);
		this.updateHoverCursor(x, y);
		this.updateLasso(x, y);
		return false;
	}
	private mouseOut(event:MouseEvent):boolean
	{
		event.stopPropagation();
		let [x, y] = eventCoords(event, this.container);
		this.updateHoverCursor(x, y);
		this.updateLasso(x, y);
		return false;
	}
	private mouseMove(event:MouseEvent):boolean
	{
		event.stopPropagation();
		let [x, y] = eventCoords(event, this.container);
		this.updateHoverCursor(x, y);

		if (this.dragType == DraggingTool.None) return; // mouse button isn't pressed

		this.interactDrag(x, y);

		return false;
	}

	private keyPressed(event:KeyboardEvent):void
	{
		//let ch = String.fromCharCode(event.keyCode || event.charCode);
		//console.log('PRESSED['+ch+'] key='+event.keyCode+' chcode='+event.charCode);

		// !! TODO: special cases, like arrow keys/escape...

		/*if (this.toolView != null && this.toolView.topBank.claimKey(event)) {event.preventDefault(); return;}
		if (this.commandView != null && this.commandView.topBank.claimKey(event)) {event.preventDefault(); return;}
		if (this.templateView != null && this.templateView.topBank.claimKey(event)) {event.preventDefault(); return;}*/
	}
	private keyDown(event:KeyboardEvent):void
	{
		let key = event.key;

		// special deal for the escape key: if any bank needs to be popped, consume it
		if (key == KeyCode.Escape)
		{
			for (let view of [this.templateView, this.commandView, this.toolView]) if (view != null && view.stackSize > 1)
			{
				view.popBank();
				event.preventDefault();
				event.stopPropagation();
				return;
			}
		}

		let mod = (event.shiftKey ? 'S' : '') + (event.ctrlKey || event.metaKey ? 'C' : '') + (event.altKey ? 'A' : ''); // (meta==cmd on mac; alt=opt on mac)
		let nomod = !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey;

		//console.log(`Sketcher/Key:${key} Mod:${mod}`);

		if (key == KeyCode.Enter) this.editCurrent();
		else if (key == KeyCode.Left && nomod) this.hitArrowKey(-1, 0);
		else if (key == KeyCode.Right && nomod) this.hitArrowKey(1, 0);
		else if (key == KeyCode.Up && nomod) this.hitArrowKey(0, 1);
		else if (key == KeyCode.Down && nomod) this.hitArrowKey(0, -1);
		else if (key == 'z' && mod == 'C') this.performUndo();
		else if (key == 'Z' && mod == 'SC') this.performRedo();
		else if (key == 'z' && nomod) this.toolView.cycleSelected(-1);
		else if (key == 'x' && nomod) this.toolView.cycleSelected(1);
		else if (this.toolView != null && this.toolView.topBank.claimKey(event)) {}
		else if (this.commandView != null && this.commandView.topBank.claimKey(event)) {}
		else if (this.templateView != null && this.templateView.topBank.claimKey(event)) {}
		else if (key == '#' && mod == 'SC') this.createRing(3, false);
		else if (key == '$' && mod == 'SC') this.createRing(4, false);
		else if (key == '%' && mod == 'SC') this.createRing(5, false);
		else if (key == '^' && mod == 'SC') this.createRing(6, false);
		else if (key == '&' && mod == 'SC') this.createRing(7, false);
		else if (key == '3' && mod == 'CA') this.createRing(3, true);
		else if (key == '4' && mod == 'CA') this.createRing(4, true);
		else if (key == '5' && mod == 'CA') this.createRing(5, true);
		else if (key == '6' && mod == 'CA') this.createRing(6, true);
		else if (key == '7' && mod == 'CA') this.createRing(7, true);
		else if (key == 'c' && mod == 'C' && this.proxyClip) this.proxyClip.triggerCopy(false);
		else if (key == 'x' && mod == 'C' && this.proxyClip) this.proxyClip.triggerCopy(true);
		else if (key == 'v' && mod == 'C' && this.proxyClip && this.proxyClip.canAlwaysGet()) this.proxyClip.triggerPaste();
		else return; // allow the key to percolate upward

		event.preventDefault();
		event.stopPropagation();
	}
	private keyUp(event:KeyboardEvent):void
	{
		// ..
	}
	private touchStart(event:TouchEvent):void
	{
		let [x, y] = eventCoords(event.touches[0], this.container);
		if (this.pickObjectCanvas(x, y) == null) return; // defer to an overlaying widget

		this.interactStart(x, y, event.shiftKey, event.ctrlKey, event.altKey);
		event.preventDefault();
	}
	private touchMove(event:TouchEvent):void
	{
		if (this.dragType != DraggingTool.None)
		{
			let [x, y] = eventCoords(event.touches[0], this.container);
			this.interactDrag(x, y);
		}

		event.preventDefault(); // prevents panning around the place
	}
	private touchCancel(event:TouchEvent):void
	{
		//event.preventDefault();
	}
	private touchEnd(event:TouchEvent):void
	{
		if (this.dragType != DraggingTool.None)
		{
			let [x, y] = [this.mouseX, this.mouseY]; // end events have 0 touches, so use last known
			this.interactEnd(x, y);
			event.preventDefault();
		}
	}
	private mouseWheel(event:MouseEvent):void
	{
		/* maybe reinstate? not sure...
		let xy = eventCoords(event, this.container);
		let newScale = this.scale * (1 - event.deltaY * 0.1);
		newScale = Math.min(10, Math.max(0.1, newScale));
		let newOX = xy[0] - (newScale / this.scale) * (xy[0] - this.offsetX);
		let newOY = xy[1] - (newScale / this.scale) * (xy[1] - this.offsetY);

		this.scale = newScale;
		this.offsetX = newOX;
		this.offsetY = newOY;

		this.delayedRedraw();

		event.stopPropagation = true;
		*/
	}
	private contextMenu(event:MouseEvent):void
	{
		event.preventDefault();
		event.stopPropagation();

		this.dragType = DraggingTool.None;

		if (!this.proxyMenu) return;

		let [x, y] = eventCoords(event, this.container);
		let clickObj = this.pickObject(x, y);
		if (clickObj > 0) this.changeCurrentAtom(clickObj);
		else if (clickObj < 0) this.changeCurrentBond(-clickObj);
		let state = this.getState();

		let ctx = new ContextSketch(state, this, this.proxyClip);
		let menu = ctx.populate();
		this.proxyMenu.openContextMenu(menu, event);
	}

	// the mouse/touch sequence began
	private interactStart(x:number, y:number, shiftKey:boolean, ctrlKey:boolean, altKey:boolean):void
	{
		this.dragType = DraggingTool.Press;
		this.opBudged = false;
		this.dragGuides = null;

		this.mouseX = x;
		this.mouseY = y;
		this.clickX = x;
		this.clickY = y;

		let clickObj = this.pickObject(x, y);
		this.opAtom = clickObj > 0 ? clickObj : 0;
		this.opBond = clickObj < 0 ? -clickObj : 0;
		this.opShift = shiftKey;
		this.opCtrl = ctrlKey;
		this.opAlt = altKey;

		let tool = '';
		if (this.toolView != null) tool = this.toolView.selectedButton;

		if (tool == ToolBankItem.Arrow)
		{
			// special key modifiers for the arrow tool:
			//		CTRL: open context menu
			//		SHIFT: toggle selection of object [see mouseClick]
			//		ALT: enter pan-mode
			//		ALT+CTRL: enter zoom mode
			if (!this.opShift && !this.opCtrl && !this.opAlt)
			{
				this.dragType = DraggingTool.Press;
			}
			//else if (!this.opShift && this.opCtrl && !this.opAlt) (done already)
			else if (!this.opShift && !this.opCtrl && this.opAlt)
			{
				this.dragType = DraggingTool.Pan;
			}
			else if (!this.opShift && this.opCtrl && this.opAlt)
			{
				this.dragType = DraggingTool.Zoom;
			}
		}
		else if (tool == ToolBankItem.Rotate)
		{
			this.dragType = DraggingTool.Rotate;
			this.toolRotateIncr = this.opShift ? 0 : 15 * DEGRAD;
		}
		else if (tool == ToolBankItem.Pan)
		{
			this.dragType = DraggingTool.Pan;
		}
		else if (tool == ToolBankItem.Drag)
		{
			this.dragType = DraggingTool.Move;
			if (this.opAtom > 0) this.dragGuides = this.determineMoveGuide();
			this.delayedRedraw();
		}
		else if (tool == ToolBankItem.Erasor)
		{
			this.dragType = DraggingTool.Erasor;
			this.lassoX = [x];
			this.lassoY = [y];
			this.lassoMask = [];
		}
		else if (tool == ToolBankItem.RingAliph)
		{
			this.dragType = DraggingTool.Ring;
			this.toolRingArom = false;
			this.toolRingFreeform = this.opShift;
		}
		else if (tool == ToolBankItem.RingArom)
		{
			this.dragType = DraggingTool.Ring;
			this.toolRingArom = true;
			this.toolRingFreeform = this.opShift;
		}
		else if (tool == ToolBankItem.AtomPlus)
		{
			this.dragType = DraggingTool.Charge;
			this.toolChargeDelta = 1;
		}
		else if (tool == ToolBankItem.AtomMinus)
		{
			this.dragType = DraggingTool.Charge;
			this.toolChargeDelta = -1;
		}
		else if (tool.startsWith(ToolBankItem.BondPfx))
		{
			this.dragType = DraggingTool.Bond;
			this.toolBondOrder = 1;
			this.toolBondType = Molecule.BONDTYPE_NORMAL;

			if (tool == ToolBankItem.BondOrder0) this.toolBondOrder = 0;
			else if (tool == ToolBankItem.BondOrder2) this.toolBondOrder = 2;
			else if (tool == ToolBankItem.BondOrder3) this.toolBondOrder = 3;
			else if (tool == ToolBankItem.BondUnknown) this.toolBondType = Molecule.BONDTYPE_UNKNOWN;
			else if (tool == ToolBankItem.BondInclined) this.toolBondType = Molecule.BONDTYPE_INCLINED;
			else if (tool == ToolBankItem.BondDeclined) this.toolBondType = Molecule.BONDTYPE_DECLINED;

			// drag-from-bond is only a thing when polymers are involved
			if (this.opBond > 0)
			{
				let [bfr, bto] = this.mol.bondFromTo(this.opBond), inPoly = false;
				for (let poly of new PolymerBlock(this.mol).getUnits())
				{
					let in1 = poly.atoms.includes(bfr), in2 = poly.atoms.includes(bto);
					if ((in1 && !in2) || (in2 && !in1)) {inPoly = true; break;}
				}
				if (inPoly)
				{
					this.toolBondOrder = 0;
					this.toolBondType = Molecule.BONDTYPE_NORMAL;
				}
			}

			if (this.opBond == 0) this.dragGuides = this.determineDragGuide(this.toolBondOrder);
		}
		else if (tool.startsWith(ToolBankItem.ElementPfx))
		{
			this.dragType = DraggingTool.Atom;
			this.toolAtomSymbol = tool.substring(ToolBankItem.ElementPfx.length);
			this.dragGuides = this.determineDragGuide(1);
		}
	}

	// the mouse/touch was moved to a new position, respond accordingly
	protected interactDrag(x:number, y:number)
	{
		// once the mouse has moved more than a few pixels, it fips into "drag mode" rather than "click mode"
		if (!this.opBudged)
		{
			let dx = x - this.clickX, dy = y - this.clickY;
			if (dx * dx + dy * dy > 2 * 2) this.opBudged = true;
		}

		// switch lasso mode on if it becomes an open drag
		if (this.dragType == DraggingTool.Press && this.opAtom == 0 && this.opBond == 0 && this.opBudged)
		{
			this.dragType = DraggingTool.Lasso;
			this.lassoX = [x];
			this.lassoY = [y];
			this.lassoMask = [];
		}

		// update the various dragging-already tools
		if (this.dragType == DraggingTool.Lasso || this.dragType == DraggingTool.Erasor)
		{
			this.updateLasso(x, y);
		}
		else if (this.dragType == DraggingTool.Pan)
		{
			let dx = x - this.mouseX, dy = y - this.mouseY;

			if (dx != 0 || dy != 0)
			{
				this.offsetX += dx;
				this.offsetY += dy;
				this.layout.offsetEverything(dx, dy);
				this.metavec.transformPrimitives(dx, dy, 1, 1);

				if (this.currentPerm >= 0 && this.templatePerms != null)
				{
					let perm = this.templatePerms[this.currentPerm];
					//perm.layout.offsetEverything(dx, dy);
					perm.metavec.transformPrimitives(dx, dy, 1, 1);
				}

				this.delayedRedraw();
			}

			this.mouseX = x;
			this.mouseY = y;
		}
		else if (this.dragType == DraggingTool.Zoom)
		{
			let dy = y - this.mouseY;

			if (dy != 0)
			{
				dy = Math.min(50, Math.max(-50, dy));
				let newScale = this.pointScale * (1 - dy * 0.01);
				newScale = Math.min(10, Math.max(0.1, newScale));
				let newOX = this.clickX - (newScale / this.pointScale) * (this.clickX - this.offsetX);
				let newOY = this.clickY - (newScale / this.pointScale) * (this.clickY - this.offsetY);

				this.pointScale = newScale;
				this.offsetX = newOX;
				this.offsetY = newOY;

				this.delayedRedraw();
			}

			this.mouseX = x;
			this.mouseY = y;
		}
		else if (this.dragType == DraggingTool.Rotate ||
				this.dragType == DraggingTool.Move ||
				this.dragType == DraggingTool.Atom ||
				this.dragType == DraggingTool.Bond ||
				this.dragType == DraggingTool.Ring)
		{
			this.mouseX = x;
			this.mouseY = y;
			this.delayedRedraw();
		}
	}

	// the mouse/touch interaction completed, respond accordingly
	private interactEnd(x:number, y:number):void
	{
		if (this.opBudged)
			this.interactEndDrag(x, y);
		else
			this.interactEndClick(x, y);

		this.dragType = DraggingTool.None;
		this.lassoX = null;
		this.lassoY = null;
		this.lassoMask = null;
		this.dragGuides = null;
		this.delayedRedraw();
	}
	private interactEndClick(x:number, y:number):void
	{
		let clickObj = this.pickObject(x, y);
		let clickAtom = clickObj > 0 ? clickObj : 0, clickBond = clickObj < 0 ? -clickObj : 0;

		if (this.dragType == DraggingTool.Press)
		{
			// special key modifiers for the arrow tool:
			//		CTRL: open context menu [see mouseDown]
			//		SHIFT: toggle selection of object
			//		ALT: enter pan-mode [see mouseDown]
			//		ALT+CTRL: enter zoom mode [see mouseDown]

			if (!this.opShift && !this.opCtrl && !this.opAlt)
			{
				if (clickAtom == 0 && clickBond == 0)
				{
					if (Vec.anyTrue(this.selectedMask)) this.selectedMask = null;
					else if (this.currentAtom > 0) this.currentAtom = 0;
					else if (this.currentBond > 0) this.currentBond = 0;
				}
				else if (clickAtom != this.currentAtom || clickBond != this.currentBond)
				{
					this.currentAtom = clickAtom;
					this.currentBond = clickBond;
				}
				else if (clickAtom == 0 && clickBond == 0 && this.anySelected())
				{
					this.selectedMask = null;
				}
			}
			else if (this.opShift && !this.opCtrl && !this.opAlt)
			{
				if (clickAtom > 0) this.setSelected(clickAtom, !this.getSelected(clickAtom));
			}
		}
		else if (this.dragType == DraggingTool.Move)
		{
			if (clickObj == 0)
			{
				if (Vec.anyTrue(this.selectedMask)) this.selectedMask = null;
				else if (this.currentAtom > 0) this.currentAtom = 0;
				else if (this.currentBond > 0) this.currentBond = 0;
			}
		}
		else if (this.dragType == DraggingTool.Erasor)
		{
			if (this.opAtom > 0 || this.opBond > 0)
			{
				let state =
				{
					...this.getState(),
					'currentAtom': this.opAtom,
					'currentBond': this.opBond,
					'selectedMask': [] as boolean[]
				};
				let molact = new MoleculeActivity(state, ActivityType.Delete, {}, this);
				molact.execute();
			}
		}
		else if (this.dragType == DraggingTool.Atom)
		{
			let element = this.toolAtomSymbol;
			if (element == 'A')
			{
				let dlg = new EditAtom(this.mol, this.opAtom, this.proxyClip, () =>
				{
					let autoscale = this.mol.numAtoms == 0;
					if (this.mol.compareTo(dlg.mol) != 0) this.defineMolecule(dlg.mol, autoscale, true);
					dlg.close();
				});
				if (this.opAtom == 0)
				{
					dlg.newX = this.xToAng(this.clickX);
					dlg.newY = this.yToAng(this.clickY);
				}
				dlg.callbackClose = () =>
				{
					this.inDialog = false;
					this.grabFocus();
				};
				this.inDialog = true;
				dlg.open();
			}
			else if (element)
			{
				let param:any = {'element': element, 'keepAbbrev': true};
				if (this.opAtom == 0)
				{
					let x = this.xToAng(this.clickX), y = this.yToAng(this.clickY);
					if (this.mol.numAtoms == 0)
					{
						this.offsetX = this.clickX;
						this.offsetY = this.clickY;
						x = 0;
						y = 0;
					}
					param.positionX = x;
					param.positionY = y;
				}
				let state =
				{
					...this.getState(),
					'currentAtom': this.opAtom,
					'currentBond': 0,
					'selectedMask': null as boolean[]
				};
				let molact = new MoleculeActivity(state, ActivityType.Element, param, this);
				molact.execute();
			}
		}
		else if (this.dragType == DraggingTool.Charge)
		{
			if (this.opAtom > 0 || this.opBond > 0)
			{
				let state =
				{
					...this.getState(),
					'currentAtom': this.opAtom,
					'currentBond': this.opBond,
					'selectedMask': null as boolean[]
				};
				let molact = new MoleculeActivity(state, ActivityType.Charge, {'delta': this.toolChargeDelta}, this);
				molact.execute();
			}
		}
		else if (this.dragType == DraggingTool.Bond)
		{
			let state =
			{
				...this.getState(),
				'currentAtom': this.opAtom,
				'currentBond': this.opBond,
				'selectedMask': null as boolean[]
			};
			let molact:MoleculeActivity;
			if (this.toolBondType == Molecule.BONDTYPE_NORMAL)
				molact = new MoleculeActivity(state, ActivityType.BondOrder, {'order': this.toolBondOrder}, this);
			else
				molact = new MoleculeActivity(state, ActivityType.BondType, {'type': this.toolBondType}, this);
			molact.execute();
		}
	}
	private interactEndDrag(x:number, y:number):void
	{
		if (this.dragType == DraggingTool.Lasso)
		{
			if (this.lassoX.length >= 2)
			{
				this.calculateLassoMask();
				for (let n = 1; n <= this.mol.numAtoms; n++) if (this.getLassoed(n) && !this.getSelected(n)) this.setSelected(n, true);
			}

			this.lassoX = null;
			this.lassoY = null;
			this.lassoMask = null;
			this.delayedRedraw();
		}
		else if (this.dragType == DraggingTool.Erasor)
		{
			let any = false;
			for (let n = 0; n < this.lassoMask.length; n++) if (this.lassoMask[n]) {any = true; break;}
			if (any)
			{
				let state =
				{
					...this.getState(),
					'currentAtom': 0,
					'currentBond': 0,
					'selectedMask': this.lassoMask
				};
				let molact = new MoleculeActivity(state, ActivityType.Delete, {}, this);
				molact.execute();
			}
		}
		else if (this.dragType == DraggingTool.Rotate)
		{
			let [x0, y0, theta, magnitude] = this.determineDragTheta();
			let degrees = -theta * RADDEG;
			let mx = this.xToAng(x0), my = this.yToAng(y0);
			let molact = new MoleculeActivity(this.getState(), ActivityType.Rotate, {'theta': degrees, 'centreX': mx, 'centreY': my}, this);
			molact.execute();
		}
		else if (this.dragType == DraggingTool.Move)
		{
			let [dx, dy] = this.determineMoveDelta();
			let scale = this.pointScale;
			// note: in a future iteration, make the 'Move' action do rotate-snap-rebond, and call it during the mousemove, to give dynamic feedback
			let molact = new MoleculeActivity(this.getState(), ActivityType.Move, {'refAtom': this.opAtom, 'deltaX': dx / scale, 'deltaY': -dy / scale}, this);
			molact.execute();
		}
		else if (this.dragType == DraggingTool.Ring)
		{
			let [ringX, ringY] = this.determineFauxRing();
			if (ringX != null)
			{
				let param:any =
				{
					'ringX': ringX,
					'ringY': ringY,
					'aromatic': this.toolRingArom
				};
				let molact = new MoleculeActivity(this.getState(), ActivityType.Ring, param, this);
				molact.execute();
			}
		}
		else if (this.dragType == DraggingTool.Atom && this.opAtom > 0)
		{
			let x2 = this.mouseX, y2 = this.mouseY;
			let snapTo = this.snapToGuide(x2, y2);
			if (snapTo != null) [x2, y2] = snapTo;

			let param:any =
			{
				'order': 1,
				'type': Molecule.BONDTYPE_NORMAL,
				'element': this.toolAtomSymbol,
				'x1': this.mol.atomX(this.opAtom),
				'y1': this.mol.atomY(this.opAtom),
				'x2': this.xToAng(x2),
				'y2': this.yToAng(y2)
			};

			if (this.toolAtomSymbol == 'A') param.element = window.prompt('Enter element symbol:', '');
			if (param.element != '')
			{
				let molact = new MoleculeActivity(this.getState(), ActivityType.BondAtom, param, this);
				molact.execute();
			}
		}
		else if (this.dragType == DraggingTool.Bond)
		{
			let x2 = this.mouseX, y2 = this.mouseY;
			let snapTo = this.snapToGuide(x2, y2);
			if (snapTo != null)
			{
				[x2, y2] = snapTo;
				if (this.opBond > 0)
				{
					let toObj = this.pickObject(x2, y2, {'noAtoms': true});
					if (toObj < 0)
					{
						this.connectPolymerBlock(this.opBond, -toObj);
						return;
					}
				}
			}

			let param:any =
			{
				'order': this.toolBondOrder,
				'type': this.toolBondType,
				'element': 'C',
				'x1': this.opAtom == 0 ? this.xToAng(this.clickX) : this.mol.atomX(this.opAtom),
				'y1': this.opAtom == 0 ? this.yToAng(this.clickY) : this.mol.atomY(this.opAtom),
				'x2': this.xToAng(x2),
				'y2': this.yToAng(y2)
			};
			let molact = new MoleculeActivity(this.getState(), ActivityType.BondAtom, param, this);
			molact.execute();
		}
	}

	// something was dragged into the sketcher area
	private dropInto(transfer:DataTransfer):void
	{
		let items = transfer.items, files = transfer.files;

		const SUFFIXES = ['.el', '.mol'];
		const MIMES = ['text/plain', 'chemical/x-sketchel', 'x-mdl-molfile'];

		//console.log('DROP-INTO: items=' +  items.length + ', files=' + files.length);

		for (let n = 0; n < items.length; n++)
		{
			if (items[n].kind == 'string' && MIMES.indexOf(items[n].type) >= 0)
			{
				items[n].getAsString((str:string) =>
				{
					let mol = Molecule.fromString(str);
					if (mol != null)
					{
						// (maybe do an intelligent append/paste, using the coordinates, rather than blowing it away?)
						this.defineMolecule(mol, true, true, true);
					}
					else console.log('Dragged data is not a SketchEl molecule: ' + str);
				});
				return;
			}

			//console.log('ITEMS['+n+']: ' + items[n].kind+',type='+items[n].type);
		}
		for (let n = 0; n < files.length; n++)
		{
			for (let sfx of SUFFIXES) if (files[n].name.endsWith(sfx))
			{
				let reader = new FileReader();
				reader.onload = (event) =>
				{
					let str = reader.result;
					let mol = MoleculeStream.readUnknown(str.toString());
					if (mol != null)
					{
						// (maybe do an intelligent append/paste, using the coordinates, rather than blowing it away?)
						this.defineMolecule(mol, true, true);
					}
					else console.log('Dragged file is not a recognised molecule: ' + str);
				};
				reader.readAsText(files[n]);
				return;
			}

			//console.log('DRAGFILE['+n+']: ' + files[n].name+',sz='+files[n].size+',type='+files[n].type);
		}
	}

	// special case when dragging a 0-order bond between two atoms in a polymer block: add to the opt-in naming list rather than making a bond
	private connectPolymerBlock(bond1:number, bond2:number):boolean
	{
		let [atomIn1, atomOut1] = this.mol.bondFromTo(bond1), [atomIn2, atomOut2] = this.mol.bondFromTo(bond2);

		let state = this.getState();
		let polymer = new PolymerBlock(state.mol);

		let poly1:PolymerBlockUnit = null, poly2:PolymerBlockUnit = null;
		let highName = 0;
		for (let poly of polymer.getUnits())
		{
			if (!poly1 || poly.atoms.length < poly1.atoms.length)
			{
				let ina = poly.atoms.includes(atomIn1), inb = poly.atoms.includes(atomOut1);
				if (ina && !inb) poly1 = poly;
				else if (inb && !ina) [poly1, atomIn1, atomOut1] = [poly, atomOut1, atomIn1];
			}
			if (!poly2 || poly.atoms.length < poly2.atoms.length)
			{
				let ina = poly.atoms.includes(atomIn2), inb = poly.atoms.includes(atomOut2);
				if (ina && !inb) poly2 = poly;
				else if (inb && !ina) [poly2, atomIn2, atomOut2] = [poly, atomOut2, atomIn2];
			}

			for (let nameList of poly.atomName.values()) highName = Math.max(highName, Vec.max(nameList));
		}
		if (!poly1 || !poly2) return false;

		//console.log('BONDS:'+[bond1,bond2]+' ATOMS:'+[atomIn1,atomOut1]+' '+[atomIn2,atomOut2]);

		let name1 = Vec.first(poly1.atomName.get(atomIn1));
		if (!name1)
		{
			name1 = ++highName;
			poly1.atomName.set(atomIn1, [name1]);
		}
		let name2 = Vec.first(poly2.atomName.get(atomIn2));
		if (!name2)
		{
			name2 = ++highName;
			poly2.atomName.set(atomIn2, [name2]);
		}

		poly1.bondIncl.set(bond1, Vec.append(poly1.bondIncl.get(bond1), name2));
		poly2.bondIncl.set(bond2, Vec.append(poly2.bondIncl.get(bond2), name1));

		polymer.rewriteMolecule();
		this.setState(state);
	}
}

/* EOF */ }