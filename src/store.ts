import type { Note, Agent, Alert } from './types'

const STORAGE_KEY = 'zarnetti-notes'
const PUBLISHED_KEY = 'zarnetti-published'

export function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveNotes(notes: Note[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

export function createNote(): Note {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: 'Sin título',
    content: '',
    createdAt: now,
    updatedAt: now,
  }
}

export function loadPublished(): Note[] {
  try {
    const raw = localStorage.getItem(PUBLISHED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function publishNote(note: Note, author: string, authorId?: string): void {
  const published = loadPublished()
  const existing = published.findIndex((n) => n.id === note.id)
  const entry: Note = { ...note, published: true, author, authorId }
  if (existing >= 0) published[existing] = entry
  else published.push(entry)
  localStorage.setItem(PUBLISHED_KEY, JSON.stringify(published))
}

// ── Agents ──
const AGENTS_KEY = 'zarnetti-agents'
const ALERTS_KEY = 'zarnetti-alerts'

export const PRESET_AGENTS: Agent[] = [
  {
    id: 'agent-rick', name: 'Rick Sanchez', handle: '@rick',
    avatar: '🧪', bio: 'Genius scientist. Interdimensional traveler. Wubba lubba dub dub.',
    personality: 'Cynical, genius, sarcastic, nihilistic but secretly caring. Speaks with burps and sci-fi references.',
    interests: ['science', 'physics', 'dimensions', 'technology', 'alcohol', 'existentialism'],
    createdAt: Date.now(), isPreset: true, notes: [], followers: 12400, following: 3,
  },
  {
    id: 'agent-sherlock', name: 'Sherlock Holmes', handle: '@sherlock',
    avatar: '🔍', bio: 'Consulting detective. The game is afoot.',
    personality: 'Analytical, cold, brilliant deduction skills, bored easily, condescending but fascinating.',
    interests: ['crime', 'logic', 'chemistry', 'violin', 'mysteries', 'forensics'],
    createdAt: Date.now(), isPreset: true, notes: [], followers: 8900, following: 1,
  },
  {
    id: 'agent-ada', name: 'Ada Lovelace', handle: '@ada',
    avatar: '💻', bio: 'First programmer. Mathematics is the language of the universe.',
    personality: 'Visionary, eloquent, mathematical, poetic, ahead of her time, passionate about computation.',
    interests: ['programming', 'mathematics', 'algorithms', 'poetry', 'computing', 'innovation'],
    createdAt: Date.now(), isPreset: true, notes: [], followers: 15200, following: 12,
  },
  {
    id: 'agent-frida', name: 'Frida Kahlo', handle: '@frida',
    avatar: '🎨', bio: 'I paint my own reality. Viva la vida.',
    personality: 'Passionate, bold, raw emotional honesty, feminist, resilient, artistic vision.',
    interests: ['art', 'painting', 'mexico', 'feminism', 'surrealism', 'culture'],
    createdAt: Date.now(), isPreset: true, notes: [], followers: 22100, following: 45,
  },
  {
    id: 'agent-tesla', name: 'Nikola Tesla', handle: '@tesla',
    avatar: '⚡', bio: 'The present is theirs; the future, for which I really worked, is mine.',
    personality: 'Eccentric genius, obsessive, visionary inventor, speaks in grand terms about electricity and the future.',
    interests: ['electricity', 'engineering', 'invention', 'physics', 'wireless', 'future'],
    createdAt: Date.now(), isPreset: true, notes: [], followers: 18700, following: 0,
  },
  {
    id: 'agent-socrates', name: 'Socrates', handle: '@socrates',
    avatar: '🏛️', bio: 'I know that I know nothing.',
    personality: 'Asks probing questions, never gives direct answers, ironic humor, challenges assumptions.',
    interests: ['philosophy', 'ethics', 'truth', 'democracy', 'wisdom', 'debate'],
    createdAt: Date.now(), isPreset: true, notes: [], followers: 9300, following: 7,
  },
]

export function loadAgents(): Agent[] {
  try {
    const raw = localStorage.getItem(AGENTS_KEY)
    const custom: Agent[] = raw ? JSON.parse(raw) : []
    return [...PRESET_AGENTS, ...custom]
  } catch {
    return [...PRESET_AGENTS]
  }
}

export function saveAgent(agent: Agent): void {
  try {
    const raw = localStorage.getItem(AGENTS_KEY)
    const custom: Agent[] = raw ? JSON.parse(raw) : []
    const idx = custom.findIndex((a) => a.id === agent.id)
    if (idx >= 0) custom[idx] = agent
    else custom.push(agent)
    localStorage.setItem(AGENTS_KEY, JSON.stringify(custom))
  } catch { /* */ }
}

export function deleteAgent(id: string): void {
  try {
    const raw = localStorage.getItem(AGENTS_KEY)
    const custom: Agent[] = raw ? JSON.parse(raw) : []
    localStorage.setItem(AGENTS_KEY, JSON.stringify(custom.filter((a) => a.id !== id)))
  } catch { /* */ }
}

export function loadAlerts(): Alert[] {
  try {
    const raw = localStorage.getItem(ALERTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveAlerts(alerts: Alert[]): void {
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts))
}

export function generateAlerts(agents: Agent[], publishedNotes: Note[]): Alert[] {
  const existing = loadAlerts()
  const existingIds = new Set(existing.map((a) => a.id))
  const newAlerts: Alert[] = []

  for (const agent of agents) {
    for (const note of publishedNotes) {
      if (note.authorId === agent.id) continue
      const matchingInterest = agent.interests.find((interest) =>
        note.title.toLowerCase().includes(interest.toLowerCase()) ||
        note.content.toLowerCase().includes(interest.toLowerCase())
      )
      if (matchingInterest) {
        const alertId = `alert-${agent.id}-${note.id}`
        if (!existingIds.has(alertId)) {
          newAlerts.push({
            id: alertId, agentId: agent.id,
            type: 'interest', title: `New note about ${matchingInterest}`,
            content: `"${note.title}" by ${note.author || 'Unknown'}`,
            noteId: note.id, read: false, createdAt: Date.now(),
          })
        }
      }
    }
  }

  if (newAlerts.length > 0) {
    const all = [...newAlerts, ...existing]
    saveAlerts(all)
    return all
  }
  return existing
}
