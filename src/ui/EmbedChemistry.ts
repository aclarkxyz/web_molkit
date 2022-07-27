/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {RenderPolicy} from '../gfx/Rendering';
import {colourCanvas} from '../util/util';
import {Widget} from './Widget';

/*
	Base class for various kinds of "embedded" chemistry display objects, such as molecules/reactions/collections. These are intended to be largely
	static displays that are dynamically manufactured from embedded content, e.g. upgrading a WordPress "shortcode" with a molecular structure to
	a picture of the molecule.
*/

export class EmbedChemistry extends Widget
{
	public padding = 4;
	public borderCol = 0xD0D0D0;
	public borderRadius = 8; // for rounded rects
	public backgroundCol1 = 0xFFFFFF;
	public backgroundCol2 = 0xF0F0F0;
	public policy:RenderPolicy = RenderPolicy.defaultColourOnWhite();

	// ------------ public methods ------------

	constructor()
	{
		super();
	}

	// convenience for setting up backdrop
	public clearBackground() {this.backgroundCol1 = null; this.backgroundCol2 = null;}
	public setBackground(bg:number) {this.backgroundCol1 = bg; this.backgroundCol2 = null;}
	public setBackgroundGradient(bg1:number, bg2:number) {this.backgroundCol1 = bg1; this.backgroundCol2 = bg2;}

	// create the objects necessary to render the widget; this function should be called after basic pre-initialisation settings, e.g.
	// specifying the starting molecule, initial size, etc.
	public render(parent:any):void
	{
		super.render(parent);

		let content = this.contentDOM;

		if (this.borderCol != null) content.setCSS('border', '1px solid ' + colourCanvas(this.borderCol));
		if (this.borderRadius > 0) content.setCSS('border-radius', this.borderRadius + 'px');

		let bg1 = this.backgroundCol1, bg2 = this.backgroundCol2;
		if (bg1 != null && bg2 != null)
		{
			let cols = colourCanvas(bg1) + ',' + colourCanvas(bg2);
			content.setCSS('background-image', 'linear-gradient(to bottom right, ' + cols + ')');
		}
		else if (bg1 != null)
		{
			content.setCSS('background-color', colourCanvas(bg1));
		}

		content.css({'padding': this.padding + 'px', 'margin': '0'});
	}

	// ------------ private methods ------------

}

