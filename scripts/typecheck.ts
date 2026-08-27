import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const hasInstalledReactTypes = existsSync(join(root, 'node_modules', '@types', 'react', 'package.json'));
const config = hasInstalledReactTypes ? 'tsconfig.app.json' : 'tsconfig.offline.json';
const result = spawnSync('tsc', ['-p', config, '--pretty', 'false'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  process.stderr.write(`Typecheck runner failed: ${result.error.message}\n`);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
