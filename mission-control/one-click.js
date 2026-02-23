#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = __dirname;
const missionUrl = 'http://localhost:4173';

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options
    });

    child.on('exit', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`${command} ${args.join(' ')} failed with code ${code}`));
    });
    child.on('error', reject);
  });
}

function runServer() {
  return spawn('node', ['server/server.js'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
}

async function ensureDependencies() {
  const expressPath = path.join(root, 'node_modules', 'express');
  if (fs.existsSync(expressPath)) {
    console.log('✓ Dependencies already installed.');
    return;
  }

  console.log('Installing dependencies (first run only)...');
  await run('npm', ['install']);
}

async function healthCheck() {
  try {
    const res = await fetch(`${missionUrl}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForServer(timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await healthCheck()) return;
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error('Server did not become healthy in time.');
}

function openBrowser() {
  const launcher = process.platform === 'win32'
    ? ['cmd', ['/c', 'start', '', missionUrl]]
    : process.platform === 'darwin'
      ? ['open', [missionUrl]]
      : ['xdg-open', [missionUrl]];

  try {
    const child = spawn(launcher[0], launcher[1], { stdio: 'ignore', detached: true });
    child.on('error', () => {
      console.log(`Open this URL in your browser: ${missionUrl}`);
    });
    child.unref();
    console.log(`✓ Opened ${missionUrl}`);
  } catch {
    console.log(`Open this URL in your browser: ${missionUrl}`);
  }
}

async function main() {
  console.log('Mission Control one-click launcher');
  await ensureDependencies();

  if (await healthCheck()) {
    console.log('✓ Existing Mission Control server detected.');
    openBrowser();
    return;
  }

  console.log('Starting local server...');
  const server = runServer();
  let serverExited = false;

  server.on('exit', (code) => {
    serverExited = true;
    if (code !== 0) {
      console.error(`Server process exited early with code ${code}.`);
      process.exit(code ?? 1);
    }
  });

  process.on('SIGINT', () => {
    server.kill('SIGINT');
    process.exit(0);
  });

  await waitForServer();

  if (serverExited) {
    throw new Error('Server stopped before becoming ready.');
  }

  openBrowser();
  console.log('✓ Mission Control is running. Press Ctrl+C in this window to stop it.');
}

main().catch((error) => {
  console.error('Launch failed:', error.message);
  process.exit(1);
});
