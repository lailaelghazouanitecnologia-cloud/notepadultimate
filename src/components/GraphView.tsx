import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import type { Note } from '../types'
import { Icons } from '../lib/icons'

interface GraphViewProps {
  notes: Note[]
  onOpenNote: (noteId: string) => void
  onCreateNote: (title: string, content: string) => void
}

interface NodePos {
  id: string
  title: string
  x: number
  y: number
  links: string[]
}

interface ContextMenu {
  x: number
  y: number
  canvasX: number
  canvasY: number
}

function extractLinks(content: string, allIds: Set<string>): string[] {
  const links: string[] = []
  const bracketRe = /\[\[([^\]]+)\]\]/g
  let m
  while ((m = bracketRe.exec(content)) !== null) {
    if (allIds.has(m[1])) links.push(m[1])
  }
  return links
}

export function GraphView({ notes, onOpenNote, onCreateNote }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 })
  const [ctxMenu, setCtxMenu] = useState<ContextMenu | null>(null)

  const allIds = useMemo(() => new Set(notes.map(n => n.id)), [notes])

  const [positions, setPositions] = useState<NodePos[]>(() => {
    const cx = 500, cy = 400
    return notes.map((n, i) => {
      const links = extractLinks(n.content, allIds)
      // First node at center, rest in a radial layout
      if (i === 0) return { id: n.id, title: n.title || 'Untitled', x: cx, y: cy, links }
      const angle = ((i - 1) / (notes.length - 1)) * Math.PI * 2 - Math.PI / 2
      const radius = 200 + (i % 2) * 60
      return {
        id: n.id,
        title: n.title || 'Untitled',
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        links,
      }
    })
  })

  useEffect(() => {
    setPositions(prev => {
      const existing = new Map(prev.map(p => [p.id, p]))
      const cx = 500, cy = 400
      return notes.map((n, i) => {
        const ex = existing.get(n.id)
        if (ex) return { ...ex, title: n.title || 'Untitled', links: extractLinks(n.content, allIds) }
        const angle = (i / Math.max(notes.length, 1)) * Math.PI * 2 - Math.PI / 2
        const radius = 200 + (i % 2) * 60
        return {
          id: n.id,
          title: n.title || 'Untitled',
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
          links: extractLinks(n.content, allIds),
        }
      })
    })
  }, [notes, allIds])

  const posMap = useMemo(() => new Map(positions.map(p => [p.id, p])), [positions])

  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    const node = posMap.get(nodeId)
    if (!node) return
    setDragging(nodeId)
    setOffset({ x: e.clientX - node.x - pan.x, y: e.clientY - node.y - pan.y })
  }, [posMap, pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      setPositions(prev => prev.map(p =>
        p.id === dragging ? { ...p, x: e.clientX - offset.x - pan.x, y: e.clientY - offset.y - pan.y } : p
      ))
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.current.px + panStart.current.x,
        y: e.clientY - panStart.current.py + panStart.current.y,
      })
    }
  }, [dragging, offset, pan, isPanning])

  const handleMouseUp = useCallback(() => {
    setDragging(null)
    setIsPanning(false)
  }, [])

  const handleBgMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2) return // don't pan on right click
    if (ctxMenu) { setCtxMenu(null); return }
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true)
      panStart.current = { x: pan.x, y: pan.y, px: e.clientX, py: e.clientY }
    }
  }, [pan, ctxMenu])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setCtxMenu({
      x: e.clientX,
      y: e.clientY,
      canvasX: e.clientX - rect.left - pan.x,
      canvasY: e.clientY - rect.top - pan.y,
    })
  }, [pan])

  // Close context menu on click outside
  useEffect(() => {
    if (!ctxMenu) return
    const handler = () => setCtxMenu(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [ctxMenu])

  const handleCtxAction = useCallback((action: string) => {
    if (!ctxMenu) return
    switch (action) {
      case 'new-note':
        onCreateNote('Untitled', '')
        break
      case 'new-reference':
        onCreateNote('Reference', '> Add your reference here\n\nSource: ')
        break
      case 'new-image':
        onCreateNote('Image Note', '![Image description](url)\n\nCaption: ')
        break
    }
    setCtxMenu(null)
  }, [ctxMenu, onCreateNote])

  const edges = useMemo(() => {
    const result: { from: NodePos; to: NodePos }[] = []
    positions.forEach(node => {
      node.links.forEach(linkId => {
        const target = posMap.get(linkId)
        if (target) result.push({ from: node, to: target })
      })
    })
    return result
  }, [positions, posMap])

  return (
    <div className="content-area">
      <div
        className="graph-view"
        ref={containerRef}
        onMouseDown={handleBgMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
      >
        <svg className="graph-edges" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
          {edges.map((edge, i) => (
            <line
              key={i}
              x1={edge.from.x + 60}
              y1={edge.from.y + 14}
              x2={edge.to.x + 60}
              y2={edge.to.y + 14}
              className="graph-edge"
            />
          ))}
        </svg>

        <div className="graph-nodes" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
          {positions.map(node => (
            <div
              key={node.id}
              className={`graph-node ${dragging === node.id ? 'dragging' : ''}`}
              style={{ left: node.x, top: node.y }}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              onDoubleClick={() => onOpenNote(node.id)}
            >
              <span className="graph-node__title">{node.title}</span>
              {node.links.length > 0 && (
                <span className="graph-node__badge">{node.links.length}</span>
              )}
            </div>
          ))}
        </div>

        {notes.length === 0 && (
          <div className="graph-empty">
            <span>Right-click to create a note</span>
          </div>
        )}

        {/* Context menu */}
        {ctxMenu && (
          <div
            className="graph-ctx-menu"
            style={{ left: ctxMenu.x, top: ctxMenu.y }}
          >
            <button className="graph-ctx-menu__item" onClick={() => handleCtxAction('new-note')}>
              {Icons.filePlus()}
              <span>New Note</span>
            </button>
            <button className="graph-ctx-menu__item" onClick={() => handleCtxAction('new-reference')}>
              {Icons.link()}
              <span>New Reference</span>
            </button>
            <button className="graph-ctx-menu__item" onClick={() => handleCtxAction('new-image')}>
              {Icons.image()}
              <span>New Image</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
