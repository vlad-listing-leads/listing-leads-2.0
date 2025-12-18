import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Middleware to check admin
async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Forbidden', status: 403 }
  }

  return { user }
}

// GET /api/admin/announcements - Get all announcements (admin only)
export async function GET() {
  try {
    const supabase = await createClient()

    const adminCheck = await checkAdmin(supabase)
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching announcements:', error)
      return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
    }

    return NextResponse.json({ data: announcements })
  } catch (error) {
    console.error('Error in GET /api/admin/announcements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/announcements - Create announcement
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const adminCheck = await checkAdmin(supabase)
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
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
    console.error('Error in POST /api/admin/announcements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/announcements - Update announcement
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    const adminCheck = await checkAdmin(supabase)
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 })
    }

    const { data: announcement, error } = await supabase
      .from('announcements')
      .update({
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
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating announcement:', error)
      return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 })
    }

    return NextResponse.json({ data: announcement })
  } catch (error) {
    console.error('Error in PUT /api/admin/announcements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/announcements - Delete announcement
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const adminCheck = await checkAdmin(supabase)
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting announcement:', error)
      return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Announcement deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/announcements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
