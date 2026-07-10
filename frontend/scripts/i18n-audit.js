import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';
import * as parser from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default || traverseModule;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// A script to audit translation coverage by AST-parsing React files
const srcDir = path.join(__dirname, '../src');
const enJsonPath = path.join(srcDir, 'utils/i18n/locales/en.json');
const enJson = JSON.parse(fs.readFileSync(enJsonPath, 'utf8'));

// Flatten JSON to get all dot-notation keys
function flattenObj(obj, parent = '', res = {}) {
  for (let key in obj) {
    let propName = parent ? parent + '.' + key : key;
    if (typeof obj[key] == 'object' && obj[key] !== null) {
      flattenObj(obj[key], propName, res);
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
}

const flatEnKeys = flattenObj(enJson);
const totalKeys = Object.keys(flatEnKeys).length;

console.log("=========================================");
console.log("🌐 YSS Orbit i18n Translation Audit (AST)");
console.log("=========================================\n");
console.log(`Total translated keys in en.json: ${totalKeys}\n`);

// 1. Find all tsx/ts files in src
const files = globSync('**/*.{tsx,ts}', { cwd: srcDir, absolute: true, ignore: ['**/*.test.tsx', '**/*.spec.tsx'] });

let totalStrings = 0;
let translatedCount = 0;
let untranslatedCount = 0;
let moduleStats = {};

files.forEach(file => {
  const code = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'decorators-legacy'],
    });
  } catch (e) {
    // skip parse errors
    return;
  }

  const relativePath = path.relative(srcDir, file);
  const moduleName = relativePath.split(path.sep)[0]; // e.g. 'pages', 'features', 'components'
  if (!moduleStats[moduleName]) {
    moduleStats[moduleName] = { translated: 0, untranslated: 0, issues: [] };
  }

  let fileUntranslated = 0;
  let fileTranslated = 0;

  traverse(ast, {
    CallExpression(path) {
      if (path.node.callee.name === 't') {
        fileTranslated++;
        totalStrings++;
        translatedCount++;
      }
    },
    JSXText(path) {
      const text = path.node.value.trim();
      if (text.length > 1 && /[a-zA-Z]/.test(text)) {
        // Untranslated text node!
        fileUntranslated++;
        totalStrings++;
        untranslatedCount++;
        moduleStats[moduleName].issues.push({ file: relativePath, line: path.node.loc.start.line, text });
      }
    },
    JSXAttribute(path) {
      // Check for hardcoded attributes like placeholder, title, label
      const name = path.node.name.name;
      if (['placeholder', 'title', 'label'].includes(name)) {
        if (path.node.value && path.node.value.type === 'StringLiteral') {
          const text = path.node.value.value.trim();
          if (text.length > 1 && /[a-zA-Z]/.test(text)) {
            fileUntranslated++;
            totalStrings++;
            untranslatedCount++;
            moduleStats[moduleName].issues.push({ file: relativePath, line: path.node.loc.start.line, text });
          }
        }
      }
    }
  });

  moduleStats[moduleName].translated += fileTranslated;
  moduleStats[moduleName].untranslated += fileUntranslated;
});

console.log("=== Coverage by Module ===");
for (const [mod, stats] of Object.entries(moduleStats)) {
  const total = stats.translated + stats.untranslated;
  if (total === 0) continue;
  const coverage = ((stats.translated / total) * 100).toFixed(1);
  console.log(`- ${mod}: ${coverage}% (${stats.translated}/${total})`);
}

console.log("\n=== Global Stats ===");
const globalCoverage = totalStrings === 0 ? 100 : ((translatedCount / totalStrings) * 100).toFixed(1);
console.log(`Total translatable strings found: ${totalStrings}`);
console.log(`Translated strings: ${translatedCount}`);
console.log(`Untranslated strings: ${untranslatedCount}`);
console.log(`Global Coverage: ${globalCoverage}%`);

console.log("\nRun `node scripts/i18n-audit.js > audit.log` to see full details.");

