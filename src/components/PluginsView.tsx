import { useState } from 'react'
import { Icons } from '../lib/icons'

interface PluginsViewProps {
  onOpenAgents: () => void
}

interface Plugin {
  id: string
  name: string
  description: string
  icon: string
  enabled: boolean
  category: 'ai' | 'tools' | 'integrations' | 'community'
}

const PRESET_PLUGINS: Plugin[] = [
  { id: 'agents', name: 'Agents', description: 'Create and manage AI characters with unique personalities', icon: '🤖', enabled: true, category: 'ai' },
  { id: 'contracts', name: 'Contracts', description: 'Define tasks and instructions for your agents', icon: '📜', enabled: true, category: 'ai' },
  { id: 'graph', name: 'Knowledge Graph', description: 'Visualize connections between your notes', icon: '🕸️', enabled: true, category: 'tools' },
  { id: 'markdown', name: 'Markdown Export', description: 'Export notes in various markdown formats', icon: '📝', enabled: false, category: 'tools' },
  { id: 'calendar', name: 'Calendar', description: 'Schedule and track events linked to notes', icon: '📅', enabled: false, category: 'integrations' },
  { id: 'api', name: 'API Access', description: 'Connect external services to your workspace', icon: '🔌', enabled: false, category: 'integrations' },
]

type Category = 'all' | 'ai' | 'tools' | 'integrations' | 'community'

export function PluginsView({ onOpenAgents }: PluginsViewProps) {
  const [plugins, setPlugins] = useState<Plugin[]>(PRESET_PLUGINS)
  const [category, setCategory] = useState<Category>('all')
  const [search, setSearch] = useState('')

  const filtered = plugins.filter(p => {
    if (category !== 'all' && p.category !== category) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const togglePlugin = (id: string) => {
    setPlugins(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p))
  }

  return (
    <div className="content-area">
      <div className="plugins-view">
        <div className="plugins-header">
          <h2 className="plugins-title">Plugins</h2>
          <p className="plugins-subtitle">Extend your workspace with additional features</p>
        </div>

        <div className="plugins-toolbar">
          <div className="plugins-search">
            {Icons.search()}
            <input
              type="text"
              className="plugins-search__input"
              placeholder="Search plugins..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="plugins-categories">
            {(['all', 'ai', 'tools', 'integrations'] as Category[]).map(cat => (
              <button
                key={cat}
                className={`plugins-category ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="plugins-grid">
          {filtered.map(plugin => (
            <div
              key={plugin.id}
              className={`plugin-card ${plugin.enabled ? 'plugin-card--enabled' : ''}`}
              onClick={() => {
                if (plugin.id === 'agents') onOpenAgents()
              }}
              style={{ cursor: plugin.id === 'agents' ? 'pointer' : 'default' }}
            >
              <div className="plugin-card__header">
                <div className="plugin-card__icon">{plugin.icon}</div>
                <div className="plugin-card__info">
                  <div className="plugin-card__name">{plugin.name}</div>
                  <div className="plugin-card__category">{plugin.category}</div>
                </div>
                <button
                  className={`plugin-card__toggle ${plugin.enabled ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); togglePlugin(plugin.id) }}
                >
                  <div className="plugin-card__toggle-knob" />
                </button>
              </div>
              <p className="plugin-card__desc">{plugin.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
