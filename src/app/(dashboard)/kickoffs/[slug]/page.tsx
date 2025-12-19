'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Calendar, Users, ExternalLink, FileText, CalendarDays, Mail, Phone, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import type { KickoffHost, CampaignKickoff } from '@/types/kickoffs'

interface KickoffWithHosts extends CampaignKickoff {
  hosts: KickoffHost[]
  guests: KickoffHost[]
}

interface LinkedCampaign {
  id: string
  name: string
  slug: string
  thumbnail_url: string | null
}

interface CalendarCampaign extends LinkedCampaign {
  category: 'social-shareables' | 'email-campaigns' | 'phone-text-scripts'
  day_of_week: number
}

export default function KickoffDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [kickoff, setKickoff] = useState<KickoffWithHosts | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [linkedCampaigns, setLinkedCampaigns] = useState<{
    social: LinkedCampaign | null
    text: LinkedCampaign | null
    email: LinkedCampaign | null
  }>({ social: null, text: null, email: null })
  const [calendarCampaigns, setCalendarCampaigns] = useState<CalendarCampaign[]>([])

  const supabase = createClient()

  useEffect(() => {
    const fetchKickoff = async () => {
      setIsLoading(true)

      // Fetch kickoff by slug
      const { data: kickoffData, error: kickoffError } = await supabase
        .from('campaign_kickoffs')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .eq('is_draft', false)
        .single()

      if (kickoffError || !kickoffData) {
        console.error('Error fetching kickoff:', kickoffError)
        setIsLoading(false)
        return
      }

      // Fetch host assignments
      const { data: assignments } = await supabase
        .from('kickoff_host_assignments')
        .select(`
          role,
          host:kickoff_hosts(*)
        `)
        .eq('kickoff_id', kickoffData.id)

      const kickoffWithHosts: KickoffWithHosts = {
        ...kickoffData,
        hosts: assignments?.filter((a) => a.role === 'host').map((a) => a.host as unknown as KickoffHost) || [],
        guests: assignments?.filter((a) => a.role === 'guest').map((a) => a.host as unknown as KickoffHost) || [],
      }

      setKickoff(kickoffWithHosts)

      // Fetch linked campaigns
      const campaigns: typeof linkedCampaigns = { social: null, text: null, email: null }

      if (kickoffData.social_campaign_slug) {
        const { data: social } = await supabase
          .from('social_shareables')
          .select('id, name, slug, thumbnail_url')
          .eq('slug', kickoffData.social_campaign_slug)
          .single()
        if (social) campaigns.social = social
      }

      if (kickoffData.text_campaign_slug) {
        const { data: text } = await supabase
          .from('phone_text_scripts')
          .select('id, name, slug, thumbnail_url')
          .eq('slug', kickoffData.text_campaign_slug)
          .single()
        if (text) campaigns.text = text
      }

      if (kickoffData.email_campaign_slug) {
        const { data: email } = await supabase
          .from('email_campaigns')
          .select('id, name, slug, thumbnail_url')
          .eq('slug', kickoffData.email_campaign_slug)
          .single()
        if (email) campaigns.email = email
      }

      setLinkedCampaigns(campaigns)

      // Fetch campaigns from calendar system using kickoff's start_date
      if (kickoffData.start_date) {
        const { data: calendarWeek } = await supabase
          .from('calendar_weeks')
          .select('id')
          .eq('week_start_date', kickoffData.start_date)
          .single()

        if (calendarWeek) {
          const { data: assignments } = await supabase
            .from('campaign_week_assignments')
            .select('campaign_id, category, day_of_week')
            .eq('week_id', calendarWeek.id)
            .order('day_of_week')

          if (assignments && assignments.length > 0) {
            const calendarCampaignsData: CalendarCampaign[] = []

            for (const assignment of assignments) {
              let campaign = null

              if (assignment.category === 'social-shareables') {
                const { data } = await supabase
                  .from('social_shareables')
                  .select('id, name, slug, thumbnail_url')
                  .eq('id', assignment.campaign_id)
                  .single()
                campaign = data
              } else if (assignment.category === 'email-campaigns') {
                const { data } = await supabase
                  .from('email_campaigns')
                  .select('id, name, slug, thumbnail_url')
                  .eq('id', assignment.campaign_id)
                  .single()
                campaign = data
              } else if (assignment.category === 'phone-text-scripts') {
                const { data } = await supabase
                  .from('phone_text_scripts')
                  .select('id, name, slug, thumbnail_url')
                  .eq('id', assignment.campaign_id)
                  .single()
                campaign = data
              }

              if (campaign) {
                calendarCampaignsData.push({
                  ...campaign,
                  category: assignment.category,
                  day_of_week: assignment.day_of_week,
                })
              }
            }

            setCalendarCampaigns(calendarCampaignsData)
          }
        }
      }

      setIsLoading(false)
    }

    if (slug) {
      fetchKickoff()
    }
  }, [slug])

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start) return ''
    const startDate = new Date(start)
    const endDate = end ? new Date(end) : null
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
    if (endDate) {
      return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`
    }
    return startDate.toLocaleDateString('en-US', options)
  }

  // Extract YouTube video ID
  const getYouTubeEmbedUrl = (url: string | null) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/)
    return match ? `https://www.youtube.com/embed/${match[1]}` : null
  }

  if (isLoading) {
    return <KickoffDetailSkeleton />
  }

  if (!kickoff) {
    return (
      <div className="flex flex-col h-full bg-background">
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto text-center py-20">
            <h1 className="text-2xl font-bold text-foreground mb-4">Kickoff not found</h1>
            <p className="text-muted-foreground mb-6">The kickoff you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </main>
      </div>
    )
  }

  const embedUrl = getYouTubeEmbedUrl(kickoff.video_url)

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* Hero Section */}
      <div className="relative overflow-hidden px-8 pb-0 bg-gradient-to-b from-orange-100 to-amber-50 dark:from-orange-900/20 dark:to-background">
        {/* Top Navigation */}
        <div className="flex items-center justify-between py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {/* Hero Content with Campaign Thumbnails */}
        <div className="pt-8 flex items-center justify-center gap-12 min-h-[300px]">
          {/* Title */}
          <div className="text-center max-w-xl">
            {kickoff.month && (
              <Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-300 border-0 mb-4 hover:bg-orange-500/20">
                {kickoff.month}
              </Badge>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{kickoff.name}</h1>

            {kickoff.start_date && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{formatDateRange(kickoff.start_date, kickoff.end_date)}</span>
              </div>
            )}
          </div>

          {/* Overlapping Campaign Thumbnails */}
          {(linkedCampaigns.social || linkedCampaigns.email || linkedCampaigns.text) && (
            <div className="hidden lg:block relative w-[774px] h-[431px] overflow-hidden flex-shrink-0">
              <div className="relative w-full h-[619px]">
                {linkedCampaigns.social?.thumbnail_url && (
                  <div className="absolute left-[88px] top-[221px] w-[431px] rounded-2xl overflow-hidden transform -rotate-6 z-[25]">
                    <img
                      src={linkedCampaigns.social.thumbnail_url}
                      alt=""
                      className="w-full h-auto"
                    />
                  </div>
                )}
                {linkedCampaigns.email?.thumbnail_url && (
                  <div className="absolute left-[188px] top-[22px] w-[431px] rounded-2xl overflow-hidden transform rotate-3 z-20">
                    <img
                      src={linkedCampaigns.email.thumbnail_url}
                      alt=""
                      className="w-full h-auto"
                    />
                  </div>
                )}
                {linkedCampaigns.text?.thumbnail_url && (
                  <div className="absolute left-[382px] top-[155px] w-[431px] rounded-2xl overflow-hidden transform rotate-6 z-30">
                    <img
                      src={linkedCampaigns.text.thumbnail_url}
                      alt=""
                      className="w-full h-auto"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-8 py-8 max-w-4xl mx-auto w-full">
        {/* Overview */}
        {kickoff.overview && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">Overview</h2>
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-foreground/80 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: kickoff.overview }}
            />
          </section>
        )}

        {/* Video Embed */}
        {embedUrl && (
          <section className="mb-8">
            <div className="aspect-video rounded-xl overflow-hidden bg-black">
              <iframe
                src={embedUrl}
                title={kickoff.name}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>
        )}

        {/* CTA Button */}
        {kickoff.cta_url && (
          <section className="mb-8 pb-8 border-b border-border">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <a href={kickoff.cta_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Register for Live Session
              </a>
            </Button>
          </section>
        )}

        {/* Hosts & Guests */}
        {(kickoff.hosts.length > 0 || kickoff.guests.length > 0) && (
          <section className="mb-8 pb-8 border-b border-border">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Hosts & Guests
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {kickoff.hosts.map((host) => (
                <div key={host.id} className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
                  {host.avatar_url ? (
                    <Image
                      src={host.avatar_url}
                      alt={host.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-medium">
                      {host.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">{host.name}</p>
                    <Badge variant="secondary" className="text-xs">Host</Badge>
                  </div>
                </div>
              ))}

              {kickoff.guests.map((guest) => (
                <div key={guest.id} className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
                  {guest.avatar_url ? (
                    <Image
                      src={guest.avatar_url}
                      alt={guest.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-medium">
                      {guest.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">{guest.name}</p>
                    <Badge variant="outline" className="text-xs">Guest</Badge>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Resources */}
        {kickoff.resources && kickoff.resources.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Resources
            </h2>

            <div className="space-y-2">
              {kickoff.resources.map((resource, index) => (
                <a
                  key={index}
                  href={resource}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground truncate">{resource}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Week Calendar */}
        {calendarCampaigns.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              This Week's Campaigns
            </h2>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-7 border-b border-border">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0 border-border">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 min-h-[120px]">
                {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                  const dayCampaigns = calendarCampaigns.filter((c) => c.day_of_week === dayIndex)
                  const isWeekend = dayIndex >= 5

                  return (
                    <div key={dayIndex} className={`p-2 border-r last:border-r-0 border-border ${isWeekend ? 'bg-muted/30' : ''}`}>
                      <div className="space-y-2">
                        {dayCampaigns.map((campaign) => {
                          const getCampaignStyle = () => {
                            if (campaign.category === 'social-shareables') {
                              return {
                                bg: 'bg-blue-100 dark:bg-blue-900/30',
                                text: 'text-blue-700 dark:text-blue-300',
                                ring: 'ring-blue-500',
                                icon: Share2,
                                label: 'Social',
                                href: `/campaigns/social-shareables/${campaign.slug}`,
                              }
                            } else if (campaign.category === 'email-campaigns') {
                              return {
                                bg: 'bg-green-100 dark:bg-green-900/30',
                                text: 'text-green-700 dark:text-green-300',
                                ring: 'ring-green-500',
                                icon: Mail,
                                label: 'Email',
                                href: `/campaigns/email-campaigns/${campaign.slug}`,
                              }
                            } else {
                              return {
                                bg: 'bg-amber-100 dark:bg-amber-900/30',
                                text: 'text-amber-700 dark:text-amber-300',
                                ring: 'ring-amber-500',
                                icon: Phone,
                                label: 'Text',
                                href: `/campaigns/phone-text-scripts/${campaign.slug}`,
                              }
                            }
                          }

                          const style = getCampaignStyle()
                          const IconComponent = style.icon

                          return (
                            <Link key={campaign.id} href={style.href}>
                              <div className={`${style.bg} rounded-lg p-2 hover:ring-2 ${style.ring} transition-all`}>
                                <div className={`flex items-center gap-1 text-xs ${style.text} mb-1`}>
                                  <IconComponent className="w-3 h-3" />
                                  {style.label}
                                </div>
                                <p className="text-xs font-medium text-foreground line-clamp-2">{campaign.name}</p>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function KickoffDetailSkeleton() {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Hero Skeleton */}
      <div className="bg-muted/50 px-8 py-4">
        <div className="flex items-center mb-8">
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="py-8 text-center max-w-3xl mx-auto">
          <Skeleton className="h-6 w-24 mx-auto mb-4" />
          <Skeleton className="h-10 w-96 mx-auto mb-4" />
          <Skeleton className="h-5 w-48 mx-auto" />
        </div>
      </div>

      {/* Content Skeleton */}
      <main className="flex-1 px-8 py-8 max-w-4xl mx-auto w-full">
        <Skeleton className="aspect-video w-full rounded-xl mb-8" />
        <Skeleton className="h-12 w-48 mb-8" />
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </main>
    </div>
  )
}
