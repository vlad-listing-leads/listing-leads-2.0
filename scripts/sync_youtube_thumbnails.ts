#!/usr/bin/env npx tsx
/**
 * Sync YouTube Thumbnails to ImageKit
 *
 * Downloads YouTube video thumbnails from youtube.com/ytimg.com
 * and uploads them to ImageKit, then updates the database.
 *
 * Usage:
 *   npx tsx scripts/sync_youtube_thumbnails.ts [options]
 *
 * Options:
 *   --limit=N       Process only N videos (default: all)
 *   --delay=MS      Delay between uploads in ms (default: 300)
 *   --dry-run       Don't update database, just log what would happen
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import ImageKit from 'imagekit'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// Parse CLI arguments
const args = process.argv.slice(2)
const getArg = (name: string, defaultValue: string) => {
  const arg = args.find(a => a.startsWith(`--${name}=`))
  return arg ? arg.split('=')[1] : defaultValue
}
const hasFlag = (name: string) => args.includes(`--${name}`)

const LIMIT = getArg('limit', '0') // 0 = no limit
const DELAY_MS = parseInt(getArg('delay', '300'))
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

// Stats tracking
const stats = {
  processed: 0,
  uploaded: 0,
  skipped: 0,
  failed: 0,
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`    Failed to download: ${response.status}`)
      return null
    }
    return Buffer.from(await response.arrayBuffer())
  } catch (error) {
    console.error(`    Download error:`, error)
    return null
  }
}

async function uploadToImageKit(
  buffer: Buffer,
  fileName: string,
  folder: string
): Promise<string | null> {
  try {
    const result = await imagekit.upload({
      file: buffer,
      fileName,
      folder,
    })
    return result.url
  } catch (error) {
    console.error(`    Upload error:`, error)
    return null
  }
}

function extractYouTubeVideoId(url: string): string | null {
  // Extract video ID from various YouTube thumbnail URL formats
  // https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg
  // https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg
  const match = url.match(/\/vi\/([^/]+)\//)
  return match ? match[1] : null
}

async function syncYouTubeThumbnails() {
  console.log('\n🎬 Syncing YouTube Thumbnails to ImageKit...')

  // Build query
  let query = supabase
    .from('youtube_videos')
    .select('id, name, thumbnail_url, slug')
    .or('thumbnail_url.like.%youtube.com%,thumbnail_url.like.%ytimg.com%')
    .order('name')

  if (LIMIT !== '0') {
    query = query.limit(parseInt(LIMIT))
  }

  const { data: videos, error } = await query

  if (error) {
    console.error('❌ Failed to fetch videos:', error.message)
    return
  }

  if (!videos || videos.length === 0) {
    console.log('✅ No YouTube thumbnails need syncing!')
    return
  }

  console.log(`📋 Found ${videos.length} videos to sync\n`)

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i]
    stats.processed++

    const displayName = video.name?.slice(0, 50) || video.slug || video.id
    console.log(`[${i + 1}/${videos.length}] ${displayName}...`)

    if (!video.thumbnail_url) {
      console.log('    ⏭️  No thumbnail URL, skipping')
      stats.skipped++
      continue
    }

    // Check if already on ImageKit
    if (video.thumbnail_url.includes('imagekit.io')) {
      console.log('    ⏭️  Already on ImageKit, skipping')
      stats.skipped++
      continue
    }

    // Extract YouTube video ID for filename
    const youtubeId = extractYouTubeVideoId(video.thumbnail_url)
    if (!youtubeId) {
      console.log('    ⚠️  Could not extract YouTube ID, using UUID')
    }

    // Download thumbnail
    console.log(`    📥 Downloading from ${video.thumbnail_url.slice(0, 60)}...`)
    const buffer = await downloadImage(video.thumbnail_url)

    if (!buffer) {
      console.log('    ❌ Failed to download')
      stats.failed++
      continue
    }

    // Generate filename
    const fileName = youtubeId
      ? `${youtubeId}.jpg`
      : `${video.slug || video.id}.jpg`

    // Upload to ImageKit
    console.log(`    📤 Uploading as ${fileName}...`)

    if (DRY_RUN) {
      console.log('    🔍 [DRY RUN] Would upload to /youtube-thumbnails/' + fileName)
      stats.uploaded++
      continue
    }

    const newUrl = await uploadToImageKit(buffer, fileName, '/youtube-thumbnails')

    if (!newUrl) {
      console.log('    ❌ Failed to upload')
      stats.failed++
      continue
    }

    // Update database
    console.log(`    💾 Updating database...`)
    const { error: updateError } = await supabase
      .from('youtube_videos')
      .update({ thumbnail_url: newUrl, updated_at: new Date().toISOString() })
      .eq('id', video.id)

    if (updateError) {
      console.log(`    ❌ Failed to update: ${updateError.message}`)
      stats.failed++
      continue
    }

    console.log(`    ✅ Done: ${newUrl}`)
    stats.uploaded++

    // Delay between uploads
    if (i < videos.length - 1) {
      await sleep(DELAY_MS)
    }
  }
}

async function main() {
  console.log('\n🖼️  YouTube Thumbnail Sync to ImageKit')
  console.log('======================================')
  console.log(`Settings: limit=${LIMIT || 'all'}, delay=${DELAY_MS}ms, dry-run=${DRY_RUN}`)

  await syncYouTubeThumbnails()

  console.log('\n======================================')
  console.log('📊 Summary:')
  console.log(`  Processed: ${stats.processed}`)
  console.log(`  Uploaded: ${stats.uploaded}`)
  console.log(`  Skipped: ${stats.skipped}`)
  console.log(`  Failed: ${stats.failed}`)
  console.log('======================================\n')
}

main().catch(console.error)
