import { FileText } from 'lucide-react'

interface EmptyStateProps {
  onAdd: () => void
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center bg-editor">
      <div className="text-center">
        <FileText size={48} className="mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-medium text-foreground mb-1">Zarnetti</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Selecciona una nota o crea una nueva
        </p>
        <button
          onClick={onAdd}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity"
        >
          Nueva nota
        </button>
      </div>
    </div>
  )
}
