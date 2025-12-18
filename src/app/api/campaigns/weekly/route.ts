import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CampaignCategory, CampaignCard, WeekData } from '@/types/campaigns'

// Table name mapping for categories
const categoryTableMap: Record<CampaignCategory, string> = {
  'email-campaigns': 'email_campaigns',
  'phone-text-scripts': 'phone_text_scripts',
  'social-shareables': 'social_shareables',
  'direct-mail': 'direct_mail_templates',
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
    // Handle Sunday (getDay() = 0) - go back to previous Monday
    const dayOfWeek = today.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    currentMonday.setDate(today.getDate() - daysToMonday)
    currentMonday.setHours(0, 0, 0, 0)

    // Calculate date range: past weeks + current + future weeks
    const pastWeeks = Math.floor(weeksCount / 2)
    const futureWeeks = weeksCount - pastWeeks - 1

    const startDate = new Date(currentMonday)
    startDate.setDate(startDate.getDate() - pastWeeks * 7)

    const endDate = new Date(currentMonday)
    endDate.setDate(endDate.getDate() + futureWeeks * 7)

    // Format dates without timezone issues
    const formatDateStr = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const startDateStr = formatDateStr(startDate)
    const endDateStr = formatDateStr(endDate)

    console.log('Weekly API - Date range:', { startDateStr, endDateStr, currentWeek: formatDateStr(currentMonday), today: formatDateStr(today) })

    // Fetch available weeks from calendar_weeks
    const { data: availableWeeks, error: weeksError } = await supabase
      .from('calendar_weeks')
      .select('id, week_start_date, week_number, year')
      .eq('is_available', true)
      .gte('week_start_date', startDateStr)
      .lte('week_start_date', endDateStr)
      .order('week_start_date', { ascending: false })

    console.log('Weekly API - Available weeks:', availableWeeks?.length || 0)

    if (weeksError) {
      console.error('Error fetching calendar weeks:', weeksError)
      return NextResponse.json({ error: 'Failed to fetch weeks' }, { status: 500 })
    }

    if (!availableWeeks || availableWeeks.length === 0) {
      return NextResponse.json({ weeks: [] })
    }

    const weekIds = availableWeeks.map(w => w.id)

    // Fetch campaign assignments for available weeks
    let assignmentsQuery = supabase
      .from('campaign_week_assignments')
      .select('id, week_id, campaign_id, category, day_of_week, display_order')
      .in('week_id', weekIds)
      .order('day_of_week', { ascending: true })
      .order('display_order', { ascending: true })

    if (categoryFilter) {
      assignmentsQuery = assignmentsQuery.eq('category', categoryFilter)
    }

    const { data: assignments, error: assignmentsError } = await assignmentsQuery

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }

    // Group assignments by category to batch fetch campaign details
    const assignmentsByCategory: Record<CampaignCategory, typeof assignments> = {
      'email-campaigns': [],
      'phone-text-scripts': [],
      'social-shareables': [],
      'direct-mail': [],
    }

    for (const assignment of assignments || []) {
      const category = assignment.category as CampaignCategory
      assignmentsByCategory[category].push(assignment)
    }

    // Fetch campaign details for each category
    const campaignMap: Record<string, CampaignCard & { region: string }> = {}

    for (const [category, categoryAssignments] of Object.entries(assignmentsByCategory)) {
      if (categoryAssignments.length === 0) continue

      const tableName = categoryTableMap[category as CampaignCategory]
      const campaignIds = categoryAssignments.map(a => a.campaign_id)

      const { data: campaigns, error } = await supabase
        .from(tableName)
        .select('id, name, slug, introduction, thumbnail_url, region, is_featured, is_active')
        .in('id', campaignIds)
        .eq('is_active', true)

      if (error) {
        console.error(`Error fetching ${category} campaigns:`, error)
        continue
      }

      for (const campaign of campaigns) {
        // Filter by region
        if (campaign.region !== region && campaign.region !== 'US') continue

        campaignMap[campaign.id] = {
          id: campaign.id,
          name: campaign.name,
          slug: campaign.slug,
          introduction: campaign.introduction,
          thumbnail_url: campaign.thumbnail_url,
          category: category as CampaignCategory,
          is_featured: campaign.is_featured,
          region: campaign.region,
          week_start_date: null,
          day_of_week: null,
          // Legacy fields
          title: campaign.name,
          description: campaign.introduction,
        }
      }
    }

    // Fetch user favorites if logged in
    let favoriteSet: Set<string> = new Set()
    if (user) {
      const { data: favorites } = await supabase
        .from('campaign_favorites')
        .select('item_id')
        .eq('user_id', user.id)

      if (favorites) {
        favoriteSet = new Set(favorites.map(f => f.item_id))
      }
    }

    // Build week data
    const currentWeekStr = formatDateStr(currentMonday)
    const weekDataMap: Record<string, WeekData> = {}

    for (const week of availableWeeks) {
      weekDataMap[week.id] = {
        weekStart: week.week_start_date,
        isCurrentWeek: week.week_start_date === currentWeekStr,
        campaigns: [],
      }
    }

    // Add campaigns to their weeks
    for (const assignment of assignments || []) {
      const campaign = campaignMap[assignment.campaign_id]
      if (!campaign) continue

      const weekData = weekDataMap[assignment.week_id]
      if (!weekData) continue

      weekData.campaigns.push({
        ...campaign,
        week_start_date: weekData.weekStart,
        day_of_week: assignment.day_of_week,
        isFavorite: favoriteSet.has(campaign.id),
      })
    }

    // Convert to array sorted by week (most recent first)
    // Include all available weeks, even those without campaigns
    const weeks = Object.values(weekDataMap)
      .sort((a, b) =>
        new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
      )

    return NextResponse.json({ weeks })
  } catch (error) {
    console.error('Weekly campaigns error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
