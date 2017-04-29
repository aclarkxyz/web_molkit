/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../data/Molecule.ts'/>
///<reference path='../gfx/MetaVector.ts'/>
///<reference path='../gfx/ArrangeMolecule.ts'/>
///<reference path='../gfx/DrawMolecule.ts'/>
///<reference path='../calc/CircularFingerprints.ts'/>
///<reference path='Widget.ts'/>

/*
	Honeycomb view: a heavyweight interactive widget that starts with a reference molecule at the centre and then builds up a hexagon
	grid around it, based on structural similarity. This is a useful way to examine the structure-activity landscape.
*/

interface HoneycombMolecule
{
	mol:Molecule;
	isReference:boolean; // true if this is from the user's provided reference set
	isActive:boolean; // true if this is from the model dataset and is active
	fp?:number[]; // ECFP6 fingerprints

}

class HoneycombHex
{
	public molidx:number; // index into the original molecule list
	public mol:Molecule;
	public fp:number[];
	public background = 0xFFFFFF;
	public withRim = false; // if true, molecule will be inset, and rimCols (below) used to annotate the edges
	public rimCols = [-1, -1, -1, -1, -1, -1];
	public isBold = false; // if true, outline will be emboldened
	public policy:RenderPolicy = null; // only provide if not default
	public annotation:string = null; // optional annotation to display in hex
	public annotCol = 0x000000; // colour of ditto
	public annotFontSize = 10; // maximum font size: will be shrink if necessary

	//    N    		positions: these assume that hexagons are aligned to the y-axis,
	// NW   NE      i.e. travelling left & right is addition/subtraction of the x-value,
	//   [*]   	    whereas going up or down can only be done as NW/NE and SW/SE, respectively;
	// SW   SE		hence must use a special function to make sure that the migrations
	//    S    		refer to the correct positions...
	public x:number = null;
	public y:number = null;

	// rendering state
	public centre:Pos;
	public hexSize:number;
	public lineSize:number;
	public innerRad:number;
	public outerRad:number;
	public edgeLen:number;
	public frame:Box;
	public span:JQuery;
}

class Honeycomb extends Widget
{
	public size:Size = new Size(500, 500); // boundary of the widget
	public maxHexes = 1000; // if # molecules exceeds this number, go with the most similar
	public molecules:HoneycombMolecule[] = [];
	public stopped = false;

	private hexes:HoneycombHex[] = [];
	private seed = 0; // starting hex; defaults to first
	private density = 0.01; // the "density fudge": higher values favour more squished up clusters

	private hexSize = 100; // baseline scale

	// all of the "flower" permutations that are nondegenerate from circular rotation/inversion; favours those with lowest numbers first
	private FLOWER_PERMS =
	[
        [0,1,2,3,4,5], [0,1,2,3,5,4], [0,1,2,4,3,5], [0,1,2,4,5,3], [0,1,2,5,3,4], [0,1,2,5,4,3], [0,1,3,2,4,5], [0,1,3,2,5,4], [0,1,3,4,2,5], [0,1,3,4,5,2],
        [0,1,3,5,2,4], [0,1,3,5,4,2], [0,1,4,2,3,5], [0,1,4,2,5,3], [0,1,4,3,2,5], [0,1,4,3,5,2], [0,1,4,5,2,3], [0,1,4,5,3,2], [0,1,5,2,3,4], [0,1,5,2,4,3],
        [0,1,5,3,2,4], [0,1,5,3,4,2], [0,1,5,4,2,3], [0,1,5,4,3,2], [0,2,1,3,4,5], [0,2,1,3,5,4], [0,2,1,4,3,5], [0,2,1,4,5,3], [0,2,1,5,3,4], [0,2,1,5,4,3],
        [0,2,3,1,4,5], [0,2,3,1,5,4], [0,2,3,4,1,5], [0,2,3,5,1,4], [0,2,4,1,3,5], [0,2,4,1,5,3], [0,2,4,3,1,5], [0,2,4,5,1,3], [0,2,5,1,3,4], [0,2,5,1,4,3],
        [0,2,5,3,1,4], [0,2,5,4,1,3], [0,3,1,2,4,5], [0,3,1,2,5,4], [0,3,1,4,2,5], [0,3,1,5,2,4], [0,3,2,1,4,5], [0,3,2,1,5,4], [0,3,2,4,1,5], [0,3,2,5,1,4],
        [0,3,4,1,2,5], [0,3,4,2,1,5], [0,3,5,1,2,4], [0,3,5,2,1,4], [0,4,1,2,3,5], [0,4,1,3,2,5], [0,4,2,1,3,5], [0,4,2,3,1,5], [0,4,3,1,2,5], [0,4,3,2,1,5]
	];
	
	// hex offsets
	private HEX_N = 0;
	private HEX_S = 1;
	private HEX_NW = 2;
	private HEX_NE = 3;
	private HEX_SW = 4;
	private HEX_SE = 5;

	// ------------ public methods ------------

	constructor()
	{
		super();
	}

	// stacking the deck; note that reference molecules should be added first, and the first one is special
	public addReferenceMolecule(mol:Molecule):void
	{
		this.molecules.push({'mol': mol, 'isReference': true, 'isActive': null});
	}
	public addModelMolecule(mol:Molecule, isActive:boolean):void
	{
		this.molecules.push({'mol': mol, 'isReference': false, 'isActive': isActive});
	}

	// creates the basic outline: does not yet include any of the interesting content
	public render(parent:any):void
	{
		super.render(parent);
		
		this.content.css('width', this.size.w + 'px');
		this.content.css('height', this.size.h + 'px');
	}

	// performs all the calculations necessary to display the honeycomb, and begins rendering the pieces
	public populate():void
	{
		// make sure all molecules have fingerprints, then create the list of hexes, in placement order
		for (let hmol of this.molecules) if (!hmol.fp)
		{
			let circ = CircularFingerprints.create(hmol.mol, CircularFingerprints.CLASS_ECFP6);
			hmol.fp = circ.getUniqueHashes();
		}
		let pri:number[] = [];
		for (let n = 0; n < this.molecules.length; n++)
		{
			let sim = Number.MAX_VALUE;
			if (n != this.seed) sim = CircularFingerprints.tanimoto(this.molecules[n].fp, this.molecules[this.seed].fp);
			pri.push(sim);
		}
		let order = Vec.idxSort(pri);
		this.hexes = [];
		for (let n = order.length - 1; n >= 0 && this.hexes.length < this.maxHexes; n--)
		{
			let hex = new HoneycombHex(), hmol = this.molecules[order[n]];
			hex.molidx = order[n];
			hex.mol = hmol.mol;
			hex.fp = hmol.fp;
			this.hexes.push(hex);
		}

		// do all of the placing
		this.growFlower();
		for (let n = 7; n < this.hexes.length; n++) this.placeHex(n);


		/*for (let n = 0; n < this.hexes.length; n++)
		{
			let hex = this.hexes[n];
			console.log('n='+n+' idx='+hex.molidx+' na='+hex.mol.numAtoms+' x='+hex.x+' y='+hex.y);
		}*/
	
		// get ready and draw
		this.prepareLayout();

		let backdrop = $('<div></div>').appendTo(this.content);
		backdrop.css('width', this.size.w + 'px');
		backdrop.css('height', this.size.h + 'px');
		backdrop.css('position', 'relative');		

		let roster = Vec.identity0(this.hexes.length);
		this.renderNext(backdrop, roster);
	}

	// ------------ private methods ------------

	// places the first 7 molecules in a 6-petal flower pattern
	private growFlower():void
	{
		const sz = this.hexes.length, fsz = Math.min(6, sz - 1);

		// find the circular permutation that has the most-similar consecutive neighbours
		let perm:number[] = null, bestScore = 0;
		for (let p of this.FLOWER_PERMS)
		{
			let score = 0;
			for (let n = 0; n < 6; n++)
			{
				const nn = n == 5 ? 0 : n + 1;
				let pn = p[n] + 1, pnn = p[nn] + 1;
				if (pn >= sz) pn = 0;
				if (pnn >= sz) pnn = 0;
				score += CircularFingerprints.tanimoto(this.hexes[pn].fp, this.hexes[pnn].fp);
			}
			if (perm == null || score > bestScore)
			{
				perm = p;
				bestScore = score;
			}
		}

		// place them: north is the prevailing direction for "most similar to seed", with its own two preferred buddies being NW & NE, respectively
		let dir = [this.HEX_N, this.HEX_NE, this.HEX_SE, this.HEX_S, this.HEX_SW, this.HEX_NW];
		this.hexes[0].x = 0;
		this.hexes[0].y = 0;
		for (let n = 0; n < 6; n++)
		{
			let idx = perm[n] + 1;
			if (idx >= sz) continue;
			this.hexes[idx].x = this.offsetX(0, 0, dir[n]);
			this.hexes[idx].y = this.offsetY(0, 0, dir[n]);
		}
	}

	// places one more hex, greedily
	private placeHex(idx:number):void
	{
		const sz = this.hexes.length;

		// offset all position assignments so that the first one is at (0,0) then create a grid
		let molX:number[] = [], molY:number[] = [];
		let loX = this.hexes[0].x, loY = this.hexes[0].y, hiX = loX, hiY = loY;
		for (let n = 0; n < idx; n++)
		{
			let hex = this.hexes[n];
			molX.push(hex.x);
			molY.push(hex.y);
			loX = Math.min(loX, hex.x);
			loY = Math.min(loY, hex.y);
			hiX = Math.max(hiX, hex.x);
			hiY = Math.max(hiY, hex.y);
		}
		if ((loX & 1) == 1) loX--; // even/odd matters for X
		Vec.addTo(molX, -loX);
		Vec.addTo(molY, -loY);
		const gridW = hiX - loX + 1, gridH = hiY - loY + 1;
		let grid:number[][] = []; // access as grid[y][x]
		for (let n = 0; n < gridH; n++) grid.push(Vec.numberArray(-1, gridW));
		for (let n = 0; n < idx; n++) grid[molY[n]][molX[n]] = n;
		
		// iterate over all of these spots: any unoccupied hex with at least 1 adjacency is fair game
		let ndiv = [1, 0.5, 1.0 / 3, 0.25, 0.2, 1.0 / 6];
		let bestX = -1, bestY = -1, bestScore = -1;

		for (let y = -1; y <= gridH; y++) for (let x = -1; x <= gridW; x++)
		{
			if (x >= 0 && x < gridW && y >= 0 && y < gridH && grid[y][x] >= 0) continue; // occupied

			let nbrs:number[] = [], hitDir = -1, hitX = 0, hitY = 0;
			// note: HEX_* constants range from 0..5
			for (let dir = 0; dir < 6; dir++)
			{
				let ox = this.offsetX(x, y, dir), oy = this.offsetY(x, y, dir);
				if (ox < 0 || ox >= gridW || oy < 0 || oy >= gridH) continue;
				let i = grid[oy][ox];
				if (i >= 0)
				{
					nbrs.push(i);
					if (nbrs.length == 1)
					{
						hitDir = dir;
						hitX = ox;
						hitY = oy;
					}
				}
			}
			if (nbrs.length == 0) continue;

			// score: add up neighbour similarities for an average
			let score = 0;
			for (let n = 0; n < nbrs.length; n++) score += CircularFingerprints.tanimoto(this.hexes[idx].fp, this.hexes[nbrs[n]].fp);
			score *= ndiv[nbrs.length - 1];
			score += nbrs.length * this.density; // and throw in the density fudge factor: more neighbours tends to lower similarity, so counterbalance2

			// special deal: if just one attachment, add in a preference to push it toward a linear orientation, i.e. the hex on the opposite side is defined,
			if (nbrs.length == 1)
			{
				for (let look = 5; look <= 7; look++)
				{
					let dir = (hitDir + look) % 6;
					let ox = this.offsetX(hitX, hitY, dir), oy = this.offsetY(hitX, hitY, dir);
					if (ox < 0 || ox >= gridW || oy < 0 || oy >= gridH) continue;
					let i = grid[oy][ox];
					if (i >= 0)
					{
						const mod = look == 6 ? 0.001 : 0.002; // stronger positive multiplier for almost-adjacent: want this to act as an attractor
						score += mod * CircularFingerprints.tanimoto(this.hexes[idx].fp, this.hexes[i].fp);
					}
				}
			}

			if (score > bestScore)
			{
				bestScore = score;
				bestX = x;
				bestY = y;
			}
		}

		this.hexes[idx].x = bestX + loX;
		this.hexes[idx].y = bestY + loY;
	}

	// offsets for a hex: returns the new X or Y position formed by migrating in a particular direction (one of 6 possible HEX_*); this
	// is a little bit funky because odd values of Y have the X position implicitly indented by half a unit
	private offsetX(x:number, y:number, dir:number):number
	{
		return dir == this.HEX_NW || dir == this.HEX_SW ? x - 1 : dir == this.HEX_NE || dir == this.HEX_SE ? x + 1 : x;
	}
	private offsetY(x:number, y:number, dir:number):number
	{
		if (dir == this.HEX_N) return y - 1;
		if (dir == this.HEX_S) return y + 1;
		if ((x & 1) == 0)
		{
			return dir == this.HEX_NW || dir == this.HEX_NE ? y : y + 1;
		}
		else
		{
			return dir == this.HEX_NW || dir == this.HEX_NE ? y - 1 : y;
		}
	}

	// calculate positional information for all of the hexes: this can be done quickly, before all the rendering happens
	private prepareLayout():void
	{
		const nhex = this.hexes.length;
		if (nhex == 0) return;
		let usize = this.hexSize * 1.0 /* zoomscale...*/;

		let hexW = usize * 0.75, hexH = usize * Math.cos(30 * DEGRAD);
		let innerRad = 0.5 * hexH, outerRad = 0.5 * usize; // inner=closest approach of mid edge, outer=far vertex distance
		let edgeLen = usize * Math.sin(30 * DEGRAD) // the length of any of the hexagon's edges
		
		let cx:number[] = [], cy:number[] = [];
		//let loX = 0, loY = 0, hiX = 0, hiY = 0;
		for (let n = 0; n < nhex; n++)
		{
			let x = this.hexes[n].x * hexW;
			let y = this.hexes[n].y * hexH;
			if ((this.hexes[n].x & 1) == 1) y -= 0.5 * hexH;
			cx.push(x);
			cy.push(y);
		
			/*if (n == 0) [loX, hiX, loY, hiY] = [x, y, x, y];
			
			loX = Math.min(loX, Math.floor(x - 0.5 * usize));
			loY = Math.min(loY, Math.floor(y - 0.5 * hexH));
			hiX = Math.max(hiX, Math.ceil(x + 0.5 * usize));
			hiY = Math.max(hiY, Math.ceil(y + 0.5 * hexH));*/
		}

		/*loX -= 10; loY -= 10;
		hiX += 10; hiY += 10;*/
		Vec.addTo(cx, 0.5 * this.size.w - cx[0]);
		Vec.addTo(cy, 0.5 * this.size.h - cy[0]); 
		
		for (let n = 0; n < nhex; n++)
		{
			let x1 = Math.floor(cx[n] - 0.5 * usize - 1.5), y1 = Math.floor(cy[n] - 0.5 * hexH - 1.5);
			let x2 = Math.ceil(cx[n] + 0.5 * usize + 1.5), y2 = Math.ceil(cy[n] + 0.5 * hexH + 1.5);
			
			let hex = this.hexes[n];
			hex.centre = new Pos(cx[n] - x1, cy[n] - y1);
			hex.hexSize = usize;
			hex.lineSize = this.hexSize * 0.01; //scroller.zoomScale
			hex.innerRad = innerRad;
			hex.outerRad = outerRad;
			hex.edgeLen = edgeLen;		
			hex.frame = new Box(x1, y1, x2 - x1, y2 - y1);
		}
		
		/* ...
		scroller.frame = bounds
		let contentW = hiX - loX, contentH = hiY - loY
		scroller.contentSize = CGSize(width:contentW, height:contentH)
		canvas.frame = CGRect(x:0, y:0, width:contentW, height:contentH)
		*/
		
		// centre the seed hex
		/*let sz = bounds.size
		let seed = indexOf(cluster.seed, indices)
		let ox = cx[seed] - loX - 0.5 * sz.width
		let oy = cy[seed] - loY - 0.5 * sz.height
		scroller.contentOffset = CGPoint(x:ox, y:oy)*/
		
		// define the zoom extremities
		/*let shrinkW = min(1, sz.width / contentW), shrinkH = min(1, sz.height / contentH)
		scroller.minimumZoomScale = min(shrinkW, shrinkH)
		let maxZoom = CGFloat(maxMemZoom) / (useScreenScale * useScreenScale * 4 * CGFloat(nhex)  * hexSize * hexSize * 1.5)
		//println("MAX:\(maxZoom)")
		scroller.maximumZoomScale = min(5, maxZoom)
		*/
	}

	// render the next hex, then continue
	private renderNext(parent:JQuery, roster:number[])
	{
		if (roster.length == 0 || this.stopped) return;
		
		let idx = roster.shift(), hex = this.hexes[idx];

		if (!hex.span)
		{
			hex.span = $('<span></span>').appendTo(parent);
			hex.span.css('position', 'absolute');
			hex.span.css('pointer-events', 'none');
		}

		hex.span.css('left', hex.frame.x + 'px');
		hex.span.css('top', hex.frame.y + 'px');
		hex.span.css('width', hex.frame.w + 'px');
		hex.span.css('height', hex.frame.h + 'px');
console.log('IDX:'+idx+' FRAME:'+JSON.stringify(hex.frame));

		//hex.span.css('background-color', 'red');

		let gfx = new MetaVector();

		let edgeX:number[] = [], edgeY:number[] = [];
		for (let n = 0; n < 6; n++)
		{
			let th = (n - 2) * Math.PI * 1.0/3;
			edgeX.push(hex.centre.x + hex.hexSize * 0.5 * Math.cos(th));
			edgeY.push(hex.centre.y + hex.hexSize * 0.5 * Math.sin(th));
		}

		gfx.drawPoly(edgeX, edgeY, 0x000000, hex.lineSize, hex.background, true);

		// rim colour-coding, if any
		let rimFract = hex.withRim ? 0.15 : 0, mainFract = 1 - rimFract;
		
/*
		if hex.withRim
		{
			for i in 0 ..< 6
			{
				if hex.rimCols[i] == VectorGfx.NoColour {continue}
				let j = i == 5 ? 0 : i + 1
				
				let p1 = CGPoint(x:centre.x + (edgeX[i] - centre.x) * mainFract, y:centre.y + (edgeY[i] - centre.y) * mainFract)
				let p2 = CGPoint(x:edgeX[i], y:edgeY[i])
				let p3 = CGPoint(x:edgeX[j], y:edgeY[j])
				let p4 = CGPoint(x:centre.x + (edgeX[j] - centre.x) * mainFract, y:centre.y + (edgeY[j] - centre.y) * mainFract)
				
				ctx.beginPath()
				ctx.move(to:CGPoint(x:p1.x, y:p1.y))
				ctx.addLine(to:CGPoint(x:p2.x, y:p2.y))
				ctx.addLine(to:CGPoint(x:p3.x, y:p3.y))
				ctx.addLine(to:CGPoint(x:p4.x, y:p4.y))
				setContextFillCol(ctx, hex.rimCols[i])
				ctx.fillPath()
			}
		}*/
		
		// text annotation
		let bumpDown = 0;
	
		/*if !hex.annotation.isEmpty
		{
			let y = centre.y - innerRad * mainFract
			var font = UIFont.systemFont(ofSize:CGFloat(hex.annotFontSize))
			var tsz = textSize(hex.annotation, font)
			if tsz.width > edgeLen
			{
				font = fontFitWidth(hex.annotation, font, edgeLen, minSize:2)
				tsz = textSize(hex.annotation, font)
			}
			textDrawPoint(hex.annotation, font, CGPoint(x:centre.x - 0.5 * tsz.width, y:y + 3 - 0.5 * tsz.height), hex.annotCol)
			bumpDown = font.lineHeight
		}*/
		
		// draw the molecule
		let cent = new Pos(hex.centre.x, hex.centre.y + 0.5 * bumpDown);
		let rad = hex.innerRad * mainFract - 1 - bumpDown;

		let policy = RenderPolicy.defaultColourOnWhite(); // !! cache someplace...
		policy.data.pointScale = 12;
		let effects = new RenderEffects();
		let measure = new OutlineMeasurement(0, 0, policy.data.pointScale);
		let layout = new ArrangeMolecule(hex.mol, measure, policy, effects);
		layout.arrange();

		let [cx, cy, mrad] = this.determineCircularBoundary(layout);
		if (mrad > rad)
		{
			let downScale = rad / mrad;
			layout.scaleEverything(downScale);
			cx *= downScale;
			cy *= downScale;
		}
		layout.offsetEverything(cent.x - cx, cent.y - cy);
		new DrawMolecule(layout, gfx).draw();

		// blat
		hex.span.empty();
		gfx.normalise();
		$(gfx.createSVG()).appendTo(hex.span);

		const self = this;
		setTimeout(function() {self.renderNext(parent, roster);}, 1);
	}

	// fits a molecular layout into a circle
	private determineCircularBoundary(layout:ArrangeMolecule):[number, number, number]
	{
		let npoints = layout.numPoints(), nlines = layout.numLines();
		if (npoints == 0) return [0, 0, 0];

		let cx = 0, cy = 0;
		let px:number[] = [], py:number[] = [];
		for (let n = 0; n < npoints; n++)
		{
			let a = layout.getPoint(n);
			cx += a.oval.cx;
			cy += a.oval.cy;
			
			let r = Math.max(a.oval.rw, a.oval.rh);
			px.push(a.oval.cx - r); 
			py.push(a.oval.cy - r);

			if (r == 0) continue;

			px.push(a.oval.cx - r); 
			py.push(a.oval.cy + r);
			px.push(a.oval.cx + r); 
			py.push(a.oval.cy - r);
			px.push(a.oval.cx + r); 
			py.push(a.oval.cy + r);
		}
		cx /= npoints;
		cy /= npoints;

		for (let n = 0; n < nlines; n++)
		{
			let b = layout.getLine(n);
			px.push(b.line.x1 - b.size);
			py.push(b.line.y1 - b.size);
			px.push(b.line.x1 + b.size); 
			py.push(b.line.y1 + b.size);
			px.push(b.line.x2 - b.size); 
			py.push(b.line.y2 - b.size);
			px.push(b.line.x2 + b.size); 
			py.push(b.line.y2 + b.size);
		}

		// iteratively shift the centre/recalculate the radius until there's no way to reduce it any further
		let calculateRadiusSq = function(cx:number, cy:number, px:number[], py:number[]):number
		{
			let v = 0
			for (let n = px.length - 1; n >= 0; n--) v = Math.max(v, norm2_xy(px[n] - cx, py[n] - cy));
			return v;
		}

		var crsq = calculateRadiusSq(cx, cy, px, py);
		var step = Math.sqrt(crsq) * 0.1;
		while (step > 0.01)
		{
			let x1 = cx - step, x2 = cx + step, y1 = cy - step, y2 = cy + step;
			let r1 = calculateRadiusSq(x1, cy, px, py);
			let r2 = calculateRadiusSq(x2, cy, px, py);
			let r3 = calculateRadiusSq(cx, y1, px, py);
			let r4 = calculateRadiusSq(cx, y2, px, py);
			if (r1 < crsq && r1 < r2 && r1 < r3 && r1 < r4) {cx = x1; crsq = r1;}
			else if (r2 < crsq && r2 < r3 && r2 < r4 ){cx = x2; crsq = r2;}
			else if (r3 < crsq && r3 < r4) {cy = y1; crsq = r3;}
			else if (r4 < crsq) {cy = y2; crsq = r4;}
			else {step *= 0.5;}
		}

		return [cx, cy, Math.sqrt(crsq)];
	}
}




