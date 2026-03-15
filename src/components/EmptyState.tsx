import { FileText } from 'lucide-react'

interface EmptyStateProps {
  onAdd: () => void
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--editor-bg)' }}>
      <div className="text-center">
        <FileText size={48} className="mx-auto mb-4" style={{ color: 'var(--muted-fg)', opacity: 0.3 }} />
        <h2 className="text-lg font-medium mb-1" style={{ color: 'var(--fg)' }}>Zarnetti</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--muted-fg)' }}>
          Selecciona una nota o crea una nueva
        </p>
        <button
          onClick={onAdd}
          className="h-8 px-4 text-[13px] font-medium rounded-md transition-colors"
          style={{
            background: 'var(--fg)',
            color: 'var(--bg)',
          }}
        >
          Nueva nota
        </button>
      </div>
    </div>
  )
}
