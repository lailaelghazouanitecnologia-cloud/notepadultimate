import type { Note, Agent, Alert, Project, Contract, Folder, SystemEvent, Follow, SpaceInvite, UserProfile, Workspace } from './types'

const STORAGE_KEY = 'zarnetti-notes'
const PUBLISHED_KEY = 'zarnetti-published'

function createSeedNotes(): Note[] {
  const now = Date.now()
  const ids = {
    hub: 'seed-hub-001',
    physics: 'seed-physics-002',
    math: 'seed-math-003',
    cs: 'seed-cs-004',
    philosophy: 'seed-philosophy-005',
    neuroscience: 'seed-neuro-006',
    ai: 'seed-ai-007',
    quantum: 'seed-quantum-008',
    creativity: 'seed-creativity-009',
    networks: 'seed-networks-010',
  }
  return [
    {
      id: ids.hub, title: 'Knowledge Map', createdAt: now, updatedAt: now,
      content: `# Knowledge Map\n\nThis is the central hub connecting all areas of study.\n\n![Knowledge Graph](https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=300&fit=crop)\n\nCore branches:\n- [[${ids.physics}]] — Fundamental laws\n- [[${ids.math}]] — The language of patterns\n- [[${ids.cs}]] — Computation & algorithms\n- [[${ids.philosophy}]] — Big questions\n- [[${ids.neuroscience}]] — The brain\n- [[${ids.ai}]] — Machine intelligence\n\n> "The important thing is not to stop questioning." — Albert Einstein`,
    },
    {
      id: ids.physics, title: 'Physics', createdAt: now - 100000, updatedAt: now - 50000,
      content: `# Physics\n\nThe study of matter, energy, and the fundamental forces.\n\n![Double slit experiment](https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&h=300&fit=crop)\n\n## Key Areas\n- Classical mechanics\n- Thermodynamics\n- Electromagnetism\n- Relativity\n\nRelated:\n- [[${ids.math}]] — Mathematical foundations\n- [[${ids.quantum}]] — Quantum mechanics\n- [[${ids.philosophy}]] — Philosophy of science`,
    },
    {
      id: ids.math, title: 'Mathematics', createdAt: now - 200000, updatedAt: now - 80000,
      content: `# Mathematics\n\nPatterns, structures, and logical reasoning.\n\n## Fundamental Branches\n1. **Algebra** — Structures and symmetry\n2. **Analysis** — Limits, continuity, calculus\n3. **Geometry** — Shape, space, dimension\n4. **Number Theory** — Properties of integers\n\nConnections:\n- [[${ids.physics}]] — Applied math in physics\n- [[${ids.cs}]] — Discrete math & algorithms\n- [[${ids.networks}]] — Graph theory & networks`,
    },
    {
      id: ids.cs, title: 'Computer Science', createdAt: now - 300000, updatedAt: now - 20000,
      content: `# Computer Science\n\nAlgorithms, data structures, and computation.\n\n\`\`\`python\ndef fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a\n\`\`\`\n\n## Core Topics\n- Algorithms & complexity\n- Operating systems\n- Networking\n- Databases\n\nLinks:\n- [[${ids.math}]] — Theoretical CS\n- [[${ids.ai}]] — Artificial intelligence\n- [[${ids.networks}]] — Network theory`,
    },
    {
      id: ids.philosophy, title: 'Philosophy', createdAt: now - 400000, updatedAt: now - 90000,
      content: `# Philosophy\n\nEthics, epistemology, and the nature of reality.\n\n> "I think, therefore I am." — René Descartes\n\n## Branches\n- **Metaphysics** — What exists?\n- **Epistemology** — What can we know?\n- **Ethics** — What should we do?\n- **Logic** — What follows from what?\n\nRelated:\n- [[${ids.physics}]] — Philosophy of physics\n- [[${ids.neuroscience}]] — Philosophy of mind\n- [[${ids.ai}]] — AI ethics & consciousness`,
    },
    {
      id: ids.neuroscience, title: 'Neuroscience', createdAt: now - 500000, updatedAt: now - 30000,
      content: `# Neuroscience\n\nHow the brain produces thought, perception, and behavior.\n\n![Neural network](https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&h=300&fit=crop)\n\n## Key Concepts\n- **Neurons** — ~86 billion in the human brain\n- **Synapses** — Connections between neurons\n- **Plasticity** — The brain's ability to change\n\nConnections:\n- [[${ids.philosophy}]] — Mind-body problem\n- [[${ids.ai}]] — Neural networks inspiration\n- [[${ids.creativity}]] — Creative cognition`,
    },
    {
      id: ids.ai, title: 'Artificial Intelligence', createdAt: now - 600000, updatedAt: now - 10000,
      content: `# Artificial Intelligence\n\nBuilding systems that learn, reason, and create.\n\n![AI visualization](https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=300&fit=crop)\n\n## Milestones\n| Year | Event |\n|------|-------|\n| 1956 | Dartmouth Conference |\n| 1997 | Deep Blue beats Kasparov |\n| 2017 | Transformer architecture |\n| 2022 | Large Language Models |\n\nRelated:\n- [[${ids.cs}]] — Algorithms & computing\n- [[${ids.neuroscience}]] — Bio-inspired AI\n- [[${ids.philosophy}]] — Ethics of AI\n- [[${ids.quantum}]] — Quantum computing for AI`,
    },
    {
      id: ids.quantum, title: 'Quantum Mechanics', createdAt: now - 700000, updatedAt: now - 60000,
      content: `# Quantum Mechanics\n\nThe physics of the very small — superposition, entanglement, uncertainty.\n\n## Core Principles\n- **Superposition** — Particles exist in multiple states\n- **Entanglement** — Instant correlations across distance\n- **Uncertainty** — Cannot know position and momentum exactly\n\nLinks:\n- [[${ids.physics}]] — Classical to quantum\n- [[${ids.math}]] — Linear algebra & Hilbert spaces\n- [[${ids.ai}]] — Quantum machine learning`,
    },
    {
      id: ids.creativity, title: 'Creativity & Innovation', createdAt: now - 800000, updatedAt: now - 40000,
      content: `# Creativity & Innovation\n\nHow new ideas emerge from connecting disparate concepts.\n\n## The Creative Process\n1. **Preparation** — Immerse in the domain\n2. **Incubation** — Let the subconscious work\n3. **Illumination** — The "aha!" moment\n4. **Verification** — Test and refine\n\nRelated:\n- [[${ids.neuroscience}]] — Neural basis of creativity\n- [[${ids.networks}]] — Innovation networks\n- [[${ids.philosophy}]] — Aesthetics`,
    },
    {
      id: ids.networks, title: 'Network Theory', createdAt: now - 900000, updatedAt: now - 70000,
      content: `# Network Theory\n\nStudy of graphs, connections, and emergent behavior in complex systems.\n\n## Key Properties\n- **Nodes** — Entities in the network\n- **Edges** — Connections between nodes\n- **Hubs** — Highly connected nodes\n- **Small world** — Short path between any two nodes\n\nLinks:\n- [[${ids.math}]] — Graph theory\n- [[${ids.cs}]] — Distributed systems\n- [[${ids.creativity}]] — Creative networks`,
    },
  ]
}

export function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const notes: Note[] = raw ? JSON.parse(raw) : []
    if (notes.length === 0) {
      const seed = createSeedNotes()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    return notes
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

// ── Projects ──
const PROJECTS_KEY = 'zarnetti-projects'
const ACTIVE_PROJECT_KEY = 'zarnetti-active-project'

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY)
    const projects: Project[] = raw ? JSON.parse(raw) : []
    if (projects.length === 0) {
      const def: Project = { id: 'default', name: 'Zarnetti', emoji: '📁', createdAt: Date.now(), isGlobal: true }
      localStorage.setItem(PROJECTS_KEY, JSON.stringify([def]))
      return [def]
    }
    return projects
  } catch {
    return [{ id: 'default', name: 'Zarnetti', emoji: '📁', createdAt: Date.now(), isGlobal: true }]
  }
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
}

export function getActiveProjectId(): string {
  return localStorage.getItem(ACTIVE_PROJECT_KEY) || 'default'
}

export function setActiveProjectId(id: string): void {
  localStorage.setItem(ACTIVE_PROJECT_KEY, id)
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

// ── Folders ──
const FOLDERS_KEY = 'zarnetti-folders'

const DEFAULT_FOLDERS: Folder[] = [
  { id: 'folder-workspace', name: 'workspace', createdAt: Date.now() },
  { id: 'folder-chat', name: 'chat', createdAt: Date.now() },
  { id: 'folder-graph', name: 'graph', createdAt: Date.now() },
]

export function loadFolders(): Folder[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY)
    const folders: Folder[] = raw ? JSON.parse(raw) : []
    if (folders.length === 0) {
      saveFolders(DEFAULT_FOLDERS)
      return [...DEFAULT_FOLDERS]
    }
    return folders
  } catch {
    return [...DEFAULT_FOLDERS]
  }
}

export function saveFolders(folders: Folder[]): void {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders))
}

export function createFolder(name: string, parentId?: string): Folder {
  const folder: Folder = { id: `folder-${Date.now()}`, name, parentId, createdAt: Date.now() }
  const all = loadFolders()
  all.push(folder)
  saveFolders(all)
  return folder
}

export function deleteFolder(id: string): void {
  const all = loadFolders().filter((f) => f.id !== id)
  saveFolders(all)
}

// ── Contracts ──
const CONTRACTS_KEY = 'zarnetti-contracts'

export function loadContracts(): Contract[] {
  try {
    const raw = localStorage.getItem(CONTRACTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveContract(contract: Contract): void {
  const all = loadContracts()
  const idx = all.findIndex((c) => c.id === contract.id)
  if (idx >= 0) all[idx] = contract
  else all.push(contract)
  localStorage.setItem(CONTRACTS_KEY, JSON.stringify(all))
}

export function deleteContract(id: string): void {
  const all = loadContracts().filter((c) => c.id !== id)
  localStorage.setItem(CONTRACTS_KEY, JSON.stringify(all))
}

export function getContractsForProject(projectId: string): Contract[] {
  return loadContracts().filter((c) => c.projectId === projectId)
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

// System events
const EVENTS_KEY = 'zarnetti-events'

export function loadSystemEvents(): SystemEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveSystemEvents(events: SystemEvent[]): void {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
}

export function addSystemEvent(type: SystemEvent['type'], message: string, detail?: string): SystemEvent {
  const event: SystemEvent = { id: `evt-${Date.now()}`, type, message, detail, createdAt: Date.now() }
  const events = loadSystemEvents()
  events.push(event)
  saveSystemEvents(events)
  return event
}

// ── Follows (social) ──
const FOLLOWS_KEY = 'zarnetti-follows'

export function loadFollows(): Follow[] {
  try {
    const raw = localStorage.getItem(FOLLOWS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveFollows(follows: Follow[]): void {
  localStorage.setItem(FOLLOWS_KEY, JSON.stringify(follows))
}

export function addFollow(followerId: string, followingId: string): Follow {
  const follow: Follow = { followerId, followingId, createdAt: Date.now() }
  const all = loadFollows().filter(f => !(f.followerId === followerId && f.followingId === followingId))
  all.push(follow)
  saveFollows(all)
  return follow
}

export function removeFollow(followerId: string, followingId: string): void {
  const all = loadFollows().filter(f => !(f.followerId === followerId && f.followingId === followingId))
  saveFollows(all)
}

// ── Space invites ──
const INVITES_KEY = 'zarnetti-invites'

export function loadInvites(): SpaceInvite[] {
  try {
    const raw = localStorage.getItem(INVITES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveInvites(invites: SpaceInvite[]): void {
  localStorage.setItem(INVITES_KEY, JSON.stringify(invites))
}

// ── Workspaces ──
const WORKSPACES_KEY = 'zarnetti-workspaces'
const ACTIVE_WORKSPACE_KEY = 'zarnetti-active-workspace'

export function loadWorkspaces(): Workspace[] {
  try {
    const raw = localStorage.getItem(WORKSPACES_KEY)
    const ws: Workspace[] = raw ? JSON.parse(raw) : []
    if (ws.length === 0) {
      const def: Workspace = { id: 'ws-default', name: 'Main', spaceId: 'default', createdAt: Date.now() }
      saveWorkspaces([def])
      return [def]
    }
    return ws
  } catch {
    return [{ id: 'ws-default', name: 'Main', spaceId: 'default', createdAt: Date.now() }]
  }
}

export function saveWorkspaces(workspaces: Workspace[]): void {
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces))
}

export function createWorkspace(name: string, spaceId: string): Workspace {
  const ws: Workspace = { id: `ws-${Date.now()}`, name, spaceId, createdAt: Date.now() }
  const all = loadWorkspaces()
  all.push(ws)
  saveWorkspaces(all)
  return ws
}

export function getActiveWorkspaceId(): string {
  return localStorage.getItem(ACTIVE_WORKSPACE_KEY) || 'ws-default'
}

export function setActiveWorkspaceId(id: string): void {
  localStorage.setItem(ACTIVE_WORKSPACE_KEY, id)
}

// ── User profile ──
const PROFILE_KEY = 'zarnetti-profile'

const DEFAULT_PROFILE: UserProfile = {
  id: 'user-self',
  name: 'User',
  handle: '@user',
  avatar: '',
  bio: '',
  createdAt: Date.now(),
}

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : DEFAULT_PROFILE
  } catch { return DEFAULT_PROFILE }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}
