import { createClient } from '@/lib/supabase'
import type { UserProgress, Lesson, PathNode } from '@/lib/types'

// ── Obtener o crear progreso del usuario ─────────────────────
export async function getUserProgress(userId: string): Promise<UserProgress | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      const { data: newProgress } = await supabase
        .from('user_progress')
        .insert({
          user_id: userId,
          current_lesson_id: 'basico-01',
          current_level: 'basico',
          completed_lessons: [],
          unlocked_lessons: ['basico-01'],
          xp_total: 0, xp_today: 0, streak_days: 0,
          tinkus_completed: [], hamutay_available: false,
        })
        .select().single()
      return newProgress
    }
    return null
  }
  return data
}

// ── Obtener todas las lecciones ordenadas ────────────────────
export async function getAllLessons(): Promise<Lesson[]> {
  const supabase = createClient()
  const levelOrder = ['basico', 'intermedio', 'avanzado', 'maestria']
  const { data, error } = await supabase
    .from('lessons').select('*').eq('is_active', true).order('order', { ascending: true })
  if (error || !data) return []
  return data.sort((a, b) => {
    const ld = levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level)
    return ld !== 0 ? ld : a.order - b.order
  })
}

// ── Construir nodos del sendero MEZCLADO ─────────────────────
// Cada lección genera 2 nodos: 'lesson' (contenido) y 'practice' (ejercicios)
// Tinku cada 5 lecciones completadas, Hamut'ay al final
export function buildPathNodes(lessons: Lesson[], progress: UserProgress): PathNode[] {
  const nodes: PathNode[] = []
  let tinkuCount = 0

  lessons.forEach((lesson, index) => {
    const isCompleted  = progress.completed_lessons.includes(lesson.id)
    const isUnlocked   = progress.unlocked_lessons.includes(lesson.id)
    const isCurrent    = progress.current_lesson_id === lesson.id

    // Estado del nodo de contenido
    const contentStatus = isCompleted ? 'done'
      : (isUnlocked || isCurrent) ? 'active'
      : 'locked'

    // Estado del nodo de práctica — disponible solo si el contenido está activo/hecho
    const practiceStatus = isCompleted ? 'done'
      : contentStatus === 'active' ? 'active'
      : 'locked'

    // Nodo 1 — CONTENIDO (leer diálogo, vocabulario, gramática)
    nodes.push({
      type: 'lesson',
      subtype: 'content',
      status: contentStatus,
      lesson,
      order: index * 2,
    })

    // Nodo 2 — PRÁCTICA (ejercicios de la lección)
    nodes.push({
      type: 'lesson',
      subtype: 'practice',
      status: practiceStatus,
      lesson,
      order: index * 2 + 1,
    })

    // Tinku cada 5 lecciones
    if ((index + 1) % 5 === 0) {
      tinkuCount++
      const tinkuId = `tinku-${tinkuCount}`
      const tinkuCompleted = progress.tinkus_completed.includes(tinkuId)
      const tinkuUnlocked  = isCompleted

      nodes.push({
        type: 'tinku',
        status: tinkuCompleted ? 'done' : tinkuUnlocked ? 'active' : 'locked',
        tinkuNumber: tinkuCount,
        order: index * 2 + 1.5,
      })
    }
  })

  // Hamut'ay al final
  nodes.push({
    type: 'hamutay',
    status: progress.hamutay_available ? 'active' : 'locked',
    order: lessons.length * 2 + 1,
  })

  return nodes
}

// ── Completar una lección ────────────────────────────────────
export async function completeLesson(
  userId: string, lessonId: string, xpEarned: number = 100
): Promise<{ nextLesson: string | null; tinkuTriggered: boolean; streakDays: number }> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('complete_lesson', {
    p_user_id: userId, p_lesson_id: lessonId, p_xp_earned: xpEarned,
  })
  if (error) return { nextLesson: null, tinkuTriggered: false, streakDays: 0 }
  return {
    nextLesson: data?.next_lesson ?? null,
    tinkuTriggered: data?.tinku_triggered ?? false,
    streakDays: data?.streak_days ?? 0,
  }
}

// ── Preguntas para Tinku ─────────────────────────────────────
export async function getTinkuQuestions(lessonIds: string[]) {
  const supabase = createClient()
  const { data } = await supabase
    .from('exercises').select('*')
    .in('lesson_id', lessonIds)
    .limit(15)
  return data ?? []
}

// ── Preguntas para Hamut'ay ──────────────────────────────────
export async function getHamutayQuestions(unlockedLessonIds: string[]) {
  const supabase = createClient()
  const { data } = await supabase
    .from('exercises').select('*')
    .in('lesson_id', unlockedLessonIds)
    .limit(25)
  return data ?? []
}

// ── Guardar resultado de evaluación ─────────────────────────
export async function saveEvaluationResult({
  userId, evaluacionId, puntaje, totalPreguntas, tiempoUsado,
}: { userId: string; evaluacionId: string; puntaje: number; totalPreguntas: number; tiempoUsado: number }) {
  const supabase = createClient()
  const aprobado = puntaje / totalPreguntas >= 0.7
  const { error } = await supabase.from('resultados_evaluaciones').insert({
    user_id: userId, evaluacion_id: evaluacionId,
    puntaje, total_preguntas: totalPreguntas, tiempo_usado: tiempoUsado, aprobado,
  })
  return { aprobado, error }
}

// ── Helpers ──────────────────────────────────────────────────
export function getLevelLabel(level: string): string {
  return { basico:'Básico', intermedio:'Intermedio', avanzado:'Avanzado', maestria:'Maestría' }[level] ?? level
}

export function getLevelColor(level: string): string {
  return { basico:'#1D9E75', intermedio:'#534AB7', avanzado:'#C4763A', maestria:'#2A1E15' }[level] ?? '#888'
}