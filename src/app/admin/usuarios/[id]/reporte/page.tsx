'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  ArrowLeft, Download, User, Calendar, BookOpen, Award, Target,
  TrendingUp, Clock, CheckCircle, XCircle, Activity, Shield, Star
} from 'lucide-react'

// ── Helpers de fecha ──────────────────────────────────────────────
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`
  if (days < 365) return `Hace ${Math.floor(days / 30)} meses`
  return `Hace ${Math.floor(days / 365)} años`
}

// ── Exportar CSV del reporte individual ──────────────────────────
function exportReporteIndividualCSV(
  usuario: any,
  lecciones: any[],
  sesiones: any[],
  insignias: any[]
) {
  const BOM = '\ufeff'
  const rows: string[][] = []

  rows.push(['REPORTE INDIVIDUAL — QuechuaQuest'])
  rows.push(['Generado el', new Date().toLocaleString('es-ES')])
  rows.push([])
  rows.push(['DATOS DEL USUARIO'])
  rows.push(['Usuario', usuario.username || ''])
  rows.push(['Nombre Completo', usuario.full_name || ''])
  rows.push(['Email', usuario.email || ''])
  rows.push(['Rol', usuario.role === 'admin' ? 'Administrador' : 'Estudiante'])
  rows.push(['Fecha de Registro', formatDate(usuario.created_at)])
  rows.push(['XP Total', String(usuario.xp || 0)])
  rows.push(['Nivel', String(usuario.level || 1)])
  rows.push([])
  rows.push(['HISTORIAL DE LECCIONES'])
  rows.push(['Lección', 'Nivel', 'Fecha Completada', 'Progreso (%)', 'XP Ganado'])
  lecciones.forEach(l => {
    rows.push([
      l.title_es || l.title || 'Sin título',
      l.level || '',
      formatDate(l.completed_at),
      String(l.progreso || 0),
      String(l.xp_gained || l.xp_reward || 0)
    ])
  })
  rows.push([])
  rows.push(['HISTORIAL DE SESIONES DE EJERCICIO'])
  rows.push(['Lección', 'Fecha', 'Puntaje', 'Total Preguntas', 'Precisión (%)', 'XP Ganado'])
  sesiones.forEach(s => {
    rows.push([
      s.lesson_title || '',
      formatDateTime(s.completed_at),
      String(s.score || 0),
      String(s.total || 0),
      String(s.accuracy || 0),
      String(s.xp_gained || 0)
    ])
  })
  rows.push([])
  rows.push(['INSIGNIAS OBTENIDAS'])
  rows.push(['Insignia', 'Descripción', 'Fecha Obtenida'])
  insignias.forEach(i => {
    rows.push([
      i.nombre || '',
      i.descripcion || '',
      formatDate(i.earned_at)
    ])
  })

  const csv = rows.map(r => r.map(cell => {
    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
      return `"${cell.replace(/"/g, '""')}"`
    }
    return cell
  }).join(',')).join('\n')

  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reporte_${usuario.username}_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Componente principal ─────────────────────────────────────────
export default function ReporteIndividualPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [usuario, setUsuario] = useState<any>(null)
  const [lecciones, setLecciones] = useState<any[]>([])
  const [sesiones, setSesiones] = useState<any[]>([])
  const [insignias, setInsignias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'lecciones' | 'sesiones' | 'insignias' | 'timeline'>('timeline')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Perfil del usuario
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      setUsuario(profile)

      // Lecciones completadas con detalle y FECHA
      const { data: leccionesData } = await supabase
        .from('progreso_lecciones')
        .select(`
          progreso,
          completado,
          completed_at,
          updated_at,
          lessons(id, title, title_es, level, xp_reward, order)
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })

      const leccionesMapped = (leccionesData || []).map((l: any) => ({
        ...l.lessons,
        progreso: l.progreso,
        completado: l.completado,
        completed_at: l.completed_at,
        updated_at: l.updated_at,
      })).filter((l: any) => l.id)

      setLecciones(leccionesMapped)

      // Sesiones de ejercicio con FECHA
      const { data: sesionesData } = await supabase
        .from('exercise_sessions')
        .select(`
          id,
          lesson_id,
          score,
          total,
          accuracy,
          xp_gained,
          completed_at
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })

      let sesionesMapped: any[] = []
      if (sesionesData && sesionesData.length > 0) {
        const lessonIds = Array.from(new Set(sesionesData.map(s => s.lesson_id).filter(Boolean)))
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

        sesionesMapped = sesionesData.map((s: any) => ({
          ...s,
          lesson_title: lessonsMap[s.lesson_id]?.title_es || lessonsMap[s.lesson_id]?.title || 'Sin título',
          lesson_level: lessonsMap[s.lesson_id]?.level || '',
        }))
      }

      setSesiones(sesionesMapped)

      // Insignias con FECHA de obtención
      const { data: insigniasData } = await supabase
        .from('user_insignias')
        .select(`
          earned_at,
          insignias(id, nombre, descripcion, icono, condicion)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })

      const insigniasMapped = (insigniasData || []).map((i: any) => ({
        ...i.insignias,
        earned_at: i.earned_at,
      })).filter((i: any) => i.id)

      setInsignias(insigniasMapped)

    } catch (err) {
      console.error('Error cargando reporte:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, margin: '0 auto 16px',
            border: '4px solid #C4763A', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#9B8070', fontWeight: 600, fontSize: 14 }}>Cargando reporte...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (!usuario) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
        <h2 style={{ color: '#2A1E15', fontWeight: 800 }}>Usuario no encontrado</h2>
        <button
          onClick={() => router.push('/admin/usuarios')}
          style={{
            marginTop: 24, padding: '10px 24px', borderRadius: 12,
            border: 'none', background: '#C4763A', color: 'white',
            fontWeight: 700, cursor: 'pointer'
          }}
        >
          ← Volver a Usuarios
        </button>
      </div>
    )
  }

  const isAdmin = usuario.role === 'admin'
  const leccionesCompletadas = lecciones.filter(l => l.completado)
  const avgAccuracy = sesiones.length > 0
    ? Math.round(sesiones.reduce((s: number, x: any) => s + (x.accuracy || 0), 0) / sesiones.length)
    : 0
  const totalXPSesiones = sesiones.reduce((s: number, x: any) => s + (x.xp_gained || 0), 0)

  // Timeline unificado ordenado por fecha
  const timeline = [
    // Registro
    {
      type: 'registro',
      date: usuario.created_at,
      label: '🎉 Se registró en QuechuaQuest',
      detail: '',
      color: '#1976D2',
      bg: '#E3F2FD'
    },
    // Lecciones completadas
    ...leccionesCompletadas.map(l => ({
      type: 'leccion',
      date: l.completed_at,
      label: `📚 Completó: ${l.title_es || l.title || 'Lección'}`,
      detail: `Progreso: ${l.progreso}% · ${l.level || ''}`,
      color: '#388E3C',
      bg: '#E8F5E9'
    })),
    // Sesiones de ejercicio
    ...sesiones.map(s => ({
      type: 'sesion',
      date: s.completed_at,
      label: `⚡ Ejercicio: ${s.lesson_title}`,
      detail: `${s.score}/${s.total} correctas · ${s.accuracy}% · +${s.xp_gained} XP`,
      color: '#7B1FA2',
      bg: '#F3E5F5'
    })),
    // Insignias
    ...insignias.map(i => ({
      type: 'insignia',
      date: i.earned_at,
      label: `🏆 Insignia: ${i.nombre}`,
      detail: i.descripcion || '',
      color: '#F57C00',
      bg: '#FFF3E0'
    }))
  ]
    .filter(e => e.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const tabs = [
    { key: 'timeline', label: '📅 Cronología', count: timeline.length },
    { key: 'lecciones', label: '📚 Lecciones', count: lecciones.length },
    { key: 'sesiones', label: '⚡ Ejercicios', count: sesiones.length },
    { key: 'insignias', label: '🏆 Insignias', count: insignias.length },
  ] as const

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', maxWidth: 900, margin: '0 auto' }}>

      {/* Header navegación */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <button
          onClick={() => router.push('/admin/usuarios')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 12,
            border: '2px solid #F0E4D8', background: 'white',
            color: '#6B3F2A', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', transition: 'all 0.2s',
            fontFamily: 'Poppins, sans-serif'
          }}
        >
          <ArrowLeft size={16} />
          Volver a Usuarios
        </button>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#2A1E15', margin: 0 }}>
            Reporte Individual
          </h1>
          <p style={{ fontSize: 13, color: '#9B8070', margin: 0 }}>
            Historial completo de actividad y progreso
          </p>
        </div>
        <button
          onClick={() => exportReporteIndividualCSV(usuario, lecciones, sesiones, insignias)}
          style={{
            marginLeft: 'auto',
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #388E3C, #66BB6A)',
            color: 'white', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
            boxShadow: '0 4px 12px rgba(56,142,60,0.3)'
          }}
        >
          <Download size={16} />
          Exportar CSV
        </button>
      </div>

      {/* Perfil del usuario */}
      <div style={{
        background: isAdmin
          ? 'linear-gradient(135deg, #E65100, #F57C00)'
          : 'linear-gradient(135deg, #3D2B1F, #6B3F2A)',
        borderRadius: 24, padding: 28, marginBottom: 20,
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: isAdmin
              ? 'linear-gradient(135deg, #FBC02D, #F57F17)'
              : 'linear-gradient(135deg, #C4763A, #D4A853)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, fontWeight: 800, color: 'white',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)', flexShrink: 0
          }}>
            {isAdmin ? <Shield size={40} /> : usuario.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: 50,
              background: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 700,
              color: 'white', marginBottom: 6
            }}>
              {isAdmin ? '👑 ADMINISTRADOR' : '👤 ESTUDIANTE'}
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: '0 0 4px' }}>
              {usuario.username}
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: '0 0 2px' }}>
              {usuario.full_name || 'Sin nombre completo'}
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              {usuario.email || 'Sin email'}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'right' }}>
            <div style={{
              background: 'rgba(255,255,255,0.15)', borderRadius: 12,
              padding: '10px 16px', backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                <Calendar size={14} color="rgba(255,255,255,0.8)" />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  Registrado el
                </span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'white', margin: '4px 0 0' }}>
                {formatDate(usuario.created_at)}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: '2px 0 0' }}>
                {timeAgo(usuario.created_at)}
              </p>
            </div>
            {usuario.last_activity && (
              <div style={{
                background: 'rgba(255,255,255,0.1)', borderRadius: 12,
                padding: '8px 16px', textAlign: 'right'
              }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                  Última actividad: {timeAgo(usuario.last_activity)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {!isAdmin && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 14, marginBottom: 20
        }}>
          {[
            { icon: TrendingUp, label: 'XP Total', value: (usuario.xp || 0).toLocaleString(), color: '#C4763A', bg: '#FFF3E0', border: '#F4B885' },
            { icon: Star, label: 'Nivel', value: usuario.level || 1, color: '#7B1FA2', bg: '#F3E5F5', border: '#CE93D8' },
            { icon: BookOpen, label: 'Lecciones hechas', value: leccionesCompletadas.length, color: '#1976D2', bg: '#E3F2FD', border: '#90CAF9' },
            { icon: Target, label: 'Precisión promedio', value: `${avgAccuracy}%`, color: '#388E3C', bg: '#E8F5E9', border: '#A5D6A7' },
            { icon: Activity, label: 'Sesiones realizadas', value: sesiones.length, color: '#F57C00', bg: '#FFF3E0', border: '#FFB74D' },
            { icon: Award, label: 'Insignias', value: insignias.length, color: '#FBC02D', bg: '#FFFDE7', border: '#FFE082' },
          ].map(({ icon: Icon, label, value, color, bg, border }) => (
            <div key={label} style={{
              background: bg, borderRadius: 16, padding: '16px 18px',
              border: `1.5px solid ${border}`,
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon size={18} color={color} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6B3F2A' }}>{label}</span>
              </div>
              <p style={{ fontSize: 24, fontWeight: 900, color, margin: 0, lineHeight: 1 }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 18px', borderRadius: 12,
              border: activeTab === tab.key ? 'none' : '2px solid #F0E4D8',
              background: activeTab === tab.key
                ? 'linear-gradient(135deg, #3D2B1F, #6B3F2A)'
                : '#FEFAF5',
              color: activeTab === tab.key ? 'white' : '#6B3F2A',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            {tab.label}
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 20, height: 20, borderRadius: '50%',
              background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : '#F0E4D8',
              fontSize: 10, fontWeight: 800,
              color: activeTab === tab.key ? 'white' : '#9B8070'
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* PANEL: CRONOLOGÍA */}
      {activeTab === 'timeline' && (
        <div style={{
          background: 'white', borderRadius: 20, padding: 28,
          boxShadow: '0 4px 20px rgba(61,43,31,0.08)',
          border: '2px solid rgba(196,118,58,0.1)'
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#2A1E15', marginBottom: 24 }}>
            📅 Cronología Completa de Actividad
          </h3>
          {timeline.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#B8A898' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <p style={{ fontSize: 14, fontWeight: 600 }}>Sin actividad registrada aún</p>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              {/* Línea vertical */}
              <div style={{
                position: 'absolute', left: 19, top: 0, bottom: 0,
                width: 2, background: 'linear-gradient(180deg, #C4763A, #F0E4D8)',
                borderRadius: 2
              }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {timeline.map((event, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 16, paddingBottom: 16,
                    animation: `fadeUp 0.3s ease ${i * 0.03}s both`
                  }}>
                    {/* Punto en la línea */}
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: event.bg, border: `2px solid ${event.color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, fontSize: 16, zIndex: 1
                    }}>
                      {event.type === 'registro' ? '🎉' :
                        event.type === 'leccion' ? '📚' :
                        event.type === 'sesion' ? '⚡' : '🏆'}
                    </div>
                    {/* Contenido */}
                    <div style={{
                      flex: 1, background: '#FEFAF5', borderRadius: 12,
                      padding: '12px 16px', border: `1px solid ${event.bg}`,
                      marginTop: 4
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#2A1E15', margin: 0 }}>
                          {event.label}
                        </p>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: event.color, margin: 0 }}>
                            {formatDate(event.date)}
                          </p>
                          <p style={{ fontSize: 10, color: '#B8A898', margin: '2px 0 0' }}>
                            {timeAgo(event.date)}
                          </p>
                        </div>
                      </div>
                      {event.detail && (
                        <p style={{ fontSize: 11, color: '#9B8070', margin: '4px 0 0' }}>
                          {event.detail}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PANEL: LECCIONES */}
      {activeTab === 'lecciones' && (
        <div style={{
          background: 'white', borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(61,43,31,0.08)',
          border: '2px solid rgba(196,118,58,0.1)'
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #F5EDE4' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#2A1E15', margin: 0 }}>
              📚 Historial de Lecciones
            </h3>
            <p style={{ fontSize: 13, color: '#9B8070', margin: '4px 0 0' }}>
              {leccionesCompletadas.length} lecciones completadas de {lecciones.length} iniciadas
            </p>
          </div>
          {lecciones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#B8A898' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
              <p style={{ fontSize: 14, fontWeight: 600 }}>Sin lecciones registradas</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #3D2B1F, #6B3F2A)', color: 'white' }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700 }}>Lección</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>Nivel</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>Estado</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>Progreso</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>Fecha Completada</th>
                  </tr>
                </thead>
                <tbody>
                  {lecciones.map((leccion, i) => {
                    const levelColors: Record<string, { bg: string, color: string }> = {
                      basico: { bg: '#E8F5E9', color: '#2E7D32' },
                      intermedio: { bg: '#EDE7F6', color: '#4527A0' },
                      avanzado: { bg: '#FFF3E0', color: '#E65100' },
                      maestria: { bg: '#FCE4EC', color: '#880E4F' },
                    }
                    const lc = levelColors[leccion.level] || { bg: '#F5F5F5', color: '#666' }
                    return (
                      <tr key={i} style={{
                        borderBottom: '1px solid #F5EDE4',
                        background: i % 2 === 0 ? '#FEFAF5' : 'white'
                      }}>
                        <td style={{ padding: '14px 16px' }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#2A1E15', margin: 0 }}>
                            {leccion.title_es || leccion.title || 'Lección'}
                          </p>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block', padding: '4px 10px', borderRadius: 50,
                            background: lc.bg, color: lc.color, fontSize: 11, fontWeight: 700
                          }}>
                            {leccion.level || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {leccion.completado ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              color: '#388E3C', fontSize: 12, fontWeight: 700
                            }}>
                              <CheckCircle size={14} /> Completada
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              color: '#F57C00', fontSize: 12, fontWeight: 700
                            }}>
                              <Clock size={14} /> En progreso
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                            <div style={{ width: 60, height: 6, background: '#F0E4D8', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{
                                width: `${leccion.progreso || 0}%`, height: '100%',
                                background: 'linear-gradient(90deg, #C4763A, #D4A853)', borderRadius: 3
                              }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#C4763A', minWidth: 32 }}>
                              {leccion.progreso || 0}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {leccion.completed_at ? (
                            <div>
                              <p style={{ fontSize: 12, fontWeight: 700, color: '#2A1E15', margin: 0 }}>
                                {formatDate(leccion.completed_at)}
                              </p>
                              <p style={{ fontSize: 10, color: '#B8A898', margin: '2px 0 0' }}>
                                {timeAgo(leccion.completed_at)}
                              </p>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: '#B8A898' }}>—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PANEL: SESIONES DE EJERCICIO */}
      {activeTab === 'sesiones' && (
        <div style={{
          background: 'white', borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(61,43,31,0.08)',
          border: '2px solid rgba(196,118,58,0.1)'
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #F5EDE4' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#2A1E15', margin: 0 }}>
              ⚡ Historial de Ejercicios
            </h3>
            <p style={{ fontSize: 13, color: '#9B8070', margin: '4px 0 0' }}>
              {sesiones.length} sesiones de ejercicio · Precisión promedio: {avgAccuracy}%
            </p>
          </div>
          {sesiones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#B8A898' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
              <p style={{ fontSize: 14, fontWeight: 600 }}>Sin sesiones de ejercicio registradas</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #3D2B1F, #6B3F2A)', color: 'white' }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700 }}>Lección / Ejercicio</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>Fecha</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>Puntaje</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>Precisión</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>XP Ganado</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {sesiones.map((sesion: any, i: number) => {
                    const acc = sesion.accuracy || 0
                    const accColor = acc >= 80 ? '#388E3C' : acc >= 50 ? '#F57C00' : '#D32F2F'
                    const accBg = acc >= 80 ? '#E8F5E9' : acc >= 50 ? '#FFF3E0' : '#FFEBEE'
                    return (
                      <tr key={i} style={{
                        borderBottom: '1px solid #F5EDE4',
                        background: i % 2 === 0 ? '#FEFAF5' : 'white'
                      }}>
                        <td style={{ padding: '14px 16px' }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#2A1E15', margin: 0 }}>
                            {sesion.lesson_title}
                          </p>
                          {sesion.lesson_level && (
                            <p style={{ fontSize: 10, color: '#9B8070', margin: '2px 0 0' }}>
                              Nivel: {sesion.lesson_level}
                            </p>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#2A1E15', margin: 0 }}>
                            {formatDate(sesion.completed_at)}
                          </p>
                          <p style={{ fontSize: 10, color: '#B8A898', margin: '2px 0 0' }}>
                            {timeAgo(sesion.completed_at)}
                          </p>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#2A1E15' }}>
                            {sesion.score || 0}
                          </span>
                          <span style={{ fontSize: 11, color: '#9B8070' }}>
                            /{sesion.total || 0}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block', padding: '4px 10px', borderRadius: 50,
                            background: accBg, color: accColor, fontSize: 12, fontWeight: 800
                          }}>
                            {acc}%
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#C4763A' }}>
                            +{sesion.xp_gained || 0} XP
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {acc >= 70 ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              color: '#388E3C', fontSize: 12, fontWeight: 700
                            }}>
                              <CheckCircle size={14} /> Aprobado
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              color: '#D32F2F', fontSize: 12, fontWeight: 700
                            }}>
                              <XCircle size={14} /> Repaso
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PANEL: INSIGNIAS */}
      {activeTab === 'insignias' && (
        <div style={{
          background: 'white', borderRadius: 20, padding: 28,
          boxShadow: '0 4px 20px rgba(61,43,31,0.08)',
          border: '2px solid rgba(196,118,58,0.1)'
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#2A1E15', marginBottom: 6 }}>
            🏆 Insignias Obtenidas
          </h3>
          <p style={{ fontSize: 13, color: '#9B8070', marginBottom: 24 }}>
            {insignias.length} insignias ganadas
          </p>
          {insignias.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#B8A898' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
              <p style={{ fontSize: 14, fontWeight: 600 }}>Sin insignias obtenidas aún</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16
            }}>
              {insignias.map((insignia: any, i: number) => (
                <div key={i} style={{
                  background: 'linear-gradient(135deg, #FFFDE7, #FFF9C4)',
                  borderRadius: 16, padding: 20, textAlign: 'center',
                  border: '2px solid #FBC02D',
                  boxShadow: '0 4px 12px rgba(251,192,45,0.15)',
                  transition: 'transform 0.2s',
                }}>
                  <div style={{ fontSize: 44, marginBottom: 8 }}>{insignia.icono || '🏆'}</div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#6B3F2A', marginBottom: 4 }}>
                    {insignia.nombre}
                  </p>
                  {insignia.descripcion && (
                    <p style={{ fontSize: 11, color: '#9B8070', marginBottom: 8, lineHeight: 1.4 }}>
                      {insignia.descripcion}
                    </p>
                  )}
                  {insignia.earned_at && (
                    <div style={{
                      background: 'rgba(251,192,45,0.15)', borderRadius: 8,
                      padding: '6px 10px', marginTop: 8
                    }}>
                      <p style={{ fontSize: 10, color: '#9B8070', margin: 0, fontWeight: 600 }}>
                        Obtenida el
                      </p>
                      <p style={{ fontSize: 12, fontWeight: 800, color: '#6B3F2A', margin: '2px 0 0' }}>
                        {formatDate(insignia.earned_at)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
