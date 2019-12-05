/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../decl/corrections.d.ts'/>
///<reference path='MDLReader.ts'/>
///<reference path='MDLWriter.ts'/>

namespace WebMolKit /* BOF */ {

/*
	Serialisation and deserialisation utilities for the Molecule object.

	Note that the native format ("SketchEl") is entirely lossless. Other molecule formats, such as MDL MOL, are lossless
	for a large subset of common organic chemistry use-cases, but there is a lot of missing overlap between the two.
*/

export class MoleculeStream
{
	// tries to read a format-unknown molecule, with whatever tools are currently available
	public static readUnknown(strData:string):Molecule
	{
		let mol = MoleculeStream.readNative(strData);
		if (mol) return mol;
		try {mol = MoleculeStream.readMDLMOL(strData);} catch (e) {}
		// (... add others as available ...)
		return mol;
	}

	// static method: reads in a string that is presumed to be in SketchEl format, and returns a fully instantiated Molecule; returns
	// null if anything went wrong
	public static readNative(strData:string):Molecule
	{
		let mol = new Molecule();
		mol.keepTransient = true;

		let lines = strData.split(/\r?\n/);
		if (lines.length < 2) return null; // cannot be valid

		// special deal: a clipboard hack that glues together MDL+SketchEl can be easily handled
		if (!lines[0].startsWith('SketchEl!') && lines.length >= 4 && lines[3].indexOf('V2000') >= 0)
		{
			let i = strData.indexOf('SketchEl!');
			if (i < 0) return null;
			lines = strData.substring(i).split(/r?\n/);
		}

		// opening and closing lines
		let bits = lines[0].match(/^SketchEl\!\((\d+)\,(\d+)\)/);
		if (!bits) return null;
		let numAtoms = parseInt(bits[1]), numBonds = parseInt(bits[2]);
		if (lines.length < 2 + numAtoms + numBonds) return null;
		if (!lines[1 + numAtoms + numBonds].match(/^!End/)) return null;

		for (let n = 0; n < numAtoms; n++)
		{
			bits = lines[1 + n].split(/[=,;]/);
			let num = mol.addAtom(bits[0], parseFloat(bits[1]), parseFloat(bits[2]), parseInt(bits[3]), parseInt(bits[4]));
			let extra:string[] = [], trans:string[] = [];
			for (let i = 5; i < bits.length; i++)
			{
				let ch = bits[i].charAt(0);
				if (bits[i].charAt(0) == 'i') {} // ignore
				else if (bits[i].charAt(0) == 'e') mol.setAtomHExplicit(num, parseInt(bits[i].substring(1)));
				else if (bits[i].charAt(0) == 'm') mol.setAtomIsotope(num, parseInt(bits[i].substring(1)));
				else if (bits[i].charAt(0) == 'n') mol.setAtomMapNum(num, parseInt(bits[i].substring(1)));
				else if (bits[i].charAt(0) == 'x') extra.push(MoleculeStream.sk_unescape(bits[i]));
				else if (bits[i].charAt(0) == 'y') trans.push(MoleculeStream.sk_unescape(bits[i]));
				else if (bits[i].charAt(0) == 'z') {mol.setAtomZ(num, parseFloat(bits[i].substring(1))); mol.setIs3D(true);}
				else extra.push(MoleculeStream.sk_unescape(bits[i])); // preserve unrecognised
			}
			mol.setAtomExtra(num, extra);
			mol.setAtomTransient(num, trans);
		}
		for (let n = 0; n < numBonds; n++)
		{
			bits = lines[1 + numAtoms + n].split(/[=,]/);
			let frto = bits[0].split('-');
			let bfr = parseInt(frto[0].trim()), bto = parseInt(frto[1].trim());
			if (bfr == bto) continue; // silent trimming

			let num = mol.addBond(bfr, bto, parseInt(bits[1]), parseInt(bits[2]));
			let extra = new Array(), trans = new Array();
			for (let i = 3; i < bits.length; i++)
			{
				let ch = bits[i].charAt(0);
				if (bits[i].charAt(0) == 'x') extra.push(MoleculeStream.sk_unescape(bits[i]));
				else if (bits[i].charAt(0) == 'y') trans.push(MoleculeStream.sk_unescape(bits[i]));
				else extra.push(MoleculeStream.sk_unescape(bits[i])); // preserve unrecognised
			}
			mol.setBondExtra(num, extra);
			mol.setBondTransient(num, trans);
		}

		mol.keepTransient = false;
		return mol;
	}

	// static method: converts a molecule into a string which represents it using the SketchEl format
	public static writeNative(mol:Molecule):string
	{
		let ret = 'SketchEl!(' + mol.numAtoms + ',' + mol.numBonds + ')\n';
		for (let n = 1; n <= mol.numAtoms; n++)
		{
			let el = mol.atomElement(n), x = mol.atomX(n), y = mol.atomY(n), charge = mol.atomCharge(n), unpaired = mol.atomUnpaired(n);
			let hy = mol.atomHExplicit(n) != Molecule.HEXPLICIT_UNKNOWN ? ('e' + mol.atomHExplicit(n)) : ('i' + mol.atomHydrogens(n));
			ret += MoleculeStream.sk_escape(el) + '=' + x.toFixed(4) + ',' + y.toFixed(4) + ';' + charge + ',' + unpaired + ',' + hy;
			if (mol.is3D()) ret += ',z' + mol.atomZ(n);
			if (mol.atomIsotope(n) != Molecule.ISOTOPE_NATURAL) ret += ',m' + mol.atomIsotope(n);
			if (mol.atomMapNum(n) > 0) ret += ',n' + mol.atomMapNum(n);
			ret += MoleculeStream.sk_encodeExtra(mol.atomExtra(n));
			ret += MoleculeStream.sk_encodeExtra(mol.atomTransient(n));
			ret += '\n';
		}

		for (let n = 1; n <= mol.numBonds; n++)
		{
			ret += mol.bondFrom(n) + '-' + mol.bondTo(n) + '=' + mol.bondOrder(n) + ',' + mol.bondType(n);
			ret += MoleculeStream.sk_encodeExtra(mol.bondExtra(n));
			ret += MoleculeStream.sk_encodeExtra(mol.bondTransient(n));
			ret += '\n';
		}

		ret += '!End\n';
		return ret;
	}

	// parses a string that is expected to be using MDL Molfile format, and turns it into a molecule; or null if
	public static readMDLMOL(strData:string):Molecule
	{
		let src = new MDLMOLReader(strData);
		src.parseHeader = true;
		src.parse();
		return src.mol;
	}

	// converts the molecule to MDL Molfile format, using default options; see the MDLMOLWriter class for finer control
	public static writeMDLMOL(mol:Molecule):string
	{
		return new MDLMOLWriter(mol).write();
	}

	// static method: decodes a string from a sketchel field
	public static sk_unescape(str:string):string
	{
		let ret = '', match:RegExpMatchArray;
		while (match = str.match(/^(.*?)\\([0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f])(.*)/))
		{
			ret += match[1] + String.fromCharCode(parseInt('0x' + match[2]));
			str = match[3];
		}
		return ret + str;
	}

	// static method: makes a string safe for inclusion as a SketchEl field
	public static sk_escape(str:string):string
	{
		let ret = '';
		for (let n = 0; n < str.length; n++)
		{
			let ch = str.charAt(n), code = str.charCodeAt(n);
			if (code <= 32 || code > 127 || ch == '\\' || ch == ',' || ch == ';' || ch == '=')
			{
				let hex = (code & 0xFFFF).toString(16).toUpperCase();
				ret += '\\';
				for (let i = 4 - hex.length; i > 0; i--) ret += '0';
				ret += hex;
			}
			else ret += ch;
		}
		return ret;
	}

	// internal utility for writing SketchEl extra/transient content
	public static sk_encodeExtra(extra:string[]):string
	{
		let ret = '';
		for (let n = 0; n < extra.length; n++) ret += ',' + MoleculeStream.sk_escape(extra[n]);
		return ret;
	}
}

/* EOF */ }