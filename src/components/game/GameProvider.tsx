'use client'
import { useGameSystem } from '@/hooks/useGameSystem'
import { ChestModal } from './ChestModal'
import { GameToastContainer } from './GameToast'

export function GameProvider({ children }: { children: React.ReactNode }) {
  const game = useGameSystem()

  return (
    <>
      {children}
      <ChestModal
        reward={game.pendingChestReward}
        onClose={game.clearChestReward}
      />
      {game.notifications && (
        <GameToastContainer notifications={game.notifications} />
      )}
    </>
  )
}