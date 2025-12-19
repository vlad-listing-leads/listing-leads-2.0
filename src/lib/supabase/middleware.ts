import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const IS_DEV = process.env.NODE_ENV === 'development'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public auth paths that don't require authentication
  const publicPaths = ['/api/', '/auth/', '/preview/', '/login', '/signup', '/forgot-password']
  const isPublicPath = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // Dev mode: auto-redirect to dev login if not authenticated (skip for public paths)
  if (IS_DEV && !user && !isPublicPath) {
    const devLoginUrl = new URL('/auth/dev-login', request.url)
    devLoginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(devLoginUrl)
  }

  // Skip auth check for Memberstack auth endpoint
  if (request.nextUrl.pathname.startsWith('/api/auth/memberstack')) {
    return supabaseResponse
  }

  // Admin routes - still require Supabase auth + admin role
  const adminPaths = ['/admin']
  const isAdminPath = adminPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Check admin access - admin routes still need explicit protection
  if (isAdminPath) {
    if (!user) {
      // For admin routes, redirect to login if not authenticated
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/designs'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
