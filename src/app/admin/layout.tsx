'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard,
  Calendar,
  Mail,
  Phone,
  Share2,
  FileBox,
  Users,
  Settings,
  ArrowLeft,
  Megaphone,
  Video,
  Youtube,
  Instagram,
  Moon,
  Sun
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminGuard } from '@/components/admin/AdminGuard'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Calendar', href: '/admin/calendar', icon: Calendar },
  { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
  { name: 'Kickoffs', href: '/admin/kickoffs', icon: Video },
  { name: 'YouTube Videos', href: '/admin/youtube', icon: Youtube },
  { name: 'Short Videos', href: '/admin/short-videos', icon: Instagram },
  { name: 'Email Campaigns', href: '/admin/campaigns/email', icon: Mail },
  { name: 'Phone/Text Scripts', href: '/admin/campaigns/phone-text-scripts', icon: Phone },
  { name: 'Social Shareables', href: '/admin/campaigns/social', icon: Share2 },
  { name: 'Direct Mail', href: '/admin/campaigns/direct-mail', icon: FileBox },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <AdminGuard>
      <div className="min-h-screen bg-muted/30 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-background border-r border-border flex flex-col">
          {/* Header */}
          <div className="h-14 flex items-center px-4 border-b border-border">
            <Link href="/plan" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to App</span>
            </Link>
          </div>

          {/* Logo/Title */}
          <div className="px-4 py-6">
            <h1 className="text-lg font-semibold text-foreground">Admin CMS</h1>
            <p className="text-sm text-muted-foreground">Manage campaigns & content</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(item.href))
                const Icon = item.icon

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {mounted && theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  Dark Mode
                </>
              )}
            </button>
            <p className="text-xs text-muted-foreground">Listing Leads CMS v1.0</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  )
}
