import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, join } from 'node:path';
import { createRequire } from 'node:module';

// Rustup can be installed without changing the user's global PATH. Limit the
// adjustment to this process and Tauri's children so normal npm commands work.
const cargoBin = join(homedir(), '.cargo', 'bin');
if (existsSync(join(cargoBin, process.platform === 'win32' ? 'cargo.exe' : 'cargo'))) {
  const pathKey = Object.keys(process.env).find(key => key.toLowerCase() === 'path') ?? 'PATH';
  process.env[pathKey] = cargoBin + delimiter + (process.env[pathKey] ?? '');
}
const require = createRequire(import.meta.url);
const { run } = require('@tauri-apps/cli');
try { await run(process.argv.slice(2), 'npm run tauri'); }
catch (error) { console.error(error); process.exitCode = 1; }
