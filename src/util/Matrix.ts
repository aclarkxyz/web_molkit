/*
    WebMolKit

    (c) 2010-2020 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {Vec} from './Vec';

/*
	Useful matrix functionality.
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

	public get numRows():number {return this.m;}
	public get numCols():number {return this.n;}
	public get(i:number, j:number):number {return this.A[i][j];}
	public set(i:number, j:number, v:number):void {this.A[i][j] = v;}

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

/*
	public double norm2()
	{
		return (new SingularValueDecomposition(this).norm2());
	}
*/

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

/*
	public double normF()
	{
		double f = 0;
		for (let i = 0; i < m; i++)
		{
			for (let j = 0; j < n; j++)
			{
				f = Maths.hypot(f, A[i][j]);
			}
		}
		return f;
	}
*/

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

	/*public LUDecomposition lu()
	{
		return new LUDecomposition(this);
	}

	public QRDecomposition qr()
	{
		return new QRDecomposition(this);
	}

	public CholeskyDecomposition chol()
	{
		return new CholeskyDecomposition(this);
	}

	public SingularValueDecomposition svd()
	{
		return new SingularValueDecomposition(this);
	}

	public EigenvalueDecomposition eig()
	{
		return new EigenvalueDecomposition(this);
	}

	public Matrix solve(Matrix B)
	{
		return (m == n ? (new LUDecomposition(this)).solve(B) : (new QRDecomposition(this)).solve(B));
	}

	public Matrix solveTranspose(Matrix B)
	{
		return transpose().solve(B.transpose());
	}

	public Matrix inverse()
	{
		return solve(identity(m, m));
	}

	public double det()
	{
		return new LUDecomposition(this).det();
	}*/

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

export class SingularValueDecomposition
{
	private U:number[][];
	private V:number[][];
	private s:number[];
	private m:number;
	private n:number;

	constructor(mtx:Matrix)
	{
		let A = mtx.A;
		let m = this.m = mtx.m;
		let n = this.n = mtx.n;

		let nu = Math.min(m, n);
		let s = this.s = new Array(Math.min(m + 1, n));
		let U = this.U = new Array(m);
		let V = this.V = new Array(n);
		for (let i = 0; i < m; i++) U[i] = Vec.numberArray(0, nu);
		for (let j = 0; j < n; j++) V[j] = Vec.numberArray(0, n);
		let e:number[] = new Array(n);
		let work:number[] = new Array(m);
		let wantu = true, wantv = true;

		let nct = Math.min(m - 1, n);
		let nrt = Math.max(0, Math.min(n - 2, m));
		for (let k = 0; k < Math.max(nct, nrt); k++)
		{
			if (k < nct)
			{
				s[k] = 0;
				for (let i = k; i < m; i++) s[k] = SingularValueDecomposition.hypot(s[k], A[i][k]);
				if (s[k] != 0.0)
				{
					if (A[k][k] < 0.0) s[k] = -s[k];
					for (let i = k; i < m; i++) A[i][k] /= s[k];
					A[k][k] += 1.0;
				}
				s[k] = -s[k];
			}
			for (let j = k + 1; j < n; j++)
			{
				if ((k < nct) && (s[k] != 0.0))
				{
					let t = 0;
					for (let i = k; i < m; i++) t += A[i][k] * A[i][j];
					t = -t / A[k][k];
					for (let i = k; i < m; i++) A[i][j] += t * A[i][k];
				}
				e[j] = A[k][j];
			}
			if (wantu && (k < nct))
			{
				for (let i = k; i < m; i++) U[i][k] = A[i][k];
			}
			if (k < nrt)
			{
				e[k] = 0;
				for (let i = k + 1; i < n; i++) e[k] = SingularValueDecomposition.hypot(e[k], e[i]);
				if (e[k] != 0.0)
				{
					if (e[k + 1] < 0.0) e[k] = -e[k];
					for (let i = k + 1; i < n; i++) e[i] /= e[k];
					e[k + 1] += 1.0;
				}
				e[k] = -e[k];
				if ((k + 1 < m) && (e[k] != 0.0))
				{
					for (let i = k + 1; i < m; i++) work[i] = 0.0;
					for (let j = k + 1; j < n; j++) for (let i = k + 1; i < m; i++) work[i] += e[j] * A[i][j];
					for (let j = k + 1; j < n; j++)
					{
						let t = -e[j] / e[k + 1];
						for (let i = k + 1; i < m; i++) A[i][j] += t * work[i];
					}
				}
				if (wantv)
				{
					for (let i = k + 1; i < n; i++) V[i][k] = e[i];
				}
			}
		}

		let p = Math.min(n, m + 1);
		if (nct < n) s[nct] = A[nct][nct];
		if (m < p) s[p - 1] = 0.0;
		if (nrt + 1 < p) e[nrt] = A[nrt][p - 1];
		e[p - 1] = 0.0;

		if (wantu)
		{
			for (let j = nct; j < nu; j++)
			{
				for (let i = 0; i < m; i++) U[i][j] = 0.0;
				U[j][j] = 1.0;
			}
			for (let k = nct - 1; k >= 0; k--)
			{
				if (s[k] != 0.0)
				{
					for (let j = k + 1; j < nu; j++)
					{
						let t = 0;
						for (let i = k; i < m; i++) t += U[i][k] * U[i][j];
						t = -t / U[k][k];
						for (let i = k; i < m; i++) U[i][j] += t * U[i][k];
					}
					for (let i = k; i < m; i++) U[i][k] = -U[i][k];
					U[k][k] = 1.0 + U[k][k];
					for (let i = 0; i < k - 1; i++) U[i][k] = 0.0;
				}
				else
				{
					for (let i = 0; i < m; i++) U[i][k] = 0.0;
					U[k][k] = 1.0;
				}
			}
		}

		if (wantv)
		{
			for (let k = n - 1; k >= 0; k--)
			{
				if ((k < nrt) && (e[k] != 0.0))
				{
					for (let j = k + 1; j < nu; j++)
					{
						let t = 0;
						for (let i = k + 1; i < n; i++) t += V[i][k] * V[i][j];
						t = -t / V[k + 1][k];
						for (let i = k + 1; i < n; i++) V[i][j] += t * V[i][k];
					}
				}
				for (let i = 0; i < n; i++) V[i][k] = 0.0;
				V[k][k] = 1.0;
			}
		}

		let pp = p - 1;
		let iter = 0;
		let eps = Math.pow(2.0, -52.0);
		let tiny = Math.pow(2.0, -966.0);
		while (p > 0)
		{
			let k:number, kase:number;
			for (k = p - 2; k >= -1; k--)
			{
				if (k == -1) break;
				if (Math.abs(e[k]) <= tiny + eps * (Math.abs(s[k]) + Math.abs(s[k + 1])))
				{
					e[k] = 0.0;
					break;
				}
			}
			if (k == p - 2)
			{
				kase = 4;
			}
			else
			{
				let ks:number;
				for (ks = p - 1; ks >= k; ks--)
				{
					if (ks == k) break;
					let t = (ks != p ? Math.abs(e[ks]) : 0.) + (ks != k + 1 ? Math.abs(e[ks - 1]) : 0.);
					if (Math.abs(s[ks]) <= tiny + eps * t)
					{
						s[ks] = 0.0;
						break;
					}
				}
				if (ks == k) kase = 3;
				else if (ks == p - 1) kase = 1;
				else
				{
					kase = 2;
					k = ks;
				}
			}
			k++;

			if (kase == 1)
			{
				let f = e[p - 2];
				e[p - 2] = 0.0;
				for (let j = p - 2; j >= k; j--)
				{
					let t = SingularValueDecomposition.hypot(s[j], f);
					let cs = s[j] / t;
					let sn = f / t;
					s[j] = t;
					if (j != k)
					{
						f = -sn * e[j - 1];
						e[j - 1] = cs * e[j - 1];
					}
					if (wantv)
					{
						for (let i = 0; i < n; i++)
						{
							t = cs * V[i][j] + sn * V[i][p - 1];
							V[i][p - 1] = -sn * V[i][j] + cs * V[i][p - 1];
							V[i][j] = t;
						}
					}
				}
			}
			else if (kase == 2)
			{
				let f = e[k - 1];
				e[k - 1] = 0.0;
				for (let j = k; j < p; j++)
				{
					let t = SingularValueDecomposition.hypot(s[j], f);
					let cs = s[j] / t;
					let sn = f / t;
					s[j] = t;
					f = -sn * e[j];
					e[j] = cs * e[j];
					if (wantu)
					{
						for (let i = 0; i < m; i++)
						{
							t = cs * U[i][j] + sn * U[i][k - 1];
							U[i][k - 1] = -sn * U[i][j] + cs * U[i][k - 1];
							U[i][j] = t;
						}
					}
				}
			}
			else if (kase == 3)
			{
				let scale = Math.max(Math.max(Math.max(Math.max(Math.abs(s[p - 1]), Math.abs(s[p - 2])), Math.abs(e[p - 2])), Math.abs(s[k])), Math.abs(e[k]));
				let sp = s[p - 1] / scale;
				let spm1 = s[p - 2] / scale;
				let epm1 = e[p - 2] / scale;
				let sk = s[k] / scale;
				let ek = e[k] / scale;
				let b = ((spm1 + sp) * (spm1 - sp) + epm1 * epm1) / 2.0;
				let c = (sp * epm1) * (sp * epm1);
				let shift = 0.0;
				if ((b != 0.0) || (c != 0.0))
				{
					shift = Math.sqrt(b * b + c);
					if (b < 0.0) shift = -shift;
					shift = c / (b + shift);
				}
				let f = (sk + sp) * (sk - sp) + shift;
				let g = sk * ek;

				for (let j = k; j < p - 1; j++)
				{
					let t = SingularValueDecomposition.hypot(f, g);
					let cs = f / t;
					let sn = g / t;
					if (j != k) e[j - 1] = t;
					f = cs * s[j] + sn * e[j];
					e[j] = cs * e[j] - sn * s[j];
					g = sn * s[j + 1];
					s[j + 1] = cs * s[j + 1];
					if (wantv)
					{
						for (let i = 0; i < n; i++)
						{
							t = cs * V[i][j] + sn * V[i][j + 1];
							V[i][j + 1] = -sn * V[i][j] + cs * V[i][j + 1];
							V[i][j] = t;
						}
					}
					t = SingularValueDecomposition.hypot(f, g);
					cs = f / t;
					sn = g / t;
					s[j] = t;
					f = cs * e[j] + sn * s[j + 1];
					s[j + 1] = -sn * e[j] + cs * s[j + 1];
					g = sn * e[j + 1];
					e[j + 1] = cs * e[j + 1];
					if (wantu && (j < m - 1))
					{
						for (let i = 0; i < m; i++)
						{
							t = cs * U[i][j] + sn * U[i][j + 1];
							U[i][j + 1] = -sn * U[i][j] + cs * U[i][j + 1];
							U[i][j] = t;
						}
					}
				}
				e[p - 2] = f;
				iter = iter + 1;
			}
			else if (kase == 4)
			{
				if (s[k] <= 0.0)
				{
					s[k] = (s[k] < 0.0 ? -s[k] : 0.0);
					if (wantv)
					{
						for (let i = 0; i <= pp; i++) V[i][k] = -V[i][k];
					}
				}

				while (k < pp)
				{
					if (s[k] >= s[k + 1]) break;
					let t = s[k];
					s[k] = s[k + 1];
					s[k + 1] = t;
					if (wantv && (k < n - 1))
					{
						for (let i = 0; i < n; i++)
						{
							t = V[i][k + 1];
							V[i][k + 1] = V[i][k];
							V[i][k] = t;
						}
					}
					if (wantu && (k < m - 1))
					{
						for (let i = 0; i < m; i++)
						{
							t = U[i][k + 1];
							U[i][k + 1] = U[i][k];
							U[i][k] = t;
						}
					}
					k++;
				}
				iter = 0;
				p--;
			}
		}
	}

	public getU():Matrix
	{
		return Matrix.fromArray(this.U);
	}
	public getV():Matrix
	{
		return Matrix.fromArray(this.V);
	}
	public getSingularValues():number[]
	{
		return this.s;
	}

	public getS():Matrix
	{
		const {n} = this;
		let X = new Matrix(n, n, 0);
		let S = X.A;
		for (let i = 0; i < n; i++) S[i][i] = this.s[i];
		return X;
	}

	public norm2():number
	{
		return this.s[0];
	}

	public cond():number
	{
		const {m, n, s} = this;
		return s[0] / s[Math.min(m, n) - 1];
	}

	public rank():number
	{
		const {m, n, s} = this;
		let eps = Math.pow(2.0, -52.0);
		let tol = Math.max(m, n) * s[0] * eps;
		let r = 0;
		for (let i = 0; i < s.length; i++) if (s[i] > tol) r++;
		return r;
	}

	public static hypot(a:number, b:number):number
	{
		let r;
		if (Math.abs(a) > Math.abs(b))
		{
			r = b / a;
			r = Math.abs(a) * Math.sqrt(1 + r * r);
		}
		else if (b != 0)
		{
			r = a / b;
			r = Math.abs(b) * Math.sqrt(1 + r * r);
		}
		else
		{
			r = 0.0;
		}
		return r;
	}
}

