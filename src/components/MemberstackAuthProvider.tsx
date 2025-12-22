'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'

interface MemberstackAuthProviderProps {
  children: React.ReactNode
}

// Pages that don't require auth
const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password', '/register', '/api', '/auth', '/preview']

export function MemberstackAuthProvider({ children }: MemberstackAuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const pathname = usePathname()

  const isPublicPath = PUBLIC_PATHS.some(path => pathname?.startsWith(path))

  useEffect(() => {
    // Public paths don't need auth check
    if (isPublicPath) {
      setIsLoading(false)
      return
    }

    // If already authenticated, don't check again
    if (isAuthenticated) {
      setIsLoading(false)
      return
    }

    const checkMemberstackAuth = async () => {
      // Wait for Memberstack SDK to load
      const waitForMemberstack = (): Promise<typeof window.$memberstackDom | null> => {
        return new Promise((resolve) => {
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
        window.location.href = '/login'
        return
      }

      try {
        const { data: member } = await memberstack.getCurrentMember()

        if (member) {
          // User is logged into Memberstack - they're authenticated
          setIsAuthenticated(true)
          setIsLoading(false)
        } else {
          // No Memberstack session - redirect to login
          window.location.href = '/login'
        }
      } catch (err) {
        console.error('Error checking Memberstack:', err)
        window.location.href = '/login'
      }
    }

    checkMemberstackAuth()
  }, [isPublicPath, isAuthenticated, pathname])

  // Show loading state for protected paths
  if (isLoading && !isPublicPath) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
