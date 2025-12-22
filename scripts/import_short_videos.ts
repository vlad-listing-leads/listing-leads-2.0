/**
 * Import Short Videos from CSV files
 *
 * Usage: npx tsx scripts/import_short_videos.ts
 *
 * CSV Files expected at:
 * - /Users/vlad/Desktop/Reels/Listing Leads - Instagram - Categories.csv
 * - /Users/vlad/Desktop/Reels/Listing Leads - Instagram - Creators.csv
 * - /Users/vlad/Desktop/Reels/Listing Leads - Instagram Reels.csv
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// CSV file paths
const CSV_DIR = '/Users/vlad/Desktop/Reels'
const CATEGORIES_CSV = path.join(CSV_DIR, 'Listing Leads - Instagram - Categories.csv')
const CREATORS_CSV = path.join(CSV_DIR, 'Listing Leads - Instagram - Creators.csv')
const REELS_CSV = path.join(CSV_DIR, 'Listing Leads - Instagram Reels.csv')

// Simple CSV parser that handles quoted fields with commas
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n')
  if (lines.length < 2) return []

  // Parse header
  const headers = parseCSVLine(lines[0])
  const results: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = parseCSVLine(line)
    const record: Record<string, string> = {}

    headers.forEach((header, index) => {
      record[header.trim()] = values[index]?.trim() || ''
    })

    results.push(record)
  }

  return results
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}

// Generate slug from text
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100)
}

// Parse Instagram URL to get reel ID
function parseInstagramId(url: string): string | null {
  // Patterns: /reel/ID/, /p/ID/, /reels/ID/
  const patterns = [
    /instagram\.com\/(?:reel|p|reels)\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/.*\/([A-Za-z0-9_-]+)\/?$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }
  return null
}

// Import categories
async function importCategories(): Promise<Map<string, string>> {
  console.log('\n📁 Importing categories...')
  const slugToId = new Map<string, string>()

  const content = fs.readFileSync(CATEGORIES_CSV, 'utf-8')
  const records = parseCSV(content)

  console.log(`Found ${records.length} categories`)

  for (const record of records) {
    const name = record['Name']
    const slug = record['Slug'] || generateSlug(name)

    if (!name) continue

    const { data, error } = await supabase
      .from('short_video_categories')
      .upsert({ name, slug }, { onConflict: 'slug' })
      .select('id')
      .single()

    if (error) {
      console.error(`  Error inserting category "${name}":`, error.message)
    } else if (data) {
      slugToId.set(slug, data.id)
      console.log(`  ✓ ${name}`)
    }
  }

  console.log(`Imported ${slugToId.size} categories`)
  return slugToId
}

// Import creators
async function importCreators(): Promise<Map<string, string>> {
  console.log('\n👤 Importing creators...')
  const slugToId = new Map<string, string>()

  const content = fs.readFileSync(CREATORS_CSV, 'utf-8')
  const records = parseCSV(content)

  console.log(`Found ${records.length} creators`)

  let imported = 0
  let errors = 0

  for (const record of records) {
    const name = record['Name']
    const slug = record['Slug'] || generateSlug(name)
    const handle = record['Insta handle'] || record['handle'] || ''
    const profileUrl = record['Link'] || ''
    const avatarUrl = record['Thumbnail'] || null
    const location = record['Locaation'] || record['Location'] || null // Note: CSV has typo "Locaation"

    if (!name || !handle) continue

    const { data, error } = await supabase
      .from('short_video_creators')
      .upsert({
        name,
        slug,
        platform: 'instagram',
        handle,
        profile_url: profileUrl || null,
        avatar_url: avatarUrl || null,
        location: location || null,
      }, { onConflict: 'slug' })
      .select('id')
      .single()

    if (error) {
      console.error(`  Error inserting creator "${name}":`, error.message)
      errors++
    } else if (data) {
      slugToId.set(slug, data.id)
      imported++
      if (imported % 50 === 0) {
        console.log(`  Imported ${imported} creators...`)
      }
    }
  }

  console.log(`Imported ${imported} creators (${errors} errors)`)
  return slugToId
}

// Import reels
async function importReels(
  categoryMap: Map<string, string>,
  creatorMap: Map<string, string>
): Promise<void> {
  console.log('\n🎬 Importing reels...')

  const content = fs.readFileSync(REELS_CSV, 'utf-8')
  const records = parseCSV(content)

  console.log(`Found ${records.length} reels`)

  let imported = 0
  let errors = 0
  let skipped = 0

  for (const record of records) {
    const name = record['Name']
    let slug = record['Slug'] || generateSlug(name)
    const sourceUrl = record['URL'] || ''
    const description = record['Details page text'] || null
    const creatorSlug = record['Creator'] || ''
    const categorySlug = record['Categories'] || ''
    const embedCode = record['Reel embed code'] || null
    const datePosted = record['Date posted'] || null

    if (!name || !sourceUrl) {
      skipped++
      continue
    }

    // Get creator and category IDs
    const creatorId = creatorMap.get(creatorSlug) || null
    const categoryId = categoryMap.get(categorySlug) || null

    // Parse source ID from URL
    const sourceId = parseInstagramId(sourceUrl)

    // Parse date
    let parsedDate: string | null = null
    if (datePosted) {
      try {
        const date = new Date(datePosted)
        if (!isNaN(date.getTime())) {
          parsedDate = date.toISOString()
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Ensure slug is unique by checking/modifying
    const existingSlug = await supabase
      .from('short_videos')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingSlug.data) {
      // Slug exists, append source_id or random suffix
      slug = `${slug}-${sourceId || Math.random().toString(36).substring(7)}`
    }

    const { error } = await supabase
      .from('short_videos')
      .insert({
        name,
        slug,
        platform: 'instagram',
        source_url: sourceUrl,
        source_id: sourceId,
        description,
        creator_id: creatorId,
        category_id: categoryId,
        embed_code: embedCode,
        date_posted: parsedDate,
        is_active: true,
        // These will be populated later by batch processing:
        video_url: null,
        cover_url: null,
        transcript: null,
        ai_summary: null,
        hook_text: null,
        cta: null,
      })

    if (error) {
      if (error.code === '23505') {
        // Duplicate key - skip silently
        skipped++
      } else {
        console.error(`  Error inserting reel "${name.substring(0, 50)}...":`, error.message)
        errors++
      }
    } else {
      imported++
      if (imported % 100 === 0) {
        console.log(`  Imported ${imported} reels...`)
      }
    }
  }

  console.log(`\nImport complete:`)
  console.log(`  ✓ Imported: ${imported}`)
  console.log(`  ⚠ Skipped: ${skipped}`)
  console.log(`  ✗ Errors: ${errors}`)
}

// Main function
async function main() {
  console.log('🚀 Starting Short Videos CSV Import')
  console.log('=' .repeat(50))

  // Check files exist
  if (!fs.existsSync(CATEGORIES_CSV)) {
    console.error(`Categories CSV not found: ${CATEGORIES_CSV}`)
    process.exit(1)
  }
  if (!fs.existsSync(CREATORS_CSV)) {
    console.error(`Creators CSV not found: ${CREATORS_CSV}`)
    process.exit(1)
  }
  if (!fs.existsSync(REELS_CSV)) {
    console.error(`Reels CSV not found: ${REELS_CSV}`)
    process.exit(1)
  }

  try {
    // Import in order: categories first, then creators, then reels
    const categoryMap = await importCategories()
    const creatorMap = await importCreators()
    await importReels(categoryMap, creatorMap)

    console.log('\n✅ Import completed successfully!')
  } catch (error) {
    console.error('Import failed:', error)
    process.exit(1)
  }
}

main()
