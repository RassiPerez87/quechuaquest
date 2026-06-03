// hooks/useGameSystem.ts
// QuechuaQuest - Sistema de Racha, Vidas y Notificaciones
// Maneja toda la lógica de gamificación en un solo hook

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'

// ─── Tipos ───────────────────────────────────────────────
export interface GameState {
  hearts: number        // vidas actuales (0-5)
  maxHearts: number
  streak: number        // racha en días
  longestStreak: number
  totalXP: number
  isStreakAlive: boolean
  nextHeartRefillHours: number
}

export interface Notification {
  id: string
  type: 'streak_danger' | 'streak_lost' | 'streak_milestone' | 'badge_earned'
        | 'hearts_low' | 'hearts_refilled' | 'level_up' | 'welcome_back'
  title: string
  message: string
  icon: string
  created_at: string
}

export interface ChestReward {
  type: 'badge' | 'xp' | 'streak_milestone' | 'level_up'
  title: string
  description: string
  icon: string
  xpAmount?: number
  badgeName?: string
}

export interface UseGameSystemReturn {
  gameState: GameState | null
  notifications: Notification[]
  unreadCount: number
  pendingChestReward: ChestReward | null
  loading: boolean
  // Acciones
  loseHeart: () => Promise<{ heartsLeft: number; gameOver: boolean }>
  refillHearts: () => Promise<void>
  registerActivity: (xpEarned: number) => Promise<{
    streak: number
    isNewDay: boolean
    streakBroken: boolean
    milestone: number | null
  }>
  clearChestReward: () => void
  markNotificationsRead: () => Promise<void>
  showChestReward: (reward: ChestReward) => void
  refreshGameState: () => Promise<void>
}

// ─── Hook principal ───────────────────────────────────────
export function useGameSystem(): UseGameSystemReturn {
  const supabase = createClient()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [pendingChestReward, setPendingChestReward] = useState<ChestReward | null>(null)
  const [loading, setLoading] = useState(true)
  const heartRefillTimer = useRef<NodeJS.Timeout | null>(null)

  // ── Cargar estado inicial ──────────────────────────────
  const refreshGameState = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: progress } = await supabase
      .from('user_progress')
      .select('current_streak, longest_streak, total_xp, hearts, hearts_last_refill, last_activity_date')
      .eq('user_id', user.id)
      .single()

    if (progress) {
      // Calcular si la racha está viva
      const lastActivity = progress.last_activity_date
        ? new Date(progress.last_activity_date)
        : null
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      let isStreakAlive = false
      if (lastActivity) {
        const la = new Date(lastActivity)
        la.setHours(0, 0, 0, 0)
        isStreakAlive = la >= yesterday
      }

      // Calcular próxima recarga de vida
      const lastRefill = new Date(progress.hearts_last_refill || new Date())
      const hoursSince = (Date.now() - lastRefill.getTime()) / 3600000
      const nextRefill = Math.max(0, 4 - (hoursSince % 4))

      setGameState({
        hearts: Math.min(5, progress.hearts || 5),
        maxHearts: 5,
        streak: isStreakAlive ? (progress.current_streak || 0) : 0,
        longestStreak: progress.longest_streak || 0,
        totalXP: progress.total_xp || 0,
        isStreakAlive,
        nextHeartRefillHours: nextRefill
      })
    }

    // Cargar notificaciones no leídas
    const { data: notifs } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(20)

    if (notifs) setNotifications(notifs as Notification[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    refreshGameState()

    // Verificar racha en peligro a las 8pm (check periódico)
    const checkStreakDanger = setInterval(async () => {
      const now = new Date()
      if (now.getHours() === 20 && gameState?.isStreakAlive && gameState.streak > 0) {
        // Notificación visual (no DB, es local)
        setNotifications(prev => [{
          id: 'local-streak-danger',
          type: 'streak_danger',
          title: '¡Tu racha está en peligro! 🔥',
          message: `Tienes ${gameState.streak} días de racha. ¡No la pierdas hoy!`,
          icon: '🔥',
          created_at: new Date().toISOString()
        }, ...prev])
      }
    }, 60 * 60 * 1000) // cada hora

    // Auto-recarga de vidas cada 4 horas
    heartRefillTimer.current = setInterval(() => {
      refreshGameState()
    }, 4 * 60 * 60 * 1000)

    return () => {
      clearInterval(checkStreakDanger)
      if (heartRefillTimer.current) clearInterval(heartRefillTimer.current)
    }
  }, []) // eslint-disable-line

  // ── Perder una vida ──────────────────────────────────────
  const loseHeart = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { heartsLeft: 0, gameOver: false }

    const { data } = await supabase.rpc('manage_hearts', {
      p_user_id: user.id,
      p_action: 'lose'
    })

    const heartsLeft = data?.hearts ?? 0
    setGameState(prev => prev ? { ...prev, hearts: heartsLeft } : null)

    if (heartsLeft === 1) {
      // Notificación local urgente
      const urgentNotif: Notification = {
        id: 'local-hearts-low',
        type: 'hearts_low',
        title: '¡Solo te queda 1 vida! ❤️',
        message: 'Responde con calma, ¡puedes hacerlo!',
        icon: '❤️',
        created_at: new Date().toISOString()
      }
      setNotifications(prev => [urgentNotif, ...prev])
    }

    return { heartsLeft, gameOver: heartsLeft === 0 }
  }, [supabase])

  // ── Recargar vidas ───────────────────────────────────────
  const refillHearts = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.rpc('manage_hearts', {
      p_user_id: user.id,
      p_action: 'refill'
    })

    setGameState(prev => prev ? { ...prev, hearts: 5 } : null)
    showChestReward({
      type: 'xp',
      title: '¡Vidas recargadas!',
      description: 'Tienes 5 vidas de nuevo. ¡A seguir aprendiendo!',
      icon: '❤️',
      xpAmount: 0
    })
  }, [supabase])

  // ── Registrar actividad diaria ───────────────────────────
  const registerActivity = useCallback(async (xpEarned: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { streak: 0, isNewDay: false, streakBroken: false, milestone: null }

    const { data } = await supabase.rpc('register_daily_activity', {
      p_user_id: user.id,
      p_xp_earned: xpEarned
    })

    if (data) {
      setGameState(prev => prev ? {
        ...prev,
        streak: data.streak,
        totalXP: data.total_xp,
        isStreakAlive: true
      } : null)

      // Si hay milestone → cofre especial
      if (data.milestone) {
        const milestoneRewards: Record<number, ChestReward> = {
          7:   { type: 'streak_milestone', title: '¡7 días de racha!', description: 'Una semana aprendiendo quechua. ¡Eres constante!', icon: '🔥', xpAmount: 50 },
          14:  { type: 'streak_milestone', title: '¡14 días de racha!', description: 'Dos semanas. Tu dedicación es admirable.', icon: '🔥', xpAmount: 100 },
          30:  { type: 'streak_milestone', title: '¡30 días de racha!', description: '¡Un mes completo! Eres un verdadero yachaq.', icon: '🏆', xpAmount: 200 },
          60:  { type: 'streak_milestone', title: '¡60 días de racha!', description: '¡Dos meses! La constancia es tu mayor virtud.', icon: '🌟', xpAmount: 400 },
          100: { type: 'streak_milestone', title: '¡100 días de racha!', description: '¡Cien días! Eres una leyenda del quechua.', icon: '💎', xpAmount: 500 },
          365: { type: 'streak_milestone', title: '¡Un año de racha!', description: 'Increíble. Has dedicado un año entero al quechua.', icon: '👑', xpAmount: 1000 },
        }
        const reward = milestoneRewards[data.milestone]
        if (reward) setPendingChestReward(reward)
      }

      // Si racha se rompió → notificación triste
      if (data.streak_broken) {
        await refreshGameState() // recargar notifs de DB
      }

      return {
        streak: data.streak,
        isNewDay: data.is_new_day,
        streakBroken: data.streak_broken,
        milestone: data.milestone
      }
    }

    return { streak: 0, isNewDay: false, streakBroken: false, milestone: null }
  }, [supabase, refreshGameState])

  // ── Mostrar cofre manualmente ────────────────────────────
  const showChestReward = useCallback((reward: ChestReward) => {
    setPendingChestReward(reward)
  }, [])

  const clearChestReward = useCallback(() => {
    setPendingChestReward(null)
  }, [])

  // ── Marcar notificaciones como leídas ───────────────────
  const markNotificationsRead = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.rpc('mark_notifications_read', { p_user_id: user.id })
    setNotifications([])
  }, [supabase])

  return {
    gameState,
    notifications,
    unreadCount: notifications.length,
    pendingChestReward,
    loading,
    loseHeart,
    refillHearts,
    registerActivity,
    clearChestReward,
    markNotificationsRead,
    showChestReward,
    refreshGameState
  }
}