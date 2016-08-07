/*
    MolSync

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=molsync]
*/

/*
	Geometry utilities, which are typically graphics related.
*/

class Geom
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
}
