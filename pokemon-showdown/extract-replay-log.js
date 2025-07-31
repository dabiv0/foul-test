const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2];
if (!inputPath || !fs.existsSync(inputPath)) {
  console.error('❌ Please provide a valid path to a .log.json file.');
  process.exit(1);
}

const outputPath = inputPath.replace(/\.log\.json$/, '.log');

try {
  const jsonData = fs.readFileSync(inputPath, 'utf8');
  const parsed = JSON.parse(jsonData);

  if (!Array.isArray(parsed.log)) {
    throw new Error('File does not contain a valid `log` array.');
  }

  const logText = parsed.log.join('\n') + '\n';
  fs.writeFileSync(outputPath, logText, 'utf8');

  console.log(`✅ Successfully extracted replay log to: ${outputPath}`);
} catch (err) {
  console.error(`❌ Error: ${err.message}`);
}
