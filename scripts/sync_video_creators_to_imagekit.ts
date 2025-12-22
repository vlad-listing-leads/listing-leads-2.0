#!/usr/bin/env npx tsx
/**
 * Sync Video Creator Images to ImageKit
 *
 * Downloads video creator profile images from external URLs
 * and uploads them to ImageKit, then updates the database.
 *
 * Usage:
 *   npx tsx scripts/sync_video_creators_to_imagekit.ts [options]
 *
 * Options:
 *   --limit=N       Process only N creators (default: all)
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

function generateFileName(name: string, id: string): string {
  // Create a clean filename from the creator name
  const cleanName = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 50)

  // Use ID suffix for uniqueness
  return `${cleanName}_${id.substring(0, 8)}.jpg`
}

async function syncVideoCreatorImages() {
  console.log('\n🎬 Syncing Video Creator Images to ImageKit...')

  // Build query - get creators with external image URLs
  let query = supabase
    .from('video_creators')
    .select('id, name, image_url')
    .not('image_url', 'is', null)
    .not('image_url', 'like', '%imagekit.io%')
    .order('name')

  if (LIMIT !== '0') {
    query = query.limit(parseInt(LIMIT))
  }

  const { data: creators, error } = await query

  if (error) {
    console.error('Failed to fetch creators:', error.message)
    return
  }

  if (!creators || creators.length === 0) {
    console.log('No video creator images need syncing!')
    return
  }

  console.log(`Found ${creators.length} creators to sync\n`)

  for (let i = 0; i < creators.length; i++) {
    const creator = creators[i]
    stats.processed++

    const displayName = creator.name?.slice(0, 50) || creator.id
    console.log(`[${i + 1}/${creators.length}] ${displayName}`)

    if (!creator.image_url) {
      console.log('    No image URL, skipping')
      stats.skipped++
      continue
    }

    // Check if already on ImageKit
    if (creator.image_url.includes('imagekit.io')) {
      console.log('    Already on ImageKit, skipping')
      stats.skipped++
      continue
    }

    // Download image
    console.log(`    Downloading from ${creator.image_url.slice(0, 60)}...`)
    const buffer = await downloadImage(creator.image_url)

    if (!buffer) {
      console.log('    Failed to download')
      stats.failed++
      continue
    }

    // Generate filename
    const fileName = generateFileName(creator.name || 'creator', creator.id)

    // Upload to ImageKit
    console.log(`    Uploading as ${fileName}...`)

    if (DRY_RUN) {
      console.log('    [DRY RUN] Would upload to /video-creators/' + fileName)
      stats.uploaded++
      continue
    }

    const newUrl = await uploadToImageKit(buffer, fileName, '/video-creators')

    if (!newUrl) {
      console.log('    Failed to upload')
      stats.failed++
      continue
    }

    // Update database
    console.log(`    Updating database...`)
    const { error: updateError } = await supabase
      .from('video_creators')
      .update({ image_url: newUrl })
      .eq('id', creator.id)

    if (updateError) {
      console.log(`    Failed to update: ${updateError.message}`)
      stats.failed++
      continue
    }

    console.log(`    Done: ${newUrl}`)
    stats.uploaded++

    // Delay between uploads
    if (i < creators.length - 1) {
      await sleep(DELAY_MS)
    }
  }
}

async function main() {
  console.log('\n Video Creator Image Sync to ImageKit')
  console.log('======================================')
  console.log(`Settings: limit=${LIMIT || 'all'}, delay=${DELAY_MS}ms, dry-run=${DRY_RUN}`)

  await syncVideoCreatorImages()

  console.log('\n======================================')
  console.log('Summary:')
  console.log(`  Processed: ${stats.processed}`)
  console.log(`  Uploaded: ${stats.uploaded}`)
  console.log(`  Skipped: ${stats.skipped}`)
  console.log(`  Failed: ${stats.failed}`)
  console.log('======================================\n')
}

main().catch(console.error)
