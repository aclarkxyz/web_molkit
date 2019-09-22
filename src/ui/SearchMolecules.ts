/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../rpc/Search.ts'/>
///<reference path='Widget.ts'/>
///<reference path='ViewStructure.ts'/>
///<reference path='Tooltip.ts'/>

namespace WebMolKit /* BOF */ {

/*
	SearchMolecules: handles the process of sending molecule search requests to the server, and rendering
	the results efficiently.
*/

interface ResultSearchSketch
{
	molNative:string;
	moleculeID:number[];
	viewMol?:ViewStructure;
}

interface ResultDataSource
{
	datasheetID:number;
	row:number;
	title:string;
	descr:string;
	subTitle:string;
}

interface ResultSearchMolecule
{
	batchID:number;
	sketches:ResultSearchSketch[];
	sources:ResultDataSource[];

	tr?:JQuery;
	td?:JQuery;
}

export class SearchMolecules extends Widget
{
	public static TYPE_EXACT = 'exact';
	public static TYPE_SUBSTRUCTURE = 'substructure';
	public static TYPE_SIMILARITY = 'similarity';
	public static TYPE_RANDOM = 'random';

	private molsearchToken:string = null;
	private cancelled = false;
	private started = false;
	private finished = false;
	private progress = 0;
	private count = 0;

	private results:ResultSearchMolecule[] = [];
	private table:JQuery;
	private placeholder:JQuery;

	public callbackStop:(source?:SearchMolecules) => void = null;
	public callbackProgress:(progress:number, count:number, source?:SearchMolecules) => void = null;
	public callbackMol:(moleculeID:number[], mol:Molecule, source?:SearchMolecules) => void = null;
	public callbackDS:(datasheetID:number, source?:SearchMolecules) => void = null;

	constructor(private tokenID:string)
	{
		super();
	}

	// create the objects necessary to render the widget; this should be called as early as possible - before starting the
	// searching operation
	public render(parent:any)
	{
		super.render(parent);

		let tableStyle = 'border-collapse: collapse;';
		this.table = $('<table></table>').appendTo(this.content);
		this.table.attr('style', tableStyle);
	}

	// once the widget is rendered, can start the searching anytime; type is one of TYPE_*
	public startSearch(origin:string, mol:Molecule, type:string, maxResults = 100):void
	{
		this.cancelled = false;
		this.results = [];
		this.table.empty();

		this.placeholder = $('<tr><td>Starting search...</td></tr>').appendTo(this.table);

		let molstr = mol == null ? null : mol.toString();
		let param = {'origin': origin, 'molNative': molstr, 'type': type, 'maxResults': maxResults};
		Search.startMolSearch(param, (result:any, error:ErrorRPC) =>
		{
			if (error != null) throw 'molsync.ui.SearchMolecules: failed to initiate search: ' + error.message;

			this.molsearchToken = result.molsearchToken;

			//console.log('STARTED: ' + this.molsearchToken);

			this.started = true;
			this.finished = false;

			Search.pollMolSearch({'molsearchToken': this.molsearchToken}, () => this.batchSearch(result, error));
		});
	}

	// if the search is running, make it not so
	public stopSearch()
	{
		if (this.placeholder) {this.placeholder.remove(); this.placeholder = null;}

		this.cancelled = true;
		this.finished = true;

		if (this.callbackStop) this.callbackStop(this);
	}

	// returns true if the search is happening right now
	public isRunning()
	{
		return this.started && !this.finished;
	}

	// callback for search results acquired
	private batchSearch(result:any, error:ErrorRPC):void
	{
		if (this.placeholder) {this.placeholder.remove(); this.placeholder = null;}

		if (error != null) throw 'molsync.ui.SearchMolecules: failed to obtain next batch: ' + error.message;

		if (this.cancelled) return;

		this.finished = result.finished;
		this.progress = result.progress;
		this.count = result.count;

		if (result.modified) this.updateResults(result.results);

		//console.log('BATCH:'+this.progress+'/'+this.count+', results='+result.results.length);

		if (!this.finished)
		{
			Search.pollMolSearch({'molsearchToken': this.molsearchToken}, (result:any, error:ErrorRPC) => this.batchSearch(result, error));
			if (this.callbackProgress) this.callbackProgress(this.progress, this.count, this);
		}
		else
		{
			if (this.callbackStop) this.callbackStop(this);
		}
	}

	// results have come in: need to create or reuse content as necessary
	private updateResults(results:any[]):void
	{
		for (let n = 0; n < results.length; n++)
		{
			let res = results[n];
			res.tr = $('<tr></tr>').appendTo(this.table);
			res.td = $('<td></td>').appendTo(res.tr);
			if (n > 0) res.td.css('border-top', '1px solid #80C080');
			if (n < results.length - 1) res.td.css('border-bottom', '1px solid #80C080');

			let table = $('<table></table>').appendTo(res.td), tr = $('<tr></tr>').appendTo(table);

			if (res.similarity)
			{
				let td = $('<td></td>').appendTo(tr);
				let txt = res.similarity == 1 ? '100%' : (res.similarity * 100).toFixed(1) + '%';
				td.text(txt);
			}

			for (let sk of res.sketches)
			{
				let td = $('<td></td>').appendTo(tr);
				let vs = this.grabSketch(td, sk.molNative, sk.moleculeID);
				sk.viewMol = vs;
			}

			let td = $('<td></td>').appendTo(tr);
			//td.append('batchID:'+row.batchID);
			for (let src of res.sources)
			{
				let link = $('<a href="#' + src.datasheetID + '"></a>').appendTo(td);
				link.mouseenter((e:any) => e.target.style.backgroundColor = '#D0D0D0');
				link.mouseleave((e:any) => e.target.style.backgroundColor = 'transparent');

				let title = src.subTitle ? src.subTitle : src.title ? src.title : 'DataSheet#' + src.datasheetID;

				link.text(title); // truncate if long? or don't worry about it?

				let body = '';
				if (src.title && src.title != title) body += '<div>Title: <i>' + escapeHTML(src.title) + '</i></div>';
				if (src.descr) body += '<div>Description: <i>' + escapeHTML(src.descr) + '</i></div>';
				body += '<div>Row ' + src.row + '</div>';
				addTooltip(link, body, escapeHTML(title));

				link.click(() => {if (this.callbackDS) this.callbackDS(src.datasheetID, this);});
				td.append(' ');
			}
		}

		for (let res of this.results) res.tr.remove();
		this.results = results;
	}

	// see if the heavyweight ViewStructure instance already exists in the old rows, and if so, bogart it; otherwise, create
	// a new one and queue up the rendering
	private grabSketch(parent:JQuery, molNative:string, moleculeID:number[]):ViewStructure
	{
		for (let res of this.results) for (let sk of res.sketches)
		{
			for (let mid of moleculeID) if (sk.moleculeID.indexOf(mid) >= 0 && sk.viewMol != null)
			{
				sk.viewMol.content.appendTo(parent);
				return sk.viewMol;
			}
		}

		const vs = new ViewStructure(this.tokenID);
		vs.content = parent; // (prime the pump, before it gets rendered)
		vs.defineMoleculeString(molNative);
		vs.borderCol = -1;
		vs.backgroundCol1 = 0xF8F8F8;
		vs.backgroundCol2 = 0xE0E0E0;
		vs.padding = 4;

		vs.setup(() =>
		{
			vs.render(parent);
			vs.content.css('cursor', 'pointer');

			vs.content.click(() =>
			{
				if (this.callbackMol) this.callbackMol(moleculeID, Molecule.fromString(molNative));
			});

			//vs.addTooltip('Molecule ID#' + entries[n].moleculeID);
		});

		return vs;
	}
}

/* EOF */ }