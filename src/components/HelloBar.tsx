'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, ExternalLink } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  message: string
  link_url: string | null
  link_text: string | null
  bg_color: string
  text_color: string
}

export function HelloBar() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const response = await fetch('/api/announcements')
        const data = await response.json()

        if (data.data && data.data.length > 0) {
          const announcement = data.data[0]
          // Check if this announcement was dismissed in this session
          const dismissedIds = sessionStorage.getItem('dismissedAnnouncements')
          if (dismissedIds) {
            const ids = JSON.parse(dismissedIds)
            if (ids.includes(announcement.id)) {
              return
            }
          }
          setAnnouncement(announcement)
        }
      } catch (error) {
        console.error('Failed to fetch announcement:', error)
      }
    }

    fetchAnnouncement()
  }, [])

  const handleDismiss = () => {
    if (announcement) {
      // Store dismissed ID in session storage
      const dismissedIds = sessionStorage.getItem('dismissedAnnouncements')
      const ids = dismissedIds ? JSON.parse(dismissedIds) : []
      ids.push(announcement.id)
      sessionStorage.setItem('dismissedAnnouncements', JSON.stringify(ids))
    }
    setIsDismissed(true)
  }

  if (!announcement || isDismissed) {
    return null
  }

  return (
    <div
      className="relative flex items-center justify-center gap-2 px-4 py-2 text-sm"
      style={{
        backgroundColor: announcement.bg_color,
        color: announcement.text_color,
      }}
    >
      <span className="font-medium">{announcement.message}</span>

      {announcement.link_url && (
        <Link
          href={announcement.link_url}
          target={announcement.link_url.startsWith('http') ? '_blank' : undefined}
          rel={announcement.link_url.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          {announcement.link_text || 'Learn more'}
          {announcement.link_url.startsWith('http') && <ExternalLink className="w-3 h-3" />}
        </Link>
      )}

      <button
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/20 transition-colors"
        aria-label="Dismiss announcement"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
