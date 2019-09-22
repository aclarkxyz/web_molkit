/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved

    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../decl/jquery.d.ts'/>
///<reference path='util.ts'/>

namespace WebMolKit /* BOF */ {

// public theme definition: the values for these colours can be customised; they will be converted into CSS as soon as the initialisation
// function is called (see below); the general idea is a tetrachrome: most content is monochrome (black text on white background by default),
// with interesting content marked in the "lowlight" colour (turquoise), and active content in "highlight" (green)
export class Theme
{
	// e.g. 'http://servername/MolSync'; the REST services hang off of this url: ${BASE_URL}/REST/...
	public static BASE_URL:string = null;

	// base for static resources that can be fetched without going through the RPC mechanism
	public static RESOURCE_URL:string = null;

	// these are open to modification
	public static foreground = 0x000000;
	public static background = 0xFFFFFF;
	public static lowlight = 0x24D0D0;
	public static lowlightEdge1 = 0x47D5D2;
	public static lowlightEdge2 = 0x008FD1;
	public static highlight = 0x00FF00;
	public static highlightEdge1 = 0x00CA59;
	public static highlightEdge2 = 0x008650;
	public static error = 0xFF0000;

	/* brought over from MMDS app; consider reinstating them
	public static dialogBackground = 0x20194C66;
	public static dialogActiveArea1 = 0x20194C26;
	public static dialogActiveArea2 = 0x20000026;
	public static buttonShade1 = 0x40236866;;
	public static buttonShade2 = 0x40004866;;
	public static buttonSelected1 = 0x3346D4D2;
	public static buttonSelected2 = 0x33008FD2;
	public static buttonHighlighted1 = 0x4C00C958;
	public static buttonHighlighted2 = 0x4C008550;
	public static current = 0x00A43C;
	public static currentBorder = 0x40FFC0;
	public static selected = 0x009488;
	public static bankTranslucent = 0xC0309070;*/
}

// to be called as soon as possible from within any environment that uses WebMolKit functionality
export function initWebMolKit(resourcePath:string):void
{
	Theme.RESOURCE_URL = resourcePath;

	installInlineCSS('main', composeMainCSS());
}

/*
	Inline CSS: each major section of WebMolKit that needs its own CSS tags should call installCSS(..) before doing anything interesting.
	The custom CSS should include some number of definitions with the prefix 'wmk-{tag}-{whatever}', where {tag} is a concise definition
	that can be used to make sure that each of these CSS blocks are installed just once.
*/

let cssTagsInstalled = new Set<string>();
export function hasInlineCSS(tag:string):boolean {return cssTagsInstalled.has(tag);}

// makes sure a block of CSS is installed, returning true if it was added, false if it was already there
export function installInlineCSS(tag:string, css:string):boolean
{
	if (cssTagsInstalled.has(tag)) return false;

	let el = document.createElement('style');
	el.innerHTML = css;
	document.head.appendChild(el);
	cssTagsInstalled.add(tag);
	return true;
}

// assembles top-level CSS that's available for theming that doesn't have an encapsulating class
function composeMainCSS():string
{
	let lowlight = colourCode(Theme.lowlight), lowlightEdge1 = colourCode(Theme.lowlightEdge1), lowlightEdge2 = colourCode(Theme.lowlightEdge2);
	let highlight = colourCode(Theme.highlight), highlightEdge1 = colourCode(Theme.highlightEdge1), highlightEdge2 = colourCode(Theme.highlightEdge2);

	// NOTE: theme is only partially honoured here; need to tighten it up
	return `
		.wmk-button
		{
			display: inline-block;
			padding: 6px 12px;
			margin-bottom: 0;
			font-family: 'Open Sans', sans-serif;
			font-size: 14px;
			font-weight: normal;
			line-height: 1.42857143;
			text-align: center;
			white-space: nowrap;
			vertical-align: middle;
			cursor: pointer;
			background-image: none;
			border: 1px solid transparent;
			border-radius: 4px;
			-ms-touch-action: manipulation; touch-action: manipulation;
			-webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;
		}
		.wmk-button:focus,
		.wmk-button:active:focus,
		.wmk-button.active:focus,
		.wmk-button.focus,
		.wmk-button:active.focus,
		.wmk-button.active.focus
		{
			outline: thin dotted;
			outline: 5px auto -webkit-focus-ring-color;
			outline-offset: -2px;
		}
		.wmk-button:hover,
		.wmk-button:focus,
		.wmk-button.focus
		{
			color: #333;
			text-decoration: none;
		}
		.wmk-button:active,
		.wmk-button.active
		{
			background-image: none;
			outline: 0;
			-webkit-box-shadow: inset 0 3px 5px rgba(0, 0, 0, .125);
			box-shadow: inset 0 3px 5px rgba(0, 0, 0, .125);
		}
		.wmk-button.disabled,
		.wmk-button[disabled],
		fieldset[disabled] .wmk-button
		{
			cursor: not-allowed;
			filter: alpha(opacity=65);
			-webkit-box-shadow: none;
			box-shadow: none;
			opacity: .65;
		}
		a.wmk-button.disabled,
		fieldset[disabled] a.wmk-button
		{
			pointer-events: none;
		}

		/* shrunken button */

		.wmk-button-small
		{
			padding: 2px 4px;
			line-height: 1;
			font-size: 12px;
		}

		/* default button */

		.wmk-button-default
		{
			color: #333;
			background-color: #fff;
			background-image: linear-gradient(to right bottom, #FFFFFF, #E0E0E0);
			border-color: #ccc;
		}
		.wmk-button-default:focus,
		.wmk-button-default.focus
		{
			color: #333;
			background-color: #e6e6e6;
			border-color: #8c8c8c;
		}
		.wmk-button-default:hover
		{
			color: #333;
			background-color: #e6e6e6;
			border-color: #adadad;
		}
		.wmk-button-default:active,
		.wmk-button-default.active,
		.open > .dropdown-toggle.wmk-button-default
		{
			color: #333;
			background-color: #e6e6e6;
			border-color: #adadad;
		}
		.wmk-button-default:active:hover,
		.wmk-button-default.active:hover,
		.open > .dropdown-toggle.wmk-button-default:hover,
		.wmk-button-default:active:focus,
		.wmk-button-default.active:focus,
		.open > .dropdown-toggle.wmk-button-default:focus,
		.wmk-button-default:active.focus,
		.wmk-button-default.active.focus,
		.open > .dropdown-toggle.wmk-button-default.focus
		{
			color: #333;
			background-color: #d4d4d4;
			border-color: #8c8c8c;
		}
		.wmk-button-default:active,
		.wmk-button-default.active,
		.open > .dropdown-toggle.wmk-button-default
		{
			background-image: none;
		}
		.wmk-button-default.disabled:hover,
		.wmk-button-default[disabled]:hover,
		fieldset[disabled] .wmk-button-default:hover,
		.wmk-button-default.disabled:focus,
		.wmk-button-default[disabled]:focus,
		fieldset[disabled] .wmk-button-default:focus,
		.wmk-button-default.disabled.focus,
		.wmk-button-default[disabled].focus,
		fieldset[disabled] .wmk-button-default.focus
		{
			background-color: #fff;
			border-color: #ccc;
		}
		.wmk-button-default .badge
		{
			color: #fff;
			background-color: #333;
		}

		/* primary button */

		.wmk-button-primary
		{
			color: #fff;
			background-color: #008FD2;
			background-image: linear-gradient(to right bottom, ${lowlightEdge1}, ${lowlightEdge2});
			border-color: #00C0C0;
		}
		.wmk-button-primary:focus,
		.wmk-button-primary.focus
		{
			color: #fff;
			background-color: ${lowlight};
			border-color: #122b40;
		}
		.wmk-button-primary:hover
		{
			color: #fff;
			background-color: #286090;
			border-color: #204d74;
		}
		.wmk-button-primary:active,
		.wmk-button-primary.active,
		.open > .dropdown-toggle.wmk-button-primary
		{
			color: #fff;
			background-color: #286090;
			border-color: #20744d;
		}
		.wmk-button-primary:active:hover,
		.wmk-button-primary.active:hover,
		.open > .dropdown-toggle.wmk-button-primary:hover,
		.wmk-button-primary:active:focus,
		.wmk-button-primary.active:focus,
		.open > .dropdown-toggle.wmk-button-primary:focus,
		.wmk-button-primary:active.focus,
		.wmk-button-primary.active.focus,
		.open > .dropdown-toggle.wmk-button-primary.focus
		{
			color: #fff;
			background-color: ${highlight};
			background-image: linear-gradient(to right bottom, ${highlightEdge1}, ${highlightEdge2});
			border-color: #12802b;
		}
		.wmk-button-primary:active,
		.wmk-button-primary.active,
		.open > .dropdown-toggle.wmk-button-primary
		{
			background-image: none;
		}
		.wmk-button-primary.disabled:hover,
		.wmk-button-primary[disabled]:hover,
		fieldset[disabled] .wmk-button-primary:hover,
		.wmk-button-primary.disabled:focus,
		.wmk-button-primary[disabled]:focus,
		fieldset[disabled] .wmk-button-primary:focus,
		.wmk-button-primary.disabled.focus,
		.wmk-button-primary[disabled].focus,
		fieldset[disabled] .wmk-button-primary.focus
		{
			background-color: #337ab7;
			border-color: #2ea46d;
		}
		.wmk-button-primary .badge
		{
			color: #337ab7;
			background-color: #fff;
		}
	`;
}

/* EOF */ }