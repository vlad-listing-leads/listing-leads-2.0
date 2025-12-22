import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import ImageKit from 'imagekit'
import { Platform, ExtractedShortVideoData } from '@/types/short-video'

const execAsync = promisify(exec)

// Lazy initialization for ImageKit
let imagekitClient: ImageKit | null = null

function getImageKitClient(): ImageKit {
  if (!imagekitClient) {
    imagekitClient = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
    })
  }
  return imagekitClient
}

/**
 * Detect platform from URL
 */
export function detectPlatform(url: string): Platform {
  if (url.includes('instagram.com') || url.includes('instagr.am')) {
    return 'instagram'
  }
  if (url.includes('tiktok.com') || url.includes('vm.tiktok.com')) {
    return 'tiktok'
  }
  return 'instagram' // Default
}

/**
 * Parse source ID from URL
 */
export function parseSourceId(url: string, platform: Platform): string | null {
  if (platform === 'instagram') {
    // Patterns: /reel/ID/, /p/ID/, /reels/ID/
    const match = url.match(/instagram\.com\/(?:reel|p|reels)\/([A-Za-z0-9_-]+)/)
    return match?.[1] || null
  }

  if (platform === 'tiktok') {
    // Patterns: /video/ID, /@user/video/ID
    const match = url.match(/tiktok\.com\/.*?\/video\/(\d+)/) ||
                  url.match(/vm\.tiktok\.com\/([A-Za-z0-9]+)/)
    return match?.[1] || null
  }

  return null
}

/**
 * Extract video data using yt-dlp
 */
export async function extractVideoData(url: string): Promise<{
  title: string
  description: string | null
  duration: number | null
  thumbnail: string | null
  uploader: string | null
  uploaderHandle: string | null
  uploadDate: string | null
}> {
  try {
    // Get video metadata as JSON
    const { stdout } = await execAsync(
      `yt-dlp --dump-json --no-download "${url}"`,
      { maxBuffer: 10 * 1024 * 1024 }
    )

    const data = JSON.parse(stdout)

    return {
      title: data.title || data.fulltitle || 'Untitled',
      description: data.description || null,
      duration: data.duration ? Math.round(data.duration) : null,
      thumbnail: data.thumbnail || null,
      uploader: data.uploader || data.channel || null,
      uploaderHandle: data.uploader_id || data.channel_id || null,
      uploadDate: data.upload_date ? formatUploadDate(data.upload_date) : null,
    }
  } catch (error) {
    console.error('Error extracting video metadata:', error)
    throw new Error('Failed to extract video metadata')
  }
}

/**
 * Format upload date from yt-dlp format (YYYYMMDD) to ISO string
 */
function formatUploadDate(dateStr: string): string {
  if (dateStr.length === 8) {
    const year = dateStr.slice(0, 4)
    const month = dateStr.slice(4, 6)
    const day = dateStr.slice(6, 8)
    return `${year}-${month}-${day}T00:00:00Z`
  }
  return dateStr
}

/**
 * Download video file using yt-dlp
 */
export async function downloadVideo(url: string, outputPath: string): Promise<void> {
  try {
    await execAsync(
      `yt-dlp -f "best[ext=mp4]/best" -o "${outputPath}" "${url}"`,
      { maxBuffer: 100 * 1024 * 1024, timeout: 300000 }
    )
  } catch (error) {
    console.error('Error downloading video:', error)
    throw new Error('Failed to download video')
  }
}

/**
 * Download thumbnail using yt-dlp
 */
export async function downloadThumbnail(url: string, outputPath: string): Promise<void> {
  try {
    await execAsync(
      `yt-dlp --write-thumbnail --skip-download --convert-thumbnails jpg -o "${outputPath.replace('.jpg', '')}" "${url}"`,
      { maxBuffer: 10 * 1024 * 1024, timeout: 60000 }
    )
  } catch (error) {
    console.error('Error downloading thumbnail:', error)
    throw new Error('Failed to download thumbnail')
  }
}

/**
 * Upload file to ImageKit
 */
export async function uploadToImageKit(
  filePath: string,
  fileName: string,
  folder: string
): Promise<string> {
  const imagekit = getImageKitClient()
  const fileBuffer = fs.readFileSync(filePath)

  const result = await imagekit.upload({
    file: fileBuffer,
    fileName,
    folder,
  })

  return result.url
}

/**
 * Full extraction pipeline: extract metadata, download video/thumbnail, upload to ImageKit
 */
export async function extractAndUploadVideo(url: string): Promise<ExtractedShortVideoData> {
  const platform = detectPlatform(url)
  const sourceId = parseSourceId(url, platform) || `${platform}_${Date.now()}`

  // Create temp directory
  const tempDir = path.join(os.tmpdir(), `short-video-${Date.now()}`)
  fs.mkdirSync(tempDir, { recursive: true })

  const videoPath = path.join(tempDir, `${sourceId}.mp4`)
  const thumbnailPath = path.join(tempDir, `${sourceId}.jpg`)

  try {
    // Extract metadata
    console.log('Extracting metadata...')
    const metadata = await extractVideoData(url)

    // Download video
    console.log('Downloading video...')
    await downloadVideo(url, videoPath)

    // Download thumbnail
    console.log('Downloading thumbnail...')
    try {
      await downloadThumbnail(url, thumbnailPath)
    } catch {
      console.warn('Failed to download thumbnail, will use video still')
    }

    // Upload video to ImageKit
    console.log('Uploading video to ImageKit...')
    const videoUrl = await uploadToImageKit(
      videoPath,
      `${platform}_${sourceId}.mp4`,
      '/short-videos/videos'
    )

    // Upload thumbnail to ImageKit (if exists)
    let coverUrl = ''
    const thumbFiles = fs.readdirSync(tempDir).filter(f => f.endsWith('.jpg') || f.endsWith('.webp'))
    if (thumbFiles.length > 0) {
      const thumbFile = path.join(tempDir, thumbFiles[0])
      console.log('Uploading cover to ImageKit...')
      coverUrl = await uploadToImageKit(
        thumbFile,
        `${platform}_${sourceId}.jpg`,
        '/short-videos/covers'
      )
    }

    // Clean up temp files
    fs.rmSync(tempDir, { recursive: true, force: true })

    return {
      platform,
      source_id: sourceId,
      title: metadata.title,
      description: metadata.description,
      duration: metadata.duration,
      video_url: videoUrl,
      cover_url: coverUrl,
      transcript: null, // Will be generated separately with Whisper
      creator: metadata.uploader ? {
        handle: metadata.uploaderHandle || metadata.uploader,
        name: metadata.uploader,
      } : null,
      date_posted: metadata.uploadDate,
    }
  } catch (error) {
    // Clean up temp files on error
    fs.rmSync(tempDir, { recursive: true, force: true })
    throw error
  }
}

/**
 * Quick metadata extraction (no download)
 */
export async function quickExtractMetadata(url: string): Promise<{
  platform: Platform
  sourceId: string | null
  title: string
  description: string | null
  duration: number | null
  thumbnail: string | null
  creator: { handle: string; name: string } | null
  datePosted: string | null
}> {
  const platform = detectPlatform(url)
  const sourceId = parseSourceId(url, platform)

  const metadata = await extractVideoData(url)

  return {
    platform,
    sourceId,
    title: metadata.title,
    description: metadata.description,
    duration: metadata.duration,
    thumbnail: metadata.thumbnail,
    creator: metadata.uploader ? {
      handle: metadata.uploaderHandle || metadata.uploader,
      name: metadata.uploader,
    } : null,
    datePosted: metadata.uploadDate,
  }
}
