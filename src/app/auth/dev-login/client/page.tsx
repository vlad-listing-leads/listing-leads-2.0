'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

// SECURITY: Dev credentials must come from environment variables
// These are only available in development when DEV_LOGIN_ENABLED=true
const DEV_USER_EMAIL = process.env.NEXT_PUBLIC_DEV_USER_EMAIL || 'dev@localhost.test'
const DEV_USER_PASSWORD = process.env.NEXT_PUBLIC_DEV_USER_PASSWORD

function DevLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/plan'
  const [status, setStatus] = useState('Signing in...')

  useEffect(() => {
    const signIn = async () => {
      // SECURITY: Check that dev password is configured
      if (!DEV_USER_PASSWORD) {
        setStatus('Error: Dev login not configured')
        console.error('NEXT_PUBLIC_DEV_USER_PASSWORD is not set')
        return
      }

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error } = await supabase.auth.signInWithPassword({
        email: DEV_USER_EMAIL,
        password: DEV_USER_PASSWORD,
      })

      if (error) {
        setStatus(`Error: ${error.message}`)
        console.error('Dev login error:', error)
        return
      }

      setStatus('Success! Redirecting...')
      router.push(redirectTo)
      router.refresh()
    }

    signIn()
  }, [router, redirectTo])

  return (
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">{status}</p>
    </div>
  )
}

export default function DevLoginClientPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Suspense fallback={
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }>
        <DevLoginContent />
      </Suspense>
    </div>
  )
}
