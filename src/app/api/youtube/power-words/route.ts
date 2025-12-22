import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/supadata'

// GET: List all power words
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: powerWords, error } = await supabase
      .from('power_words')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching power words:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ powerWords })
  } catch (error) {
    console.error('Error in GET /api/youtube/power-words:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create a new power word
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
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
    const { name, slug: providedSlug } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const slug = providedSlug || generateSlug(name)

    // Check if power word already exists
    const { data: existing } = await supabase
      .from('power_words')
      .select('id')
      .or(`name.eq.${name},slug.eq.${slug}`)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Power word with this name or slug already exists', existing_id: existing.id },
        { status: 409 }
      )
    }

    const { data: powerWord, error } = await supabase
      .from('power_words')
      .insert({ name, slug })
      .select()
      .single()

    if (error) {
      console.error('Error creating power word:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ powerWord }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/youtube/power-words:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH: Bulk create power words (for importing from AI suggestions)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
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
    const { powerWords: powerWordNames } = body

    if (!Array.isArray(powerWordNames)) {
      return NextResponse.json(
        { error: 'powerWords must be an array of names' },
        { status: 400 }
      )
    }

    // Get existing power words
    const { data: existing } = await supabase
      .from('power_words')
      .select('name, slug')

    const existingSlugs = new Set(existing?.map(p => p.slug) || [])
    const existingNames = new Set(existing?.map(p => p.name.toLowerCase()) || [])

    // Filter out existing power words and create new ones
    const newPowerWords = powerWordNames
      .filter(name => {
        const slug = generateSlug(name)
        return !existingSlugs.has(slug) && !existingNames.has(name.toLowerCase())
      })
      .map(name => ({
        name,
        slug: generateSlug(name),
      }))

    if (newPowerWords.length === 0) {
      return NextResponse.json({
        created: [],
        message: 'All power words already exist',
      })
    }

    const { data: created, error } = await supabase
      .from('power_words')
      .insert(newPowerWords)
      .select()

    if (error) {
      console.error('Error bulk creating power words:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ created })
  } catch (error) {
    console.error('Error in PATCH /api/youtube/power-words:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
