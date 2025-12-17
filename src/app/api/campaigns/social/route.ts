import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region') || 'US'

    // Get current user for favorites
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch social shareables
    const { data: campaigns, error } = await supabase
      .from('social_shareables')
      .select('*')
      .eq('is_active', true)
      .or(`region.eq.${region},region.eq.US`)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching social_shareables:', error)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    // Fetch user favorites if logged in
    let favoriteIds: Set<string> = new Set()
    if (user) {
      const { data: favorites } = await supabase
        .from('campaign_favorites')
        .select('item_id')
        .eq('user_id', user.id)
        .eq('category', 'social-shareables')

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
      category: 'social-shareables' as const,
      is_featured: c.is_featured,
      region: c.region,
      week_start_date: c.week_start_date,
      day_of_week: c.day_of_week,
      isFavorite: favoriteIds.has(c.id),
      // Additional fields specific to this category
      is_video: c.is_video,
      content_type: c.content_type,
      canva_template_url: c.canva_template_url,
      video_flow_pdf_title: c.video_flow_pdf_title,
      video_flow_pdf_url: c.video_flow_pdf_url,
      audio_transcription_url: c.audio_transcription_url,
      video_title: c.video_title,
      video_description: c.video_description,
      hashtags: c.hashtags,
      example_image_url: c.example_image_url,
      example_images: c.example_images,
      // Legacy fields
      title: c.name,
      description: c.introduction,
    })) || []

    return NextResponse.json({ campaigns: transformedCampaigns })
  } catch (error) {
    console.error('Social shareables error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
