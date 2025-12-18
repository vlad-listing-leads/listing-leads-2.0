'use client'

import { useState, useEffect } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Pencil, Trash2, X, Megaphone, ExternalLink } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface Announcement {
  id: string
  title: string
  message: string
  link_url: string | null
  link_text: string | null
  bg_color: string
  text_color: string
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  display_order: number
  created_at: string
}

const DEFAULT_ANNOUNCEMENT: Partial<Announcement> = {
  title: '',
  message: '',
  link_url: '',
  link_text: '',
  bg_color: '#3b82f6',
  text_color: '#ffffff',
  is_active: true,
  display_order: 0,
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Partial<Announcement>>(DEFAULT_ANNOUNCEMENT)
  const [isSaving, setIsSaving] = useState(false)

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/admin/announcements')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch announcements')
      }

      setAnnouncements(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch announcements')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const handleCreate = () => {
    setEditingAnnouncement(DEFAULT_ANNOUNCEMENT)
    setIsEditing(true)
  }

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditingAnnouncement(DEFAULT_ANNOUNCEMENT)
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!editingAnnouncement.message) {
      setError('Message is required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const isUpdate = !!editingAnnouncement.id
      const response = await fetch('/api/admin/announcements', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAnnouncement),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save announcement')
      }

      await fetchAnnouncements()
      handleCancel()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save announcement')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/announcements?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete announcement')
      }

      await fetchAnnouncements()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete announcement')
    }
  }

  const handleToggleActive = async (announcement: Announcement) => {
    try {
      const response = await fetch('/api/admin/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...announcement,
          is_active: !announcement.is_active,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update announcement')
      }

      await fetchAnnouncements()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update announcement')
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
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Announcements</h1>
          <p className="mt-1 text-muted-foreground">Manage hello bar announcements displayed to users</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-5 py-4 mb-6">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Edit/Create Form */}
      {isEditing && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editingAnnouncement.id ? 'Edit Announcement' : 'New Announcement'}</CardTitle>
            <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={editingAnnouncement.message || ''}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, message: e.target.value })}
                  placeholder="Your announcement message..."
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="link_url">Link URL</Label>
                <Input
                  id="link_url"
                  value={editingAnnouncement.link_url || ''}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, link_url: e.target.value })}
                  placeholder="https://example.com or /page"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="link_text">Link Text</Label>
                <Input
                  id="link_text"
                  value={editingAnnouncement.link_text || ''}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, link_text: e.target.value })}
                  placeholder="Learn more"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="bg_color">Background Color</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    id="bg_color"
                    value={editingAnnouncement.bg_color || '#3b82f6'}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, bg_color: e.target.value })}
                    className="h-9 w-12 rounded border border-border cursor-pointer"
                  />
                  <Input
                    value={editingAnnouncement.bg_color || '#3b82f6'}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, bg_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="text_color">Text Color</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    id="text_color"
                    value={editingAnnouncement.text_color || '#ffffff'}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, text_color: e.target.value })}
                    className="h-9 w-12 rounded border border-border cursor-pointer"
                  />
                  <Input
                    value={editingAnnouncement.text_color || '#ffffff'}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, text_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={editingAnnouncement.display_order || 0}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, display_order: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="is_active"
                  checked={editingAnnouncement.is_active ?? true}
                  onCheckedChange={(checked) => setEditingAnnouncement({ ...editingAnnouncement, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            {/* Preview */}
            <div>
              <Label>Preview</Label>
              <div
                className="mt-2 flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg"
                style={{
                  backgroundColor: editingAnnouncement.bg_color || '#3b82f6',
                  color: editingAnnouncement.text_color || '#ffffff',
                }}
              >
                <span className="font-medium">{editingAnnouncement.message || 'Your message here'}</span>
                {editingAnnouncement.link_url && (
                  <span className="inline-flex items-center gap-1 font-semibold underline">
                    {editingAnnouncement.link_text || 'Learn more'}
                    <ExternalLink className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Spinner size="sm" /> : 'Save Announcement'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No announcements yet</p>
          <Button onClick={handleCreate} variant="outline" className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Create your first announcement
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-card rounded-xl border border-border p-4 flex items-center gap-4"
            >
              {/* Color Preview */}
              <div
                className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: announcement.bg_color }}
              >
                <Megaphone className="w-6 h-6" style={{ color: announcement.text_color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{announcement.message}</p>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  {announcement.link_url && (
                    <span className="flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      {announcement.link_text || 'Link'}
                    </span>
                  )}
                  <span>Created {formatDateTime(announcement.created_at)}</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={announcement.is_active}
                  onCheckedChange={() => handleToggleActive(announcement)}
                />
                <span className={`text-sm ${announcement.is_active ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {announcement.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(announcement)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(announcement.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
