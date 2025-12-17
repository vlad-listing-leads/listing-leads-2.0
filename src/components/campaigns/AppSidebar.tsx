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
  Rocket,
  Phone,
  Mail,
  FileBox,
  Share2,
  Megaphone,
  Instagram,
  Youtube,
  Heart,
  ChevronDown,
  Settings,
  LogOut,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// Menu items
const mainNavItems = [
  { icon: Calendar, label: 'Listing Attraction Plan', href: '/plan' },
  { icon: Trophy, label: 'Viral Leaderboard', href: '/viral-leaderboard' },
  { icon: FileEdit, label: 'Expired Editor', href: '/expired-editor' },
  { icon: Sparkles, label: 'AI Mode', href: '/ai-mode' },
  { icon: FileText, label: 'Blueprints', href: '/blueprints' },
  { icon: Rocket, label: 'Campaign Kickoff', href: '/campaign-kickoff' },
]

const campaignItems = [
  { icon: Phone, label: 'Phone & Text Scripts', href: '/campaigns/phone-text-scripts' },
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
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

export function AppSidebar({ favoritesCount = 0, user, ...props }: AppSidebarProps) {
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
                  width={150}
                  height={32}
                  className="h-8 w-auto group-data-[collapsible=icon]:hidden"
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

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name || 'User'}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email || 'user@example.com'}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/account">
                    <Settings className="mr-2 h-4 w-4" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
