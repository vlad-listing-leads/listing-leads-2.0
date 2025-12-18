'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { CampaignCard } from './CampaignCard'
import { CampaignListCard } from './CampaignListCard'
import { CampaignCard as CampaignCardType } from '@/types/campaigns'

interface LazyGridProps {
  campaigns: CampaignCardType[]
  onFavoriteToggle?: (campaignId: string, isFavorite: boolean) => void
  initialBatchSize?: number
  batchSize?: number
  variant?: 'default' | 'list'
}

export function LazyGrid({
  campaigns,
  onFavoriteToggle,
  initialBatchSize = 12,
  batchSize = 8,
  variant = 'list'
}: LazyGridProps) {
  const [visibleCount, setVisibleCount] = useState(initialBatchSize)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const isLoadingMore = useRef(false)

  const loadMore = useCallback(() => {
    if (isLoadingMore.current) return
    if (visibleCount >= campaigns.length) return

    isLoadingMore.current = true
    // Use requestAnimationFrame for smooth loading
    requestAnimationFrame(() => {
      setVisibleCount(prev => Math.min(prev + batchSize, campaigns.length))
      isLoadingMore.current = false
    })
  }, [visibleCount, campaigns.length, batchSize])

  useEffect(() => {
    const element = loadMoreRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '200px' } // Start loading before reaching the end
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [loadMore])

  // Reset visible count when campaigns change
  useEffect(() => {
    setVisibleCount(initialBatchSize)
  }, [campaigns, initialBatchSize])

  const visibleCampaigns = campaigns.slice(0, visibleCount)
  const hasMore = visibleCount < campaigns.length

  // Choose card component based on variant
  const CardComponent = variant === 'list' ? CampaignListCard : CampaignCard

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {visibleCampaigns.map(campaign => (
          <CardComponent
            key={campaign.id}
            campaign={campaign}
            onFavoriteToggle={onFavoriteToggle}
          />
        ))}
      </div>

      {/* Load more trigger element */}
      {hasMore && (
        <div
          ref={loadMoreRef}
          className="h-20 flex items-center justify-center mt-4"
        >
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-pulse delay-75" />
            <div className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-pulse delay-150" />
          </div>
        </div>
      )}
    </>
  )
}
