/*
    WebMolKit

    (c) 2010-2017 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

/* eslint-disable comma-spacing */

namespace WebMolKit /* BOF */ {

/*
	Functions that operate on arrays, for performing routine tasks.
*/

export class Vec
{
	public static isBlank(arr:any[]):boolean {return arr == null || arr.length == 0;}
	public static notBlank(arr:any[]):boolean {return arr != null && arr.length > 0;}
	public static safeArray<T>(arr:T[]):T[] {return arr == null ? [] : arr;}
	public static arrayLength(arr:any[]):number {return arr == null ? 0 : arr.length;}

	public static anyTrue(arr:boolean[]):boolean
	{
		if (arr == null) return false;
		for (let v of arr) if (v) return true;
		return false;
	}
	public static allTrue(arr:boolean[]):boolean
	{
		if (arr == null) return true;
		for (let v of arr) if (!v) return false;
		return true;
	}

	public static anyFalse(arr:boolean[]):boolean
	{
		if (arr == null) return false;
		for (let v of arr) if (!v) return true;
		return false;
	}
	public static allFalse(arr:boolean[]):boolean
	{
		if (arr == null) return true;
		for (let v of arr) if (v) return false;
		return true;
	}

	public static swap(arr:any[], idx1:number, idx2:number):void
	{
		let v = arr[idx1];
		arr[idx1] = arr[idx2];
		arr[idx2] = v;
	}

	// make a shallow copy of the array, or turn it into a blank array if null
	public static duplicate<T>(arr:T[]):T[]
	{
		return arr == null ? [] : arr.slice(0);
	}

	// null-tolerant array concatenation; always returns an array, always at least a shallow copy
	public static append<T>(arr:T[], item:T):T[]
	{
		if (arr == null || arr.length == 0) return [item];
		arr = arr.slice(0);
		arr.push(item);
		return arr;
	}
	public static prepend<T>(arr:T[], item:T):T[]
	{
		if (arr == null || arr.length == 0) return [item];
		arr = arr.slice(0);
		arr.unshift(item);
		return arr;
	}
	public static concat<T>(arr1:T[], arr2:T[]):T[]
	{
		if (arr1 == null && arr2 == null) return [];
		if (arr1 == null) return arr2.slice(0);
		if (arr2 == null) return arr1.slice(0);
		return arr1.concat(arr2);
	}

	// array removal, with shallow-copy duplication
	public static remove<T>(arr:T[], idx:number):T[]
	{
		arr = arr.slice(0);
		arr.splice(idx, 1);
		return arr;
	}

	// null-tolerant comparison
	public static equals(arr1:any[], arr2:any[]):boolean
	{
		if (arr1 == null && arr2 == null) return true;
		if (arr1 == null || arr2 == null) return false;
		if (arr1.length != arr2.length) return false;
		for (let n = 0; n < arr1.length; n++) if (arr1[n] != arr2[n]) return false;
		return true;
	}
	public static equivalent(arr1:any[], arr2:any[]):boolean
	{
		const len1 = arr1 == null ? 0 : arr1.length, len2 = arr2 == null ? 0 : arr2.length;
		if (len1 != len2) return false;
		for (let n = 0; n < len1; n++) if (arr1[n] != arr2[n]) return false;
		return true;
	}

	public static booleanArray(val:boolean, sz:number):boolean[]
	{
		let arr:boolean[] = new Array(sz);
		arr.fill(val);
		return arr;
	}
	public static numberArray(val:number, sz:number):number[]
	{
		let arr:number[] = new Array(sz);
		arr.fill(val);
		return arr;
	}
	public static stringArray(val:string, sz:number):string[]
	{
		let arr:string[] = new Array(sz);
		arr.fill(val);
		return arr;
	}
	public static anyArray(val:any, sz:number):any[]
	{
		let arr:any[] = new Array(sz);
		arr.fill(val);
		return arr;
	}

	public static first<T>(arr:T[]) {return arr == null || arr.length == 0 ? null : arr[0];}
	public static last<T>(arr:T[]) {return arr == null || arr.length == 0 ? null : arr[arr.length - 1];}

	public static min(arr:number[]):number
	{
		if (arr == null || arr.length == 0) return Number.MAX_VALUE;
		let v = arr[0];
		for (let n = 1; n < arr.length; n++) v = Math.min(v, arr[n]);
		return v;
	}
	public static max(arr:number[]):number
	{
		if (arr == null || arr.length == 0) return Number.MIN_VALUE;
		let v = arr[0];
		for (let n = 1; n < arr.length; n++) v = Math.max(v, arr[n]);
		return v;
	}
	public static idxMin(arr:number[]):number
	{
		if (arr == null || arr.length == 0) return -1;
		let idx = 0;
		for (let n = 1; n < arr.length; n++) if (arr[n] < arr[idx]) idx = n;
		return idx;
	}
	public static idxMax(arr:number[]):number
	{
		if (arr == null || arr.length == 0) return -1;
		let idx = 0;
		for (let n = 1; n < arr.length; n++) if (arr[n] > arr[idx]) idx = n;
		return idx;
	}

	public static range(arr:number[]):number
	{
		if (arr == null || arr.length == 0) return 0;
		let lo = arr[0], hi = arr[0];
		for (let n = 1; n < arr.length; n++)
		{
			if (arr[n] < lo) lo = arr[n];
			if (arr[n] > hi) hi = arr[n];
		}
		return hi - lo;
	}

	public static reverse<T>(arr:T[]):T[]
	{
		let ret:T[] = [];
		for (let n = arr.length - 1; n >= 0; n--) ret.push(arr[n]);
		return ret;
	}

	public static identity0(sz:number):number[]
	{
		let ret:number[] = new Array(sz);
		for (let n = 0; n < sz; n++) ret[n] = n;
		return ret;
	}

	public static identity1(sz:number):number[]
	{
		let ret:number[] = new Array(sz);
		for (let n = 0; n < sz; n++) ret[n] = n + 1;
		return ret;
	}

	public static notMask(mask:boolean[]):boolean[]
	{
		let ret:boolean[] = new Array(mask.length);
		for (let n = mask.length - 1; n >= 0; n--) ret[n] = !mask[n];
		return ret;
	}

	public static idxGet<T>(arr:T[], idx:number[]):T[]
	{
		let ret:T[] = [];
		for (let n = 0; n < idx.length; n++) ret.push(arr[idx[n]]);
		return ret;
	}

	public static maskCount(mask:boolean[]):number
	{
		let c = 0;
		for (let n = mask.length - 1; n >= 0; n--) if (mask[n]) c++;
		return c;
	}

	// converts the mask into indices (0-based)
	public static maskIdx(mask:boolean[]):number[]
	{
		let idx:number[] = [];
		for (let n = 0; n < mask.length; n++) if (mask[n]) idx.push(n);
		return idx;
	}

	// converts the index into a mask (0-based index)
	public static idxMask(idx:number[], sz:number):boolean[]
	{
		let mask = Vec.booleanArray(false, sz);
		for (let n of idx) mask[n] = true;
		return mask;
	}

	// converts a mask into an index map: if mask[n] is true, then idx[n] is a 0-based index into an equivalent array composed only
	// of entries for which mask is true; for the rest, the value is -1
	public static maskMap(mask:boolean[]):number[]
	{
		let ret:number[] = [];
		for (let n = 0, pos = 0; n < mask.length; n++) ret.push(mask[n] ? pos++ : -1);
		return ret;
	}

	// returns members of an array for which the value of mask is true
	public static maskGet<T>(arr:T[], mask:boolean[]):T[]
	{
		let ret:T[] = [];
		for (let n = 0, p = 0; n < arr.length; n++) if (mask[n]) ret.push(arr[n]);
		return ret;
	}

	// return a mask of elements which are equal on both sides (with unit extension on the right)
	public static maskEqual(arr1:any[], val:any):boolean[]
	{
		let ret:boolean[] = [];
		if (val.constructor === Array)
		{
			let arr2 = val as number[];
			for (let n = 0; n < arr1.length; n++) ret.push(arr1[n] == arr2[n]);
		}
		else
		{
			for (let n = 0; n < arr1.length; n++) ret.push(arr1[n] == val);
		}
		return ret;
	}

	public static sum(arr:number[]):number
	{
		if (arr == null || arr.length == 0) return 0;
		let t = arr[0];
		for (let n = 1; n < arr.length; n++) t += arr[n];
		return t;
	}

	public static add(arr1:number[], val:number | number[]):number[]
	{
		let ret:any[] = [];
		if (val.constructor === Array)
		{
			let arr2 = val as number[];
			for (let n = 0; n < arr1.length; n++) ret.push(arr1[n] + arr2[n]);
		}
		else
		{
			for (let n = 0; n < arr1.length; n++) ret.push(arr1[n] + (val as number));
		}
		return ret;
	}

	public static sub(arr1:number[], val:number | number[]):number[]
	{
		let ret:any[] = [];
		if (val.constructor === Array)
		{
			let arr2 = val as number[];
			for (let n = 0; n < arr1.length; n++) ret.push(arr1[n] - arr2[n]);
		}
		else
		{
			for (let n = 0; n < arr1.length; n++) ret.push(arr1[n] - (val as number));
		}
		return ret;
	}

	public static mul(arr1:number[], val:number | number[]):number[]
	{
		let ret:any[] = [];
		if (val.constructor === Array)
		{
			let arr2 = val as number[];
			for (let n = 0; n < arr1.length; n++) ret.push(arr1[n] * arr2[n]);
		}
		else
		{
			for (let n = 0; n < arr1.length; n++) ret.push(arr1[n] * (val as number));
		}
		return ret;
	}

	public static neg(arr:number[]):number[]
	{
		let ret = arr.slice(0);
		for (let n = ret.length - 1; n >= 0; n--) ret[n] *= -1;
		return ret;
	}

	// bulk direct operations
	public static setTo(arr:any[], val:any):void {for (let n = arr == null ? -1 : arr.length - 1; n >= 0; n--) arr[n] = val;}
	public static addTo(arr:number[], val:number):void {for (let n = arr == null ? -1 : arr.length - 1; n >= 0; n--) arr[n] += val;}
	public static mulBy(arr:number[], val:number):void {for (let n = arr == null ? -1 : arr.length - 1; n >= 0; n--) arr[n] *= val;}

	public static addToArray(arr:number[], val:number[]):void {for (let n = arr == null ? -1 : arr.length - 1; n >= 0; n--) arr[n] += val[n];}
	public static subFromArray(arr:number[], val:number[]):void {for (let n = arr == null ? -1 : arr.length - 1; n >= 0; n--) arr[n] -= val[n];}
	public static mulByArray(arr:number[], val:number[]):void {for (let n = arr == null ? -1 : arr.length - 1; n >= 0; n--) arr[n] *= val[n];}
	public static divByArray(arr:number[], val:number[]):void {for (let n = arr == null ? -1 : arr.length - 1; n >= 0; n--) arr[n] /= val[n];}

	public static idxSort(arr:any[]):number[]
	{
		let idx:number[] = new Array(arr.length);
		for (let n = 0; n < arr.length; n++) idx[n] = n;
		idx.sort((a:number, b:number):number => arr[a] < arr[b] ? -1 : arr[a] > arr[b] ? 1 : 0);
		return idx;
	}

	// for some reason the default sorter has a dubious habit of doing a string comparison; this function is numeric
	public static sort(arr:number[]):void
	{
		arr.sort((v1:number, v2:number):number => v1 - v2);
	}
	public static sorted(arr:number[]):number[]
	{
		arr = arr.slice(0);
		this.sort(arr);
		return arr;
	}

	// returns only the unique entries, sorted
	public static sortedUnique<T>(arr:T[]):T[]
	{
		if (arr == null || arr.length == 0) return [];
		let unique = Vec.uniqueUnstable(arr);
		if (typeof arr[0] == 'number') this.sort((unique as any) as number[]); else unique.sort();
		return unique;
	}

	// uniqueness, in its various permutations
	public static uniqueUnstable<T>(arr:T[]):T[]
	{
		return Array.from(new Set(arr)); // order is basically random
	}
	public static uniqueStable<T>(arr:T[]):T[]
	{
		let set = new Set<T>(arr), ret:T[] = [];
		for (let v of arr) if (set.has(v)) {ret.push(v); set.delete(v);}
		return ret; // original order is preserved, with non-first entries removed*/
	}
	public static maskUnique(arr:any[]):boolean[]
	{
		let set = new Set<any>(arr), ret = this.booleanArray(false, arr.length);
		for (let n = 0; n < arr.length; n++) if (set.has(arr[n])) {ret[n] = true; set.delete(arr[n]);}
		return ret;
	}
	public static idxUnique(arr:any[]):number[]
	{
		let set = new Set<any>(arr), ret:number[] = [];
		for (let n = 0; n < arr.length; n++) if (set.has(arr[n])) {ret.push(n); set.delete(arr[n]);}
		return ret; // index of first occurence in original array
	}

	// for a given array, ensures that certain value are not present, and will eliminate them when discovered; original order preserved;
	// null-tolerant, and may return the original array if unchanged
	// note: O(N^2); may improve this at a later date
	public static exclude<T>(arr:T[], excl:T[]):T[]
	{
		const sz = Vec.arrayLength(arr);
		if (sz == 0) return [];
		let mask:boolean[] = new Array(sz);
		let count = 0;
		for (let n = 0; n < arr.length; n++)
		{
			mask[n] = excl.indexOf(arr[n]) < 0;
			if (mask[n]) count++;
		}
		if (count == sz) return arr;
		return Vec.maskGet(arr, mask);
	}
}

/*
	Permutation functions, operating explicitly on arrays of consecutive integers.
*/

export class Permutation
{
	// for a set of indices that are assumed to be unique and in the range {0 .. N-1}, returns their parity, i.e.
	// the number of swaps used to permute it from the identity; if the list is sorted, the result is 0
	// NOTE: parityPerms(..) returns the total number of swaps, whereas parity(..) returns either 0 or 1
	public static parityPerms(idx:number[]):number
	{
		let v = Vec.booleanArray(false, idx.length);
		let p = 0;
		for (let i = idx.length - 1; i >= 0; i--)
		{
			if (v[i]) p++;
			else
			{
				let j = i;
				do
				{
					j = idx[j];
					v[j] = true;
				}
				while (j != i);
			}
		}
		return p;
	}

	public static parityIdentity(idx:number[]):number
	{
		return this.parityPerms(idx) & 1;
	}

	// parity methods that operate on arbitrary integers; returns 0 for an even number of swaps, 1 for odd
	// NOTE: this is rather inefficient for non-tiny arrays; could at least code up some more special cases
	public static parityOrder(src:number[]):number
	{
		if (src.length <= 1) return 0;
		else if (src.length == 2) return src[0] < src[1] ? 0 : 1;
		else if (src.length == 3)
		{
			let p = 1;
			if (src[0] < src[1]) p++;
			if (src[0] < src[2]) p++;
			if (src[1] < src[2]) p++;
			return p & 1;
		}
		else if (src.length == 4)
		{
			let p = 0;
			if (src[0] < src[1]) p++;
			if (src[0] < src[2]) p++;
			if (src[0] < src[3]) p++;
			if (src[1] < src[2]) p++;
			if (src[1] < src[3]) p++;
			if (src[2] < src[3]) p++;
			return p & 1;
		}

		let idx:number[] = [], sorted = src.slice(0);
		sorted.sort();
		for (let n = 0; n < src.length; n++) idx.push(sorted.indexOf(src[n]));
		return this.parityIdentity(idx);
	}

	/*
		Small permutations: up to a certain size, it makes sense to just hardcode them.

		Note that in each case, the identity permutation is guaranteed to be first. The remaining permutations
		are not guaranteed to be in any particular order.
	*/

	private static PERM1 = [[0]];
	private static PERM2 = [[0, 1], [1, 0]];
	private static PERM3 = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
	private static PERM4 =
	[
		[0,1,2,3], [0,1,3,2], [0,2,1,3], [0,2,3,1], [0,3,1,2], [0,3,2,1],
		[1,0,2,3], [1,0,3,2], [1,2,0,3], [1,2,3,0], [1,3,0,2], [1,3,2,0],
		[2,0,1,3], [2,0,3,1], [2,1,0,3], [2,1,3,0], [2,3,0,1], [2,3,1,0],
		[3,0,1,2], [3,0,2,1], [3,1,0,2], [3,1,2,0], [3,2,0,1], [3,2,1,0]
	];

	public static SMALL_PERMS = 4;

	public static smallPermutation(sz:number):number[][]
	{
		if (sz == 1) return this.PERM1;
		else if (sz == 2) return this.PERM2;
		else if (sz == 3) return this.PERM3;
		else if (sz == 4) return this.PERM4;
		else return null;
	}

	// cache: intermediate permutation sizes are cached; note that anything significantly big really should not be used
	private static MAX_CACHE = 8;
	private static PERM_CACHE:number[][][] = [];

	// returns all of the permutations up to a certain size; note that this is slow and scales exponentially: use sparingly
	public static allPermutations(sz:number):number[][]
	{
		if (sz <= this.SMALL_PERMS) return this.smallPermutation(sz);
		while (this.PERM_CACHE.length < this.MAX_CACHE - this.SMALL_PERMS) this.PERM_CACHE.push(null);
		if (sz < this.MAX_CACHE && this.PERM_CACHE[sz - this.SMALL_PERMS] != null) return this.PERM_CACHE[sz - this.SMALL_PERMS];

		let nperms = 1;
		for (let n = 2; n <= sz; n++) nperms *= n;
		let perms:number[][] = [];

		// NOTE: for sure not the fastest way to do it, but it gets the job done; the total number of iterations is actually
		// exponential, rather than factorial

		let idx = Vec.identity0(sz);
		perms.push(idx.slice(0));
		let mask = Vec.booleanArray(false, sz);

		for (let n = 1; n < nperms; n++)
		{
			nonunique: while (idx[0] < sz)
			{
				// increment the "digits"
				idx[sz - 1]++;
				for (let i = sz - 1; i > 0; i --)
				{
					if (idx[i] < sz) break;
					idx[i] = 0;
					idx[i - 1]++;
				}

				// skip the loop if digits have any degeneracy
				Vec.setTo(mask, false);
				for (let i of idx)
				{
					if (mask[i]) continue nonunique;
					mask[i] = true;
				}

				// this is a new unique combo, so poke it in
				perms[n] = idx.slice(0);
				break;
			}
		}

		if (sz < this.MAX_CACHE) this.PERM_CACHE[sz - this.SMALL_PERMS] = perms;
		return perms;
	}
}

/* EOF */ }