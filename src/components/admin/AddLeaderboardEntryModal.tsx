'use client'

import { useState, useEffect } from 'react'
import { LeaderboardType, VideoSearchResult, CreatorSearchResult } from '@/types/leaderboard'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Search, Instagram, Youtube, Check, Users } from 'lucide-react'

interface AddLeaderboardEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  leaderboardType: LeaderboardType
  monthYear?: string
}

type ModalTab = 'videos' | 'creators'

export default function AddLeaderboardEntryModal({
  isOpen,
  onClose,
  onSuccess,
  leaderboardType,
  monthYear,
}: AddLeaderboardEntryModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('videos')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Video search results
  const [videoResults, setVideoResults] = useState<VideoSearchResult[]>([])
  // Creator search results
  const [creatorResults, setCreatorResults] = useState<CreatorSearchResult[]>([])

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setVideoResults([])
      setCreatorResults([])
      return
    }

    const timer = setTimeout(() => {
      if (activeTab === 'videos') {
        searchVideos(searchQuery)
      } else {
        searchCreators(searchQuery)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, activeTab])

  const searchVideos = async (query: string) => {
    setIsSearching(true)
    setError(null)
    try {
      // Search both short_videos and youtube_videos
      const [shortVideosRes, youtubeVideosRes] = await Promise.all([
        fetch(`/api/short-videos/videos?search=${encodeURIComponent(query)}&pageSize=10`),
        fetch(`/api/youtube/videos?search=${encodeURIComponent(query)}&limit=10`),
      ])

      const [shortVideosData, youtubeVideosData] = await Promise.all([
        shortVideosRes.json(),
        youtubeVideosRes.json(),
      ])

      const results: VideoSearchResult[] = []

      // Add Instagram videos
      if (shortVideosData.videos) {
        for (const video of shortVideosData.videos) {
          results.push({
            id: video.id,
            type: 'instagram',
            title: video.name || 'Untitled',
            thumbnail_url: video.cover_url || null,
            creator_name: video.creator?.name || null,
            platform: video.platform || 'instagram',
            source_url: video.source_url,
            already_in_leaderboard: false, // TODO: Check against existing entries
          })
        }
      }

      // Add YouTube videos
      if (youtubeVideosData.videos) {
        for (const video of youtubeVideosData.videos) {
          results.push({
            id: video.id,
            type: 'youtube',
            title: video.name || 'Untitled',
            thumbnail_url: video.thumbnail_url || null,
            creator_name: video.creator?.name || null,
            platform: 'youtube',
            source_url: video.youtube_url,
            already_in_leaderboard: false,
          })
        }
      }

      setVideoResults(results)
    } catch (err) {
      console.error('Search error:', err)
      setError('Failed to search videos')
    } finally {
      setIsSearching(false)
    }
  }

  const searchCreators = async (query: string) => {
    setIsSearching(true)
    setError(null)
    try {
      // Search both short_video_creators and video_creators
      const [shortCreatorsRes, youtubeCreatorsRes] = await Promise.all([
        fetch(`/api/short-videos/creators?search=${encodeURIComponent(query)}`),
        fetch(`/api/youtube/creators?search=${encodeURIComponent(query)}`),
      ])

      const [shortCreatorsData, youtubeCreatorsData] = await Promise.all([
        shortCreatorsRes.json(),
        youtubeCreatorsRes.json(),
      ])

      const results: CreatorSearchResult[] = []

      // Add Instagram creators
      if (shortCreatorsData.creators) {
        for (const creator of shortCreatorsData.creators) {
          results.push({
            id: creator.id,
            type: 'instagram',
            name: creator.name,
            avatar_url: creator.avatar_url || null,
            handle: creator.handle || null,
            location: creator.location || null,
            already_featured: false,
          })
        }
      }

      // Add YouTube creators
      if (youtubeCreatorsData.creators) {
        for (const creator of youtubeCreatorsData.creators) {
          results.push({
            id: creator.id,
            type: 'youtube',
            name: creator.name,
            avatar_url: creator.image_url || null,
            handle: null,
            location: creator.location || null,
            already_featured: false,
          })
        }
      }

      setCreatorResults(results)
    } catch (err) {
      console.error('Search error:', err)
      setError('Failed to search creators')
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddVideo = async (video: VideoSearchResult) => {
    setIsAdding(video.id)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        leaderboard_type: leaderboardType,
      }

      if (video.type === 'instagram') {
        body.short_video_id = video.id
      } else {
        body.youtube_video_id = video.id
      }

      if (leaderboardType === 'monthly' && monthYear) {
        body.month_year = monthYear
      }

      const response = await fetch('/api/leaderboard/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add video')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add video')
    } finally {
      setIsAdding(null)
    }
  }

  const handleAddCreator = async (creator: CreatorSearchResult) => {
    setIsAdding(creator.id)
    setError(null)
    try {
      const body: Record<string, unknown> = {}

      if (creator.type === 'instagram') {
        body.short_video_creator_id = creator.id
      } else {
        body.video_creator_id = creator.id
      }

      const response = await fetch('/api/leaderboard/featured-creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add creator')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add creator')
    } finally {
      setIsAdding(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Add to Leaderboard
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-4 pb-0">
          <button
            onClick={() => {
              setActiveTab('videos')
              setSearchQuery('')
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'videos'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            Videos
          </button>
          <button
            onClick={() => {
              setActiveTab('creators')
              setSearchQuery('')
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'creators'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            Featured Creators
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'videos' ? 'Search videos...' : 'Search creators...'}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

        {error && (
          <div className="mx-4 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-auto p-4 pt-0">
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : activeTab === 'videos' ? (
            videoResults.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                {searchQuery ? 'No videos found' : 'Start typing to search videos'}
              </p>
            ) : (
              <div className="space-y-2">
                {videoResults.map((video) => (
                  <div
                    key={`${video.type}-${video.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="w-20 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0 relative">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {video.type === 'instagram' ? (
                            <Instagram className="w-6 h-6 text-muted-foreground" />
                          ) : (
                            <Youtube className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      <div className="absolute top-1 left-1">
                        {video.type === 'instagram' ? (
                          <Instagram className="w-3.5 h-3.5 text-white drop-shadow" />
                        ) : (
                          <Youtube className="w-3.5 h-3.5 text-white drop-shadow" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {video.title}
                      </div>
                      {video.creator_name && (
                        <div className="text-xs text-muted-foreground">
                          {video.creator_name}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddVideo(video)}
                      disabled={isAdding === video.id || video.already_in_leaderboard}
                    >
                      {isAdding === video.id ? (
                        <Spinner size="sm" />
                      ) : video.already_in_leaderboard ? (
                        <>
                          <Check className="w-4 h-4" />
                          Added
                        </>
                      ) : (
                        'Add'
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )
          ) : creatorResults.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              {searchQuery ? 'No creators found' : 'Start typing to search creators'}
            </p>
          ) : (
            <div className="space-y-2">
              {creatorResults.map((creator) => (
                <div
                  key={`${creator.type}-${creator.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex-shrink-0">
                    {creator.avatar_url ? (
                      <img
                        src={creator.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {creator.name}
                      </span>
                      {creator.type === 'instagram' ? (
                        <Instagram className="w-3.5 h-3.5 text-muted-foreground" />
                      ) : (
                        <Youtube className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </div>
                    {creator.handle && (
                      <div className="text-xs text-muted-foreground">@{creator.handle}</div>
                    )}
                    {creator.location && (
                      <div className="text-xs text-muted-foreground">{creator.location}</div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddCreator(creator)}
                    disabled={isAdding === creator.id || creator.already_featured}
                  >
                    {isAdding === creator.id ? (
                      <Spinner size="sm" />
                    ) : creator.already_featured ? (
                      <>
                        <Check className="w-4 h-4" />
                        Added
                      </>
                    ) : (
                      'Add'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
