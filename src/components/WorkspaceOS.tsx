import { useState, useCallback, useMemo } from 'react'
import type { WorkspaceApp, WindowState, Note, Folder, Workspace } from '../types'
import { Icons } from '../lib/icons'
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

const BUILTIN_APPS: WorkspaceApp[] = [
  { id: 'app-files', name: 'Files', icon: '📁', type: 'builtin', builtinId: 'files', workspaceId: '', installedAt: 0, pinned: true },
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

export function WorkspaceOS({
  workspaces, activeWorkspaceId, onSwitchWorkspace,
  notes, folders, onOpenNote, onAddNote,
}: WorkspaceOSProps) {
  const [installedApps, setInstalledApps] = useState<WorkspaceApp[]>([])
  const [windows, setWindows] = useState<WindowState[]>([])
  const [addingApp, setAddingApp] = useState(false)
  const [newAppUrl, setNewAppUrl] = useState('')
  const [newAppName, setNewAppName] = useState('')

  const allApps = useMemo(() => [...BUILTIN_APPS, ...installedApps], [installedApps])
  const activeWs = workspaces.find(w => w.id === activeWorkspaceId)

  // Window management
  const nextZ = useCallback(() => {
    return Math.max(1, ...windows.map(w => w.zIndex)) + 1
  }, [windows])

  const openApp = useCallback((app: WorkspaceApp) => {
    // If already open, focus it
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
    // Create new window
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

  const resizeWindow = useCallback((id: string, width: number, height: number) => {
    setWindows(ws => ws.map(w => w.id === id ? { ...w, width, height } : w))
  }, [])

  // Install web app
  const installApp = useCallback(() => {
    const url = newAppUrl.trim()
    const name = newAppName.trim() || new URL(url).hostname
    if (!url) return
    const app: WorkspaceApp = {
      id: `app-web-${Date.now()}`,
      name,
      icon: '🌐',
      type: 'web',
      url,
      workspaceId: activeWorkspaceId,
      installedAt: Date.now(),
    }
    setInstalledApps(prev => [...prev, app])
    setNewAppUrl('')
    setNewAppName('')
    setAddingApp(false)
  }, [newAppUrl, newAppName, activeWorkspaceId])

  // Taskbar: pinned + open apps
  const taskbarApps = useMemo(() => {
    const pinned = allApps.filter(a => a.pinned)
    const openAppIds = new Set(windows.map(w => w.appId))
    const openOnly = allApps.filter(a => openAppIds.has(a.id) && !a.pinned)
    return [...pinned, ...openOnly]
  }, [allApps, windows])

  // Workspace files for Files built-in app
  const wsNotes = useMemo(() => notes.filter(n => !n.workspaceId || n.workspaceId === activeWorkspaceId), [notes, activeWorkspaceId])
  const wsFolders = useMemo(() => folders.filter(f => !f.workspaceId || f.workspaceId === activeWorkspaceId), [folders, activeWorkspaceId])

  const renderWindowContent = useCallback((win: WindowState) => {
    const app = allApps.find(a => a.id === win.appId)
    if (!app) return <div className="os-app-empty">App not found</div>

    if (app.type === 'web' && app.url) {
      return (
        <iframe
          src={app.url}
          className="os-app-iframe"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title={app.name}
        />
      )
    }

    if (app.builtinId === 'files') {
      return (
        <div className="os-app-files">
          <div className="os-app-files__header">
            <span>{activeWs?.name || 'Workspace'}</span>
            <button className="os-app-files__action" onClick={() => onAddNote()}>
              {Icons.plus()}
            </button>
          </div>
          <div className="os-app-files__list">
            {wsFolders.filter(f => !f.parentId).map(f => (
              <div key={f.id} className="os-app-files__item os-app-files__item--folder">
                <span className="os-app-files__icon">📁</span>
                <span className="os-app-files__name">{f.name}</span>
              </div>
            ))}
            {wsNotes.filter(n => !n.folderId).map(n => (
              <div key={n.id} className="os-app-files__item" onClick={() => onOpenNote(n.id)}>
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
            <button className="os-app-files__action" onClick={() => onAddNote()}>
              {Icons.plus()}
            </button>
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
            <div className="os-app-terminal__line">
              <span className="os-app-terminal__prompt">workspace/{activeWs?.name || '~'} $</span>
            </div>
          </div>
          <div className="os-app-terminal__input-row">
            <span className="os-app-terminal__prompt">$</span>
            <input className="os-app-terminal__input" placeholder="Type a command..." autoFocus />
          </div>
        </div>
      )
    }

    if (app.builtinId === 'settings') {
      return (
        <div className="os-app-settings">
          <h3 className="os-app-settings__title">Workspace Settings</h3>
          <div className="os-app-settings__section">
            <label className="os-app-settings__label">Active workspace</label>
            <div className="os-app-settings__ws-list">
              {workspaces.map(ws => (
                <button
                  key={ws.id}
                  className={`os-app-settings__ws ${ws.id === activeWorkspaceId ? 'active' : ''}`}
                  onClick={() => onSwitchWorkspace(ws.id)}
                >
                  {ws.name}
                </button>
              ))}
            </div>
          </div>
          <div className="os-app-settings__section">
            <label className="os-app-settings__label">Installed apps</label>
            <div className="os-app-settings__app-list">
              {installedApps.map(app => (
                <div key={app.id} className="os-app-settings__app-row">
                  <span>{app.icon} {app.name}</span>
                  <button onClick={() => setInstalledApps(prev => prev.filter(a => a.id !== app.id))}>
                    {Icons.x()}
                  </button>
                </div>
              ))}
              {installedApps.length === 0 && <span className="os-app-settings__muted">No installed apps</span>}
            </div>
          </div>
        </div>
      )
    }

    return <div className="os-app-empty">Unknown app</div>
  }, [allApps, activeWs, wsNotes, wsFolders, activeWorkspaceId, workspaces, installedApps, onAddNote, onOpenNote, onSwitchWorkspace])

  return (
    <div className="content-area">
      <div className="os">
        {/* Desktop area */}
        <div className="os-desktop">
          {/* Launcher grid */}
          <div className="os-launcher">
            {allApps.map(app => (
              <button key={app.id} className="os-app" onClick={() => openApp(app)}>
                <span className="os-app__icon">{app.icon}</span>
                <span className="os-app__name">{app.name}</span>
              </button>
            ))}
            <button className="os-app os-app--add" onClick={() => setAddingApp(true)}>
              <span className="os-app__icon">+</span>
              <span className="os-app__name">Add</span>
            </button>
          </div>

          {/* Add app dialog */}
          {addingApp && (
            <div className="os-dialog-backdrop" onClick={() => setAddingApp(false)}>
              <div className="os-dialog" onClick={e => e.stopPropagation()}>
                <div className="os-dialog__header">
                  <span>Install App</span>
                  <button className="os-dialog__close" onClick={() => setAddingApp(false)}>{Icons.x()}</button>
                </div>
                <div className="os-dialog__body">
                  <input
                    className="os-dialog__input"
                    placeholder="App name (optional)"
                    value={newAppName}
                    onChange={e => setNewAppName(e.target.value)}
                  />
                  <input
                    className="os-dialog__input"
                    placeholder="https://..."
                    value={newAppUrl}
                    onChange={e => setNewAppUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') installApp() }}
                    autoFocus
                  />
                  <button className="os-dialog__btn" onClick={installApp} disabled={!newAppUrl.trim()}>
                    Install
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Windows */}
          {windows.map(win => (
            <OSWindow
              key={win.id}
              win={win}
              onClose={closeWindow}
              onMinimize={minimizeWindow}
              onMaximize={maximizeWindow}
              onFocus={focusWindow}
              onMove={moveWindow}
              onResize={resizeWindow}
            >
              {renderWindowContent(win)}
            </OSWindow>
          ))}
        </div>

        {/* Taskbar */}
        <div className="os-taskbar">
          <div className="os-taskbar__apps">
            {taskbarApps.map(app => {
              const isOpen = windows.some(w => w.appId === app.id)
              return (
                <button
                  key={app.id}
                  className={`os-taskbar__app ${isOpen ? 'os-taskbar__app--open' : ''}`}
                  onClick={() => openApp(app)}
                  title={app.name}
                >
                  <span className="os-taskbar__app-icon">{app.icon}</span>
                </button>
              )
            })}
          </div>
          <div className="os-taskbar__info">
            <span className="os-taskbar__ws">{activeWs?.name || 'Workspace'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
