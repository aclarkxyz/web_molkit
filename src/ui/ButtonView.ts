/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	ButtonView: a container for a stack of ButtonBanks. The ButtonView handles all the display/user interaction parts
	of a button bank. A ButtonView should be owned by a container object that defines a region of space within which this
	object can position itself.
*/

export enum ButtonViewPosition
{
	Left,
	Right,
	Top,
	Bottom,
	Centre,
}

export interface ButtonViewDisplay
{
	id:string;
	x?:number;
	y?:number;
	width?:number;
	height?:number;
	helpSpan?:DOM;
	imgDOM?:DOM;
}

export class ButtonView extends Widget
{
	public idealSize = 50;
	public width = 0;
	public height = 0;
	public selectedButton:string = null;
	public highlightButton:string = null;
	public maxButtonColumns = 0; // optional
	public maxButtonRows = 0; // optional

	private border = 0x808080;
	private background = 0xFFFFFF;
	private buttonColNorm1 = 0x47D5D2;
	private buttonColNorm2 = 0x008FD1;
	private buttonColActv1 = 0x30FF69;
	private buttonColActv2 = 0x008650;
	private buttonColSel1 = 0xFFFFFF;
	private buttonColSel2 = 0xE0E0E0;

	private canvas:HTMLCanvasElement = null;
	private stack:ButtonBank[] = [];
	private display:ButtonViewDisplay[] = [];
	private hasBigButtons = true;
	private prefabImgSize = 44;
	private gripHeight = 30;
	private gripWidth = 50;
	private isRaised = true;
	private outPadding = 2;
	private inPadding = 2;
	private x = 0;
	private y = 0;

	// static cache: needs to be filled out just once; will contain the {icon:svg} pairs that can be used in the buttons
	//private static ACTION_ICONS:Record<string, string> = {};

	private isMacLike = false;

	constructor(private position:ButtonViewPosition, private parentX:number, private parentY:number, private parentWidth:number, private parentHeight:number)
	{
		super();

		// NOTE: this is going to be a problem soon, but there's no replacement
		this.isMacLike = !!navigator.platform.match(/(Mac|iPhone|iPod|iPad)/i);
	}

	// for future reference, parent boundary size is different
	public setParentSize(width:number, height:number):void
	{
		this.parentWidth = width;
		this.parentHeight = height;
	}

	// --------------------------------------- public methods ---------------------------------------

	// returns the current bank, or null if none
	public get topBank():ButtonBank
	{
		return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
	}

	// returns how many banks are piled up
	public get stackSize():number {return this.stack.length;}

	// create the canvas
	public render(parent:any):void
	{
		super.render(parent);

		this.contentDOM.css({'position': 'absolute', 'width': `${this.width}px`, 'height': `${this.height}px`});
		this.contentDOM.addClass('no_selection');

		this.layoutButtons();

		let canvasStyle = 'position: absolute; left: 0; top: 0;';
		canvasStyle += 'pointer-events: none;';
		this.canvas = newElement(this.contentDOM.el, 'canvas', {'width': this.width, 'height': this.height, 'style': canvasStyle}) as HTMLCanvasElement;
		this.canvas.style.width = this.width + 'px';
		this.canvas.style.height = this.height + 'px';

		this.applyOffset();
		this.redraw();

		this.contentDOM.onClick((event) => this.mouseClick(event));
		this.contentDOM.onDblClick((event) => this.mouseDoubleClick(event));
		this.contentDOM.onMouseDown((event) => {event.preventDefault(); this.mouseDown(event);});
		this.contentDOM.onMouseUp((event) => this.mouseUp(event));
		this.contentDOM.onMouseOver((event) => this.mouseOver(event));
		this.contentDOM.onMouseLeave((event) => this.mouseOut(event));
		this.contentDOM.onMouseMove((event) => this.mouseMove(event));
	}

	// adds a new molsync.ui.ButtonBank instance to the stack, making it the current one
	public pushBank(bank:ButtonBank):void
	{
		bank.buttonView = this;
		bank.isSubLevel = this.stack.length > 0;
		bank.init();
		this.stack.push(bank);

		if (this.canvas != null)
		{
			this.layoutButtons();
			this.replaceCanvas();
			this.applyOffset();
			this.redraw();
		}
	}

	// removes the top buttonbank from the stack
	public popBank():void
	{
		if (this.stack.length == 0) return;
		Vec.last(this.stack).bankClosed();
		this.stack.length--;

		if (this.canvas != null)
		{
			this.layoutButtons();
			this.replaceCanvas();
			this.applyOffset();
			this.redraw();
		}
	}

	// updates the current bank, given that the buttons have probably changed
	public refreshBank():void
	{
		if (this.canvas != null)
		{
			this.layoutButtons();
			this.replaceCanvas();
			this.applyOffset();
			this.redraw();
		}
	}

	// get/set the selected button index, by ID
	public getSelectedButton():string
	{
		return this.selectedButton;
	}
	public setSelectedButton(id:string):void
	{
		if (id != this.selectedButton)
		{
			this.selectedButton = id;
			this.redraw();
		}
	}

	// pick next/previous button
	public cycleSelected(dir:number):void
	{
		let sorted = this.display.filter((s) => s.id != '*');
		sorted.sort((d1, d2) => (d1.y * 10000 + d1.x) - (d2.y * 10000 + d2.x));

		let idx = 0, sz = sorted.length;
		for (let n = 0; n < sz; n++) if (sorted[n].id == this.selectedButton) {idx = n; break;}
		this.selectedButton = sorted[(idx + dir + sz) % sz].id;
		this.redraw();
	}

	// raises or lowers the buttonbank
	public raiseBank():void
	{
		if (this.isRaised) return;
		this.isRaised = true;
		if (this.contentDOM)
		{
			this.layoutButtons();
			this.replaceCanvas();
			this.applyOffset();
			this.redraw();
		}
	}
	public lowerBank():void
	{
		if (!this.isRaised) return;
		this.isRaised = false;
		if (this.contentDOM)
		{
			this.layoutButtons();
			this.replaceCanvas();
			this.applyOffset();
			this.redraw();
		}
	}

	// determines whether or not the "big buttons" are used; big buttons are typically better for mobile devices, which
	// tend to have high screen DPI, while on PC monitors they tend to look a bit goofy
	public getHasBigButtons():boolean
	{
		return this.hasBigButtons;
	}
	public setHasBigButtons(flag:boolean)
	{
		this.hasBigButtons = flag;
		this.prefabImgSize = flag ? 44 : 36;
		this.idealSize = flag ? 50 : 40;
	}

	// returns true if the coordinate is (more or less) within the button outline, which is necessary for propagating mouse events;
	// it's also sometimes handy for exterior code to check if the position is covered
	public withinOutline(x:number, y:number)
	{
		let w = this.width, h = this.height;
		if (x < 0 || x > w || y < 0 || y > h) return false;

		if (this.position == ButtonViewPosition.Centre || this.stack.length == 0) return true;
		if (this.position == ButtonViewPosition.Left)
		{
			let my = 0.5 * h - 1, gw = this.gripHeight, hg = 0.5 * this.gripWidth;
			return x < w - gw || (y > my - hg && y < my + hg);
		}
		else if (this.position == ButtonViewPosition.Right)
		{
			let my = 0.5 * h - 1, gw = this.gripHeight, hg = 0.5 * this.gripWidth;
			return x > gw || (y > my - hg && y < my + hg);
		}
		else if (this.position == ButtonViewPosition.Top)
		{
			let mx = 0.5 * w - 1, gh = this.gripHeight, hg = 0.5 * this.gripWidth;
			return y < h - gh || (x > mx - hg && x < mx + hg);
		}
		else if (this.position == ButtonViewPosition.Bottom)
		{
			let mx = 0.5 * w - 1, gh = this.gripHeight, hg = 0.5 * this.gripWidth;
			return y > gh || (x > mx - hg && x < mx + hg);
		}
		return true;
	}

	// returns the space taken up by the "grip"; this is the value of the "height", which will have been rotated for left/right banks
	public gripSize():number
	{
		return this.gripHeight;
	}

	// returns the minimum size (either width or height depending on orientation) given a particular number of buttons in the aligning direction, not
	// including grip widgets
	public sizeForButtons(nbtn:number):number
	{
		return this.idealSize * nbtn + this.inPadding * (nbtn - 1) + 2 * this.outPadding;
	}

	// --------------------------------------- private methods ---------------------------------------

	// figures out the size that this buttonview needs to be
	private layoutButtons():void
	{
		if (this.contentDOM == null) return; // too soon

		let outPadding = this.outPadding, inPadding = this.inPadding;

		// clean up previous buttons
		this.removeDisplayButtons();

		// special case: no content
		if (this.stack.length == 0)
		{
			this.width = 10;
			this.height = 10;
			if (this.position == ButtonViewPosition.Left || this.position == ButtonViewPosition.Right) this.height = this.parentHeight;
			else if (this.position == ButtonViewPosition.Top || this.position == ButtonViewPosition.Bottom) this.width = this.parentWidth;
			return;
		}

		// it not raised, it shall be small, and have only a grip
		if (!this.isRaised)
		{
			if (this.position == ButtonViewPosition.Left || this.position == ButtonViewPosition.Right)
			{
				this.width = this.gripHeight;
				this.height = this.gripWidth + 2 * outPadding;
			}
			else if (this.position == ButtonViewPosition.Top || this.position == ButtonViewPosition.Bottom)
			{
				this.width = this.gripWidth + 2 * outPadding;
				this.height = this.gripHeight;
			}
			this.addGripButton();
			return;
		}

		let bank = this.stack[this.stack.length - 1];
		bank.buttons = [];
		bank.update();

		// decide how much room the 'pop button' takes up
		let popWidth = 0, popHeight = 0;
		if (this.stack.length == 1) {}
		else if (this.position == ButtonViewPosition.Left || this.position == ButtonViewPosition.Right) popHeight = this.gripHeight + inPadding;
		else if (this.position == ButtonViewPosition.Top || this.position == ButtonViewPosition.Bottom) popWidth = this.gripHeight + inPadding;

		// burn through layout possibilities, and keep the best one
		let bestLayout:string[][] = null, bestScore:number = null;
		if (this.position == ButtonViewPosition.Left || this.position == ButtonViewPosition.Right)
		{
			let maxSlotHeight = Math.floor((this.parentHeight - 2 * outPadding - inPadding /*- popHeight*/) / (this.idealSize + inPadding));
			let minSlotHeight = Math.ceil(0.5 * maxSlotHeight);
			for (let i = maxSlotHeight; i >= minSlotHeight; i--)
			{
				let slotWidth = Math.ceil(bank.buttons.length / i);
				for (let j = slotWidth; j <= slotWidth + 1; j++)
				{
					let layout = this.layoutMaxHeight(bank, i, j);
					let score = this.scoreLayout(layout) + 1 * layout[0].length;
					if (bestLayout == null || score < bestScore)
					{
						bestLayout = layout;
						bestScore = score;
					}
				}
			}
		}
		else if (this.position == ButtonViewPosition.Top || this.position == ButtonViewPosition.Bottom)
		{
			let maxSlotWidth = Math.floor((this.parentWidth - 2 * outPadding - inPadding - popWidth) / (this.idealSize + inPadding));
			let minSlotWidth = Math.ceil(0.5 * maxSlotWidth);
			for (let n = maxSlotWidth; n >= minSlotWidth; n--)
			{
				let layout = this.layoutMaxWidth(bank, n);
				let score = this.scoreLayout(layout) + 1 * layout.length;
				if (bestLayout == null || score < bestScore)
				{
					bestLayout = layout;
					bestScore = score;
				}
			}
		}
		else
		{
			// !! implement "middle of window" type (?)
		}

		// determine total size, and position everything
		let ncols = bestLayout[0].length, nrows = bestLayout.length;
		this.width = 2 * outPadding + inPadding + (this.idealSize + inPadding) * ncols + popWidth;
		this.height = 2 * outPadding + inPadding + (this.idealSize + inPadding) * nrows + popHeight;

		if (this.position == ButtonViewPosition.Left || this.position == ButtonViewPosition.Right) this.width += this.gripHeight;
		else if (this.position == ButtonViewPosition.Top || this.position == ButtonViewPosition.Bottom) this.height += this.gripHeight;
		this.addGripButton();

		if (popWidth > 0 || popHeight > 0)
		{
			let d:ButtonViewDisplay =
			{
				'id': '!',
				'x': outPadding + inPadding,
				'y': outPadding + inPadding,
				'width': popWidth - inPadding,
				'height': popHeight - inPadding
			};
			if (this.position == ButtonViewPosition.Right) d.x += this.gripHeight;
			else if (this.position == ButtonViewPosition.Bottom) d.y += this.gripHeight;
			if (popWidth == 0) d.width = ncols * this.idealSize + inPadding * (ncols - 1);
			if (popHeight == 0) d.height = nrows * this.idealSize + inPadding * (nrows - 1);
			this.display.push(d);
		}

		// add in all the actual buttons
		for (let y = 0; y < nrows; y++) for (let x = 0; x < ncols; x++)
		{
			for (let n = 0; n < bank.buttons.length; n++) if (bestLayout[y][x] == bank.buttons[n].id)
			{
				let b = bank.buttons[n], d:ButtonViewDisplay = {'id': b.id};
				d.x = outPadding + inPadding + popWidth + (this.idealSize + inPadding) * x;
				d.y = outPadding + inPadding + popHeight + (this.idealSize + inPadding) * y;
				if (this.position == ButtonViewPosition.Right) d.x += this.gripHeight;
				else if (this.position == ButtonViewPosition.Bottom) d.y += this.gripHeight;
				d.width = this.idealSize;
				d.height = this.idealSize;
				this.display.push(d);
			}
		}
	}

	// if appropriate, adds a grip button, with a suitable position
	private addGripButton():void
	{
		if (this.position == ButtonViewPosition.Centre) return;

		let d:ButtonViewDisplay = {'id': '*'}, spc = 3;
		if (this.position == ButtonViewPosition.Left)
		{
			d.width = this.gripHeight - spc;
			d.height = this.gripWidth - 2 * spc;
			d.x = this.width - d.width - spc - 1;
			d.y = 0.5 * (this.height - d.height);
		}
		else if (this.position == ButtonViewPosition.Right)
		{
			d.width = this.gripHeight - spc;
			d.height = this.gripWidth - 2 * spc;
			d.x = spc + 1;
			d.y = 0.5 * (this.height - d.height);
		}
		else if (this.position == ButtonViewPosition.Top)
		{
			d.width = this.gripWidth - 2 * spc;
			d.height = this.gripHeight - spc;
			d.x = 0.5 * (this.width - d.width);
			d.y = this.height - d.height - spc - 1;
		}
		else if (this.position == ButtonViewPosition.Bottom)
		{
			d.width = this.gripWidth - 2 * spc;
			d.height = this.gripHeight - spc;
			d.x = 0.5 * (this.width - d.width);
			d.y = spc + 1;
		}
		this.display.push(d);
	}

	// recreates the canvas, on account of it having a different size; note the "setSize" method is marked to-be-done in the closures
	// library, so this may not always be necessary
	private replaceCanvas():void
	{
		this.contentDOM.empty();

		for (let n = 0; n < this.display.length; n++)
		{
			this.display[n].imgDOM = null;
			this.display[n].helpSpan = null;
		}

		let canvasStyle = 'position: absolute; left: 0; top: 0;';
		canvasStyle += 'pointer-events: none;';
		this.canvas = newElement(this.contentDOM.el, 'canvas', {'width': this.width, 'height': this.height, 'style': canvasStyle}) as HTMLCanvasElement;
	}

	// removes all the display buttons, making sure to delete the HTML objects as necessary
	private removeDisplayButtons():void
	{
		this.contentDOM.empty();
		this.display = [];
	}

	// positions the canvas within its parent
	private applyOffset():void
	{
		let x:number, y:number;
		if (this.position == ButtonViewPosition.Left)
		{
			x = 0;
			y = 0.5 * (this.parentHeight - this.height);
		}
		else if (this.position == ButtonViewPosition.Right)
		{
			x = this.parentWidth - this.width;
			y = 0.5 * (this.parentHeight - this.height);
		}
		else if (this.position == ButtonViewPosition.Top)
		{
			x = 0.5 * (this.parentWidth - this.width);
			y = 0;
		}
		else if (this.position == ButtonViewPosition.Bottom)
		{
			x = 0.5 * (this.parentWidth - this.width);
			y = this.parentHeight - this.height;
		}
		else // == 'centre'
		{
			x = 0.5 * (this.parentWidth - this.width);
			y = 0.5 * (this.parentHeight - this.height);
		}

		this.x = this.parentX + x;
		this.y = this.parentY + y;

		this.contentDOM.css({'position': 'absolute'});
		setBoundaryPixels(this.contentDOM, this.x, this.y, this.width, this.height);
	}

	// redraws the buttons, in response to some kind of state change
	private redraw():void
	{
		if (!this.contentDOM || !this.canvas) return;

		// background

		let density = pixelDensity();
		this.canvas.width = this.width * density;
		this.canvas.height = this.height * density;
		this.canvas.style.width = this.width + 'px';
		this.canvas.style.height = this.height + 'px';

		let ctx = this.canvas.getContext('2d');
		ctx.save();
		ctx.scale(density, density);
		ctx.clearRect(0, 0, this.width, this.height);

		let path = this.traceOutline();
		ctx.fillStyle = colourCanvas(this.background);
		ctx.fill(path);
		ctx.strokeStyle = colourCanvas(this.border);
		ctx.lineWidth = 1;
		ctx.stroke(path);

		let bank = this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;

		this.contentDOM.css({'width': this.width + 'px', 'height': this.height + 'px'});

		// button outlines
		for (let n = 0; n < this.display.length; n++)
		{
			const d = this.display[n], b = this.buttonFromID(d.id);

			let col1:number, col2:number;
			if (this.highlightButton != null && d.id == this.highlightButton)
			{
				col1 = this.buttonColActv1;
				col2 = this.buttonColActv2;
			}
			else if (this.selectedButton != null && d.id == this.selectedButton)
			{
				col1 = this.buttonColSel1;
				col2 = this.buttonColSel2;
			}
			else
			{
				col1 = this.buttonColNorm1;
				col2 = this.buttonColNorm2;
			}

			ctx.save();
			path = pathRoundedRect(d.x + 0.5, d.y + 0.5, d.x + d.width - 1, d.y + d.height - 1, 5);
			if (col2 != null)
			{
				let grad = ctx.createLinearGradient(d.x, d.y, d.x + d.width, d.y + d.height);
				grad.addColorStop(0, colourCanvas(col1));
				grad.addColorStop(1, colourCanvas(col2));
				ctx.fillStyle = grad;
			}
			else ctx.fillStyle = colourCanvas(col1);
			ctx.fill(path);
			ctx.strokeStyle = colourCanvas(this.border);
			ctx.lineWidth = 0.5;
			ctx.stroke(path);
			ctx.restore();

			if (d.imgDOM != null)
			{
				d.imgDOM.remove();
				d.imgDOM = null;
			}

			if (b != null)
			{
				if (d.helpSpan == null)
				{
					d.helpSpan = dom('<span style="position: absolute;"/>').appendTo(this.contentDOM);
					let txt = b.helpText;
					if (b.mnemonic)
					{
						while (txt.endsWith('.')) txt = txt.substring(0, txt.length - 1);

						let keyText = b.mnemonic;
						let match = keyText.match(/^(.*)CmdOrCtrl(.*)$/);
						if (match) keyText = match[1] + (this.isMacLike ? 'Cmd' : 'Ctrl') + match[2];
						txt += ' [' + keyText + ']';
					}
					addTooltip(d.helpSpan, txt);
				}
				setBoundaryPixels(d.helpSpan, d.x, d.y, d.width, d.height);
			}

			if (b == null) {}
			else if (b.imageFN != null && d.imgDOM == null)
			{
				d.imgDOM = dom('<img/>').appendTo(this.contentDOM).css({'position': 'absolute', 'pointer-events': 'none'});
				d.imgDOM.setAttr('src', Theme.RESOURCE_URL + '/img/actions/' + b.imageFN + '.svg');
				const sz = this.prefabImgSize;
				const bx = d.x + Math.floor(0.5 * (d.width - sz));
				const by = d.y + Math.floor(0.5 * (d.height - sz));
				setBoundaryPixels(d.imgDOM, bx, by, sz, sz);
			}
			else if (b.metavec != null)
			{
				let draw = b.metavec instanceof MetaVector ? b.metavec as MetaVector : new MetaVector(b.metavec);
				draw.offsetX = d.x + Math.floor(0.5 * (d.width - draw.width));
				draw.offsetY = d.y + Math.floor(0.5 * (d.height - draw.height));
				draw.renderContext(ctx);
			}
			else if (b.text != null)
			{
				let sz = this.idealSize;
				let draw = new MetaVector({'size': [sz, sz]});
				let fsz = sz * 0.6;
				let wad = FontData.main.measureText(b.text, fsz);

				if (wad[1] + wad[2] > sz)
				{
					fsz *= sz / (wad[1] + wad[2]);
					wad = FontData.main.measureText(b.text, fsz);
				}
				if (wad[0] > sz)
				{
					fsz *= sz / wad[0];
					wad = FontData.main.measureText(b.text, fsz);
				}
				let x = 0.5 * (sz - wad[0]), y = 0.5 * (sz + wad[1]);
				draw.drawText(x - 1, y, b.text, fsz, 0x000000);
				draw.drawText(x + 1, y, b.text, fsz, 0x000000);
				draw.drawText(x, y - 1, b.text, fsz, 0x000000);
				draw.drawText(x, y + 1, b.text, fsz, 0x000000);
				draw.drawText(x, y, b.text, fsz, 0xFFFFFF);
				draw.offsetX = d.x + Math.floor(0.5 * (d.width - draw.width));
				draw.offsetY = d.y + Math.floor(0.5 * (d.height - draw.height));
				draw.renderContext(ctx);
			}

			// optionally draw the submenus indicator
			if (b != null && b.isSubMenu)
			{
				ctx.save();
				let sx = d.x + d.width - 3, sy = d.y + d.height - 3;
				ctx.beginPath();
				ctx.moveTo(sx, sy);
				ctx.lineTo(sx - 6, sy);
				ctx.lineTo(sx, sy - 6);
				ctx.closePath();
				ctx.fillStyle = 'black';
				ctx.fill();
				ctx.restore();
			}

			// if it's the grip-button, draw the caret
			if (d.id == '*')
			{
				ctx.save();

				path = new Path2D();
				let px:number[], py:number[], flip = this.isRaised;
				if (this.position == ButtonViewPosition.Left || this.position == ButtonViewPosition.Right)
				{
					px = [0.2, 0.7, 0.7]; py = [0.5, 0.3, 0.7];
					if (this.position == ButtonViewPosition.Left) flip = !flip;
				}
				else if (this.position == ButtonViewPosition.Top || this.position == ButtonViewPosition.Bottom)
				{
					px = [0.5, 0.3, 0.7]; py = [0.2, 0.7, 0.7];
					if (this.position == ButtonViewPosition.Top) flip = !flip;
				}
				if (flip) {px = [1 - px[0], 1 - px[1], 1 - px[2]]; py = [1 - py[0], 1 - py[1], 1 - py[2]];}
				path.moveTo(d.x + d.width * px[0], d.y + d.height * py[0]);
				path.lineTo(d.x + d.width * px[1], d.y + d.height * py[1]);
				path.lineTo(d.x + d.width * px[2], d.y + d.height * py[2]);
				path.closePath();
				ctx.fillStyle = 'white';
				ctx.strokeStyle = 'black';
				ctx.lineWidth = 0;
				ctx.fill(path);
				ctx.stroke(path);

				ctx.restore();
			}
			else if (d.id == '!')
			{
				ctx.save();

				let path1 = new Path2D(), path2 = new Path2D();

				let inset = 5;
				let w = d.width - inset * 2, h = d.height - inset * 2;

				for (let z = 5; z < w + h - 1; z += 12)
				{
					let x1 = 0, y1 = z, x2 = z, y2 = 0;
					if (y1 > h)
					{
						let delta = y1 - h;
						x1 += delta;
						y1 -= delta;
					}
					if (x2 > w)
					{
						let delta = x2 - w;
						x2 -= delta;
						y2 += delta;
					}
					path1.moveTo(d.x + inset + x1, d.y + inset + y1);
					path1.lineTo(d.x + inset + x2, d.y + inset + y2);
					path2.moveTo(d.x + inset + x1 + 1, d.y + inset + y1);
					path2.lineTo(d.x + inset + x2 + 1, d.y + inset + y2);
				}

				ctx.lineWidth = 1;
				ctx.strokeStyle = '#404040';
				ctx.stroke(path1);
				ctx.strokeStyle = 'white';
				ctx.stroke(path2);

				ctx.restore();
			}
		}

		ctx.restore();
	}
	private delayedRedraw():void
	{
		window.setTimeout(() => this.redraw(), 100);
	}

	// mapping ID tags into raw/display button objects
	private buttonFromID(id:string):ButtonBankItem
	{
		let bank = this.stack[this.stack.length - 1];
		for (let n = 0; n < bank.buttons.length; n++) if (bank.buttons[n].id == id) return bank.buttons[n];
		return null;
	}
	private displayFromID(id:string):ButtonViewDisplay
	{
		for (let n = 0; n < this.display.length; n++) if (this.display[n].id == id) return this.display[n];
		return null;
	}

	// produces a path that runs around the outside edge of the buttonbank; the shape depends on the orientation
	private traceOutline():Path2D
	{
		let w = this.width, h = this.height, uw = w - 1, uh = h - 1, r = 8;
		if (this.position == ButtonViewPosition.Centre || this.stack.length == 0) return pathRoundedRect(0.5, 0.5, w - 0.5, h - 0.5, r);

		let path = new Path2D();

		if (this.position == ButtonViewPosition.Left)
		{
			let my = 0.5 * h - 1, gw = this.gripHeight, hg = 0.5 * this.gripWidth;
			path.moveTo(0.5, 0.5);
			path.lineTo(0.5 + uw - gw - r, 0.5);
			path.bezierCurveTo(0.5 + uw - gw, 0.5, 0.5 + uw - gw, 0.5, 0.5 + uw - gw, 0.5 + r);
			path.lineTo(0.5 + uw - gw, 0.5 + my - hg);
			path.lineTo(0.5 + uw - r, 0.5 + my - hg);
			path.bezierCurveTo(0.5 + uw, 0.5 + my - hg, 0.5 + uw, 0.5 + my - hg, 0.5 + uw, 0.5 + my - hg + r);
			path.lineTo(0.5 + uw, 0.5 + my + hg - r);
			path.bezierCurveTo(0.5 + uw, 0.5 + my + hg, 0.5 + uw, 0.5 + my + hg, 0.5 + uw - r, 0.5 + my + hg);
			path.lineTo(0.5 + uw - gw, 0.5 + my + hg);
			path.lineTo(0.5 + uw - gw, 0.5 + uh - r);
			path.bezierCurveTo(0.5 + uw - gw, 0.5 + uh, 0.5 + uw - gw, 0.5 + uh, 0.5 + uw - gw - r, 0.5 + uh);
			path.lineTo(0.5, 0.5 + uh);
		}
		else if (this.position == ButtonViewPosition.Right)
		{
			let my = 0.5 * h - 1, gw = this.gripHeight, hg = 0.5 * this.gripWidth;
			path.moveTo(w - 0.5, 0.5);
			path.lineTo(w - (0.5 + uw - gw - r), 0.5);
			path.bezierCurveTo(w - (0.5 + uw - gw), 0.5, w - (0.5 + uw - gw), 0.5, w - (0.5 + uw - gw), 0.5 + r);
			path.lineTo(w - (0.5 + uw - gw), 0.5 + my - hg);
			path.lineTo(w - (0.5 + uw - r), 0.5 + my - hg);
			path.bezierCurveTo(w - (0.5 + uw), 0.5 + my - hg, w - (0.5 + uw), 0.5 + my - hg, w - (0.5 + uw), 0.5 + my - hg + r);
			path.lineTo(w - (0.5 + uw), 0.5 + my + hg - r);
			path.bezierCurveTo(w - (0.5 + uw), 0.5 + my + hg, w - (0.5 + uw), 0.5 + my + hg, w - (0.5 + uw - r), 0.5 + my + hg);
			path.lineTo(w - (0.5 + uw - gw), 0.5 + my + hg);
			path.lineTo(w - (0.5 + uw - gw), 0.5 + uh - r);
			path.bezierCurveTo(w - (0.5 + uw - gw), 0.5 + uh, w - (0.5 + uw - gw), 0.5 + uh, w - (0.5 + uw - gw - r), 0.5 + uh);
			path.lineTo(w - 0.5, 0.5 + uh);
		}
		else if (this.position == ButtonViewPosition.Top)
		{
			let mx = 0.5 * w - 1, gh = this.gripHeight, hg = 0.5 * this.gripWidth;
			path.moveTo(0.5, h - (0.5 + uh));
			path.lineTo(0.5, h - (0.5 + gh + r));
			path.bezierCurveTo(0.5, h - (0.5 + gh), 0.5, h - (0.5 + gh), 0.5 + r, h - (0.5 + gh));
			path.lineTo(0.5 + mx - hg, h - (0.5 + gh));
			path.lineTo(0.5 + mx - hg, h - (0.5 + r));
			path.bezierCurveTo(0.5 + mx - hg, h - 0.5, 0.5 + mx - hg, h - 0.5, 0.5 + mx - hg + r, h - 0.5);
			path.lineTo(0.5 + mx + hg - r, h - 0.5);
			path.bezierCurveTo(0.5 + mx + hg, h - 0.5, 0.5 + mx + hg, h - 0.5, 0.5 + mx + hg, h - (0.5 + r));
			path.lineTo(0.5 + mx + hg, h - (0.5 + gh));
			path.lineTo(0.5 + uw - r, h - (0.5 + gh));
			path.bezierCurveTo(0.5 + uw, h - (0.5 + gh), 0.5 + uw, h - (0.5 + gh), 0.5 + uw, h - (0.5 + gh + r));
			path.lineTo(0.5 + uw, h - (0.5 + uh));
		}
		else if (this.position == ButtonViewPosition.Bottom)
		{
			let mx = 0.5 * w - 1, gh = this.gripHeight, hg = 0.5 * this.gripWidth;
			path.moveTo(0.5, 0.5 + uh);
			path.lineTo(0.5, 0.5 + gh + r);
			path.bezierCurveTo(0.5, 0.5 + gh, 0.5, 0.5 + gh, 0.5 + r, 0.5 + gh);
			path.lineTo(0.5 + mx - hg, 0.5 + gh);
			path.lineTo(0.5 + mx - hg, 0.5 + r);
			path.bezierCurveTo(0.5 + mx - hg, 0.5, 0.5 + mx - hg, 0.5, 0.5 + mx - hg + r, 0.5);
			path.lineTo(0.5 + mx + hg - r, 0.5);
			path.bezierCurveTo(0.5 + mx + hg, 0.5, 0.5 + mx + hg, 0.5, 0.5 + mx + hg, 0.5 + r);
			path.lineTo(0.5 + mx + hg, 0.5 + gh);
			path.lineTo(0.5 + uw - r, 0.5 + gh);
			path.bezierCurveTo(0.5 + uw, 0.5 + gh, 0.5 + uw, 0.5 + gh, 0.5 + uw, 0.5 + gh + r);
			path.lineTo(0.5 + uw, 0.5 + uh);
		}
		return path;
	}

	// used for horizontal buttonbanks: provide a maximum width, and try to fill it evenly; returns slot[y][x]='id'/undef
	private layoutMaxWidth(bank:ButtonBank, slotWidth:number):string[][]
	{
		if (bank.buttons.length == 0) return [[null]];

		// !! consider the buddy system when feeding things in...
		let bx = new Array(bank.buttons.length), by = new Array(bank.buttons.length);
		let x = 0, y = 0, w = 0, h = 0;
		for (let n = 0; n < bank.buttons.length; n++)
		{
			w = Math.max(x + 1, w);
			h = Math.max(y + 1, h);
			bx[n] = x;
			by[n] = y;
			x++;
			if (x >= slotWidth) {x = 0; y++;}
		}
		let slot = new Array(h);
		for (let n = 0; n < h; n++) slot[n] = new Array(w);
		for (let n = 0; n < bank.buttons.length; n++)
		{
			slot[by[n]][bx[n]] = bank.buttons[n].id;
		}
		return slot;
	}

	// used for vertical buttonbanks: provide a maximum height, and a row width, and try to fill it evenly; note that the buttons
	// are still fed in left-to-right, just like the layoutMaxWidth method; returns slot[y][x]='id'/undef
	private layoutMaxHeight(bank:ButtonBank, slotHeight:number, slotWidth:number):string[][]
	{
		if (bank.buttons.length == 0) return [[null]];

		// !! consider the buddy system when feeding things in...
		let bx = new Array(bank.buttons.length), by = new Array(bank.buttons.length);
		let x = 0, y = 0, w = 0, h = 0;
		for (let n = 0; n < bank.buttons.length; n++)
		{
			w = Math.max(x + 1, w);
			h = Math.max(y + 1, h);
			bx[n] = x;
			by[n] = y;
			x++;
			if (x >= slotWidth) {x = 0; y++;}
		}
		let slot = new Array(h);
		for (let n = 0; n < h; n++) slot[n] = new Array(w);
		for (let n = 0; n < bank.buttons.length; n++)
		{
			slot[by[n]][bx[n]] = bank.buttons[n].id;
		}
		return slot;
	}

	// takes an array of slot[y][x], and calculates a base score; higher is bad, i.e. penalty based
	private scoreLayout(slots:string[][])
	{
		let score = 0;
		let nrows = slots.length, ncols = slots[0].length;
		for (let y = 0; y < nrows; y++) for (let x = 0; x < ncols; x++)
		{
			if (slots[y][x] == null) score++;
		}
		if (this.maxButtonRows > 0 && nrows > this.maxButtonRows) score += (nrows - this.maxButtonRows) * 100;
		if (this.maxButtonColumns > 0 && ncols > this.maxButtonColumns) score += (ncols - this.maxButtonColumns) * 100;
		return score;
	}

	// returns the index of the button underneath the position, or -1 if none
	private pickButtonIndex(x:number, y:number)
	{
		for (let n = 0; n < this.display.length; n++)
		{
			let d = this.display[n];
			if (x >= d.x && y >= d.y && x < d.x + d.width && y < d.y + d.height) return n;
		}
		return -1;
	}
	private pickButtonID(x:number, y:number):string
	{
		let idx = this.pickButtonIndex(x, y);
		if (idx < 0) return undefined;
		return this.display[idx].id;
	}

	// the button index has been clicked, so activate the corresponding action
	private triggerButton(id:string):void
	{
		if (id == '*')
		{
			if (this.isRaised)
				this.lowerBank();
			else
				this.raiseBank();
			return;
		}
		else if (id == '!')
		{
			this.popBank();
			return;
		}
		let bank = this.stack[this.stack.length - 1];
		bank.hitButton(id);
	}

	// --------------------------------------- toolkit events ---------------------------------------

	// event responses
	private mouseClick(event:MouseEvent):void
	{
	}
	private mouseDoubleClick(event:MouseEvent):void
	{
		// (do something?)
		event.stopImmediatePropagation();
	}
	private mouseDown(event:MouseEvent):void
	{
		this.contentDOM.parent().grabFocus();

		let xy = eventCoords(event, this.contentDOM);
		if (!this.withinOutline(xy[0], xy[1])) return; // propagate

		// !! ?? let shift = event.shiftKey, ctrl = event.ctrlKey, alt = event.altKey, meta = event.metaKey, plat = event.platformModifierKey;
		let id = this.pickButtonID(xy[0], xy[1]);

		if (id != this.highlightButton)
		{
			this.highlightButton = id;
			this.redraw();
		}

		event.stopPropagation();
	}
	private mouseUp(event:MouseEvent):void
	{
		let xy = eventCoords(event, this.contentDOM);
		if (!this.withinOutline(xy[0], xy[1])) return; // propagate

		// !! ?? let shift = event.shiftKey, ctrl = event.ctrlKey, alt = event.altKey, meta = event.metaKey, plat = event.platformModifierKey;
		let id = this.pickButtonID(xy[0], xy[1]);

		if (id != null && this.highlightButton == id)
		{
			this.highlightButton = undefined;
			this.triggerButton(id);
			this.delayedRedraw();
		}
		else
		{
			this.highlightButton = undefined;
			this.delayedRedraw();
		}

		event.stopPropagation();
	}
	private mouseOver(event:MouseEvent):void
	{
		let xy = eventCoords(event, this.contentDOM);
		if (!this.withinOutline(xy[0], xy[1])) return; // propagate

		// (do something?)

		event.stopPropagation();
	}
	private mouseOut(event:MouseEvent):void
	{
		let xy = eventCoords(event, this.contentDOM);
		if (!this.withinOutline(xy[0], xy[1]))
		{
			if (this.highlightButton != null)
			{
				this.highlightButton = null;
				this.delayedRedraw();
			}
			return;
		}

		if (this.highlightButton != null)
		{
			let xy = eventCoords(event, this.contentDOM);
			let id = this.pickButtonID(xy[0], xy[1]);
			if (id != this.highlightButton)
			{
				this.highlightButton = null;
				this.delayedRedraw();
			}
		}

		event.stopPropagation();
	}
	private mouseMove(event:MouseEvent):void
	{
		let xy = eventCoords(event, this.contentDOM);
		if (!this.withinOutline(xy[0], xy[1])) return; // propagate

		// (do something?)

		//event.stopPropagation();
	}
}

/* EOF */ }