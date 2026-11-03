/*
    WebMolKit

    (c) 2010-2026 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {EigenvalueDecomposition} from './EigenvalueDecomposition';
import {Matrix} from './Matrix';
import {SingularValueDecomposition} from './SingularValueDecomposition';
import {Vec} from './Vec';

/*
	Several matrix decompositions.

	Originally from JAMA library.
*/

/*
	LU Decomposition.

	For an m-by-n matrix A with m >= n, the LU decomposition is an m-by-n
	unit lower triangular matrix L, an n-by-n upper triangular matrix U,
	and a permutation vector piv of length m so that A(piv,:) = L*U.
	If m < n, then L is m-by-m and U is m-by-n.

	The LU decompostion with pivoting always exists, even if the matrix is
	singular, so the constructor will never fail.  The primary use of the
	LU decomposition is in the solution of square systems of simultaneous
	linear equations.  This will fail if isNonsingular() returns false.
*/

export class LUDecomposition
{
	private LU:number[][]; // internal array storage
	private m:number; // column dimension
	private n:number; // row dimension
	private pivsign:number; // pivot sign
	private piv:number[]; // pivot vector

	constructor(mtx:Matrix)
	{
		// Use a "left-looking", dot-product, Crout/Doolittle algorithm.

		let LU = this.LU = mtx.getArrayCopy();
		let m = this.m = mtx.getRowDimension();
		let n = this.n = mtx.getColumnDimension();
		let piv = this.piv = Vec.identity0(m);
		this.pivsign = 1;
		
		let LUrowi:number[];
		let LUcolj:number[] = new Array(m);

		// Outer loop.

		for (let j = 0; j < n; j++)
		{
			// Make a copy of the j-th column to localize references.

			for (let i = 0; i < m; i++)
			{
				LUcolj[i] = LU[i][j];
			}

			// Apply previous transformations.

			for (let i = 0; i < m; i++)
			{
				LUrowi = LU[i];

				// Most of the time is spent in the following dot product.

				let kmax = Math.min(i, j);
				let s = 0.0;
				for (let k = 0; k < kmax; k++)
				{
					s += LUrowi[k] * LUcolj[k];
				}

				LUrowi[j] = LUcolj[i] -= s;
			}

			// Find pivot and exchange if necessary.

			let p = j;
			for (let i = j + 1; i < m; i++)
			{
				if (Math.abs(LUcolj[i]) > Math.abs(LUcolj[p]))
				{
					p = i;
				}
			}
			if (p != j)
			{
				for (let k = 0; k < n; k++)
				{
					let t = LU[p][k];
					LU[p][k] = LU[j][k];
					LU[j][k] = t;
				}
				let k = piv[p];
				piv[p] = piv[j];
				piv[j] = k;
				this.pivsign = -this.pivsign;
			}

			// Compute multipliers.

			if (j < m && LU[j][j] != 0.0)
			{
				for (let i = j + 1; i < m; i++)
				{
					LU[i][j] /= LU[j][j];
				}
			}
		}
	}

	public isNonsingular():boolean
	{
		const {LU, n} = this;
		for (let j = 0; j < n; j++)
		{
			if (LU[j][j] == 0) return false;
		}
		return true;
	}

	public getL():Matrix
	{
		const {LU, m, n} = this;
		let X = new Matrix(m, n);
		let L = X.A;
		for (let i = 0; i < m; i++)
		{
			for (let j = 0; j < n; j++)
			{
				if (i > j)
				{
					L[i][j] = LU[i][j];
				}
				else if (i == j)
				{
					L[i][j] = 1.0;
				}
				else
				{
					L[i][j] = 0.0;
				}
			}
		}
		return X;
	}

	public getU():Matrix
	{
		const {LU, n} = this;
		let X = new Matrix(n, n);
		let U = X.A;
		for (let i = 0; i < n; i++)
		{
			for (let j = 0; j < n; j++)
			{
				if (i <= j)
				{
					U[i][j] = LU[i][j];
				}
				else
				{
					U[i][j] = 0.0;
				}
			}
		}
		return X;
	}

	public getPivot():number[]
	{
		const {m, piv} = this;
		let p:number[] = new Array(m);
		for (let i = 0; i < m; i++)
		{
			p[i] = piv[i];
		}
		return p;
	}

	public getDoublePivot():number[]
	{
		const {m, piv} = this;
		let vals:number[] = new Array(m);
		for (let i = 0; i < m; i++)
		{
			vals[i] = piv[i];
		}
		return vals;
	}

	public det():number
	{
		const {LU, m, n} = this;
		if (m != n)
		{
			throw new Error('Matrix must be square.');
		}
		let d = this.pivsign;
		for (let j = 0; j < n; j++)
		{
			d *= LU[j][j];
		}
		return d;
	}

	public solve(B:Matrix):Matrix
	{
		const {LU, m, n} = this;
		if (B.getRowDimension() != m)
		{
			throw new Error('Matrix row dimensions must agree.');
		}
		if (!this.isNonsingular())
		{
			throw new Error('Matrix is singular.');
		}

		// Copy right hand side with pivoting
		let nx = B.getColumnDimension();
		let Xmat = B.getMatrixIdxRange(this.piv, 0, nx - 1);
		let X = Xmat.A;

		// Solve L*Y = B(piv,:)
		for (let k = 0; k < n; k++)
		{
			for (let i = k + 1; i < n; i++)
			{
				for (let j = 0; j < nx; j++)
				{
					X[i][j] -= X[k][j] * LU[i][k];
				}
			}
		}
		// Solve U*X = Y;
		for (let k = n - 1; k >= 0; k--)
		{
			for (let j = 0; j < nx; j++)
			{
				X[k][j] /= LU[k][k];
			}
			for (let i = 0; i < k; i++)
			{
				for (let j = 0; j < nx; j++)
				{
					X[i][j] -= X[k][j] * LU[i][k];
				}
			}
		}
		return Xmat;
	}
}

/*
	QR Decomposition.

   For an m-by-n matrix A with m >= n, the QR decomposition is an m-by-n
   orthogonal matrix Q and an n-by-n upper triangular matrix R so that
   A = Q*R.

   The QR decompostion always exists, even if the matrix does not have
   full rank, so the constructor will never fail.  The primary use of the
   QR decomposition is in the least squares solution of nonsquare systems
   of simultaneous linear equations.  This will fail if isFullRank()
   returns false.
*/

export class QRDecomposition
{
	private QR:number[][]; // internal array storage
	private m:number; // column dimension
	private n:number; // row dimension
	private Rdiag:number[]; // diagonal of R

	constructor(mtx:Matrix)
	{
		let QR = this.QR = mtx.getArrayCopy();
		let m = this.m = mtx.getRowDimension();
		let n = this.n = mtx.getColumnDimension();
		let Rdiag = this.Rdiag = new Array(n);

		for (let k = 0; k < n; k++)
		{
			// Compute 2-norm of k-th column without under/overflow.
			let nrm = 0;
			for (let i = k; i < m; i++)
			{
				nrm = Math.hypot(nrm, QR[i][k]);
			}

			if (nrm != 0.0)
			{
				// Form k-th Householder vector.
				if (QR[k][k] < 0)
				{
					nrm = -nrm;
				}
				for (let i = k; i < m; i++)
				{
					QR[i][k] /= nrm;
				}
				QR[k][k] += 1.0;

				// Apply transformation to remaining columns.
				for (let j = k + 1; j < n; j++)
				{
					let s = 0.0;
					for (let i = k; i < m; i++)
					{
						s += QR[i][k] * QR[i][j];
					}
					s = -s / QR[k][k];
					for (let i = k; i < m; i++)
					{
						QR[i][j] += s * QR[i][k];
					}
				}
			}
			Rdiag[k] = -nrm;
		}
	}

	public isFullRank():boolean
	{
		const {Rdiag, n} = this;
		for (let j = 0; j < n; j++)
		{
			if (Rdiag[j] == 0) return false;
		}
		return true;
	}

	public getH():Matrix
	{
		const {QR, m, n} = this;
		let X = new Matrix(m, n);
		let H = X.A;
		for (let i = 0; i < m; i++)
		{
			for (let j = 0; j < n; j++)
			{
				if (i >= j)
				{
					H[i][j] = QR[i][j];
				}
				else
				{
					H[i][j] = 0.0;
				}
			}
		}
		return X;
	}

	public getR():Matrix
	{
		const {QR, n, Rdiag} = this;
		let X = new Matrix(n, n);
		let R = X.A;
		for (let i = 0; i < n; i++)
		{
			for (let j = 0; j < n; j++)
			{
				if (i < j)
				{
					R[i][j] = QR[i][j];
				}
				else if (i == j)
				{
					R[i][j] = Rdiag[i];
				}
				else
				{
					R[i][j] = 0.0;
				}
			}
		}
		return X;
	}

	public getQ():Matrix
	{
		const {QR, m, n} = this;
		let X = new Matrix(m, n);
		let Q = X.A;
		for (let k = n - 1; k >= 0; k--)
		{
			for (let i = 0; i < m; i++)
			{
				Q[i][k] = 0.0;
			}
			Q[k][k] = 1.0;
			for (let j = k; j < n; j++)
			{
				if (QR[k][k] != 0)
				{
					let s = 0.0;
					for (let i = k; i < m; i++)
					{
						s += QR[i][k] * Q[i][j];
					}
					s = -s / QR[k][k];
					for (let i = k; i < m; i++)
					{
						Q[i][j] += s * QR[i][k];
					}
				}
			}
		}
		return X;
	}

	public solve(B:Matrix):Matrix
	{
		const {QR, m, n, Rdiag} = this;
		if (B.getRowDimension() != m)
		{
			throw new Error('Matrix row dimensions must agree.');
		}
		if (!this.isFullRank())
		{
			throw new Error('Matrix is rank deficient.');
		}

		// Copy right hand side
		let nx = B.getColumnDimension();
		let X = B.A;

		// Compute Y = transpose(Q)*B
		for (let k = 0; k < n; k++)
		{
			for (let j = 0; j < nx; j++)
			{
				let s = 0.0;
				for (let i = k; i < m; i++)
				{
					s += QR[i][k] * X[i][j];
				}
				s = -s / QR[k][k];
				for (let i = k; i < m; i++)
				{
					X[i][j] += s * QR[i][k];
				}
			}
		}
		// Solve R*X = Y;
		for (let k = n - 1; k >= 0; k--)
		{
			for (let j = 0; j < nx; j++)
			{
				X[k][j] /= Rdiag[k];
			}
			for (let i = 0; i < k; i++)
			{
				for (let j = 0; j < nx; j++)
				{
					X[i][j] -= X[k][j] * QR[i][k];
				}
			}
		}
		return Matrix.fromArray(X).getMatrixRange(0, n - 1, 0, nx - 1);
	}
}

/*
	Cholesky Decomposition.

	For a symmetric, positive definite matrix A, the Cholesky decomposition
	is an lower triangular matrix L so that A = L*L'.

	If the matrix is not symmetric or positive definite, the constructor
	returns a partial decomposition and sets an internal flag that may
	be queried by the isSPD() method.
*/

export class CholeskyDecomposition
{
	private L:number[][]; // internal array storage
	private n:number; // matrix dimension
	private isspd:boolean; // is symmetric and positive definite flag

	constructor(mtx:Matrix)
	{
		let A = mtx.A;
		let n = this.n = mtx.getRowDimension();
		let L = this.L = new Array(n);
		for (let i = 0; i < n; i++) L[i] = new Array(n);
		this.isspd = mtx.getColumnDimension() == n;

		for (let j = 0; j < n; j++)
		{
			let Lrowj = L[j];
			let d = 0.0;
			for (let k = 0; k < j; k++)
			{
				let Lrowk = L[k];
				let s = 0.0;
				for (let i = 0; i < k; i++)
				{
					s += Lrowk[i] * Lrowj[i];
				}
				Lrowj[k] = s = (A[j][k] - s) / L[k][k];
				d = d + s * s;
				this.isspd = this.isspd && A[k][j] == A[j][k];
			}
			d = A[j][j] - d;
			this.isspd = this.isspd && d > 0.0;
			L[j][j] = Math.sqrt(Math.max(d, 0.0));
			for (let k = j + 1; k < n; k++)
			{
				L[j][k] = 0.0;
			}
		}
	}

	public isSPD():boolean
	{
		return this.isspd;
	}

	public getL():Matrix
	{
		const {L} = this;
		return Matrix.fromArray(L);
	}

	public solve(B:Matrix):Matrix
	{
		const {L, n} = this;
		if (B.getRowDimension() != n)
		{
			throw new Error('Matrix row dimensions must agree.');
		}
		if (!this.isspd)
		{
			throw new Error('Matrix is not symmetric positive definite.');
		}

		// Copy right hand side.
		let X = B.getArrayCopy();
		let nx = B.getColumnDimension();

		// Solve L*Y = B;
		for (let k = 0; k < n; k++)
		{
			for (let j = 0; j < nx; j++)
			{
				for (let i = 0; i < k; i++)
				{
					X[k][j] -= X[i][j] * L[k][i];
				}
				X[k][j] /= L[k][k];
			}
		}

		// Solve L'*X = Y;
		for (let k = n - 1; k >= 0; k--)
		{
			for (let j = 0; j < nx; j++)
			{
				for (let i = k + 1; i < n; i++)
				{
					X[k][j] -= X[i][j] * L[i][k];
				}
				X[k][j] /= L[k][k];
			}
		}

		return Matrix.fromArray(X).getMatrixRange(0, n, 0, nx);
	}
}
