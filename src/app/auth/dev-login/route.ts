import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// SECURITY: Dev login requires explicit opt-in via DEV_LOGIN_ENABLED
// Also checks NODE_ENV to prevent accidental production use
const DEV_LOGIN_ENABLED = process.env.DEV_LOGIN_ENABLED === 'true'
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'

// Credentials from environment (not hardcoded)
const DEV_USER_EMAIL = process.env.DEV_USER_EMAIL || 'dev@localhost.test'
const DEV_USER_PASSWORD = process.env.DEV_USER_PASSWORD
const DEV_MEMBERSTACK_ID = 'dev-local-user'

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export async function GET(request: NextRequest) {
  // SECURITY: Multiple checks to prevent dev login in production
  // 1. Must be development environment (or have dev bypass enabled)
  if (!IS_DEVELOPMENT) {
    console.warn('Dev login attempted in non-development environment')
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 2. Must have explicit DEV_LOGIN_ENABLED=true
  if (!DEV_LOGIN_ENABLED) {
    console.warn('Dev login attempted but DEV_LOGIN_ENABLED is not set')
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 3. Must have password configured
  if (!DEV_USER_PASSWORD) {
    console.error('DEV_USER_PASSWORD environment variable is required for dev login')
    return NextResponse.json({ error: 'Dev login not configured' }, { status: 500 })
  }

  const redirectTo = request.nextUrl.searchParams.get('redirect') || '/plan'

  try {
    const supabaseAdmin = createAdminClient()

    // Check if dev user exists
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    let devUser = users.find(u => u.email === DEV_USER_EMAIL)

    if (!devUser) {
      // Create dev user with password
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: DEV_USER_EMAIL,
        password: DEV_USER_PASSWORD,
        email_confirm: true,
        user_metadata: { memberstack_id: DEV_MEMBERSTACK_ID, is_dev_user: true },
      })

      if (createError || !newUser.user) {
        console.error('Error creating dev user:', createError)
        return NextResponse.json({ error: 'Failed to create dev user' }, { status: 500 })
      }

      devUser = newUser.user

      // Create profile with admin role for dev user
      await supabaseAdmin
        .from('profiles')
        .upsert({
          id: devUser.id,
          email: DEV_USER_EMAIL,
          memberstack_id: DEV_MEMBERSTACK_ID,
          role: 'admin', // Dev user gets admin access
        }, { onConflict: 'id' })
    } else {
      // User exists - update their password to ensure we can sign in
      await supabaseAdmin.auth.admin.updateUserById(devUser.id, {
        password: DEV_USER_PASSWORD,
      })
    }

    // Redirect to client-side login page that will handle the session
    const loginPageUrl = new URL('/auth/dev-login/client', request.url)
    loginPageUrl.searchParams.set('redirect', redirectTo)
    return NextResponse.redirect(loginPageUrl)
  } catch (error) {
    console.error('Dev login error:', error)
    return NextResponse.json({ error: 'Dev login failed' }, { status: 500 })
  }
}
