// 笔记库（vault）文件操作。所有路径都校验必须落在 vault 根目录内，避免越权读写。
const fs = require('fs');
const path = require('path');

const NOTE_EXT = '.html';

function ensureInside(root, target) {
  const rel = path.relative(root, target);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('路径越界：' + target);
  }
  return target;
}

// 递归读取目录树，只保留文件夹和 .md 文件
function buildTree(dir, root) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const nodes = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue; // 跳过隐藏文件
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      nodes.push({
        type: 'folder',
        name: entry.name,
        path: full,
        children: buildTree(full, root),
      });
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(NOTE_EXT)) {
      nodes.push({
        type: 'file',
        name: entry.name.slice(0, -NOTE_EXT.length),
        fileName: entry.name,
        path: full,
      });
    }
  }
  // 文件夹在前，再按名称排序
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name, 'zh');
  });
  return nodes;
}

function getTree(root) {
  if (!root || !fs.existsSync(root)) return [];
  return buildTree(root, root);
}

function readNote(root, filePath) {
  ensureInside(root, filePath);
  return fs.readFileSync(filePath, 'utf8');
}

function writeNote(root, filePath, content) {
  ensureInside(root, filePath);
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

// 在 dirPath 下创建新笔记，返回新文件完整路径。name 不含扩展名。
function createNote(root, dirPath, name) {
  const baseDir = dirPath || root;
  ensureInside(root, baseDir);
  let safe = (name || '未命名').replace(/[\\/:*?"<>|]/g, '').trim() || '未命名';
  let candidate = path.join(baseDir, safe + NOTE_EXT);
  let i = 1;
  while (fs.existsSync(candidate)) {
    candidate = path.join(baseDir, `${safe} ${i}${NOTE_EXT}`);
    i++;
  }
  ensureInside(root, candidate);
  fs.writeFileSync(candidate, '', 'utf8'); // 空文档，等 AI 来写
  return candidate;
}

function createFolder(root, dirPath, name) {
  const baseDir = dirPath || root;
  ensureInside(root, baseDir);
  let safe = (name || '新文件夹').replace(/[\\/:*?"<>|]/g, '').trim() || '新文件夹';
  let candidate = path.join(baseDir, safe);
  let i = 1;
  while (fs.existsSync(candidate)) {
    candidate = path.join(baseDir, `${safe} ${i}`);
    i++;
  }
  ensureInside(root, candidate);
  fs.mkdirSync(candidate, { recursive: false });
  return candidate;
}

// 重命名（文件或文件夹）。newName 对文件不含扩展名。
function rename(root, targetPath, newName, isFolder) {
  ensureInside(root, targetPath);
  const dir = path.dirname(targetPath);
  let safe = (newName || '').replace(/[\\/:*?"<>|]/g, '').trim();
  if (!safe) throw new Error('名称不能为空');
  const dest = isFolder ? path.join(dir, safe) : path.join(dir, safe + NOTE_EXT);
  ensureInside(root, dest);
  if (fs.existsSync(dest)) throw new Error('同名已存在');
  fs.renameSync(targetPath, dest);
  return dest;
}

function remove(root, targetPath) {
  ensureInside(root, targetPath);
  fs.rmSync(targetPath, { recursive: true, force: true });
  return true;
}

// 搜索：递归遍历 vault，在文件名和内容中查找 query（大小写不敏感）
function searchInVault(root, query) {
  if (!root || !fs.existsSync(root) || !query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const results = [];

  function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(NOTE_EXT)) {
        const displayName = entry.name.slice(0, -NOTE_EXT.length);
        // 文件名匹配
        if (displayName.toLowerCase().includes(q)) {
          results.push({ path: full, name: displayName, snippet: '（文件名匹配）', matchType: 'name' });
          continue;
        }
        // 内容匹配
        try {
          const content = fs.readFileSync(full, 'utf8');
          const stripped = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          const idx = stripped.toLowerCase().indexOf(q);
          if (idx >= 0) {
            const start = Math.max(0, idx - 40);
            const end = Math.min(stripped.length, idx + q.length + 60);
            let snippet = (start > 0 ? '…' : '') + stripped.slice(start, end) + (end < stripped.length ? '…' : '');
            results.push({ path: full, name: displayName, snippet, matchType: 'content' });
          }
        } catch { /* 跳过无法读取的文件 */ }
      }
    }
  }

  walk(root);
  return results;
}

// 构建关系图谱：扫描所有 .html 文件中的 <a href> 和 [[wikilink]]，返回节点和边
function buildGraph(root) {
  if (!root || !fs.existsSync(root)) return { nodes: [], edges: [] };

  const notePaths = [];
  const idSet = new Set();

  function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(NOTE_EXT)) {
        if (!idSet.has(full)) {
          idSet.add(full);
          notePaths.push({ id: full, label: entry.name.slice(0, -NOTE_EXT.length), path: full });
        }
      }
    }
  }
  walk(root);

  // 名称 → ID 索引（用于匹配 [[wikilink]] 和 <a href>）
  const nameMap = new Map();
  for (const n of notePaths) {
    nameMap.set(n.label.toLowerCase(), n.id);
    nameMap.set((n.label + NOTE_EXT).toLowerCase(), n.id);
  }

  const edgeSet = new Set();
  const edges = [];

  for (const source of notePaths) {
    try {
      const content = fs.readFileSync(source.path, 'utf8');

      // <a href="...">
      const linkRe = /<a\s+[^>]*href="([^"]+)"[^>]*>/gi;
      let m;
      while ((m = linkRe.exec(content)) !== null) {
        let target = m[1].trim().split(/[#?]/)[0];
        if (!target) continue;
        const tid = nameMap.get(target.toLowerCase());
        if (tid && tid !== source.id) {
          const key = `${source.id}::${tid}`;
          if (!edgeSet.has(key)) { edgeSet.add(key); edges.push({ from: source.id, to: tid }); }
        }
      }

      // [[wikilink]]
      const wikiRe = /\[\[([^\]]+)\]\]/g;
      while ((m = wikiRe.exec(content)) !== null) {
        const tid = nameMap.get(m[1].trim().toLowerCase());
        if (tid && tid !== source.id) {
          const key = `${source.id}::${tid}`;
          if (!edgeSet.has(key)) { edgeSet.add(key); edges.push({ from: source.id, to: tid }); }
        }
      }
    } catch { /* 跳过 */ }
  }

  return { nodes: notePaths, edges };
}

module.exports = {
  getTree,
  readNote,
  writeNote,
  createNote,
  createFolder,
  rename,
  remove,
  searchInVault,
  buildGraph,
};
