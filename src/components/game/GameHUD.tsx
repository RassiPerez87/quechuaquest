'use client'
// components/GameHUD.tsx
// QuechuaQuest - HUD completo: Vidas + Racha + Notificaciones
// Usar en el layout principal o en el header de lecciones

import { useState, useEffect, useRef } from 'react'
import { Bell, Flame, X, ChevronRight, RefreshCw } from 'lucide-react'
import type { GameState, Notification, ChestReward } from '@/hooks/useGameSystem'

// ═══════════════════════════════════════════════════════════
// HEARTS BAR - Barra de vidas
// ═══════════════════════════════════════════════════════════
interface HeartsBarProps {
  hearts: number
  maxHearts?: number
  nextRefillHours?: number
  onRefillRequest?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export function HeartsBar({
  hearts,
  maxHearts = 5,
  nextRefillHours = 0,
  onRefillRequest,
  size = 'md'
}: HeartsBarProps) {
  const [shakeIndex, setShakeIndex] = useState<number | null>(null)

  const sizes = {
    sm: { heart: 'text-lg', gap: 'gap-0.5' },
    md: { heart: 'text-2xl', gap: 'gap-1' },
    lg: { heart: 'text-3xl', gap: 'gap-1.5' },
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`flex ${sizes[size].gap}`}>
        {Array.from({ length: maxHearts }, (_, i) => (
          <span
            key={i}
            className={`
              ${sizes[size].heart} transition-all duration-300 select-none
              ${i < hearts
                ? 'opacity-100 scale-100'
                : 'opacity-20 grayscale scale-90'
              }
              ${shakeIndex === i ? 'animate-bounce' : ''}
            `}
            style={{
              filter: i < hearts
                ? 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.6))'
                : 'none',
              transition: `all 0.3s ease ${i * 50}ms`
            }}
          >
            ❤️
          </span>
        ))}
      </div>

      {hearts < maxHearts && nextRefillHours > 0 && (
        <button
          onClick={onRefillRequest}
          className="text-xs text-amber-600 font-medium hover:text-amber-700 
                     flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full
                     border border-amber-200 hover:border-amber-300 transition-all"
          title={`Próxima vida en ${nextRefillHours.toFixed(1)}h`}
        >
          <RefreshCw size={10} />
          {Math.ceil(nextRefillHours)}h
        </button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// STREAK BADGE - Badge de racha animado
// ═══════════════════════════════════════════════════════════
interface StreakBadgeProps {
  streak: number
  isAlive: boolean
  onClick?: () => void
}

export function StreakBadge({ streak, isAlive, onClick }: StreakBadgeProps) {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    setAnimate(true)
    const t = setTimeout(() => setAnimate(false), 600)
    return () => clearTimeout(t)
  }, [streak])

  if (!isAlive && streak === 0) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full
                   bg-gray-100 border border-gray-200 text-gray-400
                   hover:bg-gray-200 transition-all cursor-pointer"
        title="Sin racha activa"
      >
        <span className="text-lg grayscale opacity-50">🔥</span>
        <span className="text-sm font-bold">0</span>
      </button>
    )
  }

  const urgency = streak >= 30 ? 'legendary' : streak >= 7 ? 'hot' : 'normal'

  const styles = {
    legendary: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-200',
    hot: 'bg-gradient-to-r from-orange-400 to-red-400 text-white shadow-md shadow-red-200',
    normal: 'bg-orange-50 border border-orange-200 text-orange-700'
  }

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-sm
        transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer
        ${styles[urgency]}
        ${animate ? 'scale-110' : 'scale-100'}
      `}
    >
      <span
        className={`text-lg ${urgency === 'legendary' ? 'animate-pulse' : ''}`}
        style={{
          filter: urgency !== 'normal'
            ? 'drop-shadow(0 0 6px rgba(255,150,0,0.8))'
            : 'none'
        }}
      >
        🔥
      </span>
      <span>{streak}</span>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════
// NOTIFICATION BELL - Campana de notificaciones
// ═══════════════════════════════════════════════════════════
interface NotificationBellProps {
  notifications: Notification[]
  unreadCount: number
  onMarkRead: () => void
}

export function NotificationBell({
  notifications,
  unreadCount,
  onMarkRead
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleOpen = () => {
    setIsOpen(v => !v)
    if (!isOpen && unreadCount > 0) {
      setTimeout(onMarkRead, 2000)
    }
  }

  const notifStyles: Record<Notification['type'], { border: string; bg: string; icon: string }> = {
    streak_danger:    { border: '#FB923C', bg: '#FFF7ED', icon: '🔥' },
    streak_lost:      { border: '#F87171', bg: '#FEF2F2', icon: '💔' },
    streak_milestone: { border: '#FBBF24', bg: '#FFFBEB', icon: '🏆' },
    badge_earned:     { border: '#A78BFA', bg: '#F5F3FF', icon: '🎖️' },
    hearts_low:       { border: '#F87171', bg: '#FEF2F2', icon: '❤️' },
    hearts_refilled:  { border: '#34D399', bg: '#F0FDF9', icon: '💚' },
    level_up:         { border: '#60A5FA', bg: '#EFF6FF', icon: '⭐' },
    welcome_back:     { border: '#2DD4BF', bg: '#F0FDFA', icon: '👋' },
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Botón campana */}
      <button
        onClick={handleOpen}
        style={{
          position: 'relative',
          padding: '7px',
          borderRadius: '50%',
          border: 'none',
          background: isOpen ? '#FFF0E6' : 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
          color: '#6B3F2A',
        }}
      >
        {/* Icono campana SVG custom */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          {unreadCount > 0 && (
            <circle cx="18" cy="5" r="4" fill="#EF4444" stroke="white" strokeWidth="1.5"/>
          )}
        </svg>

        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 2, right: 2,
            minWidth: 16, height: 16,
            background: '#EF4444',
            color: 'white',
            borderRadius: '50%',
            fontSize: 9,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
            border: '1.5px solid white',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 60,
          right: 12,
          width: 300,
          background: 'white',
          borderRadius: 18,
          boxShadow: '0 8px 32px rgba(61,43,31,0.18)',
          border: '1px solid rgba(196,118,58,0.15)',
          zIndex: 9999,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #F1EFE8',
            background: 'linear-gradient(135deg, #FFF0E6, #FFFBF5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>🔔</span>
              <span style={{ fontWeight: 800, fontSize: 13, color: '#3D2B1F' }}>Notificaciones</span>
            </div>
            {unreadCount > 0 && (
              <button onClick={onMarkRead} style={{
                fontSize: 11, color: '#C4763A', fontWeight: 700,
                background: 'none', border: 'none', cursor: 'pointer',
              }}>
                Marcar leídas ✓
              </button>
            )}
          </div>

          {/* Lista */}
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '32px 16px', color: '#B4B2A9',
              }}>
                <span style={{ fontSize: 32, marginBottom: 8 }}>✨</span>
                <p style={{ fontSize: 13, fontWeight: 600 }}>Todo al día</p>
                <p style={{ fontSize: 11, marginTop: 4 }}>Sin notificaciones nuevas</p>
              </div>
            ) : (
              notifications.map(notif => {
                const s = notifStyles[notif.type]
                return (
                  <div key={notif.id} style={{
                    display: 'flex', gap: 10, padding: '10px 14px',
                    borderBottom: '1px solid #F1EFE8',
                    borderLeft: `3px solid ${s.border}`,
                    background: s.bg,
                  }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{notif.icon || s.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 12, color: '#3D2B1F', margin: 0, lineHeight: 1.3 }}>
                        {notif.title}
                      </p>
                      <p style={{ fontSize: 11, color: '#6B3F2A', margin: '3px 0 0', lineHeight: 1.4 }}>
                        {notif.message}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '10px 16px',
            borderTop: '1px solid #F1EFE8',
            background: '#FEFAF5',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 11, color: '#B4B2A9', margin: 0 }}>
              QuechuaQuest · Sistema de notificaciones
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
// ═══════════════════════════════════════════════════════════
// GAME OVER SCREEN - Pantalla sin vidas
// ═══════════════════════════════════════════════════════════
interface GameOverScreenProps {
  onRefill: () => void
  onExit: () => void
  nextRefillHours: number
}

export function GameOverScreen({ onRefill, onExit, nextRefillHours }: GameOverScreenProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 
                    flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center
                      shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Corazones rotos */}
        <div className="flex justify-center gap-1 mb-4">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className="text-3xl grayscale opacity-30"
              style={{ animationDelay: `${i * 100}ms` }}>
              💔
            </span>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-stone-800 mb-2">
          ¡Sin vidas!
        </h2>
        <p className="text-stone-500 text-sm mb-6 leading-relaxed">
          No te preocupes, los errores son parte del aprendizaje.
          Tus vidas se recargarán pronto.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <p className="text-amber-700 text-sm font-medium">
            ⏰ Próxima recarga en {Math.ceil(nextRefillHours)} hora{nextRefillHours !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onRefill}
            className="w-full py-3 bg-gradient-to-r from-red-400 to-rose-500
                       text-white font-bold rounded-2xl hover:opacity-90
                       transition-opacity shadow-lg shadow-red-200"
          >
            ❤️ Recargar vidas ahora
          </button>
          <button
            onClick={onExit}
            className="w-full py-3 text-stone-500 font-medium hover:text-stone-700
                       transition-colors text-sm"
          >
            Salir de la lección
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// STREAK LOST MODAL - Racha perdida
// ═══════════════════════════════════════════════════════════
interface StreakLostModalProps {
  previousStreak: number
  onClose: () => void
}

export function StreakLostModal({ previousStreak, onClose }: StreakLostModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 
                    flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center
                      shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="text-6xl mb-4 animate-bounce">💔</div>

        <h2 className="text-2xl font-bold text-stone-800 mb-2">
          Tu racha se rompió
        </h2>
        <p className="text-stone-500 text-sm mb-2">
          Tenías {previousStreak} días consecutivos
        </p>
        <p className="text-stone-400 text-xs mb-6">
          Vuelve cada día para mantener tu racha
        </p>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gradient-to-r from-[#C4763A] to-[#D4A373]
                       text-white font-bold rounded-2xl hover:opacity-90 transition-opacity"
          >
            🔥 ¡Empezar de nuevo!
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// GAME HUD - Componente principal que combina todo
// Usar en el header/navbar de la app
// ═══════════════════════════════════════════════════════════
interface GameHUDProps {
  gameState: GameState
  notifications: Notification[]
  unreadCount: number
  onStreakClick?: () => void
  onNotificationsRead: () => void
  onRefillRequest?: () => void
  showXP?: boolean
}

export function GameHUD({
  gameState,
  notifications,
  unreadCount,
  onStreakClick,
  onNotificationsRead,
  onRefillRequest,
  showXP = false
}: GameHUDProps) {
  return (
    <div className="flex items-center gap-3">
      {/* XP total */}
      {showXP && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full 
                        bg-blue-50 border border-blue-200">
          <span className="text-sm">⚡</span>
          <span className="text-sm font-bold text-blue-700">{gameState.totalXP}</span>
        </div>
      )}

      {/* Vidas */}
      <HeartsBar
        hearts={gameState.hearts}
        maxHearts={gameState.maxHearts}
        nextRefillHours={gameState.nextHeartRefillHours}
        onRefillRequest={onRefillRequest}
        size="sm"
      />

      {/* Racha */}
      <StreakBadge
        streak={gameState.streak}
        isAlive={gameState.isStreakAlive}
        onClick={onStreakClick}
      />

      {/* Notificaciones */}
      <NotificationBell
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkRead={onNotificationsRead}
      />
    </div>
  )
}