import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AdUpdate } from '@/types/ad'

const DEV_AUTH_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: ad, error } = await supabase
      .from('ads')
      .select(`
        *,
        company:ad_companies(*),
        tags:ad_tag_links(tag:ad_tags(*))
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform tags
    const transformedAd = {
      ...ad,
      tags: ad.tags?.map((t: { tag: unknown }) => t.tag).filter(Boolean) || [],
    }

    return NextResponse.json(transformedAd)
  } catch (error) {
    console.error('Error in GET /api/ads/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ad' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      channel,
      image_url,
      company_id,
      rating,
      rating_count,
      description,
      is_active,
      tag_ids,
    } = body

    // Build update object
    const updateData: AdUpdate = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (channel !== undefined) updateData.channel = channel
    if (image_url !== undefined) updateData.image_url = image_url
    if (company_id !== undefined) updateData.company_id = company_id
    if (rating !== undefined) updateData.rating = rating
    if (rating_count !== undefined) updateData.rating_count = rating_count
    if (description !== undefined) updateData.description = description
    if (is_active !== undefined) updateData.is_active = is_active

    const { error: updateError } = await supabase
      .from('ads')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Error updating ad:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Update tag links if provided
    if (tag_ids !== undefined) {
      // Delete existing links
      await supabase.from('ad_tag_links').delete().eq('ad_id', id)

      // Insert new links
      if (tag_ids.length > 0) {
        const tagLinks = tag_ids.map((tag_id: string) => ({
          ad_id: id,
          tag_id,
        }))
        await supabase.from('ad_tag_links').insert(tagLinks)
      }
    }

    // Fetch updated ad
    const { data: ad, error: fetchError } = await supabase
      .from('ads')
      .select(`
        *,
        company:ad_companies(*),
        tags:ad_tag_links(tag:ad_tags(*))
      `)
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Transform tags
    const transformedAd = {
      ...ad,
      tags: ad.tags?.map((t: { tag: unknown }) => t.tag).filter(Boolean) || [],
    }

    return NextResponse.json(transformedAd)
  } catch (error) {
    console.error('Error in PUT /api/ads/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to update ad' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const { error } = await supabase
      .from('ads')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting ad:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/ads/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to delete ad' },
      { status: 500 }
    )
  }
}
