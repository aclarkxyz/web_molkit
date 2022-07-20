/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

import {DOM, dom} from '../../src/util/dom';
import {Validation} from './Validation';

/*
    Validation test execution: runs through all the tests defined in a Validation object, and renders the results into an HTML DOM. 
*/

export class WebValExec
{
	constructor(private validation:Validation)
	{
	}

	public async runTests(parent:any)
	{
		let domParent = dom(parent);

		domParent.empty();

		if (this.validation.setupError)
		{
			let div = dom('<div/>').appendTo(domParent).css({'color': 'red'});
			div.setText('Setup failed: ' + this.validation.setupError);
			return;
		}

		let table = dom('<table/>').appendTo(domParent);

		let tdStatus:DOM[] = [], tdInfo:DOM[] = [];

		for (let n = 0; n < this.validation.count; n++)
		{
			let tr = dom('<tr/>').appendTo(table);

			let td = dom('<td valign="top"/>').appendTo(tr);
			tdStatus.push(td);

			td = dom('<td valign="top"></td>').appendTo(tr);
			td.setText(this.validation.getTitle(n));
			tdInfo.push(td);
		}

		for (let n = 0; n < this.validation.count; n++)
		{
			tdStatus[n].setHTML('&#9744;');

			let [success, message, time] = await this.validation.runTest(n);
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
			} 
		}
	}
}
