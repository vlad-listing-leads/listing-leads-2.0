#!/usr/bin/env npx tsx
/**
 * Sync Ad Images to ImageKit
 *
 * Downloads ad images from their current URLs (website-files.com)
 * and uploads them to ImageKit, then updates the database.
 *
 * Usage:
 *   npx tsx scripts/sync_ads_to_imagekit.ts [options]
 *
 * Options:
 *   --limit=N       Process only N ads (default: 50)
 *   --delay=MS      Delay between uploads in ms (default: 500)
 *   --dry-run       Don't update database, just log what would happen
 *   --company-icons Also sync company icons
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
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

const LIMIT = parseInt(getArg('limit', '50'))
const DELAY_MS = parseInt(getArg('delay', '500'))
const DRY_RUN = hasFlag('dry-run')
const SYNC_COMPANY_ICONS = hasFlag('company-icons')

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
let stats = {
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

function extractFileName(url: string, id: string): string {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const originalName = pathParts[pathParts.length - 1]
    // Decode URL encoding and clean up the filename
    const decodedName = decodeURIComponent(originalName)
    // Remove any problematic characters
    const cleanName = decodedName.replace(/[%\s]/g, '_')
    // If name is too long or weird, use ID
    if (cleanName.length > 100 || !cleanName.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
      const ext = url.match(/\.(png|jpg|jpeg|gif|webp)/i)?.[0] || '.jpg'
      return `ad_${id}${ext}`
    }
    return cleanName
  } catch {
    return `ad_${id}.jpg`
  }
}

async function syncAdImages() {
  console.log('\n📢 Syncing Ad Images to ImageKit...')

  // Fetch ads that need syncing (have website-files.com URLs)
  const { data: ads, error } = await supabase
    .from('ads')
    .select('id, name, image_url')
    .like('image_url', '%website-files.com%')
    .limit(LIMIT)

  if (error) {
    console.error('❌ Failed to fetch ads:', error.message)
    return
  }

  if (!ads || ads.length === 0) {
    console.log('✅ No ads need syncing!')
    return
  }

  console.log(`📋 Found ${ads.length} ads to sync\n`)

  for (let i = 0; i < ads.length; i++) {
    const ad = ads[i]
    stats.processed++

    console.log(`[${i + 1}/${ads.length}] ${ad.name?.slice(0, 50)}...`)

    if (!ad.image_url) {
      console.log('    ⏭️  No image URL, skipping')
      stats.skipped++
      continue
    }

    // Download image
    console.log('    📥 Downloading...')
    const buffer = await downloadImage(ad.image_url)

    if (!buffer) {
      console.log('    ❌ Failed to download')
      stats.failed++
      continue
    }

    // Generate filename
    const fileName = extractFileName(ad.image_url, ad.id)

    // Upload to ImageKit
    console.log(`    📤 Uploading as ${fileName}...`)

    if (DRY_RUN) {
      console.log('    🔍 [DRY RUN] Would upload to /ads/' + fileName)
      stats.uploaded++
      continue
    }

    const newUrl = await uploadToImageKit(buffer, fileName, '/ads')

    if (!newUrl) {
      console.log('    ❌ Failed to upload')
      stats.failed++
      continue
    }

    // Update database
    console.log(`    💾 Updating database...`)
    const { error: updateError } = await supabase
      .from('ads')
      .update({ image_url: newUrl, updated_at: new Date().toISOString() })
      .eq('id', ad.id)

    if (updateError) {
      console.log(`    ❌ Failed to update: ${updateError.message}`)
      stats.failed++
      continue
    }

    console.log(`    ✅ Done: ${newUrl}`)
    stats.uploaded++

    // Delay between uploads
    if (i < ads.length - 1) {
      await sleep(DELAY_MS)
    }
  }
}

async function syncCompanyIcons() {
  console.log('\n🏢 Syncing Company Icons to ImageKit...')

  // Fetch companies that need syncing
  const { data: companies, error } = await supabase
    .from('ad_companies')
    .select('id, name, icon_url')
    .like('icon_url', '%website-files.com%')
    .limit(LIMIT)

  if (error) {
    console.error('❌ Failed to fetch companies:', error.message)
    return
  }

  if (!companies || companies.length === 0) {
    console.log('✅ No company icons need syncing!')
    return
  }

  console.log(`📋 Found ${companies.length} company icons to sync\n`)

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i]

    console.log(`[${i + 1}/${companies.length}] ${company.name}`)

    if (!company.icon_url) {
      console.log('    ⏭️  No icon URL, skipping')
      continue
    }

    // Download image
    console.log('    📥 Downloading...')
    const buffer = await downloadImage(company.icon_url)

    if (!buffer) {
      console.log('    ❌ Failed to download')
      continue
    }

    // Generate filename
    const ext = company.icon_url.match(/\.(png|jpg|jpeg|gif|webp)/i)?.[0] || '.png'
    const fileName = `${company.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}${ext}`

    // Upload to ImageKit
    console.log(`    📤 Uploading as ${fileName}...`)

    if (DRY_RUN) {
      console.log('    🔍 [DRY RUN] Would upload to /ads/companies/' + fileName)
      continue
    }

    const newUrl = await uploadToImageKit(buffer, fileName, '/ads/companies')

    if (!newUrl) {
      console.log('    ❌ Failed to upload')
      continue
    }

    // Update database
    console.log(`    💾 Updating database...`)
    const { error: updateError } = await supabase
      .from('ad_companies')
      .update({ icon_url: newUrl })
      .eq('id', company.id)

    if (updateError) {
      console.log(`    ❌ Failed to update: ${updateError.message}`)
      continue
    }

    console.log(`    ✅ Done: ${newUrl}`)

    // Delay between uploads
    if (i < companies.length - 1) {
      await sleep(DELAY_MS)
    }
  }
}

async function main() {
  console.log('\n🖼️  Ad Image Sync to ImageKit')
  console.log('==============================')
  console.log(`Settings: limit=${LIMIT}, delay=${DELAY_MS}ms, dry-run=${DRY_RUN}, company-icons=${SYNC_COMPANY_ICONS}`)

  if (SYNC_COMPANY_ICONS) {
    await syncCompanyIcons()
  }

  await syncAdImages()

  console.log('\n==============================')
  console.log('📊 Summary:')
  console.log(`  Processed: ${stats.processed}`)
  console.log(`  Uploaded: ${stats.uploaded}`)
  console.log(`  Skipped: ${stats.skipped}`)
  console.log(`  Failed: ${stats.failed}`)
  console.log('==============================\n')
}

main().catch(console.error)
