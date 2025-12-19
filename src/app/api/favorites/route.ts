import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CampaignCategory, CampaignCard } from '@/types/campaigns'
import { CATEGORY_TABLE_MAP } from '@/lib/campaign-utils'

// Get user's favorites with campaign details
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all favorites
    const { data: favorites, error } = await supabase
      .from('campaign_favorites')
      .select('id, category, item_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching favorites:', error)
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
    }

    // Group favorites by category
    const favoritesByCategory: Record<string, string[]> = {}
    for (const fav of favorites || []) {
      if (!favoritesByCategory[fav.category]) {
        favoritesByCategory[fav.category] = []
      }
      favoritesByCategory[fav.category].push(fav.item_id)
    }

    // Fetch campaign details for all categories in PARALLEL (not sequential)
    const categoryQueries = Object.entries(favoritesByCategory)
      .filter(([category, itemIds]) => {
        const tableName = CATEGORY_TABLE_MAP[category as CampaignCategory]
        return tableName && itemIds.length > 0
      })
      .map(async ([category, itemIds]) => {
        const tableName = CATEGORY_TABLE_MAP[category as CampaignCategory]
        const { data: campaigns } = await supabase
          .from(tableName)
          .select('id, name, slug, introduction, thumbnail_url, region, is_featured, week_start_date, day_of_week')
          .in('id', itemIds)
        return { category, campaigns: campaigns || [] }
      })

    const categoryResults = await Promise.all(categoryQueries)

    // Build the results from parallel query responses
    const campaignsWithDetails: (CampaignCard & { favorite_id: string; favorite_created_at: string })[] = []

    for (const { category, campaigns } of categoryResults) {
      for (const campaign of campaigns) {
        const favorite = favorites?.find(f => f.item_id === campaign.id)
        campaignsWithDetails.push({
          id: campaign.id,
          name: campaign.name,
          slug: campaign.slug,
          introduction: campaign.introduction,
          thumbnail_url: campaign.thumbnail_url,
          category: category as CampaignCategory,
          is_featured: campaign.is_featured,
          region: campaign.region,
          week_start_date: campaign.week_start_date,
          day_of_week: campaign.day_of_week,
          isFavorite: true,
          favorite_id: favorite?.id || '',
          favorite_created_at: favorite?.created_at || '',
          // Legacy fields
          title: campaign.name,
          description: campaign.introduction,
        })
      }
    }

    // Sort by favorite creation date
    campaignsWithDetails.sort((a, b) =>
      new Date(b.favorite_created_at).getTime() - new Date(a.favorite_created_at).getTime()
    )

    return NextResponse.json({ favorites: campaignsWithDetails })
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

    const { campaignId, category } = await request.json()

    if (!campaignId || !category) {
      return NextResponse.json({ error: 'Campaign ID and category required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('campaign_favorites')
      .insert({
        user_id: user.id,
        item_id: campaignId,
        category: category
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
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
    const category = searchParams.get('category')

    if (!campaignId || !category) {
      return NextResponse.json({ error: 'Campaign ID and category required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('campaign_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('item_id', campaignId)
      .eq('category', category)

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
