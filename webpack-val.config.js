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
	performance: 
	{
		hints: false,
		maxEntrypointSize: 512000,
		maxAssetSize: 512000
	},
	output: 
	{
		path: path.resolve(__dirname, 'dist'),
		filename: 'webmolkit-validate.js',
		library: 'WebMolKit',
	},
	mode: 'development',
	devtool: 'source-map',
};