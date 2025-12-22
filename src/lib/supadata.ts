import {
  SupadataVideoMetadata,
  SupadataTranscriptSegment,
  ExtractedYouTubeData,
} from '@/types/youtube'

const SUPADATA_BASE_URL = 'https://api.supadata.ai/v1'

// Rate limit handling configuration
const RATE_LIMIT_RETRY_DELAYS = [2000, 5000, 10000] // Retry after 2s, 5s, 10s
const MAX_RETRIES = 3

/**
 * Sleep utility for rate limit handling
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Check if error is a rate limit error
 */
function isRateLimitError(errorText: string): boolean {
  return errorText.includes('limit-exceeded') || errorText.includes('rate limit')
}

/**
 * Parse YouTube video ID from various URL formats
 */
export function parseYouTubeId(url: string): string | null {
  const patterns = [
    // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // Short URL: https://youtu.be/VIDEO_ID
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    // Embed URL: https://www.youtube.com/embed/VIDEO_ID
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    // Shorts URL: https://www.youtube.com/shorts/VIDEO_ID
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    // Just the ID
    /^([a-zA-Z0-9_-]{11})$/,
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
 * Format duration from seconds to human-readable string (e.g., "3:45" or "1:23:45")
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100) // Limit length
}

/**
 * Supadata API client for fetching YouTube video data
 */
class SupadataClient {
  private apiKey: string

  constructor() {
    const apiKey = process.env.SUPADATA_API_KEY
    if (!apiKey) {
      throw new Error('SUPADATA_API_KEY environment variable is not set')
    }
    this.apiKey = apiKey
  }

  /**
   * Fetch video metadata from YouTube via Supadata with retry logic
   */
  async getVideoMetadata(videoId: string): Promise<SupadataVideoMetadata> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(
          `${SUPADATA_BASE_URL}/youtube/video?id=${encodeURIComponent(videoId)}`,
          {
            headers: {
              'x-api-key': this.apiKey,
            },
          }
        )

        if (!response.ok) {
          const errorText = await response.text()

          // If rate limited and we have retries left, wait and retry
          if (isRateLimitError(errorText) && attempt < MAX_RETRIES) {
            const delay = RATE_LIMIT_RETRY_DELAYS[attempt] || 10000
            console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`)
            await sleep(delay)
            continue
          }

          throw new Error(`Failed to fetch video metadata: ${errorText}`)
        }

        return response.json()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // If not a rate limit error, don't retry
        if (!lastError.message.includes('limit-exceeded')) {
          throw lastError
        }

        if (attempt < MAX_RETRIES) {
          const delay = RATE_LIMIT_RETRY_DELAYS[attempt] || 10000
          console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`)
          await sleep(delay)
        }
      }
    }

    throw lastError || new Error('Failed to fetch video metadata after retries')
  }

  /**
   * Fetch video transcript from YouTube via Supadata with retry logic
   */
  async getTranscript(videoUrl: string): Promise<string> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(
          `${SUPADATA_BASE_URL}/transcript?url=${encodeURIComponent(videoUrl)}`,
          {
            headers: {
              'x-api-key': this.apiKey,
            },
          }
        )

        if (!response.ok) {
          // Transcript might not be available for all videos
          if (response.status === 404) {
            return ''
          }

          const errorText = await response.text()

          // If rate limited and we have retries left, wait and retry
          if (isRateLimitError(errorText) && attempt < MAX_RETRIES) {
            const delay = RATE_LIMIT_RETRY_DELAYS[attempt] || 10000
            console.log(`Rate limited on transcript, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`)
            await sleep(delay)
            continue
          }

          throw new Error(`Failed to fetch transcript: ${errorText}`)
        }

        const data = await response.json()

        // Combine transcript segments into full text
        if (data.content && Array.isArray(data.content)) {
          return (data.content as SupadataTranscriptSegment[])
            .map((segment) => segment.text)
            .join(' ')
            .trim()
        }

        return ''
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // If not a rate limit error, don't retry
        if (!lastError.message.includes('limit-exceeded')) {
          throw lastError
        }

        if (attempt < MAX_RETRIES) {
          const delay = RATE_LIMIT_RETRY_DELAYS[attempt] || 10000
          console.log(`Rate limited on transcript, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`)
          await sleep(delay)
        }
      }
    }

    // If all retries failed due to rate limit, return empty transcript
    // (don't fail the whole extraction just because transcript failed)
    console.warn('Failed to fetch transcript after retries, continuing without it')
    return ''
  }

  /**
   * Extract all video data (metadata + transcript) from a YouTube URL
   * Only 2 API calls: metadata + transcript (sequential to avoid rate limits)
   */
  async extractVideoData(youtubeUrl: string): Promise<ExtractedYouTubeData> {
    const videoId = parseYouTubeId(youtubeUrl)
    if (!videoId) {
      throw new Error('Invalid YouTube URL')
    }

    // Fetch metadata first (required)
    const metadata = await this.getVideoMetadata(videoId)

    // Small delay between calls to avoid rate limits
    await sleep(1000)

    // Then fetch transcript (optional - don't fail if unavailable)
    let transcript = ''
    try {
      transcript = await this.getTranscript(youtubeUrl)
    } catch (error) {
      console.warn('Failed to fetch transcript, continuing without it:', error)
    }

    return {
      youtube_id: metadata.id,
      title: metadata.title,
      description: metadata.description,
      duration: metadata.duration,
      channel: metadata.channel,
      thumbnail: metadata.thumbnail,
      uploadDate: metadata.uploadDate,
      viewCount: metadata.viewCount,
      transcript,
    }
  }
}

// Singleton instance
let supadata: SupadataClient | null = null

/**
 * Get the Supadata client instance
 */
export function getSupadataClient(): SupadataClient {
  if (!supadata) {
    supadata = new SupadataClient()
  }
  return supadata
}

export { SupadataClient }
