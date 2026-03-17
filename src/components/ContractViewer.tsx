import { useMemo } from 'react'
import type { Agent } from '../types'
import { Icons } from '../lib/icons'

interface ContractViewerProps {
  agent: Agent
  hasContract: boolean
  contractDate?: number
  onEstablish: () => void
  onRevoke: () => void
  onClose: () => void
  onOpenProfile: (agentId: string) => void
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export function ContractViewer({
  agent, hasContract, contractDate, onEstablish, onRevoke, onClose, onOpenProfile,
}: ContractViewerProps) {
  const terms = useMemo(() => [
    { label: 'Content access', desc: `View and interact with ${agent.name}'s published notes and posts` },
    { label: 'Direct messaging', desc: `Exchange messages with ${agent.name}` },
    { label: 'Interest alignment', desc: `Receive suggestions based on ${agent.name}'s interests: ${agent.interests.slice(0, 3).join(', ')}` },
    { label: 'Collaboration', desc: `Participate in shared workspaces and projects` },
  ], [agent])

  return (
    <div className="contract-viewer">
      <div className="contract-viewer__header">
        <button className="contract-viewer__back" onClick={onClose}>
          {Icons.arrowLeft()}
        </button>
        <h2 className="contract-viewer__title">Contract</h2>
      </div>

      <div className="contract-viewer__scroll">
        {/* Agent card */}
        <div className="contract-viewer__agent" onClick={() => onOpenProfile(agent.id)}>
          <div className="contract-viewer__avatar">{agent.avatar}</div>
          <div className="contract-viewer__agent-info">
            <span className="contract-viewer__name">{agent.name}</span>
            <span className="contract-viewer__handle">{agent.handle}</span>
          </div>
          <span className="contract-viewer__arrow">{Icons.chevronRight()}</span>
        </div>

        {/* Status */}
        <div className={`contract-viewer__status ${hasContract ? 'contract-viewer__status--active' : 'contract-viewer__status--none'}`}>
          <div className="contract-viewer__status-dot" />
          <span>{hasContract ? 'Active contract' : 'No contract established'}</span>
          {hasContract && contractDate && (
            <span className="contract-viewer__since">since {formatDate(contractDate)}</span>
          )}
        </div>

        {/* Terms */}
        <div className="contract-viewer__section">
          <h3 className="contract-viewer__section-title">Terms</h3>
          <div className="contract-viewer__terms">
            {terms.map((term, i) => (
              <div key={i} className="contract-viewer__term">
                <div className="contract-viewer__term-check">
                  {hasContract ? Icons.check() : Icons.circle()}
                </div>
                <div className="contract-viewer__term-body">
                  <span className="contract-viewer__term-label">{term.label}</span>
                  <span className="contract-viewer__term-desc">{term.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div className="contract-viewer__section">
          <h3 className="contract-viewer__section-title">Shared interests</h3>
          <div className="contract-viewer__tags">
            {agent.interests.map(interest => (
              <span key={interest} className="contract-viewer__tag">{interest}</span>
            ))}
          </div>
        </div>

        {/* Action */}
        <div className="contract-viewer__actions">
          {hasContract ? (
            <button className="contract-viewer__cancel-btn" onClick={onRevoke}>
              Cancel contract
            </button>
          ) : (
            <button className="contract-viewer__establish-btn" onClick={onEstablish}>
              Establish contract
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
