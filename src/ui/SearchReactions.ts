/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='Widget.ts'/>
///<reference path='ViewStructure.ts'/>
///<reference path='Tooltip.ts'/>
///<reference path='../rpc/Search.ts'/>

/*
	SearchReactions: handles the process of sending reaction search requests and rendering the results.
*/

interface ResultSearchReaction
{
	batchID:number;
	dataXML:string;
	datasheetID:number;
	row:number;

	tr?:JQuery;
	td?:JQuery;
	viewRxn?:ViewStructure;
}

class SearchReactions extends Widget
{
	public static TYPE_COMPONENT = 'component';
	public static TYPE_TRANSFORM = 'transform';
	public static TYPE_SIMILARITY = 'similarity';
	public static TYPE_RANDOM = 'random';
	
	private rxnsearchToken:string = null;
	private cancelled = false;
	private started = false;
	private finished = false;
	private progress = 0;
	private count = 0;
	
	private results:ResultSearchReaction[] = [];
	private table:JQuery;
	private placeholder:JQuery;
	
	callbackStop:(source?:SearchReactions) => void = null;
	masterStop:any = null;
	callbackProgress:(progress:number, count:number, source?:SearchReactions) => void = null;
	masterProgress:any = null;
	callbackRxn:(dataXML:string, datasheetID:number, row:number, source?:SearchReactions) => void = null;
	masterRxn:any = null;
	callbackDS:(datasheetID:number, source?:SearchReactions) => void = null;
	masterDS:any = null;

	public onStop(callback:(source?:SearchReactions) => void, master:any)
	{
		this.callbackStop = callback;
		this.masterStop = master;
	}
	public onProgress(callback:(progress:number, count:number, source?:SearchReactions) => void, master:any)
	{
		this.callbackProgress = callback;
		this.masterProgress = master;
	}
	public onClickReaction(callback:(dataXML:string, datasheetID:number, row:number, source?:SearchReactions) => void, master:any)
	{
		this.callbackRxn = callback;
		this.masterRxn = master;
	}
	public onClickDataSheet(callback:(datasheetID:number, source?:SearchReactions) => void, master:any)
	{
		this.callbackDS = callback;
		this.masterDS = master;
	}
	
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
	public startSearch(origin:string, mol1:Molecule, mol2:Molecule, type:string, maxResults = 100):void
	{
		this.cancelled = false;
		this.results = [];
		this.table.empty();
		
		this.placeholder = $('<tr><td>Starting search...</td></tr>').appendTo(this.table);
		
		let molstr1 = mol1 == null ? null : mol1.toString();
		let molstr2 = mol2 == null ? null : mol2.toString();
		let param = {'origin': origin, 'molNative1': molstr1, 'molNative2': molstr2, 'type': type, 'maxResults': maxResults};
		Search.startRxnSearch(param, function(result:any, error:ErrorRPC)
		{
			if (error != null) throw 'molsync.ui.SearchReactions: failed to initiate search: ' + error.message;

			this.rxnsearchToken = result.rxnsearchToken;
			
			//console.log('STARTED: ' + this.molsearchToken);
			
			this.started = true;
			this.finished = false;
			
			Search.pollRxnSearch({'rxnsearchToken': this.rxnsearchToken}, this.batchSearch, this);
		}, this);
	}
	
	// if the search is running, make it not so
	public stopSearch()
	{
		if (this.placeholder) {this.placeholder.remove(); this.placeholder = null;}
		
		this.cancelled = true;
		this.finished = true;
		
		if (this.callbackStop) this.callbackStop.call(this.masterStop, this);
	}
	
	// returns true if the search is happening right now
	public isRunning()
	{
		return this.started && !this.finished;
	}
	
	// callback for search results acquired	
	private batchSearch(result:any, error:ErrorRPC):void
	{
		if (error != null) throw 'molsync.ui.SearchReactions: failed to obtain next batch: ' + error.message;

		if (this.cancelled) return;
		
		this.finished = result.finished;
		this.progress = result.progress;
		this.count = result.count;
		
		if (result.modified) 
		{
			if (this.placeholder) {this.placeholder.remove(); this.placeholder = null;}
			this.updateResults(result.results);
		}
		
		//console.log('BATCH:'+this.progress+'/'+this.count+', results='+result.results.length);
		
		if (!this.finished) 
		{
			Search.pollRxnSearch({'rxnsearchToken': this.rxnsearchToken}, this.batchSearch, this);
			if (this.callbackProgress) this.callbackProgress.call(this.masterProgress, this.progress, this.count, this);
		}
		else
		{
			if (this.placeholder) {this.placeholder.remove(); this.placeholder = null;}
			if (this.callbackStop) this.callbackStop.call(this.masterStop, this);
		}
	}
	
	// results have come in: need to create or reuse content as necessary
	private updateResults(results:any[]):void
	{
		let self = this;
		
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

			if (res.dataXML)
			{
				let td = $('<td></td>').appendTo(tr);
				let vs = this.grabSketch(td, res.dataXML, res.datasheetID, res.row, res.batchID);
				res.viewRxn = vs;
			}
			
			let td = $('<td></td>').appendTo(tr);

			let link = $('<a href="#' + res.datasheetID + '"></a>').appendTo(td);
			link.mouseenter(function(e:any) {e.target.style.backgroundColor = '#D0D0D0';});
			link.mouseleave(function(e:any) {e.target.style.backgroundColor = 'transparent';});
			
			let title = res.subTitle ? res.subTitle : res.title ? res.title : 'DataSheet#' + res.datasheetID;
			
			link.text(title); // truncate if long? or don't worry about it?
			
			let body = '';
			if (res.title && res.title != title) body += '<div>Title: <i>' + escapeHTML(res.title) + '</i></div>';
			if (res.descr) body += '<div>Description: <i>' + escapeHTML(res.descr) + '</i></div>';
			//body += '<div>Row ' + res.row + '</div>'; (not applicable: they're always snipped to singletons anyway)
			addTooltip(link, body, escapeHTML(title));
			
			link.click(function()
			{
				if (self.callbackDS) self.callbackDS(res.datasheetID, self);
			});
			td.append(' ');
		}
		
		for (let res of this.results) res.tr.remove();
		this.results = results;
	}
	
	// see if the heavyweight ViewStructure instance already exists in the old rows, and if so, bogart it; otherwise, create
	// a new one and queue up the rendering
	private grabSketch(parent:JQuery, dataXML:string, datasheetID:number, row:number, batchID:number):ViewStructure
	{
		for (let res of this.results) if (res.batchID == batchID) 
		{
			res.viewRxn.content.appendTo(parent);
			return res.viewRxn;
		}
		
		const vs = new ViewStructure(this.tokenID);
		vs.content = parent; // (prime the pump, before it gets rendered)
		vs.defineDataSheetString(dataXML, 0);
		vs.borderCol = -1;
		vs.backgroundCol1 = 0xF8F8F8;
		vs.backgroundCol2 = 0xE0E0E0;
		vs.padding = 4;
		
		vs.setup(function()
		{
			vs.render(parent);
			vs.content.css('cursor', 'pointer');
			
			const self = this;
			vs.content.click(function()
			{
				if (self.callbackRxn) self.callbackRxn(dataXML, datasheetID, row, self);
			});
			// NOTE: would also be nice to have individual molecules clickable...
		}, this);
		
		return vs;
	}
}




