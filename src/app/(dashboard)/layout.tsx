'use client'

import { useState, useEffect, useRef } from 'react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar, GlobalSearch } from '@/components/campaigns'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        setIsAdmin(profile?.role === 'admin')
      }
    }

    checkAdminStatus()
  }, [])

  // Use IntersectionObserver to detect when sentinel scrolls out of view
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel is not visible, user has scrolled
        setIsScrolled(!entry.isIntersecting)
      },
      {
        threshold: 0,
        rootMargin: '0px',
      }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar isAdmin={isAdmin} />
      <SidebarInset className="flex flex-col bg-sidebar">
        {/* Global Header with Search */}
        <header
          className={cn(
            "h-14 flex items-center px-4 flex-shrink-0 gap-4 sticky top-0 z-20 transition-all duration-200 mr-2",
            isScrolled
              ? "bg-background border border-border"
              : "bg-sidebar"
          )}
        >
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1 flex justify-center">
            <GlobalSearch />
          </div>
          <div className="w-8" /> {/* Spacer for balance */}
        </header>
        {/* Page Content */}
        <div className="flex-1 overflow-hidden pr-2 pb-2">
          <div className="relative w-full h-full bg-background rounded-[12px] border border-border shadow-sm overflow-y-auto">
            {/* Sentinel element at top of content to detect scroll */}
            <div ref={sentinelRef} className="absolute top-0 left-0 h-1 w-full pointer-events-none" aria-hidden="true" />
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
