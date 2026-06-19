const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

const config = require('./config');
const vault = require('./vault');
const ai = require('./ai');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 880,
    minHeight: 560,
    backgroundColor: '#1e1e1e',
    autoHideMenuBar: true,
    title: 'Marble',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // 推送最大化/还原状态给渲染层
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('win:maximizeChange', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('win:maximizeChange', false);
  });

  // 加载 Vite 打包后的 Vue 渲染层
  mainWindow.loadFile(path.join(__dirname, '..', '..', 'out', 'renderer', 'index.html'));

  // 诊断：把渲染层的加载失败和告警/错误打到主进程终端
  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error('[renderer did-fail-load]', code, desc, url);
  });
  mainWindow.webContents.on('console-message', (_e, level, message) => {
    // 过滤掉已知无害的告警（Naive UI 的 ResizeObserver、开发期 CSP 提示）
    if (level >= 2 && !/ResizeObserver|Security Warning/.test(message)) {
      console.error('[renderer]', message);
    }
  });
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function vaultRoot() {
  const root = config.read().vaultPath;
  if (!root) throw new Error('尚未选择笔记库文件夹');
  return root;
}

function registerIpc() {
  // ---- 配置 ----
  ipcMain.handle('config:get', () => config.read());
  ipcMain.handle('config:set', (_e, partial) => config.write(partial || {}));

  // ---- 笔记库 ----
  ipcMain.handle('vault:choose', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择一个文件夹作为笔记库',
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    const chosen = result.filePaths[0];
    const cur = config.read();
    const vaults = Array.from(new Set([...(cur.vaults || []), chosen]));
    config.write({ vaultPath: chosen, vaults });
    return chosen;
  });

  ipcMain.handle('vault:tree', () => {
    const root = config.read().vaultPath;
    if (!root) return { root: null, tree: [] };
    return { root, tree: vault.getTree(root) };
  });

  ipcMain.handle('vault:read', (_e, filePath) => vault.readNote(vaultRoot(), filePath));
  ipcMain.handle('vault:write', (_e, { filePath, content }) =>
    vault.writeNote(vaultRoot(), filePath, content)
  );
  ipcMain.handle('vault:createNote', (_e, { dirPath, name }) =>
    vault.createNote(vaultRoot(), dirPath, name)
  );
  ipcMain.handle('vault:createFolder', (_e, { dirPath, name }) =>
    vault.createFolder(vaultRoot(), dirPath, name)
  );
  ipcMain.handle('vault:rename', (_e, { targetPath, newName, isFolder }) =>
    vault.rename(vaultRoot(), targetPath, newName, isFolder)
  );
  ipcMain.handle('vault:remove', (_e, { targetPath }) =>
    vault.remove(vaultRoot(), targetPath)
  );

  ipcMain.handle('vault:search', (_e, query) =>
    vault.searchInVault(vaultRoot(), query)
  );

  ipcMain.handle('vault:graph', () =>
    vault.buildGraph(vaultRoot())
  );

  // 切换已保存的库目录
  ipcMain.handle('vault:switchTo', (_e, target) => {
    if (!target || !fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
      return { ok: false, error: '文件夹不存在' };
    }
    const cur = config.read();
    const vaults = Array.from(new Set([...(cur.vaults || []), target]));
    config.write({ vaultPath: target, vaults });
    return { ok: true, path: target };
  });

  // 从已知库列表移除（不动 vaultPath）
  ipcMain.handle('vault:forget', (_e, target) => {
    const cur = config.read();
    const filtered = (cur.vaults || []).filter((p) => p !== target);
    config.write({ vaults: filtered });
    return { ok: true };
  });

  // ---- 关于页信息 ----
  ipcMain.handle('app:buildInfo', () => {
    try {
      const p = path.join(__dirname, '..', 'renderer', 'build-info.json');
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {
      return { version: app.getVersion(), buildTime: null };
    }
  });
  ipcMain.handle('app:changelog', () => {
    try {
      return fs.readFileSync(path.join(__dirname, '..', '..', 'CHANGELOG.md'), 'utf8');
    } catch {
      return '';
    }
  });

  // ---- AI 流式对话 ----
  ipcMain.handle('ai:chat', async (event, { requestId, history, context }) => {
    const cfg = config.read();
    const dm = cfg.defaultModel || {};
    const providers = cfg.providers || [];
    const provider = providers.find((p) => p.id === dm.providerId) || providers[0] || null;
    const aiCfg = provider
      ? {
          apiKey: provider.apiKey,
          baseUrl: provider.baseUrl,
          model: dm.model || (provider.models && provider.models[0]) || '',
        }
      : { apiKey: '', baseUrl: '', model: '' };
    return ai.streamChat({ ai: aiCfg, writing: cfg.writing, history, context }, (delta) => {
      if (!event.sender.isDestroyed()) {
        event.sender.send('ai:chunk', { requestId, delta });
      }
    });
  });

  // creds = { baseUrl, apiKey }（针对某个供应商，可能是尚未保存的草稿）
  ipcMain.handle('ai:models', (_e, creds) => ai.listModels(creds || {}));

  // ---- 窗口控制 ----
  ipcMain.handle('win:minimize', () => { if (mainWindow) mainWindow.minimize(); });
  ipcMain.handle('win:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) mainWindow.unmaximize();
      else mainWindow.maximize();
    }
  });
  ipcMain.handle('win:close', () => { if (mainWindow) mainWindow.close(); });
  ipcMain.handle('win:isMaximized', () => mainWindow && mainWindow.isMaximized());
}
