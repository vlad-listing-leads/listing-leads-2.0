import OpenAI from 'openai'
import * as fs from 'fs'

// Lazy initialization for OpenAI client
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

/**
 * Transcribe audio/video file using OpenAI Whisper API
 *
 * @param filePath - Path to the audio/video file
 * @param language - Language code (optional, auto-detect if not provided)
 * @returns Transcribed text
 */
export async function transcribeFile(
  filePath: string,
  language?: string
): Promise<string> {
  const openai = getOpenAIClient()

  // Read file as a stream
  const file = fs.createReadStream(filePath)

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language,
    response_format: 'text',
  })

  return transcription
}

/**
 * Transcribe audio/video from a URL by downloading first
 *
 * @param videoUrl - URL to the video file (e.g., ImageKit URL)
 * @param tempDir - Temporary directory for download
 * @returns Transcribed text
 */
export async function transcribeFromUrl(
  videoUrl: string,
  tempDir?: string
): Promise<string> {
  const fs = await import('fs')
  const path = await import('path')
  const os = await import('os')

  // Create temp directory if not provided
  const workDir = tempDir || path.join(os.tmpdir(), `whisper-${Date.now()}`)
  if (!fs.existsSync(workDir)) {
    fs.mkdirSync(workDir, { recursive: true })
  }

  const tempFilePath = path.join(workDir, 'video.mp4')

  try {
    // Download video file
    console.log('Downloading video for transcription...')
    const response = await fetch(videoUrl)
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    fs.writeFileSync(tempFilePath, buffer)

    // Transcribe
    console.log('Transcribing with Whisper...')
    const transcript = await transcribeFile(tempFilePath)

    // Clean up
    fs.unlinkSync(tempFilePath)
    if (!tempDir) {
      fs.rmdirSync(workDir)
    }

    return transcript
  } catch (error) {
    // Clean up on error
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath)
    }
    if (!tempDir && fs.existsSync(workDir)) {
      fs.rmdirSync(workDir)
    }
    throw error
  }
}

/**
 * Transcribe video with segments (timestamps)
 */
export async function transcribeWithTimestamps(
  filePath: string,
  language?: string
): Promise<{
  text: string
  segments: Array<{
    start: number
    end: number
    text: string
  }>
}> {
  const openai = getOpenAIClient()

  const file = fs.createReadStream(filePath)

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language,
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  })

  return {
    text: transcription.text,
    segments: (transcription as unknown as { segments?: Array<{ start: number; end: number; text: string }> }).segments || [],
  }
}

/**
 * Estimate transcription cost based on duration
 * Whisper API costs ~$0.006 per minute
 */
export function estimateCost(durationSeconds: number): number {
  const minutes = durationSeconds / 60
  return Math.ceil(minutes * 0.006 * 100) / 100 // Round to 2 decimal places
}
