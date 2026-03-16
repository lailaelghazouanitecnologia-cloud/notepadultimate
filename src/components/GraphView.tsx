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
  linkCount: number
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

// Colors for nodes based on connection count
const NODE_COLORS = [
  'var(--muted-foreground)',  // 0 links
  'var(--zw-link, #5cc8d4)', // 1-2 links
  '#a78bfa',                  // 3-4 links (purple)
  'var(--zw-red)',            // 5+ links (red/hub)
]

function getNodeColor(linkCount: number): string {
  if (linkCount === 0) return NODE_COLORS[0]
  if (linkCount <= 2) return NODE_COLORS[1]
  if (linkCount <= 4) return NODE_COLORS[2]
  return NODE_COLORS[3]
}

export function GraphView({ notes, onOpenNote, onCreateNote }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 })
  const [ctxMenu, setCtxMenu] = useState<ContextMenu | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const dragMoved = useRef(false)

  const allIds = useMemo(() => new Set(notes.map(n => n.id)), [notes])

  // Count all incoming + outgoing links per note
  const linkCounts = useMemo(() => {
    const counts = new Map<string, number>()
    notes.forEach(n => {
      const links = extractLinks(n.content, allIds)
      counts.set(n.id, (counts.get(n.id) || 0) + links.length)
      links.forEach(lid => counts.set(lid, (counts.get(lid) || 0) + 1))
    })
    return counts
  }, [notes, allIds])

  // Center on the container
  const [positions, setPositions] = useState<NodePos[]>([])
  const initialized = useRef(false)

  useEffect(() => {
    const el = containerRef.current
    const cx = el ? el.clientWidth / 2 : 500
    const cy = el ? el.clientHeight / 2 : 400

    setPositions(prev => {
      const existing = new Map(prev.map(p => [p.id, p]))
      return notes.map((n, i) => {
        const links = extractLinks(n.content, allIds)
        const lc = linkCounts.get(n.id) || 0
        const ex = existing.get(n.id)
        if (ex && initialized.current) {
          return { ...ex, title: n.title || 'Untitled', links, linkCount: lc }
        }
        // Place hub (most connected) in center, others in orbit
        const angle = (i / Math.max(notes.length, 1)) * Math.PI * 2 - Math.PI / 2
        const radius = lc > 4 ? 0 : 160 + (i % 3) * 70
        return {
          id: n.id,
          title: n.title || 'Untitled',
          x: cx + Math.cos(angle) * radius - 60,
          y: cy + Math.sin(angle) * radius - 14,
          links,
          linkCount: lc,
        }
      })
    })
    initialized.current = true
  }, [notes, allIds, linkCounts])

  const posMap = useMemo(() => new Map(positions.map(p => [p.id, p])), [positions])

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    e.preventDefault()
    const node = posMap.get(nodeId)
    if (!node) return
    setDragging(nodeId)
    dragMoved.current = false
    setOffset({ x: e.clientX / zoom - node.x - pan.x, y: e.clientY / zoom - node.y - pan.y })
  }, [posMap, pan, zoom])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      dragMoved.current = true
      setPositions(prev => prev.map(p =>
        p.id === dragging ? { ...p, x: e.clientX / zoom - offset.x - pan.x, y: e.clientY / zoom - offset.y - pan.y } : p
      ))
    } else if (isPanning) {
      setPan({
        x: (e.clientX - panStart.current.px) / zoom + panStart.current.x,
        y: (e.clientY - panStart.current.py) / zoom + panStart.current.y,
      })
    }
  }, [dragging, offset, pan, zoom, isPanning])

  const handleMouseUp = useCallback(() => {
    setDragging(null)
    setIsPanning(false)
  }, [])

  const handleNodeClick = useCallback((nodeId: string) => {
    if (!dragMoved.current) {
      onOpenNote(nodeId)
    }
  }, [onOpenNote])

  const handleBgMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2) return
    if (ctxMenu) { setCtxMenu(null); return }
    setIsPanning(true)
    panStart.current = { x: pan.x, y: pan.y, px: e.clientX, py: e.clientY }
  }, [pan, ctxMenu])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setCtxMenu({
      x: e.clientX,
      y: e.clientY,
      canvasX: e.clientX / zoom - pan.x,
      canvasY: e.clientY / zoom - pan.y,
    })
  }, [pan, zoom])

  // Zoom with scroll wheel
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setZoom(z => Math.min(3, Math.max(0.2, z * delta)))
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

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
        onCreateNote('Image Note', '![Image description](https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop)\n\nCaption: A beautiful landscape')
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

  // Highlighted edges when hovering a node
  const highlightedEdges = useMemo(() => {
    if (!hovered) return new Set<number>()
    const set = new Set<number>()
    edges.forEach((edge, i) => {
      if (edge.from.id === hovered || edge.to.id === hovered) set.add(i)
    })
    return set
  }, [hovered, edges])

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
        <div className="graph-canvas" style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}>
          <svg className="graph-edges">
            {edges.map((edge, i) => (
              <line
                key={i}
                x1={edge.from.x + 60}
                y1={edge.from.y + 14}
                x2={edge.to.x + 60}
                y2={edge.to.y + 14}
                className={`graph-edge ${highlightedEdges.has(i) ? 'highlighted' : ''}`}
              />
            ))}
          </svg>

          <div className="graph-nodes">
            {positions.map(node => (
              <div
                key={node.id}
                className={`graph-node ${dragging === node.id ? 'dragging' : ''} ${hovered === node.id ? 'hovered' : ''}`}
                style={{ left: node.x, top: node.y }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onMouseUp={() => handleNodeClick(node.id)}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <span className="graph-node__dot" style={{ background: getNodeColor(node.linkCount) }} />
                <span className="graph-node__title">{node.title}</span>
                {node.links.length > 0 && (
                  <span className="graph-node__badge">{node.links.length}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {notes.length === 0 && (
          <div className="graph-empty">
            <span>Right-click to create a note</span>
          </div>
        )}

        {/* Zoom indicator */}
        <div className="graph-zoom">
          {Math.round(zoom * 100)}%
        </div>

        {/* Legend */}
        <div className="graph-legend">
          <div className="graph-legend__item">
            <span className="graph-legend__dot" style={{ background: NODE_COLORS[0] }} />
            <span>Isolated</span>
          </div>
          <div className="graph-legend__item">
            <span className="graph-legend__dot" style={{ background: NODE_COLORS[1] }} />
            <span>1-2 links</span>
          </div>
          <div className="graph-legend__item">
            <span className="graph-legend__dot" style={{ background: NODE_COLORS[2] }} />
            <span>3-4 links</span>
          </div>
          <div className="graph-legend__item">
            <span className="graph-legend__dot" style={{ background: NODE_COLORS[3] }} />
            <span>Hub (5+)</span>
          </div>
        </div>

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
              <span>New Image Note</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
