import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AdInsert } from '@/types/ad'

const DEV_AUTH_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const offset = (page - 1) * pageSize

    // Filters
    const search = searchParams.get('search') || ''
    const channel = searchParams.get('channel') || ''
    const companyId = searchParams.get('companyId') || ''
    const tagId = searchParams.get('tagId') || ''
    const isActive = searchParams.get('isActive')
    const slug = searchParams.get('slug') || ''

    // Build query
    let query = supabase
      .from('ads')
      .select(`
        *,
        company:ad_companies(*),
        tags:ad_tag_links(tag:ad_tags(*))
      `, { count: 'exact' })

    // Filter by slug for single ad lookup
    if (slug) {
      query = query.eq('slug', slug)
    }

    // Apply filters
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }
    if (channel) {
      query = query.eq('channel', channel)
    }
    if (companyId) {
      query = query.eq('company_id', companyId)
    }
    if (isActive !== null && isActive !== '') {
      query = query.eq('is_active', isActive === 'true')
    }

    // Order and paginate
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    const { data: ads, error, count } = await query

    if (error) {
      console.error('Error fetching ads:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform tags from nested structure
    const transformedAds = ads?.map(ad => ({
      ...ad,
      tags: ad.tags?.map((t: { tag: unknown }) => t.tag).filter(Boolean) || [],
    })) || []

    // Filter by tag if specified (post-query filter)
    let filteredAds = transformedAds
    if (tagId) {
      filteredAds = transformedAds.filter(ad =>
        ad.tags?.some((tag: { id: string }) => tag.id === tagId)
      )
    }

    const response = NextResponse.json({
      ads: filteredAds,
      total: tagId ? filteredAds.length : count || 0,
      page,
      pageSize,
    })

    // Cache for 5 minutes, serve stale for 1 hour while revalidating
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')
    return response
  } catch (error) {
    console.error('Error in GET /api/ads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ads' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    if (!DEV_AUTH_BYPASS) {
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
    }

    const body = await request.json()
    const {
      name,
      slug,
      channel = 'meta',
      image_url,
      company_id,
      rating = 0,
      rating_count = 0,
      description,
      is_active = true,
      tag_ids = [],
    } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Insert ad
    const adData: AdInsert = {
      name,
      slug,
      channel,
      image_url: image_url || null,
      company_id: company_id || null,
      rating,
      rating_count,
      description: description || null,
      is_active,
    }

    const { data: ad, error: insertError } = await supabase
      .from('ads')
      .insert(adData)
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting ad:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Insert tag links
    if (tag_ids.length > 0) {
      const tagLinks = tag_ids.map((tag_id: string) => ({
        ad_id: ad.id,
        tag_id,
      }))
      await supabase.from('ad_tag_links').insert(tagLinks)
    }

    // Fetch complete ad with relations
    const { data: completeAd } = await supabase
      .from('ads')
      .select(`
        *,
        company:ad_companies(*),
        tags:ad_tag_links(tag:ad_tags(*))
      `)
      .eq('id', ad.id)
      .single()

    return NextResponse.json(completeAd, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/ads:', error)
    return NextResponse.json(
      { error: 'Failed to create ad' },
      { status: 500 }
    )
  }
}
