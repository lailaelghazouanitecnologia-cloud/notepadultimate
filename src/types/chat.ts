export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export type ChatMode = 'idle' | 'search' | 'chat'

export type StreamingStatus = 'idle' | 'connecting' | 'streaming' | 'done' | 'error'

export interface StreamingState {
  status: StreamingStatus
  text: string
  error: string | null
}

export interface ModelOption {
  id: string
  label: string
  desc: string
  provider: string
}

export const AVAILABLE_MODELS: ModelOption[] = [
  { id: 'sonnet', label: 'Sonnet 4.5', desc: 'Fast & capable', provider: 'Anthropic' },
  { id: 'opus', label: 'Opus 4.6', desc: 'Most intelligent', provider: 'Anthropic' },
  { id: 'haiku', label: 'Haiku 4.5', desc: 'Fastest', provider: 'Anthropic' },
]

export const COMMANDS = [
  { cmd: '/new', args: 'Title', desc: 'Create a new note' },
  { cmd: '/search', args: 'query', desc: 'Search your notes' },
  { cmd: '/list', args: '', desc: 'List all notes' },
  { cmd: '/open', args: 'Title', desc: 'Open a note by name' },
  { cmd: '/help', args: '', desc: 'Show all commands' },
]
