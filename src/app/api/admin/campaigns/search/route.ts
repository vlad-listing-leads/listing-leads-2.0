import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CampaignCategory, CampaignCard } from '@/types/campaigns'

// Table name mapping for categories
const categoryTableMap: Record<CampaignCategory, string> = {
  'email-campaigns': 'email_campaigns',
  'phone-text-scripts': 'phone_text_scripts',
  'social-shareables': 'social_shareables',
  'direct-mail': 'direct_mail_templates',
}

// GET - Search campaigns across all categories
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Check admin access
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

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const category = searchParams.get('category') as CampaignCategory | null
  const limit = parseInt(searchParams.get('limit') || '20')
  const excludeWeekId = searchParams.get('excludeWeekId')

  // Get campaigns already assigned to this week (if provided)
  let assignedCampaignIds: Set<string> = new Set()
  if (excludeWeekId) {
    const { data: assignments } = await supabase
      .from('campaign_week_assignments')
      .select('campaign_id')
      .eq('week_id', excludeWeekId)

    if (assignments) {
      assignedCampaignIds = new Set(assignments.map(a => a.campaign_id))
    }
  }

  const campaigns: CampaignCard[] = []
  const categoriesToSearch = category ? [category] : Object.keys(categoryTableMap) as CampaignCategory[]

  for (const cat of categoriesToSearch) {
    const tableName = categoryTableMap[cat]

    let queryBuilder = supabase
      .from(tableName)
      .select('id, name, slug, introduction, thumbnail_url, is_featured, region, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(limit)

    // Apply search filter if provided
    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,introduction.ilike.%${query}%`)
    }

    const { data, error } = await queryBuilder

    if (error) {
      console.error(`Error searching ${cat}:`, error)
      continue
    }

    for (const campaign of data) {
      // Skip campaigns already assigned to this week
      if (assignedCampaignIds.has(campaign.id)) continue

      campaigns.push({
        ...campaign,
        category: cat,
        week_start_date: null,
        day_of_week: null,
      })
    }
  }

  // Sort combined results by name
  campaigns.sort((a, b) => a.name.localeCompare(b.name))

  // Limit total results
  const limitedCampaigns = campaigns.slice(0, limit)

  return NextResponse.json({ campaigns: limitedCampaigns })
}
