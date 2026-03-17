import { useMemo } from 'react'
import type { Agent } from '../types'
import { Icons, Identicon } from '../lib/icons'
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
  agents, followedAgents, suggestedAgents,
  isFollowing, onFollow, onUnfollow, onOpenProfile, trending,
}: SidebarFeedProps) {
  return (
    <div className="sb-panel sb-panel--feed">
      {/* Your profile mini */}
      <div className="sb-profile-mini">
        <div className="sb-profile-mini__avatar">
          <Identicon className="sb-profile-mini__avatar-img" />
        </div>
        <div className="sb-profile-mini__info">
          <span className="sb-profile-mini__name">You</span>
          <span className="sb-profile-mini__handle">@user</span>
        </div>
        <div className="sb-profile-mini__stats">
          <span><strong>{followedAgents.length}</strong> following</span>
        </div>
      </div>

      {/* Following */}
      {followedAgents.length > 0 && (
        <div className="sb-section">
          <div className="sb-section__header">
            <span className="sb-section__title">Following</span>
          </div>
          <div className="sb-section__list">
            {followedAgents.map(agent => (
              <button
                key={agent.id}
                className="sb-user-row"
                onClick={() => onOpenProfile(agent.id)}
              >
                <span className="sb-user-row__avatar">{agent.avatar}</span>
                <div className="sb-user-row__info">
                  <span className="sb-user-row__name">{agent.name}</span>
                  <span className="sb-user-row__handle">{agent.handle}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <div className="sb-section">
          <div className="sb-section__header">
            <span className="sb-section__title">Trending</span>
          </div>
          <div className="sb-section__list">
            {trending.map((t, i) => (
              <div key={t.topic} className="sb-trending-item">
                <span className="sb-trending-item__rank">{i + 1}</span>
                <div className="sb-trending-item__info">
                  <span className="sb-trending-item__topic">#{t.topic}</span>
                  <span className="sb-trending-item__count">{t.count} interested</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestedAgents.length > 0 && (
        <div className="sb-section">
          <div className="sb-section__header">
            <span className="sb-section__title">Who to follow</span>
          </div>
          <div className="sb-section__list">
            {suggestedAgents.map(agent => (
              <div key={agent.id} className="sb-user-row sb-user-row--suggestion">
                <span
                  className="sb-user-row__avatar"
                  onClick={() => onOpenProfile(agent.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {agent.avatar}
                </span>
                <div
                  className="sb-user-row__info"
                  onClick={() => onOpenProfile(agent.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="sb-user-row__name">{agent.name}</span>
                  <span className="sb-user-row__handle">{agent.handle}</span>
                </div>
                <FollowButton
                  isFollowing={isFollowing(agent.id)}
                  onFollow={() => onFollow(agent.id)}
                  onUnfollow={() => onUnfollow(agent.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
