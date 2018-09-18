/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../../src/util/util.ts'/>

namespace WebMolKit /* BOF */ {

/*
    Storage class for a sequence of tests. Use pattern: inherit the class, and add each of the tests (callback functions) in the constructor; hand over the 
    instance to an execution environment that calls each of them in turn.
*/

export interface ValidationTest
{
    title:string;
    func:() => void;
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
    public rec:{[id:string] : any} = {};

	// ------------ public methods ------------

    constructor()
    {
    }

    // override this to perform initialisation tasks; these can include asynchronous calls, such as loading files; be sure to call
    // the completion function once it's ready
    public init(donefunc:() => void):void
    {
        donefunc.call(this);
    }

    // adds a test to the list; note that when it gets called, 'this' will be set to the object instance
    public add(title:string, func:() => void):void
    {
        this.tests.push({'title': title, 'func': func});
    }

    // external access to tests, with the intention of running them and obtaining results
    public get count():number {return this.tests.length;}
    public getTitle(idx:number):string {return this.tests[idx].title;}

    // executes a test: the return value indicates whether it succeeded, the error message (if any), and the time taken to execute
    public runTest(idx:number):[boolean, string, number]
    {
        this.recentSuccess = true;
        this.recentError = null;
        
        let timeStarted = new Date().getTime();

        try {this.tests[idx].func.call(this);}
        catch (e)
        {
            // two scenarios: rogue exceptions that happened during the validation are caught and converted into error messages with debug
            // information; and failed assertions, which percolate up, after having already detailed the cause
            this.recentSuccess = false;
            if (this.recentError == null)
            {
                let error = <Error>e;
                this.recentError = 'Exception: ' + e.message;
                if (e.fileName) this.recentError += ', file: ' + e.fileName;
                if (e.lineNumber) this.recentError += ', line: ' + e.lineNumber;
                console.log('Unhandled exception in validation:\n' + e.stack);
            }
        }

        let timeFinished = new Date().getTime();

        this.recentTimeTaken = (timeFinished - timeStarted) / 1000;

        return [this.recentSuccess, this.recentError, this.recentTimeTaken];
    }

    // fail conditions: these methods should be called to make sure some condition is met
    public assert(condition:boolean, message?:string):void
    {
        if (condition) return;
        this.recentError = message;
        throw '!';
    }
    public assertEqual(thing1:any, thing2:any, message?:string):void
    {
        if (thing1 == thing2) return;
        this.recentError = message;
        throw '!';
    }
    public assertNull(thing:any, message?:string)
    {
        if (thing == null) return;
        this.recentError = message;
        throw '!';
    }
    public assertNotNull(thing:any, message?:string)
    {
        if (thing != null) return;
        this.recentError = message;
        throw '!';
    }
    public fail(message?:string):void
    {
        this.recentError = message;
        throw '!';
    }

	// ------------ private methods ------------
}

/* EOF */ }