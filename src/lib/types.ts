export type Nivel = 'basico' | 'intermedio' | 'avanzado' | 'maestria'
export type TipoEvaluacion = 'repaso' | 'tinku' | 'hamutay' | 'diagnostico'
export type NodeStatus = 'done' | 'active' | 'locked'

export interface Profile {
  id: string; username: string; full_name: string; avatar_url?: string
  level: Nivel; xp: number; streak_days: number; last_activity: string; created_at: string
}

export interface UserProgress {
  id: string; user_id: string
  current_lesson_id: string | null; current_level: Nivel
  completed_lessons: string[]; unlocked_lessons: string[]
  xp_total: number; xp_today: number; streak_days: number
  streak_last_date: string | null; tinkus_completed: string[]
  hamutay_available: boolean; created_at: string; updated_at: string
}

export interface UserSkillProgress {
  id: string; user_id: string; skill: string; score: number
  exercises_seen: number; exercises_correct: number; updated_at: string
}

export interface Lesson {
  id: string; title: string; title_es: string; level: Nivel
  order: number; xp_reward: number; description: string
  cultural_note: string; dialogue: any[]; vocabulary: string[]
  grammar: Record<string, any>; is_active: boolean
}

export interface Exercise {
  id: string; lesson_id: string; type: string; order: number
  question: string; options: string[]; correct_answer: string
  hint: string; explanation: string
}

export interface Evaluacion {
  id: string; titulo: string; descripcion: string
  nivel: TipoEvaluacion; tiempo_limite: number; preguntas_total: number
}

export interface ResultadoEvaluacion {
  id: string; user_id: string; evaluacion_id: string; puntaje: number
  total_preguntas: number; tiempo_usado: number; aprobado: boolean; created_at: string
}

// ── Nodo del sendero andino ───────────────────────────────────
export interface PathNode {
  type: 'lesson' | 'tinku' | 'hamutay'
  subtype?: 'content' | 'practice'   // solo para type='lesson'
  status: NodeStatus
  lesson?: Lesson
  tinkuNumber?: number
  order: number
}

// ── Tipos legacy ─────────────────────────────────────────────
export interface Leccion {
  id: string; titulo: string; descripcion: string; nivel: Nivel
  orden: number; duracion_min: number; icono: string; color: string; es_premium: boolean
}
export interface ProgresoLeccion {
  id: string; user_id: string; leccion_id: string
  progreso: number; completado: boolean; completed_at?: string
}
export interface Ejercicio {
  id: string; leccion_id: string
  tipo: 'traduccion' | 'seleccion' | 'completar' | 'escuchar'
  pregunta: string; opciones?: string[]; respuesta_correcta: string
  puntos: number; orden: number
}