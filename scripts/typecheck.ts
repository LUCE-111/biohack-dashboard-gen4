import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const hasInstalledReactTypes = existsSync(join(root, 'node_modules', '@types', 'react', 'package.json'));
const config = hasInstalledReactTypes ? 'tsconfig.app.json' : 'tsconfig.offline.json';
const localTypeScriptCli = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
const hasLocalTypeScript = existsSync(localTypeScriptCli);
const command = hasLocalTypeScript ? process.execPath : 'tsc';
const args = hasLocalTypeScript
  ? [localTypeScriptCli, '-p', config, '--pretty', 'false']
  : ['-p', config, '--pretty', 'false'];
const result = spawnSync(command, args, {
  cwd: root,
  stdio: 'inherit',
});

if (result.error) {
  process.stderr.write(`Typecheck runner failed: ${result.error.message}\n`);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
