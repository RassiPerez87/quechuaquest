'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Search, Award, Users, Plus, Edit2, Trash2 } from 'lucide-react'
import InsigniaModal from '@/components/admin/InsigniaModal'

interface Insignia {
  id: number
  nombre: string
  descripcion: string
  icono: string
  condicion: string
  total_users?: number
}

export default function InsigniasPage() {
  const [insignias, setInsignias] = useState<Insignia[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingInsignia, setEditingInsignia] = useState<Insignia | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadInsignias()
  }, [])

  const loadInsignias = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('insignias')
        .select('id, nombre, descripcion, icono, condicion')
        .order('id', { ascending: true })

      if (error) {
        console.error('Error fetching insignias:', error)
        setInsignias([])
        setLoading(false)
        return
      }

      const insigniasConConteo = await Promise.all(
        (data || []).map(async (insignia) => {
          try {
            const { count, error: countError } = await supabase
              .from('user_insignias')
              .select('*', { count: 'exact', head: true })
              .eq('insignia_id', insignia.id)

            if (countError) {
              console.warn(`Error counting users for insignia ${insignia.id}:`, countError)
              return { ...insignia, total_users: 0 }
            }

            return { ...insignia, total_users: count || 0 }
          } catch (err) {
            console.warn(`Error processing insignia ${insignia.id}:`, err)
            return { ...insignia, total_users: 0 }
          }
        })
      )

      setInsignias(insigniasConConteo)
    } catch (error) {
      console.error('Error general loading insignias:', error)
      setInsignias([])
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (data: any) => {
    try {
      if (editingInsignia) {
        // Actualizar
        const { error } = await supabase
          .from('insignias')
          .update(data)
          .eq('id', editingInsignia.id)

        if (error) throw error
        alert('✅ Insignia actualizada correctamente')
      } else {
        // Crear nueva
        const { error } = await supabase
          .from('insignias')
          .insert([data])

        if (error) throw error
        alert('✅ Insignia creada correctamente')
      }

      setShowModal(false)
      setEditingInsignia(null)
      loadInsignias()
    } catch (error) {
      console.error('Error saving insignia:', error)
      alert('❌ Error al guardar la insignia')
    }
  }

  const handleEdit = (insignia: Insignia) => {
    setEditingInsignia(insignia)
    setShowModal(true)
  }

  const handleDelete = async (id: number, nombre: string) => {
    if (confirm(`¿Estás seguro de eliminar la insignia "${nombre}"?\n\nEsta acción no se puede deshacer.`)) {
      try {
        const { error } = await supabase
          .from('insignias')
          .delete()
          .eq('id', id)

        if (error) throw error
        alert('✅ Insignia eliminada')
        loadInsignias()
      } catch (error) {
        console.error('Error deleting insignia:', error)
        alert('❌ Error al eliminar la insignia')
      }
    }
  }

  const filteredInsignias = insignias.filter(i =>
    i.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <div style={{
          width: 48, height: 48, border: '4px solid #C4763A',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: '#2A1E15', marginBottom: 8 }}>
            Gestión de Insignias
          </h1>
          <p style={{ color: '#6B3F2A', fontSize: 15 }}>
            Administra las recompensas y logros del sistema
          </p>
        </div>
        <button
          onClick={() => {
            setEditingInsignia(null)
            setShowModal(true)
          }}
          style={{
            padding: '12px 20px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #FBC02D, #F57F17)',
            color: 'white',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'Poppins, sans-serif',
            boxShadow: '0 4px 12px rgba(251,192,45,0.4)',
            transition: 'all 0.2s'
          }}
        >
          <Plus size={18} />
          Nueva Insignia
        </button>
      </div>

      {/* Controles */}
      <div style={{
        background: 'white', borderRadius: 20, padding: 24,
        boxShadow: '0 4px 20px rgba(61,43,31,0.08)',
        border: '2px solid rgba(196,118,58,0.1)',
        marginBottom: 24
      }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9B8070' }} />
          <input
            type="text"
            placeholder="Buscar insignias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px 12px 48px', borderRadius: 12,
              border: '2px solid #F0E4D8', fontSize: 14, outline: 'none',
              fontFamily: 'Poppins, sans-serif', background: '#FEFAF5'
            }}
          />
        </div>

        <div style={{ marginTop: 16, fontSize: 13, color: '#9B8070' }}>
          Mostrando {filteredInsignias.length} de {insignias.length} insignias
        </div>
      </div>

      {/* Grid de insignias */}
      {insignias.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20
        }}>
          {filteredInsignias.map((insignia) => (
            <div
              key={insignia.id}
              style={{
                background: 'linear-gradient(135deg, #FFFBF0 0%, #FFF8E1 100%)',
                borderRadius: 20,
                padding: 24,
                boxShadow: '0 4px 20px rgba(212,168,83,0.15)',
                border: '2px solid rgba(212,168,83,0.2)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                textAlign: 'center',
                position: 'relative'
              }}
            >
              {/* Botones de acción */}
              <div style={{
                position: 'absolute',
                top: 12,
                right: 12,
                display: 'flex',
                gap: 6
              }}>
                <button
                  onClick={() => handleEdit(insignia)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: 'none',
                    background: '#E3F2FD',
                    color: '#1976D2',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(insignia.id, insignia.nombre)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: 'none',
                    background: '#FFEBEE',
                    color: '#D32F2F',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Ícono */}
              <div style={{
                width: 80,
                height: 80,
                margin: '0 auto 16px',
                background: 'linear-gradient(135deg, #FBC02D, #F57F17)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 40,
                boxShadow: '0 8px 24px rgba(251,192,45,0.4)'
              }}>
                {insignia.icono || '🏆'}
              </div>

              {/* Nombre */}
              <h3 style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#2A1E15',
                marginBottom: 8,
                fontFamily: 'Poppins, sans-serif'
              }}>
                {insignia.nombre}
              </h3>

              {/* Descripción */}
              <p style={{
                fontSize: 13,
                color: '#6B3F2A',
                marginBottom: 16,
                lineHeight: 1.5
              }}>
                {insignia.descripcion}
              </p>

              {/* Condición */}
              <div style={{
                background: 'rgba(255,255,255,0.6)',
                padding: '10px 14px',
                borderRadius: 10,
                marginBottom: 16,
                border: '1px solid rgba(212,168,83,0.2)'
              }}>
                <p style={{ fontSize: 11, color: '#9B8070', marginBottom: 2 }}>
                  Condición
                </p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#C4763A' }}>
                  {insignia.condicion}
                </p>
              </div>

              {/* Usuarios que la tienen */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.8)',
                borderRadius: 50,
                fontSize: 12,
                fontWeight: 700,
                color: '#6B3F2A'
              }}>
                <Users size={16} />
                <span>{insignia.total_users || 0} usuarios</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 60,
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(61,43,31,0.08)',
          border: '2px solid rgba(196,118,58,0.1)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#2A1E15' }}>
            No hay insignias disponibles
          </p>
          <p style={{ fontSize: 13, color: '#9B8070' }}>
            Crea la primera insignia para empezar
          </p>
        </div>
      )}

      {filteredInsignias.length === 0 && insignias.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 60,
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(61,43,31,0.08)',
          border: '2px solid rgba(196,118,58,0.1)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#2A1E15' }}>
            No se encontraron insignias
          </p>
          <p style={{ fontSize: 13, color: '#9B8070' }}>
            Intenta con otro término de búsqueda
          </p>
        </div>
      )}

      {showModal && (
        <InsigniaModal
          insignia={editingInsignia}
          onClose={() => {
            setShowModal(false)
            setEditingInsignia(null)
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