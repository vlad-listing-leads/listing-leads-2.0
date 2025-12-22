import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { AIGeneratedFields } from '@/types/youtube'

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
    // Check if user is admin
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

    // Parse request body
    const body = await request.json()
    const { transcript, title, description } = body

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      )
    }

    // Fetch existing triggers and power words for reference
    const [{ data: triggers }, { data: powerWords }] = await Promise.all([
      supabase.from('psychological_triggers').select('name, slug'),
      supabase.from('power_words').select('name, slug'),
    ])

    const triggerNames = triggers?.map(t => t.name) || []
    const powerWordNames = powerWords?.map(p => p.name) || []

    // Limit transcript to avoid token limits (roughly 4 chars per token, ~8k tokens max)
    const truncatedTranscript = transcript.slice(0, 30000)

    const systemPrompt = `You are an expert video content analyst for real estate marketing. Analyze YouTube video transcripts to extract key insights.

You will analyze videos about real estate topics (home buying, selling, living in specific cities, market updates, etc.) and extract:
1. A concise summary (2-3 sentences)
2. The opening hook (first compelling statement/question)
3. A call-to-action suggestion
4. Psychological triggers used (from the provided list or suggest new ones)
5. Power words used (from the provided list or suggest new ones)

EXISTING PSYCHOLOGICAL TRIGGERS (prefer these when applicable):
${triggerNames.length > 0 ? triggerNames.join(', ') : 'None yet - suggest new ones'}

EXISTING POWER WORDS (prefer these when applicable):
${powerWordNames.length > 0 ? powerWordNames.join(', ') : 'None yet - suggest new ones'}

Respond in JSON format only, no markdown code blocks.`

    const userPrompt = `Analyze this real estate video:

TITLE: ${title || 'Unknown'}

DESCRIPTION: ${description || 'No description'}

TRANSCRIPT:
${truncatedTranscript}

Return a JSON object with these fields:
- ai_summary: string (2-3 sentence summary of the video content)
- suggested_hook: string (the opening hook or most compelling statement from the first minute)
- suggested_cta: string (a call-to-action suggestion based on the video content)
- suggested_triggers: string[] (3-5 psychological triggers, prefer existing ones from the list)
- suggested_power_words: string[] (5-10 power words used in the video, prefer existing ones from the list)`

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0]?.message?.content?.trim() || '{}'

    let generatedFields: AIGeneratedFields
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
    const result: AIGeneratedFields = {
      ai_summary: generatedFields.ai_summary || '',
      suggested_hook: generatedFields.suggested_hook || '',
      suggested_cta: generatedFields.suggested_cta || '',
      suggested_triggers: Array.isArray(generatedFields.suggested_triggers)
        ? generatedFields.suggested_triggers
        : [],
      suggested_power_words: Array.isArray(generatedFields.suggested_power_words)
        ? generatedFields.suggested_power_words
        : [],
    }

    // Match suggested triggers/power words to existing ones
    const matchedTriggers = result.suggested_triggers.map(suggestion => {
      const existing = triggers?.find(
        t => t.name.toLowerCase() === suggestion.toLowerCase() ||
            t.slug === suggestion.toLowerCase().replace(/\s+/g, '-')
      )
      return existing ? { name: existing.name, slug: existing.slug, isNew: false } : { name: suggestion, slug: suggestion.toLowerCase().replace(/\s+/g, '-'), isNew: true }
    })

    const matchedPowerWords = result.suggested_power_words.map(suggestion => {
      const existing = powerWords?.find(
        p => p.name.toLowerCase() === suggestion.toLowerCase() ||
            p.slug === suggestion.toLowerCase().replace(/\s+/g, '-')
      )
      return existing ? { name: existing.name, slug: existing.slug, isNew: false } : { name: suggestion, slug: suggestion.toLowerCase().replace(/\s+/g, '-'), isNew: true }
    })

    return NextResponse.json({
      ...result,
      matched_triggers: matchedTriggers,
      matched_power_words: matchedPowerWords,
    })
  } catch (error) {
    console.error('Error generating AI content:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate AI content' },
      { status: 500 }
    )
  }
}
