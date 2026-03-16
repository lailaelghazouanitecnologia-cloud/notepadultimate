export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export type StreamingStatus = 'idle' | 'connecting' | 'streaming' | 'completed' | 'error'

export interface StreamingState {
  status: StreamingStatus
  text: string
  error: string | null
}
