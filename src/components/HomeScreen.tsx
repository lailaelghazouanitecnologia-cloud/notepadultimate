import { useState, useRef, useCallback, useEffect } from 'react'
import type { Note } from '../types'
import { ZarnettiLogo, Icons } from '../lib/icons'

interface HomeScreenProps {
  notes: Note[]
  onCreateNote: (title: string, content: string) => void
  onOpenNote: (id: string) => void
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
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
  const inputRef = useRef<HTMLDivElement>(null)
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
      return `**Commands:**\n• \`/new Title\` — Create a new note\n• \`/search query\` — Search notes\n• \`/list\` — List all notes\n• \`/open Title\` — Open a note\n• Or just type to generate a note`
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

    const title = text.length > 40 ? text.slice(0, 40) + '...' : text
    const content = `# ${title}\n\n${text}\n\n---\n*Generated from Zarnetti chat*`
    onCreateNote(title, content)
    return `Created note from your input. Opening editor.`
  }, [notes, onCreateNote, onOpenNote])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text) return

    setMessages((prev) => [...prev, { id: `msg-${Date.now()}`, role: 'user', content: text }])
    setInput('')

    setTimeout(() => {
      const response = processCommand(text)
      setMessages((prev) => [...prev, { id: `msg-${Date.now()}-r`, role: 'assistant', content: response }])
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

  const isEmpty = messages.length === 0
  const { greeting, subtitle } = getGreeting()

  return (
    <div className="content-area">
      <div className="home-chat">
        {/* Messages */}
        <div className="chat-messages">
          {isEmpty && (
            <div className="chat-welcome">
              <div className="chat-welcome__inner">
                <ZarnettiLogo className="welcome-logo" />
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

        {/* Manus-style chat input card */}
        <div className="chat-input-card-wrap">
          <div className="chat-input-card">
            <div className="chat-input-card__editor">
              <textarea
                ref={inputRef as unknown as React.RefObject<HTMLTextAreaElement>}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Assign a task or ask anything"
                className="chat-input-card__textarea"
                rows={1}
              />
            </div>
            <div className="chat-input-card__toolbar">
              <div className="chat-input-card__left">
                <button className="chat-input-card__icon-btn" title="Add">
                  {Icons.plus()}
                </button>
                <button className="chat-input-card__pill" title="Connect GitHub">
                  {Icons.github()}
                </button>
              </div>
              <div className="chat-input-card__right">
                {isEmpty && (
                  <div className="chat-input-card__shortcuts">
                    {[
                      { label: '/new', cmd: '/new ' },
                      { label: '/search', cmd: '/search ' },
                      { label: '/list', cmd: '/list' },
                      { label: '/help', cmd: '/help' },
                    ].map((s) => (
                      <button
                        key={s.cmd}
                        className="shortcut-chip"
                        onClick={() => { setInput(s.cmd); inputRef.current?.focus() }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={handleSend}
                  className={`chat-send-btn ${input.trim() ? 'active' : ''}`}
                  disabled={!input.trim()}
                  aria-label="Send"
                >
                  {Icons.arrowUp()}
                </button>
              </div>
            </div>
          </div>

          {/* Connect tools strip */}
          <div className="chat-connect-strip">
            <span className="chat-connect-strip__text">Connect your tools to Zarnetti</span>
            <div className="chat-connect-strip__icons">
              {Icons.github()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
