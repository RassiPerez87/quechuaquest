'use client'

import { X, Award, BookOpen, TrendingUp, Calendar, Shield } from 'lucide-react'

interface UserDetailModalProps {
  user: any
  onClose: () => void
  insignias: any[]
  lecciones: any[]
}

export default function UserDetailModal({ user, onClose, insignias, lecciones }: UserDetailModalProps) {
  if (!user) return null

  const isAdmin = user.role === 'admin'

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      animation: 'fadeIn 0.2s ease'
    }}
    onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: 24,
        maxWidth: 700,
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.3s ease'
      }}
      onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          background: isAdmin 
            ? 'linear-gradient(135deg, #E65100, #F57C00)'
            : 'linear-gradient(135deg, #3D2B1F, #6B3F2A)',
          padding: 24,
          borderRadius: '24px 24px 0 0',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 50,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <X size={20} color="white" />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              background: isAdmin
                ? 'linear-gradient(135deg, #FBC02D, #F57F17)'
                : 'linear-gradient(135deg, #C4763A, #D4A853)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 800,
              color: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              {isAdmin ? <Shield size={32} /> : user.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 50,
                background: 'rgba(255,255,255,0.2)',
                fontSize: 11,
                fontWeight: 700,
                color: 'white',
                marginBottom: 8
              }}>
                {isAdmin ? '👑 ADMINISTRADOR' : '👤 ESTUDIANTE'}
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 4 }}>
                {user.username}
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                {user.full_name || 'Sin nombre'}
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Contenido diferente según rol */}
        {isAdmin ? (
          // Vista para ADMIN
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{
              width: 100,
              height: 100,
              margin: '0 auto 20px',
              background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid #F57C00'
            }}>
              <Shield size={50} color="#E65100" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#2A1E15', marginBottom: 8 }}>
              Cuenta Administrativa
            </h3>
            <p style={{ fontSize: 14, color: '#6B3F2A', marginBottom: 24, lineHeight: 1.6 }}>
              Este usuario tiene permisos de administrador del sistema QuechuaQuest.
              No participa como estudiante en las lecciones.
            </p>

            <div style={{
              background: '#FEFAF5',
              padding: 20,
              borderRadius: 16,
              border: '2px solid #F0E4D8'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 8,
                  height: 8,
                  background: '#4CAF50',
                  borderRadius: '50%'
                }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: '#2A1E15' }}>
                  Gestión de usuarios
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 8,
                  height: 8,
                  background: '#4CAF50',
                  borderRadius: '50%'
                }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: '#2A1E15' }}>
                  Gestión de lecciones
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 8,
                  height: 8,
                  background: '#4CAF50',
                  borderRadius: '50%'
                }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: '#2A1E15' }}>
                  Gestión de insignias
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 8,
                  height: 8,
                  background: '#4CAF50',
                  borderRadius: '50%'
                }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: '#2A1E15' }}>
                  Acceso a reportes
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Vista para ESTUDIANTE
          <>
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
              padding: 24,
              background: '#FEFAF5'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 50,
                  height: 50,
                  margin: '0 auto 8px',
                  background: '#E3F2FD',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TrendingUp size={24} color="#1976D2" />
                </div>
                <p style={{ fontSize: 24, fontWeight: 900, color: '#2A1E15' }}>
                  {user.xp || 0}
                </p>
                <p style={{ fontSize: 11, color: '#9B8070' }}>XP Total</p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 50,
                  height: 50,
                  margin: '0 auto 8px',
                  background: '#FFF3E0',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BookOpen size={24} color="#F57C00" />
                </div>
                <p style={{ fontSize: 24, fontWeight: 900, color: '#2A1E15' }}>
                  {user.level || 1}
                </p>
                <p style={{ fontSize: 11, color: '#9B8070' }}>Nivel</p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 50,
                  height: 50,
                  margin: '0 auto 8px',
                  background: '#E8F5E9',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Award size={24} color="#388E3C" />
                </div>
                <p style={{ fontSize: 24, fontWeight: 900, color: '#2A1E15' }}>
                  {insignias.length}
                </p>
                <p style={{ fontSize: 11, color: '#9B8070' }}>Insignias</p>
              </div>
            </div>

            {/* Insignias */}
            <div style={{ padding: '0 24px 24px' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#2A1E15', marginBottom: 12 }}>
                🏆 Insignias Obtenidas
              </h3>
              {insignias.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: 12
                }}>
                  {insignias.map((insignia) => (
                    <div
                      key={insignia.id}
                      style={{
                        background: 'linear-gradient(135deg, #FFF8E1, #FFFDE7)',
                        padding: 12,
                        borderRadius: 12,
                        textAlign: 'center',
                        border: '2px solid #FBC02D'
                      }}
                    >
                      <div style={{ fontSize: 32, marginBottom: 4 }}>
                        {insignia.icono || '🏆'}
                      </div>
                      <p style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#6B3F2A',
                        lineHeight: 1.2
                      }}>
                        {insignia.nombre}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{
                  textAlign: 'center',
                  padding: 20,
                  background: '#F5F5F5',
                  borderRadius: 12,
                  color: '#9B8070',
                  fontSize: 13
                }}>
                  Sin insignias aún
                </p>
              )}
            </div>

            {/* Lecciones Completadas */}
            <div style={{ padding: '0 24px 24px' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#2A1E15', marginBottom: 12 }}>
                📚 Lecciones Completadas ({lecciones.length})
              </h3>
              {lecciones.length > 0 ? (
                <div style={{
                  maxHeight: 200,
                  overflowY: 'auto',
                  background: '#FEFAF5',
                  borderRadius: 12,
                  padding: 12
                }}>
                  {lecciones.map((leccion, index) => (
                    <div
                      key={index}
                      style={{
                        padding: 12,
                        background: 'white',
                        borderRadius: 8,
                        marginBottom: 8,
                        border: '1px solid #F0E4D8',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#2A1E15' }}>
                          {leccion.title_es || 'Lección'}
                        </p>
                        <p style={{ fontSize: 11, color: '#9B8070' }}>
                          Progreso: {leccion.progreso}%
                        </p>
                      </div>
                      {leccion.completed_at && (
                        <p style={{ fontSize: 10, color: '#B8A898' }}>
                          {new Date(leccion.completed_at).toLocaleDateString('es-ES')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{
                  textAlign: 'center',
                  padding: 20,
                  background: '#F5F5F5',
                  borderRadius: 12,
                  color: '#9B8070',
                  fontSize: 13
                }}>
                  Sin lecciones completadas
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}