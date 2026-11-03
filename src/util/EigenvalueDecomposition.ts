/*
    WebMolKit

    (c) 2010-2026 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {Matrix} from './Matrix';
import {Vec} from './Vec';

/*
	Eigenvalues and eigenvectors of a real matrix.

    If A is symmetric, then A = V*D*V' where the eigenvalue matrix D is
    diagonal and the eigenvector matrix V is orthogonal.
    i.e. A = V.times(D.times(V.transpose())) and
    V.times(V.transpose()) equals the identity matrix.

    If A is not symmetric, then the eigenvalue matrix D is block diagonal
    with the real eigenvalues in 1-by-1 blocks and any complex eigenvalues,
    lambda + i*mu, in 2-by-2 blocks, [lambda, mu; -mu, lambda].  The
    columns of V represent the eigenvectors in the sense that A*V = V*D,
    i.e. A.times(V) equals V.times(D).  The matrix V may be badly
    conditioned, or even singular, so the validity of the equation
    A = V*D*inverse(V) depends upon V.cond().

	Originally from the JAMA library (public domain).
*/

export class EigenvalueDecomposition
{
	private n:number; // matrix dimension
	private issymmetric:boolean; // internal symmetry flag
	// internal storage of eigenvalues
	private d:number[];
	private e:number[];
	private V:number[][]; // internal storage of eigenvectors
	private H:number[][]; // storage of nonsymmetric Hessenberg form
	private ort:number[]; // working storage for nonsymmetric algorithm

	constructor(mtx:Matrix)
	{
		let A = mtx.A;
		let n = this.n = mtx.n;
		let V = this.V = new Array(n);
		for (let i = 0; i < n; i++) V[i] = new Array(n);
		this.d = new Array(n);
		this.e = new Array(n);

		this.issymmetric = true;
		outer: for (let j = 0; j < n; j++)
		{
			for (let i = 0; i < n; i++)
			{
				if (A[i][j] != A[j][i])
				{
					this.issymmetric = false;
					break outer;
				}
			}
		}

		if (this.issymmetric)
		{
			for (let i = 0; i < n; i++)
			{
				for (let j = 0; j < n; j++)
				{
					V[i][j] = A[i][j];
				}
			}

			// Tridiagonalize.
			this.tred2();

			// Diagonalize.
			this.tql2();

		}
		else
		{
			let H = this.H = new Array(n);
			for (let i = 0; i < n; i++) H[i] = new Array(n);
			this.ort = new Array(n);

			for (let j = 0; j < n; j++)
			{
				for (let i = 0; i < n; i++)
				{
					H[i][j] = A[i][j];
				}
			}

			// Reduce to Hessenberg form.
			this.orthes();

			// Reduce Hessenberg to real Schur form.
			this.hqr2();
		}
	}

	// Symmetric Householder reduction to tridiagonal form.
	private tred2():void
	{
		const {n, d, e, V} = this;

		//  This is derived from the Algol procedures tred2 by
		//  Bowdler, Martin, Reinsch, and Wilkinson, Handbook for
		//  Auto. Comp., Vol.ii-Linear Algebra, and the corresponding
		//  Fortran subroutine in EISPACK.

		for (let j = 0; j < n; j++)
		{
			d[j] = V[n - 1][j];
		}

		// Householder reduction to tridiagonal form.

		for (let i = n - 1; i > 0; i--)
		{
			// Scale to avoid under/overflow.

			let scale = 0.0;
			let h = 0.0;
			for (let k = 0; k < i; k++)
			{
				scale = scale + Math.abs(d[k]);
			}
			if (scale == 0.0)
			{
				e[i] = d[i - 1];
				for (let j = 0; j < i; j++)
				{
					d[j] = V[i - 1][j];
					V[i][j] = 0.0;
					V[j][i] = 0.0;
				}
			}
			else
			{

				// Generate Householder vector.

				for (let k = 0; k < i; k++)
				{
					d[k] /= scale;
					h += d[k] * d[k];
				}
				let f = d[i - 1];
				let g = Math.sqrt(h);
				if (f > 0)
				{
					g = -g;
				}
				e[i] = scale * g;
				h = h - f * g;
				d[i - 1] = f - g;
				for (let j = 0; j < i; j++)
				{
					e[j] = 0.0;
				}

				// Apply similarity transformation to remaining columns.

				for (let j = 0; j < i; j++)
				{
					f = d[j];
					V[j][i] = f;
					g = e[j] + V[j][j] * f;
					for (let k = j + 1; k <= i - 1; k++)
					{
						g += V[k][j] * d[k];
						e[k] += V[k][j] * f;
					}
					e[j] = g;
				}
				f = 0.0;
				for (let j = 0; j < i; j++)
				{
					e[j] /= h;
					f += e[j] * d[j];
				}
				let hh = f / (h + h);
				for (let j = 0; j < i; j++)
				{
					e[j] -= hh * d[j];
				}
				for (let j = 0; j < i; j++)
				{
					f = d[j];
					g = e[j];
					for (let k = j; k <= i - 1; k++)
					{
						V[k][j] -= (f * e[k] + g * d[k]);
					}
					d[j] = V[i - 1][j];
					V[i][j] = 0.0;
				}
			}
			d[i] = h;
		}

		// Accumulate transformations.

		for (let i = 0; i < n - 1; i++)
		{
			V[n - 1][i] = V[i][i];
			V[i][i] = 1.0;
			let h = d[i + 1];
			if (h != 0.0)
			{
				for (let k = 0; k <= i; k++)
				{
					d[k] = V[k][i + 1] / h;
				}
				for (let j = 0; j <= i; j++)
				{
					let g = 0.0;
					for (let k = 0; k <= i; k++)
					{
						g += V[k][i + 1] * V[k][j];
					}
					for (let k = 0; k <= i; k++)
					{
						V[k][j] -= g * d[k];
					}
				}
			}
			for (let k = 0; k <= i; k++)
			{
				V[k][i + 1] = 0.0;
			}
		}
		for (let j = 0; j < n; j++)
		{
			d[j] = V[n - 1][j];
			V[n - 1][j] = 0.0;
		}
		V[n - 1][n - 1] = 1.0;
		e[0] = 0.0;
	}

	// Symmetric tridiagonal QL algorithm.

	private tql2():void
	{
		const {n, d, e, V} = this;

		//  This is derived from the Algol procedures tql2, by
		//  Bowdler, Martin, Reinsch, and Wilkinson, Handbook for
		//  Auto. Comp., Vol.ii-Linear Algebra, and the corresponding
		//  Fortran subroutine in EISPACK.

		for (let i = 1; i < n; i++)
		{
			e[i - 1] = e[i];
		}
		e[n - 1] = 0.0;

		let f = 0.0;
		let tst1 = 0.0;
		let eps = Math.pow(2.0, -52.0);
		for (let l = 0; l < n; l++)
		{

			// Find small subdiagonal element

			tst1 = Math.max(tst1, Math.abs(d[l]) + Math.abs(e[l]));
			let m = l;
			while (m < n)
			{
				if (Math.abs(e[m]) <= eps * tst1)
				{
					break;
				}
				m++;
			}

			// If m == l, d[l] is an eigenvalue,
			// otherwise, iterate.

			if (m > l)
			{
				let iter = 0;
				do
				{
					iter = iter + 1; // (Could check iteration count here.)

					// Compute implicit shift

					let g = d[l];
					let p = (d[l + 1] - g) / (2.0 * e[l]);
					let r = Math.hypot(p, 1.0);
					if (p < 0)
					{
						r = -r;
					}
					d[l] = e[l] / (p + r);
					d[l + 1] = e[l] * (p + r);
					let dl1 = d[l + 1];
					let h = g - d[l];
					for (let i = l + 2; i < n; i++)
					{
						d[i] -= h;
					}
					f = f + h;

					// Implicit QL transformation.

					p = d[m];
					let c = 1.0;
					let c2 = c;
					let c3 = c;
					let el1 = e[l + 1];
					let s = 0.0;
					let s2 = 0.0;
					for (let i = m - 1; i >= l; i--)
					{
						c3 = c2;
						c2 = c;
						s2 = s;
						g = c * e[i];
						h = c * p;
						r = Math.hypot(p, e[i]);
						e[i + 1] = s * r;
						s = e[i] / r;
						c = p / r;
						p = c * d[i] - s * g;
						d[i + 1] = h + s * (c * g + s * d[i]);

						// Accumulate transformation.

						for (let k = 0; k < n; k++)
						{
							h = V[k][i + 1];
							V[k][i + 1] = s * V[k][i] + c * h;
							V[k][i] = c * V[k][i] - s * h;
						}
					}
					p = -s * s2 * c3 * el1 * e[l] / dl1;
					e[l] = s * p;
					d[l] = c * p;

					// Check for convergence.

				}
				while (Math.abs(e[l]) > eps * tst1);
			}
			d[l] = d[l] + f;
			e[l] = 0.0;
		}

		// Sort eigenvalues and corresponding vectors.

		for (let i = 0; i < n - 1; i++)
		{
			let k = i;
			let p = d[i];
			for (let j = i + 1; j < n; j++)
			{
				if (d[j] < p)
				{
					k = j;
					p = d[j];
				}
			}
			if (k != i)
			{
				d[k] = d[i];
				d[i] = p;
				for (let j = 0; j < n; j++)
				{
					p = V[j][i];
					V[j][i] = V[j][k];
					V[j][k] = p;
				}
			}
		}
	}

	// Nonsymmetric reduction to Hessenberg form.

	private orthes():void
	{
		const {n, V, H, ort} = this;

		//  This is derived from the Algol procedures orthes and ortran,
		//  by Martin and Wilkinson, Handbook for Auto. Comp.,
		//  Vol.ii-Linear Algebra, and the corresponding
		//  Fortran subroutines in EISPACK.

		let low = 0;
		let high = n - 1;

		for (let m = low + 1; m <= high - 1; m++)
		{
			// Scale column.

			let scale = 0.0;
			for (let i = m; i <= high; i++)
			{
				scale = scale + Math.abs(H[i][m - 1]);
			}
			if (scale != 0.0)
			{

				// Compute Householder transformation.

				let h = 0.0;
				for (let i = high; i >= m; i--)
				{
					ort[i] = H[i][m - 1] / scale;
					h += ort[i] * ort[i];
				}
				let g = Math.sqrt(h);
				if (ort[m] > 0)
				{
					g = -g;
				}
				h = h - ort[m] * g;
				ort[m] = ort[m] - g;

				// Apply Householder similarity transformation
				// H = (I-u*u'/h)*H*(I-u*u')/h)

				for (let j = m; j < n; j++)
				{
					let f = 0.0;
					for (let i = high; i >= m; i--)
					{
						f += ort[i] * H[i][j];
					}
					f = f / h;
					for (let i = m; i <= high; i++)
					{
						H[i][j] -= f * ort[i];
					}
				}

				for (let i = 0; i <= high; i++)
				{
					let f = 0.0;
					for (let j = high; j >= m; j--)
					{
						f += ort[j] * H[i][j];
					}
					f = f / h;
					for (let j = m; j <= high; j++)
					{
						H[i][j] -= f * ort[j];
					}
				}
				ort[m] = scale * ort[m];
				H[m][m - 1] = scale * g;
			}
		}

		// Accumulate transformations (Algol's ortran).

		for (let i = 0; i < n; i++)
		{
			for (let j = 0; j < n; j++)
			{
				V[i][j] = (i == j ? 1.0 : 0.0);
			}
		}

		for (let m = high - 1; m >= low + 1; m--)
		{
			if (H[m][m - 1] != 0.0)
			{
				for (let i = m + 1; i <= high; i++)
				{
					ort[i] = H[i][m - 1];
				}
				for (let j = m; j <= high; j++)
				{
					let g = 0.0;
					for (let i = m; i <= high; i++)
					{
						g += ort[i] * V[i][j];
					}
					// Double division avoids possible underflow
					g = (g / ort[m]) / H[m][m - 1];
					for (let i = m; i <= high; i++)
					{
						V[i][j] += g * ort[i];
					}
				}
			}
		}
	}

	// Complex scalar division.

	private cdiv(xr:number, xi:number, yr:number, yi:number):[number, number]
	{
		let r, d;
		if (Math.abs(yr) > Math.abs(yi))
		{
			r = yi / yr;
			d = yr + r * yi;
			return [(xr + r * xi) / d, (xi - r * xr) / d];
		}
		else
		{
			r = yr / yi;
			d = yi + r * yr;
			return [(r * xr + xi) / d, (r * xi - xr) / d];
		}
	}

	// Nonsymmetric reduction from Hessenberg to real Schur form.

	private hqr2():void
	{
		const {d, e, V, H} = this;

		//  This is derived from the Algol procedure hqr2,
		//  by Martin and Wilkinson, Handbook for Auto. Comp.,
		//  Vol.ii-Linear Algebra, and the corresponding
		//  Fortran subroutine in EISPACK.

		// Initialize

		let nn = this.n;
		let n = nn - 1;
		let low = 0;
		let high = nn - 1;
		let eps = Math.pow(2.0, -52.0);
		let exshift = 0.0;
		let p = 0, q = 0, r = 0, s = 0, z = 0, t, w, x, y;

		// Store roots isolated by balanc and compute matrix norm

		let norm = 0.0;
		for (let i = 0; i < nn; i++)
		{
			if (i < low || i > high)
			{
				d[i] = H[i][i];
				e[i] = 0.0;
			}
			for (let j = Math.max(i - 1, 0); j < nn; j++)
			{
				norm = norm + Math.abs(H[i][j]);
			}
		}

		// Outer loop over eigenvalue index

		let iter = 0;
		while (n >= low)
		{

			// Look for single small sub-diagonal element

			let l = n;
			while (l > low)
			{
				s = Math.abs(H[l - 1][l - 1]) + Math.abs(H[l][l]);
				if (s == 0.0)
				{
					s = norm;
				}
				if (Math.abs(H[l][l - 1]) < eps * s)
				{
					break;
				}
				l--;
			}

			// Check for convergence
			// One root found

			if (l == n)
			{
				H[n][n] = H[n][n] + exshift;
				d[n] = H[n][n];
				e[n] = 0.0;
				n--;
				iter = 0;

				// Two roots found

			}
			else if (l == n - 1)
			{
				w = H[n][n - 1] * H[n - 1][n];
				p = (H[n - 1][n - 1] - H[n][n]) / 2.0;
				q = p * p + w;
				z = Math.sqrt(Math.abs(q));
				H[n][n] = H[n][n] + exshift;
				H[n - 1][n - 1] = H[n - 1][n - 1] + exshift;
				x = H[n][n];

				// Real pair

				if (q >= 0)
				{
					if (p >= 0)
					{
						z = p + z;
					}
					else
					{
						z = p - z;
					}
					d[n - 1] = x + z;
					d[n] = d[n - 1];
					if (z != 0.0)
					{
						d[n] = x - w / z;
					}
					e[n - 1] = 0.0;
					e[n] = 0.0;
					x = H[n][n - 1];
					s = Math.abs(x) + Math.abs(z);
					p = x / s;
					q = z / s;
					r = Math.sqrt(p * p + q * q);
					p = p / r;
					q = q / r;

					// Row modification

					for (let j = n - 1; j < nn; j++)
					{
						z = H[n - 1][j];
						H[n - 1][j] = q * z + p * H[n][j];
						H[n][j] = q * H[n][j] - p * z;
					}

					// Column modification

					for (let i = 0; i <= n; i++)
					{
						z = H[i][n - 1];
						H[i][n - 1] = q * z + p * H[i][n];
						H[i][n] = q * H[i][n] - p * z;
					}

					// Accumulate transformations

					for (let i = low; i <= high; i++)
					{
						z = V[i][n - 1];
						V[i][n - 1] = q * z + p * V[i][n];
						V[i][n] = q * V[i][n] - p * z;
					}

					// Complex pair

				}
				else
				{
					d[n - 1] = x + p;
					d[n] = x + p;
					e[n - 1] = z;
					e[n] = -z;
				}
				n = n - 2;
				iter = 0;

				// No convergence yet

			}
			else
			{

				// Form shift

				x = H[n][n];
				y = 0.0;
				w = 0.0;
				if (l < n)
				{
					y = H[n - 1][n - 1];
					w = H[n][n - 1] * H[n - 1][n];
				}

				// Wilkinson's original ad hoc shift

				if (iter == 10)
				{
					exshift += x;
					for (let i = low; i <= n; i++)
					{
						H[i][i] -= x;
					}
					s = Math.abs(H[n][n - 1]) + Math.abs(H[n - 1][n - 2]);
					x = y = 0.75 * s;
					w = -0.4375 * s * s;
				}

				// MATLAB's new ad hoc shift

				if (iter == 30)
				{
					s = (y - x) / 2.0;
					s = s * s + w;
					if (s > 0)
					{
						s = Math.sqrt(s);
						if (y < x)
						{
							s = -s;
						}
						s = x - w / ((y - x) / 2.0 + s);
						for (let i = low; i <= n; i++)
						{
							H[i][i] -= s;
						}
						exshift += s;
						x = y = w = 0.964;
					}
				}

				iter = iter + 1; // (Could check iteration count here.)

				// Look for two consecutive small sub-diagonal elements

				let m = n - 2;
				while (m >= l)
				{
					z = H[m][m];
					r = x - z;
					s = y - z;
					p = (r * s - w) / H[m + 1][m] + H[m][m + 1];
					q = H[m + 1][m + 1] - z - r - s;
					r = H[m + 2][m + 1];
					s = Math.abs(p) + Math.abs(q) + Math.abs(r);
					p = p / s;
					q = q / s;
					r = r / s;
					if (m == l)
					{
						break;
					}
					if (Math.abs(H[m][m - 1]) * (Math.abs(q) + Math.abs(r)) < eps
									* (Math.abs(p) * (Math.abs(H[m - 1][m - 1]) + Math.abs(z) + Math.abs(H[m + 1][m + 1]))))
					{
						break;
					}
					m--;
				}

				for (let i = m + 2; i <= n; i++)
				{
					H[i][i - 2] = 0.0;
					if (i > m + 2)
					{
						H[i][i - 3] = 0.0;
					}
				}

				// Double QR step involving rows l:n and columns m:n

				for (let k = m; k <= n - 1; k++)
				{
					let notlast = (k != n - 1);
					if (k != m)
					{
						p = H[k][k - 1];
						q = H[k + 1][k - 1];
						r = (notlast ? H[k + 2][k - 1] : 0.0);
						x = Math.abs(p) + Math.abs(q) + Math.abs(r);
						if (x == 0.0)
						{
							continue;
						}
						p = p / x;
						q = q / x;
						r = r / x;
					}

					s = Math.sqrt(p * p + q * q + r * r);
					if (p < 0)
					{
						s = -s;
					}
					if (s != 0)
					{
						if (k != m)
						{
							H[k][k - 1] = -s * x;
						}
						else if (l != m)
						{
							H[k][k - 1] = -H[k][k - 1];
						}
						p = p + s;
						x = p / s;
						y = q / s;
						z = r / s;
						q = q / p;
						r = r / p;

						// Row modification

						for (let j = k; j < nn; j++)
						{
							p = H[k][j] + q * H[k + 1][j];
							if (notlast)
							{
								p = p + r * H[k + 2][j];
								H[k + 2][j] = H[k + 2][j] - p * z;
							}
							H[k][j] = H[k][j] - p * x;
							H[k + 1][j] = H[k + 1][j] - p * y;
						}

						// Column modification

						for (let i = 0; i <= Math.min(n, k + 3); i++)
						{
							p = x * H[i][k] + y * H[i][k + 1];
							if (notlast)
							{
								p = p + z * H[i][k + 2];
								H[i][k + 2] = H[i][k + 2] - p * r;
							}
							H[i][k] = H[i][k] - p;
							H[i][k + 1] = H[i][k + 1] - p * q;
						}

						// Accumulate transformations

						for (let i = low; i <= high; i++)
						{
							p = x * V[i][k] + y * V[i][k + 1];
							if (notlast)
							{
								p = p + z * V[i][k + 2];
								V[i][k + 2] = V[i][k + 2] - p * r;
							}
							V[i][k] = V[i][k] - p;
							V[i][k + 1] = V[i][k + 1] - p * q;
						}
					} // (s != 0)
				} // k loop
			} // check convergence
		} // while (n >= low)

		// Backsubstitute to find vectors of upper triangular form

		if (norm == 0.0)
		{
			return;
		}

		for (n = nn - 1; n >= 0; n--)
		{
			p = d[n];
			q = e[n];

			// Real vector

			if (q == 0)
			{
				let l = n;
				H[n][n] = 1.0;
				for (let i = n - 1; i >= 0; i--)
				{
					w = H[i][i] - p;
					r = 0.0;
					for (let j = l; j <= n; j++)
					{
						r = r + H[i][j] * H[j][n];
					}
					if (e[i] < 0.0)
					{
						z = w;
						s = r;
					}
					else
					{
						l = i;
						if (e[i] == 0.0)
						{
							if (w != 0.0)
							{
								H[i][n] = -r / w;
							}
							else
							{
								H[i][n] = -r / (eps * norm);
							}

							// Solve real equations

						}
						else
						{
							x = H[i][i + 1];
							y = H[i + 1][i];
							q = (d[i] - p) * (d[i] - p) + e[i] * e[i];
							t = (x * s - z * r) / q;
							H[i][n] = t;
							if (Math.abs(x) > Math.abs(z))
							{
								H[i + 1][n] = (-r - w * t) / x;
							}
							else
							{
								H[i + 1][n] = (-s - y * t) / z;
							}
						}

						// Overflow control

						t = Math.abs(H[i][n]);
						if ((eps * t) * t > 1)
						{
							for (let j = i; j <= n; j++)
							{
								H[j][n] = H[j][n] / t;
							}
						}
					}
				}

				// Complex vector

			}
			else if (q < 0)
			{
				let l = n - 1;

				// Last vector component imaginary so matrix is triangular

				if (Math.abs(H[n][n - 1]) > Math.abs(H[n - 1][n]))
				{
					H[n - 1][n - 1] = q / H[n][n - 1];
					H[n - 1][n] = -(H[n][n] - p) / H[n][n - 1];
				}
				else
				{
					let ri = this.cdiv(0.0, -H[n - 1][n], H[n - 1][n - 1] - p, q);
					H[n - 1][n - 1] = ri[0];
					H[n - 1][n] = ri[1];
				}
				H[n][n - 1] = 0.0;
				H[n][n] = 1.0;
				for (let i = n - 2; i >= 0; i--)
				{
					let ra, sa, vr, vi;
					ra = 0.0;
					sa = 0.0;
					for (let j = l; j <= n; j++)
					{
						ra = ra + H[i][j] * H[j][n - 1];
						sa = sa + H[i][j] * H[j][n];
					}
					w = H[i][i] - p;

					if (e[i] < 0.0)
					{
						z = w;
						r = ra;
						s = sa;
					}
					else
					{
						l = i;
						if (e[i] == 0)
						{
							let ri = this.cdiv(-ra, -sa, w, q);
							H[i][n - 1] = ri[0];
							H[i][n] = ri[1];
						}
						else
						{

							// Solve complex equations

							x = H[i][i + 1];
							y = H[i + 1][i];
							vr = (d[i] - p) * (d[i] - p) + e[i] * e[i] - q * q;
							vi = (d[i] - p) * 2.0 * q;
							if (vr == 0.0 && vi == 0.0)
							{
								vr = eps * norm * (Math.abs(w) + Math.abs(q) + Math.abs(x) + Math.abs(y) + Math.abs(z));
							}
							let ri = this.cdiv(x * r - z * ra + q * sa, x * s - z * sa - q * ra, vr, vi);
							H[i][n - 1] = ri[0];
							H[i][n] = ri[1];
							if (Math.abs(x) > (Math.abs(z) + Math.abs(q)))
							{
								H[i + 1][n - 1] = (-ra - w * H[i][n - 1] + q * H[i][n]) / x;
								H[i + 1][n] = (-sa - w * H[i][n] - q * H[i][n - 1]) / x;
							}
							else
							{
								let ri = this.cdiv(-r - y * H[i][n - 1], -s - y * H[i][n], z, q);
								H[i + 1][n - 1] = ri[0];
								H[i + 1][n] = ri[1];
							}
						}

						// Overflow control

						t = Math.max(Math.abs(H[i][n - 1]), Math.abs(H[i][n]));
						if ((eps * t) * t > 1)
						{
							for (let j = i; j <= n; j++)
							{
								H[j][n - 1] = H[j][n - 1] / t;
								H[j][n] = H[j][n] / t;
							}
						}
					}
				}
			}
		}

		// Vectors of isolated roots

		for (let i = 0; i < nn; i++)
		{
			if (i < low || i > high)
			{
				for (let j = i; j < nn; j++)
				{
					V[i][j] = H[i][j];
				}
			}
		}

		// Back transformation to get eigenvectors of original matrix

		for (let j = nn - 1; j >= low; j--)
		{
			for (let i = low; i <= high; i++)
			{
				z = 0.0;
				for (let k = low; k <= Math.min(j, high); k++)
				{
					z = z + V[i][k] * H[k][j];
				}
				V[i][j] = z;
			}
		}
	}

	// obtain eigenvectors
	public getV():Matrix
	{
		return Matrix.fromArray(this.V);
	}
	public getVArray():number[][]
	{
		return this.V;
	}

	// eigenvalues, both parts
	public getRealEigenvalues():number[]
	{
		return this.d;
	}
	public getImagEigenvalues():number[]
	{
		return this.e;
	}

	// block diagonal eigenvalue matrix
	public getD():Matrix
	{
		const {n, d, e} = this;
		let X = new Matrix(n, n);
		let D = X.A;
		for (let i = 0; i < n; i++)
		{
			for (let j = 0; j < n; j++)
			{
				D[i][j] = 0.0;
			}
			D[i][i] = d[i];
			if (e[i] > 0)
			{
				D[i][i + 1] = e[i];
			}
			else if (e[i] < 0)
			{
				D[i][i - 1] = e[i];
			}
		}
		return X;
	}
}
