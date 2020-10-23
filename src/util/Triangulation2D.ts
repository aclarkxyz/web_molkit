/*
	WebMolKit

	(c) 2010-2019 Molecular Materials Informatics, Inc.

	All rights reserved

	http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	Delaunay triangulator: takes a jumble of 2D points and converts them into a collection of triangles. This initially generates a collection of
	triangles that adds up to the convex hull, but it is fairly straightforward to delete triangles in order to get to some kind of concave subset
	based on a given threshold. From there, tracing the outline is routine.

	Original algorithm adapted from JavaScript implementation of "Delaunator" (https://github.com/mapbox/delaunator), which bears the following license:

		ISC License

		Copyright (c) 2017, Mapbox

		Permission to use, copy, modify, and/or distribute this software for any purpose
		with or without fee is hereby granted, provided that the above copyright notice
		and this permission notice appear in all copies.

		THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
		REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
		FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
		INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
		OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
		TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
		THIS SOFTWARE.
*/

const EPSILON = Math.pow(2, -52);

export class Triangulation2D
{
	public sz:number;
	public numTriangles = 0;
	public triangles:number[];
	public halfedges:number[];

	private edgeStack = Vec.numberArray(0, 512);
	private hashSize:number;
	private hullPrev:number[];
	private hullNext:number[];
	private hullTri:number[];
	private hullHash:number[];
	private ids:number[];
	private dists:number[];
	private centreX:number;
	private centreY:number;
	private hullStart:number;
	private hull:number[] = null;

	// ------------ public methods ------------

	// starts up with an empty container
	constructor(public px:number[], public py:number[])
	{
		this.px = px;
		this.py = py;

		// arrays that will store the triangulation graph
		this.sz = px.length;
		let maxTriangles = Math.max(2 * this.sz - 5, 0);
		this.triangles = new Array(maxTriangles * 3);
		this.halfedges = new Array(maxTriangles * 3);

		// temporary arrays for tracking the edges of the advancing convex hull
		this.hashSize = Math.ceil(Math.sqrt(this.sz));
		this.hullPrev = new Array(this.sz);
		this.hullNext = new Array(this.sz);
		this.hullTri = new Array(this.sz);
		this.hullHash = Vec.numberArray(-1, this.hashSize);

		// temporary arrays for sorting points
		this.ids = new Array(this.sz);
		this.dists = new Array(this.sz);

		this.update();
	}

	// iteratively goes through triangles and removes outer edges that are longer than the given threshold, which is a way of making it concave
	public trimConcave(threshold:number):number[]
	{
		const threshSq = sqr(threshold);

		const {sz, px, py} = this;
		let tri = this.triangles.slice(0);
		let edgeCount = new Map<number, number>();

		while (true)
		{
			const ntri = tri.length / 3;

			// count the # of instances per edge
			edgeCount.clear();
			for (let n = 0, i = 0; n < ntri; n++, i += 3)
			{
				const e1 = sz * Math.min(tri[i + 0], tri[i + 1]) + Math.max(tri[i + 0], tri[i + 1]);
				const e2 = sz * Math.min(tri[i + 0], tri[i + 2]) + Math.max(tri[i + 0], tri[i + 2]);
				const e3 = sz * Math.min(tri[i + 1], tri[i + 2]) + Math.max(tri[i + 1], tri[i + 2]);
				edgeCount.set(e1, (edgeCount.get(e1) || 0) + 1);
				edgeCount.set(e2, (edgeCount.get(e2) || 0) + 1);
				edgeCount.set(e3, (edgeCount.get(e3) || 0) + 1);
			}

			// any triangle that has one long unique (outer) edge gets the chop
			let mask = Vec.booleanArray(true, ntri);
			for (let n = 0, i = 0; n < ntri; n++, i += 3)
			{
				const i1 = tri[i], i2 = tri[i + 1], i3 = tri[i + 2];
				const e1 = sz * Math.min(i1, i2) + Math.max(i1, i2);
				const e2 = sz * Math.min(i1, i3) + Math.max(i1, i3);
				const e3 = sz * Math.min(i2, i3) + Math.max(i2, i3);
				const c1 = edgeCount.get(e1), c2 = edgeCount.get(e2), c3 = edgeCount.get(e3);

				if (c1 == 1 && c2 != 1 && c3 != 1) mask[n] = norm2_xy(px[i1] - px[i2], py[i1] - py[i2]) < threshSq;
				else if (c1 != 1 && c2 == 1 && c3 != 1) mask[n] = norm2_xy(px[i1] - px[i3], py[i1] - py[i3]) < threshSq;
				else if (c1 != 1 && c2 != 1 && c3 == 1) mask[n] = norm2_xy(px[i2] - px[i3], py[i2] - py[i3]) < threshSq;
			}

			if (Vec.allTrue(mask)) break;

			// create a smaller version
			let rep:number[] = new Array(Vec.maskCount(mask) * 3);
			for (let n = 0, i = 0, j = 0; n < ntri; n++, i += 3) if (mask[n])
			{
				rep[j++] = tri[i];
				rep[j++] = tri[i + 1];
				rep[j++] = tri[i + 2];
			}
			tri = rep;
		}

		return tri;
	}

	// finds the set of points that traces the outline; the triangles can either be the original set (convex) or the trimmed set (concave)
	public traceOutline(tri:number[]):number[]
	{
		const ntri = tri.length / 3;
		const {sz, px, py} = this;

		let edgeCount = new Map<number, number>();

		// count the # of instances per edge
		for (let n = 0, i = 0; n < ntri; n++, i += 3)
		{
			const e1 = sz * Math.min(tri[i + 0], tri[i + 1]) + Math.max(tri[i + 0], tri[i + 1]);
			const e2 = sz * Math.min(tri[i + 0], tri[i + 2]) + Math.max(tri[i + 0], tri[i + 2]);
			const e3 = sz * Math.min(tri[i + 1], tri[i + 2]) + Math.max(tri[i + 1], tri[i + 2]);
			edgeCount.set(e1, (edgeCount.get(e1) || 0) + 1);
			edgeCount.set(e2, (edgeCount.get(e2) || 0) + 1);
			edgeCount.set(e3, (edgeCount.get(e3) || 0) + 1);
		}

		// collect the unique (outer) edges
		let edges:number[] = [];
		for (let entry of edgeCount.entries()) if (entry[1] == 1)
		{
			const e = entry[0];
			const i1 = Math.floor(e / sz), i2 = e % sz;
			edges.push(i1);
			edges.push(i2);
		}

		// list the constituent indices, and make a divalent graph
		const idx = Vec.uniqueUnstable(edges);
		const isz = idx.length;
		const idxMap = new Map<number, number>();
		for (let n = 0; n < isz; n++) idxMap.set(idx[n], n);
		let g1 = Vec.numberArray(-1, isz), g2 = Vec.numberArray(-1, isz);
		for (let n = 0; n < edges.length; n += 2)
		{
			//int i1 = Arrays.binarySearch(idx, edges.get(n)), i2 = Arrays.binarySearch(idx, edges.get(n + 1));
			const i1 = idxMap.get(edges[n]), i2 = idxMap.get(edges[n + 1]);
			if (g1[i1] < 0) g1[i1] = i2; else g2[i1] = i2;
			if (g1[i2] < 0) g1[i2] = i1; else g2[i2] = i1;
		}

		// pick a starting point and walk around the divalent graph
		let mask = Vec.booleanArray(false, isz);
		let sequence = new Array(isz);
		sequence[0] = 0;
		mask[0] = true;
		for (let n = 1; n < isz; n++)
		{
			const i = sequence[n - 1];
			if (!mask[g1[i]]) sequence[n] = g1[i]; else sequence[n] = g2[i];
			mask[sequence[n]] = true;
		}
		return Vec.idxGet(idx, sequence);
	}

	// ------------ private methods ------------

	private update():void
	{
		const sz = this.sz;
		let {px, py, ids, dists, triangles, halfedges} = this;

		const minX = Vec.min(px), minY = Vec.min(py);
		const maxX = Vec.max(px), maxY = Vec.max(py);
		for (let n = 0; n < sz; n++) ids[n] = n;

		this.centreX = 0.5 * (minX + maxX);
		this.centreY = 0.5 * (minY + maxY);
		let i0 = 0, i1 = 0, i2 = 0;

		// pick a seed point close to the center
		let minDist = Number.POSITIVE_INFINITY;
		for (let n = 0; n < sz; n++)
		{
			const d = norm_xy(this.centreX - px[n], this.centreY - py[n]);
			if (d < minDist)
			{
				i0 = n;
				minDist = d;
			}
		}
		const i0x = px[i0], i0y = py[i0];

		minDist = Number.POSITIVE_INFINITY;

		// find the point closest to the seed
		for (let n = 0; n < sz; n++)
		{
			if (n == i0) continue;
			const d = norm_xy(i0x - px[n], i0y - py[n]);
			if (d < minDist && d > 0)
			{
				i1 = n;
				minDist = d;
			}
		}
		let i1x = px[i1], i1y = py[i1];

		// find the third point which forms the smallest circumcircle with the first two
		let minRadius = Number.POSITIVE_INFINITY;
		for (let n = 0; n < sz; n++)
		{
			if (n == i0 || n == i1) continue;
			let r = this.circumRadius(i0x, i0y, i1x, i1y, px[n], py[n]);
			if (r < minRadius)
			{
				i2 = n;
				minRadius = r;
			}
		}
		let i2x = px[i2], i2y = py[i2];

		if (!Number.isFinite(minRadius))
		{
			// order co-linear points by dx (or dy if all x are identical) and return the list as a hull
			for (let n = 0; n < sz; n++)
			{
				dists[n] = px[n] - px[0];
				if (dists[n] == 0) dists[n] = py[n] - py[0];
			}
			this.quicksort(0, sz - 1);
			let hull = new Array(sz);
			let j = 0;
			let d0 = Number.NEGATIVE_INFINITY;
			for (let n = 0; n < sz; n++)
			{
				let id = ids[n];
				if (dists[id] > d0)
				{
					hull[j++] = id;
					d0 = dists[id];
				}
			}
			this.hull = hull.slice(0, j);
			triangles = [];
			halfedges = [];
			return;
		}

		// swap the order of the seed points for counter-clockwise orientation
		if (this.orient(i0x, i0y, i1x, i1y, i2x, i2y))
		{
			let i = i1;
			let x = i1x, y = i1y;
			i1 = i2;
			i1x = i2x;
			i1y = i2y;
			i2 = i;
			i2x = x;
			i2y = y;
		}

		this.pickCircumCentre(i0x, i0y, i1x, i1y, i2x, i2y);

		for (let n = 0; n < sz; n++) dists[n] = norm_xy(px[n] - this.centreX, py[n] - this.centreY);

		// sort the points by distance from the seed triangle circumcenter
		this.quicksort(0, sz - 1);

		// set up the seed triangle as the starting hull
		this.hullStart = i0;
		let hullSize = 3;

		const {hullNext, hullPrev, hullTri, hullHash, hashSize} = this;

		hullNext[i0] = hullPrev[i2] = i1;
		hullNext[i1] = hullPrev[i0] = i2;
		hullNext[i2] = hullPrev[i1] = i0;

		hullTri[i0] = 0;
		hullTri[i1] = 1;
		hullTri[i2] = 2;

		hullHash.fill(-1);
		hullHash[this.hashKey(i0x, i0y)] = i0;
		hullHash[this.hashKey(i1x, i1y)] = i1;
		hullHash[this.hashKey(i2x, i2y)] = i2;

		this.numTriangles = 0;
		this.addTriangle(i0, i1, i2, -1, -1, -1);

		let xp = 0, yp = 0;
		for (let k = 0; k < ids.length; k++)
		{
			let i = ids[k];
			let x = px[i], y = py[i];

			// skip near-duplicate points
			if (k > 0 && Math.abs(x - xp) <= EPSILON && Math.abs(y - yp) <= EPSILON) continue;
			xp = x;
			yp = y;

			// skip seed triangle points
			if (i == i0 || i == i1 || i == i2) continue;

			// find a visible edge on the convex hull using edge hash
			let start = 0;
			for (let j = 0, key = this.hashKey(x, y); j < hashSize; j++)
			{
				start = hullHash[(key + j) % hashSize];
				if (start >= 0 && start != hullNext[start]) break;
			}

			start = hullPrev[start];
			let e = start, q = hullNext[e];
			while (!this.orient(x, y, px[e], py[e], px[q], py[q]))
			{
				e = q;
				if (e == start)
				{
					e = -1;
					break;
				}
				q = hullNext[e];
			}
			if (e < 0) continue; // likely a near-duplicate point; skip it

			// add the first triangle from the point
			let t = this.addTriangle(e, i, hullNext[e], -1, -1, hullTri[e]);

			// recursively flip triangles from the point until they satisfy the Delaunay condition
			hullTri[i] = this.legalise(t + 2);
			hullTri[e] = t; // keep track of boundary triangles on the hull
			hullSize++;

			// walk forward through the hull, adding more triangles and flipping recursively
			let n = hullNext[e];
			q = hullNext[n];
			while (this.orient(x, y, px[n], py[n], px[q], py[q]))
			{
				t = this.addTriangle(n, i, q, hullTri[i], -1, hullTri[n]);
				hullTri[i] = this.legalise(t + 2);
				hullNext[n] = n; // mark as removed
				hullSize--;
				n = q;
				q = hullNext[n];
			}

			// walk backward from the other side, adding more triangles and flipping
			if (e == start)
			{
				q = hullPrev[e];
				while (this.orient(x, y, px[q], py[q], px[e], py[e]))
				{
					t = this.addTriangle(q, i, e, -1, hullTri[e], hullTri[q]);
					this.legalise(t + 2);
					hullTri[q] = t;
					hullNext[e] = e; // mark as removed
					hullSize--;
					e = q;
					q = hullPrev[e];
				}
			}

			// update the hull indices
			this.hullStart = hullPrev[i] = e;
			hullNext[e] = hullPrev[n] = i;
			hullNext[i] = n;

			// save the two new edges in the hash table
			hullHash[this.hashKey(x, y)] = i;
			hullHash[this.hashKey(px[e], py[e])] = e;
		}

		this.hull = new Array(hullSize);
		for (let n = 0, e = this.hullStart; n < hullSize; n++)
		{
			this.hull[n] = e;
			e = hullNext[e];
		}

		// trim typed triangle mesh arrays
		this.triangles = triangles.slice(0, this.numTriangles);
		this.halfedges = halfedges.slice(0, this.numTriangles);
	}

	private hashKey(x:number, y:number):number
	{
		return Math.floor(this.pseudoAngle(x - this.centreX, y - this.centreY) * this.hashSize) % this.hashSize;
	}

	private legalise(a:number):number
	{
		let i = 0;
		let ar = 0;

		// recursion eliminated with a fixed-size stack
		while (true)
		{
			let b = this.halfedges[a];

			/* if the pair of triangles doesn't satisfy the Delaunay condition
			 * (p1 is inside the circumcircle of [p0, pl, pr]), flip them,
			 * then do the same check/flip recursively for the new pair of triangles
			 *
			 *           pl                    pl
			 *          /||\                  /  \
			 *       al/ || \bl            al/    \a
			 *        /  ||  \              /      \
			 *       /  a||b  \    flip    /___ar___\
			 *     p0\   ||   /p1   =>   p0\---bl---/p1
			 *        \  ||  /              \      /
			 *       ar\ || /br             b\    /br
			 *          \||/                  \  /
			 *           pr                    pr
			 */
			let a0 = a - a % 3;
			ar = a0 + (a + 2) % 3;

			if (b < 0) // convex hull edge
			{
				if (i == 0) break;
				a = this.edgeStack[--i];
				continue;
			}

			const b0 = b - b % 3;
			const al = a0 + (a + 1) % 3;
			const bl = b0 + (b + 2) % 3;

			const {px, py, triangles, halfedges} = this;
			const p0 = triangles[ar];
			const pr = triangles[a];
			const pl = triangles[al];
			const p1 = triangles[bl];

			let illegal = this.inCircle(px[p0], py[p0], px[pr], py[pr], px[pl], py[pl], px[p1], py[p1]);

			if (illegal)
			{
				this.triangles[a] = p1;
				this.triangles[b] = p0;

				const hbl = halfedges[bl];

				// edge swapped on the other side of the hull (rare); fix the halfedge reference
				if (hbl < 0)
				{
					let e = this.hullStart;
					do
					{
						if (this.hullTri[e] == bl)
						{
							this.hullTri[e] = a;
							break;
						}
						e = this.hullPrev[e];
					}
					while (e != this.hullStart);
				}
				this.link(a, hbl);
				this.link(b, halfedges[ar]);
				this.link(ar, bl);

				const br = b0 + (b + 1) % 3;

				// don't worry about hitting the cap: it can only happen on extremely degenerate input
				if (i < this.edgeStack.length) this.edgeStack[i++] = br;
			}
			else
			{
				if (i == 0) break;
				a = this.edgeStack[--i];
			}
		}

		return ar;
	}

	private link(a:number, b:number):void
	{
		this.halfedges[a] = b;
		if (b >= 0) this.halfedges[b] = a;
	}

	 // add a new triangle given vertex indices and adjacent half-edge ids
	private addTriangle(i0:number, i1:number, i2:number, a:number, b:number, c:number):number
	{
		const t = this.numTriangles;
		this.triangles[t] = i0;
		this.triangles[t + 1] = i1;
		this.triangles[t + 2] = i2;
		this.link(t, a);
		this.link(t + 1, b);
		this.link(t + 2, c);
		this.numTriangles += 3;
		return t;
	}

	// monotonically increases with real angle, but doesn't need expensive trigonometry
	private pseudoAngle(dx:number, dy:number):number
	{
		const p = dx / (Math.abs(dx) + Math.abs(dy));
		return (dy > 0 ? 3 - p : 1 + p) / 4; // [0..1]
	}

	// return 2d orientation sign if we're confident in it through J. Shewchuk's error bound check
	private orientIfSure(px:number, py:number, rx:number, ry:number, qx:number, qy:number):number
	{
		const l = (ry - py) * (qx - px);
		const r = (rx - px) * (qy - py);
		return Math.abs(l - r) >= 3.3306690738754716e-16 * Math.abs(l + r) ? l - r : 0;
	}

	// a more robust orientation test that's stable in a given triangle (to fix robustness issues)
	private orient(rx:number, ry:number, qx:number, qy:number, px:number, py:number):boolean
	{
		let o = this.orientIfSure(px, py, rx, ry, qx, qy);
		if (o != 0) return o < 0;
		o = this.orientIfSure(rx, ry, qx, qy, px, py);
		if (o != 0) return o < 0;
		o = this.orientIfSure(qx, qy, px, py, rx, ry);
		return o < 0;
	}

	private inCircle(ax:number, ay:number, bx:number, by:number, cx:number, cy:number, px:number, py:number):boolean
	{
		const dx = ax - px;
		const dy = ay - py;
		const ex = bx - px;
		const ey = by - py;
		const fx = cx - px;
		const fy = cy - py;

		const ap = dx * dx + dy * dy;
		const bp = ex * ex + ey * ey;
		const cp = fx * fx + fy * fy;

		return dx * (ey * cp - bp * fy) -
			   dy * (ex * cp - bp * fx) +
			   ap * (ex * fy - ey * fx) < 0;
	}

	private circumRadius(ax:number, ay:number, bx:number, by:number, cx:number, cy:number):number
	{
		const dx = bx - ax;
		const dy = by - ay;
		const ex = cx - ax;
		const ey = cy - ay;

		const bl = dx * dx + dy * dy;
		const cl = ex * ex + ey * ey;
		const d = 0.5 / (dx * ey - dy * ex);

		const x = (ey * bl - dy * cl) * d;
		const y = (dx * cl - ex * bl) * d;

		return x * x + y * y;
	}

	private pickCircumCentre(ax:number, ay:number, bx:number, by:number, cx:number, cy:number):void
	{
		const dx = bx - ax;
		const dy = by - ay;
		const ex = cx - ax;
		const ey = cy - ay;

		const bl = dx * dx + dy * dy;
		const cl = ex * ex + ey * ey;
		const d = 0.5 / (dx * ey - dy * ex);

		this.centreX = ax + (ey * bl - dy * cl) * d;
		this.centreY = ay + (dx * cl - ex * bl) * d;
	}

	private quicksort(left:number, right:number):void
	{
		const {ids, dists} = this;
		if (right - left <= 20)
		{
			for (let i = left + 1; i <= right; i++)
			{
				const temp = ids[i];
				const tempDist = dists[temp];
				let j = i - 1;
				while (j >= left && dists[ids[j]] > tempDist) ids[j + 1] = ids[j--];
				ids[j + 1] = temp;
			}
		}
		else
		{
			let median = (left + right) >> 1;
			let i = left + 1;
			let j = right;
			Vec.swap(ids, median, i);
			if (dists[ids[left]] > dists[ids[right]]) Vec.swap(ids, left, right);
			if (dists[ids[i]] > dists[ids[right]]) Vec.swap(ids, i, right);
			if (dists[ids[left]] > dists[ids[i]]) Vec.swap(ids, left, i);

			let temp = ids[i];
			const tempDist = dists[temp];
			while (true)
			{
				do i++; while (dists[ids[i]] < tempDist);
				do j--; while (dists[ids[j]] > tempDist);
				if (j < i) break;
				Vec.swap(ids, i, j);
			}
			ids[left + 1] = ids[j];
			ids[j] = temp;

			if (right - i + 1 >= j - left)
			{
				this.quicksort(i, right);
				this.quicksort(left, j - 1);
			}
			else
			{
				this.quicksort(left, j - 1);
				this.quicksort(i, right);
			}
		}
	}
}

/* EOF */ }