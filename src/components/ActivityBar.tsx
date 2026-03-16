import { Icons } from '../lib/icons'

export type View = 'home' | 'files' | 'graph'

interface ActivityBarProps {
  activeView: View
  onViewChange: (view: View) => void
}

export function ActivityBar({ activeView, onViewChange }: ActivityBarProps) {
  const items: { id: View; icon: (p?: object) => React.ReactNode; label: string }[] = [
    { id: 'home', icon: Icons.sparkles, label: 'Chat' },
    { id: 'files', icon: Icons.files, label: 'Files' },
    { id: 'graph', icon: Icons.graph, label: 'Graph' },
  ]

  return (
    <aside className="activity-bar">
      <div className="activity-bar__group">
        {items.map((item) => (
          <button
            key={item.id}
            className={`activity-btn ${activeView === item.id ? 'active' : ''}`}
            onClick={() => onViewChange(item.id)}
            aria-label={item.label}
          >
            {item.icon()}
          </button>
        ))}
      </div>
      <div className="activity-bar__spacer" />
      <div className="activity-bar__group">
        <button className="activity-btn" aria-label="Settings">
          {Icons.settings()}
        </button>
      </div>
    </aside>
  )
}
