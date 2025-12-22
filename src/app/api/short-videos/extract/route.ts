import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  extractAndUploadVideo,
  quickExtractMetadata,
  detectPlatform,
} from '@/lib/video-extractor'
import { transcribeFromUrl } from '@/lib/whisper'
import { uploadShortVideoCover } from '@/lib/imagekit'

// Dev mode bypass for API routes
const DEV_AUTH_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'

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
    const { url, mode = 'full' } = body

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL
    const platform = detectPlatform(url)
    if (!url.includes('instagram.com') && !url.includes('tiktok.com')) {
      return NextResponse.json(
        { error: 'Only Instagram and TikTok URLs are supported' },
        { status: 400 }
      )
    }

    // Quick mode: extract metadata and upload thumbnail to ImageKit
    if (mode === 'quick') {
      const metadata = await quickExtractMetadata(url)

      // Upload thumbnail to ImageKit if available
      let thumbnailUrl = metadata.thumbnail
      if (thumbnailUrl && metadata.sourceId) {
        console.log('Uploading thumbnail to ImageKit...')
        thumbnailUrl = await uploadShortVideoCover(
          thumbnailUrl,
          metadata.platform,
          metadata.sourceId
        )
        console.log('Thumbnail uploaded:', thumbnailUrl)
      }

      return NextResponse.json({
        platform: metadata.platform,
        source_id: metadata.sourceId,
        title: metadata.title,
        description: metadata.description,
        duration: metadata.duration,
        thumbnail: thumbnailUrl,
        creator: metadata.creator,
        date_posted: metadata.datePosted,
      })
    }

    // Full mode: download video, upload to ImageKit, and optionally transcribe
    console.log(`Extracting video from ${platform}: ${url}`)

    // Extract and upload video
    const extractedData = await extractAndUploadVideo(url)

    // Generate transcript if video was uploaded
    let transcript: string | null = null
    if (extractedData.video_url && body.generateTranscript !== false) {
      try {
        console.log('Generating transcript with Whisper...')
        transcript = await transcribeFromUrl(extractedData.video_url)
        extractedData.transcript = transcript
      } catch (error) {
        console.error('Failed to generate transcript:', error)
        // Don't fail the whole request if transcription fails
      }
    }

    // Check if creator exists, if not return creator data for potential creation
    let existingCreator = null
    if (extractedData.creator?.handle) {
      const { data } = await supabase
        .from('short_video_creators')
        .select('*')
        .eq('handle', extractedData.creator.handle)
        .single()

      existingCreator = data
    }

    return NextResponse.json({
      ...extractedData,
      existing_creator: existingCreator,
    })
  } catch (error) {
    console.error('Error extracting video:', error)
    const message = error instanceof Error ? error.message : 'Failed to extract video'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
