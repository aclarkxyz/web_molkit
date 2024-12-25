# WebMolKit

Cheminformatics toolkit built with _TypeScript_. Can be used to carry out some fairly sophisticated cheminformatics tasks on a contemporary web browser, such as rendering molecules for display, format conversions, calculations, interactive sketching, among other things. The library can be used within any JavaScript engine, including web browsers, NodeJS and Electron.

## License

Copyright &copy; 2010-2024 Molecular Materials Informatics, Inc.

[http://molmatinf.com](http://molmatinf.com)

All rights reserved.

The _WebMolKit_ library is made available under the terms of the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0), which is a non-viral license. Until July 2022 it was generally available under the GPL 3 (the viral license), but this constraint has been lifted.

## Codebase

The framework is written in _TypeScript_. It requires the [TypeScript](https://www.typescriptlang.org/) compiler to cross-compile into JavaScript. All development has been done using _Visual Studio Code_.

Converting each of the source files (`.ts`) into a JavaScript file (`.js` and `.d.ts`) is done by running the TypeScript compiler:

```
$ tsc
$ ls -lR dist/src
```

Converting these TypeScript outputs into something that can be executed on one of the many different JavaScript runtime engines involves _webpack_:

```
$ npm run build
$ ls -l dist
```

This process creates `webmolkit.js`, which can be included into any web page, allowing functionality to be invoked. Incorporating _WebMolKit_ into a more complex library is most easily done using the NodeJS Package Manager (_npm_), within a project that necessarily uses _webpack_ to assemble all of its own libraries into a final build.

_WebMolKit_ itself uses no dependencies, and runs on baseline JavaScript engines. The only exception is the need for a DOM in order to read/write XML files: for the DOM-less environments (node, web-worker) this must be stubbed in with a custom implementation. 

## Test framework

The `val` subdirectory includes a limited set of regression tests and interactive checks. These can be executed by running a dumb web server (e.g. [http-server](https://www.npmjs.com/package/http-server)) and pointing your browser to each of the HTML files.

## Cookbook

### Simple Embed

The easiest way to use `WebMolKit` is to obtain the compiled bundle from [GitHub](https://github.com/aclarkxyz/web_molkit): copy the file `dist/webmolkit.js` to the appropriate location. A bare-bones web page that invokes the sketcher might look like:

```
<!DOCTYPE html>
<html>
	<head>
		<script src="webmolkit.js" type="text/javascript" charset="UTF-8"></script>
	</head>
	<body>
		<p id="sketcher"></p>
		<script>
			let sketcher = new WebMolKit.Sketcher();
			sketcher.setSize(800, 700);
			let proxy = new WebMolKit.ClipboardProxyWeb();
			let handler = new WebMolKit.ClipboardProxyHandler();
			handler.copyEvent = (andCut, proxy) =>
			{
				sketcher.performCopySelection(andCut);
				return true;
			};
			handler.pasteEvent = (proxy) =>
			{
				sketcher.pasteText(proxy.getString());
				return true;
			};
			proxy.pushHandler(handler);
			sketcher.defineClipboard(proxy);
			sketcher.defineContext(new WebMolKit.MenuProxyWeb());

			sketcher.setup(() => sketcher.render(document.getElementById('sketcher')));
		</script>
	</body>
</html>
```

### Electron App

Using _WebMolKit_ as an incorporated library involves a few more steps. The following sequence can be used to bootstrap a new _Electron_ project (whereby _Electron_ is the desktop framework for _JavaScript_ apps).

```
$ mkdir electron-wmk && cd-electron-wmk
$ npm init
```

In response to the NPM initialisation questions, enter `main.js` for the _entry point_, and for everything else, the default choice is fine.

Add the development libraries and _WebMolKit_:

```
$ npm i --save-dev webpack electron raw-loader
$ npm i webmolkit
```

The bare minimum `main.js` file creates the sketcher window:

```
const { app, BrowserWindow } = require('electron');

function createWindow()
{
    const win = new BrowserWindow(
    {
        width: 900,
        height: 780,
        webPreferences: {nodeIntegration: true},
    });
    win.loadFile('index.html');
}

app.whenReady().then(() => createWindow());
```

The rendering task is implemented in `index.js`:

```
import {Sketcher} from 'webmolkit/sketcher/Sketcher';
import {ClipboardProxyWeb, ClipboardProxyHandler} from 'webmolkit/ui/ClipboardProxy';
import {MenuProxyWeb} from 'webmolkit/ui/MenuProxy';

let sketcher = new Sketcher();
sketcher.setSize(800, 700);

let proxy = new ClipboardProxyWeb();
let handler = new ClipboardProxyHandler();
handler.copyEvent = (andCut, proxy) =>
{
	sketcher.performCopySelection(andCut);
	return true;
};
handler.pasteEvent = (proxy) =>
{
	sketcher.pasteText(proxy.getString());
	return true;
};
proxy.pushHandler(handler);
sketcher.defineClipboard(proxy);
sketcher.defineContext(new MenuProxyWeb());

sketcher.setup(() => sketcher.render(document.getElementById('sketcher')));
```

Note that the code uses ES6-style imports, with reference to the _WebMolKit_ library imported via NPM. This does not actually execute in the Electron runtime, and so for this we need to bring in `webpack` to tie everything together. Create the file `webpack.config.js`:

```
const path = require('path');

module.exports = 
{
	entry: './index.js',
	target: 'electron-main',
	mode: 'development',
	module: 
	{
		rules: 
		[
			{test: /\.svg$/, loader: 'raw-loader'},
			{test: /\.ds$/, loader: 'raw-loader'},
			{test: /\.onto$/, loader: 'raw-loader'},
		],
	},
	performance: 
	{
		hints: false,
		maxEntrypointSize: 512000,
		maxAssetSize: 512000
	},
	output: 
	{
		path: path.resolve(__dirname, '.'),
		filename: 'index-pack.js',
		library: 'Main',
	},
	devtool: 'source-map',
};
```

This is a very vanilla configuration, which calls out to `electron-main` as the target type, and transpiles `index.js` to `index-pack.js`, which incorporates all the necessary libraries and uses the module loading system desired by the target. Note specifically in the _rules_ section above, that it invokes `raw-loader` for files with several different extensions. This is necessary for asset bundling, which is used within the sketcher.

The `package.json` file will mostly be filled in, but adding a couple of parts to the _scripts_ section is useful for compiling and running:

```
{
  "name": "electron-wmk",
  "version": "1.0.0",
  "description": "",
  "main": "main.js",
  "scripts": {
    "build": "webpack --config webpack.config.js",
    "start": "electron ."
  },
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "electron": "^33.2.1",
    "raw-loader": "^4.0.2",
    "webpack": "^5.97.1",
    "webpack-cli": "^6.0.1"
  },
  "dependencies": {
    "webmolkit": "^2.0.0"
  }
}
```

Rendering is done by `index.html`:

```
<html>
    <head>
        <title>Electron/WebMolKit</title>
    </head>
    <body>
        <div id="sketcher"></div>
        <script src="index-pack.js" charset="UTF-8"></script>
    </body>
</html>
```

And finally you can run the project with `npm run start` which will fire up the Electron runtime and present a desktop window with a sketcher.

## More information

Documentation is mostly in the form of [source comments](https://github.com/aclarkxyz/web_molkit/tree/master/src) and some [example code](https://github.com/aclarkxyz/web_molkit/tree/master/val/html). As of December 2024 the codebase had been very recently converted to using the new ES6 import syntax, as opposed to the legacy TypeScript _namespace_ feature, so incorporating it into larger projects is more streamlined. 

# Feedback

If you have any questions, comments or inquiries, feel free to write to [aclark@molmatinf.com](mailto:aclark@molmatinf.com). Serious people welcome; trolls, spammers and haters not so much.