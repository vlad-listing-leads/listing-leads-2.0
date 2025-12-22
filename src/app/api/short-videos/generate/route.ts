import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { ShortVideoAIFields } from '@/types/short-video'

// Dev mode bypass for API routes
const DEV_AUTH_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'

// Lazy initialization to avoid build-time errors
let openai: OpenAI | null = null

function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin (skip in dev bypass mode)
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

    // Parse request body
    const body = await request.json()
    const { transcript, title, description } = body

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      )
    }

    // Fetch existing triggers, power words, and categories for reference
    const [{ data: triggers }, { data: powerWords }, { data: categories }] = await Promise.all([
      supabase.from('psychological_triggers').select('name, slug'),
      supabase.from('power_words').select('name, slug'),
      supabase.from('short_video_categories').select('id, name, slug'),
    ])

    const triggerNames = triggers?.map(t => t.name) || []
    const powerWordNames = powerWords?.map(p => p.name) || []
    const categoryNames = categories?.map(c => c.name) || []

    // Limit transcript to avoid token limits
    const truncatedTranscript = transcript.slice(0, 15000) // Shorter for short videos

    const systemPrompt = `You are an expert short-form video content analyst for real estate marketing. Analyze Instagram Reels and TikTok video transcripts to extract key insights.

You will analyze videos about real estate topics (home buying, selling, living in specific cities, market updates, etc.) and extract:
1. A concise summary (1-2 sentences, suitable for short-form content)
2. The opening hook (first compelling statement/question that grabs attention)
3. A call-to-action suggestion (appropriate for social media)
4. Psychological triggers used (from the provided list or suggest new ones)
5. Power words used (from the provided list or suggest new ones)
6. The best matching category for this video (MUST be from the existing categories list)

EXISTING PSYCHOLOGICAL TRIGGERS (prefer these when applicable):
${triggerNames.length > 0 ? triggerNames.join(', ') : 'None yet - suggest new ones'}

EXISTING POWER WORDS (prefer these when applicable):
${powerWordNames.length > 0 ? powerWordNames.join(', ') : 'None yet - suggest new ones'}

EXISTING CATEGORIES (you MUST pick one of these):
${categoryNames.length > 0 ? categoryNames.join(', ') : 'None available'}

Respond in JSON format only, no markdown code blocks.`

    const userPrompt = `Analyze this short-form real estate video:

TITLE: ${title || 'Unknown'}

DESCRIPTION/CAPTION: ${description || 'No description'}

TRANSCRIPT:
${truncatedTranscript}

Return a JSON object with these fields:
- ai_summary: string (1-2 sentence summary of the video content)
- suggested_hook: string (the opening hook or most attention-grabbing statement)
- suggested_cta: string (a call-to-action suggestion for social media)
- suggested_triggers: string[] (2-4 psychological triggers, prefer existing ones from the list)
- suggested_power_words: string[] (3-7 power words used in the video, prefer existing ones from the list)
- suggested_category: string (the EXACT name of the best matching category from the existing categories list)`

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 800,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0]?.message?.content?.trim() || '{}'

    let generatedFields: ShortVideoAIFields
    try {
      generatedFields = JSON.parse(responseText)
    } catch {
      console.error('Failed to parse AI response:', responseText)
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    // Normalize the response
    const result: ShortVideoAIFields = {
      ai_summary: generatedFields.ai_summary || '',
      suggested_hook: generatedFields.suggested_hook || '',
      suggested_cta: generatedFields.suggested_cta || '',
      suggested_triggers: Array.isArray(generatedFields.suggested_triggers)
        ? generatedFields.suggested_triggers
        : [],
      suggested_power_words: Array.isArray(generatedFields.suggested_power_words)
        ? generatedFields.suggested_power_words
        : [],
      suggested_category: generatedFields.suggested_category || '',
    }

    // Match suggested triggers/power words to existing ones
    const matchedTriggers = result.suggested_triggers.map(suggestion => {
      const existing = triggers?.find(
        t => t.name.toLowerCase() === suggestion.toLowerCase() ||
            t.slug === suggestion.toLowerCase().replace(/\s+/g, '-')
      )
      return existing
        ? { name: existing.name, slug: existing.slug, isNew: false }
        : { name: suggestion, slug: suggestion.toLowerCase().replace(/\s+/g, '-'), isNew: true }
    })

    const matchedPowerWords = result.suggested_power_words.map(suggestion => {
      const existing = powerWords?.find(
        p => p.name.toLowerCase() === suggestion.toLowerCase() ||
            p.slug === suggestion.toLowerCase().replace(/\s+/g, '-')
      )
      return existing
        ? { name: existing.name, slug: existing.slug, isNew: false }
        : { name: suggestion, slug: suggestion.toLowerCase().replace(/\s+/g, '-'), isNew: true }
    })

    // Match suggested category to existing one
    const matchedCategory = categories?.find(
      c => c.name.toLowerCase() === result.suggested_category?.toLowerCase() ||
          c.slug === result.suggested_category?.toLowerCase().replace(/\s+/g, '-')
    )

    return NextResponse.json({
      ...result,
      matched_triggers: matchedTriggers,
      matched_power_words: matchedPowerWords,
      matched_category: matchedCategory
        ? { id: matchedCategory.id, name: matchedCategory.name, slug: matchedCategory.slug }
        : null,
    })
  } catch (error) {
    console.error('Error generating AI content:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate AI content' },
      { status: 500 }
    )
  }
}
