/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

    [PKG=webmolkit]
*/

///<reference path='../data/Molecule.ts'/>
///<reference path='../gfx/Rendering.ts'/>
///<reference path='../gfx/FontData.ts'/>
///<reference path='../util/Geom.ts'/>
///<reference path='ArrangeMeasurement.ts'/>
///<reference path='ArrangeMolecule.ts'/>
///<reference path='MetaVector.ts'/>
///<reference path='Rendering.ts'/>

namespace WebMolKit /* BOF */ {

/*
    Controlling class for drawing a molecule in a vector graphics format: this turns an "arranged molecule" instance into the series of primitives that
    can be mapped directly to a rendering engine or output format, as encapsulated by the VectorGfxBuilder subclasses.
    
    Note that in this implementation of rendering, only the molecule is drawn, without interactive effects. The constructor/draw/build sequence should be
    called only once during the lifetime of this object.
*/

export class DrawMolecule
{
    private mol:Molecule;
    private policy:RenderPolicy;
    private effects:RenderEffects;

    private scale:number;
    private invScale:number;
    
    constructor(private layout:ArrangeMolecule, private vg:MetaVector)
    {
        this.mol = layout.getMolecule();
        this.policy = layout.getPolicy();
        this.effects = layout.getEffects();
        this.scale = layout.getScale();
        this.invScale = 1.0 / this.scale;
    }
    
    // access to content
    public getMolecule():Molecule {return this.mol;}
    public getMetaVector():MetaVector {return this.vg;}
    public getLayout():ArrangeMolecule {return this.layout;}
    public getPolicy():RenderPolicy {return this.policy;}
    public getEffects():RenderEffects {return this.effects;}
    
    // renders the molecular structure
    public draw():void
    {
        // debugging: draw the "space filling" areas-to-avoid
        let DRAW_SPACE = false;
        if (DRAW_SPACE) 
		{
			let bounds = this.layout.determineBoundary();
			this.vg.drawRect(bounds[0], bounds[1], bounds[2] - bounds[0], bounds[3] - bounds[1], 0xFF0000, 1, MetaVector.NOCOLOUR);
			for (let n = 0; n < this.layout.numSpace(); n++)
			{
				let spc = this.layout.getSpace(n);
				this.vg.drawRect(spc.box.x, spc.box.y, spc.box.w, spc.box.h, MetaVector.NOCOLOUR, 0, 0xE0E0E0);
				if (spc.px != null && spc.py != null && spc.px.length > 2) this.vg.drawPoly(spc.px, spc.py, 0x000000, 1, 0x808080FF, true);
			}
		}

        this.drawUnderEffects();

        // emit the drawing elements as vector primitives
        
        let layout = this.layout, effects = this.effects, policy = this.policy, vg = this.vg;

        for (let n = 0; n < layout.numLines(); n++)
        {
            let b = layout.getLine(n);
            if (effects.hideBonds.has(b.bnum)) continue;

            if (b.type == BLineType.Normal)
            {
                vg.drawLine(b.line.x1, b.line.y1, b.line.x2, b.line.y2, b.col, b.size);
            }
            else if (b.type == BLineType.Inclined) this.drawBondInclined(b);
            else if (b.type == BLineType.Declined) this.drawBondDeclined(b);
            else if (b.type == BLineType.Unknown) this.drawBondUnknown(b);
            else if (b.type == BLineType.Dotted || b.type == BLineType.DotDir) this.drawBondDotted(b);
            else if (b.type == BLineType.IncDouble || b.type == BLineType.IncTriple || b.type == BLineType.IncQuadruple) this.drawBondIncMulti(b);
        }
        
        let fg = policy.data.foreground;
        for (let r of layout.getRings()) vg.drawOval(r.cx, r.cy, r.rw, r.rh, fg, r.size, MetaVector.NOCOLOUR);
        for (let p of layout.getPaths()) vg.drawPath(p.px, p.py, p.ctrl, false, fg, p.size, MetaVector.NOCOLOUR, false);

        for (let n = 0; n < layout.numPoints(); n++)
        {
            let p = layout.getPoint(n);
            if (effects.hideBonds.has(p.anum)) continue;

            let txt = p.text;
            if (txt == null) continue; // is a point, so do not draw anything
            let fsz = p.fsz;
            let cx = p.oval.cx, cy = p.oval.cy, rw = p.oval.rw;
            let col = p.col;

            while (txt.endsWith('.'))
            {
                let dw = rw / txt.length;
                let r = fsz * 0.15;
                vg.drawOval(cx + rw - dw, cy, r, r, MetaVector.NOCOLOUR, 0, col);

                cx -= dw;
                rw -= dw;
                txt = txt.substring(0, txt.length - 1);
            }
            while (txt.startsWith('+'))
            {
                let dw = rw / txt.length;
                let x = cx - rw + dw, y = cy, r = fsz * 0.18, lsz = fsz * 0.1;
                vg.drawLine(x - r, y, x + r, y, col, lsz);
                vg.drawLine(x, y - r, x, y + r, col, lsz);

                cx += dw;
                rw -= dw;
                txt = txt.substring(1, txt.length);
            }
            while (txt.startsWith('-'))
            {
                let dw = rw / txt.length;
                let x = cx - rw + dw, y = cy, r = fsz * 0.18, lsz = fsz * 0.1;
                vg.drawLine(x - r, y, x + r, y, col, lsz);

                cx += dw;
                rw -= dw;
                txt = txt.substring(1, txt.length);
            }
            if (txt.length > 0)
            {
                vg.drawText(cx, cy, txt, fsz, col, TextAlign.Centre | TextAlign.Middle);
            }
        }

        this.drawOverEffects();	
    }

    // ------------ private methods ------------

    private drawUnderEffects():void
    {
        let mol = this.mol, policy = this.policy, effects = this.effects, layout = this.layout, scale = this.scale, vg = this.vg;

        for (let n = 0, num = Math.min(effects.atomFrameDotSz.length, mol.numAtoms); n < num; n++)
        {
            if (effects.hideAtoms.has(n + 1)) continue;

            let dw = effects.atomFrameDotSz[n] * scale, col = effects.atomFrameCol[n];
            let a = layout.getPoint(n);
            
            let rw = a.oval.rw + 0.1 * scale, rh = a.oval.rh + 0.1 * scale;
            let wdots = Math.ceil(2 * rw / (3 * dw));
            let hdots = Math.ceil(2 * rh / (3 * dw));
            let wspc = 2 * rw / wdots, hspc = 2 * rh / hdots;
            
            for (let i = 0; i <= wdots; i++)
            {
                let x = a.oval.cx - rw + i * wspc;
                vg.drawOval(x, a.oval.cy - rh, dw, dw, MetaVector.NOCOLOUR, 0, col);
                vg.drawOval(x, a.oval.cy + rh, dw, dw, MetaVector.NOCOLOUR, 0, col);
            }
            for (let i = 1; i < hdots; i++)
            {
                let y = a.oval.cy - rh + i * hspc;
                vg.drawOval(a.oval.cx - rw, y, dw, dw, MetaVector.NOCOLOUR, 0, col);
                vg.drawOval(a.oval.cx + rw, y, dw, dw, MetaVector.NOCOLOUR, 0, col);
            }
        }

        for (let key in effects.dottedRectOutline)
        {
            let atom = parseInt(key), col = effects.dottedRectOutline[key];
            let a = layout.getPoint(atom - 1);
            let rw = Math.max(a.oval.rw, 0.2 * scale), rh = Math.max(a.oval.rh, 0.2 * scale);
            let sz = 0.05 * scale;
            let xdots = Math.max(1, Math.round(rw / (2 * sz)));
            let ydots = Math.max(1, Math.round(rh / (2 * sz)));
            let invX = (2 * rw) / xdots, invY = (2 * rh) / ydots;
            for (let n = 0; n <= xdots; n++)
            {
                let x = a.oval.cx - rw + n * invX;
                vg.drawOval(x, a.oval.cy - rh, sz, sz, MetaVector.NOCOLOUR, 0, col);
                vg.drawOval(x, a.oval.cy + rh, sz, sz, MetaVector.NOCOLOUR, 0, col);
            }
            for (let n = 1; n < ydots; n++)
            {
                let y = a.oval.cy - rh + n * invY;
                vg.drawOval(a.oval.cx - rw, y, sz, sz, MetaVector.NOCOLOUR, 0, col);
                vg.drawOval(a.oval.cx + rw, y, sz, sz, MetaVector.NOCOLOUR, 0, col);
            }
        }
        
        for (let key in effects.dottedBondCross)
        {
            let bond = parseInt(key), col = effects.dottedBondCross[key];
            var x1 = 0, y1 = 0, x2 = 0, y2 = 0, bcount = 0;
            for (let n = 0; n < layout.numLines(); n++)
            {
                let b = layout.getLine(n);
                if (b.bnum == bond)
                {
                    x1 += b.line.x1; y1 += b.line.y1;
                    x2 += b.line.x2; y2 += b.line.y2;
                    bcount += 1;
                }
            }
            if (bcount > 1) 
            {
                let inv = 1 / bcount; 
                [x1, y1, x2, y2] = [x1 * inv, y1 * inv, x2 * inv, y2 * inv];
            }
            
            let dx = x2 - x1, dy = y2 - y1;
            let inv = 0.2 * scale * invZ(norm_xy(dx, dy)), ox = dy * inv, oy = -dx * inv;
            let cx = 0.5 * (x1 + x2), cy = 0.5 * (y1 + y2), sz = 0.05 * scale;
            for (let p of [-2, -1, 1, 2])
            {
                let x = cx + p * ox, y = cy + p * oy;
                vg.drawOval(x, y, sz, sz, MetaVector.NOCOLOUR, 0, col);
            }
        }
    }
    
    private drawOverEffects():void
    {
        let mol = this.mol, policy = this.policy, effects = this.effects, layout = this.layout, scale = this.scale, vg = this.vg;

        for (let a of effects.overlapAtoms)
        {
            let p = layout.getPoint(a - 1);
            let rad = scale * 0.2;
            vg.drawLine(p.oval.cx - rad, p.oval.cy - rad, p.oval.cx + rad, p.oval.cy + rad, 0xFF0000, 1);
            vg.drawLine(p.oval.cx + rad, p.oval.cy - rad, p.oval.cx - rad, p.oval.cy + rad, 0xFF0000, 1);
        }
    
        for (let n = 0, num = Math.min(effects.atomCircleSz.length, mol.numAtoms); n < num; n++) if (effects.atomCircleSz[n] > 0)
        {
            let dw = effects.atomCircleSz[n] * scale, col = effects.atomCircleCol[n];
            let p = layout.getPoint(n);
            vg.drawOval(p.oval.cx, p.oval.cy, dw, dw, MetaVector.NOCOLOUR, 0, col);
        }
    }
    
    private drawBondInclined(b:BLine):void
    {
        let x1 = b.line.x1, y1 = b.line.y1, x2 = b.line.x2, y2 = b.line.y2;
        let dx = x2 - x1, dy = y2 - y1;
        let col = b.col;
        let size = b.size, head = b.head;

        let norm = head / Math.sqrt(dx * dx + dy * dy);
        let ox = norm * dy, oy = -norm * dx;
        let px = [x1, x2 - ox, x2 + ox], py = [y1, y2 - oy, y2 + oy];

        // if endpoint is divalent, consider modifying the polygon shape
        if (this.layout.getPoint(b.bto - 1).text == null && this.mol.atomAdjCount(b.bto) == 2)
        {
            let other:BLine = null;
            for (let n = 0; n < this.layout.numLines(); n++)
            {
                let o = this.layout.getLine(n);
                if (o.type == BLineType.Normal && (o.bfr == b.bto || o.bto == b.bto))
                {
                    if (other != null) {other = null; break;} // must be only one
                    other = o;
                }
            }
            if (other != null)
            {
                let th1 = Math.atan2(y1 - y2, x1 - x2);
                let th2 = Math.atan2(other.line.y1 - other.line.y2, other.line.x1 - other.line.x2);
                if (b.bto == other.bfr) th2 += Math.PI;
                let diff = Math.abs(angleDiff(th1, th2));
                if (diff > 105 * DEGRAD && diff < 135 * DEGRAD)
                {
                    let ixy1 = GeomUtil.lineIntersect(px[0], py[0], px[1], py[1], other.line.x1, other.line.y1, other.line.x2, other.line.y2);
                    let ixy2 = GeomUtil.lineIntersect(px[0], py[0], px[2], py[2], other.line.x1, other.line.y1, other.line.x2, other.line.y2);
                    px[1] = ixy1[0];
                    py[1] = ixy1[1];
                    px[2] = ixy2[0];
                    py[2] = ixy2[1];

                    // extend slightly, to overlap the line
                    let dx1 = px[1] - px[0], dy1 = py[1] - py[0], inv1 = 0.5 * other.size / norm_xy(dx1, dy1);
                    px[1] += dx1 * inv1;
                    py[1] += dy1 * inv1;
                    let dx2 = px[2] - px[0], dy2 = py[2] - py[0], inv2 = 0.5 * other.size / norm_xy(dx2, dy2);
                    px[2] += dx2 * inv1;
                    py[2] += dy2 * inv1;
                }
            }
        }

        // if endpoint is trivalent, another modification is considered
        if (this.layout.getPoint(b.bto - 1).text == null && this.mol.atomAdjCount(b.bto) == 3)
        {
            let other1:BLine = null, other2:BLine = null;
            for (let n = 0; n < this.layout.numLines(); n++)
            {
                let o = this.layout.getLine(n);
                if (o.type == BLineType.Normal && (o.bfr == b.bto || o.bto == b.bto))
                {
                    if (other1 == null) other1 = o;
                    else if (other2 == null) other2 = o;
                    else
                    {
                        other1 = other2 = null;
                        break;
                    }
                }
            }
            if (other1 != null && other2 != null)
            {
                let th1 = Math.atan2(y1 - y2, x1 - x2);
                let th2 = Math.atan2(other1.line.y1 - other1.line.y2, other1.line.x1 - other1.line.x2);
                let th3 = Math.atan2(other2.line.y1 - other2.line.y2, other2.line.x1 - other2.line.x2);
                if (b.bto == other1.bfr) th2 += Math.PI;
                if (b.bto == other2.bfr) th3 += Math.PI;
                let dth1 = angleDiff(th1, th2), diff1 = Math.abs(dth1);
                let dth2 = angleDiff(th1, th3), diff2 = Math.abs(dth2);
                let diff3 = Math.abs(angleDiff(th2, th3));
                if (diff1 > 105 * DEGRAD && diff1 < 135 * DEGRAD || 
                    diff2 > 105 * DEGRAD && diff2 < 135 * DEGRAD ||
                    diff3 > 105 * DEGRAD && diff3 < 135 * DEGRAD)
                {
                    if (dth1 < 0) [other1, other2] = [other2, other1];
                    let ixy1 = GeomUtil.lineIntersect(px[0], py[0], px[1], py[1], other1.line.x1, other1.line.y1, other1.line.x2, other1.line.y2);
                    let ixy2 = GeomUtil.lineIntersect(px[0], py[0], px[2], py[2], other2.line.x1, other2.line.y1, other2.line.x2, other2.line.y2);
                    px = [x1, ixy1[0], x2, ixy2[0]];
                    py = [y1, ixy1[1], y2, ixy2[1]];
                }
            }
        }
        
        this.vg.drawPoly(px, py, MetaVector.NOCOLOUR, 0, col, true);
    }
    private drawBondDeclined(b:BLine):void
    {
        let x1 = b.line.x1, y1 = b.line.y1, x2 = b.line.x2, y2 = b.line.y2;
        let dx = x2 - x1, dy = y2 - y1;
        let col = b.col;
        let size = b.size, head = b.head;

        let ext = Math.sqrt(dx * dx + dy * dy);
        let nsteps = Math.ceil(ext * 2.5 * this.invScale);
        let norm = head / ext;
        let ox = norm * dy, oy = -norm * dx, invSteps = 1.0 / (nsteps + 1);
        let holdout = this.mol.atomAdjCount(b.bto) == 1 && this.layout.getPoint(b.bto - 1).text == null ? 1 : 1 - (0.15 * this.scale) / ext;
        for (let i = 0; i <= nsteps + 1; i++)
        {
            let cx = x1 + i * dx * invSteps * holdout, cy = y1 + i * dy * invSteps * holdout;
            let ix = ox * i * invSteps, iy = oy * i * invSteps;
            this.vg.drawLine(cx - ix, cy - iy, cx + ix, cy + iy, col, size);
        }
    }
    private drawBondUnknown(b:BLine):void
    {
        let x1 = b.line.x1, y1 = b.line.y1, x2 = b.line.x2, y2 = b.line.y2;
        let dx = x2 - x1, dy = y2 - y1;
        let col = b.col;
        let size = b.size, head = b.head;

        let ext = Math.sqrt(dx * dx + dy * dy);
        let nsteps = Math.ceil(ext * 3.5 * this.invScale);
        let norm = head / ext;
        let ox = norm * dy, oy = -norm * dx;
        let sz = 1 + 3 * (nsteps + 1);
        let x = Vec.numberArray(0, sz), y = Vec.numberArray(0, sz), ctrl = Vec.booleanArray(false, sz);
        x[0] = x1;
        y[0] = y1;
        ctrl[0] = false;

        for (let i = 0, j = 1; i <= nsteps; i++, j += 3)
        {
            let ax = x1 + i * dx / (nsteps + 1), ay = y1 + i * dy / (nsteps + 1);
            let cx = x1 + (i + 1) * dx / (nsteps + 1), cy = y1 + (i + 1) * dy / (nsteps + 1);
            let bx = (ax + cx) / 2, by = (ay + cy) / 2;
            let sign = i % 2 == 0 ? 1 : -1;

            x[j] = ax;
            x[j + 1] = bx + sign * ox;
            x[j + 2] = cx;
            y[j] = ay;
            y[j + 1] = by + sign * oy;
            y[j + 2] = cy;
            ctrl[j] = true;
            ctrl[j + 1] = true;
            ctrl[j + 2] = false;
        }
        this.vg.drawPath(x, y, ctrl, false, col, size, MetaVector.NOCOLOUR, false);
    }
    private drawBondDotted(b:BLine):void
    {
        let x1 = b.line.x1, y1 = b.line.y1, x2 = b.line.x2, y2 = b.line.y2;
        let dx = x2 - x1, dy = y2 - y1;
        let col = b.col;
        let size = b.size;

        let radius = size, dist = norm_xy(dx, dy);
        if (dist < 0.01) return;
        let nudge = 0.5 * size / dist;
        x1 += nudge * dx;
        y1 += nudge * dy;
        x2 -= nudge * dx;
        y2 -= nudge * dy;
        dx = x2 - x1;
        dy = y2 - y1;
        
        let nsteps = Math.ceil(0.2 * dist / radius);
        let invSteps = 1.0 / (nsteps + 1);
        for (let i = 0; i <= nsteps + 1; i++)
        {
            let r = radius;
            if (b.type == BLineType.DotDir) r *= 1 + (i * (1.0 / (nsteps + 2)) - 0.5);
            let cx = x1 + i * dx * invSteps, cy = y1 + i * dy * invSteps;
            this.vg.drawOval(cx, cy, r, r, MetaVector.NOCOLOUR, 0, col);
        }
    }
    private drawBondIncMulti(b:BLine):void
    {
        let x1 = b.line.x1, y1 = b.line.y1, x2 = b.line.x2, y2 = b.line.y2;
        let dx = x2 - x1, dy = y2 - y1;
        let col = b.col;
        let size = b.size, head = b.head;

        let norm = head / Math.sqrt(dx * dx + dy * dy);
        let ox = norm * dy, oy = -norm * dx;
        this.vg.drawPoly([x1, x2 - ox, x2 + ox], [y1, y2 - oy, y2 + oy], col, this.scale * 0.05, MetaVector.NOCOLOUR, true);
        
        if (b.type == BLineType.IncDouble)
        {
            this.vg.drawLine(x1, y1, x2, y2, col, this.scale * 0.03);
        }
        else
        {
            this.vg.drawLine(x1, y1, x2 + 0.33 * ox, y2 + 0.33 * oy, col, this.scale * 0.03);
            this.vg.drawLine(x1, y1, x2 - 0.33 * ox, y2 - 0.33 * oy, col, this.scale * 0.03);
        }
    }
}

/* EOF */ }