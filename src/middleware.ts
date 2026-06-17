import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
 
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
 
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )
 
  const {
    data: { user },
  } = await supabase.auth.getUser()
 
  const pathname = request.nextUrl.pathname
 
  // ==========================================
  // NUEVA PROTECCIÓN: Rutas de administrador
  // ==========================================
  if (pathname.startsWith('/admin')) {
    // Sin sesión → redirigir al login
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth'
      url.searchParams.set('mode', 'login')
      url.searchParams.set('redirect', '/admin')
      return NextResponse.redirect(url)
    }
 
    // Con sesión → verificar rol de admin
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
 
    // Si no es admin → redirigir al dashboard
    if (!profileData || profileData.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
 
    // Es admin → permitir acceso
    return supabaseResponse
  }
 
  // ==========================================
  // PROTECCIÓN EXISTENTE: Rutas de usuario
  // ==========================================
  const protectedRoutes = [
    '/dashboard',
    '/lecciones',
    '/ejercicios',
    '/evaluaciones',
    '/leaderboard',
    '/ajustes',
  ]
  const isProtected = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )
 
  // Sin sesión → redirigir al login
  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    url.searchParams.set('mode', 'login')
    return NextResponse.redirect(url)
  }
 
  // Permitir que los usuarios vean el formulario de /auth incluso si tienen sesión activa
  // (para que puedan registrarse o iniciar sesión con otra cuenta sin auto-ingresar)
 
  return supabaseResponse
}
 
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}