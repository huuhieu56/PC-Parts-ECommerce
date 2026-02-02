const fs = require('fs');
const path = require('path');
const readline = require('readline');

const dataDir = path.resolve(__dirname, '../pc-part-dataset/data/jsonl');

const normalize = (key) => key.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

async function collectKeys() {
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.jsonl'));
  const keys = new Set();
  for (const file of files) {
    const fullPath = path.join(dataDir, file);
    const rl = readline.createInterface({
      input: fs.createReadStream(fullPath),
      crlfDelay: Infinity,
    });
    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const record = JSON.parse(trimmed);
        Object.keys(record).forEach((key) => {
          if (key === 'name' || key === 'price' || key === 'image' || key === 'id') return;
          keys.add(normalize(key));
        });
      } catch (error) {
        console.error(`Failed to parse line in ${file}:`, error.message);
      }
    }
  }
  return Array.from(keys).sort();
}

collectKeys().then((list) => {
  console.log(list.join('\n'));
});
