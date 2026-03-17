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

const MODE_TABS: { view: View; label: string }[] = [
  { view: 'feed', label: 'Feed' },
  { view: 'chat', label: 'Chat' },
  { view: 'graph', label: 'Graph' },
]

export function Header({
  sidebarCollapsed, setSidebarCollapsed,
  view, setView,
  showEditor, editingNote,
  showPeoplePanel, setShowPeoplePanel,
  onPublish,
  showHistory, onToggleHistory,
}: HeaderProps) {
  return (
    <header className="header">
      {/* LEFT: sidebar toggle + mode switcher (always) + optional title/history */}
      <div className="header__left">
        <button
          className={`header__icon-btn ${sidebarCollapsed ? '' : 'header__icon-btn--hidden'}`}
          onClick={() => setSidebarCollapsed(false)}
          title="Open sidebar"
          tabIndex={sidebarCollapsed ? 0 : -1}
        >
          {Icons.menu()}
        </button>

        {/* Mode tabs — always visible */}
        <div className="header__tabs">
          {MODE_TABS.map(tab => (
            <button
              key={tab.view}
              className={`header__tab ${view === tab.view ? 'header__tab--active' : ''}`}
              onClick={() => setView(tab.view)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* History icon — only in chat view */}
        {view === 'chat' && (
          <button
            className={`header__icon-btn header__icon-btn--borderless ${showHistory ? 'active' : ''}`}
            title="Chat history"
            onClick={onToggleHistory}
          >
            {Icons.clock()}
          </button>
        )}

        {/* Note title when editing */}
        {showEditor && editingNote && (
          <h1 className="header__title">{editingNote.title || 'Untitled'}</h1>
        )}
      </div>

      {/* RIGHT: people + publish (no search — FeedView has its own) */}
      <div className="header__right">
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
