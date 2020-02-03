/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

/* eslint-disable comma-spacing, no-multi-spaces */

namespace WebMolKit /* BOF */ {

export class Chemistry
{
	// NOTE: the value of ELEMENTS.length is the number of elements supported by MMTk; all atom number indices should be between
	// 1 and this range, or 0 to represent an entity which is not a single specific element

	public static ELEMENTS =
	[
		null,
		'H',                                                                                 'He',
		'Li','Be',                                                  'B', 'C', 'N', 'O', 'F', 'Ne',
		'Na','Mg',                                                  'Al','Si','P', 'S', 'Cl','Ar',
		'K', 'Ca','Sc','Ti','V' ,'Cr','Mn','Fe','Co','Ni','Cu','Zn','Ga','Ge','As','Se','Br','Kr',
		'Rb','Sr','Y', 'Zr','Nb','Mo','Tc','Ru','Rh','Pd','Ag','Cd','In','Sn','Sb','Te','I', 'Xe',
		'Cs','Ba',
				'La','Ce','Pr','Nd','Pm','Sm','Eu','Gd','Tb','Dy','Ho','Er','Tm','Yb',
					 'Lu','Hf','Ta','W', 'Re','Os','Ir','Pt','Au','Hg','Tl','Pb','Bi','Po','At','Rn',
		'Fr','Ra',
				'Ac','Th','Pa','U', 'Np','Pu','Am','Cm','Bk','Cf','Es','Fm','Md','No',
					 'Lr','Rf','Db','Sg','Bh','Hs','Mt','Ds','Rg','Cn'
	];

	// which group of the periodic table each element belongs to, where the lanthanoids & actanoids are group III
	public static ELEMENT_GROUPS =
	[
		0,
		1,                                        18,
		1,2,                       13,14,15,16,17,18,
		1,2,                       13,14,15,16,17,18,
		1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,
		1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,
		1,2,
						3,3,3,3,3,3,3,3,3,3,3,3,3,3,
			3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,
		1,2,
						3,3,3,3,3,3,3,3,3,3,3,3,3,3,
			3,4,5,6,7,8,9,10,11,12
	];

	// which row of the periodic table each element belongs to, where lanthanoids & actanoids take their parent row
	public static ELEMENT_ROWS =
	[
		0,
		1,                                1,
		2,2,                    2,2,2,2,2,2,
		3,3,                    3,3,3,3,3,3,
		4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,
		5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
		6,6,
						6,6,6,6,6,6,6,6,6,6,6,6,6,6,
			6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
		7,7,
						7,7,7,7,7,7,7,7,7,7,7,7,7,7,
			7,7,7,7,7,7,7,7,7,7
	];

	// which block of the periodic table each element belongs to, where 1=s-block, 2=p-block, 3=d-block, 4=f-block
	public static ELEMENT_BLOCKS =
	[
		0,
		1,                                2,
		1,1,                    2,2,2,2,2,2,
		1,1,                    2,2,2,2,2,2,
		1,1,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,
		1,1,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,
		1,1,
						4,4,4,4,4,4,4,4,4,4,4,4,4,4,
			3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,
		1,1,
						4,4,4,4,4,4,4,4,4,4,4,4,4,4,
			3,3,3,3,3,3,3,3,3,3
	];

	// the number of 'valence' electrons possessed by an individual uncharged atom
	public static ELEMENT_VALENCE =
	[
		0,
		1,                                   2,
		1,2,                       3,4,5,6,7,8,
		1,2,                       3,4,5,6,7,8,
		1,2,3,4,5,6,7,8,9,10,11,12,3,4,5,6,7,8,
		1,2,3,4,5,6,7,8,9,10,11,12,3,4,5,6,7,8,
		1,2,
						4,4,4,4,4,4,4,4,4,4,4,4,4,4,
			3,4,5,6,7,8,9,10,11,12,3,4,5,6,7,8,
		1,1,
						4,4,4,4,4,4,4,4,4,4,4,4,4,4,
			3,4,5,6,7,8,9,10,11,12
	];

	// the number of valence electrons typically involved in bonding, i.e. ELEMENT_VALENCE minus
	// the electrons dedicated to lone pairs; the concept is only really valid for main blocks
	public static ELEMENT_BONDING =
	[
		0,
		1,                                   0,
		1,2,                       3,4,3,2,1,0,
		1,2,                       3,4,3,2,1,0,
		1,2,3,4,5,6,7,8,9,10,11,12,3,4,3,2,1,0,
		1,2,3,4,5,6,7,8,9,10,11,12,3,4,3,2,1,0,
		1,2,
						4,4,4,4,4,4,4,4,4,4,4,4,4,4,
			3,4,5,6,7,8,9,10,11,12,3,4,3,2,1,0,
		1,1,
						4,4,4,4,4,4,4,4,4,4,4,4,4,4,
			3,4,5,6,7,8,9,10,11,12
	];

	// the total number of 'valence' electrons required to make up a full 'valence shell'
	public static ELEMENT_SHELL =
	[
		0,
		2,                                          2,
		8,8,                              8,8,8,8,8,8,
		8,8,                              8,8,8,8,8,8,
		8,8,18,18,18,18,18,18,18,18,18,18,8,8,8,8,8,8,
		8,8,18,18,18,18,18,18,18,18,18,18,8,8,8,8,8,8,
		8,8,
						18,18,18,18,18,18,18,18,18,18,18,18,18,18,
			18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,
		8,8,
						18,18,18,18,18,18,18,18,18,18,18,18,18,18,
			18,18,18,18,18,18,18,18,18,18
	];

	public static NATURAL_ATOMIC_WEIGHTS =
	[
		0,1.00794,4.002602,6.941,9.012182,10.811,12.0107,14.0067,15.9994,18.9984032,20.1797,
		22.989770,24.3050,26.981538,28.0855,30.973761,32.065,35.453,39.948,39.0983,40.078,
		44.955910,47.867,50.9415,51.9961,54.938049,55.845,58.933200,58.6934,63.546,65.409,
		69.723,72.64,74.92160,78.96,79.904,83.798,85.4678,87.62,88.90585,91.224,92.90638,
		95.94,98,101.07,102.90550,106.42,107.8682,112.411,114.818,118.710,121.760,127.60,
		126.90447,131.293,132.90545,137.327,138.9055,140.116,140.90765,144.24,145,150.36,
		151.964,157.25,158.92534,162.500,164.93032,167.259,168.93421,173.04,174.967,178.49,
		180.9479,183.84,186.207,190.23,192.217,195.078,196.96655,200.59,204.3833,207.2,208.98038,
		209,210,222,223,226,227,230.0331266,231.03588,233.039628,237,244,243,247,247,251,252,257,
		258,259,262,261,262,266,264,277,268,271,272,285
	];

	// readable constants for elements
	public static ELEMENT_H = 1;
	public static ELEMENT_He = 2;
	public static ELEMENT_Li = 3;
	public static ELEMENT_Be = 4;
	public static ELEMENT_B = 5;
	public static ELEMENT_C = 6;
	public static ELEMENT_N = 7;
	public static ELEMENT_O = 8;
	public static ELEMENT_F = 9;
	public static ELEMENT_Ne = 10;
	public static ELEMENT_Na = 11;
	public static ELEMENT_Mg = 12;
	public static ELEMENT_Al = 13;
	public static ELEMENT_Si = 14;
	public static ELEMENT_P = 15;
	public static ELEMENT_S = 16;
	public static ELEMENT_Cl = 17;
	public static ELEMENT_Ar = 18;
	public static ELEMENT_K = 19;
	public static ELEMENT_Ca = 20;
	public static ELEMENT_Sc = 21;
	public static ELEMENT_Ti = 22;
	public static ELEMENT_V = 23;
	public static ELEMENT_Cr = 24;
	public static ELEMENT_Mn = 25;
	public static ELEMENT_Fe = 26;
	public static ELEMENT_Co = 27;
	public static ELEMENT_Ni = 28;
	public static ELEMENT_Cu = 29;
	public static ELEMENT_Zn = 30;
	public static ELEMENT_Ga = 31;
	public static ELEMENT_Ge = 32;
	public static ELEMENT_As = 33;
	public static ELEMENT_Se = 34;
	public static ELEMENT_Br = 35;
	public static ELEMENT_Kr = 36;
	public static ELEMENT_Rb = 37;
	public static ELEMENT_Sr = 38;
	public static ELEMENT_Y = 39;
	public static ELEMENT_Zr = 40;
	public static ELEMENT_Nb = 41;
	public static ELEMENT_Mo = 42;
	public static ELEMENT_Tc = 43;
	public static ELEMENT_Ru = 44;
	public static ELEMENT_Rh = 45;
	public static ELEMENT_Pd = 46;
	public static ELEMENT_Ag = 47;
	public static ELEMENT_Cd = 48;
	public static ELEMENT_In = 49;
	public static ELEMENT_Sn = 50;
	public static ELEMENT_Sb = 51;
	public static ELEMENT_Te = 52;
	public static ELEMENT_I = 53;
	public static ELEMENT_Xe = 54;
	public static ELEMENT_Cs = 55;
	public static ELEMENT_Ba = 56;
	public static ELEMENT_La = 57;
	public static ELEMENT_Ce = 58;
	public static ELEMENT_Pr = 59;
	public static ELEMENT_Nd = 60;
	public static ELEMENT_Pm = 61;
	public static ELEMENT_Sm = 62;
	public static ELEMENT_Eu = 63;
	public static ELEMENT_Gd = 64;
	public static ELEMENT_Tb = 65;
	public static ELEMENT_Dy = 66;
	public static ELEMENT_Ho = 67;
	public static ELEMENT_Er = 68;
	public static ELEMENT_Tm = 69;
	public static ELEMENT_Yb = 70;
	public static ELEMENT_Lu = 71;
	public static ELEMENT_Hf = 72;
	public static ELEMENT_Ta = 73;
	public static ELEMENT_W = 74;
	public static ELEMENT_Re = 75;
	public static ELEMENT_Os = 76;
	public static ELEMENT_Ir = 77;
	public static ELEMENT_Pt = 78;
	public static ELEMENT_Au = 79;
	public static ELEMENT_Hg = 80;
	public static ELEMENT_Tl = 81;
	public static ELEMENT_Pb = 82;
	public static ELEMENT_Bi = 83;
	public static ELEMENT_Po = 84;
	public static ELEMENT_At = 85;
	public static ELEMENT_Rn = 86;
	public static ELEMENT_Fr = 87;
	public static ELEMENT_Ra = 88;
	public static ELEMENT_Ac = 89;
	public static ELEMENT_Th = 90;
	public static ELEMENT_Pa = 91;
	public static ELEMENT_U = 92;
	public static ELEMENT_Np = 93;
	public static ELEMENT_Pu = 94;
	public static ELEMENT_Am = 95;
	public static ELEMENT_Cm = 96;
	public static ELEMENT_Bk = 97;
	public static ELEMENT_Cf = 98;
	public static ELEMENT_Es = 99;
	public static ELEMENT_Fm = 100;
	public static ELEMENT_Md = 101;
	public static ELEMENT_No = 102;
	public static ELEMENT_Lr = 103;
	public static ELEMENT_Rf = 104;
	public static ELEMENT_Db = 105;
	public static ELEMENT_Sg = 106;
	public static ELEMENT_Bh = 107;
	public static ELEMENT_Hs = 108;
	public static ELEMENT_Mt = 109;
	public static ELEMENT_Ds = 110;
	public static ELEMENT_Rg = 111;
	public static ELEMENT_Cn = 112;
}

/* EOF */ }