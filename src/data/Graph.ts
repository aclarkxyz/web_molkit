/*
	WebMolKit

	(c) 2010-2018 Molecular Materials Informatics, Inc.

	All rights reserved
	
	http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='Molecule.ts'/>
///<reference path='../util/util.ts'/>

namespace WebMolKit /* BOF */ {

/* 
	Representation of a unidirectional graph which has simple node labels, and no edge labels. Connections are stored in neighbour
	list form. Construction of the graph is faster if the number of nodes are known ahead of time. Cloning a graph instance, or
	building it from some other graph datastructure, has minimal overhead.
	
	Note that all indices are 0-based.
	
	Practical note: the Molecule class has much analogous functionality. The Graph class is intended to be a cleaner and more 
	lightweight implementation of algorithms which are not necessarily related to a molecular datastructure.
	The Molecule class has a lot of features such as caching calculated values, which is very useful for general purpose work;
	the algorithms in the Graph class have more intuitive and predictable performance characteristics, and do not have shortcuts
	such as caching.
*/

export class Graph
{
	private nbrs:number[][] = []; // neighbour-list, one per node
	private indices:number[] = null; // optional integer value for each node
	private labels:string[] = null; // optional string value for each node
	private props:any[] = null; // optional object for each node; is always a shallow copy

	// ----------------- public methods -----------------

	constructor(sz?:number, edge1?:number[], edge2?:number[])
	{
		if (sz != null) for (let n = 0; n < sz; n++) this.nbrs.push([]);
		if (edge1 != null && edge2 != null)
		{
			for (let n = 0; n < edge1.length; n++)
			{
				this.nbrs[edge1[n]].push(edge2[n]);
				this.nbrs[edge2[n]].push(edge1[n]);
			}
		}
	}
	
	public clone():Graph
	{
		let g = new Graph();
		for (let nbr of this.nbrs) g.nbrs.push(nbr.slice(0));
		g.indices = this.indices == null ? null : this.indices.slice(0);
		g.labels = this.labels == null ? null : this.labels.slice(0);
		g.props = this.props == null ? null : this.props.slice(0);
		return g;
	}

	public static fromMolecule(mol:Molecule):Graph
	{
		let g = new Graph();
		g.indices = [];
		for (let n = 0; n < mol.numAtoms; n++) 
		{
			g.nbrs.push([]);
			g.indices.push(n + 1);
		}
		for (let n = 1; n <= mol.numBonds; n++)
		{
			let bfr = mol.bondFrom(n) - 1, bto = mol.bondTo(n) - 1;
			g.nbrs[bfr].push(bto);
			g.nbrs[bto].push(bfr);
		}
		return g;
	}
	
	public toString():string
	{
		let buff = '#nodes=' + this.nbrs.length;
		for (let n = 0; n < this.nbrs.length; n++)
		{
			buff += ' ' + n + ':{' + this.nbrs[n] + '}';
			if (n < Vec.arrayLength(this.indices)) buff += '[i=' + this.indices[n] + ']';
			if (n < Vec.arrayLength(this.labels)) buff += '[l=' + this.labels[n] + ']';
		}
		return buff;
	}

	public get numNodes():number {return this.nbrs.length;}
	public numEdges(node:number):number {return this.nbrs[node].length;}
	public getEdge(node:number, edge:number):number {return this.nbrs[node][edge];}
	public getEdges(node:number):number[] {return this.nbrs[node];}

	public getIndex(node:number):number {return this.indices == null ? 0 : this.indices[node];}
	public setIndex(node:number, idx:number):void
	{
		if (this.indices == null) this.indices = Vec.numberArray(0, this.nbrs.length);
		this.indices[node] = idx;
	}
	
	public getLabel(node:number):string {return this.labels == null ? null : this.labels[node];}
	public setLabel(node:number, lbl:string):void
	{
		if (this.labels == null) this.labels = Vec.stringArray('', this.nbrs.length);
		this.labels[node] = lbl;
	}
	
	public getProperty(node:number):any {return this.props == null ? null : this.props[node];}
	public setProperty(node:number, prp:any):void
	{
		if (this.props == null) this.props = new Array(this.nbrs.length);
		this.props[node] = prp;
	}

	public addNode():number
	{
		this.nbrs.push([]);
		if (this.indices != null) this.indices.push(0);
		if (this.labels != null) this.labels.push('');
		if (this.props != null) this.props.push(null);
		return this.nbrs.length - 1;
	}
	
	public hasEdge(node1:number, node2:number):boolean
	{
		if (this.nbrs[node1].length <= this.nbrs[node2].length)
			return this.nbrs[node1].indexOf(node2) >= 0;
		else
			return this.nbrs[node2].indexOf(node1) >= 0;
	}
	
	public addEdge(node1:number, node2:number):void
	{
		this.nbrs[node1].push(node2);
		this.nbrs[node2].push(node1);
	}

	public removeEdge(node1:number, node2:number):void
	{
		let i1 = this.nbrs[node1].indexOf(node2), i2 = this.nbrs[node2].indexOf(node1);
		if (i1 >= 0) this.nbrs[node1].splice(i1, 1);
		if (i2 >= 0) this.nbrs[node2].splice(i2, 1);
	}
	
	public isolateNode(node:number):void
	{
		for (let o of this.nbrs[node])
		{
			let i = this.nbrs[o].indexOf(node);
			if (i >= 0) this.nbrs[o].splice(i, 1);
		}
		this.nbrs[node] = [];
	}

	// keep/remove: modify graph in place by taking out some nodes
	public keepNodesMask(mask:boolean[]):void
	{
		const oldsz = this.nbrs.length, newsz = Vec.maskCount(mask);
		if (newsz == oldsz) return;
		if (newsz == 0) 
		{
			this.nbrs = []; 
			this.indices = null; 
			this.labels = null; 
			this.props = null; 
			return;
		}

		let newmap = Vec.maskMap(mask);
		let newnbrs:number[][] = [];
		for (let n = 0; n < newsz; n++) newnbrs.push([]);
		for (let n = 0, pos = 0; n < oldsz; n++) if (mask[n])
		{
			for (let i of this.nbrs[n]) if (mask[i]) newnbrs[pos].push(newmap[i]);
			pos++;
		}
		this.nbrs = newnbrs;
		
		if (this.indices != null) this.indices = Vec.maskGet(this.indices, mask);
		if (this.labels != null) this.labels = Vec.maskGet(this.labels, mask);
		if (this.props != null) this.props = Vec.maskGet(this.props, mask);
	}
	public keepNodesIndex(idx:number[]) {this.keepNodesMask(Vec.idxMask(idx, this.numNodes));}
	public removeNodesMask(mask:boolean[]) {this.keepNodesMask(Vec.notMask(mask));}
	public removeNodesIndex(idx:number[]) {this.removeNodesMask(Vec.idxMask(idx, this.numNodes));}
	
	// subgraph: creates a new graph, typically smaller; note that the index version honours the new atom order
	public subgraphIndex(idx:number[]):Graph
	{
		const nsz = idx.length;
		let g = new Graph(nsz);
		if (this.indices != null || this.labels != null || this.props != null) for (let n = 0; n < nsz; n++)
		{
			if (this.indices != null) g.setIndex(n, this.indices[idx[n]]);
			if (this.labels != null) g.setLabel(n, this.labels[idx[n]]);
			if (this.props != null) g.setProperty(n, this.props[idx[n]]);
		}
		for (let i = 0; i < nsz; i++)
		{
			for (let n of this.nbrs[idx[i]])
			{
				let j = idx.indexOf(n);
				if (j > i) g.addEdge(i, j);
			}
		}
		return g;
	}
	public subgraphMask(mask:boolean[]):Graph
	{
		let g = this.clone();
		g.keepNodesMask(mask);
		return g;
	}
	
	// returns a list of connected component indices, one per node; the numbering system is based on node ordering
	public calculateComponents():number[]
	{
		const sz = this.nbrs.length;
		if (sz == 0) return [];

		let cc = Vec.numberArray(0, sz);
		cc[0] = 1;
		let first = 1, high = 1;
		while (true)
		{
			while (first < sz && cc[first] > 0) {first++;}
			if (first >= sz) break;

			let anything = false;
			for (let i = first; i < sz; i++) if (cc[i] == 0)
			{
				for (let j = 0; j < this.nbrs[i].length; j++)
				{
					if (cc[this.nbrs[i][j]] != 0)
					{
						cc[i] = cc[this.nbrs[i][j]];
						anything = true;
					}
				}
			}
			if (!anything) cc[first] = ++high;
		}

		return cc;
	}
	
	// returns an array of one group for each connected component
	public calculateComponentGroups():number[][]
	{
		if (this.nbrs.length == 0) return [];
		let cc = this.calculateComponents();
		let sz = Vec.max(cc);

		let grp:number[][] = [];
		for (let n = 0; n < sz; n++) grp.push([]);
		for (let n = 0; n < cc.length; n++) grp[cc[n] - 1].push(n);
		return grp;
	}
	
/*
	public int calculateRingBlocks(int[] rblk)
	{
		final int sz = numNodes();
		if (sz == 0) return 0;

		boolean[] visited = Vec.booleanArray(false, sz);
		Vec.setTo(rblk, 0);
		int[] path = new int[sz + 1];
		int plen = 0, numVisited = 0;
		
		while (true)
		{
			int last, current;
	
			if (plen == 0)
			{
				last = -1;
				for (current = 0; visited[current]; current++) {}
			}
			else
			{
				last = path[plen - 1];
				current = -1;
				for (int n = 0; n < nbrs[last].length; n++) if (!visited[nbrs[last][n]]) {current = nbrs[last][n]; break;}
			}

			if (current >= 0 && plen >= 2) // path is at least 2 items long, so look for any not-previous visited neighbours
			{
				int back = path[plen - 1];
				for (int n = 0; n < nbrs[current].length; n++)
				{
					int join = nbrs[current][n];
					if (join != back && visited[join])
					{
						path[plen] = current;
						for (int i = plen; i == plen || path[i + 1] != join; i--)
						{
							int id = rblk[path[i]];
							if (id == 0) rblk[path[i]] = last;
							else if (id != last)
							{
								for (int j = 0; j < sz; j++)
									if (rblk[j] == id) rblk[j] = last;
							}
						}
					}
				}
			}
			if (current >= 0) // can mark the new one as visited
			{
				visited[current] = true;
				path[plen++] = current;
				numVisited++;
			}
			else // otherwise, found nothing and must rewind the path
			{
				plen--;
			}
			
			if (numVisited == sz) break;
		}

		// the ring ID's are not necessarily consecutive, so reassign them to 0=none, 1..NBlocks
		int nextID = 0;
		for (int i = 0; i < sz; i++) if (rblk[i] > 0)
		{
			nextID--;
			for (int j = sz - 1; j >= i; j--)
				if (rblk[j] == rblk[i]) rblk[j] = nextID;
		}
		for (int i = 0; i < sz; i++) rblk[i] = -rblk[i];
		
		return -nextID;
	}
	
	public int[] calculateRingBlocks()
	{
		int[] rblk = new int[numNodes()];
		calculateRingBlocks(rblk);
		return rblk;
	}
	
	public int[][] calculateRingBlockGroups()
	{
		int[] rblk = new int[numNodes()];
		int sz = calculateRingBlocks(rblk);
		if (sz == 0) return new int[0][];

		int[] cap = Vec.intArray(0, sz);
		for (int n = 0; n < rblk.length; n++) if (rblk[n] > 0) cap[rblk[n] - 1]++;

		int[][] grp = new int[sz][];
		for (int n = 0; n < sz; n++)
		{
			grp[n] = new int[cap[n]];
			cap[n] = 0;
		}
		for (int n = 0; n < rblk.length; n++)
		{
			final int i = rblk[n] - 1;
			if (i < 0) continue;
			grp[i][cap[i]++] = n;
		}
		return grp;
	}
	
	public int[][] findRingsOfSize(int size)
	{
		int[] rblk = new int[numNodes()];
		int num = calculateRingBlocks(rblk);
		if (num == 0) return new int[0][];
		
		List<int[]> rings = new ArrayList<>();
		boolean[] mask = new boolean[numNodes()];

		for (int r = 1; r <= num; r++)
		{
			for (int n = 0; n < numNodes(); n++) mask[n] = rblk[n] == r;
			int[][] newRings = findRingsOfSize(size, mask);
			for (int n = 0; n < newRings.length; n++) rings.add(newRings[n]);
		}
		return rings.toArray(new int[rings.size()][]);
	}

	public int[][] findRingsOfSize(int size, boolean[] mask) 
	{
		List<int[]> rings = new ArrayList<>();
		for (int n = 0; n < numNodes(); n++) if (mask[n])
		{
			int path[] = new int[size];
			path[0] = n;
			recursiveRingFind(path, 1, size, mask, rings);
		}

		return rings.toArray(new int[rings.size()][]);
	}*/
	
	// returns breadth-first-search order
	public calculateBFS(idx:number):number[]
	{
		let ret = Vec.numberArray(-1, this.numNodes);
		ret[idx] = 0;

		let curnum = 0, lsz = 1, watermark = 0;
		let list = Vec.numberArray(0, this.numNodes);
		list[0] = idx;

		while (true)
		{
			let newsz = lsz;
			for (let n = watermark; n < lsz; n++)
			{
				for (let i = 0; i < this.nbrs[list[n]].length; i++)
				{
					let j = this.nbrs[list[n]][i];
					if (ret[j] < 0)
					{
						ret[j] = curnum + 1;
						list[newsz++] = j;
					}
				}
			}
			if (newsz == lsz) break;
			watermark = lsz;
			lsz = newsz;
			curnum++;
		}
		return ret;
	}
	
	/*public int[] calculateGravity()
	{
		final int sz = numNodes();
		int[] wght = Vec.intArray(1, sz), wmod = new int[sz];
		for (int n = 0; n < sz; n++)
		{
			Vec.setTo(wmod, wght);
			for (int i = 0; i < sz; i++) for (int j = nbrs[i].length - 1; j >= 0; j--) wmod[i] += wght[nbrs[i][j]];
			Vec.setTo(wght, wmod);
		}
		return wght;
	}*/

	// ----------------- private methods -----------------

/*
	// ring hunter: recursive step; finds, compares and collects
	private void recursiveRingFind(int[] path, int psize, int capacity, boolean[] mask, List<int[]> rings)
	{
		// not enough atoms yet, so look for new possibilities
		if (psize < capacity)
		{
			int last = path[psize - 1];
			for (int n = 0; n < nbrs[last].length; n++)
			{
				int adj = nbrs[last][n];
				if (!mask[adj]) continue;
				boolean fnd = false;
				for (int i = 0; i < psize; i++) if (path[i] == adj)
				{
					fnd = true;
					break;
				}
				if (!fnd)
				{
					int newPath[] = Vec.duplicate(path);
					newPath[psize] = adj;
					recursiveRingFind(newPath, psize + 1, capacity, mask, rings);
				}
			}
			return;
		}
	
		// path is full, so make sure it eats its tail
		int last = path[psize - 1];
		boolean fnd = false;
		for (int n = 0; n < nbrs[last].length; n++) if (nbrs[last][n] == path[0]) {fnd = true; break;}
		if (!fnd) return;

		// make sure every element in the path has exactly 2 neighbours within the path; otherwise it is spanning a bridge, which
		// is an undesirable ring definition
		for (int n = 0; n < path.length; n++)
		{
			int count = 0, p = path[n];
			for (int i = 0; i < nbrs[p].length; i++) if (Vec.indexOf(nbrs[p][i], path) >= 0) count++;
			if (count != 2) return; // invalid
		}
	
		// reorder the array then look for duplicates
		int first = 0;
		for (int n = 1; n < psize; n++) if (path[n] < path[first]) first = n;
		int fm = (first - 1 + psize) % psize, fp = (first + 1) % psize;
		boolean flip = path[fm] < path[fp];
		if (first != 0 || flip)
		{
			int newPath[] = new int[psize];
			for (int n = 0; n < psize; n++) newPath[n] = path[(first + (flip ? psize - n : n)) % psize];
			path = newPath;
		}
		
		for (int n = 0; n < rings.size(); n++)
		{
			int[] look = (int[]) rings.get(n);
			boolean same = true;
			for (int i = 0; i < psize; i++) if (look[i] != path[i])
			{
				same = false;
				break;
			}
			if (same) return;
		}
		
		rings.add(path);
	}
	*/
}

/* EOF */ }