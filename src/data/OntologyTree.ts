/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

import {Theme} from '../util/Theme';
import {readTextURL} from '../util/util';
import {Vec} from '../util/Vec';

/*
	Manages a tree of ontology (URI) terms, which is an extremely minimalist subset of the functionality of formats
	like OWL. Each term belongs to a single hierarchy and its only property is a label. Content is loaded out of concise
	text files (.onto) that are easy to curate manually.

	The class should generally be used as a singleton, with individual items of content loaded into it permanently.

	The source content consists of lines of the following form:

		{indentation} {uri} {label}

	where {indentation} consists of zero-or-more dashes; the order and indentation level implies the tree structure. The {uri}
	is fully expanded, and by definition contains no whitespace. The {label} consumes the remainder of the line, and may contain
	any amount of spaces. Blank lines are ignored and comments start with #.

	e.g.
		# arbitrary ontology
		http://thing.com/something#THI_001 thing
		- http://thing.com/something#THI_002 subset of thing
		- - http://thing.com/something#THI_003 different kind of thing

	Duplicate terms are allowed, except for the root branches, which are collapsed into one. Loading an ontology source file
	more than once is not recommended.
*/

let globalInstance:OntologyTree = null;

const ONTOLOGY_FILES =
[
	'units'
];

export interface OntologyTreeTerm
{
	uri:string;
	label:string;
	parent:OntologyTreeTerm;
	children:OntologyTreeTerm[];
	depth:number;
}

export class OntologyTree
{
	public static get main():OntologyTree {return globalInstance;}

	private roots:OntologyTreeTerm[] = [];
	private mapTerms = new Map<string, OntologyTreeTerm[]>(); // uri-to-term(s)

	private alreadyLoaded = new Set<string>(); // prevent double-loading files

	// ------------------ public methods --------------------

	constructor()
	{
	}

	// call this at least once during the early lifecycle: makes sure the default ontology files are loaded
	public static async init():Promise<void>
	{
		if (globalInstance) return;
		globalInstance = new OntologyTree();

		for (let fn of ONTOLOGY_FILES)
		{
			let url = Theme.RESOURCE_URL + '/data/ontology/' + fn + '.onto';
			globalInstance.loadFromURL(url);
		}
	}

	// return a list of root branches; note that the list is not cloned at all
	public getRoots():OntologyTreeTerm[]
	{
		return this.roots;
	}

	// queries the existence of a term: when returning a branch, not that it is not cloned
	public hasTerm(uri:string):boolean {return this.mapTerms.has(uri);}
	public getBranch(uri:string):OntologyTreeTerm[]
	{
		return this.mapTerms.get(uri);
	}

	// fetches a branch, populating it into a flattened list that is ordered according to the tree hierarchy; this is a convenient
	// form for certain use cases, especially interactivity; the container array can be treated as a shallow copy
	public getBranchList(root:string | OntologyTreeTerm):OntologyTreeTerm[]
	{
		if (typeof root == 'string')
		{
			let look = this.mapTerms.get(root);
			if (!look) throw `Unknown branch URI: ${root}`;
			if (look.length > 1) throw `Ambiguous branch URI occurs more than once: ${root}`;
			root = look[0];
		}

		let list:OntologyTreeTerm[] = [];
		let accumulate = (branch:OntologyTreeTerm):void =>
		{
			list.push(branch);
			for (let child of Vec.safeArray(branch.children)) accumulate(child);
		};
		accumulate(root as OntologyTreeTerm);
		return list;
	}

	// fetches a file and loads it up; throws an exception if it didn't work
	public async loadFromURL(url:string):Promise<void>
	{
		if (this.alreadyLoaded.has(url)) return;
		this.alreadyLoaded.add(url);

		let text = await readTextURL(url);
		if (!text) throw `Resource not found: ${url}`;
		this.loadContent(text);
	}

	// loads up a file containing ontology content (see comment at top); throws an exception if anything is invalid
	public loadContent(text:string):void
	{
		let termList:OntologyTreeTerm[] = [];
		let pos = 0;
		for (let line of text.split(/\n/))
		{
			pos++;
			line = line.trim();
			if (!line || line.startsWith('#')) continue;

			let idx = line.indexOf('http');
			if (idx < 0) throw `Line ${pos} invalid, no URI term: ${line}`;
			let depth = 0;
			for (let n = 0; n < idx; n++) if (line.charAt(n) == '-') depth++;

			let uri = line.substring(idx);
			idx = uri.indexOf(' ');
			if (idx < 0) throw `Line ${pos} invalid, no label: ${line}`;
			let label = uri.substring(idx + 1);
			uri = uri.substring(0, idx);

			// if this is a root term, and it already exists, borrow it
			let term:OntologyTreeTerm = null;
			if (depth == 0) term = this.roots.find((look) => look.uri == uri);

			if (!term)
			{
				term = {uri, label, 'parent': null, 'children': [], depth};

				if (depth == 0) this.roots.push(term);
				else
				{
					for (let n = termList.length - 1; n >= 0; n--) if (termList[n].depth == depth - 1)
					{
						term.parent = termList[n];
						termList[n].children.push(term);
						break;
					}
					if (!term.parent) throw `Line ${pos} invalid hierarchy, no parent found`;
				}

				let list = this.mapTerms.get(uri);
				if (list) list.push(term); else this.mapTerms.set(uri, [term]);
			}

			termList.push(term);
		}
	}

	public debugString(term:OntologyTreeTerm):string
	{
		let lines:string[] = [];
		let emit = (term:OntologyTreeTerm):void =>
		{
			lines.push('* '.repeat(term.depth) + `<${term.uri}> "${term.label}"`);
			for (let child of term.children) emit(child);
		};
		emit(term);
		return lines.join('\n');
	}

	// ------------------ public methods --------------------

}
