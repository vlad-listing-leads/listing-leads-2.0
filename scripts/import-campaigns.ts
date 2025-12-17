import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper to map region
function mapRegion(filterByCountry: string): string {
  const regionMap: Record<string, string> = {
    'United States': 'US',
    'Canada': 'CA',
    'United Kingdom': 'UK',
    'Australia': 'AU',
    'Both': 'US', // Default to US for "Both"
  }
  return regionMap[filterByCountry] || 'US'
}

// Helper to parse date
function parseDate(dateStr: string): string | null {
  if (!dateStr) return null
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    return date.toISOString().split('T')[0]
  } catch {
    return null
  }
}

// Helper to parse tags
function parseTags(tagsStr: string): string[] {
  if (!tagsStr) return []
  return tagsStr.split(';').map(t => t.trim()).filter(Boolean)
}

// Helper to parse hashtags
function parseHashtags(hashtagsStr: string): string[] {
  if (!hashtagsStr) return []
  return hashtagsStr.split(/\s+/).filter(t => t.startsWith('#')).map(t => t.replace('#', ''))
}

// Helper to strip HTML for plain text
function stripHtml(html: string): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

// Import Phone & Text Scripts
async function importPhoneTextScripts(records: any[]) {
  const scripts = records.filter(r => r['Category'] === 'text-scripts')
  console.log(`Importing ${scripts.length} phone/text scripts...`)

  const data = scripts.map((r, index) => ({
    name: r['Name'],
    slug: r['Slug'],
    introduction: r['Introduction'] || null,
    thumbnail_url: r['Thumbnail'] || null,
    script_type: r['Call Script'] ? 'call' : 'text',
    target_audience: r['Target Audience'] || null,
    text_message_1: r['Step-1: Input 1'] || null,
    text_message_2: r['Step-1: Input 2'] || null,
    text_message_3: r['Step-1: Input 3'] || null,
    call_script_pdf_url: null,
    call_script_content: r['Call Script'] || null,
    example_image_url: r['Example 1'] || null,
    full_script_image_url: r['Example Images'] || null,
    region: mapRegion(r['Filter by country']),
    is_featured: r['Featured (Best campaigns to start)'] === 'true',
    is_active: true,
    display_order: index,
    week_start_date: parseDate(r['Date']),
    day_of_week: index % 5,
  }))

  const { error } = await supabase.from('phone_text_scripts').insert(data)
  if (error) {
    console.error('Error importing phone_text_scripts:', error)
  } else {
    console.log(`✓ Imported ${data.length} phone/text scripts`)
  }
}

// Import Email Campaigns
async function importEmailCampaigns(records: any[]) {
  const emails = records.filter(r => r['Category'] === 'email-campaigns')
  console.log(`Importing ${emails.length} email campaigns...`)

  const data = emails.map((r, index) => ({
    name: r['Name'],
    slug: r['Slug'],
    introduction: r['Introduction'] || null,
    thumbnail_url: r['Thumbnail'] || null,
    subject_line: stripHtml(r['Step-1: Input 1']) || r['Name'],
    email_body: r['Step-1: Input 2'] || '',
    preview_text: null,
    target_audience: r['Target Audience'] || null,
    tags: parseTags(r['Tags']),
    recommended_audience: r['Recommended audience'] || null,
    example_image_url: r['Example 1'] || null,
    full_email_image_url: r['Example Images'] || null,
    region: mapRegion(r['Filter by country']),
    is_featured: r['Featured (Best campaigns to start)'] === 'true',
    is_active: true,
    display_order: index,
    week_start_date: parseDate(r['Date']),
    day_of_week: index % 5,
  }))

  const { error } = await supabase.from('email_campaigns').insert(data)
  if (error) {
    console.error('Error importing email_campaigns:', error)
  } else {
    console.log(`✓ Imported ${data.length} email campaigns`)
  }
}

// Import Direct Mail Templates
async function importDirectMailTemplates(records: any[]) {
  const directMail = records.filter(r => r['Category'] === 'direct-mail-templates')
  console.log(`Importing ${directMail.length} direct mail templates...`)

  const data = directMail.map((r, index) => ({
    name: r['Name'],
    slug: r['Slug'],
    introduction: r['Introduction'] || null,
    thumbnail_url: r['Thumbnail'] || null,
    mail_type: 'postcard',
    canva_template_url: r['Step-1: Canva link'] || null,
    editor_url: r['Editor URL'] || null,
    target_audience: r['Target Audience'] || null,
    channel: r['Intro - Channel'] || 'Direct Mail',
    example_image_url: r['Example 1'] || null,
    example_images: [r['Example 1'], r['Example 2'], r['Example 3'], r['Example 4'], r['Example 5']].filter(Boolean),
    region: mapRegion(r['Filter by country']),
    is_featured: r['Featured (Best campaigns to start)'] === 'true',
    is_active: true,
    display_order: index,
    week_start_date: parseDate(r['Date']),
    day_of_week: index % 5,
  }))

  const { error } = await supabase.from('direct_mail_templates').insert(data)
  if (error) {
    console.error('Error importing direct_mail_templates:', error)
  } else {
    console.log(`✓ Imported ${data.length} direct mail templates`)
  }
}

// Import Social Shareables
async function importSocialShareables(records: any[]) {
  const social = records.filter(r => r['Category'] === 'social-shareables')
  console.log(`Importing ${social.length} social shareables...`)

  const data = social.map((r, index) => {
    const isVideo = r['Is Social Shareable Video'] === 'true'
    return {
      name: r['Name'],
      slug: r['Slug'],
      introduction: r['Introduction'] || null,
      thumbnail_url: r['Thumbnail'] || null,
      is_video: isVideo,
      content_type: isVideo ? 'reel' : 'static_image',
      canva_template_url: r['Step-1: Canva link'] || null,
      video_flow_pdf_title: r['Video Flow PDF title'] || null,
      video_flow_pdf_url: r['Video Flow PDF link'] || null,
      audio_transcription_url: r['Audio transcription'] || null,
      video_script: null,
      video_title: r['Video title'] || null,
      video_description: r['Video description'] || null,
      hashtags: parseHashtags(r['Video Hashtags']),
      example_image_url: r['Example 1'] || null,
      example_images: [r['Example 1'], r['Example 2'], r['Example 3'], r['Example 4'], r['Example 5']].filter(Boolean),
      region: mapRegion(r['Filter by country']),
      is_featured: r['Featured (Best campaigns to start)'] === 'true',
      is_active: true,
      display_order: index,
      week_start_date: parseDate(r['Date']),
      day_of_week: index % 5,
    }
  })

  const { error } = await supabase.from('social_shareables').insert(data)
  if (error) {
    console.error('Error importing social_shareables:', error)
  } else {
    console.log(`✓ Imported ${data.length} social shareables`)
  }
}

async function main() {
  const csvPath = process.argv[2] || '/Users/vlad/Desktop/Listing Leads - Campaigns.csv'

  console.log(`Reading CSV from: ${csvPath}`)

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`)
    process.exit(1)
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as Record<string, string>[]

  console.log(`Parsed ${records.length} records from CSV`)
  console.log('')

  // Count by category
  const categories: Record<string, number> = {}
  for (const r of records) {
    const cat = r['Category'] || 'unknown'
    categories[cat] = (categories[cat] || 0) + 1
  }
  console.log('Categories found:')
  for (const [cat, count] of Object.entries(categories)) {
    console.log(`  ${cat}: ${count}`)
  }
  console.log('')

  // Import each category
  await importPhoneTextScripts(records)
  await importEmailCampaigns(records)
  await importDirectMailTemplates(records)
  await importSocialShareables(records)

  console.log('')
  console.log('Import complete!')
}

main().catch(console.error)
