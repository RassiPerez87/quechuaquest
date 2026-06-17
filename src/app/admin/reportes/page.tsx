'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Users, BookOpen, Award, TrendingUp, Download, BarChart3, PieChart, LineChart, Activity, Sparkles } from 'lucide-react'
import { exportReporteGeneral } from '@/lib/exportUtils'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
)

// ── Utilidades de fecha ───────────────────────────────────────
function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString('es-PE', opts ?? {
    day: '2-digit', month: 'short'
  })
}

function last30Days(): { key: string; label: string }[] {
  const days = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const label = d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
    days.push({ key, label })
  }
  return days
}

function last14Days(): { key: string; label: string }[] {
  const days = []
  const today = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const label = d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
    days.push({ key, label })
  }
  return days
}

// ── Regresión lineal ──────────────────────────────────────────
function linearRegression(data: number[]) {
  const n = data.length
  if (n < 2) return { m: 0, b: data[0] ?? 0, r2: 0, trend: data }
  const x = data.map((_, i) => i + 1)
  const sumX  = x.reduce((a, b) => a + b, 0)
  const sumY  = data.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((s, xi, i) => s + xi * data[i], 0)
  const sumX2 = x.reduce((s, xi) => s + xi * xi, 0)
  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const b = (sumY - m * sumX) / n
  const yMean = sumY / n
  const ssRes = data.reduce((s, yi, i) => s + Math.pow(yi - (m * x[i] + b), 2), 0)
  const ssTot = data.reduce((s, yi) => s + Math.pow(yi - yMean, 2), 0)
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot
  return { m, b, r2, trend: x.map(xi => Math.max(0, m * xi + b)) }
}

// ── Tooltip oscuro estándar ───────────────────────────────────
const darkTooltip = {
  backgroundColor: 'rgba(42,30,21,0.95)',
  titleColor: '#FAC775',
  bodyColor: '#F1EFE8',
  padding: 10,
  cornerRadius: 8,
  displayColors: false,
}

export default function ReportesPage() {
  const [stats, setStats]               = useState<any>(null)
  const [topUsers, setTopUsers]         = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [sessionsDaily, setSessionsDaily]   = useState<any[]>([])
  const [xpDaily, setXpDaily]           = useState<any[]>([])
  const [loading, setLoading]           = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => { loadStats() }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      // Stats generales
      const { data: statsData } = await supabase
        .from('admin_stats')
        .select('*')
        .single()

      // Top 5 usuarios por XP
      const { data: topUsersData } = await supabase
        .from('profiles')
        .select('id, username, xp, total_lessons_completed, level, created_at, last_activity')
        .order('xp', { ascending: false })
        .limit(5)

      // Actividad reciente con fecha exacta (profiles se hace via Left Join)
      const { data: activityData } = await supabase
        .from('exercise_sessions')
        .select(`
          id, completed_at, xp_gained, accuracy, score, total,
          user_id, lesson_id,
          profiles(username, full_name)
        `)
        .order('completed_at', { ascending: false })
        .limit(20)

      // Sesiones por día — últimos 30 días
      const { data: sessions30 } = await supabase
        .from('exercise_sessions')
        .select('completed_at, xp_gained, accuracy')
        .gte('completed_at', new Date(Date.now() - 30 * 86400000).toISOString())
        .order('completed_at', { ascending: true })

      setStats(statsData)
      setTopUsers(topUsersData || [])

      let recentActivityMapped: any[] = []
      if (activityData && activityData.length > 0) {
        const lessonIds = Array.from(new Set(activityData.map(a => a.lesson_id).filter(Boolean)))
        let lessonsMap: Record<string, any> = {}
        if (lessonIds.length > 0) {
          const { data: lessonsData } = await supabase
            .from('lessons')
            .select('id, title, title_es, level')
            .in('id', lessonIds)
          if (lessonsData) {
            lessonsData.forEach(l => {
              lessonsMap[l.id] = l
            })
          }
        }

        recentActivityMapped = activityData.map((a: any) => ({
          id: a.id,
          username: a.profiles?.username || a.profiles?.full_name || 'Usuario',
          lesson_title: lessonsMap[a.lesson_id]?.title_es || lessonsMap[a.lesson_id]?.title || 'Lección',
          lesson_level: lessonsMap[a.lesson_id]?.level || '',
          completed_at: a.completed_at,
          accuracy: a.accuracy,
          score: a.score,
          total: a.total,
          xp_gained: a.xp_gained,
        }))
      }

      setRecentActivity(recentActivityMapped)
      setSessionsDaily(sessions30 || [])
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 16 }}>
        <div style={{
          width: 52, height: 52, border: '4px solid #C4763A',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#6B3F2A', fontWeight: 700, fontFamily: 'Poppins, sans-serif' }}>Cargando reportes…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── Datos calculados ─────────────────────────────────────────
  const totalStudents  = stats?.total_students || 0
  const activeStudents = stats?.active_students || 0
  const inactiveStudents = Math.max(0, totalStudents - activeStudents)

  // Sesiones por día (últimos 30 días) con fechas reales
  const days30  = last30Days()
  const sessMap: Record<string, number> = {}
  const xpMap:   Record<string, number> = {}
  const accMap:  Record<string, number[]> = {}
  sessionsDaily.forEach((s: any) => {
    if (!s.completed_at) return
    const day = s.completed_at.split('T')[0]
    sessMap[day] = (sessMap[day] ?? 0) + 1
    xpMap[day]   = (xpMap[day] ?? 0) + (s.xp_gained ?? 0)
    if (!accMap[day]) accMap[day] = []
    if (s.accuracy != null) accMap[day].push(s.accuracy)
  })

  const sessPerDay = days30.map(d => sessMap[d.key] ?? 0)
  const xpPerDay   = days30.map(d => xpMap[d.key] ?? 0)
  const labDays30  = days30.map(d => d.label)

  // Regresión sobre sesiones
  const regSess = linearRegression(sessPerDay)

  // Calcular acumulados de progreso general
  let runningSessions = 0
  let runningXp = 0
  const cumulativeSessions = sessPerDay.map(val => {
    runningSessions += val
    return runningSessions
  })
  const cumulativeXp = xpPerDay.map(val => {
    runningXp += val
    return runningXp
  })

  // ── Gráfica de Progreso Acumulado (Doble Eje Y) ───────────────
  const progressCumulativeData = {
    labels: labDays30,
    datasets: [
      {
        label: 'Lecciones Completadas (Acumulado)',
        data: cumulativeSessions,
        borderColor: '#534AB7',
        backgroundColor: 'rgba(83,74,183,0.06)',
        borderWidth: 3,
        fill: true,
        tension: 0.35,
        yAxisID: 'y',
        pointBackgroundColor: '#534AB7',
        pointRadius: 2,
        pointHoverRadius: 5,
      },
      {
        label: 'XP Ganado (Acumulado)',
        data: cumulativeXp,
        borderColor: '#EF9F27',
        backgroundColor: 'transparent',
        borderWidth: 3,
        fill: false,
        tension: 0.35,
        yAxisID: 'y1',
        pointBackgroundColor: '#EF9F27',
        pointRadius: 2,
        pointHoverRadius: 5,
      }
    ]
  }

  const progressCumulativeOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 12, weight: '700', family: 'Poppins, sans-serif' },
          color: '#2A1E15',
          padding: 15
        }
      },
      tooltip: {
        ...darkTooltip,
        callbacks: {
          title: (ctx: any) => {
            const i = ctx[0].dataIndex
            const d = days30[i]
            return d ? new Date(d.key + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : ''
          },
          label: (ctx: any) => {
            if (ctx.dataset.yAxisID === 'y') {
              return `Lecciones completadas: ${ctx.raw} acumuladas`
            } else {
              return `XP acumulado: ${ctx.raw.toLocaleString()} XP`
            }
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Lecciones completadas',
          color: '#534AB7',
          font: { family: 'Poppins, sans-serif', size: 11, weight: 'bold' }
        },
        ticks: { font: { size: 10, family: 'Poppins' }, color: '#6B3F2A' },
        grid: { color: 'rgba(83,74,183,0.06)' }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'XP Acumulado',
          color: '#EF9F27',
          font: { family: 'Poppins, sans-serif', size: 11, weight: 'bold' }
        },
        ticks: {
          font: { size: 10, family: 'Poppins' },
          color: '#6B3F2A',
          callback: (v: any) => v >= 1000 ? `${(v/1000).toFixed(1)}k XP` : `${v} XP`
        },
        grid: { drawOnChartArea: false }
      },
      x: {
        ticks: { font: { size: 9, family: 'Poppins' }, color: '#2A1E15', maxRotation: 40, autoSkip: true, maxTicksLimit: 10 },
        grid: { display: false }
      }
    }
  }

  // XP últimos 14 días
  const days14   = last14Days()
  const xpPer14  = days14.map(d => xpMap[d.key] ?? 0)
  const labDays14 = days14.map(d => d.label)

  // ── Gráfica 1: Distribución usuarios (dona) ──────────────────
  const doughnutData = {
    labels: ['Activos', 'Inactivos'],
    datasets: [{
      data: [activeStudents, inactiveStudents],
      backgroundColor: ['rgba(29,158,117,0.85)', 'rgba(220,216,208,0.7)'],
      borderColor: ['#1D9E75', '#C8C4BC'],
      borderWidth: 2,
    }]
  }
  const doughnutOptions: any = {
    responsive: true, maintainAspectRatio: true,
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 12, weight: '700', family: 'Poppins, sans-serif' }, padding: 14, color: '#2A1E15' } },
      tooltip: darkTooltip,
    }
  }

  // ── Gráfica 2: Sesiones diarias — 30 días con fechas reales ──
  const lineData = {
    labels: labDays30,
    datasets: [
      {
        label: 'Sesiones completadas',
        data: sessPerDay,
        borderColor: '#534AB7',
        backgroundColor: 'rgba(83,74,183,0.08)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: sessPerDay.map(v => v > 0 ? '#534AB7' : 'transparent'),
        pointBorderColor: sessPerDay.map(v => v > 0 ? '#534AB7' : 'transparent'),
        pointRadius: sessPerDay.map(v => v > 0 ? 4 : 0),
        pointHoverRadius: 6,
      },
      {
        label: `Tendencia (R²=${(regSess.r2 * 100).toFixed(0)}%)`,
        data: regSess.trend,
        borderColor: '#C4763A',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [6, 3],
        pointRadius: 0,
        tension: 0,
        fill: false,
      }
    ]
  }
  const lineOptions: any = {
    responsive: true, maintainAspectRatio: true,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11, weight: '700', family: 'Poppins' }, padding: 12, color: '#2A1E15' } },
      tooltip: {
        ...darkTooltip,
        callbacks: {
          title: (ctx: any) => {
            const i = ctx[0].dataIndex
            const d = days30[i]
            return d ? new Date(d.key + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' }) : ''
          },
          label: (ctx: any) => ctx.dataset.label.includes('Tendencia')
            ? `Tendencia: ${ctx.raw.toFixed(1)} ses.`
            : `Sesiones: ${ctx.raw}`,
        }
      }
    },
    scales: {
      y: { beginAtZero: true, ticks: { font: { size: 10, family: 'Poppins' }, color: '#6B3F2A', stepSize: 1 }, grid: { color: 'rgba(83,74,183,0.06)' } },
      x: { ticks: { font: { size: 9 }, color: '#2A1E15', maxRotation: 40, autoSkip: true, maxTicksLimit: 10 }, grid: { display: false } }
    }
  }

  // ── Gráfica 3: XP por día — 14 días ──────────────────────────
  const xpLineData = {
    labels: labDays14,
    datasets: [{
      label: 'XP ganado',
      data: xpPer14,
      borderColor: '#C4763A',
      backgroundColor: 'rgba(196,118,58,0.12)',
      borderWidth: 2.5,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: xpPer14.map(v => v > 0 ? '#C4763A' : 'transparent'),
      pointBorderColor: xpPer14.map(v => v > 0 ? '#C4763A' : 'transparent'),
      pointRadius: xpPer14.map(v => v > 0 ? 5 : 0),
      pointHoverRadius: 7,
    }]
  }
  const xpLineOptions: any = {
    responsive: true, maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...darkTooltip,
        callbacks: {
          title: (ctx: any) => {
            const i = ctx[0].dataIndex
            const d = days14[i]
            return d ? new Date(d.key + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'long' }) : ''
          },
          label: (ctx: any) => ctx.raw > 0 ? `+${ctx.raw} XP` : 'Sin actividad',
        }
      }
    },
    scales: {
      y: { beginAtZero: true, ticks: { font: { size: 10 }, color: '#6B3F2A', callback: (v: any) => v > 0 ? `${v} XP` : '' }, grid: { color: 'rgba(196,118,58,0.06)' } },
      x: { ticks: { font: { size: 9 }, color: '#2A1E15', maxRotation: 35 }, grid: { display: false } }
    }
  }

  // ── Gráfica 4: Top 5 por XP (barras horizontales) ────────────
  const barData = {
    labels: topUsers.map(u => u.username || 'Anónimo'),
    datasets: [{
      label: 'XP total',
      data: topUsers.map(u => u.xp || 0),
      backgroundColor: ['rgba(250,199,117,0.9)', 'rgba(196,118,58,0.9)', 'rgba(212,168,83,0.85)', 'rgba(196,118,58,0.7)', 'rgba(212,168,83,0.6)'],
      borderColor:     ['#FAC775', '#C4763A', '#D4A853', '#C4763A', '#D4A853'],
      borderWidth: 2,
      borderRadius: 8,
    }]
  }
  const barOptions: any = {
    indexAxis: 'y',
    responsive: true, maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: { ...darkTooltip, callbacks: { label: (ctx: any) => `${ctx.raw.toLocaleString()} XP` } }
    },
    scales: {
      y: { ticks: { font: { size: 12, weight: '700', family: 'Poppins' }, color: '#2A1E15' }, grid: { display: false } },
      x: { beginAtZero: true, ticks: { font: { size: 10 }, color: '#6B3F2A', callback: (v: any) => `${v} XP` }, grid: { color: 'rgba(196,118,58,0.07)' } }
    }
  }

  // ── Gráfica 5: Precisión promedio diaria ─────────────────────
  const avgAccPerDay = days30.map(d => {
    const arr = accMap[d.key]
    if (!arr || arr.length === 0) return null
    return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length)
  })
  const regAcc = linearRegression(avgAccPerDay.map(v => v ?? 0))
  const accData = {
    labels: labDays30,
    datasets: [
      {
        label: 'Precisión promedio',
        data: avgAccPerDay,
        borderColor: '#1D9E75',
        backgroundColor: 'rgba(29,158,117,0.08)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: avgAccPerDay.map(v => v !== null ? '#1D9E75' : 'transparent'),
        pointBorderColor: avgAccPerDay.map(v => v !== null ? '#1D9E75' : 'transparent'),
        pointRadius: avgAccPerDay.map(v => v !== null ? 4 : 0),
        spanGaps: true,
      },
      {
        label: 'Tendencia',
        data: regAcc.trend,
        borderColor: '#EF9F27',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 3],
        pointRadius: 0,
        tension: 0,
        fill: false,
      }
    ]
  }
  const accOptions: any = {
    responsive: true, maintainAspectRatio: true,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11, weight: '700', family: 'Poppins' }, padding: 12, color: '#2A1E15' } },
      tooltip: {
        ...darkTooltip,
        callbacks: {
          title: (ctx: any) => {
            const i = ctx[0].dataIndex
            const d = days30[i]
            return d ? new Date(d.key + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'long' }) : ''
          },
          label: (ctx: any) => ctx.raw !== null ? `${ctx.dataset.label}: ${ctx.raw}%` : 'Sin datos',
        }
      }
    },
    scales: {
      y: { min: 0, max: 100, ticks: { font: { size: 10 }, color: '#6B3F2A', callback: (v: any) => `${v}%`, stepSize: 20 }, grid: { color: 'rgba(29,158,117,0.06)' } },
      x: { ticks: { font: { size: 9 }, color: '#2A1E15', maxRotation: 40, autoSkip: true, maxTicksLimit: 10 }, grid: { display: false } }
    }
  }

  const cardStyle = {
    background: 'white',
    padding: 24,
    borderRadius: 18,
    boxShadow: '0 4px 20px rgba(61,43,31,0.07)',
    border: '1.5px solid rgba(196,118,58,0.10)',
  }

  const chartTitle = (icon: React.ReactNode, label: string, sub?: string) => (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#2A1E15', margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
        {icon} {label}
      </h3>
      {sub && <p style={{ fontSize: 11, color: '#9B8070', margin: '4px 0 0', fontWeight: 600 }}>{sub}</p>}
    </div>
  )

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#2A1E15', margin: '0 0 4px' }}>
            📊 Reportes y Estadísticas
          </h1>
          <p style={{ color: '#6B3F2A', fontSize: 13, margin: 0 }}>
            Datos reales · Actualizado: {new Date().toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button
          onClick={() => exportReporteGeneral(stats, topUsers)}
          style={{
            padding: '11px 20px', borderRadius: 50, border: 'none',
            background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
            color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'Poppins, sans-serif',
            boxShadow: '0 4px 14px rgba(29,158,117,0.3)',
          }}
        >
          <Download size={15} /> Exportar CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { icon: '👥', val: totalStudents,               lbl: 'Total usuarios',       bg: '#EFF6FF', border: '#93C5FD', color: '#1D4ED8' },
          { icon: '⚡', val: activeStudents,              lbl: 'Activos',              bg: '#F0FDF4', border: '#86EFAC', color: '#16A34A' },
          { icon: '📚', val: stats?.total_lessons || 0,   lbl: 'Lecciones',            bg: '#F5F3FF', border: '#C4B5FD', color: '#7C3AED' },
          { icon: '🎖️', val: stats?.total_badges || 0,    lbl: 'Insignias entregadas', bg: '#FFFBEB', border: '#FCD34D', color: '#B45309' },
          { icon: '📝', val: sessionsDaily.length,        lbl: 'Sesiones (30 días)',   bg: '#FFF0E6', border: '#F4B885', color: '#8B4E1F' },
        ].map((k, i) => (
          <div key={i} style={{ background: k.bg, padding: '18px 20px', borderRadius: 16, border: `1.5px solid ${k.border}` }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>{k.icon}</div>
            <p style={{ fontSize: 26, fontWeight: 900, color: k.color, margin: '0 0 2px' }}>{k.val.toLocaleString()}</p>
            <p style={{ fontSize: 11, color: k.color, fontWeight: 700, margin: 0 }}>{k.lbl}</p>
          </div>
        ))}
      </div>

      {/* Gráfica de Progreso Acumulado */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        {chartTitle(<Sparkles size={18} color="#C4763A"/>, 'Evolución del Aprendizaje (Progreso General)', 'Lecciones completadas y XP total acumulado por la comunidad — Últimos 30 días')}
        <div style={{ height: 260 }}>
          <Line data={progressCumulativeData} options={progressCumulativeOptions} />
        </div>
      </div>

      {/* Fila 1: Sesiones 30d + XP 14d */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 16, marginBottom: 16 }}>
        <div style={cardStyle}>
          {chartTitle(<LineChart size={18} color="#534AB7"/>, 'Sesiones completadas por día', 'Últimos 30 días · Fechas reales · Con tendencia')}
          <div style={{ height: 220 }}>
            <Line data={lineData} options={lineOptions} />
          </div>
          <div style={{ marginTop: 10, padding: '8px 12px', background: '#F5F3FF', borderRadius: 10 }}>
            <p style={{ fontSize: 10, color: '#534AB7', fontWeight: 700, margin: 0 }}>
              📈 Tendencia: {regSess.m >= 0 ? '+' : ''}{regSess.m.toFixed(2)} ses/día · R² = {(regSess.r2 * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        <div style={cardStyle}>
          {chartTitle(<TrendingUp size={18} color="#C4763A"/>, 'XP ganado por día', 'Últimos 14 días · Fechas reales')}
          <div style={{ height: 220 }}>
            <Line data={xpLineData} options={xpLineOptions} />
          </div>
          <div style={{ marginTop: 10, padding: '8px 12px', background: '#FFF0E6', borderRadius: 10 }}>
            <p style={{ fontSize: 10, color: '#C4763A', fontWeight: 700, margin: 0 }}>
              ⚡ Total 14 días: {xpPer14.reduce((s, v) => s + v, 0).toLocaleString()} XP
            </p>
          </div>
        </div>
      </div>

      {/* Fila 2: Precisión 30d + Distribución usuarios */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 16, marginBottom: 16 }}>
        <div style={cardStyle}>
          {chartTitle(<Activity size={18} color="#1D9E75"/>, 'Precisión promedio diaria', 'Últimos 30 días · Promedio de ejercicios completados')}
          <div style={{ height: 220 }}>
            <Line data={accData} options={accOptions} />
          </div>
        </div>

        <div style={cardStyle}>
          {chartTitle(<PieChart size={18} color="#1D9E75"/>, 'Distribución de usuarios', `${totalStudents} total · ${activeStudents} activos`)}
          <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Fila 3: Top 5 (full width) */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        {chartTitle(<BarChart3 size={18} color="#C4763A"/>, '🏆 Top 5 usuarios por XP', 'Ranking global de la plataforma')}
        <div style={{ height: 240 }}>
          <Bar data={barData} options={barOptions} />
        </div>
      </div>

      {/* Actividad reciente con fechas reales */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #F0E8E0', background: 'linear-gradient(135deg,#FEFAF5,#FFF8F2)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#2A1E15', margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Activity size={18} color="#C4763A" /> Actividad reciente — Con fecha y hora exacta
          </h3>
          <p style={{ fontSize: 11, color: '#9B8070', margin: '4px 0 0', fontWeight: 600 }}>
            Últimas {recentActivity.length} sesiones de ejercicios en el sistema
          </p>
        </div>

        {recentActivity.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#B4B2A9' }}>
            <p style={{ fontSize: 14, fontWeight: 700 }}>Sin actividad registrada aún</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FEFAF5', borderBottom: '2px solid #F0E4D8' }}>
                  {['Usuario', 'Lección', 'Nivel', 'Precisión', 'XP', 'Fecha y hora'].map((h, i) => (
                    <th key={i} style={{ padding: '12px 16px', textAlign: i >= 3 ? 'center' : 'left', fontSize: 11, fontWeight: 800, color: '#6B3F2A', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((act: any, i: number) => {
                  const levelColors: Record<string, { bg: string; color: string }> = {
                    basico:     { bg: '#E1F5EE', color: '#0F6E56' },
                    intermedio: { bg: '#EEEDFE', color: '#3C3489' },
                    avanzado:   { bg: '#FFF0E6', color: '#8B4E1F' },
                    maestria:   { bg: '#FAEEDA', color: '#633806' },
                  }
                  const lc = levelColors[act.lesson_level] || { bg: '#F1EFE8', color: '#5F5E5A' }
                  const completedAt = act.completed_at ? new Date(act.completed_at) : null
                  const diffDays = completedAt ? Math.floor((Date.now() - completedAt.getTime()) / 86400000) : null
                  const timeLabel = diffDays === null ? '—'
                    : diffDays === 0 ? 'Hoy'
                    : diffDays === 1 ? 'Ayer'
                    : `Hace ${diffDays}d`
                  const accColor = act.accuracy == null ? '#9B8070'
                    : act.accuracy >= 80 ? '#0F6E56'
                    : act.accuracy >= 50 ? '#B45309'
                    : '#C0392B'

                  return (
                    <tr key={act.id} style={{ borderBottom: '1px solid #F5EDE4', background: i % 2 === 0 ? '#FEFAF5' : 'white' }}>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: 'linear-gradient(135deg,#C4763A,#D4A853)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 800, fontSize: 12, flexShrink: 0,
                          }}>
                            {act.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#2A1E15' }}>{act.username}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px', maxWidth: 180 }}>
                        <p style={{ fontSize: 12, color: '#2A1E15', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {act.lesson_title}
                        </p>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 50, background: lc.bg, color: lc.color, fontSize: 10, fontWeight: 700 }}>
                          {act.lesson_level || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        {act.accuracy != null ? (
                          <span style={{ fontSize: 13, fontWeight: 800, color: accColor }}>
                            {act.accuracy}%
                            <span style={{ display: 'block', fontSize: 9, fontWeight: 600, color: '#9B8070' }}>
                              {act.score}/{act.total}
                            </span>
                          </span>
                        ) : <span style={{ color: '#B4B2A9' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        {act.xp_gained != null ? (
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#B45309', background: '#FAEEDA', padding: '2px 8px', borderRadius: 20 }}>
                            +{act.xp_gained} XP
                          </span>
                        ) : <span style={{ color: '#B4B2A9' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        {completedAt ? (
                          <div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#2A1E15', margin: 0, whiteSpace: 'nowrap' }}>
                              {completedAt.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            <p style={{ fontSize: 11, color: '#6B3F2A', margin: '1px 0 0', whiteSpace: 'nowrap' }}>
                              {completedAt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })} · {timeLabel}
                            </p>
                          </div>
                        ) : <span style={{ fontSize: 12, color: '#B4B2A9' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}