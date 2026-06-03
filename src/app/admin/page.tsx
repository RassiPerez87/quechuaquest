'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Users, BookOpen, Award, TrendingUp, Activity, UserCheck } from 'lucide-react'

interface Stats {
  total_users: number
  total_students: number
  total_lessons: number
  total_exercises: number
  total_badges: number
  active_students: number
  total_lessons_completed: number
  avg_points_per_lesson: number
}

interface RecentActivity {
  id: string
  user_name: string
  action: string
  created_at: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const { data: statsData, error: statsError } = await supabase
        .from('admin_stats')
        .select('*')
        .single()

      if (statsError) throw statsError
      setStats(statsData)

      const { data: activityData, error: activityError } = await supabase
        .from('progreso_lecciones')
        .select(`id, completed_at, user_id, profiles!inner(username)`)
        .eq('completado', true)
        .order('completed_at', { ascending: false })
        .limit(10)

      if (activityError) throw activityError
      
      const formattedActivity = activityData?.map((item: any) => ({
        id: item.id,
        user_name: item.profiles.username,
        action: 'Completó una lección',
        created_at: item.completed_at
      })) || []

      setRecentActivity(formattedActivity)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    color, 
    bgColor 
  }: { 
    icon: any
    label: string
    value: number | string
    color: string
    bgColor: string
  }) => (
    <div style={{
      background: 'white',
      borderRadius: 20,
      padding: 24,
      boxShadow: '0 4px 20px rgba(61,43,31,0.08)',
      border: '2px solid rgba(196,118,58,0.1)',
      transition: 'transform 0.3s, box-shadow 0.3s'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          padding: 12,
          borderRadius: 12,
          background: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={24} style={{ color }} />
        </div>
      </div>
      <p style={{
        fontSize: 32,
        fontWeight: 900,
        color: '#2A1E15',
        marginBottom: 4,
        fontFamily: 'Poppins, sans-serif'
      }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p style={{ fontSize: 13, color: '#9B8070', fontWeight: 600 }}>
        {label}
      </p>
    </div>
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <div style={{
          width: 48, height: 48,
          border: '4px solid #C4763A',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 30,
          fontWeight: 900,
          color: '#2A1E15',
          marginBottom: 8,
          fontFamily: 'Poppins, sans-serif'
        }}>
          Panel de Control
        </h1>
        <p style={{ color: '#9B8070', fontSize: 15 }}>
          Vista general del sistema QuechuaQuest
        </p>
      </div>

      {/* Estadísticas Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        marginBottom: 32
      }}>
        <StatCard
          icon={Users}
          label="Total de Usuarios"
          value={stats?.total_students || 0}
          color="#1976D2"
          bgColor="#E3F2FD"
        />
        <StatCard
          icon={UserCheck}
          label="Estudiantes Activos"
          value={stats?.active_students || 0}
          color="#388E3C"
          bgColor="#E8F5E9"
        />
        <StatCard
          icon={BookOpen}
          label="Lecciones Totales"
          value={stats?.total_lessons || 0}
          color="#7B1FA2"
          bgColor="#F3E5F5"
        />
        <StatCard
          icon={Activity}
          label="Ejercicios Totales"
          value={stats?.total_exercises || 0}
          color="#F57C00"
          bgColor="#FFF3E0"
        />
        <StatCard
          icon={Award}
          label="Insignias Disponibles"
          value={stats?.total_badges || 0}
          color="#FBC02D"
          bgColor="#FFFDE7"
        />
        <StatCard
          icon={TrendingUp}
          label="Lecciones Completadas"
          value={stats?.total_lessons_completed || 0}
          color="#C2185B"
          bgColor="#FCE4EC"
        />
      </div>

      {/* Sección inferior: Actividad y Métricas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 24
      }}>
        {/* Actividad Reciente */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 4px 20px rgba(61,43,31,0.08)',
          border: '2px solid rgba(196,118,58,0.1)'
        }}>
          <h2 style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#2A1E15',
            marginBottom: 20,
            fontFamily: 'Poppins, sans-serif'
          }}>
            Actividad Reciente
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    background: '#FEFAF5',
                    borderRadius: 12,
                    border: '1px solid #F5EDE4'
                  }}
                >
                  <div style={{
                    width: 8,
                    height: 8,
                    background: '#C4763A',
                    borderRadius: '50%',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#2A1E15',
                      marginBottom: 2
                    }}>
                      {activity.user_name}
                    </p>
                    <p style={{ fontSize: 12, color: '#9B8070' }}>
                      {activity.action}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, color: '#B8A898' }}>
                    {new Date(activity.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
              ))
            ) : (
              <p style={{
                textAlign: 'center',
                color: '#B8A898',
                padding: '40px 0',
                fontSize: 14
              }}>
                No hay actividad reciente
              </p>
            )}
          </div>
        </div>

        {/* Métricas de Rendimiento */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 4px 20px rgba(61,43,31,0.08)',
          border: '2px solid rgba(196,118,58,0.1)'
        }}>
          <h2 style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#2A1E15',
            marginBottom: 20,
            fontFamily: 'Poppins, sans-serif'
          }}>
            Métricas de Rendimiento
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Promedio de Progreso */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8
              }}>
                <span style={{ fontSize: 13, color: '#6B3F2A', fontWeight: 600 }}>
                  Promedio de Progreso
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#C4763A' }}>
                  {stats?.avg_points_per_lesson?.toFixed(1) || '0'}%
                </span>
              </div>
              <div style={{
                width: '100%',
                height: 8,
                background: '#F0E4D8',
                borderRadius: 50,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min((stats?.avg_points_per_lesson || 0), 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #C4763A, #D4A853)',
                  borderRadius: 50,
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>

            {/* Tasa de Participación */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8
              }}>
                <span style={{ fontSize: 13, color: '#6B3F2A', fontWeight: 600 }}>
                  Tasa de Participación
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#388E3C' }}>
                  {stats && stats.total_students > 0
                    ? ((stats.active_students / stats.total_students) * 100).toFixed(1)
                    : '0'}%
                </span>
              </div>
              <div style={{
                width: '100%',
                height: 8,
                background: '#F0E4D8',
                borderRadius: 50,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${stats && stats.total_students > 0 
                    ? (stats.active_students / stats.total_students) * 100 
                    : 0}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #388E3C, #66BB6A)',
                  borderRadius: 50,
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>

            <div style={{
              paddingTop: 16,
              borderTop: '1px solid #F5EDE4',
              marginTop: 8
            }}>
              <p style={{
                fontSize: 11,
                color: '#B8A898',
                textAlign: 'center'
              }}>
                Estadísticas actualizadas en tiempo real
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}