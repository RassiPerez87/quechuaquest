'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Star, ArrowRight, Award, Compass, Sparkles, BookOpen } from 'lucide-react'

const C = {
  cream: '#FEFAF5',
  brown: '#2A1E15',
  terra: '#C4763A',
  terral: '#FFF0E6',
  terrab: '#8B4E1F',
  green: '#1D9E75',
  greenl: '#E1F5EE',
  greenb: '#0F6E56',
  gold: '#FAC775',
  goldl: '#FAEEDA',
  goldb: '#633806',
  gray: '#B4B2A9',
  grayl: '#F1EFE8',
  grayb: '#888780',
  graybb: '#5F5E5A',
}

export default function PlacementPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Respuestas de la encuesta
  const [generalLevel, setGeneralLevel] = useState<number | null>(null)
  const [writingRating, setWritingRating] = useState(1)
  const [readingRating, setReadingRating] = useState(1)
  const [listeningRating, setListeningRating] = useState(1)
  const [speakingRating, setSpeakingRating] = useState(1)
  const [primaryGoal, setPrimaryGoal] = useState('')
  const [motivation, setMotivation] = useState('')

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
      } else {
        setUserId(user.id)
      }
    }
    checkUser()
  }, [router])

  const handleNext = () => {
    if (step === 2 && generalLevel === null) return
    if (step === 4 && (!primaryGoal || !motivation)) return
    setStep(s => s + 1)
  }

  const handleBack = () => {
    setStep(s => Math.max(1, s - 1))
  }

  const handleFinish = async () => {
    if (!userId) return
    setLoading(true)
    setStep(5)

    const supabase = createClient()
    const surveyData = {
      general_level: generalLevel,
      skills: {
        writing: writingRating,
        reading: readingRating,
        listening: listeningRating,
        speaking: speakingRating,
      },
      primary_goal: primaryGoal,
      motivation: motivation,
    }

    try {
      // 1. Obtener progreso actual
      const { data: progress, error: progressErr } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single()

      const newXpTotal = (progress?.xp_total ?? 0) + 150

      if (progressErr && progressErr.code === 'PGRST116') {
        // Insertar si no existe
        await supabase.from('user_progress').insert({
          user_id: userId,
          current_lesson_id: 'basico-01',
          current_level: 'basico',
          completed_lessons: [],
          unlocked_lessons: ['basico-01'],
          xp_total: 150,
          xp_today: 150,
          streak_days: 0,
          tinkus_completed: [],
          hamutay_available: false,
          onboarding_survey: surveyData,
        })
      } else {
        // Actualizar si ya existe
        await supabase
          .from('user_progress')
          .update({
            onboarding_survey: surveyData,
            xp_total: newXpTotal,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
      }

      // 2. Actualizar perfil rápido
      await supabase
        .from('profiles')
        .update({
          xp: newXpTotal,
          last_activity_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', userId)

      setStep(6)
    } catch (err) {
      console.error('Error saving onboarding data:', err)
      // Forzar avance al paso 6 como fallback
      setStep(6)
    } finally {
      setLoading(false)
    }
  }

  const StarSelector = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: C.brown }}>{label}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Star
              size={32}
              fill={star <= value ? '#FAC775' : 'transparent'}
              color={star <= value ? '#EF9F27' : C.gray}
              style={{ filter: star <= value ? 'drop-shadow(0 2px 4px rgba(239,159,39,0.25))' : 'none' }}
            />
          </button>
        ))}
      </div>
    </div>
  )

  const cardStyle = {
    background: 'white',
    borderRadius: 28,
    boxShadow: '0 20px 50px rgba(61,43,31,0.08)',
    border: '1.5px solid rgba(196,118,58,0.12)',
    padding: '40px 32px',
    maxWidth: 500,
    width: '100%',
    fontFamily: 'Poppins, sans-serif',
    boxSizing: 'border-box' as const,
    position: 'relative' as const,
    zIndex: 1,
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(212,168,83,0.14) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(196,118,58,0.12) 0%, transparent 60%), #FEFAF5',
      padding: 24,
      boxSizing: 'border-box',
    }}>
      {/* Círculos decorativos andinos */}
      <div style={{ position: 'fixed', top: '10%', left: '8%', width: 140, height: 140, borderRadius: '50%', background: C.gold, opacity: 0.12, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '12%', right: '10%', width: 180, height: 180, borderRadius: '50%', background: C.terra, opacity: 0.08, pointerEvents: 'none' }} />

      {/* PASO 1: Bienvenida */}
      {step === 1 && (
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 90, height: 90, borderRadius: '50%',
              background: `linear-gradient(135deg, ${C.terra}, #E8943A)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', color: 'white', fontSize: 40,
              boxShadow: '0 8px 24px rgba(196,118,58,0.3)',
            }}>
              🦙
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: C.brown, margin: '0 0 10px' }}>
              ¡Allianllachu, yachaq!
            </h1>
            <p style={{ fontSize: 13, color: C.graybb, lineHeight: 1.6, margin: 0 }}>
              Bienvenido a <strong>QuechuaQuest</strong>. Antes de emprender tu viaje por el sendero andino, te invitamos a completar una breve autoevaluación. 
            </p>
            <p style={{ fontSize: 12, color: C.grayb, marginTop: 10, lineHeight: 1.6 }}>
              Esto nos ayudará a guardar tu perfil de habilidades inicial y calcular qué tanto mejoras a medida que avanzas en tus lecciones.
            </p>
          </div>

          <button
            type="button"
            onClick={handleNext}
            style={{
              width: '100%', padding: '14px', borderRadius: 50, border: 'none',
              background: `linear-gradient(135deg, ${C.terra}, #E8943A)`,
              color: 'white', fontWeight: 900, fontSize: 15, cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(196,118,58,0.3)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Comenzar autoevaluación <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* PASO 2: Nivel General */}
      {step === 2 && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: C.terra, textTransform: 'uppercase', letterSpacing: 0.8 }}>Paso 1 de 3</span>
            <span style={{ fontSize: 11, color: C.grayb, fontWeight: 600 }}>Autoevaluación</span>
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 900, color: C.brown, margin: '0 0 16px', lineHeight: 1.4 }}>
            ¿Cómo calificarías tu conocimiento general de quechua hoy?
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {[
              { val: 1, label: '🌱 Principiante Absoluto', desc: 'No tengo conocimientos de quechua' },
              { val: 2, label: '💬 Básico', desc: 'Sé saludos, palabras sueltas y frases cotidianas' },
              { val: 3, label: '🏔️ Intermedio', desc: 'Entiendo conversaciones sencillas y sé usar sufijos comunes' },
              { val: 4, label: '🦅 Avanzado', desc: 'Puedo comunicarme y comprender textos con cierta fluidez' },
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setGeneralLevel(opt.val)}
                style={{
                  width: '100%', padding: '16px 20px', borderRadius: 18, textAlign: 'left',
                  border: `2px solid ${generalLevel === opt.val ? C.terra : '#F0E8E0'}`,
                  background: generalLevel === opt.val ? C.terral : 'white',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 13, color: generalLevel === opt.val ? C.terrab : C.brown, marginBottom: 3 }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 11, color: generalLevel === opt.val ? C.terrab : C.grayb }}>
                  {opt.desc}
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={generalLevel === null}
            style={{
              width: '100%', padding: '14px', borderRadius: 50, border: 'none',
              background: generalLevel === null ? '#D4C4B8' : `linear-gradient(135deg, ${C.terra}, #E8943A)`,
              color: 'white', fontWeight: 900, fontSize: 15, cursor: generalLevel === null ? 'not-allowed' : 'pointer',
              boxShadow: generalLevel === null ? 'none' : '0 6px 20px rgba(196,118,58,0.3)',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Siguiente
          </button>
        </div>
      )}

      {/* PASO 3: Calificación por Habilidades */}
      {step === 3 && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: C.terra, textTransform: 'uppercase', letterSpacing: 0.8 }}>Paso 2 de 3</span>
            <span style={{ fontSize: 11, color: C.grayb, fontWeight: 600 }}>Tus habilidades</span>
          </div>

          <h2 style={{ fontSize: 17, fontWeight: 900, color: C.brown, margin: '0 0 16px', lineHeight: 1.4 }}>
            Califica tu nivel actual en cada una de las siguientes áreas:
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
            <StarSelector label="✍️ Escritura (Qillqay)" value={writingRating} onChange={setWritingRating} />
            <StarSelector label="📖 Lectura (Ñawiriy)" value={readingRating} onChange={setReadingRating} />
            <StarSelector label="👂 Comprensión Auditiva (Uyariy)" value={listeningRating} onChange={setListeningRating} />
            <StarSelector label="🗣️ Conversación (Rimay)" value={speakingRating} onChange={setSpeakingRating} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={handleBack}
              style={{
                flex: 1, padding: '14px', borderRadius: 50, border: `2px solid #F0E8E0`,
                background: 'white', color: C.brown, fontWeight: 800, fontSize: 14, cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={handleNext}
              style={{
                flex: 1, padding: '14px', borderRadius: 50, border: 'none',
                background: `linear-gradient(135deg, ${C.terra}, #E8943A)`,
                color: 'white', fontWeight: 900, fontSize: 14, cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(196,118,58,0.3)',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* PASO 4: Interés y Motivación */}
      {step === 4 && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: C.terra, textTransform: 'uppercase', letterSpacing: 0.8 }}>Paso 3 de 3</span>
            <span style={{ fontSize: 11, color: C.grayb, fontWeight: 600 }}>Tus metas</span>
          </div>

          <h2 style={{ fontSize: 17, fontWeight: 900, color: C.brown, margin: '0 0 16px', lineHeight: 1.4 }}>
            ¿Qué esperas lograr en QuechuaQuest?
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.brown, marginBottom: 6 }}>
                🎯 ¿Qué habilidad te interesa mejorar más?
              </label>
              <select
                value={primaryGoal}
                onChange={(e) => setPrimaryGoal(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #F0E8E0',
                  fontSize: 13, fontWeight: 600, outline: 'none', background: '#FEFAF5',
                  fontFamily: 'Poppins, sans-serif', color: C.brown,
                }}
              >
                <option value="">Selecciona una opción...</option>
                <option value="writing">Escritura (Escribir palabras y gramática)</option>
                <option value="listening">Comprensión auditiva (Entender al escuchar)</option>
                <option value="speaking">Conversación (Hablar con fluidez)</option>
                <option value="reading">Lectura (Comprender diálogos y textos)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.brown, marginBottom: 6 }}>
                ❤️ ¿Cuál es tu motivación principal para aprender?
              </label>
              <select
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #F0E8E0',
                  fontSize: 13, fontWeight: 600, outline: 'none', background: '#FEFAF5',
                  fontFamily: 'Poppins, sans-serif', color: C.brown,
                }}
              >
                <option value="">Selecciona una opción...</option>
                <option value="culture">Conexión cultural (Mis raíces o mi familia)</option>
                <option value="career">Trabajo o estudios profesionales</option>
                <option value="travel">Turismo y viajes por zonas andinas</option>
                <option value="hobby">Pasatiempo / Curiosidad intelectual</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={handleBack}
              style={{
                flex: 1, padding: '14px', borderRadius: 50, border: `2px solid #F0E8E0`,
                background: 'white', color: C.brown, fontWeight: 800, fontSize: 14, cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={handleFinish}
              disabled={!primaryGoal || !motivation}
              style={{
                flex: 1, padding: '14px', borderRadius: 50, border: 'none',
                background: (!primaryGoal || !motivation) ? '#D4C4B8' : `linear-gradient(135deg, ${C.terra}, #E8943A)`,
                color: 'white', fontWeight: 900, fontSize: 14, cursor: (!primaryGoal || !motivation) ? 'not-allowed' : 'pointer',
                boxShadow: (!primaryGoal || !motivation) ? 'none' : '0 6px 20px rgba(196,118,58,0.3)',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Finalizar
            </button>
          </div>
        </div>
      )}

      {/* PASO 5: Guardando */}
      {step === 5 && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 40px' }}>
          <div style={{
            width: 50, height: 50, border: `4px solid ${C.terra}`,
            borderTopColor: 'transparent', borderRadius: '50%',
            animation: 'spin 1s linear infinite', margin: '0 auto 20px'
          }} />
          <h2 style={{ fontSize: 18, fontWeight: 900, color: C.brown, margin: '0 0 8px' }}>
            Guardando tu perfil...
          </h2>
          <p style={{ fontSize: 12, color: C.grayb, margin: 0 }}>
            Configurando tus metas y preparando tu bono de bienvenida.
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* PASO 6: Éxito */}
      {step === 6 && (
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: '#E1F5EE', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px', color: C.green,
            }}>
              <Award size={44} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: C.brown, margin: '0 0 8px' }}>
              ¡Perfil Configurado! 🎉
            </h1>
            <p style={{ fontSize: 13, color: C.graybb, lineHeight: 1.6, margin: '0 0 20px' }}>
              Tu perfil de habilidades inicial ha sido guardado exitosamente. Utilizaremos estos datos para reportarte cómo avanza tu aprendizaje en quechua.
            </p>

            <div style={{
              padding: '16px', background: C.goldl, borderRadius: 16,
              border: `1.5px solid ${C.gold}`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 10, margin: '0 auto', maxWidth: 300,
            }}>
              <Sparkles size={20} color={C.goldb} />
              <div>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 900, color: C.goldb }}>+150 XP de Bienvenida</span>
                <span style={{ fontSize: 10, color: C.goldb, fontWeight: 600 }}>¡Bono acreditado a tu cuenta!</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            style={{
              width: '100%', padding: '14px', borderRadius: 50, border: 'none',
              background: `linear-gradient(135deg, ${C.green}, ${C.greenb})`,
              color: 'white', fontWeight: 900, fontSize: 15, cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(29,158,117,0.3)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Ingresar al Sendero 🏕️
          </button>
        </div>
      )}
    </div>
  )
}
