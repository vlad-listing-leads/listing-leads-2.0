'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  Calendar,
  Trophy,
  FileEdit,
  Sparkles,
  FileText,
  Video,
  Phone,
  Mail,
  FileBox,
  Share2,
  Megaphone,
  Instagram,
  Youtube,
  Heart,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

// Menu items
const mainNavItems = [
  { icon: Calendar, label: 'Listing Attraction Plan', href: '/plan' },
  { icon: Trophy, label: 'Viral Leaderboard', href: '/viral-leaderboard' },
  { icon: FileEdit, label: 'Expired Editor', href: '/expired-editor' },
  { icon: Sparkles, label: 'AI Mode', href: '/ai-mode' },
  { icon: FileText, label: 'Blueprints', href: '/blueprints' },
  { icon: Video, label: 'Campaign Kickoffs', href: '/kickoffs' },
]

const campaignItems = [
  { icon: Phone, label: 'Voice Call & Text Scripts', href: '/campaigns/phone-text-scripts' },
  { icon: Mail, label: 'Email Campaigns', href: '/campaigns/email' },
  { icon: FileBox, label: 'Direct Mail Templates', href: '/campaigns/direct-mail' },
  { icon: Share2, label: 'Social Shareables', href: '/campaigns/social' },
]

const socialItems = [
  { icon: Megaphone, label: 'Best Ads', href: '/social/best-ads' },
  { icon: Instagram, label: 'Best Instagram Reels', href: '/social/instagram-reels' },
  { icon: Youtube, label: 'Best Youtube Videos', href: '/social/youtube-videos' },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  favoritesCount?: number
}

export function AppSidebar({ favoritesCount = 0, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch by only showing theme-specific logo after mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const logoSrc = mounted && resolvedTheme === 'dark' ? '/logo-dark.svg' : '/logo.svg'

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent">
              <Link href="/plan" className="flex items-center gap-2">
                <Image
                  src={logoSrc}
                  alt="Listing Leads"
                  width={112}
                  height={24}
                  className="h-6 w-auto group-data-[collapsible=icon]:hidden"
                  priority
                />
                {/* Collapsed state - show just icon */}
                <div className="hidden group-data-[collapsible=icon]:flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="font-bold text-sm">LL</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Favorites */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/favorites'}
                  tooltip="My Favorites"
                >
                  <Link href="/favorites">
                    <Heart />
                    <span>My Favorites</span>
                  </Link>
                </SidebarMenuButton>
                {favoritesCount > 0 && (
                  <SidebarMenuBadge>{favoritesCount}</SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Campaigns */}
        <SidebarGroup>
          <SidebarGroupLabel>Campaigns</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {campaignItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Social */}
        <SidebarGroup>
          <SidebarGroupLabel>Social</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {socialItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
