/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../gfx/MetaVector.ts'/>
///<reference path='../data/CoordUtil.ts'/>
///<reference path='../data/SketchUtil.ts'/>
///<reference path='TemplateFusion.ts'/>

namespace WebMolKit /* BOF */ {

/*
	MoleculeActivity: command-oriented modifications of the current molecular state.

	The invocation differs from the iOS/BlackBerry equivalents: rather than dividing each task into 2 parts, for testing
	whether an action is possible and actually carrying it out, there are two different functions: evaluate and execute.
	Evaluation is a very shallow analysis of whether a command has any chance of being relevant for the current state. If
	the amount of effort involved in figuring it out is non-trivial (e.g. requires an RPC), it will just return yes. The
	execution mode is charged with the duty of updating the EditMolecule state, or reporting any errors that might occur.
*/

export enum ActivityType
{
	Delete = 1,
	Clear,
	Copy,
	Cut,
	SelectAll,
	SelectNone,
	SelectPrevComp,
	SelectNextComp,
	SelectSide,
	SelectGrow,
	SelectShrink,
	SelectChain,
	SelectSmRing,
	SelectRingBlk,
	SelectCurElement,
	SelectToggle,
	SelectUnCurrent,
	Element,
	AtomPos,
	Charge,
	Connect,
	Disconnect,
	BondOrder,
	BondType,
	BondGeom,
	BondAtom,
	BondSwitch,
	BondAddTwo,
	BondInsert,
	Join,
	Nudge,
	NudgeLots,
	NudgeFar,
	Flip,
	Scale,
	Rotate,
	Move,
	Ring,
	/*BondDist,
	CycleBond,*/
	TemplateFusion,
	AbbrevTempl,
	AbbrevGroup,
	AbbrevFormula,
	AbbrevClear,
	AbbrevExpand,
	BondArtifactPath,
	BondArtifactRing,
	BondArtifactArene,
	BondArtifactClear,
}

export interface SketchState
{
	mol:Molecule;
	currentAtom:number;
	currentBond:number;
	selectedMask:boolean[];

	// only used in specific circumstances
	permutations?:FusionPermutation[];
}

export interface TemplatePermutation
{
	mol:string;
	display:string;
	molidx:number[];
	temidx:number[];
	srcidx:number[];
	metavec?:MetaVector;
}

export class MoleculeActivity
{
	public input:SketchState;
	private subjectMask:boolean[];
	private subjectIndex:number[];
	private subjectLength:number;
	private hasSelected:boolean;

	private output:SketchState;
	private errmsg:string;

	constructor(private owner:any, private activity:ActivityType, private param:any, override?:Record<string, any>)
	{
		this.input = owner.getState();
		this.output =
		{
			'mol': null,
			'currentAtom': -1,
			'currentBond': -1,
			'selectedMask': null
		};

		let altInput = this.input as Record<string, any>;
		for (let k in override) altInput[k] = override[k];

		let na = this.input.mol.numAtoms;
		if (this.input.selectedMask == null) this.input.selectedMask = Vec.booleanArray(false, na);
		while (this.input.selectedMask.length < na) this.input.selectedMask.push(false);
		this.subjectMask = this.input.selectedMask.slice(0);
		this.subjectLength = Vec.maskCount(this.subjectMask);
		this.subjectIndex = [];
		this.hasSelected = this.subjectLength > 0;

		if (this.subjectLength == 0)
		{
			if (this.input.currentAtom > 0)
			{
				this.subjectLength = 1;
				this.subjectMask[this.input.currentAtom - 1] = true;
				this.subjectIndex = [this.input.currentAtom];
			}
			else if (this.input.currentBond > 0)
			{
				let bfr = this.input.mol.bondFrom(this.input.currentBond), bto = this.input.mol.bondTo(this.input.currentBond);
				let b1 = Math.min(bfr, bto), b2 = Math.max(bfr, bto);
				this.subjectLength = 2;
				this.subjectMask[b1 - 1] = true;
				this.subjectMask[b2 - 1] = true;
				this.subjectIndex = [b1, b2];
			}
		}
		else
		{
			this.subjectIndex = Vec.maskIdx(this.subjectMask);
			Vec.addTo(this.subjectIndex, 1);
		}

		/*console.log('INPUT:' + JSON.stringify(this.input));
		console.log('subject:' + this.subjectIndex);
		console.log('mask: ' + this.subjectMask);*/
	}

	// --------------------------------------- public methods ---------------------------------------

	// returns false if the activity cannot be executed; errs on the side of generosity, i.e. false positives are to be expected
	public evaluate():boolean
	{
		// ... actually do it...
		return true;
	}

	// carries out the activity; some activities are performed immediately, while others require an RPC request; when it is finished,
	// the molecule state will be updated if successful, or an error will be displayed if not
	public execute():void
	{
		let param = this.param;

		if (this.activity == ActivityType.Delete)
		{
			this.execDelete();
			this.finish();
		}
		else if (this.activity == ActivityType.Clear)
		{
			this.execClear();
			this.finish();
		}
		else if (this.activity == ActivityType.Copy)
		{
			this.execCopy(false);
			this.finish();
		}
		else if (this.activity == ActivityType.Cut)
		{
			this.execCopy(true);
			this.finish();
		}
		else if (this.activity == ActivityType.SelectAll)
		{
			this.execSelectAll(true);
			this.finish();
		}
		else if (this.activity == ActivityType.SelectNone)
		{
			this.execSelectAll(false);
			this.finish();
		}
		else if (this.activity == ActivityType.SelectPrevComp)
		{
			this.execSelectComp(-1);
			this.finish();
		}
		else if (this.activity == ActivityType.SelectNextComp)
		{
			this.execSelectComp(1);
			this.finish();
		}
		else if (this.activity == ActivityType.SelectSide)
		{
			this.execSelectSide();
			this.finish();
		}
		else if (this.activity == ActivityType.SelectGrow)
		{
			this.execSelectGrow();
			this.finish();
		}
		else if (this.activity == ActivityType.SelectShrink)
		{
			this.execSelectShrink();
			this.finish();
		}
		else if (this.activity == ActivityType.SelectChain)
		{
			this.execSelectChain();
			this.finish();
		}
		else if (this.activity == ActivityType.SelectSmRing)
		{
			this.execSelectSmRing();
			this.finish();
		}
		else if (this.activity == ActivityType.SelectRingBlk)
		{
			this.execSelectRingBlk();
			this.finish();
		}
		else if (this.activity == ActivityType.SelectCurElement)
		{
			this.execSelectCurElement();
			this.finish();
		}
		else if (this.activity == ActivityType.SelectToggle)
		{
			this.execSelectToggle();
			this.finish();
		}
		else if (this.activity == ActivityType.SelectUnCurrent)
		{
			this.execSelectUnCurrent();
			this.finish();
		}
		else if (this.activity == ActivityType.Element)
		{
			this.execElement(param.element, param.positionX, param.positionY, param.keepAbbrev);
			this.finish();
		}
		else if (this.activity == ActivityType.Charge)
		{
			this.execCharge(param.delta);
			this.finish();
		}
		else if (this.activity == ActivityType.Connect)
		{
			this.execConnect(1, Molecule.BONDTYPE_NORMAL);
			this.finish();
		}
		else if (this.activity == ActivityType.Disconnect)
		{
			this.execDisconnect();
			this.finish();
		}
		else if (this.activity == ActivityType.BondOrder)
		{
			this.execBond(param.order, Molecule.BONDTYPE_NORMAL);
			this.finish();
		}
		else if (this.activity == ActivityType.BondType)
		{
			this.execBond(1, param.type);
			this.finish();
		}
		else if (this.activity == ActivityType.BondGeom)
		{
			this.execBondGeom(param.geom);
			this.finish();
		}
		else if (this.activity == ActivityType.BondAtom)
		{
			this.execBondAtom(param.order, param.type, param.element, param.x1, param.y1, param.x2, param.y2);
			this.finish();
		}
		else if (this.activity == ActivityType.BondSwitch)
		{
			this.execBondSwitch();
			this.finish();
		}
		else if (this.activity == ActivityType.BondAddTwo)
		{
			this.execBondAddTwo();
			this.finish();
		}
		else if (this.activity == ActivityType.BondInsert)
		{
			// !! TODO (use TemplateFusion)
		}
		else if (this.activity == ActivityType.Join)
		{
			this.execJoin();
			this.finish();
		}
		else if (this.activity == ActivityType.Nudge)
		{
			this.execNudge(param.dir, 0.1);
			this.finish();
		}
		else if (this.activity == ActivityType.NudgeLots)
		{
			this.execNudge(param.dir, 1);
			this.finish();
		}
		else if (this.activity == ActivityType.NudgeFar)
		{
			this.execNudgeFar(param.dir);
			this.finish();
		}
		else if (this.activity == ActivityType.Flip)
		{
			this.execFlip(param.axis);
			this.finish();
		}
		else if (this.activity == ActivityType.Scale)
		{
			this.execScale(param.mag);
			this.finish();
		}
		else if (this.activity == ActivityType.Rotate)
		{
			this.execRotate(param.theta, param.centreX, param.centreY);
			this.finish();
		}
		else if (this.activity == ActivityType.Move)
		{
			this.execMove(param.refAtom, param.deltaX, param.deltaY);
			this.finish();
		}
		else if (this.activity == ActivityType.Ring)
		{
			this.execRing(param.ringX, param.ringY, param.aromatic);
			this.finish();
		}
		/*else if (this.activity == ActivityType.BondDist)
		{
			// !!
		}
		else if (this.activity == ActivityType.CycleBond)
		{
			// !!
		}*/
		else if (this.activity == ActivityType.TemplateFusion)
		{
			this.execTemplateFusion(Molecule.fromString(param.fragNative));
			this.owner.setPermutations(this.output.permutations);
		}
		else if (this.activity == ActivityType.AbbrevTempl)
		{
			this.execAbbrevTempl();
			this.finish();
		}
		else if (this.activity == ActivityType.AbbrevGroup)
		{
			this.execAbbrevGroup();
			this.finish();
		}
		else if (this.activity == ActivityType.AbbrevFormula)
		{
			this.execAbbrevFormula();
			this.finish();
		}
		else if (this.activity == ActivityType.AbbrevClear)
		{
			this.execAbbrevClear();
			this.finish();
		}
		else if (this.activity == ActivityType.AbbrevExpand)
		{
			this.execAbbrevExpand();
			this.finish();
		}
		else if (this.activity == ActivityType.BondArtifactPath || this.activity == ActivityType.BondArtifactRing ||
				this.activity == ActivityType.BondArtifactArene || this.activity == ActivityType.BondArtifactClear)
		{
			this.execBondArtifact(this.activity);
			this.finish();
		}
	}

	// --------------------------------------- private methods ---------------------------------------

	// packages up an RPC request to get the job done
	/* deprecated: the sketcher originally did its work through this RPC fall, but now everything has been rewired
	private executeRPC(optype:string, xparam:any = {}):void
	{
		let param:any =
		{
			'tokenID': this.owner.tokenID
		};
		param.molNative = this.input.mol.toString();
		param.currentAtom = this.input.currentAtom;
		param.currentBond = this.input.currentBond;
		param.selectedMask = this.input.selectedMask;

		for (let xp in xparam) param[xp] = xparam[xp];

		let fcn = function(result:any, error:ErrorRPC)
		{
			if (!result)
			{
				alert('Sketching operation failed: ' + error.message);
				return;
			}
			if (result.molNative != null) this.output.mol = Molecule.fromString(result.molNative);
			if (result.currentAtom >= 0) this.output.currentAtom = result.currentAtom;
			if (result.currentBond >= 0) this.output.currentBond = result.currentBond;
			if (result.selectedMask != null) this.output.selectedMask = result.selectedMask;
			this.errmsg = result.errmsg;

			if (this.activity == ActivityType.TemplateFusion && result.permutations != null)
			{
				this.owner.setPermutations(result.permutations);
			}
			else this.finish();

			if ((this.activity == ActivityType.Copy || this.activity == ActivityType.Cut) && result.clipNative != null)
			{
				this.owner.performCopy(Molecule.fromString(result.clipNative));
			}
		};
		new RPC('sketch.' + optype, param, fcn, this).invoke();
	}*/

	// call this when execution has finished
	private finish():void
	{
		if (this.output.mol != null || this.output.currentAtom >= 0 || this.output.currentBond >= 0 || this.output.selectedMask != null)
		{
			this.owner.setState(this.output, true);

			if (this.errmsg != null) this.owner.showMessage(this.errmsg, false);
		}
		else
		{
			if (this.errmsg != null) this.owner.showMessage(this.errmsg, true);
		}
	}

	public execDelete():void
	{
		if (!this.requireSubject()) return;

		let mol = this.input.mol;

		this.output.mol = mol.clone();
		this.zapSubject();

		// if just a current bond, zap it
		if (this.input.currentBond > 0 && !this.hasSelected)
		{
			this.output.mol.deleteBond(this.input.currentBond);
			this.input.currentBond = 0;
			return;
		}

		// if a terminal atom, bump over the selection
		if (this.subjectLength == 1 && this.subjectIndex[0] == this.input.currentAtom)
		{
			let adj = mol.atomAdjList(this.input.currentAtom);
			if (adj.length == 1)
			{
				this.output.currentAtom = adj[0];
				if (this.output.currentAtom > this.input.currentAtom) this.output.currentAtom--;
			}
		}

		// do the deletion
		for (let n = this.subjectLength - 1; n >= 0; n--) this.output.mol.deleteAtomAndBonds(this.subjectIndex[n]);
	}

	public execCopy(withCut:boolean):void
	{
		let mol = this.input.mol;
		if (this.subjectLength > 0) mol = MolUtil.subgraphWithAttachments(mol, this.subjectMask);
		this.owner.performCopy(mol);

		if (withCut)
		{
			this.zapSubject();
			this.output.mol = MolUtil.subgraphMask(this.input.mol, Vec.notMask(this.subjectMask));
		}
	}

	public execClear():void
	{
		this.output.mol = new Molecule();
		this.zapSubject();
	}

	public execSelectAll(all:boolean):void
	{
		let same = true;
		for (let n = 0; n < this.input.mol.numAtoms; n++) if (this.subjectMask[n] != all)
		{
			same = false;
			break;
		}
		if (same)
		{
			this.errmsg = all ? 'All atoms already selected.' : 'All atoms already deselected.';
			return;
		}
		this.output.selectedMask = Vec.booleanArray(all, this.input.mol.numAtoms);
	}

	public execSelectComp(dir:number):void
	{
		let cclist = MolUtil.componentList(this.input.mol);
		if (cclist.length == 1 && this.hasSelected && this.subjectLength == this.input.mol.numAtoms)
		{
			this.errmsg = 'All atoms already selected.';
			return;
		}
		let sel = this.pickSelectedGroup(cclist, dir);
		this.output.selectedMask = Vec.booleanArray(false, this.input.mol.numAtoms);
		for (let n = 0; n < cclist[sel].length; n++) this.output.selectedMask[cclist[sel][n] - 1] = true;
	}

	public execSelectSide():void
	{
		if (!this.requireCurrent()) return;

		let mol = this.input.mol, currentAtom = this.input.currentAtom, currentBond = this.input.currentBond;

		if (currentAtom > 0 && mol.atomAdjCount(currentAtom) == 0)
		{
			this.errmsg = 'Current atom has no neighbours.';
			return;
		}
		if (currentBond > 0 && mol.atomAdjCount(mol.bondFrom(currentBond)) == 1 && mol.atomAdjCount(mol.bondTo(currentBond)) == 1)
		{
			this.errmsg = 'Current bond has no neighbours.';
			return;
		}

		let sides = currentAtom > 0 ? MolUtil.getAtomSides(mol, currentAtom) : MolUtil.getBondSides(mol, currentBond);
		let sel = this.pickSelectedGroup(sides, 1);
		this.output.selectedMask = Vec.booleanArray(false, mol.numAtoms);
		for (let n = 0; n < sides[sel].length; n++) this.output.selectedMask[sides[sel][n] - 1] = true;
	}

	public execSelectGrow():void
	{
		if (!this.requireSubject()) return;

		let mol = this.input.mol, currentAtom = this.input.currentAtom, currentBond = this.input.currentBond;
		this.output.selectedMask = this.input.selectedMask.slice(0);

		if (!this.hasSelected)
		{
			if (currentAtom > 0)
			{
				this.output.selectedMask[currentAtom - 1] = true;
			}
			else
			{
				this.output.selectedMask[mol.bondFrom(currentBond) - 1] = true;
				this.output.selectedMask[mol.bondTo(currentBond) - 1] = true;
			}
		}
		else
		{
			for (let n = 1; n <= mol.numBonds; n++)
			{
				let bfr = mol.bondFrom(n) - 1, bto = mol.bondTo(n) - 1;
				if (this.input.selectedMask[bfr] && !this.input.selectedMask[bto]) this.output.selectedMask[bto] = true;
				else if (this.input.selectedMask && !this.input.selectedMask[bfr]) this.output.selectedMask[bfr] = true;
			}
		}
	}

	public execSelectShrink():void
	{
		if (!this.requireSelected()) return;

		let mol = this.input.mol;
		let count = Vec.numberArray(0, mol.numAtoms);

		for (let n = 1; n <= mol.numBonds; n++)
		{
			let bfr = mol.bondFrom(n) - 1, bto = mol.bondTo(n) - 1;
			if (!this.input.selectedMask[bfr] || !this.input.selectedMask[bto]) continue;
			count[bfr]++;
			count[bto]++;
		}

		this.output.selectedMask = this.input.selectedMask.slice(0);
		for (let n = 0; n < mol.numAtoms; n++) this.output.selectedMask[n] = this.input.selectedMask[n] && count[n] >= 2;
	}

	public execSelectChain():void
	{
		if (!this.requireSubject()) return;

		let mol = this.input.mol;
		this.output.selectedMask = this.input.selectedMask.slice(0);

		for (let n = 1; n <= mol.numBonds; n++)
		{
			let bfr = mol.bondFrom(n) - 1, bto = mol.bondTo(n) - 1;
			if (this.input.selectedMask[bfr] && !this.input.selectedMask[bto] && mol.atomRingBlock(bto + 1) == 0) this.output.selectedMask[bto] = true;
			else if (this.input.selectedMask[bto] && !this.input.selectedMask[bfr] && mol.atomRingBlock(bfr + 1) == 0) this.output.selectedMask[bfr] = true;
		}
	}

	public execSelectSmRing():void
	{
		if (!this.requireSubject()) return;

		this.output.selectedMask = this.input.selectedMask.slice(0);

		for (let r = 3; r <= 8; r++)
		{
			let rings = this.input.mol.findRingsOfSize(r);
			for (let i = 0; i < rings.length; i++)
			{
				let any = false;
				for (let j = 0; j < rings[i].length; j++) if (this.subjectMask[rings[i][j] - 1])
				{
					any = true;
					break;
				}
				if (any) for (let j = 0; j < rings[i].length; j++) this.output.selectedMask[rings[i][j] - 1] = true;
			}
		}
	}

	public execSelectRingBlk():void
	{
		if (!this.requireSubject()) return;

		let mol = this.input.mol;
		this.output.selectedMask = this.input.selectedMask.slice(0);

		let maxRB = 0;
		for (let n = 1; n <= mol.numAtoms; n++) maxRB = Math.max(maxRB, mol.atomRingBlock(n));
		if (maxRB == 0) return;

		let gotRB = Vec.booleanArray(false, maxRB);
		for (let n = 1; n <= mol.numAtoms; n++)
		{
			let rb = mol.atomRingBlock(n);
			if (rb > 0 && this.subjectMask[n - 1]) gotRB[rb - 1] = true;
		}
		for (let n = 1; n <= mol.numAtoms; n++)
		{
			let rb = mol.atomRingBlock(n);
			if (rb > 0 && gotRB[rb - 1]) this.output.selectedMask[n - 1] = true;
		}
	}

	public execSelectCurElement():void
	{
		if (!this.requireCurrent()) return;

		let mol = this.input.mol;
		this.output.selectedMask = this.input.selectedMask.slice(0);

		let el1 = '', el2 = '';
		if (this.input.currentAtom > 0)
		{
			el1 = mol.atomElement(this.input.currentAtom);
		}
		else
		{
			el1 = mol.atomElement(mol.bondFrom(this.input.currentBond));
			el2 = mol.atomElement(mol.bondTo(this.input.currentBond));
		}
		for (let n = 1; n <= mol.numAtoms; n++)
			if (mol.atomElement(n) == el1 || mol.atomElement(n) == el2) this.output.selectedMask[n - 1] = true;
	}

	public execSelectToggle():void
	{
		if (!this.requireCurrent()) return;

		this.output.selectedMask = this.input.selectedMask.slice(0);

		if (this.input.currentAtom > 0)
		{
			this.output.selectedMask[this.input.currentAtom - 1] = !this.output.selectedMask[this.input.currentAtom - 1];
		}
		else
		{
			let bfr = this.input.mol.bondFrom(this.input.currentBond), bto = this.input.mol.bondTo(this.input.currentBond);
			let sel = !this.input.selectedMask[bfr - 1] || !this.input.selectedMask[bto - 1];
			this.output.selectedMask[bfr - 1] = sel;
			this.output.selectedMask[bto - 1] = sel;
		}
	}

	public execSelectUnCurrent():void
	{
		if (!this.requireCurrent()) return;

		this.output.selectedMask = this.input.selectedMask.slice(0);

		if (this.input.currentAtom > 0)
		{
			this.output.selectedMask[this.input.currentAtom - 1] = false;
		}
		else
		{
			this.output.selectedMask[this.input.mol.bondFrom(this.input.currentBond) - 1] = false;
			this.output.selectedMask[this.input.mol.bondTo(this.input.currentBond) - 1] = false;
		}
	}

	public execElement(element:string, positionX?:number, positionY?:number, keepAbbrev?:boolean):void
	{
		if (this.subjectLength > 0)
		{
			let anyChange = false;
			for (let n = 0; n < this.subjectLength; n++) if (this.input.mol.atomElement(this.subjectIndex[n]) != element)
			{
				anyChange = true;
				break;
			}
			if (!anyChange)
			{
				this.errmsg = 'Elements not changed.';
				return;
			}
		}

		this.output.mol = this.input.mol.clone();

		// when there's no subject, this is an add-atom operation
		if (this.subjectLength == 0)
		{
			if (positionX != null && positionY != null)
				this.output.mol.addAtom(element, positionX, positionY);
			else
				SketchUtil.placeNewAtom(this.output.mol, element);
		}
		else // there is a subject, so it's a change-atom operation
		{
			for (let n = 0; n < this.subjectLength; n++)
			{
				if (keepAbbrev)
					this.output.mol.setAtomElement(this.subjectIndex[n], element);
				else
					MolUtil.setAtomElement(this.output.mol, this.subjectIndex[n], element);
			}
		}
	}

	public execCharge(delta:number):void
	{
		if (!this.requireSubject()) return;

		this.output.mol = this.input.mol.clone();
		for (let n = 0; n < this.subjectLength; n++)
		{
			let chg = Math.max(-20, Math.min(20, this.input.mol.atomCharge(this.subjectIndex[n]) + delta));
			this.output.mol.setAtomCharge(this.subjectIndex[n], chg);
		}
	}

	public execConnect(order:number, type:number):void
	{
		if (!this.requireSubject()) return;

		let conn = SketchUtil.pickAtomsToConnect(this.input.mol, this.subjectIndex);
		if (conn == null)
		{
			this.errmsg = 'Subject atoms contain no bonds suitable for connection.';
			return;
		}

		this.output.mol = this.input.mol.clone();
		for (let n = 0; n < conn.length; n += 2) MolUtil.addBond(this.output.mol, conn[n], conn[n + 1], order, type);
	}

	public execDisconnect():void
	{
		let zap:number[] = [];

		let mol = this.input.mol;

		if (this.hasSelected)
		{
			for (let n = 1; n <= mol.numBonds; n++) if (this.subjectMask[mol.bondFrom(n) - 1] && this.subjectMask[mol.bondTo(n) - 1]) zap.push(n);
		}
		else if (this.input.currentAtom > 0)
		{
			for (let a of mol.atomAdjBonds(this.input.currentAtom)) zap.push(a);
		}
		else if (this.input.currentBond > 0)
		{
			zap.push(this.input.currentBond);
		}
		if (zap.length == 0)
		{
			this.errmsg = 'Subject atoms contain no bonds suitable for disconnection.';
			return;
		}

		let killmask = Vec.booleanArray(false, mol.numBonds);
		for (let b of zap) killmask[b - 1] = true;

		this.output.mol = this.input.mol.clone();
		for (let n = mol.numBonds; n >= 1; n--) if (killmask[n - 1]) this.output.mol.deleteBond(n);
	}

	public execBond(order:number, type:number):void
	{
		if (!this.requireSubject()) return;

		// one atom subject: this is a request for a new bond
		if (this.subjectLength == 1)
		{
			this.performBondNew(this.subjectIndex[0], order, type);
			return;
		}

		// see whether the selected atoms are from 2 disconnected groups, which determines whether it's a change-order operation
		// or a connect operation
		let ccmol = MolUtil.subgraphMask(this.input.mol, this.subjectMask);
		let oneComp = true;
		for (let n = ccmol.numAtoms; n >= 1; n--) if (ccmol.atomConnComp(n) != 1) {oneComp = false; break;}
		if (oneComp)
			this.performBondChange(order, type);
		else
			this.execConnect(order, type);
	}

	public execBondGeom(geom:number):void
	{
		let bond = this.subjectLength == 2 ? this.input.mol.findBond(this.subjectIndex[0], this.subjectIndex[1]) : 0;
		if (this.subjectLength == 0 || this.subjectLength > 2 || (this.subjectLength == 2 && bond == 0))
		{
			this.errmsg = 'The subject must be a single atom or bond.';
			return;
		}

		if (this.subjectLength == 1)
			this.performBondGeomAtom(geom, this.subjectIndex[0]);
		else
			this.performBondGeomBond(geom, bond);
	}

	public execBondAtom(order:number, type:number, element:string, x1:number, y1:number, x2:number, y2:number):void
	{
		let mol = this.input.mol;
		let a1 = CoordUtil.atomAtPoint(mol, x1, y1, 0.01), a2 = CoordUtil.atomAtPoint(mol, x2, y2, 0.01);
		if (a1 > 0 && a2 > 0 && mol.findBond(a1, a2) > 0) return;

		this.output.mol = mol.clone();

		if (a1 == 0) a1 = this.output.mol.addAtom('C', x1, y1);
		if (a2 == 0) a2 = this.output.mol.addAtom(element, x2, y2);
		this.output.mol.addBond(a1, a2, order, type);
	}

	public execBondSwitch():void
	{
		if (!this.requireSubject()) return;

		let mol = this.input.mol;

		// decide which bonds are applicable
		let src = 0, dst:number[] = [];
		if (this.subjectLength == 1)
		{
			src = this.subjectIndex[0];
			let adj = mol.atomAdjList(src);
			for (let n = 0; n < adj.length; n++) if (mol.atomAdjCount(adj[n]) == 1) dst.push(adj[n]);
		}
		else if (this.subjectLength == 2 && mol.findBond(this.subjectIndex[0], this.subjectIndex[1]) > 0)
		{
			let ac1 = mol.atomAdjCount(this.subjectIndex[0]), ac2 = mol.atomAdjCount(this.subjectIndex[1]);
			if (ac1 > 1 && ac2 == 1)
			{
				src = this.subjectIndex[0];
				dst.push(this.subjectIndex[1]);
			}
			else if (ac1 == 1 && ac2 > 1)
			{
				src = this.subjectIndex[1];
				dst.push(this.subjectIndex[0]);
			}
		}

		if (src == 0 || dst.length == 0)
		{
			this.errmsg = 'Subject must include a terminal bond.';
			return;
		}

		let geoms = SketchUtil.guessAtomGeometry(mol, src, 1);
		if (geoms.length == 0)
		{
			this.errmsg = 'No alternative geometries identified.';
			return;
		}

		this.output.mol = SketchUtil.switchAtomGeometry(mol, src, dst, geoms);
		if (this.output.mol == null)
		{
			this.errmsg = 'No alternative geometries identified.';
		}
	}

	public execBondAddTwo():void
	{
		if (this.subjectLength != 1)
		{
			this.errmsg = 'Subject must be a single atom.';
			return;
		}
		let atom = this.subjectIndex[0];
		if (this.input.mol.atomAdjCount(atom) < 2)
		{
			this.errmsg = 'Subject atom must already have at least 2 bonds.';
			return;
		}

		let ang = SketchUtil.calculateNewBondAngles(this.input.mol, atom, 1);
		if (ang.length == 0) ang = SketchUtil.exitVectors(this.input.mol, atom);
		if (ang.length == 0)
		{
			this.errmsg = 'Could not find a suitable geometry for new substituents.';
			return;
		}

		let baseAng = ang[0];
		let cx = this.input.mol.atomX(atom), cy = this.input.mol.atomY(atom);
		if (ang.length > 1)
		{
			let best = 0;
			for (let n = 0; n < ang.length; n++)
			{
				let x = cx + Molecule.IDEALBOND * Math.cos(ang[n]);
				let y = cy + Molecule.IDEALBOND * Math.sin(ang[n]);
				let score = CoordUtil.congestionPoint(this.input.mol, x, y);
				if (n == 0 || score < best) {best = score; baseAng = ang[n];}
			}
		}

		let ang1 = baseAng - 30.0 * DEGRAD, ang2 = baseAng + 30.0 * DEGRAD;

		// NOTE: maybe try out variations? ... may be better to just leave it as the entirely predictable 60 degrees...

		let mol = this.input.mol.clone();
		let a1 = mol.addAtom('C', cx + Molecule.IDEALBOND * Math.cos(ang1), cy + Molecule.IDEALBOND * Math.sin(ang1));
		let a2 = mol.addAtom('C', cx + Molecule.IDEALBOND * Math.cos(ang2), cy + Molecule.IDEALBOND * Math.sin(ang2));
		mol.addBond(atom, a1, 1);
		mol.addBond(atom, a2, 1);
		this.output.mol = mol;
	}

	public execJoin():void
	{
		if (!this.requireSubject()) return;

		this.output.mol = SketchUtil.joinOverlappingAtoms(this.input.mol, this.subjectMask);

		if (this.output.mol == null)
		{
			this.errmsg = 'Subject contains no overlapping atoms.';
		}
		else
		{
			this.zapSubject();
		}
	}

	public execNudge(dir:string, extent:number):void
	{
		if (!this.requireSubject()) return;

		let dx = extent * (dir == 'left' ? -1 : dir == 'right' ? 1 : 0);
		let dy = extent * (dir == 'down' ? -1 : dir == 'up' ? 1 : 0);

		this.output.mol = this.input.mol.clone();
		for (let n = 0; n < this.subjectLength; n++)
		{
			let x = this.output.mol.atomX(this.subjectIndex[n]), y = this.output.mol.atomY(this.subjectIndex[n]);
			this.output.mol.setAtomPos(this.subjectIndex[n], x + dx, y + dy);
		}
	}

	public execNudgeFar(dir:string):void
	{
		if (!this.requireSubject()) return;
		if (this.subjectLength == this.input.mol.numAtoms)
		{
			this.errmsg = 'Cannot apply to entire molecule.';
			return;
		}

		let dx = dir == 'left' ? -1 : dir == 'right' ? 1 : 0;
		let dy = dir == 'down' ? -1 : dir == 'up' ? 1 : 0;

		this.output.mol = SketchUtil.moveToEdge(this.input.mol, this.subjectMask, dx, dy);
		if (this.output.mol == null)
		{
			this.execNudge(dir, 1); // convert it to a nudge-lots operation
		}
	}

	public execFlip(axis:string):void
	{
		if (this.input.mol.numAtoms < 2)
		{
			this.errmsg = 'At least 2 atoms are required.';
			return;
		}
		let isVertical = axis == 'ver'; // else 'hor'

		// decide where the centre of gravity is, and which atoms are to be affected
		let cx = 0, cy = 0;
		let mask = this.subjectMask, mol = this.input.mol;
		if (this.input.currentAtom > 0)
		{
			cx = mol.atomX(this.input.currentAtom);
			cy = mol.atomY(this.input.currentAtom);
			if (!this.hasSelected)
			{
				mask = Vec.booleanArray(false, mol.numAtoms);
				let cc = mol.atomConnComp(this.input.currentAtom);
				for (let n = 1; n <= mol.numAtoms; n++) mask[n - 1] = mol.atomConnComp(n) == cc;
			}
		}
		else if (this.input.currentBond > 0)
		{
			let bfr = mol.bondFrom(this.input.currentBond), bto = mol.bondTo(this.input.currentBond);
			cx = 0.5 * (mol.atomX(bfr) + mol.atomX(bto));
			cy = 0.5 * (mol.atomY(bfr) + mol.atomY(bto));
			if (!this.hasSelected)
			{
				mask = Vec.booleanArray(false, mol.numAtoms);
				let cc = mol.atomConnComp(bfr);
				for (let n = 1; n <= mol.numAtoms; n++) mask[n - 1] = mol.atomConnComp(n) == cc;
			}
		}
		else if (this.subjectLength == 0)
		{
			let box = mol.boundary();
			cx = 0.5 * (box.minX() + box.maxX());
			cy = 0.5 * (box.minY() + box.maxY());
			mask = Vec.booleanArray(true, mol.numAtoms);
		}
		else
		{
			for (let n = 0; n < this.subjectLength; n++)
			{
				cx += mol.atomX(this.subjectIndex[n]);
				cy += mol.atomY(this.subjectIndex[n]);
			}
			let invSz = 1.0 / this.subjectLength;
			cx *= invSz;
			cy *= invSz;
		}

		// perform the flip
		this.output.mol = mol.clone();
		for (let n = 1; n <= mol.numAtoms; n++) if (mask[n - 1])
		{
			if (!isVertical)
				this.output.mol.setAtomX(n, 2 * cx - this.output.mol.atomX(n));
			else
				this.output.mol.setAtomY(n, 2 * cy - this.output.mol.atomY(n));
		}
	}

	public execScale(mag:number):void
	{
		if (this.input.mol.numAtoms < 2)
		{
			this.errmsg = 'At least 2 atoms are required.';
			return;
		}

		// special case: subject indicates a non-ring bond, so magnify the bond distance, and shift the component of one/both sides
		let mol = this.input.mol;
		let b:number;
		if (this.subjectLength == 2 && (b = mol.findBond(this.subjectIndex[0], this.subjectIndex[1])) > 0 && !mol.bondInRing(b))
		{
			let a1 = this.subjectIndex[0], a2 = this.subjectIndex[1];
			let ccmol = mol.clone();
			ccmol.deleteBond(b);
			let idx1:number[] = [], idx2:number[] = [];
			for (let n = 1; n <= ccmol.numAtoms; n++)
			{
				if (ccmol.atomConnComp(n) == ccmol.atomConnComp(a1)) idx1.push(n);
				else if (ccmol.atomConnComp(n) == ccmol.atomConnComp(a2)) idx2.push(n);
			}
			let dx = (mol.atomX(a2) - mol.atomX(a1)) * (mag - 1);
			let dy = (mol.atomY(a2) - mol.atomY(a1)) * (mag - 1);
			if (idx1.length == idx2.length) {dx *= 0.5; dy *= 0.5;}

			this.output.mol = mol.clone();

			if (idx1.length <= idx2.length) for (let n = 0; n < idx1.length; n++)
			{
				let a = idx1[n];
				this.output.mol.setAtomPos(a, this.output.mol.atomX(a) - dx, this.output.mol.atomY(a) - dy);
			}
			if (idx2.length <= idx1.length) for (let n = 0; n < idx2.length; n++)
			{
				let a = idx2[n];
				this.output.mol.setAtomPos(a, this.output.mol.atomX(a) + dx, this.output.mol.atomY(a) + dy);
			}

			return;
		}

		// scale about centre of gravity
		let cx = 0, cy = 0;
		if (this.input.currentAtom > 0)
		{
			cx = mol.atomX(this.input.currentAtom);
			cy = mol.atomY(this.input.currentAtom);
		}
		else if (this.input.currentBond > 0)
		{
			let bfr = mol.bondFrom(this.input.currentBond), bto = mol.bondTo(this.input.currentBond);
			cx = 0.5 * (mol.atomX(bfr) + mol.atomX(bto));
			cy = 0.5 * (mol.atomY(bfr) + mol.atomY(bto));
		}
		else
		{
			for (let n = 0; n < this.subjectLength; n++)
			{
				cx += mol.atomX(this.subjectIndex[n]);
				cy += mol.atomY(this.subjectIndex[n]);
			}
			let invSz = 1.0 / this.subjectLength;
			cx *= invSz;
			cy *= invSz;
		}

		this.output.mol = mol.clone();
		for (let n = 0; n < this.subjectLength; n++)
		{
			let x = this.output.mol.atomX(this.subjectIndex[n]);
			let y = this.output.mol.atomY(this.subjectIndex[n]);
			this.output.mol.setAtomPos(this.subjectIndex[n], (x - cx) * mag + cx, (y - cy) * mag + cy);
		}
	}

	public execRotate(theta:number, centreX:number, centreY:number):void
	{
		theta *= DEGRAD; // (parameter is in degrees)

		let mol = this.input.mol;

		// if a centre position is indicated, use that
		if (centreX != null && centreY != null)
		{
			this.output.mol = mol.clone();
			let mask = this.subjectLength == 0 ? Vec.booleanArray(true, mol.numAtoms) : this.subjectMask;
			CoordUtil.rotateAtoms(this.output.mol, mask, centreX, centreY, theta);
			return;
		}

		if (mol.numAtoms < 2)
		{
			this.errmsg = 'At least 2 atoms are required.';
			return;
		}

		// decide where the centre of gravity is, and which atoms are to be affected
		let cx = 0, cy = 0;
		let mask = this.subjectMask;
		if (this.input.currentAtom > 0)
		{
			cx = mol.atomX(this.input.currentAtom);
			cy = mol.atomY(this.input.currentAtom);
			if (!this.hasSelected)
			{
				mask = Vec.booleanArray(false, mol.numAtoms);
				let cc = mol.atomConnComp(this.input.currentAtom);
				for (let n = 1; n <= mol.numAtoms; n++) mask[n - 1] = mol.atomConnComp(n) == cc;
			}
		}
		else if (this.input.currentBond > 0)
		{
			let bfr = mol.bondFrom(this.input.currentBond), bto = mol.bondTo(this.input.currentBond);
			cx = 0.5 * (mol.atomX(bfr) + mol.atomX(bto));
			cy = 0.5 * (mol.atomY(bfr) + mol.atomY(bto));
			if (!this.hasSelected)
			{
				mask = Vec.booleanArray(false, mol.numAtoms);
				let cc = mol.atomConnComp(bfr);
				for (let n = 1; n <= mol.numAtoms; n++) mask[n - 1] = mol.atomConnComp(n) == cc;
			}
		}
		else if (this.subjectLength == 0)
		{
			let box = mol.boundary();
			cx = 0.5 * (box.minX() + box.maxX());
			cy = 0.5 * (box.minY() + box.maxY());
			mask = Vec.booleanArray(true, mol.numAtoms);
		}
		else
		{
			for (let n = 0; n < this.subjectLength; n++)
			{
				cx += mol.atomX(this.subjectIndex[n]);
				cy += mol.atomY(this.subjectIndex[n]);
			}
			let invSz = 1.0 / this.subjectLength;
			cx *= invSz;
			cy *= invSz;
		}

		// perform the rotation
		this.output.mol = mol.clone();
		CoordUtil.rotateAtoms(this.output.mol, mask, cx, cy, theta);
	}

	public execMove(refAtom:number, deltaX:number, deltaY:number):void
	{
		let subj = this.subjectIndex;
		if (Vec.arrayLength(subj) == 0) subj = [refAtom];

		this.output.mol = this.input.mol.clone();
		for (let a of subj) this.output.mol.setAtomPos(a, this.output.mol.atomX(a) + deltaX, this.output.mol.atomY(a) + deltaY);
	}

	public execRing(ringX:number[], ringY:number[], aromatic:boolean):void
	{
		let rsz = ringX.length;
		let atoms = Vec.numberArray(0, rsz), bonds = Vec.numberArray(0, rsz);

		let outmol = this.input.mol.clone();
		for (let n = 0; n < rsz; n++)
		{
			atoms[n] = CoordUtil.atomAtPoint(outmol, ringX[n], ringY[n]);
			if (atoms[n] == 0) atoms[n] = outmol.addAtom('C', ringX[n], ringY[n]);
		}
		for (let n = 0; n < rsz; n++)
		{
			let nn = n < rsz - 1 ? n + 1 : 0;
			bonds[n] = outmol.findBond(atoms[n], atoms[nn]);
			if (bonds[n] == 0) bonds[n] = outmol.addBond(atoms[n], atoms[nn], 1);
		}

		// if aromaticity is desired, do an extremely crude Kekulisation
		if (aromatic)
		{
			let valence = Vec.numberArray(0, rsz);
			let pi = Vec.booleanArray(false, rsz);
			for (let n = 0; n < rsz; n++)
			{
				valence[n] = Chemistry.ELEMENT_BONDING[outmol.atomicNumber(atoms[n])] + outmol.atomCharge(atoms[n]);
				if (outmol.atomHExplicit(atoms[n]) != Molecule.HEXPLICIT_UNKNOWN) valence[n] -= outmol.atomHExplicit(atoms[n]);
				for (let b of outmol.atomAdjBonds(atoms[n])) valence[n] -= outmol.bondOrder(b);
				if (outmol.bondOrder(bonds[n]) >= 2)
				{
					pi[n] = true;
					if (n < rsz - 1)
					{
						pi[n] = true;
						n++;
					}
					else pi[0] = true;
				}
			}
			for (let n = 0; n < rsz; n++)
			{
				let nn = n < rsz - 1 ? n + 1 : 0;
				if (pi[n] || pi[nn]) continue;

				if (valence[n] > 0 && valence[nn] > 0)
				{
					outmol.setBondOrder(bonds[n], 2);
					pi[n] = true;
					pi[nn] = true;
					valence[n]--;
					valence[nn]--;
				}
			}
		}

		this.output.mol = outmol;
	}

	public execTemplateFusion(frag:Molecule):void
	{
		let mol = this.input.mol;
		let fusion = new TemplateFusion(mol, frag, '');
		if (this.subjectLength == 0) fusion.permuteNone();
		else if (this.subjectLength == 1) fusion.permuteAtom(this.subjectIndex[0]);
		else if (this.subjectLength == 2 && mol.findBond(this.subjectIndex[0], this.subjectIndex[1]) > 0)
			fusion.permuteBond(this.subjectIndex[0], this.subjectIndex[1]);
		else fusion.permuteMulti(this.subjectIndex);

		// package up the results
		let permutations:any[] = [];
		for (let perm of fusion.perms)
		{
			let obj:Record<string, any> = {};
			obj['mol'] = perm.mol.toString();
			obj['display'] = perm.display.toString();
			obj['molidx'] = perm.molidx;
			obj['temidx'] = perm.temidx;
			obj['srcidx'] = perm.srcidx;
			permutations.push(obj);
		}
		this.output.permutations = permutations;
	}

	public execAbbrevTempl():void
	{
		/*
		// note: 'fusion' needs to ensure that permutation 0 is the one to use
		let perm = fusion.getPerm(0)
		let fused = perm.mol
		var srcidx = perm.srcidx

		// consider the possibility that we might be wanting to convert a terminal atom directly into an abbreviation
		let midx = perm.midx
		let markback = (!perm.bridged && !perm.guided && midx.count == 1 && instate.mol.atomAdjCount(midx[0]) == 1)
					|| (perm.guided && midx.count == 1 && fusion.numAttach == 2)
		if markback
		{
			let i = indexOf(midx[0], srcidx)
			if i >= 0 {srcidx[i] = 0} // mark it part of the graft-on, not the original
		}

		// see if it really can be done
		var srcmask = boolArray(false, srcidx.count)
		for n in 0 ..< srcidx.count {srcmask[n] = srcidx[n] > 0}
		let mol = MolUtil.convertToAbbrev(fused, srcmask:srcmask, abbrevName:fusion.abbrev)
		if mol == nil
		{
			message = "Inline abbreviations must be terminal with exactly one attachment point.";
			return false
		}

		if !doCommit {return true}

		zapSubject()
		outstate.mol = mol!
		outstate.currentAtom = mol!.numAtoms

		return true
*/
	}

	public execAbbrevGroup():void
	{
		if (!this.requireSubject()) return;
		if (!this.checkAbbreviationReady()) return;

		let mol = MolUtil.convertToAbbrev(this.input.mol, Vec.notMask(this.subjectMask), '?');
		if (mol == null)
		{
			// (probably already filtered out from above)
			this.errmsg = 'Inline abbreviations must be terminal with exactly one attachment point.';
			return;
		}

		this.output.mol = mol;
		this.zapSubject();
		this.output.currentAtom = mol.numAtoms;
	}

	public execAbbrevFormula():void
	{
		if (!this.requireSubject()) return;
		if (!this.checkAbbreviationReady()) return;

		let fixed = this.input.mol.clone();
		for (let n = 1; n <= fixed.numAtoms; n++) fixed.setAtomHExplicit(n, fixed.atomHydrogens(n));
		let abv = MolUtil.subgraphMask(fixed, this.subjectMask);
		let formula = MolUtil.molecularFormula(abv, true);

		let mol = MolUtil.convertToAbbrev(this.input.mol, Vec.notMask(this.subjectMask), formula);
		if (mol == null)
		{
			// (probably already filtered out from above)
			this.errmsg = 'Inline abbreviations must be terminal with exactly one attachment point.';
			return;
		}

		this.output.mol = mol;
		this.zapSubject();
		this.output.currentAtom = mol.numAtoms;
	}

	public execAbbrevClear():void
	{
		let idx:number[] = [];
		for (let n of this.subjectIndex) if (MolUtil.hasAbbrev(this.input.mol, n)) idx.push(n);

		if (idx.length == 0)
		{
			this.errmsg = 'No abbreviations to clear.';
			return;
		}

		let mol = this.input.mol.clone();
		for (let n of idx) MolUtil.clearAbbrev(mol, n);
		this.output.mol = mol;
	}

	public execAbbrevExpand():void
	{
		let idx:number[] = [];
		for (let n of this.subjectIndex) if (MolUtil.hasAbbrev(this.input.mol, n)) idx.push(n);

		if (idx.length == 0)
		{
			this.errmsg = 'No abbreviations to expand.';
			return;
		}

		let mol = this.input.mol.clone();
		for (let n of idx) MolUtil.expandOneAbbrev(mol, n, true);
		this.output.mol = mol;
	}

	public execBondArtifact(activity:ActivityType):void
	{
		if (!this.requireAtoms() || !this.requireSubject()) return;

		let artif = new BondArtifact(this.input.mol.clone());
		let subject = this.subjectIndex.slice(0), curAtom = this.input.currentAtom;
		if (curAtom > 0 && subject.indexOf(curAtom) < 0) subject.push(curAtom);

		if (activity == ActivityType.BondArtifactPath)
		{
			if (!artif.createPath(subject)) {this.errmsg = 'Path artifact not suitable.'; return;}
		}
		else if (activity == ActivityType.BondArtifactRing)
		{
			if (!artif.createRing(subject)) {this.errmsg = 'Ring artifact not suitable.'; return;}
		}
		else if (activity == ActivityType.BondArtifactArene)
		{
			if (!artif.createArene(subject)) {this.errmsg = 'Arene artifact not suitable.'; return;}
		}
		else if (activity == ActivityType.BondArtifactClear)
		{
			if (!artif.removeArtifact(subject)) {this.errmsg = 'No artifact removed.'; return;}
		}

		artif.rewriteMolecule();
		this.output.mol = artif.mol;
	}

	/*
	// input: (standard)
	// output: (standard)
	public void execBondInsert() throws Exception
	{
		if (!requireSubject()) return;

		if (currentBond == 0)
		{
			errmsg = 'There must be a current bond.';
			return;
		}
		if (mol.bondInRing(currentBond))
		{
			errmsg = 'Cannot insert into a ring-bond.';
			return;
		}

		int[][] sides = MolUtil.getBondSides(mol, currentBond);
		int[] side1 = sides[0], side2 = sides[1];
		int[] atoms = null;
		int a1 = mol.bondFrom(currentBond), a2 = mol.bondTo(currentBond);
		boolean sel1 = selectedMask[a1 - 1], sel2 = selectedMask[a2 - 1];
		if (sel1 && !sel2) atoms = side1;
		else if (!sel1 && sel2) atoms = side2;
		else if (side1.length < side2.length) atoms = side1;
		else atoms = side2;

		int alink = Vec.indexOf(a1, atoms) >= 0 ? a1 : a2;
		outmol = mol.clone();
		outmol.setBondOrder(currentBond, 1);

		boolean[] fragmask = Vec.booleanArray(false, mol.numAtoms);
		for (int n = 0; n < atoms.length; n++) fragmask[atoms[n] - 1] = true;
		Molecule frag = MolUtil.subgraphWithAttachments(outmol, fragmask);

		for (int n = outmol.numAtoms; n >= 1; n--) if (fragmask[n - 1] && n != alink)
		{
			outmol.deleteAtomAndBonds(n);
			if (n < alink) alink--;
		}

		mol.setAtomElement(alink, "C");
		mol.setAtomCharge(alink, 0);
		mol.setAtomUnpaired(alink, 0);
		mol.setAtomHExplicit(alink, Molecule.HEXPLICIT_UNKNOWN);
		mol.setAtomIsotope(alink, Molecule.ISOTOPE_NATURAL);
		mol.setAtomMapNum(alink, 0);
		mol.setAtomExtra(alink, null);
		mol.setAtomTransient(alink, null);

		TemplateFusion fusion = new TemplateFusion(outmol, frag, "");
		fusion.setWithGuideOnly(true);
		fusion.permuteAtom(alink);
		if (fusion.numPerms() == 0)
		{
			// (should be rare or impossible)
			errmsg = 'Unable to insert an atom.';
			return;
		}

		outmol = fusion.getPerm(0).mol;
		zapSubject();
		outCurrentAtom = alink;
	}

	// input: (standard)
	// output:
	//		.clipNative: the extracted subset
	public void execCopy(boolean andCut)
	{
		if (!requireAtoms()) return;

		boolean[] mask = subjectLength == 0 ? Vec.booleanArray(true, mol.numAtoms) : subjectMask;
		Molecule clipmol = MolUtil.subgraphWithAttachments(mol, mask);
		output.put("clipNative", clipmol.toString());

		if (andCut) outmol = MolUtil.subgraph(mol, Vec.not(mask));
	}*/

	// ----------------- private methods -----------------

	// if there is no subject, sets the error message and returns false
	private requireSubject():boolean
	{
		if (this.subjectLength == 0) this.errmsg = 'Subject required: current atom/bond or selected atoms.';
		return this.subjectLength > 0;
	}

	// complains if there aren't any atoms
	private requireAtoms():boolean
	{
		if (this.input.mol.numAtoms == 0) this.errmsg = 'There are no atoms.';
		return this.input.mol.numAtoms > 0;
	}

	// complains if there's no current atom/bond
	private requireCurrent():boolean
	{
		if (this.input.currentAtom == 0 && this.input.currentBond == 0)
		{
			this.errmsg = 'There must be a current atom or bond.';
			return false;
		}
		return true;
	}

	// complains if there are no selected atoms
	private requireSelected():boolean
	{
		if (!this.hasSelected) this.errmsg = 'No atoms are selected.';
		return this.hasSelected;
	}

	// for a set of groups of atoms, select one that is represented by the current subject; optionally advanced
	// to the next group
	private pickSelectedGroup(groups:number[][], dir:number):number
	{
		if (this.subjectLength == 0) return 0;

		// if any is all-selected, that's the starting point (+ dir)
		for (let i = 0; i < groups.length; i++)
		{
			let g = groups[i];
			let all = true;
			for (let j = 0; j < g.length; j++) if (!this.subjectMask[g[j] - 1])
			{
				all = false;
				break;
			}
			if (all)
			{
				i += dir;
				return i < 0 ? i + groups.length : i >= groups.length ? i - groups.length : i;
			}
		}

		// anything partly selected will do
		for (let i = 0; i < groups.length; i++)
		{
			let g = groups[i];
			for (let j = 0; j < g.length; j++) if (this.subjectMask[g[j] - 1]) return i;
		}

		return 0;
	}

	// makes sure output has no subject of any kind
	private zapSubject():void
	{
		this.output.currentAtom = 0;
		this.output.currentBond = 0;
		this.output.selectedMask = Vec.booleanArray(false, this.input.mol.numAtoms);
	}

	// support for bond addition
	private performBondNew(atom:number, order:number, type:number):void
	{
		let mol = this.input.mol;

		let ang = SketchUtil.calculateNewBondAngles(mol, atom, order);
		if (ang.length == 0) ang = SketchUtil.exitVectors(mol, atom);
		if (ang.length == 0)
		{
			// (probably impossible...)
			this.errmsg = 'Could not find a suitable geometry for a new substituent.';
			return;
		}

		let bx = 0, by = 0, best = 0;
		for (let n = 0; n < ang.length; n++)
		{
			let x = mol.atomX(atom) + Molecule.IDEALBOND * Math.cos(ang[n]);
			let y = mol.atomY(atom) + Molecule.IDEALBOND * Math.sin(ang[n]);
			let score = CoordUtil.congestionPoint(mol, x, y);
			if (n == 0 || score < best) {best = score; bx = x; by = y;}
		}

		this.output.mol = mol.clone();
		let anum = CoordUtil.atomAtPoint(this.output.mol, bx, by);
		if (anum == 0) anum = this.output.mol.addAtom('C', bx, by);
		MolUtil.addBond(this.output.mol, atom, anum, order, type);
	}

	// support for bond order
	private performBondChange(order:number, type:number):void
	{
		let mol = this.input.mol;

		let bonds:number[] = [];
		for (let n = 1; n <= mol.numBonds; n++)
			if (this.subjectMask[mol.bondFrom(n) - 1] && this.subjectMask[mol.bondTo(n) - 1]) bonds.push(n);

		let switchType = type == Molecule.BONDTYPE_DECLINED || type == Molecule.BONDTYPE_INCLINED;
		let stereoType = switchType || type == Molecule.BONDTYPE_UNKNOWN;
		let anyChange = switchType;

		for (let n = 0; n < bonds.length && !anyChange; n++)
		{
			let b = bonds[n];
			if (mol.bondOrder(b) != order && type == Molecule.BONDTYPE_NORMAL) anyChange = true;
			else if (mol.bondType(b) != type) anyChange = true;
		}

		if (!anyChange)
		{
			this.errmsg = 'No bond changes made.';
			return;
		}

		this.output.mol = mol.clone();

		for (let n = 0; n < bonds.length; n++)
		{
			let b = bonds[n], bfr = this.output.mol.bondFrom(b), bto = this.output.mol.bondTo(b);

			if (switchType && this.output.mol.bondType(b) == type)
			{
				this.output.mol.setBondFromTo(b, bto, bfr);
			}
			else if (this.output.mol.bondOrder(b) != order || this.output.mol.bondType(b) != type)
			{
				if (!stereoType) this.output.mol.setBondOrder(b, order);
				this.output.mol.setBondType(b, type);
			}
			else if (switchType)
			{
				this.output.mol.setBondFromTo(b, bto, bfr);
			}
		}
	}

	// support for atom-geometry
	private performBondGeomAtom(geom:number, atom:number):void
	{
		let mol = this.input.mol;

		let adj = mol.atomAdjList(atom);
		let asz = adj.length, gsz = SketchUtil.GEOM_ANGLES[geom].length;

		if (asz > gsz)
		{
			this.errmsg = 'The current atom has more bonds than does the selected geometry.';
			return;
		}

		// isolated atom: defer to the regular add-bond feature
		if (asz == 0)
		{
			this.performBondNew(atom, 1, Molecule.BONDTYPE_NORMAL);
			return;
		}

		// already at limit: only refit applies
		if (asz == gsz)
		{
			this.output.mol = SketchUtil.refitAtomGeometry(mol, atom, geom);
			if (this.output.mol == null) this.errmsg = 'Could not re-fit the atom geometry.';
			return;
		}

		// decide whether to refit, or add a new bond onto a vacant slot
		let ang = CoordUtil.atomBondAngles(mol, atom);
		let newang = SketchUtil.mapAngleSubstituent(geom, ang);

		// doesn't match, so refit
		if (newang == null)
		{
			this.output.mol = SketchUtil.refitAtomGeometry(mol, atom, geom);
			if (this.output.mol == null) this.errmsg = 'Could not re-fit the atom geometry.';
			return;
		}

		// add new bond
		this.output.mol = mol.clone();
		let theta = SketchUtil.pickNewAtomDirection(mol, atom, newang);
		let x = this.output.mol.atomX(atom) + Molecule.IDEALBOND * Math.cos(theta);
		let y = this.output.mol.atomY(atom) + Molecule.IDEALBOND * Math.sin(theta);
		let anum = CoordUtil.atomAtPoint(this.output.mol, x, y);
		if (anum == 0) anum = this.output.mol.addAtom('C', x, y);
		MolUtil.addBond(this.output.mol, atom, anum, 1);
	}

	// support for bond-geometry
	private performBondGeomBond(geom:number, bond:number):void
	{
		let mol = this.input.mol;

		// examine both sides (bfr,bto): make sure that 'bto' is terminal, else error
		let bfr = mol.bondFrom(bond), bto = mol.bondTo(bond);
		let ac1 = mol.atomAdjCount(bfr), ac2 = mol.atomAdjCount(bto);
		if (ac1 > 1 && ac2 == 1) {}
		else if (ac1 == 1 && ac2 > 1) {let t = ac1; ac1 = ac2; ac2 = t;}
		else
		{
			this.errmsg = 'One end of the bond must be terminal.';
			return;
		}

		// consider possible angles that the bond can be migrated to
		let adj = mol.atomAdjList(bfr);
		let x1 = mol.atomX(bfr), y1 = mol.atomY(bfr);
		let x2 = mol.atomX(bto), y2 = mol.atomY(bto);
		let ang:number[] = [];
		for (let n = 0, p = 0; n < adj.length; n++) if (adj[n] != bto)
		{
			ang.push(Math.atan2(mol.atomY(adj[n]) - y1, mol.atomX(adj[n]) - x1));
		}
		let newang = SketchUtil.mapAngleSubstituent(geom, ang);
		if (newang == null)
		{
			this.errmsg = 'No alternative geometries identified.';
			return;
		}

		// pick the one that has the lowest angular increment from the current angle, i.e. around the clock
		let bestAng = TWOPI + 1, bestX = 0, bestY = 0;
		let curth = Math.atan2(y2 - y1, x2 - x1), r = norm_xy(x2 - x1, y2 - y1);

		for (let n = 0; n < newang.length; n++)
		{
			let th = angleDiff(newang[n], curth);
			if (th < 0) th += TWOPI;
			if (n > 0 && th > bestAng) continue;

			let x = x1 + r * Math.cos(th + curth);
			let y = y1 + r * Math.sin(th + curth);
			if (CoordUtil.atomAtPoint(mol, x, y) > 0) continue;

			bestAng = th;
			bestX = x;
			bestY = y;
		}
		if (bestAng > TWOPI)
		{
			this.errmsg = 'No alternative geometries identified.';
			return;
		}

		this.output.mol = mol.clone();
		this.output.mol.setAtomPos(bto, bestX, bestY);
	}

	// returns true only if the subject matter is ready to be turned into a terminal inline abbreviation
	private checkAbbreviationReady():boolean
	{
		let junction = 0;

		let mol = this.input.mol, subjmask = this.subjectMask;
		for (let n = 1; n <= mol.numBonds; n++)
		{
			let b1 = mol.bondFrom(n), b2 = mol.bondTo(n);
			let atom = 0;

			if ((subjmask[b1 - 1] && !subjmask[b2 - 1] && MolUtil.hasAbbrev(mol, b1)) ||
				(subjmask[b2 - 1] && !subjmask[b1 - 1] && MolUtil.hasAbbrev(mol, b2)))
			{
				this.errmsg = 'Already an abbreviation.';
				return false;
			}

			if (subjmask[b1 - 1] && !subjmask[b2 - 1]) atom = b1;
			else if (subjmask[b2 - 1] && !subjmask[b1 - 1]) atom = b2;

			if (atom == 0 || atom == junction) {}
			else if (junction == 0) junction = atom;
			else
			{
				this.errmsg = 'The selected group must be terminal.';
				return false;
			}
		}

		return true;
	}
}

/* EOF */ }