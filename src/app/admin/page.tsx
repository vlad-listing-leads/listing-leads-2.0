'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Mail,
  Phone,
  Share2,
  FileBox,
  Users,
  ArrowRight,
  Youtube,
  Instagram,
  Megaphone,
  Video,
  Plus,
  Clock,
  AlertTriangle,
  FileText,
  ImageOff,
  MessageSquareOff,
  CalendarX
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface AdminStats {
  emailCampaigns: number
  phoneTextScripts: number
  socialShareables: number
  directMail: number
  youtubeVideos: number
  shortVideos: number
  ads: number
  kickoffs: number
  users: number
}

interface RecentActivity {
  id: string
  type: 'email' | 'phone' | 'social' | 'direct-mail' | 'youtube' | 'short-video' | 'ad' | 'kickoff'
  title: string
  href: string
  timestamp: string
  action: 'created' | 'updated'
}

interface NeedsAttention {
  drafts: number
  missingMedia: number
  missingTranscripts: number
  unscheduled: number
}

const contentTypeConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  email: { label: 'Email', color: 'bg-green-500', icon: Mail },
  phone: { label: 'Phone/Text', color: 'bg-blue-500', icon: Phone },
  social: { label: 'Social', color: 'bg-purple-500', icon: Share2 },
  'direct-mail': { label: 'Direct Mail', color: 'bg-orange-500', icon: FileBox },
  youtube: { label: 'YouTube', color: 'bg-red-500', icon: Youtube },
  'short-video': { label: 'Short Video', color: 'bg-pink-500', icon: Instagram },
  ad: { label: 'Ad', color: 'bg-cyan-500', icon: Megaphone },
  kickoff: { label: 'Kickoff', color: 'bg-amber-500', icon: Video },
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [needsAttention, setNeedsAttention] = useState<NeedsAttention | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      const supabase = createClient()

      try {
        // Fetch all stats in parallel
        const [
          emailRes,
          phoneRes,
          socialRes,
          directMailRes,
          youtubeRes,
          shortVideosRes,
          adsRes,
          kickoffsRes,
          usersRes
        ] = await Promise.all([
          supabase.from('email_campaigns').select('id', { count: 'exact', head: true }),
          supabase.from('phone_text_scripts').select('id', { count: 'exact', head: true }),
          supabase.from('social_shareables').select('id', { count: 'exact', head: true }),
          supabase.from('direct_mail_templates').select('id', { count: 'exact', head: true }),
          supabase.from('youtube_videos').select('id', { count: 'exact', head: true }),
          supabase.from('short_videos').select('id', { count: 'exact', head: true }),
          supabase.from('ads').select('id', { count: 'exact', head: true }),
          supabase.from('campaign_kickoffs').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
        ])

        setStats({
          emailCampaigns: emailRes.count || 0,
          phoneTextScripts: phoneRes.count || 0,
          socialShareables: socialRes.count || 0,
          directMail: directMailRes.count || 0,
          youtubeVideos: youtubeRes.count || 0,
          shortVideos: shortVideosRes.count || 0,
          ads: adsRes.count || 0,
          kickoffs: kickoffsRes.count || 0,
          users: usersRes.count || 0,
        })

        // Fetch recent activity from multiple tables
        const [
          recentEmails,
          recentPhone,
          recentSocial,
          recentDirectMail,
          recentYoutube,
          recentShortVideos,
          recentAds,
          recentKickoffs
        ] = await Promise.all([
          supabase.from('email_campaigns').select('id, name, created_at, updated_at').order('updated_at', { ascending: false }).limit(3),
          supabase.from('phone_text_scripts').select('id, name, created_at, updated_at').order('updated_at', { ascending: false }).limit(3),
          supabase.from('social_shareables').select('id, name, created_at, updated_at').order('updated_at', { ascending: false }).limit(3),
          supabase.from('direct_mail_templates').select('id, name, created_at, updated_at').order('updated_at', { ascending: false }).limit(3),
          supabase.from('youtube_videos').select('id, name, created_at, updated_at').order('updated_at', { ascending: false }).limit(3),
          supabase.from('short_videos').select('id, name, created_at, updated_at').order('updated_at', { ascending: false }).limit(3),
          supabase.from('ads').select('id, name, created_at, updated_at').order('updated_at', { ascending: false }).limit(3),
          supabase.from('campaign_kickoffs').select('id, name, created_at, updated_at').order('updated_at', { ascending: false }).limit(3),
        ])

        // Helper to determine action
        const getAction = (createdAt: string, updatedAt: string): 'created' | 'updated' =>
          updatedAt !== createdAt ? 'updated' : 'created'

        // Combine and sort recent activity
        const allActivity: RecentActivity[] = [
          ...(recentEmails.data || []).map(item => ({
            id: item.id,
            type: 'email' as const,
            title: item.name,
            href: `/admin/campaigns/email/${item.id}/edit`,
            timestamp: item.updated_at || item.created_at,
            action: getAction(item.created_at, item.updated_at)
          })),
          ...(recentPhone.data || []).map(item => ({
            id: item.id,
            type: 'phone' as const,
            title: item.name,
            href: `/admin/campaigns/phone-text-scripts/${item.id}/edit`,
            timestamp: item.updated_at || item.created_at,
            action: getAction(item.created_at, item.updated_at)
          })),
          ...(recentSocial.data || []).map(item => ({
            id: item.id,
            type: 'social' as const,
            title: item.name,
            href: `/admin/campaigns/social/${item.id}/edit`,
            timestamp: item.updated_at || item.created_at,
            action: getAction(item.created_at, item.updated_at)
          })),
          ...(recentDirectMail.data || []).map(item => ({
            id: item.id,
            type: 'direct-mail' as const,
            title: item.name,
            href: `/admin/campaigns/direct-mail/${item.id}/edit`,
            timestamp: item.updated_at || item.created_at,
            action: getAction(item.created_at, item.updated_at)
          })),
          ...(recentYoutube.data || []).map(item => ({
            id: item.id,
            type: 'youtube' as const,
            title: item.name,
            href: `/admin/youtube/${item.id}/edit`,
            timestamp: item.updated_at || item.created_at,
            action: getAction(item.created_at, item.updated_at)
          })),
          ...(recentShortVideos.data || []).map(item => ({
            id: item.id,
            type: 'short-video' as const,
            title: item.name,
            href: `/admin/short-videos/${item.id}`,
            timestamp: item.updated_at || item.created_at,
            action: getAction(item.created_at, item.updated_at)
          })),
          ...(recentAds.data || []).map(item => ({
            id: item.id,
            type: 'ad' as const,
            title: item.name,
            href: `/admin/ads`,
            timestamp: item.updated_at || item.created_at,
            action: getAction(item.created_at, item.updated_at)
          })),
          ...(recentKickoffs.data || []).map(item => ({
            id: item.id,
            type: 'kickoff' as const,
            title: item.name,
            href: `/admin/kickoffs/${item.id}/edit`,
            timestamp: item.updated_at || item.created_at,
            action: getAction(item.created_at, item.updated_at)
          })),
        ]

        // Sort by timestamp and take top 10
        allActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        setRecentActivity(allActivity.slice(0, 10))

        // Fetch needs attention data
        const [
          draftsRes,
          missingMediaRes,
          missingTranscriptsRes,
          unscheduledRes
        ] = await Promise.all([
          // Count inactive/draft content
          supabase.from('email_campaigns').select('id', { count: 'exact', head: true }).eq('is_active', false),
          // Short videos missing media
          supabase.from('short_videos').select('id', { count: 'exact', head: true }).is('video_url', null),
          // Videos missing transcripts
          supabase.from('short_videos').select('id', { count: 'exact', head: true }).is('transcript', null).not('video_url', 'is', null),
          // Campaigns without week_start_date
          supabase.from('email_campaigns').select('id', { count: 'exact', head: true }).is('week_start_date', null).eq('is_active', true),
        ])

        setNeedsAttention({
          drafts: draftsRes.count || 0,
          missingMedia: missingMediaRes.count || 0,
          missingTranscripts: missingTranscriptsRes.count || 0,
          unscheduled: unscheduledRes.count || 0,
        })

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const campaignCards = [
    {
      title: 'Email Campaigns',
      count: stats?.emailCampaigns || 0,
      href: '/admin/campaigns/email',
      icon: Mail,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    },
    {
      title: 'Phone & Text Scripts',
      count: stats?.phoneTextScripts || 0,
      href: '/admin/campaigns/phone-text-scripts',
      icon: Phone,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    },
    {
      title: 'Social Shareables',
      count: stats?.socialShareables || 0,
      href: '/admin/campaigns/social',
      icon: Share2,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    },
    {
      title: 'Direct Mail',
      count: stats?.directMail || 0,
      href: '/admin/campaigns/direct-mail',
      icon: FileBox,
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    },
    {
      title: 'YouTube Videos',
      count: stats?.youtubeVideos || 0,
      href: '/admin/youtube',
      icon: Youtube,
      color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    },
    {
      title: 'Short Videos',
      count: stats?.shortVideos || 0,
      href: '/admin/short-videos',
      icon: Instagram,
      color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    },
    {
      title: 'Ads',
      count: stats?.ads || 0,
      href: '/admin/ads',
      icon: Megaphone,
      color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    },
    {
      title: 'Kickoffs',
      count: stats?.kickoffs || 0,
      href: '/admin/kickoffs',
      icon: Video,
      color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    },
  ]

  const quickActions = [
    { label: 'Email', href: '/admin/campaigns/email/new', icon: Mail },
    { label: 'Phone/Text', href: '/admin/campaigns/phone-text-scripts/new', icon: Phone },
    { label: 'Social', href: '/admin/campaigns/social/new', icon: Share2 },
    { label: 'Direct Mail', href: '/admin/campaigns/direct-mail/new', icon: FileBox },
    { label: 'YouTube', href: '/admin/youtube/new', icon: Youtube },
    { label: 'Short Video', href: '/admin/short-videos/new', icon: Instagram },
    { label: 'Kickoff', href: '/admin/kickoffs/new', icon: Video },
  ]

  const attentionCards = [
    {
      title: 'Draft Campaigns',
      count: needsAttention?.drafts || 0,
      description: 'Inactive email campaigns',
      icon: FileText,
      href: '/admin/campaigns/email',
      color: 'text-gray-500',
    },
    {
      title: 'Missing Media',
      count: needsAttention?.missingMedia || 0,
      description: 'Short videos without video file',
      icon: ImageOff,
      href: '/admin/short-videos',
      color: 'text-orange-500',
    },
    {
      title: 'Missing Transcripts',
      count: needsAttention?.missingTranscripts || 0,
      description: 'Videos awaiting transcription',
      icon: MessageSquareOff,
      href: '/admin/short-videos',
      color: 'text-yellow-500',
    },
    {
      title: 'Unscheduled',
      count: needsAttention?.unscheduled || 0,
      description: 'Active campaigns without dates',
      icon: CalendarX,
      href: '/admin/campaigns/email',
      color: 'text-red-500',
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to the Listing Leads CMS</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Content Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {campaignCards.map((card) => {
              const Icon = card.icon
              return (
                <Link key={card.title} href={card.href}>
                  <Card className="hover:bg-accent transition-colors cursor-pointer group h-full">
                    <CardContent className="pt-5 pb-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-2xl font-light text-foreground mb-0.5">{card.count}</p>
                      <p className="text-sm text-muted-foreground">{card.title}</p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <Button key={action.label} variant="outline" size="sm" asChild>
                      <Link href={action.href} className="gap-2">
                        <Icon className="w-4 h-4" />
                        Add {action.label}
                      </Link>
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((activity) => {
                      const config = contentTypeConfig[activity.type]
                      const Icon = config?.icon || FileText
                      return (
                        <Link
                          key={`${activity.type}-${activity.id}`}
                          href={activity.href}
                          className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-accent transition-colors group"
                        >
                          <div className={cn('w-2 h-2 rounded-full flex-shrink-0', config?.color || 'bg-gray-500')} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary">
                              {activity.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {config?.label || activity.type}
                              </Badge>
                              <span>{activity.action}</span>
                              <span>•</span>
                              <span>{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </Link>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Needs Attention */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Needs Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {attentionCards.map((card) => {
                    const Icon = card.icon
                    return (
                      <Link
                        key={card.title}
                        href={card.href}
                        className={cn(
                          'p-3 rounded-lg border border-border hover:bg-accent transition-colors group',
                          card.count === 0 && 'opacity-50'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={cn('w-4 h-4', card.color)} />
                          <span className="text-lg font-semibold text-foreground">{card.count}</span>
                        </div>
                        <p className="text-xs font-medium text-foreground">{card.title}</p>
                        <p className="text-[10px] text-muted-foreground">{card.description}</p>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/users">
              <Card className="hover:bg-accent transition-colors cursor-pointer group">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-2xl font-light text-foreground">{stats?.users || 0}</p>
                      <p className="text-sm text-muted-foreground">Registered Users</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
