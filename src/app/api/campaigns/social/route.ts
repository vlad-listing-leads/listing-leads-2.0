import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchCampaignsByCategory } from '@/lib/campaign-utils'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const region = searchParams.get('region') || 'US'

  // Get current user for favorites
  const { data: { user } } = await supabase.auth.getUser()

  const result = await fetchCampaignsByCategory(supabase, 'social-shareables', {
    region,
    userId: user?.id,
  })

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  // Add cache headers - revalidate every 5 minutes, stale for 1 hour
  const response = NextResponse.json({ campaigns: result.campaigns })
  response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')
  return response
}
