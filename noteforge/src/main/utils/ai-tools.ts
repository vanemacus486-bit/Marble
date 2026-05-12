import type { VaultManager } from '../services/vault-manager'
import type { SearchIndexer } from '../services/search-indexer'
import type { AIPendingApproval } from '../types/ipc-contracts'

const SYSTEM_PROMPT = `You are Marble AI, a knowledge management assistant embedded in the Marble note-taking application.
You help users create, edit, organize, and understand their HTML knowledge notes.

Your capabilities:
- List files and folders in the vault
- Read the full content of any note
- Search across all notes by content, tag, or title
- Create new notes
- Edit existing notes (rewrite content)
- Delete notes
- Rename or move notes

Guidelines:
- Notes are HTML files. When creating or editing, produce clean, well-structured HTML suitable for a knowledge base.
- Use semantic HTML: <h1> for the note title, <h2>/<h3> for sections, <p> for paragraphs, <ul>/<ol> for lists, <blockquote> for quotes, <pre><code> for code blocks.
- When a user asks a question, search the vault first to find relevant notes before answering.
- When creating a note, suggest a reasonable file path based on the content (e.g., "Projects/my-project.html").
- Be concise and direct. Prefer actions over long explanations.
- When editing notes, preserve the user's existing structure and style unless asked to change it.
- Respond in the same language the user uses.`

// ── Tool definitions (OpenAI function-calling format) ──

export const AI_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'list_files',
      description: 'List files and folders in the vault, optionally within a specific directory.',
      parameters: {
        type: 'object',
        properties: {
          dir: { type: 'string', description: 'Optional directory path relative to vault root. Omit to list root.' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'read_note',
      description: 'Read the full HTML content of a note.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path to the note file within the vault.' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_notes',
      description: 'Search across all notes by content, title, or tags.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query text.' },
          limit: { type: 'number', description: 'Max results. Default 10.' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_note',
      description: 'Create a new note with HTML content. Requires user approval.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path for the new note (e.g., "Notes/My Topic.html").' },
          content: { type: 'string', description: 'Full HTML content of the note.' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'write_note',
      description: 'Overwrite an existing note with new HTML content. Requires user approval.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path to the existing note.' },
          content: { type: 'string', description: 'New full HTML content for the note.' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_note',
      description: 'Delete a note. Requires user approval.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path to the note to delete.' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'rename_note',
      description: 'Rename or move a note. Requires user approval.',
      parameters: {
        type: 'object',
        properties: {
          oldPath: { type: 'string', description: 'Current relative path of the note.' },
          newPath: { type: 'string', description: 'New relative path for the note.' },
        },
        required: ['oldPath', 'newPath'],
      },
    },
  },
]

// Read-only tools execute immediately without approval
const READ_ONLY_TOOLS = new Set(['list_files', 'read_note', 'search_notes'])

export function isReadOnlyTool(name: string): boolean {
  return READ_ONLY_TOOLS.has(name)
}

export function getSystemPrompt(): string {
  return SYSTEM_PROMPT
}

// ── Tool executors ──

interface ToolExecutorDeps {
  vaultManager: VaultManager
  searchIndexer: SearchIndexer
}

export async function executeReadOnlyTool(
  name: string,
  args: Record<string, unknown>,
  deps: ToolExecutorDeps,
): Promise<string> {
  switch (name) {
    case 'list_files': {
      const dir = (args.dir as string) || undefined
      const files = await deps.vaultManager.listFiles(dir)
      if (files.length === 0) return 'No files found.'
      return files.map((f) => `${f.isDirectory ? '[DIR]' : '[FILE]'} ${f.path} (${f.isDirectory ? '-' : `${f.size} bytes`})`).join('\n')
    }
    case 'read_note': {
      const content = await deps.vaultManager.readNote(args.path as string)
      return content
    }
    case 'search_notes': {
      const results = deps.searchIndexer.search({
        text: args.query as string,
        operators: {},
        limit: (args.limit as number) || 10,
        offset: 0,
      })
      if (results.results.length === 0) return 'No matching notes found.'
      return results.results
        .map((r) => `[${r.title}](${r.path}) — ${r.snippet}`)
        .join('\n')
    }
    default:
      return `Unknown tool: ${name}`
  }
}

export function buildPendingApproval(
  callId: string,
  name: string,
  args: Record<string, unknown>,
  oldContent?: string,
): AIPendingApproval {
  const previewType =
    name === 'create_note' ? 'create' :
    name === 'write_note' ? 'write' :
    name === 'delete_note' ? 'delete' :
    name === 'rename_note' ? 'rename' : 'write'

  return {
    callId,
    toolName: name,
    args,
    preview: {
      type: previewType,
      path: (args.path || args.oldPath) as string,
      newPath: args.newPath as string | undefined,
      oldContent: oldContent,
      newContent: args.content as string | undefined,
    },
  }
}

export async function executeWriteTool(
  name: string,
  args: Record<string, unknown>,
  deps: ToolExecutorDeps,
): Promise<string> {
  switch (name) {
    case 'create_note': {
      await deps.vaultManager.createNote(args.path as string, args.content as string)
      return `Note created: ${args.path}`
    }
    case 'write_note': {
      await deps.vaultManager.writeNote(args.path as string, args.content as string)
      return `Note updated: ${args.path}`
    }
    case 'delete_note': {
      await deps.vaultManager.deleteNote(args.path as string)
      return `Note deleted: ${args.path}`
    }
    case 'rename_note': {
      await deps.vaultManager.renameNote(args.oldPath as string, args.newPath as string)
      return `Note renamed: ${args.oldPath} -> ${args.newPath}`
    }
    default:
      return `Unknown write tool: ${name}`
  }
}
