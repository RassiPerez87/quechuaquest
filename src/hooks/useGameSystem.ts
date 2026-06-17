// hooks/useGameSystem.ts
// QuechuaQuest - Sistema de Racha, Vidas y Notificaciones
// Columnas corregidas para coincidir con el schema real de Supabase

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

    // CORREGIDO: usar columnas reales de user_progress
    const { data: progress } = await supabase
      .from('user_progress')
      .select('streak_days, xp_total, hearts, hearts_last_refill, streak_last_date, longest_streak')
      .eq('user_id', user.id)
      .single()

    if (progress) {
      // Calcular si la racha está viva usando UTC (mismo método que streak.ts)
      const todayUTC = new Date().toISOString().split('T')[0]
      const lastUTC  = progress.streak_last_date
        ? String(progress.streak_last_date).split('T')[0]
        : null

      let isStreakAlive = false
      if (lastUTC) {
        const last  = new Date(lastUTC  + 'T00:00:00Z')
        const today = new Date(todayUTC + 'T00:00:00Z')
        const diffDays = Math.round((today.getTime() - last.getTime()) / (1000*60*60*24))
        // Racha viva si practicó hoy (diff=0) o ayer (diff=1)
        isStreakAlive = diffDays <= 1
      }

      // Calcular próxima recarga de vida (cada 4 horas, máx 5 vidas)
      const hearts = Math.min(5, progress.hearts ?? 5)
      const lastRefillStr = progress.hearts_last_refill
      const lastRefill = lastRefillStr ? new Date(lastRefillStr) : new Date()
      const hoursSince = (Date.now() - lastRefill.getTime()) / 3_600_000
      const nextRefill = hearts >= 5 ? 0 : Math.max(0, 4 - (hoursSince % 4))

      setGameState({
        hearts,
        maxHearts: 5,
        streak: isStreakAlive ? (progress.streak_days || 0) : 0,
        longestStreak: progress.longest_streak || 0,
        totalXP: progress.xp_total || 0,
        isStreakAlive,
        nextHeartRefillHours: nextRefill,
      })
    } else {
      // Si no hay user_progress, crear estado por defecto
      setGameState({
        hearts: 5, maxHearts: 5, streak: 0,
        longestStreak: 0, totalXP: 0, isStreakAlive: false,
        nextHeartRefillHours: 0,
      })
    }

    // Cargar notificaciones desde DB
    try {
      const { data: notifs } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(20)

      if (notifs) setNotifications(notifs as Notification[])
    } catch {
      // Tabla puede no tener datos, no es crítico
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    refreshGameState()

    // Verificar racha en peligro a las 8pm (check periódico cada hora)
    const checkStreakDanger = setInterval(() => {
      const now = new Date()
      // Solo si son las 8pm ± y la racha está viva
      if (now.getHours() === 20) {
        setGameState(prev => {
          if (prev?.isStreakAlive && prev.streak > 0) {
            setNotifications(ns => {
              // No duplicar si ya existe
              if (ns.some(n => n.id === 'local-streak-danger')) return ns
              return [{
                id: 'local-streak-danger',
                type: 'streak_danger',
                title: '¡Tu racha está en peligro! 🔥',
                message: `Tienes ${prev.streak} días de racha. ¡No la pierdas hoy!`,
                icon: '🔥',
                created_at: new Date().toISOString()
              }, ...ns]
            })
          }
          return prev
        })
      }
    }, 60 * 60 * 1000) // cada hora

    // Auto-refresh de vidas cada 4 horas
    heartRefillTimer.current = setInterval(() => {
      refreshGameState()
    }, 4 * 60 * 60 * 1000)

    return () => {
      clearInterval(checkStreakDanger)
      if (heartRefillTimer.current) clearInterval(heartRefillTimer.current)
    }
  }, [refreshGameState])

  // ── Perder una vida ──────────────────────────────────────
  const loseHeart = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { heartsLeft: 0, gameOver: false }

    // Intentar RPC primero, si falla → actualización directa
    let heartsLeft = 0
    try {
      const { data } = await supabase.rpc('manage_hearts', {
        p_user_id: user.id,
        p_action: 'lose'
      })
      heartsLeft = data?.hearts ?? (gameState?.hearts ?? 5) - 1
    } catch {
      // RPC no existe → actualizar directamente
      const currentHearts = Math.max(0, (gameState?.hearts ?? 5) - 1)
      await supabase.from('user_progress').update({
        hearts: currentHearts,
      }).eq('user_id', user.id)
      heartsLeft = currentHearts
    }

    heartsLeft = Math.max(0, heartsLeft)
    setGameState(prev => prev ? { ...prev, hearts: heartsLeft } : null)

    if (heartsLeft === 1) {
      setNotifications(prev => {
        if (prev.some(n => n.id === 'local-hearts-low')) return prev
        return [{
          id: 'local-hearts-low',
          type: 'hearts_low',
          title: '¡Solo te queda 1 vida! ❤️',
          message: 'Responde con calma, ¡puedes hacerlo!',
          icon: '❤️',
          created_at: new Date().toISOString()
        }, ...prev]
      })
    }

    return { heartsLeft, gameOver: heartsLeft === 0 }
  }, [supabase, gameState])

  // ── Recargar vidas ───────────────────────────────────────
  const refillHearts = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      await supabase.rpc('manage_hearts', {
        p_user_id: user.id,
        p_action: 'refill'
      })
    } catch {
      // Fallback directo
      await supabase.from('user_progress').update({
        hearts: 5,
        hearts_last_refill: new Date().toISOString(),
      }).eq('user_id', user.id)
    }

    setGameState(prev => prev ? { ...prev, hearts: 5, nextHeartRefillHours: 4 } : null)
    setPendingChestReward({
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

    // Primero intentar RPC
    try {
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

        if (data.milestone) {
          const milestoneRewards: Record<number, ChestReward> = {
            7:   { type: 'streak_milestone', title: '¡7 días de racha!',    description: 'Una semana aprendiendo quechua.',         icon: '🔥', xpAmount: 50  },
            14:  { type: 'streak_milestone', title: '¡14 días de racha!',   description: 'Dos semanas. Tu dedicación es admirable.', icon: '🔥', xpAmount: 100 },
            30:  { type: 'streak_milestone', title: '¡30 días de racha!',   description: '¡Un mes completo! Eres un verdadero yachaq.', icon: '🏆', xpAmount: 200 },
            100: { type: 'streak_milestone', title: '¡100 días de racha!',  description: '¡Cien días! Eres una leyenda del quechua.',  icon: '💎', xpAmount: 500 },
          }
          const reward = milestoneRewards[data.milestone as number]
          if (reward) setPendingChestReward(reward)
        }

        return {
          streak: data.streak,
          isNewDay: data.is_new_day,
          streakBroken: data.streak_broken,
          milestone: data.milestone
        }
      }
    } catch {
      // RPC no existe → usar lógica UTC directa (misma que streak.ts)
    }

    // FALLBACK: lógica directa sin RPC
    const { data: prog } = await supabase
      .from('user_progress')
      .select('streak_days, xp_total, streak_last_date')
      .eq('user_id', user.id)
      .single()

    const todayUTC = new Date().toISOString().split('T')[0]
    const lastUTC  = prog?.streak_last_date
      ? String(prog.streak_last_date).split('T')[0]
      : null

    let newStreak = prog?.streak_days ?? 0
    let isNewDay  = false
    let streakBroken = false
    let milestone: number | null = null

    if (lastUTC === todayUTC) {
      // Ya practicó hoy
    } else if (lastUTC) {
      const diff = Math.round(
        (new Date(todayUTC + 'T00:00:00Z').getTime() -
         new Date(lastUTC  + 'T00:00:00Z').getTime()) / (1000*60*60*24)
      )
      if (diff === 1) {
        newStreak += 1
        isNewDay = true
        if ([7,14,30,100,365].includes(newStreak)) milestone = newStreak
      } else if (diff > 1) {
        newStreak = 1
        isNewDay = true
        streakBroken = diff > 1
      }
    } else {
      newStreak = 1
      isNewDay = true
    }

    const newXP = (prog?.xp_total ?? 0) + xpEarned

    await supabase.from('user_progress').update({
      streak_days: newStreak,
      xp_total: newXP,
      streak_last_date: todayUTC,
    }).eq('user_id', user.id)

    setGameState(prev => prev ? {
      ...prev,
      streak: newStreak,
      totalXP: newXP,
      isStreakAlive: true,
    } : null)

    if (milestone) {
      const milestoneRewards: Record<number, ChestReward> = {
        7:   { type: 'streak_milestone', title: '¡7 días de racha!',   description: 'Una semana aprendiendo quechua.',            icon: '🔥', xpAmount: 50  },
        14:  { type: 'streak_milestone', title: '¡14 días de racha!',  description: 'Dos semanas. Tu dedicación es admirable.',   icon: '🔥', xpAmount: 100 },
        30:  { type: 'streak_milestone', title: '¡30 días de racha!',  description: '¡Un mes completo!',                         icon: '🏆', xpAmount: 200 },
        100: { type: 'streak_milestone', title: '¡100 días de racha!', description: '¡Cien días! Eres una leyenda del quechua.', icon: '💎', xpAmount: 500 },
      }
      const reward = milestoneRewards[milestone]
      if (reward) setPendingChestReward(reward)
    }

    if (streakBroken) {
      setNotifications(prev => [{
        id: `streak-broken-${Date.now()}`,
        type: 'streak_lost',
        title: '¡Tu racha se rompió! 💔',
        message: 'Pero empezar de nuevo también es valioso. ¡Sigue así!',
        icon: '💔',
        created_at: new Date().toISOString()
      }, ...prev])
    }

    return { streak: newStreak, isNewDay, streakBroken, milestone }
  }, [supabase])

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

    try {
      await supabase.rpc('mark_notifications_read', { p_user_id: user.id })
    } catch {
      // Fallback: marcar manualmente
      await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
    }
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