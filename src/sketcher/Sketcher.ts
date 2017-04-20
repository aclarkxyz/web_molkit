/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../decl/corrections.d.ts'/>
///<reference path='../util/util.ts'/>
///<reference path='../util/Cookies.ts'/>
///<reference path='../util/Geom.ts'/>
///<reference path='../dialog/PickRecent.ts'/>
///<reference path='../data/Molecule.ts'/>
///<reference path='../data/MolUtil.ts'/>
///<reference path='../data/SketchUtil.ts'/>
///<reference path='../rpc/Func.ts'/>
///<reference path='../gfx/Rendering.ts'/>
///<reference path='../gfx/MetaVector.ts'/>
///<reference path='../gfx/ArrangeMolecule.ts'/>
///<reference path='../ui/ButtonView.ts'/>
///<reference path='MoleculeActivity.ts'/>
///<reference path='CommandBank.ts'/>
///<reference path='TemplateBank.ts'/>
///<reference path='ToolBank.ts'/>

/*
	Sketcher: a very heavyweight widget that provides 2D structure editing for a molecule.
*/

enum DraggingTool
{
	None = 0,
	Press,
	Lasso,
	Pan,
	Zoom,
	Rotate,
	Move,
	Erasor,
	Atom,
	Bond,
	Charge,
	Ring
}

// used as a transient backup in case of access to the clipboard being problematic
var globalMoleculeClipboard:Molecule = null;

class Sketcher extends Widget implements ArrangeMeasurement
{
	private mol:Molecule = null;
	private policy:RenderPolicy = null;
	private width = 0;
	private height = 0;
	private border = 0x808080;
	private background = 0xF8F8F8;
	private useToolBank = true;
	private useCommandBank = true;
	private useTemplateBank = true;
	private debugOutput:any = undefined;

	private beenSetup = false;
	private container:JQuery;
	private undoStack:SketchState[] = [];
	private redoStack:SketchState[] = [];
	private spanBackground:JQuery = null;
	private canvasUnder:HTMLCanvasElement = null;
	private canvasMolecule:HTMLCanvasElement = null;
	private canvasOver:HTMLCanvasElement = null;
	private divMessage:JQuery = null;
	private fadeWatermark = 0;
	private layout:ArrangeMolecule = null;
	private metavec:MetaVector = null; // instantiated version of above
	private guidelines:GuidelineSprout[] = null;
	private toolView:ButtonView = null;
	private commandView:ButtonView = null;
	private templateView:ButtonView = null;
	private offsetX = 0;
	private offsetY = 0;
	private pointScale = 1;
	private currentAtom = 0;
	private currentBond = 0;
	private hoverAtom = 0;
	private hoverBond = 0;
	private selectedMask:boolean[] = null;
	private filthy = false;
	private dragType = DraggingTool.None;
	private opAtom = 0;
	private opBond = 0;
	private opBudged = false; // flips to true when the user starts dragging
	private opShift = false;
	private opCtrl = false;
	private opAlt = false;
	private toolAtomSymbol = '';
	private toolBondOrder = 0;
	private toolBondType = 0;
	private toolChargeDelta = 0;
	private toolRingArom = false;
	private toolRingFreeform = false;
	private toolRotateIncr = 0;
	private lassoX:number[] = null;
	private lassoY:number[] = null;
	private lassoMask:boolean[] = null;
	private clickX = 0; // position of initial mouse click
	private clickY = 0;
	private mouseX = 0; // last known position of mouse
	private mouseY = 0;
	private dragGuides:GuidelineSprout[] = null; // guidelines pertinent to the current dragging operation
	private templatePerms:TemplatePermutation[] = null; // if fusing templates, these are the options in play
	private currentPerm = 0; // currently viewed permutation (if applicable)
	private fusionBank:FusionBank = null;
	
	private fakeTextArea:HTMLTextAreaElement = null; // for temporarily bogarting the clipboard

	private static UNDO_SIZE = 20;

	constructor(private tokenID:string)
	{
		super();
	}

	// --------------------------------------- public methods ---------------------------------------

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
	public defineMolecule(mol:Molecule, withAutoScale:boolean = true, withStashUndo:boolean = false):void
	{
		if (withStashUndo) this.stashUndo();
		this.stopTemplateFusion();

		this.mol = mol.clone();

		// note: inefficient; make it compute on demand
		this.guidelines = [];
		for (let n = 1; n <= this.mol.numAtoms; n++) 
		{
			for (let sprout of SketchUtil.guidelineSprouts(this.mol, n)) this.guidelines.push(sprout);
		}

		if (!this.beenSetup) return;
		
		this.layout = null;
		this.metavec = null;
		this.hoverAtom = 0;
		this.hoverBond = 0;

		if (!withAutoScale) 
		{
			let effects = this.sketchEffects();
			this.layout = new ArrangeMolecule(this.mol, this, this.policy, effects);
			this.layout.arrange();
			this.metavec = new MetaVector();
			new DrawMolecule(this.layout, this.metavec).draw();
			this.delayedRedraw();
		}
		else this.autoScale();
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
	
	// zappy zap
	public clearMolecule():void {this.defineMolecule(new Molecule(), true, true);}

	// retrieves a copy of the molecule
	public getMolecule():Molecule {return this.mol.clone();}
	
	// instantiates the widget: any of the immutable setup properties are now cast in stone
	public setup(callback:() => void, master:any):void
	{
		let fcnPrep = function()
		{
			this.beenSetup = true;
			if (this.mol == null) this.mol = new Molecule();
			if (this.policy == null) 
			{
				this.policy = RenderPolicy.defaultColourOnWhite();
				this.pointScale = this.policy.data.pointScale;
			}
		
			let effects = this.sketchEffects();
			this.layout = new ArrangeMolecule(this.mol, this, this.policy, effects);
			this.layout.arrange();

			this.centreAndShrink();

			this.metavec = new MetaVector();
			new DrawMolecule(this.layout, this.metavec).draw();

			if (callback) callback.call(master);
		}
		ButtonView.prepare(fcnPrep, this);
	}

	// create the objects necessary to render the widget; this function should be called after basic pre-initialisation settings, e.g.
	// specifying the starting molecule, initial size, etc.
	public render(parent:any):void
	{
		if (!this.width || !this.height) throw 'Sketcher.render called without width and height';

		super.render(parent);

		//let style = 'position: relative; width: ' + this.width + 'px; height: ' + this.height + 'px;';
		//this.container = newElement(this.getContentElement(), 'div', {'style': style});
		this.container = $('<div></div>').appendTo(this.content);
		this.container.attr('style', 'position: relative; width: ' + this.width + 'px; height: ' + this.height + 'px;'); 
		this.container.css('background-color', colourCanvas(this.background));
		this.container.css('border', '1px solid ' + colourCanvas(this.border));
		this.container.css('border-radius', '4px');
		this.container.css('outline', 'none');
		
		this.container.attr('tabindex', '0');
		this.container.focus();
		
		let canvasStyle = 'position: absolute; left: 0; top: 0;';
		canvasStyle += ' pointer-events: none;';

		//this.canvasBackground = <HTMLCanvasElement>newElement(this.container, 'canvas', {'width': this.width, 'height': this.height, 'style': canvasStyle});
		this.canvasUnder = <HTMLCanvasElement>newElement(this.container, 'canvas', {'width': this.width, 'height': this.height, 'style': canvasStyle});
		this.canvasMolecule = <HTMLCanvasElement>newElement(this.container, 'canvas', {'width': this.width, 'height': this.height, 'style': canvasStyle});
		this.canvasOver = <HTMLCanvasElement>newElement(this.container, 'canvas', {'width': this.width, 'height': this.height, 'style': canvasStyle});
		
		this.divMessage = $('<div></div>').appendTo(this.container);
		this.divMessage.attr('style', canvasStyle);
		this.divMessage.css('width', this.width + 'px');
		this.divMessage.css('height', this.height + 'px');
		this.divMessage.css('text-align', 'center');
		this.divMessage.css('vertical-align', 'middle');
		this.divMessage.css('font-weight', 'bold');
		this.divMessage.css('font-size', '120%');
		
		this.centreAndShrink();
		this.redraw();
		
		// create the buttonviews
		let reserveHeight = 0;
		if (this.useCommandBank)
		{
			this.commandView = new ButtonView('bottom', 0, 0, this.width, this.height);
			// (put this back) this.commandView.lowerBank();
			this.commandView.setHasBigButtons(false);
			this.commandView.pushBank(new CommandBank(this));
			this.commandView.render(this.container);
			reserveHeight = this.commandView.height;
		}
		if (this.useToolBank)
		{
			this.toolView = new ButtonView('left', 0, 0, this.width, this.height - reserveHeight);
			this.toolView.setHasBigButtons(false);
			this.toolView.pushBank(new ToolBank(this));
			this.toolView.render(this.container);
		}
		if (this.useTemplateBank)
		{
			this.templateView = new ButtonView('right', 0, 0, this.width, this.height - reserveHeight);
			// (put this back) this.templateView.lowerBank();
			this.templateView.setHasBigButtons(true); // big buttons for templates is a good thing
			this.templateView.pushBank(new TemplateBank(this, null));
			this.templateView.render(this.container);
		}

		const self = this;
		
		// setup all the interactive events
		this.container.click(function(event:JQueryEventObject) {self.mouseClick(event);});
		this.container.dblclick(function(event:JQueryEventObject) {self.mouseDoubleClick(event);});
		this.container.mousedown(function(event:JQueryEventObject) {event.preventDefault(); self.mouseDown(event);});
		this.container.mouseup(function(event:JQueryEventObject) {self.mouseUp(event);});
		this.container.mouseover(function(event:JQueryEventObject) {self.mouseOver(event);});
		this.container.mouseout(function(event:JQueryEventObject) {self.mouseOut(event);});
		this.container.mousemove(function(event:JQueryEventObject) {self.mouseMove(event);});
		this.container.keypress(function(event:JQueryEventObject) {self.keyPressed(event);});
		this.container.keydown(function(event:JQueryEventObject) {self.keyDown(event);});
		this.container.keyup(function(event:JQueryEventObject) {self.keyUp(event);});

		// setup the wheel handler
		/* ...
		let mwh = new goog.events.MouseWheelHandler(this.container);
		goog.events.listen(mwh, goog.events.MouseWheelHandler.EventType.MOUSEWHEEL, this.mouseWheel, false, this);
		*/

		// setup drop events
		this.container[0].addEventListener('dragover', function(event)
		{
			event.stopPropagation();
			event.preventDefault();
			event.dataTransfer.dropEffect = 'copy';
		});
		this.container[0].addEventListener('drop', function(event)
		{
			event.stopPropagation();
			event.preventDefault();
			self.dropInto(event.dataTransfer);
		});
		
		// pasting: captures the menu/hotkey form
		document.addEventListener('paste', function(e:any)
		{
			let wnd = <any>window;
			if (wnd.clipboardData && wnd.clipboardData.getData) self.pasteText(wnd.clipboardData.getData('Text'));
			else if (e.clipboardData && e.clipboardData.getData) self.pasteText(e.clipboardData.getData('text/plain')); 
			e.preventDefault();
			return false;
		});		
	}

	// change the size of the sketcher after instantiation
	public changeSize(width:number, height:number):void
	{
		if (width == this.width && height == this.height) return;
		this.width = width;
		this.height = height;

		for (let widget of [this.container, this.canvasUnder, this.canvasMolecule, this.canvasOver])
		{
			$(widget).css('width', width + 'px');
			$(widget).css('height', height + 'px');
		}

		for (let btnv of [this.commandView, this.toolView, this.templateView]) if (btnv)
		{
			btnv.setParentSize(width, height);
			btnv.refreshBank();
		}

		this.autoScale();
	}

	// displays a message, which may be an error or just something helpful
	public showMessage(msg:string, isError:boolean):void
	{
		let watermark = ++this.fadeWatermark;

		this.divMessage.css('color', isError ? '#FF0000' : '#008000');
		this.divMessage.text(msg);
		let szLeft = (this.toolView == null ? 0 : this.toolView.width) + 2;
		let szRight = (this.templateView == null ? 0 : this.templateView.width) + 2;
		let szBottom = (this.commandView == null ? 0 : this.commandView.height) + 2;
		this.divMessage.css('left', szLeft + 'px');
		this.divMessage.css('width', (this.width - szLeft - szRight) + 'px');
		this.divMessage.css('height', (this.height - szBottom) + 'px');
		
		const self = this;
		window.setTimeout(function()
		{
			if (watermark == self.fadeWatermark) self.divMessage.text(''); 
		}, 5000);
	}
	
	// boots the message immediately
	public clearMessage()
	{
		if (this.divMessage.text() == '') return;
		this.fadeWatermark++;
		this.divMessage.text('');
	}

	// rescales and aligns to the middle of the screen
	public autoScale()
	{
		// note: this is inefficient; can just scale the primitives...

		this.pointScale = this.policy.data.pointScale;

		let effects = this.sketchEffects();
		this.layout = new ArrangeMolecule(this.mol, this, this.policy, effects);
		this.layout.arrange();

		this.centreAndShrink();

		this.metavec = new MetaVector();
		new DrawMolecule(this.layout, this.metavec).draw();

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
	// returns true if atom N is selected (1-based)
	public getSelected(N:number):boolean
	{
		if (this.selectedMask == null || N > this.selectedMask.length) return false;
		return this.selectedMask[N - 1];
	}
	// changes selection state for atom N
	public setSelected(N:number, sel:boolean):void
	{
		if (this.selectedMask == null) 
		{
			this.selectedMask = new Array(this.mol.numAtoms);
			for (let n = this.selectedMask.length - 1; n >= 0; n--) this.selectedMask[n] = false;
		}
		while (this.selectedMask.length < this.mol.numAtoms) {this.selectedMask.push(false);}
		this.selectedMask[N - 1] = sel;
	}
	// returns true if atom N is grabbed by the lasso, if any (1-based)
	public getLassoed(N:number):boolean
	{
		if (this.lassoMask == null || N > this.lassoMask.length) return false;
		return this.lassoMask[N - 1];
	}

	// gets the current state, as an associative array
	public getState():SketchState
	{
		let state:SketchState =
		{
			'mol': this.mol.clone(),
			'currentAtom': this.currentAtom,
			'currentBond': this.currentBond,
			'selectedMask': this.selectedMask == null ? null : this.selectedMask.slice(0)
		}
		return state;
	}

	// sets the current state; see getState() function above for the format of the object; the 'withStashUndo' parameter is a
	// flag, which defaults to true: determines whether the current state will be pushed onto the undo-stack before making the
	// change
	public setState(state:SketchState, withStashUndo:boolean = true):void
	{
		if (withStashUndo) this.stashUndo();
		this.stopTemplateFusion();

		if (state.mol != null) this.defineMolecule(state.mol.clone(), false, withStashUndo);
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
		this.defineMolecule(mol, false, true);
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
	public performCopy(mol:Molecule):void
	{
		globalMoleculeClipboard = mol.clone();
		let cookies = new Cookies();
		if (cookies.numMolecules() > 0) cookies.stashMolecule(mol);

		// now place it on the actual system clipboard
		if (this.fakeTextArea == null)
		{
			this.fakeTextArea = document.createElement('textarea');
			this.fakeTextArea.style.fontSize = '12pt';
			this.fakeTextArea.style.border = '0';
			this.fakeTextArea.style.padding = '0';
			this.fakeTextArea.style.margin = '0';
			this.fakeTextArea.style.position = 'fixed';
			this.fakeTextArea.style['left'] = '-9999px';
			this.fakeTextArea.style.top = (window.pageYOffset || document.documentElement.scrollTop) + 'px';
			this.fakeTextArea.setAttribute('readonly', '');
			document.body.appendChild(this.fakeTextArea);
		}
		this.fakeTextArea.value = mol.toString();
		this.fakeTextArea.select();
		document.execCommand('copy'); 
	}

	// pasting from clipboard, initiated by the user via non-system commands: this can't just grab the system
	// clipboard, so have to get a bit more creative
	public performPaste():void
	{
		let cookies = new Cookies();
		if (cookies.numMolecules() == 0)
		{
			if (MolUtil.notBlank(globalMoleculeClipboard)) this.pasteMolecule(globalMoleculeClipboard);
			// (else complain?)
			return;
		}
		let dlg = new PickRecent(cookies, 1);
		dlg.onPick1(function(mol:Molecule) {this.pasteMolecule(mol);}, this);
		dlg.open();
	}

	// zooms in or out, depending on the magnifier; if 
	public zoom(mag:number)
	{
		let cx = 0.5 * this.width, cy = 0.5 * this.height;
		let newScale = Math.min(10 * this.policy.data.pointScale, Math.max(0.1 * this.policy.data.pointScale, this.pointScale * mag));
		if (newScale == this.pointScale) return;

		this.offsetX = cx - (newScale / this.pointScale) * (cx - this.offsetX);
		this.offsetY = cy - (newScale / this.pointScale) * (cy - this.offsetY);
		this.pointScale = newScale;
				
		// --- begin inefficient: rewrite this to just transform the constituents...
		let effects = this.sketchEffects();
		this.layout = new ArrangeMolecule(this.mol, this, this.policy, effects);
		this.layout.arrange();
		this.metavec = new MetaVector();
		new DrawMolecule(this.layout, this.metavec).draw();
		this.layoutTemplatePerm();		
		// --- end inefficient

		this.delayedRedraw();
	}

	// pasted text from clipboard (can be activated from outside the widget, so is public)
	public pasteText(str:string):void
	{
		let mol = Molecule.fromString(str);
		if (mol != null) this.pasteMolecule(mol);
		else alert('Text from clipboard is not a valid molecule.');
	}
	public pasteMolecule(mol:Molecule):void
	{
		if (this.mol.numAtoms == 0)
		{
			this.defineMolecule(mol, true, true);
			return;
		}
		
		let param = {'fragNative': mol.toString()};
		new MoleculeActivity(this, ActivityType.TemplateFusion, param).execute();
	}
	
	// changes the template permutation: if necessary requests the layout, and redraws the screen
	public pickTemplatePermutation(idx:number)
	{
		let perm = this.templatePerms[idx];
		this.currentPerm = idx;

		this.layoutTemplatePerm();
		this.delayedRedraw();
	}

   // functions for converting between coordinates within the widget (pixels) & molecular position (Angstroms)
	public scale() {return this.pointScale;}
    public angToX(ax:number):number 
	{
		//if (this.layout == null || this.layout.numPoints() == 0) return 0.5 * this.width + ax * this.pointScale;
		return ax * this.pointScale + this.offsetX;
	}
    public angToY(ay:number):number 
	{
		//if (this.layout == null || this.layout.numPoints() == 0) return 0.5 * this.height - ay * this.pointScale;
		return ay * -this.pointScale + this.offsetY;
	}
    public xToAng(px:number):number 
	{
		//if (this.layout == null || this.layout.numPoints() == 0) return (px - 0.5 * this.width) / this.pointScale;
		return (px - this.offsetX) / this.pointScale;
	}
    public yToAng(py:number):number 
	{
		//if (this.layout == null || this.layout.numPoints() == 0) return (0.5 * this.height - py) / this.pointScale;
		return (py - this.offsetY) / -this.pointScale;
	}
	public scaleToAng(scale:number):number {return scale / this.pointScale;}
	public angToScale(ang:number):number {return ang * this.pointScale;}
    public yIsUp():boolean {return false;}
	public measureText(str:string, fontSize:number):number[] {return FontData.main.measureText(str, fontSize);}

	// --------------------------------------- private methods ---------------------------------------

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
	

	// rebuilds the canvas content
	private redraw():void
	{
		this.filthy = false;
		//this.redrawBackground();
		this.redrawUnder();
		this.redrawMolecule();
		this.redrawOver();
	}

	private redrawUnder():void
	{
		let HOVER_COL = 0x80808080;
		let CURRENT_COL = 0x40FFC0, CURRENT_BORD = 0x00A43C;
		let SELECT_COL = 0x40C4A8;
		let LASSO_COL = 0xA0D4C8;

		let density = pixelDensity();
		this.canvasUnder.width = this.width * density;
		this.canvasUnder.height = this.height * density;
		this.canvasUnder.style.width = this.width + 'px';
		this.canvasUnder.style.height = this.height + 'px';

		let ctx = this.canvasUnder.getContext('2d');
		ctx.save();
		ctx.scale(density, density);
		ctx.clearRect(0, 0, this.width, this.height);

		// draw hover effects
		if (this.hoverAtom > 0)
		{
			let sz = 0;
			if (this.hoverAtom == this.currentAtom) sz += 0.1;
			if (this.getSelected(this.hoverAtom)) sz += 0.1;
			if (this.currentBond > 0 && (this.mol.bondFrom(this.currentBond) == this.hoverAtom || this.mol.bondTo(this.currentBond) == this.hoverAtom)) sz += 0.1;
			this.drawAtomShade(ctx, this.hoverAtom, HOVER_COL, -1, sz);
		}
		if (this.hoverBond > 0)
		{
			let sz = 0, bfr = this.mol.bondFrom(this.hoverBond), bto = this.mol.bondTo(this.hoverBond);
			if (this.hoverBond == this.currentBond) sz += 0.1;
			if (this.getSelected(bfr) && this.getSelected(bto)) sz += 0.1;
			this.drawBondShade(ctx, this.hoverBond, HOVER_COL, -1, sz);
		}

		// draw selection and lasso preselection
		for (let n = 1; n <= this.mol.numBonds; n++)
		{
			let sz = n == this.currentBond ? 0.1 : 0;
			let bfr = this.mol.bondFrom(n), bto = this.mol.bondTo(n);
			let sfr = this.getSelected(bfr), sto = this.getSelected(bto), lfr = this.getLassoed(bfr), lto = this.getLassoed(bto);
			if (sfr && sto) this.drawBondShade(ctx, n, SELECT_COL, -1, sz);
			else if ((sfr || lfr) && (sto || lto)) this.drawBondShade(ctx, n, LASSO_COL, -1, sz);
		}
		for (let n = 1; n <= this.mol.numAtoms; n++)
		{
			let sz = this.currentAtom == n ? 0.1 : 0;
			if (this.getSelected(n)) this.drawAtomShade(ctx, n, SELECT_COL, -1, sz);
			else if (this.getLassoed(n)) this.drawAtomShade(ctx, n, LASSO_COL, -1, sz);
		}

		// draw current atom/bond
		if (this.currentAtom > 0)
		{
			this.drawAtomShade(ctx, this.currentAtom, CURRENT_COL, CURRENT_BORD, 0);
		}
		if (this.currentBond > 0)
		{
			let bfr = this.mol.bondFrom(this.currentBond), bto = this.mol.bondTo(this.currentBond);
			this.drawBondShade(ctx, this.currentBond, CURRENT_COL, CURRENT_BORD, 0);
		}
		
		// if moving or dragging a new atom/bond, draw the guides
		if (this.dragType == DraggingTool.Move || (this.dragType == DraggingTool.Atom && this.opAtom > 0) || this.dragType == DraggingTool.Bond)
		{
			if (this.dragGuides != null && this.dragGuides.length > 0)
			{
				for (let g of this.dragGuides) for (let n = 0; n < g.x.length; n++)
				{
					let lw = this.policy.data.lineSize * this.pointScale;
					ctx.strokeStyle = '#C0C0C0';
					ctx.lineWidth = lw;
					drawLine(ctx, g.sourceX, g.sourceY, g.destX[n], g.destY[n]);
					ctx.beginPath();
					ctx.ellipse(g.destX[n], g.destY[n], 2 * lw, 2 * lw, 0, 0, TWOPI, false);
					ctx.fillStyle = '#C0C0C0';
					ctx.fill();
				}
			}
		}
		
		// if creating a new ring, draw it
		if (this.dragType == DraggingTool.Ring)
		{
			let [ringX, ringY] = this.determineFauxRing();
			let rsz = ringX == null ? 0 : ringX.length;
			if (rsz > 0)
			{
				let scale = this.pointScale;
				let lw = this.policy.data.lineSize * scale;
				ctx.strokeStyle = '#C0C0C0';
				ctx.lineWidth = lw;

				for (let n = 0; n < rsz; n++)
				{
					let nn = n < rsz - 1 ? n + 1 : 0;
					let x1 = this.angToX(ringX[n]), y1 = this.angToY(ringY[n]);
					let x2 = this.angToX(ringX[nn]), y2 = this.angToY(ringY[nn]);
					drawLine(ctx, x1, y1, x2, y2);					
				}
				
				if (this.toolRingArom)
				{
					let cx = 0, cy = 0;
					for (let n = 0; n < rsz; n++) {cx += ringX[n]; cy += ringY[n];}
					cx /= rsz; cy /= rsz;
					let rad = 0;
					for (let n = 0; n < rsz; n++) rad += norm_xy(ringX[n] - cx, ringY[n] - cy);
					rad = this.angToScale(rad * 0.5 / rsz);
					ctx.beginPath();
					ctx.ellipse(this.angToX(cx), this.angToY(cy), rad, rad, 0, 0, TWOPI, false);
					ctx.stroke();
				}
			}
		}
		
		ctx.restore();
	}
	private redrawMolecule():void
	{
		let density = pixelDensity();
		this.canvasMolecule.width = this.width * density;
		this.canvasMolecule.height = this.height * density;
		this.canvasMolecule.style.width = this.width + 'px';
		this.canvasMolecule.style.height = this.height + 'px';
		
		let ctx = this.canvasMolecule.getContext('2d');
		ctx.save();
		ctx.scale(density, density);
		ctx.clearRect(0, 0, this.width, this.height);
		
		if (this.metavec != null) this.metavec.renderContext(ctx);

		// debugging only
		/*for (let n = 1; n <= this.mol.numBonds; n++)
		{
			let bfr = this.mol.bondFrom(n), bto = this.mol.bondTo(n);
			let x1 = this.angToX(this.mol.atomX(bfr)), y1 = this.angToY(this.mol.atomY(bfr));
			let x2 = this.angToX(this.mol.atomX(bto)), y2 = this.angToY(this.mol.atomY(bto));
			ctx.strokeStyle = 'red';
			ctx.lineWidth = 1;
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();
		}*/
		
		if (this.templatePerms != null)
		{
			let perm = this.templatePerms[this.currentPerm];
			if (perm.metavec != null) perm.metavec.renderContext(ctx);
		}		
		
		ctx.restore();
	}
	private redrawOver():void
	{
		let density = pixelDensity();
		this.canvasOver.width = this.width * density;
		this.canvasOver.height = this.height * density;
		this.canvasOver.style.width = this.width + 'px';
		this.canvasOver.style.height = this.height + 'px';
		
		let ctx = this.canvasOver.getContext('2d');
		ctx.save();
		ctx.scale(density, density);
		ctx.clearRect(0, 0, this.width, this.height);
		
		// draw the lasso
		if ((this.dragType == DraggingTool.Lasso || this.dragType == DraggingTool.Erasor) && this.lassoX.length > 1)
		{
			let erasing = this.dragType == DraggingTool.Erasor;
			
			let path = new Path2D();
			path.moveTo(this.lassoX[0], this.lassoY[0]);
			for (let n = 1; n < this.lassoX.length; n++) path.lineTo(this.lassoX[n], this.lassoY[n]);
			path.closePath();
			
			ctx.fillStyle = colourCanvas(erasing ? 0xD0FF0000 : 0xD00000FF);
			ctx.fill(path);
			
			ctx.strokeStyle = erasing ? '#804040' : '#404080';
			ctx.lineWidth = 0.5;
			ctx.stroke(path);
		}
				
		// draw the rotation theta
		if (this.dragType == DraggingTool.Rotate)
		{
			let [x0, y0, theta, magnitude] = this.determineDragTheta();
			let scale = this.pointScale;
			let lw = this.policy.data.lineSize * scale;
			ctx.strokeStyle = '#E0E0E0';
			ctx.lineWidth = 0.5 * lw;
			drawLine(ctx, x0, y0, x0 + magnitude, y0);
			ctx.strokeStyle = '#808080';
			ctx.lineWidth = lw;
			drawLine(ctx, x0, y0, x0 + magnitude * Math.cos(theta), y0 + magnitude * Math.sin(theta));
			ctx.beginPath();
			ctx.ellipse(x0, y0, 2 * lw, 2 * lw, 0, 0, TWOPI, false);
			ctx.fillStyle = '#808080';
			ctx.fill();
			// !! draw 0 degrees and a nice arc...
			
			for (let atom of this.subjectAtoms(true, false))
			{
				let ax = this.angToX(this.mol.atomX(atom)), ay = this.angToY(this.mol.atomY(atom));
				//let ax = this.arrmol.points[atom - 1].cx, ay = this.arrmol.points[atom - 1].cy;
				let ang = Math.atan2(ay - y0, ax - x0), dist = norm_xy(ax - x0, ay - y0);
				let nx = x0 + dist * Math.cos(ang + theta), ny = y0 + dist * Math.sin(ang + theta); 
				ctx.beginPath();
				ctx.ellipse(nx, ny, 2 * lw, 2 * lw, 0, 0, TWOPI, false);
				ctx.strokeStyle = 'black';
				ctx.lineWidth = 0.5;
				ctx.stroke();
			}
		}

		// draw the displacement of subject atoms
		if (this.dragType == DraggingTool.Move)
		{
			let [dx, dy] = this.determineMoveDelta();
			let scale = this.pointScale;
			let lw = this.policy.data.lineSize * scale;
			for (let atom of this.subjectAtoms(false, true))
			{
				let ax = this.angToX(this.mol.atomX(atom)), ay = this.angToY(this.mol.atomY(atom));
				ctx.beginPath();
				ctx.ellipse(ax + dx, ay + dy, 2 * lw, 2 * lw, 0, 0, TWOPI, false);
				ctx.strokeStyle = 'black';
				ctx.lineWidth = 0.5;
				ctx.stroke();
			}
		}
		
		// draw the dragging of a bond-and-atom to a new position
		if ((this.dragType == DraggingTool.Atom && this.opAtom > 0) || this.dragType == DraggingTool.Bond)
		{
			let element = this.dragType == DraggingTool.Atom ? this.toolAtomSymbol : 'C';
			let order = this.dragType == DraggingTool.Bond ? this.toolBondOrder : 1;
			let type = this.dragType == DraggingTool.Bond ? this.toolBondType : Molecule.BONDTYPE_NORMAL;
			this.drawOriginatingBond(ctx, element, order, type);
		}
					
		ctx.restore();
	}

	// redraw the structure: this will update the main canvas, using the current metavector representation of the structure;
	// the need-to-redraw flag is set, which means that this can be called multiple times without forcing the underlying canvas
	// to be redrawn too many times
	private delayedRedraw():void
	{
		if (this.canvasMolecule == null) return;
		this.filthy = true;
		let self = this;
		let redrawAction = function() 
		{
			if (self.filthy) self.redraw();
		};
		window.setTimeout(redrawAction, 10);
	}

	// locates a molecular object at the given position: returns N for atom, -N for bond, or 0 for nothing
	private pickObject(x:number, y:number):number
	{
		if (this.layout == null) return 0;
		
		// if the position is over a buttonview, return zero (yes, this does happen)
		if (this.toolView != null) 
		{
			let pos1 = this.container.position(), pos2 = this.toolView.content.position();
			if (this.toolView.withinOutline(x + pos1.left - pos2.left, y + pos1.top - pos2.top)) return 0;
		}
		if (this.commandView != null) 
		{
			let pos1 = this.container.position(), pos2 = this.commandView.content.position();
			if (this.toolView.withinOutline(x + pos1.left - pos2.left, y + pos1.top - pos2.top)) return 0;
		}
		if (this.templateView != null) 
		{
			let pos1 = this.container.position(), pos2 = this.templateView.content.position();
			if (this.toolView.withinOutline(x + pos1.left - pos2.left, y + pos1.top - pos2.top)) return 0;
		}
		
		// proceed with atoms & bonds
		
		let limitDSQ = sqr(0.5 * this.pointScale);
		let bestItem = 0, bestDSQ:number;

		// look for close atoms
		for (let n = 0; n < this.layout.numPoints(); n++)
		{
			let p = this.layout.getPoint(n);
			if (p.anum == 0) continue;
			
			let dx = Math.abs(x - p.oval.cx), dy = Math.abs(y - p.oval.cy);
			let dsq = norm2_xy(dx, dy);
			if (dsq > limitDSQ) continue;
			if (bestItem == 0 || dsq < bestDSQ)
			{
				bestItem = p.anum;
				bestDSQ = dsq;
			}
		}
		//if (bestItem!=0) return bestItem; // give priority to atoms (!! but not for touch-style...)
		
		// look for close bonds
		for (let n = 0; n < this.layout.numLines(); n++)
		{
			let l = this.layout.getLine(n);
			if (l.bnum == 0) continue;
			
			let x1 = l.line.x1, y1 = l.line.y1;
			let x2 = l.line.x2, y2 = l.line.y2;
			let bondDSQ = norm2_xy(x2 - x1, y2 - y1) * 0.25;
			let dsq = norm2_xy(x - 0.5 * (x1 + x2), y - 0.5 * (y1 + y2));
			
			if (dsq > bondDSQ) continue;
			if (bestItem == 0 || dsq < bestDSQ) {bestItem = -l.bnum; bestDSQ = dsq;}
		}
		
		return bestItem;
	}

	// writes content to the log, if there is one
	private log(str:number, zap:boolean):void
	{
		if (this.debugOutput)
		{
			if (zap) this.debugOutput.value = '';
			this.debugOutput.value = this.debugOutput.value + '' + str + '\n';
		}
	}

	// draws an ellipse around an atom/bond, for highlighting purposes
	private drawAtomShade(ctx:CanvasRenderingContext2D, atom:number, fillCol:number, borderCol:number, anghalo:number):void
	{
		if (this.layout == null) return;
		
		let p:APoint = undefined;
		for (let n = 0; n < this.layout.numPoints(); n++) if (this.layout.getPoint(n).anum == atom)
		{
			p = this.layout.getPoint(n);
			break;
		}
		if (p == null) return;

		let minRad = 0.2 * this.pointScale, minRadSq = sqr(minRad);
		let cx = p.oval.cx, cy = p.oval.cy;
		let rad = Math.max(minRad, Math.max(p.oval.rw, p.oval.rh)) + (0.1 + anghalo) * this.pointScale;

		if (fillCol != -1)
		{
			ctx.beginPath();
			ctx.ellipse(cx, cy, rad, rad, 0, 0, TWOPI, true);
			ctx.fillStyle = colourCanvas(fillCol);
			ctx.fill();
		}
		if (borderCol != -1)
		{ 
			ctx.beginPath();
			ctx.ellipse(cx, cy, rad, rad, 0, 0, TWOPI, true);
			ctx.strokeStyle = colourCanvas(borderCol);
			ctx.lineWidth = 1;
			ctx.stroke();
		}
	}
	private drawBondShade(ctx:CanvasRenderingContext2D, bond:number, fillCol:number, borderCol:number, anghalo:number):void
	{
		if (this.layout == null) return;

		let x1 = 0, y1 = 0, x2 = 0, y2 = 0, nb = 0, sz = 0;
		for (let n = 0; n < this.layout.numLines(); n++) 
		{
			let l = this.layout.getLine(n);
			if (l.bnum != bond) continue;
			x1 += l.line.x1; y1 += l.line.y1; x2 += l.line.x2; y2 += l.line.y2;
			nb++;
			sz += l.size + (0.2 + anghalo) * this.pointScale;
		}
		if (nb == 0) return;
		
		let invNB = 1 / nb;
		sz *= invNB;
		x1 *= invNB;
		y1 *= invNB;
		x2 *= invNB;
		y2 *= invNB;

		let dx = x2 - x1, dy = y2 - y1, invDist = 1 / norm_xy(dx, dy);
		dx *= invDist; 
		dy *= invDist;
		let ox = dy, oy = -dx;
		
		let path = new Path2D(), mx:number, my:number, CIRC = 0.8;
		path.moveTo(x1 + ox * sz, y1 + oy * sz);
		
		mx = x1 + (ox * sz - dx * sz) * CIRC;
		my = y1 + (oy * sz - dy * sz) * CIRC;
		path.quadraticCurveTo(mx, my, x1 - dx * sz, y1 - dy * sz);
		
		mx = x1 + (-ox * sz - dx * sz) * CIRC;
		my = y1 + (-oy * sz - dy * sz) * CIRC;
		path.quadraticCurveTo(mx, my, x1 - ox * sz, y1 - oy * sz);
		path.lineTo(x2 - ox * sz, y2 - oy * sz);
		
		mx = x2 + (-ox * sz + dx * sz) * CIRC;
		my = y2 + (-oy * sz + dy * sz) * CIRC;
		path.quadraticCurveTo(mx, my, x2 + dx * sz, y2 + dy * sz);
		
		mx = x2 + (ox * sz + dx * sz) * CIRC;
		my = y2 + (oy * sz + dy * sz) * CIRC;
		path.quadraticCurveTo(mx, my, x2 + ox * sz, y2 + oy * sz);
		
		path.closePath();
		
		if (fillCol != -1)
		{
			ctx.beginPath();
			ctx.fillStyle = colourCanvas(fillCol);
			ctx.fill(path);
		}
		if (borderCol != -1)
		{
			ctx.beginPath();
			ctx.strokeStyle = colourCanvas(borderCol);
			ctx.lineWidth = 1;
			ctx.stroke(path);
		}
	}

	// draws an in-progress bond, originating either from the clicked-upon atom, or a point in space
	private drawOriginatingBond(ctx:CanvasRenderingContext2D, element:string, order:number, type:number)
	{
		let x1 = this.clickX, y1 = this.clickY;
		if (this.opAtom > 0)
		{
			x1 = this.angToX(this.mol.atomX(this.opAtom));
			y1 = this.angToY(this.mol.atomY(this.opAtom));
		}
		let x2 = this.mouseX, y2 = this.mouseY;
		
		let snapTo = this.snapToGuide(x2, y2);
		if (snapTo != null) {x2 = snapTo[0]; y2 = snapTo[1];}
		
		let scale = this.pointScale;
		
		ctx.strokeStyle = '#808080';
		ctx.lineWidth = this.policy.data.lineSize * scale;
		drawLine(ctx, x1, y1, x2, y2);
		
		// !! TODO: draw multiple bonds
		
		if (element != 'C')
		{
			let fh = this.policy.data.fontSize * scale;
			ctx.font = fontSansSerif(fh);
			let metrics = ctx.measureText(element);
			ctx.fillStyle = '#808080';
			ctx.fillText(element, x2 - 0.5 * metrics.width, y2 + 0.5 * fh);
		}
	}

	// response to some mouse event: hovering cursor restated
	private updateHoverCursor(event:JQueryEventObject):void
	{
		let tool = 'finger';
		if (this.toolView != null) tool = this.toolView.selectedButton;
		let toolApplies = tool != 'finger' && tool != 'pan' && tool != 'zoom' && tool != 'rotate';

		let mouseObj = 0;

		if (this.dragType == DraggingTool.None && toolApplies)
		{
			let xy = eventCoords(event, this.container);
			mouseObj = this.pickObject(xy[0], xy[1]);
		}
		let mouseAtom = mouseObj > 0 ? mouseObj : 0, mouseBond = mouseObj < 0 ? -mouseObj : 0;

		if (mouseAtom != this.hoverAtom || mouseBond != this.hoverBond)
		{
			this.hoverAtom = mouseAtom;
			this.hoverBond = mouseBond;
			this.delayedRedraw();
		}
	}

	// response to some mouse event: lasso may need to be extended, or cancelled
	private updateLasso(event:JQueryEventObject):void
	{
		if (this.dragType != DraggingTool.Lasso && this.dragType != DraggingTool.Erasor) return;

		let xy = eventCoords(event, this.container);
		if (xy[0] < 0 || xy[1] < 0 || xy[0] > this.width || xy[1] > this.height)
		{
			this.dragType = DraggingTool.None;
			this.lassoX = null;
			this.lassoY = null;
			this.lassoMask = null;
			this.delayedRedraw();
		}

		let len = this.lassoX.length;
		if (len > 0 && this.lassoX[len - 1] == xy[0] && this.lassoY[len - 1] == xy[1]) return; // identical

		this.lassoX.push(xy[0]);
		this.lassoY.push(xy[1]);
		this.calculateLassoMask();
		this.delayedRedraw();
	}

	// sets up the lasso mask to include any atom that is within the lasso polygon
	private calculateLassoMask():void
	{
		this.lassoMask = new Array(this.mol.numAtoms);
		for (let n = 0; n < this.mol.numAtoms; n++) this.lassoMask[n] = false;

		for (let n = 0; n < this.layout.numPoints(); n++)
		{
			let p = this.layout.getPoint(n);
			if (p.anum == 0) continue;
			this.lassoMask[p.anum - 1] = GeomUtil.pointInPolygon(p.oval.cx, p.oval.cy, this.lassoX, this.lassoY);
		}
	}

	// looks through the current list of available guidelines, and picks out the sprouting(s) that relate to the clicked atom, if any 
	private determineDragGuide(order:number):GuidelineSprout[]
	{
		// special deal: if no atom clicked, create a fake one with 30 degree angles from the click position
		if (this.opAtom == 0)
		{
			let g:GuidelineSprout =
			{
				'atom': 0,
				'orders': [order],
				'x': [],
				'y': [],
				'sourceX': this.clickX,
				'sourceY': this.clickY,
				'destX': [],
				'destY': []
			}
			
			let mx = this.xToAng(this.clickX), my = this.yToAng(this.clickY);
			for (let n = 0; n < 12; n++)
			{
				let theta = TWOPI * n / 12;
				let dx = Molecule.IDEALBOND * Math.cos(theta), dy = Molecule.IDEALBOND * Math.sin(theta); 
				g.x.push(mx + dx);
				g.y.push(my + dy);
				g.destX.push(this.clickX + dx * this.pointScale);
				g.destY.push(this.clickY - dy * this.pointScale);
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
		if (best == null) return;
		
		let g = <GuidelineSprout>clone(best);
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

			g = <GuidelineSprout>clone(g);
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

	// based on the mouse position, determine the implied rotation for the interactive operation
	private determineDragTheta():[number, number, number, number]
	{
		let x0 = this.clickX, y0 = this.clickY;
		let snap = this.snapToGuide(x0, y0);
		if (snap != null) {x0 = snap[0]; y0 = snap[1];}
		let theta = Math.atan2(this.mouseY - y0, this.mouseX - x0), magnitude = norm_xy(this.mouseX - x0, this.mouseY - y0);
		if (this.toolRotateIncr > 0) theta = Math.round(theta / this.toolRotateIncr) * this.toolRotateIncr;
		return [x0, y0, theta, magnitude];
	}

	// determine the delta, in pixels, for a drag-move operation: the source and destination may be snapped
	private determineMoveDelta():[number, number]
	{
		let x1 = this.clickX, y1 = this.clickY, x2 = this.mouseX, y2 = this.mouseY;
		if (this.opAtom > 0)
		{
			x1 = this.angToX(this.mol.atomX(this.opAtom));
			y1 = this.angToY(this.mol.atomY(this.opAtom));
			let snap = this.snapToGuide(x2, y2);
			if (snap != null) {x2 = snap[0]; y2 = snap[1];}
		}
		return [x2 - x1, y2 - y1];
	}

	// based on drag state, calculates a ring that's fused & locked to the origination
	private determineFauxRing():[number[], number[]]
	{
		let atom = this.opAtom, bond = this.opBond, mol = this.mol;
		let x1 = atom > 0 ? mol.atomX(atom) : bond > 0 ? 0.5 * (mol.atomX(mol.bondFrom(bond)) + mol.atomX(mol.bondTo(bond))) : this.xToAng(this.clickX);
		let y1 = atom > 0 ? mol.atomY(atom) : bond > 0 ? 0.5 * (mol.atomY(mol.bondFrom(bond)) + mol.atomY(mol.bondTo(bond))) : this.yToAng(this.clickY);
		let x2 = this.xToAng(this.mouseX), y2 = this.yToAng(this.mouseY), dx = x2 - x1, dy = y2 - y1;
		let rsz = Math.min(9, Math.round(norm_xy(dx, dy) * 2 / Molecule.IDEALBOND) + 2);

		if (rsz < 3) {}
		else if (bond > 0) {return SketchUtil.proposeBondRing(mol, rsz, bond, dx, dy)}
		else if (atom > 0 && mol.atomAdjCount(atom) > 0 && !this.toolRingFreeform) {return SketchUtil.proposeAtomRing(mol, rsz, atom, dx, dy)}
		else {return SketchUtil.proposeNewRing(mol, rsz, x1, y1, dx, dy, !this.toolRingFreeform)}
		
		return [null, null];
	}

	// if the mouse position is close to one of the snap-to points, or an existing atom, return that position
	private snapToGuide(x:number, y:number):number[]
	{
		//if (this.dragGuides == null) return null;
		
		let bestDSQ = Number.POSITIVE_INFINITY, bestX = 0, bestY = 0;
		const APPROACH = sqr(0.5 * this.pointScale);
		if (this.dragGuides != null) for (let i = 0; i < this.dragGuides.length; i++) for (let j = 0; j < this.dragGuides[i].x.length; j++)
		{
			let px = this.dragGuides[i].destX[j], py = this.dragGuides[i].destY[j];
			let dsq = norm2_xy(px - x, py - y);
			if (dsq < APPROACH && dsq < bestDSQ) {bestDSQ = dsq; bestX = px; bestY = py;}
		}
		for (let n = 1; n <= this.mol.numAtoms; n++)
		{
			let px = this.angToX(this.mol.atomX(n)), py = this.angToY(this.mol.atomY(n));
			let dsq = norm2_xy(px - x, py - y);
			if (dsq < APPROACH && dsq < bestDSQ) {bestDSQ = dsq; bestX = px; bestY = py;}
		}
		if (isFinite(bestDSQ)) return [bestX, bestY];
		
		return null;
	}

	// returns an array of atom indices that make up the selection/current, or empty if nothing; if the "allIfNone" flag
	// is set, all of the atoms will be returned if otherwise would have been none; if "useOpAtom" is true, an empty
	// selection will be beefed up by the current mouseunder atom
	private subjectAtoms(allIfNone = false, useOpAtom = false):number[]
	{
		let atoms:number[] = [];
		if (this.selectedMask != null)
		{
			for (let n = 0; n < this.selectedMask.length; n++) if (this.selectedMask[n]) atoms.push(n + 1);
			if (atoms.length > 0) return atoms;
		}
		if (this.currentAtom > 0) atoms.push(this.currentAtom);
		else if (this.currentBond > 0)
		{
			atoms.push(this.mol.bondFrom(this.currentBond));
			atoms.push(this.mol.bondTo(this.currentBond));
		}
		if (useOpAtom && atoms.length == 0 && this.opAtom > 0) atoms.push(this.opAtom);
		if (allIfNone && atoms.length == 0)
		{
			for (let n = 1; n <= this.mol.numAtoms; n++) atoms.push(n);
		}
		return atoms;
	}

	// --------------------------------------- toolkit events ---------------------------------------

	// event responses
	private mouseClick(event:JQueryEventObject):void
	{
		this.container.focus(); // just in case it wasn't already
	}
	private mouseDoubleClick(event:JQueryEventObject):void
	{
		// (do something...)
		event.stopImmediatePropagation();
	}
	private mouseDown(event:JQueryEventObject):void
	{
		this.clearMessage();

		this.dragType = DraggingTool.Press;
		this.opBudged = false;
		this.dragGuides = null;
		
		let xy = eventCoords(event, this.container);
		this.mouseX = xy[0];
		this.mouseY = xy[1];
		this.clickX = xy[0];
		this.clickY = xy[1];
		
		let clickObj = this.pickObject(xy[0], xy[1]);
		this.opAtom = clickObj > 0 ? clickObj : 0;
		this.opBond = clickObj < 0 ? -clickObj : 0;
		this.opShift = event.shiftKey;
		this.opCtrl = event.ctrlKey;
		this.opAlt = event.altKey;

		let tool = 'finger';
		if (this.toolView != null) tool = this.toolView.selectedButton;
		
		if (tool == 'arrow')
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
			else if (!this.opShift && this.opCtrl && !this.opAlt)
			{
				// !! open context...
			}
			else if (!this.opShift && !this.opCtrl && this.opAlt)
			{
				this.dragType = DraggingTool.Pan;
			}
			else if (!this.opShift && this.opCtrl && this.opAlt)
			{
				this.dragType = DraggingTool.Zoom;
			}
		}
		else if (tool == 'rotate')
		{
			this.dragType = DraggingTool.Rotate;
			this.toolRotateIncr = this.opShift ? 0 : 15 * DEGRAD;
		}
		else if (tool == 'pan')
		{
			this.dragType = DraggingTool.Pan;
		}
		else if (tool == 'drag')
		{
			this.dragType = DraggingTool.Move;
			if (this.opAtom > 0) this.dragGuides = this.determineMoveGuide();
			this.delayedRedraw();
		}
		else if (tool == 'erasor')
		{
			this.dragType = DraggingTool.Erasor;
			this.lassoX = [xy[0]];
			this.lassoY = [xy[1]];
			this.lassoMask = [];
		}
		else if (tool == 'ringAliph')
		{
			this.dragType = DraggingTool.Ring;
			this.toolRingArom = false;
			this.toolRingFreeform = this.opShift;
		}
		else if (tool == 'ringArom')
		{
			this.dragType = DraggingTool.Ring;
			this.toolRingArom = true;
			this.toolRingFreeform = this.opShift;
		}
		else if (tool == 'atomPlus')
		{
			this.dragType = DraggingTool.Charge;
			this.toolChargeDelta = 1;
		}
		else if (tool == 'atomMinus')
		{
			this.dragType = DraggingTool.Charge;
			this.toolChargeDelta = -1;
		}
		else if (tool.startsWith('bond'))
		{
			this.dragType = DraggingTool.Bond;
			this.toolBondOrder = 1;
			this.toolBondType = Molecule.BONDTYPE_NORMAL;
			
			if (tool =='bondOrder0') this.toolBondOrder = 0;
			else if (tool =='bondOrder2') this.toolBondOrder = 2;
			else if (tool =='bondOrder3') this.toolBondOrder = 3;
			else if (tool =='bondUnknown') this.toolBondType = Molecule.BONDTYPE_UNKNOWN;
			else if (tool =='bondInclined') this.toolBondType = Molecule.BONDTYPE_INCLINED;
			else if (tool =='bondDeclined') this.toolBondType = Molecule.BONDTYPE_DECLINED;
			
			this.dragGuides = this.determineDragGuide(this.toolBondOrder);
		}
		else if (tool.startsWith('element'))
		{
			this.dragType = DraggingTool.Atom;
			this.toolAtomSymbol = tool.substring(7);
			this.dragGuides = this.determineDragGuide(1);
		}
	}
	private mouseUp(event:JQueryEventObject):void
	{
		// if the mouse hasn't moved, it's a click operation
		if (!this.opBudged)
		{
			let xy = eventCoords(event, this.container);

			let clickObj = this.pickObject(xy[0], xy[1]);
			let clickAtom = clickObj > 0 ? clickObj : 0, clickBond = clickObj < 0 ? -clickObj : 0;

			//let tool = 'finger';
			//if (this.toolView != null && this.toolView.selectedButton) tool = this.toolView.selectedButton;

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
						this.delayedRedraw();
					}
					else if (clickAtom == 0 && clickBond == 0 && this.anySelected())
					{
						this.selectedMask = null;
						this.delayedRedraw();
					}
				}
				else if (this.opShift && !this.opCtrl && !this.opAlt)
				{
					// !! toggle selected state of clickobj...
				}
			}
			else if (this.dragType == DraggingTool.Erasor)
			{
				if (this.opAtom > 0 || this.opBond > 0)
				{
					let override =
					{
						'currentAtom': this.opAtom,
						'currentBond': this.opBond,
						'selectedMask': <boolean[]>[]
					};
					let molact:MoleculeActivity = new MoleculeActivity(this, ActivityType.Delete, {}, override);
					molact.execute();
				}
			}
			else if (this.dragType == DraggingTool.Atom)
			{
				let element = this.toolAtomSymbol;
				if (element == 'A')
				{
					element = window.prompt('Enter element symbol:', this.opAtom == 0 ? '' : this.mol.atomElement(this.opAtom));
				}
				if (element)
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
					let override =
					{
						'currentAtom': this.opAtom,
						'currentBond': 0,
						'selectedMask': <boolean[]>null
					};
					let molact:MoleculeActivity = new MoleculeActivity(this, ActivityType.Element, param, override);
					molact.execute();
				}
			}
			else if (this.dragType == DraggingTool.Charge)
			{
				if (this.opAtom > 0 || this.opBond > 0)
				{
					let override =
					{
						'currentAtom': this.opAtom,
						'currentBond': this.opBond,
						'selectedMask': <boolean[]>null
					};
					let molact:MoleculeActivity = new MoleculeActivity(this, ActivityType.Charge, {'delta': this.toolChargeDelta}, override);
					molact.execute();
				}
			}
			else if (this.dragType == DraggingTool.Bond)
			{
				let override =
				{
					'currentAtom': this.opAtom,
					'currentBond': this.opBond,
					'selectedMask': <boolean[]>null
				};
				let molact:MoleculeActivity;
				if (this.toolBondType == Molecule.BONDTYPE_NORMAL) 
					molact = new MoleculeActivity(this, ActivityType.BondOrder, {'order': this.toolBondOrder}, override);
				else
					molact = new MoleculeActivity(this, ActivityType.BondType, {'type': this.toolBondType}, override);
				molact.execute();
			}
		}
		else // otherwise, it's the conclusion of a drag
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
					let override =
					{
						'currentAtom': 0,
						'currentBond': 0,
						'selectedMask': this.lassoMask
					};
					let molact:MoleculeActivity = new MoleculeActivity(this, ActivityType.Delete, {}, override);
					molact.execute();
				}
			}
			else if (this.dragType == DraggingTool.Rotate)
			{
				let [x0, y0, theta, magnitude] = this.determineDragTheta();
				let degrees = -theta * DEGRAD;
				let mx = this.xToAng(x0), my = this.yToAng(y0);
				let molact:MoleculeActivity = new MoleculeActivity(this, ActivityType.Rotate, {'theta': degrees, 'centreX': mx, 'centreY': my});
				molact.execute();
			}
			else if (this.dragType == DraggingTool.Move)
			{
				let [dx, dy] = this.determineMoveDelta();
				let scale = this.pointScale;
				// note: in a future iteration, make the 'Move' action do rotate-snap-rebond, and call it during the mousemove, to give dynamic feedback
				let molact:MoleculeActivity = new MoleculeActivity(this, ActivityType.Move, {'refAtom': this.opAtom, 'deltaX': dx / scale, 'deltaY': -dy / scale});
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
					let molact:MoleculeActivity = new MoleculeActivity(this, ActivityType.Ring, param);
					molact.execute();
				}
			}
			else if (this.dragType == DraggingTool.Atom && this.opAtom > 0)
			{
				let x2 = this.mouseX, y2 = this.mouseY;
				let snapTo = this.snapToGuide(x2, y2);
				if (snapTo != null) {x2 = snapTo[0]; y2 = snapTo[1];}
				
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
					let molact:MoleculeActivity = new MoleculeActivity(this, ActivityType.BondAtom, param);
					molact.execute();
				}
			}
			else if (this.dragType == DraggingTool.Bond)
			{
				let x2 = this.mouseX, y2 = this.mouseY;
				let snapTo = this.snapToGuide(x2, y2);
				if (snapTo != null) {x2 = snapTo[0]; y2 = snapTo[1];}

				let param:any =
				{
					'order': this.toolBondOrder,
					'type': this.toolBondType,
					'element': "C",
					'x1': this.opAtom == 0 ? this.xToAng(this.clickX) : this.mol.atomX(this.opAtom),
					'y1': this.opAtom == 0 ? this.yToAng(this.clickY) : this.mol.atomY(this.opAtom),
					'x2': this.xToAng(x2),
					'y2': this.yToAng(y2)
				};
				let molact:MoleculeActivity = new MoleculeActivity(this, ActivityType.BondAtom, param);
				molact.execute();
			}
		}
		
		this.dragType = DraggingTool.None;
		this.lassoX = null;
		this.lassoY = null;
		this.lassoMask = null;
		this.dragGuides = null;
		this.delayedRedraw();
	}
	private mouseOver(event:JQueryEventObject):void
	{
		this.updateHoverCursor(event);
		this.updateLasso(event);
	}
	private mouseOut(event:JQueryEventObject):void
	{
		this.updateHoverCursor(event);
		this.updateLasso(event);
	}
	private mouseMove(event:JQueryEventObject):void
	{
		this.updateHoverCursor(event);
		
		if (this.dragType == DraggingTool.None) return; // mouse button isn't pressed

		let xy = eventCoords(event, this.container);
		
		// once the mouse has moved more than a few pixels, it fips into "drag mode" rather than "click mode"
		if (!this.opBudged)
		{
			let dx = xy[0] - this.clickX, dy = xy[1] - this.clickY;
			if (dx * dx + dy * dy > 2 * 2) this.opBudged = true; 
		}

		// switch lasso mode on if it becomes an open drag
		if (this.dragType == DraggingTool.Press && this.opAtom == 0 && this.opBond == 0 && this.opBudged)
		{
			this.dragType = DraggingTool.Lasso;
			this.lassoX = [xy[0]];
			this.lassoY = [xy[1]];
			this.lassoMask = [];
		}

		// update the various dragging-already tools		
		if (this.dragType == DraggingTool.Lasso || this.dragType == DraggingTool.Erasor)
		{
			this.updateLasso(event);
		}
		else if (this.dragType == DraggingTool.Pan)
		{
			let xy = eventCoords(event, this.container);
			let dx = xy[0] - this.mouseX, dy = xy[1] - this.mouseY;
			
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

			this.mouseX = xy[0];
			this.mouseY = xy[1];
		}
		else if (this.dragType == DraggingTool.Zoom)
		{
			let xy = eventCoords(event, this.container);
			let dy = xy[1] - this.mouseY;
			
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
			
			this.mouseX = xy[0];
			this.mouseY = xy[1];
		}
		else if (this.dragType == DraggingTool.Rotate ||
				 this.dragType == DraggingTool.Move ||
				 this.dragType == DraggingTool.Atom ||
				 this.dragType == DraggingTool.Bond ||
				 this.dragType == DraggingTool.Ring)
		{
			this.mouseX = xy[0];
			this.mouseY = xy[1];
			this.delayedRedraw();
		}		
	}
	private keyPressed(event:JQueryEventObject):void
	{
		//let ch = String.fromCharCode(event.keyCode || event.charCode);
		//console.log('PRESSED['+ch+'] key='+event.keyCode+' chcode='+event.charCode);
		
		// !! TODO: special cases, like arrow keys/escape...

		if (this.toolView != null && this.toolView.topBank.claimKey(event)) {event.preventDefault(); return;}
		if (this.commandView != null && this.commandView.topBank.claimKey(event)) {event.preventDefault(); return;}
		if (this.templateView != null && this.templateView.topBank.claimKey(event)) {event.preventDefault(); return;}
	}
	private keyDown(event:JQueryEventObject):void
	{
		let key = event.keyCode;
		//console.log('DOWN: key='+key);

		// special deal for the escape key: if any bank needs to be popped, consume it 
		if (key == 27)
		{
			for (let view of [this.templateView, this.commandView, this.toolView]) if (view != null && view.stackSize > 1)
			{
				view.popBank(); 
				event.preventDefault(); 
				return;
			}
		}

		// non-modifier keys that don't generate a 'pressed' event		
		if (key == 37) {} // left
		else if (key == 39) {} // right
		else if (key == 38) {} // up
		else if (key == 40) {} // down
		else if ([27, 8, 46].indexOf(key) >= 0)
		{
			if (this.toolView != null && this.toolView.topBank.claimKey(event)) {event.preventDefault(); return;}
			if (this.commandView != null && this.commandView.topBank.claimKey(event)) {event.preventDefault(); return;}
			if (this.templateView != null && this.templateView.topBank.claimKey(event)) {event.preventDefault(); return;}
		} 
		
		// !! do something interesting when modifier keys are held down?
	}
	private keyUp(event:JQueryEventObject):void
	{
		// !!
	}
	private mouseWheel(event:JQueryEventObject):void
	{
		/* !! reinstate
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
	
	// something was dragged into the sketcher area
	private dropInto(transfer:DataTransfer):void
	{
		const self = this;
		
		let items = transfer.items, files = transfer.files;

		//console.log('DROP-INTO: items=' +  items.length + ', files=' + files.length);

		for (let n = 0; n < items.length; n++)
		{
			if (items[n].type.startsWith('text/plain'))
			{
				items[n].getAsString(function(str:string)
				{
					let mol = Molecule.fromString(str);
					if (mol != null) 
					{
						// (maybe do an intelligent append/paste, using the coordinates, rather than blowing it away?)
						self.defineMolecule(mol, true, true);
					}	
					else console.log('Dragged data is not a SketchEl molecule: ' + str);
				});
				return;
			}

			//console.log('ITEMS['+n+']: ' + items[n].kind+',type='+items[n].type);
		}
		for (let n = 0; n < files.length; n++)
		{
			if (files[n].name.endsWith('.el'))
			{
				let reader = new FileReader();
				reader.onload = function(event)
				{
					let str = reader.result;
					let mol = Molecule.fromString(str);
					if (mol != null) 
					{
						// (maybe do an intelligent append/paste, using the coordinates, rather than blowing it away?)
						self.defineMolecule(mol, true, true);
					}	
					else console.log('Dragged file is not a SketchEl molecule: ' + str);
				};
				reader.readAsText(files[n]);
				return;
			} 

			//console.log('DRAGFILE['+n+']: ' + files[n].name+',sz='+files[n].size+',type='+files[n].type);
		}
	}

	// puts together an effects parameter for the main sketch
	private sketchEffects():RenderEffects
	{
		let effects = new RenderEffects();
		for (let n = 1; n <= this.mol.numAtoms; n++) if (MolUtil.hasAbbrev(this.mol, n)) effects.dottedRectOutline[n] = 0x808080; 
		return effects;
	}
}

