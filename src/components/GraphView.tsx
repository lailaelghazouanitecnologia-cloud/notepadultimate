import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import type { Note } from '../types'

interface GraphViewProps {
  notes: Note[]
  onOpenNote: (noteId: string) => void
}

interface NodePos {
  id: string
  title: string
  x: number
  y: number
  links: string[]
}

function extractLinks(content: string, allIds: Set<string>): string[] {
  const links: string[] = []
  // Find [[note-id]] style links
  const bracketRe = /\[\[([^\]]+)\]\]/g
  let m
  while ((m = bracketRe.exec(content)) !== null) {
    if (allIds.has(m[1])) links.push(m[1])
  }
  return links
}

export function GraphView({ notes, onOpenNote }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 })

  const allIds = useMemo(() => new Set(notes.map(n => n.id)), [notes])

  const [positions, setPositions] = useState<NodePos[]>(() => {
    const cols = Math.ceil(Math.sqrt(notes.length))
    return notes.map((n, i) => ({
      id: n.id,
      title: n.title || 'Untitled',
      x: 200 + (i % cols) * 180,
      y: 200 + Math.floor(i / cols) * 120,
      links: extractLinks(n.content, allIds),
    }))
  })

  // Update positions when notes change
  useEffect(() => {
    setPositions(prev => {
      const existing = new Map(prev.map(p => [p.id, p]))
      const cols = Math.ceil(Math.sqrt(notes.length))
      return notes.map((n, i) => {
        const ex = existing.get(n.id)
        return {
          id: n.id,
          title: n.title || 'Untitled',
          x: ex?.x ?? 200 + (i % cols) * 180,
          y: ex?.y ?? 200 + Math.floor(i / cols) * 120,
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
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true)
      panStart.current = { x: pan.x, y: pan.y, px: e.clientX, py: e.clientY }
    }
  }, [pan])

  // Edges
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
            <span>No notes to visualize</span>
          </div>
        )}
      </div>
    </div>
  )
}
