/*
    WebMolKit

    (c) 2010-2020 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	Supporting widget for editing extra/transient fields, from either atoms or bonds.
*/

export class ExtraFieldsWidget extends Widget
{
	private divFields:JQuery;

	constructor(private fields:string[])
	{
		super();
	}

	// create the underlying structure; the parent parameter must be jQuery-compatible
	public render(parent:any)
	{
		super.render(parent);

		this.divFields = $('<div/>').appendTo(this.content);
		this.fillTable();

		let divButtons = $('<div/>').appendTo(this.content).css({'text-align': 'center'});
		let btnExtra = $('<button class="wmk-button wmk-button-default">Extra</button>').appendTo(divButtons);
		btnExtra.click(() =>
		{
			this.fields.push(Molecule.PREFIX_EXTRA);
			this.fillTable();
		});
		divButtons.append(' ');
		let btnTransient = $('<button class="wmk-button wmk-button-default">Transient</button>').appendTo(divButtons);
		btnTransient.click(() =>
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

		let table = $('<table/>').appendTo(this.divFields).css({'width': '100%'});
		let tr = $('<tr/>').appendTo(table);
		$('<td/>').appendTo(tr).css({'text-align': 'right', 'font-weight': 'bold', 'text-decoration': 'underline'}).text('Type');
		$('<td/>').appendTo(tr).css({'font-weight': 'bold', 'text-decoration': 'underline'}).text('Value');

		for (let n = 0; n < this.fields.length; n++)
		{
			let strType = '?', strValue = '';
			if (this.fields[n].length > 0)
			{
				strType = this.fields[n].charAt(0);
				strValue = this.fields[n].substring(1);
			}

			tr = $('<tr/>').appendTo(table);
			let tdType = $('<td/>').appendTo(tr).css({'text-align': 'right'}), tdValue = $('<td/>').appendTo(tr), tdButton = $('<td/>').appendTo(tr);

			$('<span/>').appendTo(tdType).css({'padding': '0.2em', 'border': '1px solid black', 'background-color': '#C0C0C0'}).text(strType);

			let input = $('<input size="20"/>').appendTo(tdValue).css({'width': '100%', 'font': 'inherit'});
			input.val(strValue);
			input.change(() => this.fields[n] = strType + input.val());
			input.keyup(() => this.fields[n] = strType + input.val());

			let btnDelete = $('<button class="wmk-button wmk-button-small wmk-button-default">\u{2716}</button>').appendTo(tdButton);
			btnDelete.click(() =>
			{
				this.fields.splice(n, 1);
				this.fillTable();
			});
		}
	}
}

/* EOF */ }