/*
    WebMolKit

    (c) 2010-2017 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../util/util.ts'/>
///<reference path='../util/Vec.ts'/>
///<reference path='../data/Molecule.ts'/>

/*
	Turns a molecule into linear notation, following some of the SMILES string patterns. The output will be recognisable as a
	connection table, but it should be noted that the conversion process is extremely lossy. There are only certain use cases
	where this makes sense, mainly for interoperability purposes, e.g. pasting into an online searching tool, or embedding in a 
	text format where some molecule is better than none. The output can be made canonical by providing a set of priorities,
	but this is optional, and there is no plan to sync with any of the existing schemes.

	Specific deficiencies which could be addressed:
		- aromaticity is not used at all; the raw bond orders are encoded
		- stereochemistry is not encoded at all
		- no query to SMARTS translation
*/

class BuildSMILES
{
	private seq:number[]; // the walk-order atom sequence
	private link:number[][]; // a list of the linking-codes between nonsequential atoms
	private conn:number[][]; // a list of the "other atom" indices corresponding to above

    // ------------------ public methods --------------------

	// note: pri is an optional parameter that can be used to specify the walk-order preference
	constructor(private mol:Molecule, private pri:number[] = null)
	{
	}
		
	// performs the calculation, and returns the string
	public generate():string
	{
		if (this.mol.numAtoms == 0) return '';

		this.walkSequence();
		this.findLinks();
		return this.assemble();
	}
	
    // ------------------ private methods --------------------

	// orders the atoms by walking down the list
	private walkSequence():void
	{
		const mol = this.mol, na = mol.numAtoms, pri = this.pri;
		this.seq = [];
		let visited = Vec.booleanArray(false, na);
		
		let pos = 1;
		if (pri != null) pos = Vec.idxMin(pri) + 1;
		
		for (let count = 0; count < na; count++)
		{
			this.seq.push(pos);
			visited[pos - 1] = true;

			if (count == na - 1) break; // last atom doesn't need a next

			let adj = mol.atomAdjList(pos);
			let cc = mol.atomConnComp(pos);
			pos = 0;
			
			// see if there is an un-visited neighbour
			for (let n = 0; n < adj.length; n++) if (!visited[adj[n] - 1])
			{
				if (pri == null) {pos = adj[n]; break;}
				if (pos == 0 || pri[adj[n] - 1] < pri[pos - 1]) pos = adj[n];
			}
			if (pos > 0) continue;
			
			// see if there is an un-visited atom in the same component
			for (let n = 1; n <= na; n++) if (!visited[n - 1] && mol.atomConnComp(n) == cc)
			{
				if (pri == null) {pos = n; break;}
				if (pos == 0 || pri[n - 1] < pri[pos - 1]) pos = n;
			}
			if (pos > 0) continue;
			
			// grab the next un-visited atom
			for (let n = 1; n <= na; n++) if (!visited[n - 1])
			{
				if (pri == null) {pos = n; break;}
				if (pos == 0 || pri[n - 1] < pri[pos - 1]) pos = n;
			}
			
			if (pos == 0) throw 'Walk sequence failed.';
		}
	}
	
	// walks through the established sequence, and marks up bonds that do not follow the logical sequence; these need to be
	// assigned a connection number, between each of the atoms
	private findLinks():void
	{
		const mol = this.mol, na = mol.numAtoms, pri = this.pri, seq = this.seq;
		this.link = [];
		this.conn = [];
		for (let n = 0; n < na; n++) {this.link.push([]); this.conn.push([]);}

		let invseq = Vec.numberArray(0, na);
		for (let n = 0; n < na; n++) invseq[seq[n] - 1] = n;
		
		let inPlay = Vec.numberArray(-1, na + 1); // true if number is currently reserved for reconnection
		for (let n = 0; n < na; n++)
		{
			let prev = n > 0 ? seq[n - 1] : 0;
			let cur = seq[n];
			let next = n < na - 1 ? seq[n + 1] : 0;
			
			for (let i = 1; i <= na; i++) if (inPlay[i] >= 0 && n > inPlay[i]) inPlay[i] = -1;
			
			let adj = mol.atomAdjList(cur);
			
			// if we're using priorities, then the adjacency list needs to be sorted
			if (pri != null) for (let p = 0; p < adj.length - 1;)
			{
				if (invseq[adj[p] - 1] > invseq[adj[p + 1] - 1])
				{
					Vec.swap(adj, p, p + 1);
					if (p > 0) p--;
				}
				else p++;
			}
			
			// generate all the obligatory links
			for (let i = 0; i < adj.length; i++)
			{
				if (adj[i] == prev || adj[i] == next) continue; // these are on-sequence, so no need to connect
				let nbr = adj[i];
				if (invseq[cur - 1] > invseq[nbr - 1]) continue; // avoid duplicates
				
				let num = -1;
				for (let j = 1; j <= na; j++) if (inPlay[j] < 0)
				{
					num = j;
					inPlay[j] = Math.max(invseq[cur - 1], invseq[nbr - 1]);
					break;
				}
				
				this.link[cur - 1].push(num);
				this.conn[cur - 1].push(nbr);

				this.link[nbr - 1].push(num);
				this.conn[nbr - 1].push(cur);
			}
		}
	}
	
	// builds the SMILES string from the precomputed data
	private assemble():string
	{
		const mol = this.mol, na = mol.numAtoms, seq = this.seq, link = this.link, conn = this.conn;

		let smiles = '';

		const NON_ESCAPED = ['C', 'N', 'O', 'P', 'S'];
		
		for (let n = 0; n < na; n++)
		{
			let prev = n > 0 ? seq[n - 1] : 0, cur = seq[n];
			let bidx = prev > 0 ? mol.findBond(prev, cur) : 0;
			if (prev > 0 && bidx == 0) smiles += '.';
			if (bidx > 0)
			{
				let bo = mol.bondOrder(bidx);
				if (bo == 2) smiles += '=';
				else if (bo == 3) smiles += '#';
			}
			
			let el = mol.atomElement(cur);
			if (Chemistry.ELEMENTS.indexOf(el) < 0) el = '*';
			let chg = mol.atomCharge(cur);
			if (NON_ESCAPED.indexOf(el) >= 0 && chg == 0)
			{
				smiles += el;
			}
			else
			{
				smiles += '[' + el;
				if (chg > 0) smiles += '+' + chg;
				if (chg < 0) smiles += chg;
				smiles += ']';
			}
			
			let num = link[cur - 1];
			if (num != null) for (let i = 0; i < num.length; i++)
			{
				bidx = mol.findBond(cur, conn[cur - 1][i]);
				let bo = mol.bondOrder(bidx);
				if (bo == 2) smiles += '=';
				else if (bo == 3) smiles += '#';

				if (num[i] < 10) smiles += num[i];
				else smiles += '%' + num[i];
			}
		}

		return smiles;
	}
	
}