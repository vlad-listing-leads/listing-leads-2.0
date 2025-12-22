'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Instagram,
  Search,
  Heart,
  MessageCircle,
  X,
  ExternalLink,
  Volume2,
  VolumeX,
  Play,
  ChevronUp,
  Loader2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ShortVideo, ShortVideoCategory, ShortVideoCreator } from '@/types/short-video'

type SortOption = 'latest' | 'oldest' | 'duration'

const ITEMS_PER_PAGE = 24

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1d'
  if (diffDays < 7) return `${diffDays}d`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo`
  return `${Math.floor(diffDays / 365)}y`
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Reel Card Component
function ReelCard({
  video,
  onClick,
}: {
  video: ShortVideo
  onClick: () => void
}) {
  return (
    <div className="group cursor-pointer" onClick={onClick}>
      {/* Header: Creator info */}
      <div className="flex items-center gap-2 mb-2">
        {video.creator?.avatar_url ? (
          <img
            src={video.creator.avatar_url}
            alt={video.creator.name}
            loading="lazy"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-pink-500/30"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {video.creator?.name?.charAt(0) || 'R'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-foreground truncate">
              {video.creator?.handle || 'reels'}
            </span>
            <span className="text-xs text-muted-foreground">
              · {formatTimeAgo(video.date_posted)}
            </span>
          </div>
        </div>
      </div>

      {/* Video Cover with Caption Overlay */}
      <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-muted group-hover:ring-2 ring-primary/50 transition-all">
        {video.cover_url ? (
          <img
            src={video.cover_url}
            alt={video.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : video.video_url ? (
          <video
            src={video.video_url}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-950 dark:to-purple-950">
            <Instagram className="w-12 h-12 text-pink-500/50" />
          </div>
        )}

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Duration badge */}
        {video.video_runtime && (
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
            {formatDuration(video.video_runtime)}
          </div>
        )}

        {/* Caption overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
          <p className="text-white text-sm line-clamp-2">
            {video.name || video.description?.slice(0, 100) || 'View reel'}
          </p>
        </div>
      </div>

      {/* Footer: Engagement stats (placeholder - we don't have real stats) */}
      <div className="flex items-center gap-4 mt-2 text-muted-foreground">
        <span className="flex items-center gap-1 text-sm">
          <Heart className="w-4 h-4" />
          <span className="text-xs">{Math.floor(Math.random() * 900 + 100)}</span>
        </span>
        <span className="flex items-center gap-1 text-sm">
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs">{Math.floor(Math.random() * 100 + 10)}</span>
        </span>
      </div>
    </div>
  )
}

// Reel Detail Modal Component
function ReelModal({
  video,
  onClose,
}: {
  video: ShortVideo
  onClose: () => void
}) {
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)

  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    const videoEl = e.currentTarget
    if (videoEl.paused) {
      videoEl.play()
      setIsPlaying(true)
    } else {
      videoEl.pause()
      setIsPlaying(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-background rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
        {/* Left: Video Player */}
        <div className="relative bg-black flex-shrink-0 md:w-[400px] aspect-[9/16] md:aspect-auto md:h-[80vh]">
          {video.video_url ? (
            <>
              <video
                src={video.video_url}
                className="w-full h-full object-contain"
                muted={isMuted}
                loop
                playsInline
                onClick={handleVideoClick}
              />
              {/* Mute toggle */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              {/* Play/pause indicator */}
              {!isPlaying && (
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

        {/* Right: Details */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {video.creator?.avatar_url ? (
                  <img
                    src={video.creator.avatar_url}
                    alt={video.creator.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {video.creator?.name?.charAt(0) || 'R'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{video.creator?.name || 'Creator'}</span>
                    <span className="text-muted-foreground">@{video.creator?.handle || 'handle'}</span>
                  </div>
                  {video.creator?.location && (
                    <p className="text-sm text-muted-foreground">{video.creator.location}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Category */}
            {video.category && (
              <span className="inline-flex items-center px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-sm rounded-full">
                {video.category.name}
              </span>
            )}

            {/* Title/Description */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">{video.name}</h2>
              {video.description && (
                <p className="text-muted-foreground whitespace-pre-wrap">{video.description}</p>
              )}
            </div>

            {/* AI Summary */}
            {video.ai_summary && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-foreground mb-2">AI Summary</h3>
                <p className="text-sm text-muted-foreground">{video.ai_summary}</p>
              </div>
            )}

            {/* Hook */}
            {video.hook_text && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <h3 className="text-sm font-medium text-foreground mb-2">Opening Hook</h3>
                <p className="text-sm text-muted-foreground">&quot;{video.hook_text}&quot;</p>
              </div>
            )}

            {/* CTA */}
            {video.cta && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="text-sm font-medium text-foreground mb-2">Call to Action</h3>
                <p className="text-sm text-muted-foreground">{video.cta}</p>
              </div>
            )}

            {/* Triggers */}
            {video.triggers && video.triggers.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">Psychological Triggers</h3>
                <div className="flex flex-wrap gap-2">
                  {video.triggers.map((trigger) => (
                    <span
                      key={trigger.id}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                    >
                      {trigger.emoji} {trigger.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Power Words */}
            {video.power_words && video.power_words.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">Power Words</h3>
                <div className="flex flex-wrap gap-2">
                  {video.power_words.map((word) => (
                    <span
                      key={word.id}
                      className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full"
                    >
                      {word.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Transcript */}
            {video.transcript && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">Transcript</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-3">
                  {video.transcript}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            {video.source_url && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(video.source_url, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Instagram
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InstagramReelsPage() {
  const [videos, setVideos] = useState<ShortVideo[]>([])
  const [categories, setCategories] = useState<ShortVideoCategory[]>([])
  const [creators, setCreators] = useState<ShortVideoCreator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [creatorFilter, setCreatorFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('latest')
  const [selectedVideo, setSelectedVideo] = useState<ShortVideo | null>(null)
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([fetchVideos(), fetchCategories(), fetchCreators()])
  }, [])

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE)
  }, [searchQuery, categoryFilter, creatorFilter, sortBy])

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/short-videos/videos?pageSize=500&isActive=true')
      const data = await response.json()
      if (data.videos) {
        setVideos(data.videos)
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/short-videos/categories')
      const data = await response.json()
      if (Array.isArray(data)) setCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchCreators = async () => {
    try {
      const response = await fetch('/api/short-videos/creators')
      const data = await response.json()
      if (Array.isArray(data)) setCreators(data)
    } catch (error) {
      console.error('Failed to fetch creators:', error)
    }
  }

  const allFilteredVideos = useMemo(() => {
    return videos
      .filter(video => {
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch =
          !searchQuery ||
          video.name?.toLowerCase().includes(searchLower) ||
          video.creator?.name?.toLowerCase().includes(searchLower) ||
          video.creator?.handle?.toLowerCase().includes(searchLower) ||
          video.description?.toLowerCase().includes(searchLower) ||
          video.ai_summary?.toLowerCase().includes(searchLower)

        const matchesCategory =
          categoryFilter === 'all' || video.category_id === categoryFilter

        const matchesCreator =
          creatorFilter === 'all' || video.creator_id === creatorFilter

        return matchesSearch && matchesCategory && matchesCreator
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'latest':
            return new Date(b.date_posted || b.created_at || 0).getTime() - new Date(a.date_posted || a.created_at || 0).getTime()
          case 'oldest':
            return new Date(a.date_posted || a.created_at || 0).getTime() - new Date(b.date_posted || b.created_at || 0).getTime()
          case 'duration':
            return (b.video_runtime || 0) - (a.video_runtime || 0)
          default:
            return 0
        }
      })
  }, [videos, searchQuery, categoryFilter, creatorFilter, sortBy])

  // Paginated videos for display
  const filteredVideos = useMemo(() => {
    return allFilteredVideos.slice(0, displayCount)
  }, [allFilteredVideos, displayCount])

  const hasMore = displayCount < allFilteredVideos.length

  // Load more function
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    // Simulate slight delay for smoother UX
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, allFilteredVideos.length))
      setIsLoadingMore(false)
    }, 300)
  }, [isLoadingMore, hasMore, allFilteredVideos.length])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, loadMore])

  return (
    <div className="flex flex-col h-full bg-background">
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Instagram className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Best Instagram Reels</h1>
          </div>
          <p className="text-muted-foreground">
            Top-performing Instagram Reels with AI-analyzed hooks, triggers, and scripts for inspiration.
          </p>
        </div>

        {/* Filters */}
        {!isLoading && videos.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search reels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-[160px]"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </Select>

            <Select
              value={creatorFilter}
              onChange={(e) => setCreatorFilter(e.target.value)}
              className="w-[160px]"
            >
              <option value="all">All Creators</option>
              {creators.map(creator => (
                <option key={creator.id} value={creator.id}>{creator.name}</option>
              ))}
            </Select>

            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-[140px]"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="duration">Longest</option>
            </Select>

            <span className="text-sm text-muted-foreground">
              {filteredVideos.length} of {allFilteredVideos.length} reel{allFilteredVideos.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-950 dark:to-purple-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <Instagram className="w-8 h-8 text-pink-500" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {videos.length === 0 ? 'No reels yet' : 'No matching reels'}
              </h3>
              <p className="text-muted-foreground">
                {videos.length === 0 ? 'Check back later for new content' : 'Try adjusting your search or filters'}
              </p>
            </div>
          </div>
        ) : (
          /* Reels Grid - 4 columns */
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
              {filteredVideos.map(video => (
                <ReelCard
                  key={video.id}
                  video={video}
                  onClick={() => setSelectedVideo(video)}
                />
              ))}
            </div>

            {/* Load More Trigger */}
            {hasMore && (
              <div
                ref={loadMoreRef}
                className="flex justify-center py-8"
              >
                {isLoadingMore ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading more...</span>
                  </div>
                ) : (
                  <Button variant="outline" onClick={loadMore}>
                    Load More
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Detail Modal */}
      {selectedVideo && (
        <ReelModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  )
}
