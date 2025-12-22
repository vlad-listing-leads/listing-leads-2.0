import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Parse CSV - handles quoted fields with commas
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n')
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0])
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = parseCSVLine(line)
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header.trim()] = (values[index] || '').trim()
    })
    rows.push(row)
  }

  return rows
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
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

// Parse video runtime like "6:22" or "14:11" to seconds
function parseRuntime(runtime: string): number {
  if (!runtime) return 0
  const parts = runtime.split(':').map(p => parseInt(p) || 0)
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  return 0
}

// Generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100)
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const basePath = '/Users/vlad/Desktop/videos'

  // 1. Import Categories
  console.log('Importing categories...')
  const categoriesCSV = fs.readFileSync(path.join(basePath, 'Listing Leads - Videos - Categories.csv'), 'utf-8')
  const categoriesData = parseCSV(categoriesCSV)

  const categoryMap = new Map<string, string>() // slug -> id

  for (const row of categoriesData) {
    const name = row['Name']?.trim()
    const slug = row['Slug']?.trim()
    if (!name || !slug) continue

    const { data, error } = await supabase
      .from('video_categories')
      .upsert({ name, slug }, { onConflict: 'slug' })
      .select('id')
      .single()

    if (error) {
      console.error(`Error inserting category ${name}:`, error.message)
    } else if (data) {
      categoryMap.set(slug, data.id)
    }
  }
  console.log(`Imported ${categoryMap.size} categories`)

  // 2. Import Psychological Triggers
  console.log('Importing psychological triggers...')
  const triggersCSV = fs.readFileSync(path.join(basePath, 'Listing Leads - Videos - Psychological triggers.csv'), 'utf-8')
  const triggersData = parseCSV(triggersCSV)

  const triggerMap = new Map<string, string>() // slug -> id

  for (const row of triggersData) {
    const name = row['Name']?.trim()
    const slug = row['Slug']?.trim()
    const emoji = row['Emot']?.trim() || null
    if (!name || !slug) continue

    const { data, error } = await supabase
      .from('psychological_triggers')
      .upsert({ name, slug, emoji }, { onConflict: 'slug' })
      .select('id')
      .single()

    if (error) {
      console.error(`Error inserting trigger ${name}:`, error.message)
    } else if (data) {
      triggerMap.set(slug, data.id)
    }
  }
  console.log(`Imported ${triggerMap.size} psychological triggers`)

  // 3. Import Power Words
  console.log('Importing power words...')
  const powerWordsCSV = fs.readFileSync(path.join(basePath, 'Listing Leads - Videos - power words.csv'), 'utf-8')
  const powerWordsData = parseCSV(powerWordsCSV)

  const powerWordMap = new Map<string, string>() // slug -> id

  for (const row of powerWordsData) {
    const name = row['Name']?.trim()
    const slug = row['Slug']?.trim()
    if (!name || !slug) continue

    const { data, error } = await supabase
      .from('power_words')
      .upsert({ name, slug }, { onConflict: 'slug' })
      .select('id')
      .single()

    if (error) {
      console.error(`Error inserting power word ${name}:`, error.message)
    } else if (data) {
      powerWordMap.set(slug, data.id)
    }
  }
  console.log(`Imported ${powerWordMap.size} power words`)

  // 4. Import Creators
  console.log('Importing creators...')
  const creatorsCSV = fs.readFileSync(path.join(basePath, 'Listing Leads - Videos - Creators.csv'), 'utf-8')
  const creatorsData = parseCSV(creatorsCSV)

  const creatorMap = new Map<string, string>() // slug -> id

  for (const row of creatorsData) {
    const name = row['Name']?.trim()
    const slug = row['Slug']?.trim()
    const channel_url = row['Channel URL']?.trim() || null
    const image_url = row['Image']?.trim() || null
    const subscribersStr = row['Subscribers']?.trim()
    const subscribers = subscribersStr ? parseInt(subscribersStr.replace(/,/g, '')) || null : null
    const channel_id = row['Channel ID - To find it use https://streamscharts.com/tools/convert-username/youtube']?.trim() || null
    const location = row['Location']?.trim() || null

    if (!name || !slug) continue

    const { data, error } = await supabase
      .from('video_creators')
      .upsert({
        name,
        slug,
        channel_url,
        image_url,
        subscribers,
        channel_id,
        location
      }, { onConflict: 'slug' })
      .select('id')
      .single()

    if (error) {
      console.error(`Error inserting creator ${name}:`, error.message)
    } else if (data) {
      creatorMap.set(slug, data.id)
    }
  }
  console.log(`Imported ${creatorMap.size} creators`)

  // 5. Import Hooks (first pass - without video links)
  console.log('Importing hooks...')
  const hooksCSV = fs.readFileSync(path.join(basePath, 'Listing Leads - Videos - Hooks.csv'), 'utf-8')
  const hooksData = parseCSV(hooksCSV)

  const hookMap = new Map<string, { id: string, triggers: string[] }>() // slug -> { id, triggers }

  for (const row of hooksData) {
    const name = row['Name']?.trim()
    const slug = row['Slug']?.trim()
    const hook_text = row['Hook Long text']?.trim() || null
    const triggersStr = row['Psychological triggers']?.trim() || ''

    if (!name || !slug) continue

    const { data, error } = await supabase
      .from('video_hooks')
      .upsert({
        name,
        slug,
        hook_text
      }, { onConflict: 'slug' })
      .select('id')
      .single()

    if (error) {
      console.error(`Error inserting hook ${name}:`, error.message)
    } else if (data) {
      const triggers = triggersStr.split(';').map(t => t.trim()).filter(Boolean)
      hookMap.set(slug, { id: data.id, triggers })
    }
  }
  console.log(`Imported ${hookMap.size} hooks`)

  // 5b. Link hooks to triggers
  console.log('Linking hooks to triggers...')
  for (const [hookSlug, hookInfo] of hookMap) {
    for (const triggerSlug of hookInfo.triggers) {
      const triggerId = triggerMap.get(triggerSlug)
      if (triggerId) {
        await supabase
          .from('video_hook_triggers')
          .upsert({ hook_id: hookInfo.id, trigger_id: triggerId }, { onConflict: 'hook_id,trigger_id' })
      }
    }
  }

  // 6. Import Videos
  console.log('Importing videos...')
  const videosCSV = fs.readFileSync(path.join(basePath, 'Listing Leads - Videos.csv'), 'utf-8')
  const videosData = parseCSV(videosCSV)

  let videoCount = 0
  let errorCount = 0

  for (const row of videosData) {
    const name = row['Name']?.trim()
    const slug = row['Slug']?.trim()
    const youtube_url = row['URL']?.trim()

    if (!name || !slug || !youtube_url) continue

    // Parse YouTube ID from URL
    let youtube_id = ''
    try {
      const url = new URL(youtube_url)
      if (url.hostname.includes('youtu.be')) {
        youtube_id = url.pathname.slice(1).split('?')[0]
      } else {
        youtube_id = url.searchParams.get('v') || ''
      }
    } catch {
      youtube_id = ''
    }

    const video_runtime = parseRuntime(row['Video Runtime']?.trim() || '')
    const scoreStr = row['Score']?.trim()
    const score = scoreStr ? parseFloat(scoreStr.replace('x', '')) || null : null
    const greater_sign = row['Greater sign']?.trim() === 'true' ? '>' : null

    // Get hook ID
    const hookSlug = row['Hook']?.trim()
    const hookInfo = hookSlug ? hookMap.get(hookSlug) : null
    const hook_id = hookInfo?.id || null

    // Get creator ID
    const creatorSlug = row['Creator']?.trim()
    const creator_id = creatorSlug ? creatorMap.get(creatorSlug) || null : null

    // Get category ID
    const categorySlug = row['Category']?.trim()
    const category_id = categorySlug ? categoryMap.get(categorySlug) || null : null

    // Parse date
    const dateStr = row['Date Posted on YT']?.trim()
    let date_posted_yt: string | null = null
    if (dateStr) {
      try {
        date_posted_yt = new Date(dateStr).toISOString()
      } catch {
        date_posted_yt = null
      }
    }

    const cta = row['Cta']?.trim() || null
    const ai_summary = row['Ai summary']?.trim() || null

    // Parse triggers
    const triggersStr = row['Psychological triggers']?.trim() || ''
    const triggerSlugs = triggersStr.split(';').map(t => t.trim()).filter(Boolean)

    // Parse power words
    const powerWordsStr = row['Power words']?.trim() || ''
    const powerWordSlugs = powerWordsStr.split(';').map(p => p.trim()).filter(Boolean)

    // Generate thumbnail URL from YouTube ID
    const thumbnail_url = youtube_id ? `https://img.youtube.com/vi/${youtube_id}/maxresdefault.jpg` : null

    // Check if video already exists
    const { data: existing } = await supabase
      .from('youtube_videos')
      .select('id')
      .eq('slug', slug)
      .single()

    let videoId: string

    if (existing) {
      // Update existing video
      const { data, error } = await supabase
        .from('youtube_videos')
        .update({
          name,
          youtube_url,
          youtube_id,
          video_runtime,
          score,
          greater_sign,
          hook_id,
          creator_id,
          category_id,
          date_posted_yt,
          cta,
          ai_summary,
          thumbnail_url,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select('id')
        .single()

      if (error) {
        console.error(`Error updating video ${name}:`, error.message)
        errorCount++
        continue
      }
      videoId = data!.id
    } else {
      // Insert new video
      const { data, error } = await supabase
        .from('youtube_videos')
        .insert({
          name,
          slug,
          youtube_url,
          youtube_id,
          video_runtime,
          score,
          greater_sign,
          hook_id,
          creator_id,
          category_id,
          date_posted_yt,
          cta,
          ai_summary,
          thumbnail_url,
          is_active: true
        })
        .select('id')
        .single()

      if (error) {
        console.error(`Error inserting video ${name}:`, error.message)
        errorCount++
        continue
      }
      videoId = data!.id
    }

    // Link video to triggers
    for (const triggerSlug of triggerSlugs) {
      const triggerId = triggerMap.get(triggerSlug)
      if (triggerId) {
        await supabase
          .from('youtube_video_triggers')
          .upsert({ video_id: videoId, trigger_id: triggerId }, { onConflict: 'video_id,trigger_id' })
      }
    }

    // Link video to power words
    for (const pwSlug of powerWordSlugs) {
      const pwId = powerWordMap.get(pwSlug)
      if (pwId) {
        await supabase
          .from('youtube_video_power_words')
          .upsert({ video_id: videoId, power_word_id: pwId }, { onConflict: 'video_id,power_word_id' })
      }
    }

    videoCount++
    if (videoCount % 50 === 0) {
      console.log(`Processed ${videoCount} videos...`)
    }
  }

  console.log(`\nImport complete!`)
  console.log(`- Categories: ${categoryMap.size}`)
  console.log(`- Triggers: ${triggerMap.size}`)
  console.log(`- Power Words: ${powerWordMap.size}`)
  console.log(`- Creators: ${creatorMap.size}`)
  console.log(`- Hooks: ${hookMap.size}`)
  console.log(`- Videos: ${videoCount} (${errorCount} errors)`)
}

main().catch(console.error)
