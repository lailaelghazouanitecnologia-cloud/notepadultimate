import { useState, useRef, useCallback, useEffect } from 'react'
import type { Note } from '../types'
import { Icons } from '../lib/icons'

interface HomeScreenProps {
  notes: Note[]
  onCreateNote: (title: string, content: string) => void
  onOpenNote: (id: string) => void
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

function getGreeting(): { greeting: string; subtitle: string } {
  const h = new Date().getHours()
  if (h < 12) return { greeting: 'Good morning', subtitle: 'How can I help you today?' }
  if (h < 18) return { greeting: 'Good afternoon', subtitle: 'What are you working on?' }
  return { greeting: 'Good evening', subtitle: 'What can I assist you with?' }
}

export function HomeScreen({ notes, onCreateNote, onOpenNote }: HomeScreenProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
      return `**Zarnetti Commands:**\n• \`/new Title\` — Create a new note\n• \`/search query\` — Search your notes\n• \`/list\` — List all notes\n• \`/open Title\` — Open a note by name\n• Or just type naturally to generate content`
    }

    if (lower.startsWith('/open ')) {
      const title = text.replace(/^\/open\s+/i, '').trim().toLowerCase()
      const note = notes.find((n) => n.title.toLowerCase().includes(title))
      if (note) {
        onOpenNote(note.id)
        return `Opening **"${note.title}"**.`
      }
      return `No note found matching "${title}".`
    }

    // Default: generate note content
    const title = text.length > 40 ? text.slice(0, 40) + '...' : text
    const content = `# ${title}\n\n${text}\n\n---\n*Generated from Zarnetti chat*`
    onCreateNote(title, content)
    return `Created note from your input. Opening editor.`
  }, [notes, onCreateNote, onOpenNote])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text) return

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')

    setTimeout(() => {
      const response = processCommand(text)
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-resp`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, aiMsg])
    }, 150)
  }, [input, processCommand])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const shortcuts = [
    { label: 'New note', cmd: '/new ' },
    { label: 'Search', cmd: '/search ' },
    { label: 'List all', cmd: '/list' },
    { label: 'Help', cmd: '/help' },
  ]

  const isEmpty = messages.length === 0
  const { greeting, subtitle } = getGreeting()

  return (
    <div className="content-area">
      <div className="home">
        {/* Chat header */}
        <div className="breadcrumb">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {Icons.sparkles()}
            <span>Zarnetti Chat</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>
              {notes.length} notes
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {isEmpty && (
            <div className="chat-welcome">
              <div className="chat-welcome__inner">
                <h2 className="chat-welcome__title">{greeting}</h2>
                <p className="chat-welcome__sub">{subtitle}</p>
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-msg ${msg.role === 'user' ? 'chat-msg--user' : 'chat-msg--ai'}`}
            >
              <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                {msg.role === 'assistant'
                  ? msg.content.split('\n').map((line, j) => {
                      const parsed = line
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/`([^`]+)`/g, '<code>$1</code>')
                      return <div key={j} dangerouslySetInnerHTML={{ __html: parsed }} />
                    })
                  : msg.content
                }
              </div>
              {msg.role === 'assistant' && (
                <div className="chat-msg__actions">
                  <button
                    className="chat-msg__action-btn"
                    onClick={() => navigator.clipboard.writeText(msg.content)}
                    title="Copy"
                  >
                    {Icons.copy()}
                  </button>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="chat-input-area">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="chat-textarea"
          />
          <div className="chat-input-toolbar">
            <div className="shortcut-chips">
              {isEmpty && shortcuts.map((s) => (
                <button
                  key={s.cmd}
                  className="shortcut-chip"
                  onClick={() => { setInput(s.cmd); textareaRef.current?.focus() }}
                >
                  {Icons.bolt()}
                  {s.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleSend}
              className={`chat-send-btn ${input.trim() ? 'active' : ''}`}
              aria-label="Send"
            >
              {Icons.send()}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="chat-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span className="chat-footer__name">Zarnetti</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="chat-op-indicator" data-op="read" />
              <span className="chat-op-indicator" data-op="idle" />
            </div>
            <span className="stat-sep" />
            <span className="chat-footer__stat">{messages.length} msgs</span>
            <span className="stat-sep" />
            <span className="chat-footer__stat">{notes.length} notes</span>
          </div>
        </div>
      </div>
    </div>
  )
}
