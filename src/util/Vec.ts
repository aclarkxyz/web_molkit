/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

//import $ from "JQuery";

/*
	Functions that operate on arrays, for performing routine tasks.
*/

class Vec
{
	public static length(arr:any[]) {return arr == null ? 0 : arr.length;}

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

	public static swap(arr:any[], idx1:number, idx2:number)
	{
		let v = arr[idx1];
		arr[idx1] = arr[idx2];
		arr[idx2] = v;
	}

	public static equals(arr1:any[], arr2:any[]):boolean
	{
		if (arr1.length != arr2.length) return false;
		for (let n = 0; n < arr1.length; n++) if (arr1[n] != arr2[n]) return false;
		return true;
	}

	public static booleanArray(val:boolean, sz:number):boolean[]
	{
		let arr:boolean[] = new Array(sz);
		for (let n = sz - 1; n >= 0; n--) arr[n] = val;
		return arr;
	}
	public static numberArray(val:number, sz:number):number[]
	{
		let arr:number[] = new Array(sz);
		for (let n = sz - 1; n >= 0; n--) arr[n] = val;
		return arr;
	}
	public static stringArray(val:string, sz:number):string[]
	{
		let arr:string[] = new Array(sz);
		for (let n = sz - 1; n >= 0; n--) arr[n] = val;
		return arr;
	}
	public static anyArray(val:any, sz:number):any[]
	{
		let arr:any[] = new Array(sz);
		for (let n = sz - 1; n >= 0; n--) arr[n] = val;
		return arr;
	}

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

    public static reverse(arr:number[]):any[]
    {
		let ret:any[] = [];
		for (let n = arr.length - 1; n >= 0; n--) ret.push(arr[n]);
		return ret;
	} 
    
    public static idxGet(arr:any[], idx:number[]):any[]
    {
		let ret:any[] = [];
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
    public static maskGet(arr:any[], mask:boolean[]):any[]
	{
		let ret:number[] = [];
		for (let n = 0, p = 0; n < arr.length; n++) if (mask[n]) ret.push(arr[n]);
		return ret;
	}
    
    // return a mask of elements which are equal on both sides (with unit extension on the right)
    public static maskEqual(arr1:any[], val:any):boolean[]
	{
		let ret:boolean[] = [];
		if (val.constructor === Array)
		{
			let arr2 = <number[]>val;
			for (let n = 0; n < arr1.length; n++) ret.push(arr1[n] == arr2[n]);
		}
		else
		{
			for (let n = 0; n < arr1.length; n++) ret.push(arr1[n] == val);
		}
		return ret;
	}

	public static add(arr1:any[], val:any):any[]
	{
		let ret:any[] = [];
		if (val.constructor === Array)
		{
			let arr2 = <number[]>val;
			for (let n = 0; n < arr1.length; n++) ret.push(arr1[n] + arr2[n]);
		}
		else
		{
			for (let n = 0; n < arr1.length; n++) ret.push(arr1[n] + val);
		}
		return ret;
	}

	public static sub(arr1:any[], val:any):any[]
	{
		let ret:any[] = [];
		if (val.constructor === Array)
		{
			let arr2 = <number[]>val;
			for (let n = 0; n < arr1.length; n++) ret.push(arr1[n] - arr2[n]);
		}
		else
		{
			for (let n = 0; n < arr1.length; n++) ret.push(arr1[n] - val);
		}
		return ret;
	}

	public static mul(arr1:any[], val:any):any[]
	{
		let ret:any[] = [];
		if (val.constructor === Array)
		{
			let arr2 = <number[]>val;
			for (let n = 0; n < arr1.length; n++) ret.push(arr1[n] * arr2[n]);
		}
		else
		{
			for (let n = 0; n < arr1.length; n++) ret.push(arr1[n] * val);
		}
		return ret;
	}

    // bulk direct operations
	public static setTo(arr:any[], val:any) {for (let n = arr == null ? -1 : arr.length - 1; n >= 0; n--) arr[n] = val;}
	public static addTo(arr:number[], val:number) {for (let n = arr == null ? -1 : arr.length - 1; n >= 0; n--) arr[n] += val;}
	public static mulBy(arr:number[], val:number) {for (let n = arr == null ? -1 : arr.length - 1; n >= 0; n--) arr[n] *= val;}

	public static idxSort(arr:any[]):number[]
	{
		let idx:number[] = new Array(arr.length);
		for (let n = 0; n < arr.length; n++) idx[n] = n;
		idx.sort(function(a:number, b:number):number {return arr[a] < arr[b] ? -1 : arr[a] > arr[b] ? 1 : 0;});
		return idx;
	}
}