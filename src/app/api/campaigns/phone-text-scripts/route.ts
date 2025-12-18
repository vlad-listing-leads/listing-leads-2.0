import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region') || 'US'

    // Get current user for favorites
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch phone/text scripts
    const { data: campaigns, error } = await supabase
      .from('phone_text_scripts')
      .select('*')
      .eq('is_active', true)
      .in('region', [region, 'US,CA'])
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching phone_text_scripts:', error)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    // Fetch user favorites if logged in
    let favoriteIds: Set<string> = new Set()
    if (user) {
      const { data: favorites } = await supabase
        .from('campaign_favorites')
        .select('item_id')
        .eq('user_id', user.id)
        .eq('category', 'phone-text-scripts')

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
      category: 'phone-text-scripts' as const,
      is_featured: c.is_featured,
      region: c.region,
      week_start_date: c.week_start_date,
      day_of_week: c.day_of_week,
      isFavorite: favoriteIds.has(c.id),
      // Additional fields specific to this category
      script_type: c.script_type,
      target_audience: c.target_audience,
      text_message_1: c.text_message_1,
      text_message_2: c.text_message_2,
      text_message_3: c.text_message_3,
      call_script_content: c.call_script_content,
      example_image_url: c.example_image_url,
      full_script_image_url: c.full_script_image_url,
      // Legacy fields
      title: c.name,
      description: c.introduction,
    })) || []

    return NextResponse.json({ campaigns: transformedCampaigns })
  } catch (error) {
    console.error('Phone text scripts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
