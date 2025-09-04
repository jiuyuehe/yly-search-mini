#!/usr/bin/env node
/**
 * deploy.js
 * 1. (optional) build project (npm run build:test)
 * 2. (optional) copy extra plugin/static resources into dist (copyFTS)
 * 3. zip dist
 * 4. upload zip via SFTP
 * 5. unzip remotely to target path
 * 6. (optional) delete remote zip + local zip
 *
 * Usage examples:
 *   node deploy.js                  # build + deploy
 *   node deploy.js --skip-build     # deploy existing dist
 *   node deploy.js --keep-zip       # keep local zip
 *   node deploy.js --dry-run        # only show planned actions
 */

import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import Client from 'ssh2-sftp-client';
import { Client as SSHClient } from 'ssh2';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CLI Flags ---
const argv = new Set(process.argv.slice(2));
const SKIP_BUILD = argv.has('--skip-build');
const KEEP_ZIP = argv.has('--keep-zip');
const DRY_RUN = argv.has('--dry-run');

// --- Read package info ---
let pkg = { name: 'app', version: '0.0.0' };
try { pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')); } catch { /* ignore read error */ }

function formatDate(d = new Date()) {
  const p = (n)=> String(n).padStart(2,'0');
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

const appName = pkg.name || 'app';
const version = pkg.version || '0.0.0';
const formattedDate = formatDate();

const config = {
  distDir: 'dist',
  zipFileName: `${appName}-${version}-${formattedDate}.zip`,
  server: {
    host: process.env.DEPLOY_HOST || '192.168.11.11',
    user: process.env.DEPLOY_USER || 'root',
    pass: process.env.DEPLOY_PASS || 'yliyun123',
    remotePath: process.env.DEPLOY_REMOTE || '/opt/yliyun/work/nginx/plugins/fts'
  },
  // Optional extra resources source -> will be copied into dist/plugins/fts (adjust as needed)
  extraFTS: {
    enabled: true,
    source: path.resolve('D:/project/yliyun-demos/pub'), // Windows local example path
    targetSubDir: 'plugins/fts'
  }
};

// Validate dist exists
function ensureDistExists() {
  if (!fs.existsSync(config.distDir)) {
    throw new Error(`Dist directory '${config.distDir}' does not exist. Build first or use correct path.`);
  }
}

// Build step
function build() {
  console.log('==> Building project (npm run build:test)...');
  const r = spawnSync(/^win/i.test(process.platform)?'npm.cmd':'npm', ['run','build:test'], { stdio: 'inherit' });
  if (r.status !== 0) {
    throw new Error('Build failed. Aborting deploy.');
  }
}

// Zip dist
function zipFiles() {
  return new Promise((resolve, reject) => {
    console.log(`==> Zipping '${config.distDir}' -> ${config.zipFileName}`);
    const output = fs.createWriteStream(path.join(__dirname, config.zipFileName));
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => {
      console.log(`   Zip complete: ${archive.pointer()} bytes`);
      resolve();
    });
    archive.on('error', err => reject(err));
    archive.pipe(output);
    archive.directory(config.distDir + '/', false);
    archive.finalize();
  });
}

// Upload zip via SFTP
async function uploadFile() {
  const sftp = new Client();
  const _remoteZip = path.posix.join(config.server.remotePath, config.zipFileName);
  console.log(`==> Uploading zip to ${config.server.host}:${_remoteZip}`);
  try {
    await sftp.connect({ host: config.server.host, username: config.server.user, password: config.server.pass });
  await sftp.fastPut(config.zipFileName, _remoteZip, { concurrency: 32 });
  const exists = await sftp.exists(_remoteZip);
    if (!exists) throw new Error('Remote zip not found after upload.');
    console.log('   Upload verified.');
  } finally { await sftp.end(); }
}

// Unzip remotely
function unzipRemote() {
  return new Promise((resolve, reject) => {
    const ssh = new SSHClient();
    console.log('==> Unzipping remotely ...');
    ssh.on('ready', () => {
      const cmd = [
        `cd ${config.server.remotePath}`,
        `unzip -o ${config.zipFileName}`
      ].join(' && ');
      ssh.exec(cmd, (err, stream) => {
        if (err) return reject(err);
        let out=''; let errOut='';
        stream.on('close', (code) => {
          if (code !== 0) {
            console.warn('   Unzip exit code:', code);
          }
            if (errOut) console.warn('   STDERR:', errOut);
            console.log('   Unzip done.');
            ssh.end();
            resolve();
        }).on('data', d=> out+=d).stderr.on('data', d=> errOut+=d);
      });
    }).connect({ host: config.server.host, username: config.server.user, password: config.server.pass });
  });
}

// (Optional) delete remote zip after extract
function deleteRemoteZip() {
  return new Promise((resolve, reject) => {
    const ssh = new SSHClient();
    const remoteZip = path.posix.join(config.server.remotePath, config.zipFileName);
    console.log('==> Deleting remote zip ...');
    ssh.on('ready', () => {
      ssh.exec(`rm -f ${remoteZip}`, (err, stream) => {
        if (err) return reject(err);
        stream.on('close', () => { ssh.end(); resolve(); })
          .on('data',()=>{})
          .stderr.on('data',()=>{});
      });
    }).connect({ host: config.server.host, username: config.server.user, password: config.server.pass });
  });
}

// Delete local zip
function deleteLocalZip() {
  if (KEEP_ZIP) { console.log('==> Keeping local zip (flag --keep-zip)'); return; }
  try {
    fs.unlinkSync(path.join(__dirname, config.zipFileName));
    console.log('==> Local zip deleted.');
  } catch (e) { console.warn('Could not delete local zip:', e.message); }
}

async function main() {
  console.log(`Deploy start: ${appName}@${version}  (zip: ${config.zipFileName})`);
  if (DRY_RUN) {
    console.log('[DRY RUN] Planned steps: build? ', !SKIP_BUILD, ' copyFTS, zip, upload, unzip, cleanup');
    return;
  }
  if (!SKIP_BUILD) build(); else console.log('==> Skip build (flag --skip-build)');
  ensureDistExists();
  await zipFiles();
  await uploadFile();
  await unzipRemote();
  await deleteRemoteZip();
  deleteLocalZip();
  console.log('✅ Deploy completed successfully.');
}

main().catch(err => {
  console.error('❌ Deploy failed:', err);
  process.exit(1);
});
