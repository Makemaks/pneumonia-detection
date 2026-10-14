import { access } from 'node:fs/promises';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const repoDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const children = [];
let stopping = false;

function port(value, fallback) {
  const result = Number(value ?? fallback);
  if (!Number.isInteger(result) || result < 1 || result > 65535) {
    throw new Error(`Invalid local port: ${value}`);
  }
  return result;
}

function checkPort(number) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', () => reject(new Error(`Port ${number} is already in use. Choose another PNEUMONIA_API_PORT or PNEUMONIA_WEB_PORT.`)));
    server.listen(number, '127.0.0.1', () => server.close(resolve));
  });
}

function signal(child, name) {
  if (!child.pid) return;
  try {
    if (process.platform === 'win32') child.kill(name);
    else process.kill(-child.pid, name);
  } catch (error) {
    if (error.code !== 'ESRCH') console.error(error.message);
  }
}

async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) signal(child, 'SIGTERM');
  await Promise.race([
    Promise.all(children.map(child => child.closed)),
    delay(5000),
  ]);
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) signal(child, 'SIGKILL');
  }
  process.exit(code);
}

function launch(command, args, env) {
  const child = spawn(command, args, {
    cwd: repoDir,
    env,
    stdio: ['ignore', 'inherit', 'inherit'],
    detached: process.platform !== 'win32',
  });
  child.closed = new Promise(resolve => child.once('close', resolve));
  child.once('error', error => {
    console.error(error.message);
    void stop(1);
  });
  child.once('exit', code => {
    if (!stopping) {
      console.error(`${command} exited; stopping both development servers.`);
      void stop(code ?? 1);
    }
  });
  children.push(child);
  return child;
}

async function waitFor(url, health = false) {
  for (let attempt = 0; attempt < 120 && !stopping; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (response.ok && (!health || (await response.json()).status === 'ok')) return;
    } catch {}
    await delay(500);
  }
  throw new Error(`Server did not become ready: ${url}`);
}

// npm can forward a second signal after the terminal sends the first one.
// Keep handlers installed throughout cleanup and handle terminal closure too.
process.on('SIGINT', () => void stop());
process.on('SIGTERM', () => void stop());
process.on('SIGHUP', () => void stop());
process.on('exit', () => {
  for (const child of children) signal(child, 'SIGTERM');
});

try {
  const apiPort = port(process.env.PNEUMONIA_API_PORT, 8001);
  const webPort = port(process.env.PNEUMONIA_WEB_PORT, 5174);
  if (apiPort === webPort) throw new Error('The backend and frontend need different ports.');
  try {
    await Promise.all([
      access(resolve(repoDir, '.venv/bin/python')),
      access(resolve(repoDir, 'frontend/node_modules/.bin/vite')),
    ]);
  } catch {
    throw new Error('Run npm run setup first.');
  }
  await Promise.all([checkPort(apiPort), checkPort(webPort)]);
  const env = {
    ...process.env,
    PNEUMONIA_API_PORT: String(apiPort),
    PNEUMONIA_WEB_PORT: String(webPort),
  };
  console.log('Starting the backend and loading the saved model...');
  launch('bash', ['scripts/start-backend.sh', '--reload', '--reload-dir', 'app'], env);
  await waitFor(`http://127.0.0.1:${apiPort}/health`, true);
  launch('npm', ['--prefix', 'frontend', 'run', 'dev'], env);
  await waitFor(`http://127.0.0.1:${webPort}/`);
  console.log(`\nPneumonia: http://127.0.0.1:${webPort}\nAPI: http://127.0.0.1:${apiPort}\nPress Ctrl+C to stop both servers.\n`);
} catch (error) {
  if (!stopping) console.error(error.message);
  await stop(1);
}
