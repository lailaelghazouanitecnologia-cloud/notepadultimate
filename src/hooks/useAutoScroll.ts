import { useEffect, useRef, useCallback, useState } from 'react'

export function useAutoScroll(dependencies: unknown[] = []) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const userScrolledRef = useRef(false)

  const scrollToBottom = useCallback((smooth = true) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'instant',
      })
    }
  }, [])

  // Auto-scroll when dependencies change and user hasn't scrolled up
  useEffect(() => {
    if (isAtBottom && !userScrolledRef.current) {
      scrollToBottom(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)

  // Track scroll position
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    const threshold = 100
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
    setIsAtBottom(atBottom)
    userScrolledRef.current = !atBottom
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return { scrollRef, scrollToBottom, isAtBottom }
}
