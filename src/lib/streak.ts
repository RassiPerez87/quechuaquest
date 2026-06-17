import { createClient } from '@/lib/supabase'

/**
 * Actualiza la racha y XP del usuario de forma robusta.
 * - Usa fechas UTC para evitar desfases de timezone
 * - Lee/escribe en user_progress (fuente de verdad) Y profiles (para UI rápida)
 * - Soporta misiones diarias
 */
export async function updateStreakAndXP(userId: string, bonusXP: number = 0) {
  const supabase = createClient()

  // Leer de las dos fuentes
  const [progressRes, profileRes] = await Promise.all([
    supabase.from('user_progress')
      .select('xp_total, xp_today, streak_days, streak_last_date, missions_today')
      .eq('user_id', userId).single(),
    supabase.from('profiles')
      .select('xp, streak_days, last_activity_date')
      .eq('id', userId).single(),
  ])

  const progress = progressRes.data
  const profile  = profileRes.data

  // Fuente de verdad: user_progress. Fallback: profiles
  const currentStreak    = progress?.streak_days ?? profile?.streak_days ?? 0
  const lastActivityRaw  = progress?.streak_last_date ?? profile?.last_activity_date ?? null

  // Comparar fechas en UTC (solo YYYY-MM-DD, sin horas)
  const todayUTC = new Date().toISOString().split('T')[0]
  const lastUTC  = lastActivityRaw ? lastActivityRaw.split('T')[0] : null

  let newStreak   = currentStreak
  let streakBonus = 0
  let isNewDay    = false

  if (lastUTC === todayUTC) {
    // Ya practicó hoy — mantener racha, no sumar día
    newStreak = Math.max(newStreak, 1)
  } else if (lastUTC) {
    // Calcular diferencia en días calendario UTC
    const last  = new Date(lastUTC + 'T00:00:00Z')
    const today = new Date(todayUTC + 'T00:00:00Z')
    const diffMs   = today.getTime() - last.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      // Practicó ayer — racha continúa ✅
      newStreak   = currentStreak + 1
      streakBonus = 10
      isNewDay    = true
    } else if (diffDays > 1) {
      // Se saltó días — racha se reinicia ❌
      newStreak   = 1
      isNewDay    = true
    }
    // diffDays === 0 ya se maneja arriba (lastUTC === todayUTC)
  } else {
    // Primera actividad del usuario
    newStreak = 1
    isNewDay  = true
  }

  // Bonus por rachas especiales
  if (newStreak === 7)  streakBonus += 25
  if (newStreak === 30) streakBonus += 100
  if (newStreak === 100) streakBonus += 500

  const currentXP = progress?.xp_total ?? profile?.xp ?? 0
  const xpToday   = isNewDay ? bonusXP + streakBonus : (progress?.xp_today ?? 0) + bonusXP + streakBonus
  const totalXP   = currentXP + bonusXP + streakBonus

  // Actualizar ambas tablas en paralelo
  await Promise.all([
    supabase.from('user_progress').upsert({
      user_id: userId,
      xp_total: totalXP,
      xp_today: xpToday,
      streak_days: newStreak,
      streak_last_date: todayUTC,
    }, { onConflict: 'user_id' }),
    supabase.from('profiles').update({
      xp: totalXP,
      streak_days: newStreak,
      last_activity_date: todayUTC,
    }).eq('id', userId),
  ])

  return { newStreak, streakBonus, isNewDay, xpToday }
}

/**
 * Obtiene el estado de la racha para mostrar en el dashboard.
 * Retorna si cada día de la semana actual fue activo o no.
 */
export async function getStreakData(userId: string) {
  const supabase = createClient()

  const { data: sessions } = await supabase
    .from('exercise_sessions')
    .select('completed_at')
    .eq('user_id', userId)
    .gte('completed_at', getWeekStart())
    .order('completed_at', { ascending: true })

  const { data: progress } = await supabase
    .from('user_progress')
    .select('streak_days, xp_today, streak_last_date')
    .eq('user_id', userId)
    .single()

  // Mapear días activos de esta semana
  const activeDays = new Set<string>()
  ;(sessions ?? []).forEach((s: any) => {
    if (s.completed_at) activeDays.add(s.completed_at.split('T')[0])
  })

  return {
    streakDays: progress?.streak_days ?? 0,
    xpToday: progress?.xp_today ?? 0,
    activeDaysThisWeek: activeDays,
    lastActivityDate: progress?.streak_last_date ?? null,
  }
}

/**
 * Obtiene el lunes de la semana actual en UTC
 */
function getWeekStart(): string {
  const now = new Date()
  const day = now.getUTCDay() // 0=Dom, 1=Lun...
  const diff = (day === 0 ? -6 : 1 - day) // retroceder al lunes
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() + diff)
  return monday.toISOString().split('T')[0]
}

/**
 * Actualiza misiones diarias en user_progress.
 * missions_today es un JSON: { lessons: 0, exercises: 0, minutes: 0 }
 */
export async function updateDailyMission(
  userId: string,
  type: 'lesson' | 'exercise' | 'minute',
  increment: number = 1
) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('user_progress')
    .select('missions_today, missions_date')
    .eq('user_id', userId)
    .single()

  // Si es un día nuevo, resetear misiones
  const isNewDay = data?.missions_date !== today
  const current = isNewDay
    ? { lessons: 0, exercises: 0, minutes: 0 }
    : (data?.missions_today ?? { lessons: 0, exercises: 0, minutes: 0 })

  const updated = {
    ...current,
    lessons:   type === 'lesson'   ? current.lessons + increment : current.lessons,
    exercises: type === 'exercise' ? current.exercises + increment : current.exercises,
    minutes:   type === 'minute'   ? current.minutes + increment : current.minutes,
  }

  await supabase.from('user_progress').update({
    missions_today: updated,
    missions_date: today,
  }).eq('user_id', userId)

  return updated
}