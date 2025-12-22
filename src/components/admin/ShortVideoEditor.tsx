'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  Sparkles,
  ExternalLink,
  Check,
  X,
  Plus,
  Clock,
  Instagram,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  ShortVideo,
  ShortVideoCategory,
  ShortVideoCreator,
  Platform,
} from '@/types/short-video'
import { PsychologicalTrigger, PowerWord } from '@/types/youtube'

interface ShortVideoEditorProps {
  videoId?: string // If provided, we're editing
}

interface AIGeneratedResponse {
  ai_summary: string
  suggested_hook: string
  suggested_cta: string
  suggested_triggers: string[]
  suggested_power_words: string[]
  suggested_category?: string
  matched_triggers: Array<{ name: string; slug: string; isNew: boolean }>
  matched_power_words: Array<{ name: string; slug: string; isNew: boolean }>
  matched_category?: { id: string; name: string; slug: string } | null
}

// TikTok icon component
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.1z" />
    </svg>
  )
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function ShortVideoEditor({ videoId }: ShortVideoEditorProps) {
  const router = useRouter()
  const isEditing = Boolean(videoId)

  // Form state
  const [sourceUrl, setSourceUrl] = useState('')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [platform, setPlatform] = useState<Platform>('instagram')
  const [videoRuntime, setVideoRuntime] = useState<number | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [description, setDescription] = useState('')
  const [datePosted, setDatePosted] = useState('')
  const [transcript, setTranscript] = useState('')
  const [aiSummary, setAiSummary] = useState('')
  const [hookText, setHookText] = useState('')
  const [cta, setCta] = useState('')
  const [embedCode, setEmbedCode] = useState('')
  const [isActive, setIsActive] = useState(false)

  // Selections
  const [creatorId, setCreatorId] = useState<string>('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [selectedTriggerIds, setSelectedTriggerIds] = useState<string[]>([])
  const [selectedPowerWordIds, setSelectedPowerWordIds] = useState<string[]>([])

  // Reference data
  const [categories, setCategories] = useState<ShortVideoCategory[]>([])
  const [creators, setCreators] = useState<ShortVideoCreator[]>([])
  const [triggers, setTriggers] = useState<PsychologicalTrigger[]>([])
  const [powerWords, setPowerWords] = useState<PowerWord[]>([])

  // New creator/category being created
  const [newCreator, setNewCreator] = useState<{
    name: string
    handle: string
    platform: string
  } | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)

  // AI suggestions (not yet saved)
  const [suggestedTriggers, setSuggestedTriggers] = useState<
    Array<{ name: string; slug: string; isNew: boolean }>
  >([])
  const [suggestedPowerWords, setSuggestedPowerWords] = useState<
    Array<{ name: string; slug: string; isNew: boolean }>
  >([])

  // Loading states
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // Load reference data on mount
  useEffect(() => {
    Promise.all([
      fetchCategories(),
      fetchCreators(),
      fetchTriggers(),
      fetchPowerWords(),
    ])

    if (videoId) {
      fetchVideo(videoId)
    }
  }, [videoId])

  const fetchVideo = async (id: string) => {
    setIsLoadingVideo(true)
    try {
      const response = await fetch(`/api/short-videos/videos/${id}`)
      const video = await response.json() as ShortVideo
      if (video && video.id) {
        setSourceUrl(video.source_url)
        setName(video.name)
        setSlug(video.slug)
        setSourceId(video.source_id || '')
        setPlatform(video.platform)
        setVideoRuntime(video.video_runtime)
        setVideoUrl(video.video_url || '')
        setCoverUrl(video.cover_url || '')
        setDescription(video.description || '')
        setDatePosted(video.date_posted || '')
        setTranscript(video.transcript || '')
        setAiSummary(video.ai_summary || '')
        setHookText(video.hook_text || '')
        setCta(video.cta || '')
        setEmbedCode(video.embed_code || '')
        setIsActive(video.is_active)
        setCreatorId(video.creator_id || '')
        setCategoryId(video.category_id || '')
        setSelectedTriggerIds(video.triggers?.map(t => t.id) || [])
        setSelectedPowerWordIds(video.power_words?.map(p => p.id) || [])
      }
    } catch (error) {
      console.error('Failed to fetch video:', error)
      setError('Failed to load video')
    } finally {
      setIsLoadingVideo(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/short-videos/categories')
      const data = await response.json()
      if (Array.isArray(data)) setCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchCreators = async () => {
    try {
      const response = await fetch('/api/short-videos/creators')
      const data = await response.json()
      if (Array.isArray(data)) setCreators(data)
    } catch (error) {
      console.error('Failed to fetch creators:', error)
    }
  }

  const fetchTriggers = async () => {
    try {
      const response = await fetch('/api/youtube/triggers')
      const data = await response.json()
      if (data.triggers) setTriggers(data.triggers)
    } catch (error) {
      console.error('Failed to fetch triggers:', error)
    }
  }

  const fetchPowerWords = async () => {
    try {
      const response = await fetch('/api/youtube/power-words')
      const data = await response.json()
      if (data.powerWords) setPowerWords(data.powerWords)
    } catch (error) {
      console.error('Failed to fetch power words:', error)
    }
  }

  const handleExtract = async () => {
    if (!sourceUrl.trim()) {
      setError('Please enter an Instagram or TikTok URL')
      return
    }

    setIsExtracting(true)
    setError('')

    try {
      const response = await fetch('/api/short-videos/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sourceUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract video data')
      }

      // Populate form with extracted data
      setName(data.title || '')
      setSlug(data.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || '')
      setSourceId(data.source_id || '')
      setPlatform(data.platform || 'instagram')
      setVideoRuntime(data.duration || null)
      setVideoUrl(data.video_url || '')
      setCoverUrl(data.cover_url || '')
      setDescription(data.description || '')
      setDatePosted(data.date_posted || '')
      setTranscript(data.transcript || '')

      // Handle creator
      if (data.creator) {
        if (data.existing_creator) {
          setCreatorId(data.existing_creator.id)
          setNewCreator(null)
        } else {
          setCreatorId('')
          setNewCreator({
            name: data.creator.name,
            handle: data.creator.handle,
            platform: data.platform,
          })
        }
      }

      // Auto-trigger AI generation if transcript is available
      if (data.transcript) {
        setIsExtracting(false)
        await triggerAIGeneration(data.transcript, data.title, data.description)
        return
      }
    } catch (error) {
      console.error('Extract error:', error)
      setError(error instanceof Error ? error.message : 'Failed to extract video data')
    } finally {
      setIsExtracting(false)
    }
  }

  const triggerAIGeneration = async (
    transcriptText: string,
    titleText: string,
    descriptionText?: string
  ) => {
    setIsGeneratingAI(true)
    setError('')

    try {
      const response = await fetch('/api/short-videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcriptText,
          title: titleText,
          description: descriptionText || '',
        }),
      })

      const data: AIGeneratedResponse = await response.json()

      if (!response.ok) {
        throw new Error((data as { error?: string }).error || 'Failed to generate AI content')
      }

      // Populate AI-generated fields
      setAiSummary(data.ai_summary)
      setHookText(data.suggested_hook)
      setCta(data.suggested_cta)

      // Store suggestions for user to confirm
      setSuggestedTriggers(data.matched_triggers || [])
      setSuggestedPowerWords(data.matched_power_words || [])

      // Auto-select existing triggers/power words
      const existingTriggerIds = data.matched_triggers
        ?.filter(t => !t.isNew)
        .map(t => triggers.find(tr => tr.slug === t.slug)?.id)
        .filter(Boolean) as string[]

      const existingPowerWordIds = data.matched_power_words
        ?.filter(p => !p.isNew)
        .map(p => powerWords.find(pw => pw.slug === p.slug)?.id)
        .filter(Boolean) as string[]

      setSelectedTriggerIds(prev => [...new Set([...prev, ...existingTriggerIds])])
      setSelectedPowerWordIds(prev => [...new Set([...prev, ...existingPowerWordIds])])

      // Auto-select matched category
      if (data.matched_category?.id) {
        setCategoryId(data.matched_category.id)
      }
    } catch (error) {
      console.error('Generate AI error:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate AI content')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleGenerateAI = async () => {
    if (!transcript) {
      setError('Please extract a video first to get the transcript')
      return
    }

    await triggerAIGeneration(transcript, name, description)
  }

  const handleSave = async () => {
    if (!name || !sourceUrl) {
      setError('Please enter a video URL and extract the data')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      // Create new triggers if any
      const newTriggers = suggestedTriggers.filter(t => t.isNew)
      if (newTriggers.length > 0) {
        await fetch('/api/youtube/triggers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ triggers: newTriggers.map(t => t.name) }),
        })
        await fetchTriggers()
      }

      // Create new power words if any
      const newPowerWordsArr = suggestedPowerWords.filter(p => p.isNew)
      if (newPowerWordsArr.length > 0) {
        await fetch('/api/youtube/power-words', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ powerWords: newPowerWordsArr.map(p => p.name) }),
        })
        await fetchPowerWords()
      }

      // Handle new category
      let finalCategoryId = categoryId
      if (showNewCategory && newCategoryName) {
        const catResponse = await fetch('/api/short-videos/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCategoryName }),
        })
        const catData = await catResponse.json()
        if (catData?.id) {
          finalCategoryId = catData.id
        }
      }

      // Handle new creator
      let finalCreatorId = creatorId
      if (newCreator) {
        const creatorResponse = await fetch('/api/short-videos/creators', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newCreator.name,
            handle: newCreator.handle,
            platform: newCreator.platform,
          }),
        })
        const creatorData = await creatorResponse.json()
        if (creatorData?.id) {
          finalCreatorId = creatorData.id
        }
      }

      // Prepare video data
      const videoData = {
        name,
        slug,
        platform,
        source_url: sourceUrl,
        source_id: sourceId || null,
        video_url: videoUrl || null,
        cover_url: coverUrl || null,
        video_runtime: videoRuntime,
        description: description || null,
        creator_id: finalCreatorId || null,
        category_id: finalCategoryId || null,
        date_posted: datePosted || null,
        transcript: transcript || null,
        ai_summary: aiSummary || null,
        hook_text: hookText || null,
        cta: cta || null,
        embed_code: embedCode || null,
        is_active: isActive,
        trigger_ids: selectedTriggerIds,
        power_word_ids: selectedPowerWordIds,
      }

      const response = await fetch(
        isEditing ? `/api/short-videos/videos/${videoId}` : '/api/short-videos/videos',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(videoData),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save video')
      }

      router.push('/admin/short-videos')
    } catch (error) {
      console.error('Save error:', error)
      setError(error instanceof Error ? error.message : 'Failed to save video')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleTrigger = (id: string) => {
    setSelectedTriggerIds(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const togglePowerWord = (id: string) => {
    setSelectedPowerWordIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  if (isLoadingVideo) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  const PlatformIcon = platform === 'tiktok' ? TikTokIcon : Instagram

  return (
    <div className="max-w-4xl">
      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-4 mb-6">
          {error}
        </div>
      )}

      {/* Step 1: URL Input */}
      <div className="bg-background border border-border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {isEditing ? 'Video Information' : 'Step 1: Enter Instagram/TikTok URL'}
        </h2>
        <div className="flex gap-3">
          <Input
            placeholder="https://www.instagram.com/reel/... or https://www.tiktok.com/@user/video/..."
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            disabled={isExtracting}
            className="flex-1"
          />
          <Button onClick={handleExtract} disabled={isExtracting || !sourceUrl.trim()}>
            {isExtracting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Extracting...
              </>
            ) : (
              'Extract'
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Supports Instagram Reels and TikTok videos. Video will be downloaded and hosted on ImageKit.
        </p>

        {/* Extracted Preview */}
        {(coverUrl || videoUrl || name) && (
          <div className="mt-4 flex gap-4 p-4 bg-muted/50 rounded-lg">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={name}
                className="w-24 h-32 rounded object-cover"
              />
            ) : videoUrl ? (
              <video
                src={videoUrl}
                className="w-24 h-32 rounded object-cover"
                muted
              />
            ) : null}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <PlatformIcon className="w-4 h-4" />
                <span className="text-xs text-muted-foreground capitalize">{platform}</span>
              </div>
              <h3 className="font-medium line-clamp-2">{name}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                {videoRuntime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(videoRuntime)}
                  </span>
                )}
              </div>
              {newCreator && (
                <p className="text-sm text-muted-foreground mt-1">
                  Creator: @{newCreator.handle} (will be created)
                </p>
              )}
            </div>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>

      {/* Step 2: AI Generation */}
      {transcript && (
        <div className="bg-background border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Step 2: Generate AI Content</h2>
            <Button
              onClick={handleGenerateAI}
              disabled={isGeneratingAI}
              variant="outline"
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate with AI
                </>
              )}
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="ai_summary">AI Summary</Label>
              <Textarea
                id="ai_summary"
                value={aiSummary}
                onChange={(e) => setAiSummary(e.target.value)}
                rows={3}
                placeholder="AI-generated summary will appear here..."
              />
            </div>

            <div>
              <Label htmlFor="hook_text">Opening Hook</Label>
              <Textarea
                id="hook_text"
                value={hookText}
                onChange={(e) => setHookText(e.target.value)}
                rows={2}
                placeholder="Suggested opening hook..."
              />
            </div>

            <div>
              <Label htmlFor="cta">Call to Action</Label>
              <Input
                id="cta"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="Suggested CTA..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Details */}
      <div className="bg-background border border-border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {transcript ? 'Step 3: Video Details' : 'Video Details'}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Title</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Video caption/description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="creator">Creator</Label>
              {newCreator ? (
                <div className="flex items-center gap-2">
                  <Input value={`@${newCreator.handle}`} disabled className="flex-1" />
                  <span className="text-xs text-muted-foreground">(new)</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNewCreator(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Select
                  value={creatorId}
                  onChange={(e) => setCreatorId(e.target.value)}
                >
                  <option value="">Select creator</option>
                  {creators.map(creator => (
                    <option key={creator.id} value={creator.id}>
                      {creator.name} (@{creator.handle})
                    </option>
                  ))}
                </Select>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              {showNewCategory ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowNewCategory(false)
                      setNewCategoryName('')
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="flex-1"
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewCategory(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="video_url">Video URL (ImageKit)</Label>
              <Input
                id="video_url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://ik.imagekit.io/..."
              />
            </div>
            <div>
              <Label htmlFor="cover_url">Cover URL (ImageKit)</Label>
              <Input
                id="cover_url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://ik.imagekit.io/..."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="embed_code">Embed Code (optional)</Label>
            <Textarea
              id="embed_code"
              value={embedCode}
              onChange={(e) => setEmbedCode(e.target.value)}
              rows={3}
              placeholder="<blockquote class='instagram-media'..."
            />
          </div>

          <div>
            <Label htmlFor="transcript">Transcript</Label>
            <Textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={4}
              placeholder="Video transcript..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="is_active">Published (visible to users)</Label>
          </div>
        </div>
      </div>

      {/* Triggers Selection */}
      <div className="bg-background border border-border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Psychological Triggers</h2>
        {suggestedTriggers.length > 0 && (
          <p className="text-sm text-muted-foreground mb-3">
            AI suggested triggers highlighted in blue
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {triggers.map(trigger => {
            const isSelected = selectedTriggerIds.includes(trigger.id)
            const isSuggested = suggestedTriggers.some(s => s.slug === trigger.slug)
            return (
              <button
                key={trigger.id}
                onClick={() => toggleTrigger(trigger.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm border transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : isSuggested
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-border hover:border-primary/50'
                )}
              >
                {trigger.emoji && <span className="mr-1">{trigger.emoji}</span>}
                {trigger.name}
                {isSelected && <Check className="w-3 h-3 ml-1 inline" />}
              </button>
            )
          })}
          {suggestedTriggers
            .filter(s => s.isNew)
            .map(trigger => (
              <span
                key={trigger.slug}
                className="px-3 py-1.5 rounded-full text-sm border border-dashed border-blue-500 text-blue-600 dark:text-blue-400"
              >
                + {trigger.name} (new)
              </span>
            ))}
        </div>
      </div>

      {/* Power Words Selection */}
      <div className="bg-background border border-border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Power Words</h2>
        {suggestedPowerWords.length > 0 && (
          <p className="text-sm text-muted-foreground mb-3">
            AI suggested power words highlighted in purple
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {powerWords.map(word => {
            const isSelected = selectedPowerWordIds.includes(word.id)
            const isSuggested = suggestedPowerWords.some(s => s.slug === word.slug)
            return (
              <button
                key={word.id}
                onClick={() => togglePowerWord(word.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm border transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : isSuggested
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-border hover:border-primary/50'
                )}
              >
                {word.name}
                {isSelected && <Check className="w-3 h-3 ml-1 inline" />}
              </button>
            )
          })}
          {suggestedPowerWords
            .filter(s => s.isNew)
            .map(word => (
              <span
                key={word.slug}
                className="px-3 py-1.5 rounded-full text-sm border border-dashed border-purple-500 text-purple-600 dark:text-purple-400"
              >
                + {word.name} (new)
              </span>
            ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={() => router.push('/admin/short-videos')}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving || !name}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : isEditing ? (
            'Update Video'
          ) : (
            'Save Video'
          )}
        </Button>
      </div>
    </div>
  )
}
