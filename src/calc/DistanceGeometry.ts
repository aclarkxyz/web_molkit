/*
    WebMolKit

    (c) 2010-2026 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {EigenvalueDecomposition} from '@wmk/util/EigenvalueDecomposition';
import {GeomUtil} from '@wmk/util/Geom';
import {Matrix} from '@wmk/util/Matrix';
import {sqr} from '@wmk/util/util';
import {Vec} from '@wmk/util/Vec';

/* eslint-disable @typescript-eslint/naming-convention */

/*
	Distance geometry embedding: takes a matrix of distances (symmetric, hollow) and produces an N-dimensional embedding for the whole thing.
	
	Uses a concise and remarkably effective algorithm by Crippen et al: Bulletin of Mathematical Biology, vol. 45, pp. 665-720 (1983)
*/

export class DistanceGeometry
{
	private eigenValues:number[] = null;
	private eigenVectors:number[][] = null;
	
	// ----------------- public methods -----------------

	constructor(private D:number[][])
	{
	}

	// perform the calculation, after which results will be available; 
	public calculate():void
	{
		const {D} = this;
		const sz = D.length;

		// sanity checking first
		for (let i = 0; i < sz; i++)
		{
			if (D[i].length != sz) throw new Error('Distance matrix is not square.');
			if (D[i][i] != 0) throw new Error('Distance matrix must be hollow, i.e. diagonal all zero');
			for (let j = i + 1; j < sz; j++) if (D[i][j] != D[j][i]) throw new Error('Matrix must be symmetrical.');
		}
		
		// calculate the baseline vector
		let invsz = 1.0 / sz;
		let B:number[] = new Array(sz);
		for (let i = 0; i < sz; i++)
		{
			let p1 = 0, p2 = 0;
			for (let j = 0; j < sz; j++)
			{
				p1 += sqr(D[i][j]);
				for (let k = j + 1; k < sz; k++) p2 += sqr(D[j][k]);
			}
			B[i] = invsz * p1 - (invsz * invsz) * p2;
		}
				
		// populate the prerequisite matrix
		let M:number[][] = new Array(sz);
		for (let i = 0; i < sz; i++)
		{
			M[i] = new Array(sz);
			for (let j = 0; j < sz; j++)
			{
				let v1 = B[i], v2 = B[j], v3 = D[i][j];
				M[i][j] = 0.5 * (v1 * v1 + v2 * v2 - v3 * v3);
			}
		}
		
		// the work part is just an eigen calculation
		let evd = new EigenvalueDecomposition(Matrix.fromArray(M));
		this.eigenValues = evd.getRealEigenvalues();
		this.eigenVectors = evd.getVArray();
	}
	
	// returns the projected coordinates for a given dimension; nominally 0=X, 1=Y, 2=Z, etc.
	public getCoordinates(d:number):number[]
	{
		const {eigenValues, eigenVectors} = this;
		if (d >= eigenValues.length) throw new Error(`Requesting too many dimensions: ${d} of ${eigenValues.length}`);

		const sz = eigenValues.length;
		let idx = sz - 1 - d;
		
		let eig = eigenValues[idx];
		if (eig <= 0) return Vec.numberArray(0, sz); // very low dimensionality can result in 0 or -ve eigenvalues, which is OK
		
		let coef = Math.sqrt(eig);
		let coords:number[] = new Array(sz);
		for (let n = 0; n < sz; n++) coords[n] = coef * eigenVectors[n][idx];
		return coords;
	}
	
	// the defacto {X,Y,Z} coordinates are often reasonable, but sometimes transposed in significance; it is helpful to rotate in 3D so that the least 
	// influential coordinate is on the Z-axis, which gives the best results when truncating to {X,Y} on the plane
	public getBestCoordinates():number[][]
	{
		const sz = this.D.length;
		let x = this.getCoordinates(0), y = this.getCoordinates(1), z = this.getCoordinates(2);
		
		// find the "plane of best fit" for the 3D points, whereby the result is given in the form of the normal to the plane
		
		Vec.addTo(x, -Vec.sum(x) / sz);
		Vec.addTo(y, -Vec.sum(y) / sz);
		Vec.addTo(z, -Vec.sum(z) / sz);
				
		let A = new Matrix(sz, 3);
		let b = new Matrix(sz, 1);
		for (let n = 0; n < sz; n++)
		{
			A.set(n, 0, x[n]);
			A.set(n, 1, y[n]);
			A.set(n, 2, 1);
			b.set(n, 0, z[n]);
		}
		let At = A.transpose();

		// "fit" is the normal direction for the pseudo-plane of best fit
		let fit = (At.times(A)).inverse().times(At).times(b);
		
		let normal = fit.getColumnPackedCopy();
		
		// if the normal vector is basically zero, don't try to rotate it
		if (GeomUtil.magnitude(normal) < 1E-16) return [x, y, z];
		
		GeomUtil.normalise(normal);
		
		const ZAXIS = [0, 0, 1];
		let rotaxis = GeomUtil.crossProduct(normal, ZAXIS);
		
		let theta = Math.acos(GeomUtil.dotProduct(normal, ZAXIS)); // extent of rotation

		let rotmtx = GeomUtil.rotationMatrix(rotaxis, theta);

		for (let n = 0; n < sz; n++)
		{
			let xyz = [x[n], y[n], z[n]];
			GeomUtil.rotateCoord(rotmtx, xyz);
			x[n] = xyz[0];
			y[n] = xyz[1];
			z[n] = xyz[2];
		}

		return [x, y, z];
	}

	// ----------------- private methods -----------------
	
}
