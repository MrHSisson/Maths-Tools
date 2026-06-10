#!/usr/bin/env node
// Scaffolds a new tool: copies the canonical template and registers it in
// src/registry.ts. Usage:
//
//   npm run new-tool -- --name "Multiplying Fractions" --category Proportion \
//     --path /multiplying-fractions --description "One sentence for the card."
//
// Category is the FOLDER name: Generators | Number | Algebra | Proportion |
// Geometry | TeacherTools | ComputerScience (or a new folder).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[++i];
}

const { name, category, path, description = 'TODO: one-sentence description.' } = args;
if (!name || !category || !path || !path.startsWith('/')) {
  console.error('Usage: npm run new-tool -- --name "Display Name" --category Folder --path /url-path [--description "..."]');
  process.exit(1);
}

// Folder name → registry category display name
const CATEGORY_DISPLAY = {
  Generators: 'Generators',
  Number: 'Number',
  Algebra: 'Algebra',
  Proportion: 'Ratio & Proportion',
  Geometry: 'Geometry',
  TeacherTools: 'Teacher Tools',
  ComputerScience: 'Computer Science',
};
const displayCategory = CATEGORY_DISPLAY[category] ?? category;

const componentName = name.replace(/[^a-zA-Z0-9 ]/g, '').split(/\s+/)
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
const id = path.slice(1);

// 1. Copy the template
const templatePath = join(root, 'src/tools/TeacherTools/ToolShell.tsx');
const toolDir = join(root, 'src/tools', category);
const toolPath = join(toolDir, `${componentName}.tsx`);
if (existsSync(toolPath)) {
  console.error(`Refusing to overwrite existing file: ${toolPath}`);
  process.exit(1);
}
mkdirSync(toolDir, { recursive: true });
let template = readFileSync(templatePath, 'utf8');
template = template.replace('pageTitle: "Tool Name"', `pageTitle: ${JSON.stringify(name)}`);
writeFileSync(toolPath, template);

// 2. Register in src/registry.ts — insert at the top of the category's tools array
const registryPath = join(root, 'src/registry.ts');
let registry = readFileSync(registryPath, 'utf8');
if (registry.includes(`path: '${path}'`)) {
  console.error(`Path ${path} is already registered in src/registry.ts`);
  process.exit(1);
}
const entry = `      { id: '${id}', path: '${path}', name: ${JSON.stringify(name)}, description: ${JSON.stringify(description)}, ready: 'v2.3', enabled: false, load: () => import('./tools/${category}/${componentName}') },\n`;
const anchor = new RegExp(`(name: '${displayCategory.replace(/[&]/g, '\\$&')}',\\n    tools: \\[\\n)`);
if (!anchor.test(registry)) {
  console.error(`Could not find category "${displayCategory}" in src/registry.ts — add the entry manually:\n${entry}`);
  process.exit(1);
}
registry = registry.replace(anchor, `$1${entry}`);
writeFileSync(registryPath, registry);

console.log(`Created ${toolPath}`);
console.log(`Registered '${path}' under "${displayCategory}" (enabled: false until ready).`);
console.log('Next: fill in the tool-specific section, then npm run build && npm test.');
