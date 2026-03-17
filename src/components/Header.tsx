import { useRef, useState } from 'react'
import { Icons } from '../lib/icons'
import { useClickOutside } from '../hooks/useClickOutside'
import type { View } from '../contexts/UIContext'
import type { Note } from '../types'

interface HeaderProps {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  view: View
  setView: (v: View) => void
  showEditor: boolean
  editingNote: Note | null | undefined
  showHistory: boolean
  setShowHistory: (v: boolean) => void
  showPlugins: boolean
  setShowPlugins: (v: boolean) => void
  pluginPanel: 'agents' | null
  setPluginPanel: (v: 'agents' | null) => void
  showPeoplePanel: boolean
  setShowPeoplePanel: (v: boolean) => void
  unreadAlerts: number
  profileAgentId: string | null
  setProfileAgentId: (v: string | null) => void
  setEditingNoteId: (v: string | null) => void
  onPublish: () => void
}

const modes: { id: View; icon: (p?: object) => React.ReactNode; label: string }[] = [
  { id: 'feed', icon: Icons.rss, label: 'Feed' },
  { id: 'chat', icon: Icons.messageCircle, label: 'Chat' },
  { id: 'graph', icon: Icons.network, label: 'Graph' },
]

export function Header({
  sidebarCollapsed, setSidebarCollapsed,
  view, setView,
  showEditor, editingNote,
  showHistory, setShowHistory,
  showPlugins, setShowPlugins,
  pluginPanel, setPluginPanel,
  showPeoplePanel, setShowPeoplePanel,
  unreadAlerts, profileAgentId, setProfileAgentId, setEditingNoteId,
  onPublish,
}: HeaderProps) {
  const pluginsRef = useRef<HTMLDivElement>(null)

  useClickOutside(pluginsRef, showPlugins, () => setShowPlugins(false))

  return (
    <header className="header">
      {/* LEFT: sidebar toggle + mode switcher */}
      <div className="header__left">
        <button
          className={`header__icon-btn ${sidebarCollapsed ? '' : 'header__icon-btn--hidden'}`}
          onClick={() => setSidebarCollapsed(false)}
          title="Open sidebar"
          tabIndex={sidebarCollapsed ? 0 : -1}
        >
          {Icons.menu()}
        </button>
        <div className="zw-mode-switcher">
          {modes.map((m) => (
            <button
              key={m.id}
              className={`zw-mode-tab ${view === m.id && !showEditor && !pluginPanel ? 'active' : ''}`}
              onClick={() => { setView(m.id); setEditingNoteId(null); setPluginPanel(null); setProfileAgentId(null) }}
            >
              {m.icon()}
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CENTER: search input */}
      <div className="header__center">
        <div className="header__search">
          {Icons.search()}
          <input type="text" className="header__search-input" placeholder="Search Zarnet..." />
        </div>
      </div>

      {/* RIGHT: icon buttons + publish */}
      <div className="header__right">
        <button
          className={`header__icon-btn ${showHistory ? 'active' : ''} ${!(view === 'chat' && !showEditor && !pluginPanel) ? 'header__icon-btn--hidden' : ''}`}
          onClick={() => setShowHistory(!showHistory)}
          title="Chat history"
          tabIndex={view === 'chat' && !showEditor && !pluginPanel ? 0 : -1}
        >
          {Icons.clock()}
        </button>

        {/* Plugins dropdown */}
        <div style={{ position: 'relative' }} ref={pluginsRef}>
          <button
            className={`header__icon-btn ${pluginPanel ? 'active' : ''}`}
            onClick={() => setShowPlugins(!showPlugins)}
            title="Plugins"
          >
            {Icons.puzzle()}
            {unreadAlerts > 0 && <span className="header__icon-badge">{unreadAlerts}</span>}
          </button>
          {showPlugins && (
            <div className="header__plugins-menu">
              <div className="header__plugins-menu-title">Plugins</div>
              <button
                className={`header__plugins-item ${pluginPanel === 'agents' ? 'active' : ''}`}
                onClick={() => {
                  setPluginPanel(pluginPanel === 'agents' ? null : 'agents')
                  setShowPlugins(false)
                  setProfileAgentId(null)
                  setEditingNoteId(null)
                }}
              >
                {Icons.bot()}
                <div className="header__plugins-item-info">
                  <span>Agents</span>
                  <span className="header__plugins-item-desc">Characters & contracts</span>
                </div>
                {unreadAlerts > 0 && <span className="header__plugins-badge">{unreadAlerts}</span>}
              </button>
            </div>
          )}
        </div>

        <button
          className={`header__icon-btn header__icon-btn--borderless ${showPeoplePanel ? 'active' : ''}`}
          title="Add people"
          onClick={() => setShowPeoplePanel(!showPeoplePanel)}
        >
          {Icons.userPlus()}
        </button>

        {/* Publish — only when editing a note */}
        <button
          className={`header__publish-btn ${editingNote?.published ? 'published' : ''} ${!(showEditor && editingNote) ? 'header__publish-btn--hidden' : ''}`}
          onClick={onPublish}
          title={editingNote?.published ? 'Published' : 'Publish note'}
          tabIndex={showEditor && editingNote ? 0 : -1}
        >
          {editingNote?.published ? Icons.check() : Icons.upload()}
          <span>{editingNote?.published ? 'Published' : 'Publish'}</span>
        </button>
      </div>
    </header>
  )
}
