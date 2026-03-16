import { useState, useMemo } from 'react'
import type { Agent, Alert, Note, Contract } from '../types'
import { Icons } from '../lib/icons'

interface AgentsViewProps {
  agents: Agent[]
  alerts: Alert[]
  publishedNotes: Note[]
  contracts: Contract[]
  onCreateAgent: (agent: Omit<Agent, 'id' | 'createdAt' | 'notes' | 'followers' | 'following'>) => void
  onDeleteAgent: (id: string) => void
  onOpenProfile: (agentId: string) => void
  onMarkAlertRead: (alertId: string) => void
  onCreateContract: (agentId: string, name: string, description: string) => void
  onDeleteContract: (id: string) => void
}

type Tab = 'characters' | 'create' | 'contracts' | 'alerts'

export function AgentsView({
  agents, alerts, publishedNotes, contracts,
  onCreateAgent, onDeleteAgent, onOpenProfile, onMarkAlertRead,
  onCreateContract, onDeleteContract,
}: AgentsViewProps) {
  const [tab, setTab] = useState<Tab>('characters')
  const [search, setSearch] = useState('')

  // Create form state
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [avatar, setAvatar] = useState('🤖')
  const [bio, setBio] = useState('')
  const [personality, setPersonality] = useState('')
  const [interests, setInterests] = useState('')

  // Contract create state
  const [contractAgent, setContractAgent] = useState('')
  const [contractName, setContractName] = useState('')
  const [contractDesc, setContractDesc] = useState('')
  const [showContractForm, setShowContractForm] = useState(false)

  const unreadCount = alerts.filter((a) => !a.read).length

  const filteredAgents = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return agents
    return agents.filter((a) =>
      a.name.toLowerCase().includes(q) ||
      a.handle.toLowerCase().includes(q) ||
      a.interests.some((i) => i.toLowerCase().includes(q))
    )
  }, [agents, search])

  const handleCreate = () => {
    if (!name.trim() || !handle.trim()) return
    onCreateAgent({
      name: name.trim(),
      handle: handle.startsWith('@') ? handle.trim() : `@${handle.trim()}`,
      avatar: avatar || '🤖',
      bio: bio.trim(),
      personality: personality.trim(),
      interests: interests.split(',').map((i) => i.trim()).filter(Boolean),
      isPreset: false,
    })
    setName(''); setHandle(''); setAvatar('🤖'); setBio(''); setPersonality(''); setInterests('')
    setTab('characters')
  }

  const handleCreateContract = () => {
    if (!contractAgent || !contractName.trim() || !contractDesc.trim()) return
    onCreateContract(contractAgent, contractName.trim(), contractDesc.trim())
    setContractAgent(''); setContractName(''); setContractDesc('')
    setShowContractForm(false)
  }

  const agentAlerts = (agentId: string) => alerts.filter((a) => a.agentId === agentId)

  const AVATARS = ['🤖', '👾', '🧠', '🦊', '🐉', '🎭', '🌀', '🔮', '👁️', '🦇', '🌙', '⚔️']

  return (
    <div className="content-area">
      <div className="agents-view">
        {/* Tabs */}
        <div className="agents-tabs">
          <button
            className={`agents-tab ${tab === 'characters' ? 'active' : ''}`}
            onClick={() => setTab('characters')}
          >
            {Icons.users()}
            <span>Characters</span>
          </button>
          <button
            className={`agents-tab ${tab === 'create' ? 'active' : ''}`}
            onClick={() => setTab('create')}
          >
            {Icons.plus()}
            <span>Create</span>
          </button>
          <button
            className={`agents-tab ${tab === 'contracts' ? 'active' : ''}`}
            onClick={() => setTab('contracts')}
          >
            {Icons.fileText()}
            <span>Contracts</span>
          </button>
          <button
            className={`agents-tab ${tab === 'alerts' ? 'active' : ''}`}
            onClick={() => setTab('alerts')}
          >
            {Icons.bell()}
            <span>Alerts</span>
            {unreadCount > 0 && <span className="agents-tab__badge">{unreadCount}</span>}
          </button>
        </div>

        <div className="agents-content">
          {/* ── Characters tab ── */}
          {tab === 'characters' && (
            <>
              <div className="agents-search">
                {Icons.search()}
                <input
                  type="text"
                  className="agents-search__input"
                  placeholder="Search characters..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="agents-grid">
                {filteredAgents.map((agent) => {
                  const agentAlertCount = agentAlerts(agent.id).filter((a) => !a.read).length
                  const agentContracts = contracts.filter((c) => c.agentId === agent.id)
                  return (
                    <div
                      key={agent.id}
                      className="agent-card"
                      onClick={() => onOpenProfile(agent.id)}
                    >
                      <div className="agent-card__header">
                        <div className="agent-card__avatar">{agent.avatar}</div>
                        <div className="agent-card__info">
                          <div className="agent-card__name">{agent.name}</div>
                          <div className="agent-card__handle">{agent.handle}</div>
                        </div>
                        {agentAlertCount > 0 && (
                          <span className="agent-card__alert-dot">{agentAlertCount}</span>
                        )}
                      </div>
                      <p className="agent-card__bio">{agent.bio}</p>
                      <div className="agent-card__interests">
                        {agent.interests.slice(0, 4).map((interest) => (
                          <span key={interest} className="agent-card__tag">{interest}</span>
                        ))}
                      </div>
                      <div className="agent-card__stats">
                        <span><strong>{agent.followers.toLocaleString()}</strong> followers</span>
                        <span><strong>{agent.following}</strong> following</span>
                        {agentContracts.length > 0 && (
                          <span className="agent-card__preset">{agentContracts.length} contract{agentContracts.length !== 1 ? 's' : ''}</span>
                        )}
                        {agent.isPreset && <span className="agent-card__preset">preset</span>}
                      </div>
                      {!agent.isPreset && (
                        <button
                          className="agent-card__delete"
                          onClick={(e) => { e.stopPropagation(); onDeleteAgent(agent.id) }}
                          title="Delete agent"
                        >
                          {Icons.x()}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* ── Create tab ── */}
          {tab === 'create' && (
            <div className="agent-create">
              <div className="agent-create__header">
                <h3 className="agent-create__title">Create a Character</h3>
                <p className="agent-create__subtitle">
                  Design a unique persona with its own personality, interests, and voice.
                </p>
              </div>

              <div className="agent-create__form">
                <div className="agent-create__avatar-section">
                  <div className="agent-create__avatar-display">{avatar}</div>
                  <div className="agent-create__avatar-grid">
                    {AVATARS.map((emoji) => (
                      <button
                        key={emoji}
                        className={`agent-create__avatar-option ${avatar === emoji ? 'active' : ''}`}
                        onClick={() => setAvatar(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="agent-create__row">
                  <label className="agent-create__label">Name</label>
                  <input
                    type="text" className="agent-create__input"
                    value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Marcus Aurelius"
                  />
                </div>

                <div className="agent-create__row">
                  <label className="agent-create__label">Handle</label>
                  <input
                    type="text" className="agent-create__input"
                    value={handle} onChange={(e) => setHandle(e.target.value)}
                    placeholder="e.g. @marcus"
                  />
                </div>

                <div className="agent-create__row">
                  <label className="agent-create__label">Bio</label>
                  <textarea
                    className="agent-create__textarea" rows={2}
                    value={bio} onChange={(e) => setBio(e.target.value)}
                    placeholder="A short bio for the character..."
                  />
                </div>

                <div className="agent-create__row">
                  <label className="agent-create__label">Personality</label>
                  <textarea
                    className="agent-create__textarea" rows={3}
                    value={personality} onChange={(e) => setPersonality(e.target.value)}
                    placeholder="How does this character speak? What's their worldview?"
                  />
                </div>

                <div className="agent-create__row">
                  <label className="agent-create__label">Interests</label>
                  <input
                    type="text" className="agent-create__input"
                    value={interests} onChange={(e) => setInterests(e.target.value)}
                    placeholder="science, philosophy, music (comma separated)"
                  />
                </div>

                <button
                  className="agent-create__submit"
                  onClick={handleCreate}
                  disabled={!name.trim() || !handle.trim()}
                >
                  Create Character
                </button>
              </div>
            </div>
          )}

          {/* ── Contracts tab ── */}
          {tab === 'contracts' && (
            <div className="agent-create">
              <div className="agent-create__header">
                <h3 className="agent-create__title">Agent Contracts</h3>
                <p className="agent-create__subtitle">
                  Define instructions and tasks for your agents in this workspace.
                </p>
              </div>

              {contracts.length === 0 && !showContractForm && (
                <div className="agents-alerts__empty">
                  <div className="agents-alerts__empty-icon">{Icons.fileText()}</div>
                  <p>No contracts yet</p>
                  <p className="agents-alerts__empty-sub">
                    Create contracts to tell agents what to do in this workspace.
                  </p>
                </div>
              )}

              <div className="contracts-section">
                {contracts.map((contract) => {
                  const agent = agents.find((a) => a.id === contract.agentId)
                  return (
                    <div key={contract.id} className="contract-card">
                      <div className="contract-card__header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16 }}>{agent?.avatar || '🤖'}</span>
                          <div>
                            <div className="contract-card__name">{contract.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>
                              {agent?.name || 'Unknown'} · {agent?.handle}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className={`contract-card__status contract-card__status--${contract.status}`}>
                            {contract.status}
                          </span>
                          <button
                            className="contract-card__delete"
                            onClick={() => onDeleteContract(contract.id)}
                          >
                            {Icons.x()}
                          </button>
                        </div>
                      </div>
                      <p className="contract-card__desc">{contract.description}</p>
                    </div>
                  )
                })}

                {showContractForm ? (
                  <div className="contract-create">
                    <select
                      className="contract-create__input"
                      value={contractAgent}
                      onChange={(e) => setContractAgent(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="">Select agent...</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>{a.avatar} {a.name}</option>
                      ))}
                    </select>
                    <input
                      type="text" className="contract-create__input"
                      value={contractName} onChange={(e) => setContractName(e.target.value)}
                      placeholder="Contract name (e.g. Monitor science news)"
                    />
                    <textarea
                      className="contract-create__textarea"
                      value={contractDesc} onChange={(e) => setContractDesc(e.target.value)}
                      placeholder="Describe what the agent should do..."
                    />
                    <div className="contract-create__actions">
                      <button
                        className="contract-create__btn contract-create__btn--cancel"
                        onClick={() => { setShowContractForm(false); setContractAgent(''); setContractName(''); setContractDesc('') }}
                      >
                        Cancel
                      </button>
                      <button
                        className="contract-create__btn contract-create__btn--save"
                        onClick={handleCreateContract}
                      >
                        Create
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="zw-ws-menu-item"
                    style={{ marginTop: 8, height: 32, borderRadius: 6, border: '1px dashed var(--border)' }}
                    onClick={() => setShowContractForm(true)}
                  >
                    {Icons.plus()}
                    <span>New contract</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Alerts tab ── */}
          {tab === 'alerts' && (
            <div className="agents-alerts">
              {alerts.length === 0 && (
                <div className="agents-alerts__empty">
                  <div className="agents-alerts__empty-icon">{Icons.bell()}</div>
                  <p>No alerts yet</p>
                  <p className="agents-alerts__empty-sub">
                    Alerts appear when published notes match your characters' interests.
                  </p>
                </div>
              )}
              {alerts.map((alert) => {
                const agent = agents.find((a) => a.id === alert.agentId)
                return (
                  <div
                    key={alert.id}
                    className={`agents-alert ${!alert.read ? 'unread' : ''}`}
                    onClick={() => onMarkAlertRead(alert.id)}
                  >
                    <div className="agents-alert__avatar">{agent?.avatar || '?'}</div>
                    <div className="agents-alert__body">
                      <div className="agents-alert__agent">{agent?.name || 'Unknown'}</div>
                      <div className="agents-alert__title">{alert.title}</div>
                      <div className="agents-alert__content">{alert.content}</div>
                    </div>
                    {!alert.read && <div className="agents-alert__dot" />}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
