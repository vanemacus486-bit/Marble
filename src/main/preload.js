// 安全桥：只把受控的 API 暴露给渲染进程（window.api）。
const { contextBridge, ipcRenderer, webFrame } = require('electron');

let reqSeq = 0;

contextBridge.exposeInMainWorld('api', {
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    set: (partial) => ipcRenderer.invoke('config:set', partial),
  },
  vault: {
    choose: () => ipcRenderer.invoke('vault:choose'),
    tree: () => ipcRenderer.invoke('vault:tree'),
    read: (filePath) => ipcRenderer.invoke('vault:read', filePath),
    write: (filePath, content) => ipcRenderer.invoke('vault:write', { filePath, content }),
    createNote: (dirPath, name) => ipcRenderer.invoke('vault:createNote', { dirPath, name }),
    createFolder: (dirPath, name) => ipcRenderer.invoke('vault:createFolder', { dirPath, name }),
    rename: (targetPath, newName, isFolder) =>
      ipcRenderer.invoke('vault:rename', { targetPath, newName, isFolder }),
    remove: (targetPath) => ipcRenderer.invoke('vault:remove', { targetPath }),
    search: (query) => ipcRenderer.invoke('vault:search', query),
    graph: () => ipcRenderer.invoke('vault:graph'),
    switchTo: (p) => ipcRenderer.invoke('vault:switchTo', p),
    forget: (p) => ipcRenderer.invoke('vault:forget', p),
  },
  app: {
    buildInfo: () => ipcRenderer.invoke('app:buildInfo'),
    changelog: () => ipcRenderer.invoke('app:changelog'),
    // 界面字号：整体缩放渲染层（同 Ctrl +/-），不经主进程。
    setZoom: (factor) => webFrame.setZoomFactor(factor),
  },
  ai: {
    // chat(payload, onChunk) -> Promise<完整回答>
    chat: ({ history, context }, onChunk) => {
      const requestId = `r${Date.now()}_${reqSeq++}`;
      const listener = (_e, data) => {
        if (data.requestId === requestId && typeof onChunk === 'function') {
          onChunk(data.delta);
        }
      };
      ipcRenderer.on('ai:chunk', listener);
      return ipcRenderer
        .invoke('ai:chat', { requestId, history, context })
        .finally(() => ipcRenderer.removeListener('ai:chunk', listener));
    },
    models: (creds) => ipcRenderer.invoke('ai:models', creds),
  },
  win: {
    minimize: () => ipcRenderer.invoke('win:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('win:maximize'),
    close: () => ipcRenderer.invoke('win:close'),
    isMaximized: () => ipcRenderer.invoke('win:isMaximized'),
    onMaximizeChange: (cb) => {
      const listener = (_e, val) => cb(val);
      ipcRenderer.on('win:maximizeChange', listener);
      return () => ipcRenderer.removeListener('win:maximizeChange', listener);
    },
  },
});
