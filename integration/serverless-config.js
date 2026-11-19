'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GENERATED = 'serverless.integration.generated.yml';

/**
 * Derives a throw-away serverless config from the real one:
 *  - removes serverless-dotenv-plugin so the private local .env is never loaded
 *  - injects synthetic provider environment values
 * Fails loudly if the source layout is not as expected.
 */
function deriveConfig(source, env) {
	const lines = source.split('\n');
	const pluginIdx = lines.findIndex((l) => l.trim() === '- serverless-dotenv-plugin');
	if (pluginIdx === -1) throw new Error('serverless.yml no longer lists serverless-dotenv-plugin; review integration/serverless-config.js');
	lines.splice(pluginIdx, 1);
	const regionIdx = lines.findIndex((l) => /^ {2}region:/.test(l));
	if (regionIdx === -1) throw new Error('serverless.yml provider.region not found; review integration/serverless-config.js');
	const envLines = ['  environment:', ...Object.entries(env).map(([k, v]) => `    ${k}: ${JSON.stringify(v)}`)];
	lines.splice(regionIdx + 1, 0, ...envLines);
	return lines.join('\n');
}

function writeGenerated(env) {
	const out = deriveConfig(fs.readFileSync(path.join(ROOT, 'serverless.yml'), 'utf8'), env);
	const file = path.join(ROOT, GENERATED);
	fs.writeFileSync(file, out);
	return file;
}

module.exports = { deriveConfig, writeGenerated, GENERATED };
