'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Plus, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { Select } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/slug-utils'
import type { KickoffHost } from '@/types/kickoffs'

interface KickoffEditorProps {
  kickoffId?: string
}

interface CampaignOption {
  slug: string
  name: string
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function KickoffEditor({ kickoffId }: KickoffEditorProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEditMode = !!kickoffId

  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [overview, setOverview] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [month, setMonth] = useState('')
  const [campaignWeekName, setCampaignWeekName] = useState('')
  const [socialCampaignSlug, setSocialCampaignSlug] = useState('')
  const [textCampaignSlug, setTextCampaignSlug] = useState('')
  const [emailCampaignSlug, setEmailCampaignSlug] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [resources, setResources] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)
  const [isDraft, setIsDraft] = useState(false)

  // Host selection
  const [allHosts, setAllHosts] = useState<KickoffHost[]>([])
  const [selectedHostIds, setSelectedHostIds] = useState<string[]>([])
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([])

  // Campaign options
  const [socialCampaigns, setSocialCampaigns] = useState<CampaignOption[]>([])
  const [textCampaigns, setTextCampaigns] = useState<CampaignOption[]>([])
  const [emailCampaigns, setEmailCampaigns] = useState<CampaignOption[]>([])

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // Generate slug from name
  useEffect(() => {
    if (!isEditMode && name) {
      setSlug(generateSlug(name))
    }
  }, [name, isEditMode])

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)

      // Fetch hosts
      const { data: hostsData } = await supabase
        .from('kickoff_hosts')
        .select('*')
        .order('name')

      if (hostsData) {
        setAllHosts(hostsData)
      }

      // Fetch campaigns for dropdowns
      const [socialRes, textRes, emailRes] = await Promise.all([
        supabase.from('social_shareables').select('slug, name').eq('is_active', true).order('name'),
        supabase.from('phone_text_scripts').select('slug, name').eq('is_active', true).order('name'),
        supabase.from('email_campaigns').select('slug, name').eq('is_active', true).order('name'),
      ])

      if (socialRes.data) setSocialCampaigns(socialRes.data)
      if (textRes.data) setTextCampaigns(textRes.data)
      if (emailRes.data) setEmailCampaigns(emailRes.data)

      // If editing, load kickoff data
      if (kickoffId) {
        const { data: kickoff } = await supabase
          .from('campaign_kickoffs')
          .select('*')
          .eq('id', kickoffId)
          .single()

        if (kickoff) {
          setName(kickoff.name)
          setSlug(kickoff.slug)
          setOverview(kickoff.overview || '')
          setStartDate(kickoff.start_date || '')
          setEndDate(kickoff.end_date || '')
          setMonth(kickoff.month || '')
          setCampaignWeekName(kickoff.campaign_week_name || '')
          setSocialCampaignSlug(kickoff.social_campaign_slug || '')
          setTextCampaignSlug(kickoff.text_campaign_slug || '')
          setEmailCampaignSlug(kickoff.email_campaign_slug || '')
          setVideoUrl(kickoff.video_url || '')
          setCtaUrl(kickoff.cta_url || '')
          setResources(kickoff.resources || [])
          setIsActive(kickoff.is_active)
          setIsDraft(kickoff.is_draft)

          // Load host assignments
          const { data: assignments } = await supabase
            .from('kickoff_host_assignments')
            .select('host_id, role')
            .eq('kickoff_id', kickoffId)

          if (assignments) {
            setSelectedHostIds(assignments.filter(a => a.role === 'host').map(a => a.host_id))
            setSelectedGuestIds(assignments.filter(a => a.role === 'guest').map(a => a.host_id))
          }
        }
      }

      setIsLoading(false)
    }

    loadData()
  }, [kickoffId])

  const toggleHost = useCallback((hostId: string) => {
    setSelectedHostIds(prev =>
      prev.includes(hostId)
        ? prev.filter(id => id !== hostId)
        : [...prev, hostId]
    )
  }, [])

  const toggleGuest = useCallback((hostId: string) => {
    setSelectedGuestIds(prev =>
      prev.includes(hostId)
        ? prev.filter(id => id !== hostId)
        : [...prev, hostId]
    )
  }, [])

  const addResource = () => {
    setResources(prev => [...prev, ''])
  }

  const updateResource = (index: number, value: string) => {
    setResources(prev => prev.map((r, i) => i === index ? value : r))
  }

  const removeResource = (index: number) => {
    setResources(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      const kickoffData = {
        name,
        slug,
        overview: overview || null,
        start_date: startDate || null,
        end_date: endDate || null,
        month: month || null,
        campaign_week_name: campaignWeekName || null,
        social_campaign_slug: socialCampaignSlug || null,
        text_campaign_slug: textCampaignSlug || null,
        email_campaign_slug: emailCampaignSlug || null,
        video_url: videoUrl || null,
        cta_url: ctaUrl || null,
        resources: resources.filter(r => r.trim()) || null,
        is_active: isActive,
        is_draft: isDraft,
        updated_at: new Date().toISOString(),
      }

      let savedKickoffId = kickoffId

      if (isEditMode) {
        const { error: updateError } = await supabase
          .from('campaign_kickoffs')
          .update(kickoffData)
          .eq('id', kickoffId)

        if (updateError) throw updateError
      } else {
        const { data: newKickoff, error: insertError } = await supabase
          .from('campaign_kickoffs')
          .insert(kickoffData)
          .select('id')
          .single()

        if (insertError) throw insertError
        savedKickoffId = newKickoff.id
      }

      // Update host assignments
      // Delete existing
      await supabase
        .from('kickoff_host_assignments')
        .delete()
        .eq('kickoff_id', savedKickoffId)

      // Insert new
      const assignments = [
        ...selectedHostIds.map(hostId => ({
          kickoff_id: savedKickoffId,
          host_id: hostId,
          role: 'host',
        })),
        ...selectedGuestIds.map(hostId => ({
          kickoff_id: savedKickoffId,
          host_id: hostId,
          role: 'guest',
        })),
      ]

      if (assignments.length > 0) {
        const { error: assignError } = await supabase
          .from('kickoff_host_assignments')
          .insert(assignments)

        if (assignError) throw assignError
      }

      router.push('/admin/kickoffs')
    } catch (err) {
      console.error('Error saving kickoff:', err)
      setError(err instanceof Error ? err.message : 'Failed to save kickoff')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/kickoffs">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">
          {isEditMode ? 'Edit Kickoff' : 'New Kickoff'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md p-3">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Basic Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Campaign Kickoff Title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated-from-name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="overview">Overview</Label>
            <Textarea
              id="overview"
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              placeholder="Description of this kickoff session..."
              rows={5}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Schedule</h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select
                id="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                <option value="">Select month</option>
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaignWeekName">Campaign Week Name</Label>
            <Input
              id="campaignWeekName"
              value={campaignWeekName}
              onChange={(e) => setCampaignWeekName(e.target.value)}
              placeholder="e.g., 39--sep-22---sep-26"
            />
          </div>
        </div>

        {/* Hosts & Guests */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Hosts & Guests</h2>

          <div className="space-y-2">
            <Label>Hosts</Label>
            <div className="flex flex-wrap gap-2">
              {allHosts.map((host) => (
                <button
                  key={host.id}
                  type="button"
                  onClick={() => toggleHost(host.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    selectedHostIds.includes(host.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {host.avatar_url ? (
                    <Image
                      src={host.avatar_url}
                      alt={host.name}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                      {host.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm">{host.name}</span>
                  {selectedHostIds.includes(host.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Guests</Label>
            <div className="flex flex-wrap gap-2">
              {allHosts.map((host) => (
                <button
                  key={host.id}
                  type="button"
                  onClick={() => toggleGuest(host.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    selectedGuestIds.includes(host.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {host.avatar_url ? (
                    <Image
                      src={host.avatar_url}
                      alt={host.name}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                      {host.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm">{host.name}</span>
                  {selectedGuestIds.includes(host.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Linked Campaigns */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Linked Campaigns</h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Social Campaign</Label>
              <Select
                value={socialCampaignSlug}
                onChange={(e) => setSocialCampaignSlug(e.target.value)}
              >
                <option value="">None</option>
                {socialCampaigns.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Text/Phone Campaign</Label>
              <Select
                value={textCampaignSlug}
                onChange={(e) => setTextCampaignSlug(e.target.value)}
              >
                <option value="">None</option>
                {textCampaigns.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email Campaign</Label>
              <Select
                value={emailCampaignSlug}
                onChange={(e) => setEmailCampaignSlug(e.target.value)}
              >
                <option value="">None</option>
                {emailCampaigns.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Media & Links</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL (YouTube)</Label>
              <Input
                id="videoUrl"
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaUrl">CTA URL (Zoom Registration)</Label>
              <Input
                id="ctaUrl"
                type="url"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="https://zoom.us/webinar/register/..."
              />
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Resources</h2>
            <Button type="button" variant="outline" size="sm" onClick={addResource}>
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </div>

          {resources.length === 0 ? (
            <p className="text-sm text-muted-foreground">No resources added yet.</p>
          ) : (
            <div className="space-y-2">
              {resources.map((resource, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={resource}
                    onChange={(e) => updateResource(index, e.target.value)}
                    placeholder="https://..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeResource(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Status</h2>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isDraft"
                checked={isDraft}
                onCheckedChange={setIsDraft}
              />
              <Label htmlFor="isDraft">Draft</Label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Spinner size="sm" />
                Saving...
              </>
            ) : isEditMode ? (
              'Update Kickoff'
            ) : (
              'Create Kickoff'
            )}
          </Button>
          <Link href="/admin/kickoffs">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
