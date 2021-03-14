# WebMolKit

Cheminformatics toolkit built with _TypeScript_. Can be used to carry out some fairly sophisticated cheminformatics tasks on a contemporary web browser, such as rendering molecules for display, format conversions, calculations, interactive sketching, among other things.

## License

Copyright &copy; 2010-2021 Molecular Materials Informatics, Inc.

[http://molmatinf.com](http://molmatinf.com)

All rights reserved

* **General availability**: The _WebMolKit_ library may be used by anyone under the terms set by the general [Gnu Public License (v3.0)](https://www.gnu.org/licenses/gpl-3.0.en.html). The synopsis of this license is that if you use any part of the source code in your own project, you are contractually bound to make the **entire** project available under a similar license whenever you distribute it, i.e. it's the _viral_ version of the GPL. Not to be confused with the _lesser_ version (LGPL). Also, if you are considering asserting software patents, you'd best read the GPL v3.0 terms very carefully.

* **Special exception 1**: An exception to the default licensing is made for [Collaborative Drug Discovery, Inc](http://collaborativedrug.com) (CDD). CDD is permitted to use this toolkit under the terms of the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0), which is a non-viral license. This exception applies to any version of the toolkit in which this notice appears, i.e. if this exception is ever removed, then CDD may continue to use the version immediately prior to its removal, and is permitted to fork the code under the terms of the _Apache License_.

* **Special exception 2**: An exception to the default licensing is made for [Collaborations Pharmaceuticals, Inc](http://www.collaborationspharma.com) (CP). CP is permitted to use this toolkit under the terms of the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0), which is a non-viral license. This exception applies to any version of the toolkit in which this notice appears, i.e. if this exception is ever removed, then CP may continue to use the version immediately prior to its removal, and is permitted to fork the code under the terms of the _Apache License_.

* If the copyright owner adds additional exceptions in later releases, they will take effect as of that version.

* **Owner availability**: The copyright owner, [Molecular Materials Informatics, Inc.](http://molmatinf.com), can and will exercise the liberty of using this toolkit in proprietary and/or open source software.

## Codebase

The framework is written in _TypeScript_. It requires the [TypeScript](https://www.typescriptlang.org/) compiler (`tsc`) to cross-compile into JavaScript. All development has been done using _Visual Studio Code_.

Prior to doing anything with the codebase, it needs to be compiled into _JavaScript_:

```
$ tsc
$ ls bin
	webmolkit-build.js
	webmolkit-build.js.map
```

The compilation creates the file `bin/webmolkit-build.js`. Once this is generated, the file can be used in a runtime context.

## Uses

The framework is designed for use on a standard HTML page _and_ under the NodeJS/Electron framework.

For anyone writing code in _TypeScript_, the method of choice is to include the `src/**.ts` files within the main project, and access the classes and functions within the `WebMolKit` namespace. For using with raw _JavaScript_, or other derivatives, the cross-compiled output file `bin/webmolkit-build.js` contains all of the functionality. The class and function names are all the same as for integrating with _TypeScript_, but the without helpful typing information.

Adding the sketcher to a web page is demonstrated in the example file `val/html/sketcher.html`.

Importing the necessary content into a web page can be most easily done by inserting lines into the header section of the HTML page, e.g.

```
<head>
	<script src="../../bin/webmolkit-build.js" type="text/javascript"></script>
	...
</head>
```

Embedding a blank sketcher instance on the page can be done as:

```
<script>
	var url = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
	WebMolKit.initWebMolKit(url + '../../../res');

	var mol = WebMolKit.Molecule.fromString(WebMolKit.DOM.find('#moldata').text());

	var sketcher = new WebMolKit.Sketcher();
	sketcher.setSize(800, 700);
	sketcher.defineMolecule(mol);
	let proxy = new WebMolKit.ClipboardProxyWeb();
	sketcher.defineClipboard(proxy);
	sketcher.setup(() => sketcher.render(WebMolKit.DOM.find('#sketcher')));
</script>
```

There are several things going on here. The first step is to make sure the framework knows where to find its own resources, by calling `WebMolKit.initWebMolKit`. The example above constructs a URL relative to the current location. The content that it needs to find is located in the `res` subdirectory of the repository, and contains information such as icons and structure templates.

Starting with a current molecule is optional: the default is blank. To prepopulate, a `Molecule` object must first be created. The example above creates an instance by unpacking a string that conforms to the _SketchEl_ format, which is the native default. Calling the `defineMolecule` method for the sketcher class makes that the current molecule.

A sketcher instance requires several other pieces of information, such as predefined size. It also wants something called a "clipboard proxy", which is a way of intermediating between the two very different styles of clipboard access for web vs. desktop targets, and also to provide a way to capture/release clipboard access under scenarios like dialog box creation. For a simple web page, though, the boilerplate code shown above will suffice.

The final rendering and activation of the sketcher is done by chaining the `setup` and `render` methods. There is some resource loading that gets done in between the setup and rendering steps, hence the callback.

That is all it takes to embed a sketcher. Interacting with the widget is fairly straightforward, and is done by calling public functions, e.g. `getMolecule`, `defineMolecule`, `performCopy`, etc.

# Feedback

If you have any questions, comments or inquiries, feel free to write to [aclark@molmatinf.com](mailto:aclark@molmatinf.com). Serious people welcome; trolls, spammers and haters not so much.