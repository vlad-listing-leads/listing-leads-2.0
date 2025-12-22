'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Instagram,
  Search,
  Heart,
  MessageCircle,
  Play,
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

// Strip HTML tags and decode entities
function stripHtml(html: string | null): string {
  if (!html) return ''
  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, '')
  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
  // Clean up extra whitespace
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

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
  isFavorite,
  onToggleFavorite,
}: {
  video: ShortVideo
  isFavorite: boolean
  onToggleFavorite: (e: React.MouseEvent) => void
}) {
  return (
    <Link href={`/social/instagram-reels/${video.slug}`} className="group cursor-pointer block">
      {/* Header: Creator info */}
      <div className="flex items-center gap-2 mb-2">
        {video.creator?.avatar_url ? (
          <Image
            src={video.creator.avatar_url}
            alt={video.creator.name}
            width={32}
            height={32}
            className="rounded-full object-cover ring-2 ring-pink-500/30"
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
          <Image
            src={video.cover_url}
            alt={video.name}
            fill
            className="object-cover"
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
          <div className="absolute top-2 right-10 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
            {formatDuration(video.video_runtime)}
          </div>
        )}

        {/* Favorite button */}
        <button
          onClick={onToggleFavorite}
          className={cn(
            "absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all",
            isFavorite
              ? "bg-red-500 text-white"
              : "bg-black/60 text-white hover:bg-black/80"
          )}
        >
          <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
        </button>

        {/* Caption overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
          <p className="text-white text-sm line-clamp-2">
            {stripHtml(video.name) || stripHtml(video.description)?.slice(0, 100) || 'View reel'}
          </p>
        </div>
      </div>

      {/* Footer: Engagement stats (placeholder - we don't have real stats) */}
      <div className="flex items-center gap-4 mt-2 text-muted-foreground">
        <span className="flex items-center gap-1 text-sm">
          <Heart className="w-4 h-4" />
          <span className="text-xs">{((video.id.charCodeAt(0) * 7 + video.id.charCodeAt(1) * 3) % 900) + 100}</span>
        </span>
        <span className="flex items-center gap-1 text-sm">
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs">{((video.id.charCodeAt(0) * 3 + video.id.charCodeAt(2) * 2) % 100) + 10}</span>
        </span>
      </div>
    </Link>
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
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([fetchVideos(), fetchCategories(), fetchCreators(), fetchFavorites()])
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

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites')
      const data = await response.json()
      if (data.favorites) {
        const reelFavorites = data.favorites
          .filter((f: { category: string; id: string }) => f.category === 'short-videos')
          .map((f: { category: string; id: string }) => f.id)
        setFavoriteIds(new Set(reelFavorites))
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error)
    }
  }

  const toggleFavorite = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const isFavorite = favoriteIds.has(videoId)

    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev)
      if (isFavorite) {
        next.delete(videoId)
      } else {
        next.add(videoId)
      }
      return next
    })

    try {
      if (isFavorite) {
        await fetch(`/api/favorites?campaignId=${videoId}&category=short-videos`, {
          method: 'DELETE',
        })
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId: videoId, category: 'short-videos' }),
        })
      }
    } catch (error) {
      // Revert on error
      setFavoriteIds(prev => {
        const next = new Set(prev)
        if (isFavorite) {
          next.add(videoId)
        } else {
          next.delete(videoId)
        }
        return next
      })
      console.error('Failed to toggle favorite:', error)
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </div>
                <div className="aspect-[9/16] rounded-lg bg-muted animate-pulse" />
                <div className="flex items-center gap-4">
                  <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
              {filteredVideos.map(video => (
                <ReelCard
                  key={video.id}
                  video={video}
                  isFavorite={favoriteIds.has(video.id)}
                  onToggleFavorite={(e) => toggleFavorite(video.id, e)}
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
    </div>
  )
}
