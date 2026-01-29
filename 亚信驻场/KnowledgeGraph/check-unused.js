const fs = require('fs');
const path = require('path');

// 获取所有src目录下的JS文件
function getAllJSFiles(dir, baseDir = dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('node_modules')) {
      files.push(...getAllJSFiles(fullPath, baseDir));
    } else if (item.endsWith('.js')) {
      files.push(path.relative(baseDir, fullPath));
    }
  }
  
  return files;
}

// 读取文件内容并提取所有import/require
function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = new Set();
    
    // 匹配 import ... from '...'
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.add(match[1]);
    }
    
    // 匹配 require('...')
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.add(match[1]);
    }
    
    // 匹配动态import
    const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      imports.add(match[1]);
    }
    
    // 匹配 new Worker(...)
    const workerRegex = /new\s+Worker\([^,]+,\s*['"]([^'"]+)['"]/g;
    while ((match = workerRegex.exec(content)) !== null) {
      imports.add(match[1]);
    }
    
    return imports;
  } catch (error) {
    console.error(`读取文件失败 ${filePath}:`, error);
    return new Set();
  }
}

// 检查文件路径是否匹配导入路径
function matchesImport(importPath, filePath) {
  // 标准化路径
  const normalizedImport = importPath.replace(/\.js$/, '').replace(/\\/g, '/');
  const normalizedFile = filePath.replace(/\.js$/, '').replace(/\\/g, '/');
  
  // 检查各种匹配方式
  if (normalizedImport === normalizedFile) return true;
  if (normalizedImport.endsWith(normalizedFile)) return true;
  if (normalizedFile.endsWith(normalizedImport)) return true;
  
  // 检查相对路径匹配
  const importParts = normalizedImport.split('/');
  const fileParts = normalizedFile.split('/');
  
  // 从后往前匹配
  let i = importParts.length - 1;
  let j = fileParts.length - 1;
  while (i >= 0 && j >= 0 && importParts[i] === fileParts[j]) {
    i--;
    j--;
  }
  
  return i < 0 || j < 0;
}

// 获取所有JS文件
const jsFiles = getAllJSFiles('./src').filter(f => !f.includes('node_modules'));
console.log('找到的JS文件:');
jsFiles.forEach(f => console.log('  -', f));

// 读取所有文件内容，提取引用
const fileImports = {};
const allFiles = [...jsFiles];

// 也检查Vue文件
const vueFiles = getAllJSFiles('./src').map(f => f.replace(/\.js$/, '.vue')).filter(f => {
  try {
    return fs.existsSync(f);
  } catch {
    return false;
  }
});

[...jsFiles, ...vueFiles].forEach(file => {
  if (fs.existsSync(file)) {
    fileImports[file] = extractImports(file);
  }
});

// 检查每个文件是否被引用
console.log('\n\n=== 未被引用的JS文件 ===\n');
const unusedFiles = [];

jsFiles.forEach(file => {
  let isUsed = false;
  
  // main.js是入口文件，总是被使用
  if (file === 'src/main.js') {
    isUsed = true;
  }
  
  // 检查是否被其他文件引用
  if (!isUsed) {
    for (const [otherFile, imports] of Object.entries(fileImports)) {
      if (otherFile === file) continue;
      
      for (const imp of imports) {
        if (matchesImport(imp, file)) {
          isUsed = true;
          break;
        }
      }
      if (isUsed) break;
    }
  }
  
  if (!isUsed) {
    unusedFiles.push(file);
  }
});

if (unusedFiles.length === 0) {
  console.log('所有JS文件都被使用了');
} else {
  console.log(`找到 ${unusedFiles.length} 个未被引用的文件:\n`);
  unusedFiles.forEach(f => console.log('  -', f));
}
