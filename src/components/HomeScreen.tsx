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

const COMMANDS = [
  { cmd: '/new', args: 'Title', desc: 'Create a new note' },
  { cmd: '/search', args: 'query', desc: 'Search your notes' },
  { cmd: '/list', args: '', desc: 'List all notes' },
  { cmd: '/open', args: 'Title', desc: 'Open a note by name' },
  { cmd: '/help', args: '', desc: 'Show all commands' },
]

function getGreeting(): { greeting: string; subtitle: string } {
  const h = new Date().getHours()
  if (h < 12) return { greeting: 'Good morning', subtitle: 'Search, create, or ask anything' }
  if (h < 18) return { greeting: 'Good afternoon', subtitle: 'Search, create, or ask anything' }
  return { greeting: 'Good evening', subtitle: 'Search, create, or ask anything' }
}

export function HomeScreen({ notes, onCreateNote, onOpenNote }: HomeScreenProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [showCommands, setShowCommands] = useState(false)
  const [model, setModel] = useState('Sonnet 4.5')
  const [showModels, setShowModels] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const cmdRef = useRef<HTMLDivElement>(null)
  const modelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!showCommands) return
    const handler = (e: MouseEvent) => {
      if (cmdRef.current && !cmdRef.current.contains(e.target as Node)) setShowCommands(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showCommands])

  useEffect(() => {
    if (!showModels) return
    const handler = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setShowModels(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showModels])

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
      return `**Commands:**\n• \`/new Title\` — Create a note\n• \`/search query\` — Search notes\n• \`/list\` — List all notes\n• \`/open Title\` — Open a note\n• Or just type to search & generate`
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

    // Default: search first, then create
    const query = text.toLowerCase()
    const found = notes.filter(
      (n) => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query)
    )
    if (found.length > 0) {
      return `Found **${found.length}** note(s):\n${found.map((n) => `• **${n.title}**`).join('\n')}\n\n_Type \`/new ${text}\` to create a new note instead._`
    }

    const title = text.length > 40 ? text.slice(0, 40) + '...' : text
    const content = `# ${title}\n\n${text}\n\n---\n*Generated from Zarnetti*`
    onCreateNote(title, content)
    return `Created note from your input. Opening editor.`
  }, [notes, onCreateNote, onOpenNote])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text) return
    setMessages((prev) => [...prev, { id: `msg-${Date.now()}`, role: 'user', content: text }])
    setInput('')
    setShowCommands(false)

    setTimeout(() => {
      const response = processCommand(text)
      setMessages((prev) => [...prev, { id: `msg-${Date.now()}-r`, role: 'assistant', content: response }])
    }, 150)
  }, [input, processCommand])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    },
    [handleSend]
  )

  const selectCommand = (cmd: string) => {
    setInput(cmd + ' ')
    setShowCommands(false)
    textareaRef.current?.focus()
  }

  const models = [
    { id: 'sonnet', label: 'Sonnet 4.5', desc: 'Fast & capable' },
    { id: 'opus', label: 'Opus 4.6', desc: 'Most intelligent' },
    { id: 'haiku', label: 'Haiku 4.5', desc: 'Fastest' },
  ]

  const isEmpty = messages.length === 0
  const { greeting, subtitle } = getGreeting()
  const totalTokens = messages.length * 280

  return (
    <div className="content-area">
      <div className="home-chat">
        {/* Messages / welcome */}
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
                        .replace(/^_(.+)_$/, '<em>$1</em>')
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

        {/* Input — centered card */}
        <div className="zw-chat-input-area">
          <div className="zw-chat-input-card">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search or ask anything..."
              className="zw-chat-textarea"
            />
            <div className="zw-chat-input-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Model selector */}
                <div style={{ position: 'relative' }} ref={modelRef}>
                  <button className="zw-chat-model-btn" onClick={() => setShowModels(!showModels)}>
                    {Icons.sparkles()}
                    <span>{model}</span>
                    {Icons.chevronDown()}
                  </button>
                  {showModels && (
                    <div className="zw-chat-model-menu">
                      {models.map((m) => (
                        <button
                          key={m.id}
                          className={`zw-chat-model-option ${model === m.label ? 'active' : ''}`}
                          onClick={() => { setModel(m.label); setShowModels(false) }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 500 }}>{m.label}</div>
                            <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{m.desc}</div>
                          </div>
                          {model === m.label && (
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--zw-red)' }} />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Connectors */}
                <button className="zw-chat-tool-btn" title="Attach file">
                  {Icons.paperclip()}
                </button>
                <button className="zw-chat-tool-btn" title="Mention">
                  {Icons.atSign()}
                </button>
                <button className="zw-chat-tool-btn" title="Search web">
                  {Icons.globe()}
                </button>

                {/* / commands */}
                <div style={{ position: 'relative' }} ref={cmdRef}>
                  <button
                    className="zw-cmd-btn"
                    onClick={() => setShowCommands(!showCommands)}
                    title="Commands"
                  >
                    <span className="zw-cmd-btn__slash">/</span>
                  </button>
                  {showCommands && (
                    <div className="zw-cmd-menu">
                      <div className="zw-cmd-menu__title">Commands</div>
                      {COMMANDS.map((c) => (
                        <button
                          key={c.cmd}
                          className="zw-cmd-menu__item"
                          onClick={() => selectCommand(c.cmd)}
                        >
                          <span className="zw-cmd-menu__cmd">{c.cmd}</span>
                          {c.args && <span className="zw-cmd-menu__args">{c.args}</span>}
                          <span className="zw-cmd-menu__desc">{c.desc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleSend}
                className={`zw-chat-send-btn ${input.trim() ? 'active' : ''}`}
                aria-label="Send"
              >
                {Icons.arrowUp()}
              </button>
            </div>
          </div>
        </div>

        {/* Footer — connectors + status */}
        <div className="zw-chat-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span className="zw-chat-footer-name">Zarnetti</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="zw-chat-op-indicator" data-op="read" />
              <span className="zw-chat-op-indicator" data-op="idle" />
            </div>
            <span className="zw-stat-sep" />
            <span className="zw-chat-footer-stat">~{totalTokens} tokens</span>
            <span className="zw-stat-sep" />
            <span className="zw-chat-footer-stat">{messages.length} msgs</span>
          </div>
        </div>
      </div>
    </div>
  )
}
