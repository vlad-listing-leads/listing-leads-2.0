import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/supadata'

// GET: List all psychological triggers
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: triggers, error } = await supabase
      .from('psychological_triggers')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching triggers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ triggers })
  } catch (error) {
    console.error('Error in GET /api/youtube/triggers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create a new trigger
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
    const { name, slug: providedSlug, emoji } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const slug = providedSlug || generateSlug(name)

    // Check if trigger already exists
    const { data: existing } = await supabase
      .from('psychological_triggers')
      .select('id')
      .or(`name.eq.${name},slug.eq.${slug}`)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Trigger with this name or slug already exists', existing_id: existing.id },
        { status: 409 }
      )
    }

    const { data: trigger, error } = await supabase
      .from('psychological_triggers')
      .insert({
        name,
        slug,
        emoji: emoji || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating trigger:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ trigger }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/youtube/triggers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Bulk create triggers (for importing from AI suggestions)
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
    const { triggers: triggerNames } = body

    if (!Array.isArray(triggerNames)) {
      return NextResponse.json(
        { error: 'triggers must be an array of names' },
        { status: 400 }
      )
    }

    // Get existing triggers
    const { data: existing } = await supabase
      .from('psychological_triggers')
      .select('name, slug')

    const existingSlugs = new Set(existing?.map(t => t.slug) || [])
    const existingNames = new Set(existing?.map(t => t.name.toLowerCase()) || [])

    // Filter out existing triggers and create new ones
    const newTriggers = triggerNames
      .filter(name => {
        const slug = generateSlug(name)
        return !existingSlugs.has(slug) && !existingNames.has(name.toLowerCase())
      })
      .map(name => ({
        name,
        slug: generateSlug(name),
      }))

    if (newTriggers.length === 0) {
      return NextResponse.json({
        created: [],
        message: 'All triggers already exist',
      })
    }

    const { data: created, error } = await supabase
      .from('psychological_triggers')
      .insert(newTriggers)
      .select()

    if (error) {
      console.error('Error bulk creating triggers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ created })
  } catch (error) {
    console.error('Error in PATCH /api/youtube/triggers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
