import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CampaignCategory, CampaignCard } from '@/types/campaigns'
import { CATEGORY_TABLE_MAP } from '@/lib/campaign-utils'

// Extended category to table mapping including creator content
const EXTENDED_CATEGORY_TABLE_MAP: Record<string, string> = {
  ...CATEGORY_TABLE_MAP,
  'ads': 'ads',
  'short-videos': 'short_videos',
  'youtube-videos': 'youtube_videos',
}

// Creator content categories
const CREATOR_CATEGORIES = ['ads', 'short-videos', 'youtube-videos']

// Base item interface from database queries
interface FavoriteItemBase {
  id: string
  name: string
  slug: string
  thumbnail_url?: string | null
  image_url?: string | null
  cover_url?: string | null
  channel?: string
  company?: unknown
  platform?: string
  creator?: unknown
  youtube_id?: string
  description?: string
  // Campaign-specific
  introduction?: string | null
  is_featured?: boolean
  region?: string
  week_start_date?: string | null
  day_of_week?: number | null
}

// Result favorite interface
interface FavoriteResult {
  id: string
  name: string
  slug: string
  category: string
  type: 'campaign' | 'creator'
  thumbnail_url: string | null | undefined
  description?: string | null
  isFavorite: boolean
  favorite_id?: string
  favorite_created_at?: string
  // Campaign-specific fields
  introduction?: string | null
  is_featured?: boolean
  region?: string
  week_start_date?: string | null
  day_of_week?: number | null
  title?: string
  // Creator-specific fields
  channel?: string
  company?: unknown
  platform?: string
  creator?: unknown
  youtube_id?: string
}

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

    // Fetch details for all categories in PARALLEL
    const categoryQueries = Object.entries(favoritesByCategory)
      .filter(([category, itemIds]) => {
        const tableName = EXTENDED_CATEGORY_TABLE_MAP[category]
        return tableName && itemIds.length > 0
      })
      .map(async ([category, itemIds]) => {
        const tableName = EXTENDED_CATEGORY_TABLE_MAP[category]

        // Different select based on category type
        if (category === 'ads') {
          const { data } = await supabase
            .from(tableName)
            .select('id, name, slug, image_url, channel, company:ad_companies(name, icon_url)')
            .in('id', itemIds)
          return { category, items: data || [] }
        } else if (category === 'short-videos') {
          const { data } = await supabase
            .from(tableName)
            .select('id, name, slug, cover_url, platform, creator:short_video_creators(name, handle)')
            .in('id', itemIds)
          return { category, items: data || [] }
        } else if (category === 'youtube-videos') {
          const { data } = await supabase
            .from(tableName)
            .select('id, name, slug, thumbnail_url, youtube_id, creator:video_creators(name)')
            .in('id', itemIds)
          return { category, items: data || [] }
        } else {
          // Campaign categories
          const { data } = await supabase
            .from(tableName)
            .select('id, name, slug, introduction, thumbnail_url, region, is_featured, week_start_date, day_of_week')
            .in('id', itemIds)
          return { category, items: data || [] }
        }
      })

    const categoryResults = await Promise.all(categoryQueries)

    // Build the results
    const allFavorites: FavoriteResult[] = []

    for (const { category, items } of categoryResults) {
      for (const item of items as FavoriteItemBase[]) {
        const favorite = favorites?.find(f => f.item_id === item.id)

        if (CREATOR_CATEGORIES.includes(category)) {
          // Creator content format
          allFavorites.push({
            id: item.id,
            name: item.name,
            slug: item.slug,
            category,
            type: 'creator',
            thumbnail_url: item.image_url || item.cover_url || item.thumbnail_url,
            isFavorite: true,
            favorite_id: favorite?.id || '',
            favorite_created_at: favorite?.created_at || '',
            // Type-specific fields
            ...(category === 'ads' && { channel: item.channel, company: item.company }),
            ...(category === 'short-videos' && { platform: item.platform, creator: item.creator }),
            ...(category === 'youtube-videos' && { youtube_id: item.youtube_id, creator: item.creator }),
          })
        } else {
          // Campaign format
          allFavorites.push({
            id: item.id,
            name: item.name,
            slug: item.slug,
            introduction: item.introduction,
            thumbnail_url: item.thumbnail_url,
            category: category as CampaignCategory,
            type: 'campaign',
            is_featured: item.is_featured,
            region: item.region,
            week_start_date: item.week_start_date,
            day_of_week: item.day_of_week,
            isFavorite: true,
            favorite_id: favorite?.id || '',
            favorite_created_at: favorite?.created_at || '',
            // Legacy fields
            title: item.name,
            description: item.introduction,
          })
        }
      }
    }

    // Sort by favorite creation date
    allFavorites.sort((a, b) =>
      new Date(b.favorite_created_at || 0).getTime() - new Date(a.favorite_created_at || 0).getTime()
    )

    return NextResponse.json({ favorites: allFavorites })
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
