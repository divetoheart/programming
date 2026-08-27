import { spawnSync } from 'node:child_process';
import process from 'node:process';

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(process.execPath, ['./scripts/doctor.mjs']);
run('npx', ['--yes', 'eas-cli@latest', 'build', '--platform', 'ios', '--profile', 'production', '--auto-submit']);
