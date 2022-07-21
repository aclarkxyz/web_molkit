const path = require('path');

module.exports = 
{
	entry: './dist/index-src.ts',
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
		filename: 'webmolkit.js',
		sourceMapFilename: 'webmolkit.js.map',
		library: 'WebMolKit',
	},
	mode: 'production',
};