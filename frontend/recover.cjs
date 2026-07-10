const fs = require('fs');
const lines = fs.readFileSync('C:/Users/yarla/.gemini/antigravity/brain/e5942a60-8627-4724-a2f8-c257a45ad07e/.system_generated/logs/transcript_full.jsonl', 'utf8').split('\n');

let lastGoodContent = '';
for (const line of lines) {
  if (!line) continue;
  try {
    const parsed = JSON.parse(line);
    if (parsed.tool_calls) {
      for (const t of parsed.tool_calls) {
        if (t.name === 'default_api:replace_file_content' || t.name === 'default_api:write_to_file') {
          if (t.arguments && t.arguments.TargetFile && t.arguments.TargetFile.endsWith('en.json')) {
            if (t.arguments.ReplacementContent) {
               lastGoodContent = t.arguments.ReplacementContent;
            } else if (t.arguments.CodeContent) {
               lastGoodContent = t.arguments.CodeContent;
            }
          }
        }
      }
    }
  } catch(e) {}
}

if (lastGoodContent) {
  fs.writeFileSync('C:/PROJECT/yss_orbit/frontend/scratch_en.json', lastGoodContent, 'utf8');
  console.log('Recovered en.json to scratch_en.json. Length:', lastGoodContent.length);
} else {
  console.log('Could not find content.');
}
