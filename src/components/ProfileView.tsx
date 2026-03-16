import { useMemo } from 'react'
import type { Agent, Note } from '../types'
import { Icons } from '../lib/icons'

interface ProfileViewProps {
  agent: Agent
  publishedNotes: Note[]
  allAgents: Agent[]
  onBack: () => void
  onOpenProfile: (agentId: string) => void
  onOpenNote: (noteId: string) => void
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en', { month: 'short', year: 'numeric' })
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

export function ProfileView({
  agent, publishedNotes, allAgents, onBack, onOpenProfile, onOpenNote,
}: ProfileViewProps) {
  // Notes by this agent or matching their interests
  const agentNotes = useMemo(() => {
    return publishedNotes
      .filter((n) => n.authorId === agent.id)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }, [publishedNotes, agent.id])

  const interestNotes = useMemo(() => {
    return publishedNotes
      .filter((n) => {
        if (n.authorId === agent.id) return false
        return agent.interests.some((interest) =>
          n.title.toLowerCase().includes(interest.toLowerCase()) ||
          n.content.toLowerCase().includes(interest.toLowerCase())
        )
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 10)
  }, [publishedNotes, agent])

  // Suggested follows: agents with overlapping interests
  const suggested = useMemo(() => {
    return allAgents
      .filter((a) => a.id !== agent.id)
      .map((a) => {
        const overlap = a.interests.filter((i) =>
          agent.interests.some((ai) => ai.toLowerCase() === i.toLowerCase())
        )
        return { agent: a, overlap: overlap.length }
      })
      .filter((a) => a.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 4)
  }, [allAgents, agent])

  return (
    <div className="content-area">
      <div className="profile-view">
        {/* Header */}
        <div className="profile-header">
          <button className="profile-header__back" onClick={onBack}>
            {Icons.arrowLeft()}
          </button>
          <span className="profile-header__name">{agent.name}</span>
        </div>

        <div className="profile-scroll">
          {/* Banner + avatar */}
          <div className="profile-banner">
            <div className="profile-banner__gradient" />
          </div>
          <div className="profile-info">
            <div className="profile-avatar">{agent.avatar}</div>
            <div className="profile-info__main">
              <h2 className="profile-info__name">{agent.name}</h2>
              <span className="profile-info__handle">{agent.handle}</span>
            </div>
            <p className="profile-info__bio">{agent.bio}</p>
            {agent.personality && (
              <p className="profile-info__personality">
                <em>"{agent.personality}"</em>
              </p>
            )}
            <div className="profile-info__stats">
              <span><strong>{agent.followers.toLocaleString()}</strong> Followers</span>
              <span><strong>{agent.following}</strong> Following</span>
              <span>Joined {formatDate(agent.createdAt)}</span>
            </div>
            <div className="profile-info__interests">
              {agent.interests.map((interest) => (
                <span key={interest} className="profile-info__tag">{interest}</span>
              ))}
            </div>
          </div>

          {/* Tabs: Posts / Interests / Connections */}
          <div className="profile-tabs">
            <div className="profile-tabs__inner">
              <span className="profile-tabs__tab active">Posts ({agentNotes.length})</span>
              <span className="profile-tabs__tab">Interests ({interestNotes.length})</span>
            </div>
          </div>

          {/* Posts */}
          <div className="profile-posts">
            {agentNotes.length === 0 && interestNotes.length === 0 && (
              <div className="profile-posts__empty">
                <p>No posts yet</p>
                <p className="profile-posts__empty-sub">
                  Published notes from this character will appear here.
                </p>
              </div>
            )}

            {agentNotes.map((note) => (
              <div
                key={note.id}
                className="profile-post"
                onClick={() => onOpenNote(note.id)}
              >
                <div className="profile-post__avatar">{agent.avatar}</div>
                <div className="profile-post__body">
                  <div className="profile-post__header">
                    <span className="profile-post__name">{agent.name}</span>
                    <span className="profile-post__handle">{agent.handle}</span>
                    <span className="profile-post__time">{formatRelative(note.updatedAt)}</span>
                  </div>
                  <h4 className="profile-post__title">{note.title}</h4>
                  <p className="profile-post__content">{note.content.slice(0, 200)}</p>
                  <div className="profile-post__actions">
                    <button className="profile-post__action">{Icons.messageCircle()} <span>0</span></button>
                    <button className="profile-post__action">{Icons.heart()} <span>0</span></button>
                    <button className="profile-post__action">{Icons.link()}</button>
                  </div>
                </div>
              </div>
            ))}

            {/* Interest matches as timeline */}
            {interestNotes.length > 0 && (
              <>
                <div className="profile-section-divider">
                  <span>Matched by interests</span>
                </div>
                {interestNotes.map((note) => (
                  <div
                    key={note.id}
                    className="profile-post"
                    onClick={() => onOpenNote(note.id)}
                  >
                    <div className="profile-post__avatar" style={{ fontSize: 14 }}>📄</div>
                    <div className="profile-post__body">
                      <div className="profile-post__header">
                        <span className="profile-post__name">{note.author || 'Unknown'}</span>
                        <span className="profile-post__time">{formatRelative(note.updatedAt)}</span>
                      </div>
                      <h4 className="profile-post__title">{note.title}</h4>
                      <p className="profile-post__content">{note.content.slice(0, 200)}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Suggested follows */}
          {suggested.length > 0 && (
            <div className="profile-suggested">
              <h4 className="profile-suggested__title">Similar Characters</h4>
              <div className="profile-suggested__list">
                {suggested.map(({ agent: a }) => (
                  <button
                    key={a.id}
                    className="profile-suggested__item"
                    onClick={() => onOpenProfile(a.id)}
                  >
                    <div className="profile-suggested__avatar">{a.avatar}</div>
                    <div className="profile-suggested__info">
                      <div className="profile-suggested__name">{a.name}</div>
                      <div className="profile-suggested__handle">{a.handle}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
