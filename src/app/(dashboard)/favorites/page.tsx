'use client'

import { useState, useEffect } from 'react'
import { Heart, Calendar, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CampaignSidebar, CampaignCard, CampaignPreviewModal } from '@/components/campaigns'
import { Campaign, categoryConfig, CampaignCategory } from '@/types/campaigns'

interface FavoriteItem {
  id: string
  campaign_id: string
  created_at: string
  weekly_campaigns: Campaign
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<CampaignCategory | 'all'>('all')

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

  const handleCampaignClick = (campaign: Campaign) => {
    setSelectedCampaign({ ...campaign, isFavorite: true })
    setIsModalOpen(true)
  }

  const handleFavoriteToggle = (campaignId: string, isFavorite: boolean) => {
    if (!isFavorite) {
      // Remove from favorites list
      setFavorites(prev => prev.filter(f => f.campaign_id !== campaignId))
    }

    // Close modal if the unfavorited item was selected
    if (selectedCampaign?.id === campaignId && !isFavorite) {
      setIsModalOpen(false)
      setSelectedCampaign(null)
    }
  }

  const handleRemoveAll = async () => {
    if (!confirm('Are you sure you want to remove all favorites?')) return

    try {
      for (const fav of favorites) {
        await fetch(`/api/favorites?campaignId=${fav.campaign_id}`, {
          method: 'DELETE'
        })
      }
      setFavorites([])
    } catch (error) {
      console.error('Failed to remove favorites:', error)
    }
  }

  // Filter by category
  const filteredFavorites = favorites.filter(fav => {
    if (categoryFilter === 'all') return true
    return fav.weekly_campaigns?.category === categoryFilter
  })

  // Group by category
  const groupedFavorites = filteredFavorites.reduce((acc, fav) => {
    const category = fav.weekly_campaigns?.category || 'social-shareables'
    if (!acc[category]) acc[category] = []
    acc[category].push(fav)
    return acc
  }, {} as Record<CampaignCategory, FavoriteItem[]>)

  return (
    <div className="flex min-h-screen -mx-6 -my-8 bg-background">
      {/* Sidebar */}
      <CampaignSidebar favoritesCount={favorites.length} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-sm font-medium text-muted-foreground">My Favorites</h1>
          <div className="flex items-center gap-3">
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
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-8 h-8 text-red-500 fill-red-500" />
              <h1 className="text-3xl font-bold text-foreground">My Favorites</h1>
            </div>
            <p className="text-muted-foreground">
              Your saved campaigns and templates for quick access.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setCategoryFilter('all')}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                categoryFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              All ({favorites.length})
            </button>
            {(Object.keys(categoryConfig) as CampaignCategory[]).map(category => {
              const count = favorites.filter(f => f.weekly_campaigns?.category === category).length
              if (count === 0) return null
              return (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                    categoryFilter === category
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {categoryConfig[category].label} ({count})
                </button>
              )
            })}
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading favorites...</p>
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
                  {categoryFilter !== 'all'
                    ? 'No favorites in this category'
                    : 'Click the heart icon on any campaign to save it here'}
                </p>
              </div>
            </div>
          ) : (
            /* Favorites Grid */
            <div className="space-y-8">
              {(Object.keys(groupedFavorites) as CampaignCategory[]).map(category => (
                <div key={category}>
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <span className={cn(
                      'w-3 h-3 rounded-full',
                      category === 'social-shareables' && 'bg-purple-500',
                      category === 'email-campaigns' && 'bg-blue-500',
                      category === 'phone-text-scripts' && 'bg-green-500',
                      category === 'direct-mail' && 'bg-orange-500'
                    )} />
                    {categoryConfig[category].label}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {groupedFavorites[category].map(fav => (
                      <CampaignCard
                        key={fav.id}
                        campaign={{ ...fav.weekly_campaigns, isFavorite: true }}
                        onClick={handleCampaignClick}
                        onFavoriteToggle={handleFavoriteToggle}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Preview Modal */}
      <CampaignPreviewModal
        campaign={selectedCampaign}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedCampaign(null)
        }}
        onFavoriteToggle={handleFavoriteToggle}
      />
    </div>
  )
}
