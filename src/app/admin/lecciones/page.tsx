'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Search, Plus, Edit2, Trash2, Eye, EyeOff, BookOpen } from 'lucide-react'
import LeccionModal from '@/components/admin/LeccionModal'

interface Leccion {
  id: string
  title: string
  title_es: string
  level: string
  order: number
  xp_reward: number
  description: string
  is_active: boolean
  created_at: string
}

export default function LeccionesPage() {
  const [lecciones, setLecciones] = useState<Leccion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLevel, setFilterLevel] = useState<'all' | 'basico' | 'intermedio' | 'avanzado'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingLeccion, setEditingLeccion] = useState<Leccion | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadLecciones()
  }, [])

  const loadLecciones = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('order', { ascending: true })

      if (error) throw error
      setLecciones(data || [])
    } catch (error) {
      console.error('Error loading lecciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ is_active: !currentState })
        .eq('id', id)

      if (error) throw error
      loadLecciones()
    } catch (error) {
      console.error('Error toggling active:', error)
    }
  }

  const handleSave = async (data: any) => {
    try {
      if (editingLeccion) {
        // Actualizar
        const { error } = await supabase
          .from('lessons')
          .update(data)
          .eq('id', editingLeccion.id)

        if (error) throw error
        alert('✅ Lección actualizada correctamente')
      } else {
        // Crear nueva
        const { error } = await supabase
          .from('lessons')
          .insert([data])

        if (error) throw error
        alert('✅ Lección creada correctamente')
      }

      setShowModal(false)
      setEditingLeccion(null)
      loadLecciones()
    } catch (error) {
      console.error('Error saving leccion:', error)
      alert('❌ Error al guardar la lección')
    }
  }

  const handleEdit = (leccion: Leccion) => {
    setEditingLeccion(leccion)
    setShowModal(true)
  }

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`¿Estás seguro de eliminar la lección "${title}"?\n\nEsta acción no se puede deshacer.`)) {
      try {
        const { error } = await supabase
          .from('lessons')
          .delete()
          .eq('id', id)

        if (error) throw error
        alert('✅ Lección eliminada')
        loadLecciones()
      } catch (error) {
        console.error('Error deleting leccion:', error)
        alert('❌ Error al eliminar la lección')
      }
    }
  }

  const filteredLecciones = lecciones.filter(l => {
    const matchSearch = 
      l.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.title_es?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchLevel = filterLevel === 'all' || l.level === filterLevel
    
    return matchSearch && matchLevel
  })

  const getLevelColor = (level: string) => {
    switch(level) {
      case 'basico': return { bg: '#E3F2FD', text: '#1565C0' }
      case 'intermedio': return { bg: '#FFF3E0', text: '#E65100' }
      case 'avanzado': return { bg: '#FCE4EC', text: '#C2185B' }
      default: return { bg: '#F5F5F5', text: '#616161' }
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
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: '#2A1E15', marginBottom: 8 }}>
            Gestión de Lecciones
          </h1>
          <p style={{ color: '#6B3F2A', fontSize: 15 }}>
            Administra el contenido del curso de Quechua
          </p>
        </div>
        <button
          onClick={() => {
            setEditingLeccion(null)
            setShowModal(true)
          }}
          style={{
            padding: '12px 20px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #7B1FA2, #9C27B0)',
            color: 'white',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'Poppins, sans-serif',
            boxShadow: '0 4px 12px rgba(123,31,162,0.3)',
            transition: 'all 0.2s'
          }}
        >
          <Plus size={18} />
          Nueva Lección
        </button>
      </div>

      {/* Controles */}
      <div style={{
        background: 'white', borderRadius: 20, padding: 24,
        boxShadow: '0 4px 20px rgba(61,43,31,0.08)',
        border: '2px solid rgba(196,118,58,0.1)',
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 250, position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9B8070' }} />
            <input
              type="text"
              placeholder="Buscar lecciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px 12px 48px', borderRadius: 12,
                border: '2px solid #F0E4D8', fontSize: 14, outline: 'none',
                fontFamily: 'Poppins, sans-serif', background: '#FEFAF5'
              }}
            />
          </div>

          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as any)}
            style={{
              padding: '12px 16px', borderRadius: 12, border: '2px solid #F0E4D8',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', outline: 'none',
              fontFamily: 'Poppins, sans-serif', background: '#FEFAF5'
            }}
          >
            <option value="all">Todos los niveles</option>
            <option value="basico">Básico</option>
            <option value="intermedio">Intermedio</option>
            <option value="avanzado">Avanzado</option>
          </select>
        </div>

        <div style={{ marginTop: 16, fontSize: 13, color: '#9B8070' }}>
          Mostrando {filteredLecciones.length} de {lecciones.length} lecciones
        </div>
      </div>

      {/* Grid de lecciones */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 20
      }}>
        {filteredLecciones.map((leccion) => {
          const colors = getLevelColor(leccion.level)
          return (
            <div
              key={leccion.id}
              style={{
                background: 'white',
                borderRadius: 20,
                padding: 20,
                boxShadow: '0 4px 20px rgba(61,43,31,0.08)',
                border: '2px solid rgba(196,118,58,0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                opacity: leccion.is_active ? 1 : 0.6
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 50, height: 50,
                  background: colors.bg,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <BookOpen size={24} style={{ color: colors.text }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: 50,
                    fontSize: 11,
                    fontWeight: 700,
                    background: colors.bg,
                    color: colors.text,
                    marginBottom: 6
                  }}>
                    {leccion.level?.toUpperCase() || 'BÁSICO'}
                  </div>
                  <h3 style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: '#2A1E15',
                    marginBottom: 4,
                    lineHeight: 1.3
                  }}>
                    {leccion.title_es}
                  </h3>
                  <p style={{ fontSize: 13, color: '#9B8070', fontStyle: 'italic' }}>
                    {leccion.title}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                marginBottom: 16,
                padding: '12px 0',
                borderTop: '1px solid #F5EDE4',
                borderBottom: '1px solid #F5EDE4'
              }}>
                <div>
                  <p style={{ fontSize: 11, color: '#9B8070', marginBottom: 2 }}>Orden</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#6B3F2A' }}>
                    #{leccion.order}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#9B8070', marginBottom: 2 }}>Recompensa</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#C4763A' }}>
                    {leccion.xp_reward} XP
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => toggleActive(leccion.id, leccion.is_active)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 8,
                    border: 'none',
                    background: leccion.is_active ? '#E8F5E9' : '#FFEBEE',
                    color: leccion.is_active ? '#2E7D32' : '#C62828',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    transition: 'all 0.2s',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  {leccion.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                  {leccion.is_active ? 'Activa' : 'Inactiva'}
                </button>
                <button
                  onClick={() => handleEdit(leccion)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#E3F2FD',
                    color: '#1976D2',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.2s',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(leccion.id, leccion.title_es)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#FFEBEE',
                    color: '#D32F2F',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.2s',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filteredLecciones.length === 0 && (
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 60,
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(61,43,31,0.08)',
          border: '2px solid rgba(196,118,58,0.1)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#2A1E15' }}>
            No se encontraron lecciones
          </p>
          <p style={{ fontSize: 13, color: '#9B8070' }}>
            Intenta cambiar los filtros de búsqueda
          </p>
        </div>
      )}

      {showModal && (
        <LeccionModal
          leccion={editingLeccion}
          onClose={() => {
            setShowModal(false)
            setEditingLeccion(null)
          }}
          onSave={handleSave}
        />
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}