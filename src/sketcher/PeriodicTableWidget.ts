/*
    WebMolKit

    (c) 2010-2020 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	Interactive periodic table for picking elements.
*/

/* eslint-disable no-multi-spaces, comma-spacing */
const POSITION_TABLE_Y =
[
	1,                                1,
	2,2,                    2,2,2,2,2,2,
	3,3,                    3,3,3,3,3,3,
	4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,
	5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
	6,6,
								8.5,8.5,8.5,8.5,8.5,8.5,8.5,8.5,8.5,8.5,8.5,8.5,8.5,8.5,
		6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
	7,7,
								9.5,9.5,9.5,9.5,9.5,9.5,9.5,9.5,9.5,9.5,9.5,9.5,9.5,9.5,
		7,7,7,7,7,7,7,7,7,7
];
const POSITION_TABLE_X =
[
	1,                                        18,
	1,2,                       13,14,15,16,17,18,
	1,2,                       13,14,15,16,17,18,
	1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,
	1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,
	1,2,
								3.5,4.5,5.5,6.5,7.5,8.5,9.5,10.5,11.5,12.5,13.5,14.5,15.5,16.5,
		3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,
	1,2,
								3.5,4.5,5.5,6.5,7.5,8.5,9.5,10.5,11.5,12.5,13.5,14.5,15.5,16.5,
		3,4,5,6,7,8,9,10,11,12
];

const CSS_PERIODICTABLE = `
	*.wmk-periodictable-element
	{
		border: 1px solid black;
		border-radius: 2px;
		margin: 0;
		min-width: 2em;
		padding: 0.4em 0 0.3em 0;
		text-align: center;
		color: #FFFFFF;
		cursor: pointer;
	}
	*.wmk-periodictable-block1
	{
		background-color: #313062;
	}
	*.wmk-periodictable-block2
	{
		background-color: #205224;
	}
	*.wmk-periodictable-block3
	{
		background-color: #522818;
	}
	*.wmk-periodictable-block4
	{
		background-color: #575212;
	}
	*.wmk-periodictable-selected
	{
		background-color: #FFFFFF;
		color: #000000;
		cursor: default;
	}
`;

export class PeriodicTableWidget extends Widget
{
	private callbackSelect:(element:string) => void;
	private callbackDoubleClick:() => void;

	private divList:DOM[] = [];
	private selectedAtno = 0;

	// ------------ public methods ------------

	constructor()
	{
		super();

		installInlineCSS('periodictable', CSS_PERIODICTABLE);
	}

	// create the underlying structure; the parent parameter must be jQuery-compatible
	public render(parent:any)
	{
		super.render(parent);

		let grid = dom('<div/>').appendTo(this.contentDOM).css({'display': 'grid'});
		grid.css({'align-items': 'center', 'justify-content': 'start', 'gap': '1px'});
		//grid.css({'grid-row-gap': '0.5em', 'grid-column-gap': '0.5em'});
		//grid.css({'grid-template-columns': '[title] auto [value] auto [end]'});

		let row = POSITION_TABLE_Y.map((y) => Math.round(2 * y) + 1);
		let col = POSITION_TABLE_X.map((x) => Math.round(2 * x) + 1);
		let num = row.length;

		for (let n = 0; n < num; n++)
		{
			let div = dom('<div/>').appendTo(grid);
			div.css({'grid-row': `${row[n]} / span 2`, 'grid-column': `${col[n]} / span 2`});
			div.addClass('wmk-periodictable-element');

			let blk = Chemistry.ELEMENT_BLOCKS[n + 1];
			if (blk == 1) div.addClass('wmk-periodictable-block1');
			else if (blk == 2) div.addClass('wmk-periodictable-block2');
			else if (blk == 3) div.addClass('wmk-periodictable-block3');
			else if (blk == 4) div.addClass('wmk-periodictable-block4');

			let el = Chemistry.ELEMENTS[n + 1];
			div.setText(el);
			this.divList.push(div);

			div.onClick(() =>
			{
				this.changeElement(el);
				this.callbackSelect(el);
			});
			div.onDblClick((event) =>
			{
				this.callbackDoubleClick();
				event.preventDefault();
				event.stopPropagation();
			});
		}
	}

	public onSelect(callback:(element:string) => void):void
	{
		this.callbackSelect = callback;
	}
	public onDoubleClick(callback:() => void):void
	{
		this.callbackDoubleClick = callback;
	}

	// set visible selection to the given element, or nothing if it's not in the list
	public changeElement(element:string):void
	{
		let atno = Chemistry.ELEMENTS.indexOf(element);
		if (atno == this.selectedAtno) return;
		if (this.selectedAtno > 0) this.divList[this.selectedAtno - 1].removeClass('wmk-periodictable-selected');
		this.selectedAtno = atno;
		if (this.selectedAtno > 0) this.divList[this.selectedAtno - 1].addClass('wmk-periodictable-selected');
	}

	// ------------ private methods ------------

}

/* EOF */ }