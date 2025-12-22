'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Megaphone,
  Search,
  Star,
  Loader2,
  Building2,
  Heart,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Ad, AdCompany, AdTag } from '@/types/ad'

type SortOption = 'latest' | 'oldest' | 'rating'

const ITEMS_PER_PAGE = 24

// Platform icons
function MetaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
    </svg>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

// Ad Card Component
function AdCard({
  ad,
  isFavorite,
  onToggleFavorite,
}: {
  ad: Ad
  isFavorite: boolean
  onToggleFavorite: (e: React.MouseEvent) => void
}) {
  return (
    <Link
      href={`/social/best-ads/${ad.slug}`}
      className="group cursor-pointer bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all break-inside-avoid mb-6 block"
    >
      {/* Ad Image - natural aspect ratio */}
      <div className="relative bg-muted">
        {ad.image_url ? (
          <img
            src={ad.image_url}
            alt={ad.name}
            loading="lazy"
            className="w-full h-auto"
          />
        ) : (
          <div className="w-full aspect-square flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <Megaphone className="w-12 h-12 text-blue-500/50" />
          </div>
        )}

        {/* Top right: Rating and Favorite - aligned vertically */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          {ad.rating > 0 && (
            <div className="h-7 bg-black/60 text-white text-xs px-2 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {ad.rating.toFixed(1)}
            </div>
          )}
          <button
            onClick={onToggleFavorite}
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center transition-all",
              isFavorite
                ? "bg-red-500 text-white"
                : "bg-black/60 text-white hover:bg-black/80"
            )}
          >
            <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
          </button>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Channel badge + Company */}
        <div className="flex items-center gap-2 mb-2">
          <div className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 shrink-0",
            ad.channel === 'meta'
              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          )}>
            {ad.channel === 'meta' ? (
              <MetaIcon className="w-3 h-3" />
            ) : (
              <GoogleIcon className="w-3 h-3" />
            )}
            {ad.channel === 'meta' ? 'Meta' : 'Google'}
          </div>
          {ad.company && (
            <div className="flex items-center gap-1.5 min-w-0">
              {ad.company.icon_url ? (
                <Image
                  src={ad.company.icon_url}
                  alt={ad.company.name}
                  width={16}
                  height={16}
                  className="rounded object-contain bg-white shrink-0"
                />
              ) : (
                <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <span className="text-xs text-muted-foreground truncate">
                {ad.company.name}
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-medium text-foreground line-clamp-2 text-sm mb-2">
          {ad.name}
        </h3>

        {/* Tags */}
        {ad.tags && ad.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ad.tags.slice(0, 2).map(tag => (
              <span
                key={tag.id}
                className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
              >
                {tag.name}
              </span>
            ))}
            {ad.tags.length > 2 && (
              <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                +{ad.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

export default function BestAdsPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [companies, setCompanies] = useState<AdCompany[]>([])
  const [tags, setTags] = useState<AdTag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [companyFilter, setCompanyFilter] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('latest')
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([fetchAds(), fetchCompanies(), fetchTags(), fetchFavorites()])
  }, [])

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE)
  }, [searchQuery, channelFilter, companyFilter, tagFilter, sortBy])

  const fetchAds = async () => {
    try {
      const response = await fetch('/api/ads?pageSize=500&isActive=true')
      const data = await response.json()
      if (data.ads) {
        setAds(data.ads)
      }
    } catch (error) {
      console.error('Failed to fetch ads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/ads/companies')
      const data = await response.json()
      if (Array.isArray(data)) setCompanies(data)
    } catch (error) {
      console.error('Failed to fetch companies:', error)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/ads/tags')
      const data = await response.json()
      if (Array.isArray(data)) setTags(data)
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites')
      const data = await response.json()
      if (data.favorites) {
        const adFavorites = data.favorites
          .filter((f: { category: string; id: string }) => f.category === 'ads')
          .map((f: { category: string; id: string }) => f.id)
        setFavoriteIds(new Set(adFavorites))
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error)
    }
  }

  const toggleFavorite = async (adId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const isFavorite = favoriteIds.has(adId)

    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev)
      if (isFavorite) {
        next.delete(adId)
      } else {
        next.add(adId)
      }
      return next
    })

    try {
      if (isFavorite) {
        await fetch(`/api/favorites?campaignId=${adId}&category=ads`, {
          method: 'DELETE',
        })
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId: adId, category: 'ads' }),
        })
      }
    } catch (error) {
      // Revert on error
      setFavoriteIds(prev => {
        const next = new Set(prev)
        if (isFavorite) {
          next.add(adId)
        } else {
          next.delete(adId)
        }
        return next
      })
      console.error('Failed to toggle favorite:', error)
    }
  }

  const allFilteredAds = useMemo(() => {
    return ads
      .filter(ad => {
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch =
          !searchQuery ||
          ad.name?.toLowerCase().includes(searchLower) ||
          ad.company?.name?.toLowerCase().includes(searchLower) ||
          ad.description?.toLowerCase().includes(searchLower)

        const matchesChannel =
          channelFilter === 'all' || ad.channel === channelFilter

        const matchesCompany =
          companyFilter === 'all' || ad.company_id === companyFilter

        const matchesTag =
          tagFilter === 'all' ||
          ad.tags?.some(tag => tag.id === tagFilter)

        return matchesSearch && matchesChannel && matchesCompany && matchesTag
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'latest':
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          case 'oldest':
            return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
          case 'rating':
            return (b.rating || 0) - (a.rating || 0)
          default:
            return 0
        }
      })
  }, [ads, searchQuery, channelFilter, companyFilter, tagFilter, sortBy])

  // Paginated ads for display
  const filteredAds = useMemo(() => {
    return allFilteredAds.slice(0, displayCount)
  }, [allFilteredAds, displayCount])

  const hasMore = displayCount < allFilteredAds.length

  // Load more function
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, allFilteredAds.length))
      setIsLoadingMore(false)
    }, 300)
  }, [isLoadingMore, hasMore, allFilteredAds.length])

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
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Best Ads</h1>
          </div>
          <p className="text-muted-foreground">
            Top-performing real estate ads from Meta and Google for inspiration.
          </p>
        </div>

        {/* Filters */}
        {!isLoading && ads.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search ads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="w-[140px]"
            >
              <option value="all">All Channels</option>
              <option value="meta">Meta Ads</option>
              <option value="google">Google Ads</option>
            </Select>

            <Select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="w-[180px]"
            >
              <option value="all">All Companies</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </Select>

            <Select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-[160px]"
            >
              <option value="all">All Tags</option>
              {tags.map(tag => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </Select>

            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-[140px]"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="rating">Top Rated</option>
            </Select>

            <span className="text-sm text-muted-foreground">
              {filteredAds.length} of {allFilteredAds.length} ad{allFilteredAds.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden mb-6 break-inside-avoid">
                <div className="bg-muted animate-pulse" style={{ aspectRatio: [1, 1.2, 0.8, 1.5, 1][i % 5] }} />
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-12 bg-muted animate-pulse rounded-full" />
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAds.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <Megaphone className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {ads.length === 0 ? 'No ads yet' : 'No matching ads'}
              </h3>
              <p className="text-muted-foreground">
                {ads.length === 0 ? 'Check back later for new content' : 'Try adjusting your search or filters'}
              </p>
            </div>
          </div>
        ) : (
          /* Ads Masonry Grid */
          <>
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6">
              {filteredAds.map(ad => (
                <AdCard
                  key={ad.id}
                  ad={ad}
                  isFavorite={favoriteIds.has(ad.id)}
                  onToggleFavorite={(e) => toggleFavorite(ad.id, e)}
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
