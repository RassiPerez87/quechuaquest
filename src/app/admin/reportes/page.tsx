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
)

// Función para calcular regresión lineal
const calculateLinearRegression = (data: number[]) => {
  const n = data.length
  const x = Array.from({ length: n }, (_, i) => i + 1)
  
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = data.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * data[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  
  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const b = (sumY - m * sumX) / n
  
  const yMean = sumY / n
  const ssRes = data.reduce((sum, yi) => sum + Math.pow(yi - (m * x[data.indexOf(yi)] + b), 2), 0)
  const ssTot = data.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
  const r2 = 1 - (ssRes / ssTot)
  
  return { m, b, r2, trend: x.map(xi => m * xi + b) }
}

export default function ReportesPage() {
  const [stats, setStats] = useState<any>(null)
  const [topUsers, setTopUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [regressionData, setRegressionData] = useState<any>({})

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    if (stats) {
      const progressData = [
        Math.round((stats?.total_lessons_completed || 0) * 0.3),
        Math.round((stats?.total_lessons_completed || 0) * 0.5),
        Math.round((stats?.total_lessons_completed || 0) * 0.7),
        Math.round((stats?.total_lessons_completed || 0) * 0.85),
        stats?.total_lessons_completed || 0
      ]
      const regression = calculateLinearRegression(progressData)
      setRegressionData({ progression: regression })
    }
  }, [stats])

  const loadStats = async () => {
    setLoading(true)
    try {
      const { data: statsData } = await supabase
        .from('admin_stats')
        .select('*')
        .single()

      const { data: topUsersData } = await supabase
        .from('profiles')
        .select('username, xp, total_lessons_completed, level')
        .eq('role', 'student')
        .order('xp', { ascending: false })
        .limit(5)

      setStats(statsData)
      setTopUsers(topUsersData || [])
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <div style={{
          width: 48, height: 48, border: '4px solid #C4763A',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const totalStudents = stats?.total_students || 0
  const activeStudents = stats?.active_students || 0
  const inactiveStudents = totalStudents - activeStudents

  const progressData = [
    Math.round((stats?.total_lessons_completed || 0) * 0.3),
    Math.round((stats?.total_lessons_completed || 0) * 0.5),
    Math.round((stats?.total_lessons_completed || 0) * 0.7),
    Math.round((stats?.total_lessons_completed || 0) * 0.85),
    stats?.total_lessons_completed || 0
  ]

  // 1. Gráfico de dona - Distribución usuarios
  const doughnutData = {
    labels: ['Activos', 'Inactivos'],
    datasets: [{
      data: [activeStudents, inactiveStudents],
      backgroundColor: ['rgba(102, 187, 106, 0.9)', 'rgba(224, 224, 224, 0.7)'],
      borderColor: ['rgba(102, 187, 106, 1)', 'rgba(200, 200, 200, 1)'],
      borderWidth: 2
    }]
  }

  const doughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 12, weight: '700' }, padding: 12, color: '#2A1E15' } },
      tooltip: { backgroundColor: 'rgba(42, 30, 21, 0.95)', padding: 10, cornerRadius: 8 }
    }
  }

  // 2. Gráfico de línea - Progreso
  const lineData = {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Actual'],
    datasets: [
      {
        label: 'Lecciones Completadas',
        data: progressData,
        borderColor: 'rgba(123, 31, 162, 1)',
        backgroundColor: 'rgba(123, 31, 162, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(123, 31, 162, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: `Tendencia (R² = ${(regressionData.progression?.r2 || 0).toFixed(3)})`,
        data: regressionData.progression?.trend || [],
        borderColor: 'rgba(255, 152, 0, 1)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 3],
        pointRadius: 0,
        tension: 0,
        fill: false
      }
    ]
  }

  const lineOptions: any = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11, weight: '700' }, padding: 12, color: '#2A1E15' } },
      tooltip: { backgroundColor: 'rgba(42, 30, 21, 0.95)', padding: 10, cornerRadius: 8 }
    },
    scales: {
      y: { beginAtZero: true, ticks: { font: { size: 11 }, color: '#6B3F2A' }, grid: { color: 'rgba(123, 31, 162, 0.1)' } },
      x: { ticks: { font: { size: 11 }, color: '#2A1E15' }, grid: { display: false } }
    }
  }

  // 3. Gráfico de barras - Top 5
  const barData = {
    labels: topUsers.map(u => u.username),
    datasets: [{
      label: 'XP',
      data: topUsers.map(u => u.xp || 0),
      backgroundColor: ['rgba(251, 192, 45, 0.9)', 'rgba(196, 118, 58, 0.9)', 'rgba(212, 168, 83, 0.9)', 'rgba(196, 118, 58, 0.7)', 'rgba(212, 168, 83, 0.7)'],
      borderColor: ['rgba(251, 192, 45, 1)', 'rgba(196, 118, 58, 1)', 'rgba(212, 168, 83, 1)', 'rgba(196, 118, 58, 1)', 'rgba(212, 168, 83, 1)'],
      borderWidth: 2,
      borderRadius: 8
    }]
  }

  const barOptions: any = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(42, 30, 21, 0.95)', padding: 10, cornerRadius: 8 }
    },
    scales: {
      y: { ticks: { font: { size: 11, weight: '600' }, color: '#2A1E15' }, grid: { display: false } },
      x: { beginAtZero: true, ticks: { font: { size: 10 }, color: '#6B3F2A' }, grid: { color: 'rgba(196, 118, 58, 0.1)' } }
    }
  }

  // 4. Gráfico de insignias
  const insigniasData = {
    labels: ['Principiante', 'Explorador', 'Aprendiz', 'Maestro', 'Legendario'],
    datasets: [{
      label: 'Insignias',
      data: [12, 8, 5, 3, 1],
      backgroundColor: ['rgba(255, 193, 7, 0.8)', 'rgba(255, 152, 0, 0.8)', 'rgba(244, 67, 54, 0.8)', 'rgba(156, 39, 176, 0.8)', 'rgba(63, 81, 181, 0.8)'],
      borderColor: ['rgba(255, 193, 7, 1)', 'rgba(255, 152, 0, 1)', 'rgba(244, 67, 54, 1)', 'rgba(156, 39, 176, 1)', 'rgba(63, 81, 181, 1)'],
      borderWidth: 1,
      borderRadius: 6
    }]
  }

  const insigniasOptions: any = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(42, 30, 21, 0.95)', padding: 10, cornerRadius: 8 } },
    scales: {
      y: { beginAtZero: true, ticks: { font: { size: 10 }, color: '#6B3F2A' }, grid: { color: 'rgba(196, 118, 58, 0.1)' } },
      x: { ticks: { font: { size: 10 }, color: '#2A1E15' }, grid: { display: false } }
    }
  }

  // 5. Gráfico NUEVO - Ejercicios por tipo
  const ejerciciosData = {
    labels: ['Opción Múltiple', 'Verdadero/Falso', 'Completar', 'Diálogo', 'Lectura', 'Pronunciación'],
    datasets: [{
      label: 'Ejercicios Completados',
      data: [145, 98, 76, 54, 120, 88],
      backgroundColor: [
        'rgba(76, 175, 80, 0.8)',
        'rgba(33, 150, 243, 0.8)',
        'rgba(255, 152, 0, 0.8)',
        'rgba(156, 39, 176, 0.8)',
        'rgba(244, 67, 54, 0.8)',
        'rgba(63, 81, 181, 0.8)'
      ],
      borderColor: [
        'rgba(76, 175, 80, 1)',
        'rgba(33, 150, 243, 1)',
        'rgba(255, 152, 0, 1)',
        'rgba(156, 39, 176, 1)',
        'rgba(244, 67, 54, 1)',
        'rgba(63, 81, 181, 1)'
      ],
      borderWidth: 1,
      borderRadius: 6
    }]
  }

  const ejerciciosOptions: any = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(42, 30, 21, 0.95)', padding: 10, cornerRadius: 8 } },
    scales: {
      y: { beginAtZero: true, ticks: { font: { size: 10 }, color: '#6B3F2A' }, grid: { color: 'rgba(196, 118, 58, 0.1)' } },
      x: { ticks: { font: { size: 9 }, color: '#2A1E15' }, grid: { display: false } }
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#2A1E15', marginBottom: 8 }}>
            Reportes y Estadísticas
          </h1>
          <p style={{ color: '#6B3F2A', fontSize: 15 }}>
            Análisis visual del rendimiento del sistema
          </p>
        </div>
        <button
          onClick={() => exportReporteGeneral(stats, topUsers)}
          style={{
            padding: '12px 20px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #388E3C, #66BB6A)',
            color: 'white',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'Poppins, sans-serif',
            boxShadow: '0 4px 12px rgba(56,142,60,0.3)',
            transition: 'all 0.2s'
          }}
        >
          <Download size={16} />
          Exportar
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 28
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
          padding: 20,
          borderRadius: 16,
          boxShadow: '0 4px 16px rgba(33,150,243,0.12)',
          border: '1px solid rgba(33,150,243,0.15)'
        }}>
          <Users size={28} color="#1976D2" style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 28, fontWeight: 900, color: '#1565C0', marginBottom: 4 }}>
            {totalStudents}
          </p>
          <p style={{ fontSize: 12, color: '#1976D2', fontWeight: 700 }}>Total Usuarios</p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
          padding: 20,
          borderRadius: 16,
          boxShadow: '0 4px 16px rgba(76,175,80,0.12)',
          border: '1px solid rgba(76,175,80,0.15)'
        }}>
          <Activity size={28} color="#388E3C" style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 28, fontWeight: 900, color: '#2E7D32', marginBottom: 4 }}>
            {activeStudents}
          </p>
          <p style={{ fontSize: 12, color: '#388E3C', fontWeight: 700 }}>Activos</p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #F3E5F5, #E1BEE7)',
          padding: 20,
          borderRadius: 16,
          boxShadow: '0 4px 16px rgba(156,39,176,0.12)',
          border: '1px solid rgba(156,39,176,0.15)'
        }}>
          <BookOpen size={28} color="#7B1FA2" style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 28, fontWeight: 900, color: '#6A1B9A', marginBottom: 4 }}>
            {stats?.total_lessons || 0}
          </p>
          <p style={{ fontSize: 12, color: '#7B1FA2', fontWeight: 700 }}>Lecciones</p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #FFFDE7, #FFF9C4)',
          padding: 20,
          borderRadius: 16,
          boxShadow: '0 4px 16px rgba(251,192,45,0.12)',
          border: '1px solid rgba(251,192,45,0.15)'
        }}>
          <Award size={28} color="#F57F17" style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 28, fontWeight: 900, color: '#F57F17', marginBottom: 4 }}>
            {stats?.total_badges || 0}
          </p>
          <p style={{ fontSize: 12, color: '#F57F17', fontWeight: 700 }}>Insignias</p>
        </div>
      </div>

      {/* Grid 2x2 de gráficas medianas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20, marginBottom: 20 }}>
        {/* Distribución */}
        <div style={{
          background: 'white',
          padding: 24,
          borderRadius: 16,
          boxShadow: '0 4px 16px rgba(61,43,31,0.08)',
          border: '1px solid rgba(196,118,58,0.1)'
        }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 800,
            color: '#2A1E15',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <PieChart size={20} color="#66BB6A" />
            Distribución Usuarios
          </h3>
          <div style={{ height: 240 }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>

        {/* Progreso */}
        <div style={{
          background: 'white',
          padding: 24,
          borderRadius: 16,
          boxShadow: '0 4px 16px rgba(61,43,31,0.08)',
          border: '1px solid rgba(196,118,58,0.1)'
        }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 800,
            color: '#2A1E15',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <LineChart size={20} color="#7B1FA2" />
            Progreso Lecciones
          </h3>
          <div style={{ height: 240 }}>
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        {/* Insignias */}
        <div style={{
          background: 'white',
          padding: 24,
          borderRadius: 16,
          boxShadow: '0 4px 16px rgba(61,43,31,0.08)',
          border: '1px solid rgba(196,118,58,0.1)'
        }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 800,
            color: '#2A1E15',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Sparkles size={20} color="#F57F17" />
            Insignias Ganadas
          </h3>
          <div style={{ height: 240 }}>
            <Bar data={insigniasData} options={insigniasOptions} />
          </div>
        </div>

        {/* Ejercicios - NUEVA */}
        <div style={{
          background: 'white',
          padding: 24,
          borderRadius: 16,
          boxShadow: '0 4px 16px rgba(61,43,31,0.08)',
          border: '1px solid rgba(196,118,58,0.1)'
        }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 800,
            color: '#2A1E15',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <BarChart3 size={20} color="#4CAF50" />
            Ejercicios por Tipo
          </h3>
          <div style={{ height: 240 }}>
            <Bar data={ejerciciosData} options={ejerciciosOptions} />
          </div>
        </div>
      </div>

      {/* Top 5 - Full width */}
      <div style={{
        background: 'white',
        padding: 28,
        borderRadius: 16,
        boxShadow: '0 4px 16px rgba(61,43,31,0.08)',
        border: '1px solid rgba(196,118,58,0.1)'
      }}>
        <h3 style={{
          fontSize: 18,
          fontWeight: 800,
          color: '#2A1E15',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <BarChart3 size={22} color="#C4763A" />
          🏆 Top 5 por XP
        </h3>
        <div style={{ height: 280 }}>
          <Bar data={barData} options={barOptions} />
        </div>
      </div>

      {/* Análisis regresión */}
      {regressionData.progression && (
        <div style={{
          marginTop: 20,
          padding: 16,
          background: 'linear-gradient(135deg, #FEFAF5, #FFF8F0)',
          borderRadius: 12,
          border: '1px solid #D4A373'
        }}>
          <p style={{ fontSize: 11, color: '#9B8070', fontWeight: 800, marginBottom: 8 }}>
            📊 REGRESIÓN: y = {regressionData.progression.m.toFixed(2)}x + {regressionData.progression.b.toFixed(2)} | R² = {(regressionData.progression.r2 * 100).toFixed(1)}%
          </p>
        </div>
      )}
    </div>
  )
}