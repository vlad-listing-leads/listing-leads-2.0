import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/supadata'

// Dev mode bypass for API routes
const DEV_AUTH_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    const search = searchParams.get('search') || ''
    const platform = searchParams.get('platform') || ''

    let query = supabase
      .from('short_video_creators')
      .select('*')
      .order('name')

    if (search) {
      query = query.or(`name.ilike.%${search}%,handle.ilike.%${search}%`)
    }
    if (platform) {
      query = query.eq('platform', platform)
    }

    const { data: creators, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(creators || [])
  } catch (error) {
    console.error('Error fetching creators:', error)
    return NextResponse.json({ error: 'Failed to fetch creators' }, { status: 500 })
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
    const { name, handle, platform = 'instagram', profile_url, avatar_url, location } = body

    if (!name || !handle) {
      return NextResponse.json(
        { error: 'Name and handle are required' },
        { status: 400 }
      )
    }

    // Generate slug
    let slug = generateSlug(name)

    // Check for unique slug
    const { data: existing } = await supabase
      .from('short_video_creators')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      slug = `${slug}-${Date.now()}`
    }

    const { data: creator, error } = await supabase
      .from('short_video_creators')
      .insert({
        name,
        slug,
        platform,
        handle,
        profile_url: profile_url || null,
        avatar_url: avatar_url || null,
        location: location || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(creator, { status: 201 })
  } catch (error) {
    console.error('Error creating creator:', error)
    return NextResponse.json({ error: 'Failed to create creator' }, { status: 500 })
  }
}
