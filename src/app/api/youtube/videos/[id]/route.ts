import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/supadata'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: Get single video by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: video, error } = await supabase
      .from('youtube_videos')
      .select(`
        *,
        creator:video_creators(*),
        category:video_categories(*),
        hook:video_hooks(*),
        triggers:youtube_video_triggers(trigger:psychological_triggers(*)),
        power_words:youtube_video_power_words(power_word:power_words(*))
      `)
      .eq('id', id)
      .single()

    if (error || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Transform nested data
    const transformedVideo = {
      ...video,
      triggers: video.triggers?.map((t: { trigger: unknown }) => t.trigger) || [],
      power_words: video.power_words?.map((p: { power_word: unknown }) => p.power_word) || [],
    }

    return NextResponse.json({ video: transformedVideo })
  } catch (error) {
    console.error('Error in GET /api/youtube/videos/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Update video by ID
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
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

    // Check video exists
    const { data: existingVideo } = await supabase
      .from('youtube_videos')
      .select('id, hook_id')
      .eq('id', id)
      .single()

    if (!existingVideo) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      name,
      slug,
      video_runtime,
      score,
      greater_sign,
      hook_text,
      creator_id,
      new_creator,
      category_id,
      new_category,
      date_posted_yt,
      cta,
      ai_summary,
      transcript,
      thumbnail_url,
      view_count,
      is_active,
      trigger_ids,
      power_word_ids,
    } = body

    // Handle creator - create new or use existing
    let finalCreatorId = creator_id
    if (new_creator && !creator_id) {
      const { data: newCreator, error: creatorError } = await supabase
        .from('video_creators')
        .insert({
          name: new_creator.name,
          channel_id: new_creator.channel_id,
          channel_url: new_creator.channel_url,
          image_url: new_creator.image_url,
        })
        .select()
        .single()

      if (creatorError) {
        console.error('Error creating creator:', creatorError)
        return NextResponse.json(
          { error: 'Failed to create creator' },
          { status: 500 }
        )
      }
      finalCreatorId = newCreator.id
    }

    // Handle category - create new or use existing
    let finalCategoryId = category_id
    if (new_category && !category_id) {
      const categorySlug = generateSlug(new_category.name)
      const { data: newCategory, error: categoryError } = await supabase
        .from('video_categories')
        .insert({
          name: new_category.name,
          slug: categorySlug,
        })
        .select()
        .single()

      if (categoryError) {
        console.error('Error creating category:', categoryError)
        return NextResponse.json(
          { error: 'Failed to create category' },
          { status: 500 }
        )
      }
      finalCategoryId = newCategory.id
    }

    // Update or create hook if provided
    let hookId = existingVideo.hook_id
    if (hook_text !== undefined) {
      if (hookId) {
        // Update existing hook
        await supabase
          .from('video_hooks')
          .update({ hook_text, name: (name || 'Video').substring(0, 50) + ' Hook' })
          .eq('id', hookId)
      } else if (hook_text) {
        // Create new hook
        const { data: newHook } = await supabase
          .from('video_hooks')
          .insert({
            name: (name || 'Video').substring(0, 50) + ' Hook',
            hook_text,
            video_id: id,
          })
          .select()
          .single()
        hookId = newHook?.id || null
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (video_runtime !== undefined) updateData.video_runtime = video_runtime
    if (score !== undefined) updateData.score = score
    if (greater_sign !== undefined) updateData.greater_sign = greater_sign
    if (hookId !== undefined) updateData.hook_id = hookId
    if (finalCreatorId !== undefined) updateData.creator_id = finalCreatorId
    if (finalCategoryId !== undefined) updateData.category_id = finalCategoryId
    if (date_posted_yt !== undefined) updateData.date_posted_yt = date_posted_yt
    if (cta !== undefined) updateData.cta = cta
    if (ai_summary !== undefined) updateData.ai_summary = ai_summary
    if (transcript !== undefined) updateData.transcript = transcript
    if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url
    if (view_count !== undefined) updateData.view_count = view_count
    if (is_active !== undefined) updateData.is_active = is_active

    // Update video
    const { data: video, error: videoError } = await supabase
      .from('youtube_videos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (videoError) {
      console.error('Error updating video:', videoError)
      return NextResponse.json(
        { error: videoError.message },
        { status: 500 }
      )
    }

    // Update trigger associations
    if (trigger_ids !== undefined) {
      // Delete existing
      await supabase
        .from('youtube_video_triggers')
        .delete()
        .eq('video_id', id)

      // Insert new
      if (trigger_ids.length > 0) {
        const triggerInserts = trigger_ids.map((trigger_id: string) => ({
          video_id: id,
          trigger_id,
        }))
        await supabase.from('youtube_video_triggers').insert(triggerInserts)
      }
    }

    // Update power word associations
    if (power_word_ids !== undefined) {
      // Delete existing
      await supabase
        .from('youtube_video_power_words')
        .delete()
        .eq('video_id', id)

      // Insert new
      if (power_word_ids.length > 0) {
        const powerWordInserts = power_word_ids.map((power_word_id: string) => ({
          video_id: id,
          power_word_id,
        }))
        await supabase.from('youtube_video_power_words').insert(powerWordInserts)
      }
    }

    return NextResponse.json({ video })
  } catch (error) {
    console.error('Error in PUT /api/youtube/videos/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete video by ID
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
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

    // Get video to check if it exists and get hook_id
    const { data: video } = await supabase
      .from('youtube_videos')
      .select('id, hook_id')
      .eq('id', id)
      .single()

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Delete associated hook if exists
    if (video.hook_id) {
      await supabase.from('video_hooks').delete().eq('id', video.hook_id)
    }

    // Delete video (cascade will handle junction tables)
    const { error: deleteError } = await supabase
      .from('youtube_videos')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting video:', deleteError)
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/youtube/videos/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
