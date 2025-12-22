import {
  SupadataVideoMetadata,
  SupadataTranscriptSegment,
  ExtractedYouTubeData,
} from '@/types/youtube'

const SUPADATA_BASE_URL = 'https://api.supadata.ai/v1'

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
   * Fetch video metadata from YouTube via Supadata
   */
  async getVideoMetadata(videoId: string): Promise<SupadataVideoMetadata> {
    const response = await fetch(
      `${SUPADATA_BASE_URL}/youtube/video?id=${encodeURIComponent(videoId)}`,
      {
        headers: {
          'x-api-key': this.apiKey,
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to fetch video metadata: ${error}`)
    }

    return response.json()
  }

  /**
   * Fetch video transcript from YouTube via Supadata
   */
  async getTranscript(videoUrl: string): Promise<string> {
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
      const error = await response.text()
      throw new Error(`Failed to fetch transcript: ${error}`)
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
  }

  /**
   * Extract all video data (metadata + transcript) from a YouTube URL
   */
  async extractVideoData(youtubeUrl: string): Promise<ExtractedYouTubeData> {
    const videoId = parseYouTubeId(youtubeUrl)
    if (!videoId) {
      throw new Error('Invalid YouTube URL')
    }

    // Fetch metadata and transcript in parallel
    const [metadata, transcript] = await Promise.all([
      this.getVideoMetadata(videoId),
      this.getTranscript(youtubeUrl).catch(() => ''), // Don't fail if transcript unavailable
    ])

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
