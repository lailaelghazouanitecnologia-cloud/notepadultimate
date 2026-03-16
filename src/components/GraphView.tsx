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

  // Build graph data
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight

    const nodes: GraphNode[] = notes.map((note, i) => {
      const angle = (2 * Math.PI * i) / Math.max(notes.length, 1)
      const radius = Math.min(w, h) * 0.3
      return {
        id: note.id,
        title: note.title,
        x: w / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 40,
        y: h / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
      }
    })

    const edges: GraphEdge[] = []
    const titleToId = new Map(notes.map((n) => [n.title.toLowerCase(), n.id]))

    for (const note of notes) {
      const links = extractLinks(note.content)
      for (const link of links) {
        const targetId = titleToId.get(link.toLowerCase())
        if (targetId && targetId !== note.id) {
          edges.push({ source: note.id, target: targetId })
        }
      }
    }

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
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    const nodes = nodesRef.current
    const edges = edgesRef.current

    // Simple force simulation
    const k = 0.01 // spring constant
    const repulsion = 3000
    const damping = 0.85
    const centerForce = 0.002

    // Repulsion between nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x
        const dy = nodes[j].y - nodes[i].y
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
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
    for (const edge of edges) {
      const a = nodes.find((n) => n.id === edge.source)
      const b = nodes.find((n) => n.id === edge.target)
      if (!a || !b) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const f = k * (dist - 120)
      const fx = (dx / Math.max(dist, 1)) * f
      const fy = (dy / Math.max(dist, 1)) * f
      a.vx += fx
      a.vy += fy
      b.vx -= fx
      b.vy -= fy
    }

    // Center gravity + update positions
    for (const node of nodes) {
      if (node === dragRef.current.node) continue
      node.vx += (w / 2 - node.x) * centerForce
      node.vy += (h / 2 - node.y) * centerForce
      node.vx *= damping
      node.vy *= damping
      node.x += node.vx
      node.y += node.vy
      node.x = Math.max(40, Math.min(w - 40, node.x))
      node.y = Math.max(40, Math.min(h - 40, node.y))
    }

    // Clear
    ctx.clearRect(0, 0, w, h)

    // Draw edges
    ctx.strokeStyle = 'rgba(90,97,105,0.3)'
    ctx.lineWidth = 1
    for (const edge of edges) {
      const a = nodes.find((n) => n.id === edge.source)
      const b = nodes.find((n) => n.id === edge.target)
      if (!a || !b) continue
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }

    // Draw nodes
    for (const node of nodes) {
      // Glow
      ctx.beginPath()
      ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI)
      ctx.fillStyle = 'rgba(91,91,214,0.15)'
      ctx.fill()

      // Node
      ctx.beginPath()
      ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI)
      ctx.fillStyle = '#5b5bd6'
      ctx.fill()

      // Label
      ctx.font = '11px Inter, system-ui, sans-serif'
      ctx.fillStyle = '#b0b4ba'
      ctx.textAlign = 'center'
      ctx.fillText(node.title, node.x, node.y + 16)
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
      return nodesRef.current.find((n) => Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2) < 12)
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
      canvas.style.cursor = getNode(e) ? 'grab' : 'default'
    }

    const onUp = () => {
      if (dragRef.current.node) {
        // If barely moved, treat as click
        dragRef.current.node = null
      }
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
        <span>Graph View — {notes.length} nodes, {edgesRef.current.length} links</span>
      </div>
      <div className="graph-view">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  )
}
