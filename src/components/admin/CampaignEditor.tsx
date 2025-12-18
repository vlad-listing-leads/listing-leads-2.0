'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Save, Loader2, Upload, X, ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'

export interface FieldConfig {
  name: string
  label: string
  type: 'text' | 'textarea' | 'url' | 'date' | 'number' | 'select' | 'switch' | 'json' | 'image'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  rows?: number
  description?: string
  folder?: string // ImageKit folder for image uploads
}

interface CampaignEditorProps {
  tableName: string
  campaignId?: string
  fields: FieldConfig[]
  title: string
  backPath: string
}

export function CampaignEditor({
  tableName,
  campaignId,
  fields,
  title,
  backPath,
}: CampaignEditorProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(!!campaignId)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const isEditing = !!campaignId

  useEffect(() => {
    if (campaignId) {
      fetchCampaign()
    } else {
      // Set defaults for new campaign
      const defaults: Record<string, any> = {}
      fields.forEach((field) => {
        if (field.type === 'switch') {
          defaults[field.name] = field.name === 'is_active' ? true : false
        }
      })
      setFormData(defaults)
    }
  }, [campaignId])

  const fetchCampaign = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', campaignId)
        .single()

      if (error) throw error
      setFormData(data || {})
    } catch (error) {
      console.error('Failed to fetch campaign:', error)
      setError('Failed to load campaign')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleImageUpload = async (fieldName: string, file: File, folder?: string) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB')
      return
    }

    setUploadingFields((prev) => ({ ...prev, [fieldName]: true }))
    setError(null)

    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      if (folder) {
        formDataUpload.append('folder', folder)
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      handleChange(fieldName, data.url)
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload image')
    } finally {
      setUploadingFields((prev) => ({ ...prev, [fieldName]: false }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    const supabase = createClient()

    try {
      // Auto-generate slug if not provided
      const dataToSave = { ...formData }
      if (!dataToSave.slug && dataToSave.name) {
        dataToSave.slug = generateSlug(dataToSave.name)
      }

      // Parse JSON fields
      fields.forEach((field) => {
        if (field.type === 'json' && typeof dataToSave[field.name] === 'string') {
          try {
            dataToSave[field.name] = JSON.parse(dataToSave[field.name])
          } catch {
            // Keep as string if invalid JSON
          }
        }
      })

      if (isEditing) {
        const { error } = await supabase
          .from(tableName)
          .update(dataToSave)
          .eq('id', campaignId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from(tableName)
          .insert(dataToSave)

        if (error) throw error
      }

      router.push(backPath)
    } catch (error: any) {
      console.error('Failed to save campaign:', error)
      setError(error.message || 'Failed to save campaign')
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
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={backPath}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">
            {isEditing ? 'Edit' : 'Create'} {title}
          </h1>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-background rounded-lg border border-border p-6 space-y-6">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {field.type === 'switch' && (
                  <Switch
                    id={field.name}
                    checked={formData[field.name] || false}
                    onCheckedChange={(checked) => handleChange(field.name, checked)}
                  />
                )}
              </div>

              {field.description && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
              )}

              {field.type === 'text' && (
                <Input
                  id={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}

              {field.type === 'url' && (
                <Input
                  id={field.name}
                  type="url"
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder || 'https://...'}
                />
              )}

              {field.type === 'date' && (
                <Input
                  id={field.name}
                  type="date"
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
              )}

              {field.type === 'number' && (
                <Input
                  id={field.name}
                  type="number"
                  value={formData[field.name] ?? ''}
                  onChange={(e) => handleChange(field.name, parseInt(e.target.value) || 0)}
                  placeholder={field.placeholder}
                />
              )}

              {field.type === 'textarea' && (
                <Textarea
                  id={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  rows={field.rows || 4}
                />
              )}

              {field.type === 'json' && (
                <Textarea
                  id={field.name}
                  value={
                    typeof formData[field.name] === 'object'
                      ? JSON.stringify(formData[field.name], null, 2)
                      : formData[field.name] || ''
                  }
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder || '[]'}
                  rows={field.rows || 6}
                  className="font-mono text-sm"
                />
              )}

              {field.type === 'select' && (
                <select
                  id={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {field.type === 'image' && (
                <div className="space-y-3">
                  {/* Current image preview */}
                  {formData[field.name] && (
                    <div className="relative inline-block">
                      <div className="relative w-48 h-32 rounded-lg overflow-hidden border border-border">
                        <Image
                          src={formData[field.name]}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleChange(field.name, '')}
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Upload button and URL input */}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={(el) => { fileInputRefs.current[field.name] = el }}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleImageUpload(field.name, file, field.folder)
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingFields[field.name]}
                      onClick={() => fileInputRefs.current[field.name]?.click()}
                    >
                      {uploadingFields[field.name] ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Image
                        </>
                      )}
                    </Button>
                    <span className="text-xs text-muted-foreground self-center">or</span>
                    <Input
                      id={field.name}
                      type="url"
                      value={formData[field.name] || ''}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      placeholder="Paste image URL..."
                      className="flex-1"
                    />
                  </div>

                  {/* Folder info */}
                  {field.folder && (
                    <p className="text-xs text-muted-foreground">
                      <ImageIcon className="w-3 h-3 inline mr-1" />
                      Uploads to: {field.folder}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Save Changes' : 'Create Campaign'}
              </>
            )}
          </Button>
          <Link href={backPath}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
