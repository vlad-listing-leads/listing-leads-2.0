'use client'

import { useState } from 'react'
import { X, Heart, Copy, Check, ExternalLink, Download, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CampaignCard, categoryConfig } from '@/types/campaigns'

interface CampaignPreviewModalProps {
  campaign: CampaignCard | null
  isOpen: boolean
  onClose: () => void
  onFavoriteToggle?: (campaignId: string, isFavorite: boolean) => void
}

export function CampaignPreviewModal({
  campaign,
  isOpen,
  onClose,
  onFavoriteToggle
}: CampaignPreviewModalProps) {
  const [isFavorite, setIsFavorite] = useState(campaign?.isFavorite || false)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!isOpen || !campaign) return null

  const config = categoryConfig[campaign.category]

  const handleFavoriteClick = async () => {
    if (isLoading) return

    setIsLoading(true)
    const newFavoriteState = !isFavorite

    try {
      if (newFavoriteState) {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId: campaign.id })
        })
      } else {
        await fetch(`/api/favorites?campaignId=${campaign.id}`, {
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

  const handleCopyContent = async () => {
    if (campaign.html_content) {
      await navigator.clipboard.writeText(campaign.html_content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-10 lg:inset-20 bg-card rounded-2xl z-50 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', config.color, config.darkColor)}>
              {config.label}
            </span>
            {campaign.week_start_date && (
              <span className="text-sm text-muted-foreground">
                Week of {formatDate(campaign.week_start_date)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFavoriteClick}
              disabled={isLoading}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isFavorite
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  : 'hover:bg-accent text-muted-foreground hover:text-foreground'
              )}
            >
              <Heart className={cn('w-5 h-5', isFavorite && 'fill-current')} />
            </button>

            <button
              onClick={handleCopyContent}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>

            <button
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>

            <button
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Preview area */}
          <div className="flex-1 bg-muted/50 p-8 overflow-auto flex items-center justify-center">
            <div className="max-w-2xl w-full aspect-[4/3] bg-card rounded-xl shadow-lg border border-border flex items-center justify-center">
              {campaign.html_content ? (
                <div
                  className="w-full h-full overflow-auto p-4"
                  dangerouslySetInnerHTML={{ __html: campaign.html_content }}
                />
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📄</span>
                  </div>
                  <p className="text-muted-foreground">Preview not available</p>
                </div>
              )}
            </div>
          </div>

          {/* Details sidebar */}
          <div className="w-80 border-l border-border p-6 overflow-y-auto">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {campaign.name || campaign.title}
            </h2>

            {(campaign.introduction || campaign.description) && (
              <p className="text-muted-foreground mb-6">
                {campaign.introduction || campaign.description}
              </p>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Category</h3>
                <p className="text-foreground">{config.label}</p>
              </div>

              {campaign.week_start_date && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Week</h3>
                  <p className="text-foreground">{formatDate(campaign.week_start_date)}</p>
                </div>
              )}

              {campaign.day_of_week !== null && campaign.day_of_week !== undefined && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Day</h3>
                  <p className="text-foreground">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][campaign.day_of_week]}
                  </p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-8 space-y-3">
              <button className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                Use This Template
              </button>

              {campaign.content_url && (
                <a
                  href={campaign.content_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Original
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
