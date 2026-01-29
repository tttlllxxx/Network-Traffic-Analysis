/**
 * 统计剧本1000中 technique 频次，取前40，随机打乱后替换 attackMethods.js 的 name/label
 */
const fs = require('fs');
const path = require('path');

const scriptDir = path.join(__dirname, '../剧本1000');
const attackMethodsPath = path.join(__dirname, '../vuetest/src/data/attackMethods.js');

// 读取所有剧本 JSON
const jsonFiles = fs.readdirSync(scriptDir).filter(f => f.endsWith('.json'));
const count = {};
for (const file of jsonFiles) {
  const filePath = path.join(scriptDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  for (const item of data) {
    if (item.stages && Array.isArray(item.stages)) {
      for (const stage of item.stages) {
        if (stage.technique) {
          count[stage.technique] = (count[stage.technique] || 0) + 1;
        }
      }
    }
  }
}

// 按频次降序，取前40
const sorted = Object.entries(count)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 40)
  .map(([t]) => t);

// Fisher-Yates 随机打乱
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const top40Shuffled = shuffle(sorted);

// 读取原 attackMethods.js，替换 name 和 label
let content = fs.readFileSync(attackMethodsPath, 'utf8');
const nameLabelRegex = /"name":\s*"[^"]+",\s*"type":\s*"method",\s*"label":\s*"[^"]+"/g;
let idx = 0;
content = content.replace(nameLabelRegex, () => {
  const val = top40Shuffled[idx];
  idx++;
  return `"name": "${val}",\n    "type": "method",\n    "label": "${val}"`;
});

fs.writeFileSync(attackMethodsPath, content, 'utf8');
console.log('Top 40 techniques (shuffled) applied to attackMethods.js:');
top40Shuffled.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
