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
			{test: /\.svg$/, loader: 'raw-loader'},
			{test: /\.ds$/, loader: 'raw-loader'},
			{test: /\.onto$/, loader: 'raw-loader'},
		],
	},
	resolve: 
	{
		extensions: ['.ts', '.js'],
		alias: 
		{
			//"@wmk": path.resolve(__dirname, "src"), (note: the validation build uses @wmk, but the main build does not)
			"@reswmk": path.resolve(__dirname, "res"),
		} 
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