import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type { Note } from '../types'
import type { ChatSession } from '../contexts/UIContext'
import { ZarnettiLogo, Icons } from '../lib/icons'
import { useAutoScroll } from '../hooks/useAutoScroll'
import { UserMessage, AssistantMessage, StreamingMessage, EmptyState } from './chat'
import type { ChatMessage, StreamingState } from './chat'
import '../lib/markdown.css'

interface AttachedFile {
  id: string
  title: string
}

interface HomeScreenProps {
  notes: Note[]
  publishedNotes: Note[]
  onCreateNote: (title: string, content: string) => void
  onOpenNote: (id: string) => void
  onSaveChat: (session: ChatSession) => void
  initialSession?: ChatSession
  attachedFiles?: AttachedFile[]
  onRemoveAttachedFile?: (id: string) => void
  onFileDrop?: (e: React.DragEvent) => void
}

/** 'home' = search/welcome view, 'chat' = AI conversation thread */
type ViewMode = 'home' | 'chat'

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

function isCommand(text: string): boolean {
  const lower = text.toLowerCase().trim()
  return lower.startsWith('/') || lower === '?'
}

export function HomeScreen({ notes, publishedNotes, onCreateNote, onOpenNote, onSaveChat, initialSession, attachedFiles = [], onRemoveAttachedFile, onFileDrop }: HomeScreenProps) {
  const [sessionId] = useState(() => initialSession?.id || `chat-${Date.now()}`)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(
    () => (initialSession?.messages || []).map(m => ({
      ...m, timestamp: (m as ChatMessage).timestamp ?? Date.now(),
    }))
  )
  const [showCommands, setShowCommands] = useState(false)
  const [model, setModel] = useState('Sonnet 4.5')
  const [showModels, setShowModels] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(
    initialSession && initialSession.messages.length > 0 ? 'chat' : 'home'
  )
  const [streaming, setStreaming] = useState<StreamingState>({ status: 'idle', text: '', error: null })
  const inputRef = useRef<HTMLInputElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)
  const cmdRef = useRef<HTMLDivElement>(null)
  const modelRef = useRef<HTMLDivElement>(null)
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isStreaming = streaming.status === 'streaming' || streaming.status === 'connecting'

  // Auto-scroll
  const { scrollRef } = useAutoScroll([
    messages.length,
    streaming.text.length,
    streaming.status,
  ])

  // Save chat session when messages change
  useEffect(() => {
    if (messages.length === 0) return
    const firstUserMsg = messages.find((m) => m.role === 'user')
    const title = firstUserMsg
      ? (firstUserMsg.content.length > 50 ? firstUserMsg.content.slice(0, 50) + '...' : firstUserMsg.content)
      : 'New chat'
    onSaveChat({ id: sessionId, title, messages, createdAt: Date.now() })
  }, [messages, sessionId, onSaveChat])

  // Close dropdowns on outside click
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

  // Focus chat input when entering chat mode
  useEffect(() => {
    if (viewMode === 'chat') {
      setTimeout(() => chatInputRef.current?.focus(), 100)
    }
  }, [viewMode])

  // Auto-resize textarea
  const handleTextareaInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 384) + 'px'
  }, [])

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


  const processCommand = useCallback((text: string): string | null => {
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
      return `**Commands:**\n• \`/new Title\` — Create a note\n• \`/search query\` — Search notes\n• \`/list\` — List all notes\n• \`/open Title\` — Open a note\n• Or just type to chat with AI`
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

    return null
  }, [notes, onCreateNote, onOpenNote])

  // Simulate AI streaming response
  const simulateAIResponse = useCallback((userText: string) => {
    // Clear any existing interval
    if (streamIntervalRef.current) clearInterval(streamIntervalRef.current)

    setStreaming({ status: 'connecting', text: '', error: null })

    // Build context from attached files
    const contextNotes = attachedFiles.length > 0
      ? notes.filter(n => attachedFiles.some(f => f.id === n.id))
      : []
    const contextLabel = contextNotes.length > 0
      ? `Using context from: ${contextNotes.map(n => `**${n.title}**`).join(', ')}\n\n`
      : ''

    setTimeout(() => {
      const query = userText.toLowerCase()
      const found = notes.filter(
        (n) => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query)
      )

      let response: string
      if (found.length > 0) {
        // Generate search result cards using special markers
        const cards = found.slice(0, 3).map((n) =>
          `<!--SEARCH_CARD:${n.id}:${n.title}:${n.content.slice(0, 120).replace(/\n/g, ' ')}-->`
        ).join('\n')
        response = `${contextLabel}I found **${found.length}** note${found.length !== 1 ? 's' : ''} related to your question:\n\n${cards}\n\nWould you like me to elaborate on any of these?`
      } else {
        response = `${contextLabel}I don't have specific notes about "${userText}", but I can help you create one. Would you like me to:\n\n- Create a new note with \`/new ${userText}\`\n- Search more broadly with \`/search ${userText.split(' ')[0]}\`\n- Or just tell me more about what you're looking for`
      }

      let charIndex = 0
      setStreaming({ status: 'streaming', text: '', error: null })

      streamIntervalRef.current = setInterval(() => {
        charIndex += Math.floor(Math.random() * 4) + 2
        if (charIndex >= response.length) {
          charIndex = response.length
          if (streamIntervalRef.current) clearInterval(streamIntervalRef.current)
          streamIntervalRef.current = null
          setStreaming({ status: 'completed', text: '', error: null })
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}-r`, role: 'assistant',
            content: response, timestamp: Date.now(),
          }])
        } else {
          setStreaming({ status: 'streaming', text: response.slice(0, charIndex), error: null })
        }
      }, 20)
    }, 600)
  }, [notes, attachedFiles])

  // Send message (unified for both views)
  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return
    if (isStreaming) return

    // Commands
    if (isCommand(text)) {
      const cmdResponse = processCommand(text)
      if (cmdResponse) {
        setMessages(prev => [
          ...prev,
          { id: `msg-${Date.now()}`, role: 'user', content: text, timestamp: Date.now() },
          { id: `msg-${Date.now()}-r`, role: 'assistant', content: cmdResponse, timestamp: Date.now() },
        ])
      }
      setInput('')
      setShowCommands(false)
      if (viewMode === 'home') setViewMode('chat')
      return
    }

    // If on home view and there are matching results, stay in home (search mode)
    if (viewMode === 'home') {
      const q = text.trim().toLowerCase()
      const hasResults = notes.some(
        (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      ) || publishedNotes.some(
        (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      )
      if (hasResults) {
        // Keep input so results stay visible — don't switch to chat
        return
      }
    }

    // Regular message — switch to chat
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`, role: 'user', content: text, timestamp: Date.now(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setShowCommands(false)
    if (viewMode === 'home') setViewMode('chat')
    simulateAIResponse(text)
  }, [isStreaming, processCommand, simulateAIResponse, viewMode, notes, publishedNotes])

  const handleHomeSend = useCallback(() => sendMessage(input.trim()), [input, sendMessage])
  const handleChatSend = useCallback(() => sendMessage(input.trim()), [input, sendMessage])

  const handleHomeKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleHomeSend() }
    },
    [handleHomeSend]
  )

  const handleChatKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend() }
    },
    [handleChatSend]
  )


  const handleStop = useCallback(() => {
    if (streamIntervalRef.current) clearInterval(streamIntervalRef.current)
    streamIntervalRef.current = null
    // Commit whatever we streamed so far
    const currentText = streaming.text
    if (currentText) {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-r`, role: 'assistant',
        content: currentText, timestamp: Date.now(),
      }])
    }
    setStreaming({ status: 'idle', text: '', error: null })
  }, [streaming.text])

  const handleRetry = useCallback((content: string) => {
    if (isStreaming) return
    // Remove last assistant message, re-send
    setMessages(prev => {
      const lastAi = [...prev].reverse().findIndex(m => m.role === 'assistant')
      if (lastAi >= 0) {
        const idx = prev.length - 1 - lastAi
        return prev.slice(0, idx)
      }
      return prev
    })
    simulateAIResponse(content)
  }, [isStreaming, simulateAIResponse])

  const handleEditMessage = useCallback((messageId: string, newContent: string) => {
    // Remove everything after this message, then re-send
    setMessages(prev => {
      const idx = prev.findIndex(m => m.id === messageId)
      if (idx < 0) return prev
      const updated = prev.slice(0, idx)
      updated.push({ ...prev[idx], content: newContent })
      return updated
    })
    simulateAIResponse(newContent)
  }, [simulateAIResponse])

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

  const totalTokens = messages.length * 280
  const allResults = [...liveResults.own, ...liveResults.community]
  const showingResults = allResults.length > 0 && viewMode === 'home'
  const greeting = getGreeting()
  const hasMessages = messages.length > 0

  // ── Chat mode view ──
  if (viewMode === 'chat') {
    return (
      <div className="content-area">
        <div className="home-research">
          {/* Messages */}
          <div className="zw-chat-messages" ref={scrollRef}>
            <div className="zw-chat-messages__inner">
              {!hasMessages && !isStreaming && (
                <EmptyState onSend={sendMessage} />
              )}

              {messages.map((msg) => (
                msg.role === 'user' ? (
                  <UserMessage
                    key={msg.id}
                    message={msg}
                    onRetry={handleRetry}
                    onEdit={handleEditMessage}
                  />
                ) : (
                  <AssistantMessage
                    key={msg.id}
                    message={msg}
                    onRetry={handleRetry}
                    onOpenNote={onOpenNote}
                  />
                )
              ))}

              <StreamingMessage streaming={streaming} />

              <div className="zw-chat-messages__end" />
            </div>
          </div>

          {/* Input */}
          <div className="zw-chat-input-area">
            <div
              className="zw-chat-input-card"
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
              onDrop={onFileDrop}
            >
              {attachedFiles.length > 0 && (
                <div className="zw-chat-attached">
                  {attachedFiles.map((f) => (
                    <span key={f.id} className="zw-chat-attached-chip">
                      {Icons.file()}
                      <span>{f.title}</span>
                      <button className="zw-chat-attached-chip__x" onClick={() => onRemoveAttachedFile?.(f.id)}>{Icons.x()}</button>
                    </span>
                  ))}
                </div>
              )}
              <textarea
                ref={chatInputRef}
                className="zw-chat-textarea"
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleChatKeyDown}
                placeholder={attachedFiles.length > 0 ? 'Ask about attached files...' : 'Reply...'}
                rows={1}
                disabled={isStreaming}
              />
              <div className="zw-chat-input-toolbar">
                <div className="zw-chat-input-toolbar__left">
                  <button className="zw-toolbar-btn" title="Attach file">{Icons.paperclip()}</button>
                  <div style={{ position: 'relative' }} ref={modelRef}>
                    <button className="zw-chat-model-btn" onClick={() => setShowModels(!showModels)}>
                      <span>zarnet</span>
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
                </div>
                <div className="zw-chat-input-toolbar__right">
                  {isStreaming ? (
                    <button className="zw-chat-send-btn active" onClick={handleStop} title="Stop">
                      {Icons.square()}
                    </button>
                  ) : (
                    <button
                      className={`zw-chat-send-btn ${input.trim() ? 'active' : ''}`}
                      onClick={handleChatSend}
                      title="Send"
                    >
                      {Icons.arrowUp()}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="zw-chat-disclaimer">zarnet can make mistakes. Double-check responses.</div>
          </div>

          {/* Footer */}
          <div className="zw-chat-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span className="zw-chat-footer-name">Zarnet</span>
              <span className="zw-chat-mode-badge">Chat</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="zw-chat-op-indicator" data-op={isStreaming ? 'write' : 'read'} />
                <span className="zw-chat-op-indicator" data-op="idle" />
              </div>
              {messages.length > 0 && (
                <>
                  <span className="zw-stat-sep" />
                  <span className="zw-chat-footer-stat">~{totalTokens} tokens</span>
                </>
              )}
              <span className="zw-stat-sep" />
              <span className="zw-chat-footer-stat">{model}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Home / Search view ──
  return (
    <div className="content-area">
      <div className="home-research">
        <div className="home-research__scroll">
         <div className="home-research__scroll-inner">
          <div className="home-research__spacer" />
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
                onKeyDown={handleHomeKeyDown}
                placeholder="Search Zarnet or start a chat..."
              />
              <button
                onClick={handleHomeSend}
                className={`home-research__search-send ${input.trim() ? 'active' : ''}`}
              >
                {Icons.arrowUp()}
              </button>
            </div>

            {/* Toolbar under search */}
            <div className="home-research__toolbar">
              <div className="home-research__toolbar-left">
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
                <button className="zw-toolbar-btn" title="Attach file">{Icons.paperclip()}</button>
                <button className="zw-toolbar-btn" title="Mention">{Icons.atSign()}</button>
                <button className="zw-toolbar-btn" title="Search web">{Icons.globe()}</button>
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
          <div className="home-research__spacer" />
         </div>
        </div>

        {/* Footer */}
        <div className="zw-chat-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span className="zw-chat-footer-name">Zarnet</span>
            {showingResults && <span className="zw-chat-mode-badge">Search</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="zw-chat-op-indicator" data-op="read" />
              <span className="zw-chat-op-indicator" data-op="idle" />
            </div>
            <span className="zw-stat-sep" />
            <span className="zw-chat-footer-stat">{notes.length} notes · {publishedNotes.length} published</span>
          </div>
        </div>
      </div>
    </div>
  )
}
