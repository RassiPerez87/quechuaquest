import { createClient } from '@/lib/supabase'

export async function updateStreakAndXP(userId: string, bonusXP: number = 0) {
  const supabase = createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, streak_days, last_activity_date')
    .eq('id', userId)
    .single()

  if (!profile) return { newStreak: 0, streakBonus: 0 }

  const today = new Date().toISOString().split('T')[0]
  const lastActivity = profile.last_activity_date
  
  let newStreak = profile.streak_days || 0
  let streakBonus = 0

  if (lastActivity === today) {
    // Ya practicó hoy — no cambia la racha
    newStreak = newStreak || 1
  } else if (lastActivity) {
    const last = new Date(lastActivity)
    const todayDate = new Date(today)
    const diffDays = Math.floor((todayDate.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) {
      // Practicó ayer — racha continúa
      newStreak = newStreak + 1
      streakBonus = 10 // +10 XP por mantener racha
    } else {
      // Perdió la racha
      newStreak = 1
    }
  } else {
    // Primera actividad
    newStreak = 1
  }

  // Bonus extra por rachas largas
  if (newStreak === 7) streakBonus = 25
  if (newStreak === 30) streakBonus = 100

  const totalXP = (profile.xp || 0) + bonusXP + streakBonus

  await supabase.from('profiles').update({
    xp: totalXP,
    streak_days: newStreak,
    last_activity_date: today,
  }).eq('id', userId)

  return { newStreak, streakBonus }
}