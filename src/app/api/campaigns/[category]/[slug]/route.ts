import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CampaignCategory } from '@/types/campaigns'

// Map category to table name
const categoryTableMap: Record<CampaignCategory, string> = {
  'phone-text-scripts': 'phone_text_scripts',
  'email-campaigns': 'email_campaigns',
  'direct-mail': 'direct_mail_templates',
  'social-shareables': 'social_shareables',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string; slug: string }> }
) {
  try {
    const { category, slug } = await params
    const supabase = await createClient()

    // Validate category
    if (!categoryTableMap[category as CampaignCategory]) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const tableName = categoryTableMap[category as CampaignCategory]

    // Fetch the campaign
    const { data: campaign, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error || !campaign) {
      console.error('Error fetching campaign:', error)
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get current user for favorites
    const { data: { user } } = await supabase.auth.getUser()

    let isFavorite = false
    if (user) {
      const { data: favorite } = await supabase
        .from('campaign_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('category', category)
        .eq('item_id', campaign.id)
        .single()

      isFavorite = !!favorite
    }

    // Return campaign with category and favorite status
    return NextResponse.json({
      campaign: {
        ...campaign,
        category: category as CampaignCategory,
        isFavorite,
      },
    })
  } catch (error) {
    console.error('Campaign fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
