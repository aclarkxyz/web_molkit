/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

import {DOM, dom} from '../../src/util/dom';
import {Validation, ValidationContext} from './Validation';

/*
    Validation test execution: runs through all the tests defined in a Validation object, and renders the results into an HTML DOM. 
*/

export class WebValExec
{
	constructor(private validation:Validation)
	{
	}

	public async runTests(domParent:DOM)
	{
		const {validation} = this;

		domParent.empty();

		if (validation.setupError)
		{
			let div = dom('<div/>').appendTo(domParent).css({'color': 'red'});
			div.setText('Setup failed: ' + validation.setupError);
			return;
		}

		let table = dom('<table/>').appendTo(domParent);

		let tdStatus:DOM[] = [], tdInfo:DOM[] = [];

		for (let n = 0; n < validation.count; n++)
		{
			let tr = dom('<tr/>').appendTo(table);

			let td = dom('<td valign="top"/>').appendTo(tr);
			tdStatus.push(td);

			td = dom('<td valign="top"></td>').appendTo(tr);
			td.setText(validation.getTitle(n));
			tdInfo.push(td);
		}

		for (let n = 0; n < validation.count; n++)
		{
			tdStatus[n].setHTML('&#9744;');

			let [success, message, time] = await validation.runTest(n);
			if (success)
			{
				tdStatus[n].setHTML('&#9745;');
				if (time >= 0.001)
				{
					let span = dom('<span style="color: #909090;"/>').appendTo(tdInfo[n]);
					span.setText(' (' + time.toFixed(3) + ' sec)');
				}
			}
			else
			{
				tdStatus[n].setHTML('<span style="color: red;">&#9746;</span>');
				let para = dom('<p style="color: purple; margin-top: 0;"/>').appendTo(tdInfo[n]);
				para.setText(message ? message : 'failed');
				tdStatus[n].setCSS('background-color', '#FFF0F0');
				tdInfo[n].setCSS('background-color', '#FFF0F0');

				let divOuter = dom('<div/>').appendTo(tdInfo[n]).css({'padding-left': '0.5em'});
				this.makeContextReport(divOuter, validation.context);
			} 
		}
	}

	private makeContextReport(domNotes:DOM, context:ValidationContext):void
	{
		const {subcategory, row, count, notes} = context ?? {};
		
		if (subcategory) dom('<div/>').appendTo(domNotes).setText(`Subcategory: ${subcategory}`);
		if (row != null)
		{
			let str = `Row: ${row}`;
			if (count != null) str += ` / Count: ${count}`;
			dom('<div/>').appendTo(domNotes).setText(str);
		}
		for (let note of notes ?? [])
		{
			let divItem = dom('<div/>').appendTo(domNotes);
			if (note.startsWith('<svg') || note.startsWith('<div') || note.startsWith('<pre'))
				divItem.appendHTML(note);
			else
				divItem.setText(note);
		}
	}
}

