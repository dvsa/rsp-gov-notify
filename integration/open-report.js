#!/usr/bin/env node
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '..', 'integration-reports', 'latest.html');
if (!fs.existsSync(file)) {
	process.stderr.write('No report yet. Run: npm run test-i\n');
	process.exit(1);
}
const opener = { darwin: 'open', win32: 'explorer' }[process.platform] || 'xdg-open';
process.stdout.write(`${file}\n`);
spawn(opener, [file], { stdio: 'ignore', detached: true }).unref();
