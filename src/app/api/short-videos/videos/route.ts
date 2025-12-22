import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ShortVideoInsert } from '@/types/short-video'
import { generateSlug } from '@/lib/supadata'

// Dev mode bypass for API routes
const DEV_AUTH_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const offset = (page - 1) * pageSize

    // Filters
    const search = searchParams.get('search') || ''
    const platform = searchParams.get('platform') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const creatorId = searchParams.get('creatorId') || ''
    const isActive = searchParams.get('isActive')

    // Build query
    let query = supabase
      .from('short_videos')
      .select(`
        *,
        creator:short_video_creators(*),
        category:short_video_categories(*)
      `, { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }
    if (platform) {
      query = query.eq('platform', platform)
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }
    if (creatorId) {
      query = query.eq('creator_id', creatorId)
    }
    if (isActive !== null && isActive !== '') {
      query = query.eq('is_active', isActive === 'true')
    }

    // Order and paginate
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    const { data: videos, error, count } = await query

    if (error) {
      console.error('Error fetching short videos:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      videos: videos || [],
      total: count || 0,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('Error in GET /api/short-videos/videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const {
      name,
      platform = 'instagram',
      source_url,
      source_id,
      video_url,
      cover_url,
      video_runtime,
      description,
      creator_id,
      category_id,
      date_posted,
      transcript,
      ai_summary,
      hook_text,
      cta,
      embed_code,
      is_active = true,
      trigger_ids = [],
      power_word_ids = [],
    } = body

    if (!name || !source_url) {
      return NextResponse.json(
        { error: 'Name and source_url are required' },
        { status: 400 }
      )
    }

    // Generate slug
    let slug = generateSlug(name)

    // Check for unique slug
    const { data: existing } = await supabase
      .from('short_videos')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      slug = `${slug}-${Date.now()}`
    }

    // Insert video
    const videoData: ShortVideoInsert = {
      name,
      slug,
      platform,
      source_url,
      source_id: source_id || null,
      video_url: video_url || null,
      cover_url: cover_url || null,
      video_runtime: video_runtime || null,
      description: description || null,
      creator_id: creator_id || null,
      category_id: category_id || null,
      date_posted: date_posted || null,
      transcript: transcript || null,
      ai_summary: ai_summary || null,
      hook_text: hook_text || null,
      cta: cta || null,
      embed_code: embed_code || null,
      is_active,
    }

    const { data: video, error: insertError } = await supabase
      .from('short_videos')
      .insert(videoData)
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting video:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Insert trigger associations
    if (trigger_ids.length > 0) {
      const triggerAssociations = trigger_ids.map((trigger_id: string) => ({
        video_id: video.id,
        trigger_id,
      }))
      await supabase.from('short_video_triggers').insert(triggerAssociations)
    }

    // Insert power word associations
    if (power_word_ids.length > 0) {
      const powerWordAssociations = power_word_ids.map((power_word_id: string) => ({
        video_id: video.id,
        power_word_id,
      }))
      await supabase.from('short_video_power_words').insert(powerWordAssociations)
    }

    // Fetch complete video with relations
    const { data: completeVideo } = await supabase
      .from('short_videos')
      .select(`
        *,
        creator:short_video_creators(*),
        category:short_video_categories(*)
      `)
      .eq('id', video.id)
      .single()

    return NextResponse.json(completeVideo, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/short-videos/videos:', error)
    return NextResponse.json(
      { error: 'Failed to create video' },
      { status: 500 }
    )
  }
}
