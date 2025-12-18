import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/announcements - Get active announcements
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .or('starts_at.is.null,starts_at.lte.now()')
      .or('ends_at.is.null,ends_at.gt.now()')
      .order('display_order', { ascending: true })
      .limit(1)

    if (error) {
      console.error('Error fetching announcements:', error)
      return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
    }

    return NextResponse.json({ data: announcements })
  } catch (error) {
    console.error('Error in GET /api/announcements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/announcements - Create new announcement (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication and admin role
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

    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert({
        title: body.title,
        message: body.message,
        link_url: body.link_url || null,
        link_text: body.link_text || null,
        bg_color: body.bg_color || '#3b82f6',
        text_color: body.text_color || '#ffffff',
        is_active: body.is_active ?? true,
        starts_at: body.starts_at || null,
        ends_at: body.ends_at || null,
        display_order: body.display_order || 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating announcement:', error)
      return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
    }

    return NextResponse.json({ data: announcement })
  } catch (error) {
    console.error('Error in POST /api/announcements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
