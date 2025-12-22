#!/usr/bin/env npx tsx
/**
 * Import Ads from CSV files
 *
 * Usage:
 *   npx tsx scripts/import_ads.ts
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const COMPANIES_CSV = '/Users/vlad/Desktop/ads/Listing Leads - Ads - Companies.csv'
const ADS_CSV = '/Users/vlad/Desktop/ads/Listing Leads - Ads.csv'

interface CompanyRow {
  Name: string
  Slug: string
  Icon: string
}

interface AdRow {
  Name: string
  Slug: string
  'Ad channel': string
  'Ad image': string
  Company: string
  Tags: string
  Category: string
  Rating: string
  'Rating count': string
  'Ad description': string
}

async function importCompanies(): Promise<Map<string, string>> {
  console.log('\n📦 Importing companies...')

  const csvContent = fs.readFileSync(COMPANIES_CSV, 'utf-8')
  const records: CompanyRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  })

  const slugToId = new Map<string, string>()

  for (const row of records) {
    const { data: existing } = await supabase
      .from('ad_companies')
      .select('id')
      .eq('slug', row.Slug)
      .single()

    if (existing) {
      slugToId.set(row.Slug, existing.id)
      continue
    }

    const { data, error } = await supabase
      .from('ad_companies')
      .insert({
        name: row.Name.trim(),
        slug: row.Slug,
        icon_url: row.Icon || null,
      })
      .select('id')
      .single()

    if (error) {
      console.error(`  ❌ Failed to insert company ${row.Name}:`, error.message)
    } else {
      slugToId.set(row.Slug, data.id)
      console.log(`  ✅ ${row.Name}`)
    }
  }

  console.log(`  📊 Imported ${slugToId.size} companies`)
  return slugToId
}

async function importTags(adsData: AdRow[]): Promise<Map<string, string>> {
  console.log('\n🏷️  Importing tags...')

  // Collect all unique tags from ads
  const uniqueTags = new Set<string>()
  for (const row of adsData) {
    if (row.Tags) {
      const tags = row.Tags.split(';').map(t => t.trim()).filter(Boolean)
      tags.forEach(tag => uniqueTags.add(tag))
    }
  }

  const slugToId = new Map<string, string>()

  for (const tagSlug of uniqueTags) {
    const { data: existing } = await supabase
      .from('ad_tags')
      .select('id')
      .eq('slug', tagSlug)
      .single()

    if (existing) {
      slugToId.set(tagSlug, existing.id)
      continue
    }

    // Convert slug to name (e.g., "why-choose-us" -> "Why Choose Us")
    const name = tagSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/\s*-$/, '') // Remove trailing dash

    const { data, error } = await supabase
      .from('ad_tags')
      .insert({
        name,
        slug: tagSlug.replace(/-$/, ''), // Remove trailing dash from slug too
      })
      .select('id')
      .single()

    if (error) {
      console.error(`  ❌ Failed to insert tag ${tagSlug}:`, error.message)
    } else {
      slugToId.set(tagSlug, data.id)
      console.log(`  ✅ ${name}`)
    }
  }

  console.log(`  📊 Imported ${slugToId.size} tags`)
  return slugToId
}

async function importAds(
  companyMap: Map<string, string>,
  tagMap: Map<string, string>
): Promise<void> {
  console.log('\n📢 Importing ads...')

  const csvContent = fs.readFileSync(ADS_CSV, 'utf-8')
  const records: AdRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  })

  let imported = 0
  let skipped = 0
  let failed = 0

  for (const row of records) {
    // Check if ad already exists
    const { data: existing } = await supabase
      .from('ads')
      .select('id')
      .eq('slug', row.Slug)
      .single()

    if (existing) {
      skipped++
      continue
    }

    // Get company ID
    const companyId = companyMap.get(row.Company) || null

    // Parse channel
    const channel = row['Ad channel']?.toLowerCase() === 'google' ? 'google' : 'meta'

    // Parse rating
    const rating = parseFloat(row.Rating) || 0
    const ratingCount = parseInt(row['Rating count']) || 0

    // Insert ad
    const { data: ad, error } = await supabase
      .from('ads')
      .insert({
        name: row.Name.trim(),
        slug: row.Slug,
        channel,
        image_url: row['Ad image'] || null,
        company_id: companyId,
        rating,
        rating_count: ratingCount,
        description: row['Ad description'] || null,
        is_active: true,
      })
      .select('id')
      .single()

    if (error) {
      console.error(`  ❌ Failed to insert ad "${row.Name.slice(0, 50)}...":`, error.message)
      failed++
      continue
    }

    // Insert tag links
    if (row.Tags && ad) {
      const tags = row.Tags.split(';').map(t => t.trim()).filter(Boolean)
      for (const tagSlug of tags) {
        const tagId = tagMap.get(tagSlug) || tagMap.get(tagSlug.replace(/-$/, ''))
        if (tagId) {
          await supabase.from('ad_tag_links').insert({
            ad_id: ad.id,
            tag_id: tagId,
          })
        }
      }
    }

    imported++
    if (imported % 50 === 0) {
      console.log(`  📊 Progress: ${imported} ads imported...`)
    }
  }

  console.log(`\n  📊 Summary:`)
  console.log(`    Imported: ${imported}`)
  console.log(`    Skipped (existing): ${skipped}`)
  console.log(`    Failed: ${failed}`)
}

async function main() {
  console.log('🚀 Ads Import Script')
  console.log('====================')

  // First, load ads CSV to extract tags
  const adsContent = fs.readFileSync(ADS_CSV, 'utf-8')
  const adsData: AdRow[] = parse(adsContent, {
    columns: true,
    skip_empty_lines: true,
  })

  // Import companies first
  const companyMap = await importCompanies()

  // Import tags
  const tagMap = await importTags(adsData)

  // Import ads
  await importAds(companyMap, tagMap)

  console.log('\n✅ Import complete!')
}

main().catch(console.error)
