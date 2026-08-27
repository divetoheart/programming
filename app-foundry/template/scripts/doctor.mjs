import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
}

function fail(message) {
  failures.push(message);
}

const app = readJson('app.json').expo;
const pkg = readJson('package.json');

if (!app?.name || !app?.slug) fail('app.json needs expo.name and expo.slug.');
if (!app?.ios?.bundleIdentifier) fail('Missing iOS bundleIdentifier.');
if (!app?.android?.package) fail('Missing Android package identifier.');
if (String(app?.ios?.bundleIdentifier).startsWith('com.example.')) fail('Replace the placeholder iOS bundle identifier.');
if (String(app?.android?.package).startsWith('com.example.')) fail('Replace the placeholder Android package identifier.');
if (!pkg?.scripts?.['ship:ios']) fail('Missing ship:ios script.');
if (!fs.existsSync(path.join(root, 'eas.json'))) fail('Missing eas.json.');
if (!fs.existsSync(path.join(root, 'STORE.md'))) fail('Missing STORE.md release metadata.');
if (!fs.existsSync(path.join(root, 'PRIVACY.md'))) fail('Missing PRIVACY.md.');

const ignored = new Set(['node_modules', '.git', '.expo']);
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scan(full);
      continue;
    }
    if (!/\.(json|js|mjs|ts|tsx|md|example)$/.test(entry.name)) continue;
    const text = fs.readFileSync(full, 'utf8');
    if (text.includes('__APP_') || text.includes('__BUNDLE_ID__') || text.includes('__PACKAGE_NAME__')) {
      fail(`Unreplaced App Foundry token in ${path.relative(root, full)}`);
    }
  }
}
scan(root);

if (failures.length) {
  console.error('\nApp Foundry doctor found problems:\n');
  for (const item of failures) console.error(`  - ${item}`);
  console.error('');
  process.exit(1);
}

console.log(`\n✓ ${app.name}`);
console.log(`✓ iOS: ${app.ios.bundleIdentifier}`);
console.log(`✓ Android: ${app.android.package}`);
console.log('✓ EAS config present');
console.log('✓ Store/privacy metadata present');
console.log('✓ No unreplaced factory tokens');
console.log('\nReady for typecheck and build.\n');
