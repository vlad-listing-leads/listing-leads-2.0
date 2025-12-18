'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUploadField } from '@/components/customization/fields/ImageUploadField'
import { ColorPickerField } from '@/components/customization/fields/ColorPickerField'
import { Save, User, Briefcase, Palette, Share2, Settings, Mail, Lock, Globe, AlertTriangle, Trash2, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileField {
  id: string
  field_key: string
  field_type: string
  label: string
  placeholder?: string
  default_value?: string
  is_required: boolean
  display_order: number
  category: string
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  account: <Settings className="w-5 h-5" />,
  contact: <User className="w-5 h-5" />,
  business: <Briefcase className="w-5 h-5" />,
  branding: <Palette className="w-5 h-5" />,
  social: <Share2 className="w-5 h-5" />,
  general: <User className="w-5 h-5" />,
}

const CATEGORY_LABELS: Record<string, string> = {
  account: 'Account Settings',
  contact: 'Contact Information',
  business: 'Business Details',
  branding: 'Branding',
  social: 'Social & Web Links',
  general: 'General',
}

// Define category order for navigation (account first, then profile sections)
const CATEGORY_ORDER = ['account', 'contact', 'business', 'branding', 'social']

export default function ProfilePage() {
  const router = useRouter()

  // Profile states
  const [fields, setFields] = useState<ProfileField[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [profileCompleted, setProfileCompleted] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('account')
  const [hasSystemPrompt, setHasSystemPrompt] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Account states
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [isMemberstackUser, setIsMemberstackUser] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [region, setRegion] = useState<'US' | 'CA'>('US')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Account loading states
  const [isSavingName, setIsSavingName] = useState(false)
  const [isSavingEmail, setIsSavingEmail] = useState(false)
  const [isSavingRegion, setIsSavingRegion] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Account messages
  const [nameMessage, setNameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [regionMessage, setRegionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [deleteMessage, setDeleteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()

        // Get authenticated user
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) {
          router.push('/login')
          return
        }

        setUser({ id: authUser.id, email: authUser.email || '' })
        setEmail(authUser.email || '')

        // Fetch profile from Supabase (for account settings)
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, memberstack_id, region')
          .eq('id', authUser.id)
          .single()

        if (profile) {
          setFirstName(profile.first_name || '')
          setLastName(profile.last_name || '')
          setIsMemberstackUser(!!profile.memberstack_id)
          setRegion((profile.region as 'US' | 'CA') || 'US')
        }

        // Fetch profile fields
        const profileResponse = await fetch('/api/profile')
        const profileResult = await profileResponse.json()

        if (!profileResponse.ok) {
          throw new Error(profileResult.error || 'Failed to load profile')
        }

        setFields(profileResult.data.fields || [])
        setValues(profileResult.data.valuesByKey || {})
        setProfileCompleted(profileResult.data.profile?.profile_completed || false)

        // Check if user is admin
        const userIsAdmin = profileResult.data.profile?.role === 'admin'
        setIsAdmin(userIsAdmin)

        // Only fetch settings if user is admin
        if (userIsAdmin) {
          try {
            const settingsResponse = await fetch('/api/settings')
            if (settingsResponse.ok) {
              const settingsResult = await settingsResponse.json()
              const systemPrompt = settingsResult.data?.value?.systemPrompt || ''
              setHasSystemPrompt(systemPrompt.trim().length > 0)
            }
          } catch {
            // Settings fetch failed, ignore
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150 // Offset for header

      for (const category of CATEGORY_ORDER) {
        const ref = sectionRefs.current[category]
        if (ref) {
          const { offsetTop, offsetHeight } = ref
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(category)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (category: string) => {
    const ref = sectionRefs.current[category]
    if (ref) {
      const yOffset = -100 // Offset for sticky header
      const y = ref.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
      setActiveSection(category)
    }
  }

  const handleFieldChange = useCallback((fieldKey: string, value: string) => {
    setValues(prev => ({ ...prev, [fieldKey]: value }))
    setSaveSuccess(false)
  }, [])

  const handleSave = async (markComplete = false) => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          values,
          markComplete,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save profile')
      }

      setSaveSuccess(true)
      if (markComplete) {
        setProfileCompleted(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  // Account handlers
  const handleUpdateName = async () => {
    if (!user) return

    setIsSavingName(true)
    setNameMessage(null)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
        })
        .eq('id', user.id)

      if (error) throw error

      setNameMessage({ type: 'success', text: 'Name updated successfully' })
    } catch (err) {
      setNameMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update name' })
    } finally {
      setIsSavingName(false)
    }
  }

  const handleUpdateEmail = async () => {
    if (!user) return

    setIsSavingEmail(true)
    setEmailMessage(null)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({ email })

      if (error) throw error

      setEmailMessage({ type: 'success', text: 'Check your new email for a confirmation link' })
    } catch (err) {
      setEmailMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update email' })
    } finally {
      setIsSavingEmail(false)
    }
  }

  const handleUpdateRegion = async (newRegion: 'US' | 'CA') => {
    if (!user || newRegion === region) return

    setIsSavingRegion(true)
    setRegionMessage(null)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('profiles')
        .update({ region: newRegion })
        .eq('id', user.id)

      if (error) throw error

      setRegion(newRegion)
      setRegionMessage({ type: 'success', text: 'Region updated successfully' })
    } catch (err) {
      setRegionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update region' })
    } finally {
      setIsSavingRegion(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!user) return

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setIsSavingPassword(true)
    setPasswordMessage(null)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) throw error

      setPasswordMessage({
        type: 'success',
        text: isMemberstackUser
          ? 'Password set! You can now log in directly with your email and password.'
          : 'Password updated successfully'
      })
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update password' })
    } finally {
      setIsSavingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteMessage({ type: 'error', text: 'Please type DELETE to confirm' })
      return
    }

    setIsDeleting(true)
    setDeleteMessage(null)

    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete account')
      }

      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
    } catch (err) {
      setDeleteMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete account' })
      setIsDeleting(false)
    }
  }

  // Fields already handled in Account Settings section
  const accountSettingsFields = ['first_name', 'last_name', 'email']

  // Group fields by category (excluding fields already in Account Settings)
  const fieldsByCategory = fields
    .filter(field => !accountSettingsFields.includes(field.field_key))
    .reduce((acc, field) => {
      const category = field.category || 'general'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(field)
      return acc
    }, {} as Record<string, ProfileField[]>)

  const renderField = (field: ProfileField) => {
    const value = values[field.field_key] || ''

    switch (field.field_type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            placeholder={field.placeholder || ''}
            rows={3}
          />
        )
      case 'image':
        // Determine preview size based on field key
        const isHeadshot = field.field_key.toLowerCase().includes('headshot')
        const isLogo = field.field_key.toLowerCase().includes('logo')
        const previewSize = isHeadshot
          ? { width: 80, height: 80 }
          : isLogo
          ? { width: 240, height: 80 }
          : 'default' as const

        return (
          <ImageUploadField
            field={{
              id: field.id,
              template_id: '',
              field_key: field.field_key,
              field_type: 'image',
              label: field.label,
              placeholder: field.placeholder || '',
              default_value: field.default_value || '',
              is_required: field.is_required,
              display_order: field.display_order,
              options: null,
              created_at: '',
              updated_at: '',
            }}
            value={value}
            onChange={(val) => handleFieldChange(field.field_key, val)}
            uploadOnly={isHeadshot || isLogo}
            previewSize={previewSize}
          />
        )
      case 'color':
        return (
          <ColorPickerField
            field={{
              id: field.id,
              template_id: '',
              field_key: field.field_key,
              field_type: 'color',
              label: field.label,
              placeholder: field.placeholder || '',
              default_value: field.default_value || '',
              is_required: field.is_required,
              display_order: field.display_order,
              options: null,
              created_at: '',
              updated_at: '',
            }}
            value={value || '#3b82f6'}
            onChange={(val) => handleFieldChange(field.field_key, val)}
          />
        )
      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            placeholder={field.placeholder || ''}
          />
        )
      case 'phone':
        return (
          <Input
            type="tel"
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            placeholder={field.placeholder || ''}
          />
        )
      case 'url':
        return (
          <Input
            type="url"
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            placeholder={field.placeholder || ''}
          />
        )
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            placeholder={field.placeholder || ''}
          />
        )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  // Get sorted categories that exist in the data (always include account)
  const profileCategories = CATEGORY_ORDER.filter(cat => cat !== 'account' && fieldsByCategory[cat]?.length > 0)
  const availableCategories = ['account', ...profileCategories]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Profile & Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your account settings and profile information
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-sm text-green-600">Saved!</span>
          )}
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isSaving}
          >
            {isSaving ? <Spinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
            Save
          </Button>
          {!profileCompleted && (
            <Button
              onClick={() => handleSave(true)}
              disabled={isSaving}
            >
              Save & Complete Setup
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-xl">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex gap-8">
        {/* Left Navigation */}
        <nav className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-24 space-y-1">
            {availableCategories.map((category) => (
              <button
                key={category}
                onClick={() => scrollToSection(category)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors",
                  activeSection === category
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {CATEGORY_ICONS[category] || CATEGORY_ICONS.general}
                <span className="text-sm font-medium">
                  {CATEGORY_LABELS[category] || category}
                </span>
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Account Settings Section */}
          <div
            ref={(el) => { sectionRefs.current['account'] = el }}
            id="section-account"
            className="space-y-6"
          >
            {/* Display Name */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Display Name
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  {nameMessage && (
                    <p className={`text-sm ${nameMessage.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
                      {nameMessage.text}
                    </p>
                  )}
                  <Button
                    onClick={handleUpdateName}
                    disabled={isSavingName}
                    variant="outline"
                  >
                    {isSavingName ? <Spinner size="sm" /> : 'Update Name'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Region Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Region
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select your region to see campaigns tailored to your market.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleUpdateRegion('US')}
                      disabled={isSavingRegion}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all',
                        region === 'US'
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border hover:border-muted-foreground/50 text-muted-foreground'
                      )}
                    >
                      <span className="text-xl">🇺🇸</span>
                      <span className="font-medium">United States</span>
                    </button>
                    <button
                      onClick={() => handleUpdateRegion('CA')}
                      disabled={isSavingRegion}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all',
                        region === 'CA'
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border hover:border-muted-foreground/50 text-muted-foreground'
                      )}
                    >
                      <span className="text-xl">🇨🇦</span>
                      <span className="font-medium">Canada</span>
                    </button>
                  </div>
                  {regionMessage && (
                    <p className={`text-sm ${regionMessage.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
                      {regionMessage.text}
                    </p>
                  )}
                  {isSavingRegion && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Spinner size="sm" />
                      Updating region...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Email Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="mt-1"
                    />
                  </div>
                  {emailMessage && (
                    <p className={`text-sm ${emailMessage.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
                      {emailMessage.text}
                    </p>
                  )}
                  <Button
                    onClick={handleUpdateEmail}
                    disabled={isSavingEmail || email === user?.email}
                    variant="outline"
                  >
                    {isSavingEmail ? <Spinner size="sm" /> : 'Update Email'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Password */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  {isMemberstackUser ? 'Set Password' : 'Password'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isMemberstackUser && (
                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">Optional: Set a direct login password</p>
                        <p className="text-blue-700 dark:text-blue-400">
                          You&apos;re signed in via Memberstack. You can optionally set a password to log in directly to this app without going through the main site.
                        </p>
                      </div>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="newPassword">{isMemberstackUser ? 'Password' : 'New Password'}</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={isMemberstackUser ? 'Enter a password' : 'Enter new password'}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="mt-1"
                    />
                  </div>
                  {passwordMessage && (
                    <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
                      {passwordMessage.text}
                    </p>
                  )}
                  <Button
                    onClick={handleUpdatePassword}
                    disabled={isSavingPassword || !newPassword || !confirmPassword}
                    variant="outline"
                  >
                    {isSavingPassword ? <Spinner size="sm" /> : (isMemberstackUser ? 'Set Password' : 'Update Password')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Once you delete your account, there is no going back. All your designs and data will be permanently removed.
                  </p>

                  {!showDeleteConfirm ? (
                    <Button
                      onClick={() => setShowDeleteConfirm(true)}
                      variant="outline"
                      className="border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  ) : (
                    <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl space-y-4">
                      <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                        Are you absolutely sure? This action cannot be undone.
                      </p>
                      <div>
                        <Label htmlFor="deleteConfirm" className="text-red-700 dark:text-red-400">
                          Type DELETE to confirm
                        </Label>
                        <Input
                          id="deleteConfirm"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="DELETE"
                          className="mt-1 border-red-300 dark:border-red-800 focus:border-red-500"
                        />
                      </div>
                      {deleteMessage && (
                        <p className={`text-sm ${deleteMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                          {deleteMessage.text}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setShowDeleteConfirm(false)
                            setDeleteConfirmText('')
                            setDeleteMessage(null)
                          }}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleDeleteAccount}
                          disabled={isDeleting || deleteConfirmText !== 'DELETE'}
                          className="bg-red-600 hover:bg-red-700 text-white border-0"
                        >
                          {isDeleting ? <Spinner size="sm" /> : 'Delete My Account'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Sections */}
          {profileCategories.map((category) => {
            const categoryFields = fieldsByCategory[category] || []
            return (
              <div
                key={category}
                ref={(el) => { sectionRefs.current[category] = el }}
                id={`section-${category}`}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {CATEGORY_ICONS[category] || CATEGORY_ICONS.general}
                      {CATEGORY_LABELS[category] || category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryFields.map((field, index) => {
                        const isHeadshot = field.field_key.toLowerCase().includes('headshot')
                        const isLogo = field.field_key.toLowerCase().includes('logo')
                        const needsDividerAfter = category === 'branding' && (isHeadshot || isLogo)

                        return (
                          <React.Fragment key={field.id}>
                            <div
                              className={field.field_type === 'textarea' || field.field_type === 'image' ? 'md:col-span-2' : ''}
                            >
                              {/* Image and color fields render their own labels */}
                              {field.field_type !== 'image' && field.field_type !== 'color' && (
                                <div>
                                  <Label htmlFor={field.field_key} required={field.is_required}>
                                    {field.label}
                                  </Label>
                                  {field.field_key === 'brokerage' && (
                                    <p className="text-xs text-muted-foreground mt-0.5">If you&apos;re a solo agent, just leave this empty</p>
                                  )}
                                </div>
                              )}
                              <div className={field.field_type !== 'image' && field.field_type !== 'color' ? 'mt-1' : ''}>
                                {renderField(field)}
                              </div>
                            </div>
                            {needsDividerAfter && index < categoryFields.length - 1 && (
                              <div className="md:col-span-2 border-t border-border my-2" />
                            )}
                          </React.Fragment>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}

          <div className="flex justify-end gap-2 pb-8">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isSaving}
            >
              {isSaving ? <Spinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
            {!profileCompleted && (
              <Button
                onClick={() => handleSave(true)}
                disabled={isSaving}
              >
                Save & Complete Setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
