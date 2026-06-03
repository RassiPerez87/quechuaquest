'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Search, UserPlus, Edit2, Trash2, Shield, User, Eye, Download } from 'lucide-react'
import UserDetailModal from '@/components/admin/UserDetailModal'
import { exportUsersToCSV } from '@/lib/exportUtils'

interface Usuario {
  id: string
  username: string
  full_name: string
  email: string
  role: string
  xp: number
  level: number
  total_lessons_completed: number
  created_at: string
  last_activity: string
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'admin'>('all')
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null)
  const [userInsignias, setUserInsignias] = useState<any[]>([])
  const [userLecciones, setUserLecciones] = useState<any[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadUsuarios()
  }, [])

  const loadUsuarios = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          role,
          xp,
          level,
          total_lessons_completed,
          created_at,
          last_activity
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const usuariosConEmail = await Promise.all(
        (data || []).map(async (profile) => {
          const { data: userData } = await supabase.auth.admin.getUserById(profile.id)
          return {
            ...profile,
            email: userData?.user?.email || 'Sin email',
            role: profile.role || 'student'
          }
        })
      )

      setUsuarios(usuariosConEmail as Usuario[])
    } catch (error) {
      console.error('Error loading usuarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const cambiarRol = async (userId: string, nuevoRol: 'student' | 'admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: nuevoRol })
        .eq('id', userId)

      if (error) throw error
      
      alert(`Rol actualizado a ${nuevoRol}`)
      loadUsuarios()
    } catch (error) {
      console.error('Error cambiando rol:', error)
      alert('Error al cambiar el rol')
    }
  }

  const verDetalle = async (user: Usuario) => {
    setSelectedUser(user)
    
    const { data: insigniasData } = await supabase
      .from('user_insignias')
      .select(`
        insignia_id,
        insignias(id, nombre, descripcion, icono)
      `)
      .eq('user_id', user.id)

    setUserInsignias(insigniasData?.map(i => i.insignias).filter(Boolean) || [])

    const { data: leccionesData } = await supabase
      .from('progreso_lecciones')
      .select(`
        progreso,
        completado,
        completed_at,
        lessons(title, title_es)
      `)
      .eq('user_id', user.id)
      .eq('completado', true)

    setUserLecciones(leccionesData?.map(l => ({
      ...l.lessons,
      progreso: l.progreso,
      completed_at: l.completed_at
    })) || [])
  }

  const filteredUsuarios = usuarios.filter(u => {
    const matchSearch = 
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchRole = filterRole === 'all' || u.role === filterRole
    
    return matchSearch && matchRole
  })

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
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: '#2A1E15', marginBottom: 8 }}>
            Gestión de Usuarios
          </h1>
          <p style={{ color: '#6B3F2A', fontSize: 15 }}>
            Administra estudiantes y sus permisos
          </p>
        </div>
        <button
          onClick={() => exportUsersToCSV(filteredUsuarios)}
          style={{
            padding: '12px 20px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #388E3C, #66BB6A)',
            color: 'white',
            fontSize: 14,
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
          <Download size={18} />
          Exportar a CSV
        </button>
      </div>

      <div style={{
        background: 'white', borderRadius: 20, padding: 24,
        boxShadow: '0 4px 20px rgba(61,43,31,0.08)',
        border: '2px solid rgba(196,118,58,0.1)',
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 250, position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9B8070' }} />
            <input
              type="text"
              placeholder="Buscar por nombre, usuario o email..."
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
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            style={{
              padding: '12px 16px', borderRadius: 12, border: '2px solid #F0E4D8',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', outline: 'none',
              fontFamily: 'Poppins, sans-serif', background: '#FEFAF5'
            }}
          >
            <option value="all">Todos los roles</option>
            <option value="student">Estudiantes</option>
            <option value="admin">Administradores</option>
          </select>
        </div>

        <div style={{ marginTop: 16, fontSize: 13, color: '#9B8070' }}>
          Mostrando {filteredUsuarios.length} de {usuarios.length} usuarios
        </div>
      </div>

      <div style={{
        background: 'white', borderRadius: 20,
        boxShadow: '0 4px 20px rgba(61,43,31,0.08)',
        border: '2px solid rgba(196,118,58,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #3D2B1F, #6B3F2A)', color: 'white' }}>
                <th style={{ padding: 16, textAlign: 'left', fontSize: 13, fontWeight: 700 }}>Usuario</th>
                <th style={{ padding: 16, textAlign: 'left', fontSize: 13, fontWeight: 700 }}>Email</th>
                <th style={{ padding: 16, textAlign: 'left', fontSize: 13, fontWeight: 700 }}>Rol</th>
                <th style={{ padding: 16, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>XP</th>
                <th style={{ padding: 16, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>Nivel</th>
                <th style={{ padding: 16, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>Lecciones</th>
                <th style={{ padding: 16, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsuarios.map((usuario, index) => (
                <tr key={usuario.id} style={{
                  borderBottom: '1px solid #F5EDE4',
                  background: index % 2 === 0 ? '#FEFAF5' : 'white',
                  transition: 'background 0.2s'
                }}>
                  <td style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #C4763A, #D4A853)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: 16
                      }}>
                        {usuario.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#2A1E15', fontSize: 14 }}>
                          {usuario.username || 'Sin usuario'}
                        </div>
                        <div style={{ fontSize: 12, color: '#9B8070' }}>
                          {usuario.full_name || 'Sin nombre'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: 16, fontSize: 13, color: '#6B3F2A' }}>
                    {usuario.email}
                  </td>
                  <td style={{ padding: 16 }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 50, fontSize: 12, fontWeight: 700,
                      background: usuario.role === 'admin' ? '#FFF3E0' : '#E3F2FD',
                      color: usuario.role === 'admin' ? '#E65100' : '#1565C0'
                    }}>
                      {usuario.role === 'admin' ? <Shield size={14} /> : <User size={14} />}
                      {usuario.role === 'admin' ? 'Admin' : 'Estudiante'}
                    </div>
                  </td>
                  <td style={{ padding: 16, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#C4763A' }}>
                    {usuario.xp || 0}
                  </td>
                  <td style={{ padding: 16, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#6B3F2A' }}>
                    {usuario.level || 1}
                  </td>
                  <td style={{ padding: 16, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#7A9E6E' }}>
                    {usuario.total_lessons_completed || 0}
                  </td>
                  <td style={{ padding: 16 }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button
                        onClick={() => verDetalle(usuario)}
                        style={{
                          padding: '8px 12px', borderRadius: 8, border: 'none',
                          background: '#E3F2FD', color: '#1565C0',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 4,
                          transition: 'all 0.2s', fontFamily: 'Poppins, sans-serif'
                        }}
                      >
                        <Eye size={14} />
                        Ver
                      </button>
                      <button
                        onClick={() => cambiarRol(usuario.id, usuario.role === 'admin' ? 'student' : 'admin')}
                        style={{
                          padding: '8px 12px', borderRadius: 8, border: 'none',
                          background: usuario.role === 'admin' ? '#E3F2FD' : '#FFF3E0',
                          color: usuario.role === 'admin' ? '#1565C0' : '#E65100',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          transition: 'all 0.2s', fontFamily: 'Poppins, sans-serif'
                        }}
                      >
                        {usuario.role === 'admin' ? '→ Estudiante' : '→ Admin'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsuarios.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', color: '#9B8070' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
            <p style={{ fontSize: 16, fontWeight: 600 }}>No se encontraron usuarios</p>
            <p style={{ fontSize: 13 }}>Intenta cambiar los filtros de búsqueda</p>
          </div>
        )}
      </div>

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          insignias={userInsignias}
          lecciones={userLecciones}
          onClose={() => setSelectedUser(null)}
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