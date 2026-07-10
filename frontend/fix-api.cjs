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
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk('C:/PROJECT/yss_orbit/frontend/src');
let changedFiles = 0;
files.forEach(file => {
  if (file.includes('apiClient.ts') || file.includes('client.ts') || file.includes('authService.ts')) return;
  let content = fs.readFileSync(file, 'utf8');
  const newContent = content
    .replace(/'\/api\/v1\//g, "'/")
    .replace(/`\/api\/v1\//g, "`/")
    .replace(/"\/api\/v1\//g, '"/');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    changedFiles++;
  }
});
console.log('Fixed API paths in ' + changedFiles + ' files.');
