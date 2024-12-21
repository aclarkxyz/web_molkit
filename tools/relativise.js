/*
	Relativise: go through crosscompiled .js files (from TypeScript) and look for path aliases to swap out
	for relative references.
*/

const fs = require('fs');
const path = require('path');

const {argv} = process;
let mappings = []; // array of [aliasroot, actualpath] e.g. ['@reswmk', 'res']

for (let n = 0; n < argv.length; n++)
{
	if (argv[n] == '--map' && n < argv.length - 2)
	{
		mappings.push([argv[n + 1], path.resolve('.', argv[n + 2])]);
		n += 2;
	}
}
if (mappings.length == 0) 
{
	console.log('Arguments: --map {alias} {path}');
	process.exit();
}

recursivelyProcess('.');

function recursivelyProcess(dir)
{
	let files = fs.readdirSync(dir);
	for (let fn of files) if (fn.endsWith('.js') && !fn.startsWith('.'))
	{
		let fullPath = path.resolve(dir, fn);
		for (let [alias, mapto] of mappings)
		{
			let relpath = path.relative(dir, mapto);
			convertSourceFile(fullPath, alias, relpath);
		}
	}
	for (let fn of files) if (!fn.startsWith('.'))
	{
		let subdir = path.join(dir, fn);
		if (fs.statSync(subdir).isDirectory()) recursivelyProcess(subdir);
	}
}

function convertSourceFile(sourceFN, alias, relpath)
{
	let lines = fs.readFileSync(sourceFN).toString().split('\n');
	let modified = false;
	for (let n = 0; n < lines.length; n++)
	{
		if (!lines[n].startsWith('import')) continue;
		let i = lines[n].indexOf(alias);
		if (i < 0) continue;
		if (!modified ) console.log('Modifying source file ' + sourceFN);
		console.log('    then:', lines[n]);
		lines[n] = lines[n].substring(0, i) + relpath + lines[n].substring(i + alias.length);
		console.log('     now:', lines[n]);
		modified = true;
	}

	if (modified) fs.writeFileSync(sourceFN, lines.join('\n'));
}