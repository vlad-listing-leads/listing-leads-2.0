import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Generates a URL-friendly slug from a string
 * Converts to lowercase, removes special characters, replaces spaces with hyphens
 */
export function generateSlug(name: string): string {
  if (!name) return ''
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Strips HTML tags from a string
 * Useful for displaying plain text from HTML content
 */
export function stripHtml(html: string): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

/**
 * Checks if a slug is unique in a given table
 * @param supabase - Supabase client instance
 * @param tableName - The database table to check
 * @param slug - The slug to check for uniqueness
 * @param excludeId - Optional ID to exclude (for editing existing records)
 * @returns 'available' | 'taken' | 'error'
 */
export async function checkSlugUniqueness(
  supabase: SupabaseClient,
  tableName: string,
  slug: string,
  excludeId?: string
): Promise<'available' | 'taken' | 'error'> {
  if (!slug) return 'available'

  try {
    let query = supabase
      .from(tableName)
      .select('id')
      .eq('slug', slug)
      .limit(1)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Slug check error:', error)
      return 'error'
    }

    return data && data.length > 0 ? 'taken' : 'available'
  } catch (err) {
    console.error('Slug check error:', err)
    return 'error'
  }
}

/**
 * Truncates text to a specified length with ellipsis
 * Useful for creating preview text
 */
export function truncateText(text: string, maxLength: number = 150): string {
  if (!text) return ''
  const stripped = stripHtml(text)
  if (stripped.length <= maxLength) return stripped
  return stripped.slice(0, maxLength).trim() + '...'
}
