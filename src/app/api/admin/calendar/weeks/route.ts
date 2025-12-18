import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CalendarWeek, CampaignCategory } from '@/types/campaigns'

// GET - Fetch all weeks for a year with campaign counts
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

  // Get year from query params (default to current year)
  const { searchParams } = new URL(request.url)
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

  // Fetch weeks for the year by date range (not ISO year)
  // This ensures Dec 29-31 shows in the correct calendar year
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  const { data: weeks, error: weeksError } = await supabase
    .from('calendar_weeks')
    .select('*')
    .gte('week_start_date', startDate)
    .lte('week_start_date', endDate)
    .order('week_start_date', { ascending: true })

  if (weeksError) {
    console.error('Error fetching weeks:', weeksError)
    return NextResponse.json({ error: 'Failed to fetch weeks' }, { status: 500 })
  }

  // Fetch campaign counts per week
  const { data: assignments, error: assignmentsError } = await supabase
    .from('campaign_week_assignments')
    .select('week_id, category')
    .in('week_id', weeks.map(w => w.id))

  if (assignmentsError) {
    console.error('Error fetching assignments:', assignmentsError)
  }

  // Build counts map
  const countsMap: Record<string, Record<CampaignCategory, number>> = {}
  if (assignments) {
    for (const assignment of assignments) {
      if (!countsMap[assignment.week_id]) {
        countsMap[assignment.week_id] = {
          'email-campaigns': 0,
          'phone-text-scripts': 0,
          'social-shareables': 0,
          'direct-mail': 0,
        }
      }
      countsMap[assignment.week_id][assignment.category as CampaignCategory]++
    }
  }

  // Add counts to weeks
  const weeksWithCounts: CalendarWeek[] = weeks.map(week => ({
    ...week,
    campaign_counts: countsMap[week.id] || {
      'email-campaigns': 0,
      'phone-text-scripts': 0,
      'social-shareables': 0,
      'direct-mail': 0,
    },
  }))

  return NextResponse.json({ weeks: weeksWithCounts })
}

// POST - Update week settings (availability, theme, notes)
export async function POST(request: NextRequest) {
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

  const body = await request.json()
  const { week_id, is_available, theme, notes } = body

  if (!week_id) {
    return NextResponse.json({ error: 'week_id is required' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof is_available === 'boolean') updateData.is_available = is_available
  if (theme !== undefined) updateData.theme = theme
  if (notes !== undefined) updateData.notes = notes

  const { data: week, error } = await supabase
    .from('calendar_weeks')
    .update(updateData)
    .eq('id', week_id)
    .select()
    .single()

  if (error) {
    console.error('Error updating week:', error)
    return NextResponse.json({ error: 'Failed to update week' }, { status: 500 })
  }

  return NextResponse.json({ week })
}
