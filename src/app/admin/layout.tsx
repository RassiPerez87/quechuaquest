'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { LayoutDashboard, Users, BookOpen, Award, FileText, LogOut } from 'lucide-react'
import GlobalSearch from '@/components/admin/GlobalSearch'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [username, setUsername] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
      
      if (profile) setUsername(profile.username)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth?mode=login')
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Usuarios', path: '/admin/usuarios' },
    { icon: BookOpen, label: 'Lecciones', path: '/admin/lecciones' },
    { icon: Award, label: 'Insignias', path: '/admin/insignias' },
    { icon: FileText, label: 'Reportes', path: '/admin/reportes' }
  ]

  return (
    <>
      {/* Sidebar Fijo */}
      <aside style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: 260,
        height: '100vh',
        background: 'white',
        borderRight: '2px solid #F0E4D8',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        overflowY: 'auto'
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 32, paddingLeft: 4 }}>
          <h1 style={{
            fontSize: 24,
            fontWeight: 900,
            background: 'linear-gradient(135deg, #C4763A, #D4A853)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 2,
            fontFamily: 'Bubblegum Sans, cursive'
          }}>
            QuechuaQuest
          </h1>
          <p style={{ fontSize: 11, color: '#9B8070', fontWeight: 600 }}>
            Panel de Administración
          </p>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, marginBottom: 20 }}>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  marginBottom: 6,
                  border: 'none',
                  borderRadius: 10,
                  background: isActive ? 'linear-gradient(135deg, #C4763A, #D4A853)' : 'transparent',
                  color: isActive ? 'white' : '#6B3F2A',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.2s',
                  fontFamily: 'Poppins, sans-serif',
                  textAlign: 'left',
                  boxShadow: isActive ? '0 2px 8px rgba(196,118,58,0.25)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#FEFAF5'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* User Info */}
        <div style={{
          padding: 14,
          background: '#FEFAF5',
          borderRadius: 10,
          marginBottom: 12,
          border: '1px solid #F0E4D8'
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2A1E15', marginBottom: 2 }}>
            {username || 'Admin'}
          </p>
          <p style={{ fontSize: 10, color: '#9B8070' }}>
            Administrador
          </p>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '11px 14px',
            border: '1.5px solid #F0E4D8',
            borderRadius: 10,
            background: 'white',
            color: '#C4763A',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s',
            fontFamily: 'Poppins, sans-serif'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#FEFAF5'
            e.currentTarget.style.borderColor = '#C4763A'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white'
            e.currentTarget.style.borderColor = '#F0E4D8'
          }}
        >
          <LogOut size={16} />
          Cerrar Sesión
        </button>
      </aside>

      {/* Main Content Area */}
      <div style={{
        marginLeft: 260,
        minHeight: '100vh',
        background: '#FEFAF5'
      }}>
        <div style={{
          padding: '32px 48px',
          maxWidth: 1600,
          margin: '0 auto'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #C4763A, #D4A853)',
            borderRadius: 16,
            padding: '18px 24px',
            marginBottom: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            boxShadow: '0 4px 16px rgba(196,118,58,0.25)'
          }}>
            <div style={{ flex: 1, maxWidth: 480 }}>
              <GlobalSearch />
            </div>
            <div style={{ color: 'white', textAlign: 'right' }}>
              <p style={{ fontSize: 11, opacity: 0.85, marginBottom: 2 }}>
                Bienvenido de vuelta
              </p>
              <p style={{ fontSize: 15, fontWeight: 700 }}>
                {username || 'Admin'}
              </p>
            </div>
          </div>

          {/* Page Content */}
          {children}
        </div>
      </div>

      <style jsx global>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Poppins', sans-serif;
          overflow-x: hidden;
        }

        @media (max-width: 768px) {
          aside {
            transform: translateX(-100%);
          }
          div[style*="marginLeft: 260"] {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </>
  )
}