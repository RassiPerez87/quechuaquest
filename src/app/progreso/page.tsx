'use client'


import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useEffect, useState, useCallback, useRef } from 'react'

// ── Paleta ────────────────────────────────────────────────────
const C = {
  brown:'#2A1E15', terra:'#C4763A', terral:'#FFF0E6', terrab:'#8B4E1F',
  green:'#1D9E75', greenl:'#E1F5EE', greenb:'#0F6E56', greend:'#5DCAA5',
  purple:'#534AB7', purplel:'#EEEDFE', purpleb:'#3C3489',
  gold:'#FAC775', goldl:'#FAEEDA', goldb:'#633806', goldd:'#EF9F27',
  gray:'#B4B2A9', grayl:'#F1EFE8', grayb:'#888780', graybb:'#5F5E5A',
}

// ── Habilidades definidas ─────────────────────────────────────
const SKILLS = [
  { key:'saludos',         label:'Saludos y cortesía',    icon:'🤝', color:C.green,  light:C.greenl  },
  { key:'locativos',       label:'Locativos (-pi/-man)',  icon:'📍', color:C.terra,  light:C.terral  },
  { key:'verbos',          label:'Conjugación verbal',    icon:'⚡', color:C.purple, light:C.purplel },
  { key:'numeros',         label:'Números y tiempo',      icon:'🔢', color:C.goldd,  light:C.goldl   },
  { key:'cultura',         label:'Cultura andina',        icon:'🏔️', color:C.green,  light:C.greenl  },
  { key:'evidencialidad',  label:'Evidencialidad',        icon:'🧩', color:C.purple, light:C.purplel },
  { key:'vocabulario',     label:'Vocabulario familiar',  icon:'📚', color:C.terra,  light:C.terral  },
  { key:'nominalizaciones',label:'Nominalizaciones',      icon:'📖', color:C.grayb,  light:C.grayl   },
]

// ── Regresión lineal ──────────────────────────────────────────
function calcLinReg(ys: number[]) {
  const n = ys.length
  if (n < 2) return { a: ys[0] ?? 0, b: 0 }
  const xs = ys.map((_, i) => i + 1)
  const sumX  = xs.reduce((s, x) => s + x, 0)
  const sumY  = ys.reduce((s, y) => s + y, 0)
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0)
  const sumX2 = xs.reduce((s, x) => s + x * x, 0)
  const b = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const a = (sumY - b * sumX) / n
  return { a, b }
}

// ── Gráfica con regresión lineal ──────────────────────────────
function SessionChart({ sessions }: { sessions: any[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef  = useRef<any>(null)

  const accuracies = sessions
    .slice(0, 12)
    .reverse()
    .map(s => s.accuracy ?? 0)

  const { a, b } = calcLinReg(accuracies)
  const n = accuracies.length
  const PROJ = 3

  const trendData = accuracies.map((_, i) =>
    Math.min(100, Math.max(0, Math.round(a + b * (i + 1)))))

  const projData = Array.from({ length: PROJ }, (_, i) =>
    Math.min(100, Math.max(0, Math.round(a + b * (n + i + 1)))))

  const labels = [
    ...accuracies.map((_, i) => `S${i + 1}`),
    ...Array.from({ length: PROJ }, (_, i) => `S${n + i + 1}`),
  ]
  const barData   = [...accuracies, ...Array(PROJ).fill(null)]
  const trendLine = [...trendData,  ...Array(PROJ).fill(null)]

  const projLine = n > 0
  ? [
      ...Array(Math.max(0, n - 1)).fill(null),
      trendData[n - 1],
      ...projData,
    ]
  : []

  const avg = n > 0
    ? Math.round(accuracies.reduce((s, v) => s + v, 0) / n)
    : 0

  const tendSign = b >= 1 ? `+${b.toFixed(1)}` : b.toFixed(1)
  const tendColor = b >= 1 ? C.green : b <= -1 ? '#E24B4A' : C.gray

  useEffect(() => {
    if (!canvasRef.current || n === 0) return
    // @ts-ignore
    if (typeof window === 'undefined' || !window.Chart) return

    if (chartRef.current) {
      chartRef.current.destroy()
      chartRef.current = null
    }

    // @ts-ignore
    chartRef.current = new window.Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Precisión real',
            data: barData,
            backgroundColor: [
              ...accuracies.map(v =>
                v >= 80 ? C.green : v >= 50 ? C.goldd : C.terra),
              ...Array(PROJ).fill('transparent'),
            ],
            borderRadius: 4,
            borderSkipped: false,
            order: 3,
          },
          {
            label: 'Tendencia lineal',
            data: trendLine,
            type: 'line',
            borderColor: C.purple,
            borderWidth: 2,
            borderDash: [5, 4],
            pointRadius: 0,
            tension: 0,
            fill: false,
            order: 1,
          },
          {
            label: 'Proyección futura',
            data: projLine,
            type: 'line',
            borderColor: C.terra,
            borderWidth: 2,
            borderDash: [6, 4],
            pointBackgroundColor: C.terra,
            pointRadius: (ctx: any) => ctx.dataIndex >= n ? 4 : 0,
            tension: 0,
            fill: false,
            order: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                if (ctx.raw === null) return null
                if (ctx.dataset.label === 'Precisión real') return `Precisión: ${ctx.raw}%`
                if (ctx.dataset.label === 'Proyección futura' && ctx.dataIndex >= n) return `Proyección: ${ctx.raw}%`
                if (ctx.dataset.label === 'Tendencia lineal') return `Tendencia: ${ctx.raw}%`
                return null
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 }, color: C.grayb, autoSkip: false, maxRotation: 0 },
          },
          y: {
            min: 0, max: 100,
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { font: { size: 10 }, color: C.grayb, callback: (v: any) => `${v}%` },
          },
        },
      },
    })

    return () => { chartRef.current?.destroy(); chartRef.current = null }
  }, [sessions])

  if (n === 0) return (
    <div style={{ textAlign: 'center', padding: '30px 0', color: C.grayb, fontSize: 13 }}>
      Completa ejercicios para ver tu progreso aquí
    </div>
  )

  return (
    <div>
      {/* Métricas resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { lbl: 'Tendencia',      val: `${tendSign} pts/ses.`, color: tendColor },
          { lbl: 'Próxima ses.',   val: `~${projData[0]}%`,    color: C.purple },
          { lbl: 'Promedio real',  val: `${avg}%`,             color: C.brown  },
        ].map((m, i) => (
          <div key={i} style={{
            background: C.grayl, borderRadius: 10, padding: '8px 10px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 10, color: C.grayb, margin: '0 0 2px', fontWeight: 700 }}>{m.lbl}</p>
            <p style={{ fontSize: 15, fontWeight: 900, color: m.color, margin: 0 }}>{m.val}</p>
          </div>
        ))}
      </div>

      {/* Canvas Chart.js */}
      <div style={{ position: 'relative', width: '100%', height: 200 }}>
        <canvas ref={canvasRef} role="img" aria-label="Gráfica de precisión por sesión con regresión lineal" />
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 11, color: C.grayb, flexWrap: 'wrap' }}>
        {[
          { color: C.green,  dash: false, label: 'Sesiones reales' },
          { color: C.purple, dash: true,  label: 'Tendencia lineal' },
          { color: C.terra,  dash: true,  label: 'Proyección futura' },
        ].map((l, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              display: 'inline-block', width: 16, height: 3,
              background: l.dash ? 'transparent' : l.color,
              border: l.dash ? `2px dashed ${l.color}` : 'none',
              borderRadius: 2,
            }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Calendario de actividad ───────────────────────────────────
function ActivityCalendar({ sessions }: { sessions: any[] }) {
  const activityMap: Record<string, number> = {}
  sessions.forEach(s => {
    if (!s.completed_at) return
    const date = s.completed_at.split('T')[0]
    activityMap[date] = (activityMap[date] ?? 0) + (s.score ?? 0)
  })

  const days: Array<{date: string; level: number}> = []
  const today = new Date()
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const val = activityMap[key] ?? 0
    const level = val === 0 ? 0 : val < 5 ? 1 : val < 10 ? 2 : 3
    days.push({ date: key, level })
  }

  const todayStr = today.toISOString().split('T')[0]
  const colors = ['#F1EFE8', C.greend, C.green, C.greenb]
  const dayLabels = ['L','M','M','J','V','S','D']

  return (
    <div>
      <div style={{display:'flex',gap:3,marginBottom:5}}>
        {dayLabels.map((d,i) => (
          <div key={i} style={{flex:1,textAlign:'center',fontSize:9,color:C.grayb,fontWeight:700}}>{d}</div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3}}>
        {days.map(({date, level}, i) => (
          <div key={i} style={{
            height:14, borderRadius:3,
            background: colors[level],
            border: date === todayStr ? `2px solid ${C.terra}` : 'none',
            transition:'background 0.3s',
          }} title={date}/>
        ))}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:6,marginTop:8,fontSize:10,color:C.grayb}}>
        <span>Menos</span>
        {colors.map((c,i) => (
          <div key={i} style={{width:10,height:10,borderRadius:2,background:c,border:`1px solid ${C.grayl}`}}/>
        ))}
        <span>Más</span>
        <span style={{marginLeft:'auto',color:C.terra,fontWeight:700}}>Hoy ↑</span>
      </div>
    </div>
  )
}

// ── Insignia individual ───────────────────────────────────────
function Badge({ insignia, earned }: { insignia: any; earned: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius:16, padding:'14px 8px', textAlign:'center',
        border:`1.5px solid ${earned ? C.terra : '#D3D1C7'}`,
        background: earned ? C.terral : C.grayl,
        opacity: earned ? 1 : 0.45,
        filter: earned ? 'none' : 'grayscale(1)',
        transition:'transform 0.2s, box-shadow 0.2s',
        transform: hov && earned ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hov && earned ? `0 6px 16px rgba(196,118,58,0.2)` : 'none',
        cursor: earned ? 'default' : 'default',
      }}
    >
      <div style={{fontSize:28,lineHeight:1,marginBottom:6}}>{insignia.icono}</div>
      <div style={{fontSize:10,fontWeight:700,color: earned ? C.terrab : C.grayb,lineHeight:1.3}}>
        {insignia.nombre}
      </div>
      {earned && (
        <div style={{
          marginTop:5,fontSize:9,padding:'2px 6px',borderRadius:20,
          background:C.green,color:'#fff',fontWeight:700,display:'inline-block',
        }}>
          ✓ obtenida
        </div>
      )}
    </div>
  )
}

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────
export default function ProgresoPage() {
  const router = useRouter()
  const [loading, setLoading]       = useState(true)
  const [profile, setProfile]       = useState<any>(null)
  const [progress, setProgress]     = useState<any>(null)
  const [skills, setSkills]         = useState<any[]>([])
  const [sessions, setSessions]     = useState<any[]>([])
  const [insignias, setInsignias]   = useState<any[]>([])
  const [userInsignias, setUserInsignias] = useState<string[]>([])
  const [completedLessons, setCompletedLessons] = useState<any[]>([])

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const [
      profileRes, progressRes, skillsRes,
      sessionsRes, insigniasRes, userInsRes, lessonsRes,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('user_progress').select('*').eq('user_id', user.id).single(),
      supabase.from('user_skill_progress').select('*').eq('user_id', user.id),
      supabase.from('exercise_sessions').select('*').eq('user_id', user.id).order('completed_at', {ascending:false}).limit(30),
      supabase.from('insignias').select('*').order('nombre'),
      supabase.from('user_insignias').select('insignia_id').eq('user_id', user.id),
      supabase.from('lessons').select('id,title_es,level,xp_reward').eq('is_active', true),
    ])

    setProfile(profileRes.data)
    setProgress(progressRes.data)
    setSkills(skillsRes.data ?? [])
    setSessions(sessionsRes.data ?? [])
    setInsignias(insigniasRes.data ?? [])
    setUserInsignias((userInsRes.data ?? []).map((u: any) => u.insignia_id))

    const completedIds: string[] = progressRes.data?.completed_lessons ?? []
    const allLessons = lessonsRes.data ?? []
    const completedWithInfo = completedIds.slice(-8).reverse().map((id: string) => {
      const lesson = allLessons.find((l: any) => l.id === id)
      const session = (sessionsRes.data ?? []).find((s: any) => s.lesson_id === id)
      return { id, lesson, session }
    }).filter((x: any) => x.lesson)
    setCompletedLessons(completedWithInfo)

    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',fontFamily:'Poppins,sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:12}}>📊</div>
        <p style={{color:C.graybb,fontWeight:700,fontSize:14}}>Cargando tu progreso…</p>
      </div>
    </div>
  )

  const streakDays   = progress?.streak_days ?? profile?.streak_days ?? 0
  const xpTotal      = progress?.xp_total    ?? profile?.xp          ?? 0
  const completedN   = progress?.completed_lessons?.length ?? 0
  const currentLevel = progress?.current_level ?? profile?.level ?? 'basico'
  const firstName    = profile?.full_name?.split(' ')[0] ?? 'amigo'

  const avgAccuracy = sessions.length > 0
    ? Math.round(sessions.reduce((s, x) => s + (x.accuracy ?? 0), 0) / sessions.length)
    : 0

  const skillScore = (key: string) => {
    const s = skills.find(s => s.skill === key)
    return s?.score ?? 0
  }

  const levelLabel: Record<string,string> = {
    basico:'Básico', intermedio:'Intermedio', avanzado:'Avanzado', maestria:'Maestría',
  }

  const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{
      background:'rgba(255,255,255,0.88)',
      backdropFilter:'blur(10px)',
      borderRadius:20, border:`1.5px solid rgba(196,118,58,0.15)`,
      padding:'18px 20px', marginBottom:14,
      ...style,
    }}>
      {children}
    </div>
  )

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <p style={{
      fontSize:11, fontWeight:800, color:C.terrab,
      textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 14px',
    }}>
      {children}
    </p>
  )

  return (
    <div style={{fontFamily:'Poppins,sans-serif',maxWidth:660,margin:'0 auto',padding:'4px 16px 80px'}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header con volver */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,paddingTop:4,animation:'fadeUp 0.4s ease'}}>
        <button onClick={() => router.push('/dashboard')} style={{
          display:'flex',alignItems:'center',gap:5,
          padding:'7px 14px',borderRadius:50,
          background:'rgba(255,255,255,0.88)',border:`1.5px solid #F4B885`,
          color:'#6B3F2A',fontWeight:700,fontSize:12,cursor:'pointer',
          backdropFilter:'blur(8px)',flexShrink:0,
        }}>
          ← Volver
        </button>
        <div>
          <h1 style={{fontSize:20,fontWeight:900,color:C.brown,marginBottom:2,lineHeight:1.2}}>
            Mi Progreso 📊
          </h1>
          <p style={{color:C.graybb,fontSize:12,margin:0}}>
            Allin yachaq, {firstName} — así vas avanzando
          </p>
        </div>
      </div>

      {/* Stats resumen */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14,animation:'fadeUp 0.5s ease'}}>
        {[
          {icon:'🔥', val:streakDays,  lbl:'Racha',    color:C.terra,  bg:'#FFF0E6', border:'#F4B885'},
          {icon:'⚡', val:xpTotal,     lbl:'XP',       color:C.goldb,  bg:C.goldl,   border:C.gold},
          {icon:'📚', val:completedN,  lbl:'Lecciones',color:C.greenb, bg:C.greenl,  border:C.greend},
          {icon:'🎯', val:`${avgAccuracy}%`, lbl:'Precisión', color:C.purple, bg:C.purplel, border:'#AFA9EC'},
        ].map((s,i) => (
          <div key={i} style={{padding:'12px 10px',borderRadius:16,background:s.bg,border:`1.5px solid ${s.border}`,textAlign:'center'}}>
            <p style={{fontSize:10,color:C.graybb,margin:'0 0 2px',fontWeight:700}}>{s.icon} {s.lbl}</p>
            <p style={{fontSize:18,fontWeight:900,color:s.color,margin:0,lineHeight:1}}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Gráfica de sesiones */}
      <Card style={{animation:'fadeUp 0.5s ease 0.05s both'}}>
        <SectionTitle>Precisión por sesión</SectionTitle>
        <SessionChart sessions={sessions}/>
      </Card>

      {/* Barras de habilidades */}
      <Card style={{animation:'fadeUp 0.5s ease 0.1s both'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <SectionTitle>Mis habilidades</SectionTitle>
          <span style={{
            fontSize:10,padding:'4px 10px',borderRadius:20,fontWeight:700,
            background:C.goldl,color:C.goldb,
          }}>
            Próximamente ◉
          </span>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {SKILLS.map(skill => {
            const score = skillScore(skill.key)
            return (
              <div key={skill.key} style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{
                  width:30,height:30,borderRadius:9,flexShrink:0,
                  background:skill.light,display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:14,
                }}>
                  {skill.icon}
                </div>
                <div style={{fontSize:12,fontWeight:700,color:C.brown,width:130,flexShrink:0}}>
                  {skill.label}
                </div>
                <div style={{flex:1,height:8,background:C.grayl,borderRadius:4,overflow:'hidden'}}>
                  <div style={{
                    height:'100%',borderRadius:4,
                    background: score > 0 ? skill.color : '#D3D1C7',
                    width:`${score}%`,
                    transition:'width 0.8s ease',
                  }}/>
                </div>
                <div style={{
                  fontSize:11,fontWeight:700,minWidth:34,textAlign:'right',
                  color: score > 0 ? skill.color : C.grayb,
                }}>
                  {score > 0 ? `${score}%` : '—'}
                </div>
              </div>
            )
          })}
        </div>
        {skills.length === 0 && (
          <p style={{fontSize:12,color:C.grayb,textAlign:'center',marginTop:8}}>
            Haz el Hamut'ay para descubrir tus habilidades
          </p>
        )}
      </Card>

      {/* Calendario */}
      <Card style={{animation:'fadeUp 0.5s ease 0.15s both'}}>
        <SectionTitle>Actividad — últimas 4 semanas</SectionTitle>
        <ActivityCalendar sessions={sessions}/>
      </Card>

      {/* Insignias */}
      <Card style={{animation:'fadeUp 0.5s ease 0.2s both'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <SectionTitle>Insignias — Qillqasqa</SectionTitle>
          <span style={{fontSize:11,color:C.grayb,fontWeight:600}}>
            {userInsignias.length}/{insignias.length} obtenidas
          </span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          {insignias.map(ins => (
            <Badge
              key={ins.id}
              insignia={ins}
              earned={userInsignias.includes(ins.id)}
            />
          ))}
          {insignias.length === 0 && (
            <p style={{fontSize:12,color:C.grayb,gridColumn:'1/-1',textAlign:'center',padding:'20px 0'}}>
              Carga las insignias en Supabase primero
            </p>
          )}
        </div>
      </Card>

      {/* Historial */}
      <Card style={{animation:'fadeUp 0.5s ease 0.25s both'}}>
        <SectionTitle>Últimas lecciones completadas</SectionTitle>
        {completedLessons.length === 0 ? (
          <p style={{fontSize:12,color:C.grayb,textAlign:'center',padding:'20px 0'}}>
            Completa tu primera lección para ver tu historial aquí
          </p>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {completedLessons.map(({id, lesson, session}) => {
              const acc = session?.accuracy ?? null
              const xp  = session?.xp_gained ?? lesson?.xp_reward ?? 0
              const color = acc === null ? C.grayb : acc >= 80 ? C.green : acc >= 50 ? C.goldd : C.terra
              const levelColors: Record<string,string> = {
                basico:'#E1F5EE', intermedio:'#EEEDFE', avanzado:'#FFF0E6', maestria:'#FAEEDA',
              }
              return (
                <div key={id} style={{
                  display:'flex',alignItems:'center',gap:10,
                  padding:'10px 13px',borderRadius:13,
                  background: levelColors[lesson.level] ?? C.grayl,
                }}>
                  <span style={{fontSize:16}}>✅</span>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:13,fontWeight:700,color:C.brown,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {lesson.title_es}
                    </p>
                    <p style={{fontSize:10,color:C.graybb,margin:'2px 0 0'}}>
                      +{xp} XP{acc !== null ? ` · ${session.score}/${session.total} correctas` : ''}
                    </p>
                  </div>
                  {acc !== null && (
                    <span style={{fontSize:12,fontWeight:800,color,flexShrink:0}}>{acc}%</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Botón volver al sendero */}
      <button
        onClick={() => router.push('/dashboard')}
        style={{
          width:'100%',padding:'14px',borderRadius:50,
          background:`linear-gradient(135deg,${C.terra},#E8943A)`,
          color:'white',fontWeight:900,fontSize:14,
          border:'none',cursor:'pointer',fontFamily:'Poppins,sans-serif',
          boxShadow:`0 5px 18px rgba(196,118,58,0.35)`,
        }}
      >
        ← Volver al sendero
      </button>
    </div>
  )
}