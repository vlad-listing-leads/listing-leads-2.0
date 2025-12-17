'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Heart, ExternalLink, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Campaign, CampaignCategory, categoryConfig } from '@/types/campaigns'

// Execution step type from database
interface ExecutionStep {
  step: number
  title: string
  description?: string
  substeps?: {
    number: number
    title: string
    description?: string
  }[]
  template?: {
    title: string
    url: string
    thumbnail?: string
  }
}

// Category to back link mapping
const categoryBackLinks: Record<CampaignCategory, { href: string; label: string }> = {
  'phone-text-scripts': { href: '/campaigns/phone-text-scripts', label: 'Text Scripts' },
  'email-campaigns': { href: '/campaigns/email', label: 'Email Campaigns' },
  'direct-mail': { href: '/campaigns/direct-mail', label: 'Direct Mail' },
  'social-shareables': { href: '/campaigns/social', label: 'Social Shareables' },
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const category = params.category as CampaignCategory
  const slug = params.slug as string

  useEffect(() => {
    async function fetchCampaign() {
      try {
        const response = await fetch(`/api/campaigns/${category}/${slug}`)
        const data = await response.json()

        if (data.campaign) {
          setCampaign(data.campaign)
          setIsFavorite(data.campaign.isFavorite || false)
        }
      } catch (error) {
        console.error('Failed to fetch campaign:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (category && slug) {
      fetchCampaign()
    }
  }, [category, slug])

  const handleFavoriteToggle = async () => {
    if (!campaign || isFavoriteLoading) return

    setIsFavoriteLoading(true)
    const newFavoriteState = !isFavorite

    try {
      if (newFavoriteState) {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId: campaign.id, category }),
        })
      } else {
        await fetch(`/api/favorites?campaignId=${campaign.id}&category=${category}`, {
          method: 'DELETE',
        })
      }
      setIsFavorite(newFavoriteState)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setIsFavoriteLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label)
    setTimeout(() => setCopiedText(null), 2000)
  }

  if (isLoading) {
    return <CampaignDetailSkeleton />
  }

  if (!campaign) {
    return (
      <div className="flex flex-col h-full bg-background">
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto text-center py-20">
            <h1 className="text-2xl font-bold text-foreground mb-4">Campaign not found</h1>
            <p className="text-muted-foreground mb-6">The campaign you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </main>
      </div>
    )
  }

  const config = categoryConfig[category]
  const backLink = categoryBackLinks[category]
  const executionSteps = (campaign.execution_steps as unknown as ExecutionStep[]) || []

  // Get example images
  const exampleImages: string[] = []
  if ('example_images' in campaign && Array.isArray(campaign.example_images)) {
    exampleImages.push(...campaign.example_images)
  }
  if ('example_image_url' in campaign && campaign.example_image_url) {
    if (!exampleImages.includes(campaign.example_image_url)) {
      exampleImages.unshift(campaign.example_image_url)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 relative overflow-hidden">
        {/* Top Navigation */}
        <div className="flex items-center justify-between px-6 py-4">
          <Link
            href={backLink.href}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{campaign.name}</span>
            <Badge className={cn(config.color, config.darkColor, 'border-0')}>
              {config.label}
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleFavoriteToggle}
            disabled={isFavoriteLoading}
            className={cn(
              'rounded-full',
              isFavorite && 'text-red-500 hover:text-red-600'
            )}
          >
            <Heart className={cn('w-5 h-5', isFavorite && 'fill-current')} />
          </Button>
        </div>

        {/* Hero Content */}
        <div className="px-6 pb-12 pt-4 flex items-center justify-between gap-8">
          <div className="flex-1">
            <Badge className={cn(config.color, config.darkColor, 'border-0 mb-4')}>
              {config.label}
            </Badge>
            <h1 className="text-3xl font-bold text-foreground">{campaign.name}</h1>
          </div>

          {/* Phone Mockup Preview */}
          {exampleImages.length > 0 && (
            <div className="hidden md:block flex-shrink-0">
              <div className="relative w-48 h-auto">
                <img
                  src={exampleImages[0]}
                  alt="Campaign preview"
                  className="w-full h-auto rounded-2xl shadow-2xl border-4 border-gray-800 dark:border-gray-700"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        {/* Introduction */}
        {campaign.introduction && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">Introduction</h2>
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: campaign.introduction }}
            />
          </section>
        )}

        {/* Category-specific content */}
        {category === 'email-campaigns' && 'subject_line' in campaign && (
          <section className="mb-10 space-y-4">
            <h2 className="text-xl font-semibold text-foreground mb-4">Email Content</h2>

            {/* Subject Line */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Subject Line</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(campaign.subject_line, 'subject')}
                  className="h-8"
                >
                  {copiedText === 'subject' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-foreground">{campaign.subject_line}</p>
            </div>

            {/* Email Body */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Email Body</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(campaign.email_body.replace(/<[^>]*>/g, ''), 'body')}
                  className="h-8"
                >
                  {copiedText === 'body' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: campaign.email_body }}
              />
            </div>
          </section>
        )}

        {category === 'phone-text-scripts' && (
          <section className="mb-10 space-y-4">
            <h2 className="text-xl font-semibold text-foreground mb-4">Text Messages</h2>

            {['text_message_1', 'text_message_2', 'text_message_3'].map((key, index) => {
              const message = (campaign as any)[key]
              if (!message) return null
              return (
                <div key={key} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Message {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(message, key)}
                      className="h-8"
                    >
                      {copiedText === key ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-foreground whitespace-pre-wrap">{message}</p>
                </div>
              )
            })}
          </section>
        )}

        {/* Execution Steps */}
        {executionSteps.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-6">How to Execute</h2>

            <div className="space-y-6">
              {executionSteps.map((step, index) => (
                <div key={index} className="relative">
                  {/* Step indicator */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      {step.step || index + 1}
                    </div>

                    <div className="flex-1 pt-1">
                      {/* Step header */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">Step {step.step || index + 1}</span>
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2">{step.title}</h3>

                      {step.description && (
                        <p className="text-muted-foreground mb-4">{step.description}</p>
                      )}

                      {/* Template link */}
                      {step.template && (
                        <div className="bg-card border border-border rounded-lg p-4 mb-4 flex items-center gap-4">
                          {step.template.thumbnail && (
                            <img
                              src={step.template.thumbnail}
                              alt={step.template.title}
                              className="w-20 h-14 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-blue-500" />
                              {step.template.title}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={step.template.url} target="_blank" rel="noopener noreferrer">
                              Get Template
                            </a>
                          </Button>
                        </div>
                      )}

                      {/* Substeps */}
                      {step.substeps && step.substeps.length > 0 && (
                        <div className="space-y-3 ml-1">
                          {step.substeps.map((substep) => (
                            <div key={substep.number}>
                              <p className="text-foreground">
                                <span className="font-medium">{substep.number}. {substep.title}</span>
                              </p>
                              {substep.description && (
                                <p className="text-sm text-muted-foreground mt-0.5">{substep.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Connector line */}
                  {index < executionSteps.length - 1 && (
                    <div className="absolute left-4 top-10 bottom-0 w-px bg-border -translate-x-1/2" style={{ height: 'calc(100% - 2rem)' }} />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Canva Template Link (if no execution steps but has template URL) */}
        {'canva_template_url' in campaign && campaign.canva_template_url && executionSteps.length === 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">Template</h2>
            <Button asChild>
              <a href={campaign.canva_template_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Canva
              </a>
            </Button>
          </section>
        )}

        {/* Examples */}
        {exampleImages.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-6">Examples</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exampleImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-950/50 dark:to-blue-900/30 rounded-2xl p-6 flex items-center justify-center"
                >
                  <img
                    src={imageUrl}
                    alt={`Example ${index + 1}`}
                    className="max-w-full h-auto rounded-xl shadow-lg"
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function CampaignDetailSkeleton() {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Hero Skeleton */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 px-6 py-4">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <div className="pb-8">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-10 w-80" />
        </div>
      </div>

      {/* Content Skeleton */}
      <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        <Skeleton className="h-8 w-40 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-8" />

        <Skeleton className="h-8 w-48 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </main>
    </div>
  )
}
