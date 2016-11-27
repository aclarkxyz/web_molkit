# WebMolKit

Cheminformatics toolkit built with _TypeScript_ & _jQuery_. Can be used to carry out some fairly sophisticated cheminformatics tasks on a contemporary web browser, such as rendering molecules for display, format conversions, calculations, interactive sketching, among other things.

## License

Copyright &copy; 2010-2016 Molecular Materials Informatics, Inc.

[http://molmatinf.com](http://molmatinf.com)

All rights reserved

* **General availability**: The _WebMolKit_ library may be used by anyone under the terms set by the general [Gnu Public License (v3.0)](https://www.gnu.org/licenses/gpl-3.0.en.html). The synopsis of this license is that if you use any part of the source code in your own project, you are contractually bound to make the **entire** project available under a similar license whenever you distribute it, i.e. it's the _viral_ version of the GPL. Not to be confused with the _lesser_ version (LGPL). Also, if you are considering asserting software patents, you'd best read the GPL v3.0 terms very carefully.

* **Special exception**: An exception to the default licensing is made for [Collaborative Drug Discovery, Inc](http://collaborativedrug.com) (CDD). CDD is permitted to use this toolkit under the terms of the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0), which is a non-viral license. This exception applies to any version of the toolkit in which this notice appears, i.e. if this exception is ever removed, then CDD may continue to use the version immediately prior to its removal, and is permitted to fork the code under the terms of the _Apache License_.

* If the copyright owner adds additional exceptions in later releases, they will take effect as of that version.

* **Owner availability**: The copyright owner, [Molecular Materials Informatics, Inc.](http://molmatinf.com), can and will exercise the liberty of using this toolkit in proprietary and/or open source software.

## Codebase

Written in _TypeScript_. Requires the TypeScript compiler (`tsc`) to cross-compile into JavaScript. Developed using _Visual Studio Code_.

## Status

As of November 2016, the toolkit is openly available on [GitHub](https://github.com/aclarkxyz/web_molkit). Check the `VERSION` file: until such time as the number reaches 1.0.0, you must consider this project to be a work in progress, i.e. if you wish to use it, you need to keep the source files uptodate in order to collect features are they are completed and bugfixes as they are rolled out, but you also need to watch for API changes that can happen suddenly and without warning.

For documentation purposes, the best place to look is in the `val/html` folder. The `val/html/sketcher.html` file is as good a place as any to start: it includes the cross-compiled JavaScript, defines the ancilliary resource location, unpacks a _Molecule_ object, and then plops it into an interactive sketcher widget.

Note that trying out the page by opening the file with a browser probably won't work because of security issues accessing a file from a parallel directory hierarchy, so you will need to fire up a trivial HTTP server (see the `run_server` file) to test it. If you cut & paste the necessary files into a current web server, and make sure the references are pointing to the correct URLs, then it should work.

The source files are moderately well commented, but proper documentation is a to-do item that will happen when it happens.

A note when perusing the source code: this project actually goes back to ca. 2010, and was originally constructed using _Google Closure_, which is a JavaScript wrapper that was designed to workaround the fact that the so-called standard web runtime was a complete and utter trainwreck until quite recently. Google's solution was unwieldy and ugly as hell, but that is what had to be done to make it work. The toolkit was originally designed to delegate anything complicated to a server (Java EE) via remote procedure calls, which worked well enough. Fast forward to 2016, the lowest common denominator of modern browsers is finally adequate for high quality applications; the _jQuery_ library has become virtually universal; _TypeScript_ has matured into a very practical solution to the many design flaws of _JavaScript_; and _Visual Studio Code_ is a remarkably pleasant way to work (and despite the fact that it comes from Microsoft, I only use it on Mac & Linux). For these reasons, the original Closure/Java split has been morphed into what you see now: a self-contained library that runs entirely on the browser. Be warned, though, that the transformation is not entirely complete, and so you will see some evidence of its earlier form (e.g. the `src/rpc` source files, which you can safely ignore).