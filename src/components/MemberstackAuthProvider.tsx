'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MEMBERSTACK_LOGIN_URL, MemberstackMember } from '@/lib/memberstack'
import { Spinner } from '@/components/ui/spinner'

interface MemberstackAuthProviderProps {
  children: React.ReactNode
}

// Pages that don't require auth
const PUBLIC_PATHS = ['/login', '/register', '/api', '/auth']

// Global auth lock to prevent multiple simultaneous auth attempts
const AUTH_LOCK_KEY = 'memberstack_auth_in_progress'
const AUTH_LOCK_TIMEOUT = 10000 // 10 seconds

function isAuthLocked(): boolean {
  if (typeof window === 'undefined') return false
  const lockTime = sessionStorage.getItem(AUTH_LOCK_KEY)
  if (!lockTime) return false
  // Check if lock is still valid (within timeout)
  const elapsed = Date.now() - parseInt(lockTime, 10)
  if (elapsed > AUTH_LOCK_TIMEOUT) {
    sessionStorage.removeItem(AUTH_LOCK_KEY)
    return false
  }
  return true
}

function setAuthLock(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(AUTH_LOCK_KEY, Date.now().toString())
}

function clearAuthLock(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(AUTH_LOCK_KEY)
}

export function MemberstackAuthProvider({ children }: MemberstackAuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const authAttempted = useRef(false)

  const isPublicPath = PUBLIC_PATHS.some(path => pathname?.startsWith(path))

  const authenticateWithMemberstack = useCallback(async (member: MemberstackMember): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/memberstack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberstackId: member.id,
          email: member.auth.email,
          firstName: member.customFields?.['first-name'] || '',
          lastName: member.customFields?.['last-name'] || '',
        }),
      })

      if (!response.ok) {
        console.error('Memberstack backend auth failed')
        return false
      }

      const data = await response.json()

      const supabase = createClient()
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: data.token,
        type: 'magiclink',
      })

      if (verifyError) {
        console.error('OTP verification error:', verifyError)
        return false
      }

      return true
    } catch (err) {
      console.error('Memberstack auth error:', err)
      return false
    }
  }, [])

  useEffect(() => {
    if (isPublicPath) {
      setIsLoading(false)
      return
    }

    // Prevent double auth attempts (component level)
    if (authAttempted.current) return
    authAttempted.current = true

    const checkAuth = async () => {
      const supabase = createClient()

      // Check if already logged into Supabase
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        clearAuthLock() // Clear any stale lock
        setIsAuthenticated(true)
        setIsLoading(false)
        return
      }

      // Check global auth lock to prevent multiple simultaneous auth attempts
      if (isAuthLocked()) {
        // Another auth attempt is in progress, wait for it
        const waitForAuth = (): Promise<void> => {
          return new Promise((resolve) => {
            const checkInterval = setInterval(async () => {
              if (!isAuthLocked()) {
                clearInterval(checkInterval)
                // Re-check if we're now authenticated
                const { data: { user: newUser } } = await supabase.auth.getUser()
                if (newUser) {
                  setIsAuthenticated(true)
                  setIsLoading(false)
                }
                resolve()
              }
            }, 200)
            // Timeout after 10 seconds
            setTimeout(() => {
              clearInterval(checkInterval)
              resolve()
            }, AUTH_LOCK_TIMEOUT)
          })
        }
        await waitForAuth()
        return
      }

      // Wait for Memberstack SDK to load (on subdomain it will have access to session)
      const waitForMemberstack = (): Promise<typeof window.$memberstackDom | null> => {
        return new Promise((resolve) => {
          // Already loaded
          if (window.$memberstackDom) {
            resolve(window.$memberstackDom)
            return
          }

          let attempts = 0
          const maxAttempts = 30 // 3 seconds
          const interval = setInterval(() => {
            attempts++
            if (window.$memberstackDom) {
              clearInterval(interval)
              resolve(window.$memberstackDom)
            } else if (attempts >= maxAttempts) {
              clearInterval(interval)
              resolve(null)
            }
          }, 100)
        })
      }

      const memberstack = await waitForMemberstack()

      if (!memberstack) {
        // Memberstack SDK didn't load - redirect to login
        window.location.href = MEMBERSTACK_LOGIN_URL
        return
      }

      try {
        const { data: member } = await memberstack.getCurrentMember()

        if (member) {
          // Set lock before starting auth
          setAuthLock()

          // User is logged into Memberstack - auto-create Supabase session
          const success = await authenticateWithMemberstack(member)

          // Clear lock after auth attempt
          clearAuthLock()

          if (success) {
            setIsAuthenticated(true)
            setIsLoading(false)
            // Delay refresh to avoid React hooks error from component tree changes
            setTimeout(() => router.refresh(), 100)
            return
          }
        }

        // No Memberstack session - redirect to main site login
        window.location.href = MEMBERSTACK_LOGIN_URL
      } catch (err) {
        console.error('Error checking Memberstack:', err)
        clearAuthLock()
        window.location.href = MEMBERSTACK_LOGIN_URL
      }
    }

    checkAuth()
  }, [isPublicPath, authenticateWithMemberstack, router])

  // Show loading state
  if (isLoading && !isPublicPath) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-muted-foreground">Signing you in...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
