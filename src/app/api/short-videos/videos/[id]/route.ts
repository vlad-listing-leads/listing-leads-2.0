import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Dev mode bypass for API routes
const DEV_AUTH_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: video, error } = await supabase
      .from('short_videos')
      .select(`
        *,
        creator:short_video_creators(*),
        category:short_video_categories(*),
        triggers:short_video_triggers(
          trigger:psychological_triggers(*)
        ),
        power_words:short_video_power_words(
          power_word:power_words(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Video not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Flatten triggers and power_words
    const flattenedVideo = {
      ...video,
      triggers: video.triggers?.map((t: { trigger: unknown }) => t.trigger) || [],
      power_words: video.power_words?.map((p: { power_word: unknown }) => p.power_word) || [],
    }

    return NextResponse.json(flattenedVideo)
  } catch (error) {
    console.error('Error fetching video:', error)
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check if user is admin
    if (!DEV_AUTH_BYPASS) {
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
    }

    const body = await request.json()
    const { trigger_ids, power_word_ids, ...videoData } = body

    // Update video
    const { data: video, error: updateError } = await supabase
      .from('short_videos')
      .update(videoData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Video not found' }, { status: 404 })
      }
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Update trigger associations if provided
    if (trigger_ids !== undefined) {
      // Delete existing
      await supabase
        .from('short_video_triggers')
        .delete()
        .eq('video_id', id)

      // Insert new
      if (trigger_ids.length > 0) {
        const triggerAssociations = trigger_ids.map((trigger_id: string) => ({
          video_id: id,
          trigger_id,
        }))
        await supabase.from('short_video_triggers').insert(triggerAssociations)
      }
    }

    // Update power word associations if provided
    if (power_word_ids !== undefined) {
      // Delete existing
      await supabase
        .from('short_video_power_words')
        .delete()
        .eq('video_id', id)

      // Insert new
      if (power_word_ids.length > 0) {
        const powerWordAssociations = power_word_ids.map((power_word_id: string) => ({
          video_id: id,
          power_word_id,
        }))
        await supabase.from('short_video_power_words').insert(powerWordAssociations)
      }
    }

    // Fetch complete video with relations
    const { data: completeVideo } = await supabase
      .from('short_videos')
      .select(`
        *,
        creator:short_video_creators(*),
        category:short_video_categories(*),
        triggers:short_video_triggers(
          trigger:psychological_triggers(*)
        ),
        power_words:short_video_power_words(
          power_word:power_words(*)
        )
      `)
      .eq('id', id)
      .single()

    // Flatten
    const flattenedVideo = {
      ...completeVideo,
      triggers: completeVideo?.triggers?.map((t: { trigger: unknown }) => t.trigger) || [],
      power_words: completeVideo?.power_words?.map((p: { power_word: unknown }) => p.power_word) || [],
    }

    return NextResponse.json(flattenedVideo)
  } catch (error) {
    console.error('Error updating video:', error)
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check if user is admin
    if (!DEV_AUTH_BYPASS) {
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
    }

    // Delete video (cascade will handle junction tables)
    const { error } = await supabase
      .from('short_videos')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}
