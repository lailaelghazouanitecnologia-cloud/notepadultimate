import { useState, useCallback, useMemo, memo } from 'react'
import type { Note } from '../types'
import type { ChatSession } from '../contexts/UIContext'
import type { ChatMessage, ChatMode, StreamingState } from '../types/chat'
import { ChatInput } from './chat/ChatInput'
import { ChatWelcome } from './chat/ChatWelcome'
import { ChatFooter } from './chat/ChatFooter'
import { SearchResults } from './chat/SearchResults'
import { ThreadContent } from './chat/ThreadContent'

interface HomeScreenProps {
  notes: Note[]
  publishedNotes: Note[]
  onCreateNote: (title: string, content: string) => void
  onOpenNote: (id: string) => void
  onSaveChat: (session: ChatSession) => void
  initialSession?: ChatSession
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Determines the chat mode based on input and message history:
 * - 'idle': no input, no messages → shows welcome screen
 * - 'search': typing non-command text (live search results)
 * - 'chat': has sent messages (active conversation)
 */
function deriveMode(hasMessages: boolean, hasResults: boolean): ChatMode {
  if (hasMessages) return 'chat'
  if (hasResults) return 'search'
  return 'idle'
}

export const HomeScreen = memo(function HomeScreen({
  notes, publishedNotes, onCreateNote, onOpenNote, onSaveChat, initialSession,
}: HomeScreenProps) {
  // ── State ──
  const [sessionId] = useState(() => initialSession?.id || `chat-${Date.now()}`)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(
    () => (initialSession?.messages || []).map(m => ({
      ...m, timestamp: m.timestamp ?? Date.now(),
    } as ChatMessage))
  )
  const [model, setModel] = useState('Sonnet 4.5')
  const [streaming, setStreaming] = useState<StreamingState>({
    status: 'idle', text: '', error: null,
  })

  // ── Derived state ──
  const greeting = useMemo(getGreeting, [])

  const recentNotes = useMemo(() => {
    return [...notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6)
  }, [notes])

  const liveResults = useMemo(() => {
    const q = input.trim().toLowerCase()
    if (!q || q.startsWith('/')) return { own: [] as Note[], community: [] as Note[] }
    const own = notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    )
    const ownIds = new Set(notes.map((n) => n.id))
    const community = publishedNotes.filter(
      (n) => !ownIds.has(n.id) && (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
    )
    return { own, community }
  }, [input, notes, publishedNotes])

  const hasResults = liveResults.own.length + liveResults.community.length > 0
  const mode = deriveMode(messages.length > 0, hasResults)

  // ── Save session on message change ──
  const saveSession = useCallback((msgs: ChatMessage[]) => {
    if (msgs.length === 0) return
    const firstUser = msgs.find((m) => m.role === 'user')
    const title = firstUser
      ? (firstUser.content.length > 50 ? firstUser.content.slice(0, 50) + '...' : firstUser.content)
      : 'New chat'
    onSaveChat({ id: sessionId, title, messages: msgs, createdAt: Date.now() })
  }, [sessionId, onSaveChat])

  // ── Command processing ──
  const processCommand = useCallback((text: string): string => {
    const lower = text.toLowerCase().trim()

    if (lower.startsWith('/new ') || lower.startsWith('/create ')) {
      const title = text.replace(/^\/(new|create)\s+/i, '').trim()
      onCreateNote(title, '')
      return `Created note **"${title}"**. Switching to editor.`
    }
    if (lower.startsWith('/search ') || lower.startsWith('/find ')) {
      const query = text.replace(/^\/(search|find)\s+/i, '').trim().toLowerCase()
      const found = notes.filter(
        (n) => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query)
      )
      if (found.length === 0) return `No notes found matching "${query}".`
      return `Found **${found.length}** note(s):\n${found.map((n) => `• **${n.title}**`).join('\n')}`
    }
    if (lower === '/list' || lower === '/notes') {
      if (notes.length === 0) return 'No notes yet. Use `/new Title` to create one.'
      return `**${notes.length} notes:**\n${notes.map((n) => `• **${n.title}**`).join('\n')}`
    }
    if (lower === '/help' || lower === '?') {
      return `**Commands:**\n• \`/new Title\` — Create a note\n• \`/search query\` — Search notes\n• \`/list\` — List all notes\n• \`/open Title\` — Open a note\n• Or just type to chat`
    }
    if (lower.startsWith('/open ')) {
      const title = text.replace(/^\/open\s+/i, '').trim().toLowerCase()
      const note = notes.find((n) => n.title.toLowerCase().includes(title))
      if (note) { onOpenNote(note.id); return `Opening **"${note.title}"**.` }
      return `No note found matching "${title}".`
    }
    return ''
  }, [notes, onCreateNote, onOpenNote])

  // ── Simulate AI response (streaming effect) ──
  const simulateResponse = useCallback((userText: string) => {
    // Check if it's a command first
    const cmdResponse = processCommand(userText)
    if (cmdResponse) {
      setStreaming({ status: 'done', text: '', error: null })
      setMessages(prev => {
        const updated = [...prev, {
          id: `msg-${Date.now()}-r`, role: 'assistant' as const,
          content: cmdResponse, timestamp: Date.now(),
        }]
        saveSession(updated)
        return updated
      })
      return
    }

    // Simulate AI thinking + streaming
    setStreaming({ status: 'connecting', text: '', error: null })

    setTimeout(() => {
      // Generate contextual response based on notes
      const query = userText.toLowerCase()
      const found = notes.filter(
        (n) => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query)
      )

      let response: string
      if (found.length > 0) {
        response = `I found **${found.length}** note${found.length !== 1 ? 's' : ''} related to your question:\n\n${found.slice(0, 3).map((n) => `### ${n.title}\n${n.content.slice(0, 150)}...`).join('\n\n')}\n\nWould you like me to elaborate on any of these?`
      } else {
        response = `I don't have specific notes about "${userText}", but I can help you create one. Would you like me to:\n\n- Create a new note with \`/new ${userText}\`\n- Search more broadly with \`/search ${userText.split(' ')[0]}\`\n- Or just tell me more about what you're looking for`
      }

      // Simulate streaming character by character
      let charIndex = 0
      setStreaming({ status: 'streaming', text: '', error: null })

      const interval = setInterval(() => {
        charIndex += Math.floor(Math.random() * 4) + 2
        if (charIndex >= response.length) {
          charIndex = response.length
          clearInterval(interval)
          setStreaming({ status: 'done', text: '', error: null })
          setMessages(prev => {
            const updated = [...prev, {
              id: `msg-${Date.now()}-r`, role: 'assistant' as const,
              content: response, timestamp: Date.now(),
            }]
            saveSession(updated)
            return updated
          })
        } else {
          setStreaming({ status: 'streaming', text: response.slice(0, charIndex), error: null })
        }
      }, 20)
    }, 600)
  }, [processCommand, notes, saveSession])

  // ── Send message ──
  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || streaming.status === 'streaming' || streaming.status === 'connecting') return

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`, role: 'user',
      content: text, timestamp: Date.now(),
    }
    setMessages(prev => {
      const updated = [...prev, userMsg]
      saveSession(updated)
      return updated
    })
    setInput('')
    simulateResponse(text)
  }, [input, streaming.status, simulateResponse, saveSession])

  const handleStop = useCallback(() => {
    setStreaming({ status: 'done', text: '', error: null })
  }, [])

  // ── Retry / Edit ──
  const handleRetry = useCallback((content: string) => {
    simulateResponse(content)
  }, [simulateResponse])

  const handleEdit = useCallback((messageId: string, newContent: string) => {
    setMessages(prev => {
      const idx = prev.findIndex(m => m.id === messageId)
      if (idx < 0) return prev
      // Remove messages after the edited one and resend
      const updated = prev.slice(0, idx)
      updated.push({ ...prev[idx], content: newContent })
      saveSession(updated)
      return updated
    })
    simulateResponse(newContent)
  }, [simulateResponse, saveSession])

  // ── Render ──
  return (
    <div className="content-area">
      <div className="home-research">
        <div className="home-research__scroll">
          {/* Welcome / Search input area (always at top in idle/search mode) */}
          {mode !== 'chat' && (
            <div className="home-research__hero">
              <ChatWelcome
                greeting={greeting}
                recentNotes={mode === 'idle' ? recentNotes : []}
                onOpenNote={onOpenNote}
              />
              <div className="home-research__input-wrap">
                <ChatInput
                  value={input}
                  onChange={setInput}
                  onSend={handleSend}
                  model={model}
                  onModelChange={setModel}
                  placeholder="Search Zarnet or start a chat..."
                />
              </div>
            </div>
          )}

          {/* Search results */}
          {mode === 'search' && (
            <SearchResults
              query={input.trim()}
              own={liveResults.own}
              community={liveResults.community}
              onOpenNote={onOpenNote}
            />
          )}

          {/* Chat mode: thread content */}
          {mode === 'chat' && (
            <ThreadContent
              messages={messages}
              streaming={streaming}
              onRetry={handleRetry}
              onEdit={handleEdit}
            />
          )}
        </div>

        {/* Chat input at bottom when in chat mode */}
        {mode === 'chat' && (
          <div className="zw-chat-input-bottom">
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              onStop={handleStop}
              isStreaming={streaming.status === 'streaming' || streaming.status === 'connecting'}
              model={model}
              onModelChange={setModel}
            />
          </div>
        )}

        <ChatFooter
          mode={mode}
          messageCount={messages.length}
          noteCount={notes.length}
          publishedCount={publishedNotes.length}
        />
      </div>
    </div>
  )
})
