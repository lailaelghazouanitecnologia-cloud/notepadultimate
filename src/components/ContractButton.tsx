import { useCallback } from 'react'

interface ContractButtonProps {
  agentId: string
  onViewContract: (agentId: string) => void
  size?: 'sm' | 'md'
}

export function ContractButton({ agentId, onViewContract, size = 'sm' }: ContractButtonProps) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onViewContract(agentId)
  }, [agentId, onViewContract])

  return (
    <button
      className={`contract-btn contract-btn--${size}`}
      onClick={handleClick}
    >
      See contract
    </button>
  )
}
