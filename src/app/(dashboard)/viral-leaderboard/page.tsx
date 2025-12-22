'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Trophy,
  Instagram,
  Youtube,
  Eye,
  Heart,
  MessageCircle,
  Users,
  Play,
  Crown,
  Medal,
  Award,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { LeaderboardEntryDisplay, FeaturedCreatorDisplay, LeaderboardType } from '@/types/leaderboard'
import { formatEngagementNumber } from '@/lib/engagement-fetcher'

// Get rank icon based on position
function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-500" />
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />
    case 3:
      return <Award className="w-5 h-5 text-amber-600" />
    default:
      return null
  }
}

// Get rank background color
function getRankStyles(rank: number): string {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-br from-yellow-400/20 to-amber-500/20 border-yellow-500/30'
    case 2:
      return 'bg-gradient-to-br from-gray-300/20 to-gray-400/20 border-gray-400/30'
    case 3:
      return 'bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-amber-600/30'
    default:
      return 'bg-card border-border'
  }
}

// Leaderboard Entry Card
function LeaderboardCard({
  entry,
  rank,
}: {
  entry: LeaderboardEntryDisplay
  rank: number
}) {
  const metrics = entry.cached_engagement || { views: null, likes: null, comments: null }
  const isTop3 = rank <= 3

  // Build link based on video type
  const videoLink = entry.video_type === 'instagram'
    ? `/social/instagram-reels/${entry.short_video?.slug}`
    : `/social/youtube/${entry.youtube_video?.slug}`

  return (
    <Link href={videoLink} className="block">
      <div
        className={`relative rounded-2xl border overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg ${getRankStyles(rank)}`}
      >
        {/* Video Thumbnail */}
        <div className={`relative ${isTop3 ? 'aspect-video' : 'aspect-[16/10]'}`}>
          {entry.thumbnail_url ? (
            <Image
              src={entry.thumbnail_url}
              alt={entry.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
              {entry.video_type === 'instagram' ? (
                <Instagram className="w-12 h-12 text-muted-foreground/50" />
              ) : (
                <Youtube className="w-12 h-12 text-muted-foreground/50" />
              )}
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" />
            </div>
          </div>

          {/* Platform badge */}
          <div className="absolute top-3 left-3">
            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
              entry.video_type === 'instagram'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                : 'bg-red-600 text-white'
            }`}>
              {entry.video_type === 'instagram' ? (
                <Instagram className="w-3 h-3" />
              ) : (
                <Youtube className="w-3 h-3" />
              )}
              <span className="capitalize">{entry.video_type}</span>
            </div>
          </div>

          {/* Rank badge */}
          <div className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
            isTop3
              ? 'bg-gradient-to-br from-white/90 to-white/70 text-gray-900 shadow-lg'
              : 'bg-black/60 text-white'
          }`}>
            {getRankIcon(rank) || `#${rank}`}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className={`font-semibold text-foreground mb-2 line-clamp-2 ${isTop3 ? 'text-lg' : 'text-base'}`}>
            {entry.title}
          </h3>

          {/* Creator info */}
          <div className="flex items-center gap-2 mb-3">
            {entry.creator_avatar ? (
              <Image
                src={entry.creator_avatar}
                alt={entry.creator_name || ''}
                width={24}
                height={24}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                <Users className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
            <span className="text-sm text-muted-foreground truncate">
              {entry.creator_handle ? `@${entry.creator_handle}` : entry.creator_name || 'Unknown'}
            </span>
          </div>

          {/* Engagement stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1" title="Views">
              <Eye className="w-4 h-4" />
              {formatEngagementNumber(metrics.views)}
            </span>
            <span className="flex items-center gap-1" title="Likes">
              <Heart className="w-4 h-4" />
              {formatEngagementNumber(metrics.likes)}
            </span>
            <span className="flex items-center gap-1" title="Comments">
              <MessageCircle className="w-4 h-4" />
              {formatEngagementNumber(metrics.comments)}
            </span>
          </div>
        </div>
      </div>
    </Link>
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
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors">
      {/* Rank */}
      <span className="w-6 text-center font-bold text-muted-foreground">
        {rank}
      </span>

      {/* Avatar */}
      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-border">
        {creator.avatar_url ? (
          <Image
            src={creator.avatar_url}
            alt={creator.name}
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate">
            {creator.name}
          </span>
          {creator.creator_type === 'instagram' ? (
            <Instagram className="w-3.5 h-3.5 text-pink-500 flex-shrink-0" />
          ) : (
            <Youtube className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          )}
        </div>
        {creator.handle && (
          <span className="text-xs text-muted-foreground">@{creator.handle}</span>
        )}
        {creator.location && (
          <span className="text-xs text-muted-foreground block truncate">
            {creator.location}
          </span>
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

  // Get current month for display
  const currentMonth = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

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

  return (
    <div className="flex flex-col h-full bg-background">
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Viral Leaderboard</h1>
          </div>
          <p className="text-muted-foreground">
            Top-performing real estate videos ranked by engagement and virality.
          </p>
        </div>

        <div className="flex gap-8">
          {/* Main content */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setActiveTab('monthly')}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'monthly'
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
              >
                {currentMonth}
              </button>
              <button
                onClick={() => setActiveTab('staff_picks')}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'staff_picks'
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
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
              <div className="text-center py-20">
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
                {/* Top 3 - Featured layout */}
                {entries.length >= 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* First place - center on desktop */}
                    {entries[0] && (
                      <div className="md:col-start-2 md:row-start-1">
                        <LeaderboardCard entry={entries[0]} rank={1} />
                      </div>
                    )}
                    {/* Second place */}
                    {entries[1] && (
                      <div className="md:col-start-1 md:row-start-1">
                        <LeaderboardCard entry={entries[1]} rank={2} />
                      </div>
                    )}
                    {/* Third place */}
                    {entries[2] && (
                      <div className="md:col-start-3 md:row-start-1">
                        <LeaderboardCard entry={entries[2]} rank={3} />
                      </div>
                    )}
                  </div>
                )}

                {/* Rest of the entries */}
                {entries.length > 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {entries.slice(3).map((entry, index) => (
                      <LeaderboardCard
                        key={entry.id}
                        entry={entry}
                        rank={index + 4}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Featured Creators Sidebar */}
          <div className="w-80 flex-shrink-0 hidden lg:block">
            <div className="bg-card rounded-2xl border border-border p-5 sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Featured Creators</h2>
              </div>

              {isLoadingCreators ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : creators.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No featured creators yet
                </p>
              ) : (
                <div className="space-y-1">
                  {creators.map((creator, index) => (
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
