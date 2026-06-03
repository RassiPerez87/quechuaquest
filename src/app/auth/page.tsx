'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isLogin = searchParams.get('mode') === 'login'

  const [mode, setMode] = useState<'login' | 'register'>(isLogin ? 'login' : 'register')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    email: '',
    password: '',
    username: '',
    full_name: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
    setSuccess('')
  }

  // ✅ NUEVA FUNCIÓN: Detectar rol y redirigir
  const redirectBasedOnRole = async (userId: string) => {
    const supabase = createClient()
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    // Redirigir según el rol
    if (profile?.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const supabase = createClient()

    try {
      if (mode === 'register') {
        if (!form.username || !form.full_name || !form.email || !form.password) {
          setError('Por favor completa todos los campos')
          setLoading(false)
          return
        }
        if (form.password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres')
          setLoading(false)
          return
        }

        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              username: form.username,
              full_name: form.full_name,
            },
          },
        })

        if (error) {
          if (error.message.includes('already registered')) {
            setError('Este correo ya está registrado. ¿Quieres iniciar sesión?')
          } else {
            setError(error.message)
          }
          return
        }

        // Email ya existe pero no confirmado
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setError('Este correo ya está registrado. ¿Quieres iniciar sesión?')
          return
        }

        // ✅ CAMBIO: Detectar rol antes de redirigir
        if (data.session && data.user) {
          await redirectBasedOnRole(data.user.id)
          return
        }

        // Supabase pidió confirmar email
        setSuccess('¡Cuenta creada! Revisa tu correo para confirmar tu cuenta.')

      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        })

        if (error) {
          if (
            error.message.includes('Invalid login') ||
            error.message.includes('invalid_credentials')
          ) {
            setError('Correo o contraseña incorrectos')
          } else if (error.message.includes('Email not confirmed')) {
            setError('Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.')
          } else {
            setError(error.message)
          }
          return
        }

        if (data.session && data.user) {
  // 🆕 Trackear sesión en InfluxDB
  try {
    const { trackUserSession } = await import('@/lib/influx')
    await trackUserSession(data.user.id, 'web')
  } catch (influxError) {
    console.error('⚠️ InfluxDB session error:', influxError)
  }
  await redirectBasedOnRole(data.user.id)
}
      }
    } catch (err) {
      setError('Ocurrió un error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(212,168,83,0.18) 0%, transparent 55%), radial-gradient(ellipse at 80% 30%, rgba(196,118,58,0.14) 0%, transparent 55%), #FEFAF5',
      fontFamily: 'Poppins, sans-serif', padding: '24px'
    }}>

      {/* Círculos decorativos */}
      <div style={{ position: 'fixed', top: 80, left: 40, width: 120, height: 120, borderRadius: '50%', background: '#F4B85A', opacity: 0.15, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: 100, right: 60, width: 160, height: 160, borderRadius: '50%', background: '#C4763A', opacity: 0.10, pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>

        {/* Volver */}
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 14, fontWeight: 700, color: '#6B3F2A',
          textDecoration: 'none', marginBottom: 24,
          padding: '8px 16px', borderRadius: 50,
          background: 'white', border: '1.5px solid rgba(196,118,58,0.2)'
        }}>
          <ArrowLeft size={16} /> Volver al inicio
        </Link>

        {/* Card principal */}
        <div style={{
          background: 'white', borderRadius: 32,
          boxShadow: '0 20px 60px rgba(61,43,31,0.12)',
          border: '1.5px solid rgba(196,118,58,0.12)',
          overflow: 'hidden'
        }}>

          {/* Header */}
          <div style={{
            padding: '32px 40px 28px',
            background: 'linear-gradient(135deg, #3D2B1F 0%, #6B3F2A 60%, #C4763A 100%)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🦙</div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', marginBottom: 6 }}>
              {mode === 'register' ? '¡Únete a QuechuaQuest!' : '¡Bienvenido de vuelta!'}
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>
              {mode === 'register'
                ? 'Crea tu cuenta gratis y empieza a aprender quechua'
                : 'Inicia sesión para continuar tu aprendizaje'}
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '2px solid #F5EDE4', margin: '0 32px' }}>
            {(['register', 'login'] as const).map((tab) => (
              <button key={tab} onClick={() => { setMode(tab); setError(''); setSuccess('') }}
                style={{
                  flex: 1, padding: '16px 0', fontSize: 14, fontWeight: 800,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: mode === tab ? '#C4763A' : '#9B8070',
                  borderBottom: mode === tab ? '3px solid #C4763A' : '3px solid transparent',
                  marginBottom: -2, transition: 'all 0.2s'
                }}>
                {tab === 'register' ? '📝 Registrarse' : '🔑 Iniciar Sesión'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: '28px 32px 32px' }}>

            {mode === 'register' && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#3D2B1F', marginBottom: 6 }}>
                    Nombre completo
                  </label>
                  <input
                    name="full_name"
                    type="text"
                    placeholder="Tu nombre completo"
                    value={form.full_name}
                    onChange={handleChange}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: 12, fontSize: 14,
                      border: '2px solid #F0E4D8', background: '#FEFAF5', color: '#3D2B1F',
                      outline: 'none', boxSizing: 'border-box', fontFamily: 'Poppins, sans-serif',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = '#C4763A'}
                    onBlur={e => e.target.style.borderColor = '#F0E4D8'}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#3D2B1F', marginBottom: 6 }}>
                    Nombre de usuario
                  </label>
                  <input
                    name="username"
                    type="text"
                    placeholder="@tunombredeusuario"
                    value={form.username}
                    onChange={handleChange}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: 12, fontSize: 14,
                      border: '2px solid #F0E4D8', background: '#FEFAF5', color: '#3D2B1F',
                      outline: 'none', boxSizing: 'border-box', fontFamily: 'Poppins, sans-serif',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = '#C4763A'}
                    onBlur={e => e.target.style.borderColor = '#F0E4D8'}
                  />
                </div>
              </>
            )}

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#3D2B1F', marginBottom: 6 }}>
                Correo electrónico
              </label>
              <input
                name="email"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                value={form.email}
                onChange={handleChange}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 12, fontSize: 14,
                  border: '2px solid #F0E4D8', background: '#FEFAF5', color: '#3D2B1F',
                  outline: 'none', boxSizing: 'border-box', fontFamily: 'Poppins, sans-serif',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = '#C4763A'}
                onBlur={e => e.target.style.borderColor = '#F0E4D8'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#3D2B1F', marginBottom: 6 }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
                  value={form.password}
                  onChange={handleChange}
                  style={{
                    width: '100%', padding: '12px 48px 12px 16px', borderRadius: 12, fontSize: 14,
                    border: '2px solid #F0E4D8', background: '#FEFAF5', color: '#3D2B1F',
                    outline: 'none', boxSizing: 'border-box', fontFamily: 'Poppins, sans-serif',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#C4763A'}
                  onBlur={e => e.target.style.borderColor = '#F0E4D8'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9B8070'
                  }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: 12, marginBottom: 16,
                background: '#FFF0F0', border: '1.5px solid #FFB8B8', color: '#C0392B',
                fontSize: 13, fontWeight: 600
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div style={{
                padding: '12px 16px', borderRadius: 12, marginBottom: 16,
                background: '#F0FFF4', border: '1.5px solid #A8D898', color: '#2D7A1F',
                fontSize: 13, fontWeight: 600
              }}>
                ✅ {success}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: 50, fontWeight: 900,
                fontSize: 16, color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? '#D4A853' : 'linear-gradient(135deg, #C4763A, #E8943A)',
                boxShadow: '0 6px 24px rgba(196,118,58,0.4)', transition: 'all 0.2s',
                opacity: loading ? 0.8 : 1
              }}>
              {loading
                ? '⏳ Cargando...'
                : mode === 'register'
                  ? '🚀 Crear mi cuenta gratis'
                  : '🔑 Iniciar sesión'}
            </button>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#9B8070', marginTop: 20 }}>
              {mode === 'register' ? (
                <>¿Ya tienes cuenta?{' '}
                  <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C4763A', fontWeight: 700, fontSize: 13 }}>
                    Inicia sesión
                  </button>
                </>
              ) : (
                <>¿No tienes cuenta?{' '}
                  <button type="button" onClick={() => { setMode('register'); setError(''); setSuccess('') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C4763A', fontWeight: 700, fontSize: 13 }}>
                    Regístrate gratis
                  </button>
                </>
              )}
            </p>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#9B8070', marginTop: 20 }}>
          🔒 Tu información está segura y protegida
        </p>
      </div>
    </div>
  )
}