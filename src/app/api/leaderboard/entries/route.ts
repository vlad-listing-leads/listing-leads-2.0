import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  LeaderboardEntry,
  LeaderboardEntryDisplay,
  LeaderboardType,
  EngagementMetrics,
} from '@/types/leaderboard'

// GET - List leaderboard entries
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    const leaderboardType = searchParams.get('type') as LeaderboardType || 'monthly'
    const monthYear = searchParams.get('month_year') // e.g., '2025-01'
    const includeInactive = searchParams.get('include_inactive') === 'true'

    // Build query with joins
    let query = supabase
      .from('leaderboard_entries')
      .select(`
        *,
        short_video:short_videos(
          *,
          creator:short_video_creators(*)
        ),
        youtube_video:youtube_videos(
          *,
          creator:video_creators(*)
        )
      `)
      .eq('leaderboard_type', leaderboardType)
      .order('display_order', { ascending: true })

    // Filter by month for monthly leaderboard
    if (leaderboardType === 'monthly' && monthYear) {
      query = query.eq('month_year', monthYear)
    }

    // Filter active status
    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data: entries, error } = await query

    if (error) {
      console.error('Error fetching leaderboard entries:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform to display format
    const displayEntries: LeaderboardEntryDisplay[] = (entries || []).map((entry: LeaderboardEntry) => {
      const isInstagram = !!entry.short_video_id
      const video = isInstagram ? entry.short_video : entry.youtube_video
      const creator = isInstagram
        ? entry.short_video?.creator
        : entry.youtube_video?.creator

      return {
        ...entry,
        cached_engagement: (entry.cached_engagement || {}) as EngagementMetrics,
        video_type: isInstagram ? 'instagram' : 'youtube',
        title: video?.name || '',
        thumbnail_url: (isInstagram
          ? entry.short_video?.cover_url
          : entry.youtube_video?.thumbnail_url) || null,
        creator_name: creator?.name || null,
        creator_avatar: isInstagram
          ? (entry.short_video?.creator as { avatar_url?: string })?.avatar_url || null
          : (entry.youtube_video?.creator as { image_url?: string })?.image_url || null,
        creator_handle: isInstagram
          ? (entry.short_video?.creator as { handle?: string })?.handle || null
          : null,
        creator_location: isInstagram
          ? (entry.short_video?.creator as { location?: string })?.location || null
          : (entry.youtube_video?.creator as { location?: string })?.location || null,
        source_url: (isInstagram
          ? entry.short_video?.source_url
          : entry.youtube_video?.youtube_url) || null,
        date_posted: (isInstagram
          ? entry.short_video?.date_posted
          : entry.youtube_video?.date_posted_yt) || null,
      }
    })

    return NextResponse.json({
      entries: displayEntries,
      total: displayEntries.length,
    })
  } catch (error) {
    console.error('Error in GET /api/leaderboard/entries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new leaderboard entry
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check admin auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      short_video_id,
      youtube_video_id,
      leaderboard_type,
      month_year,
    } = body

    // Validate required fields
    if (!leaderboard_type) {
      return NextResponse.json({ error: 'leaderboard_type is required' }, { status: 400 })
    }

    if (!short_video_id && !youtube_video_id) {
      return NextResponse.json({ error: 'Either short_video_id or youtube_video_id is required' }, { status: 400 })
    }

    if (short_video_id && youtube_video_id) {
      return NextResponse.json({ error: 'Only one of short_video_id or youtube_video_id should be provided' }, { status: 400 })
    }

    // Check if entry already exists
    let existsQuery = supabase
      .from('leaderboard_entries')
      .select('id')
      .eq('leaderboard_type', leaderboard_type)

    if (short_video_id) {
      existsQuery = existsQuery.eq('short_video_id', short_video_id)
    } else {
      existsQuery = existsQuery.eq('youtube_video_id', youtube_video_id)
    }

    if (leaderboard_type === 'monthly' && month_year) {
      existsQuery = existsQuery.eq('month_year', month_year)
    }

    const { data: existing } = await existsQuery.single()

    if (existing) {
      return NextResponse.json({ error: 'Video already exists in this leaderboard' }, { status: 409 })
    }

    // Get max display_order for this leaderboard
    const { data: maxOrder } = await supabase
      .from('leaderboard_entries')
      .select('display_order')
      .eq('leaderboard_type', leaderboard_type)
      .eq('month_year', leaderboard_type === 'monthly' ? month_year : null)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const newOrder = (maxOrder?.display_order || 0) + 1

    // Create entry
    const { data: entry, error: insertError } = await supabase
      .from('leaderboard_entries')
      .insert({
        short_video_id: short_video_id || null,
        youtube_video_id: youtube_video_id || null,
        leaderboard_type,
        month_year: leaderboard_type === 'monthly' ? month_year : null,
        display_order: newOrder,
        is_active: true,
        cached_engagement: {},
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating leaderboard entry:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/leaderboard/entries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
