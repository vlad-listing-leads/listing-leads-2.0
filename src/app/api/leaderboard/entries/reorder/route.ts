import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Reorder leaderboard entries
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

    const { entry_ids } = await request.json()

    if (!Array.isArray(entry_ids) || entry_ids.length === 0) {
      return NextResponse.json({ error: 'entry_ids array is required' }, { status: 400 })
    }

    // Update each entry's display_order based on position in array
    const updates = entry_ids.map((id: string, index: number) =>
      supabase
        .from('leaderboard_entries')
        .update({
          display_order: index + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
    )

    const results = await Promise.all(updates)

    // Check for errors
    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      console.error('Error reordering entries:', errors[0].error)
      return NextResponse.json({ error: 'Failed to reorder entries' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/leaderboard/entries/reorder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
