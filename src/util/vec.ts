/*
    MolSync

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=molsync]
*/

//import $ from "JQuery";

/*
	Functions that operate on arrays, for performing routine tasks.
*/

function anyTrue(arr:boolean[]):boolean
{
	if (arr == null) return false;
	for (let v of arr) if (v) return true;
	return false;
}
function allTrue(arr:boolean[]):boolean
{
	if (arr == null) return true;
	for (let v of arr) if (!v) return false;
	return true;
}

function anyFalse(arr:boolean[]):boolean
{
	if (arr == null) return false;
	for (let v of arr) if (!v) return true;
	return false;
}
function allFalse(arr:boolean[]):boolean
{
	if (arr == null) return true;
	for (let v of arr) if (v) return false;
	return true;
}
