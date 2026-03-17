import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import type { WorkspaceApp, WindowState, Note, Folder, Workspace } from '../types'
import { Icons, ZarnettiLogo } from '../lib/icons'
import { OSWindow } from './OSWindow'

interface WorkspaceOSProps {
  workspaces: Workspace[]
  activeWorkspaceId: string
  onSwitchWorkspace: (id: string) => void
  onCreateWorkspace: (name: string) => void
  notes: Note[]
  folders: Folder[]
  onOpenNote: (id: string) => void
  onAddNote: (folderId?: string) => void
  onCreateFolder: (name: string, parentId?: string) => void
}

interface Notification {
  id: string
  title: string
  body: string
  icon?: string
  ts: number
}

interface ContextMenu {
  x: number
  y: number
  items: { label: string; icon?: string; action: () => void; danger?: boolean }[]
}

const BUILTIN_APPS: WorkspaceApp[] = [
  { id: 'app-workspace', name: 'Workspace', icon: '📁', type: 'builtin', builtinId: 'workspace', workspaceId: '', installedAt: 0, pinned: true },
  { id: 'app-notes', name: 'Notes', icon: '📝', type: 'builtin', builtinId: 'notes', workspaceId: '', installedAt: 0, pinned: true },
  { id: 'app-terminal', name: 'Terminal', icon: '⬛', type: 'builtin', builtinId: 'terminal', workspaceId: '', installedAt: 0 },
  { id: 'app-settings', name: 'Settings', icon: '⚙️', type: 'builtin', builtinId: 'settings', workspaceId: '', installedAt: 0 },
]

let windowIdCounter = 0
function createWindow(app: WorkspaceApp, containerW: number, containerH: number): WindowState {
  const id = `win-${++windowIdCounter}`
  const w = Math.min(640, containerW * 0.6)
  const h = Math.min(480, containerH * 0.7)
  const x = Math.max(20, (containerW - w) / 2 + (windowIdCounter % 5) * 24)
  const y = Math.max(20, (containerH - h) / 2 + (windowIdCounter % 5) * 24)
  return { id, appId: app.id, title: app.name, x, y, width: w, height: h, minimized: false, maximized: false, zIndex: windowIdCounter }
}

// Simple terminal command processor
function processCommand(cmd: string, wsName: string): string {
  const parts = cmd.trim().split(/\s+/)
  const bin = parts[0]?.toLowerCase()
  if (!bin) return ''
  switch (bin) {
    case 'help': return 'Available commands: help, echo, date, whoami, ls, pwd, clear, uname'
    case 'echo': return parts.slice(1).join(' ')
    case 'date': return new Date().toLocaleString()
    case 'whoami': return 'user'
    case 'pwd': return `/workspace/${wsName}`
    case 'ls': return 'Documents  Downloads  Notes  Projects'
    case 'clear': return '\x00CLEAR'
    case 'uname': return 'ZarnettiOS 1.0'
    case 'hostname': return 'zarnetti-workspace'
    default: return `zsh: command not found: ${bin}`
  }
}

export function WorkspaceOS({
  workspaces, activeWorkspaceId, onSwitchWorkspace,
  notes, folders, onOpenNote, onAddNote,
}: WorkspaceOSProps) {
  const [installedApps, setInstalledApps] = useState<WorkspaceApp[]>([])
  const [windows, setWindows] = useState<WindowState[]>([])
  const [addingApp, setAddingApp] = useState(false)
  const [newAppUrl, setNewAppUrl] = useState('')
  const [newAppName, setNewAppName] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [switcherIdx, setSwitcherIdx] = useState(0)
  const [termHistory, setTermHistory] = useState<{ prompt: string; output: string }[]>([])
  const termInputRef = useRef<HTMLInputElement>(null)

  const allApps = useMemo(() => [...BUILTIN_APPS, ...installedApps], [installedApps])
  const activeWs = workspaces.find(w => w.id === activeWorkspaceId)

  // ── Notifications ──
  const addNotification = useCallback((title: string, body: string, icon?: string) => {
    const n: Notification = { id: `notif-${Date.now()}`, title, body, icon, ts: Date.now() }
    setNotifications(prev => [n, ...prev])
    setTimeout(() => setNotifications(prev => prev.filter(nn => nn.id !== n.id)), 4000)
  }, [])

  // ── Context menu ──
  const handleDesktopContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX, y: e.clientY,
      items: [
        { label: 'New file', icon: '📄', action: () => { onAddNote(); setContextMenu(null) } },
        { label: 'Install app', icon: '🌐', action: () => { setAddingApp(true); setContextMenu(null) } },
        { label: 'Refresh', icon: '🔄', action: () => { addNotification('Refreshed', 'Workspace refreshed'); setContextMenu(null) } },
      ],
    })
  }, [onAddNote, addNotification])

  const handleAppContextMenu = useCallback((e: React.MouseEvent, app: WorkspaceApp) => {
    e.preventDefault()
    e.stopPropagation()
    const items: ContextMenu['items'] = [
      { label: 'Open', action: () => { openApp(app); setContextMenu(null) } },
    ]
    if (app.type !== 'builtin') {
      items.push({ label: 'Uninstall', icon: '🗑️', danger: true, action: () => {
        setInstalledApps(prev => prev.filter(a => a.id !== app.id))
        setWindows(prev => prev.filter(w => w.appId !== app.id))
        setContextMenu(null)
        addNotification('Uninstalled', `${app.name} removed`)
      }})
    }
    setContextMenu({ x: e.clientX, y: e.clientY, items })
  }, [addNotification])

  // Close context menu on click
  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [contextMenu])

  // ── App Switcher (Alt+Tab) ──
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault()
        if (!showSwitcher) {
          setShowSwitcher(true)
          setSwitcherIdx(0)
        } else {
          setSwitcherIdx(prev => (prev + 1) % Math.max(1, windows.length))
        }
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' && showSwitcher && windows.length > 0) {
        const win = windows[switcherIdx]
        if (win) {
          focusWindow(win.id)
          setWindows(ws => ws.map(w => w.id === win.id ? { ...w, minimized: false } : w))
        }
        setShowSwitcher(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  }, [showSwitcher, switcherIdx, windows])

  // ── Window management ──
  const nextZ = useCallback(() => {
    return Math.max(1, ...windows.map(w => w.zIndex)) + 1
  }, [windows])

  const openApp = useCallback((app: WorkspaceApp) => {
    const existing = windows.find(w => w.appId === app.id && !w.minimized)
    if (existing) {
      setWindows(ws => ws.map(w => w.id === existing.id ? { ...w, zIndex: nextZ(), minimized: false } : w))
      return
    }
    const minimized = windows.find(w => w.appId === app.id && w.minimized)
    if (minimized) {
      setWindows(ws => ws.map(w => w.id === minimized.id ? { ...w, minimized: false, zIndex: nextZ() } : w))
      return
    }
    const win = createWindow(app, window.innerWidth - 260, window.innerHeight - 60)
    win.zIndex = nextZ()
    setWindows(ws => [...ws, win])
  }, [windows, nextZ])

  const closeWindow = useCallback((id: string) => {
    setWindows(ws => ws.filter(w => w.id !== id))
  }, [])
  const minimizeWindow = useCallback((id: string) => {
    setWindows(ws => ws.map(w => w.id === id ? { ...w, minimized: true } : w))
  }, [])
  const maximizeWindow = useCallback((id: string) => {
    setWindows(ws => ws.map(w => w.id === id ? { ...w, maximized: !w.maximized } : w))
  }, [])
  const focusWindow = useCallback((id: string) => {
    setWindows(ws => ws.map(w => w.id === id ? { ...w, zIndex: Math.max(1, ...ws.map(ww => ww.zIndex)) + 1 } : w))
  }, [])
  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows(ws => ws.map(w => w.id === id ? { ...w, x, y } : w))
  }, [])
  const resizeWindow = useCallback((id: string, x: number, y: number, width: number, height: number) => {
    setWindows(ws => ws.map(w => w.id === id ? { ...w, x, y, width, height } : w))
  }, [])

  // ── Install web app ──
  const installApp = useCallback(() => {
    const url = newAppUrl.trim()
    const name = newAppName.trim() || (() => { try { return new URL(url).hostname } catch { return 'App' } })()
    if (!url) return
    const app: WorkspaceApp = {
      id: `app-web-${Date.now()}`, name, icon: '🌐', type: 'web', url,
      workspaceId: activeWorkspaceId, installedAt: Date.now(),
    }
    setInstalledApps(prev => [...prev, app])
    setNewAppUrl('')
    setNewAppName('')
    setAddingApp(false)
    addNotification('Installed', `${name} added to workspace`)
  }, [newAppUrl, newAppName, activeWorkspaceId, addNotification])

  // ── Terminal ──
  const handleTermCommand = useCallback((cmd: string) => {
    const output = processCommand(cmd, activeWs?.name || '~')
    if (output === '\x00CLEAR') {
      setTermHistory([])
    } else {
      setTermHistory(prev => [...prev, { prompt: `workspace/${activeWs?.name || '~'} $ ${cmd}`, output }])
    }
  }, [activeWs])

  // Taskbar
  const taskbarApps = useMemo(() => {
    const pinned = allApps.filter(a => a.pinned)
    const openAppIds = new Set(windows.map(w => w.appId))
    const openOnly = allApps.filter(a => openAppIds.has(a.id) && !a.pinned)
    return [...pinned, ...openOnly]
  }, [allApps, windows])

  const wsNotes = useMemo(() => notes.filter(n => !n.workspaceId || n.workspaceId === activeWorkspaceId), [notes, activeWorkspaceId])
  const wsFolders = useMemo(() => folders.filter(f => !f.workspaceId || f.workspaceId === activeWorkspaceId), [folders, activeWorkspaceId])

  const renderWindowContent = useCallback((win: WindowState) => {
    const app = allApps.find(a => a.id === win.appId)
    if (!app) return <div className="os-app-empty">App not found</div>

    if (app.type === 'web' && app.url) {
      return <iframe src={app.url} className="os-app-iframe" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" title={app.name} />
    }

    if (app.builtinId === 'workspace') {
      return (
        <div className="os-app-files">
          <div className="os-app-files__header">
            <span>{activeWs?.name || 'Workspace'}</span>
            <button className="os-app-files__action" onClick={() => onAddNote()}>{Icons.plus()}</button>
          </div>
          <div className="os-app-files__list">
            {wsFolders.filter(f => !f.parentId).map(f => (
              <div key={f.id} className="os-app-files__item os-app-files__item--folder"
                onContextMenu={e => { e.preventDefault(); e.stopPropagation() }}>
                <span className="os-app-files__icon">📁</span>
                <span className="os-app-files__name">{f.name}</span>
              </div>
            ))}
            {wsNotes.filter(n => !n.folderId).map(n => (
              <div key={n.id} className="os-app-files__item" onClick={() => onOpenNote(n.id)}
                onContextMenu={e => {
                  e.preventDefault(); e.stopPropagation()
                  setContextMenu({ x: e.clientX, y: e.clientY, items: [
                    { label: 'Open', action: () => { onOpenNote(n.id); setContextMenu(null) } },
                    { label: 'Delete', danger: true, action: () => { setContextMenu(null) } },
                  ]})
                }}>
                <span className="os-app-files__icon">📄</span>
                <span className="os-app-files__name">{n.title || 'Untitled'}</span>
              </div>
            ))}
            {wsNotes.length === 0 && wsFolders.length === 0 && (
              <div className="os-app-files__empty">No files yet</div>
            )}
          </div>
        </div>
      )
    }

    if (app.builtinId === 'notes') {
      return (
        <div className="os-app-files">
          <div className="os-app-files__header">
            <span>Notes</span>
            <button className="os-app-files__action" onClick={() => onAddNote()}>{Icons.plus()}</button>
          </div>
          <div className="os-app-files__list">
            {wsNotes.map(n => (
              <div key={n.id} className="os-app-files__item" onClick={() => onOpenNote(n.id)}>
                <span className="os-app-files__icon">📝</span>
                <span className="os-app-files__name">{n.title || 'Untitled'}</span>
                <span className="os-app-files__meta">{n.content.slice(0, 40)}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (app.builtinId === 'terminal') {
      return (
        <div className="os-app-terminal">
          <div className="os-app-terminal__output">
            {termHistory.map((h, i) => (
              <div key={i}>
                <div className="os-app-terminal__line"><span className="os-app-terminal__prompt">{h.prompt}</span></div>
                {h.output && <div className="os-app-terminal__line">{h.output}</div>}
              </div>
            ))}
          </div>
          <div className="os-app-terminal__input-row">
            <span className="os-app-terminal__prompt">workspace/{activeWs?.name || '~'} $</span>
            <input
              ref={termInputRef}
              className="os-app-terminal__input"
              placeholder=""
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value
                  if (val.trim()) handleTermCommand(val);
                  (e.target as HTMLInputElement).value = ''
                }
              }}
            />
          </div>
        </div>
      )
    }

    if (app.builtinId === 'settings') {
      return (
        <div className="os-app-settings">
          <h3 className="os-app-settings__title">Settings</h3>
          <div className="os-app-settings__section">
            <label className="os-app-settings__label">Active workspace</label>
            <div className="os-app-settings__ws-list">
              {workspaces.map(ws => (
                <button key={ws.id} className={`os-app-settings__ws ${ws.id === activeWorkspaceId ? 'active' : ''}`}
                  onClick={() => onSwitchWorkspace(ws.id)}>{ws.name}</button>
              ))}
            </div>
          </div>
          <div className="os-app-settings__section">
            <label className="os-app-settings__label">Installed apps</label>
            <div className="os-app-settings__app-list">
              {installedApps.map(a => (
                <div key={a.id} className="os-app-settings__app-row">
                  <span>{a.icon} {a.name}</span>
                  <button onClick={() => setInstalledApps(prev => prev.filter(aa => aa.id !== a.id))}>{Icons.x()}</button>
                </div>
              ))}
              {installedApps.length === 0 && <span className="os-app-settings__muted">No installed apps</span>}
            </div>
          </div>
        </div>
      )
    }

    return <div className="os-app-empty">Unknown app</div>
  }, [allApps, activeWs, wsNotes, wsFolders, activeWorkspaceId, workspaces, installedApps,
      onAddNote, onOpenNote, onSwitchWorkspace, termHistory, handleTermCommand])

  return (
    <div className="content-area">
      <div className="os">
        {/* Desktop */}
        <div className="os-desktop" onContextMenu={handleDesktopContextMenu}>
          {/* Launcher */}
          <div className="os-launcher">
            {allApps.map(app => (
              <button key={app.id} className="os-app" onClick={() => openApp(app)}
                onContextMenu={e => handleAppContextMenu(e, app)}>
                <span className="os-app__icon">{app.icon}</span>
                <span className="os-app__name">{app.name}</span>
              </button>
            ))}
            <button className="os-app os-app--add" onClick={() => setAddingApp(true)}>
              <span className="os-app__icon">+</span>
              <span className="os-app__name">Install</span>
            </button>
          </div>

          {/* Install dialog */}
          {addingApp && (
            <div className="os-dialog-backdrop" onClick={() => setAddingApp(false)}>
              <div className="os-dialog" onClick={e => e.stopPropagation()}>
                <div className="os-dialog__header">
                  <span>Install App</span>
                  <button className="os-dialog__close" onClick={() => setAddingApp(false)}>{Icons.x()}</button>
                </div>
                <div className="os-dialog__body">
                  <input className="os-dialog__input" placeholder="App name (optional)" value={newAppName}
                    onChange={e => setNewAppName(e.target.value)} />
                  <input className="os-dialog__input" placeholder="https://..." value={newAppUrl}
                    onChange={e => setNewAppUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') installApp() }} autoFocus />
                  <button className="os-dialog__btn" onClick={installApp} disabled={!newAppUrl.trim()}>Install</button>
                </div>
              </div>
            </div>
          )}

          {/* Context menu */}
          {contextMenu && (
            <div className="os-ctx" style={{ left: contextMenu.x, top: contextMenu.y }}>
              {contextMenu.items.map((item, i) => (
                <button key={i} className={`os-ctx__item ${item.danger ? 'os-ctx__item--danger' : ''}`}
                  onClick={item.action}>
                  {item.icon && <span className="os-ctx__icon">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Windows */}
          {windows.map(win => (
            <OSWindow key={win.id} win={win}
              onClose={closeWindow} onMinimize={minimizeWindow} onMaximize={maximizeWindow}
              onFocus={focusWindow} onMove={moveWindow} onResize={resizeWindow}>
              {renderWindowContent(win)}
            </OSWindow>
          ))}

          {/* App switcher overlay */}
          {showSwitcher && windows.length > 0 && (
            <div className="os-switcher">
              {windows.map((win, i) => {
                const app = allApps.find(a => a.id === win.appId)
                return (
                  <div key={win.id} className={`os-switcher__item ${i === switcherIdx ? 'os-switcher__item--active' : ''}`}>
                    <span className="os-switcher__icon">{app?.icon || '📄'}</span>
                    <span className="os-switcher__label">{win.title}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Notifications (top-right toast) */}
          <div className="os-notifs">
            {notifications.map(n => (
              <div key={n.id} className="os-notif">
                {n.icon && <span className="os-notif__icon">{n.icon}</span>}
                <div className="os-notif__body">
                  <span className="os-notif__title">{n.title}</span>
                  <span className="os-notif__text">{n.body}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Taskbar */}
        <div className="os-taskbar">
          <div className="os-taskbar__logo">
            <ZarnettiLogo className="os-taskbar__logo-svg" />
          </div>
          <div className="os-taskbar__divider" />
          <div className="os-taskbar__apps">
            {taskbarApps.map(app => {
              const isOpen = windows.some(w => w.appId === app.id)
              return (
                <button key={app.id} className={`os-taskbar__app ${isOpen ? 'os-taskbar__app--open' : ''}`}
                  onClick={() => openApp(app)} title={app.name}>
                  <span className="os-taskbar__app-icon">{app.icon}</span>
                </button>
              )
            })}
          </div>
          <div className="os-taskbar__spacer" />
          <div className="os-taskbar__info">
            <span className="os-taskbar__ws">{activeWs?.name || 'Workspace'}</span>
            <span className="os-taskbar__time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
