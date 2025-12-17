import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region') || 'US'

    // Get current user for favorites
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch direct mail templates
    const { data: campaigns, error } = await supabase
      .from('direct_mail_templates')
      .select('*')
      .eq('is_active', true)
      .or(`region.eq.${region},region.eq.US`)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching direct_mail_templates:', error)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    // Fetch user favorites if logged in
    let favoriteIds: Set<string> = new Set()
    if (user) {
      const { data: favorites } = await supabase
        .from('campaign_favorites')
        .select('item_id')
        .eq('user_id', user.id)
        .eq('category', 'direct-mail')

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
      category: 'direct-mail' as const,
      is_featured: c.is_featured,
      region: c.region,
      week_start_date: c.week_start_date,
      day_of_week: c.day_of_week,
      isFavorite: favoriteIds.has(c.id),
      // Additional fields specific to this category
      mail_type: c.mail_type,
      canva_template_url: c.canva_template_url,
      editor_url: c.editor_url,
      target_audience: c.target_audience,
      channel: c.channel,
      example_image_url: c.example_image_url,
      example_images: c.example_images,
      // Legacy fields
      title: c.name,
      description: c.introduction,
    })) || []

    return NextResponse.json({ campaigns: transformedCampaigns })
  } catch (error) {
    console.error('Direct mail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
