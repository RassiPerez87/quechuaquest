'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, User, BookOpen, Award } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

interface SearchResult {
  type: 'user' | 'leccion' | 'insignia'
  id: string
  title: string
  subtitle: string
  icon: any
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const searchTimeout = setTimeout(() => {
      performSearch()
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query])

  const performSearch = async () => {
    setLoading(true)
    const allResults: SearchResult[] = []

    try {
      // Buscar usuarios
      const { data: users } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(3)

      users?.forEach(u => {
        allResults.push({
          type: 'user',
          id: u.id,
          title: u.username || 'Sin nombre',
          subtitle: u.full_name || 'Usuario',
          icon: User
        })
      })

      // Buscar lecciones
      const { data: lecciones } = await supabase
        .from('lessons')
        .select('id, title, title_es')
        .or(`title.ilike.%${query}%,title_es.ilike.%${query}%`)
        .limit(3)

      lecciones?.forEach(l => {
        allResults.push({
          type: 'leccion',
          id: l.id,
          title: l.title_es || l.title,
          subtitle: l.title,
          icon: BookOpen
        })
      })

      // Buscar insignias
      const { data: insignias } = await supabase
        .from('insignias')
        .select('id, nombre, descripcion')
        .ilike('nombre', `%${query}%`)
        .limit(3)

      insignias?.forEach(i => {
        allResults.push({
          type: 'insignia',
          id: String(i.id),
          title: i.nombre,
          subtitle: i.descripcion,
          icon: Award
        })
      })

      setResults(allResults)
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false)
    setQuery('')
    
    switch(result.type) {
      case 'user':
        router.push('/admin/usuarios')
        break
      case 'leccion':
        router.push('/admin/lecciones')
        break
      case 'insignia':
        router.push('/admin/insignias')
        break
    }
  }

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'user': return 'Usuario'
      case 'leccion': return 'Lección'
      case 'insignia': return 'Insignia'
      default: return ''
    }
  }

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'user': return { bg: '#E3F2FD', text: '#1976D2' }
      case 'leccion': return { bg: '#F3E5F5', text: '#7B1FA2' }
      case 'insignia': return { bg: '#FFFDE7', text: '#F57F17' }
      default: return { bg: '#F5F5F5', text: '#616161' }
    }
  }

  return (
    <div ref={searchRef} style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{
          position: 'absolute',
          left: 14,
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#9B8070'
        }} />
        <input
          type="text"
          placeholder="Buscar usuarios, lecciones, insignias..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          style={{
            width: '100%',
            padding: '10px 40px 10px 44px',
            borderRadius: 50,
            border: '2px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            fontSize: 13,
            outline: 'none',
            fontFamily: 'Poppins, sans-serif',
            transition: 'all 0.2s'
          }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
            }}
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} color="rgba(255,255,255,0.7)" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: 'white',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          maxHeight: 400,
          overflowY: 'auto',
          zIndex: 1000
        }}>
          {loading && (
            <div style={{ padding: 20, textAlign: 'center', color: '#9B8070' }}>
              Buscando...
            </div>
          )}

          {!loading && results.length === 0 && query.length >= 2 && (
            <div style={{ padding: 20, textAlign: 'center', color: '#9B8070' }}>
              No se encontraron resultados
            </div>
          )}

          {!loading && results.length > 0 && results.map((result, index) => {
            const Icon = result.icon
            const colors = getTypeColor(result.type)
            return (
              <button
                key={`${result.type}-${result.id}-${index}`}
                onClick={() => handleResultClick(result)}
                style={{
                  width: '100%',
                  padding: 12,
                  border: 'none',
                  borderBottom: index < results.length - 1 ? '1px solid #F5EDE4' : 'none',
                  background: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  textAlign: 'left',
                  transition: 'background 0.2s',
                  fontFamily: 'Poppins, sans-serif'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#FEFAF5'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: colors.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={20} style={{ color: colors.text }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <p style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#2A1E15',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {result.title}
                    </p>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: colors.text,
                      background: colors.bg,
                      padding: '2px 8px',
                      borderRadius: 50,
                      flexShrink: 0
                    }}>
                      {getTypeLabel(result.type)}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 12,
                    color: '#9B8070',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {result.subtitle}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}