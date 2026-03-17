import { useRef, useCallback, useState, useEffect, type ReactNode } from 'react'
import type { WindowState } from '../types'
import { Icons } from '../lib/icons'

interface OSWindowProps {
  win: WindowState
  onClose: (id: string) => void
  onMinimize: (id: string) => void
  onMaximize: (id: string) => void
  onFocus: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
  onResize: (id: string, w: number, h: number) => void
  children: ReactNode
}

export function OSWindow({
  win, onClose, onMinimize, onMaximize, onFocus, onMove, onResize, children,
}: OSWindowProps) {
  const headerRef = useRef<HTMLDivElement>(null)
  const resizeRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const offset = useRef({ x: 0, y: 0 })

  // Drag
  const onDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.os-win__btn')) return
    e.preventDefault()
    onFocus(win.id)
    offset.current = { x: e.clientX - win.x, y: e.clientY - win.y }
    setDragging(true)
  }, [win.id, win.x, win.y, onFocus])

  useEffect(() => {
    if (!dragging) return
    const onMouseMove = (e: MouseEvent) => {
      onMove(win.id, e.clientX - offset.current.x, e.clientY - offset.current.y)
    }
    const onMouseUp = () => setDragging(false)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp) }
  }, [dragging, win.id, onMove])

  // Resize
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 })
  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onFocus(win.id)
    resizeStart.current = { x: e.clientX, y: e.clientY, w: win.width, h: win.height }
    setResizing(true)
  }, [win.id, win.width, win.height, onFocus])

  useEffect(() => {
    if (!resizing) return
    const onMouseMove = (e: MouseEvent) => {
      const w = Math.max(280, resizeStart.current.w + (e.clientX - resizeStart.current.x))
      const h = Math.max(200, resizeStart.current.h + (e.clientY - resizeStart.current.y))
      onResize(win.id, w, h)
    }
    const onMouseUp = () => setResizing(false)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp) }
  }, [resizing, win.id, onResize])

  if (win.minimized) return null

  const style: React.CSSProperties = win.maximized
    ? { inset: 0, width: '100%', height: '100%', zIndex: win.zIndex }
    : { left: win.x, top: win.y, width: win.width, height: win.height, zIndex: win.zIndex }

  return (
    <div
      className={`os-win ${win.maximized ? 'os-win--max' : ''} ${dragging ? 'os-win--dragging' : ''}`}
      style={style}
      onMouseDown={() => onFocus(win.id)}
    >
      <div className="os-win__header" ref={headerRef} onMouseDown={onDragStart}>
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
      {!win.maximized && (
        <div className="os-win__resize" ref={resizeRef} onMouseDown={onResizeStart} />
      )}
    </div>
  )
}
