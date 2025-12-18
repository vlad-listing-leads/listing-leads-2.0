'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CampaignCard as CampaignCardType, CampaignCategory } from '@/types/campaigns'

interface CampaignListCardProps {
  campaign: CampaignCardType
  onFavoriteToggle?: (campaignId: string, isFavorite: boolean) => void
}

// Category-specific gradient styles (custom gradients with percentage stops)
const categoryGradientStyles: Record<CampaignCategory, React.CSSProperties> = {
  'phone-text-scripts': { background: 'linear-gradient(to bottom, #FFEBAF 0%, #FEF8EC 67%)' },
  'email-campaigns': { background: 'linear-gradient(to bottom, #AED4C7 0%, #F7F9F7 40%)' },
  'social-shareables': { background: 'linear-gradient(to bottom, #A4CDFF 0%, #F3F7FF 40%)' },
  'direct-mail': { background: 'linear-gradient(to bottom, #F6C9BC 0%, #FFEFEA 40%)' },
}

// Category-specific fade colors for bottom mask
const categoryFadeColors: Record<CampaignCategory, string> = {
  'phone-text-scripts': 'from-transparent via-[#FEF8EC]/80 to-[#FEF8EC]',
  'email-campaigns': 'from-transparent via-[#F7F9F7]/80 to-[#F7F9F7]',
  'social-shareables': 'from-transparent via-[#F3F7FF]/80 to-[#F3F7FF]',
  'direct-mail': 'from-transparent via-[#FFEFEA]/80 to-[#FFEFEA]',
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
  const gradientStyle = categoryGradientStyles[campaign.category]
  const fadeClass = categoryFadeColors[campaign.category]

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
        'group block rounded-2xl overflow-hidden transition-all duration-200 border border-black/10',
        isHovered && 'ring-2 ring-primary/50 shadow-lg'
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
              loading="lazy"
              className="absolute inset-0 w-full h-full object-contain object-center scale-[0.85] group-hover:scale-[0.9] transition-transform duration-300 ease-out"
            />
            {/* Bottom fade mask */}
            <div className={cn('absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b pointer-events-none', fadeClass)} />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3/4 h-3/4 bg-white/50 rounded-lg flex items-center justify-center scale-[0.85] group-hover:scale-[0.9] transition-transform duration-300 ease-out">
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
      <div className="px-4 pb-4 pt-1 text-center">
        <h4 className="text-sm font-medium text-foreground line-clamp-2">
          {campaign.name || campaign.title}
        </h4>
        {campaign.introduction && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {campaign.introduction.replace(/<[^>]*>/g, '')}
          </p>
        )}
      </div>
    </Link>
  )
}
