const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2];
if (!inputPath) {
    console.error('Usage: node json-log-to-replay-html.js path/to/log.json');
    process.exit(1);
}

if (!fs.existsSync(inputPath)) {
    console.error('File not found:', inputPath);
    process.exit(1);
}

const json = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const log = Array.isArray(json.inputLog) ? json.inputLog.join('\n') : '';

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Pokémon Showdown Replay</title>
  <link rel="stylesheet" href="https://play.pokemonshowdown.com/replay/battle.css">
  <style>
    body { margin: 0; padding: 0; }
    .wrapper { max-width: 1180px; margin: 0 auto; padding: 16px; }
  </style>
</head>
<body>
  <div class="wrapper replay-wrapper">
    <div class="battle"></div>
    <div class="battle-log"></div>
    <div class="replay-controls"></div>
    <div class="replay-controls-2"></div>
    <script type="text/plain" class="battle-log-data">${log.replace(/</g, '&lt;')}</script>
  </div>
  <script src="https://play.pokemonshowdown.com/js/lib/jquery.min.js"></script>
  <script src="https://play.pokemonshowdown.com/js/replay-viewer.js"></script>
  <script>
    window.addEventListener('load', () => {
      const viewer = new window.ReplayViewer(document.querySelector('.wrapper'));
      viewer.run();
    });
  </script>
</body>
</html>`;

const outputPath = inputPath.replace(/\.log\.json$/, '.html');
fs.writeFileSync(outputPath, html);
console.log(`✅ Generated: ${outputPath}`);
