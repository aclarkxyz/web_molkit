/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

import {yieldDOM} from '@wmk/util/util';

/*
	Storage class for a sequence of tests. Use pattern: inherit the class, and add each of the tests (callback functions) in the constructor; hand over the 
	instance to an execution environment that calls each of them in turn.
*/

export interface ValidationTest
{
	title:string;
	func:() => void;
}

export interface ValidationContext
{
	subcategory?:string;
	row?:number; // typically 1..{count}
	count?:number; // usually # rows in datasheet
	notes?:string[]; // arbitrary strings, <svg> autodetected
}

export class Validation
{

	// the tests themselves 
	private tests:ValidationTest[] = []; 

	// failure during setup process
	public setupError:any = null;

	// results from the most recently run test
	private recentSuccess:boolean; // true if test succeeded
	private recentError:string; // what went wrong, or null if no information
	private recentTimeTaken:number; // in seconds

	// validation tests can use this to store situational data, especially when subsequent tests re-use data from previous tests
	public rec:Record<string, any> = {};

	// each test should set this value before doing anything interesting, in order to provide feedback when something goes wrong
	public context:ValidationContext = null;

	// ------------ public methods ------------

	constructor()
	{
	}

	// override these to perform initialisation/de-initialisation tasks; these can include asynchronous calls, such as loading files
	public async init():Promise<void>
	{
	}
	public async deinit():Promise<void>
	{
	}

	// adds a test to the list; note that when it gets called, 'this' will be set to the object instance
	public add(title:string, func:() => void):void
	{
		this.tests.push({title, func});
	}

	// external access to tests, with the intention of running them and obtaining results
	public get count():number {return this.tests.length;}
	public getTitle(idx:number):string {return this.tests[idx].title;}

	// executes a test: the return value indicates whether it succeeded, the error message (if any), and the time taken to execute
	public async runTest(idx:number):Promise<[boolean, string, number]>
	{
		this.recentSuccess = true;
		this.recentError = null;
		
		let timeStarted = new Date().getTime();

		try 
		{
			this.context = null; // the test itself should replace this if possible
			await this.tests[idx].func.call(this);
		}
		catch (e)
		{
			// two scenarios: rogue exceptions that happened during the validation are caught and converted into error messages with debug
			// information; and failed assertions, which percolate up, after having already detailed the cause
			this.recentSuccess = false;
			if (this.recentError == null)
			{
				console.log('Context: ' + JSON.stringify(this.context, null, 4));
				this.recentError = 'Exception: ' + (e.message || e);
				if (e.fileName) this.recentError += ', file: ' + e.fileName;
				if (e.lineNumber) this.recentError += ', line: ' + e.lineNumber;
				//console.log('Unhandled exception in validation:\n' + (e.stack || e));
				console.log('Unhandled exception in validation:');
				console.log(e);
			}
		}

		let timeFinished = new Date().getTime();

		this.recentTimeTaken = (timeFinished - timeStarted) / 1000;

		await this.gasp();

		return [this.recentSuccess, this.recentError, this.recentTimeTaken];
	}

	// call this to give the DOM a chance to update itself
	public async gasp()
	{
		await yieldDOM();
	}

	// fail conditions: these methods should be called to make sure some condition is met
	public assert(condition:boolean, message?:string):void
	{
		if (condition) return;
		this.recentError = message;
		throw new Error('assert condition triggered');
	}
	public assertEqual(got:any, want:any, message?:string):void
	{
		if (got == want) return;
		this.recentError = message;

		if (typeof got == 'string' && typeof want == 'string')
		{
			if (!this.recentError) this.recentError = `Compare got [${got}] with want [${want}]`;
			for (let n = 0; n < Math.min(got.length, want.length); n++) if (got.charAt(n) != want.charAt(n))
			{
				this.recentError += ` differ at char ${n} (0-based)`;
				let frag1 = got.substring(Math.max(0, n - 10), Math.min(got.length, n + 10));
				let frag2 = got.substring(Math.max(0, n - 10), Math.min(got.length, n + 10));
				this.recentError += ` regions: [${frag1}] vs [${frag2}]`;
			}
		}

		throw new Error('assert equal triggered');
	}
	public assertNull(thing:any, message?:string)
	{
		if (thing == null) return;
		this.recentError = message;
		throw new Error('assert null triggered');
	}
	public assertNotNull(thing:any, message?:string)
	{
		if (thing != null) return;
		this.recentError = message;
		throw new Error('assert not null triggered');
	}
	public fail(message?:string):void
	{
		this.recentError = message;
		throw new Error('failure triggered');
	}

	// ------------ private methods ------------
}

