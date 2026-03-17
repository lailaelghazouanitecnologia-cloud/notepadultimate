import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import type { Agent, Conversation, DirectMessage } from '../types'
import { Icons } from '../lib/icons'

interface MessagesViewProps {
  agents: Agent[]
  onOpenProfile: (agentId: string) => void
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

// Simulated agent reply based on personality
function generateReply(agent: Agent, userMsg: string): string {
  const lower = userMsg.toLowerCase()
  const responses = [
    `Interesting point. Let me think about that from a ${agent.interests[0] || 'general'} perspective.`,
    `I've been working on something related to this. ${agent.bio.split('.')[0]}.`,
    `That's a good question. In my experience with ${agent.interests[0] || 'these topics'}, I'd say there's more to explore here.`,
    `Let me check my notes on this. I'll get back to you shortly.`,
    `I agree. This connects to what I was researching about ${agent.interests[1] || agent.interests[0] || 'this'}.`,
  ]
  if (lower.includes('?')) {
    return responses[Math.floor(Math.random() * 3)]
  }
  return responses[Math.floor(Math.random() * responses.length)]
}

export function MessagesView({ agents, onOpenProfile }: MessagesViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Initialize conversations from agents on first load
  useEffect(() => {
    if (conversations.length > 0 || agents.length === 0) return
    const initial = agents.filter(a => a.isPreset).slice(0, 6).map(agent => ({
      id: `conv-${agent.id}`,
      agentId: agent.id,
      messages: [] as DirectMessage[],
      unread: 0,
      updatedAt: Date.now() - Math.floor(Math.random() * 86400000),
    }))
    // Seed some conversations with messages
    if (initial.length > 0) {
      const a0 = agents.find(a => a.id === initial[0].agentId)
      if (a0) {
        const now = Date.now()
        initial[0].messages = [
          { id: 'm1', conversationId: initial[0].id, sender: 'agent', content: `Hey! I've been looking into ${a0.interests[0] || 'some things'}. Have you seen the latest research?`, timestamp: now - 600000 },
          { id: 'm2', conversationId: initial[0].id, sender: 'user', content: 'Not yet, send me what you found.', timestamp: now - 540000 },
          { id: 'm3', conversationId: initial[0].id, sender: 'agent', content: `Working on it. ${a0.bio.split('.')[0]}.`, timestamp: now - 480000 },
          { id: 'm4', conversationId: initial[0].id, sender: 'agent', content: 'Check the shared workspace — I uploaded the files.', timestamp: now - 120000 },
        ]
        initial[0].unread = 1
        initial[0].updatedAt = now - 120000
      }
    }
    if (initial.length > 1) {
      const a1 = agents.find(a => a.id === initial[1].agentId)
      if (a1) {
        const now = Date.now()
        initial[1].messages = [
          { id: 'm5', conversationId: initial[1].id, sender: 'agent', content: `I have a question about ${a1.interests[0] || 'something'}.`, timestamp: now - 3600000 },
          { id: 'm6', conversationId: initial[1].id, sender: 'user', content: 'Sure, go ahead.', timestamp: now - 3540000 },
          { id: 'm7', conversationId: initial[1].id, sender: 'agent', content: `The approach we discussed has some edge cases I want to explore. Can we look at it together?`, timestamp: now - 3480000 },
        ]
        initial[1].unread = 1
        initial[1].updatedAt = now - 3480000
      }
    }
    setConversations(initial)
    if (initial.length > 0) setActiveConvId(initial[0].id)
  }, [agents, conversations.length])

  const activeConv = conversations.find(c => c.id === activeConvId) || null
  const activeAgent = activeConv ? agents.find(a => a.id === activeConv.agentId) : null

  // Sort conversations by updatedAt
  const sortedConversations = useMemo(() =>
    [...conversations].sort((a, b) => b.updatedAt - a.updatedAt),
    [conversations]
  )

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!search.trim()) return sortedConversations
    const q = search.toLowerCase()
    return sortedConversations.filter(c => {
      const agent = agents.find(a => a.id === c.agentId)
      return agent && (agent.name.toLowerCase().includes(q) || agent.handle.toLowerCase().includes(q))
    })
  }, [sortedConversations, search, agents])

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activeConv?.messages.length, typing])

  // Select conversation and mark read
  const selectConversation = useCallback((id: string) => {
    setActiveConvId(id)
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, unread: 0 } : c
    ))
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  // Send a message
  const sendMessage = useCallback(() => {
    const text = input.trim()
    if (!text || !activeConvId || !activeAgent) return

    const msg: DirectMessage = {
      id: `dm-${Date.now()}`,
      conversationId: activeConvId,
      sender: 'user',
      content: text,
      timestamp: Date.now(),
    }

    setConversations(prev => prev.map(c =>
      c.id === activeConvId
        ? { ...c, messages: [...c.messages, msg], updatedAt: Date.now() }
        : c
    ))
    setInput('')
    if (inputRef.current) { inputRef.current.style.height = 'auto' }

    // Simulate agent reply
    setTyping(true)
    const delay = 800 + Math.random() * 2000
    setTimeout(() => {
      const reply: DirectMessage = {
        id: `dm-${Date.now()}-reply`,
        conversationId: activeConvId,
        sender: 'agent',
        content: generateReply(activeAgent, text),
        timestamp: Date.now(),
      }
      setConversations(prev => prev.map(c =>
        c.id === activeConvId
          ? { ...c, messages: [...c.messages, reply], updatedAt: Date.now() }
          : c
      ))
      setTyping(false)
    }, delay)
  }, [input, activeConvId, activeAgent])

  const handleInputKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = ta.scrollHeight + 'px'
  }, [])

  // Start new conversation with agent
  const startConversation = useCallback((agentId: string) => {
    const existing = conversations.find(c => c.agentId === agentId)
    if (existing) {
      selectConversation(existing.id)
      return
    }
    const conv: Conversation = {
      id: `conv-${agentId}-${Date.now()}`,
      agentId,
      messages: [],
      unread: 0,
      updatedAt: Date.now(),
    }
    setConversations(prev => [conv, ...prev])
    setActiveConvId(conv.id)
  }, [conversations, selectConversation])

  // Group consecutive messages by sender
  const messageGroups = useMemo(() => {
    if (!activeConv) return []
    const groups: { sender: 'user' | 'agent'; messages: DirectMessage[] }[] = []
    for (const msg of activeConv.messages) {
      const last = groups[groups.length - 1]
      if (last && last.sender === msg.sender) {
        last.messages.push(msg)
      } else {
        groups.push({ sender: msg.sender, messages: [msg] })
      }
    }
    return groups
  }, [activeConv])

  return (
    <div className="content-area">
      <div className="dm">
        {/* Conversation list */}
        <div className="dm-list">
          <div className="dm-list__header">
            <h2 className="dm-list__title">Messages</h2>
            <div className="dm-list__actions">
              <button className="dm-list__btn" title="New message" onClick={() => {
                // Pick a random agent not already in conversations
                const existing = new Set(conversations.map(c => c.agentId))
                const available = agents.filter(a => !existing.has(a.id))
                if (available.length > 0) startConversation(available[0].id)
              }}>
                {Icons.edit()}
              </button>
            </div>
          </div>
          <div className="dm-list__search">
            <div className="dm-list__search-inner">
              {Icons.search()}
              <input
                type="text"
                placeholder="Search messages..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="dm-list__scroll">
            {filteredConversations.map(conv => {
              const agent = agents.find(a => a.id === conv.agentId)
              if (!agent) return null
              const lastMsg = conv.messages[conv.messages.length - 1]
              const isActive = conv.id === activeConvId
              const isUnread = conv.unread > 0
              return (
                <button
                  key={conv.id}
                  className={`dm-item ${isActive ? 'active' : ''} ${isUnread ? 'dm-item--unread' : ''}`}
                  onClick={() => selectConversation(conv.id)}
                >
                  <div className="dm-item__avatar">{agent.avatar}</div>
                  <div className="dm-item__info">
                    <div className="dm-item__top">
                      <span className="dm-item__name">{agent.name}</span>
                      {lastMsg && <span className="dm-item__time">{formatRelative(lastMsg.timestamp)}</span>}
                    </div>
                    <div className="dm-item__preview">
                      {lastMsg
                        ? (lastMsg.sender === 'user' ? 'You: ' : '') + lastMsg.content
                        : 'Start a conversation'}
                    </div>
                  </div>
                  {isUnread && <div className="dm-item__badge" />}
                </button>
              )
            })}
            {filteredConversations.length === 0 && (
              <div className="dm-list__empty">
                {search ? 'No results' : 'No conversations yet'}
              </div>
            )}
          </div>
        </div>

        {/* Chat view */}
        {activeConv && activeAgent ? (
          <div className="dm-chat">
            <div className="dm-chat__header">
              <div className="dm-chat__header-avatar" onClick={() => onOpenProfile(activeAgent.id)}>
                {activeAgent.avatar}
              </div>
              <div className="dm-chat__header-info" onClick={() => onOpenProfile(activeAgent.id)}>
                <div className="dm-chat__header-name">{activeAgent.name}</div>
                <div className="dm-chat__header-status">{activeAgent.handle}</div>
              </div>
              <div className="dm-chat__header-actions">
                <button className="dm-list__btn" title="Profile" onClick={() => onOpenProfile(activeAgent.id)}>
                  {Icons.users()}
                </button>
              </div>
            </div>

            <div className="dm-chat__scroll" ref={scrollRef}>
              {messageGroups.length === 0 && (
                <div className="dm-chat__empty">
                  <div className="dm-chat__empty-avatar">{activeAgent.avatar}</div>
                  <div className="dm-chat__empty-name">{activeAgent.name}</div>
                  <div className="dm-chat__empty-handle">{activeAgent.handle}</div>
                  <div className="dm-chat__empty-bio">{activeAgent.bio}</div>
                </div>
              )}

              {messageGroups.map((group, gi) => (
                <div key={gi} className={`dm-group ${group.sender === 'user' ? 'dm-group--me' : 'dm-group--them'}`}>
                  {group.messages.map((msg, mi) => (
                    <div key={msg.id} className={`dm-bubble ${mi === 0 ? 'dm-bubble--first' : ''} ${mi === group.messages.length - 1 ? 'dm-bubble--last' : ''}`}>
                      {msg.content}
                    </div>
                  ))}
                  <div className="dm-group__time">
                    {formatTime(group.messages[group.messages.length - 1].timestamp)}
                  </div>
                </div>
              ))}

              {typing && (
                <div className="dm-typing">
                  <span /><span /><span />
                </div>
              )}
            </div>

            <div className="dm-composer">
              <textarea
                ref={inputRef}
                className="dm-composer__input"
                placeholder={`Message ${activeAgent.name}...`}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleInputKey}
                rows={1}
              />
              <div className="dm-composer__tools">
                <button className="dm-composer__tool" title="Attach">
                  {Icons.paperclip()}
                </button>
                <button
                  className="dm-composer__send"
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  title="Send"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="dm-chat dm-chat--empty">
            <div className="dm-chat__placeholder">
              {Icons.messageCircle()}
              <p>Select a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
