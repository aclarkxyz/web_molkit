/*
    Open Molecule

    (c) 2017 Dr. Alex M. Clark

    Released under the Gnu Public License (v3.0)
    
    http://molmatinf.com

	[PKG=assaycentral]
*/

///<reference path='../../../../src/decl/corrections.d.ts'/>
///<reference path='../../../../src/decl/jquery.d.ts'/>
///<reference path='../../../../src/rpc/RPC.ts'/>
///<reference path='../../../../src/util/util.ts'/>
///<reference path='../../../../src/util/Vec.ts'/>
///<reference path='../../../../src/data/Molecule.ts'/>
///<reference path='../../../../src/data/MDLReader.ts'/>
///<reference path='../../../../src/data/OpenMolSpec.ts'/>
///<reference path='../../../../src/gfx/Rendering.ts'/>
///<reference path='../../../../src/gfx/MetaVector.ts'/>
///<reference path='../../../../src/gfx/ArrangeMolecule.ts'/>
///<reference path='../../../../src/gfx/DrawMolecule.ts'/>

/*
	Page controller for interactive Open Molecule demonstration.
*/

class PageOpenMol
{
	private rawContent = '';
	private showMol:Molecule = null;
	private openSpec:OpenMolSpec = null;
	private errorMsg:string = null;

	private divMain:JQuery;
	private divRawText:JQuery;
	private divMolecule:JQuery;
	private divExplain:JQuery;

	// ------------ public methods ------------

	constructor()
	{
	}

	public build(root:JQuery):void
	{
		const self = this;
		root.empty();
		root.css('padding', '0.5em');

		root.append('<h1>Open Molecule Demo</h1>');
		let p = $('<p></p>').appendTo(root);
		p.text('Drag or paste a molecular structure to analyze it.');

		p = $('<p></p>').appendTo(root);
		let btnExample = $('<button class="button button-default">Example</button>').appendTo(p);
		btnExample.click(function() {self.actionExample();});

		this.divMain = $('<div></div>').appendTo(root);

		let table = $('<table></table>').appendTo(this.divMain);
		table.css('border-collapse', 'collapse');
		table.css('margin', '3px');
		table.css('padding', '3px');
		table.css('border', '1px solid #808080');
		table.css('box-shadow', '0 0 5px rgba(66,88,77,0.5');

		let tr1 = $('<tr></tr>').appendTo(table), tr2 = $('<tr></tr>').appendTo(table);
		let td1 = $('<td></td>').appendTo(tr1), td2 = $('<td></td>').appendTo(tr1);
		let td3 = $('<td colspan="2"></td>').appendTo(tr2);

		td1.css('min-width', '20em');
		td1.css('border-right', '1px solid #808080');

		td2.css('min-width', '20em');
		td2.css('text-align', 'center');
		td2.css('vertical-align', 'middle');

		td3.css('border-top', '1px solid #808080');

		this.divRawText = $('<div></div>').appendTo(td1);
		this.divMolecule = $('<div></div>').appendTo(td2);
		this.divExplain = $('<div></div>').appendTo(td3);

		this.redrawState();

     	// capture paste
		document.addEventListener('paste', function(e:any)
		{
			let wnd = <any>window, txt = '';
			if (wnd.clipboardData && wnd.clipboardData.getData) txt = wnd.clipboardData.getData('Text');
			else if (e.clipboardData && e.clipboardData.getData) txt = e.clipboardData.getData('text/plain');

			if (!self.pasteContent(txt)) return true;

			e.preventDefault();
			return false;
		});

		// setup the drop target
		document.addEventListener('dragover', function(event)
		{
			event.stopPropagation();
			event.preventDefault();
			event.dataTransfer.dropEffect = 'copy';
		});
		document.addEventListener('drop', function(event)
		{
			event.stopPropagation();
			event.preventDefault();
			self.dropInto(event.dataTransfer);
		});		
	}

	// ------------ private methods ------------

	// fill it in with an example molfile
	private actionExample():void
	{
		let molfile = '\nSketchEl molfile\n\n' +
			' 10  9  0  0  0  0  0  0  0  0999 V2000\n' +
			'   -2.0000    3.4500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n' +
			'   -3.2990    2.7000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n' +
			'   -0.7010    2.7000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n' +
			'   -3.2990    1.2000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n' +
			'   -2.0000    0.4500    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0\n' +
			'   -0.7010    1.2000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n' +
			'    0.5981    3.4500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n' +
			'    1.8971    2.7000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n' +
			'    0.5981    4.9500    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0\n' +
			'    2.1500    2.6000    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0\n' +
			'  1  2  1  0  0  0  0\n' +
			'  1  3  2  0  0  0  0\n' +
			'  2  4  2  0  0  0  0\n' +
			'  4  5  1  0  0  0  0\n' +
			'  5  6  2  0  0  0  0\n' +
			'  6  3  1  0  0  0  0\n' +
			'  3  7  1  0  0  0  0\n' +
			'  7  8  1  0  0  0  0\n' +
			'  7  9  2  0  0  0  0\n' +
			'M  END';
		this.pasteContent(molfile);
	}

	// bring in text from some arbitrary source
	private pasteContent(txt:string):void
	{
		this.rawContent = txt;
		this.openSpec = null;
		this.showMol = null;
		this.errorMsg = null;

		let mdlReader = new MDLMOLReader(txt);
		try 
		{
			this.showMol = mdlReader.parse();
			this.openSpec = mdlReader.openmol;
		}
		catch (e) {this.errorMsg = e.message;}

		this.redrawState();
	}

	private dropInto(transfer:DataTransfer):void
	{
		const self = this;
		
		let items = transfer.items, files = transfer.files;

		const SUFFIXES = ['.mol', '.sdf', '.sd'];
		const MIMES = ['text/plain', 'x-mdl-sdfile', 'x-mdl-molfile'];

		for (let n = 0; n < items.length; n++)
		{
			if (items[n].kind == 'string' && MIMES.indexOf(items[n].type) >= 0)
			{
				items[n].getAsString(function(str:string) {self.pasteContent(str);});
				return;
			}
		}
		for (let n = 0; n < files.length; n++)
		{
			for (let sfx of SUFFIXES) if (files[n].name.endsWith(sfx))
			{
				let reader = new FileReader();
				reader.onload = function(event) {self.pasteContent(reader.result);}
				reader.readAsText(files[n]);
				return;
			} 
		}
	} 

	// redraws all the panels
	private redrawState():void
	{
		this.divMain.css('display', this.rawContent ? 'block' : 'none');

		this.redrawRawText();
		this.redrawMolecule();
		this.redrawExplain();
	}
	
	// draws the raw text that was pasted in, with annotations about what belonged or didn't
	private redrawRawText():void
	{
		this.divRawText.empty();

		if (!this.rawContent)
		{
			this.divRawText.text('Paste or drag an MDL Molfile onto the page.');
			return;
		}

		let lines:string[] = this.rawContent.split(/\n/);
		let numsz = Math.ceil(Math.log10(lines.length));
		for (let n = 0; n < lines.length; n++)
		{
			let pfx = (n + 1).toString();
			while (pfx.length < numsz) pfx = ' ' + pfx;
			lines[n] = pfx + ': ' + lines[n];
		}

		let pre = $('<pre></pre>').appendTo(this.divRawText);
		pre.css('padding', '0.5em');
		pre.text(lines.join('\n'));
	}

	// redraws the molecular structure as interpreted, if possible
	private redrawMolecule():void
	{
		this.divMolecule.empty();

		if (MolUtil.isBlank(this.showMol))
		{
			this.divMolecule.text('No molecular structure available.');
			return;
		}

		let policy = RenderPolicy.defaultColourOnWhite();
		policy.data.pointScale = 25;
		let effects = new RenderEffects();
		let measure = new OutlineMeasurement(0, 0, policy.data.pointScale);
		let layout = new ArrangeMolecule(this.showMol, measure, policy, effects);
		layout.arrange();
		layout.squeezeInto(0, 0, 500, 500);
		let metavec = new MetaVector();
		new DrawMolecule(layout, metavec).draw();
		metavec.normalise();
		$(metavec.createSVG()).appendTo(this.divMolecule);
	}

	// redraws the explanation of what worked or didn't
	private redrawExplain():void
	{
		this.divExplain.empty();
		
		let lines:string[] = [];
		if (this.errorMsg) lines.push(this.errorMsg);
		if (this.openSpec) 
		{
			lines.push('OpenMolecule Level ' + this.openSpec.level);
			for (let note of this.openSpec.notes)
			{
				lines.push('Spec#' + note.type + ':' + note.atoms + '/' + note.bonds); // !!
			}
		}

		this.divExplain.html(lines.join('<br>'));
	}
} 