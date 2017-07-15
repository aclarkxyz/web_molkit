/*
    WebMolKit

    (c) 2010-2017 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../dialog/EditCompound.ts'/>
///<reference path='../dialog/MapReaction.ts'/>
///<reference path='../rpc/Account.ts'/>
///<reference path='Widget.ts'/>

/*
	SearchPanel: a concise button-height search preparation area that can be used for molecules & reactions.
	
	For molecule searches, only mol1 is defined; for reactions, mol1 & mol2 & arrow are all in play.
*/

class SearchPanel extends Widget
{
	highlight = 0; // 0=nothing, 1=first molecule, 2=second molecule, 3=arrow
	pressed = 0; // as above
	mol1 = new Molecule();
	mol2 = new Molecule();

	normalMol1:HTMLCanvasElement;
	pressedMol1:HTMLCanvasElement;
	drawnMol1:HTMLCanvasElement;
	thinMol1:HTMLCanvasElement;
	thickMol1:HTMLCanvasElement;
	hoverArrow:HTMLCanvasElement;
	pressedArrow:HTMLCanvasElement;
	drawnArrow:HTMLCanvasElement;
	normalMol2:HTMLCanvasElement;	
	pressedMol2:HTMLCanvasElement;
	drawnMol2:HTMLCanvasElement;
	thinMol2:HTMLCanvasElement;
	thickMol2:HTMLCanvasElement;
	
	public static TYPE_MOLECULE = 'molecule';
	public static TYPE_REACTION = 'reaction';

	private isSketching = false;
	private height = 50;
	private molWidth = 80;
	private arrowWidth = 30;
	private HPADDING = 4;
	private VPADDING = 2;
	private COLCYCLE = ['#89A54E', '#71588F', '#4198AF', '#DB843D', '#93A9CF', '#D19392', '#4572A7', '#AA4643'];
	private emptyMsg1:string = null;
	private emptyMsg2:string = null;

	constructor(private type:string)
	{
		super();
	}

	// provide additional parameters about how to show the content
	public configureDisplay(molWidth:number, height:number, emptyMsg1?:string, emptyMsg2?:string):void
	{
		this.molWidth = molWidth;
		this.height = height;
		this.emptyMsg1 = emptyMsg1;
		this.emptyMsg2 = emptyMsg2;
	}

	// get/set molecule, with appropriate rendering updates
	public getMolecule1():Molecule {return this.mol1;}
	public getMolecule2():Molecule {return this.mol2;}
	public setMolecule1(mol:Molecule)
	{
		this.mol1 = mol;
		this.renderMolecule(1);
	}
	public setMolecule2(mol:Molecule)
	{
		this.mol2 = mol;
		this.renderMolecule(2);
	}

	// create the objects necessary to render the widget; this function should be called after basic pre-initialisation settings, e.g.
	// specifying the starting molecule, initial size, etc.
	public render(parent:any)
	{
		super.render(parent);
		
		this.content.addClass('no_selection');
		
		const height = this.height, molw = this.molWidth, arrow = this.arrowWidth;
		const density = pixelDensity();
		const hpad = this.HPADDING, vpad = this.VPADDING;
		
		let isRxn = this.type == SearchPanel.TYPE_REACTION, isMol = !isRxn
		
		let div = this.content;
		
		if (isMol)
			div.css('width', (molw + 2 * hpad) + 'px');
		else
			div.css('width', (2 * molw + arrow + 4 * hpad) + 'px');
		div.css('height', (height + 2 * vpad) + 'px');
		div.css('position', 'relative');
		
		function renderSolid(col1:string, col2:string, style:string):HTMLCanvasElement
		{
			let node = <HTMLCanvasElement>newElement(div, 'canvas', {'width': molw * density, 'height': height * density, 'style': style});
			node.style.width = molw + 'px';
			node.style.height = height + 'px';
			let ctx = node.getContext('2d');
			ctx.scale(density, density);
			
			let grad = ctx.createLinearGradient(0, 0, molw, height);
			grad.addColorStop(0, col1);
			grad.addColorStop(1, col2);
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, molw, height);
			
			return node;
		}
		function renderBorder(lw:number, style:string):HTMLCanvasElement
		{
			let node = <HTMLCanvasElement>newElement(div, 'canvas', {'width': molw * density, 'height': height * density, 'style': style});
			node.style.width = molw + 'px';
			node.style.height = height + 'px';
			let ctx = node.getContext('2d');
			ctx.scale(density, density);
			
			ctx.strokeStyle = 'black';
			ctx.lineWidth = lw;
			ctx.strokeRect(0.5 * lw, 0.5 * lw, molw - lw, height - lw);
			
			return node;
		}
		function renderArrow(style:string):HTMLCanvasElement
		{
			let node = <HTMLCanvasElement>newElement(div, 'canvas', {'width': arrow * density, 'height': height * density, 'style': style});
			node.style.width = arrow + 'px';
			node.style.height = height + 'px';
			let ctx = node.getContext('2d');
			ctx.scale(density, density);
			
			let midY = Math.round(0.5 * height);
			ctx.beginPath();
			ctx.moveTo(0, midY);
			ctx.lineTo(arrow - 2, midY);
			ctx.strokeStyle = 'black';
			ctx.lineWidth = 2;
			ctx.stroke();
			
			ctx.beginPath();
			ctx.moveTo(arrow, midY);
			ctx.lineTo(arrow - 8, midY - 5);
			ctx.lineTo(arrow - 8, midY + 5);
			ctx.fillStyle = 'black';
			ctx.fill();
			
			return node;
		}
		function renderOutlineArrow(style:string, col:string):HTMLCanvasElement
		{
			let node = <HTMLCanvasElement>newElement(div, 'canvas', {'width': arrow * density, 'height': height * density, 'style': style});
			node.style.width = arrow + 'px';
			node.style.height = height + 'px';
			let ctx = node.getContext('2d');
			ctx.scale(density, density);
			
			let midY = Math.round(0.5 * height);
			var path = pathRoundedRect(0, midY - 8, arrow, midY + 8, 4);
			ctx.fillStyle = col;
			ctx.fill(path); 
			
			return node;
		}
		
		// first molecule: always present
		let styleMol1Pos = 'position: absolute; left: ' + hpad + 'px; top: ' + vpad + 'px;';
		let styleMol1 = styleMol1Pos + 'pointer-events: none;';
		
		this.normalMol1 = renderSolid('#FFFFFF', '#D0D0D0', styleMol1);
		this.pressedMol1 = renderSolid('#00CA59', '#008650', styleMol1);
		this.drawnMol1 = <HTMLCanvasElement>newElement(div, 'canvas', {'width': molw * density, 'height': height * density, 'style': styleMol1Pos});
		this.drawnMol1.style.cursor = 'pointer';
		this.renderMolecule(1);
		this.thinMol1 = renderBorder(1, styleMol1);
		this.thickMol1 = renderBorder(2, styleMol1);
		
		if (isRxn)
		{
			let styleArrowPos = 'position: absolute; left: ' + (2 * hpad + molw) + 'px; top: ' + vpad + 'px;';
			let styleArrow = styleArrowPos + 'pointer-events: none;';
			
			this.hoverArrow = renderOutlineArrow(styleArrow, '#C0C0C0');
			this.pressedArrow = renderOutlineArrow(styleArrow, '#00CA59');
			this.drawnArrow = renderArrow(styleArrowPos);

			let styleMol2Pos = 'position: absolute; left: ' + (3 * hpad + molw + arrow) + 'px; top: ' + vpad + 'px;';
			let styleMol2 = styleMol2Pos + 'pointer-events: none;';
			
			this.normalMol2 = renderSolid('#FFFFFF', '#D0D0D0', styleMol2);
			this.pressedMol2 = renderSolid('#00CA59', '#008650', styleMol2);
			this.drawnMol2 = <HTMLCanvasElement>newElement(div, 'canvas', {'width': molw * density, 'height': height * density, 'style': styleMol2Pos});
			this.drawnMol2.style.cursor = 'pointer';
			this.renderMolecule(2);
			this.thinMol2 = renderBorder(1, styleMol2);
			this.thickMol2 = renderBorder(2, styleMol2);
		}

		this.updateLayers();
		
		$(this.drawnMol1).mouseenter(() => this.mouseEnter(1));
		$(this.drawnMol1).mouseleave(() => this.mouseLeave(1));
		$(this.drawnMol1).mousedown(() => this.mouseDown(1));
		$(this.drawnMol1).mouseup(() => this.mouseUp(1));
		$(this.drawnMol1).attr('ondragstart', () => false);
		$(this.drawnMol1).click(() => this.editMolecule(1));
		
		if (isRxn)
		{
			$(this.drawnArrow).mouseenter(() => this.mouseEnter(3));
			$(this.drawnArrow).mouseleave(() => this.mouseLeave(3));
			$(this.drawnArrow).mousedown(() => this.mouseDown(3));
			$(this.drawnArrow).mouseup(() => this.mouseUp(3));
			$(this.drawnArrow).attr('ondragstart', () => false);
			$(this.drawnArrow).click(() => this.editMapping());

			$(this.drawnMol2).mouseenter(() => this.mouseEnter(2));
			$(this.drawnMol2).mouseleave(() => this.mouseLeave(2));
			$(this.drawnMol2).mousedown(() => this.mouseDown(2));
			$(this.drawnMol2).mouseup(() => this.mouseUp(2));
			$(this.drawnMol2).attr('ondragstart', () => false);
			$(this.drawnMol2).click(() => this.editMolecule(2));
		}
		
		if (!isRxn)
		{
			addTooltip(this.drawnMol1, 'Edit the molecular structure.');
		}
		else
		{
			addTooltip(this.drawnMol1, 'Edit the reactant structures.');
			addTooltip(this.drawnMol2, 'Edit the product structures.');
			addTooltip(this.drawnArrow, 'Map the reactant and product atoms, for more precise searches.');
		}

		// capture paste (when not in sketchmode)
		document.addEventListener('paste', (e:any) =>
		{
			if (this.isSketching) return true;

			let wnd = <any>window, txt = '';
			if (wnd.clipboardData && wnd.clipboardData.getData) txt = wnd.clipboardData.getData('Text');
			else if (e.clipboardData && e.clipboardData.getData) txt = e.clipboardData.getData('text/plain'); 

			if (!txt) return true;
			let mol = MoleculeStream.readUnknown(txt);
			if (!mol) return true;

			let which = this.type == SearchPanel.TYPE_REACTION && !MolUtil.isBlank(this.mol1) && MolUtil.isBlank(this.mol2) ? 2 : 1;
			if (which == 1) this.setMolecule1(mol); else this.setMolecule2(mol);

			e.preventDefault();
			return false;
		});		
		
		// setup the drop targets
		this.drawnMol1.addEventListener('dragover', (event) =>
		{
			event.stopPropagation();
			event.preventDefault();
			event.dataTransfer.dropEffect = 'copy';
		});
		this.drawnMol1.addEventListener('drop', (event) =>
		{
			event.stopPropagation();
			event.preventDefault();
			this.dropInto(1, event.dataTransfer);
		});
		
		if (isRxn)
		{
			this.drawnMol2.addEventListener('dragover', (event) =>
			{
				event.stopPropagation();
				event.preventDefault();
				event.dataTransfer.dropEffect = 'copy';
			});
			this.drawnMol2.addEventListener('drop', (event) =>
			{
				event.stopPropagation();
				event.preventDefault();
				this.dropInto(2, event.dataTransfer);
			});
		}
	};

	// switches the layers on or off depending on the state
	private updateLayers()
	{
		setVisible(this.normalMol1, this.pressed != 1);
		setVisible(this.pressedMol1, this.pressed == 1);
		setVisible(this.thinMol1, this.highlight != 1);
		setVisible(this.thickMol1, this.highlight == 1);
		
		setVisible(this.hoverArrow, this.highlight == 3);
		setVisible(this.pressedArrow, this.pressed == 3);
		
		setVisible(this.normalMol2, this.pressed != 2);
		setVisible(this.pressedMol2, this.pressed == 2);
		setVisible(this.thinMol2, this.highlight != 2);
		setVisible(this.thickMol2, this.highlight == 2);
	}

	// fills in the appropriate molecule content
	private renderMolecule(which:number)
	{
		let mol = which == 1 ? this.mol1 : this.mol2, canvas = which == 1 ? this.drawnMol1 : this.drawnMol2;
		/*if (mol.numAtoms == 0)
		{
			canvas.width = canvas.width; // this is rubric for 'clear'
			return;
		}*/
		
		let withMapping = false;
		if (this.type == SearchPanel.TYPE_REACTION) for (let n = 1; n <= mol.numAtoms; n++) if (mol.atomMapNum(n) > 0) {withMapping = true; break;} 
		
		let width = this.molWidth, height = this.height;
		let density = pixelDensity();
		let ctx = canvas.getContext('2d');
		ctx.save();
		ctx.scale(density, density);
		ctx.clearRect(0, 0, width, height);
		canvas.style.width = width + 'px';
		canvas.style.height = height + 'px';

		if (mol.numAtoms > 0)
		{
			let policy = withMapping ? RenderPolicy.defaultBlackOnWhite() : RenderPolicy.defaultColourOnWhite();
			let measure = new OutlineMeasurement(0, 0, policy.data.pointScale);
			let layout = new ArrangeMolecule(mol, measure, policy, new RenderEffects());
			layout.arrange();
			let metavec = new MetaVector();
			new DrawMolecule(layout, metavec).draw();
			metavec.transformIntoBox(new Box(2, 2, width - 4, height - 4));
			metavec.renderContext(ctx);
		}
		else if ((which == 1 && this.emptyMsg1) || (which == 2 && this.emptyMsg2))
		{
			let lines = (which == 1 ? this.emptyMsg1 : this.emptyMsg2).split('\n');
			const fsz = 10, fh = fsz * ASCENT_FUDGE;
			ctx.font = fontSansSerif(fsz);
			ctx.fillStyle = 'black';
			let ty = 0.5 * (height - fh * (lines.length - 1));
			for (let txt of lines)
			{
				let metrics = ctx.measureText(txt);
				ctx.fillText(txt, 0.5 * (width - metrics.width), ty);
				ty += fh;
			}
		}

		ctx.restore();
	}

	// mouse events
	private mouseEnter(which:number)
	{
		if (this.highlight != which)
		{
			this.highlight = which;
			this.updateLayers();
		}
	}
	private mouseLeave(which:number)
	{
		if (this.highlight == which)
		{
			this.highlight = 0;
			this.pressed = 0;
			this.updateLayers();
		}
	}
	private mouseDown(which:number)
	{
		if (this.pressed != which)
		{
			this.pressed = which;
			this.updateLayers();
		}
	}
	private mouseUp(which:number)
	{
		if (this.pressed == which)
		{
			this.pressed = 0;
			this.updateLayers();
		}
	}
	private editMolecule(which:number)
	{
		let dlg = new EditCompound(which == 1 ? this.mol1 : this.mol2);
		this.isSketching = true;
		dlg.onSave(() => {if (which == 1) this.saveMolecule1(dlg); else this.saveMolecule2(dlg);});
		dlg.onClose(() => this.isSketching = false);
		dlg.open();
	}
	private editMapping()
	{
		if (this.mol1.numAtoms == 0 || this.mol2.numAtoms == 0)
		{
			alert('Draw structures on both sides of the arrow before mapping.');
			return;
		}
		let dlg = new MapReaction(this.mol1, this.mol2);
		dlg.callbackSave = (source?:MapReaction) => this.saveMapping(source);
		dlg.open();
	}
	
	private saveMolecule1(dlg:EditCompound):void
	{
		this.mol1 = dlg.getMolecule();
		dlg.close();
		this.renderMolecule(1);
		
		let cookies = new Cookies();
		if (cookies.numMolecules() > 0) cookies.stashMolecule(this.mol1);
	}
	private saveMolecule2(dlg:EditCompound):void
	{
		this.mol2 = dlg.getMolecule();
		dlg.close();
		this.renderMolecule(2);

		let cookies = new Cookies();
		if (cookies.numMolecules() > 0) cookies.stashMolecule(this.mol2);
	}
	private saveMapping(dlg:MapReaction):void
	{
		this.mol1 = dlg.getMolecule1();
		this.mol2 = dlg.getMolecule2();
		dlg.close();
		this.renderMolecule(1);
		this.renderMolecule(2);
	}
	
	private dropInto(which:number, transfer:DataTransfer):void
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
						if (which == 1) this.setMolecule1(mol); else this.setMolecule2(mol);
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
					let mol = MoleculeStream.readUnknown(str);
					if (mol != null) 
					{
						if (which == 1) this.setMolecule1(mol); else this.setMolecule2(mol);
					}	
					else console.log('Dragged file is not a recognised molecule: ' + str);
				};
				reader.readAsText(files[n]);
				return;
			} 

			//console.log('DRAGFILE['+n+']: ' + files[n].name+',sz='+files[n].size+',type='+files[n].type);
		}
	}
}