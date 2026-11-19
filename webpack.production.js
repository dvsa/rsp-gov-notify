const fs = require('fs-extra');
const { merge } = require('webpack-merge');
const common = require('./webpack.config');
const lambdaNames = require('./lambdas.json');

const OUTPUT_FOLDER = './dist';

class BundlePlugin {
	/**
     * @param {{ archives: any; assets?: any; }} params
     */
	constructor(params) {
		this.archives = params.archives;
		this.assets = params.assets || [];
	}

	apply(compiler) {
		compiler.hooks.afterEmit.tapPromise('zip-pack-plugin', async () => {
			await Promise.all(this.archives.map((archive) => BundlePlugin.createArchive(
				archive.inputPath,
				archive.outputPath,
				archive.outputName,
				archive.ignore,
			)));
			this.assets.forEach((asset) => {
				fs.copySync(asset.inputPath, asset.outputPath);
			});
		});
	}

	static async createArchive(inputPath, outputPath, outputName, ignore) {
		const { ZipArchive } = await import('archiver');
		fs.mkdirSync(outputPath, { recursive: true });
		const output = fs.createWriteStream(`${outputPath}/${outputName}.zip`);
		const archive = new ZipArchive();
		return new Promise((resolve, reject) => {
			output.once('close', resolve);
			output.once('error', reject);
			archive.once('error', reject);
			archive.pipe(output);
			archive.glob('**/*', { cwd: inputPath, ignore });
			Promise.resolve(archive.finalize()).catch(reject);
		});
	}
}

function getArchives() {
	return lambdaNames.lambdas.map((lambdaName) => ({
		inputPath: `.webpack/${lambdaName}`,
		outputPath: `${OUTPUT_FOLDER}`,
		outputName: `${lambdaName}`,
	}));
}

module.exports = () => {
	return merge(common, {
		mode: 'production',
		plugins: [
			// @ts-ignore
			new BundlePlugin({
				archives: getArchives(),
			}),
		],
	});
};
