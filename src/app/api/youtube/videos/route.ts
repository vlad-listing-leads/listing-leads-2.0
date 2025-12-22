import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/supadata'

// GET: List all videos
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const category_id = searchParams.get('category_id')
    const creator_id = searchParams.get('creator_id')
    const search = searchParams.get('search')

    let query = supabase
      .from('youtube_videos')
      .select(`
        *,
        creator:video_creators(*),
        category:video_categories(*),
        hook:video_hooks(*),
        triggers:youtube_video_triggers(trigger:psychological_triggers(*)),
        power_words:youtube_video_power_words(power_word:power_words(*))
      `)
      .order('created_at', { ascending: false })

    // Filter by active status (admins can see all)
    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    if (category_id) {
      query = query.eq('category_id', category_id)
    }

    if (creator_id) {
      query = query.eq('creator_id', creator_id)
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching videos:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the nested data structure
    const videos = data?.map(video => ({
      ...video,
      triggers: video.triggers?.map((t: { trigger: unknown }) => t.trigger) || [],
      power_words: video.power_words?.map((p: { power_word: unknown }) => p.power_word) || [],
    })) || []

    return NextResponse.json({ videos })
  } catch (error) {
    console.error('Error in GET /api/youtube/videos:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create a new video
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const {
      name,
      slug,
      youtube_url,
      youtube_id,
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

    // Validate required fields
    if (!name || !youtube_url || !youtube_id) {
      return NextResponse.json(
        { error: 'Name, YouTube URL, and YouTube ID are required' },
        { status: 400 }
      )
    }

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

    // Create hook if provided
    let hookId = null
    if (hook_text) {
      const { data: newHook, error: hookError } = await supabase
        .from('video_hooks')
        .insert({
          name: name.substring(0, 50) + ' Hook',
          hook_text,
        })
        .select()
        .single()

      if (hookError) {
        console.error('Error creating hook:', hookError)
      } else {
        hookId = newHook.id
      }
    }

    // Create the video
    const { data: video, error: videoError } = await supabase
      .from('youtube_videos')
      .insert({
        name,
        slug,
        youtube_url,
        youtube_id,
        video_runtime: video_runtime || 0,
        score: score || null,
        greater_sign: greater_sign || null,
        hook_id: hookId,
        creator_id: finalCreatorId || null,
        category_id: finalCategoryId || null,
        date_posted_yt: date_posted_yt || null,
        cta: cta || null,
        ai_summary: ai_summary || null,
        transcript: transcript || null,
        thumbnail_url: thumbnail_url || null,
        view_count: view_count || 0,
        is_active: is_active ?? false,
      })
      .select()
      .single()

    if (videoError) {
      console.error('Error creating video:', videoError)
      return NextResponse.json(
        { error: videoError.message },
        { status: 500 }
      )
    }

    // Update hook with video reference
    if (hookId) {
      await supabase
        .from('video_hooks')
        .update({ video_id: video.id })
        .eq('id', hookId)
    }

    // Add trigger associations
    if (trigger_ids && trigger_ids.length > 0) {
      const triggerInserts = trigger_ids.map((trigger_id: string) => ({
        video_id: video.id,
        trigger_id,
      }))
      await supabase.from('youtube_video_triggers').insert(triggerInserts)
    }

    // Add power word associations
    if (power_word_ids && power_word_ids.length > 0) {
      const powerWordInserts = power_word_ids.map((power_word_id: string) => ({
        video_id: video.id,
        power_word_id,
      }))
      await supabase.from('youtube_video_power_words').insert(powerWordInserts)
    }

    return NextResponse.json({ video }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/youtube/videos:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
