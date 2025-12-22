import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FeaturedCreator, FeaturedCreatorDisplay } from '@/types/leaderboard'

// GET - List featured creators
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const includeInactive = searchParams.get('include_inactive') === 'true'

    let query = supabase
      .from('featured_creators')
      .select(`
        *,
        short_video_creator:short_video_creators(*),
        video_creator:video_creators(*)
      `)
      .order('display_order', { ascending: true })

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data: creators, error } = await query

    if (error) {
      console.error('Error fetching featured creators:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform to display format
    const displayCreators: FeaturedCreatorDisplay[] = (creators || []).map((fc: FeaturedCreator) => {
      const isInstagram = !!fc.short_video_creator_id
      const creator = isInstagram ? fc.short_video_creator : fc.video_creator

      return {
        ...fc,
        creator_type: isInstagram ? 'instagram' : 'youtube',
        name: creator?.name || '',
        avatar_url: isInstagram
          ? (fc.short_video_creator as { avatar_url?: string })?.avatar_url || null
          : (fc.video_creator as { image_url?: string })?.image_url || null,
        location: isInstagram
          ? (fc.short_video_creator as { location?: string })?.location || null
          : (fc.video_creator as { location?: string })?.location || null,
        handle: isInstagram
          ? (fc.short_video_creator as { handle?: string })?.handle || null
          : null,
      }
    })

    return NextResponse.json({ creators: displayCreators })
  } catch (error) {
    console.error('Error in GET /api/leaderboard/featured-creators:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add featured creator
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
    const { short_video_creator_id, video_creator_id } = body

    // Validate
    if (!short_video_creator_id && !video_creator_id) {
      return NextResponse.json(
        { error: 'Either short_video_creator_id or video_creator_id is required' },
        { status: 400 }
      )
    }

    if (short_video_creator_id && video_creator_id) {
      return NextResponse.json(
        { error: 'Only one creator type should be provided' },
        { status: 400 }
      )
    }

    // Check if already featured
    let existsQuery = supabase.from('featured_creators').select('id')

    if (short_video_creator_id) {
      existsQuery = existsQuery.eq('short_video_creator_id', short_video_creator_id)
    } else {
      existsQuery = existsQuery.eq('video_creator_id', video_creator_id)
    }

    const { data: existing } = await existsQuery.single()

    if (existing) {
      return NextResponse.json({ error: 'Creator is already featured' }, { status: 409 })
    }

    // Get max display_order
    const { data: maxOrder } = await supabase
      .from('featured_creators')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const newOrder = (maxOrder?.display_order || 0) + 1

    // Create featured creator
    const { data: creator, error: insertError } = await supabase
      .from('featured_creators')
      .insert({
        short_video_creator_id: short_video_creator_id || null,
        video_creator_id: video_creator_id || null,
        display_order: newOrder,
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating featured creator:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ creator }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/leaderboard/featured-creators:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
