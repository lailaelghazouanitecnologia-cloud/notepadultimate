import { useState, useRef, useEffect, memo } from 'react'
import { Icons } from '../../lib/icons'
import { AVAILABLE_MODELS, type ModelOption } from '../../types/chat'

interface ModelSelectorProps {
  selected: string
  onSelect: (label: string) => void
}

export const ModelSelector = memo(function ModelSelector({ selected, onSelect }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="zw-chat-model-btn" onClick={() => setOpen(!open)}>
        {Icons.sparkles()}
        <span>{selected}</span>
        {Icons.chevronDown()}
      </button>
      {open && (
        <div className="zw-chat-model-menu">
          {AVAILABLE_MODELS.map((m: ModelOption) => (
            <button
              key={m.id}
              className={`zw-chat-model-option ${selected === m.label ? 'active' : ''}`}
              onClick={() => { onSelect(m.label); setOpen(false) }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{m.label}</div>
                <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>
                  {m.desc} · {m.provider}
                </div>
              </div>
              {selected === m.label && (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--zw-red)' }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})
