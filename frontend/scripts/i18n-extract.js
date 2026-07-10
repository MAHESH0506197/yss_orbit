import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';
import * as parser from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default || traverseModule;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '../src');
const enJsonPath = path.join(srcDir, 'utils/i18n/locales/en.json');
const teJsonPath = path.join(srcDir, 'utils/i18n/locales/te.json');

const enJson = JSON.parse(fs.readFileSync(enJsonPath, 'utf8'));
const teJson = JSON.parse(fs.readFileSync(teJsonPath, 'utf8'));

// Deep set utility
function set(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

const files = globSync('**/*.{tsx,ts}', { cwd: srcDir, absolute: true, ignore: ['**/*.test.tsx', '**/*.spec.tsx'] });

let keysFound = 0;

files.forEach(file => {
  const code = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'decorators-legacy'],
    });
  } catch (e) {
    return;
  }

  traverse(ast, {
    CallExpression(path) {
      if (path.node.callee.name === 't' && path.node.arguments.length >= 2) {
        const keyNode = path.node.arguments[0];
        const defaultNode = path.node.arguments[1];
        if (keyNode.type === 'StringLiteral' && defaultNode.type === 'StringLiteral') {
          const key = keyNode.value;
          const defaultText = defaultNode.value;
          
          set(enJson, key, defaultText);
          
          // For te.json, if it doesn't exist, provide a prefix
          let teCurrent = teJson;
          const keyParts = key.split('.');
          for (let i = 0; i < keyParts.length - 1; i++) {
             if (!teCurrent[keyParts[i]]) teCurrent[keyParts[i]] = {};
             teCurrent = teCurrent[keyParts[i]];
          }
          if (!teCurrent[keyParts[keyParts.length - 1]]) {
             teCurrent[keyParts[keyParts.length - 1]] = `[TE] ${defaultText}`;
          }
          keysFound++;
        }
      }
    }
  });
});

fs.writeFileSync(enJsonPath, JSON.stringify(enJson, null, 2), 'utf8');
fs.writeFileSync(teJsonPath, JSON.stringify(teJson, null, 2), 'utf8');

console.log(`Extracted and merged ${keysFound} translations.`);
