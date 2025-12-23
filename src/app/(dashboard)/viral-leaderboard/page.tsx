'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Trophy,
  Instagram,
  Youtube,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Play,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Users,
  TrendingUp,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { LeaderboardEntryDisplay, FeaturedCreatorDisplay, LeaderboardType } from '@/types/leaderboard'
import { formatEngagementNumber } from '@/lib/engagement-fetcher'

// Format date for display
function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

// Leaderboard Entry Card - Instagram style
function LeaderboardEntryCard({ entry }: { entry: LeaderboardEntryDisplay }) {
  const metrics = entry.cached_engagement || { views: null, likes: null, comments: null }
  const totalEngagement = (metrics.views || 0) + (metrics.likes || 0) + (metrics.comments || 0)

  // Build link based on video type
  const videoLink = entry.video_type === 'instagram'
    ? `/social/instagram-reels/${entry.short_video?.slug}`
    : `/social/youtube-videos/${entry.youtube_video?.slug}`

  const sourceUrl = entry.source_url || '#'

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {/* Creator avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
            {entry.creator_avatar ? (
              <Image
                src={entry.creator_avatar}
                alt={entry.creator_name || ''}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground">
                {entry.creator_handle ? `@${entry.creator_handle}` : entry.creator_name || 'Unknown'}
              </span>
              <Link
                href={videoLink}
                className="text-xs bg-muted hover:bg-muted/80 px-2.5 py-1 rounded-md font-medium transition-colors"
              >
                View profile
              </Link>
            </div>
            {entry.creator_location && (
              <span className="text-xs text-muted-foreground">{entry.creator_location}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Engagement badge */}
          <div className="flex items-center gap-1.5 text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">
              {formatEngagementNumber(totalEngagement)} Engagement
            </span>
          </div>

          {/* Date */}
          <span className="text-sm text-muted-foreground">
            {formatDate(entry.date_posted)}
          </span>
        </div>
      </div>

      {/* Title & Creator attribution */}
      <div className="px-4 pb-3">
        <h3 className="font-semibold text-foreground mb-2">{entry.title}</h3>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-muted">
            {entry.creator_avatar ? (
              <Image
                src={entry.creator_avatar}
                alt=""
                width={24}
                height={24}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Users className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
          </div>
          <span className="text-sm text-foreground">
            {entry.creator_name || 'Unknown'}
          </span>
          <span className="text-sm text-muted-foreground">
            {entry.creator_handle ? `@${entry.creator_handle}` : ''}
          </span>
        </div>
      </div>

      {/* Video embed area */}
      <Link href={videoLink} className="block relative">
        <div className="relative aspect-[4/5] bg-black">
          {entry.thumbnail_url ? (
            <Image
              src={entry.thumbnail_url}
              alt={entry.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
              {entry.video_type === 'instagram' ? (
                <Instagram className="w-16 h-16 text-muted-foreground/50" />
              ) : (
                <Youtube className="w-16 h-16 text-muted-foreground/50" />
              )}
            </div>
          )}

          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Play className="w-8 h-8 text-white ml-1" fill="white" />
            </div>
          </div>

          {/* Watch on Instagram/YouTube badge */}
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-white text-xs flex items-center gap-1.5">
            {entry.video_type === 'instagram' ? (
              <>
                <Instagram className="w-3 h-3" />
                Watch on Instagram
              </>
            ) : (
              <>
                <Youtube className="w-3 h-3" />
                Watch on YouTube
              </>
            )}
          </div>
        </div>
      </Link>

      {/* View more link */}
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block px-4 py-2 text-sm text-blue-500 hover:text-blue-600 transition-colors"
      >
        View more on {entry.video_type === 'instagram' ? 'Instagram' : 'YouTube'}
      </a>

      {/* Action buttons */}
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="hover:text-red-500 transition-colors">
            <Heart className="w-6 h-6" />
          </button>
          <button className="hover:text-foreground transition-colors">
            <MessageCircle className="w-6 h-6" />
          </button>
          <button className="hover:text-foreground transition-colors">
            <Send className="w-6 h-6" />
          </button>
        </div>
        <button className="hover:text-foreground transition-colors">
          <Bookmark className="w-6 h-6" />
        </button>
      </div>

      {/* Likes count */}
      <div className="px-4 pb-2">
        <span className="font-semibold text-sm">
          {formatEngagementNumber(metrics.likes)} likes
        </span>
      </div>

      {/* Add comment */}
      <div className="px-4 pb-3">
        <span className="text-sm text-muted-foreground">Add a comment...</span>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        {entry.video_type === 'instagram' ? (
          <Instagram className="w-5 h-5 text-muted-foreground" />
        ) : (
          <Youtube className="w-5 h-5 text-muted-foreground" />
        )}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {entry.video_type === 'instagram' ? (
            <Instagram className="w-4 h-4" />
          ) : (
            <Youtube className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {entry.video_type === 'instagram' ? 'Reel' : 'Video'}
          </span>
        </div>
      </div>
    </div>
  )
}

// Featured Creator Card
function FeaturedCreatorCard({
  creator,
  rank,
}: {
  creator: FeaturedCreatorDisplay
  rank: number
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      {/* Rank */}
      <span className="w-5 text-sm font-medium text-muted-foreground">
        {rank}
      </span>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-muted">
        {creator.avatar_url ? (
          <Image
            src={creator.avatar_url}
            alt={creator.name}
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-foreground truncate">
          {creator.name}
        </div>
        {creator.location && (
          <span className="text-xs text-muted-foreground">{creator.location}</span>
        )}
      </div>
    </div>
  )
}

export default function ViralLeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('monthly')
  const [entries, setEntries] = useState<LeaderboardEntryDisplay[]>([])
  const [creators, setCreators] = useState<FeaturedCreatorDisplay[]>([])
  const [isLoadingEntries, setIsLoadingEntries] = useState(true)
  const [isLoadingCreators, setIsLoadingCreators] = useState(true)
  const [page, setPage] = useState(1)
  const entriesPerPage = 10

  // Fetch entries
  useEffect(() => {
    const fetchEntries = async () => {
      setIsLoadingEntries(true)
      try {
        const params = new URLSearchParams({
          leaderboard_type: activeTab,
        })
        if (activeTab === 'monthly') {
          const now = new Date()
          params.set('month_year', `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
        }

        const response = await fetch(`/api/leaderboard/entries?${params}`)
        const data = await response.json()

        if (data.entries) {
          setEntries(data.entries)
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard entries:', error)
      } finally {
        setIsLoadingEntries(false)
      }
    }

    fetchEntries()
    setPage(1)
  }, [activeTab])

  // Fetch featured creators
  useEffect(() => {
    const fetchCreators = async () => {
      setIsLoadingCreators(true)
      try {
        const response = await fetch('/api/leaderboard/featured-creators')
        const data = await response.json()

        if (data.creators) {
          setCreators(data.creators)
        }
      } catch (error) {
        console.error('Failed to fetch featured creators:', error)
      } finally {
        setIsLoadingCreators(false)
      }
    }

    fetchCreators()
  }, [])

  // Pagination
  const totalPages = Math.ceil(entries.length / entriesPerPage)
  const paginatedEntries = entries.slice(
    (page - 1) * entriesPerPage,
    page * entriesPerPage
  )

  return (
    <div className="flex flex-col h-full bg-background">
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Viral Leaderboard</h1>
        </div>

        <div className="flex gap-8">
          {/* Main content */}
          <div className="flex-1 max-w-2xl">
            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setActiveTab('monthly')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'monthly'
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setActiveTab('staff_picks')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'staff_picks'
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Staff Picks
              </button>
            </div>

            {/* Loading */}
            {isLoadingEntries ? (
              <div className="flex items-center justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-xl border border-border">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No entries yet
                </h3>
                <p className="text-muted-foreground">
                  {activeTab === 'monthly'
                    ? 'Check back soon for this month\'s top videos!'
                    : 'Staff picks coming soon!'}
                </p>
              </div>
            ) : (
              <>
                {/* Entries list */}
                <div className="space-y-6">
                  {paginatedEntries.map((entry) => (
                    <LeaderboardEntryCard key={entry.id} entry={entry} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-4">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Featured Creators Sidebar */}
          <div className="w-64 flex-shrink-0 hidden lg:block">
            <div className="sticky top-4">
              <h2 className="font-semibold text-foreground mb-4">Featured Creators</h2>

              {isLoadingCreators ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : creators.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No featured creators yet
                </p>
              ) : (
                <div className="space-y-1">
                  {creators.slice(0, 6).map((creator, index) => (
                    <FeaturedCreatorCard
                      key={creator.id}
                      creator={creator}
                      rank={index + 1}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
