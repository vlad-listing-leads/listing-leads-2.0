'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'

const mainNavItems = [
  { icon: Calendar, label: 'Listing Attraction Plan', href: '/listing-attraction-plan' },
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

interface SidebarLinkProps {
  icon: React.ElementType
  label: string
  href: string
  isActive?: boolean
}

function SidebarLink({ icon: Icon, label, href, isActive }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  )
}

interface CampaignSidebarProps {
  favoritesCount?: number
}

export function CampaignSidebar({ favoritesCount = 0 }: CampaignSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link href="/designs" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">LL</span>
          </div>
          <span className="font-semibold text-foreground">Listing Leads</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {mainNavItems.map(item => (
          <SidebarLink
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            isActive={pathname === item.href}
          />
        ))}

        {/* Favorites link */}
        <Link
          href="/favorites"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            pathname === '/favorites'
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
          )}
        >
          <Heart className="w-5 h-5 flex-shrink-0" />
          <span className="truncate">My Favorites</span>
          {favoritesCount > 0 && (
            <span className="ml-auto text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              {favoritesCount}
            </span>
          )}
        </Link>

        {/* Campaigns Section */}
        <div className="pt-4">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Campaigns
          </p>
          {campaignItems.map(item => (
            <SidebarLink
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={pathname === item.href}
            />
          ))}
        </div>

        {/* Social Section */}
        <div className="pt-4">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Social
          </p>
          {socialItems.map(item => (
            <SidebarLink
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={pathname === item.href}
            />
          ))}
        </div>
      </nav>

      {/* Bottom promo card */}
      <div className="p-3 border-t border-border">
        <div className="rounded-lg overflow-hidden border border-border">
          <div className="aspect-video bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
            <div className="text-center text-primary-foreground">
              <div className="w-8 h-8 mx-auto mb-1 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="font-bold text-sm">LL</span>
              </div>
              <p className="text-xs opacity-90">Marketing Genius</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
