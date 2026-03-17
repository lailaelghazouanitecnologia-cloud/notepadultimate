import { useCallback } from 'react'

interface FollowButtonProps {
  isFollowing: boolean
  onFollow: () => void
  onUnfollow: () => void
  size?: 'sm' | 'md'
}

export function FollowButton({ isFollowing, onFollow, onUnfollow, size = 'sm' }: FollowButtonProps) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (isFollowing) onUnfollow()
    else onFollow()
  }, [isFollowing, onFollow, onUnfollow])

  return (
    <button
      className={`follow-btn ${isFollowing ? 'follow-btn--following' : ''} follow-btn--${size}`}
      onClick={handleClick}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}
