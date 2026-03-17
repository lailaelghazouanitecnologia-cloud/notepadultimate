import { useRef, useCallback, useState, useEffect, type ReactNode } from 'react'
import type { WindowState } from '../types'
import { Icons } from '../lib/icons'

type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null

interface OSWindowProps {
  win: WindowState
  onClose: (id: string) => void
  onMinimize: (id: string) => void
  onMaximize: (id: string) => void
  onFocus: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
  onResize: (id: string, x: number, y: number, w: number, h: number) => void
  children: ReactNode
}

const MIN_W = 280
const MIN_H = 180

export function OSWindow({
  win, onClose, onMinimize, onMaximize, onFocus, onMove, onResize, children,
}: OSWindowProps) {
  const [dragging, setDragging] = useState(false)
  const [resizeEdge, setResizeEdge] = useState<ResizeEdge>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const resizeStart = useRef({ mx: 0, my: 0, x: 0, y: 0, w: 0, h: 0 })

  // ── Drag ──
  const onDragBegin = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.os-win__btn')) return
    e.preventDefault()
    onFocus(win.id)
    dragOffset.current = { x: e.clientX - win.x, y: e.clientY - win.y }
    setDragging(true)
  }, [win.id, win.x, win.y, onFocus])

  useEffect(() => {
    if (!dragging) return
    const move = (e: MouseEvent) => onMove(win.id, e.clientX - dragOffset.current.x, e.clientY - dragOffset.current.y)
    const up = () => setDragging(false)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [dragging, win.id, onMove])

  // ── Resize (all edges + corners) ──
  const onResizeBegin = useCallback((edge: ResizeEdge, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onFocus(win.id)
    resizeStart.current = { mx: e.clientX, my: e.clientY, x: win.x, y: win.y, w: win.width, h: win.height }
    setResizeEdge(edge)
  }, [win.id, win.x, win.y, win.width, win.height, onFocus])

  useEffect(() => {
    if (!resizeEdge) return
    const s = resizeStart.current
    const move = (e: MouseEvent) => {
      const dx = e.clientX - s.mx
      const dy = e.clientY - s.my
      let x = s.x, y = s.y, w = s.w, h = s.h

      if (resizeEdge.includes('e')) w = Math.max(MIN_W, s.w + dx)
      if (resizeEdge.includes('s')) h = Math.max(MIN_H, s.h + dy)
      if (resizeEdge.includes('w')) {
        const newW = Math.max(MIN_W, s.w - dx)
        x = s.x + s.w - newW
        w = newW
      }
      if (resizeEdge.includes('n')) {
        const newH = Math.max(MIN_H, s.h - dy)
        y = s.y + s.h - newH
        h = newH
      }
      onResize(win.id, x, y, w, h)
    }
    const up = () => setResizeEdge(null)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [resizeEdge, win.id, onResize])

  if (win.minimized) return null

  const isInteracting = dragging || !!resizeEdge
  const style: React.CSSProperties = win.maximized
    ? { inset: 0, width: '100%', height: '100%', zIndex: win.zIndex }
    : { left: win.x, top: win.y, width: win.width, height: win.height, zIndex: win.zIndex }

  return (
    <div
      className={`os-win ${win.maximized ? 'os-win--max' : ''} ${isInteracting ? 'os-win--interacting' : ''}`}
      style={style}
      onMouseDown={() => onFocus(win.id)}
    >
      {/* Resize edges (invisible hit areas) */}
      {!win.maximized && <>
        <div className="os-win__edge os-win__edge--n" style={{ cursor: 'ns-resize' }} onMouseDown={e => onResizeBegin('n', e)} />
        <div className="os-win__edge os-win__edge--s" style={{ cursor: 'ns-resize' }} onMouseDown={e => onResizeBegin('s', e)} />
        <div className="os-win__edge os-win__edge--e" style={{ cursor: 'ew-resize' }} onMouseDown={e => onResizeBegin('e', e)} />
        <div className="os-win__edge os-win__edge--w" style={{ cursor: 'ew-resize' }} onMouseDown={e => onResizeBegin('w', e)} />
        <div className="os-win__edge os-win__edge--nw" style={{ cursor: 'nwse-resize' }} onMouseDown={e => onResizeBegin('nw', e)} />
        <div className="os-win__edge os-win__edge--ne" style={{ cursor: 'nesw-resize' }} onMouseDown={e => onResizeBegin('ne', e)} />
        <div className="os-win__edge os-win__edge--sw" style={{ cursor: 'nesw-resize' }} onMouseDown={e => onResizeBegin('sw', e)} />
        <div className="os-win__edge os-win__edge--se" style={{ cursor: 'nwse-resize' }} onMouseDown={e => onResizeBegin('se', e)} />
      </>}

      <div className="os-win__header" onMouseDown={onDragBegin} onDoubleClick={() => onMaximize(win.id)}>
        <span className="os-win__title">{win.title}</span>
        <div className="os-win__controls">
          <button className="os-win__btn os-win__btn--min" onClick={() => onMinimize(win.id)} title="Minimize">
            <svg viewBox="0 0 10 10"><line x1="2" y1="5" x2="8" y2="5" stroke="currentColor" strokeWidth="1.2"/></svg>
          </button>
          <button className="os-win__btn os-win__btn--max" onClick={() => onMaximize(win.id)} title="Maximize">
            <svg viewBox="0 0 10 10"><rect x="2" y="2" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1"/></svg>
          </button>
          <button className="os-win__btn os-win__btn--close" onClick={() => onClose(win.id)} title="Close">
            {Icons.x()}
          </button>
        </div>
      </div>
      <div className="os-win__body">
        {children}
      </div>
    </div>
  )
}
