'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Star,
  ExternalLink,
  Megaphone,
  Building2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { Ad } from '@/types/ad'

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

// Interactive Star Rating Component
function StarRating({
  rating,
  userVote,
  onRate,
  disabled,
  size = 'md',
}: {
  rating: number
  userVote: number | null
  onRate: (rating: number) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const [hoverRating, setHoverRating] = useState(0)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = hoverRating >= star || (!hoverRating && (userVote || 0) >= star)
        const isHalfFilled = !isFilled && rating >= star - 0.5 && rating < star && !hoverRating && !userVote

        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            className={cn(
              "transition-all",
              disabled ? "cursor-default" : "cursor-pointer hover:scale-110"
            )}
            onMouseEnter={() => !disabled && setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => !disabled && onRate(star)}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled
                  ? "fill-yellow-400 text-yellow-400"
                  : isHalfFilled
                  ? "fill-yellow-400/50 text-yellow-400"
                  : "text-gray-300 dark:text-gray-600"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

export default function AdDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [ad, setAd] = useState<Ad | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userVote, setUserVote] = useState<number | null>(null)
  const [currentRating, setCurrentRating] = useState(0)
  const [currentCount, setCurrentCount] = useState(0)
  const [isVoting, setIsVoting] = useState(false)
  const [isLoadingVote, setIsLoadingVote] = useState(false)

  useEffect(() => {
    if (slug) {
      fetchAd()
    }
  }, [slug])

  const fetchAd = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/ads?slug=${encodeURIComponent(slug)}`)
      const data = await response.json()

      if (data.ads && data.ads.length > 0) {
        const adData = data.ads[0]
        setAd(adData)
        setCurrentRating(adData.rating || 0)
        setCurrentCount(adData.rating_count || 0)
        // Fetch user vote
        fetchUserVote(adData.id)
      } else {
        setError('Ad not found')
      }
    } catch (err) {
      console.error('Failed to fetch ad:', err)
      setError('Failed to load ad')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserVote = async (adId: string) => {
    setIsLoadingVote(true)
    try {
      const response = await fetch(`/api/ads/${adId}/vote`)
      const data = await response.json()
      setUserVote(data.userVote)
    } catch (error) {
      console.error('Failed to fetch user vote:', error)
    } finally {
      setIsLoadingVote(false)
    }
  }

  const handleRate = async (rating: number) => {
    if (isVoting || !ad) return
    setIsVoting(true)

    try {
      const response = await fetch(`/api/ads/${ad.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      })

      const data = await response.json()

      if (response.ok) {
        setUserVote(data.userVote)
        setCurrentRating(data.adRating)
        setCurrentCount(data.adRatingCount)
      } else if (response.status === 401) {
        alert('Please log in to rate ads')
      }
    } catch (error) {
      console.error('Failed to submit vote:', error)
    } finally {
      setIsVoting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !ad) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">{error || 'Ad not found'}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link
          href="/social/best-ads"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-sm font-medium text-foreground truncate max-w-[60%]">
          {ad.name}
        </h1>
        <div className="w-16" />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Ad Image */}
            <div className="lg:w-1/2">
              <div className="sticky top-6">
                <div className="rounded-xl overflow-hidden bg-muted shadow-lg">
                  {ad.image_url ? (
                    <img
                      src={ad.image_url}
                      alt={ad.name}
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                      <Megaphone className="w-16 h-16 text-blue-500/50" />
                    </div>
                  )}
                </div>

                {/* Company info below image */}
                {ad.company && (
                  <div className="flex items-center gap-3 mt-4">
                    {ad.company.icon_url ? (
                      <img
                        src={ad.company.icon_url}
                        alt={ad.company.name}
                        className="w-10 h-10 rounded-lg object-contain bg-white p-1"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{ad.company.name}</p>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs flex items-center gap-1",
                          ad.channel === 'meta'
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        )}>
                          {ad.channel === 'meta' ? (
                            <MetaIcon className="w-3 h-3" />
                          ) : (
                            <GoogleIcon className="w-3 h-3" />
                          )}
                          {ad.channel === 'meta' ? 'Meta Ads' : 'Google Ads'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Ad Details */}
            <div className="lg:w-1/2 space-y-6">
              {/* Title */}
              <div className="text-center lg:text-left">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                  {ad.name}
                </h1>
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-center lg:justify-start gap-8">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Rating</p>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-xl font-semibold text-foreground">
                      {currentRating > 0 ? currentRating.toFixed(1) : '-'}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Votes</p>
                  <p className="text-xl font-semibold text-foreground mt-1">
                    {currentCount || 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Channel</p>
                  <p className="text-xl font-semibold text-foreground mt-1 capitalize">
                    {ad.channel}
                  </p>
                </div>
              </div>

              {/* Rate this ad */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-medium text-foreground mb-3">Rate this ad</h3>
                <div className="flex items-center gap-3">
                  {isLoadingVote ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Loading...</span>
                    </div>
                  ) : (
                    <>
                      <StarRating
                        rating={currentRating}
                        userVote={userVote}
                        onRate={handleRate}
                        disabled={isVoting}
                        size="lg"
                      />
                      {isVoting && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                    </>
                  )}
                </div>
                {userVote && (
                  <p className="text-xs text-muted-foreground mt-2">
                    You rated this ad {userVote} star{userVote !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Description */}
              {ad.description && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Description</h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-muted-foreground leading-relaxed">{ad.description}</p>
                  </div>
                </div>
              )}

              {/* Tags */}
              {ad.tags && ad.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {ad.tags.map(tag => (
                      <span
                        key={tag.id}
                        className="px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-lg"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* View Full Image Button */}
              {ad.image_url && (
                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(ad.image_url!, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Full Image
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
