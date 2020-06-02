/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../../src/util/util.ts'/>
///<reference path='../../src/decl/jquery/index.d.ts'/>
///<reference path='Validation.ts'/>

namespace WebMolKit /* BOF */ {

/*
    Validation test execution: runs through all the tests defined in a Validation object, and renders the results into an HTML DOM. 
*/

export class WebValExec
{
	constructor(private validation:Validation)
	{
	}

	public async runTests(domParent:JQuery)
	{
		domParent.empty();

		if (this.validation.setupError)
		{
			let div = $('<div/>').appendTo(domParent).css({'color': 'red'});
			div.text('Setup failed: ' + this.validation.setupError);
			return;
		}

		let table = $('<table/>').appendTo(domParent);

		let tdStatus:JQuery[] = [], tdInfo:JQuery[] = [];

		for (let n = 0; n < this.validation.count; n++)
		{
			let tr = $('<tr/>').appendTo(table);

			let td = $('<td valign="top"/>').appendTo(tr);
			tdStatus.push(td);

			td = $('<td valign="top"></td>').appendTo(tr);
			td.text(this.validation.getTitle(n));
			tdInfo.push(td);
		}

		for (let n = 0; n < this.validation.count; n++)
		{
			tdStatus[n].html('&#9744;');

			let [success, message, time] = await this.validation.runTest(n);
			if (success)
			{
				tdStatus[n].html('&#9745;');
				if (time >= 0.001)
				{
					let span = $('<span style="color: #909090;"/>').appendTo(tdInfo[n]);
					span.text(' (' + time.toFixed(3) + ' sec)');
				}
			}
			else
			{
				tdStatus[n].html('<span style="color: red;">&#9746;</span>');
				let para = $('<p style="color: purple; margin-top: 0;"/>').appendTo(tdInfo[n]);
				para.text(message ? message : 'failed');
				tdStatus[n].css('background-color', '#FFF0F0');
				tdInfo[n].css('background-color', '#FFF0F0');
			} 
		}
	}
}

/* EOF */ }