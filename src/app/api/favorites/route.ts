import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Get user's favorites
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: favorites, error } = await supabase
      .from('user_favorites')
      .select(`
        id,
        campaign_id,
        created_at,
        weekly_campaigns (
          id,
          title,
          description,
          category,
          thumbnail_url,
          content_url,
          week_start_date,
          day_of_week
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching favorites:', error)
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
    }

    return NextResponse.json({ favorites })
  } catch (error) {
    console.error('Favorites error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Add favorite
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId } = await request.json()

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: user.id,
        campaign_id: campaignId
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        // Already favorited
        return NextResponse.json({ message: 'Already favorited' })
      }
      console.error('Error adding favorite:', error)
      return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
    }

    return NextResponse.json({ favorite: data })
  } catch (error) {
    console.error('Add favorite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Remove favorite
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('campaign_id', campaignId)

    if (error) {
      console.error('Error removing favorite:', error)
      return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove favorite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
