#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const templateDir = path.join(root, 'template');

const args = process.argv.slice(2);
const command = args[0] ?? 'help';

function usage() {
  console.log(`\nApp Foundry\n\nCreate a new app:\n  npm run new -- my-app --name "My App" --bundle com.example.myapp --out ../my-app\n\nThen:\n  cd ../my-app\n  npm install\n  cp .env.example .env\n  npm run doctor\n  npm run ios\n  npm run ship:ios\n`);
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

function replaceTokens(targetDir, tokens) {
  for (const entry of fs.readdirSync(targetDir, { withFileTypes: true })) {
    const full = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      replaceTokens(full, tokens);
      continue;
    }
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
  console.error('Missing app slug. Example: npm run new -- star-journal --name "Star Journal" --bundle com.yourname.starjournal');
  process.exit(1);
}

const appName = value('--name', titleCase(slug));
const bundle = value('--bundle', `com.example.${slug.replace(/-/g, '')}`);
const out = path.resolve(process.cwd(), value('--out', `../${slug}`));

if (fs.existsSync(out) && fs.readdirSync(out).length > 0) {
  console.error(`Refusing to overwrite non-empty directory: ${out}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.cpSync(templateDir, out, { recursive: true });
replaceTokens(out, {
  '__APP_NAME__': appName,
  '__APP_SLUG__': slug,
  '__BUNDLE_ID__': bundle,
  '__PACKAGE_NAME__': bundle,
});

console.log(`\nCreated ${appName} at ${out}`);
console.log('\nNext:');
console.log(`  cd ${out}`);
console.log('  npm install');
console.log('  cp .env.example .env');
console.log('  npm run doctor');
console.log('  npm run ios');
console.log('  npm run ship:ios');
