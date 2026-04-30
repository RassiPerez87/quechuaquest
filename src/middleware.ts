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
          // ✅ FIX: primero setear en request, LUEGO recrear supabaseResponse
          // y setear en la response también — ambos pasos son obligatorios
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

  // ✅ IMPORTANTE: getUser() refresca la sesión automáticamente
  // Nunca usar getSession() en middleware — no es confiable en SSR
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Rutas que requieren login
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

  // Con sesión → no dejar entrar al /auth, mandar al dashboard
  if (user && pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // ✅ CRÍTICO: siempre retornar supabaseResponse (no NextResponse.next())
  // para que las cookies de sesión se propaguen correctamente
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}