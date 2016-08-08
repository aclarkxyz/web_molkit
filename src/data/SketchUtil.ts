/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='Molecule.ts'/>
///<reference path='CoordUtil.ts'/>
///<reference path='../util/util.ts'/>

/*
	SketchUtil: static methods for calculating properties of molecules, typically of the geometric variety.
*/

class SketchUtil
{
    /*public static allViableDirections(mol:Molecule, atom:number, order:number):number[]
    {
    }*/
    
    // simple new rings grafted onto existing components, or not
    public static proposeNewRing(mol:Molecule, rsz:number, x:number, y:number, dx:number, dy:number, snap:boolean):[number[], number[]]
    {
		let theta = Math.atan2(dy, dx)
		if (snap)
		{
            const chunk = 30 * DEGRAD;
			theta = Math.round(theta / chunk) * chunk;
		}
		return SketchUtil.positionSimpleRing(mol, rsz, x, y, theta)
    }
    public static proposeAtomRing(mol:Molecule, rsz:number, atom:number, dx:number, dy:number):[number[], number[]]
    {
		/*
		var thsnap:number[] = SketchUtil.allViableDirections(mol, atom, 1);
		if (mol.atomAdjCount(atom) == 1)
		{
			let nbr = mol.atomAdjList(atom)[0];
			let theta = Math.atan2(mol.atomY(nbr) - mol.atomY(atom), mol.atomX(nbr) - mol.atomX(atom));
			thsnap.push(theta);
			thsnap = uniqueAngles(thsnap, 2.0 * DEGRAD);
		}
		// (tempting to have it snap to sidebonds, but the correct way to do that is to drag from the bond rather than the atom)
        */
        
        let thsnap:number[] = [];
        let cx = mol.atomX(atom), cy = mol.atomY(atom);
        if (mol.atomAdjCount(atom) == 0)
        {
            for (let n = 0; n < 12; n++) thsnap.push(TWOPI * n / 12);
        }
        else if (mol.atomAdjCount(atom) == 1)
        {
            let nbr = mol.atomAdjList(atom)[0];
            thsnap.push(angleNorm(Math.atan2(mol.atomY(nbr) - cy, mol.atomX(nbr) - cx) + Math.PI));
        }
        else
        {
            let angs:number[] = [];
            for (let nbr of mol.atomAdjList(atom)) angs.push(Math.atan2(mol.atomY(nbr) - cy, mol.atomX(nbr) - cx));
            angs = sortAngles(angs);
            for (let n = 0; n < angs.length; n++)
            {
                let th1 = angs[n], th2 = angs[n < angs.length - 1 ? n + 1 : 0];
                thsnap.push(th1 + 0.5 * angleDiffPos(th2, th1));
            } 
        }

        let theta = Math.atan2(dy, dx);
		var bestTheta = 0, bestDelta = Number.MAX_VALUE
		for (let th of thsnap)
		{
			let delta = Math.abs(angleDiff(th, theta));
			if (delta < bestDelta) {bestTheta = th; bestDelta = delta;}
		}
        
		return SketchUtil.positionSimpleRing(mol, rsz, mol.atomX(atom), mol.atomY(atom), bestTheta);
    }
    public static proposeBondRing(mol:Molecule, rsz:number, bond:number, dx:number, dy:number):[number[], number[]]
    { 
        let bfr = mol.bondFrom(bond), bto = mol.bondTo(bond);
		let bx = mol.atomX(bto) - mol.atomX(bfr), by = mol.atomY(bto) - mol.atomY(bfr);
		let sign = dx * by - dy * bx;
		
		let delta = sign > 0 ? -90 * DEGRAD : 90 * DEGRAD;
		let theta = Math.atan2(by, bx) + delta;
		
		let dth = TWOPI / rsz;
		let rad = Molecule.IDEALBOND / (2.0 * Math.sin(0.5 * dth)), brad = rad * Math.cos(0.5 * dth);
		let cx = 0.5 * (mol.atomX(bfr) + mol.atomX(bto)) + brad * Math.cos(theta);
		let cy = 0.5 * (mol.atomY(bfr) + mol.atomY(bto)) + brad * Math.sin(theta);
		
		let rx:number[] = [], ry:number[] = [];
        for (let n = 0; n < rsz; n++)
		{
			let th = theta - Math.PI + (n - 0.5) * dth;
			rx.push(cx + Math.cos(th) * rad);
			ry.push(cy + Math.sin(th) * rad);
		}
		
		let [i1, i2] = sign < 0 ? [bfr, bto] : [bto, bfr];
		rx[0] = mol.atomX(i1);
		ry[0] = mol.atomY(i1);
		rx[1] = mol.atomX(i2);
		ry[1] = mol.atomY(i2);
		
		return [rx, ry];
	}

	// simple ring attachments, to an atom/bond/point, with a guide vector to collapse the options for direction; returns arrays for X and Y 
	// points for the ring that ought to be created from these parameters; note
	public static positionSimpleRing(mol:Molecule, rsz:number, x:number, y:number, theta:number):[number[], number[]]
	{
        let dth = TWOPI / rsz;
        let rad = Molecule.IDEALBOND / (2 * Math.sin(0.5 * dth));
		let cx = x + rad * Math.cos(theta), cy = y + rad * Math.sin(theta);
		
        let rx:number[] = [], ry:number[] = [];
        for (let n = 0; n < rsz; n++)
		{
            let th = theta - Math.PI + n * dth;
            rx.push(cx + Math.cos(th) * rad);
			ry.push(cy + Math.sin(th) * rad);
		}
		
		return [rx, ry];
	}
}
