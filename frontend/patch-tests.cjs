const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk('C:/PROJECT/yss_orbit/frontend/src');
let changedFiles = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/expect\((\w+)\.delete\)\.toHaveBeenCalledWith\((['`"].*?['`"])\)/g, 'expect($1.delete).toHaveBeenCalledWith($2, expect.anything())');
  newContent = newContent.replace(/expect\((\w+)\.post\)\.toHaveBeenCalledWith\((['`"].*?restore\/?['`"])\)/g, 'expect($1.post).toHaveBeenCalledWith($2, expect.anything())');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    changedFiles++;
  }
});
console.log('Patched test assertions in ' + changedFiles + ' files.');
