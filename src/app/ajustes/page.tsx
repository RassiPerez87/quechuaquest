'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, User, Lock, Bell, Trash2, Save, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function AjustesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [activeTab, setActiveTab] = useState<'perfil' | 'seguridad' | 'cuenta'>('perfil')
  const [userId, setUserId] = useState<string | null>(null)

  // Perfil
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [level, setLevel] = useState('basico')

  // Seguridad
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [passError, setPassError] = useState('')

  // Stats solo lectura
  const [xp, setXp] = useState(0)
  const [streak, setStreak] = useState(0)
  const [joinedAt, setJoinedAt] = useState('')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setUserId(user.id)
      setEmail(user.email || '')
      setJoinedAt(user.created_at || '')

      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      if (profile) {
        setFullName(profile.full_name || '')
        setUsername(profile.username || '')
        setLevel(profile.level || 'basico')
        setXp(profile.xp || 0)
        setStreak(profile.streak_days || 0)
      }
      setLoading(false)
    }
    load()
  }, [])

  const showSuccess = (msg: string) => {
    setSavedMsg(msg)
    setTimeout(() => setSavedMsg(''), 3000)
  }

  const handleSavePerfil = async () => {
    if (!userId) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({
      full_name: fullName,
      username: username,
    }).eq('id', userId)
    setSaving(false)
    showSuccess('¡Perfil actualizado correctamente!')
  }

  const handleChangePassword = async () => {
    setPassError('')
    if (newPass.length < 6) { setPassError('La contraseña debe tener al menos 6 caracteres'); return }
    if (newPass !== confirmPass) { setPassError('Las contraseñas no coinciden'); return }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPass })
    setSaving(false)
    if (error) { setPassError(error.message); return }
    setCurrentPass(''); setNewPass(''); setConfirmPass('')
    showSuccess('¡Contraseña actualizada correctamente!')
  }

  const handleLogout = async () => {
  const supabase = createClient()
  await supabase.auth.signOut()
  router.push('/auth?mode=login')  // ← cambiar '/' por esto
}

  const getLevelInfo = (lvl: string) => {
    if (lvl === 'avanzado') return { label: 'Avanzado', emoji: '🌳', color: '#6B3F2A', bg: '#F5EDE4' }
    if (lvl === 'intermedio') return { label: 'Intermedio', emoji: '🌿', color: '#C4763A', bg: '#FFF0E6' }
    return { label: 'Básico', emoji: '🌱', color: '#2D7A1F', bg: '#E8F5E2' }
  }

  const lvlInfo = getLevelInfo(level)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🦙</div>
        <p style={{ color: '#6B3F2A', fontWeight: 700 }}>Cargando ajustes...</p>
      </div>
    </div>
  )

  const tabs = [
    { key: 'perfil', label: '👤 Perfil', icon: '👤' },
    { key: 'seguridad', label: '🔒 Seguridad', icon: '🔒' },
    { key: 'cuenta', label: '⚙️ Cuenta', icon: '⚙️' },
  ]

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', maxWidth: 680, margin: '0 auto' }}>

      {/* Volver */}
      <button onClick={() => router.push('/dashboard')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 50, background: 'white', border: '1.5px solid #F4B885', color: '#6B3F2A', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 24 }}>
        <ArrowLeft size={15} /> Volver al inicio
      </button>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#3D2B1F', marginBottom: 4 }}>⚙️ Ajustes</h1>
        <p style={{ color: '#6B3F2A', fontSize: 15 }}>Administra tu perfil y cuenta</p>
      </div>

      {/* Tarjeta de perfil */}
      <div style={{ padding: '20px 24px', borderRadius: 24, background: 'linear-gradient(135deg,#3D2B1F,#6B3F2A,#C4763A)', color: 'white', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0 }}>
          {fullName ? fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?'}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 18, fontWeight: 900, marginBottom: 2 }}>{fullName || 'Sin nombre'}</p>
          <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 8 }}>@{username || 'usuario'} · {email}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, background: 'rgba(255,255,255,0.2)' }}>
              {lvlInfo.emoji} {lvlInfo.label}
            </span>
            <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, background: 'rgba(255,255,255,0.2)' }}>
              ⚡ {xp} XP
            </span>
            <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, background: 'rgba(255,255,255,0.2)' }}>
              🔥 {streak} días
            </span>
          </div>
        </div>
      </div>

      {/* Mensaje de éxito */}
      {savedMsg && (
        <div style={{ padding: '12px 18px', borderRadius: 14, background: '#E8F5E2', border: '1.5px solid #A8D898', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={18} style={{ color: '#2D7A1F', flexShrink: 0 }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#2D7A1F' }}>{savedMsg}</p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 0, background: 'white', borderRadius: '16px 16px 0 0', padding: '12px 12px 0', border: '1.5px solid #F0E8E0', borderBottom: 'none' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            style={{
              padding: '10px 18px', borderRadius: '10px 10px 0 0', fontWeight: 800, fontSize: 14,
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === t.key ? '#FEFAF5' : 'transparent',
              color: activeTab === t.key ? '#C4763A' : '#9B8070',
              borderBottom: activeTab === t.key ? '3px solid #C4763A' : '3px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ background: '#FEFAF5', borderRadius: '0 0 24px 24px', padding: 28, border: '1.5px solid #F0E8E0', borderTop: 'none', marginBottom: 24 }}>

        {/* PERFIL */}
        {activeTab === 'perfil' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#3D2B1F', marginBottom: 20 }}>
              Información personal
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Nombre completo */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#6B3F2A', display: 'block', marginBottom: 6 }}>
                  Nombre completo
                </label>
                <input
                  type="text" value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Tu nombre completo"
                  style={{ width: '100%', padding: '13px 16px', borderRadius: 12, fontSize: 15, fontWeight: 600, border: '2px solid #F0E8E0', background: 'white', color: '#3D2B1F', outline: 'none', boxSizing: 'border-box', fontFamily: 'Poppins, sans-serif' }}
                  onFocus={e => e.target.style.borderColor = '#C4763A'}
                  onBlur={e => e.target.style.borderColor = '#F0E8E0'}
                />
              </div>

              {/* Username */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#6B3F2A', display: 'block', marginBottom: 6 }}>
                  Nombre de usuario
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9B8070', fontSize: 15, fontWeight: 700 }}>@</span>
                  <input
                    type="text" value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    placeholder="tu_usuario"
                    style={{ width: '100%', padding: '13px 16px 13px 30px', borderRadius: 12, fontSize: 15, fontWeight: 600, border: '2px solid #F0E8E0', background: 'white', color: '#3D2B1F', outline: 'none', boxSizing: 'border-box', fontFamily: 'Poppins, sans-serif' }}
                    onFocus={e => e.target.style.borderColor = '#C4763A'}
                    onBlur={e => e.target.style.borderColor = '#F0E8E0'}
                  />
                </div>
              </div>

              {/* Email (solo lectura) */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#6B3F2A', display: 'block', marginBottom: 6 }}>
                  Correo electrónico <span style={{ fontSize: 11, color: '#9B8070', fontWeight: 600 }}>(no editable)</span>
                </label>
                <input
                  type="email" value={email} disabled
                  style={{ width: '100%', padding: '13px 16px', borderRadius: 12, fontSize: 15, fontWeight: 600, border: '2px solid #F0E8E0', background: '#F5EDE4', color: '#9B8070', boxSizing: 'border-box', fontFamily: 'Poppins, sans-serif', cursor: 'not-allowed' }}
                />
              </div>

              {/* Nivel (solo lectura) */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#6B3F2A', display: 'block', marginBottom: 6 }}>
                  Nivel actual <span style={{ fontSize: 11, color: '#9B8070', fontWeight: 600 }}>(se actualiza automáticamente)</span>
                </label>
                <div style={{ padding: '13px 16px', borderRadius: 12, background: lvlInfo.bg, border: `2px solid ${lvlInfo.color}30`, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{lvlInfo.emoji}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: lvlInfo.color }}>{lvlInfo.label}</span>
                </div>
              </div>

              {/* Stats solo lectura */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ padding: '14px 16px', borderRadius: 12, background: '#FFF8E6', border: '1.5px solid #F0D080' }}>
                  <p style={{ fontSize: 11, color: '#A07830', fontWeight: 700, marginBottom: 4 }}>⚡ XP Total</p>
                  <p style={{ fontSize: 22, fontWeight: 900, color: '#A07830' }}>{xp}</p>
                </div>
                <div style={{ padding: '14px 16px', borderRadius: 12, background: '#FFF0E6', border: '1.5px solid #F4B885' }}>
                  <p style={{ fontSize: 11, color: '#C4763A', fontWeight: 700, marginBottom: 4 }}>🔥 Racha</p>
                  <p style={{ fontSize: 22, fontWeight: 900, color: '#C4763A' }}>{streak} días</p>
                </div>
              </div>

              <button onClick={handleSavePerfil} disabled={saving}
                style={{ padding: '13px', borderRadius: 50, fontWeight: 900, fontSize: 15, border: 'none', background: saving ? '#D4A853' : 'linear-gradient(135deg,#C4763A,#E8943A)', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(196,118,58,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Save size={18} />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        )}

        {/* SEGURIDAD */}
        {activeTab === 'seguridad' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#3D2B1F', marginBottom: 8 }}>
              Cambiar contraseña
            </h3>
            <p style={{ fontSize: 13, color: '#9B8070', marginBottom: 20 }}>
              Tu contraseña debe tener al menos 6 caracteres
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Nueva contraseña', val: newPass, set: setNewPass, placeholder: 'Mínimo 6 caracteres' },
                { label: 'Confirmar contraseña', val: confirmPass, set: setConfirmPass, placeholder: 'Repite la contraseña' },
              ].map((f, i) => (
                <div key={i}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#6B3F2A', display: 'block', marginBottom: 6 }}>
                    {f.label}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={f.val}
                      onChange={e => f.set(e.target.value)}
                      placeholder={f.placeholder}
                      style={{ width: '100%', padding: '13px 48px 13px 16px', borderRadius: 12, fontSize: 15, fontWeight: 600, border: `2px solid ${passError ? '#E74C3C' : '#F0E8E0'}`, background: 'white', color: '#3D2B1F', outline: 'none', boxSizing: 'border-box', fontFamily: 'Poppins, sans-serif' }}
                      onFocus={e => e.target.style.borderColor = passError ? '#E74C3C' : '#C4763A'}
                      onBlur={e => e.target.style.borderColor = passError ? '#E74C3C' : '#F0E8E0'}
                    />
                    {i === 0 && (
                      <button onClick={() => setShowPass(!showPass)}
                        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9B8070', display: 'flex' }}>
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Indicador de fortaleza */}
              {newPass && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#6B3F2A', marginBottom: 6 }}>Fortaleza de contraseña</p>
                  <div style={{ height: 6, borderRadius: 6, background: '#F0E8E0', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 6, transition: 'all 0.3s',
                      width: newPass.length < 6 ? '25%' : newPass.length < 10 ? '60%' : '100%',
                      background: newPass.length < 6 ? '#E74C3C' : newPass.length < 10 ? '#F0A030' : '#4A7A3A'
                    }} />
                  </div>
                  <p style={{ fontSize: 11, color: newPass.length < 6 ? '#E74C3C' : newPass.length < 10 ? '#F0A030' : '#4A7A3A', fontWeight: 700, marginTop: 4 }}>
                    {newPass.length < 6 ? 'Muy corta' : newPass.length < 10 ? 'Regular' : '¡Fuerte!'}
                  </p>
                </div>
              )}

              {passError && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FFF0F0', border: '1.5px solid #FFB8B8' }}>
                  <p style={{ fontSize: 13, color: '#E74C3C', fontWeight: 700 }}>❌ {passError}</p>
                </div>
              )}

              <button onClick={handleChangePassword} disabled={saving || !newPass || !confirmPass}
                style={{ padding: '13px', borderRadius: 50, fontWeight: 900, fontSize: 15, border: 'none', background: (!newPass || !confirmPass) ? '#D4C4B8' : saving ? '#D4A853' : 'linear-gradient(135deg,#C4763A,#E8943A)', color: (!newPass || !confirmPass) ? '#9B8070' : 'white', cursor: (!newPass || !confirmPass) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Lock size={18} />
                {saving ? 'Actualizando...' : 'Cambiar contraseña'}
              </button>
            </div>
          </div>
        )}

        {/* CUENTA */}
        {activeTab === 'cuenta' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#3D2B1F', marginBottom: 20 }}>
              Información de cuenta
            </h3>

            {/* Info de cuenta */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {[
                { label: 'Miembro desde', value: joinedAt ? new Date(joinedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '—', icon: '📅' },
                { label: 'Correo electrónico', value: email, icon: '📧' },
                { label: 'Nivel de aprendizaje', value: `${lvlInfo.emoji} ${lvlInfo.label}`, icon: '🎓' },
                { label: 'XP acumulado', value: `⚡ ${xp} puntos`, icon: '🏅' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, background: 'white', border: '1.5px solid #F0E8E0' }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <p style={{ fontSize: 12, color: '#9B8070', fontWeight: 600, marginBottom: 2 }}>{item.label}</p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#3D2B1F' }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Cerrar sesión */}
            <div style={{ borderTop: '1.5px solid #F0E8E0', paddingTop: 24 }}>
              <h4 style={{ fontSize: 14, fontWeight: 900, color: '#3D2B1F', marginBottom: 16 }}>Sesión</h4>
              <button onClick={handleLogout}
                style={{ width: '100%', padding: '13px', borderRadius: 50, fontWeight: 800, fontSize: 15, border: '2px solid #F4B885', background: 'white', color: '#C4763A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                🚪 Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}