import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type { Note } from '../types'
import type { ChatSession } from '../App'
import { ZarnettiLogo, Icons } from '../lib/icons'

interface HomeScreenProps {
  notes: Note[]
  publishedNotes: Note[]
  onCreateNote: (title: string, content: string) => void
  onOpenNote: (id: string) => void
  onSaveChat: (session: ChatSession) => void
  initialSession?: ChatSession
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

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function formatRelativeDate(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString('en', { day: 'numeric', month: 'short' })
}

export function HomeScreen({ notes, publishedNotes, onCreateNote, onOpenNote, onSaveChat, initialSession }: HomeScreenProps) {
  const [sessionId] = useState(() => initialSession?.id || `chat-${Date.now()}`)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(initialSession?.messages || [])
  const [showCommands, setShowCommands] = useState(false)
  const [model, setModel] = useState('Sonnet 4.5')
  const [showModels, setShowModels] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const cmdRef = useRef<HTMLDivElement>(null)
  const modelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Save chat session when messages change
  useEffect(() => {
    if (messages.length === 0) return
    const firstUserMsg = messages.find((m) => m.role === 'user')
    const title = firstUserMsg
      ? (firstUserMsg.content.length > 50 ? firstUserMsg.content.slice(0, 50) + '...' : firstUserMsg.content)
      : 'New chat'
    onSaveChat({ id: sessionId, title, messages, createdAt: Date.now() })
  }, [messages, sessionId, onSaveChat])

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

  const recentNotes = useMemo(() => {
    return [...notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6)
  }, [notes])

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
    const content = `# ${title}\n\n${text}\n`
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
    inputRef.current?.focus()
  }

  const models = [
    { id: 'sonnet', label: 'Sonnet 4.5', desc: 'Fast & capable' },
    { id: 'opus', label: 'Opus 4.6', desc: 'Most intelligent' },
    { id: 'haiku', label: 'Haiku 4.5', desc: 'Fastest' },
  ]

  const hasMessages = messages.length > 0
  const totalTokens = messages.length * 280
  const allResults = [...liveResults.own, ...liveResults.community]
  const showingResults = allResults.length > 0
  const greeting = getGreeting()

  return (
    <div className="content-area">
      <div className="home-research">
        <div className="home-research__scroll">
          {/* Hero */}
          <div className="home-research__hero">
            <div className="home-research__logo-box">
              <ZarnettiLogo className="home-research__logo-svg" />
            </div>
            <h2 className="home-research__title">{greeting}</h2>
            <p className="home-research__subtitle">
              Search Zarnet — your notes, the community, and the web. Use commands or just type.
            </p>

            {/* Search */}
            <div className="home-research__search-wrap">
              <div className="home-research__search-icon">{Icons.search()}</div>
              <input
                ref={inputRef}
                type="text"
                className="home-research__search-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search Zarnet..."
              />
              <button
                onClick={handleSend}
                className={`home-research__search-send ${input.trim() ? 'active' : ''}`}
              >
                {Icons.arrowUp()}
              </button>
            </div>

            {/* Toolbar under search */}
            <div className="home-research__toolbar">
              <div className="home-research__toolbar-left">
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
                <button className="zw-chat-tool-btn" title="Attach file">{Icons.paperclip()}</button>
                <button className="zw-chat-tool-btn" title="Mention">{Icons.atSign()}</button>
                <button className="zw-chat-tool-btn" title="Search web">{Icons.globe()}</button>
                {/* / commands */}
                <div style={{ position: 'relative' }} ref={cmdRef}>
                  <button className="zw-cmd-btn" onClick={() => setShowCommands(!showCommands)} title="Commands">
                    <span className="zw-cmd-btn__slash">/</span>
                  </button>
                  {showCommands && (
                    <div className="zw-cmd-menu">
                      <div className="zw-cmd-menu__title">Commands</div>
                      {COMMANDS.map((c) => (
                        <button key={c.cmd} className="zw-cmd-menu__item" onClick={() => selectCommand(c.cmd)}>
                          <span className="zw-cmd-menu__cmd">{c.cmd}</span>
                          {c.args && <span className="zw-cmd-menu__args">{c.args}</span>}
                          <span className="zw-cmd-menu__desc">{c.desc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Search engine results */}
          {showingResults && (
            <div className="zarnet-results">
              <p className="zarnet-results__count">
                {allResults.length} resultado{allResults.length !== 1 ? 's' : ''} — {(Math.random() * 0.4 + 0.08).toFixed(2)}s
              </p>

              <div className="zarnet-results__filters">
                {['Todo', 'Notas', 'Comunidad'].map((f, i) => (
                  <button key={f} className={`zarnet-results__filter ${i === 0 ? 'active' : ''}`}>{f}</button>
                ))}
              </div>

              {allResults.length > 0 && (
                <article className="zarnet-results__summary">
                  <p className="zarnet-results__summary-label">Resumen</p>
                  <p className="zarnet-results__summary-text">
                    {allResults.length} nota{allResults.length !== 1 ? 's' : ''} encontrada{allResults.length !== 1 ? 's' : ''} para "{input.trim()}". Incluye {liveResults.own.length} propia{liveResults.own.length !== 1 ? 's' : ''} y {liveResults.community.length} de la comunidad.
                  </p>
                </article>
              )}

              <div className="zarnet-results__list">
                {liveResults.own.map((note, i) => (
                  <article
                    key={note.id}
                    className={`zarnet-result ${i < allResults.length - 1 ? 'has-border' : ''}`}
                    onClick={() => onOpenNote(note.id)}
                  >
                    <p className="zarnet-result__url">
                      zarnet.app — notes / {note.id.slice(0, 8)}
                    </p>
                    <h3 className="zarnet-result__title">{note.title || 'Untitled'}</h3>
                    <p className="zarnet-result__snippet">
                      {note.content.slice(0, 180) || 'Empty note'}
                    </p>
                    <div className="zarnet-result__meta">
                      <span>{formatRelativeDate(note.updatedAt)}</span>
                      <span>{note.content.split(/\s+/).length} palabras</span>
                    </div>
                  </article>
                ))}
                {liveResults.community.map((note, i) => (
                  <article
                    key={note.id}
                    className={`zarnet-result ${i < liveResults.community.length - 1 ? 'has-border' : ''}`}
                    onClick={() => onOpenNote(note.id)}
                  >
                    <p className="zarnet-result__url">
                      zarnet.app — community / {(note.author || 'unknown').toLowerCase().replace(/\s/g, '-')}
                    </p>
                    <h3 className="zarnet-result__title">{note.title || 'Untitled'}</h3>
                    <p className="zarnet-result__snippet">
                      {note.content.slice(0, 180) || 'Empty note'}
                    </p>
                    <div className="zarnet-result__meta">
                      <span>published</span>
                      <span>{note.content.split(/\s+/).length} palabras</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Recent notes (when idle) */}
          {!showingResults && !hasMessages && recentNotes.length > 0 && (
            <>
              <div className="home-research__divider">
                <div className="home-research__divider-line" />
                <span className="home-research__divider-text">Recent notes</span>
                <div className="home-research__divider-line" />
              </div>

              <div className="home-research__results">
                {recentNotes.map((note, i) => (
                  <article
                    key={note.id}
                    className={`home-research__result ${i < recentNotes.length - 1 ? 'has-border' : ''}`}
                    onClick={() => onOpenNote(note.id)}
                  >
                    <p className="home-research__result-meta">note</p>
                    <h3 className="home-research__result-title">{note.title || 'Untitled'}</h3>
                    <p className="home-research__result-snippet">
                      {note.content.slice(0, 120) || 'Empty note'}
                    </p>
                    <div className="home-research__result-footer">
                      <span>{formatRelativeDate(note.updatedAt)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {/* Chat messages */}
          {hasMessages && (
            <div className="home-research__messages">
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
          )}
        </div>

        {/* Footer */}
        <div className="zw-chat-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span className="zw-chat-footer-name">Zarnet</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="zw-chat-op-indicator" data-op="read" />
              <span className="zw-chat-op-indicator" data-op="idle" />
            </div>
            <span className="zw-stat-sep" />
            <span className="zw-chat-footer-stat">~{totalTokens} tokens</span>
            <span className="zw-stat-sep" />
            <span className="zw-chat-footer-stat">{notes.length} notes · {publishedNotes.length} published</span>
          </div>
        </div>
      </div>
    </div>
  )
}
