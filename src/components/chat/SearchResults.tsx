import { memo } from 'react'
import type { Note } from '../../types'

interface SearchResultsProps {
  query: string
  own: Note[]
  community: Note[]
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

export const SearchResults = memo(function SearchResults({ query, own, community, onOpenNote }: SearchResultsProps) {
  const total = own.length + community.length
  if (total === 0) return null

  return (
    <div className="zarnet-results">
      <p className="zarnet-results__count">
        {total} resultado{total !== 1 ? 's' : ''} — {(Math.random() * 0.4 + 0.08).toFixed(2)}s
      </p>

      <div className="zarnet-results__filters">
        {['Todo', 'Notas', 'Comunidad'].map((f, i) => (
          <button key={f} className={`zarnet-results__filter ${i === 0 ? 'active' : ''}`}>{f}</button>
        ))}
      </div>

      <article className="zarnet-results__summary">
        <p className="zarnet-results__summary-label">Resumen</p>
        <p className="zarnet-results__summary-text">
          {total} nota{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''} para "{query}".
          Incluye {own.length} propia{own.length !== 1 ? 's' : ''} y {community.length} de la comunidad.
        </p>
      </article>

      <div className="zarnet-results__list">
        {own.map((note, i) => (
          <article
            key={note.id}
            className={`zarnet-result ${i < total - 1 ? 'has-border' : ''}`}
            onClick={() => onOpenNote(note.id)}
          >
            <p className="zarnet-result__url">zarnet.app — notes / {note.id.slice(0, 8)}</p>
            <h3 className="zarnet-result__title">{note.title || 'Untitled'}</h3>
            <p className="zarnet-result__snippet">{note.content.slice(0, 180) || 'Empty note'}</p>
            <div className="zarnet-result__meta">
              <span>{formatRelativeDate(note.updatedAt)}</span>
              <span>{note.content.split(/\s+/).length} palabras</span>
            </div>
          </article>
        ))}
        {community.map((note, i) => (
          <article
            key={note.id}
            className={`zarnet-result ${i < community.length - 1 ? 'has-border' : ''}`}
            onClick={() => onOpenNote(note.id)}
          >
            <p className="zarnet-result__url">
              zarnet.app — community / {(note.author || 'unknown').toLowerCase().replace(/\s/g, '-')}
            </p>
            <h3 className="zarnet-result__title">{note.title || 'Untitled'}</h3>
            <p className="zarnet-result__snippet">{note.content.slice(0, 180) || 'Empty note'}</p>
            <div className="zarnet-result__meta">
              <span>published</span>
              <span>{note.content.split(/\s+/).length} palabras</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
})
