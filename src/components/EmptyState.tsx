import { FileText } from 'lucide-react'

interface EmptyStateProps {
  onAdd: () => void
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--editor-bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <FileText size={48} style={{ margin: '0 auto 16px', color: 'var(--muted-fg)', opacity: 0.3 }} />
        <h2 style={{ fontSize: 18, fontWeight: 500, color: 'var(--fg)', marginBottom: 4 }}>Zarnetti</h2>
        <p style={{ fontSize: 14, color: 'var(--muted-fg)', marginBottom: 20 }}>
          Selecciona una nota o crea una nueva
        </p>
        <button
          onClick={onAdd}
          style={{
            height: 34,
            padding: '0 16px',
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 8,
            border: 'none',
            background: 'var(--fg)',
            color: 'var(--bg)',
            cursor: 'pointer',
          }}
        >
          Nueva nota
        </button>
      </div>
    </div>
  )
}
