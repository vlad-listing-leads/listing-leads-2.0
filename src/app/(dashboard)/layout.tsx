'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar, GlobalSearch } from '@/components/campaigns'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings, Shield, LogOut } from 'lucide-react'
import { HelloBar } from '@/components/HelloBar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string } | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Check if user is admin and get user info
  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, role')
          .eq('id', authUser.id)
          .single()

        // Fetch headshot from profile_values
        let avatarUrl: string | undefined
        try {
          const { data: headshot } = await supabase
            .from('profile_values')
            .select('value, profile_fields!inner(field_key)')
            .eq('user_id', authUser.id)
            .eq('profile_fields.field_key', 'headshot')
            .single()

          if (headshot?.value) {
            avatarUrl = headshot.value
          }
        } catch {
          // No headshot set, that's fine
        }

        setIsAdmin(profile?.role === 'admin')
        setUser({
          name: profile?.first_name && profile?.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : profile?.first_name || authUser.email?.split('@')[0] || 'User',
          email: authUser.email || '',
          avatar: avatarUrl
        })
      }
    }

    fetchUserData()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

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
      <AppSidebar />
      <SidebarInset className="flex flex-col bg-sidebar">
        {/* Hello Bar for Announcements */}
        <HelloBar />

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

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-accent transition-colors">
                  <Avatar className="h-8 w-8">
                    {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Profile & Settings
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
