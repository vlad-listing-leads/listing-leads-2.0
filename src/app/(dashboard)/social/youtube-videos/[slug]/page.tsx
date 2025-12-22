'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Eye,
  ThumbsUp,
  MessageCircle,
  Sparkles,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { YouTubeVideo } from '@/types/youtube'
import { formatDuration } from '@/lib/supadata'

export default function YouTubeVideoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [video, setVideo] = useState<YouTubeVideo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (slug) {
      fetchVideo()
    }
  }, [slug])

  const fetchVideo = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/youtube/videos?slug=${encodeURIComponent(slug)}`)
      const data = await response.json()

      // Handle both new format (single video) and legacy format (videos array)
      if (data.video) {
        setVideo(data.video)
      } else if (data.videos && data.videos.length > 0) {
        setVideo(data.videos[0])
      } else {
        setError('Video not found')
      }
    } catch (err) {
      console.error('Failed to fetch video:', err)
      setError('Failed to load video')
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
        <p className="text-muted-foreground">{error || 'Video not found'}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  // Format numbers with K/M suffix
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link
          href="/social/youtube-videos"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-sm font-medium text-foreground truncate max-w-[60%]">
          {video.name}
        </h1>
        <div className="w-16" /> {/* Spacer for centering */}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: YouTube Embed */}
            <div className="lg:w-1/2">
              <div className="sticky top-6">
                <div className="aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.youtube_id}`}
                    title={video.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>

                {/* Creator info below video */}
                {video.creator && (
                  <div className="flex items-center gap-3 mt-4">
                    {video.creator.image_url ? (
                      <img
                        src={video.creator.image_url}
                        alt={video.creator.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium">
                        {video.creator.name?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{video.creator.name}</p>
                      {video.creator.subscribers > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(video.creator.subscribers)} Subscribers
                        </p>
                      )}
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
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-center lg:justify-start gap-8">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Views</p>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className="text-xl font-semibold text-foreground">
                      {formatNumber(video.view_count || 0)}
                    </span>
                    {video.score && video.greater_sign && (
                      <span className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs rounded">
                        {video.greater_sign}{video.score}x
                      </span>
                    )}
                  </div>
                </div>
                {/* Placeholder for likes - we don't have this data but showing UI */}
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
              {video.video_runtime > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-1">Video Length</h3>
                  <p className="text-muted-foreground">{formatDuration(video.video_runtime)}</p>
                </div>
              )}

              {/* The Hook */}
              {video.hook?.hook_text && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">The Hook</h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-muted-foreground leading-relaxed">
                      {video.hook.hook_text}
                    </p>
                    {/* Triggers for the hook */}
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

              {/* Watch on YouTube Button */}
              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(video.youtube_url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Watch on YouTube
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
