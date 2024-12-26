/*
    WebMolKit

    (c) 2010-2020 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {Molecule} from '../mol/Molecule';
import {Widget} from '../ui/Widget';
import {dom, DOM} from '../util/dom';

/*
	Supporting widget for editing extra/transient fields, from either atoms or bonds.
*/

export class ExtraFieldsWidget extends Widget
{
	private divFields:DOM;

	constructor(private fields:string[])
	{
		super();
	}

	// create the underlying structure; the parent parameter must be jQuery-compatible
	public render(parent:any)
	{
		super.render(parent);

		this.divFields = dom('<div/>').appendTo(this.contentDOM);
		this.fillTable();

		let divButtons = dom('<div/>').appendTo(this.contentDOM).css({'text-align': 'center'});
		let btnExtra = dom('<button class="wmk-button wmk-button-default">Extra</button>').appendTo(divButtons);
		btnExtra.onClick(() =>
		{
			this.fields.push(Molecule.PREFIX_EXTRA);
			this.fillTable();
		});
		//divButtons.append(' ');
		let btnTransient = dom('<button class="wmk-button wmk-button-default">Transient</button>').appendTo(divButtons).css({'margin-left': '0.5em'});
		btnTransient.onClick(() =>
		{
			this.fields.push(Molecule.PREFIX_TRANSIENT);
			this.fillTable();
		});
	}

	public getExtraFields():string[]
	{
		let extra:string[] = [];
		for (let field of this.fields) if (!field.startsWith(Molecule.PREFIX_TRANSIENT) && field.length > 1) extra.push(field);
		return extra;
	}

	public getTransientFields():string[]
	{
		let transient:string[] = [];
		for (let field of this.fields) if (field.startsWith(Molecule.PREFIX_TRANSIENT) && field.length > 1) transient.push(field);
		return transient;
	}

	// ------------ private methods ------------

	private fillTable():void
	{
		this.divFields.empty();
		if (this.fields.length == 0) return;

		let table = dom('<table/>').appendTo(this.divFields).css({'width': '100%'});
		let tr = dom('<tr/>').appendTo(table);
		dom('<td/>').appendTo(tr).css({'text-align': 'right', 'font-weight': 'bold', 'text-decoration': 'underline'}).setText('Type');
		dom('<td/>').appendTo(tr).css({'font-weight': 'bold', 'text-decoration': 'underline'}).setText('Value');

		for (let n = 0; n < this.fields.length; n++)
		{
			let strType = '?', strValue = '';
			if (this.fields[n].length > 0)
			{
				strType = this.fields[n].charAt(0);
				strValue = this.fields[n].substring(1);
			}

			tr = dom('<tr/>').appendTo(table);
			let tdType = dom('<td/>').appendTo(tr).css({'text-align': 'right'}), tdValue = dom('<td/>').appendTo(tr), tdButton = dom('<td/>').appendTo(tr);

			dom('<span/>').appendTo(tdType).css({'padding': '0.2em', 'border': '1px solid black', 'background-color': '#C0C0C0'}).setText(strType);

			let input = dom('<input size="20"/>').appendTo(tdValue).css({'width': '100%', 'font': 'inherit'});
			input.setValue(strValue);
			input.onInput(() => {this.fields[n] = strType + input.getValue();});

			let btnDelete = dom('<button class="wmk-button wmk-button-small wmk-button-default">\u{2716}</button>').appendTo(tdButton).css({'margin-left': '0.5em'});
			btnDelete.onClick(() =>
			{
				this.fields.splice(n, 1);
				this.fillTable();
			});
		}
	}
}

