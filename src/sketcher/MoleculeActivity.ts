/*
    MolSync

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=molsync]
*/

///<reference path='../rpc/RPC.ts'/>

/*
	MoleculeActivity: command-oriented modifications of the current molecular state.

	The invocation differs from the iOS/BlackBerry equivalents: rather than dividing each task into 2 parts, for testing
	whether an action is possible and actually carrying it out, there are two different functions: evaluate and execute.
	Evaluation is a very shallow analysis of whether a command has any chance of being relevant for the current state. If
	the amount of effort involved in figuring it out is non-trivial (e.g. requires an RPC), it will just return yes. The
	execution mode is charged with the duty of updating the EditMolecule state, or reporting any errors that might occur.
*/

enum ActivityType
{
	Delete = 1,
	Clear,
	Cut,
	Copy,
	CopyMDLMOL,
	CopySMILES,
	Paste,
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
	AbbrevInline,
	AbbrevFormula,
	AbbrevClear,
	AbbrevExpand
}

interface SketchState
{
	mol:Molecule;
	currentAtom:number;
	currentBond:number;
	selectedMask:boolean[];
}

interface TemplatePermutation
{
	mol:string;
	display:string;
	molidx:number[];
	temidx:number[];
	srcidx:number[];
	metavec?:MetaVector;
}

class MoleculeActivity
{
	public input:SketchState;
	private output:SketchState;
	private errmsg:string;
	
	constructor(private owner:any, private activity:ActivityType, private param:any /*{[id:string]: any}*/)
	{
		this.input = owner.getState();
		this.output =
		{
			'mol': null,
			'currentAtom': -1,
			'currentBond': -1,
			'selectedMask': null
		};
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
			this.executeRPC('delete');
		}
		else if (this.activity == ActivityType.Clear)
		{
			this.executeRPC('clear');
		}
		else if (this.activity == ActivityType.Cut)
		{
			this.executeRPC('cut');
		}
		else if (this.activity == ActivityType.Copy)
		{
			this.executeRPC('copy');
		}
		else if (this.activity == ActivityType.CopyMDLMOL)
		{
			//this.executeRPC('copyMDLMOL');
			// !! do clipboard with result
		}
		else if (this.activity == ActivityType.CopySMILES)
		{
			//this.executeRPC('copySMILES');
			// !! do clipboard with result
		}
		else if (this.activity == ActivityType.Paste)
		{
			//this.executeRPC('paste');
			// !! if applicable, activate template placement with result
		}
		else if (this.activity == ActivityType.SelectAll)
		{
			this.executeRPC('select', {'mode': 'all'});
		}
		else if (this.activity == ActivityType.SelectNone)
		{
			this.executeRPC('select', {'mode': 'none'});
		}
		else if (this.activity == ActivityType.SelectPrevComp)
		{
			this.executeRPC('select', {'mode': 'prevcomp'});
		}
		else if (this.activity == ActivityType.SelectNextComp)
		{
			this.executeRPC('select', {'mode': 'nextcomp'});
		}
		else if (this.activity == ActivityType.SelectSide)
		{
			this.executeRPC('select', {'mode': 'side'});
		}
		else if (this.activity == ActivityType.SelectGrow)
		{
			this.executeRPC('select', {'mode': 'grow'});
		}
		else if (this.activity == ActivityType.SelectShrink)
		{
			this.executeRPC('select', {'mode': 'shrink'});
		}
		else if (this.activity == ActivityType.SelectChain)
		{
			this.executeRPC('select', {'mode': 'chain'});
		}
		else if (this.activity == ActivityType.SelectSmRing)
		{
			this.executeRPC('select', {'mode': 'smring'});
		}
		else if (this.activity == ActivityType.SelectRingBlk)
		{
			this.executeRPC('select', {'mode': 'ringblk'});
		}
		else if (this.activity == ActivityType.SelectCurElement)
		{
			this.executeRPC('select', {'mode': 'curelement'});
		}
		else if (this.activity == ActivityType.SelectToggle)
		{
			this.executeRPC('select', {'mode': 'toggle'});
		}
		else if (this.activity == ActivityType.SelectUnCurrent)
		{
			this.executeRPC('select', {'mode': 'uncurrent'});
		}
		else if (this.activity == ActivityType.Element)
		{
			this.executeRPC('element', {'element': param.element, 'position': param.position});
		}
		else if (this.activity == ActivityType.Charge)
		{
			this.executeRPC('charge', {'delta': param.delta});
		}
		else if (this.activity == ActivityType.Connect)
		{
			this.executeRPC('connect');
		}
		else if (this.activity == ActivityType.Disconnect)
		{
			this.executeRPC('disconnect');
		}
		else if (this.activity == ActivityType.BondOrder)
		{
			this.executeRPC('bondorder', {'order': param.order});
		}
		else if (this.activity == ActivityType.BondType)
		{
			this.executeRPC('bondtype', {'type': param.type});
		}
		else if (this.activity == ActivityType.BondGeom)
		{
			this.executeRPC('bondgeom', {'geom': param.geom});
		}
		else if (this.activity == ActivityType.BondAtom)
		{
			this.executeRPC('bondatom', param);
		}
		else if (this.activity == ActivityType.BondSwitch)
		{
			this.executeRPC('bondswitch');
		}
		else if (this.activity == ActivityType.BondAddTwo)
		{
			this.executeRPC('bondaddtwo');
		}
		else if (this.activity == ActivityType.BondInsert)
		{
			this.executeRPC('bondinsert');
		}
		else if (this.activity == ActivityType.Join)
		{
			this.executeRPC('join');
		}
		else if (this.activity == ActivityType.Nudge)
		{
			this.executeRPC('nudge', {'dir': param.dir});
		}
		else if (this.activity == ActivityType.NudgeLots)
		{
			this.executeRPC('nudgelots', {'dir': param.dir});
		}
		else if (this.activity == ActivityType.NudgeFar)
		{
			this.executeRPC('nudgefar', {'dir': param.dir});
		}
		else if (this.activity == ActivityType.Flip)
		{
			this.executeRPC('flip', {'axis': param.axis});
		}
		else if (this.activity == ActivityType.Scale)
		{
			this.executeRPC('scale', {'mag': param.mag});
		}
		else if (this.activity == ActivityType.Rotate)
		{
			this.executeRPC('rotate', {'theta': param.theta, 'centreX': param.centreX, 'centreY': param.centreY});
		}
		else if (this.activity == ActivityType.Move)
		{
			this.executeRPC('move', {'refAtom': param.refAtom, 'deltaX': param.deltaX, 'deltaY': param.deltaY});
		}
		else if (this.activity == ActivityType.Ring)
		{
			this.executeRPC('ring', {'ringX': param.ringX, 'ringY': param.ringY, 'aromatic': param.aromatic});
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
			this.executeRPC('templateFusion', {'fragNative': param.fragNative});
		}
		else if (this.activity == ActivityType.AbbrevTempl)
		{
			// !!
		}
		else if (this.activity == ActivityType.AbbrevGroup)
		{
			// !!
		}
		else if (this.activity == ActivityType.AbbrevInline)
		{
			// !!
		}
		else if (this.activity == ActivityType.AbbrevFormula)
		{
			// !!
		}
		else if (this.activity == ActivityType.AbbrevClear)
		{
			// !!
		}
		else if (this.activity == ActivityType.AbbrevExpand)
		{
			// !!
		}
	}

	// --------------------------------------- private methods ---------------------------------------

	// packages up an RPC request to get the job done
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
				this.owner.setPermutations(<TemplatePermutation[]>result.permutations);
			}
			else this.finish();
			
			if ((this.activity == ActivityType.Copy || this.activity == ActivityType.Cut) && result.clipNative != null)
			{
				this.owner.performCopy(Molecule.fromString(result.clipNative));
			}
		};
		new RPC('sketch.' + optype, param, fcn, this).invoke();
	}

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
}