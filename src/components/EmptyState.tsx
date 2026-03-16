import { Icons } from '../lib/icons'

interface EmptyStateProps {
  onAdd: () => void
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="content-area">
      <div className="home">
        <div style={{ textAlign: 'center' }}>
          <div className="home__brand"><strong>Zarnetti</strong></div>
          <div className="home__sub" style={{ marginBottom: 20 }}>Select a note or create a new one</div>
          <button
            onClick={onAdd}
            className="zn-button zn-button-default"
            style={{ display: 'inline-flex' }}
          >
            {Icons.plus({ style: { width: 14, height: 14, marginRight: 6 } })}
            New note
          </button>
        </div>
      </div>
    </div>
  )
}
