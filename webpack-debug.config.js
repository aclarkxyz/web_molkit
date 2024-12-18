const path = require('path');

module.exports = 
{
	entry: './dist/index-val.ts',
	module: 
	{
		rules: 
		[
			{
				test: /\.ts$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: 
	{
		extensions: ['.ts', '.js'],
	},
	output: 
	{
		path: path.resolve(__dirname, 'dist'),
		filename: 'webmolkit-debug.js',
		sourceMapFilename: 'webmolkit-debug.js.map',
		library: 'WebMolKit',
	},
	mode: 'development',
};