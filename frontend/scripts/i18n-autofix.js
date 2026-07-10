import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';
import * as parser from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default || traverseModule;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.join(__dirname, '../src');

const TARGET_DIRS = [
  path.join(SRC_DIR, 'features', 'payroll'),
  path.join(SRC_DIR, 'features', 'leave'),
  path.join(SRC_DIR, 'features', 'attendance'),
  path.join(SRC_DIR, 'features', 'hrms'),
  path.join(SRC_DIR, 'features', 'recruitment'),
  path.join(SRC_DIR, 'features', 'appraisal')
];
const enJsonPath = path.join(__dirname, '../src/utils/i18n/locales/en.json');
const teJsonPath = path.join(__dirname, '../src/utils/i18n/locales/te.json');

const enJson = JSON.parse(fs.readFileSync(enJsonPath, 'utf8'));
const teJson = JSON.parse(fs.readFileSync(teJsonPath, 'utf8'));

if (!enJson.auto) enJson.auto = {};
if (!teJson.auto) teJson.auto = {};

function generateKey(text) {
  let key = text.trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50);
  if (!key) key = 'empty_text';
  return key;
}

let modifiedCount = 0;

TARGET_DIRS.forEach(targetDir => {
  if (!fs.existsSync(targetDir)) {
    console.log(`Directory not found: ${targetDir}`);
    return;
  }
  const files = globSync('**/*.{tsx,ts}', { cwd: targetDir, absolute: true, ignore: ['**/*.test.tsx', '**/*.spec.tsx'] });
  files.forEach(file => {
    const code = fs.readFileSync(file, 'utf8');
    let ast;
    try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'decorators-legacy'],
    });
  } catch (e) {
    return; // skip parse errors
  }

  const replacements = [];
  let needsTranslationImport = false;
  let hasUseTranslationHook = false;

  traverse(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value === 'react-i18next') {
        needsTranslationImport = true; // wait, if it exists, we don't need to add
      }
    },
    CallExpression(path) {
      if (path.node.callee.name === 'useTranslation') {
        hasUseTranslationHook = true;
      }
    },
    JSXText(path) {
      const text = path.node.value;
      const trimmed = text.trim();
      if (trimmed.length > 1 && /[a-zA-Z]/.test(trimmed) && !/^[{}]+$/.test(trimmed)) {
        // Find exact start and end of the text to preserve spaces
        const startMatch = text.match(/^\s*/);
        const endMatch = text.match(/\s*$/);
        const leadingSpaces = startMatch ? startMatch[0] : '';
        const trailingSpaces = endMatch ? endMatch[0] : '';
        
        const key = generateKey(trimmed);
        enJson.auto[key] = trimmed;
        if (!teJson.auto[key]) teJson.auto[key] = `[TE] ${trimmed}`;

        const escapedText = trimmed.replace(/'/g, "\\'");

        replacements.push({
          start: path.node.start,
          end: path.node.end,
          text: `${leadingSpaces}{t('auto.${key}', '${escapedText}')}${trailingSpaces}`
        });
      }
    },
    JSXAttribute(path) {
      const name = path.node.name.name;
      if (['placeholder', 'title', 'label'].includes(name)) {
        if (path.node.value && path.node.value.type === 'StringLiteral') {
          const text = path.node.value.value;
          const trimmed = text.trim();
          if (trimmed.length > 1 && /[a-zA-Z]/.test(trimmed)) {
            const key = generateKey(trimmed);
            enJson.auto[key] = trimmed;
            if (!teJson.auto[key]) teJson.auto[key] = `[TE] ${trimmed}`;

            const escapedText = trimmed.replace(/'/g, "\\'");

            replacements.push({
              start: path.node.value.start,
              end: path.node.value.end,
              text: `{t('auto.${key}', '${escapedText}')}`
            });
          }
        }
      }
    }
  });

  if (replacements.length > 0) {
    // Check if useTranslation exists, if not we have to be careful about adding it.
    // For simplicity, let's just replace strings. If the file breaks because `t` is undefined,
    // we can manually fix it or let the TS compiler complain and fix.
    
    replacements.sort((a, b) => b.start - a.start);
    
    let newCode = code;
    for (const rep of replacements) {
      newCode = newCode.slice(0, rep.start) + rep.text + newCode.slice(rep.end);
    }

    // Attempt to inject import and hook if missing
    if (!code.includes("useTranslation")) {
      newCode = `import { useTranslation } from 'react-i18next';\n` + newCode;
      // Very naive hook injection, might break some components, 
      // but let's assume `export default function` or `export const` pattern
      newCode = newCode.replace(/export (default )?(function|const) ([A-Za-z0-9_]+) ?(=|\() ?(\(.*?\))? ?(=>)? ?\{/g, (match) => {
        return `${match}\n  const { t } = useTranslation();`;
      });
    }

    fs.writeFileSync(file, newCode, 'utf8');
    modifiedCount++;
  }
  });
});

fs.writeFileSync(enJsonPath, JSON.stringify(enJson, null, 2), 'utf8');
fs.writeFileSync(teJsonPath, JSON.stringify(teJson, null, 2), 'utf8');

console.log(`Auto-fixed ${modifiedCount} files. Check git diff and run typecheck.`);
