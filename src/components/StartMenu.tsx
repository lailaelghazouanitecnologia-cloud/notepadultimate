import { useState } from 'react'
import type { Agent } from '../types'
import type { View } from '../contexts/UIContext'
import { Identicon, Icons } from '../lib/icons'

interface StartMenuProps {
  agents: Agent[]
  view: View
  projectName: string
  theme: 'light' | 'dark'
  onNavigate: (view: View) => void
  onPost: () => void
  onOpenAgents: () => void
  onOpenPlugins: () => void
  onToggleTheme: () => void
  onClose: () => void
}

const NAV_ITEMS: { label: string; icon: (p?: object) => React.JSX.Element; view?: View; key: string }[] = [
  { key: 'home', label: 'Home', icon: Icons.rss, view: 'feed' },
  { key: 'explore', label: 'Explore', icon: Icons.search, view: 'explore' },
  { key: 'messages', label: 'Messages', icon: Icons.messageCircle, view: 'messages' },
  { key: 'agents', label: 'Agents', icon: Icons.users },
  { key: 'workspace', label: 'Workspace', icon: Icons.folder, view: 'workspace' },
  { key: 'chat', label: 'AI Chat', icon: Icons.bot, view: 'chat' },
  { key: 'graph', label: 'Graph', icon: Icons.network, view: 'graph' },
]

export function StartMenu({
  agents, view, projectName, theme,
  onNavigate, onPost, onOpenAgents, onOpenPlugins, onToggleTheme, onClose,
}: StartMenuProps) {
  const [search, setSearch] = useState('')

  const presetAgents = agents.filter(a => a.isPreset)
  const filtered = search
    ? presetAgents.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.handle.toLowerCase().includes(search.toLowerCase())
      )
    : presetAgents

  const go = (v: View) => { onNavigate(v); onClose() }

  return <>
    <div className="start-menu-backdrop" onClick={onClose} />
    <div className="start-menu">
      {/* Header — user banner */}
      <div className="start-menu__header">
        <div className="start-menu__avatar">
          <Identicon />
        </div>
        <div>
          <div className="start-menu__user-name">{projectName}</div>
          <div className="start-menu__user-handle">@user</div>
        </div>
      </div>

      {/* Body — two columns */}
      <div className="start-menu__body">
        {/* Left: pinned actions + agents */}
        <div className="start-menu__left">
          <div className="start-menu__section">Pinned</div>
          <button className="start-menu__item" onClick={() => { onPost(); onClose() }}>
            {Icons.edit()}
            <span>New Post</span>
          </button>
          <button className="start-menu__item" onClick={() => go('chat')}>
            {Icons.bot()}
            <span>AI Chat</span>
          </button>
          <button className="start-menu__item" onClick={() => go('workspace')}>
            {Icons.fileText()}
            <span>New Note</span>
          </button>

          <div className="start-menu__divider" />
          <div className="start-menu__section">Agents</div>
          {filtered.map(agent => (
            <button
              key={agent.id}
              className="start-menu__item"
              onClick={() => { onOpenAgents(); onClose() }}
            >
              <div className="start-menu__agent-icon">{agent.avatar}</div>
              <div className="start-menu__agent-info">
                <span className="start-menu__agent-name">{agent.name}</span>
                <span className="start-menu__agent-handle">@{agent.handle}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Right: navigation */}
        <div className="start-menu__right">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={`start-menu__item ${item.view === view ? 'start-menu__item--active' : ''}`}
              onClick={() => {
                if (item.key === 'agents') { onOpenAgents(); onClose() }
                else if (item.view) go(item.view)
              }}
            >
              {item.icon()}
              <span>{item.label}</span>
            </button>
          ))}

          <div className="start-menu__divider" />

          <button className="start-menu__item" onClick={() => { onOpenPlugins(); onClose() }}>
            {Icons.puzzle()}
            <span>Plugins</span>
          </button>
          <button className="start-menu__item" onClick={onClose}>
            {Icons.settings()}
            <span>Settings</span>
          </button>
          <button className="start-menu__item" onClick={() => { onToggleTheme(); onClose() }}>
            {theme === 'dark' ? Icons.sun() : Icons.moon()}
            <span>{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
          </button>
        </div>
      </div>

      {/* Footer — search + power */}
      <div className="start-menu__footer">
        <input
          className="start-menu__search"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
        <div className="start-menu__power">
          <button className="start-menu__power-btn" title="Log out">
            {Icons.logOut()}
          </button>
        </div>
      </div>
    </div>
  </>
}
