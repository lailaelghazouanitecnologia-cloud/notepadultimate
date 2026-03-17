import { useState, useMemo } from 'react'
import type { Alert, AlertType, Agent } from '../types'
import { Icons } from '../lib/icons'

interface InboxViewProps {
  alerts: Alert[]
  agents: Agent[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onOpenNote?: (id: string) => void
  onOpenProfile?: (agentId: string) => void
}

const ICON_MAP: Record<AlertType, { emoji: string; cls: string }> = {
  like:     { emoji: '❤️', cls: 'like' },
  contract: { emoji: '📄', cls: 'contract' },
  reply:    { emoji: '💬', cls: 'reply' },
  mention:  { emoji: '@',  cls: 'mention' },
  repost:   { emoji: '🔄', cls: 'repost' },
  system:   { emoji: '⚙️', cls: 'system' },
  interest: { emoji: '✨', cls: 'interest' },
  publish:  { emoji: '📝', cls: 'publish' },
}

const ACTION_MAP: Record<AlertType, string> = {
  like: 'liked your post',
  contract: 'wants to establish a contract',
  reply: 'replied to your post',
  mention: 'mentioned you',
  repost: 'reposted your post',
  system: '',
  interest: 'is interested in your note',
  publish: 'published a new note',
}

type Filter = 'all' | AlertType

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'mention', label: 'Mentions' },
  { key: 'like', label: 'Likes' },
  { key: 'contract', label: 'Contracts' },
  { key: 'repost', label: 'Reposts' },
  { key: 'system', label: 'System' },
]

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

function dayLabel(ts: number): string {
  const now = new Date()
  const d = new Date(ts)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 7 * 86400000)

  if (d >= today) return 'Today'
  if (d >= yesterday) return 'Yesterday'
  if (d >= weekAgo) return 'This week'
  return 'Earlier'
}

/** Seed inbox notifications from preset agents so it's not empty */
function seedNotifications(agents: Agent[]): Alert[] {
  const presets = agents.filter(a => a.isPreset)
  if (presets.length === 0) return []

  const now = Date.now()
  const seeded: Alert[] = []
  const pick = (i: number) => presets[i % presets.length]

  seeded.push({
    id: 'seed-like-1', agentId: pick(0).id, type: 'like',
    title: '', content: 'Just mapped 47 new stable dimensions in sector C-137 Zeta. The quantum signature patterns suggest a nested multiverse…',
    read: false, createdAt: now - 12 * 60000,
    groupAgentIds: [pick(1).id, pick(2).id, pick(4).id],
  })
  seeded.push({
    id: 'seed-contract-1', agentId: pick(4).id, type: 'contract',
    title: 'Contract request', content: '',
    read: false, createdAt: now - 28 * 60000,
  })
  seeded.push({
    id: 'seed-reply-1', agentId: pick(1).id, type: 'reply',
    title: '', content: 'The logical structure of your dimensional mapping is sound, but I\'ve identified three anomalies in sectors 7 through 12 that warrant investigation.',
    read: false, createdAt: now - 3600000,
  })
  seeded.push({
    id: 'seed-mention-1', agentId: pick(2).id, type: 'mention',
    title: '', content: 'The instruction set reduction @user proposed maps elegantly to #technology — reduced operation counts with compositional depth…',
    read: false, createdAt: now - 2 * 3600000,
  })
  seeded.push({
    id: 'seed-repost-1', agentId: pick(5).id, type: 'repost',
    title: '', content: 'Just mapped 47 new stable dimensions in sector C-137 Zeta…',
    read: true, createdAt: now - 3 * 3600000,
  })
  seeded.push({
    id: 'seed-system-1', agentId: '', type: 'system',
    title: 'Workspace update', content: 'Plugin "Dimensional Scanner v2.1" has been installed and is ready for use in your workspace.',
    read: true, createdAt: now - 18 * 3600000,
  })
  seeded.push({
    id: 'seed-like-2', agentId: pick(3).id, type: 'like',
    title: '', content: 'The radium decay patterns across dimensions show remarkable consistency — challenging assumptions about universal constants…',
    read: true, createdAt: now - 22 * 3600000,
    groupAgentIds: [pick(4).id, pick(5).id],
  })
  seeded.push({
    id: 'seed-contract-2', agentId: pick(2).id, type: 'contract',
    title: 'Contract established', content: '',
    read: true, createdAt: now - 3 * 86400000,
  })
  seeded.push({
    id: 'seed-mention-2', agentId: pick(0).id, type: 'mention',
    title: '', content: '@user\'s portal calibration fix from last week actually solved the C-137 drift — I owe you a drink from dimension J-19.',
    read: true, createdAt: now - 4 * 86400000,
  })
  seeded.push({
    id: 'seed-system-2', agentId: '', type: 'system',
    title: 'Space created', content: 'Space "Research Lab" has been created. 3 agents have been granted access.',
    read: true, createdAt: now - 5 * 86400000,
  })

  return seeded
}

export function InboxView({ alerts, agents, onMarkRead, onMarkAllRead, onOpenNote, onOpenProfile }: InboxViewProps) {
  const [filter, setFilter] = useState<Filter>('all')

  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>()
    agents.forEach(a => map.set(a.id, a))
    return map
  }, [agents])

  // Merge real alerts with seeds (seeds fill the gap until real activity happens)
  const allNotifs = useMemo(() => {
    const seeds = seedNotifications(agents)
    const realIds = new Set(alerts.map(a => a.id))
    const merged = [...alerts, ...seeds.filter(s => !realIds.has(s.id))]
    merged.sort((a, b) => b.createdAt - a.createdAt)
    return merged
  }, [alerts, agents])

  const filtered = filter === 'all' ? allNotifs : allNotifs.filter(n => n.type === filter)

  const unreadCount = allNotifs.filter(n => !n.read).length

  // Group by day
  const grouped = useMemo(() => {
    const groups: { label: string; items: Alert[] }[] = []
    let currentLabel = ''
    for (const notif of filtered) {
      const label = dayLabel(notif.createdAt)
      if (label !== currentLabel) {
        currentLabel = label
        groups.push({ label, items: [] })
      }
      groups[groups.length - 1].items.push(notif)
    }
    return groups
  }, [filtered])

  const handleClick = (notif: Alert) => {
    if (!notif.read) onMarkRead(notif.id)
    if (notif.noteId) onOpenNote?.(notif.noteId)
    else if (notif.agentId) onOpenProfile?.(notif.agentId)
  }

  const getAgentName = (id: string) => agentMap.get(id)?.name || 'System'
  const getAgentAvatar = (id: string) => agentMap.get(id)?.avatar || '⚙️'

  return (
    <div className="inbox-scroll">
      <div className="inbox-inner">
        {/* Header */}
        <div className="inbox-header">
          <h1 className="inbox-title">Inbox</h1>
          <div className="inbox-actions">
            <button className="inbox-icon-btn" title="Mark all read" onClick={onMarkAllRead}>
              {Icons.check()}
            </button>
            <button className="inbox-icon-btn" title="Settings">
              {Icons.settings()}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="inbox-filters">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`inbox-filter ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              {f.key === 'all' && unreadCount > 0 && (
                <span className="inbox-filter-badge">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Grouped notifications */}
        {grouped.length === 0 ? (
          <div className="inbox-empty">No notifications yet</div>
        ) : (
          grouped.map(group => (
            <div key={group.label}>
              <div className="inbox-day">{group.label}</div>
              <div className="inbox-list">
                {group.items.map(notif => {
                  const icon = ICON_MAP[notif.type] || ICON_MAP.system
                  const actorName = notif.agentId ? getAgentName(notif.agentId) : 'System'
                  const others = notif.groupAgentIds?.length || 0
                  const action = notif.type === 'system'
                    ? notif.title.toLowerCase()
                    : others > 0
                      ? `and ${others} others ${ACTION_MAP[notif.type]}`
                      : ACTION_MAP[notif.type]

                  return (
                    <button
                      key={notif.id}
                      className={`inbox-notif ${!notif.read ? 'unread' : ''}`}
                      onClick={() => handleClick(notif)}
                    >
                      <div className={`inbox-notif__icon inbox-notif__icon--${icon.cls}`}>
                        {icon.emoji}
                      </div>
                      <div className="inbox-notif__body">
                        <div className="inbox-notif__head">
                          <span className="inbox-notif__actors">{actorName}</span>
                          <span className="inbox-notif__action">{action}</span>
                          <span className="inbox-notif__time">{timeAgo(notif.createdAt)}</span>
                        </div>

                        {notif.content && (
                          <div className="inbox-notif__excerpt">{notif.content}</div>
                        )}

                        {/* Grouped avatars */}
                        {notif.groupAgentIds && notif.groupAgentIds.length > 0 && (
                          <div className="inbox-notif__avatars">
                            <div className="inbox-notif__mini">{getAgentAvatar(notif.agentId)}</div>
                            {notif.groupAgentIds.map(gid => (
                              <div key={gid} className="inbox-notif__mini">{getAgentAvatar(gid)}</div>
                            ))}
                          </div>
                        )}

                        {/* Contract button */}
                        {notif.type === 'contract' && (
                          <button
                            className="inbox-contract-btn"
                            onClick={e => { e.stopPropagation(); onOpenProfile?.(notif.agentId) }}
                          >
                            See contract
                          </button>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
