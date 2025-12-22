'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  Sparkles,
  ExternalLink,
  Check,
  X,
  Plus,
  Clock,
  Eye,
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
  YouTubeVideo,
  VideoCategory,
  VideoCreator,
  PsychologicalTrigger,
  PowerWord,
  ExtractedYouTubeData,
} from '@/types/youtube'
import { formatDuration } from '@/lib/supadata'

interface YouTubeVideoEditorProps {
  videoId?: string // If provided, we're editing
}

interface AIGeneratedResponse {
  ai_summary: string
  suggested_hook: string
  suggested_cta: string
  suggested_triggers: string[]
  suggested_power_words: string[]
  matched_triggers: Array<{ name: string; slug: string; isNew: boolean }>
  matched_power_words: Array<{ name: string; slug: string; isNew: boolean }>
}

export function YouTubeVideoEditor({ videoId }: YouTubeVideoEditorProps) {
  const router = useRouter()
  const isEditing = Boolean(videoId)

  // Form state
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [youtubeId, setYoutubeId] = useState('')
  const [videoRuntime, setVideoRuntime] = useState(0)
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [viewCount, setViewCount] = useState(0)
  const [datePostedYt, setDatePostedYt] = useState('')
  const [transcript, setTranscript] = useState('')
  const [aiSummary, setAiSummary] = useState('')
  const [hookText, setHookText] = useState('')
  const [cta, setCta] = useState('')
  const [score, setScore] = useState<number | ''>('')
  const [greaterSign, setGreaterSign] = useState('')
  const [isActive, setIsActive] = useState(false)

  // Selections
  const [creatorId, setCreatorId] = useState<string>('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [selectedTriggerIds, setSelectedTriggerIds] = useState<string[]>([])
  const [selectedPowerWordIds, setSelectedPowerWordIds] = useState<string[]>([])

  // Reference data
  const [categories, setCategories] = useState<VideoCategory[]>([])
  const [creators, setCreators] = useState<VideoCreator[]>([])
  const [triggers, setTriggers] = useState<PsychologicalTrigger[]>([])
  const [powerWords, setPowerWords] = useState<PowerWord[]>([])

  // New creator/category being created
  const [newCreator, setNewCreator] = useState<{
    name: string
    channel_id: string
    channel_url: string
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
      const response = await fetch(`/api/youtube/videos/${id}`)
      const data = await response.json()
      if (data.video) {
        const video = data.video as YouTubeVideo
        setYoutubeUrl(video.youtube_url)
        setName(video.name)
        setSlug(video.slug)
        setYoutubeId(video.youtube_id)
        setVideoRuntime(video.video_runtime)
        setThumbnailUrl(video.thumbnail_url || '')
        setViewCount(video.view_count)
        setDatePostedYt(video.date_posted_yt || '')
        setTranscript(video.transcript || '')
        setAiSummary(video.ai_summary || '')
        setHookText(video.hook?.hook_text || '')
        setCta(video.cta || '')
        setScore(video.score || '')
        setGreaterSign(video.greater_sign || '')
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
      const response = await fetch('/api/youtube/categories')
      const data = await response.json()
      if (data.categories) setCategories(data.categories)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchCreators = async () => {
    try {
      const response = await fetch('/api/youtube/creators')
      const data = await response.json()
      if (data.creators) setCreators(data.creators)
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
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL')
      return
    }

    setIsExtracting(true)
    setError('')

    try {
      const response = await fetch('/api/youtube/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409 && data.existing) {
          setError(`Video already exists: "${data.existing.name}"`)
          return
        }
        throw new Error(data.error || 'Failed to extract video data')
      }

      // Populate form with extracted data
      setName(data.title)
      setSlug(data.slug)
      setYoutubeId(data.youtube_id)
      setVideoRuntime(data.duration)
      setThumbnailUrl(data.thumbnail)
      setViewCount(data.viewCount)
      setDatePostedYt(data.uploadDate)
      setTranscript(data.transcript)

      // Handle creator
      if (data.creator) {
        if (data.creator.existing) {
          setCreatorId(data.creator.id)
          setNewCreator(null)
        } else {
          setCreatorId('')
          setNewCreator({
            name: data.creator.name,
            channel_id: data.creator.channel_id,
            channel_url: data.creator.channel_url,
          })
        }
      }
    } catch (error) {
      console.error('Extract error:', error)
      setError(error instanceof Error ? error.message : 'Failed to extract video data')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleGenerateAI = async () => {
    if (!transcript) {
      setError('Please extract a video first to get the transcript')
      return
    }

    setIsGeneratingAI(true)
    setError('')

    try {
      const response = await fetch('/api/youtube/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          title: name,
          description: '',
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
    } catch (error) {
      console.error('Generate AI error:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate AI content')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleSave = async () => {
    if (!name || !youtubeUrl || !youtubeId) {
      setError('Please extract a video first')
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
        // Refresh triggers list
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
        // Refresh power words list
        await fetchPowerWords()
      }

      // Handle new category
      let finalCategoryId = categoryId
      if (showNewCategory && newCategoryName) {
        const catResponse = await fetch('/api/youtube/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCategoryName }),
        })
        const catData = await catResponse.json()
        if (catData.category) {
          finalCategoryId = catData.category.id
        }
      }

      // Prepare video data
      const videoData = {
        name,
        slug,
        youtube_url: youtubeUrl,
        youtube_id: youtubeId,
        video_runtime: videoRuntime,
        score: score === '' ? null : score,
        greater_sign: greaterSign || null,
        hook_text: hookText || null,
        creator_id: creatorId || null,
        new_creator: newCreator,
        category_id: finalCategoryId || null,
        date_posted_yt: datePostedYt || null,
        cta: cta || null,
        ai_summary: aiSummary || null,
        transcript: transcript || null,
        thumbnail_url: thumbnailUrl || null,
        view_count: viewCount,
        is_active: isActive,
        trigger_ids: selectedTriggerIds,
        power_word_ids: selectedPowerWordIds,
      }

      const response = await fetch(
        isEditing ? `/api/youtube/videos/${videoId}` : '/api/youtube/videos',
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

      router.push('/admin/youtube')
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

  return (
    <div className="max-w-4xl">
      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-4 mb-6">
          {error}
        </div>
      )}

      {/* Step 1: YouTube URL Input */}
      <div className="bg-background border border-border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {isEditing ? 'Video Information' : 'Step 1: Enter YouTube URL'}
        </h2>
        <div className="flex gap-3">
          <Input
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            disabled={isExtracting}
            className="flex-1"
          />
          <Button onClick={handleExtract} disabled={isExtracting || !youtubeUrl.trim()}>
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

        {/* Extracted Preview */}
        {youtubeId && (
          <div className="mt-4 flex gap-4 p-4 bg-muted/50 rounded-lg">
            {thumbnailUrl && (
              <img
                src={thumbnailUrl}
                alt={name}
                className="w-32 h-20 rounded object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{name}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(videoRuntime)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {viewCount.toLocaleString()} views
                </span>
              </div>
              {newCreator && (
                <p className="text-sm text-muted-foreground mt-1">
                  Channel: {newCreator.name} (will be created)
                </p>
              )}
            </div>
            <a
              href={youtubeUrl}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="creator">Creator</Label>
              {newCreator ? (
                <div className="flex items-center gap-2">
                  <Input value={newCreator.name} disabled className="flex-1" />
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
                      {creator.name}
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
              <Label htmlFor="score">Score</Label>
              <Input
                id="score"
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value ? parseInt(e.target.value) : '')}
                placeholder="Optional score"
              />
            </div>
            <div>
              <Label htmlFor="greater_sign">Greater Sign</Label>
              <Input
                id="greater_sign"
                value={greaterSign}
                onChange={(e) => setGreaterSign(e.target.value)}
                placeholder="e.g., '> 10K views'"
              />
            </div>
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
          {/* Show new suggested triggers */}
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
          {/* Show new suggested power words */}
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
        <Button variant="outline" onClick={() => router.push('/admin/youtube')}>
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
