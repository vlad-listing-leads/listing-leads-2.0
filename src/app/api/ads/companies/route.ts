import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: companies, error } = await supabase
      .from('ad_companies')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching companies:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(companies || [])
  } catch (error) {
    console.error('Error in GET /api/ads/companies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}
