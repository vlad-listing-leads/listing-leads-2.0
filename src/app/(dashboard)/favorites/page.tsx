'use client'

import { useState, useEffect } from 'react'
import { Heart, Trash2, Megaphone, Instagram, Youtube, Building2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { CampaignListCard } from '@/components/campaigns'
import { CampaignCard as CampaignCardType, categoryConfig, CampaignCategory } from '@/types/campaigns'

type ContentType = 'all' | 'campaigns' | 'creator'
type CreatorCategory = 'ads' | 'short-videos' | 'youtube-videos'

// Favorite item interface for type safety
interface FavoriteItem {
  id: string
  category: string
  type: 'campaign' | 'creator'
  name: string
  thumbnail_url?: string | null
  description?: string
  isFavorite?: boolean
  company?: {
    name: string
    icon_url?: string | null
  }
  creator?: {
    name: string
    handle?: string
  }
}

// Creator content config for display
const creatorCategoryConfig: Record<CreatorCategory, { label: string; color: string; icon: React.ReactNode }> = {
  'ads': {
    label: 'Best Ads',
    color: 'bg-blue-500',
    icon: <Megaphone className="w-4 h-4" />,
  },
  'short-videos': {
    label: 'Instagram Reels',
    color: 'bg-pink-500',
    icon: <Instagram className="w-4 h-4" />,
  },
  'youtube-videos': {
    label: 'YouTube Videos',
    color: 'bg-red-500',
    icon: <Youtube className="w-4 h-4" />,
  },
}

// Card for ads
function AdFavoriteCard({ item, onRemove }: { item: FavoriteItem; onRemove: () => void }) {
  return (
    <Link
      href={`/social/best-ads`}
      className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all"
    >
      <div className="relative aspect-square bg-muted">
        {item.thumbnail_url ? (
          <Image
            src={item.thumbnail_url}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <Megaphone className="w-12 h-12 text-blue-500/50" />
          </div>
        )}
        <button
          onClick={(e) => {
            e.preventDefault()
            onRemove()
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center transition-all hover:bg-red-600"
        >
          <Heart className="w-4 h-4 fill-current" />
        </button>
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white flex items-center gap-1">
          <Megaphone className="w-3 h-3" />
          Ad
        </div>
      </div>
      <div className="p-3">
        {item.company && (
          <div className="flex items-center gap-2 mb-2">
            {item.company.icon_url ? (
              <Image
                src={item.company.icon_url}
                alt={item.company.name}
                width={20}
                height={20}
                className="rounded object-contain bg-white"
              />
            ) : (
              <Building2 className="w-5 h-5 text-muted-foreground" />
            )}
            <span className="text-sm font-medium text-muted-foreground truncate">
              {item.company.name}
            </span>
          </div>
        )}
        <h3 className="font-medium text-foreground line-clamp-2 text-sm">
          {item.name}
        </h3>
      </div>
    </Link>
  )
}

// Card for Instagram Reels
function ReelFavoriteCard({ item, onRemove }: { item: FavoriteItem; onRemove: () => void }) {
  return (
    <Link
      href={`/social/instagram-reels`}
      className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all"
    >
      <div className="relative aspect-[9/16] bg-muted">
        {item.thumbnail_url ? (
          <Image
            src={item.thumbnail_url}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950">
            <Instagram className="w-12 h-12 text-pink-500/50" />
          </div>
        )}
        <button
          onClick={(e) => {
            e.preventDefault()
            onRemove()
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center transition-all hover:bg-red-600"
        >
          <Heart className="w-4 h-4 fill-current" />
        </button>
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-pink-500 text-white flex items-center gap-1">
          <Instagram className="w-3 h-3" />
          Reel
        </div>
        {/* Creator info overlay */}
        {item.creator && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-6">
            <p className="text-white text-xs font-medium truncate">@{item.creator.handle}</p>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-foreground line-clamp-2 text-sm">
          {item.name}
        </h3>
      </div>
    </Link>
  )
}

// Card for YouTube Videos
function YouTubeFavoriteCard({ item, onRemove }: { item: FavoriteItem; onRemove: () => void }) {
  return (
    <Link
      href={`/social/youtube-videos`}
      className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all"
    >
      <div className="relative aspect-video bg-muted">
        {item.thumbnail_url ? (
          <Image
            src={item.thumbnail_url}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Youtube className="w-12 h-12 text-red-500/50" />
          </div>
        )}
        <button
          onClick={(e) => {
            e.preventDefault()
            onRemove()
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center transition-all hover:bg-red-600"
        >
          <Heart className="w-4 h-4 fill-current" />
        </button>
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-white flex items-center gap-1">
          <Youtube className="w-3 h-3" />
          Video
        </div>
      </div>
      <div className="p-3">
        {item.creator && (
          <p className="text-xs text-muted-foreground mb-1">{item.creator.name}</p>
        )}
        <h3 className="font-medium text-foreground line-clamp-2 text-sm">
          {item.name}
        </h3>
      </div>
    </Link>
  )
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [contentFilter, setContentFilter] = useState<ContentType>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const fetchFavorites = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/favorites')
      const data = await response.json()

      if (data.favorites) {
        setFavorites(data.favorites)
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFavorites()
  }, [])

  const handleRemoveFavorite = async (id: string, category: string) => {
    // Optimistic update
    setFavorites(prev => prev.filter(f => f.id !== id))

    try {
      await fetch(`/api/favorites?campaignId=${id}&category=${category}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Failed to remove favorite:', error)
      // Refresh on error
      fetchFavorites()
    }
  }

  const handleRemoveAll = async () => {
    if (!confirm('Are you sure you want to remove all favorites?')) return

    try {
      for (const fav of favorites) {
        await fetch(`/api/favorites?campaignId=${fav.id}&category=${fav.category}`, {
          method: 'DELETE'
        })
      }
      setFavorites([])
    } catch (error) {
      console.error('Failed to remove favorites:', error)
    }
  }

  // Separate campaign and creator content
  const campaignFavorites = favorites.filter(f => f.type === 'campaign')
  const creatorFavorites = favorites.filter(f => f.type === 'creator')

  // Apply content type filter
  let filteredFavorites = favorites
  if (contentFilter === 'campaigns') {
    filteredFavorites = campaignFavorites
  } else if (contentFilter === 'creator') {
    filteredFavorites = creatorFavorites
  }

  // Apply category filter
  if (categoryFilter !== 'all') {
    filteredFavorites = filteredFavorites.filter(f => f.category === categoryFilter)
  }

  // Group by category
  const groupedFavorites = filteredFavorites.reduce((acc, fav) => {
    const category = fav.category
    if (!acc[category]) acc[category] = []
    acc[category].push(fav)
    return acc
  }, {} as Record<string, FavoriteItem[]>)

  // Get all unique categories from favorites
  const campaignCategories = [...new Set(campaignFavorites.map(f => f.category))] as CampaignCategory[]
  const creatorCategories = [...new Set(creatorFavorites.map(f => f.category))] as CreatorCategory[]

  return (
    <div className="flex flex-col h-full bg-background">
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500 fill-red-500" />
              <h1 className="text-3xl font-bold text-foreground">My Favorites</h1>
            </div>
            {favorites.length > 0 && (
              <button
                onClick={handleRemoveAll}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
          <p className="text-muted-foreground">
            Your saved campaigns, ads, and videos for quick access.
          </p>
        </div>

        {/* Content Type Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => {
              setContentFilter('all')
              setCategoryFilter('all')
            }}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
              contentFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            All ({favorites.length})
          </button>
          {campaignFavorites.length > 0 && (
            <button
              onClick={() => {
                setContentFilter('campaigns')
                setCategoryFilter('all')
              }}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                contentFilter === 'campaigns'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              Campaigns ({campaignFavorites.length})
            </button>
          )}
          {creatorFavorites.length > 0 && (
            <button
              onClick={() => {
                setContentFilter('creator')
                setCategoryFilter('all')
              }}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                contentFilter === 'creator'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              Creator Content ({creatorFavorites.length})
            </button>
          )}
        </div>

        {/* Category Filters */}
        {contentFilter !== 'all' && (
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setCategoryFilter('all')}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                categoryFilter === 'all'
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              )}
            >
              All
            </button>
            {contentFilter === 'campaigns' && campaignCategories.map(category => {
              const count = campaignFavorites.filter(f => f.category === category).length
              return (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                    categoryFilter === category
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  )}
                >
                  {categoryConfig[category]?.label || category} ({count})
                </button>
              )
            })}
            {contentFilter === 'creator' && creatorCategories.map(category => {
              const count = creatorFavorites.filter(f => f.category === category).length
              const config = creatorCategoryConfig[category]
              return (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1',
                    categoryFilter === category
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  )}
                >
                  {config?.icon}
                  {config?.label || category} ({count})
                </button>
              )
            })}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-8">
            {/* Campaign section skeleton */}
            <div>
              <div className="h-6 w-32 bg-muted animate-pulse rounded mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="aspect-[4/3] bg-muted animate-pulse" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 w-full bg-muted animate-pulse rounded" />
                      <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Reels section skeleton */}
            <div>
              <div className="h-6 w-40 bg-muted animate-pulse rounded mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="aspect-[9/16] bg-muted animate-pulse" />
                    <div className="p-3">
                      <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No favorites yet</h3>
              <p className="text-muted-foreground">
                {categoryFilter !== 'all' || contentFilter !== 'all'
                  ? 'No favorites match this filter'
                  : 'Click the heart icon on any content to save it here'}
              </p>
            </div>
          </div>
        ) : (
          /* Favorites Grid */
          <div className="space-y-8">
            {Object.keys(groupedFavorites).map(category => {
              const items = groupedFavorites[category]
              const isCampaignCategory = Object.keys(categoryConfig).includes(category)
              const isCreatorCategory = Object.keys(creatorCategoryConfig).includes(category)

              let categoryLabel = category
              let categoryColor = 'bg-gray-500'

              if (isCampaignCategory) {
                categoryLabel = categoryConfig[category as CampaignCategory]?.label || category
                categoryColor = category === 'social-shareables' ? 'bg-purple-500'
                  : category === 'email-campaigns' ? 'bg-blue-500'
                  : category === 'phone-text-scripts' ? 'bg-green-500'
                  : 'bg-orange-500'
              } else if (isCreatorCategory) {
                categoryLabel = creatorCategoryConfig[category as CreatorCategory]?.label || category
                categoryColor = creatorCategoryConfig[category as CreatorCategory]?.color || 'bg-gray-500'
              }

              return (
                <div key={category}>
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <span className={cn('w-3 h-3 rounded-full', categoryColor)} />
                    {categoryLabel}
                  </h2>
                  <div className={cn(
                    "grid gap-6",
                    category === 'short-videos'
                      ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  )}>
                    {items.map((item: FavoriteItem) => {
                      if (item.type === 'campaign') {
                        return (
                          <CampaignListCard
                            key={item.id}
                            campaign={item as unknown as CampaignCardType}
                            onFavoriteToggle={(id, isFavorite) => {
                              if (!isFavorite) {
                                handleRemoveFavorite(id, item.category)
                              }
                            }}
                          />
                        )
                      } else if (category === 'ads') {
                        return (
                          <AdFavoriteCard
                            key={item.id}
                            item={item}
                            onRemove={() => handleRemoveFavorite(item.id, item.category)}
                          />
                        )
                      } else if (category === 'short-videos') {
                        return (
                          <ReelFavoriteCard
                            key={item.id}
                            item={item}
                            onRemove={() => handleRemoveFavorite(item.id, item.category)}
                          />
                        )
                      } else if (category === 'youtube-videos') {
                        return (
                          <YouTubeFavoriteCard
                            key={item.id}
                            item={item}
                            onRemove={() => handleRemoveFavorite(item.id, item.category)}
                          />
                        )
                      }
                      return null
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
