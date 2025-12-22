'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Heart, ExternalLink, Copy, Check, ChevronDown, Search, Target, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Campaign, CampaignCategory, categoryConfig } from '@/types/campaigns'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

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

// Category-specific gradient styles (matching CampaignCard)
const categoryGradientStyles: Record<CampaignCategory, React.CSSProperties> = {
  'phone-text-scripts': { background: 'linear-gradient(to bottom, #FFEBAF 0%, #FEF8EC 67%)' },
  'email-campaigns': { background: 'linear-gradient(to bottom, #AED4C7 0%, #F7F9F7 40%)' },
  'social-shareables': { background: 'linear-gradient(to bottom, #A4CDFF 0%, #F3F7FF 40%)' },
  'direct-mail': { background: 'linear-gradient(to bottom, #F6C9BC 0%, #FFEFEA 40%)' },
}

// Category-specific example card background colors
const categoryExampleBg: Record<CampaignCategory, string> = {
  'phone-text-scripts': 'bg-[#FEF8EC]',
  'email-campaigns': 'bg-[#F7F9F7]',
  'social-shareables': 'bg-[#F3F7FF]',
  'direct-mail': 'bg-[#FFEFEA]',
}

// Category-specific fade colors for bottom mask
const categoryFadeColors: Record<CampaignCategory, string> = {
  'phone-text-scripts': 'from-transparent via-[#FEF8EC]/80 to-[#FEF8EC]',
  'email-campaigns': 'from-transparent via-[#F7F9F7]/80 to-[#F7F9F7]',
  'social-shareables': 'from-transparent via-[#F3F7FF]/80 to-[#F3F7FF]',
  'direct-mail': 'from-transparent via-[#FFEFEA]/80 to-[#FFEFEA]',
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
        const response = await fetch(`/api/campaign/${category}/${slug}`)
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

  const heroGradient = categoryGradientStyles[category]
  const exampleBgClass = categoryExampleBg[category]
  const fadeClass = categoryFadeColors[category]

  // Region flag mapping
  const regionFlags: Record<string, { flag: string; label: string }> = {
    'US': { flag: '🇺🇸', label: 'US Market' },
    'CA': { flag: '🇨🇦', label: 'Canada Market' },
    'US,CA': { flag: '🌎', label: 'US & Canada' },
    'global': { flag: '🌍', label: 'Global' },
  }
  const regionInfo = regionFlags[campaign.region] || regionFlags['global']

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* Hero Section */}
      <div className="relative overflow-hidden px-8" style={heroGradient}>
        {/* Top Navigation */}
        <div className="flex items-center justify-between py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleFavoriteToggle}
            disabled={isFavoriteLoading}
            className={cn(
              'rounded-full hover:bg-foreground/10',
              isFavorite && 'text-red-500 hover:text-red-600'
            )}
          >
            <Heart className={cn('w-5 h-5', isFavorite && 'fill-current')} />
          </Button>
        </div>

        {/* Hero Content */}
        <div className="flex items-center justify-center gap-12 py-4">
          {/* Left: Title */}
          <div className="w-[500px] text-center">
            <Badge className="bg-foreground/10 text-foreground text-xs font-medium border-0 mb-3 hover:bg-foreground/10">
              {config.label}
            </Badge>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">{campaign.name}</h1>
            {/* Region indicator */}
            <div className="flex items-center justify-center gap-1.5 mt-4 text-sm text-foreground/60">
              <span>{regionInfo.flag}</span>
              <span>Created for {regionInfo.label}</span>
            </div>
          </div>

          {/* Right: Thumbnail Preview */}
          {campaign.thumbnail_url && (
            <div className="hidden md:block flex-shrink-0">
              <div className="relative w-[500px] h-auto overflow-hidden rounded-lg">
                <img
                  src={campaign.thumbnail_url}
                  alt="Campaign preview"
                  className="w-full h-auto"
                />
                {/* Bottom fade mask */}
                <div className={cn('absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b pointer-events-none', fadeClass)} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-8 py-8 max-w-3xl mx-auto w-full">
        {/* Introduction */}
        {campaign.introduction && (
          <section className="mb-8 pb-8 border-b border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">Introduction</h2>
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-foreground/80 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: campaign.introduction }}
            />
          </section>
        )}

        {/* Recommended Audience Section */}
        {'target_audience' in campaign && campaign.target_audience && (
          <section className="mb-8 pb-8 border-b border-border">
            <h2 className="text-xl font-bold text-foreground mb-2">Recommended Audience</h2>
            <p className="text-sm text-muted-foreground mb-4">For best results with this campaign, you'll want to have these core lists ready.</p>

            <div className="space-y-2">
              {/* Farm List */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">Farm List</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 pt-2 bg-card border border-t-0 border-border rounded-b-lg -mt-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    This is your core mailing audience—used for general awareness and market education. Build your list using the following filters:
                  </p>
                  <ul className="text-sm text-foreground space-y-1.5 list-disc list-inside">
                    <li>Homeowners who've owned for <strong>10+ years</strong></li>
                    <li><strong>50%+ equity</strong></li>
                    <li>Areas with strong <strong>total commission opportunity</strong> (transaction volume × average price)</li>
                  </ul>
                </CollapsibleContent>
              </Collapsible>

              {/* Radius Lists */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">Radius Lists</span>
                    {campaign.target_audience?.toLowerCase().includes('radius') && (
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs border-0">
                        Recommended Audience For This Campaign
                      </Badge>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 pt-2 bg-card border border-t-0 border-border rounded-b-lg -mt-2">
                  <p className="text-sm text-muted-foreground">
                    Target homeowners within a specific radius of your recent sales or active listings.
                  </p>
                </CollapsibleContent>
              </Collapsible>

              {/* Specialty Lists */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Star className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">Specialty Lists</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 pt-2 bg-card border border-t-0 border-border rounded-b-lg -mt-2">
                  <p className="text-sm text-muted-foreground">
                    Niche audiences like expired listings, FSBOs, absentee owners, or pre-foreclosures.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </section>
        )}

        {/* How to Execute Section */}
        <section className="mb-8 pb-8 border-b border-border">
          <h2 className="text-xl font-bold text-foreground mb-6">How to Execute</h2>

          <div className="space-y-8">
            {/* Step 1: Copy Content (for email campaigns) */}
            {category === 'email-campaigns' && 'subject_line' in campaign && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-foreground mt-2" />
                <div className="flex-1">
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs font-medium border-0 mb-2">
                    Step 1
                  </Badge>
                  <h3 className="text-base font-semibold text-foreground mb-4">Copy Subject Line and Message to Email Blast App</h3>

                  {/* Subject Line Card */}
                  <div className="bg-card border border-border rounded-lg mb-3">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                      <span className="text-xs text-muted-foreground">Subject</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(campaign.subject_line, 'subject')}
                        className="h-7 text-xs"
                      >
                        {copiedText === 'subject' ? (
                          <><Check className="w-3 h-3 mr-1 text-green-500" /> Copied</>
                        ) : (
                          'Copy'
                        )}
                      </Button>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-sm text-foreground font-medium">{campaign.subject_line}</p>
                    </div>
                  </div>

                  {/* Body Card */}
                  <div className="bg-card border border-border rounded-lg">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                      <span className="text-xs text-muted-foreground">Body</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(campaign.email_body.replace(/<[^>]*>/g, ''), 'body')}
                        className="h-7 text-xs"
                      >
                        {copiedText === 'body' ? (
                          <><Check className="w-3 h-3 mr-1 text-green-500" /> Copied</>
                        ) : (
                          'Copy'
                        )}
                      </Button>
                    </div>
                    <div className="px-4 py-3">
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none text-sm"
                        dangerouslySetInnerHTML={{ __html: campaign.email_body }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Copy Text Messages (for phone-text-scripts) */}
            {category === 'phone-text-scripts' && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-foreground mt-2" />
                <div className="flex-1">
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs font-medium border-0 mb-2">
                    Step 1
                  </Badge>
                  <h3 className="text-base font-semibold text-foreground mb-4">Copy Text Messages</h3>

                  <div className="space-y-3">
                    {['text_message_1', 'text_message_2', 'text_message_3'].map((key, index) => {
                      const message = (campaign as any)[key]
                      if (!message) return null
                      // Strip HTML tags for plain text display and copying
                      const plainTextMessage = message.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
                      return (
                        <div key={key} className="bg-card border border-border rounded-lg">
                          <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                            <span className="text-xs text-muted-foreground">Message {index + 1}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(plainTextMessage, key)}
                              className="h-7 text-xs"
                            >
                              {copiedText === key ? (
                                <><Check className="w-3 h-3 mr-1 text-green-500" /> Copied</>
                              ) : (
                                'Copy'
                              )}
                            </Button>
                          </div>
                          <div className="px-4 py-3">
                            <p className="text-sm text-foreground whitespace-pre-wrap">{plainTextMessage}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Get Template (for social-shareables) */}
            {category === 'social-shareables' && 'canva_template_url' in campaign && campaign.canva_template_url && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-foreground mt-2" />
                <div className="flex-1">
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs font-medium border-0 mb-2">
                    Step 1
                  </Badge>
                  <h3 className="text-base font-semibold text-foreground mb-4">Customize Your Template</h3>

                  <div className="bg-card border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Click the button below to open the template in Canva. Make a copy and customize it with your branding, photos, and market information.
                    </p>
                    <Button asChild>
                      <a href={campaign.canva_template_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Template in Canva
                      </a>
                    </Button>
                  </div>

                  {/* Video Script if available */}
                  {'video_script' in campaign && campaign.video_script && (
                    <div className="mt-4 bg-card border border-border rounded-lg">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                        <span className="text-xs text-muted-foreground">Video Script</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard((campaign.video_script ?? '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim(), 'script')}
                          className="h-7 text-xs"
                        >
                          {copiedText === 'script' ? (
                            <><Check className="w-3 h-3 mr-1 text-green-500" /> Copied</>
                          ) : (
                            'Copy'
                          )}
                        </Button>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {(campaign.video_script ?? '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Hashtags if available */}
                  {'hashtags' in campaign && campaign.hashtags && campaign.hashtags.length > 0 && (
                    <div className="mt-4 bg-card border border-border rounded-lg">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                        <span className="text-xs text-muted-foreground">Hashtags</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(campaign.hashtags.map((h: string) => h.startsWith('#') ? h : `#${h}`).join(' '), 'hashtags')}
                          className="h-7 text-xs"
                        >
                          {copiedText === 'hashtags' ? (
                            <><Check className="w-3 h-3 mr-1 text-green-500" /> Copied</>
                          ) : (
                            'Copy'
                          )}
                        </Button>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-sm text-foreground">
                          {campaign.hashtags.map((h: string) => h.startsWith('#') ? h : `#${h}`).join(' ')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 1: Get Template (for direct-mail) */}
            {category === 'direct-mail' && 'canva_template_url' in campaign && campaign.canva_template_url && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-foreground mt-2" />
                <div className="flex-1">
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs font-medium border-0 mb-2">
                    Step 1
                  </Badge>
                  <h3 className="text-base font-semibold text-foreground mb-4">Customize Your Template</h3>

                  <div className="bg-card border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Click the button below to open the template in Canva. Make a copy and customize it with your branding and contact information.
                    </p>
                    <Button asChild>
                      <a href={campaign.canva_template_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Template in Canva
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Execution Steps from database */}
            {executionSteps.map((step, index) => {
              // Calculate step number - add 1 if we showed a Step 1 for this category
              const hasStep1 =
                (category === 'email-campaigns' && 'subject_line' in campaign) ||
                (category === 'phone-text-scripts') ||
                (category === 'social-shareables' && 'canva_template_url' in campaign && campaign.canva_template_url) ||
                (category === 'direct-mail' && 'canva_template_url' in campaign && campaign.canva_template_url)
              const stepNumber = hasStep1 ? index + 2 : index + 1
              return (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-foreground mt-2" />
                  <div className="flex-1">
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs font-medium border-0 mb-2">
                      Step {stepNumber}
                    </Badge>
                    <h3 className="text-base font-semibold text-foreground mb-3">{step.title}</h3>

                    {step.description && (
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none text-sm text-muted-foreground mb-4"
                        dangerouslySetInnerHTML={{ __html: step.description }}
                      />
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
                            <span className="w-3 h-3 rounded-full bg-cyan-500" />
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
                      <ul className="space-y-2 text-sm">
                        {step.substeps.map((substep) => (
                          <li key={substep.number} className="flex gap-2">
                            <span className="text-foreground">•</span>
                            <div>
                              <span className="font-medium text-foreground">{substep.title}</span>
                              {substep.description && (
                                <span className="text-muted-foreground">: {substep.description}</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Final Step: Send/Target Audience */}
            {'target_audience' in campaign && campaign.target_audience && (() => {
              const hasStep1 =
                (category === 'email-campaigns' && 'subject_line' in campaign) ||
                (category === 'phone-text-scripts') ||
                (category === 'social-shareables' && 'canva_template_url' in campaign && campaign.canva_template_url) ||
                (category === 'direct-mail' && 'canva_template_url' in campaign && campaign.canva_template_url)
              return (
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-foreground mt-2" />
                <div className="flex-1">
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs font-medium border-0 mb-2">
                    Step {executionSteps.length + (hasStep1 ? 2 : 1)}
                  </Badge>
                  <h3 className="text-base font-semibold text-foreground mb-3">
                    {category === 'email-campaigns' ? 'Send the email to your database' : 'Send to your target audience'}
                  </h3>

                  <div className="bg-card border border-border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Target Audience</p>
                    <p className="text-sm text-foreground">{campaign.target_audience}</p>
                  </div>
                </div>
              </div>
              )
            })()}
          </div>
        </section>

        {/* Canva Template Link (only if not already shown in Step 1 and no execution steps) */}
        {'canva_template_url' in campaign && campaign.canva_template_url &&
          executionSteps.length === 0 &&
          category !== 'social-shareables' &&
          category !== 'direct-mail' && (
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
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-6">Examples</h2>

            <div className="space-y-6">
              {exampleImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className={cn('rounded-2xl p-8 flex items-center justify-center', exampleBgClass)}
                >
                  <img
                    src={imageUrl}
                    alt={`Example ${index + 1}`}
                    className="max-w-full h-auto rounded-lg"
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
      <div className="bg-muted/50 px-6 py-4">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <div className="pb-8 flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-10 w-80" />
          </div>
          <Skeleton className="hidden md:block h-40 w-56 rounded-xl" />
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
