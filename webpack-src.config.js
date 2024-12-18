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
	performance: 
	{
		hints: false,
		maxEntrypointSize: 512000,
		maxAssetSize: 512000
	},
	output: 
	{
		path: path.resolve(__dirname, 'dist'),
		filename: 'webmolkit.js',
		library: 'WebMolKit',
	},
	mode: 'production',
	devtool: 'source-map',
};