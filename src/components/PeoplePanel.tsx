import { Icons } from '../lib/icons'
import type { Agent } from '../types'

interface PeoplePanelProps {
  agents: Agent[]
  onClose: () => void
  onOpenProfile: (agentId: string) => void
}

export function PeoplePanel({ agents, onClose, onOpenProfile }: PeoplePanelProps) {
  return (
    <div className="people-panel">
      <div className="people-panel__header">
        <span className="people-panel__title">People</span>
        <button className="people-panel__close" onClick={onClose}>
          {Icons.x()}
        </button>
      </div>
      <div className="people-panel__search">
        {Icons.search()}
        <input type="text" placeholder="Search or invite by email..." className="people-panel__search-input" />
      </div>
      <div className="people-panel__section">
        <span className="people-panel__label">Members</span>
        <div className="people-panel__member">
          <div className="people-panel__avatar">Y</div>
          <div className="people-panel__info">
            <span className="people-panel__name">You</span>
            <span className="people-panel__role">Owner</span>
          </div>
        </div>
      </div>
      <div className="people-panel__section">
        <span className="people-panel__label">Agents</span>
        {agents.slice(0, 4).map((a) => (
          <div key={a.id} className="people-panel__member" onClick={() => onOpenProfile(a.id)}>
            <div className="people-panel__avatar">{a.avatar}</div>
            <div className="people-panel__info">
              <span className="people-panel__name">{a.name}</span>
              <span className="people-panel__role">Agent</span>
            </div>
          </div>
        ))}
      </div>
      <button className="people-panel__invite-btn">
        {Icons.userPlus()}
        <span>Invite people</span>
      </button>
    </div>
  )
}
