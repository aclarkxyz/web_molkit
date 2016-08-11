/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../util/util.ts'/>
///<reference path='../util/Vec.ts'/>

/*
	Geometry utilities, which are typically graphics related.
*/

class GeomUtil
{
	// static: returns true if the point (x,y) is inside the given polygon (px,py)
	public static pointInPolygon(x:number, y:number, px:number[], py:number[]):boolean
	{
		if (x < minArray(px) || x > maxArray(px) || y < minArray(py) || y > maxArray(py)) return false;
		let sz = px.length;
		for (let n = 0; n < sz; n++) if (px[n] == x && py[n] == y) return true; // point is on a vertex
		
		let phase = false;
		
		for (let n = 0; n < sz; n++)
		{
			let x1 = px[n], y1 = py[n], x2 = px[n + 1 < sz ? n + 1 : 0], y2 = py[n + 1 < sz ? n + 1 : 0];
			if (y > Math.min(y1, y2) && y <= Math.max(y1, y2) && x <= Math.max(x1, x2) && y1 != y2)
			{
				let intr = (y - y1) * (x2 - x1) / (y2 - y1) + x1;
				if (x1 == x2 || x <= intr) phase = !phase;
			}
		}
		
		return phase;
	}

	// returns true if the lines L1-->L2 and L3-->L4 are parallel or anti-parallel, i.e. they can never intersect; note that
	// this still returns true if the lines are actually on top of each other; note that this is for lines, not line segments
	public static areLinesParallel(x1:number, y1:number, x2:number, y2:number, x3:number, y3:number, x4:number, y4:number):boolean
	{
		let dxa = x2 - x1, dxb = x4 - x3, dya = y2 - y1, dyb = y4 - y3;
		return (realEqual(dxa, dxb) && realEqual(dya, dyb)) || (realEqual(dxa, -dxb) && realEqual(dya, -dyb));
	}

	// for the lines L1-->L2 and L3-->L4, calculate and return the intersection; note that this for lines, not line segments; 
	// the return value is an array of {x,y}; note that the answer will be garbage if the lines are parallel
	public static lineIntersect(x1:number, y1:number, x2:number, y2:number, x3:number, y3:number, x4:number, y4:number):number[]
	{
		let u = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
		return [x1 + u * (x2 - x1), y1 + u * (y2 - y1)];
	}

	// returns true if the point is on the line segment, within numerical precision
	public static isPointOnLineSeg(px:number, py:number, x1:number, y1:number, x2:number, y2:number):boolean
	{
		if (px < Math.min(x1, x2) || px > Math.max(x1, x2) || py < Math.min(y1, y2) || py > Math.max(y1, y2)) return false;
		if ((px == x1 && py == y1) || (px == x2 && py == y2)) return true;
		let dx = x2 - x1, dy = y2 - y1;
		if (Math.abs(dx) > Math.abs(dy)) return realEqual(py, (dy / dx) * (px - x1) + y1);
		else return realEqual(px, (dx / dy) * (py - y1) + x1);
	}

	// tests the two line segments L1-->L2 and L3-->L4 for intersection, and returns true if they do
	// !! methinks this is almost correct, but there might be a boundary flaw
	public static doLineSegsIntersect(x1:number, y1:number, x2:number, y2:number, x3:number, y3:number, x4:number, y4:number):boolean
	{
		if (Math.max(x1, x2) < Math.min(x3, x4) || Math.max(y1, y2) < Math.min(y3, y4)) return false;
		if (Math.min(x1, x2) > Math.max(x3, x4) || Math.min(y1, y2) > Math.max(y3, y4)) return false;
		if ((x1 == x3 && y1 == y3) || (x1 == x4 && y1 == y4) || (x2 == x3 && y2 == y3) || (x2 == x4 && y2 == y4)) return true;
		if ((x1 == x2 || x3 == x4) && (x1 == x3 || x1 == x4 || x2 == x3 || x2 == x4)) return true;
		if ((y1 == y2 || y3 == y4) && (y1 == y3 || y1 == y4 || y2 == y3 || y2 == y4)) return true;

		let x4_x3 = x4 - x3, y4_y3 = y4 - y3, x2_x1 = x2 - x1, y2_y1 = y2 - y1, x1_x3 = x1 - x3, y1_y3 = y1 - y3;

		let nx = x4_x3 * y1_y3 - y4_y3 * x1_x3;
		let ny = x2_x1 * y1_y3 - y2_y1 * x1_x3;
		let dn = y4_y3 * x2_x1 - x4_x3 * y2_y1;

		if (dn == 0) return false;
		if (dn < 0)
		{
			dn = -dn;
			nx = -nx;
			ny = -ny;
		}
		return nx >= 0 && nx <= dn && ny >= 0 && ny <= dn;
	}

	// true if the two rectangles share any intersection
	public static rectsIntersect(x1:number, y1:number, w1:number, h1:number, x2:number, y2:number, w2:number, h2:number):boolean
	{
		if (x1 <= x2 && x1 + w1 >= x2 + w2 && y1 <= y2 && y1 + h1 >= y2 + h2) return true;
		if (x2 <= x1 && x2 + w2 >= x1 + w1 && y2 <= y1 && y2 + h2 >= y1 + h1) return true;
		if (x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1) return false;
		return true;
	}

	// for an array of angles (in radians), sorts them in order; then, rotates the array around as many times as is necessary
	// so that the difference between the first & last angles is >= than the difference between the first & second
	public static sortAngles(theta:number[]):number[]
	{
		if (theta == null || theta.length < 2) return theta;
		theta = theta.slice(0);
		for (let n = 0; n < theta.length; n++) theta[n] = angleNorm(theta[n]);
		theta.sort();
		if (theta.length == 2) return theta;
		while (true)
		{
			let a = theta[theta.length - 1], b = theta[0], c = theta[1];
			if (angleDiff(b, a) <= angleDiff(c, b)) break;
			for (let n = theta.length - 1; n > 0; n--) theta[n] = theta[n - 1];
			theta[0] = a;
		}
		return theta;
	}

	// calculates a list of unique angles (based on the threshold parameter, in radians), and returns it; the returned list of 
	// angles will be sorted in order, as described by sortAngles(..); note that there is no fancy clustering, so a sequence of 
	// angles which are a bit below the threshold is not guaranteed to be stable; there is also a boundary case which bumps the 
	// sort rotation status slightly out of whack
	public static uniqueAngles(theta:number[], threshold:number):number[]
	{
		let ang = GeomUtil.sortAngles(theta), ret:number[] = [];
		ret.push(ang[0]);
		for (let n = 1; n < ang.length; n++)
		{
			if (Math.abs(angleDiff(ang[n], ang[n - 1])) > threshold) ret.push(ang[n]);
		}
		return ret;
	}

	// returns the angle maximally equidistant from Th1 and Th2
	public static thetaObtuse(th1:number, th2:number):number
	{
		let dth = th2 - th1;
		while (dth < -Math.PI) dth += 2 * Math.PI;
		while (dth > Math.PI) dth -= 2 * Math.PI;
		return dth > 0 ? th1 - 0.5 * (2 * Math.PI - dth) : th1 + 0.5 * (2 * Math.PI + dth);
	}
	
	// for a group of angles, returns a single dominant angle that represents the "average" of all of them; this takes into account boundary
	// issues for multiple cases, e.g. +/- 180; note that the array may be modified
	public static emergentAngle(theta:number[]):number
	{
		let len = theta.length;
		if (len == 1) return theta[0];
		if (len == 2) return 0.5 * (theta[0] + theta[1]);

		theta.sort();

		let bottom = 0;
		let behind = angleDiffPos(theta[0], theta[len - 1]);
		for (let n = 1; n < len; n++)
		{
			let delta = angleDiffPos(theta[n], theta[n - 1]);
			if (delta > behind)
			{
				bottom = n;
				behind = delta;
			}
		}

		let sum = 0;
		for (let n = 0; n < len; n++)
		{
			let delta = theta[n] - theta[bottom];
			if (delta < 0) delta += TWOPI;
			sum += delta;
		}

		return sum / len + theta[bottom];
	}
}

// implementation of the "Quick Hull" algorithm
class QuickHull
{
	private hsz = 0;

	// read these out for the answer
	public hullX:number[] = [];
	public hullY:number[] = [];

	constructor(private x:number[], private y:number[], private threshSq:number)
	{
		const sz = x.length;

		let l = 0, r = 0;
		for (let n = 0; n < sz; n++)
		{
			if (x[r] > x[n] || (x[r] == x[n] && y[r] > y[n])) r = n;
			if (x[l] < x[n] || (x[l] == x[n] && y[l] < y[n])) l = n;
		}

		let al1:number[] = [], al2:number[] = [];
		for (let n = 0; n < sz; n++)
		{
			if (n != l && n != r)
			{
				if (this.right(r, l, n) > 0) al1.push(n);
				else al2.push(n);
			}
		}

		// recursively build part 1
		this.hullX.push(x[r]);
		this.hullY.push(y[r]);
		this.quickHull(r, l, al1);

		// recursively build part 2
		this.hullX.push(x[l]);
		this.hullY.push(y[l]);
		this.quickHull(l, r, al2);

		// build a polygon
		for (let n = 0; n < this.hullX.length - 1;)
		{
			if (norm2_xy(this.hullX[n] - this.hullY[n + 1], this.hullY[n] - this.hullY[n + 1]) < threshSq)
			{
				this.hullX.splice(n + 1, 1);
				this.hullY.splice(n + 1, 1);
			}
			else n++;
		}
	}

	// processes a segment, in a given direction
	private quickHull(a:number, b:number, al:number[]):void
	{
		if (al.length == 0) return;

		let c = this.furthestPoint(a, b, al);
		let al1:number[] = [], al2:number[] = [];
		for (let n = 0; n < al.length; n++)
		{
			let p = al[n];
			if (p == a || p == b) continue;
			if (this.right(a, c, p) > 0) al1.push(p);
			else if (this.right(c, b, p) > 0) al2.push(p);
		}

		this.quickHull(a, c, al1);

		this.hullX.push(this.x[c]);
		this.hullY.push(this.y[c]);

		this.quickHull(c, b, al2);
	}

	// returns >0 if p is to the right of a-b, or <0 if to the left
	private right(a:number, b:number, p:number):number
	{
		const x = this.x, y = this.y;
		return (x[a] - x[b]) * (y[p] - y[b]) - (x[p] - x[b]) * (y[a] - y[b]);
	}

	// square distance point p to line a-b
	private distance(a:number, b:number, p:number):number
	{
		const x = this.x, y = this.y;
		let u = ((x[p] - x[a]) * (x[b] - x[a]) + (y[p] - y[a]) * (y[b] - y[a])) / ((x[b] - x[a]) * (x[b] - x[a]) + (y[b] - y[a]) * (y[b] - y[a]));
		let ux = x[a] + u * (x[b] - x[a]);
		let uy = y[a] + u * (y[b] - y[a]);
		return ((ux - x[p]) * (ux - x[p]) + (uy - y[p]) * (uy - y[p]));
	}

	// finds the furthest-away point from within the sub-list
	private furthestPoint(a:number, b:number, al:number[]):number
	{
		let maxDist = -1;
		let maxPos = -1;
		for (let n = 0; n < al.length; n++)
		{
			let p = al[n];
			if (p == a || p == b) continue;
			let dist = this.distance(a, b, p);
			if (dist > maxDist)
			{
				maxDist = dist;
				maxPos = p;
			}
		}
		return maxPos;
	}
}


/*
	Pos, Size, Box, Oval, Line: convenient trivial classes which save repetition
*/

class Pos
{
	public x:number;
	public y:number;

	public static zero():Pos {return new Pos();}
	constructor(x?:number, y?:number)
	{
		this.x = x == null ? 0 : x;
		this.y = y == null ? 0 : y;
	} 

	public clone():Pos {return new Pos(this.x, this.y);}

	public scaleBy(mag:number):void
	{
		if (mag == 1) return;
		this.x *= mag;
		this.y *= mag;
	}
	public offsetBy(dx:number, dy:number):void
	{
		this.x += dx;
		this.y += dy;
	}

	public toString():string {return '[' + this.x + ',' + this.y + ']';}
}

class Size
{
	public w:number;
	public h:number;

	public static zero():Size {return new Size();}
	constructor(w?:number, h?:number)
	{
		this.w = w == null ? 0 : w;
		this.h = h == null ? 0 : h;
	}

	public clone():Size {return new Size(this.w, this.h);}

	public scaleBy(mag:number):void
	{
		if (mag == 1) return;
		this.w *= mag;
		this.h *= mag;
	}
	public fitInto(maxW:number, maxH:number):void
	{
		let scale = 1;
		if (this.w > maxW) scale = maxW / this.w;
		if (this.h > maxH) scale = Math.min(scale, maxH / this.h);
		if (scale < 1) this.scaleBy(scale);
	}
	
	public toString():string {return '[' + this.w + ',' + this.h + ']';}
}

class Box
{
	public x:number;
	public y:number;
	public w:number;
	public h:number;

	public static zero():Box {return new Box();}
	public static fromSize(sz:Size) {return new Box(0, 0, sz.w, sz.h);}
	public static fromOval(oval:Oval) {return new Box(oval.cx - oval.rw, oval.cy - oval.rh, 2 * oval.rw, 2 * oval.rh);}
	constructor(x?:number, y?:number, w?:number, h?:number)
	{
		this.x = x == null ? 0 : x;
		this.y = y == null ? 0 : y;
		this.w = w == null ? 0 : w;
		this.h = h == null ? 0 : h;
	}

	public clone():Box {return new Box(this.x, this.y, this.w, this.h);}

	public setPos(pos:Pos):void
	{
		this.x = pos.x;
		this.y = pos.y;
	}
	public setSize(sz:Size):void
	{
		this.w = sz.w;
		this.h = sz.h;
	}
	
	public minX():number {return this.x;}
	public minY():number {return this.y;}
	public midX():number {return this.x + 0.5 * this.w;}
	public midY():number {return this.y + 0.5 * this.h;}
	public maxX():number {return this.x + this.w;}
	public maxY():number {return this.y + this.h;}

	public scaleBy(mag:number):void
	{
		if (mag == 1) return;
		this.x *= mag;
		this.y *= mag;
		this.w *= mag;
		this.h *= mag;
	}
	public offsetBy(dx:number, dy:number):void
	{
		this.x += dx;
		this.y += dy;
	}

	public intersects(other:Box):boolean
	{
		return GeomUtil.rectsIntersect(this.x, this.y, this.w, this.h, other.x, other.y, other.w, other.h);
	}
	
	public toString():string {return '[' + this.x + ',' + this.y + ';' + this.w + ',' + this.h + ']';}	
}

class Oval
{
	public cx:number;
	public cy:number;
	public rw:number;
	public rh:number;

	public static zero():Oval {return new Oval();}
	public static fromBox(box:Box) {return new Oval(box.x + 0.5 * box.w, box.y + 0.5 * box.h, 0.5 * box.w, 0.5 * box.h);}
	constructor(cx?:number, cy?:number, rw?:number, rh?:number)
	{
		this.cx = cx == null ? 0 : cx;
		this.cy = cy == null ? 0 : cy;
		this.rw = rw == null ? 0 : rw;
		this.rh = rh == null ? 0 : rh;
	}

	public clone():Oval {return new Oval(this.cx, this.cy, this.rw, this.rh);}

	public setCentre(pos:Pos):void
	{
		this.cx = pos.x;
		this.cy = pos.y;
	}
	public setRadius(sz:Size):void
	{
		this.rw = sz.w;
		this.rh = sz.h;
	}
	
	public minX():number {return this.cx - this.rw;}
	public minY():number {return this.cy - this.rh;}
	public maxX():number {return this.cx + this.rw;}
	public maxY():number {return this.cy + this.rh;}

	public scaleBy(mag:number):void
	{
		if (mag == 1) return;
		this.cx *= mag;
		this.cy *= mag;
		this.rw *= mag;
		this.rh *= mag;
	}
	public offsetBy(dx:number, dy:number):void
	{
		this.cx += dx;
		this.cy += dy;
	}
	
	public toString():string {return '[' + this.cx + ',' + this.cy + ';' + this.rw + ',' + this.rh + ']';}	
}

class Line
{
	public x1:number;
	public y1:number;
	public x2:number;
	public y2:number;

	public static zero():Line {return new Line();}
	constructor(x1?:number, y1?:number, x2?:number, y2?:number)
	{
		this.x1 = x1 == null ? 0 : x1;
		this.y1 = y1 == null ? 0 : y1;
		this.x2 = x2 == null ? 0 : x2;
		this.y2 = y2 == null ? 0 : y2;
	}

	public clone():Line {return new Line(this.x1, this.y1, this.x2, this.y2);}

	public setPos1(pos:Pos):void
	{
		this.x1 = pos.x;
		this.y1 = pos.y;
	}
	public setPos2(pos:Pos):void
	{
		this.x2 = pos.x;
		this.y2 = pos.y;
	}
	
	public minX():number {return Math.min(this.x1, this.x2);}
	public minY():number {return Math.min(this.y1, this.y2);}
	public maxX():number {return Math.max(this.x1, this.x2);}
	public maxY():number {return Math.max(this.y1, this.y2);}

	public scaleBy(mag:number):void
	{
		if (mag == 1) return;
		this.x1 *= mag;
		this.y1 *= mag;
		this.x2 *= mag;
		this.y2 *= mag;
	}
	public offsetBy(dx:number, dy:number):void
	{
		this.x1 += dx;
		this.y1 += dy;
		this.x2 += dx;
		this.y2 += dy;
	}
	
	public toString():string {return '[' + this.x1 + ',' + this.y1 + ';' + this.x2 + ',' + this.y2 + ']';}	
}