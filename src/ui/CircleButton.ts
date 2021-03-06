/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	CircleButton: a circular button with a vector icon.

	Content:
		.icon: an SVG file from ~/img/icons, e.g. "dice.svg"
		.state: one of .STATE_*
		.isHighlight: true if mouse is hovering over
		.isPressed: true if being pressed
		.normalBackgr, .selectedBackgr, .pressedBackgr, .disabledBackgr: graphical overlays of the solid variety
		.thinBorder, .thickBorder: graphical overlays to indicate mouse in/out
		.svg: the instantiated icon object
*/

const BUTTON_DIAMETER = 50;
const BUTTON_HPADDING = 4;
const BUTTON_VPADDING = 2;
const STATE_NORMAL = 'normal';
const STATE_SELECTED = 'selected';
const STATE_DISABLED = 'disabled';

export class CircleButton extends Widget
{
	private state = STATE_NORMAL;
	private isHighlight = false;
	private isPressed = false;

	private normalBackgr:HTMLCanvasElement;
	private selectedBackgr:HTMLCanvasElement;
	private pressedBackgr:HTMLCanvasElement;
	private disabledBackgr:HTMLCanvasElement;
	private ringProgress:HTMLCanvasElement;
	private thinBorder:HTMLCanvasElement;
	private thickBorder:HTMLCanvasElement;
	private svg:Element;

	private progressFraction:number = null;

	public callbackAction:(source?:CircleButton) => void = null;

	constructor(private icon:string)
	{
		super();
	}

	// create the underlying structure; the parent parameter must be jQuery-compatible
	public render(parent:any)
	{
		super.render(parent);

		this.content.addClass('no_selection');

		const diameter = BUTTON_DIAMETER;
		const width = diameter, height = diameter;

		let div = this.content;
		let density = pixelDensity();

		div.css('width', width + 2 * BUTTON_HPADDING);
		div.css('height', height + 2 * BUTTON_VPADDING);
		div.css('position', 'relative');

		let canvasStyle = 'position: absolute; left: ' + BUTTON_HPADDING + 'px; top: ' + BUTTON_VPADDING + 'px;';
		canvasStyle += 'pointer-events: none;';

		function renderSolid(col1:any, col2:any):HTMLCanvasElement
		{
			let node = newElement(div, 'canvas', {'width': width * density, 'height': height * density, 'style': canvasStyle}) as HTMLCanvasElement;
			node.style.width = width + 'px';
			node.style.height = height + 'px';
			let ctx = node.getContext('2d');
			ctx.save();
			ctx.scale(density, density);
			ctx.beginPath();
			ctx.arc(0.5 * width, 0.5 * height, 0.5 * diameter - 1, 0, 2 * Math.PI, true);
			ctx.clip();
			let grad = ctx.createLinearGradient(0, 0, width, height);
			grad.addColorStop(0, col1);
			grad.addColorStop(1, col2);
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, width, height);
			ctx.restore();
			return node;
		}
		function renderBorder(lw:number):HTMLCanvasElement
		{
			let node = newElement(div, 'canvas', {'width': width * density, 'height': height * density, 'style': canvasStyle}) as HTMLCanvasElement;
			node.style.width = width + 'px';
			node.style.height = height + 'px';
			let ctx = node.getContext('2d');
			ctx.save();
			ctx.scale(density, density);
			ctx.beginPath();
			ctx.arc(0.5 * width, 0.5 * height, 0.5 * diameter - 0.5 * (1 + lw), 0, 2 * Math.PI, true)	;
			ctx.strokeStyle = 'black';
			ctx.lineWidth = lw;
			ctx.stroke();
			ctx.restore();
			return node;
		}

		this.normalBackgr = renderSolid('#FFFFFF', '#D0D0D0');
		this.selectedBackgr = renderSolid('#47D5D2', '#008FD1');
		this.pressedBackgr = renderSolid('#00CA59', '#008650');
		this.disabledBackgr = renderSolid('white', 'white');

		this.ringProgress = newElement(div, 'canvas', {'width': width * density, 'height': height * density, 'style': canvasStyle}) as HTMLCanvasElement;
		this.ringProgress.style.width = width + 'px';
		this.ringProgress.style.height = height + 'px';
		this.ringProgress.getContext('2d').scale(density, density);
		this.ringProgress.hidden = true;

		this.thinBorder = renderBorder(1);
		this.thickBorder = renderBorder(2);

		let svgurl = Theme.BASE_URL + '/img/icons/' + this.icon;

		this.svg = newElement(div, 'object', {'width': width, 'height': height, 'style': canvasStyle, 'data': svgurl, 'type': 'image/svg+xml'});

		this.updateLayers();

		div.mouseenter(() => this.mouseEnter());
		div.mouseleave(() => this.mouseLeave());
		div.mousedown(() => this.mouseDown());
		div.mouseup(() => this.mouseUp());
		div.click(() => this.mouseClicked());
	}

	// changes the widget to display a ring around the outside; any range from 0..1 is considered active
	public setProgress(fraction:number):void
	{
		if (this.progressFraction == fraction) return;
		this.progressFraction = fraction;

		this.ringProgress.hidden = false;

		let diameter = BUTTON_DIAMETER, mid = 0.5 * diameter, outer = mid - 1, inner = 0.8 * mid;
		let ctx = this.ringProgress.getContext('2d');
		ctx.clearRect(0, 0, diameter, diameter);

		ctx.strokeStyle = 'rgba(80,80,80,0.5)';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.ellipse(mid, mid, inner + 0.5, inner + 0.5, 0, 0, TWOPI, false);
		ctx.stroke();

		if (this.progressFraction == 0)
		{
			ctx.lineWidth = 1;
			ctx.strokeStyle = '#47D5D2';
			drawLine(ctx, mid, mid - inner, mid, mid - outer);
			return;
		}

		let delta = TWOPI * fraction;
		let theta1 = -0.5 * Math.PI, theta2 = theta1 + delta;

		ctx.save();
		ctx.beginPath();
		ctx.moveTo(mid, mid - outer);
		ctx.arc(mid, mid, outer, theta1, theta2, false);
		ctx.lineTo(mid + inner * Math.cos(theta2), mid + inner * Math.sin(theta2));
		ctx.arc(mid, mid, inner, theta2, theta1, true);
		ctx.closePath();
		let grad = ctx.createRadialGradient(mid, mid, inner, mid, mid, outer);
		grad.addColorStop(0, '#47D5D2');
		grad.addColorStop(1, '#008FD2');
		ctx.fillStyle = grad;
		ctx.fill();
		ctx.restore();
	}

	// returns the widget to its normal state of not having a progress indicator
	public clearProgress()
	{
		this.progressFraction = null;
		this.ringProgress.hidden = true;
	}

	// switches the layers on or off depending on the state
	private updateLayers()
	{
		let setVisible = (canvas:HTMLCanvasElement, visible:boolean) => canvas.style.display = visible ? 'block' : 'none';

		setVisible(this.pressedBackgr, this.isPressed);
		setVisible(this.normalBackgr, !this.isPressed && this.state == STATE_NORMAL);
		setVisible(this.selectedBackgr, !this.isPressed && this.state == STATE_SELECTED);
		setVisible(this.disabledBackgr, !this.isPressed && this.state == STATE_DISABLED);

		let highlight = this.isHighlight;
		if (this.state == STATE_DISABLED)
		{
			highlight = false;
			this.content.css('cursor', 'no-drop');
		}
		else this.content.css('cursor', 'pointer');

		setVisible(this.thinBorder, !highlight);
		setVisible(this.thickBorder, highlight);
	}

	// mouse events
	private mouseEnter()
	{
		this.isHighlight = true;
		this.updateLayers();
	}
	private mouseLeave()
	{
		this.isHighlight = false;
		this.isPressed = false;
		this.updateLayers();
	}
	private mouseDown()
	{
		this.isPressed = this.state != STATE_DISABLED;
		this.updateLayers();
	}
	private mouseUp()
	{
		this.isPressed = false;
		this.updateLayers();
	}
	private mouseClicked()
	{
		if (this.callbackAction) this.callbackAction(this);
	}
}

/* EOF */ }