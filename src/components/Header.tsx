import { Icons } from '../lib/icons'
import type { View } from '../contexts/UIContext'
import type { Note } from '../types'

interface HeaderProps {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  view: View
  showEditor: boolean
  editingNote: Note | null | undefined
  showPeoplePanel: boolean
  setShowPeoplePanel: (v: boolean) => void
  onPublish: () => void
}

const PAGE_TITLES: Record<View, string> = {
  feed: 'Home',
  chat: 'Messages',
  graph: 'Graph',
  agents: 'Agents',
  plugins: 'Plugins',
}

// Pages that show search in the right zone
const SEARCH_VIEWS: View[] = ['feed', 'agents', 'plugins']
// Pages without border-bottom
const NO_BORDER_VIEWS: View[] = ['chat', 'graph']

export function Header({
  sidebarCollapsed, setSidebarCollapsed,
  view,
  showEditor, editingNote,
  showPeoplePanel, setShowPeoplePanel,
  onPublish,
}: HeaderProps) {
  const showSearch = !showEditor && SEARCH_VIEWS.includes(view)
  const hasBorder = showEditor || !NO_BORDER_VIEWS.includes(view)
  const title = showEditor
    ? (editingNote?.title || 'Untitled')
    : PAGE_TITLES[view] || ''

  return (
    <header className={`header ${!hasBorder ? 'header--no-border' : ''}`}>
      {/* LEFT: sidebar toggle + page title */}
      <div className="header__left">
        <button
          className={`header__icon-btn ${sidebarCollapsed ? '' : 'header__icon-btn--hidden'}`}
          onClick={() => setSidebarCollapsed(false)}
          title="Open sidebar"
          tabIndex={sidebarCollapsed ? 0 : -1}
        >
          {Icons.menu()}
        </button>
        <h1 className="header__title">{title}</h1>
      </div>

      {/* RIGHT: search (conditional) + people + publish */}
      <div className="header__right">
        {showSearch && (
          <div className="header__search">
            {Icons.search()}
            <input type="text" className="header__search-input" placeholder="Search Zarnet..." />
          </div>
        )}

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
