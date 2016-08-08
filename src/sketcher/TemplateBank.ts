/*
    WebMolKit

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../ui/ButtonBank.ts'/>

/*
	TemplateBank: template list... either the top-level list of template groups, or a single folder full of templates.

	Content:
		.owner: the instance of molsync.ui.EditMolecule that owns this buttonbank
		.group: not defined=list all groups; defined=this specific group of templates
		.content: result of webservice request used to fetch buttons
*/

interface GroupTemplates
{
	groups:string[];
	titles:string[];
	preview:any[];
}

interface TemplateStructs
{
	molecules:string[];
	names:string[];
	abbrev:string[];
	mnemonic:string[];
	preview:any[];
}

class TemplateBank extends ButtonBank
{
	subgroups:GroupTemplates = null;
	templates:TemplateStructs = null;
	
	constructor(protected owner:any, protected group?:string)
	{
		super();
	}
	
	public init()
	{
		// immediately issue a webservice request to fetch the button list
		let policy = RenderPolicy.defaultBlackOnWhite();
		policy.data.pointScale = 10;
		policy.data.lineSize *= 1.5;
		policy.data.bondSep *= 1.5;

		let sz = <number>this.buttonView.idealSize;
		
		if (this.group == null)
		{
			let input = {'tokenID': this.owner.tokenID, 'policy': policy.data, 'size': [sz - 4, sz - 4]};
			let fcn = function(result:any, error:ErrorRPC)
			{
				if (!result) 
				{
					alert('Setup of TemplateBank failed: ' + error.message);
					return;
				}
				this.subgroups = result;
				this.buttonView.refreshBank();
			};
			Func.getDefaultTemplateGroups(input, fcn, this);
		}
		else
		{
			let input:any = {'tokenID': this.owner.tokenID, 'policy': policy.data, 'size': [sz - 4, sz - 4], 'group': this.group};
			let fcn = function(result:any, error:ErrorRPC)
			{
				if (!result) 
				{
					alert('Setup of TemplateBank failed: ' + error.message);
					return;
				}
				this.templates = result;
				this.buttonView.refreshBank();
			};
			Func.getDefaultTemplateStructs(input, fcn, this);
		}
	}

	// populate the buttons
	public update():void
	{
		if (this.subgroups == null && this.templates == null) return;

		this.buttons = [];
		
		if (this.group == null)
			this.populateGroups();
		else
			this.populateTemplates();	
	}

	// build a list of template groups, based on the webservice results 
	private populateGroups():void
	{
		let groups = this.subgroups.groups, titles = this.subgroups.titles, preview = this.subgroups.preview;

		for (let n = 0; n < groups.length; n++)
		{
			this.buttons.push({'id': groups[n], 'metavec': preview[n], 'helpText':titles[n]});
		}
	}

	// build a list of template structures, based on the webservice results 
	private populateTemplates():void
	{
		let names = this.templates.names, abbrev = this.templates.abbrev, mnemonic = this.templates.mnemonic, preview = this.templates.preview;
		
		for (let n = 0 ; n < names.length; n++)
		{
			this.buttons.push({'id': n.toString(), 'metavec': preview[n], 'helpText': names[n]});
			// !! do something with abbrev & mnemonic
		}
	}

	// react to a button click
	public hitButton(id:string)
	{
		if (this.group == null)
		{
			this.buttonView.pushBank(new TemplateBank(this.owner, id));
		}
		else
		{
			let idx = parseInt(id);
			let param = {'fragNative': this.templates.molecules[idx]};
			new MoleculeActivity(this.owner, ActivityType.TemplateFusion, param).execute();
		}
	}
}

class FusionBank extends ButtonBank
{
	constructor(protected owner:any)
	{
		super();
	}

	public update():void
	{
		this.buttons = [];

		this.buttons.push({'id': 'accept', 'imageFN': 'GenericAccept', 'helpText': 'Apply this template.'});
		this.buttons.push({'id': 'prev', 'imageFN': 'TemplatePrev', 'helpText': 'Show previous fusion option.'});
		this.buttons.push({'id': 'next', 'imageFN': 'TemplateNext', 'helpText': 'Show next fusion option.'});
		// (inline?)
	}

	// react to a button click
	public hitButton(id:string)
	{
		if (id == 'accept') this.owner.templateAccept();
		else if (id == 'prev') this.owner.templateRotate(-1);
		else if (id == 'next') this.owner.templateRotate(1);
	}
	
	public bankClosed()
	{
		this.owner.clearPermutations();
	}
}
