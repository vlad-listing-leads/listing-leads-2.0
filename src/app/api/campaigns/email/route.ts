import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region') || 'US'

    // Get current user for favorites
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch email campaigns
    const { data: campaigns, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('is_active', true)
      .in('region', [region, 'US,CA'])
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching email_campaigns:', error)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    // Fetch user favorites if logged in
    let favoriteIds: Set<string> = new Set()
    if (user) {
      const { data: favorites } = await supabase
        .from('campaign_favorites')
        .select('item_id')
        .eq('user_id', user.id)
        .eq('category', 'email-campaigns')

      if (favorites) {
        favoriteIds = new Set(favorites.map(f => f.item_id))
      }
    }

    // Transform and add favorites flag
    const transformedCampaigns = campaigns?.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      introduction: c.introduction,
      thumbnail_url: c.thumbnail_url,
      category: 'email-campaigns' as const,
      is_featured: c.is_featured,
      region: c.region,
      week_start_date: c.week_start_date,
      day_of_week: c.day_of_week,
      isFavorite: favoriteIds.has(c.id),
      // Additional fields specific to this category
      subject_line: c.subject_line,
      email_body: c.email_body,
      preview_text: c.preview_text,
      target_audience: c.target_audience,
      tags: c.tags,
      example_image_url: c.example_image_url,
      full_email_image_url: c.full_email_image_url,
      // Legacy fields
      title: c.name,
      description: c.introduction,
    })) || []

    return NextResponse.json({ campaigns: transformedCampaigns })
  } catch (error) {
    console.error('Email campaigns error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
