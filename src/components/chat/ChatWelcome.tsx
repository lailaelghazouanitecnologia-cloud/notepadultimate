import { memo } from 'react'
import { ZarnettiLogo } from '../../lib/icons'
import type { Note } from '../../types'

interface ChatWelcomeProps {
  greeting: string
  recentNotes: Note[]
  onOpenNote: (id: string) => void
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

export const ChatWelcome = memo(function ChatWelcome({ greeting, recentNotes, onOpenNote }: ChatWelcomeProps) {
  return (
    <>
      <div className="home-research__hero-info">
        <div className="home-research__logo-box">
          <ZarnettiLogo className="home-research__logo-svg" />
        </div>
        <h2 className="home-research__title">{greeting}</h2>
        <p className="home-research__subtitle">
          Search Zarnet — your notes, the community, and the web. Use commands or just type.
        </p>
      </div>

      {recentNotes.length > 0 && (
        <>
          <div className="home-research__divider">
            <div className="home-research__divider-line" />
            <span className="home-research__divider-text">Recent notes</span>
            <div className="home-research__divider-line" />
          </div>
          <div className="home-research__results">
            {recentNotes.map((note, i) => (
              <article
                key={note.id}
                className={`home-research__result ${i < recentNotes.length - 1 ? 'has-border' : ''}`}
                onClick={() => onOpenNote(note.id)}
              >
                <p className="home-research__result-meta">note</p>
                <h3 className="home-research__result-title">{note.title || 'Untitled'}</h3>
                <p className="home-research__result-snippet">{note.content.slice(0, 120) || 'Empty note'}</p>
                <div className="home-research__result-footer">
                  <span>{formatRelativeDate(note.updatedAt)}</span>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </>
  )
})
