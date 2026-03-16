import { useState, useRef, useCallback } from 'react'
import type { Note } from '../types'
import { Icons } from '../lib/icons'

interface HomeScreenProps {
  notes: Note[]
  onCreateNote: (title: string, content: string) => void
  onOpenNote: (id: string) => void
}

interface ChatMessage {
  role: 'user' | 'ai'
  content: string
}

export function HomeScreen({ notes, onCreateNote, onOpenNote }: HomeScreenProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const processCommand = useCallback((text: string) => {
    const lower = text.toLowerCase().trim()

    // Create note
    if (lower.startsWith('/new ') || lower.startsWith('/create ')) {
      const title = text.replace(/^\/(new|create)\s+/i, '').trim()
      onCreateNote(title, '')
      return `Created note **"${title}"**. Switching to editor.`
    }

    // Search notes
    if (lower.startsWith('/search ') || lower.startsWith('/find ')) {
      const query = text.replace(/^\/(search|find)\s+/i, '').trim().toLowerCase()
      const found = notes.filter(
        (n) => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query)
      )
      if (found.length === 0) return `No notes found matching "${query}".`
      return `Found **${found.length}** note(s):\n${found.map((n) => `• **${n.title}**`).join('\n')}`
    }

    // List notes
    if (lower === '/list' || lower === '/notes') {
      if (notes.length === 0) return 'No notes yet. Use `/new Title` to create one.'
      return `**${notes.length} notes:**\n${notes.map((n) => `• **${n.title}**`).join('\n')}`
    }

    // Help
    if (lower === '/help' || lower === '?') {
      return `**Zarnetti Commands:**\n• \`/new Title\` — Create a new note\n• \`/search query\` — Search your notes\n• \`/list\` — List all notes\n• \`/open Title\` — Open a note by name\n• Or just type naturally to generate content`
    }

    // Open note
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

  const handleSend = () => {
    const text = input.trim()
    if (!text) return

    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')

    // Process and respond
    setTimeout(() => {
      const response = processCommand(text)
      setMessages((prev) => [...prev, { role: 'ai', content: response }])
    }, 150)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const shortcuts = [
    { label: 'New note', cmd: '/new ' },
    { label: 'Search', cmd: '/search ' },
    { label: 'List all', cmd: '/list' },
    { label: 'Help', cmd: '/help' },
  ]

  return (
    <div className="content-area">
      <div className="home">
        <div>
          <div className="home__brand"><strong>Zarnetti</strong></div>
          <div className="home__sub">Knowledge engine — type a command or start writing</div>
        </div>

        {/* Chat messages */}
        {messages.length > 0 && (
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg chat-msg--${msg.role}`}>
                {msg.role === 'ai'
                  ? msg.content.split('\n').map((line, j) => {
                      const parsed = line
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/`([^`]+)`/g, '<code>$1</code>')
                      return <div key={j} dangerouslySetInnerHTML={{ __html: parsed }} />
                    })
                  : msg.content
                }
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="chat-input-wrap">
          <textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command (/new, /search) or describe a note..."
            rows={1}
          />
          <button className="chat-input-send" onClick={handleSend} aria-label="Send">
            {Icons.send()}
          </button>
        </div>

        {/* Shortcuts */}
        {messages.length === 0 && (
          <div className="home__shortcuts">
            {shortcuts.map((s) => (
              <button
                key={s.cmd}
                className="shortcut-chip"
                onClick={() => {
                  setInput(s.cmd)
                  inputRef.current?.focus()
                }}
              >
                {Icons.bolt()}
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
