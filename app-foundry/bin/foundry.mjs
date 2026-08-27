#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const templateDir = path.join(root, 'template');
const config = JSON.parse(fs.readFileSync(path.join(root, 'foundry.config.json'), 'utf8'));

const args = process.argv.slice(2);
const command = args[0] ?? 'help';

function usage() {
  console.log(`\nApp Foundry\n\nCreate a new app:\n  npm run new -- my-app\n\nOptional overrides:\n  npm run new -- my-app --name "My App" --bundle com.company.myapp --out ../my-app\n\nFoundry will:\n  1. Create a clean Expo SDK ${config.expoSdk} TypeScript app\n  2. Install local storage, RevenueCat, and expo-dev-client\n  3. Overlay the standard ship/monetization files\n  4. Add doctor/typecheck/ship scripts\n\nThen:\n  cd ../my-app\n  cp .env.example .env\n  npm run ios\n  npm run ship:ios\n`);
}

function value(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

function titleCase(slug) {
  return slug
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function run(commandName, commandArgs, cwd = process.cwd()) {
  const result = spawnSync(commandName, commandArgs, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const ignoredDirs = new Set(['node_modules', '.git', '.expo']);
const textExtensions = new Set(['.json', '.js', '.mjs', '.ts', '.tsx', '.md', '.txt', '.yml', '.yaml', '.example']);
const textNames = new Set(['.env.example', '.gitignore']);

function replaceTokens(targetDir, tokens) {
  for (const entry of fs.readdirSync(targetDir, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirs.has(entry.name)) continue;
    const full = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      replaceTokens(full, tokens);
      continue;
    }
    if (!textNames.has(entry.name) && !textExtensions.has(path.extname(entry.name))) continue;

    const raw = fs.readFileSync(full, 'utf8');
    let next = raw;
    for (const [token, replacement] of Object.entries(tokens)) {
      next = next.split(token).join(replacement);
    }
    if (next !== raw) fs.writeFileSync(full, next);
  }
}

if (command === 'help' || command === '--help' || command === '-h') {
  usage();
  process.exit(0);
}

if (command !== 'new') {
  console.error(`Unknown command: ${command}`);
  usage();
  process.exit(1);
}

const slug = args[1];
if (!slug || slug.startsWith('-')) {
  console.error('Missing app slug. Example: npm run new -- star-journal');
  process.exit(1);
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error('App slug must use lowercase letters, numbers, and single hyphens only.');
  process.exit(1);
}

const compactSlug = slug.replace(/-/g, '');
const appName = value('--name', titleCase(slug));
const bundle = value('--bundle', `${config.bundlePrefix}.${compactSlug}`);
const out = path.resolve(process.cwd(), value('--out', `../${slug}`));

if (fs.existsSync(out) && fs.readdirSync(out).length > 0) {
  console.error(`Refusing to overwrite non-empty directory: ${out}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(out), { recursive: true });

console.log(`\n[1/4] Creating Expo SDK ${config.expoSdk} app...\n`);
run('npx', ['--yes', 'create-expo-app@latest', out, '--template', `blank-typescript@sdk-${config.expoSdk}`, '--yes']);

console.log('\n[2/4] Installing standard native dependencies...\n');
run('npx', ['expo', 'install', '@react-native-async-storage/async-storage', 'react-native-purchases', 'react-native-purchases-ui', 'expo-dev-client'], out);

console.log('\n[3/4] Applying App Foundry overlay...\n');
fs.cpSync(templateDir, out, { recursive: true, force: true });
replaceTokens(out, {
  '__APP_NAME__': appName,
  '__APP_SLUG__': slug,
  '__BUNDLE_ID__': bundle,
  '__PACKAGE_NAME__': bundle,
});

const packagePath = path.join(out, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.scripts = {
  ...pkg.scripts,
  typecheck: 'tsc --noEmit',
  doctor: 'node ./scripts/doctor.mjs',
  'ship:ios': 'node ./scripts/ship-ios.mjs',
};
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log('\n[4/4] Running App Foundry doctor...\n');
run(process.execPath, ['./scripts/doctor.mjs'], out);

console.log(`\nCreated ${appName} at ${out}`);
console.log(`Bundle ID: ${bundle}`);
console.log('\nNext:');
console.log(`  cd ${out}`);
console.log('  cp .env.example .env');
console.log('  npm run ios');
console.log('  npm run ship:ios');
