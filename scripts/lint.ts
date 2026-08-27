import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const scanRoots = [join(root, 'src'), join(root, 'scripts')];
const violations: string[] = [];
const sourceExtensions = new Set(['.ts', '.tsx', '.css', '.html']);
const javascriptExtensions = new Set(['.js', '.jsx', '.cjs', '.mjs']);
const ignoredDirectories = new Set(['node_modules', 'dist', '.git']);

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    if (ignoredDirectories.has(entry)) {
      return [];
    }
    const absolute = join(directory, entry);
    return statSync(absolute).isDirectory() ? walk(absolute) : [absolute];
  });
}

const files = scanRoots.flatMap(walk);

for (const file of walk(root)) {
  if (javascriptExtensions.has(extname(file))) {
    violations.push(`${relative(root, file)}: JavaScript source file is not allowed`);
  }
}

function stripStringsAndComments(content: string): string {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/.*$/gm, ' ')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/`(?:\\.|[^`\\])*`/g, '``');
}

const forbiddenPatterns: readonly { label: string; pattern: RegExp }[] = [
  { label: 'explicit any type', pattern: /\bany\b/ },
  { label: 'type assertion', pattern: /\bas\s+(?!const\b)[A-Za-z_$<{[]/ },
  { label: 'DOM innerHTML injection', pattern: /\binnerHTML\b|dangerouslySetInnerHTML/ },
  { label: 'inline onclick markup', pattern: /onclick\s*=/ },
  { label: 'console statement', pattern: /\bconsole\.(?:log|debug|info|warn|error)\b/ },
];

for (const file of files) {
  if (!sourceExtensions.has(extname(file))) {
    continue;
  }
  if (file.endsWith('react-validation.d.ts') || file.endsWith(`${join('scripts', 'lint.ts')}`)) {
    continue;
  }

  const content = stripStringsAndComments(readFileSync(file, 'utf8'));
  for (const rule of forbiddenPatterns) {
    if (rule.pattern.test(content)) {
      violations.push(`${relative(root, file)}: ${rule.label}`);
    }
  }
}

const css = readFileSync(join(root, 'src', 'index.css'), 'utf8');
if (!css.includes('@import "tailwindcss";')) {
  violations.push('src/index.css: Tailwind CSS import is required');
}

if (violations.length > 0) {
  process.stderr.write(`Lint failed with ${violations.length} violation(s):\n${violations.map((item) => `- ${item}`).join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Lint passed: ${files.length} source files checked.\n`);
}
