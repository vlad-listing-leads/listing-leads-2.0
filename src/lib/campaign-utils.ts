import { CampaignCategory, CampaignCard } from '@/types/campaigns'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Mapping from campaign category slugs to database table names
 */
export const CATEGORY_TABLE_MAP: Record<CampaignCategory, string> = {
  'email-campaigns': 'email_campaigns',
  'phone-text-scripts': 'phone_text_scripts',
  'social-shareables': 'social_shareables',
  'direct-mail': 'direct_mail_templates',
}

/**
 * Get the database table name for a campaign category
 */
export function getCategoryTable(category: CampaignCategory): string {
  return CATEGORY_TABLE_MAP[category]
}

/**
 * Check if a string is a valid campaign category
 */
export function isValidCategory(category: string): category is CampaignCategory {
  return category in CATEGORY_TABLE_MAP
}

/**
 * Result type for fetchCampaignsByCategory
 */
export interface FetchCampaignsResult {
  campaigns: (CampaignCard & Record<string, unknown>)[]
  error?: string
}

/**
 * Fetches campaigns for a given category with favorites support
 * This is shared logic used by category-specific API routes
 */
export async function fetchCampaignsByCategory(
  supabase: SupabaseClient,
  category: CampaignCategory,
  options: {
    region?: string
    userId?: string
  } = {}
): Promise<FetchCampaignsResult> {
  const { region = 'US', userId } = options
  const tableName = CATEGORY_TABLE_MAP[category]

  try {
    // Fetch campaigns from the category table
    const { data: campaigns, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('is_active', true)
      .in('region', [region, 'US,CA'])
      .order('display_order', { ascending: true })

    if (error) {
      console.error(`Error fetching ${tableName}:`, error)
      return { campaigns: [], error: 'Failed to fetch campaigns' }
    }

    // Fetch user favorites if logged in
    let favoriteIds: Set<string> = new Set()
    if (userId) {
      const { data: favorites } = await supabase
        .from('campaign_favorites')
        .select('item_id')
        .eq('user_id', userId)
        .eq('category', category)

      if (favorites) {
        favoriteIds = new Set(favorites.map(f => f.item_id))
      }
    }

    // Transform campaigns with common fields
    const transformedCampaigns = campaigns?.map(c => ({
      ...c,
      category,
      isFavorite: favoriteIds.has(c.id),
      // Legacy fields for compatibility
      title: c.name,
      description: c.introduction,
    })) || []

    return { campaigns: transformedCampaigns }
  } catch (error) {
    console.error(`${category} campaigns error:`, error)
    return { campaigns: [], error: 'Internal server error' }
  }
}
