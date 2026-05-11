import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../types/ipc-channels'
import type { SearchIndexer } from '../services/search-indexer'
import type { IndexBuilder } from '../services/index-builder'
import type { SearchQuery } from '../types/ipc-contracts'

export function registerSearchIpc(searchIndexer: SearchIndexer, indexBuilder: IndexBuilder): void {
  ipcMain.handle(IPC_CHANNELS.SEARCH_REBUILD_INDEX, async () => {
    await indexBuilder.buildFull()
  })

  ipcMain.handle(IPC_CHANNELS.SEARCH_QUERY, async (_event, query: SearchQuery) => {
    return searchIndexer.search(query)
  })

  ipcMain.handle(IPC_CHANNELS.SEARCH_INDEX_STATUS, async () => {
    return {
      state: 'ready' as const,
      noteCount: searchIndexer.getDocumentCount(),
    }
  })

  ipcMain.handle(IPC_CHANNELS.INDEX_BUILD, async () => {
    for await (const progress of indexBuilder.buildFullGenerator()) {
      // Progress is handled in index-builder
    }
  })
}
