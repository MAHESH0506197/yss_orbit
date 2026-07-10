const fs = require('fs');
const glob = require('glob');
const path = require('path');

const targetDirs = process.argv.slice(2).map(dir => path.resolve(__dirname, '..', dir));

if (targetDirs.length === 0) {
  console.log("Please provide target directories");
  process.exit(1);
}

const files = targetDirs.flatMap(dir => glob.sync('**/*.{ts,tsx}', { cwd: dir, absolute: true }));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes("t('") || content.includes('t("')) {
    let modified = false;
    
    // Check if useTranslation is imported
    if (!content.includes("useTranslation")) {
      content = `import { useTranslation } from 'react-i18next';\n` + content;
      modified = true;
    }
    
    if (!content.includes("const { t }") && !content.includes("const {t}")) {
      // Find the first component or function declaration
      content = content.replace(/((?:export\s+)?(?:const|function|let)\s+\w+(?:\s*:\s*[A-Za-z0-9_<>.]+)?\s*=?\s*(?:\([^)]*\))?\s*(?:=>)?\s*{)/, "$1\n  const { t } = useTranslation();");
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Fixed ${file}`);
    }
  }
});
