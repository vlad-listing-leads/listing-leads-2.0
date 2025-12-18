'use client'

import { useEffect, useState } from 'react'
import { MEMBERSTACK_LOGIN_URL } from '@/lib/memberstack'
import { Spinner } from '@/components/ui/spinner'

export default function LoginRedirectPage() {
  const [isLocalhost, setIsLocalhost] = useState(false)

  useEffect(() => {
    // Check if we're on localhost for dev login
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    setIsLocalhost(isLocal)

    if (isLocal) {
      // Redirect to dev login on localhost
      window.location.href = '/auth/dev-login'
    } else {
      // Redirect to the actual Memberstack login on the main site
      window.location.href = MEMBERSTACK_LOGIN_URL
    }
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-muted-foreground">
          {isLocalhost ? 'Redirecting to dev login...' : 'Redirecting to login...'}
        </p>
      </div>
    </div>
  )
}
