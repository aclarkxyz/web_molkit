/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../util/Cookies.ts'/>
///<reference path='../ui/ViewStructure.ts'/>
///<reference path='Dialog.ts'/>

namespace WebMolKit /* BOF */ {

/*
	Provides a list of recent molecules (from the cookies) to pick from.
*/

export class PickRecent extends Dialog
{
	public callbackPick1:(mol:Molecule) => void = null;
	public callbackPick2:(mol:Molecule) => void = null;
	
	private tableRows:JQuery[] = [];
	private views:ViewStructure[] = [];
		
	constructor(private cookies:Cookies, private sides:number)
	{
		super();
		
		this.title = 'Recent Molecules';
		this.minPortionWidth = 20;
		this.maxPortionWidth = 95;
	}

	// builds the dialog content
	protected populate():void
	{
		let table = $('<table></table>').appendTo(this.body());
		
		for (let n = 0; n < this.cookies.numMolecules(); n++)
		{
			const idx = n;
			let tr = $('<tr></tr>').appendTo(table);
			this.tableRows.push(tr);
			
			let tdHTML = '<td style="text-align: center; vertical-align: middle; padding: 0.5em;"></td>';
			
			const tdMol = $(tdHTML).appendTo(tr);
			let mol = this.cookies.getMolecule(n);
			
			const vs = new ViewStructure(/*this.tokenID*/);
			this.views[n] = vs;
					
			vs.content = tdMol; // (prime the pump, before it gets rendered)
			vs.defineMolecule(mol);
			vs.borderCol = -1;
			vs.backgroundCol1 = 0xF8F8F8;
			vs.backgroundCol2 = 0xE0E0E0;
			vs.padding = 4;
			vs.setup(() => {vs.render(tdMol); this.bump();});
			
			let tdPick = $(tdHTML).appendTo(tr);
			if (this.sides == 1)
			{
				let btnPick = $('<button class="button button-primary">Pick</button>').appendTo(tdPick);
				btnPick.click(() => this.pickMolecule(idx, 1));
			}
			else // sides==2: reaction style
			{
				let btnPick1 = $('<button class="button button-primary">Reactant</button>').appendTo(tdPick);
				tdPick.append('&nbsp;');
				let btnPick2 = $('<button class="button button-primary">Product</button>').appendTo(tdPick);
				btnPick1.click(() => this.pickMolecule(idx, 1));
				btnPick2.click(() => this.pickMolecule(idx, 2));
			}
			tdPick.append('&nbsp;');
			let btnDelete = $('<button class="button button-default">Delete</button>').appendTo(tdPick);
			btnDelete.click(() => this.deleteMolecule(idx));
		}
	}
	
	private pickMolecule(idx:number, which:number):void
	{
		let mol:Molecule = this.cookies.getMolecule(idx);
		this.cookies.promoteToTop(idx);
		
		if (which == 1 && this.callbackPick1) this.callbackPick1(mol);
		if (which == 2 && this.callbackPick2) this.callbackPick2(mol);
		
		this.close();
	}
	
	private deleteMolecule(idx:number):void
	{
		this.cookies.deleteMolecule(idx);
		this.tableRows[idx].remove();
		this.bump();
	}
}

/* EOF */ }