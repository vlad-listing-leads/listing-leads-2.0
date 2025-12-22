import { NextRequest, NextResponse } from 'next/server'
import { getSupadataClient, parseYouTubeId, generateSlug } from '@/lib/supadata'
import { createClient } from '@/lib/supabase/server'

// Dev mode bypass for API routes
const DEV_AUTH_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'

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
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      )
    }

    // Validate YouTube URL
    const videoId = parseYouTubeId(url)
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      )
    }

    // Check if video already exists
    const { data: existingVideo } = await supabase
      .from('youtube_videos')
      .select('id, name, slug')
      .eq('youtube_id', videoId)
      .single()

    if (existingVideo) {
      return NextResponse.json(
        {
          error: 'Video already exists',
          existing: existingVideo
        },
        { status: 409 }
      )
    }

    // Extract video data from Supadata
    const supadata = getSupadataClient()
    const videoData = await supadata.extractVideoData(url)

    // Generate a slug from the title
    const baseSlug = generateSlug(videoData.title)

    // Check for slug uniqueness and append number if needed
    let slug = baseSlug
    let slugCounter = 1
    while (true) {
      const { data: existingSlug } = await supabase
        .from('youtube_videos')
        .select('id')
        .eq('slug', slug)
        .single()

      if (!existingSlug) break
      slugCounter++
      slug = `${baseSlug}-${slugCounter}`
    }

    // Check if creator exists, prepare data for auto-creation if not
    let creatorData = null
    if (videoData.channel) {
      const { data: existingCreator } = await supabase
        .from('video_creators')
        .select('id, name')
        .eq('channel_id', videoData.channel.id)
        .single()

      if (existingCreator) {
        creatorData = {
          existing: true,
          id: existingCreator.id,
          name: existingCreator.name,
        }
      } else {
        creatorData = {
          existing: false,
          channel_id: videoData.channel.id,
          name: videoData.channel.name,
          channel_url: `https://www.youtube.com/channel/${videoData.channel.id}`,
        }
      }
    }

    return NextResponse.json({
      youtube_id: videoData.youtube_id,
      title: videoData.title,
      description: videoData.description,
      duration: videoData.duration,
      thumbnail: videoData.thumbnail,
      uploadDate: videoData.uploadDate,
      viewCount: videoData.viewCount,
      transcript: videoData.transcript,
      slug,
      creator: creatorData,
    })
  } catch (error) {
    console.error('Error extracting YouTube data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract video data' },
      { status: 500 }
    )
  }
}
