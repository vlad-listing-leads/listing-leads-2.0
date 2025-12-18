'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CampaignCard as CampaignCardType } from '@/types/campaigns'

interface CampaignListCardProps {
  campaign: CampaignCardType
  onFavoriteToggle?: (campaignId: string, isFavorite: boolean) => void
}

// Hook for lazy loading with Intersection Observer
function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true)
        observer.disconnect()
      }
    }, { rootMargin: '100px', ...options })

    observer.observe(element)
    return () => observer.disconnect()
  }, [options])

  return { ref, isInView }
}

export function CampaignListCard({ campaign, onFavoriteToggle }: CampaignListCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFavorite, setIsFavorite] = useState(campaign.isFavorite || false)
  const [isLoading, setIsLoading] = useState(false)
  const { ref, isInView } = useInView()

  const detailUrl = `/campaigns/${campaign.category}/${campaign.slug}`

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault()
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

  // Show skeleton placeholder until card is in view
  if (!isInView) {
    return (
      <div ref={ref} className="rounded-2xl overflow-hidden bg-muted/30">
        <div className="aspect-[4/3] bg-muted animate-pulse" />
        <div className="p-4">
          <div className="h-5 bg-muted animate-pulse rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted animate-pulse rounded w-full" />
        </div>
      </div>
    )
  }

  return (
    <Link
      href={detailUrl}
      className={cn(
        'group block rounded-2xl overflow-hidden bg-[#FDF9F3] transition-all duration-200',
        isHovered && 'ring-2 ring-primary/50 shadow-lg'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="aspect-[4/3] relative overflow-hidden bg-[#FDF9F3]">
        {campaign.thumbnail_url ? (
          <img
            src={campaign.thumbnail_url}
            alt={campaign.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-contain object-center p-2"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3/4 h-3/4 bg-white/50 rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Preview</span>
            </div>
          </div>
        )}

        {/* Favorite button */}
        <button
          onClick={handleFavoriteClick}
          disabled={isLoading}
          className={cn(
            'absolute top-3 right-3 p-2 rounded-full transition-all z-10',
            isFavorite
              ? 'bg-red-500 text-white opacity-100'
              : 'bg-white/90 text-muted-foreground hover:text-red-500',
            isHovered || isFavorite ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 pt-3 bg-white">
        <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
          {campaign.name || campaign.title}
        </h3>
        {campaign.introduction && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            {campaign.introduction}
          </p>
        )}
      </div>
    </Link>
  )
}
