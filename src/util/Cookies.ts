/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	Cookies: handles the caching of recently used molecules, by stashing them in the cookie jar.
*/

const ASPIRIN =
	'SketchEl!(13,13)\n' +
	'C=-1.6010,4.3000;0,0,i0\n' +
	'C=-2.9000,3.5500;0,0,i1\n' +
	'C=-0.3019,3.5500;0,0,i0\n' +
	'C=-2.9000,2.0500;0,0,i1\n' +
	'C=-1.6010,1.3000;0,0,i1\n' +
	'C=-0.3019,2.0500;0,0,i1\n' +
	'C=-1.6010,5.8000;0,0,i0\n' +
	'O=-0.3019,6.5500;0,0,i1\n' +
	'O=-2.9000,6.5500;0,0,i0\n' +
	'O=0.9971,4.3000;0,0,i0\n' +
	'C=2.2962,3.5500;0,0,i0\n' +
	'C=3.5952,4.3000;0,0,i3\n' +
	'O=2.2962,2.0500;0,0,i0\n' +
	'1-2=1,0\n' +
	'1-3=2,0\n' +
	'2-4=2,0\n' +
	'4-5=1,0\n' +
	'5-6=2,0\n' +
	'6-3=1,0\n' +
	'1-7=1,0\n' +
	'7-8=1,0\n' +
	'7-9=2,0\n' +
	'3-10=1,0\n' +
	'10-11=1,0\n' +
	'11-12=1,0\n' +
	'11-13=2,0\n' +
	'!End';

const CAFFEINE =
	'SketchEl!(14,15)\n' +
	'N=-0.2062,0.7255;0,0,i0\n' +
	'C=1.0929,1.4755;0,0,i0\n' +
	'C=-1.5052,1.4755;0,0,i0\n' +
	'C=1.0929,2.9755;0,0,i0\n' +
	'C=-0.2062,3.7255;0,0,i0\n' +
	'N=-1.5052,2.9755;0,0,i0\n' +
	'N=2.5142,1.0083;0,0,i0\n' +
	'C=3.3966,2.2166;0,0,i1\n' +
	'N=2.5208,3.4370;0,0,i0\n' +
	'O=-2.8042,0.7255;0,0,i0\n' +
	'O=-0.2062,5.2255;0,0,i0\n' +
	'C=2.9896,4.8619;0,0,i3\n' +
	'C=-2.8042,3.7255;0,0,i3\n' +
	'C=-0.2062,-0.7745;0,0,i3\n' +
	'1-2=1,0\n' +
	'1-3=1,0\n' +
	'2-4=2,0\n' +
	'4-5=1,0\n' +
	'5-6=1,0\n' +
	'6-3=1,0\n' +
	'9-8=1,0\n' +
	'8-7=2,0\n' +
	'7-2=1,0\n' +
	'4-9=1,0\n' +
	'3-10=2,0\n' +
	'5-11=2,0\n' +
	'9-12=1,0\n' +
	'6-13=1,0\n' +
	'1-14=1,0\n' +
	'!End';

export class Cookies
{
	private molecules:Molecule[] = [];

	private static MAX_MOL_STASH = 20; // when more than this many molecules is accumulate, drop things off the edge

	// --------------------------------------- public methods ---------------------------------------

	constructor()
	{
		for (let idx = 0; ; idx++)
		{
			let str = this.get('mol' + idx);
			if (str == null) break;
			let mol = Molecule.fromString(str);
			if (mol == null) break;
			this.molecules.push(mol);
		}
	}

	public numMolecules():number
	{
		return this.molecules.length;
	}

	public getMolecule(idx:number):Molecule
	{
		return this.molecules[idx];
	}

	public deleteMolecule(idx:number):void
	{
		this.molecules.splice(idx, 1);
		this.setMolecules();
	}

	// called when a new molecule is defined by the user
	public stashMolecule(mol:Molecule):void
	{
		if (MolUtil.isBlank(mol)) return;

		// TODO: upgrade this to SketchUtil.sketchEquivalent (whenever it gets implemented)
		for (let n = 0; n < this.molecules.length; n++) if (mol.compareTo(this.molecules[n]) == 0)
		{
			if (n > 0)
			{
				this.molecules.splice(n, 1);
				this.molecules.splice(0, 0, mol.clone());
				this.setMolecules();
			}
			return;
		}
		this.molecules.splice(0, 0, mol);
		while (this.molecules.length > Cookies.MAX_MOL_STASH) this.molecules.pop();
		this.setMolecules();
	}

	// move the selected index to the top (position 0)
	public promoteToTop(idx:number):void
	{
		if (idx == 0) return;
		let mol = this.molecules.splice(idx, 1)[0];
		this.molecules.splice(0, 0, mol);
		this.setMolecules();
	}

	// typically called right after granting permission: sets up the cache with example molecules
	public seedMolecules():void
	{
		this.molecules = [];
		this.molecules.push(Molecule.fromString(CAFFEINE));
		this.molecules.push(Molecule.fromString(ASPIRIN));
		this.setMolecules();
	}

	// --------------------------------------- private methods ---------------------------------------

	private setMolecules():void
	{
		for (let n = 0; n < this.molecules.length; n++) this.set('mol' + n, this.molecules[n].toString());
		this.remove('mol' + this.molecules.length);
	}

	private get(key:string):string
	{
		let value = '; ' + document.cookie;
  		let parts = value.split('; ' + key + '=');
		if (parts.length == 2) return decodeURIComponent(parts.pop().split(';').shift());
		return null;
	}

	private set(key:string, val:string):void
	{
		document.cookie = key + '=' + encodeURIComponent(val);
	}

	private remove(key:string):void
	{
		document.cookie = key + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
	}
}

/* EOF */ }