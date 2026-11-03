/*
    WebMolKit

    (c) 2010-2026 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {EigenvalueDecomposition} from './EigenvalueDecomposition';
import {CholeskyDecomposition, LUDecomposition, QRDecomposition} from './MatrixDecompositions';
import {SingularValueDecomposition} from './SingularValueDecomposition';
import {Vec} from './Vec';

/*
	Useful matrix functionality.

	Originally from the JAMA library (public domain).
*/

export class Matrix
{
	public A:number[][];

	// create a blank matrix with given dimensions; m = height, n = width
	constructor(public m:number, public n:number, s:number = 0)
	{
		if (m == 0) return;
		this.A = new Array(m);
		for (let i = 0; i < m; i++) this.A[i] = Vec.numberArray(s, n);
	}

	public static fromArray(A:number[][]):Matrix
	{
		let mtx = new Matrix(0, 0);
		mtx.A = A;
		mtx.m = A.length;
		mtx.n = A[0].length;
		return mtx;
	}

	public clone():Matrix
	{
		const {A, m, n} = this;
		let mtx = new Matrix(m, n);
		for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) mtx.A[i][j] = A[i][j];
		return mtx;
	}

	public getRowDimension():number {return this.m;}
	public getColumnDimension():number {return this.n;}

	public get numRows():number {return this.m;}
	public get numCols():number {return this.n;}
	public get(i:number, j:number):number {return this.A[i][j];}
	public set(i:number, j:number, v:number):void {this.A[i][j] = v;}

	public getMatrixRange(i0:number, i1:number, j0:number, j1:number):Matrix
	{
		const {A} = this;
		let X = new Matrix(i1 - i0 + 1, j1 - j0 + 1);
		let B = X.A;
		for (let i = i0; i <= i1; i++)
		{
			for (let j = j0; j <= j1; j++)
			{
				B[i - i0][j - j0] = A[i][j];
			}
		}
		return X;
	}

	public getMatrixIndexes(r:number[], c:number[]):Matrix
	{
		const {A} = this;
		let X = new Matrix(r.length, c.length);
		let B = X.A;
		for (let i = 0; i < r.length; i++)
		{
			for (let j = 0; j < c.length; j++)
			{
				B[i][j] = A[r[i]][c[j]];
			}
		}
		return X;
	}

	public getMatrixRangeIdx(i0:number, i1:number, c:number[]):Matrix
	{
		const {A} = this;
		let X = new Matrix(i1 - i0 + 1, c.length);
		let B = X.A;
		for (let i = i0; i <= i1; i++)
		{
			for (let j = 0; j < c.length; j++)
			{
				B[i - i0][j] = A[i][c[j]];
			}
		}
		return X;
	}

	public getMatrixIdxRange(r:number[], j0:number, j1:number):Matrix
	{
		const {A} = this;
		let X = new Matrix(r.length, j1 - j0 + 1);
		let B = X.A;
		for (let i = 0; i < r.length; i++)
		{
			for (let j = j0; j <= j1; j++)
			{
				B[i][j - j0] = A[r[i]][j];
			}
		}
		return X;
	}

	public getArrayCopy():number[][]
	{
		return this.A.map((row) => [...row]);
	}

	public getColumnPackedCopy():number[]
	{
		const {A, m, n} = this;
		let vals:number[] = new Array(m * n);
		for (let i = 0; i < m; i++)
		{
			for (let j = 0; j < n; j++)
			{
				vals[i + j * m] = A[i][j];
			}
		}
		return vals;
	}

	public getRowPackedCopy():number[]
	{
		const {A, m, n} = this;
		let vals:number[] = new Array(m * n);
		for (let i = 0; i < m; i++)
		{
			for (let j = 0; j < n; j++)
			{
				vals[i * n + j] = A[i][j];
			}
		}
		return vals;
	}

	public transpose():Matrix
	{
		const {A, m, n} = this;
		let X = new Matrix(n, m);
		const C = X.A;
		for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) C[j][i] = A[i][j];
		return X;
	}

	public norm1():number
	{
		const {A, m, n} = this;
		let f = 0;
		for (let j = 0; j < n; j++)
		{
			let s = 0;
			for (let i = 0; i < m; i++) s += Math.abs(A[i][j]);
			f = Math.max(f, s);
		}
		return f;
	}

	public norm2():number
	{
		return (new SingularValueDecomposition(this).norm2());
	}

	public normInf():number
	{
		const {A, m, n} = this;
		let f = 0;
		for (let i = 0; i < m; i++)
		{
			let s = 0;
			for (let j = 0; j < n; j++) s += Math.abs(A[i][j]);
			f = Math.max(f, s);
		}
		return f;
	}

	public normF():number
	{
		const {A, m, n} = this;
		let f = 0;
		for (let i = 0; i < m; i++)
		{
			for (let j = 0; j < n; j++)
			{
				f = Math.hypot(f, A[i][j]);
			}
		}
		return f;
	}

	public uminus():Matrix
	{
		const {A, m, n} = this;
		let X = new Matrix(m, n), C = X.A;
		for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) C[i][j] = -A[i][j];
		return X;
	}

	public plus(B:Matrix):Matrix
	{
		const {A, m, n} = this;
		let X = new Matrix(m, n), C = X.A;
		for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) C[i][j] = A[i][j] + B.A[i][j];
		return X;
	}

	public plusEquals(B:Matrix):Matrix
	{
		const {A, m, n} = this;
		for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) A[i][j] = A[i][j] + B.A[i][j];
		return this;
	}

	public minus(B:Matrix):Matrix
	{
		const {A, m, n} = this;
		let X = new Matrix(m, n), C = A;
		for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) C[i][j] = A[i][j] - B.A[i][j];
		return X;
	}

	public minusEquals(B:Matrix):Matrix
	{
		const {A, m, n} = this;
		for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) A[i][j] = A[i][j] - B.A[i][j];
		return this;
	}

	public arrayTimes(B:Matrix):Matrix
	{
		const {A, m, n} = this;
		let X = new Matrix(m, n), C = X.A;
		for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) C[i][j] = A[i][j] * B.A[i][j];
		return X;
	}

	public arrayTimesEquals(B:Matrix):Matrix
	{
		const {A, m, n} = this;
		for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) A[i][j] = A[i][j] * B.A[i][j];
		return this;
	}

	public arrayRightDivide(B:Matrix):Matrix
	{
		const {A, m, n} = this;
		let X = new Matrix(m, n), C = X.A;
		for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) C[i][j] = A[i][j] / B.A[i][j];
		return X;
	}

	public arrayRightDivideEquals(B:Matrix):Matrix
	{
		const {A, m, n} = this;
		for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) A[i][j] = A[i][j] / B.A[i][j];
		return this;
	}

	public arrayLeftDivide(B:Matrix):Matrix
	{
		const {A, m, n} = this;
		let X = new Matrix(m, n), C = X.A;
		for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) C[i][j] = B.A[i][j] / A[i][j];
		return X;
	}

	public arrayLeftDivideEquals(B:Matrix):Matrix
	{
		const {A, m, n} = this;
		for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) A[i][j] = B.A[i][j] / A[i][j];
		return this;
	}

	public scalarTimes(s:number):Matrix
	{
		const {A, m, n} = this;
		let X = new Matrix(m, n), C = X.A;
		for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) C[i][j] = s * A[i][j];
		return X;
	}

	public scalarTimesEquals(s:number):Matrix
	{
		const {A, m, n} = this;
		for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) A[i][j] = s * A[i][j];
		return this;
	}

	public times(B:Matrix):Matrix
	{
		const {A, m, n} = this;
		let X = new Matrix(m, B.n);
		let C = X.A, Bcolj:number[] = new Array(n);
		for (let j = 0; j < B.n; j++)
		{
			for (let k = 0; k < n; k++) Bcolj[k] = B.A[k][j];
			for (let i = 0; i < m; i++)
			{
				let Arowi = A[i];
				let s = 0;
				for (let k = 0; k < n; k++) s += Arowi[k] * Bcolj[k];
				C[i][j] = s;
			}
		}
		return X;
	}

	public lu():LUDecomposition
	{
		return new LUDecomposition(this);
	}

	public qr():QRDecomposition
	{
		return new QRDecomposition(this);
	}

	public chol():CholeskyDecomposition
	{
		return new CholeskyDecomposition(this);
	}

	public svd():SingularValueDecomposition
	{
		return new SingularValueDecomposition(this);
	}

	public eig():EigenvalueDecomposition
	{
		return new EigenvalueDecomposition(this);
	}

	public solve(B:Matrix):Matrix
	{
		return (this.m == this.n ? (new LUDecomposition(this)).solve(B) : (new QRDecomposition(this)).solve(B));
	}

	public solveTranspose(B:Matrix):Matrix
	{
		return this.transpose().solve(B.transpose());
	}

	public inverse():Matrix
	{
		return this.solve(Matrix.identity(this.m, this.m));
	}

	public det():number
	{
		return new LUDecomposition(this).det();
	}

	public rank():number
	{
		return new SingularValueDecomposition(this).rank();
	}

	public cond():number
	{
		return new SingularValueDecomposition(this).cond();
	}

	public trace():number
	{
		const {A, m, n} = this;
		let t = 0;
		for (let i = 0; i < Math.min(m, n); i++)
		{
			t += A[i][i];
		}
		return t;
	}

	public static identity(m:number, n:number):Matrix
	{
		let mtx = new Matrix(m, n);
		let A = mtx.A;
		for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) A[i][j] = (i == j ? 1.0 : 0.0);
		return mtx;
	}

	public toString():string
	{
		let lines:string[] = ['['];
		for (let row of this.A) lines.push(JSON.stringify(row));
		lines.push(']');
		return lines.join('\n');
	}
}

