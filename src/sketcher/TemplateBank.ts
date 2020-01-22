/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../ui/ButtonBank.ts'/>
///<reference path='../gfx/Rendering.ts'/>
///<reference path='../gfx/ArrangeMolecule.ts'/>
///<reference path='../gfx/DrawMolecule.ts'/>
///<reference path='../data/Molecule.ts'/>
///<reference path='../data/MolUtil.ts'/>
///<reference path='../data/DataSheetStream.ts'/>
///<reference path='../data/AbbrevContainer.ts'/>
///<reference path='../sketcher/MoleculeActivity.ts'/>

namespace WebMolKit /* BOF */ {

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

export class TemplateBank extends ButtonBank
{
	private static RESOURCE_LIST:string[] = null;
	private static RESOURCE_DATA:DataSheet[] = null; // templates are derived from these
	private subgroups:GroupTemplates = null;
	private templates:TemplateStructs = null;

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

		let sz = this.buttonView.idealSize;

		if (this.group == null)
		{
			if (TemplateBank.RESOURCE_DATA == null)
				this.loadResourceData(() => this.prepareSubGroups());
			else
				this.prepareSubGroups();
		}
		else
		{
			if (TemplateBank.RESOURCE_DATA == null)
				this.loadResourceData(() => this.prepareTemplates());
			else
				this.prepareTemplates();
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
			this.buttons.push({'id': groups[n], 'metavec': preview[n], 'helpText': titles[n]});
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

	// loads up the resource datasheets one at a time, and stashes them in the static container
	private loadResourceData(onComplete:() => void):void
	{
		let roster = TEMPLATE_FILES.slice(0);
		TemplateBank.RESOURCE_LIST = roster.slice(0);
		TemplateBank.RESOURCE_DATA = [];

		let grabNext = ():void =>
		{
			if (roster.length == 0)
			{
				onComplete();
				return;
			}
			let url = Theme.RESOURCE_URL + '/data/templates/' + roster.shift() + '.ds';
			$.ajax(
			{
				'url': url,
				'type': 'GET',
				'dataType': 'text',
				'success': (dsstr:string) =>
				{
					TemplateBank.RESOURCE_DATA.push(DataSheetStream.readXML(dsstr));
					grabNext();
				}
			});
		};
		grabNext();
	}

	// use the resource data to prepare button icons for the template groups
	private prepareSubGroups():void
	{
		this.subgroups = {'groups': TemplateBank.RESOURCE_LIST, 'titles': [], 'preview': []};
		let sz = this.buttonView.idealSize, msz = 0.5 * (sz - 2);

		let policy = RenderPolicy.defaultBlackOnWhite();
		policy.data.pointScale = 10;
		let effects = new RenderEffects();
		let measure = new OutlineMeasurement(0, 0, policy.data.pointScale);

		for (let ds of TemplateBank.RESOURCE_DATA)
		{
			this.subgroups.titles.push(ds.title);

			let colMol = ds.firstColOfType(DataSheetColumn.Molecule);
			let metavec = new MetaVector();

			for (let n = 0, idx = 0; idx < 4 && n < ds.numRows; n++)
			{
				let mol = ds.getMolecule(n, colMol);
				if (MolUtil.isBlank(mol)) continue;

				let layout = new ArrangeMolecule(mol, measure, policy, effects);
				layout.arrange();
				let col = (idx % 2), row = Math.floor(idx / 2);
				layout.squeezeInto(1 + col * msz, 1 + row * msz, msz, msz, 1);
				new DrawMolecule(layout, metavec).draw();

				idx++;
			}
			metavec.width = sz;
			metavec.height = sz;

			this.subgroups.preview.push(metavec);
		}
		this.buttonView.refreshBank();
	}

	// use the resource data to prepare pictures for each of the templates
	private prepareTemplates():void
	{
		let idx = TemplateBank.RESOURCE_LIST.indexOf(this.group);
		let ds = TemplateBank.RESOURCE_DATA[idx];

		this.templates = {'molecules': [], 'names': [], 'abbrev': [], 'mnemonic': [], 'preview': []};

		let sz = this.buttonView.idealSize;

		let policy = RenderPolicy.defaultBlackOnWhite();
		policy.data.pointScale = 12;
		let effects = new RenderEffects();
		let measure = new OutlineMeasurement(0, 0, policy.data.pointScale);

		let colMol = ds.findColByName('Molecule');
		let colName = ds.findColByName('Name');
		let colAbbrev = ds.findColByName('Abbrev');
		let colMnemonic = ds.findColByName('Mnemonic');

		for (let n = 0; n < ds.numRows; n++)
		{
			let mol = ds.getMolecule(n, colMol);
			this.templates.molecules.push(mol.toString());
			this.templates.names.push(ds.getString(n, colName));
			this.templates.abbrev.push(ds.getString(n, colAbbrev));
			this.templates.mnemonic.push(ds.getString(n, colMnemonic));

			let layout = new ArrangeMolecule(mol, measure, policy, effects);
			layout.arrange();
			layout.squeezeInto(0, 0, sz, sz, 2);
			let metavec = new MetaVector();
			new DrawMolecule(layout, metavec).draw();
			metavec.width = sz;
			metavec.height = sz;
			this.templates.preview.push(metavec);
		}

		this.buttonView.refreshBank();
	}
}

export class FusionBank extends ButtonBank
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

/* EOF */ }