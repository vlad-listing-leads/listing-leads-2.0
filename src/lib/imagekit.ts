/**
 * ImageKit utility functions for uploading images from URLs
 */
import ImageKit from 'imagekit'

// Lazy initialization for ImageKit client
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
 * Download an image from a URL and return as Buffer
 */
async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Failed to download image: ${response.status} ${response.statusText}`)
      return null
    }
    return Buffer.from(await response.arrayBuffer())
  } catch (error) {
    console.error('Error downloading image:', error)
    return null
  }
}

/**
 * Upload a buffer to ImageKit
 */
async function uploadBuffer(
  buffer: Buffer,
  fileName: string,
  folder: string
): Promise<string | null> {
  try {
    const imagekit = getImageKitClient()
    const result = await imagekit.upload({
      file: buffer,
      fileName,
      folder,
    })
    return result.url
  } catch (error) {
    console.error('Error uploading to ImageKit:', error)
    return null
  }
}

/**
 * Download an image from a URL and upload it to ImageKit
 * Returns the new ImageKit URL or null if upload fails
 */
export async function uploadImageFromUrl(
  sourceUrl: string,
  fileName: string,
  folder: string
): Promise<string | null> {
  // Skip if already on ImageKit
  if (sourceUrl.includes('imagekit.io')) {
    return sourceUrl
  }

  // Download the image
  const buffer = await downloadImage(sourceUrl)
  if (!buffer) {
    console.error('Failed to download image from:', sourceUrl)
    return null
  }

  // Upload to ImageKit
  const newUrl = await uploadBuffer(buffer, fileName, folder)
  if (!newUrl) {
    console.error('Failed to upload image to ImageKit')
    return null
  }

  return newUrl
}

/**
 * Upload a YouTube thumbnail to ImageKit
 * @param thumbnailUrl - Original YouTube thumbnail URL
 * @param youtubeId - YouTube video ID for naming
 * @returns ImageKit URL or original URL if upload fails
 */
export async function uploadYouTubeThumbnail(
  thumbnailUrl: string,
  youtubeId: string
): Promise<string> {
  const newUrl = await uploadImageFromUrl(
    thumbnailUrl,
    `${youtubeId}.jpg`,
    '/youtube-thumbnails'
  )
  // Return original URL if upload fails (graceful degradation)
  return newUrl || thumbnailUrl
}

/**
 * Upload a short video cover/thumbnail to ImageKit
 * @param thumbnailUrl - Original thumbnail URL
 * @param platform - Platform (instagram, tiktok)
 * @param sourceId - Source ID for naming
 * @returns ImageKit URL or original URL if upload fails
 */
export async function uploadShortVideoCover(
  thumbnailUrl: string,
  platform: string,
  sourceId: string
): Promise<string> {
  const newUrl = await uploadImageFromUrl(
    thumbnailUrl,
    `${platform}_${sourceId}.jpg`,
    '/short-videos/covers'
  )
  // Return original URL if upload fails (graceful degradation)
  return newUrl || thumbnailUrl
}

export { getImageKitClient }
