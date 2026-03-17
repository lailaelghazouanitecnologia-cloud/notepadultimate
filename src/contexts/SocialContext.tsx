import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { Follow, Agent, UserProfile } from '../types'
import { loadFollows, addFollow, removeFollow, loadProfile, saveProfile } from '../store'

interface SocialContextValue {
  profile: UserProfile
  updateProfile: (updates: Partial<UserProfile>) => void
  contracts: Follow[]
  establishContract: (targetId: string) => void
  revokeContract: (targetId: string) => void
  hasContract: (targetId: string) => boolean
  getContractsOf: (userId: string) => Follow[]
  getContractedAgents: (agents: Agent[]) => Agent[]
  getSuggestedAgents: (agents: Agent[]) => Agent[]
}

const SocialContext = createContext<SocialContextValue | null>(null)

export function SocialProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile())
  const [contracts, setContracts] = useState<Follow[]>(() => loadFollows())

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => {
      const next = { ...prev, ...updates }
      saveProfile(next)
      return next
    })
  }, [])

  const establishContract = useCallback((targetId: string) => {
    addFollow(profile.id, targetId)
    setContracts(loadFollows())
  }, [profile.id])

  const revokeContract = useCallback((targetId: string) => {
    removeFollow(profile.id, targetId)
    setContracts(loadFollows())
  }, [profile.id])

  const hasContract = useCallback((targetId: string) => {
    return contracts.some(f => f.followerId === profile.id && f.followingId === targetId)
  }, [contracts, profile.id])

  const getContractsOf = useCallback((userId: string) => {
    return contracts.filter(f => f.followerId === userId || f.followingId === userId)
  }, [contracts])

  const getContractedAgents = useCallback((agents: Agent[]) => {
    const contractedIds = new Set(contracts.filter(f => f.followerId === profile.id).map(f => f.followingId))
    return agents.filter(a => contractedIds.has(a.id))
  }, [contracts, profile.id])

  const getSuggestedAgents = useCallback((agents: Agent[]) => {
    const contractedIds = new Set(contracts.filter(f => f.followerId === profile.id).map(f => f.followingId))
    return agents.filter(a => !contractedIds.has(a.id)).slice(0, 5)
  }, [contracts, profile.id])

  const value = useMemo(() => ({
    profile, updateProfile,
    contracts, establishContract, revokeContract, hasContract,
    getContractsOf, getContractedAgents, getSuggestedAgents,
  }), [profile, updateProfile, contracts, establishContract, revokeContract, hasContract, getContractsOf, getContractedAgents, getSuggestedAgents])

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
