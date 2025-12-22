'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Eye,
  Heart,
  MessageCircle,
  Sparkles,
  Clock,
  ExternalLink,
  Instagram,
  Volume2,
  VolumeX,
  Play,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { ShortVideo } from '@/types/short-video'
import Hls from 'hls.js'

// Streaming Video Player Component
function StreamingVideoPlayer({
  src,
  poster,
  muted,
  loop,
  onPlayStateChange,
  onLoadingChange,
}: {
  src: string
  poster?: string
  muted: boolean
  loop: boolean
  onPlayStateChange: (playing: boolean) => void
  onLoadingChange?: (loading: boolean) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false)

  useEffect(() => {
    onLoadingChange?.(isLoading)
  }, [isLoading, onLoadingChange])

  const getHlsUrl = (url: string) => {
    if (!url.includes('imagekit.io')) return null
    const urlObj = new URL(url)
    return `${urlObj.origin}${urlObj.pathname}/ik-master.m3u8?tr=sr-480_720`
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const hlsUrl = getHlsUrl(src)

    if (hlsUrl && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      })
      hlsRef.current = hls
      hls.loadSource(hlsUrl)
      hls.attachMedia(video)

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          hls.destroy()
          video.src = src
        }
      })

      return () => {
        hls.destroy()
        hlsRef.current = null
      }
    } else if (video.canPlayType('application/vnd.apple.mpegurl') && hlsUrl) {
      video.src = hlsUrl
    } else {
      video.src = src
    }
  }, [src])

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.muted = muted
    }
  }, [muted])

  const handleClick = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      setIsLoading(true)
      video.play()
        .then(() => {
          onPlayStateChange(true)
        })
        .catch((err) => {
          console.error('Play failed:', err)
          setIsLoading(false)
        })
    } else {
      video.pause()
      onPlayStateChange(false)
    }
  }

  const handleCanPlay = () => {
    if (isLoading) {
      setIsLoading(false)
      setHasStartedPlaying(true)
    }
  }

  const handleWaiting = () => {
    if (hasStartedPlaying) {
      setIsLoading(true)
    }
  }

  const handlePlaying = () => {
    setIsLoading(false)
    setHasStartedPlaying(true)
  }

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-contain cursor-pointer"
        muted={muted}
        loop={loop}
        playsInline
        preload="none"
        onClick={handleClick}
        onCanPlay={handleCanPlay}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="w-16 h-16 rounded-full bg-black/70 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        </div>
      )}
    </div>
  )
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

export default function ReelDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [video, setVideo] = useState<ShortVideo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isVideoLoading, setIsVideoLoading] = useState(false)

  useEffect(() => {
    if (slug) {
      fetchVideo()
    }
  }, [slug])

  const fetchVideo = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/short-videos/videos?slug=${encodeURIComponent(slug)}`)
      const data = await response.json()

      if (data.videos && data.videos.length > 0) {
        setVideo(data.videos[0])
      } else {
        setError('Reel not found')
      }
    } catch (err) {
      console.error('Failed to fetch video:', err)
      setError('Failed to load reel')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">{error || 'Reel not found'}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link
          href="/social/instagram-reels"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-sm font-medium text-foreground truncate max-w-[60%]">
          {video.name}
        </h1>
        <div className="w-16" />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Video Player */}
            <div className="lg:w-1/2">
              <div className="sticky top-6">
                <div className="relative aspect-[9/16] max-h-[70vh] mx-auto rounded-xl overflow-hidden bg-black shadow-lg">
                  {video.video_url ? (
                    <>
                      <StreamingVideoPlayer
                        src={video.video_url}
                        poster={video.cover_url || undefined}
                        muted={isMuted}
                        loop
                        onPlayStateChange={setIsPlaying}
                        onLoadingChange={setIsVideoLoading}
                      />
                      {/* Mute toggle */}
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                      {/* Play indicator */}
                      {!isPlaying && !isVideoLoading && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <Play className="w-10 h-10 text-white ml-1" fill="currentColor" />
                          </div>
                        </div>
                      )}
                    </>
                  ) : video.cover_url ? (
                    <img
                      src={video.cover_url}
                      alt={video.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Instagram className="w-16 h-16 text-white/30" />
                    </div>
                  )}
                </div>

                {/* Creator info below video */}
                {video.creator && (
                  <div className="flex items-center gap-3 mt-4">
                    {video.creator.avatar_url ? (
                      <img
                        src={video.creator.avatar_url}
                        alt={video.creator.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-pink-500/30"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {video.creator.name?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{video.creator.name}</p>
                      <p className="text-sm text-muted-foreground">
                        @{video.creator.handle}
                        {video.creator.location && ` · ${video.creator.location}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Video Details */}
            <div className="lg:w-1/2 space-y-6">
              {/* Title */}
              <div className="text-center lg:text-left">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                  {video.name}
                </h1>
                {video.date_posted && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Posted {formatTimeAgo(video.date_posted)}
                  </p>
                )}
              </div>

              {/* Stats Row (placeholder since we don't have real stats) */}
              <div className="flex items-center justify-center lg:justify-start gap-8">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Views</p>
                  <p className="text-xl font-semibold text-foreground mt-1">-</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Likes</p>
                  <p className="text-xl font-semibold text-foreground mt-1">-</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Comments</p>
                  <p className="text-xl font-semibold text-foreground mt-1">-</p>
                </div>
              </div>

              {/* AI Summary */}
              {video.ai_summary && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    AI Summary
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {video.ai_summary}
                  </p>
                </div>
              )}

              {/* Video Length */}
              {video.video_runtime && video.video_runtime > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-1">Video Length</h3>
                  <p className="text-muted-foreground">{formatDuration(video.video_runtime)}</p>
                </div>
              )}

              {/* The Hook */}
              {video.hook_text && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">The Hook</h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-muted-foreground leading-relaxed">
                      {video.hook_text}
                    </p>
                    {/* Triggers */}
                    {video.triggers && video.triggers.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {video.triggers.map(trigger => (
                          <span
                            key={trigger.id}
                            className="px-2.5 py-1 bg-background border border-border text-foreground text-xs rounded-full flex items-center gap-1"
                          >
                            {trigger.emoji} {trigger.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CTA */}
              {video.cta && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">CTA</h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-muted-foreground">{video.cta}</p>
                  </div>
                </div>
              )}

              {/* Power Words */}
              {video.power_words && video.power_words.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Power Words</h3>
                  <div className="flex flex-wrap gap-2">
                    {video.power_words.map(word => (
                      <span
                        key={word.id}
                        className="px-3 py-1.5 bg-muted border border-border text-foreground text-sm rounded-lg"
                      >
                        {word.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Category */}
              {video.category && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Category</h3>
                  <span className="inline-flex items-center px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-sm rounded-full">
                    {video.category.name}
                  </span>
                </div>
              )}

              {/* Transcript */}
              {video.transcript && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Transcript</h3>
                  <div className="bg-muted/50 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {video.transcript}
                    </p>
                  </div>
                </div>
              )}

              {/* View on Instagram Button */}
              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(video.source_url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Instagram
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
