import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CampaignCategory, CampaignCard } from '@/types/campaigns'

interface DbCampaign {
  id: string
  name: string
  slug: string
  introduction: string | null
  thumbnail_url: string | null
  region: string
  is_featured: boolean
  is_active: boolean
  display_order: number
  week_start_date: string | null
  day_of_week: number | null
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const region = searchParams.get('region') || 'US'
    const weeksCount = parseInt(searchParams.get('weeks') || '4')
    const categoryFilter = searchParams.get('category') as CampaignCategory | null

    // Get current user for favorites
    const { data: { user } } = await supabase.auth.getUser()

    // Calculate date range (current week and previous weeks)
    const today = new Date()
    const currentMonday = new Date(today)
    currentMonday.setDate(today.getDate() - today.getDay() + 1)
    currentMonday.setHours(0, 0, 0, 0)

    const startDate = new Date(currentMonday)
    startDate.setDate(startDate.getDate() - (weeksCount - 1) * 7)
    const startDateStr = startDate.toISOString().split('T')[0]

    // Fetch from all 4 tables (or just one if filtered)
    const tables: { name: string; category: CampaignCategory }[] = [
      { name: 'phone_text_scripts', category: 'phone-text-scripts' },
      { name: 'email_campaigns', category: 'email-campaigns' },
      { name: 'direct_mail_templates', category: 'direct-mail' },
      { name: 'social_shareables', category: 'social-shareables' },
    ]

    const filteredTables = categoryFilter
      ? tables.filter(t => t.category === categoryFilter)
      : tables

    // Fetch campaigns from each table
    const allCampaigns: (CampaignCard & { week_start_date: string | null })[] = []

    for (const table of filteredTables) {
      const { data, error } = await supabase
        .from(table.name)
        .select('id, name, slug, introduction, thumbnail_url, region, is_featured, is_active, display_order, week_start_date, day_of_week')
        .eq('is_active', true)
        .or(`region.eq.${region},region.eq.US`)
        .order('display_order', { ascending: true })

      if (error) {
        console.error(`Error fetching ${table.name}:`, error)
        continue
      }

      if (data) {
        allCampaigns.push(...data.map((c: DbCampaign) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          introduction: c.introduction,
          thumbnail_url: c.thumbnail_url,
          category: table.category,
          is_featured: c.is_featured,
          region: c.region,
          week_start_date: c.week_start_date,
          day_of_week: c.day_of_week,
          // Legacy fields
          title: c.name,
          description: c.introduction,
        })))
      }
    }

    // Fetch user favorites if logged in
    let favoriteMap: Record<string, Set<string>> = {}
    if (user) {
      const { data: favorites } = await supabase
        .from('campaign_favorites')
        .select('category, item_id')
        .eq('user_id', user.id)

      if (favorites) {
        for (const f of favorites) {
          if (!favoriteMap[f.category]) {
            favoriteMap[f.category] = new Set()
          }
          favoriteMap[f.category].add(f.item_id)
        }
      }
    }

    // Add isFavorite flag
    const campaignsWithFavorites = allCampaigns.map(c => ({
      ...c,
      isFavorite: favoriteMap[c.category]?.has(c.id) || false
    }))

    // Group campaigns by week
    // For now, distribute campaigns across weeks based on day_of_week
    const weeklyData: Record<string, {
      weekStart: string
      isCurrentWeek: boolean
      campaigns: CampaignCard[]
    }> = {}

    // Create week buckets for the date range
    for (let i = 0; i < weeksCount; i++) {
      const weekDate = new Date(currentMonday)
      weekDate.setDate(weekDate.getDate() - i * 7)
      const weekKey = weekDate.toISOString().split('T')[0]

      weeklyData[weekKey] = {
        weekStart: weekKey,
        isCurrentWeek: i === 0,
        campaigns: []
      }
    }

    // Distribute campaigns to weeks
    const weekKeys = Object.keys(weeklyData).sort((a, b) =>
      new Date(b).getTime() - new Date(a).getTime()
    )

    // Assign campaigns to days/weeks
    campaignsWithFavorites.forEach((campaign, index) => {
      // Use week_start_date if available, otherwise distribute evenly
      if (campaign.week_start_date && weeklyData[campaign.week_start_date]) {
        weeklyData[campaign.week_start_date].campaigns.push(campaign)
      } else {
        // Distribute across weeks
        const weekIndex = index % weeksCount
        const weekKey = weekKeys[weekIndex]
        if (weeklyData[weekKey]) {
          // Assign day_of_week if not set
          if (campaign.day_of_week === null) {
            const dayIndex = weeklyData[weekKey].campaigns.length % 5
            campaign.day_of_week = dayIndex
          }
          weeklyData[weekKey].campaigns.push(campaign)
        }
      }
    })

    // Convert to array sorted by week (most recent first)
    const weeks = Object.values(weeklyData)
      .filter(w => w.campaigns.length > 0)
      .sort((a, b) =>
        new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
      )

    return NextResponse.json({ weeks })
  } catch (error) {
    console.error('Weekly campaigns error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
