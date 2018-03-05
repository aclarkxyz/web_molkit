/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../data/Molecule.ts'/>
///<reference path='../data/MetaMolecule.ts'/>
///<reference path='../data/MoleculeStream.ts'/>
///<reference path='CircularFingerprints.ts'/>

namespace WebMolKit /* BOF */ {

/*
	A specialisation of the BayesianModel class, which operates exclusively on Circular (ECFP/FCFP) fingerprints.
	Provides convenience methods for feeding in raw molecules to create a model, and also serialisation/deserialisation
	features allowing models to be stored and recreated with known properties.
	
	The class is designed to operate with fairly large input sizes, but it does need to hold onto all of the calculated
	fingerprint lists so that the final build operation can calculate calibration metrics.
	
	It can operate with any degree of fingerprint folding, including none at all (but this means that there is a diabolical
	case that could get very memory intensive).
	
	Folding is optional: 0 means that all hash codes are retained (worst case scenario: 4 billion). If folding,
	must be an exponent of two (e.g. 1024, 2048, 4096, etc.) In practice, ROC curves for recalling single properties
	tend to hit diminishing returns above folding sizes of about 1024.

	Serialisation format is:
	
		Bayesian!({fptype},{folding},{low},{high})
		{hashidx1}={contribution1}
		{hashidx2}={contribution2}
		...
		!End
		
	Recommended file extension is ".bayesian", MIME type is "chemistry/x-bayesian"
		
	Where {fptype} is ECFP0/2/4/6 or FCFP0/2/4/6. 
	
	{low} and {high} are the boundaries of the response value for the training set.
*/


export class BayesianModel
{
	// incoming hash codes: actual values, and subsumed values are {#active,#total}
	private numActive = 0;
	private inHash:{[id:number] : number[]} = {};
	private training:number[][] = [];
	private activity:boolean[] = [];

	// built model: contributions for each hash code
	private contribs:{[id:number] : number} = {};
	private lowThresh = 0;
	private highThresh = 0;
	private range = 0;
	private invRange = 0;

	// self-validation metrics: can optionally be calculated after a build
	private estimates:number[] = null;
	public rocX:number[] = null; // between 0..1, and rounded to modest precision
	public rocY:number[] = null;
	public rocType:string = null;
	public rocAUC = Number.NaN;
	public trainingSize = 0; // these are serialised, while the actual training set is not
	public trainingActives = 0;

	// truth-table and derived metrics
	public truthTP = 0;
	public truthFP = 0;
	public truthTN = 0;
	public truthFN = 0;
	public precision = Number.NaN;
	public recall = Number.NaN;
	public specificity = Number.NaN;
	public statF1 = Number.NaN;
	public statKappa = Number.NaN;
	public statMCC = Number.NaN;

	// optional text attributes (serialisable)
	public noteTitle:string = null;
	public noteOrigin:string = null;
	public noteField:string = null;
	public noteComments:string[] = null;

	// ----------------- public methods -----------------

	// instantiate: must pick a class, which is one of the CircularFingerprints.CLASS_* constants
	constructor(public classType:number, public folding?:number)
	{
		if (this.folding == null) this.folding = 0;
	}

	// creates fingerprints for the indicated molecule, and adds them into the Bayesian inputs; note that for performance purposes, it is allowed to provide precomputed
	// hash codes, but the caller must ensure that they are calculated according to the same schema
	public addMolecule(mol:Molecule, active:boolean, hashes?:number[])
	{
		if (MolUtil.isBlank(mol) && hashes == null) throw 'Molecule cannot be blank or null.';

		if (hashes == null)
		{
			let meta = MetaMolecule.createStrictRubric(mol);
			let circ = new CircularFingerprints(meta, this.classType);
			circ.calculate();
			hashes = this.folding == 0 ? circ.getUniqueHashes() : circ.getFoldedHashes(this.folding);
		}

		if (active) this.numActive++;
		this.training.push(hashes);
		this.activity.push(active);
		for (let h of hashes)
		{
			let stash = this.inHash[h];
			if (stash == null) stash = [0, 0];
			if (active) stash[0]++;
			stash[1]++;
			this.inHash[h] = stash;
		}
	}

	// turns the incoming hashes into fingerprint contributions, which makes up a model that can be used to predict
	// newly submitted structures
	public build():void
	{
		this.trainingSize = this.training.length; // for posterity
		this.trainingActives = this.numActive;

		this.contribs = [];

		const sz = this.training.length;
		const invSz = 1.0 / sz;
		const P_AT = this.numActive * invSz;

		for (let hashStr in this.inHash)
		{
			let hash = parseInt(hashStr);
			const AT = this.inHash[hash];
			const A = AT[0], T = AT[1];
			const Pcorr = (A + 1) / (T * P_AT + 1);
			const P = Math.log(Pcorr);
			this.contribs[hash] = P;
		}

		this.lowThresh = Number.POSITIVE_INFINITY;
		this.highThresh = Number.NEGATIVE_INFINITY;
		for (let fp of this.training)
		{
			let val = 0;
			for (let hash of fp) val += this.contribs[hash];
			this.lowThresh = Math.min(this.lowThresh, val);
			this.highThresh = Math.max(this.highThresh, val);
		}
		this.range = this.highThresh - this.lowThresh;
		this.invRange = this.range > 0 ? 1 / this.range : 0;
	}

	// calculates fingerprints for a molecule, and returns the predictor value	
	public predictMolecule(mol:Molecule):number
	{
		if (MolUtil.isBlank(mol)) throw 'Molecule cannot be blank or null.';

		let meta = MetaMolecule.createStrictRubric(mol);
		let circ = new CircularFingerprints(meta, this.classType);
		circ.calculate();
		let hashes = this.folding == 0 ? circ.getUniqueHashes() : circ.getFoldedHashes(this.folding);
		return this.predictFP(hashes);
	}

	// perform the prediction, given the precomputed hash codes; this may be called from outside of the class for performance reasons, but the caller
	// must take care to ensure that the same fingerprint scheme is used, and that the hash codes are ordered
	public predictFP(hashes:number[]):number
	{
		let val = 0;
		for (let h of hashes)
		{
			let c = this.contribs[h];
			if (c != null) val += c;
		}
		return val;
	}

	// converts the predictor (as calculated above) into a value that is scaled and translated into a range that can be used as a probability: most values
	// will fall between 0..1, though some out-of-domain cases will exceed this range and may have to be capped
	public scalePredictor(pred:number):number
	{
		// special case: if there is no differentiation scale, it's either above or below (typically happens with tiny models)
		if (this.range == 0) return pred >= this.highThresh ? 1 : 0;
		return (pred - this.lowThresh) * this.invRange;
	}

	// while the scaled predictor (above) is generally between 0..1 ("probability-like"), results can go out of bounds; using the arctan 
	// function scales it so that the centroid is the same (0.5), but lower/higher values approach 0 or 1 as asymptotes; this is a useful 
	// way of keeping it within the range without resorting to capping, and has another handy effect of allowing known results to be stored 
	// in the same field (i.e. 0=known inactive, 1=known active, because these values cannot otherwise be reached)
	public scaleArcTan(scaled:number):number
	{
		const INVPI = 1.0 / Math.PI;
		return Math.atan(2 * scaled - 1) * INVPI + 0.5;
	}

	// figure out the proportion of a molecule's fingerprints are represented in the model
	public calculateOverlap(mol:Molecule):number
	{
		if (MolUtil.isBlank(mol)) throw 'Molecule cannot be blank or null.';

		let meta = MetaMolecule.createStrictRubric(mol);
		let circ = new CircularFingerprints(meta, this.classType);
		circ.calculate();
		let hashes = this.folding == 0 ? circ.getUniqueHashes() : circ.getFoldedHashes(this.folding);
		return this.calculateOverlapFP(hashes);
	}

	public calculateOverlapFP(hashes:number[]):number
	{
		if (hashes.length == 0) return 0;
		let count = 0.0;
		for (let h of hashes) if (this.contribs[h] != null) count++;
		return hashes.length == 1 ? count : count / hashes.length;
	}

	// builds an array of contribution values per atom; the scale is: 0=neutral, -1=very inactive, 1=very active (but not capped)
	public calculateAtomPredictors(mol:Molecule):number[]
	{
		const na = mol.numAtoms
		let atomic = Vec.numberArray(0, na); // (default of zero: is this the best call?)

		// sum the contributions: for each fingerprint that is defined, smear the contribution equally over all of the atoms that were involved in
		// a fingerprint with that hash code
		let predHashes = new Set<number>();
		let cover = this.determineCoverage(mol, predHashes);
		for (let h in cover)
		{
			let c = this.contribs[h];
			if (c == null) continue;
			let mask = cover[h];
			let msz = Vec.maskCount(mask);
			let invSz = 1.0 / msz;
			for (let n = 0; n < na; n++) if (mask[n]) atomic[n] += c * invSz;
		}

		// double duty: use the same source material to add up the numeric predictor as well (note that the "coverage" hashes are not necessarily
		// the same as the approved list)		
		let pred = 0;
		for (let h of predHashes)
		{
			let c = this.contribs[<any>h];
			if (c != null) pred += c;
		}

		// adjust the contributions to an average of zero, with a fixed standard deviation
		const SCALE_STDDEV_TO = 0.25;
		const invN = 1.0 / na;
		Vec.addTo(atomic, -Vec.sum(atomic) * invN);
		let stdDev = 0;
		for (let a of atomic) stdDev += a * a;
		stdDev = Math.sqrt(stdDev * invN);

		if (stdDev > 1E-3) Vec.mulBy(atomic, SCALE_STDDEV_TO / stdDev);

		// shunt it up so that it is centred around the overal predictor, in the same zero-centred space
		let scaled = (this.scalePredictor(pred) - 0.5) * 2; // adjusted to the [-1,1] space
		if (scaled < -1) scaled = -1; else if (scaled > 1) scaled = 1;
		Vec.addTo(atomic, scaled);
		return atomic;
	}

	// produces an ROC validation set using the training data, in leave-one-out fashion; note that this is very slow, and scales to O(N^2) relative
	// to the size of the training set, so should only be used for small collections
	public validateLeaveOneOut():void
	{
		const sz = this.training.length;
		this.estimates = [];
		for (let n = 0; n < sz; n++) this.estimates.push(this.singleLeaveOneOut(n));
		this.calculateROC();
		this.calculateTruth();
		this.rocType = 'leave-one-out';
	}

	// produces ROC validation, except using an N-pass split, which is much faster than leave-one-out, and is appropriate for reasonably big datasets
	public validateFiveFold():void
	{
		this.rocType = 'five-fold';
		this.validateNfold(5);
	}

	public validateThreeFold():void
	{
		this.rocType = 'three-fold';
		this.validateNfold(3);
	}

	// clears content from the training set (since it can be a memory hog)
	public clearTraining():void
	{
		this.training = [];
		this.activity = [];
	}

	// turns the model into a serialised ASCII string format
	public serialise():string
	{
		let lines:string[] = [];


		let fpname = this.classType == CircularFingerprints.CLASS_ECFP0 ? 'ECFP0' : this.classType == CircularFingerprints.CLASS_ECFP2 ? 'ECFP2' 
				   : this.classType == CircularFingerprints.CLASS_ECFP4 ? 'ECFP4' : this.classType == CircularFingerprints.CLASS_ECFP6 ? 'ECFP6'
				   : '?';

		lines.push('Bayesian!(' + fpname + ',' + this.folding + ',' + this.lowThresh + ',' + this.highThresh + ')');

		// primary payload: the bit contributions
		let sorted:number[] = [];
		for (let hash in this.contribs) sorted.push(parseInt(hash));
		Vec.sort(sorted);
		for (let hash of sorted)
		{
			const c = this.contribs[hash];
			lines.push(hash + '=' + c);
		}

		// other information
		lines.push('training:size=' + this.trainingSize);
		lines.push('training:actives=' + this.trainingActives);

		if (!Number.isNaN(this.rocAUC)) lines.push('roc:auc=' + this.rocAUC);
		if (this.rocType != null) lines.push('roc:type=' + this.rocType);
		if (this.rocX != null && this.rocY != null)
		{
			let x = 'roc:x=';
			for (let n = 0; n < this.rocX.length; n++) x += (n == 0 ? '' : ',') + this.rocX[n];
			lines.push(x);

			let y = 'roc:y=';
			for (let n = 0; n < this.rocY.length; n++) y += (n == 0 ? '' : ',') + this.rocY[n];
			lines.push(y);
		}

		if (this.truthTP > 0 || this.truthFP > 0 || this.truthTN > 0 || this.truthFP > 0)
		{
			lines.push('truth:TP=' + this.truthTP);
			lines.push('truth:FP=' + this.truthFP);
			lines.push('truth:TN=' + this.truthTN);
			lines.push('truth:FN=' + this.truthFN);
			lines.push('truth:precision=' + this.precision);
			lines.push('truth:recall=' + this.recall);
			lines.push('truth:specificity=' + this.specificity);
			lines.push('truth:F1=' + this.statF1);
			lines.push('truth:kappa=' + this.statKappa);
			lines.push('truth:MCC=' + this.statMCC);
		}

		// notes: freeform user text
		if (this.noteTitle) lines.push('note:title=' + this.noteTitle);
		if (this.noteOrigin) lines.push('note:origin=' + this.noteOrigin);
		if (this.noteField) lines.push('note:field=' + this.noteField);
		if (this.noteComments) for (let comment of this.noteComments) lines.push('note:comment=' + comment);

		lines.push('!End');

		return lines.join('\n');
	}
	
	// transforms string back into model, if possible
	public static deserialise(str:string):BayesianModel
	{
		let lines = str.split('\n'), lnum = 0;
		function readLine() {return lnum >= lines.length ? null : lines[lnum++].trim();}

		let line = readLine();
		if (line == null || !line.startsWith('Bayesian!(') || !line.endsWith(')')) throw 'Not a serialised Bayesian model.';
		let bits = line.substring(10, line.length - 1).split(',');
		if (bits.length < 4) throw 'Invalid header content';

		let classType = bits[0] == 'ECFP0' ? CircularFingerprints.CLASS_ECFP0 : bits[0] == 'ECFP2' ? CircularFingerprints.CLASS_ECFP2
					  : bits[0] == 'ECFP4' ? CircularFingerprints.CLASS_ECFP4 : bits[0] == 'ECFP6' ? CircularFingerprints.CLASS_ECFP6
					  : 0;
		if (classType == 0) throw 'Unknown fingerprint type: ' + bits[0];

		let folding = parseInt(bits[1]);
		if (folding > 0) for (let f = folding; f > 0; f = f >> 1)
		{
			if ((f & 1) == 1 && f != 1)
			{
				folding = -1;
				break;
			}
		}
		if (folding < 0) throw 'Fingerprint folding ' + bits[1] + ' invalid: must be 0 or power of 2.';

		let model = new BayesianModel(classType, folding);
		model.lowThresh = parseFloat(bits[2]);
		model.highThresh = parseFloat(bits[3]);
		model.range = model.highThresh - model.lowThresh;
		model.invRange = model.range > 0 ? 1 / model.range : 0;

		const PTN_HASHLINE = new RegExp('^(-?\\d+)=([\\d\\.Ee-]+)');

		while (true)
		{
			line = readLine();
			if (line == null) throw 'Missing correct terminator line.';
			if (line == '!End') break;

			let match = PTN_HASHLINE.exec(line);
			if (match != null)
			{
				let hash = parseInt(match[1]);
				let c = parseFloat(match[2]);
				model.contribs[hash] = c;
			}
			else if (line.startsWith('training:size=')) model.trainingSize = parseInt(line.substring(14));
			else if (line.startsWith('training:actives=')) model.trainingActives = parseInt(line.substring(17));
			else if (line.startsWith('roc:auc=')) model.rocAUC = parseFloat(line.substring(8));
			else if (line.startsWith('roc:type=')) model.rocType = line.substring(9);
			else if (line.startsWith('roc:x='))
			{
				model.rocX = [];
				for (let str of line.substring(6).split(',')) model.rocX.push(parseFloat(str));
			}
			else if (line.startsWith('roc:y='))
			{
				model.rocY = [];
				for (let str of line.substring(6).split(',')) model.rocY.push(parseFloat(str));
			}
			else if (line.startsWith('truth:TP=')) model.truthTP = parseInt(line.substring(9), 0);
			else if (line.startsWith('truth:FP=')) model.truthFP = parseInt(line.substring(9), 0);
			else if (line.startsWith('truth:TN=')) model.truthTN = parseInt(line.substring(9), 0);
			else if (line.startsWith('truth:FN=')) model.truthFN = parseInt(line.substring(9), 0);
			else if (line.startsWith('truth:precision=')) model.precision = parseFloat(line.substring(16));
			else if (line.startsWith('truth:recall=')) model.recall = parseFloat(line.substring(13));
			else if (line.startsWith('truth:specificity=')) model.specificity = parseFloat(line.substring(18));
			else if (line.startsWith('truth:F1=')) model.statF1 = parseFloat(line.substring(9));
			else if (line.startsWith('truth:kappa=')) model.statKappa = parseFloat(line.substring(12));
			else if (line.startsWith('truth:MCC=')) model.statMCC = parseFloat(line.substring(10));
			else if (line.startsWith('note:title=')) model.noteTitle = line.substring(11);
			else if (line.startsWith('note:origin=')) model.noteOrigin = line.substring(12);
			else if (line.startsWith('note:field=')) model.noteField = line.substring(11);
			else if (line.startsWith('note:comment=')) 
			{
				if (model.noteComments == null) model.noteComments = [];
				model.noteComments.push(line.substring(13));
			}
		}

		return model;
	}

	// ----------------- private methods -----------------

	// estimate leave-one-out predictor for a given training entry
	private singleLeaveOneOut(idx:number):number
	{
		let exclActive = this.activity[idx];
		let exclSet = new Set<number>();
		for (let fp of this.training[idx]) exclSet.add(fp);

		const sz = this.training.length, szN = sz - 1;
		const invSzN = 1.0 / szN;
		const activeN = exclActive ? this.numActive - 1 : this.numActive;
		const P_AT = activeN * invSzN;

		let val = 0;
		for (let hashStr in this.inHash)
		{
			const hash = parseInt(hashStr);
			if (!exclSet.has(hash)) continue;
			const AT = this.inHash[hash];
			const A = AT[0] - (exclActive ? 1 : 0), T = AT[1] - 1;
			const Pcorr = (A + 1) / (T * P_AT + 1);
			const P = Math.log(Pcorr);
			val += P;
		}
		return val;
	}

	// validation with N segments
	private validateNfold(nsegs:number):void
	{
		// partition between active & inactive, just in case the mixture is heavily skewed
		const sz = this.training.length;
		let order = Vec.numberArray(0, sz);
		let p = 0;
		for (let n = 0; n < sz; n++) if (this.activity[n]) order[p++] = n;
		for (let n = 0; n < sz; n++) if (!this.activity[n]) order[p++] = n;

		// build N separate contribution models: each one of them build from the entities that are *not* in the segment
		let segContribs:{[id:number] : number}[] = [];
		for (let n = 0; n < nsegs; n++) segContribs.push(this.buildPartial(order, n, nsegs));

		// use the separate models to estimate the cases that were not covered
		this.estimates = Vec.numberArray(0, sz);
		for (let n = 0; n < sz; n++) this.estimates[order[n]] = this.estimatePartial(order, n, segContribs[n % nsegs]);
		this.calculateROC();
		this.calculateTruth();
	}

	// generates a contribution model based on all the training set for which (n%div)!=seg; e.g. for 5-fold, it would use the 80% of the training set
	// that is not implied by the current skein
	private buildPartial(order:number[], seg:number, div:number)
	{
		const sz = this.training.length;
		let na = 0, nt = 0;
		let ih:{[id:number] : number[]} = {};
		for (let n = 0; n < sz; n++)
		{
			if (n % div != seg)
			{
				const active = this.activity[order[n]];
				if (active) na++;
				nt++;
				for (let h of this.training[order[n]])
				{
					let stash = ih[h];
					if (stash == null) stash = [0, 0];
					if (active) stash[0]++;
					stash[1]++;
					ih[h] = stash;
				}
			}
		}

		let segContribs:{[id:number] : number} = {};

		const invSz = 1.0 / nt;
		const P_AT = na * invSz;
		for (let hashStr in ih)
		{
			let hash = parseInt(hashStr);
			const AT = ih[hash];
			const A = AT[0], T = AT[1];
			const Pcorr = (A + 1) / (T * P_AT + 1);
			const P = Math.log(Pcorr);
			segContribs[hash] = P;
		}

		return segContribs;
	}

	// using contributions build from some partial section of the training set, uses that to estimate for an untrained entry
	private estimatePartial(order:number[], idx:number, segContrib:{[id:number] : number}):number
	{
		let val = 0;
		for (let h of this.training[order[idx]])
		{
			let c = segContrib[h];
			if (c != null) val += c;
		}
		return val;
	}

	// assumes estimates already calculated, fills in the ROC data
	private calculateROC():void
	{
		// sort the available estimates, and take midpoints 
		const sz = this.training.length;
		let idx = Vec.idxSort(this.estimates);
		let thresholds:number[] = [];
		thresholds.push(this.lowThresh - 0.01 * this.range);
		for (let n = 0; n < sz - 1; n++)
		{
			const th1 = this.estimates[idx[n]], th2 = this.estimates[idx[n + 1]];
			if (th1 == th2) continue;
			thresholds.push(0.5 * (th1 + th2));
		}
		thresholds.push(this.highThresh + 0.01 * this.range);

		// x = false positives / actual negatives
		// y = true positives / actual positives
		this.rocX = [];
		this.rocY = [];
		let rocT:number[] = [];

		let posTrue = 0, posFalse = 0, ipos = 0;
		let invPos = 1.0 / this.numActive, invNeg = 1.0 / (sz - this.numActive);
		for (let n = 0; n < thresholds.length; n++)
		{
			const th = thresholds[n];
			for (; ipos < sz; ipos++)
			{
				if (th < this.estimates[idx[ipos]]) break;
				if (this.activity[idx[ipos]]) posTrue++;
				else posFalse++;
			}
			const x = posFalse * invNeg;
			const y = posTrue * invPos;
			const rsz = rocT.length;
			if (rsz > 0 && x == this.rocX[rsz - 1] && y == this.rocY[rsz - 1]) continue;

			this.rocX[rsz] = 1 - x;
			this.rocY[rsz] = 1 - y;
			rocT[rsz] = th;
		}

		this.rocX = Vec.reverse(this.rocX);
		this.rocY = Vec.reverse(this.rocY);
		rocT = Vec.reverse(rocT);

		this.calibrateThresholds(this.rocX, this.rocY, rocT);

		// calculate area-under-curve
		this.rocAUC = 0;
		for (let n = 0; n < rocT.length - 1; n++)
		{
			const w = this.rocX[n + 1] - this.rocX[n], h = 0.5 * (this.rocY[n] + this.rocY[n + 1]);
			this.rocAUC += w * h;
		}

		// collapse the {x,y} coords: no sensible reason to have huge number of points
		const DIST = 0.002, DSQ = DIST * DIST;
		let gx:number[] = [], gy:number[] = [];
		gx.push(this.rocX[0]);
		gy.push(this.rocY[0]);
		for (let i = 1; i < rocT.length - 1; i++)
		{
			const dx = this.rocX[i] - gx[gx.length - 1], dy = this.rocY[i] - gy[gy.length - 1];
			if (norm2_xy(dx, dy) < DSQ) continue;
			gx.push(this.rocX[i]);
			gy.push(this.rocY[i]);
		}
		gx.push(this.rocX[rocT.length - 1]);
		gy.push(this.rocY[rocT.length - 1]);
	}

	// builds the "truth table", which uses the calibration threshold to determine which side of the line each input molecule is on (with whichever
	// cross validation split was used for the ROC); from the 2x2 table, all the other metrics can also be derived
	private calculateTruth():void
	{
		let thresh = 0.5 * (this.lowThresh + this.highThresh);
		this.truthTP = this.truthFP = this.truthTN = this.truthFN = 0;
		for (let n = 0; n < this.activity.length; n++)
		{
			let actual = this.activity[n], predicted = this.estimates[n] >= thresh;
			if (actual && predicted) this.truthTP++;
			else if (!actual && predicted) this.truthFP++;
			else if (actual && !predicted) this.truthFN++;
			else if (!actual && !predicted) this.truthTN++;
		}

		const TP = this.truthTP, FP = this.truthFP, TN = this.truthTN, FN = this.truthFN;

		let invSize = 1.0 / this.activity.length;

		// calculate F1 score
		this.precision = TP / (TP + FP);
		this.recall = TP / (TP + FN);
		this.specificity = TN / (TN + FP);
		this.statF1 = 2 * (this.precision * this.recall) / (this.precision + this.recall);

		// calculate Cohen's kappa
		let Pyes = (TP + FP) * invSize * (TP + FN) * invSize;
		let Pno = (FP + TN) * invSize * (FN + TN) * invSize;
		let P0 = (TP + TN) * invSize, Pe = Pyes + Pno;
		this.statKappa = (P0 - Pe) / (1 - Pe);

		// calculate Matthews correlation coefficient
		let mccOver = TP * TN - FP * FN;
		let mccUnder = (TP + FP) * (TP + FN) * (TN + FP) * (TN + FN);
		this.statMCC = mccOver / Math.sqrt(mccUnder);
	}

	// rederives the low/high thresholds, using ROC curve data: once the analysis is complete, the midpoint will be the optimum balance 
	private calibrateThresholds(x:number[], y:number[], t:number[]):void
	{
		const sz = t.length;
		let idx = 0;
		for (let n = 1; n < sz; n++) if (y[n] - x[n] > y[idx] - x[idx]) idx = n;
		const midThresh = t[idx];
		let idxX = 0, idxY = sz - 1;
		for (; idxX < idx - 1; idxX++) if (x[idxX] > 0) break;
		for (; idxY > idx + 1; idxY--) if (y[idxY] < 1) break;
		let delta = Math.min(t[idxX] - midThresh, midThresh - t[idxY]);
		this.lowThresh = midThresh - delta;
		this.highThresh = midThresh + delta;
		this.range = 2 * delta;
		this.invRange = this.range > 0 ? 1 / this.range : 0;
	}

	// reapplies the fingerprint generation for a molecule, given that the outgoing indices are known already; it uses this
	// information to generate a mask for each of the indices, which describes the atoms that could lead to the fingerprint's
	// creation (including all of the possible redundancies)
	// note that the "approvedHashes" parameter is optional; it will be used to gather the numeric indices of the hashes
	// that were approved, i.e. the normal fingerprint list; done for performance reasons, to avoid recalculating
	public determineCoverage(mol:Molecule, approvedHashes:Set<number>):{[id:number] : boolean[]}
	{
		const na = mol.numAtoms;
		let cover:{[id:number] : boolean[]} = {};
		const andBits = this.folding == 0 ? 0xFFFFFFFF : this.folding - 1;

		let meta = MetaMolecule.createStrictRubric(mol);
		let circ = new CircularFingerprints(meta, this.classType);

		let collectFP = (fp:CircularFP):void =>
		{
			let idx = fp.hashCode & andBits;
			if (this.contribs[idx] == null) return; // hash bit not in the model, so abandon it
			let mask = cover[idx];
			if (mask == null)
			{
				mask = Vec.booleanArray(false, na);
				cover[idx] = mask;
			}
			for (let a of fp.atoms) mask[a - 1] = true;
		}
		circ.hookApplyNewFP = collectFP;
		circ.hookConsiderNewFP = collectFP;
		circ.calculate();

		// collect the "approved" hashes, i.e. the normal operation of the fingerprinter		
		if (approvedHashes != null)
		{
			let hashes = this.folding == 0 ? circ.getUniqueHashes() : circ.getFoldedHashes(this.folding);
			for (let h of hashes) approvedHashes.add(h);
		}

		return cover;
	}
}

/* EOF */ }