import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchEngagementMetrics } from '@/lib/engagement-fetcher'

// POST - Refresh engagement metrics for leaderboard entries
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
    const { entry_ids } = body

    // If no specific IDs provided, refresh all active entries
    let query = supabase
      .from('leaderboard_entries')
      .select(`
        id,
        short_video_id,
        youtube_video_id,
        short_video:short_videos(source_url, platform),
        youtube_video:youtube_videos(youtube_id, youtube_url)
      `)
      .eq('is_active', true)

    if (entry_ids && Array.isArray(entry_ids) && entry_ids.length > 0) {
      query = query.in('id', entry_ids)
    }

    const { data: entries, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching entries:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({ message: 'No entries to refresh', updated: 0 })
    }

    // Fetch metrics for each entry
    const results = await Promise.all(
      entries.map(async (entry) => {
        try {
          const isInstagram = !!entry.short_video_id
          let metrics = null

          if (isInstagram && entry.short_video) {
            const sv = entry.short_video as { source_url?: string; platform?: string }
            if (sv.source_url) {
              metrics = await fetchEngagementMetrics('instagram', sv.source_url)
            }
          } else if (entry.youtube_video) {
            const yv = entry.youtube_video as { youtube_id?: string; youtube_url?: string }
            if (yv.youtube_id) {
              metrics = await fetchEngagementMetrics('youtube', yv.youtube_id)
            }
          }

          if (metrics) {
            await supabase
              .from('leaderboard_entries')
              .update({
                cached_engagement: metrics,
                metrics_updated_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', entry.id)

            return { id: entry.id, success: true, metrics }
          }

          return { id: entry.id, success: false, error: 'No metrics fetched' }
        } catch (error) {
          console.error(`Error fetching metrics for entry ${entry.id}:`, error)
          return { id: entry.id, success: false, error: String(error) }
        }
      })
    )

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return NextResponse.json({
      message: `Refreshed ${successful} entries, ${failed} failed`,
      updated: successful,
      failed,
      results,
    })
  } catch (error) {
    console.error('Error in POST /api/leaderboard/metrics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
