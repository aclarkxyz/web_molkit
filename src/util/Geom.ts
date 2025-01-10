/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {Matrix, SingularValueDecomposition} from './Matrix';
import {Triangulation2D} from './Triangulation2D';
import {angleDiff, angleDiffPos, angleNorm, maxArray, minArray, norm2_xy, norm_xy, realEqual, sqr, TWOPI} from './util';
import {Vec} from './Vec';

/*
	Geometry utilities, which are typically graphics related.
*/

export interface Spline
{
	px:number[];
	py:number[];
	ctrl:boolean[];
}

export class GeomUtil
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
		let dxa = x2 - x1, dya = y2 - y1, dxb = x4 - x3, dyb = y4 - y3;
		let xmajorA = Math.abs(dxa) > Math.abs(dya), xmajorB = Math.abs(dxb) > Math.abs(dyb);
		if (xmajorA != xmajorB) return false;
		const EPS = 1E-6;
		if (xmajorA)
			return Math.abs(dya / dxa - dyb / dxb) < EPS;
		else
			return Math.abs(dxa / dya - dxb / dyb) < EPS;
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

	// returns the distance from the point to the closest location on the indicated line
	public static pointLineDistance(px:number, py:number, x1:number, y1:number, x2:number, y2:number):number
	{
		let dx = x2 - x1, dy = y2 - y1;
		return Math.abs(dy * px - dx * py + x2 * y1 - y2 * x1) / norm_xy(dx, dy);
	}

	// returns the shortest distance from the point to the line segment
	public static pointLineSegDistance(px:number, py:number, x1:number, y1:number, x2:number, y2:number):number
	{
		let dx = x2 - x1, dy = y2 - y1;
		let t = ((px - x1) * dx + (py - y1) * dy) / norm2_xy(dx, dy); // t=position along the line to which the point is orthogonal
		t = Math.max(0, Math.min(1, t));
		let tx = x1 + t * dx, ty = y1 + t * dy;
		return norm_xy(px - tx, py - ty);
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

		if (theta.length == 2)
		{
			if (angleDiffPos(theta[1], theta[0]) > Math.PI) return [theta[1], theta[0]];
			return theta;
		}

		Vec.sort(theta);
		while (true)
		{
			let a = theta[theta.length - 1], b = theta[0], c = theta[1];
			if (angleDiff(b, a) <= angleDiff(c, b)) break;
			for (let n = theta.length - 1; n > 0; n--) theta[n] = theta[n - 1];
			theta[0] = a;
		}
		return theta;
	}

	// sorts angles as above, except returns indices rather than values
	public static idxSortAngles(theta:number[]):number[]
	{
		const sz = Vec.len(theta);
		if (theta == null || sz < 2) return Vec.identity0(sz);

		if (sz == 2)
		{
			if (angleDiffPos(theta[1], theta[0]) > Math.PI) return [1, 0]; else return [0, 1];
		}

		theta = Vec.duplicate(theta);
		for (let n = 0; n < sz; n++) theta[n] = angleNorm(theta[n]);
		let idx = Vec.idxSort(theta);

		while (true)
		{
			let a = theta[idx[sz - 1]], b = theta[idx[0]], c = theta[idx[1]];
			if (angleDiff(b, a) <= angleDiff(c, b)) break;
			let last = idx.pop();
			idx.unshift(last);
		}
		return idx;
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

		Vec.sort(theta);

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

	// core 3D vector calculations; observe that even though the parameters are vectors, these functions do assume that they are of size 3

	public static dotProduct(v1:number[], v2:number[]):number
	{
		return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
	}

	public static crossProduct(v1:number[], v2:number[]):number[]
	{
		const x = v1[1] * v2[2] - v1[2] * v2[1];
		const y = v1[2] * v2[0] - v1[0] * v2[2];
		const z = v1[0] * v2[1] - v1[1] * v2[0];
		return [x, y, z];
	}

	// generate 2D affine transforms
	public static affineTranslate(dx:number, dy:number):number[][]
	{
		return [[1, 0, dx], [0, 1, dy], [0, 0, 1]];
	}
	public static affineMirror(xaxis:boolean, yaxis:boolean):number[][]
	{
		return [[xaxis ? -1 : 1, 0, 0], [0, yaxis ? -1 : 1, 0], [0, 0, 1]];
	}
	public static affineScale(sx:number, sy:number):number[][]
	{
		return [[sx, 0, 0], [0, sy, 0], [0, 0, 1]];
	}
	public static affineRotate(theta:number):number[][]
	{
		let cos = Math.cos(theta), sin = Math.sin(theta);
		return [[cos, -sin, 0], [sin, cos, 0], [0, 0, 1]];
	}

	// compose two affine transforms and returns a new one that is equivalent to doing both of them in order (A then B)
	public static affineCompose(A:number[][], B:number[][]):number[][]
	{
		let tfm = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
		let Acol = [0, 0, 0];
		for (let j = 0; j < 3; j++)
		{
			for (let k = 0; k < 3; k++) Acol[k] = A[k][j];
			for (let i = 0; i < 3; i++)
			{
				let Brow = B[i];
				let s = 0;
				for (let k = 0; k < 3; k++) s += Acol[k] * Brow[k];
				tfm[i][j] = s;
			}
		}
		return tfm;
	}

	// applies a 3x3 affine transform to two coordinates; returns [x,y] position
	public static applyAffine(x:number, y:number, tfm:number[][]):[number, number]
	{
		return [x * tfm[0][0] + y * tfm[0][1] + tfm[0][2], x * tfm[1][0] + y * tfm[1][1] + tfm[1][2]];
	}

	// applies the affine transform to a vector, modifying the parameter array
	public static applyAffineArray(x:number[], y:number[], tfm:number[][]):void
	{
		for (let n = 0; n < x.length; n++) [x[n], y[n]] = this.applyAffine(x[n], y[n], tfm);
	}

	// returns true if the 2D affine transform contains a mirror reflection
	public static isAffineMirror(tfm:number[][]):boolean
	{
		let a = tfm[0][0], b = tfm[0][1], c = tfm[0][2];
		let d = tfm[1][0], e = tfm[1][1], f = tfm[1][2];
		let g = tfm[2][0], h = tfm[2][1], i = tfm[2][2];
		return a * e * i + b * f * g + c * d * h - c * e * g - b * d * i - a * f * h < 0;
	}

	public static magnitude2(v:number[]):number
	{
		return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
	}

	public static magnitude(v:number[]):number
	{
		return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	}

	public static dist2(v1:number[], v2:number[]):number
	{
		let dx = v1[0] - v2[0], dy = v1[1] - v2[1], dz = v1[2] - v2[2];
		return dx * dx + dy * dy + dz * dz;
	}

	public static dist(v1:number[], v2:number[]):number
	{
		let dx = v1[0] - v2[0], dy = v1[1] - v2[1], dz = v1[2] - v2[2];
		return Math.sqrt(dx * dx + dy * dy + dz * dz);
	}

	public static normalise(v:number[]):void
	{
		const dsq = v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
		if (dsq == 0) return;
		const inv = 1.0 / Math.sqrt(dsq);
		v[0] *= inv;
		v[1] *= inv;
		v[2] *= inv;
	}

	public static normalised(v:number[]):number[]
	{
		let ret = v.slice(0);
		this.normalise(ret);
		return ret;
	}

	// returns the unsigned angle between two vectors
	public static acuteAngle(v1:number[], v2:number[]):number
	{
		let mag1 = this.magnitude(v1), mag2 = this.magnitude(v2);
		if (mag1 == 0 || mag2 == 0) return 0;
		let dot = this.dotProduct(v1, v2);
		let cosTheta = dot / (mag1 * mag2);
		cosTheta = Math.max(-1, Math.min(1, cosTheta)); // numeric error can bump it slightly out of -1 .. +1
		return Math.acos(cosTheta);
	}

	// given a circle (at origin) of a given radius, and two points at the perimeter, calculates two control points that can be used to draw a
	// bezier spline of the curved part of the arc; the given points are presumed to be in angular order; if the angle is more than 180 degrees
	// this won't work (i.e. the caller must split into more than one curve)
	public static arcControlPoints(rad:number, x1:number, y1:number, x2:number, y2:number):[number, number, number, number]
	{
		let t1x = -y1, t1y = x1;
		let t2x = y2, t2y = -x2;
		let dx = 0.5 * (x1 + x2);
		let dy = 0.5 * (y1 + y2);
		let tx = 3 / 8 * (t1x + t2x);
		let ty = 3 / 8 * (t1y + t2y);
		let a = tx * tx + ty * ty;
		let b = dx * tx + dy * ty;
		let c = dx * dx + dy * dy - rad * rad;
		let D = b * b - a * c;
		let k = (Math.sqrt(D) - b) / a;

		return [x1 + k * t1x, y1 + k * t1y, x2 + k * t2x, y2 + k * t2y];
	}

	// creates a bezier-type curve that renders a whole ellipse; the parameters (w,h) are the dimensions of the ellipse, where w is parallel to theta and
	// h is perpendicular to it (i.e. if theta is 0, it's an ordinary ellipse that is aligned with the axes); the result is imprecise: it emits a series of
	// points corresponding to angular increments and throws in some quadratic smoothing - it should be visually indistinguishable from the real thing
	public static createBezierEllipse(cx:number, cy:number, rw:number, rh:number, theta:number):Spline
	{
		/*
			From https://math.stackexchange.com/questions/2645689/what-is-the-parametric-equation-of-a-rotated-ellipse-given-the-angle-of-rotatio
			x(α)=Rx.cos(α).cos(θ) − Ry.sin(α).sin(θ) + Cx
			y(α)=Rx.cos(α).sin(θ) + Ry.sin(α).cos(θ) + Cy
		*/

		let nseg = 24, npt = 2 * nseg + 1;
		let cosTheta = Math.cos(theta), sinTheta = Math.sin(theta);
		let incrAlpha = TWOPI / nseg;

		let px:number[] = new Array(npt), py:number[] = new Array(npt);
		for (let n = 0; n < nseg; n++)
		{
			let alpha = n * incrAlpha;
			let cosAlpha = Math.cos(alpha), sinAlpha = Math.sin(alpha);

			px[n * 2] = rw * cosAlpha * cosTheta - rh * sinAlpha * sinTheta + cx;
			py[n * 2] = rw * cosAlpha * sinTheta + rh * sinAlpha * cosTheta + cy;
		}

		px[npt - 1] = px[0];
		py[npt - 1] = py[0];

		let smooth = 0.3;
		for (let n = 0; n < nseg; n++)
		{
			let n1 = (n - 1 + nseg) % nseg;
			let n2 = n;
			let n3 = (n + 1) % nseg;
			let n4 = (n + 2) % nseg;
			let x1 = px[n1 * 2], x2 = px[n2 * 2], x3 = px[n3 * 2], x4 = px[n4 * 2];
			let y1 = py[n1 * 2], y2 = py[n2 * 2], y3 = py[n3 * 2], y4 = py[n4 * 2];
			px[n * 2 + 1] = 0.5 * (x2 + x3 + smooth * (x2 - x1 + x3 - x4));
			py[n * 2 + 1] = 0.5 * (y2 + y3 + smooth * (y2 - y1 + y3 - y4));
		}

		let ctrl:boolean[] = new Array(npt);
		for (let n = 0; n < npt; n++) ctrl[n] = (n & 1) == 1;

		return {px, py, ctrl};
	}

	// for a set of points that are presumed to be normalised about the origin, determines the radius of the closest approach
	public static fitCircle(x:number[], y:number[]):number
	{
		let dsq = Number.POSITIVE_INFINITY;
		for (let n = 0; n < x.length; n++) dsq = Math.min(dsq, norm2_xy(x[n], y[n]));
		return Math.sqrt(dsq);
	}

	// for a set of points that are presumed to be normalised about the origin, comes up with an ellipse [w,h] that is optimised to be as large as possible
	// without expanding beyond any of the closing points; note that the solution is an approximation, but it is at least one that can be carried out in a
	// small number of iterations
	// NOTE: the min/max X/Y parameters are treated as blockers for the axes; this is because the algorithm uses intersection of ellipse-with-points to determine
	// boundaries, which unfortunately means that sometimes the ellipse can do on a runaway distortion by going *through* one of the axes; these parameters will
	// prevent this, but they must be precalculated; ideally the algorithm would calculate an "internal convex hull" to derive these points automatically
	public static fitEllipse(px:number[], py:number[], minX:number, minY:number, maxX:number, maxY:number):number[]
	{
		// start with a circle-of-fit, which is the worst case scenario
		let bestW = 0.5 * this.fitCircle(px, py), bestH = bestW, bestScore = bestW * bestH;

		let x = Vec.concat(px, [minX, maxX, 0, 0]);
		let y = Vec.concat(py, [0, 0, minY, maxY]);
		const sz = x.length;

		let shrinkToFit = (whs:number[]):void =>
		{
			let dmin = Number.POSITIVE_INFINITY;
			let invW2 = 1.0 / (whs[0] * whs[0]), invH2 = 1.0 / (whs[1] * whs[1]);
			for (let n = 0; n < sz; n++) dmin = Math.min(dmin, Math.sqrt(x[n] * x[n] * invW2 + y[n] * y[n] * invH2));
			if (dmin < 1)
			{
				whs[0] *= dmin;
				whs[1] *= dmin;
			}
			whs[2] = whs[0] * whs[1];
		};

		// keep trying to expand on one axis/shrink on both, until subsequent efforts are futile
		let mul = 1;
		let whsX = [0, 0, 0], whsY = [0, 0, 0];
		while (mul > 0.001)
		{
			whsX[0] = bestW * (1 + mul);
			whsX[1] = bestH;
			shrinkToFit(whsX);

			whsY[0] = bestW;
			whsY[1] = bestH * (1 + mul);
			shrinkToFit(whsY);

			let anything = false;
			if (whsX[2] > bestScore) {bestW = whsX[0]; bestH = whsX[1]; bestScore = whsX[2]; anything = true;}
			if (whsY[2] > bestScore) {bestW = whsY[0]; bestH = whsY[1]; bestScore = whsY[2]; anything = true;}
			if (!anything) mul *= 0.6;
		}

		return [bestW, bestH];
	}

	// given two collections of 2D points (A and B), returns the rotate+transform matrix that best maps A onto B
	public static superimpose(ax:number[], ay:number[], bx:number[], by:number[]):number[][]
	{
		// special deal for size 1: just a translation; the caller must find some other way to discover the preferred rotation
		let sz = ax.length;
		if (sz == 1)
		{
			let dx = bx[0] - ax[0], dy = by[0] - ay[0];
			return [[1, 0, dx], [0, 1, dy], [0, 0, 1]];
		}

		// special deal for size 2: rotation matrix can be derived from a single angle, rather than doing an optimisation
		if (sz == 2)
		{
			let thetaA = Math.atan2(ay[1] - ay[0], ax[1] - ax[0]), thetaB = Math.atan2(by[1] - by[0], bx[1] - bx[0]);
			let delta = angleDiff(thetaB, thetaA), cos = Math.cos(delta), sin = Math.sin(delta);
			let rot00 = cos, rot01 = -sin;
			let rot10 = sin, rot11 = cos;

			let acx = 0.5 * (ax[0] + ax[1]), acy = 0.5 * (ay[0] + ay[1]);
			let bcx = 0.5 * (bx[0] + bx[1]), bcy = 0.5 * (by[0] + by[1]);
			let rax = rot00 * acx + rot01 * acy;
			let ray = rot10 * acx + rot11 * acy;

			return [[rot00, rot01, bcx - rax], [rot10, rot11, bcy - ray], [0, 0, 1]];
		}

		// proceed with a relatively heavy-handed eigenvalue optimisation
		// adapted from: https://github.com/oleg-alexandrov/projects/blob/master/eigen/Kabsch.cpp

		let invsz = 1.0 / sz;
		let acx = Vec.sum(ax) * invsz, acy = Vec.sum(ay) * invsz;
		let bcx = Vec.sum(bx) * invsz, bcy = Vec.sum(by) * invsz;

		let mtxA = new Matrix(3, sz), mtxB = new Matrix(3, sz);
		for (let n = 0; n < sz; n++)
		{
			mtxA.set(0, n, ax[n] - acx);
			mtxA.set(1, n, ay[n] - acy);
			mtxA.set(2, n, 0);
			mtxB.set(0, n, bx[n] - bcx);
			mtxB.set(1, n, by[n] - bcy);
			mtxB.set(2, n, 0);
		}

		let cov = mtxA.times(mtxB.transpose());
		let svd = new SingularValueDecomposition(cov);

		/* ... this doesn't seem to be necessary for 2D
		double d = svd.getV().times(svd.getU().transpose()).det();
		if (d > 0) d = 1; else d = -1;
		let ident = Matrix.identity(3, 3);
		ident.set(2, 2, d); // NOTE: not sure if this is necessary for 2D
		let rotate = (svd.getV().times(ident)).times(svd.getU().transpose());*/

		let rotate = svd.getV().times(svd.getU().transpose());

		let rot00 = rotate.get(0, 0), rot01 = rotate.get(0, 1);
		let rot10 = rotate.get(1, 0), rot11 = rotate.get(1, 1);
		let rax = rot00 * acx + rot01 * acy;
		let ray = rot10 * acx + rot11 * acy;

		// return the subset of the matrix that performs the 2D rotation & translation
		return [[rot00, rot01, bcx - rax], [rot10, rot11, bcy - ray], [0, 0, 1]];
	}

	// takes a set of points and calculates the convex hull, in the form of an enclosing polygon
	public static convexHull(x:number[], y:number[], flatness:number):[number[], number[]]
	{
		let algo = new QuickHull(x, y, sqr(flatness * 0.1));
		return [algo.hullX, algo.hullY];
	}

	// takes a set of points and calculates the outline, in the form of an enclosing polygon, using the "rolling ball" algorithm
	public static outlinePolygon(x:number[], y:number[], diameter:number):[number[], number[]]
	{
		/* ... rolling ball algorithm isn't that great; the Delaunay-based method is much better
		let algo = new RollingBall(x, y, diameter);
		return algo.sequenceXY();*/
		let del = new Triangulation2D(x, y);
		let concave = del.trimConcave(diameter);
		let idx = del.traceOutline(concave);
		return [Vec.idxGet(x, idx), Vec.idxGet(y, idx)];
	}
}

// implementation of the "Quick Hull" algorithm which calculates the convex hull that surrounds a cluster of points
export class QuickHull
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

// implementation of the "Rolling Ball" algorithm which traces the outline of a group of points using a granularity threshold (the "ball diameter"); note that the points must
// be dense enough so that the "ball" can be rolled around the outside without "falling in", in which case the result will be null
export class RollingBall
{
	public sequence:number[] = []; // the indices tracing the outline; set to null if it failed

	constructor(public x:number[], public y:number[], diameter:number)
	{
		const sz = x.length;
		const threshSq = diameter * diameter;

		let first = Vec.idxMax(x), latest = first;
		let direction = 0.0; // radians (pointing to the right)
		let visited = Vec.booleanArray(false, sz);
		this.sequence.push(first);

		let roll = ():number =>
		{
			let bestIdx = -1;
			let bestDelta = 0, bestTheta = 0;
			for (let n = 0; n < sz; n++) if (n != latest && !visited[n])
			{
				let dx = x[n] - x[latest], dy = y[n] - y[latest];
				let dsq = norm2_xy(dx, dy);
				if (dsq == 0 || dsq > threshSq) continue;
				let theta = Math.atan2(dy, dx), delta = angleDiffPos(theta, direction);
				if (bestIdx < 0 || delta < bestDelta)
				{
					bestIdx = n;
					bestDelta = delta;
					bestTheta = theta;
				}
			}
			if (bestIdx < 0) return -1;

			direction = angleNorm(bestTheta - 0.5 * Math.PI);
			visited[bestIdx] = true;
			return bestIdx;
		};

		while (true)
		{
			let next = roll();
			if (next < 0) {this.sequence = null; return;} // failure
			if (next == first) break;
			this.sequence.push(next);
			latest = next;
		}
	}

	// formulate the results in terms of coordinates, as an alternative to just looking at the sequence indices
	public sequencePos():Pos[]
	{
		if (!this.sequence) return null;
		let posList:Pos[] = [];
		for (let n of this.sequence) posList.push(new Pos(this.x[n], this.y[n]));
		return posList;
	}
	public sequenceXY():[number[], number[]]
	{
		if (!this.sequence) return [null, null];
		let px:number[] = [], py:number[] = [];
		for (let n of this.sequence) {px.push(this.x[n]); py.push(this.y[n]);}
		return [px, py];
	}
}

/*
	Pos, Size, Box, Oval, Line: convenient trivial classes which save repetition
*/

export class Pos
{
	public x:number;
	public y:number;

	public static zero():Pos {return new Pos();}
	public static fromArray(src:number[]):Pos {return new Pos(src[0], src[1]);}
	constructor(x?:number, y?:number)
	{
		this.x = x == null ? 0 : x;
		this.y = y == null ? 0 : y;
	}

	public clone():Pos {return new Pos(this.x, this.y);}
	public equals(other:Pos):boolean {return this.x == other.x && this.y == other.y;}

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

	public withScaleBy(mag:number):Pos
	{
		return new Pos(this.x * mag, this.y * mag);
	}
	public withOffsetBy(dx:number, dy:number):Pos
	{
		return new Pos(this.x + dx, this.y + dy);
	}

	public toString():string {return '[' + this.x + ',' + this.y + ']';}
}

export class Size
{
	public w:number;
	public h:number;

	public static zero():Size {return new Size();}
	public static fromArray(src:number[]):Size {return new Size(src[0], src[1]);}
	constructor(w?:number, h?:number)
	{
		this.w = w == null ? 0 : w;
		this.h = h == null ? 0 : h;
	}

	public clone():Size {return new Size(this.w, this.h);}
	public equals(other:Size):boolean {return this.w == other.w && this.h == other.h;}

	public isZero():boolean {return this.w == 0 && this.h == 0;}

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

	public withScaleBy(mag:number):Size
	{
		return new Size(this.w * mag, this.h * mag);
	}

	public toString():string {return '[' + this.w + ',' + this.h + ']';}
}

export class Box
{
	public x:number;
	public y:number;
	public w:number;
	public h:number;

	public static zero():Box {return new Box();}
	public static fromBounds(x1:number, y1:number, x2:number, y2:number) {return new Box(x1, y1, x2 - x1, y2 - y1);}
	public static fromSize(sz:Size):Box {return new Box(0, 0, sz.w, sz.h);}
	public static fromOval(oval:Oval):Box {return new Box(oval.cx - oval.rw, oval.cy - oval.rh, 2 * oval.rw, 2 * oval.rh);}
	public static fromArray(src:number[]):Box {return new Box(src[0], src[1], src[2], src[3]);}
	constructor(x?:number, y?:number, w?:number, h?:number)
	{
		this.x = x == null ? 0 : x;
		this.y = y == null ? 0 : y;
		this.w = w == null ? 0 : w;
		this.h = h == null ? 0 : h;
	}

	public clone():Box {return new Box(this.x, this.y, this.w, this.h);}
	public equals(other:Box):boolean {return this.x == other.x && this.y == other.y && this.w == other.w && this.h == other.h;}

	public getPos():Pos {return new Pos(this.x, this.y);}
	public setPos(pos:Pos):void
	{
		this.x = pos.x;
		this.y = pos.y;
	}
	public getSize():Size {return new Size(this.w, this.h);}
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
	public area():number {return this.w * this.h;}

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
	public grow(bx:number, by:number):void
	{
		this.x -= bx;
		this.y -= by;
		this.w += 2 * bx;
		this.h += 2 * by;
	}

	public withScaleBy(mag:number):Box
	{
		return new Box(this.x * mag, this.y * mag, this.w * mag, this.h * mag);
	}
	public withOffsetBy(dx:number, dy:number):Box
	{
		return new Box(this.x + dx, this.y + dy, this.w, this.h);
	}
	public withGrow(bx:number, by:number):Box
	{
		return new Box(this.x - bx, this.y - by, this.w + 2 * bx, this.h + 2 * by);
	}

	public intersects(other:Box):boolean
	{
		return GeomUtil.rectsIntersect(this.x, this.y, this.w, this.h, other.x, other.y, other.w, other.h);
	}

	// returns the actual intersection box; note that if they don't intersect at all, things get weird
	public intersection(other:Box):Box
	{
		let x1 = this.x, x2 = x1 + this.w, y1 = this.y, y2 = y1 + this.h;
		let x3 = other.x, x4 = x3 + other.w, y3 = other.y, y4 = y3 + other.h;
		let x5 = Math.max(x1, x3), y5 = Math.max(y1, y3), x6 = Math.min(x2, x4), y6 = Math.min(y2, y4);
		return new Box(x5, y5, x6 - x5, y6 - y5);
	}

	public contains(x:number, y:number):boolean
	{
		return x >= this.x && x < this.x + this.w && y >= this.y && y < this.y + this.h;
	}

	public union(other:Box):Box
	{
		let x1 = Math.min(this.x, other.x), x2 = Math.max(this.x + this.w, other.x + other.w);
		let y1 = Math.min(this.y, other.y), y2 = Math.max(this.y + this.h, other.y + other.h);
		return new Box(x1, y1, x2 - x1, y2 - y1);
	}

	public isZero():boolean {return this.w == 0 && this.h == 0;} // deprecated
	public isEmpty():boolean {return this.w == 0 && this.h == 0;}
	public notEmpty():boolean {return this.w > 0 || this.h > 0;}

	public toString():string {return '[' + this.x + ',' + this.y + ';' + this.w + ',' + this.h + ']';}
}

export class Oval
{
	public cx:number;
	public cy:number;
	public rw:number;
	public rh:number;

	public static zero():Oval {return new Oval();}
	public static fromBox(box:Box):Oval {return new Oval(box.x + 0.5 * box.w, box.y + 0.5 * box.h, 0.5 * box.w, 0.5 * box.h);}
	public static fromArray(src:number[]):Oval {return new Oval(src[0], src[1], src[2], src[3]);}
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

	public withScaleBy(mag:number):Oval
	{
		return new Oval(this.cx * mag, this.cy * mag, this.rw * mag, this.rh * mag);
	}
	public withOffsetBy(dx:number, dy:number):Oval
	{
		return new Oval(this.cx + dx, this.cy + dy, this.rw, this.rh);
	}

	public contains(x:number, y:number):boolean
	{
		let dx = x - this.cx, dy = y - this.cy;
		let a = dx / this.rw, b = dy / this.rh;
		return a * a + b * b <= 1;
	}

	public toString():string {return '[' + this.cx + ',' + this.cy + ';' + this.rw + ',' + this.rh + ']';}
}

export class Line
{
	public x1:number;
	public y1:number;
	public x2:number;
	public y2:number;

	public static zero():Line {return new Line();}
	public static fromPos(pos1:Pos, pos2:Pos):Line {return new Line(pos1.x, pos1.y, pos2.x, pos2.y);}
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

