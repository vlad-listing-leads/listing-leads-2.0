'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CampaignCard as CampaignCardType, categoryConfig, CampaignCategory } from '@/types/campaigns'

interface CampaignCardProps {
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
        observer.disconnect() // Once in view, stop observing
      }
    }, { rootMargin: '100px', ...options })

    observer.observe(element)
    return () => observer.disconnect()
  }, [options])

  return { ref, isInView }
}

// Category-specific gradient backgrounds (className-based) - empty when using custom styles
const categoryGradients: Record<CampaignCategory, string> = {
  'phone-text-scripts': '',
  'email-campaigns': '',
  'social-shareables': '',
  'direct-mail': '',
}

// Category-specific gradient styles (custom gradients with percentage stops)
const categoryGradientStyles: Record<CampaignCategory, React.CSSProperties | undefined> = {
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

export function CampaignCard({ campaign, onFavoriteToggle }: CampaignCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFavorite, setIsFavorite] = useState(campaign.isFavorite || false)
  const [isLoading, setIsLoading] = useState(false)
  const { ref, isInView } = useInView()

  const config = categoryConfig[campaign.category]
  const gradientClass = categoryGradients[campaign.category]
  const gradientStyle = categoryGradientStyles[campaign.category]
  const fadeClass = categoryFadeColors[campaign.category]
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
      <div ref={ref} className="rounded-2xl overflow-hidden bg-gradient-to-b from-muted/50 to-muted">
        <div className="aspect-[4/3] relative">
          <div className="absolute inset-0 bg-muted animate-pulse" />
        </div>
        <div className="px-4 pb-4 pt-1">
          <div className="h-6 w-28 rounded-full bg-muted animate-pulse" />
          <div className="mt-2 h-4 w-full bg-muted animate-pulse rounded" />
          <div className="mt-1 h-4 w-3/4 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  return (
    <Link
      href={detailUrl}
      className={cn(
        'group block rounded-2xl overflow-hidden transition-all cursor-pointer border border-black/10',
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
              loading="lazy"
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
      <div className="px-4 pb-4 pt-1 text-center">
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
