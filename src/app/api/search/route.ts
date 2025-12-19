import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SearchResult {
  id: string
  name: string
  slug: string
  introduction: string | null
  thumbnail_url: string | null
  category: string
  is_featured: boolean
}

export async function GET(request: NextRequest) {
  // SECURITY: Require authentication for search
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')?.toLowerCase() || ''
  const limit = parseInt(searchParams.get('limit') || '20')

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    // Search all 4 tables in parallel (only active campaigns)
    const [phoneTexts, emails, directMail, social] = await Promise.all([
      supabase
        .from('phone_text_scripts')
        .select('id, name, slug, introduction, thumbnail_url, is_featured')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,introduction.ilike.%${query}%`)
        .limit(limit),
      supabase
        .from('email_campaigns')
        .select('id, name, slug, introduction, thumbnail_url, is_featured')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,introduction.ilike.%${query}%`)
        .limit(limit),
      supabase
        .from('direct_mail_templates')
        .select('id, name, slug, introduction, thumbnail_url, is_featured')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,introduction.ilike.%${query}%`)
        .limit(limit),
      supabase
        .from('social_shareables')
        .select('id, name, slug, introduction, thumbnail_url, is_featured, is_video')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,introduction.ilike.%${query}%`)
        .limit(limit),
    ])

    // Combine and categorize results
    const results: SearchResult[] = []

    if (phoneTexts.data) {
      results.push(
        ...phoneTexts.data.map((item) => ({
          ...item,
          category: 'phone-text-scripts',
        }))
      )
    }

    if (emails.data) {
      results.push(
        ...emails.data.map((item) => ({
          ...item,
          category: 'email',
        }))
      )
    }

    if (directMail.data) {
      results.push(
        ...directMail.data.map((item) => ({
          ...item,
          category: 'direct-mail',
        }))
      )
    }

    if (social.data) {
      results.push(
        ...social.data.map((item) => ({
          ...item,
          category: 'social',
        }))
      )
    }

    // Group by category for display
    const grouped = {
      'phone-text-scripts': results.filter((r) => r.category === 'phone-text-scripts'),
      email: results.filter((r) => r.category === 'email'),
      'direct-mail': results.filter((r) => r.category === 'direct-mail'),
      social: results.filter((r) => r.category === 'social'),
    }

    return NextResponse.json({
      results,
      grouped,
      total: results.length,
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
