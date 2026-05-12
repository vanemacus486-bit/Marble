// IPC channel name constants — single source of truth for all IPC communication

export const IPC_CHANNELS = {
  // Vault
  VAULT_OPEN_DIALOG: 'vault:open-dialog',
  VAULT_OPEN: 'vault:open',
  VAULT_LIST_FILES: 'vault:list-files',
  VAULT_GET_RECENT: 'vault:get-recent',
  VAULT_REMOVE_RECENT: 'vault:remove-recent',
  VAULT_GET_CONFIG: 'vault:get-config',
  VAULT_SET_CONFIG: 'vault:set-config',
  VAULT_RESOLVE_PATH: 'vault:resolve-path',

  // Note
  NOTE_READ: 'note:read',
  NOTE_WRITE: 'note:write',
  NOTE_DELETE: 'note:delete',
  NOTE_RENAME: 'note:rename',
  NOTE_CREATE: 'note:create',
  NOTE_MOVE: 'note:move',
  NOTE_GET_PROPERTIES: 'note:get-properties',
  NOTE_SET_PROPERTIES: 'note:set-properties',

  // Folder
  FOLDER_CREATE: 'folder:create',
  FOLDER_DELETE: 'folder:delete',
  FOLDER_RENAME: 'folder:rename',

  // File Watcher
  FW_SUBSCRIBE: 'fw:subscribe',
  FW_UNSUBSCRIBE: 'fw:unsubscribe',
  FW_FILE_CHANGED: 'fw:file-changed',

  // Search
  SEARCH_REBUILD_INDEX: 'search:rebuild-index',
  SEARCH_QUERY: 'search:query',
  SEARCH_INDEX_STATUS: 'search:index-status',

  // Index
  INDEX_BUILD: 'index:build',
  INDEX_PROGRESS: 'index:progress',
  INDEX_COMPLETE: 'index:complete',

  // Export
  EXPORT_PLAINTEXT: 'export:plaintext',
  EXPORT_PDF: 'export:pdf',
  EXPORT_MARKDOWN: 'export:markdown',
  EXPORT_HTML: 'export:html',
  EXPORT_HTML_FILE: 'export:html-file',

  // AI
  AI_CHAT: 'ai:chat',
  AI_APPROVE_TOOL_CALL: 'ai:approve-tool-call',
  AI_REJECT_TOOL_CALL: 'ai:reject-tool-call',
  AI_CANCEL: 'ai:cancel',
  AI_STREAM_CHUNK: 'ai:stream-chunk',
  AI_TOOL_CALL_PENDING: 'ai:tool-call-pending',
  AI_STREAM_END: 'ai:stream-end',
  AI_ERROR: 'ai:error',
  AI_GET_CONFIG: 'ai:get-config',
  AI_SET_CONFIG: 'ai:set-config',

  // System
  SYSTEM_GET_VERSION: 'system:get-version',
  SYSTEM_OPEN_EXTERNAL: 'system:open-external',
  SYSTEM_SHOW_IN_FOLDER: 'system:show-in-folder',
  SYSTEM_GET_APP_CONFIG: 'system:get-app-config',
  SYSTEM_SET_APP_CONFIG: 'system:set-app-config',
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
