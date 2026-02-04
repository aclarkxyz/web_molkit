/*
    WebMolKit

    (c) 2010-2021 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {deepClone} from './util';
import {Vec} from './Vec';

/*
	Pseudorandom number generator. An implementation of the Mersenne Twister which is based on pseudocode from the Wikipedia page. This is a superior
	alternative to simplistic linear generators, which can have annoying habits like repeating the same number for certain mod values. This implementation
	produces good results for general use, as measured empirically by the unit test, but of course don't use it for anything like cryptography.
*/

const MT_n = 624
const MT_m = 397
const MT_w = 32
const MT_r = 31
const MT_UMASK = (0xFFFFFFFF << MT_r);
const MT_LMASK = (0xFFFFFFFF >> (MT_w - MT_r));
const MT_a = 0x9908B0DF;
const MT_u = 11;
const MT_s = 7;
const MT_t = 15;
const MT_l = 18;
const MT_b = 0x9D2C5680;
const MT_c = 0xEFC60000;
const MT_f = 1812433253;
const MT_max = 0x7FFFFFFF;
const MT_invmax = 1.0 / MT_max;

export interface RandomState
{
	array:number[];
	index:number;
}

export class Random
{
	private state:RandomState;

	constructor(seedOrState:number | RandomState = null)
	{
		if (seedOrState == null || seedOrState === 0) seedOrState = Math.floor(Math.random() * 65535);

		if (typeof seedOrState == 'number')
		{
			let array:number[] = new Array(MT_n);
			let seed = array[0] = 19650218 + seedOrState;
			for (let i = 1; i < MT_n; i++)
			{
				array[i] = seed = MT_f * (seed ^ (seed >> (MT_w - 2))) + i;
			}
			this.state = {array, index: 0};
		}
		else
		{
			const {array, index} = seedOrState;
			if (Array.isArray(array) && typeof index == 'number') 
				this.state = {array: [...array], index};
			else
				throw new Error('Invalid random state.');
		}
  	}

	// extract the current state for posterity, so we can create a new generator that restarts at the same place
	public getState():RandomState
	{
		return deepClone(this.state);
	}

	// returns a positive 31-bit integer
	public next():number
	{
		const {array} = this.state;
		let k = this.state.index;

		let j = k - (MT_n - 1);
		if (j < 0) j += MT_n;

		let x = (array[k] & MT_UMASK) | (array[j] & MT_LMASK);
		let xA = x >> 1;
		if (x & 0x00000001) xA ^= MT_a;

		j = k - (MT_n - MT_m);
		if (j < 0) j += MT_n;

		x = array[j] ^ xA;
		array[k++] = x;
		
		if (k >= MT_n) k = 0;
		this.state.index = k;

		let y = x ^ (x >> MT_u);
        y = y ^ ((y << MT_s) & MT_b);
        y = y ^ ((y << MT_t) & MT_c);
    	let z = y ^ (y >> MT_l);
		return z;
	}

	// returns an integer between 0 and max-1
	public int(max:number):number
	{
		return max <= 0 ? 0 : this.next() % max;
	}

	// returns a floating point integer between 0 and 1
	public float():number
	{
		return this.next() * MT_invmax;
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

