import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const sections = ['MOCHI — resolved third-party dependency notices\nGenerated from installed npm packages and Cargo metadata.\n'];
function append(name, version, license, directory) {
  const files = readdirSync(directory, { withFileTypes: true }).filter(f => f.isFile() && /^(licen[cs]e|copying|copyright|notice)([._-]|$)/i.test(f.name));
  sections.push(`\n${'='.repeat(72)}\n${name} ${version}\nDeclared license: ${license || 'See package source'}\n`);
  for (const file of files) sections.push(`\n--- ${file.name} ---\n${readFileSync(join(directory, file.name), 'utf8')}\n`);
  if (!files.length) sections.push('No standalone license file in this package; consult its declared license and upstream distribution.\n');
}
const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
for (const [path, entry] of Object.entries(lock.packages)) {
  if (!path || entry.dev) continue;
  const directory = join(root, path), manifest = join(directory, 'package.json');
  if (!existsSync(manifest)) continue; // Optional packages for other platforms are not bundled.
  const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
  append(pkg.name, pkg.version, pkg.license, directory);
}
const cargo = join(homedir(), '.cargo', 'bin', process.platform === 'win32' ? 'cargo.exe' : 'cargo');
const metadata = JSON.parse(execFileSync(existsSync(cargo) ? cargo : 'cargo', ['metadata', '--locked', '--offline', '--format-version', '1', '--filter-platform', 'x86_64-pc-windows-msvc', '--manifest-path', join(root, 'src-tauri/Cargo.toml')], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }));
const active = new Set(metadata.resolve.nodes.map(node => node.id));
for (const pkg of metadata.packages) if (pkg.source && active.has(pkg.id)) append(pkg.name, pkg.version, pkg.license, dirname(pkg.manifest_path));
mkdirSync(join(root, 'licenses'), { recursive: true });
writeFileSync(join(root, 'licenses', 'THIRD_PARTY_LICENSES.txt'), sections.join('\n'));
console.log('Generated licenses/THIRD_PARTY_LICENSES.txt for this Windows build.');
