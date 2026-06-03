// lib/influx.ts
import { InfluxDB, Point } from '@influxdata/influxdb-client'

// Cliente InfluxDB
const influxDB = new InfluxDB({
  url: process.env.NEXT_PUBLIC_INFLUX_URL || process.env.INFLUX_URL || '',
  token: process.env.NEXT_PUBLIC_INFLUX_TOKEN || process.env.INFLUX_TOKEN || ''
})

const writeApi = influxDB.getWriteApi(
  process.env.NEXT_PUBLIC_INFLUX_ORG || process.env.INFLUX_ORG || '',
  process.env.NEXT_PUBLIC_INFLUX_BUCKET || process.env.INFLUX_BUCKET || 'metrics',
  'ms'
)
// Configurar opciones de escritura
writeApi.useDefaultTags({ app: 'quechuaquest' })

// ============================================
// MÉTRICAS DE APRENDIZAJE
// ============================================

/**
 * Registra cuando un usuario completa una lección
 */
export async function trackLessonCompletion(
  userId: string,
  lessonId: string,
  nivel: string,
  score: number,
  timeSpentSeconds: number,
  totalExercises: number,
  correctAnswers: number
) {
  try {
    const point = new Point('lesson_completion')
      .tag('user_id', userId)
      .tag('lesson_id', lessonId)
      .tag('nivel', nivel) // basico, intermedio, avanzado
      .intField('score', Math.round(score))
      .intField('time_spent', timeSpentSeconds)
      .intField('total_exercises', totalExercises)
      .intField('correct_answers', correctAnswers)
      .floatField('accuracy', (correctAnswers / totalExercises) * 100)

    writeApi.writePoint(point)
    await writeApi.flush()
  } catch (error) {
    console.error('Error tracking lesson completion:', error)
  }
}

/**
 * Registra cada intento de ejercicio
 */
export async function trackExerciseAttempt(
  userId: string,
  lessonId: string,
  exerciseId: number,
  exerciseType: string,
  isCorrect: boolean,
  timeSpentSeconds: number,
  attemptNumber: number = 1
) {
  try {
    const point = new Point('exercise_attempt')
      .tag('user_id', userId)
      .tag('lesson_id', lessonId)
      .tag('exercise_type', exerciseType) // multiple_choice, translation_qu_es, etc.
      .intField('exercise_id', exerciseId)
      .booleanField('correct', isCorrect)
      .intField('time_spent', timeSpentSeconds)
      .intField('attempt_number', attemptNumber)

    writeApi.writePoint(point)
    await writeApi.flush()
  } catch (error) {
    console.error('Error tracking exercise attempt:', error)
  }
}

/**
 * Registra el progreso de habilidades
 */
export async function trackSkillProgress(
  userId: string,
  habilidad: string, // vocabulario, gramatica, comprension, expresion
  nivelAnterior: number,
  nivelNuevo: number
) {
  try {
    const point = new Point('skill_progress')
      .tag('user_id', userId)
      .tag('habilidad', habilidad)
      .intField('nivel_anterior', nivelAnterior)
      .intField('nivel_nuevo', nivelNuevo)
      .intField('incremento', nivelNuevo - nivelAnterior)

    writeApi.writePoint(point)
    await writeApi.flush()
  } catch (error) {
    console.error('Error tracking skill progress:', error)
  }
}

/**
 * Registra cuando se otorga un badge
 */
export async function trackBadgeEarned(
  userId: string,
  badgeId: string,
  badgeCategory: string // primer_paso, racha, maestria
) {
  try {
    const point = new Point('badge_earned')
      .tag('user_id', userId)
      .tag('badge_id', badgeId)
      .tag('category', badgeCategory)
      .intField('value', 1)

    writeApi.writePoint(point)
    await writeApi.flush()
  } catch (error) {
    console.error('Error tracking badge earned:', error)
  }
}

// ============================================
// MÉTRICAS DE ENGAGEMENT
// ============================================

/**
 * Registra inicio de sesión
 */
export async function trackUserSession(
  userId: string,
  deviceType: string = 'web'
) {
  try {
    const point = new Point('user_session')
      .tag('user_id', userId)
      .tag('device', deviceType)
      .intField('value', 1)

    writeApi.writePoint(point)
    await writeApi.flush()
  } catch (error) {
    console.error('Error tracking user session:', error)
  }
}

/**
 * Registra uso del asistente Yachaq
 */
export async function trackYachaqInteraction(
  userId: string,
  messageLength: number,
  responseTime: number
) {
  try {
    const point = new Point('yachaq_interaction')
      .tag('user_id', userId)
      .intField('message_length', messageLength)
      .intField('response_time_ms', responseTime)

    writeApi.writePoint(point)
    await writeApi.flush()
  } catch (error) {
    console.error('Error tracking Yachaq interaction:', error)
  }
}

/**
 * Registra tiempo de estudio activo
 */
export async function trackStudyTime(
  userId: string,
  lessonId: string,
  durationSeconds: number
) {
  try {
    const point = new Point('study_time')
      .tag('user_id', userId)
      .tag('lesson_id', lessonId)
      .intField('duration', durationSeconds)

    writeApi.writePoint(point)
    await writeApi.flush()
  } catch (error) {
    console.error('Error tracking study time:', error)
  }
}

// ============================================
// MÉTRICAS DEL SISTEMA
// ============================================

/**
 * Registra errores de la aplicación
 */
export async function trackError(
  errorType: string,
  errorMessage: string,
  userId?: string,
  component?: string
) {
  try {
    const point = new Point('app_error')
      .tag('error_type', errorType)
      .tag('component', component || 'unknown')
      .stringField('message', errorMessage.slice(0, 100))

    if (userId) {
      point.tag('user_id', userId)
    }

    writeApi.writePoint(point)
    await writeApi.flush()
  } catch (error) {
    console.error('Error tracking error:', error)
  }
}

/**
 * Registra tiempos de carga de páginas
 */
export async function trackPageLoad(
  pageName: string,
  loadTimeMs: number,
  userId?: string
) {
  try {
    const point = new Point('page_load')
      .tag('page', pageName)
      .intField('load_time', loadTimeMs)

    if (userId) {
      point.tag('user_id', userId)
    }

    writeApi.writePoint(point)
    await writeApi.flush()
  } catch (error) {
    console.error('Error tracking page load:', error)
  }
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Cierra la conexión de escritura (llamar al salir de la app)
 */
export async function closeInfluxConnection() {
  try {
    await writeApi.close()
  } catch (error) {
    console.error('Error closing InfluxDB connection:', error)
  }
}

/**
 * Registra métrica personalizada
 */
export async function trackCustomMetric(
  measurement: string,
  tags: Record<string, string>,
  fields: Record<string, number | string | boolean>
) {
  try {
    const point = new Point(measurement)
    
    // Agregar tags
    Object.entries(tags).forEach(([key, value]) => {
      point.tag(key, value)
    })

    // Agregar fields
    Object.entries(fields).forEach(([key, value]) => {
      if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          point.intField(key, value)
        } else {
          point.floatField(key, value)
        }
      } else if (typeof value === 'boolean') {
        point.booleanField(key, value)
      } else {
        point.stringField(key, value)
      }
    })

    writeApi.writePoint(point)
    await writeApi.flush()
  } catch (error) {
    console.error('Error tracking custom metric:', error)
  }
}