'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Volume2, CheckCircle, XCircle, Zap } from 'lucide-react'

const C = {
  brown:'#2A1E15', terra:'#C4763A', terral:'#FFF0E6', terrab:'#8B4E1F',
  green:'#1D9E75', greenl:'#E1F5EE', greenb:'#0F6E56',
  purple:'#534AB7', purplel:'#EEEDFE', purpleb:'#3C3489',
  gold:'#FAC775', goldl:'#FAEEDA', goldb:'#633806', goldd:'#EF9F27',
  gray:'#B4B2A9', grayl:'#F1EFE8', grayb:'#888780', graybb:'#5F5E5A',
}

function speak(text: string) {
  if (typeof window === 'undefined') return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'es-ES'; u.rate = 0.78; u.pitch = 1.05
  window.speechSynthesis.speak(u)
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

// ── Pantalla de intro ─────────────────────────────────────────
function IntroScreen({ tipo, num, totalQ, onStart }: {
  tipo: string; num: string | null; totalQ: number; onStart: () => void
}) {
  const isTinku   = tipo === 'tinku'
  const isHamutay = tipo === 'hamutay'

  return (
    <div style={{
      maxWidth:480, margin:'0 auto', padding:'40px 16px',
      display:'flex', flexDirection:'column', alignItems:'center',
      gap:20, textAlign:'center', fontFamily:'Poppins,sans-serif',
    }}>
      

      <div style={{
        width:100, height:100, borderRadius:'50%',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:44,
        background: isTinku ? `linear-gradient(135deg,${C.purple},${C.purpleb})` : `linear-gradient(135deg,${C.brown},#4A3020)`,
        boxShadow: isTinku ? `0 8px 30px rgba(83,74,183,0.4)` : `0 8px 30px rgba(42,30,21,0.4)`,
        animation:'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {isTinku ? '◆' : '◉'}
      </div>

      <div>
        <h1 style={{fontSize:26,fontWeight:900,color:C.brown,marginBottom:6}}>
          {isTinku ? `Tinku ${num}` : "Hamut'ay"}
        </h1>
        <p style={{fontSize:14,color:C.graybb,marginBottom:4}}>
          {isTinku
            ? `Checkpoint — demuestra lo que aprendiste en las últimas 5 lecciones`
            : `Diagnóstico completo — evalúa todo tu conocimiento del quechua`}
        </p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,width:'100%'}}>
        {[
          {icon:'❓', val:`${totalQ}`, lbl:'Preguntas'},
          {icon:'⏱️', val: isTinku ? '10 min' : '20 min', lbl:'Tiempo aprox.'},
          {icon:'⚡', val: isTinku ? '+30 XP' : '+80 XP', lbl:'Recompensa'},
        ].map((s,i) => (
          <div key={i} style={{
            padding:'12px 8px', borderRadius:14, textAlign:'center',
            background: isTinku ? C.purplel : C.goldl,
            border:`1.5px solid ${isTinku ? '#AFA9EC' : C.gold}`,
          }}>
            <div style={{fontSize:18,marginBottom:4}}>{s.icon}</div>
            <p style={{fontSize:16,fontWeight:900,color: isTinku ? C.purpleb : C.goldb,margin:0}}>{s.val}</p>
            <p style={{fontSize:10,color:C.grayb,margin:'2px 0 0'}}>{s.lbl}</p>
          </div>
        ))}
      </div>

      {isHamutay && (
        <div style={{
          padding:'12px 16px', borderRadius:14,
          background:C.goldl, border:`1.5px solid ${C.gold}`,
          fontSize:12, color:C.goldb, lineHeight:1.6, width:'100%',
        }}>
          <strong>¿Qué es el Hamut'ay?</strong><br/>
          En quechua, <em>hamut'ay</em> significa reflexionar profundamente, analizar con sabiduría.
          Al completarlo, verás tu perfil de habilidades actualizado en Mi Progreso.
        </div>
      )}

      <button onClick={onStart} style={{
        width:'100%', padding:'15px', borderRadius:50, fontWeight:900, fontSize:16,
        border:'none', cursor:'pointer', fontFamily:'Poppins,sans-serif',
        background: isTinku
          ? `linear-gradient(135deg,${C.purple},${C.purpleb})`
          : `linear-gradient(135deg,${C.brown},#4A3020)`,
        color: isTinku ? '#fff' : C.gold,
        boxShadow: isTinku ? '0 6px 20px rgba(83,74,183,0.4)' : '0 6px 20px rgba(42,30,21,0.35)',
      }}>
        {isTinku ? '◆ Comenzar Tinku' : '◉ Comenzar Hamut\'ay'}
      </button>
    </div>
  )
}

// ── Ejercicio individual ──────────────────────────────────────
function ExerciseCard({ ex, onAnswer }: {
  ex: any; onAnswer: (correct: boolean) => void
}) {
  const [answer, setAnswer]     = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [wordBank, setWordBank]   = useState<string[]>([])

  useEffect(() => {
    setAnswer(''); setSubmitted(false); setSelectedWords([])
    if (ex.type === 'word_order' || ex.type === 'ordenar_palabras') {
      const opts = Array.isArray(ex.options) ? ex.options : JSON.parse(ex.options || '[]')
      setWordBank(shuffle(opts))
    }
  }, [ex.id])

  const correctAnswer = ex.correct_answer || ex.respuesta_correcta || ''

  const getOptions = (): string[] => {
    if (!ex.options) return []
    if (Array.isArray(ex.options)) return ex.options
    try { return JSON.parse(ex.options) } catch { return [] }
  }

  const canSubmit = () => {
    if (ex.type === 'word_order' || ex.type === 'ordenar_palabras') return selectedWords.length > 0
    return answer.trim().length > 0
  }

  const handleSubmit = () => {
    const userAns = (ex.type === 'word_order' || ex.type === 'ordenar_palabras')
      ? selectedWords.join(' ')
      : answer.trim()
    const ok = userAns.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
    setIsCorrect(ok)
    setSubmitted(true)
  }

  const typeLabel: Record<string,string> = {
    multiple_choice:'🔘 Selección múltiple',
    translation_qu_es:'🌐 Traduce al español',
    translation_es_qu:'🌐 Traduce al quechua',
    fill_blank:'✏️ Completa',
    word_order:'🔀 Ordena',
    ordenar_palabras:'🔀 Ordena',
    match_pairs:'🔗 Empareja',
    dialogue_complete:'💬 Diálogo',
    completar:'✏️ Completa',
    traduccion:'🌐 Traducción',
  }

  const opts = getOptions()

  return (
    <div style={{
      background:'white', borderRadius:24, border:'2px solid #F0E8E0',
      overflow:'hidden', boxShadow:'0 4px 20px rgba(61,43,31,0.08)',
      fontFamily:'Poppins,sans-serif',
    }}>
      <div style={{padding:'13px 22px',background:'#FEFAF5',borderBottom:'1px solid #F0E8E0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontSize:12,fontWeight:800,color:C.terra}}>{typeLabel[ex.type]||'📝 Ejercicio'}</span>
        <button onClick={() => speak(ex.question||'')} style={{padding:8,borderRadius:10,background:C.terral,border:`1.5px solid #F4B885`,color:C.terra,cursor:'pointer',display:'flex'}}>
          <Volume2 size={15}/>
        </button>
      </div>

      <div style={{padding:'22px 22px 18px'}}>
        <p style={{fontSize:17,fontWeight:900,color:C.brown,margin:'0 0 20px',lineHeight:1.5,whiteSpace:'pre-line'}}>
          {ex.question||ex.pregunta}
        </p>

        {/* Selección múltiple */}
        {ex.type === 'multiple_choice' && opts.length > 0 && (
          <div style={{display:'flex',flexDirection:'column',gap:9,marginBottom:16}}>
            {opts.map((opt:string,i:number) => {
              let bg='white', border='#F0E8E0', color=C.brown
              if (submitted) {
                if (opt===correctAnswer) {bg='#E8F5E2';border='#4A7A3A';color='#2D7A1F'}
                else if (opt===answer&&!isCorrect) {bg='#FFF0F0';border='#E74C3C';color='#C0392B'}
              } else if (answer===opt) {bg=C.terral;border=C.terra;color=C.terra}
              return (
                <button key={i} onClick={()=>!submitted&&setAnswer(opt)} style={{
                  padding:'12px 16px',borderRadius:12,border:`2px solid ${border}`,
                  background:bg,color,fontWeight:700,fontSize:13,textAlign:'left',
                  cursor:submitted?'default':'pointer',transition:'all 0.2s',
                  display:'flex',alignItems:'center',justifyContent:'space-between',
                }}>
                  <span>{opt}</span>
                  {submitted&&opt===correctAnswer&&<CheckCircle size={16} style={{color:'#2D7A1F'}}/>}
                  {submitted&&opt===answer&&!isCorrect&&<XCircle size={16} style={{color:'#E74C3C'}}/>}
                </button>
              )
            })}
          </div>
        )}

        {/* Texto libre */}
        {['traduccion','translation_qu_es','translation_es_qu','completar','fill_blank','dialogue_complete','completar_dialogo'].includes(ex.type) && (
          <div style={{marginBottom:16}}>
            <input type="text" value={answer}
              onChange={e=>!submitted&&setAnswer(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&!submitted&&canSubmit()&&handleSubmit()}
              disabled={submitted}
              placeholder="Tu respuesta…"
              style={{
                width:'100%',padding:'13px 16px',borderRadius:12,fontSize:14,fontWeight:600,
                outline:'none',boxSizing:'border-box',fontFamily:'Poppins,sans-serif',
                border:`2px solid ${submitted?isCorrect?'#4A7A3A':'#E74C3C':answer?C.terra:'#F0E8E0'}`,
                background:submitted?isCorrect?'#E8F5E2':'#FFF0F0':'#FEFAF5',
                color:C.brown,transition:'all 0.2s',
              }}
            />
            {submitted&&!isCorrect&&correctAnswer&&(
              <div style={{marginTop:8,padding:'10px 14px',borderRadius:10,background:C.greenl,border:`1.5px solid #A8D898`}}>
                <p style={{fontSize:11,fontWeight:700,color:C.greenb,margin:'0 0 2px'}}>✅ Respuesta correcta:</p>
                <p style={{fontSize:13,fontWeight:800,color:C.brown,margin:0}}>{correctAnswer}</p>
              </div>
            )}
          </div>
        )}

        {/* Ordenar palabras */}
        {(ex.type==='word_order'||ex.type==='ordenar_palabras') && (
          <div style={{marginBottom:16}}>
            <div style={{
              minHeight:48,padding:'8px 10px',borderRadius:12,marginBottom:8,
              border:`2px solid ${submitted?isCorrect?'#4A7A3A':'#E74C3C':C.terra}`,
              background:submitted?isCorrect?'#E8F5E2':'#FFF0F0':'#FEFAF5',
              display:'flex',flexWrap:'wrap',gap:6,alignItems:'center',
            }}>
              {selectedWords.length===0&&!submitted&&<p style={{fontSize:12,color:'#9B8070',fontStyle:'italic',margin:0}}>Toca las palabras…</p>}
              {selectedWords.map((w,i)=>(
                <button key={i} onClick={()=>{if(submitted)return;setWordBank(p=>[...p,w]);setSelectedWords(p=>p.filter((_,j)=>j!==i))}}
                  style={{padding:'6px 12px',borderRadius:8,fontWeight:800,fontSize:12,background:submitted?isCorrect?'#4A7A3A':'#E74C3C':C.terra,color:'white',border:'none',cursor:submitted?'default':'pointer'}}>
                  {w}
                </button>
              ))}
            </div>
            {!submitted&&(
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {wordBank.map((w,i)=>(
                  <button key={i} onClick={()=>{setSelectedWords(p=>[...p,w]);setWordBank(p=>p.filter((_,j)=>j!==i))}}
                    style={{padding:'6px 12px',borderRadius:8,fontWeight:700,fontSize:12,background:'white',border:'2px solid #F0E8E0',color:C.brown,cursor:'pointer'}}>
                    {w}
                  </button>
                ))}
              </div>
            )}
            {submitted&&!isCorrect&&(
              <div style={{marginTop:8,padding:'10px 14px',borderRadius:10,background:C.greenl,border:`1.5px solid #A8D898`}}>
                <p style={{fontSize:11,fontWeight:700,color:C.greenb,margin:'0 0 2px'}}>✅ Orden correcto:</p>
                <p style={{fontSize:13,fontWeight:800,color:C.brown,margin:0}}>{correctAnswer}</p>
              </div>
            )}
          </div>
        )}

        {/* Pista */}
        {ex.hint&&submitted&&(
          <div style={{padding:'8px 12px',borderRadius:10,background:'#FFF8E6',border:'1px solid #F0D080',marginBottom:12}}>
            <p style={{fontSize:11,color:'#6B3F2A',margin:0}}>💡 {ex.hint}</p>
          </div>
        )}

        {/* Feedback */}
        {submitted&&(
          <div style={{
            padding:'12px 15px',borderRadius:12,marginBottom:14,
            background:isCorrect?'#E8F5E2':'#FFF0F0',
            border:`1.5px solid ${isCorrect?'#A8D898':'#FFB8B8'}`,
          }}>
            <p style={{fontSize:14,fontWeight:900,color:isCorrect?'#2D7A1F':'#C0392B',margin:'0 0 3px'}}>
              {isCorrect?'✅ ¡Allillanmi!':'❌ ¡Ama llakichu!'}
            </p>
            {ex.explanation&&<p style={{fontSize:11,color:'#6B3F2A',lineHeight:1.5,margin:0}}>{ex.explanation}</p>}
          </div>
        )}

        <div style={{display:'flex',justifyContent:'flex-end'}}>
          {!submitted?(
            <button onClick={handleSubmit} disabled={!canSubmit()} style={{
              padding:'11px 28px',borderRadius:50,fontWeight:900,fontSize:13,border:'none',
              cursor:canSubmit()?'pointer':'not-allowed',
              background:canSubmit()?`linear-gradient(135deg,${C.terra},#E8943A)`:'#D4C4B8',
              color:canSubmit()?'white':'#9B8070',
              boxShadow:canSubmit()?'0 4px 14px rgba(196,118,58,0.35)':'none',
            }}>
              Comprobar →
            </button>
          ):(
            <button onClick={()=>onAnswer(isCorrect)} style={{
              padding:'11px 28px',borderRadius:50,fontWeight:900,fontSize:13,border:'none',
              cursor:'pointer',background:`linear-gradient(135deg,${C.terra},#E8943A)`,
              color:'white',boxShadow:'0 4px 14px rgba(196,118,58,0.35)',
            }}>
              Siguiente →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Pantalla de resultados ────────────────────────────────────
function ResultsScreen({ tipo, score, total, xp, newInsignias, onBack }: {
  tipo:string; score:number; total:number; xp:number
  newInsignias: string[]; onBack:()=>void
}) {
  const pct   = Math.round((score/total)*100)
  const emoji = pct>=80?'🏆':pct>=60?'🌟':'💪'
  const msg   = pct>=80?'¡Sumaq! ¡Excelente!':pct>=60?'¡Allillanmi! ¡Bien!':'¡Ama llakichu! Sigue'
  const isTinku = tipo==='tinku'

  return (
    <div style={{maxWidth:500,margin:'0 auto',padding:'40px 16px',fontFamily:'Poppins,sans-serif'}}>
      

      <div style={{textAlign:'center',marginBottom:24,animation:'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)'}}>
        <div style={{fontSize:72,marginBottom:12,lineHeight:1}}>{emoji}</div>
        <h2 style={{fontSize:26,fontWeight:900,color:C.brown,margin:'0 0 4px'}}>{msg}</h2>
        <p style={{fontSize:14,color:C.graybb,margin:0}}>{isTinku?"Tinku completado":"Hamut'ay completado"}</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16,animation:'fadeUp 0.4s ease 0.15s both'}}>
        {[
          {icon:'✅',val:`${score}/${total}`,lbl:'Correctas',bg:'#E8F5E2',border:'#A8D898',color:'#2D7A1F'},
          {icon:'⚡',val:`+${xp}`,lbl:'XP ganados',bg:C.goldl,border:C.gold,color:C.goldb},
          {icon:'🎯',val:`${pct}%`,lbl:'Precisión',bg:C.terral,border:'#F4B885',color:C.terrab},
        ].map((s,i)=>(
          <div key={i} style={{padding:'14px 8px',borderRadius:16,textAlign:'center',background:s.bg,border:`2px solid ${s.border}`}}>
            <div style={{fontSize:22,marginBottom:5}}>{s.icon}</div>
            <p style={{fontSize:19,fontWeight:900,color:s.color,margin:'0 0 2px'}}>{s.val}</p>
            <p style={{fontSize:10,color:C.graybb,margin:0}}>{s.lbl}</p>
          </div>
        ))}
      </div>

      {newInsignias.length>0&&(
        <div style={{
          padding:'14px 16px',borderRadius:16,marginBottom:16,
          background:C.goldl,border:`2px solid ${C.gold}`,
          animation:'fadeUp 0.4s ease 0.25s both',
        }}>
          <p style={{fontSize:13,fontWeight:800,color:C.goldb,margin:'0 0 8px'}}>
            🏅 ¡Nuevas insignias desbloqueadas!
          </p>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {newInsignias.map((n,i)=>(
              <span key={i} style={{
                fontSize:11,padding:'3px 10px',borderRadius:20,fontWeight:700,
                background:C.brown,color:C.gold,
              }}>
                {n}
              </span>
            ))}
          </div>
        </div>
      )}

      <button onClick={onBack} style={{
        width:'100%',padding:'14px',borderRadius:50,fontWeight:900,fontSize:15,
        border:'none',cursor:'pointer',fontFamily:'Poppins,sans-serif',
        background:`linear-gradient(135deg,${C.terra},#E8943A)`,
        color:'white',boxShadow:'0 5px 18px rgba(196,118,58,0.4)',
        animation:'fadeUp 0.4s ease 0.3s both',
      }}>
        ← Volver al sendero
      </button>
    </div>
  )
}

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────
function EvaluacionesInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const tipo         = searchParams.get('tipo') ?? 'tinku'
  const num          = searchParams.get('num')

  const [phase, setPhase]           = useState<'intro'|'exercises'|'results'>('intro')
  const [exercises, setExercises]   = useState<any[]>([])
  const [current, setCurrent]       = useState(0)
  const [score, setScore]           = useState(0)
  const [loading, setLoading]       = useState(false)
  const [userId, setUserId]         = useState<string|null>(null)
  const [progress, setProgress]     = useState<any>(null)
  const [finalXP, setFinalXP]       = useState(0)
  const [newInsignias, setNewInsignias] = useState<string[]>([])

  const totalQ = tipo==='hamutay' ? 25 : 15

  const loadExercises = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    setUserId(user.id)

    const { data: prog } = await supabase
      .from('user_progress').select('*').eq('user_id', user.id).single()
    setProgress(prog)

    const unlockedIds: string[] = prog?.unlocked_lessons ?? []
    const completedIds: string[] = prog?.completed_lessons ?? []

    // Para Tinku: últimas 5 lecciones; para Hamut'ay: todas las desbloqueadas
    let lessonIds: string[] = []
    if (tipo === 'tinku') {
      lessonIds = completedIds.slice(-5)
    } else {
      lessonIds = unlockedIds
    }

    if (lessonIds.length === 0) {
      setExercises([])
      setLoading(false)
      return
    }

    const { data: exs } = await supabase
      .from('exercises')
      .select('*')
      .in('lesson_id', lessonIds)

    const shuffled = shuffle(exs ?? []).slice(0, totalQ)
    setExercises(shuffled)
    setLoading(false)
  }, [tipo, totalQ, router])

  const handleAnswer = (correct: boolean) => {
    if (correct) setScore(s => s + 1)
    if (current + 1 >= exercises.length) {
      finishEvaluation(correct)
    } else {
      setCurrent(c => c + 1)
    }
  }

  const finishEvaluation = async (lastCorrect: boolean) => {
    const finalScore = score + (lastCorrect ? 1 : 0)
    const xp = tipo==='hamutay'
      ? Math.round((finalScore/exercises.length)*80)
      : Math.round((finalScore/exercises.length)*30)
    setFinalXP(xp)

    if (userId) {
      const supabase = createClient()

      // Guardar XP
      await supabase.from('user_progress')
        .update({ xp_total: (progress?.xp_total??0) + xp, updated_at: new Date().toISOString() })
        .eq('user_id', userId)

      // Para Hamut'ay: actualizar user_skill_progress
      if (tipo === 'hamutay') {
        const skillMap: Record<string,number> = {}
        exercises.forEach((ex, i) => {
          // Mapear tipo de ejercicio a habilidad (simplificado)
          const skill = ex.lesson_id?.includes('basico') ? 'saludos'
            : ex.lesson_id?.includes('intermedio') ? 'verbos'
            : ex.lesson_id?.includes('avanzado') ? 'evidencialidad'
            : 'cultura'
          if (!skillMap[skill]) skillMap[skill] = 0
        })
        // Score global del hamut'ay
        const globalScore = Math.round((finalScore/exercises.length)*100)
        const skills = ['saludos','locativos','verbos','numeros','cultura','evidencialidad','vocabulario','nominalizaciones']
        for (const skill of skills) {
          await supabase.from('user_skill_progress').upsert({
            user_id: userId, skill,
            score: globalScore,
            exercises_seen: exercises.length,
            exercises_correct: finalScore,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,skill' })
        }
      }

      // Verificar insignias
      const { data: insResult } = await supabase.rpc('check_and_award_insignias', {
        p_user_id: userId,
      })
      setNewInsignias(insResult?.awarded ?? [])
    }

    setPhase('results')
  }

  const handleStart = () => {
    loadExercises().then(() => setPhase('exercises'))
  }

  if (phase === 'intro') {
    return (
      <IntroScreen
        tipo={tipo} num={num} totalQ={totalQ}
        onStart={handleStart}
      />
    )
  }

  if (loading || exercises.length === 0) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',fontFamily:'Poppins,sans-serif'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:48,marginBottom:12}}>{tipo==='tinku'?'◆':'◉'}</div>
          <p style={{color:C.graybb,fontWeight:700}}>
            {exercises.length===0&&!loading ? 'Completa más lecciones primero' : 'Preparando preguntas…'}
          </p>
          {exercises.length===0&&!loading&&(
            <button onClick={()=>router.push('/dashboard')} style={{
              marginTop:16,padding:'10px 24px',borderRadius:50,
              background:C.terra,color:'white',border:'none',fontWeight:700,cursor:'pointer',
            }}>
              Volver al sendero
            </button>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'results') {
    return (
      <ResultsScreen
        tipo={tipo} score={score} total={exercises.length}
        xp={finalXP} newInsignias={newInsignias}
        onBack={() => router.push('/dashboard')}
      />
    )
  }

  // Fase ejercicios
  const ex = exercises[current]
  const pct = Math.round((current/exercises.length)*100)
  const isTinku = tipo==='tinku'

  return (
    <div style={{maxWidth:660,margin:'0 auto',padding:'8px 16px 60px',fontFamily:'Poppins,sans-serif'}}>
      {/* Header */}
      <div style={{
        position:'sticky',top:0,zIndex:20,
        background:'rgba(254,250,245,0.95)',backdropFilter:'blur(10px)',
        padding:'10px 0',marginBottom:16,
      }}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
          <button onClick={()=>router.push('/dashboard')} style={{
            padding:'6px 14px',borderRadius:50,background:'white',border:'1.5px solid #F4B885',
            color:'#6B3F2A',fontWeight:700,fontSize:12,cursor:'pointer',flexShrink:0,
          }}>
            ← Salir
          </button>
          <div style={{flex:1}}>
            <p style={{fontSize:11,color:C.graybb,margin:'0 0 4px',fontWeight:600}}>
              {isTinku?`Tinku ${num}`:"Hamut'ay"} · {current+1}/{exercises.length}
            </p>
            <div style={{height:7,borderRadius:3,background:'#E8E4DE',overflow:'hidden'}}>
              <div style={{
                height:'100%',borderRadius:3,width:`${pct}%`,
                background:isTinku?`linear-gradient(90deg,${C.purple},#7F77DD)`:`linear-gradient(90deg,${C.brown},${C.terra})`,
                transition:'width 0.4s ease',
              }}/>
            </div>
          </div>
          <div style={{
            display:'flex',alignItems:'center',gap:4,padding:'4px 12px',
            borderRadius:50,background:C.goldl,border:`1px solid ${C.gold}`,flexShrink:0,
          }}>
            <Zap size={12} style={{color:C.goldb}}/>
            <span style={{fontSize:12,fontWeight:900,color:C.goldb}}>{score}</span>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div style={{display:'flex',justifyContent:'center',gap:4,marginBottom:16,flexWrap:'wrap'}}>
        {exercises.map((_,i)=>(
          <div key={i} style={{
            width:8,height:8,borderRadius:'50%',transition:'all 0.3s',
            background:i<current?C.green:i===current?(isTinku?C.purple:C.brown):'#D4C4B8',
            transform:i===current?'scale(1.4)':'scale(1)',
          }}/>
        ))}
      </div>

      <ExerciseCard ex={ex} onAnswer={handleAnswer}/>
    </div>
  )
}

export default function EvaluacionesPage() {
  return (
    <Suspense fallback={
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',fontFamily:'Poppins,sans-serif'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:48,marginBottom:12}}>⏳</div>
          <p style={{color:'#5F5E5A',fontWeight:700}}>Cargando evaluación…</p>
        </div>
      </div>
    }>
      <EvaluacionesInner/>
    </Suspense>
  )
}