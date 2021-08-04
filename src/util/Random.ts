/*
    WebMolKit

    (c) 2010-2021 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	Pseudorandom number generator. Uses an implementation of linear congruential generator.
*/

export class Random
{
	private m = 0x8000000;
	private invMN = 1.0 / (this.m - 1);
	private a = 1103515245;
	private c = 5425153011;
	private state:number;

	constructor(private seed:number = null)
	{
		if (seed == null)
			this.state = Math.floor(Math.random() * (this.m - 1));
		else
			this.state = seed;
  	}

	// returns a positive 31-bit integer
	public next():number
	{
		this.state = (this.a * this.state + this.c) % this.m;
		return this.state;
	}

	// returns an integer between 0 and max-1
	public int(max:number):number
	{
		return max <= 0 ? 0 : this.next() % max;
	}

	// returns a floating point integer between 0 and 1
	public float():number
	{
		return this.next() * this.invMN;
	}

	// returns a number between 0 and length-1 of the given array
	public index(arr:any[]):number
	{
		if (Vec.isBlank(arr)) return null;
		return this.int(arr.length);
	}

	// returns a randomly selected element from an array
	public peek<T>(arr:T[]):T
	{
		if (Vec.isBlank(arr)) return null;
		return arr[this.int(arr.length)];
	}

	// returns a randomly selected element from an array, and also removes it
	public pull<T>(arr:T[]):T
	{
		if (Vec.isBlank(arr)) return null;
		let idx = this.int(arr.length), val = arr[idx];
		arr.splice(idx, 1);
		return val;
	}
}

/* EOF */ }