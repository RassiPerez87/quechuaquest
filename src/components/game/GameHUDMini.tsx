'use client'
import { useGameSystem } from '@/hooks/useGameSystem'
import { HeartsBar, NotificationBell } from './GameHUD'

export function GameHUDMini({ userId }: { userId?: string }) {
  const game = useGameSystem()
  if (!game.gameState) return null

  return (
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <HeartsBar
        hearts={game.gameState.hearts}
        maxHearts={5}
        nextRefillHours={game.gameState.nextHeartRefillHours}
        onRefillRequest={game.refillHearts}
        size="sm"
      />
      <NotificationBell
        notifications={game.notifications}
        unreadCount={game.unreadCount}
        onMarkRead={game.markNotificationsRead}
      />
    </div>
  )
}