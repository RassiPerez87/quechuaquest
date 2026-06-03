'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, ArrowRight, Volume2, CheckCircle, XCircle, Zap } from 'lucide-react'

// ── Paleta ────────────────────────────────────────────────────
const C = {
  brown:'#2A1E15', terra:'#C4763A', terral:'#FFF0E6', terrab:'#8B4E1F',
  green:'#1D9E75', greenl:'#E1F5EE', greenb:'#0F6E56',
  gold:'#FAC775', goldl:'#FAEEDA', goldb:'#633806',
  gray:'#B4B2A9', grayl:'#F1EFE8', graybb:'#5F5E5A',
}

// ── TTS ───────────────────────────────────────────────────────
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

// ── Barra de progreso superior ────────────────────────────────
function TopBar({ phase, step, totalSteps, lessonTitle, onBack }: {
  phase: 'content'|'exercises'|'victory'
  step: number; totalSteps: number
  lessonTitle: string; onBack: () => void
}) {
  const pct = phase === 'content' ? 0
    : phase === 'exercises' ? Math.round((step / totalSteps) * 100)
    : 100

  return (
    <div style={{
      position:'sticky', top:0, zIndex:20,
      background:'rgba(254,250,245,0.97)', backdropFilter:'blur(10px)',
      borderBottom:`1px solid rgba(196,118,58,0.12)`,
      padding:'10px 20px', display:'flex', flexDirection:'column', gap:8,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={onBack} style={{
          display:'flex', alignItems:'center', gap:5,
          padding:'6px 14px', borderRadius:50,
          background:'white', border:'1.5px solid #F4B885',
          color:'#6B3F2A', fontWeight:700, fontSize:13, cursor:'pointer',
        }}>
          <ArrowLeft size={14}/> Volver
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.graybb, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {lessonTitle}
          </p>
        </div>
        {phase === 'exercises' && (
          <span style={{
            fontSize:12, fontWeight:700, padding:'4px 12px',
            borderRadius:50, background:C.goldl, color:C.goldb, flexShrink:0,
          }}>
            {step + 1}/{totalSteps}
          </span>
        )}
      </div>

      {/* Barra de progreso */}
      <div style={{ height:6, borderRadius:3, background:'#E8E4DE', overflow:'hidden' }}>
        <div style={{
          height:'100%', borderRadius:3,
          background: phase === 'victory'
            ? `linear-gradient(90deg,${C.green},${C.greenb})`
            : `linear-gradient(90deg,${C.terra},#E8943A)`,
          width:`${pct}%`,
          transition:'width 0.4s ease',
        }}/>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// FASE 1 — CONTENIDO DE LA LECCIÓN
// ═══════════════════════════════════════════════════════════════
function ContentPhase({ lesson, onStartExercises }: { lesson: any; onStartExercises: () => void }) {
  const [tab, setTab] = useState<'dialogo'|'vocabulario'|'gramatica'>('dialogo')
  const [speaking, setSpeaking] = useState<string|null>(null)

  const tabs = [
    { key:'dialogo',     label:'💬 Diálogo'    },
    { key:'vocabulario', label:'📝 Vocabulario' },
    { key:'gramatica',   label:'📖 Gramática'   },
  ]
  const tabOrder: Array<typeof tab> = ['dialogo','vocabulario','gramatica']
  const tabIdx = tabOrder.indexOf(tab)

  const handleSpeak = (text: string, key: string) => {
    setSpeaking(key)
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'es-ES'; u.rate = 0.78; u.pitch = 1.0
    u.onend = () => setSpeaking(null)
    window.speechSynthesis.speak(u)
  }

  const levelColors: Record<string,{bg:string;text:string}> = {
    basico:     {bg:'#1D9E75', text:'#fff'},
    intermedio: {bg:'#534AB7', text:'#fff'},
    avanzado:   {bg:'#C4763A', text:'#fff'},
    maestria:   {bg:'#2A1E15', text:'#FAC775'},
  }
  const lc = levelColors[lesson.level] ?? levelColors.basico

  return (
    <div style={{ maxWidth:760, margin:'0 auto', padding:'20px 16px 40px' }}>
      {/* Header de la lección */}
      <div style={{
        padding:'24px 28px', borderRadius:24, marginBottom:20,
        background:`linear-gradient(135deg,${C.brown},#4A3020,${C.terra})`,
        color:'white',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, flexWrap:'wrap' }}>
          <span style={{
            padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:800,
            background: lc.bg, color: lc.text,
          }}>
            {lesson.level === 'basico' ? '🌱' : lesson.level === 'intermedio' ? '🏔️' : lesson.level === 'avanzado' ? '🦅' : '⭐'} {lesson.level?.charAt(0).toUpperCase() + lesson.level?.slice(1)} · Lección {lesson.order}
          </span>
          <span style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:800, background:'rgba(255,255,255,0.2)' }}>
            ⚡ {lesson.xp_reward} XP
          </span>
          <span style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:800, background:'rgba(255,255,255,0.15)' }}>
            📝 12 ejercicios
          </span>
        </div>
        <h1 style={{ fontSize:24, fontWeight:900, margin:'0 0 4px' }}>{lesson.title_es || lesson.title}</h1>
        <p style={{ fontSize:14, opacity:0.8, margin:'0 0 14px', lineHeight:1.5 }}>{lesson.description}</p>
        <button onClick={() => handleSpeak(lesson.title_es || lesson.title, 'title')} style={{
          display:'flex', alignItems:'center', gap:6,
          padding:'7px 16px', borderRadius:50,
          background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.3)',
          color:'white', fontWeight:700, fontSize:12, cursor:'pointer',
        }}>
          <Volume2 size={14}/>
          {speaking === 'title' ? 'Reproduciendo…' : 'Escuchar pronunciación'}
        </button>
      </div>

      {/* Nota cultural */}
      {lesson.cultural_note && (
        <div style={{
          padding:'14px 18px', borderRadius:16, marginBottom:20,
          background:'#FFF8E6', border:'1.5px solid #F0D080',
          display:'flex', gap:12,
        }}>
          <span style={{ fontSize:20, flexShrink:0 }}>🏔️</span>
          <div>
            <p style={{ fontSize:11, fontWeight:800, color:'#A07830', margin:'0 0 3px', textTransform:'uppercase', letterSpacing:1 }}>Nota cultural andina</p>
            <p style={{ fontSize:13, color:'#6B3F2A', lineHeight:1.7, margin:0 }}>{lesson.cultural_note}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display:'flex', gap:4, marginBottom:0,
        background:'white', borderRadius:'16px 16px 0 0',
        padding:'10px 10px 0', border:'1.5px solid #F0E8E0', borderBottom:'none',
      }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} style={{
            padding:'9px 16px', borderRadius:'10px 10px 0 0', fontWeight:800, fontSize:13,
            border:'none', cursor:'pointer', transition:'all 0.2s',
            background: tab === t.key ? '#FEFAF5' : 'transparent',
            color: tab === t.key ? C.terra : '#9B8070',
            borderBottom: tab === t.key ? `3px solid ${C.terra}` : '3px solid transparent',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Contenido tab */}
      <div style={{
        background:'#FEFAF5', borderRadius:'0 0 20px 20px',
        padding:24, border:'1.5px solid #F0E8E0', borderTop:'none', marginBottom:20,
        minHeight:240,
      }}>

        {/* DIÁLOGO */}
        {tab === 'dialogo' && (() => {
          // Soporta: array directo, {lines:[...]}, {dialogue:{lines:[...]}}
          const raw = lesson.dialogue
          const lines: any[] = Array.isArray(raw)
            ? raw
            : Array.isArray(raw?.lines)
              ? raw.lines
              : Array.isArray(raw?.dialogue?.lines)
                ? raw.dialogue.lines
                : []
          return (
          <div>
            {lines.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {lines.map((line: any, i: number) => {
                  const isA = line.speaker === 'A' || i % 2 === 0
                  return (
                    <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', flexDirection: isA ? 'row' : 'row-reverse' }}>
                      <div style={{
                        width:36, height:36, borderRadius:'50%', flexShrink:0,
                        background: isA ? `linear-gradient(135deg,${C.terra},#D4A853)` : `linear-gradient(135deg,#7A9E6E,#4A7A3A)`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        color:'white', fontWeight:900, fontSize:14,
                      }}>
                        {line.speaker || (isA ? 'A' : 'B')}
                      </div>
                      <div style={{
                        maxWidth:'68%', padding:'11px 15px',
                        borderRadius: isA ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                        background: isA ? 'white' : C.greenl,
                        border:`1.5px solid ${isA ? '#F4B885' : '#A8D898'}`,
                      }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:3 }}>
                          <p style={{ fontSize:14, fontWeight:800, color:C.brown, margin:0, flex:1 }}>
                            {line.quechua || line.text || line.q || ''}
                          </p>
                          <button onClick={() => handleSpeak(line.quechua || line.text || '', `dl-${i}`)} style={{
                            background:'none', border:'none', cursor:'pointer', padding:3, flexShrink:0,
                          }}>
                            <Volume2 size={13} style={{ color: speaking === `dl-${i}` ? C.terra : C.gray }}/>
                          </button>
                        </div>
                        <p style={{ fontSize:12, color:'#6B3F2A', fontStyle:'italic', margin:0 }}>
                          {line.spanish || line.es || line.s || ''}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'40px 20px', color:C.graybb }}>
                <p style={{ fontSize:14 }}>El diálogo de esta lección se practica directamente en los ejercicios.</p>
                <p style={{ fontSize:13, marginTop:8, opacity:0.7 }}>Pasa a vocabulario o gramática para prepararte.</p>
              </div>
            )}
          </div>
          )
        })()}

        {/* VOCABULARIO */}
        {tab === 'vocabulario' && (
          <div>
            {(() => {
              const vocab: any[] = Array.isArray(lesson.vocabulary) ? lesson.vocabulary : []
              return (<>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <p style={{ fontSize:14, fontWeight:800, color:C.brown, margin:0 }}>
                {vocab.length} palabras clave
              </p>
              <p style={{ fontSize:11, color:'#9B8070', fontWeight:600 }}>🔊 Toca para escuchar</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:8 }}>
              {vocab.map((v: any, i: number) => {
                const word = typeof v === 'string' ? v : (v.quechua || v.word || v)
                const trans = typeof v === 'string' ? '' : (v.spanish || v.es || v.translation || '')
                return (
                  <button key={i} onClick={() => handleSpeak(word, `v-${i}`)} style={{
                    padding:'12px 14px', borderRadius:12, cursor:'pointer',
                    background: speaking === `v-${i}` ? C.terral : 'white',
                    border:`1.5px solid ${speaking === `v-${i}` ? '#F4B885' : '#F0E8E0'}`,
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    textAlign:'left', transition:'all 0.2s',
                    transform: speaking === `v-${i}` ? 'scale(1.02)' : 'scale(1)',
                  }}>
                    <div>
                      <p style={{ fontSize:14, fontWeight:800, color:C.terra, margin:'0 0 2px' }}>{word}</p>
                      {trans && <p style={{ fontSize:11, color:'#6B3F2A', margin:0 }}>{trans}</p>}
                    </div>
                    <Volume2 size={14} style={{ color: speaking === `v-${i}` ? C.terra : C.gray, flexShrink:0 }}/>
                  </button>
                )
              })}
            </div>
            {vocab.length === 0 && (
              <div style={{ textAlign:'center', padding:'40px 20px', color:C.graybb }}>
                <p style={{ fontSize:14 }}>El vocabulario se trabaja en los ejercicios de esta lección.</p>
              </div>
            )}
            </>)
            })()}
          </div>
        )}

        {/* GRAMÁTICA */}
        {tab === 'gramatica' && (
          <div>
            {lesson.grammar && typeof lesson.grammar === 'object' ? (
              <div>
                {lesson.grammar.title && (
                  <h3 style={{ fontSize:15, fontWeight:900, color:C.brown, marginBottom:8 }}>{lesson.grammar.title}</h3>
                )}
                {lesson.grammar.explanation && (
                  <div style={{ padding:'14px 18px', background:'#FFF8E6', borderRadius:12, border:'1px solid #F0D080', marginBottom:16 }}>
                    <p style={{ fontSize:13, color:'#6B3F2A', lineHeight:1.7, margin:0 }}>{lesson.grammar.explanation}</p>
                  </div>
                )}
                {/* Sufijos */}
                {lesson.grammar.sufijos && (
                  <div style={{ marginBottom:16 }}>
                    <p style={{ fontSize:11, fontWeight:800, color:'#A07830', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Sufijos</p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                      {lesson.grammar.sufijos.map((s: string, i: number) => (
                        <span key={i} style={{ padding:'6px 14px', borderRadius:20, background:C.greenl, border:`1px solid ${C.green}`, fontSize:13, fontWeight:700, color:C.greenb }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Ejemplos */}
                {lesson.grammar.ejemplos && (
                  <div>
                    <p style={{ fontSize:11, fontWeight:800, color:'#A07830', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Ejemplos</p>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {lesson.grammar.ejemplos.map((e: string, i: number) => (
                        <div key={i} style={{
                          padding:'10px 14px', borderRadius:12,
                          background: i%2===0 ? C.greenl : 'white',
                          border:'1px solid #F0E8E0', display:'flex',
                          alignItems:'center', justifyContent:'space-between',
                        }}>
                          <p style={{ fontSize:13, fontWeight:700, color:C.brown, margin:0 }}>{e}</p>
                          <button onClick={() => handleSpeak(e.split('=')[0].trim(), `ge-${i}`)} style={{ background:'none', border:'none', cursor:'pointer', padding:3 }}>
                            <Volume2 size={13} style={{ color: speaking === `ge-${i}` ? C.terra : C.gray }}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Conjugación */}
                {lesson.grammar.conjugation && Array.isArray(lesson.grammar.conjugation) && (
                  <div style={{ marginTop:16 }}>
                    <p style={{ fontSize:11, fontWeight:800, color:'#A07830', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Conjugación</p>
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      {lesson.grammar.conjugation.map((c: any, i: number) => (
                        <div key={i} style={{
                          display:'grid', gridTemplateColumns:'1fr auto 2fr',
                          gap:12, padding:'10px 14px', borderRadius:10, alignItems:'center',
                          background: i%2===0 ? 'white' : '#FEFAF5', border:'1px solid #F0E8E0',
                        }}>
                          <span style={{ fontSize:12, color:'#6B3F2A' }}>{c.pronoun}</span>
                          <span style={{ fontSize:14, fontWeight:800, color:C.terra, padding:'2px 10px', background:C.terral, borderRadius:8 }}>{c.form}</span>
                          <span style={{ fontSize:12, color:C.brown, fontStyle:'italic' }}>{c.example}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Verbos y derivaciones */}
                {lesson.grammar.derivaciones && (
                  <div style={{ marginBottom:16 }}>
                    <p style={{ fontSize:11, fontWeight:800, color:'#A07830', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Derivaciones</p>
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      {lesson.grammar.derivaciones.map((d: string, i: number) => (
                        <div key={i} style={{ padding:'8px 14px', borderRadius:10, background: i%2===0 ? C.greenl : 'white', border:'1px solid #F0E8E0' }}>
                          <p style={{ fontSize:13, fontWeight:600, color:C.brown, margin:0 }}>{d}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Formas */}
                {lesson.grammar.formas && (
                  <div style={{ marginBottom:16 }}>
                    <p style={{ fontSize:11, fontWeight:800, color:'#A07830', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Formas</p>
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      {lesson.grammar.formas.map((f: string, i: number) => (
                        <div key={i} style={{ padding:'8px 14px', borderRadius:10, background: i%2===0 ? '#EEEDFE' : 'white', border:'1px solid #CECBF6' }}>
                          <p style={{ fontSize:13, fontWeight:600, color:'#3C3489', margin:0 }}>{f}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'40px 20px', color:C.graybb }}>
                <p style={{ fontSize:14 }}>La gramática se practica en los ejercicios de esta lección.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navegación entre tabs */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        {tabIdx > 0 ? (
          <button onClick={() => setTab(tabOrder[tabIdx-1])} style={{
            display:'flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:50,
            background:'white', border:'1.5px solid #F4B885', color:'#6B3F2A', fontWeight:700, fontSize:13, cursor:'pointer',
          }}>
            <ArrowLeft size={15}/> Anterior
          </button>
        ) : <div/>}

        {tabIdx < 2 ? (
          <button onClick={() => setTab(tabOrder[tabIdx+1])} style={{
            display:'flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:50,
            background:`linear-gradient(135deg,${C.terra},#E8943A)`, color:'white',
            fontWeight:800, fontSize:13, cursor:'pointer', border:'none',
            boxShadow:`0 4px 14px rgba(196,118,58,0.35)`,
          }}>
            Siguiente <ArrowRight size={15}/>
          </button>
        ) : (
          /* Botón principal — ir a ejercicios */
          <button onClick={onStartExercises} style={{
            display:'flex', alignItems:'center', gap:8, padding:'13px 28px', borderRadius:50,
            background:`linear-gradient(135deg,${C.green},${C.greenb})`, color:'white',
            fontWeight:900, fontSize:15, cursor:'pointer', border:'none',
            boxShadow:`0 5px 18px rgba(29,158,117,0.4)`,
            animation:'pulse 2s ease-in-out infinite',
          }}>
            <Zap size={18}/> ¡Practicar ahora! (+{lesson.xp_reward} XP)
          </button>
        )}
      </div>

      {/* Atajo: ir directo a ejercicios */}
      {tabIdx < 2 && (
        <div style={{ textAlign:'center' }}>
          <button onClick={onStartExercises} style={{
            background:'none', border:'none', cursor:'pointer',
            fontSize:12, color:C.graybb, fontWeight:600, textDecoration:'underline',
          }}>
            Saltar al contenido e ir directo a ejercicios →
          </button>
        </div>
      )}

      
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// FASE 2 — EJERCICIOS
// ═══════════════════════════════════════════════════════════════
function ExercisePhase({ exercises, lessonXP, onFinish }: {
  exercises: any[]; lessonXP: number
  onFinish: (score: number, xp: number) => void
}) {
  const [current, setCurrent]       = useState(0)
  const [answer, setAnswer]         = useState('')
  const [submitted, setSubmitted]   = useState(false)
  const [isCorrect, setIsCorrect]   = useState(false)
  const [score, setScore]           = useState(0)
  const [showHint, setShowHint]     = useState(false)
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [wordBank, setWordBank]     = useState<string[]>([])
  const [matchedPairs, setMatchedPairs] = useState<Record<string,string>>({})
  const [selectedLeft, setSelectedLeft] = useState<string|null>(null)
  const [wrongPair, setWrongPair]   = useState<string|null>(null)
  const [leftItems, setLeftItems]   = useState<string[]>([])
  const [rightItems, setRightItems] = useState<string[]>([])

  const ex = exercises[current]

  useEffect(() => {
    if (!ex) return
    setAnswer(''); setShowHint(false); setSelectedWords([]); setMatchedPairs({})
    setSelectedLeft(null); setWrongPair(null)
    if (ex.type === 'word_order' || ex.type === 'ordenar_palabras') {
      const opts = Array.isArray(ex.options) ? ex.options : (ex.palabras ?? [])
      setWordBank(shuffle(typeof opts[0] === 'string' ? opts : opts.map((o: any) => String(o))))
    }
    if (ex.type === 'match_pairs') {
      const opts = Array.isArray(ex.options) ? ex.options : JSON.parse(ex.options || '[]')
      setLeftItems(opts.map((o: any) => o.left))
      setRightItems(shuffle(opts.map((o: any) => o.right)))
    }
  }, [current, ex])

  if (!ex) return null

  const typeLabel: Record<string,string> = {
    multiple_choice:    '🔘 Selección múltiple',
    traduccion:         '🌐 Traducción',
    translation_qu_es:  '🌐 Traduce al español',
    translation_es_qu:  '🌐 Traduce al quechua',
    completar:          '✏️ Completa la frase',
    fill_blank:         '✏️ Completa la frase',
    ordenar_palabras:   '🔀 Ordena las palabras',
    word_order:         '🔀 Ordena las palabras',
    match_pairs:        '🔗 Empareja',
    completar_dialogo:  '💬 Completa el diálogo',
    dialogue_complete:  '💬 Completa el diálogo',
  }

  const getOptions = (): any[] => {
    if (!ex.options) return []
    if (Array.isArray(ex.options)) return ex.options
    try { return JSON.parse(ex.options) } catch { return [] }
  }

  const canSubmit = () => {
    if (ex.type === 'match_pairs') {
      // Calcular total de pares directamente desde ex.options para evitar race condition
      const opts = Array.isArray(ex.options) ? ex.options 
        : (typeof ex.options === 'string' ? JSON.parse(ex.options || '[]') : [])
      const totalPairs = Array.isArray(opts) ? opts.length : 0
      return totalPairs > 0 && Object.keys(matchedPairs).length === totalPairs
    }
    if (ex.type === 'word_order' || ex.type === 'ordenar_palabras') return selectedWords.length > 0
    return answer.trim().length > 0
  }

  const handleSubmit = () => {
    let userAnswer = ''
    if (ex.type === 'word_order' || ex.type === 'ordenar_palabras') {
      userAnswer = selectedWords.join(' ')
    } else if (ex.type === 'match_pairs') {
      const opts = getOptions()
      const totalPairs = opts.length
      const allCorrect = totalPairs > 0 && opts.every((o: any) => matchedPairs[o.left] === o.right)
      const correct = allCorrect && Object.keys(matchedPairs).length === totalPairs
      setIsCorrect(correct)
      setSubmitted(true)
      if (correct) setScore(s => s + 1)
      return
    } else {
      userAnswer = answer.trim()
    }
    if (!userAnswer) return

    const correct = userAnswer.toLowerCase().trim() === (ex.correct_answer || ex.respuesta_correcta || '').toLowerCase().trim()
    // También verificar respuestas aceptables
    const accepted = ex.respuestas_aceptables
      ? (Array.isArray(ex.respuestas_aceptables) ? ex.respuestas_aceptables : JSON.parse(ex.respuestas_aceptables || '[]'))
          .some((a: string) => a.toLowerCase().trim() === userAnswer.toLowerCase().trim())
      : false

    const isOk = correct || accepted
    setIsCorrect(isOk)
    setSubmitted(true)
    if (isOk) setScore(s => s + 1)
  }

  const handleNext = () => {
    const isLast = current + 1 >= exercises.length
    if (isLast) {
      const finalScore = score + (isCorrect ? 1 : 0)
      const xp = Math.max(10, Math.round((finalScore / exercises.length) * lessonXP))
      onFinish(finalScore, xp)
    } else {
      setCurrent(c => c + 1)
      setSubmitted(false)
    }
  }

  const opts = getOptions()
  const correctAnswer = ex.correct_answer || ex.respuesta_correcta || ''

  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'20px 16px 40px' }}>
      

      {/* Mini progreso dots */}
      <div style={{ display:'flex', justifyContent:'center', gap:5, marginBottom:20, flexWrap:'wrap' }}>
        {exercises.map((_,i) => (
          <div key={i} style={{
            width:10, height:10, borderRadius:'50%', transition:'all 0.3s',
            background: i < current ? C.green : i === current ? C.terra : '#D4C4B8',
            transform: i === current ? 'scale(1.3)' : 'scale(1)',
          }}/>
        ))}
      </div>

      {/* Tarjeta del ejercicio */}
      <div style={{
        background:'white', borderRadius:28, border:'2px solid #F0E8E0',
        overflow:'hidden', boxShadow:'0 4px 24px rgba(61,43,31,0.08)',
        animation:'slideUp 0.3s ease',
      }}>
        {/* Header del ejercicio */}
        <div style={{
          padding:'14px 24px', background:'#FEFAF5',
          borderBottom:'1px solid #F0E8E0',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <span style={{ fontSize:12, fontWeight:800, color:C.terra }}>
            {typeLabel[ex.type] || '📝 Ejercicio'}
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 12px', borderRadius:50, background:C.goldl, border:`1px solid ${C.gold}` }}>
            <Zap size={12} style={{ color:C.goldb }}/>
            <span style={{ fontSize:12, fontWeight:900, color:C.goldb }}>{score} ✓</span>
          </div>
        </div>

        <div style={{ padding:'24px 24px 20px' }}>
          {/* Pregunta */}
          <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:22 }}>
            <p style={{
              flex:1, fontSize:18, fontWeight:900, color:C.brown,
              lineHeight:1.5, margin:0, whiteSpace:'pre-line',
            }}>
              {ex.question || ex.pregunta}
            </p>
            <button onClick={() => speak(ex.question || ex.pregunta)} style={{
              padding:9, borderRadius:12, background:C.terral, border:`1.5px solid #F4B885`,
              color:C.terra, cursor:'pointer', flexShrink:0, display:'flex',
            }}>
              <Volume2 size={17}/>
            </button>
          </div>

          {/* SELECCIÓN MÚLTIPLE */}
          {ex.type === 'multiple_choice' && opts.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18 }}>
              {opts.map((opt: string, i: number) => {
                let bg='white', border='#F0E8E0', color=C.brown
                if (submitted) {
                  if (opt === correctAnswer)       { bg='#E8F5E2'; border='#4A7A3A'; color='#2D7A1F' }
                  else if (opt === answer && !isCorrect) { bg='#FFF0F0'; border='#E74C3C'; color='#C0392B' }
                } else if (answer === opt) { bg=C.terral; border=C.terra; color=C.terra }
                return (
                  <button key={i} onClick={() => !submitted && setAnswer(opt)} style={{
                    padding:'13px 18px', borderRadius:14, border:`2px solid ${border}`,
                    background:bg, color, fontWeight:700, fontSize:14, textAlign:'left',
                    cursor: submitted ? 'default' : 'pointer', transition:'all 0.2s',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    animation: submitted && !isCorrect && opt === answer ? 'shake 0.3s ease' : 'none',
                  }}>
                    <span>{opt}</span>
                    {submitted && opt === correctAnswer && <CheckCircle size={17} style={{color:'#2D7A1F'}}/>}
                    {submitted && opt === answer && !isCorrect && <XCircle size={17} style={{color:'#E74C3C'}}/>}
                  </button>
                )
              })}
            </div>
          )}

          {/* TEXTO LIBRE */}
          {['traduccion','translation_qu_es','translation_es_qu','completar','fill_blank','completar_dialogo','dialogue_complete'].includes(ex.type) && (
            <div style={{ marginBottom:18 }}>
              <input
                type="text" value={answer}
                onChange={e => !submitted && setAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !submitted && canSubmit() && handleSubmit()}
                placeholder={
                  ex.type.includes('dialogo') || ex.type.includes('dialogue') ? 'Escribe la respuesta del diálogo…'
                  : ex.type.includes('complet') || ex.type.includes('fill') ? 'Completa la frase…'
                  : ex.type.includes('es_qu') ? 'Traduce al quechua…'
                  : 'Traduce al español…'
                }
                disabled={submitted}
                style={{
                  width:'100%', padding:'15px 18px', borderRadius:14, fontSize:15,
                  fontWeight:600, outline:'none', boxSizing:'border-box',
                  fontFamily:'Poppins, sans-serif', transition:'all 0.2s',
                  border:`2px solid ${submitted ? isCorrect ? '#4A7A3A' : '#E74C3C' : answer ? C.terra : '#F0E8E0'}`,
                  background: submitted ? isCorrect ? '#E8F5E2' : '#FFF0F0' : '#FEFAF5',
                  color:C.brown,
                  animation: submitted && !isCorrect ? 'shake 0.3s ease' : 'none',
                }}
              />
              {submitted && !isCorrect && correctAnswer && (
                <div style={{ marginTop:10, padding:'11px 15px', borderRadius:12, background:C.greenl, border:`1.5px solid #A8D898` }}>
                  <p style={{ fontSize:12, fontWeight:700, color:C.greenb, margin:'0 0 2px' }}>✅ Respuesta correcta:</p>
                  <p style={{ fontSize:14, fontWeight:800, color:C.brown, margin:0 }}>{correctAnswer}</p>
                </div>
              )}
            </div>
          )}

          {/* ORDENAR PALABRAS */}
          {(ex.type === 'word_order' || ex.type === 'ordenar_palabras') && (
            <div style={{ marginBottom:18 }}>
              {/* Zona de respuesta */}
              <div style={{
                minHeight:52, padding:'10px 12px', borderRadius:14, marginBottom:10,
                border:`2px solid ${submitted ? isCorrect ? '#4A7A3A' : '#E74C3C' : C.terra}`,
                background: submitted ? isCorrect ? '#E8F5E2' : '#FFF0F0' : '#FEFAF5',
                display:'flex', flexWrap:'wrap', gap:8, alignItems:'center',
              }}>
                {selectedWords.length === 0 && !submitted && (
                  <p style={{ fontSize:13, color:'#9B8070', fontStyle:'italic', margin:0 }}>Toca las palabras para ordenarlas…</p>
                )}
                {selectedWords.map((w,i) => (
                  <button key={i} onClick={() => {
                    if (submitted) return
                    setWordBank(prev => [...prev, w])
                    setSelectedWords(prev => prev.filter((_,j) => j!==i))
                  }} style={{
                    padding:'7px 13px', borderRadius:10, fontWeight:800, fontSize:13,
                    background: submitted ? isCorrect ? '#4A7A3A' : '#E74C3C' : C.terra,
                    color:'white', border:'none', cursor: submitted ? 'default' : 'pointer',
                  }}>
                    {w}
                  </button>
                ))}
              </div>
              {/* Banco de palabras */}
              {!submitted && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {wordBank.map((w,i) => (
                    <button key={i} onClick={() => {
                      setSelectedWords(prev => [...prev, w])
                      setWordBank(prev => prev.filter((_,j) => j!==i))
                    }} style={{
                      padding:'7px 13px', borderRadius:10, fontWeight:700, fontSize:13,
                      background:'white', border:'2px solid #F0E8E0', color:C.brown,
                      cursor:'pointer', transition:'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor=C.terra; e.currentTarget.style.background=C.terral }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='#F0E8E0'; e.currentTarget.style.background='white' }}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              )}
              {submitted && !isCorrect && correctAnswer && (
                <div style={{ marginTop:10, padding:'11px 15px', borderRadius:12, background:C.greenl, border:`1.5px solid #A8D898` }}>
                  <p style={{ fontSize:12, fontWeight:700, color:C.greenb, margin:'0 0 2px' }}>✅ Orden correcto:</p>
                  <p style={{ fontSize:14, fontWeight:800, color:C.brown, margin:0 }}>{correctAnswer}</p>
                </div>
              )}
            </div>
          )}

          {/* EMPAREJAR */}
          {ex.type === 'match_pairs' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>
              <div>
                <p style={{ fontSize:10, fontWeight:800, color:'#9B8070', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Quechua</p>
                {leftItems.map((item,i) => {
                  const matched = !!matchedPairs[item]
                  const sel = selectedLeft === item
                  return (
                    <button key={i} onClick={() => { if (!submitted && !matched) { setSelectedLeft(item); setWrongPair(null) } }} style={{
                      width:'100%', marginBottom:8, padding:'11px 13px', borderRadius:12,
                      fontWeight:700, fontSize:13, textAlign:'left', cursor: matched||submitted ? 'default' : 'pointer',
                      border:`2px solid ${submitted ? matched ? '#4A7A3A' : '#E74C3C' : sel ? C.terra : matched ? '#4A7A3A' : '#F0E8E0'}`,
                      background: submitted ? matched ? '#E8F5E2' : '#FFF0F0' : sel ? C.terral : matched ? '#E8F5E2' : 'white',
                      color: matched ? '#2D7A1F' : sel ? C.terra : C.brown,
                      transition:'all 0.2s',
                    }}>
                      {item} {matched && '✓'}
                    </button>
                  )
                })}
              </div>
              <div>
                <p style={{ fontSize:10, fontWeight:800, color:'#9B8070', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Español</p>
                {rightItems.map((item,i) => {
                  const matched = Object.values(matchedPairs).includes(item)
                  const isWrong = wrongPair === item
                  return (
                    <button key={i} onClick={() => {
                      if (submitted || !selectedLeft || matched) return
                      const matchOpts: Array<{left:string;right:string}> = getOptions()
                      const pair = matchOpts.find((o) => o.left === selectedLeft)
                      const correctRight: string | undefined = pair?.right
                      if (correctRight !== undefined && correctRight === item && selectedLeft) {
                        setMatchedPairs(prev => ({ ...prev, [selectedLeft!]: item }))
                        setSelectedLeft(null)
                      } else {
                        setWrongPair(item)
                        setTimeout(() => { setWrongPair(null); setSelectedLeft(null) }, 700)
                      }
                    }} style={{
                      width:'100%', marginBottom:8, padding:'11px 13px', borderRadius:12,
                      fontWeight:700, fontSize:13, textAlign:'left',
                      cursor: matched||submitted ? 'default' : 'pointer',
                      border:`2px solid ${isWrong ? '#E74C3C' : submitted ? matched ? '#4A7A3A' : '#E74C3C' : matched ? '#4A7A3A' : selectedLeft ? '#F4B885' : '#F0E8E0'}`,
                      background: isWrong ? '#FFF0F0' : submitted ? matched ? '#E8F5E2' : '#FFF0F0' : matched ? '#E8F5E2' : 'white',
                      color: matched ? '#2D7A1F' : C.brown,
                      transition:'all 0.2s',
                      animation: isWrong ? 'shake 0.3s ease' : 'none',
                    }}>
                      {item} {matched && '✓'}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Pista */}
          {(ex.hint || ex.pista) && !submitted && (
            <button onClick={() => setShowHint(!showHint)} style={{
              fontSize:12, fontWeight:700, color:'#9B8070', background:'none',
              border:'none', cursor:'pointer', marginBottom:12,
              display:'flex', alignItems:'center', gap:4,
            }}>
              💡 {showHint ? 'Ocultar pista' : 'Ver pista'}
            </button>
          )}
          {showHint && (ex.hint || ex.pista) && (
            <div style={{ padding:'10px 14px', borderRadius:10, background:'#FFF8E6', border:'1px solid #F0D080', marginBottom:14 }}>
              <p style={{ fontSize:12, color:'#6B3F2A', margin:0 }}>💡 {ex.hint || ex.pista}</p>
            </div>
          )}

          {/* Feedback */}
          {submitted && (
            <div style={{
              padding:'13px 17px', borderRadius:14, marginBottom:16,
              background: isCorrect ? '#E8F5E2' : '#FFF0F0',
              border:`1.5px solid ${isCorrect ? '#A8D898' : '#FFB8B8'}`,
            }}>
              <p style={{ fontSize:15, fontWeight:900, color: isCorrect ? '#2D7A1F' : '#C0392B', margin:'0 0 4px' }}>
                {isCorrect ? '✅ ¡Allillanmi! ¡Correcto!' : '❌ Mana allinchu. ¡Ama llakichu!'}
              </p>
              {(ex.explanation || ex.explicacion) && (
                <p style={{ fontSize:12, color:'#6B3F2A', lineHeight:1.5, margin:0 }}>
                  {ex.explanation || ex.explicacion}
                </p>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            {!submitted ? (
              <button onClick={handleSubmit} disabled={!canSubmit()} style={{
                padding:'12px 30px', borderRadius:50, fontWeight:900, fontSize:14,
                border:'none', cursor: canSubmit() ? 'pointer' : 'not-allowed',
                background: canSubmit() ? `linear-gradient(135deg,${C.terra},#E8943A)` : '#D4C4B8',
                color: canSubmit() ? 'white' : '#9B8070',
                boxShadow: canSubmit() ? '0 4px 16px rgba(196,118,58,0.35)' : 'none',
                transition:'all 0.2s',
              }}>
                Comprobar →
              </button>
            ) : (
              <button onClick={handleNext} style={{
                padding:'12px 30px', borderRadius:50, fontWeight:900, fontSize:14,
                border:'none', cursor:'pointer',
                background: `linear-gradient(135deg,${C.terra},#E8943A)`,
                color:'white', boxShadow:'0 4px 16px rgba(196,118,58,0.35)',
              }}>
                {current + 1 >= exercises.length ? '🏆 Ver resultados' : 'Siguiente →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// FASE 3 — PANTALLA DE VICTORIA
// ═══════════════════════════════════════════════════════════════
function VictoryPhase({ lesson, score, total, xp, streak, tinkuTriggered, onGoToPath }: {
  lesson: any; score: number; total: number; xp: number
  streak: number; tinkuTriggered: boolean; onGoToPath: () => void
}) {
  const pct = Math.round((score / total) * 100)
  const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '🌟' : pct >= 50 ? '💪' : '📚'
  const msg   = pct >= 90 ? '¡Excelente! ¡Sumaq!' : pct >= 70 ? '¡Muy bien! ¡Allillanmi!' : pct >= 50 ? '¡Bien! ¡Ama llakichu!' : '¡Sigue practicando!'

  return (
    <div style={{ maxWidth:520, margin:'0 auto', padding:'40px 16px' }}>
      

      {/* Emoji grande animado */}
      <div style={{ textAlign:'center', marginBottom:24, animation:'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{ fontSize:80, lineHeight:1, marginBottom:12 }}>{emoji}</div>
        <h2 style={{ fontSize:28, fontWeight:900, color:C.brown, margin:'0 0 4px' }}>{msg}</h2>
        <p style={{ fontSize:15, color:C.graybb, margin:0 }}>{lesson.title_es || lesson.title}</p>
      </div>

      {/* Stats */}
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10,
        marginBottom:20, animation:'fadeUp 0.5s ease 0.2s both',
      }}>
        {[
          { icon:'✅', val:`${score}/${total}`, label:'Correctas',  bg:'#E8F5E2', border:'#A8D898', color:'#2D7A1F' },
          { icon:'⚡', val:`+${xp}`,            label:'XP ganados', bg:C.goldl,   border:C.gold,    color:C.goldb  },
          { icon:'🎯', val:`${pct}%`,           label:'Precisión',  bg:C.terral,  border:'#F4B885', color:C.terrab },
        ].map((s,i) => (
          <div key={i} style={{
            padding:'16px 10px', borderRadius:18, textAlign:'center',
            background:s.bg, border:`2px solid ${s.border}`,
          }}>
            <div style={{ fontSize:24, marginBottom:6 }}>{s.icon}</div>
            <p style={{ fontSize:20, fontWeight:900, color:s.color, margin:'0 0 2px' }}>{s.val}</p>
            <p style={{ fontSize:11, color:C.graybb, margin:0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Racha */}
      {streak > 0 && (
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'12px 18px', borderRadius:16, marginBottom:16,
          background:'#FFF0E6', border:`2px solid #F4B885`,
          animation:'fadeUp 0.5s ease 0.3s both',
        }}>
          <span style={{ fontSize:28 }}>🔥</span>
          <div>
            <p style={{ fontSize:14, fontWeight:800, color:C.terrab, margin:0 }}>¡Racha de {streak} días!</p>
            <p style={{ fontSize:12, color:C.graybb, margin:0 }}>Sigue así para no perderla</p>
          </div>
          <span style={{ marginLeft:'auto', fontSize:14, fontWeight:900, color:C.terra }}>+10 XP</span>
        </div>
      )}

      {/* Tinku disponible */}
      {tinkuTriggered && (
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'14px 18px', borderRadius:16, marginBottom:16,
          background:'#EEEDFE', border:`2px solid #AFA9EC`,
          animation:'fadeUp 0.5s ease 0.35s both',
        }}>
          <span style={{ fontSize:28 }}>◆</span>
          <div>
            <p style={{ fontSize:14, fontWeight:800, color:'#3C3489', margin:0 }}>¡Tinku disponible!</p>
            <p style={{ fontSize:12, color:'#7F77DD', margin:0 }}>Completaste 5 lecciones. ¡Pruébate!</p>
          </div>
        </div>
      )}

      {/* Botón principal */}
      <button onClick={onGoToPath} style={{
        width:'100%', padding:'16px', borderRadius:50,
        background:`linear-gradient(135deg,${C.terra},#E8943A)`,
        color:'white', fontWeight:900, fontSize:16, cursor:'pointer',
        border:'none', boxShadow:`0 6px 20px rgba(196,118,58,0.4)`,
        animation:'fadeUp 0.5s ease 0.4s both',
        marginBottom:10,
      }}>
        Continuar el sendero →
      </button>

      <button onClick={() => window.location.reload()} style={{
        width:'100%', padding:'13px', borderRadius:50,
        background:'white', border:'2px solid #F4B885',
        color:'#6B3F2A', fontWeight:700, fontSize:14, cursor:'pointer',
        animation:'fadeUp 0.5s ease 0.45s both',
      }}>
        🔄 Repetir lección
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL — orquesta las 3 fases
// ═══════════════════════════════════════════════════════════════
function LeccionPageInner() {
  const { id }       = useParams()
  const router       = useRouter()
  const searchParams = useSearchParams()

  // Si viene con ?fase=ejercicios, saltar directo a ejercicios
  const initialPhase = searchParams.get('fase') === 'ejercicios' ? 'exercises' : 'content'

  const [lesson, setLesson]       = useState<any>(null)
  const [exercises, setExercises] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [userId, setUserId]       = useState<string|null>(null)

  // Fase: 'content' | 'exercises' | 'victory'
  const [phase, setPhase]         = useState<'content'|'exercises'|'victory'>(initialPhase)
  const [exStep, setExStep]       = useState(0)

  // Resultado
  const [finalScore, setFinalScore]   = useState(0)
  const [finalXP, setFinalXP]         = useState(0)
  const [streak, setStreak]           = useState(0)
  const [tinkuTrigger, setTinkuTrigger] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)

    // Normalizar id (useParams puede devolver string | string[])
    const lessonId = Array.isArray(id) ? id[0] : id as string

    const [lessonRes, exRes] = await Promise.all([
      supabase.from('lessons').select('*').eq('id', lessonId).single(),
      supabase.from('exercises').select('*').eq('lesson_id', lessonId).order('order'),
    ])

    if (lessonRes.data) setLesson(lessonRes.data)
    if (exRes.data)     setExercises(exRes.data)
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

 const handleFinishExercises = async (score: number, xp: number) => {
  setFinalScore(score)
  setFinalXP(xp)

  const lessonId = Array.isArray(id) ? id[0] : id as string

  if (userId && lessonId) {
    const supabase = createClient()

    const sessionXp = exercises.length > 0 ? xp : 0
    const total = exercises.length || 1

    await supabase.from('exercise_sessions').insert({
      user_id:   userId,
      lesson_id: lessonId,
      score,
      total,
      xp_gained: sessionXp,
      accuracy:  Math.round((score / total) * 100),
    })

    const { data: result, error } = await supabase.rpc('complete_lesson', {
      p_user_id:   userId,
      p_lesson_id: lessonId,
      p_xp_earned: sessionXp,
    })

    if (error) {
      console.error('Error en complete_lesson:', error)
      try {
        const { trackError } = await import('@/lib/influx')
        await trackError('complete_lesson_error', error.message, userId, 'leccion')
      } catch (influxError) {
        console.error('⚠️ InfluxDB error tracking:', influxError)
      }
    } else if (result) {
      setStreak(result.streak_days ?? 0)
      setTinkuTrigger(result.tinku_triggered ?? false)

      try {
        const { trackLessonCompletion } = await import('@/lib/influx')
        const timeSpent = Math.floor(exercises.length * 45)
        await trackLessonCompletion(
          userId,
          lessonId,
          lesson.level || 'basico',
          Math.round((score / total) * 100),
          timeSpent,
          total,
          score
        )
        console.log('✅ Métricas enviadas a InfluxDB')
      } catch (influxError) {
        console.error('⚠️ Error enviando a InfluxDB:', influxError)
      }
    }
  }

  setPhase('victory')
}
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', fontFamily:'Poppins,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:52, marginBottom:14 }}>🦙</div>
        <p style={{ color:C.graybb, fontWeight:700 }}>Cargando lección…</p>
      </div>
    </div>
  )

  if (!lesson) return (
    <div style={{ textAlign:'center', padding:60, fontFamily:'Poppins,sans-serif' }}>
      <p style={{ color:'#6B3F2A' }}>Lección no encontrada</p>
      <button onClick={() => router.push('/dashboard')} style={{
        marginTop:16, padding:'10px 24px', borderRadius:50,
        background:C.terra, color:'white', border:'none', fontWeight:700, cursor:'pointer',
      }}>
        Volver al sendero
      </button>
    </div>
  )

  return (
    <div style={{ fontFamily:'Poppins,sans-serif', minHeight:'100vh', background:'#FEFAF5' }}>
      <TopBar
        phase={phase}
        step={exStep}
        totalSteps={exercises.length}
        lessonTitle={lesson.title_es || lesson.title}
        onBack={() => {
          if (phase === 'victory')   router.push('/dashboard')
          else if (phase === 'exercises') {
            // Si llegó directo a ejercicios desde el sendero → volver al sendero
            // Si llegó por el contenido → volver al contenido
            if (initialPhase === 'exercises') router.push('/dashboard')
            else setPhase('content')
          }
          else router.push('/dashboard')
        }}
      />

      {phase === 'content' && (
        <ContentPhase
          lesson={lesson}
          onStartExercises={() => {
            if (exercises.length === 0) {
              // Sin ejercicios — completar directo
              handleFinishExercises(0, lesson.xp_reward ?? 50)
            } else {
              setExStep(0)
              setPhase('exercises')
            }
          }}
        />
      )}

      {phase === 'exercises' && (
        <ExercisePhase
          exercises={exercises}
          lessonXP={lesson.xp_reward ?? 100}
          onFinish={(score, xp) => {
            handleFinishExercises(score, xp)
          }}
        />
      )}

      {phase === 'victory' && (
        <VictoryPhase
          lesson={lesson}
          score={finalScore}
          total={exercises.length || 1}
          xp={finalXP}
          streak={streak}
          tinkuTriggered={tinkuTrigger}
          onGoToPath={() => {
            // window.location.href fuerza recarga completa del dashboard
            // para que lea user_progress actualizado desde Supabase
            window.location.href = '/dashboard'
          }}
        />
      )}
    </div>
  )
}

export default function LeccionPage() {
  return (
    <Suspense fallback={
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',fontFamily:'Poppins,sans-serif'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:52,marginBottom:14}}>🦙</div>
          <p style={{color:'#5F5E5A',fontWeight:700}}>Cargando lección…</p>
        </div>
      </div>
    }>
      <LeccionPageInner />
    </Suspense>
  )
}