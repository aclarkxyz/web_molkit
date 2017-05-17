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

interface DemoOpenMolCase
{
	fn:string;
	title:string;
}

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
	private divDemo:JQuery;

	private charSpans:{[id:string] : JQuery} = {}; // lookup format is '{row}:{col}'
	private selected:OpenMolNote = null;
	private atomHighlight:number[] = null;
	private bondHighlight:number[] = null;

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

		/*p = $('<p></p>').appendTo(root);
		let btnExample = $('<button class="button button-default">Example</button>').appendTo(p);
		btnExample.click(function() {self.actionExample();});*/

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

		this.divDemo = $('<div></div>').appendTo(root);

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

	// add clickable demo molecules
	public addDemoSection(title:string, cases:DemoOpenMolCase[]):void
	{
		const self = this;

		this.divDemo.append('<h2>' + escapeHTML(title) + '</h2>');
		
		let ul = $('<ul></ul>').appendTo($('<p></p>').appendTo(this.divDemo));
		for (let demo of cases)
		{
			let li = $('<li></li>').appendTo(ul);
			let ahref = $('<a></a>').appendTo(li);
			const fn = '../test/' + demo.fn;
			ahref.attr('href', fn);
			ahref.text(demo.title);
			ahref.click(function():boolean
			{
				self.loadMolecule(fn);
				return false;
			});
		}
	}

	// ------------ private methods ------------

	private loadMolecule(fn:string):void
	{
		const self = this;
		$.ajax(
		{
			'url': fn, 
			'type': 'GET',
			'dataType': 'text',
			'success': function(molText:string) {self.pasteContent(molText);},
			'error': function() {alert('Unable to load file: ' + fn);}
		});
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

		let pre = $('<pre></pre>').appendTo(this.divRawText);
		pre.css('padding', '0.5em');

		this.charSpans = {};

		for (let r = 0; r < lines.length; r++)
		{
			let pfx = (r + 1).toString();
			while (pfx.length < numsz) pfx = ' ' + pfx;
			let span = $('<span></span>').appendTo(pre);
			span.text(pfx + ':');
			span.css('color', '#808080');
			span.css('background-color', '#D0D0D0');
			span.css('border-right', 'solid 1px #808080');
			span.css('margin-right', '0.2em');

			for (let c = 0; c < lines[r].length; c++)
			{
				span = $('<span></span>').appendTo(pre);
				this.charSpans[`${r}:${c}`] = span;
				span.text(lines[r].charAt(c));
			}

			pre.append('\n');
		}
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

		if (this.atomHighlight) for (let a of this.atomHighlight) this.drawAtomShade(metavec, layout, a, 0xC0C0FF);
		if (this.bondHighlight) for (let b of this.bondHighlight) this.drawBondShade(metavec, layout, b, 0xC0C0FF);
		
		new DrawMolecule(layout, metavec).draw();
		metavec.normalise();
		$(metavec.createSVG()).appendTo(this.divMolecule);
	}

	// redraws the explanation of what worked or didn't
	private redrawExplain():void
	{
		const self = this;

		this.divExplain.empty();
		
		if (this.errorMsg) 
		{
			let div = $('<div></div>').appendTo(this.divExplain);
			div.text(this.errorMsg);
		}
		if (this.openSpec) 
		{
			let div = $('<div></div>').appendTo(this.divExplain);
			div.text('OpenMolecule Level ' + this.openSpec.level);

			for (let n = 0; n < this.openSpec.notes.length; n++)
			{
				const note = this.openSpec.notes[n];
				let div = $('<div></div>').appendTo(this.divExplain), span = $('<span></span>').appendTo(div);
				span.text(this.describeNote(note));
				span.mouseenter(function() 
				{
					span.css('background-color', '#C0C0FF');
					self.activateNote(note);
					self.refreshMoleculeHighlights();
				});
				span.mouseleave(function() 
				{
					span.css('background-color', 'transparent');
					self.deactivateNote();
					self.refreshMoleculeHighlights();
				});
			}
		}
	}

	// readable text description of a note
	private describeNote(note:OpenMolNote):string
	{
		let txt = '?';
		if (note.type == OpenMolType.AtomCount1000) txt = 'AtomCount>999';
		else if (note.type == OpenMolType.BondCount1000) txt = 'BondCount>999';
		else if (note.type == OpenMolType.MoleculeName) txt = 'MoleculeName';
		else if (note.type == OpenMolType.QueryResonance) txt = 'QueryResonance';
		else if (note.type == OpenMolType.QueryHCount) txt = 'QueryHCount';
		else if (note.type == OpenMolType.InlineAbbreviations) txt = 'InlineAbbreviations';
		else if (note.type == OpenMolType.ZeroOrderBonds) txt = 'ZeroOrderBonds';
		else if (note.type == OpenMolType.HydogenCounting) txt = 'HydogenCounting';

		if (note.atoms) txt += ' Atoms:' + note.atoms;
		if (note.bonds) txt += ' Bonds:' + note.bonds;
		if (note.level) txt += ' Level:' + note.level;

		return txt;
	}	

	// a note has been selected: update the text/molecule highlighting
	private activateNote(note:OpenMolNote):void
	{
		this.deactivateNote();

		this.selected = note;
		if (note.source) for (let src of note.source)
		{
			for (let n = 0; n < src.len; n++)
			{
				let key = src.row + ':' + (src.col + n);
				let span = this.charSpans[key];
				if (span) span.css('background-color', '#C0C0FF');
			}
		}
	}

	// deselect the current note, if any
	private deactivateNote():void
	{
		if (this.selected != null && this.selected.source != null)
		{
			for (let src of this.selected.source)
			{
				for (let n = 0; n < src.len; n++)
				{
					let key = src.row + ':' + (src.col + n);
					let span = this.charSpans[key];
					if (span) span.css('background-color', 'transparent');
				}
			}
		}
		this.selected = null;
	}

	// see if the selected note is in sync with highlight atoms/bonds, and redraw if not so
	private refreshMoleculeHighlights():void
	{
		let atoms = this.selected ? this.selected.atoms : null;
		let bonds = this.selected ? this.selected.bonds : null;
		if (Vec.equivalent(atoms, this.atomHighlight) && Vec.equivalent(bonds, this.bondHighlight)) return;
		this.atomHighlight = atoms;
		this.bondHighlight = bonds;
		this.redrawMolecule();
	}

	// draws an ellipse around an atom/bond, for highlighting purposes
	private drawAtomShade(metavec:MetaVector, layout:ArrangeMolecule, atom:number, fillCol:number):void
	{
		let p:APoint = null;
		for (let n = 0; n < layout.numPoints(); n++) if (layout.getPoint(n).anum == atom)
		{
			p = layout.getPoint(n);
			break;
		}
		if (p == null) return;

		let scale = layout.getPolicy().data.pointScale;
		let minRad = 0.2 * scale, minRadSq = sqr(minRad);
		let cx = p.oval.cx, cy = p.oval.cy;
		let rad = Math.max(minRad, Math.max(p.oval.rw, p.oval.rh)) + 0.1 * scale;

		metavec.drawOval(cx, cy, rad, rad, -1, 0, fillCol);
	}
	private drawBondShade(metavec:MetaVector, layout:ArrangeMolecule, bond:number, fillCol:number):void
	{
		let x1 = 0, y1 = 0, x2 = 0, y2 = 0, nb = 0, sz = 0;
		let scale = layout.getPolicy().data.pointScale;
		for (let n = 0; n < layout.numLines(); n++) 
		{
			let l = layout.getLine(n);
			if (l.bnum != bond) continue;
			x1 += l.line.x1; y1 += l.line.y1; x2 += l.line.x2; y2 += l.line.y2;
			nb++;
			sz += l.size + 0.2 * scale;
		}
		if (nb == 0) return;
		
		let invNB = 1 / nb;
		sz *= invNB;
		x1 *= invNB;
		y1 *= invNB;
		x2 *= invNB;
		y2 *= invNB;

		let dx = x2 - x1, dy = y2 - y1, invDist = 1 / norm_xy(dx, dy);
		dx *= invDist; 
		dy *= invDist;
		let ox = dy, oy = -dx;

		let px:number[] = [], py:number[] = [], ctrl:boolean[] = [];
		let plot = function(x:number, y:number, c:boolean) {px.push(x); py.push(y); ctrl.push(c);}
		
		let path = new Path2D(), mx:number, my:number, CIRC = 0.8;
		plot(x1 + ox * sz, y1 + oy * sz, false);
		
		mx = x1 + (ox * sz - dx * sz) * CIRC;
		my = y1 + (oy * sz - dy * sz) * CIRC;
		plot(mx, my, true);
		plot(x1 - dx * sz, y1 - dy * sz, false);
		
		mx = x1 + (-ox * sz - dx * sz) * CIRC;
		my = y1 + (-oy * sz - dy * sz) * CIRC;
		plot(mx, my, true);
		plot(x1 - ox * sz, y1 - oy * sz, false);
		plot(x2 - ox * sz, y2 - oy * sz, false);
		
		mx = x2 + (-ox * sz + dx * sz) * CIRC;
		my = y2 + (-oy * sz + dy * sz) * CIRC;
		plot(mx, my, true);
		plot(x2 + dx * sz, y2 + dy * sz, false);
		
		mx = x2 + (ox * sz + dx * sz) * CIRC;
		my = y2 + (oy * sz + dy * sz) * CIRC;
		plot(mx, my, true);
		plot(x2 + ox * sz, y2 + oy * sz, false);

		metavec.drawPath(px, py, ctrl, true, -1, 0, 0xC0C0FF, false);
	}
} 