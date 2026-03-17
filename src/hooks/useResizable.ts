import { useCallback, useRef } from 'react'

export function useResizable(
  value: number,
  setValue: (v: number) => void,
  opts: { min: number; max: number }
) {
  const resizingRef = useRef(false)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    resizingRef.current = true
    const startX = e.clientX
    const startW = value
    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return
      const newW = Math.max(opts.min, Math.min(opts.max, startW + ev.clientX - startX))
      setValue(newW)
    }
    const onUp = () => {
      resizingRef.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [value, setValue, opts.min, opts.max])

  return onMouseDown
}
