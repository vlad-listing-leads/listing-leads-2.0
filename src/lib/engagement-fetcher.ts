/**
 * Engagement Metrics Fetcher
 * Fetches view counts, likes, and comments from YouTube and Instagram
 */

import { getSupadataClient, parseYouTubeId } from './supadata'

export interface EngagementMetrics {
  views: number | null
  likes: number | null
  comments: number | null
  fetched_at: string
}

/**
 * Parse Instagram post ID from URL
 */
function parseInstagramId(url: string): string | null {
  // Patterns for Instagram URLs:
  // https://www.instagram.com/reel/ABC123/
  // https://www.instagram.com/p/ABC123/
  // https://instagram.com/reel/ABC123/
  const patterns = [
    /instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

/**
 * Fetch engagement metrics for a YouTube video using Supadata
 */
async function fetchYouTubeMetrics(videoIdOrUrl: string): Promise<EngagementMetrics | null> {
  try {
    // Parse video ID if URL provided
    const videoId = parseYouTubeId(videoIdOrUrl) || videoIdOrUrl

    if (!videoId || videoId.length !== 11) {
      console.error('Invalid YouTube video ID:', videoIdOrUrl)
      return null
    }

    const supadata = getSupadataClient()
    const metadata = await supadata.getVideoMetadata(videoId)

    return {
      views: metadata.viewCount || null,
      likes: metadata.likeCount || null,
      comments: null, // Supadata doesn't provide comment count
      fetched_at: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error fetching YouTube metrics:', error)
    return null
  }
}

/**
 * Fetch engagement metrics for an Instagram post using oEmbed
 * Note: Instagram's oEmbed API has limited data - may not include engagement stats
 */
async function fetchInstagramMetrics(sourceUrl: string): Promise<EngagementMetrics | null> {
  try {
    const postId = parseInstagramId(sourceUrl)
    if (!postId) {
      console.error('Could not parse Instagram URL:', sourceUrl)
      return null
    }

    // Try Instagram oEmbed API
    const oEmbedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(sourceUrl)}`

    const response = await fetch(oEmbedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ListingLeads/1.0)',
      },
    })

    if (!response.ok) {
      // Instagram oEmbed often requires authentication or is rate limited
      console.warn('Instagram oEmbed request failed:', response.status)

      // Return empty metrics - Instagram API access is limited
      return {
        views: null,
        likes: null,
        comments: null,
        fetched_at: new Date().toISOString(),
      }
    }

    // oEmbed response doesn't include engagement metrics
    // It only provides title, author_name, thumbnail_url, etc.
    // Return null metrics since we can't get them from public API
    return {
      views: null,
      likes: null,
      comments: null,
      fetched_at: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error fetching Instagram metrics:', error)
    return null
  }
}

/**
 * Main function to fetch engagement metrics based on platform
 */
export async function fetchEngagementMetrics(
  platform: 'instagram' | 'youtube',
  sourceUrlOrId: string
): Promise<EngagementMetrics | null> {
  switch (platform) {
    case 'youtube':
      return fetchYouTubeMetrics(sourceUrlOrId)
    case 'instagram':
      return fetchInstagramMetrics(sourceUrlOrId)
    default:
      console.error('Unsupported platform:', platform)
      return null
  }
}

/**
 * Batch fetch metrics for multiple entries
 * Includes delay between requests to avoid rate limiting
 */
export async function fetchBatchMetrics(
  entries: Array<{ platform: 'instagram' | 'youtube'; sourceUrlOrId: string }>
): Promise<Array<EngagementMetrics | null>> {
  const results: Array<EngagementMetrics | null> = []

  for (const entry of entries) {
    const metrics = await fetchEngagementMetrics(entry.platform, entry.sourceUrlOrId)
    results.push(metrics)

    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return results
}

/**
 * Format engagement numbers for display
 */
export function formatEngagementNumber(num: number | null): string {
  if (num === null || num === undefined) return '-'

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}
