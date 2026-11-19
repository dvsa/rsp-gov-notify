const path = require('path');
const lambdaNames = require('./lambdas.json');

module.exports = {
	entry: Object.fromEntries(
		lambdaNames.lambdas.map((name) => [name, `./src/functions/${name}.js`]),
	),

	// Each deployed Lambda is bundled independently.
	output: {
		filename: '[name]/app.js',
		libraryTarget: 'commonjs2',
		path: path.resolve('.webpack'),
		asyncChunks: false,
	},

	// Resolve .ts and .js extensions
	resolve: {
		extensions: ['.ts', '.js'],
	},

	// Target node
	target: 'node',

	mode: 'development',

	externals: {
		fsevents: 'require(\'fsevents\')',
	},

	module: {
		rules: [
			{
				test: /\.m?js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [
							['@babel/preset-env'],
						],
					},
				},
			},
		],
	},

};
