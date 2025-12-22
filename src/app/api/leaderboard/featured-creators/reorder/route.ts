import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Reorder featured creators
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

    const { creator_ids } = await request.json()

    if (!Array.isArray(creator_ids) || creator_ids.length === 0) {
      return NextResponse.json({ error: 'creator_ids array is required' }, { status: 400 })
    }

    // Update each creator's display_order
    const updates = creator_ids.map((id: string, index: number) =>
      supabase
        .from('featured_creators')
        .update({ display_order: index + 1 })
        .eq('id', id)
    )

    const results = await Promise.all(updates)

    // Check for errors
    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      console.error('Error reordering featured creators:', errors[0].error)
      return NextResponse.json({ error: 'Failed to reorder creators' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/leaderboard/featured-creators/reorder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
