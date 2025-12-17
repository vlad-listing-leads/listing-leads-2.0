'use client'

import { useState } from 'react'
import { Heart, ExternalLink, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CampaignCard as CampaignCardType, categoryConfig } from '@/types/campaigns'

interface CampaignCardProps {
  campaign: CampaignCardType
  onFavoriteToggle?: (campaignId: string, isFavorite: boolean) => void
  onClick?: (campaign: CampaignCardType) => void
}

export function CampaignCard({ campaign, onFavoriteToggle, onClick }: CampaignCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFavorite, setIsFavorite] = useState(campaign.isFavorite || false)
  const [isLoading, setIsLoading] = useState(false)

  const config = categoryConfig[campaign.category]

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLoading) return

    setIsLoading(true)
    const newFavoriteState = !isFavorite

    try {
      if (newFavoriteState) {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId: campaign.id, category: campaign.category })
        })
      } else {
        await fetch(`/api/favorites?campaignId=${campaign.id}&category=${campaign.category}`, {
          method: 'DELETE'
        })
      }

      setIsFavorite(newFavoriteState)
      onFavoriteToggle?.(campaign.id, newFavoriteState)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="group bg-card rounded-xl overflow-hidden shadow-sm border border-border hover:shadow-md hover:border-border/80 transition-all cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.(campaign)}
    >
      {/* Thumbnail */}
      <div className="aspect-[4/3] relative bg-muted overflow-hidden">
        {campaign.thumbnail_url ? (
          <img
            src={campaign.thumbnail_url}
            alt={campaign.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
            <div className="w-3/4 h-3/4 bg-card rounded-lg shadow-sm flex items-center justify-center border border-border">
              <span className="text-muted-foreground text-sm">Preview</span>
            </div>
          </div>
        )}

        {/* Favorite button */}
        <button
          onClick={handleFavoriteClick}
          disabled={isLoading}
          className={cn(
            'absolute top-2 right-2 p-1.5 rounded-full transition-all',
            isFavorite
              ? 'bg-red-500 text-white'
              : 'bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground',
            isHovered || isFavorite ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', config.color, config.darkColor)}>
          {config.label}
        </span>
        <h4 className="mt-2 text-sm font-medium text-foreground line-clamp-2">
          {campaign.name || campaign.title}
        </h4>
        {(campaign.introduction || campaign.description) && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {(campaign.introduction || campaign.description || '').replace(/<[^>]*>/g, '')}
          </p>
        )}
      </div>
    </div>
  )
}
