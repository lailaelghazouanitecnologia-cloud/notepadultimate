import { useRef, useEffect, useCallback } from 'react'
import type { Note } from '../types'
import { extractLinks } from '../lib/markdown'

interface GraphViewProps {
  notes: Note[]
  onOpenNote: (id: string) => void
}

interface GraphNode {
  id: string
  title: string
  x: number
  y: number
  vx: number
  vy: number
  connections: number
}

interface GraphEdge {
  source: string
  target: string
}

export function GraphView({ notes, onOpenNote }: GraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<GraphNode[]>([])
  const edgesRef = useRef<GraphEdge[]>([])
  const animRef = useRef<number>(0)
  const dragRef = useRef<{ node: GraphNode | null; offsetX: number; offsetY: number }>({ node: null, offsetX: 0, offsetY: 0 })
  const hoverRef = useRef<GraphNode | null>(null)
  const sizeRef = useRef({ w: 0, h: 0 })

  // Build graph data
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    sizeRef.current = { w, h }

    const edges: GraphEdge[] = []
    const titleToId = new Map(notes.map((n) => [n.title.toLowerCase(), n.id]))
    const connectionCount = new Map<string, number>()

    for (const note of notes) {
      const links = extractLinks(note.content)
      for (const link of links) {
        const targetId = titleToId.get(link.toLowerCase())
        if (targetId && targetId !== note.id) {
          edges.push({ source: note.id, target: targetId })
          connectionCount.set(note.id, (connectionCount.get(note.id) || 0) + 1)
          connectionCount.set(targetId, (connectionCount.get(targetId) || 0) + 1)
        }
      }
    }

    const cx = w / 2
    const cy = h / 2
    const nodes: GraphNode[] = notes.map((note, i) => {
      const angle = (2 * Math.PI * i) / Math.max(notes.length, 1)
      const radius = Math.min(w, h) * 0.25
      return {
        id: note.id,
        title: note.title,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        connections: connectionCount.get(note.id) || 0,
      }
    })

    nodesRef.current = nodes
    edgesRef.current = edges
  }, [notes])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    sizeRef.current = { w, h }
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    const nodes = nodesRef.current
    const edges = edgesRef.current
    const hover = hoverRef.current

    // Force simulation parameters — tuned for stability
    const repulsion = 2000
    const damping = 0.7
    const centerForce = 0.005
    const maxVelocity = 3
    const padding = 50

    // Repulsion between nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x
        const dy = nodes[j].y - nodes[i].y
        const distSq = dx * dx + dy * dy
        const dist = Math.max(Math.sqrt(distSq), 20)
        const f = repulsion / (dist * dist)
        const fx = (dx / dist) * f
        const fy = (dy / dist) * f
        nodes[i].vx -= fx
        nodes[i].vy -= fy
        nodes[j].vx += fx
        nodes[j].vy += fy
      }
    }

    // Spring force for edges
    const idealLength = 140
    for (const edge of edges) {
      const a = nodes.find((n) => n.id === edge.source)
      const b = nodes.find((n) => n.id === edge.target)
      if (!a || !b) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
      const f = 0.008 * (dist - idealLength)
      const fx = (dx / dist) * f
      const fy = (dy / dist) * f
      a.vx += fx
      a.vy += fy
      b.vx -= fx
      b.vy -= fy
    }

    // Center gravity + update positions with clamping
    for (const node of nodes) {
      if (node === dragRef.current.node) continue
      node.vx += (w / 2 - node.x) * centerForce
      node.vy += (h / 2 - node.y) * centerForce
      node.vx *= damping
      node.vy *= damping
      // Clamp velocity
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy)
      if (speed > maxVelocity) {
        node.vx = (node.vx / speed) * maxVelocity
        node.vy = (node.vy / speed) * maxVelocity
      }
      node.x += node.vx
      node.y += node.vy
      // Hard bounds
      node.x = Math.max(padding, Math.min(w - padding, node.x))
      node.y = Math.max(padding, Math.min(h - padding, node.y))
    }

    // Clear with background
    ctx.fillStyle = '#1e1e1e'
    ctx.fillRect(0, 0, w, h)

    // Draw dot grid background
    ctx.fillStyle = 'rgba(255,255,255,0.03)'
    for (let x = 0; x < w; x += 24) {
      for (let y = 0; y < h; y += 24) {
        ctx.beginPath()
        ctx.arc(x, y, 0.5, 0, 2 * Math.PI)
        ctx.fill()
      }
    }

    // Draw edges
    for (const edge of edges) {
      const a = nodes.find((n) => n.id === edge.source)
      const b = nodes.find((n) => n.id === edge.target)
      if (!a || !b) continue
      const isHighlighted = hover && (hover.id === a.id || hover.id === b.id)
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.strokeStyle = isHighlighted ? 'rgba(232,64,87,0.4)' : 'rgba(255,255,255,0.06)'
      ctx.lineWidth = isHighlighted ? 1.5 : 1
      ctx.stroke()
    }

    // Draw nodes
    for (const node of nodes) {
      const isHover = hover && hover.id === node.id
      const nodeRadius = 4 + Math.min(node.connections, 5) * 1.5
      const color = isHover ? '#e84057' : (node.connections > 0 ? '#a78bfa' : '#555')

      // Glow
      if (isHover || node.connections > 0) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, nodeRadius + 6, 0, 2 * Math.PI)
        ctx.fillStyle = isHover ? 'rgba(232,64,87,0.12)' : 'rgba(167,139,250,0.08)'
        ctx.fill()
      }

      // Node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()

      // Label
      ctx.font = `${isHover ? '500' : '400'} 11px Inter, system-ui, sans-serif`
      ctx.fillStyle = isHover ? '#e0e0e0' : '#888'
      ctx.textAlign = 'center'
      ctx.fillText(node.title, node.x, node.y + nodeRadius + 14)
    }

    animRef.current = requestAnimationFrame(draw)
  }, [])

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw])

  // Mouse interaction
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const getNode = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      return nodesRef.current.find((n) => Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2) < 14)
    }

    const onDown = (e: MouseEvent) => {
      const node = getNode(e)
      if (node) {
        const rect = canvas.getBoundingClientRect()
        dragRef.current = { node, offsetX: e.clientX - rect.left - node.x, offsetY: e.clientY - rect.top - node.y }
      }
    }

    const onMove = (e: MouseEvent) => {
      const d = dragRef.current
      if (d.node) {
        const rect = canvas.getBoundingClientRect()
        d.node.x = e.clientX - rect.left - d.offsetX
        d.node.y = e.clientY - rect.top - d.offsetY
        d.node.vx = 0
        d.node.vy = 0
      }
      const node = getNode(e)
      hoverRef.current = node || null
      canvas.style.cursor = node ? 'grab' : 'default'
    }

    const onUp = () => {
      dragRef.current.node = null
    }

    const onClick = (e: MouseEvent) => {
      const node = getNode(e)
      if (node) onOpenNote(node.id)
    }

    canvas.addEventListener('mousedown', onDown)
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseup', onUp)
    canvas.addEventListener('dblclick', onClick)
    return () => {
      canvas.removeEventListener('mousedown', onDown)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('dblclick', onClick)
    }
  }, [onOpenNote])

  return (
    <div className="content-area">
      <div className="breadcrumb">
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa' }} />
          Graph View
          <span style={{ color: 'var(--text-faint)', marginLeft: 4 }}>
            {notes.length} nodes · {edgesRef.current.length} links
          </span>
        </span>
      </div>
      <div className="graph-view">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  )
}
