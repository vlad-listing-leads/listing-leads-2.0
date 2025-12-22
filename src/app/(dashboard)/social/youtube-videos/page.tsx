'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Youtube,
  Search,
  Clock,
  Eye,
  ExternalLink,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { YouTubeVideo, VideoCategory, VideoCreator } from '@/types/youtube'
import { formatDuration } from '@/lib/supadata'

type SortOption = 'latest' | 'oldest' | 'views' | 'duration'

export default function YouTubeVideosPage() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [categories, setCategories] = useState<VideoCategory[]>([])
  const [creators, setCreators] = useState<VideoCreator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [creatorFilter, setCreatorFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('latest')
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchVideos(), fetchCategories(), fetchCreators()])
  }, [])

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/youtube/videos')
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
      const response = await fetch('/api/youtube/categories')
      const data = await response.json()
      if (data.categories) setCategories(data.categories)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchCreators = async () => {
    try {
      const response = await fetch('/api/youtube/creators')
      const data = await response.json()
      if (data.creators) setCreators(data.creators)
    } catch (error) {
      console.error('Failed to fetch creators:', error)
    }
  }

  const filteredVideos = useMemo(() => {
    return videos
      .filter(video => {
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch =
          !searchQuery ||
          video.name?.toLowerCase().includes(searchLower) ||
          video.creator?.name?.toLowerCase().includes(searchLower) ||
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
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          case 'oldest':
            return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
          case 'views':
            return (b.view_count || 0) - (a.view_count || 0)
          case 'duration':
            return (b.video_runtime || 0) - (a.video_runtime || 0)
          default:
            return 0
        }
      })
  }, [videos, searchQuery, categoryFilter, creatorFilter, sortBy])

  const toggleExpand = (videoId: string) => {
    setExpandedVideoId(expandedVideoId === videoId ? null : videoId)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Youtube className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Best YouTube Videos</h1>
          </div>
          <p className="text-muted-foreground">
            Curated YouTube videos with AI-analyzed hooks, triggers, and power words for inspiration.
          </p>
        </div>

        {/* Filters */}
        {!isLoading && videos.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
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
              <option value="views">Most Views</option>
              <option value="duration">Longest</option>
            </Select>

            <span className="text-sm text-muted-foreground">
              {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
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
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Youtube className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {videos.length === 0 ? 'No videos yet' : 'No matching videos'}
              </h3>
              <p className="text-muted-foreground">
                {videos.length === 0 ? 'Check back later for new content' : 'Try adjusting your search or filters'}
              </p>
            </div>
          </div>
        ) : (
          /* Video Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map(video => (
              <div
                key={video.id}
                className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Youtube className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  {/* Duration badge */}
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.video_runtime || 0)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground line-clamp-2 mb-2">
                    {video.name}
                  </h3>

                  {/* Creator & Category */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <span>{video.creator?.name || 'Unknown Creator'}</span>
                    {video.category && (
                      <>
                        <span>•</span>
                        <span className="text-primary">{video.category.name}</span>
                      </>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {(video.view_count || 0).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(video.video_runtime || 0)}
                    </span>
                  </div>

                  {/* AI Summary Preview */}
                  {video.ai_summary && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {video.ai_summary}
                    </p>
                  )}

                  {/* Triggers & Power Words Preview */}
                  {((video.triggers && video.triggers.length > 0) ||
                    (video.power_words && video.power_words.length > 0)) && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {video.triggers?.slice(0, 3).map(trigger => (
                        <span
                          key={trigger.id}
                          className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                        >
                          {trigger.emoji} {trigger.name}
                        </span>
                      ))}
                      {video.power_words?.slice(0, 2).map(word => (
                        <span
                          key={word.id}
                          className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full"
                        >
                          {word.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleExpand(video.id)}
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    {expandedVideoId === video.id ? (
                      <>
                        Show less <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Show more <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Expanded Content */}
                  {expandedVideoId === video.id && (
                    <div className="mt-4 pt-4 border-t border-border space-y-4">
                      {/* Hook */}
                      {video.hook?.hook_text && (
                        <div>
                          <h4 className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">
                            <Sparkles className="w-4 h-4 text-yellow-500" />
                            Opening Hook
                          </h4>
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                            &quot;{video.hook.hook_text}&quot;
                          </p>
                        </div>
                      )}

                      {/* CTA */}
                      {video.cta && (
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-1">
                            Call to Action
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {video.cta}
                          </p>
                        </div>
                      )}

                      {/* All Triggers */}
                      {video.triggers && video.triggers.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-2">
                            Psychological Triggers
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {video.triggers.map(trigger => (
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

                      {/* All Power Words */}
                      {video.power_words && video.power_words.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-2">
                            Power Words
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {video.power_words.map(word => (
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

                      {/* Watch on YouTube */}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(video.youtube_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Watch on YouTube
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
