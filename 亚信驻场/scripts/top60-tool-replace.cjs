/**
 * 统计剧本1000中 tool 频次，取前60，随机打乱后替换 attackWeapons.js 的 name/label
 */
const fs = require('fs');
const path = require('path');

const scriptDir = path.join(__dirname, '../剧本1000');
const attackWeaponsPath = path.join(__dirname, '../vuetest/src/data/attackWeapons.js');

// 读取所有剧本 JSON
const jsonFiles = fs.readdirSync(scriptDir).filter(f => f.endsWith('.json'));
const count = {};
for (const file of jsonFiles) {
  const filePath = path.join(scriptDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  for (const item of data) {
    if (item.stages && Array.isArray(item.stages)) {
      for (const stage of item.stages) {
        if (stage.tool) {
          count[stage.tool] = (count[stage.tool] || 0) + 1;
        }
      }
    }
  }
}

// 按频次降序，取前60
const sorted = Object.entries(count)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 60)
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
const top60Shuffled = shuffle(sorted);

// 读取原 attackWeapons.js，替换 name 和 label（type 为 weapon）
let content = fs.readFileSync(attackWeaponsPath, 'utf8');
const nameLabelRegex = /"name":\s*"[^"]*",\s*"type":\s*"weapon",\s*"label":\s*"[^"]*"/g;
let idx = 0;
content = content.replace(nameLabelRegex, (match) => {
  const val = top60Shuffled[idx];
  idx++;
  // 转义 name/label 中的双引号为 \"
  const escaped = val.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"name": "${escaped}",\n    "type": "weapon",\n    "label": "${escaped}"`;
});

fs.writeFileSync(attackWeaponsPath, content, 'utf8');
console.log('Top 60 tools (shuffled) applied to attackWeapons.js:');
top60Shuffled.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
