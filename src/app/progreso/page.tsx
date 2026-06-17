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

// Mapeo de lecciones (IDs) asociadas a cada una de las 8 habilidades
const SKILL_LESSONS: Record<string, string[]> = {
  saludos: ['basico-01', 'basico-02', 'basico-07'],
  locativos: ['basico-03', 'basico-04', 'basico-06'],
  verbos: ['basico-05', 'intermedio-01', 'intermedio-03', 'intermedio-04', 'intermedio-06', 'intermedio-07', 'intermedio-09', 'intermedio-10'],
  numeros: ['basico-09', 'intermedio-08'],
  cultura: ['intermedio-05', 'avanzado-05', 'maestria-01', 'maestria-02', 'maestria-03', 'maestria-04', 'maestria-05'],
  evidencialidad: ['avanzado-01', 'avanzado-06', 'avanzado-09'],
  vocabulario: ['basico-08', 'basico-10', 'intermedio-02', 'avanzado-02'],
  nominalizaciones: ['avanzado-03', 'avanzado-04', 'avanzado-07', 'avanzado-08', 'avanzado-10']
}


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

// ── Formateador de fechas cortas ─────────────────────────────
function fmtDateShort(isoStr: string): string {
  const d = new Date(isoStr)
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
}

// ── Gráfica de precisión con fechas reales ────────────────────
function SessionChart({ sessions }: { sessions: any[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef  = useRef<any>(null)

  // Tomar las últimas 12 sesiones, ordenadas de más antigua a más reciente
  const recent = sessions
    .filter(s => s.completed_at)
    .slice(0, 14)
    .reverse()

  const accuracies = recent.map(s => s.accuracy ?? 0)
  const labels     = recent.map(s => fmtDateShort(s.completed_at))
  const n = accuracies.length

  const { a, b } = calcLinReg(accuracies)
  const PROJ = 3

  const trendData = accuracies.map((_, i) =>
    Math.min(100, Math.max(0, Math.round(a + b * (i + 1)))))

  const projData = Array.from({ length: PROJ }, (_, i) =>
    Math.min(100, Math.max(0, Math.round(a + b * (n + i + 1)))))

  const allLabels  = [...labels,     ...Array.from({ length: PROJ }, (_, i) => `+${i+1}`)]
  const barData    = [...accuracies, ...Array(PROJ).fill(null)]
  const trendLine  = [...trendData,  ...Array(PROJ).fill(null)]
  const projLine   = n > 0
    ? [...Array(Math.max(0, n - 1)).fill(null), trendData[n - 1], ...projData]
    : []

  const avg      = n > 0 ? Math.round(accuracies.reduce((s, v) => s + v, 0) / n) : 0
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
        labels: allLabels,
        datasets: [
          {
            label: 'Precisión real',
            data: barData,
            backgroundColor: [
              ...accuracies.map(v =>
                v >= 80 ? C.green : v >= 50 ? C.goldd : C.terra),
              ...Array(PROJ).fill('transparent'),
            ],
            borderRadius: 5,
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
            tension: 0.3,
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
            tension: 0.3,
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
            backgroundColor: '#2A1E15',
            titleColor: '#FAC775',
            bodyColor: '#F1EFE8',
            padding: 10,
            cornerRadius: 10,
            callbacks: {
              title: (ctx: any) => {
                const idx = ctx[0].dataIndex
                if (idx < recent.length) {
                  const s = recent[idx]
                  return new Date(s.completed_at).toLocaleDateString('es-PE', {
                    weekday: 'short', day: '2-digit', month: 'long'
                  })
                }
                return `Proyección`
              },
              label: (ctx: any) => {
                if (ctx.raw === null) return null
                if (ctx.dataset.label === 'Precisión real') {
                  const idx = ctx.dataIndex
                  const s = recent[idx]
                  return [
                    `Precisión: ${ctx.raw}%`,
                    s ? `${s.score ?? '-'}/${s.total ?? '-'} correctas` : '',
                  ].filter(Boolean)
                }
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
            ticks: {
              font: { size: 10, family: 'Poppins, sans-serif' },
              color: C.grayb,
              maxRotation: 30,
              autoSkip: true,
              maxTicksLimit: 10,
            },
          },
          y: {
            min: 0, max: 100,
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: {
              font: { size: 10 },
              color: C.grayb,
              callback: (v: any) => `${v}%`,
              stepSize: 20,
            },
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
          { lbl: 'Tendencia',     val: `${tendSign} pts/ses.`, color: tendColor },
          { lbl: 'Proyección',    val: `~${projData[0]}%`,     color: C.purple },
          { lbl: 'Promedio real', val: `${avg}%`,              color: C.brown  },
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
        <canvas ref={canvasRef} role="img" aria-label="Gráfica de precisión por sesión con fechas y regresión lineal" />
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

// ── Gráfica de XP acumulado ───────────────────────────────────
function XPTimelineChart({ sessions }: { sessions: any[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef  = useRef<any>(null)

  // Agrupar XP por día, últimos 14 días
  const xpMap: Record<string, number> = {}
  sessions.forEach(s => {
    if (!s.completed_at) return
    const day = s.completed_at.split('T')[0]
    xpMap[day] = (xpMap[day] ?? 0) + (s.xp_gained ?? 0)
  })

  const today = new Date()
  const days14: { date: string; label: string; xp: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const label = d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
    days14.push({ date: key, label, xp: xpMap[key] ?? 0 })
  }

  const hasData = days14.some(d => d.xp > 0)

  useEffect(() => {
    if (!canvasRef.current || !hasData) return
    // @ts-ignore
    if (typeof window === 'undefined' || !window.Chart) return

    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }

    const gradient = canvasRef.current.getContext('2d')?.createLinearGradient(0, 0, 0, 160)
    gradient?.addColorStop(0, 'rgba(196,118,58,0.25)')
    gradient?.addColorStop(1, 'rgba(196,118,58,0.0)')

    // @ts-ignore
    chartRef.current = new window.Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: days14.map(d => d.label),
        datasets: [{
          label: 'XP ganado',
          data: days14.map(d => d.xp),
          borderColor: C.terra,
          borderWidth: 2.5,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: days14.map(d => d.xp > 0 ? C.terra : 'transparent'),
          pointBorderColor: days14.map(d => d.xp > 0 ? C.terra : 'transparent'),
          pointRadius: days14.map(d => d.xp > 0 ? 5 : 0),
          pointHoverRadius: 7,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#2A1E15',
            titleColor: '#FAC775',
            bodyColor: '#F1EFE8',
            padding: 10,
            cornerRadius: 10,
            callbacks: {
              label: (ctx: any) => ctx.raw > 0 ? `+${ctx.raw} XP` : 'Sin actividad',
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 }, color: C.grayb, maxRotation: 30 },
          },
          y: {
            min: 0,
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: {
              font: { size: 10 }, color: C.grayb,
              callback: (v: any) => v > 0 ? `${v} XP` : '',
            },
          },
        },
      },
    })
    return () => { chartRef.current?.destroy(); chartRef.current = null }
  }, [sessions])

  if (!hasData) return (
    <div style={{ textAlign: 'center', padding: '24px 0', color: C.grayb, fontSize: 13 }}>
      Sin actividad en los últimos 14 días
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100%', height: 170 }}>
      <canvas ref={canvasRef} role="img" aria-label="XP ganado por día en los últimos 14 días" />
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

  // 28 días en grilla 7 columnas
  const days: Array<{date: string; level: number; day: Date}> = []
  const today = new Date()
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const val = activityMap[key] ?? 0
    const level = val === 0 ? 0 : val < 5 ? 1 : val < 10 ? 2 : 3
    days.push({ date: key, level, day: d })
  }

  const todayStr = today.toISOString().split('T')[0]
  const colors = ['#F1EFE8', C.greend, C.green, C.greenb]
  const dayLabels = ['L','M','M','J','V','S','D']

  // Detectar cambios de mes para mostrar etiqueta
  const monthLabels: string[] = days.map((d, i) => {
    if (i === 0) return d.day.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
    if (d.day.getDate() === 1) return d.day.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
    return ''
  })

  return (
    <div>
      <div style={{display:'flex',gap:3,marginBottom:5}}>
        {dayLabels.map((d,i) => (
          <div key={i} style={{flex:1,textAlign:'center',fontSize:9,color:C.grayb,fontWeight:700}}>{d}</div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3}}>
        {days.map(({date, level, day}, i) => (
          <div key={i}
            style={{
              height:14, borderRadius:3,
              background: colors[level],
              border: date === todayStr ? `2px solid ${C.terra}` : `1px solid rgba(0,0,0,0.04)`,
              transition:'background 0.3s',
              cursor:'default',
            }}
            title={`${day.toLocaleDateString('es-PE', { weekday:'short', day:'2-digit', month:'short' })}: ${activityMap[date] ?? 0} puntos`}
          />
        ))}
      </div>
      {/* Etiqueta de semana inicio + fin */}
      <div style={{display:'flex',justifyContent:'space-between',marginTop:4,fontSize:9,color:C.grayb}}>
        <span>{days[0]?.day.toLocaleDateString('es-PE',{day:'2-digit',month:'short'})}</span>
        <span style={{color:C.terra,fontWeight:700}}>Hoy: {today.toLocaleDateString('es-PE',{day:'2-digit',month:'short'})}</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:6,marginTop:6,fontSize:10,color:C.grayb}}>
        <span>Menos</span>
        {colors.map((c,i) => (
          <div key={i} style={{width:10,height:10,borderRadius:2,background:c,border:`1px solid ${C.grayl}`}}/>
        ))}
        <span>Más activo</span>
      </div>
    </div>
  )
}

// ── Modal de cofre (celebración de insignia) ──────────────────
function ChestModal({
  insignia, onClose,
}: {
  insignia: any | null
  onClose: () => void
}) {
  const [phase, setPhase] = useState<'closed'|'opening'|'open'>('closed')

  useEffect(() => {
    if (!insignia) return
    const t1 = setTimeout(() => setPhase('opening'), 400)
    const t2 = setTimeout(() => setPhase('open'), 1200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [insignia])

  if (!insignia) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.3s ease',
    }} onClick={phase === 'open' ? onClose : undefined}>
      <div style={{
        background: 'linear-gradient(160deg,#1C1209,#2A1E15)',
        borderRadius: 28, padding: '36px 32px',
        maxWidth: 320, width: '90%', textAlign: 'center',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 2px rgba(250,199,117,0.3)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Brillo de fondo */}
        <div style={{
          position: 'absolute', inset: 0,
          background: phase === 'open'
            ? 'radial-gradient(circle at 50% 40%, rgba(250,199,117,0.12) 0%, transparent 70%)'
            : 'transparent',
          transition: 'background 0.8s ease', pointerEvents: 'none',
        }}/>

        {/* Cofre SVG */}
        <div style={{
          width: 120, height: 120,
          margin: '0 auto 20px',
          position: 'relative',
          animation: phase === 'opening' ? 'chestShake 0.5s ease' : 'none',
        }}>
          {/* Cuerpo del cofre */}
          <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', height: '100%' }}>
            {/* Cuerpo */}
            <rect x="8" y="45" width="104" height="55" rx="8" fill="#8B4E1F"/>
            <rect x="8" y="45" width="104" height="55" rx="8" fill="url(#chestBody)"/>
            {/* Tiras horizontales */}
            <rect x="8" y="60" width="104" height="6" fill="#5C2E08"/>
            <rect x="8" y="75" width="104" height="6" fill="#5C2E08"/>
            {/* Cantoneras */}
            <rect x="8" y="45" width="14" height="55" rx="4" fill="#C4763A" opacity="0.4"/>
            <rect x="98" y="45" width="14" height="55" rx="4" fill="#C4763A" opacity="0.4"/>
            {/* Cerradura */}
            <rect x="48" y="62" width="24" height="18" rx="4" fill="#EF9F27"/>
            <circle cx="60" cy="69" r="4" fill="#633806"/>
            <rect x="58" y="71" width="4" height="6" rx="1" fill="#633806"/>
            {/* Tapa (se levanta) */}
            <g style={{
              transformOrigin: '60px 45px',
              transform: phase !== 'closed' ? 'rotateX(-35deg)' : 'rotateX(0deg)',
              transition: 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              <rect x="8" y="20" width="104" height="28" rx="8" fill="#A85D2A"/>
              <rect x="8" y="20" width="104" height="28" rx="8" fill="url(#chestLid)"/>
              <rect x="8" y="38" width="104" height="8" fill="#5C2E08"/>
              <rect x="8" y="20" width="14" height="28" rx="4" fill="#C4763A" opacity="0.4"/>
              <rect x="98" y="20" width="14" height="28" rx="4" fill="#C4763A" opacity="0.4"/>
            </g>
            {/* Gradientes */}
            <defs>
              <linearGradient id="chestBody" x1="60" y1="45" x2="60" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#C4763A" stopOpacity="0.3"/>
                <stop offset="1" stopColor="#5C2E08" stopOpacity="0.2"/>
              </linearGradient>
              <linearGradient id="chestLid" x1="60" y1="20" x2="60" y2="48" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="white" stopOpacity="0.12"/>
                <stop offset="1" stopColor="black" stopOpacity="0.1"/>
              </linearGradient>
            </defs>
          </svg>

          {/* Insignia emergiendo */}
          {phase === 'open' && (
            <div style={{
              position: 'absolute', top: -20, left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 44,
              animation: 'badgeEmerge 0.5s cubic-bezier(0.34,1.56,0.64,1)',
              filter: 'drop-shadow(0 4px 16px rgba(250,199,117,0.7))',
            }}>
              {insignia.icono}
            </div>
          )}

          {/* Partículas de luz */}
          {phase === 'open' && (
            <div style={{ position: 'absolute', inset: -20, pointerEvents: 'none' }}>
              {[0,60,120,180,240,300].map((deg, i) => (
                <div key={i} style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: 4, height: 4, borderRadius: '50%',
                  background: i % 2 === 0 ? '#FAC775' : '#EF9F27',
                  animation: `particle${i} 0.8s ease-out`,
                  transformOrigin: '0 0',
                  transform: `rotate(${deg}deg) translate(60px, 0)`,
                }}/>
              ))}
            </div>
          )}
        </div>

        {/* Texto */}
        <div style={{
          opacity: phase === 'open' ? 1 : 0,
          transform: phase === 'open' ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.5s ease 0.2s',
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.goldd, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
            ¡Nueva insignia!
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'white', marginBottom: 6 }}>
            {insignia.nombre}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 24, lineHeight: 1.5 }}>
            {insignia.descripcion ?? '¡Lo has logrado!'}
          </div>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '13px', borderRadius: 50,
              background: `linear-gradient(135deg,${C.goldd},${C.terra})`,
              color: 'white', fontWeight: 900, fontSize: 14,
              border: 'none', cursor: 'pointer', fontFamily: 'Poppins,sans-serif',
              boxShadow: '0 5px 18px rgba(239,159,39,0.4)',
            }}
          >
            ¡Genial! 🎉
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes chestShake {
          0%,100% { transform:rotate(0deg) }
          20% { transform:rotate(-4deg) }
          40% { transform:rotate(4deg) }
          60% { transform:rotate(-3deg) }
          80% { transform:rotate(3deg) }
        }
        @keyframes badgeEmerge {
          from { transform:translateX(-50%) translateY(30px) scale(0.3); opacity:0 }
          to   { transform:translateX(-50%) translateY(0)    scale(1);   opacity:1 }
        }
      `}</style>
    </div>
  )
}

// ── Insignia individual ────────────────────────────────────────
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
  const [chestBadge, setChestBadge] = useState<any>(null)

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
    const earnedIds = (userInsRes.data ?? []).map((u: any) => u.insignia_id)
    setUserInsignias(earnedIds)

    // Detectar insignia recién ganada (no celebrada aun)
    const celebrated = JSON.parse(localStorage.getItem('celebrated_badges') ?? '[]') as string[]
    const allInsignias = insigniasRes.data ?? []
    const newBadge = allInsignias.find((ins: any) =>
      earnedIds.includes(ins.id) && !celebrated.includes(ins.id)
    )
    if (newBadge) {
      setChestBadge(newBadge)
    }

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

  const survey = progress?.onboarding_survey
  const initialGeneralLabel = survey ? {
    1: 'Principiante Absoluto',
    2: 'Básico',
    3: 'Intermedio',
    4: 'Avanzado'
  }[survey.general_level as number] || 'Principiante' : '—'

  const initialSkillsAvg = survey
    ? Math.round(((survey.skills?.writing || 1) + (survey.skills?.reading || 1) + (survey.skills?.listening || 1) + (survey.skills?.speaking || 1)) / 4 * 20)
    : 0

  const improvement = avgAccuracy > 0 && initialSkillsAvg > 0
    ? avgAccuracy - initialSkillsAvg
    : 0

  const skillScore = (key: string) => {
    // 1. Obtener puntaje base de la base de datos (Hamut'ay) si existe
    const dbScore = skills.find(s => s.skill === key)?.score ?? 0

    // 2. Calcular el progreso dinámico por lecciones completadas
    const associatedLessons = SKILL_LESSONS[key] ?? []
    if (associatedLessons.length === 0) return dbScore

    // Obtener los IDs de lecciones completadas desde progress (user_progress en Supabase)
    const userCompletedIds: string[] = progress?.completed_lessons ?? []
    const completedInSkill = associatedLessons.filter(id => userCompletedIds.includes(id)).length

    const lessonProgress = Math.round((completedInSkill / associatedLessons.length) * 100)

    // Retornar el valor máximo entre el diagnóstico inicial (Hamut'ay) y su progreso dinámico actual
    return Math.max(dbScore, lessonProgress)
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

      {/* Modal de cofre de insignia */}
      <ChestModal
        insignia={chestBadge}
        onClose={() => {
          if (chestBadge) {
            const prev = JSON.parse(localStorage.getItem('celebrated_badges') ?? '[]') as string[]
            localStorage.setItem('celebrated_badges', JSON.stringify([...prev, chestBadge.id]))
          }
          setChestBadge(null)
        }}
      />
      

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

      {/* Comparativa de Autoevaluación contra rendimiento real */}
      {survey && (
        <Card style={{ animation: 'fadeUp 0.5s ease 0.02s both' }}>
          <SectionTitle>📈 Comparativa de Crecimiento</SectionTitle>
          <p style={{ fontSize: 12, color: C.graybb, marginBottom: 14, lineHeight: 1.5 }}>
            Comparación de tu nivel estimado al registrarte frente a tu precisión real en los ejercicios:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div style={{ padding: 12, background: C.grayl, borderRadius: 12 }}>
              <p style={{ fontSize: 10, color: C.grayb, margin: '0 0 2px', fontWeight: 700 }}>NIVEL INICIAL ESTIMADO</p>
              <p style={{ fontSize: 14, fontWeight: 900, color: C.brown, margin: 0 }}>{initialGeneralLabel}</p>
              <p style={{ fontSize: 10, color: C.graybb, margin: '2px 0 0' }}>Autoevaluación: {initialSkillsAvg}%</p>
            </div>
            <div style={{ padding: 12, background: C.terral, borderRadius: 12 }}>
              <p style={{ fontSize: 10, color: C.terrab, margin: '0 0 2px', fontWeight: 700 }}>NIVEL EN EL SENDERO ACTUAL</p>
              <p style={{ fontSize: 14, fontWeight: 900, color: C.terra, margin: 0 }}>{levelLabel[currentLevel] || currentLevel}</p>
              <p style={{ fontSize: 10, color: C.terrab, margin: '2px 0 0' }}>Precisión Real: {avgAccuracy}%</p>
            </div>
          </div>

          {avgAccuracy > 0 ? (
            <div style={{
              padding: '10px 14px', borderRadius: 12,
              background: improvement > 0 ? C.greenl : C.grayl,
              border: `1.5px solid ${improvement > 0 ? C.greend : '#E8E4DE'}`,
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <span style={{ fontSize: 18 }}>{improvement > 0 ? '🔥' : '📈'}</span>
              <p style={{ fontSize: 12, fontWeight: 700, color: improvement > 0 ? C.greenb : C.brown, margin: 0, lineHeight: 1.4 }}>
                {improvement > 0 
                  ? `¡Estás rindiendo un +${improvement}% mejor que tu autoevaluación inicial! ¡Sigue así!`
                  : `Tu precisión real es de ${avgAccuracy}%. Sigue practicando para superar tu autoevaluación inicial (${initialSkillsAvg}%).`
                }
              </p>
            </div>
          ) : (
            <div style={{ padding: '10px 14px', borderRadius: 12, background: C.grayl, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>🌱</span>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.brown, margin: 0 }}>
                Completa tus primeros ejercicios en el sendero para ver tu comparativa de mejora.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Gráfica de precisión con fechas */}
      <Card style={{animation:'fadeUp 0.5s ease 0.05s both'}}>
        <SectionTitle>Precisión por sesión</SectionTitle>
        <SessionChart sessions={sessions}/>
      </Card>

      {/* Gráfica de XP por día */}
      <Card style={{animation:'fadeUp 0.5s ease 0.08s both'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <SectionTitle>XP ganado — últimos 14 días</SectionTitle>
          <span style={{fontSize:10,padding:'3px 8px',borderRadius:20,fontWeight:700,background:C.goldl,color:C.goldb}}>
            ⚡ {sessions.reduce((s,x) => s + (x.xp_gained ?? 0), 0)} XP total
          </span>
        </div>
        <XPTimelineChart sessions={sessions}/>
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
              const completedAt = session?.completed_at
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
                      {completedAt && (
                        <span style={{marginLeft:6,opacity:0.7}}>
                          · {new Date(completedAt).toLocaleDateString('es-PE',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                        </span>
                      )}
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