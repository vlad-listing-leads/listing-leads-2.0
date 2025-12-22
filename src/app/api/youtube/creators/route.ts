import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: List all creators
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: creators, error } = await supabase
      .from('video_creators')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching creators:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ creators })
  } catch (error) {
    console.error('Error in GET /api/youtube/creators:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create a new creator
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
    const { name, channel_url, channel_id, image_url, subscribers, location } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check if creator with same channel_id already exists
    if (channel_id) {
      const { data: existing } = await supabase
        .from('video_creators')
        .select('id')
        .eq('channel_id', channel_id)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Creator with this channel ID already exists', existing_id: existing.id },
          { status: 409 }
        )
      }
    }

    const { data: creator, error } = await supabase
      .from('video_creators')
      .insert({
        name,
        channel_url: channel_url || null,
        channel_id: channel_id || null,
        image_url: image_url || null,
        subscribers: subscribers || 0,
        location: location || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating creator:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ creator }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/youtube/creators:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
