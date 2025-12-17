import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const region = searchParams.get('region') || 'US'
    const weeksCount = parseInt(searchParams.get('weeks') || '4')

    // Get current user for favorites
    const { data: { user } } = await supabase.auth.getUser()

    // Calculate date range (current week and previous weeks)
    const today = new Date()
    const currentMonday = new Date(today)
    currentMonday.setDate(today.getDate() - today.getDay() + 1)
    currentMonday.setHours(0, 0, 0, 0)

    const startDate = new Date(currentMonday)
    startDate.setDate(startDate.getDate() - (weeksCount - 1) * 7)

    // Fetch campaigns
    const { data: campaigns, error } = await supabase
      .from('weekly_campaigns')
      .select('*')
      .eq('region', region)
      .eq('is_active', true)
      .gte('week_start_date', startDate.toISOString().split('T')[0])
      .order('week_start_date', { ascending: false })
      .order('day_of_week', { ascending: true })
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching campaigns:', error)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    // Fetch user favorites if logged in
    let favoriteIds: string[] = []
    if (user) {
      const { data: favorites } = await supabase
        .from('user_favorites')
        .select('campaign_id')
        .eq('user_id', user.id)

      favoriteIds = favorites?.map(f => f.campaign_id) || []
    }

    // Group campaigns by week
    const weeklyData: Record<string, {
      weekStart: string
      isCurrentWeek: boolean
      campaigns: Array<typeof campaigns[0] & { isFavorite: boolean }>
    }> = {}

    campaigns?.forEach(campaign => {
      const weekKey = campaign.week_start_date
      if (!weeklyData[weekKey]) {
        const weekDate = new Date(campaign.week_start_date)
        const isCurrentWeek = weekDate.getTime() === currentMonday.getTime()

        weeklyData[weekKey] = {
          weekStart: campaign.week_start_date,
          isCurrentWeek,
          campaigns: []
        }
      }

      weeklyData[weekKey].campaigns.push({
        ...campaign,
        isFavorite: favoriteIds.includes(campaign.id)
      })
    })

    // Convert to array sorted by week (most recent first)
    const weeks = Object.values(weeklyData).sort((a, b) =>
      new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
    )

    return NextResponse.json({ weeks })
  } catch (error) {
    console.error('Weekly campaigns error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
