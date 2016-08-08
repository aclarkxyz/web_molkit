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

    // bulk direct operations
	public static setTo(arr:any[], val:any) {for (let n = arr == null ? -1 : arr.length - 1; n >= 0; n--) arr[n] = val;}
	public static addTo(arr:number[], val:number) {for (let n = arr == null ? -1 : arr.length - 1; n >= 0; n--) arr[n] += val;}
	public static mulBy(arr:number[], val:number) {for (let n = arr == null ? -1 : arr.length - 1; n >= 0; n--) arr[n] *= val;}

	public static idxSort(arr:any[]):number[]
	{
		let idx:number[] = new Array(arr.length);
		for (let n = 0; n < arr.length; n++) arr[n] = n;
		idx.sort(function(a:number, b:number):number {return arr[a] < arr[b] ? -1 : arr[a] > arr[b] ? 1 : 0;});
		return idx;
	}
}