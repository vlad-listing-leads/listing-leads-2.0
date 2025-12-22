import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SearchResult {
  id: string
  name: string
  slug: string
  introduction: string | null
  thumbnail_url: string | null
  category: string
  is_featured: boolean
  type: 'campaign' | 'creator'
  // Creator-specific fields
  company?: { name: string; icon_url?: string | null } | string
  creator?: { name: string; handle?: string } | string
  platform?: string
  channel?: string
}

// Database item interfaces for type safety
interface AdItem {
  id: string
  name: string
  slug: string
  image_url: string | null
  channel?: string
  company?: { name: string; icon_url?: string | null }[] | { name: string } | string
}

interface ShortVideoItem {
  id: string
  name: string
  slug: string
  cover_url: string | null
  platform?: string
  creator?: { name: string; handle?: string }[] | { name: string } | string
}

interface YouTubeVideoItem {
  id: string
  name: string
  slug: string
  thumbnail_url: string | null
  creator?: { name: string; handle?: string }[] | { name: string } | string
}

// Strip HTML tags from text
function stripHtml(html: string | null): string {
  if (!html) return ''
  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, '')
  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
  // Clean up extra whitespace
  return text.replace(/\s+/g, ' ').trim()
}

export async function GET(request: NextRequest) {
  // SECURITY: Require authentication for search
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')?.toLowerCase() || ''
  const limit = parseInt(searchParams.get('limit') || '20')

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    // Search all tables in parallel (only active items)
    const [phoneTexts, emails, directMail, social, ads, shortVideos, youtubeVideos] = await Promise.all([
      // Campaign tables
      supabase
        .from('phone_text_scripts')
        .select('id, name, slug, introduction, thumbnail_url, is_featured')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,introduction.ilike.%${query}%`)
        .limit(limit),
      supabase
        .from('email_campaigns')
        .select('id, name, slug, introduction, thumbnail_url, is_featured')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,introduction.ilike.%${query}%`)
        .limit(limit),
      supabase
        .from('direct_mail_templates')
        .select('id, name, slug, introduction, thumbnail_url, is_featured')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,introduction.ilike.%${query}%`)
        .limit(limit),
      supabase
        .from('social_shareables')
        .select('id, name, slug, introduction, thumbnail_url, is_featured, is_video')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,introduction.ilike.%${query}%`)
        .limit(limit),
      // Creator content tables
      supabase
        .from('ads')
        .select('id, name, slug, image_url, channel, company:ad_companies(name, icon_url)')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(limit),
      supabase
        .from('short_videos')
        .select('id, name, slug, cover_url, platform, creator:short_video_creators(name, handle)')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,ai_summary.ilike.%${query}%`)
        .limit(limit),
      supabase
        .from('youtube_videos')
        .select('id, name, slug, thumbnail_url, creator:video_creators(name)')
        .or(`name.ilike.%${query}%,ai_summary.ilike.%${query}%`)
        .limit(limit),
    ])

    // Combine and categorize results
    const results: SearchResult[] = []

    // Campaign results - strip HTML from name and introduction
    if (phoneTexts.data) {
      results.push(
        ...phoneTexts.data.map((item) => ({
          ...item,
          name: stripHtml(item.name),
          introduction: stripHtml(item.introduction),
          category: 'phone-text-scripts',
          type: 'campaign' as const,
        }))
      )
    }

    if (emails.data) {
      results.push(
        ...emails.data.map((item) => ({
          ...item,
          name: stripHtml(item.name),
          introduction: stripHtml(item.introduction),
          category: 'email-campaigns',
          type: 'campaign' as const,
        }))
      )
    }

    if (directMail.data) {
      results.push(
        ...directMail.data.map((item) => ({
          ...item,
          name: stripHtml(item.name),
          introduction: stripHtml(item.introduction),
          category: 'direct-mail',
          type: 'campaign' as const,
        }))
      )
    }

    if (social.data) {
      results.push(
        ...social.data.map((item) => ({
          ...item,
          name: stripHtml(item.name),
          introduction: stripHtml(item.introduction),
          category: 'social-shareables',
          type: 'campaign' as const,
        }))
      )
    }

    // Creator content results
    if (ads.data) {
      results.push(
        ...ads.data.map((item: AdItem) => ({
          id: item.id,
          name: stripHtml(item.name),
          slug: item.slug,
          introduction: null,
          thumbnail_url: item.image_url,
          category: 'ads',
          is_featured: false,
          type: 'creator' as const,
          channel: item.channel,
          company: Array.isArray(item.company) ? item.company[0] : item.company,
        }))
      )
    }

    if (shortVideos.data) {
      results.push(
        ...shortVideos.data.map((item: ShortVideoItem) => ({
          id: item.id,
          name: stripHtml(item.name),
          slug: item.slug,
          introduction: null,
          thumbnail_url: item.cover_url,
          category: 'short-videos',
          is_featured: false,
          type: 'creator' as const,
          platform: item.platform,
          creator: Array.isArray(item.creator) ? item.creator[0] : item.creator,
        }))
      )
    }

    if (youtubeVideos.data) {
      results.push(
        ...youtubeVideos.data.map((item: YouTubeVideoItem) => ({
          id: item.id,
          name: stripHtml(item.name),
          slug: item.slug,
          introduction: null,
          thumbnail_url: item.thumbnail_url,
          category: 'youtube-videos',
          is_featured: false,
          type: 'creator' as const,
          creator: Array.isArray(item.creator) ? item.creator[0] : item.creator,
        }))
      )
    }

    // Group by category for display
    const grouped = {
      'phone-text-scripts': results.filter((r) => r.category === 'phone-text-scripts'),
      'email-campaigns': results.filter((r) => r.category === 'email-campaigns'),
      'direct-mail': results.filter((r) => r.category === 'direct-mail'),
      'social-shareables': results.filter((r) => r.category === 'social-shareables'),
      ads: results.filter((r) => r.category === 'ads'),
      'short-videos': results.filter((r) => r.category === 'short-videos'),
      'youtube-videos': results.filter((r) => r.category === 'youtube-videos'),
    }

    return NextResponse.json({
      results,
      grouped,
      total: results.length,
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
