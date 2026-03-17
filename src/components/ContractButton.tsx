import { useCallback } from 'react'

interface ContractButtonProps {
  hasContract: boolean
  onEstablish: () => void
  onRevoke: () => void
  size?: 'sm' | 'md'
}

export function ContractButton({ hasContract, onEstablish, onRevoke, size = 'sm' }: ContractButtonProps) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasContract) onRevoke()
    else onEstablish()
  }, [hasContract, onEstablish, onRevoke])

  return (
    <button
      className={`contract-btn ${hasContract ? 'contract-btn--active' : ''} contract-btn--${size}`}
      onClick={handleClick}
    >
      {hasContract ? 'Contracted' : 'Contract'}
    </button>
  )
}
