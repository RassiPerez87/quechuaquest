'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, Heart, Globe } from 'lucide-react'

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden', background: '#FEFAF5', fontFamily: 'Poppins, sans-serif' }}>

      {/* NAVBAR */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? 'rgba(254,250,245,0.97)' : 'rgba(254,250,245,0.85)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(196,118,58,0.15)',
        boxShadow: scrolled ? '0 2px 24px rgba(61,43,31,0.08)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>🦙</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 900, fontSize: 18, color: '#3D2B1F' }}>Quechua</span>
                <span style={{ fontWeight: 900, fontSize: 18, color: '#C4763A' }}>Quest</span>
              </div>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#D4A853', marginTop: -2 }}>✦ APRENDE QUECHUA ✦</p>
            </div>
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/auth?mode=login" style={{
              padding: '8px 20px', borderRadius: 50, fontWeight: 700, fontSize: 14,
              color: '#C4763A', border: '2px solid #F4B885', background: '#FFF0E6',
              textDecoration: 'none', transition: 'all 0.2s'
            }}>
              Iniciar sesión
            </Link>
            <Link href="/auth" style={{
              padding: '8px 20px', borderRadius: 50, fontWeight: 700, fontSize: 14,
              color: 'white', background: 'linear-gradient(135deg, #C4763A, #E8943A)',
              boxShadow: '0 4px 15px rgba(196,118,58,0.4)', textDecoration: 'none', transition: 'all 0.2s'
            }}>
              Registrarse →
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px 40px', position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse at 15% 50%, rgba(212,168,83,0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 30%, rgba(196,118,58,0.14) 0%, transparent 55%)'
      }}>
        {/* Círculos decorativos */}
        <div style={{ position: 'absolute', top: 120, left: 40, width: 80, height: 80, borderRadius: '50%', background: '#F4B85A', opacity: 0.25 }} />
        <div style={{ position: 'absolute', top: 200, right: 60, width: 50, height: 50, borderRadius: '50%', background: '#E87A4A', opacity: 0.2 }} />
        <div style={{ position: 'absolute', bottom: 160, left: 80, width: 60, height: 60, borderRadius: '50%', background: '#7AC87A', opacity: 0.18 }} />
        <div style={{ position: 'absolute', bottom: 100, right: 80, width: 90, height: 90, borderRadius: '50%', background: '#D4A853', opacity: 0.15 }} />

        <div style={{ maxWidth: 680, width: '100%', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 20px', borderRadius: 50, fontSize: 13, fontWeight: 700,
            background: 'white', border: '2px solid #F4B85A', color: '#A07830',
            boxShadow: '0 4px 20px rgba(196,118,58,0.18)', marginBottom: 32
          }}>
            ✨ Plataforma de quechua cochabambino boliviano 🇧🇴
          </div>

          {/* Llama */}
          <div style={{ fontSize: 80, marginBottom: 16, display: 'block', animation: 'float 3s ease-in-out infinite' }}>🦙</div>

          {/* Título */}
          <h1 style={{ fontWeight: 900, marginBottom: 20, lineHeight: 1.15 }}>
            <span style={{ display: 'block', fontSize: 'clamp(28px, 5vw, 44px)', color: '#6B3F2A', marginBottom: 4 }}>
              Bienvenido a
            </span>
            <span style={{
              display: 'block', fontSize: 'clamp(42px, 8vw, 80px)',
              background: 'linear-gradient(135deg, #C4763A 0%, #E8943A 40%, #D4A853 70%, #B85C38 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>
              QuechuaQuest
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(15px, 2.5vw, 19px)', color: '#6B3F2A', marginBottom: 36, lineHeight: 1.7, maxWidth: 520, margin: '0 auto 36px' }}>
            Aprende el <strong style={{ color: '#C4763A' }}>quechua cochabambino</strong> de forma
            interactiva, divertida y a tu propio ritmo 🌱
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 40 }}>
            <Link href="/auth" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 36px', borderRadius: 50, fontWeight: 900,
              fontSize: 18, color: 'white', textDecoration: 'none',
              background: 'linear-gradient(135deg, #C4763A, #E8943A)',
              boxShadow: '0 8px 30px rgba(196,118,58,0.45)', transition: 'all 0.2s'
            }}>
              🚀 Comenzar Gratis
            </Link>
            <Link href="/auth?mode=login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 32px', borderRadius: 50, fontWeight: 700,
              fontSize: 16, color: '#3D2B1F', textDecoration: 'none',
              background: 'white', border: '2px solid #F4B85A',
              boxShadow: '0 4px 16px rgba(61,43,31,0.10)', transition: 'all 0.2s'
            }}>
              Ya tengo cuenta →
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
            {[
              { emoji: '👥', value: '2,450+', label: 'Estudiantes', bg: '#FFF0E6', border: '#F4B885', color: '#C4763A' },
              { emoji: '📚', value: '36', label: 'Lecciones', bg: '#E8F5E2', border: '#A8D898', color: '#2D7A1F' },
              { emoji: '⭐', value: '4.8/5', label: 'Calificación', bg: '#FFF8E6', border: '#F0D080', color: '#A07830' },
              { emoji: '🏆', value: '98%', label: 'Satisfacción', bg: '#FFF0E6', border: '#F4B885', color: '#B85C38' },
            ].map((s, i) => (
              <div key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 50, fontSize: 13, fontWeight: 700,
                background: s.bg, border: `1.5px solid ${s.border}`,
                boxShadow: '0 2px 10px rgba(61,43,31,0.08)'
              }}>
                <span>{s.emoji}</span>
                <span style={{ fontWeight: 900, color: s.color }}>{s.value}</span>
                <span style={{ color: '#6B3F2A' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

           
      </section>

      {/* QUÉ ENCONTRARÁS */}
      <section style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#C4763A', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>¿Qué encontrarás?</p>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 900, color: '#3D2B1F', marginBottom: 12 }}>
              Todo para aprender quechua
            </h2>
            <p style={{ fontSize: 16, color: '#6B3F2A', maxWidth: 500, margin: '0 auto' }}>
              Una plataforma completa diseñada para el quechua cochabambino boliviano
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {[
              { emoji: '📖', title: 'Lecciones', color: '#2D7A1F', bg: '#E8F5E2', border: '#A8D898', desc: 'Lecciones en 3 niveles: básico, intermedio y avanzado. Vocabulario, gramática y pronunciación del quechua cochabambino.', tags: ['Básico', 'Intermedio', 'Avanzado'] },
              { emoji: '💪', title: 'Ejercicios', color: '#C4763A', bg: '#FFF0E6', border: '#F4B885', desc: 'Ejercicios interactivos estilo Duolingo. Traducciones, selección múltiple y completar frases. Gana puntos XP.', tags: ['Traducción', 'Selección', 'Completar'] },
              { emoji: '📝', title: 'Evaluaciones', color: '#A07830', bg: '#FFF8E6', border: '#F0D080', desc: 'Evalúa tu progreso con exámenes por nivel. Diagnóstico inicial y certificado al completar cada nivel.', tags: ['Diagnóstico', 'Por nivel', 'Certificado'] },
            ].map((item, i) => (
              <div key={i} style={{ padding: 32, borderRadius: 24, background: item.bg, border: `2px solid ${item.border}`, transition: 'all 0.3s' }}>
                <div style={{ fontSize: 44, marginBottom: 20 }}>{item.emoji}</div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#3D2B1F', marginBottom: 12 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: '#6B3F2A', lineHeight: 1.7, marginBottom: 20 }}>{item.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {item.tags.map(tag => (
                    <span key={tag} style={{ padding: '4px 12px', borderRadius: 50, fontSize: 12, fontWeight: 700, background: 'white', color: item.color, border: `1px solid ${item.border}` }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POR QUÉ QUECHUA */}
      <section style={{ padding: '80px 24px', background: '#FEFAF5' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#C4763A', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>¿Por qué aprender?</p>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 900, color: '#3D2B1F' }}>
              El quechua es nuestra identidad 🇧🇴
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
            {[
              { emoji: '🌍', title: 'Idioma vivo', desc: 'Más de 8 millones de personas hablan quechua en Bolivia, Perú y Ecuador.', bg: '#E8F5E2', border: '#A8D898' },
              { emoji: '🏔️', title: 'Raíces andinas', desc: 'Conecta con la cultura e historia del pueblo andino cochabambino.', bg: '#FFF0E6', border: '#F4B885' },
              { emoji: '💼', title: 'Valor profesional', desc: 'Abre puertas en comunidades e instituciones bolivianas.', bg: '#FFF8E6', border: '#F0D080' },
            ].map((item, i) => (
              <div key={i} style={{ padding: 32, borderRadius: 24, background: item.bg, border: `2px solid ${item.border}`, textAlign: 'center', transition: 'all 0.3s' }}>
                <div style={{ fontSize: 48, marginBottom: 20 }}>{item.emoji}</div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#3D2B1F', marginBottom: 10 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: '#6B3F2A', lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GAMIFICACIÓN */}
      <section style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#C4763A', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>Mantente motivado</p>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 900, color: '#3D2B1F', marginBottom: 48 }}>
            Aprende jugando 🎮
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
            {[
              { icon: '🔥', title: 'Racha Diaria', desc: 'Estudia cada día', bg: '#FFF0E6', border: '#F4B885' },
              { icon: '⚡', title: 'Puntos XP', desc: 'Gana experiencia', bg: '#FFF8E6', border: '#F0D080' },
              { icon: '🏆', title: 'Leaderboard', desc: 'Compite con otros', bg: '#E8F5E2', border: '#A8D898' },
              { icon: '🎖️', title: 'Insignias', desc: 'Colecciona logros', bg: '#F0EAF8', border: '#C8A8E8' },
            ].map((item, i) => (
              <div key={i} style={{ padding: 28, borderRadius: 20, background: item.bg, border: `2px solid ${item.border}`, transition: 'all 0.3s' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{item.icon}</div>
                <h3 style={{ fontSize: 14, fontWeight: 900, color: '#3D2B1F', marginBottom: 6 }}>{item.title}</h3>
                <p style={{ fontSize: 12, color: '#6B3F2A' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{
        padding: '80px 24px', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #3D2B1F 0%, #6B3F2A 50%, #C4763A 100%)'
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(212,168,83,0.25) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(232,148,58,0.2) 0%, transparent 50%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 60, marginBottom: 24, display: 'block', animation: 'float 3s ease-in-out infinite' }}>🦙</div>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, color: 'white', marginBottom: 16 }}>
            ¿Listo para empezar?
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.80)', marginBottom: 36 }}>
            Regístrate gratis y comienza tu aventura con el quechua cochabambino hoy mismo.
          </p>
          <Link href="/auth" style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            padding: '16px 44px', borderRadius: 50, fontWeight: 900,
            fontSize: 18, color: '#C4763A', background: '#FEFAF5',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)', textDecoration: 'none', transition: 'all 0.2s'
          }}>
            🚀 Crear cuenta gratis →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '40px 24px', background: '#2A1E15' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>🦙</span>
            <div>
              <span style={{ fontWeight: 900, color: 'white', fontSize: 16 }}>QuechuaQuest</span>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>✦ Aprende Quechua ✦</p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 4 }}>
            Hecho con ❤️ para preservar el quechua cochabambino
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.5)' }}>
            <Globe size={14} />
            <span style={{ fontSize: 13 }}>Cochabamba, Bolivia</span>
          </div>
        </div>
      </footer>

    </div>
  )
}