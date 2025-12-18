import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CampaignCategory, CampaignWeekAssignment, CampaignCard } from '@/types/campaigns'

// Table name mapping for categories
const categoryTableMap: Record<CampaignCategory, string> = {
  'email-campaigns': 'email_campaigns',
  'phone-text-scripts': 'phone_text_scripts',
  'social-shareables': 'social_shareables',
  'direct-mail': 'direct_mail_templates',
}

// GET - Fetch all assignments for a week with campaign details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ weekId: string }> }
) {
  const { weekId } = await params
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

  // Fetch assignments for this week
  const { data: assignments, error: assignmentsError } = await supabase
    .from('campaign_week_assignments')
    .select('*')
    .eq('week_id', weekId)
    .order('day_of_week', { ascending: true })
    .order('display_order', { ascending: true })

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

  for (const assignment of assignments) {
    const category = assignment.category as CampaignCategory
    assignmentsByCategory[category].push(assignment)
  }

  // Fetch campaign details for each category
  const campaignMap: Record<string, CampaignCard> = {}

  for (const [category, categoryAssignments] of Object.entries(assignmentsByCategory)) {
    if (categoryAssignments.length === 0) continue

    const tableName = categoryTableMap[category as CampaignCategory]
    const campaignIds = categoryAssignments.map(a => a.campaign_id)

    const { data: campaigns, error } = await supabase
      .from(tableName)
      .select('id, name, slug, introduction, thumbnail_url, is_featured, region')
      .in('id', campaignIds)

    if (error) {
      console.error(`Error fetching ${category} campaigns:`, error)
      continue
    }

    for (const campaign of campaigns) {
      campaignMap[campaign.id] = {
        ...campaign,
        category: category as CampaignCategory,
        week_start_date: null,
        day_of_week: null,
      }
    }
  }

  // Attach campaign details to assignments
  const assignmentsWithCampaigns: CampaignWeekAssignment[] = assignments.map(assignment => ({
    ...assignment,
    campaign: campaignMap[assignment.campaign_id],
  }))

  return NextResponse.json({ assignments: assignmentsWithCampaigns })
}

// POST - Create a new assignment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ weekId: string }> }
) {
  const { weekId } = await params
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
  const { campaign_id, category, day_of_week, display_order = 0 } = body

  if (!campaign_id || !category || day_of_week === undefined) {
    return NextResponse.json(
      { error: 'campaign_id, category, and day_of_week are required' },
      { status: 400 }
    )
  }

  // Validate category
  if (!categoryTableMap[category as CampaignCategory]) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  // Validate day_of_week
  if (day_of_week < 0 || day_of_week > 4) {
    return NextResponse.json({ error: 'day_of_week must be 0-4 (Mon-Fri)' }, { status: 400 })
  }

  // Verify campaign exists
  const tableName = categoryTableMap[category as CampaignCategory]
  const { data: campaign, error: campaignError } = await supabase
    .from(tableName)
    .select('id, name')
    .eq('id', campaign_id)
    .single()

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  // Create assignment
  const { data: assignment, error } = await supabase
    .from('campaign_week_assignments')
    .insert({
      week_id: weekId,
      campaign_id,
      category,
      day_of_week,
      display_order,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Campaign is already assigned to this week' },
        { status: 409 }
      )
    }
    console.error('Error creating assignment:', error)
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
  }

  return NextResponse.json({ assignment })
}

// DELETE - Remove an assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ weekId: string }> }
) {
  const { weekId } = await params
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
  const assignmentId = searchParams.get('assignmentId')

  if (!assignmentId) {
    return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('campaign_week_assignments')
    .delete()
    .eq('id', assignmentId)
    .eq('week_id', weekId)

  if (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
