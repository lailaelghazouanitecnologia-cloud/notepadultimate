import { Icons } from '../lib/icons'
import type { View } from '../contexts/UIContext'
import type { Note } from '../types'

interface HeaderProps {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  view: View
  setView: (v: View) => void
  showEditor: boolean
  editingNote: Note | null | undefined
  showPeoplePanel: boolean
  setShowPeoplePanel: (v: boolean) => void
  onPublish: () => void
  showHistory?: boolean
  onToggleHistory?: () => void
}

const MODE_TABS: { view: View; icon: (p?: object) => React.ReactNode; label: string }[] = [
  { view: 'feed', icon: Icons.rss, label: 'Feed' },
  { view: 'chat', icon: Icons.messageCircle, label: 'Chat' },
  { view: 'graph', icon: Icons.network, label: 'Graph' },
]

export function Header({
  sidebarCollapsed, setSidebarCollapsed,
  view, setView,
  showEditor, editingNote,
  showPeoplePanel, setShowPeoplePanel,
  onPublish,
  showHistory, onToggleHistory,
}: HeaderProps) {
  const noBorder = !showEditor && (view === 'chat' || view === 'graph')

  return (
    <header className={`header ${noBorder ? 'header--no-border' : ''}`}>
      {/* LEFT: sidebar toggle + mode switcher (always) + optional title */}
      <div className="header__left">
        <button
          className={`zw-sb-toggle ${sidebarCollapsed ? '' : 'hidden'}`}
          onClick={() => setSidebarCollapsed(false)}
          title="Open sidebar"
        >
          {Icons.menu()}
        </button>

        {/* Mode switcher pill — always visible */}
        <div className="zw-mode-switcher">
          {MODE_TABS.map(tab => (
            <button
              key={tab.view}
              className={`zw-mode-tab ${view === tab.view && !showEditor ? 'active' : ''}`}
              onClick={() => setView(tab.view)}
            >
              {tab.icon()}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Note title when editing */}
        {showEditor && editingNote && (
          <h1 className="header__title">{editingNote.title || 'Untitled'}</h1>
        )}
      </div>

      {/* RIGHT: history + people + publish */}
      <div className="header__right">
        {/* History icon — only in chat view */}
        <button
          className={`header__icon-btn ${showHistory ? 'active' : ''} ${view !== 'chat' ? 'header__icon-btn--hidden' : ''}`}
          onClick={onToggleHistory}
          title="Chat history"
          tabIndex={view === 'chat' ? 0 : -1}
        >
          {Icons.clock()}
        </button>

        <button
          className={`header__icon-btn header__icon-btn--borderless ${showPeoplePanel ? 'active' : ''}`}
          title="Add people"
          onClick={() => setShowPeoplePanel(!showPeoplePanel)}
        >
          {Icons.userPlus()}
        </button>

        {/* Publish — only when editing a note */}
        {showEditor && editingNote && (
          <button
            className={`header__publish-btn ${editingNote.published ? 'published' : ''}`}
            onClick={onPublish}
            title={editingNote.published ? 'Published' : 'Publish note'}
          >
            {editingNote.published ? Icons.check() : Icons.upload()}
            <span>{editingNote.published ? 'Published' : 'Publish'}</span>
          </button>
        )}
      </div>
    </header>
  )
}
