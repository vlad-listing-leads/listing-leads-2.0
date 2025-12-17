'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CampaignCard as CampaignCardType, categoryConfig, CampaignCategory } from '@/types/campaigns'

interface CampaignCardProps {
  campaign: CampaignCardType
  onFavoriteToggle?: (campaignId: string, isFavorite: boolean) => void
}

// Category-specific gradient backgrounds (className-based)
const categoryGradients: Record<CampaignCategory, string> = {
  'phone-text-scripts': '', // Using custom style instead
  'email-campaigns': 'bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-blue-950/40 dark:to-indigo-900/30',
  'social-shareables': 'bg-gradient-to-b from-purple-50 to-pink-100 dark:from-purple-950/40 dark:to-pink-900/30',
  'direct-mail': 'bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900',
}

// Category-specific gradient styles (for custom gradients with percentage stops)
const categoryGradientStyles: Record<CampaignCategory, React.CSSProperties | undefined> = {
  'phone-text-scripts': { background: 'linear-gradient(to bottom, #FFEBAF 0%, #FEF8EC 67%)' },
  'email-campaigns': undefined,
  'social-shareables': undefined,
  'direct-mail': undefined,
}

// Category-specific fade colors for bottom mask
const categoryFadeColors: Record<CampaignCategory, string> = {
  'phone-text-scripts': 'from-transparent via-[#FEF8EC]/80 to-[#FEF8EC]',
  'email-campaigns': 'from-transparent via-indigo-100/80 to-indigo-100 dark:via-indigo-900/50 dark:to-indigo-900/30',
  'social-shareables': 'from-transparent via-pink-100/80 to-pink-100 dark:via-pink-900/50 dark:to-pink-900/30',
  'direct-mail': 'from-transparent via-slate-200/80 to-slate-200 dark:via-slate-900/50 dark:to-slate-900',
}

export function CampaignCard({ campaign, onFavoriteToggle }: CampaignCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFavorite, setIsFavorite] = useState(campaign.isFavorite || false)
  const [isLoading, setIsLoading] = useState(false)

  const config = categoryConfig[campaign.category]
  const gradientClass = categoryGradients[campaign.category]
  const gradientStyle = categoryGradientStyles[campaign.category]
  const fadeClass = categoryFadeColors[campaign.category]
  const detailUrl = `/campaigns/${campaign.category}/${campaign.slug}`

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
    <Link
      href={detailUrl}
      className={cn(
        'group block rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer',
        gradientClass
      )}
      style={gradientStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="aspect-[4/3] relative overflow-hidden">
        {campaign.thumbnail_url ? (
          <>
            <img
              src={campaign.thumbnail_url}
              alt={campaign.name}
              className="absolute inset-0 w-full h-full object-contain object-center scale-[0.85] group-hover:scale-[0.9] transition-transform duration-300 ease-out"
            />
            {/* Bottom fade mask */}
            <div className={cn('absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b pointer-events-none', fadeClass)} />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3/4 h-3/4 bg-white/50 dark:bg-black/20 rounded-lg flex items-center justify-center scale-[0.85] group-hover:scale-[0.9] transition-transform duration-300 ease-out">
              <span className="text-muted-foreground text-sm">Preview</span>
            </div>
          </div>
        )}

        {/* Favorite button */}
        <button
          onClick={handleFavoriteClick}
          disabled={isLoading}
          className={cn(
            'absolute top-2 right-2 p-1.5 rounded-full transition-all z-10',
            isFavorite
              ? 'bg-red-500 text-white'
              : 'bg-white/80 dark:bg-black/50 text-muted-foreground hover:bg-white hover:text-foreground',
            isHovered || isFavorite ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 pt-1">
        <span className={cn(
          'inline-block text-xs font-medium px-3 py-1 rounded-full',
          'bg-white dark:bg-black/30 text-foreground shadow-sm'
        )}>
          {config.label}
        </span>
        <h4 className="mt-2 text-sm font-medium text-foreground line-clamp-2">
          {campaign.name || campaign.title}
        </h4>
      </div>
    </Link>
  )
}
