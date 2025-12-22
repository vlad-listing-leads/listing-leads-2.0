#!/usr/bin/env npx tsx
/**
 * Batch Process Short Videos
 *
 * This script processes short videos that were imported without media:
 * 1. Downloads video + thumbnail via yt-dlp
 * 2. Uploads to ImageKit
 * 3. Generates transcript via Whisper
 * 4. Generates AI content via OpenAI
 * 5. Updates the database
 *
 * Usage:
 *   npx tsx scripts/process_short_videos.ts [options]
 *
 * Options:
 *   --limit=N       Process only N videos (default: 10)
 *   --delay=MS      Delay between videos in ms (default: 5000)
 *   --skip-media    Skip video/cover download, only do AI generation
 *   --skip-ai       Skip AI generation, only do media download
 *   --dry-run       Don't update database, just log what would happen
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'
import { createClient } from '@supabase/supabase-js'
import ImageKit from 'imagekit'
import OpenAI from 'openai'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const execAsync = promisify(exec)

// Parse CLI arguments
const args = process.argv.slice(2)
const getArg = (name: string, defaultValue: string) => {
  const arg = args.find(a => a.startsWith(`--${name}=`))
  return arg ? arg.split('=')[1] : defaultValue
}
const hasFlag = (name: string) => args.includes(`--${name}`)

const LIMIT = parseInt(getArg('limit', '500'))
const DELAY_MS = parseInt(getArg('delay', '30000'))
const SKIP_MEDIA = hasFlag('skip-media')
const SKIP_AI = hasFlag('skip-ai')
const DRY_RUN = hasFlag('dry-run')

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Stats tracking
let stats = {
  processed: 0,
  success: 0,
  failed: 0,
  skipped: 0,
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function downloadVideo(url: string, outputPath: string): Promise<void> {
  // Use cookies from Chrome for Instagram authentication
  const tempPath = outputPath.replace('.mp4', '_temp.mp4')
  await execAsync(
    `yt-dlp --cookies-from-browser chrome -f "best[ext=mp4]/best" -o "${tempPath}" "${url}"`,
    { maxBuffer: 100 * 1024 * 1024, timeout: 300000 }
  )

  // Re-encode with faststart for streaming (moves moov atom to start)
  try {
    await execAsync(
      `ffmpeg -i "${tempPath}" -c copy -movflags +faststart "${outputPath}" -y`,
      { maxBuffer: 100 * 1024 * 1024, timeout: 120000 }
    )
    // Remove temp file
    fs.unlinkSync(tempPath)
  } catch {
    // If ffmpeg fails, just use the original file
    fs.renameSync(tempPath, outputPath)
  }
}

async function downloadThumbnail(url: string, outputDir: string): Promise<string | null> {
  try {
    await execAsync(
      `yt-dlp --cookies-from-browser chrome --write-thumbnail --skip-download --convert-thumbnails jpg -o "${outputDir}/thumb" "${url}"`,
      { maxBuffer: 10 * 1024 * 1024, timeout: 60000 }
    )
    // Find the thumbnail file
    const files = fs.readdirSync(outputDir).filter(f => f.startsWith('thumb') && (f.endsWith('.jpg') || f.endsWith('.webp')))
    return files.length > 0 ? path.join(outputDir, files[0]) : null
  } catch {
    return null
  }
}

async function uploadToImageKit(filePath: string, fileName: string, folder: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath)
  const result = await imagekit.upload({
    file: fileBuffer,
    fileName,
    folder,
  })
  return result.url
}

async function checkVideoHasAudio(videoPath: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "${videoPath}"`,
      { timeout: 30000 }
    )
    return stdout.trim().includes('audio')
  } catch {
    return false
  }
}

async function transcribeVideo(videoPath: string): Promise<string | null> {
  // Check if video has audio first
  const hasAudio = await checkVideoHasAudio(videoPath)
  if (!hasAudio) {
    console.log(`  ⚠️  Video has no audio track, skipping transcription`)
    return null
  }

  // Extract and compress audio to stay under Whisper's 25MB limit
  const audioPath = videoPath.replace(/\.[^.]+$/, '_audio.mp3')

  try {
    // Extract audio as compressed MP3 (much smaller than video)
    await execAsync(
      `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -ab 64k -ar 16000 -ac 1 "${audioPath}" -y`,
      { timeout: 60000 }
    )

    // Check file size (25MB = 26214400 bytes)
    const audioStats = fs.statSync(audioPath)
    if (audioStats.size > 25 * 1024 * 1024) {
      // If still too large, use even lower bitrate
      await execAsync(
        `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -ab 32k -ar 16000 -ac 1 "${audioPath}" -y`,
        { timeout: 60000 }
      )
    }

    const file = fs.createReadStream(audioPath)
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      response_format: 'text',
    })

    // Clean up audio file
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath)
    }

    return transcription
  } catch (error) {
    // Clean up on error
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath)
    }
    throw error
  }
}

async function generateAIContent(transcript: string, title: string, description: string | null): Promise<{
  ai_summary: string
  hook_text: string
  cta: string
  trigger_ids: string[]
  power_word_ids: string[]
  category_id: string | null
}> {
  // Fetch existing data
  const [{ data: triggers }, { data: powerWords }, { data: categories }] = await Promise.all([
    supabase.from('psychological_triggers').select('id, name, slug'),
    supabase.from('power_words').select('id, name, slug'),
    supabase.from('short_video_categories').select('id, name, slug'),
  ])

  const triggerNames = triggers?.map(t => t.name) || []
  const powerWordNames = powerWords?.map(p => p.name) || []
  const categoryNames = categories?.map(c => c.name) || []

  const systemPrompt = `You are an expert short-form video content analyst for real estate marketing. Analyze Instagram Reels and TikTok video transcripts to extract key insights.

You will analyze videos about real estate topics and extract:
1. A concise summary (1-2 sentences)
2. The opening hook (first compelling statement)
3. A call-to-action suggestion
4. Psychological triggers used (from the provided list)
5. Power words used (from the provided list)
6. The best matching category

EXISTING PSYCHOLOGICAL TRIGGERS: ${triggerNames.join(', ')}
EXISTING POWER WORDS: ${powerWordNames.join(', ')}
EXISTING CATEGORIES: ${categoryNames.join(', ')}

Respond in JSON format only.`

  const userPrompt = `Analyze this short-form real estate video:

TITLE: ${title || 'Unknown'}
DESCRIPTION: ${description || 'No description'}
TRANSCRIPT: ${transcript.slice(0, 15000)}

Return JSON with:
- ai_summary: string
- suggested_hook: string
- suggested_cta: string
- suggested_triggers: string[] (from existing list)
- suggested_power_words: string[] (from existing list)
- suggested_category: string (exact name from existing list)`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 800,
    temperature: 0.7,
    response_format: { type: 'json_object' },
  })

  const response = JSON.parse(completion.choices[0]?.message?.content || '{}')

  // Match to existing IDs
  const matchedTriggerIds = (response.suggested_triggers || [])
    .map((name: string) => triggers?.find(t =>
      t.name.toLowerCase() === name.toLowerCase()
    )?.id)
    .filter(Boolean)

  const matchedPowerWordIds = (response.suggested_power_words || [])
    .map((name: string) => powerWords?.find(p =>
      p.name.toLowerCase() === name.toLowerCase()
    )?.id)
    .filter(Boolean)

  const matchedCategory = categories?.find(c =>
    c.name.toLowerCase() === response.suggested_category?.toLowerCase()
  )

  return {
    ai_summary: response.ai_summary || '',
    hook_text: response.suggested_hook || '',
    cta: response.suggested_cta || '',
    trigger_ids: matchedTriggerIds,
    power_word_ids: matchedPowerWordIds,
    category_id: matchedCategory?.id || null,
  }
}

async function processVideo(video: {
  id: string
  name: string
  source_url: string
  source_id: string | null
  description: string | null
  platform: string
  video_url: string | null
  transcript: string | null
}): Promise<boolean> {
  const tempDir = path.join(os.tmpdir(), `short-video-${video.id}`)
  fs.mkdirSync(tempDir, { recursive: true })

  const sourceId = video.source_id || `${video.platform}_${Date.now()}`
  const videoPath = path.join(tempDir, `${sourceId}.mp4`)

  try {
    let videoUrl = video.video_url
    let coverUrl: string | null = null
    let transcript = video.transcript

    // Step 1: Download and upload media
    if (!SKIP_MEDIA && !videoUrl) {
      console.log(`  📥 Downloading video...`)
      await downloadVideo(video.source_url, videoPath)

      console.log(`  📤 Uploading video to ImageKit...`)
      videoUrl = await uploadToImageKit(
        videoPath,
        `${video.platform}_${sourceId}.mp4`,
        '/short-videos/videos'
      )

      console.log(`  🖼️  Downloading thumbnail...`)
      const thumbPath = await downloadThumbnail(video.source_url, tempDir)
      if (thumbPath) {
        console.log(`  📤 Uploading cover to ImageKit...`)
        coverUrl = await uploadToImageKit(
          thumbPath,
          `${video.platform}_${sourceId}.jpg`,
          '/short-videos/covers'
        )
      }
    }

    // Step 2: Generate transcript (may be null if video has no audio)
    if (!SKIP_AI && videoUrl && !transcript) {
      console.log(`  🎤 Generating transcript with Whisper...`)

      // Download video from ImageKit if we don't have local copy
      if (!fs.existsSync(videoPath)) {
        const response = await fetch(videoUrl)
        const buffer = Buffer.from(await response.arrayBuffer())
        fs.writeFileSync(videoPath, buffer)
      }

      const newTranscript = await transcribeVideo(videoPath)
      if (newTranscript) {
        transcript = newTranscript
      }
    }

    // Step 3: Generate AI content (only if we have a transcript)
    let aiContent: Awaited<ReturnType<typeof generateAIContent>> | null = null
    if (!SKIP_AI && transcript) {
      console.log(`  🤖 Generating AI content...`)
      aiContent = await generateAIContent(transcript, video.name, video.description)
    } else if (!SKIP_AI && !transcript && videoUrl) {
      console.log(`  ⚠️  No transcript available, skipping AI content generation`)
    }

    // Step 4: Update database
    if (!DRY_RUN) {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      if (videoUrl && !video.video_url) updateData.video_url = videoUrl
      if (coverUrl) updateData.cover_url = coverUrl
      if (transcript && !video.transcript) updateData.transcript = transcript
      if (aiContent) {
        if (aiContent.ai_summary) updateData.ai_summary = aiContent.ai_summary
        if (aiContent.hook_text) updateData.hook_text = aiContent.hook_text
        if (aiContent.cta) updateData.cta = aiContent.cta
        if (aiContent.category_id) updateData.category_id = aiContent.category_id
      }

      console.log(`  💾 Updating database...`)
      const { error } = await supabase
        .from('short_videos')
        .update(updateData)
        .eq('id', video.id)

      if (error) throw error

      // Update trigger associations
      if (aiContent?.trigger_ids?.length) {
        await supabase.from('short_video_triggers').delete().eq('video_id', video.id)
        await supabase.from('short_video_triggers').insert(
          aiContent.trigger_ids.map(trigger_id => ({ video_id: video.id, trigger_id }))
        )
      }

      // Update power word associations
      if (aiContent?.power_word_ids?.length) {
        await supabase.from('short_video_power_words').delete().eq('video_id', video.id)
        await supabase.from('short_video_power_words').insert(
          aiContent.power_word_ids.map(power_word_id => ({ video_id: video.id, power_word_id }))
        )
      }
    } else {
      console.log(`  🔍 [DRY RUN] Would update: video_url=${!!videoUrl}, cover_url=${!!coverUrl}, transcript=${!!transcript}, ai=${!!aiContent}`)
    }

    return true
  } finally {
    // Cleanup temp directory
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

async function main() {
  console.log('\n🎬 Short Video Batch Processor')
  console.log('================================')
  console.log(`Settings: limit=${LIMIT}, delay=${DELAY_MS}ms, skip-media=${SKIP_MEDIA}, skip-ai=${SKIP_AI}, dry-run=${DRY_RUN}`)
  console.log('')

  // Fetch videos that need processing
  let query = supabase
    .from('short_videos')
    .select('id, name, source_url, source_id, description, platform, video_url, transcript')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(LIMIT * 2) // Fetch extra to account for filtered out image posts

  if (!SKIP_MEDIA) {
    query = query.is('video_url', null)
  } else if (!SKIP_AI) {
    query = query.is('ai_summary', null)
  }

  const { data: allVideos, error } = await query

  // Filter out image posts (URLs with ?img_index=) - these are carousel images, not videos
  const videos = allVideos?.filter(v => !v.source_url.includes('img_index=')).slice(0, LIMIT) || []
  const skippedImagePosts = (allVideos?.length || 0) - videos.length
  if (skippedImagePosts > 0) {
    console.log(`⏭️  Skipped ${skippedImagePosts} image carousel posts (not videos)\n`)
  }

  if (error) {
    console.error('❌ Failed to fetch videos:', error.message)
    process.exit(1)
  }

  if (!videos || videos.length === 0) {
    console.log('✅ No videos to process!')
    process.exit(0)
  }

  console.log(`📋 Found ${videos.length} videos to process\n`)

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i]
    stats.processed++

    console.log(`[${i + 1}/${videos.length}] Processing: ${video.name?.slice(0, 50)}...`)
    console.log(`  🔗 ${video.source_url}`)

    try {
      const success = await processVideo(video)
      if (success) {
        stats.success++
        console.log(`  ✅ Success!\n`)
      } else {
        stats.skipped++
        console.log(`  ⏭️  Skipped\n`)
      }
    } catch (error) {
      stats.failed++
      console.error(`  ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`)
    }

    // Delay between videos to avoid rate limits
    if (i < videos.length - 1) {
      console.log(`  ⏳ Waiting ${DELAY_MS / 1000}s before next video...`)
      await sleep(DELAY_MS)
    }
  }

  console.log('\n================================')
  console.log('📊 Summary:')
  console.log(`  Processed: ${stats.processed}`)
  console.log(`  Success: ${stats.success}`)
  console.log(`  Failed: ${stats.failed}`)
  console.log(`  Skipped: ${stats.skipped}`)
  console.log('================================\n')
}

main().catch(console.error)
