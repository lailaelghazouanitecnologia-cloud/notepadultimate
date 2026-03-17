import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { Follow, Agent, UserProfile } from '../types'
import { loadFollows, addFollow, removeFollow, loadProfile, saveProfile } from '../store'

interface SocialContextValue {
  profile: UserProfile
  updateProfile: (updates: Partial<UserProfile>) => void
  follows: Follow[]
  followUser: (targetId: string) => void
  unfollowUser: (targetId: string) => void
  isFollowing: (targetId: string) => boolean
  getFollowersOf: (userId: string) => Follow[]
  getFollowingOf: (userId: string) => Follow[]
  getFollowedAgents: (agents: Agent[]) => Agent[]
  getSuggestedAgents: (agents: Agent[]) => Agent[]
}

const SocialContext = createContext<SocialContextValue | null>(null)

export function SocialProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile())
  const [follows, setFollows] = useState<Follow[]>(() => loadFollows())

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => {
      const next = { ...prev, ...updates }
      saveProfile(next)
      return next
    })
  }, [])

  const followUser = useCallback((targetId: string) => {
    addFollow(profile.id, targetId)
    setFollows(loadFollows())
  }, [profile.id])

  const unfollowUser = useCallback((targetId: string) => {
    removeFollow(profile.id, targetId)
    setFollows(loadFollows())
  }, [profile.id])

  const isFollowing = useCallback((targetId: string) => {
    return follows.some(f => f.followerId === profile.id && f.followingId === targetId)
  }, [follows, profile.id])

  const getFollowersOf = useCallback((userId: string) => {
    return follows.filter(f => f.followingId === userId)
  }, [follows])

  const getFollowingOf = useCallback((userId: string) => {
    return follows.filter(f => f.followerId === userId)
  }, [follows])

  const getFollowedAgents = useCallback((agents: Agent[]) => {
    const followingIds = new Set(follows.filter(f => f.followerId === profile.id).map(f => f.followingId))
    return agents.filter(a => followingIds.has(a.id))
  }, [follows, profile.id])

  const getSuggestedAgents = useCallback((agents: Agent[]) => {
    const followingIds = new Set(follows.filter(f => f.followerId === profile.id).map(f => f.followingId))
    return agents.filter(a => !followingIds.has(a.id)).slice(0, 5)
  }, [follows, profile.id])

  const value = useMemo(() => ({
    profile, updateProfile,
    follows, followUser, unfollowUser, isFollowing,
    getFollowersOf, getFollowingOf,
    getFollowedAgents, getSuggestedAgents,
  }), [profile, updateProfile, follows, followUser, unfollowUser, isFollowing, getFollowersOf, getFollowingOf, getFollowedAgents, getSuggestedAgents])

  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  )
}

export function useSocialContext() {
  const ctx = useContext(SocialContext)
  if (!ctx) throw new Error('useSocialContext must be used within SocialProvider')
  return ctx
}
