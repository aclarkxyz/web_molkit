/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {MDLMOLReader} from './MDLReader';
import {MDLMOLWriter} from './MDLWriter';
import {Molecule} from '../mol/Molecule';

/*
	Serialisation and deserialisation utilities for the Molecule object.

	Note that the native format is entirely lossless. Other molecule formats, such as MDL MOL, are reasonably high fidelity for
	most common molecules, but there are quite a few edge cases.
*/

// encode string for Elements format
const ESCAPED_CHARS = '\n\t\\,=';
function escape(str:string):string
{
	let buff:string = null; // rebuild the string only if it has escaped characters

	for (let n = 0; n < str.length; n++)
	{
		let ch = str.charAt(n);
		let escape = ESCAPED_CHARS.includes(ch), ctrl = ch.charCodeAt(0) < 32;

		if (buff == null && (escape || ctrl))
		{
			buff = str.substring(0, n);
		}
		if (escape)
		{
			if (ch == '\n') buff += '\\n';
			else if (ch == '\t') buff += '\\t';
			else buff += '\\' + ch;
		}
		else if (ctrl) {} // non-printable outside of the escape list are filtered out (e.g. \r)
		else if (buff != null) buff += ch;
	}

	return buff ?? str;
}

function writeKeyVals(keyvals:string[]):string
{
	let str = '';

	// write out all the single-line entries, and stash multiline entries to be processed afterward
	let multiline:string[] = [];
	for (let kv of keyvals)
	{
		if (!kv.includes('\n'))
			str += ',' + escape(kv);
		else
			multiline.push(kv);
	}

	str += '\n';

	for (let kv of multiline)
	{
		let lines = kv.trimEnd().split('\n');
		for (let n = 0; n < lines.length; n++)
		{
			str += `${n == 0 ? '.' : ':'}${lines[n]}\n`;
		}
	}

	return str;
}

interface Chunk {str:string, pos:number}
function readNextChunk(line:string, pos:number, term:string, mandatory:boolean)
{
	let end = pos, sz = line.length;
	if (pos >= sz)
	{
		if (mandatory) throw new Error('Molecule missing line fragment');
		return null;
	}

	let escaped = false;
	while (end < sz)
	{
		let ch = line.charAt(end);
		if (ch == '\\')
		{
			if (end == sz - 1) throw new Error('Escape character \\ at end of line');
			escaped = true;
			end += 2;
		}
		else if (ch == term) break;
		else end++;
	}

	if (!escaped) return {str: line.substring(pos, end), pos: end};

	var str = '';
	for (let n = pos; n < end; n++)
	{
		let ch = line.charAt(n);
		if (ch == '\\')
		{
			ch = line.charAt(++n);
			if (ch == 'n') str += '\n';
			else if (ch == 't') str += '\t';
			else str += ch;
		}
		else str += ch;
	}
	return {str, pos: end};
}

export class MoleculeStream
{
	public static formatV2Elements = false; // switch this on to use the newer Elements serialisation, rather than SketchEl

	// tries to read a format-unknown molecule, with whatever tools are currently available
	public static readUnknown(strData:string):Molecule
	{
		// see if it's a JSON-encoded SketchEl string
		if (strData.startsWith('"'))
		{
			try
			{
				let jsonStr = JSON.parse(strData);
				if (jsonStr && typeof jsonStr == 'string')
				{
					try
					{
						let mol = MoleculeStream.readNative(jsonStr);
						if (mol) return mol;
					}
					catch (ex) {}
					try
					{
						let mol = MoleculeStream.readMDLMOL(jsonStr);
						if (mol) return mol;
					}
					catch (ex) {}
				}
			}
			catch (ex) {}
		}

		let mol = MoleculeStream.readNative(strData);
		if (mol) return mol;
		try {mol = MoleculeStream.readMDLMOL(strData);}
		catch (e) {}
		// (... add others as available ...)
		return mol;
	}

	// static method: reads in a string that is presumed to be in SketchEl format, and returns a fully instantiated Molecule; returns
	// null if anything went wrong
	public static readNative(strData:string):Molecule
	{
		if (strData.startsWith('SketchEl!')) return this.readNativeLegacy(strData);

		let mol = new Molecule();
		mol.keepTransient = true;

		let lines = strData.split(/\r?\n/);

		let match = lines[0].match(/^Elements\!\((\d+),(\d+)\)$/);
		if (!match) return null; //throw new Error('Not an Elements molecule file.');

		let numAtoms = parseInt(match[1]), numBonds = parseInt(match[2]);
		if (!(numAtoms >= 0)) throw new Error(`Invalid atom count: ${match[1]}`);
		if (!(numBonds >= 0)) throw new Error(`Invalid bond count: ${match[2]}`);

		const MSG_PREMATURE = 'Molecule atom content ends prematurely';
		const MSG_UNEXPECTED = 'Molecule unexpected end tag';

		const parseIntHard = (str:string):number =>
		{
			let v = parseInt(str);
			if (Number.isNaN(v)) throw new Error(`Malformed integer: ${str}`);
			return v;
		};
		const parseFloatHard = (str:string):number =>
		{
			let v = parseFloat(str);
			if (Number.isNaN(v)) throw new Error(`Malformed float: ${str}`);
			return v;
		};

		const applyAtomProperty = (atom:number, str:string):void =>
		{
			if (!str) return;
			let pfx = str.charAt(0);
			if (pfx == 'z') mol.setAtomZ(atom, parseFloatHard(str.substring(1)));
			else if (pfx == 'c') mol.setAtomCharge(atom, parseIntHard(str.substring(1)));
			else if (pfx == 'u') mol.setAtomUnpaired(atom, parseIntHard(str.substring(1)));
			else if (pfx == 'h') mol.setAtomHExplicit(atom, parseIntHard(str.substring(1)));
			else if (pfx == 'i') mol.setAtomIsotope(atom, parseIntHard(str.substring(1)));
			else if (pfx == 'm') mol.setAtomMapNum(atom, parseIntHard(str.substring(1)));
			else if (pfx == 'y') mol.appendAtomTransient(atom, str);
			else mol.appendAtomExtra(atom, str);
		};

		const applyBondProperty = (bond:number, str:string):void =>
		{
			if (!str) return;
			let pfx = str.charAt(0);
			if (pfx == 'i') mol.setBondType(bond, Molecule.BONDTYPE_INCLINED);
			else if (pfx == 'd') mol.setBondType(bond, Molecule.BONDTYPE_DECLINED);
			else if (pfx == 'u') mol.setBondType(bond, Molecule.BONDTYPE_UNKNOWN);
			else if (pfx == 'y') mol.appendBondTransient(bond, str);
			else mol.appendBondExtra(bond, str);
		};

		let lnum = 1;

		for (let n = 1; n <= numAtoms; n++)
		{
			if (!lines[lnum]) throw new Error(MSG_PREMATURE);

			let chunkEl = readNextChunk(lines[lnum], 0, '=', true);
			let chunkX = readNextChunk(lines[lnum], chunkEl.pos + 1, ',', true);
			let chunkY = readNextChunk(lines[lnum], chunkX.pos + 1, ',', true);

			let x = parseFloatHard(chunkX.str), y = parseFloatHard(chunkY.str);
			mol.addAtom(chunkEl.str, x, y);

			let pos = chunkY.pos + 1;
			while (true)
			{
				var chunk = readNextChunk(lines[lnum], pos, ',', false);
				if (chunk == null) break;
				applyAtomProperty(n, chunk.str);
				pos = chunk.pos + 1;
			}

			lnum++;
			while (true)
			{
				if (!lines[lnum]) throw new Error(MSG_PREMATURE);
				if (lines[lnum] == '!End')
				{
					if (n == numAtoms && numBonds == 0) break; // this is where we expect it
					throw new Error(MSG_UNEXPECTED);
				}
				if (!lines[lnum].startsWith('.')) break;

				var buff = lines[lnum].substring(1);
				while (true)
				{
					lnum++;
					if (!lines[lnum]) throw new Error(MSG_PREMATURE);
					if (!lines[lnum].startsWith(':')) break;
					buff += '\n' + lines[lnum].substring(1);
				}
				applyAtomProperty(n, buff);
			}
		}

		for (let n = 1; n <= numBonds; n++)
		{
			if (!lines[lnum]) throw new Error(MSG_PREMATURE);

			var chunkFrom = readNextChunk(lines[lnum], 0, '-', true);
			var chunkTo = readNextChunk(lines[lnum], chunkFrom.pos + 1, '=', true);
			var chunkOrder = readNextChunk(lines[lnum], chunkTo.pos + 1, ',', true);

			let bfr = parseIntHard(chunkFrom.str), bto = parseIntHard(chunkTo.str), order = parseIntHard(chunkOrder.str);
			if (bfr < 1 || bfr > numAtoms || bto < 1 || bto > numAtoms || order < 0 || order > 4) throw new Error('Invalid bond specification');
			mol.addBond(bfr, bto, order);
			let pos = chunkOrder.pos + 1;
			while (true)
			{
				var chunk = readNextChunk(lines[lnum], pos, ',', false);
				if (chunk == null) break;
				applyBondProperty(n, chunk.str);
				pos = chunk.pos + 1;
			}

			lnum++;
			while (true)
			{
				if (!lines[lnum]) throw new Error(MSG_PREMATURE);
				if (lines[lnum] == '!End')
				{
					if (n == numBonds) break; // this is where we expect it
					throw new Error(MSG_UNEXPECTED);
				}
				if (!lines[lnum].startsWith('.')) break;

				let buff = lines[lnum].substring(1);
				while (true)
				{
					lnum++;
					if (!lines[lnum]) throw new Error(MSG_PREMATURE);
					if (!lines[lnum].startsWith(':')) break;
					buff += '\n' + lines[lnum].substring(1);
				}
				applyBondProperty(n, buff);
			}
		}

		if (lines[lnum] != '!End') throw new Error('Molecule end tag missing');

		mol.keepTransient = false;
		return mol;
	}

	public static readNativeLegacy(strData:string):Molecule
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
		let hdr = lines[0].match(/^SketchEl\!\((\d+)\,(\d+)\)/);
		if (!hdr) return null;
		let numAtoms = parseInt(hdr[1]), numBonds = parseInt(hdr[2]);
		if (lines.length < 2 + numAtoms + numBonds) return null;
		if (!lines[1 + numAtoms + numBonds].match(/^!End/)) return null;

		for (let n = 0; n < numAtoms; n++)
		{
			let bits = lines[1 + n].split(/[=,;]/);
			let num = mol.addAtom(MoleculeStream.skUnescape(bits[0]), parseFloat(bits[1]), parseFloat(bits[2]), parseInt(bits[3]), parseInt(bits[4]));
			let extra:string[] = [], trans:string[] = [];
			for (let i = 5; i < bits.length; i++)
			{
				let ch = bits[i].charAt(0);
				if (bits[i].charAt(0) == 'i') {} // ignore
				else if (bits[i].charAt(0) == 'e') mol.setAtomHExplicit(num, parseInt(bits[i].substring(1)));
				else if (bits[i].charAt(0) == 'm') mol.setAtomIsotope(num, parseInt(bits[i].substring(1)));
				else if (bits[i].charAt(0) == 'n') mol.setAtomMapNum(num, parseInt(bits[i].substring(1)));
				else if (bits[i].charAt(0) == 'x') extra.push(MoleculeStream.skUnescape(bits[i]));
				else if (bits[i].charAt(0) == 'y') trans.push(MoleculeStream.skUnescape(bits[i]));
				else if (bits[i].charAt(0) == 'z') {mol.setAtomZ(num, parseFloat(bits[i].substring(1))); mol.setIs3D(true);}
				else extra.push(MoleculeStream.skUnescape(bits[i])); // preserve unrecognised
			}
			mol.setAtomExtra(num, extra);
			mol.setAtomTransient(num, trans);
		}
		for (let n = 0; n < numBonds; n++)
		{
			let bits = lines[1 + numAtoms + n].split(/[=,]/);
			let frto = bits[0].split('-');
			let bfr = parseInt(frto[0].trim()), bto = parseInt(frto[1].trim());
			if (bfr == bto) continue; // silent trimming

			let num = mol.addBond(bfr, bto, parseInt(bits[1]), parseInt(bits[2]));
			let extra = new Array(), trans = new Array();
			for (let i = 3; i < bits.length; i++)
			{
				let ch = bits[i].charAt(0);
				if (bits[i].charAt(0) == 'x') extra.push(MoleculeStream.skUnescape(bits[i]));
				else if (bits[i].charAt(0) == 'y') trans.push(MoleculeStream.skUnescape(bits[i]));
				else extra.push(MoleculeStream.skUnescape(bits[i])); // preserve unrecognised
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
		if (!this.formatV2Elements) return this.writeNativeLegacy(mol);

		let bits:string[] = [`Elements!(${mol.numAtoms},${mol.numBonds})\n`];

		const roundedNumber = (v:number):string =>
		{
			return (Math.round(v * 1E4) * 1E-4).toFixed(4);
		};

		for (let n = 1; n <= mol.numAtoms; n++)
		{
			let el = mol.atomElement(n), x = roundedNumber(mol.atomX(n)), y = roundedNumber(mol.atomY(n));
			bits.push(`${escape(el)}=${x},${y}`);

			let keyvals:string[] = [];

			if (mol.is3D()) keyvals.push(`z${roundedNumber(mol.atomZ(n))}`);

			let chg = mol.atomCharge(n), unp = mol.atomUnpaired(n), hyd = mol.atomHExplicit(n), iso = mol.atomIsotope(n), map = mol.atomMapNum(n);
			if (chg != 0) keyvals.push(`c${chg}`);
			if (unp != 0) keyvals.push(`u${unp}`);
			if (hyd != Molecule.HEXPLICIT_UNKNOWN) keyvals.push(`h${hyd}`);
			if (iso != Molecule.ISOTOPE_NATURAL) keyvals.push(`i${iso}`);
			if (map > 0) keyvals.push(`m${map}`);

			keyvals.push(...mol.atomExtra(n));
			keyvals.push(...mol.atomTransient(n));

			bits.push(writeKeyVals(keyvals));
		}
		for (let n = 1; n <= mol.numBonds; n++)
		{
			let bfr = mol.bondFrom(n), bto = mol.bondTo(n), order = mol.bondOrder(n);
			bits.push(`${bfr}-${bto}=${order}`);

			let keyvals:string[] = [];

			let typ = mol.bondType(n);
			if (typ == Molecule.BONDTYPE_INCLINED) keyvals.push('i');
			else if (typ == Molecule.BONDTYPE_DECLINED) keyvals.push('d');
			else if (typ == Molecule.BONDTYPE_UNKNOWN) keyvals.push('u');

			keyvals.push(...mol.bondExtra(n));
			keyvals.push(...mol.bondTransient(n));

			bits.push(writeKeyVals(keyvals));
		}

		bits.push('!End\n');
		return bits.join('');
	}

	public static writeNativeLegacy(mol:Molecule):string
	{
		let ret = 'SketchEl!(' + mol.numAtoms + ',' + mol.numBonds + ')\n';
		for (let n = 1; n <= mol.numAtoms; n++)
		{
			let el = mol.atomElement(n), x = mol.atomX(n), y = mol.atomY(n), charge = mol.atomCharge(n), unpaired = mol.atomUnpaired(n);
			let hy = mol.atomHExplicit(n) != Molecule.HEXPLICIT_UNKNOWN ? ('e' + mol.atomHExplicit(n)) : ('i' + mol.atomHydrogens(n));
			ret += MoleculeStream.skEscape(el) + '=' + x.toFixed(4) + ',' + y.toFixed(4) + ';' + charge + ',' + unpaired + ',' + hy;
			if (mol.is3D()) ret += ',z' + mol.atomZ(n);
			if (mol.atomIsotope(n) != Molecule.ISOTOPE_NATURAL) ret += ',m' + mol.atomIsotope(n);
			if (mol.atomMapNum(n) > 0) ret += ',n' + mol.atomMapNum(n);
			ret += MoleculeStream.skEncodeExtra(mol.atomExtra(n));
			ret += MoleculeStream.skEncodeExtra(mol.atomTransient(n));
			ret += '\n';
		}

		for (let n = 1; n <= mol.numBonds; n++)
		{
			ret += mol.bondFrom(n) + '-' + mol.bondTo(n) + '=' + mol.bondOrder(n) + ',' + mol.bondType(n);
			ret += MoleculeStream.skEncodeExtra(mol.bondExtra(n));
			ret += MoleculeStream.skEncodeExtra(mol.bondTransient(n));
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
	public static skUnescape(str:string):string
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
	public static skEscape(str:string):string
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
	public static skEncodeExtra(extra:string[]):string
	{
		let ret = '';
		for (let n = 0; n < extra.length; n++) ret += ',' + MoleculeStream.skEscape(extra[n]);
		return ret;
	}
}

