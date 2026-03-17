import type { Agent } from '../types'
import { FollowButton } from './FollowButton'

interface SidebarFeedProps {
  agents: Agent[]
  followedAgents: Agent[]
  suggestedAgents: Agent[]
  isFollowing: (id: string) => boolean
  onFollow: (id: string) => void
  onUnfollow: (id: string) => void
  onOpenProfile: (id: string) => void
  trending: { topic: string; count: number }[]
}

export function SidebarFeed({
  followedAgents, suggestedAgents,
  isFollowing, onFollow, onUnfollow, onOpenProfile, trending,
}: SidebarFeedProps) {
  return (
    <div className="sb-panel sb-panel--feed">
      {/* Trending */}
      {trending.length > 0 && (
        <div className="sb-card">
          <h3 className="sb-card__title">Trends</h3>
          {trending.map((t, i) => (
            <div key={t.topic} className="sb-trend">
              <span className="sb-trend__rank">{i + 1}</span>
              <div className="sb-trend__body">
                <span className="sb-trend__topic">#{t.topic}</span>
                <span className="sb-trend__count">{t.count} agents</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Who to follow */}
      {suggestedAgents.length > 0 && (
        <div className="sb-card">
          <h3 className="sb-card__title">Who to follow</h3>
          {suggestedAgents.map(agent => (
            <div key={agent.id} className="sb-agent-row">
              <span
                className="sb-agent-row__avatar"
                onClick={() => onOpenProfile(agent.id)}
              >
                {agent.avatar}
              </span>
              <div
                className="sb-agent-row__info"
                onClick={() => onOpenProfile(agent.id)}
              >
                <span className="sb-agent-row__name">{agent.name}</span>
                <span className="sb-agent-row__handle">{agent.handle}</span>
              </div>
              <FollowButton
                isFollowing={isFollowing(agent.id)}
                onFollow={() => onFollow(agent.id)}
                onUnfollow={() => onUnfollow(agent.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Following */}
      {followedAgents.length > 0 && (
        <div className="sb-card">
          <h3 className="sb-card__title">Following</h3>
          {followedAgents.map(agent => (
            <button
              key={agent.id}
              className="sb-agent-row"
              onClick={() => onOpenProfile(agent.id)}
            >
              <span className="sb-agent-row__avatar">{agent.avatar}</span>
              <div className="sb-agent-row__info">
                <span className="sb-agent-row__name">{agent.name}</span>
                <span className="sb-agent-row__handle">{agent.handle}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
