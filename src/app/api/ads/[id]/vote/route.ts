import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ userVote: null })
    }

    // Get user's vote for this ad
    const { data: vote } = await supabase
      .from('ad_votes')
      .select('rating')
      .eq('ad_id', id)
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ userVote: vote?.rating || null })
  } catch (error) {
    console.error('Error in GET /api/ads/[id]/vote:', error)
    return NextResponse.json({ userVote: null })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Must be logged in to vote' }, { status: 401 })
    }

    const body = await request.json()
    const { rating } = body

    // Validate rating
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 })
    }

    // Check if ad exists
    const { data: ad } = await supabase
      .from('ads')
      .select('id')
      .eq('id', id)
      .single()

    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    // Upsert vote (insert or update)
    const { data: vote, error: voteError } = await supabase
      .from('ad_votes')
      .upsert({
        ad_id: id,
        user_id: user.id,
        rating,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'ad_id,user_id',
      })
      .select()
      .single()

    if (voteError) {
      console.error('Error saving vote:', voteError)
      return NextResponse.json({ error: voteError.message }, { status: 500 })
    }

    // Get updated ad stats
    const { data: updatedAd } = await supabase
      .from('ads')
      .select('rating, rating_count')
      .eq('id', id)
      .single()

    return NextResponse.json({
      success: true,
      userVote: rating,
      adRating: updatedAd?.rating || 0,
      adRatingCount: updatedAd?.rating_count || 0,
    })
  } catch (error) {
    console.error('Error in POST /api/ads/[id]/vote:', error)
    return NextResponse.json(
      { error: 'Failed to save vote' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Must be logged in' }, { status: 401 })
    }

    // Delete vote
    const { error: deleteError } = await supabase
      .from('ad_votes')
      .delete()
      .eq('ad_id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting vote:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Get updated ad stats
    const { data: updatedAd } = await supabase
      .from('ads')
      .select('rating, rating_count')
      .eq('id', id)
      .single()

    return NextResponse.json({
      success: true,
      userVote: null,
      adRating: updatedAd?.rating || 0,
      adRatingCount: updatedAd?.rating_count || 0,
    })
  } catch (error) {
    console.error('Error in DELETE /api/ads/[id]/vote:', error)
    return NextResponse.json(
      { error: 'Failed to delete vote' },
      { status: 500 }
    )
  }
}
