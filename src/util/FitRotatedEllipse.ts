/*
    WebMolKit

    (c) 2010-2024 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

namespace WebMolKit /* BOF */ {

/*
	Given a collection of points that is shaped somewhat like an oval-esque outline (i.e. a molecule ring that might be squished and rotated
	somewhat) finds a rotated ellipse that fills it out, up to a certain margin distance.

	There is no straightforward mathematical formula for this, and so the algorithm is done by way of a crude optimisation. It is intended
	to be more fast than correct, since it needs to run on an interactive timescale. Edge cases may fail in ugly ways.

	The bezier is parametrised as (cx,cy,rw,rh,theta).

	Note that the algorithm is reasonably fast, but it can add up when being used in real time. There's a caching system to help with this.
*/

const CACHE_SIZE = 1000;

export class FitRotatedEllipse
{
	private static cacheVal:FitRotatedEllipse[] = [];
	private static cacheMap = new Map<string, FitRotatedEllipse>();

	// these are the results
	public cx:number;
	public cy:number;
	public rw:number;
	public rh:number;
	public theta = 0;

	// working variables
	private fullySymmetric = false; // true if X/Y both symmetrical, if so, forbid rotation
	private stop = false;
	private currentScore:number;
	private hashKey:string;

	// ------------ public methods ------------

	constructor(public px:number[], public py:number[], public margin:number)
	{
		this.hashKey = JSON.stringify([this.px, this.py]);
	}

	public calculate():void
	{
		if (this.lookupCache()) return;

		this.setupParameters();
		if (this.stop) return;

		this.currentScore = this.calculateScore(this.cx, this.cy, this.rw, this.rh, this.theta);

		this.coarseDiscovery();
		this.fineImprovement();

		if (Math.abs(this.theta) < 1 * DEGRAD) this.theta = 0;

		this.saveCache();
	}

	// converts the calculated result into a Bezier spline for convenient rendering
	public getSpline():Spline
	{
		return GeomUtil.createBezierEllipse(this.cx, this.cy, this.rw, this.rh, this.theta);
	}

	// ------------ private methods ------------

	private lookupCache():boolean
	{
		let hashKey = this.hashKey;
		let look = FitRotatedEllipse.cacheMap.get(hashKey);
		if (look)
		{
			this.cx = look.cx;
			this.cy = look.cy;
			this.rw = look.rw;
			this.rh = look.rh;
			this.theta = look.theta;

			// rotate the hit to the tip of the cache
			const {cacheVal} = FitRotatedEllipse;
			for (let n = cacheVal.length - 1; n >= 0; n--) if (cacheVal[n].hashKey == hashKey)
			{
				if (n < cacheVal.length - 1)
				{
					cacheVal.push(cacheVal[n]);
					cacheVal.splice(n, 1);
				}
				break;
			}

			return true;
		}
		return false;
	}

	private saveCache():void
	{
		let hashKey = this.hashKey;
		const {cacheVal, cacheMap} = FitRotatedEllipse;

		cacheVal.push(this);
		cacheMap.set(hashKey, this);

		while (cacheVal.length > CACHE_SIZE)
		{
			cacheMap.delete(cacheVal[0].hashKey);
			cacheVal.splice(0);
		}
	}

	private setupParameters():void
	{
		const {px, py} = this, psz = px.length;

		this.cx = Vec.sum(px) / psz;
		this.cy = Vec.sum(py) / psz;
		let ptheta:number[] = new Array(psz);
		for (let n = 0; n < psz; n++) ptheta[n] = Math.atan2(py[n] - this.cy, px[n] - this.cx);
		let order = Vec.idxSort(ptheta);
		this.px = Vec.idxGet(px, order);
		this.py = Vec.idxGet(py, order);

		this.rw = this.rh = 1;
		// let closeDSQ = Number.POSITIVE_INFINITY;
		// for (let n = 0; n < psz; n++) closeDSQ = Math.min(closeDSQ, norm2_xy(px[n] - this.cx, py[n] - this.cy));
		// this.rw = this.rh = 0.1 * Math.sqrt(closeDSQ);

		this.fullySymmetric = true;
		const THRESHOLD = 0.001;
		const canFindPoint = (x:number, y:number, avoid:number):boolean =>
		{
			for (let n = 0; n < psz; n++) if (n != avoid)
			{
				if (Math.abs(px[n] - x) < THRESHOLD && Math.abs(py[n] - y) < THRESHOLD) return true;
			}
			return false;
		};
		for (let n = 0; n < psz; n++)
		{
			let dx = px[n] - this.cx, dy = py[n] - this.cy;
			if (Math.abs(dx) < THRESHOLD || Math.abs(dy) < THRESHOLD) continue;
			if (!canFindPoint(this.cx - dx, py[n], n) && !canFindPoint(px[n], this.cy - dy, n))
			{
				this.fullySymmetric = false;
				break;
			}
		}
	}

	private coarseDiscovery():void
	{
		const {margin} = this, psz = this.px.length;

		let deltaD = 0.1 * margin, deltaR = 0.5 * deltaD;
		const DELTA_OPTIONS:{dx:number, dy:number, dw:number, dh:number}[] =
		[
			{dx:-1, dy:0, dw:0, dh:0},
			{dx:1, dy:0, dw:0, dh:0},
			{dx:0, dy:-1, dw:0, dh:0},
			{dx:0, dy:1, dw:0, dh:0},
			{dx:0, dy:0, dw:-1, dh:0},
			{dx:0, dy:0, dw:1, dh:0},
			{dx:0, dy:0, dw:0, dh:-1},
			{dx:0, dy:0, dw:0, dh:1},
		];
		const DELTA_THETA = Vec.mul([0, -5, 5, -10, 10, -15, 15, -20, 20, -25, 25, -30, 30, -35, 35, -40, 40, -45, 45], DEGRAD);

		for (let sanity = 0; sanity < 1000; sanity++)
		{
			let anything = false;
			let bestScore = this.currentScore;
			let bestCX = this.cx, bestCY = this.cy, bestRW = this.rw, bestRH = this.rh, bestTheta = this.theta;

			for (let delta of DELTA_OPTIONS)
			{
				let newCX = this.cx + delta.dx * deltaD;
				let newCY = this.cy + delta.dy * deltaD;
				let newRW = this.rw + delta.dw * deltaR;
				let newRH = this.rh + delta.dh * deltaR;

				for (let newTheta of DELTA_THETA)
				{
					let newScore = this.calculateScore(newCX, newCY, newRW, newRH, newTheta);
					if (newScore > bestScore && !fltEqual(newScore, bestScore))
					{
						anything = true;
						bestScore = newScore;
						bestCX = newCX;
						bestCY = newCY;
						bestRW = newRW;
						bestRH = newRH;
						bestTheta = newTheta;
					}
				}
			}

			if (!anything) break;

			this.currentScore = bestScore;
			this.cx = bestCX;
			this.cy = bestCY;
			this.rw = bestRW;
			this.rh = bestRH;
			this.theta = bestTheta;
		}
	}

	private fineImprovement():void
	{
		const {margin} = this, psz = this.px.length;

		let deltaD = 0.1 * margin, deltaR = 0.5 * deltaD, deltaT = 1 * DEGRAD;
		const REDUCTION = 2.0 / 3;
		const MAX_REDUCTIONS = 20;
		for (let reduc = 0; reduc < MAX_REDUCTIONS; reduc++)
		{
			let anything = false;
			let bestScore = this.currentScore;
			let bestCX = this.cx, bestCY = this.cy, bestRW = this.rw, bestRH = this.rh, bestTheta = this.theta;

			for (let dCX = -1; dCX <= 1; dCX++)
			{
				let newCX = this.cx + dCX * deltaD;
				for (let dCY = -1; dCY <= 1; dCY++)
				{
					let newCY = this.cy + dCY * deltaD;
					for (let dRW = -1; dRW <= 1; dRW++)
					{
						let newRW = this.rw + dRW * deltaR;
						for (let dRH = -1; dRH <= 1; dRH++)
						{
							let newRH = this.rh + dRH * deltaR;
							for (let dT = -1; dT <= 1; dT++)
							{
								if (dCX == 0 && dCY == 0 && dRW == 0 && dRH == 0 && dT == 0) continue;
								let newTheta = this.theta + dT * deltaT;
								let newScore = this.calculateScore(newCX, newCY, newRW, newRH, newTheta);
								if (newScore > bestScore && !fltEqual(newScore, bestScore))
								{
									anything = true;
									bestScore = newScore;
									bestCX = newCX;
									bestCY = newCY;
									bestRW = newRW;
									bestRH = newRH;
									bestTheta = newTheta;
								}
							}
						}
					}
				}
			}

			if (anything)
			{
				this.currentScore = bestScore;
				this.cx = bestCX;
				this.cy = bestCY;
				this.rw = bestRW;
				this.rh = bestRH;
				this.theta = bestTheta;
			}
			else
			{
				reduc++;
				deltaD *= REDUCTION;
				deltaR *= REDUCTION;
				deltaT *= REDUCTION;
			}
		}
	}

	// calculate a score for a given state; higher is better, zero is unacceptable
	private calculateScore(cx:number, cy:number, rw:number, rh:number, theta:number):number
	{
		const {px, py, margin} = this, psz = px.length;

		// radiate out a series of "spokes" that make up points of the rotated ellipse; if any of these crosses an outline segment
		const nseg = 24;
		let cosTheta = Math.cos(theta), sinTheta = Math.sin(theta);
		let incrAlpha = TWOPI / nseg;

		let closestDSQ = Vec.numberArray(Number.POSITIVE_INFINITY, psz);

		for (let n = 0; n < nseg; n++)
		{
			let alpha = n * incrAlpha;
			let cosAlpha = Math.cos(alpha), sinAlpha = Math.sin(alpha);
			let dx = rw * cosAlpha * cosTheta - rh * sinAlpha * sinTheta;
			let dy = rw * cosAlpha * sinTheta + rh * sinAlpha * cosTheta;

			let d = norm_xy(dx, dy) + margin, eth = Math.atan2(dy, dx);
			let x = cx + d * Math.cos(eth);
			let y = cy + d * Math.sin(eth);

			for (let i = 0; i < psz; i++)
			{
				let ii = i == psz - 1 ? 0 : i + 1;
				if (GeomUtil.doLineSegsIntersect(cx, cy, x, y, px[i], py[i], px[ii], py[ii])) return 0;
			}

			for (let i = 0; i < psz; i++) closestDSQ[i] = Math.min(closestDSQ[i], norm2_xy(x - px[i], y - py[i]));
		}

		let proxSum = 0;
		for (let dsq of closestDSQ) proxSum += 1.0 / (1 + Math.sqrt(dsq));
		if (this.fullySymmetric) proxSum -= Math.abs(theta);

		// it isn't violated, so bigger is better
		return rw * rh + proxSum;
	}
}

/* EOF */ }