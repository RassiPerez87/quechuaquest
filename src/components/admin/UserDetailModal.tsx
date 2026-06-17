'use client'

import { useRouter } from 'next/navigation'
import { X, Award, BookOpen, TrendingUp, Calendar, Shield, ExternalLink, CheckCircle, Clock } from 'lucide-react'

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  if (days < 30) return `Hace ${Math.floor(days / 7)} sem.`
  if (days < 365) return `Hace ${Math.floor(days / 30)} meses`
  return `Hace ${Math.floor(days / 365)} años`
}

interface UserDetailModalProps {
  user: any
  onClose: () => void
  insignias: any[]
  lecciones: any[]
}

export default function UserDetailModal({ user, onClose, insignias, lecciones }: UserDetailModalProps) {
  const router = useRouter()
  if (!user) return null

  const isAdmin = user.role === 'admin'
  const leccionesCompletadas = lecciones.filter(l => l.completado !== false)

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
        maxWidth: 720,
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
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
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              flexShrink: 0
            }}>
              {isAdmin ? <Shield size={32} /> : user.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1 }}>
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
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 4 }}>
                {user.username}
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 2 }}>
                {user.full_name || 'Sin nombre'}
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 0 }}>
                {user.email}
              </p>
            </div>
            {/* Fecha de registro */}
            {user.created_at && (
              <div style={{
                background: 'rgba(255,255,255,0.15)', borderRadius: 12,
                padding: '10px 14px', textAlign: 'right',
                backdropFilter: 'blur(10px)', flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginBottom: 4 }}>
                  <Calendar size={12} color="rgba(255,255,255,0.7)" />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Registro</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 800, color: 'white', margin: 0 }}>
                  {formatDate(user.created_at)}
                </p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', margin: '2px 0 0' }}>
                  {timeAgo(user.created_at)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contenido diferente según rol */}
        {isAdmin ? (
          // Vista para ADMIN
          <div style={{ padding: 32, textAlign: 'center' }}>
            <div style={{
              width: 100, height: 100, margin: '0 auto 20px',
              background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
              borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', border: '3px solid #F57C00'
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
              background: '#FEFAF5', padding: 20, borderRadius: 16, border: '2px solid #F0E4D8'
            }}>
              {['Gestión de usuarios', 'Gestión de lecciones', 'Gestión de insignias', 'Acceso a reportes'].map((perm, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < 3 ? 12 : 0 }}>
                  <div style={{ width: 8, height: 8, background: '#4CAF50', borderRadius: '50%' }} />
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#2A1E15', margin: 0 }}>{perm}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Vista para ESTUDIANTE
          <>
            {/* Stats Grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16, padding: 24, background: '#FEFAF5'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, margin: '0 auto 8px', background: '#E3F2FD',
                  borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <TrendingUp size={22} color="#1976D2" />
                </div>
                <p style={{ fontSize: 22, fontWeight: 900, color: '#2A1E15', margin: '0 0 2px' }}>
                  {(user.xp || 0).toLocaleString()}
                </p>
                <p style={{ fontSize: 11, color: '#9B8070', margin: 0 }}>XP Total</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, margin: '0 auto 8px', background: '#FFF3E0',
                  borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <BookOpen size={22} color="#F57C00" />
                </div>
                <p style={{ fontSize: 22, fontWeight: 900, color: '#2A1E15', margin: '0 0 2px' }}>
                  {user.level || 1}
                </p>
                <p style={{ fontSize: 11, color: '#9B8070', margin: 0 }}>Nivel</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, margin: '0 auto 8px', background: '#E8F5E9',
                  borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Award size={22} color="#388E3C" />
                </div>
                <p style={{ fontSize: 22, fontWeight: 900, color: '#2A1E15', margin: '0 0 2px' }}>
                  {insignias.length}
                </p>
                <p style={{ fontSize: 11, color: '#9B8070', margin: 0 }}>Insignias</p>
              </div>
            </div>

            {/* Botón Ver Reporte Completo */}
            <div style={{ padding: '0 24px 16px' }}>
              <button
                onClick={() => {
                  onClose()
                  router.push(`/admin/usuarios/${user.id}/reporte`)
                }}
                style={{
                  width: '100%', padding: '13px 20px', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg, #C4763A, #D4A853)',
                  color: 'white', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: 'Poppins, sans-serif',
                  boxShadow: '0 4px 16px rgba(196,118,58,0.35)',
                  transition: 'all 0.2s'
                }}
              >
                <ExternalLink size={16} />
                📋 Ver Reporte Completo con Cronología
              </button>
            </div>

            {/* Insignias */}
            <div style={{ padding: '0 24px 20px' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#2A1E15', marginBottom: 12 }}>
                🏆 Insignias Obtenidas ({insignias.length})
              </h3>
              {insignias.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                  gap: 10
                }}>
                  {insignias.map((insignia) => (
                    <div
                      key={insignia.id}
                      style={{
                        background: 'linear-gradient(135deg, #FFF8E1, #FFFDE7)',
                        padding: '10px 8px',
                        borderRadius: 12,
                        textAlign: 'center',
                        border: '2px solid #FBC02D'
                      }}
                    >
                      <div style={{ fontSize: 28, marginBottom: 4 }}>
                        {insignia.icono || '🏆'}
                      </div>
                      <p style={{
                        fontSize: 9, fontWeight: 700, color: '#6B3F2A', lineHeight: 1.2, margin: 0
                      }}>
                        {insignia.nombre}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{
                  textAlign: 'center', padding: 16,
                  background: '#F5F5F5', borderRadius: 12,
                  color: '#9B8070', fontSize: 13, margin: 0
                }}>
                  Sin insignias aún
                </p>
              )}
            </div>

            {/* Lecciones Completadas */}
            <div style={{ padding: '0 24px 24px' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#2A1E15', marginBottom: 12 }}>
                📚 Últimas Lecciones ({leccionesCompletadas.length})
              </h3>
              {leccionesCompletadas.length > 0 ? (
                <div style={{
                  maxHeight: 220, overflowY: 'auto',
                  background: '#FEFAF5', borderRadius: 12, padding: 10
                }}>
                  {leccionesCompletadas.map((leccion, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '10px 12px',
                        background: 'white',
                        borderRadius: 10,
                        marginBottom: 8,
                        border: '1px solid #F0E4D8',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle size={13} color="#388E3C" />
                          <p style={{
                            fontSize: 12, fontWeight: 700, color: '#2A1E15', margin: 0,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>
                            {leccion.title_es || leccion.title || 'Lección'}
                          </p>
                        </div>
                        <p style={{ fontSize: 10, color: '#9B8070', margin: '3px 0 0', paddingLeft: 19 }}>
                          Progreso: {leccion.progreso || 0}%
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {leccion.completed_at ? (
                          <>
                            <p style={{ fontSize: 11, fontWeight: 700, color: '#C4763A', margin: 0 }}>
                              {new Date(leccion.completed_at).toLocaleDateString('es-ES', {
                                day: '2-digit', month: 'short', year: 'numeric'
                              })}
                            </p>
                            <p style={{ fontSize: 9, color: '#B8A898', margin: '1px 0 0' }}>
                              {timeAgo(leccion.completed_at)}
                            </p>
                          </>
                        ) : (
                          <Clock size={14} color="#F57C00" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{
                  textAlign: 'center', padding: 20,
                  background: '#F5F5F5', borderRadius: 12,
                  color: '#9B8070', fontSize: 13, margin: 0
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