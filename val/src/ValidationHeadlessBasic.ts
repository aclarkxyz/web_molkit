/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../../src/util/util.ts'/>
///<reference path='../../src/util/Vec.ts'/>
///<reference path='Validation.ts'/>

/*
    Headless validation: basic tests - simple things like vector operators and common utilities.
*/

class ValidationHeadlessBasic extends Validation
{
	constructor()
	{
		super();
		this.add('Vector index sort', this.vectorIndexSort);
		//this.add('fubar', this.fubar);
	}

	public vectorIndexSort()
	{
		let array = ['b', 'c', 'a'];
		let idx = Vec.idxSort(array);
		this.assert(Vec.equals(idx, [2, 0, 1]));
	}

	//public fubar() {/*this.fail('hardwired to fubar');*/ let thing:any = 'zog'; thing.length();}
}
