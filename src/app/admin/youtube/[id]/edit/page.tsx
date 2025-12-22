'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { YouTubeVideoEditor } from '@/components/admin/YouTubeVideoEditor'

interface EditYouTubeVideoPageProps {
  params: Promise<{ id: string }>
}

export default function EditYouTubeVideoPage({ params }: EditYouTubeVideoPageProps) {
  const { id } = use(params)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/youtube"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Videos
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">Edit YouTube Video</h1>
        <p className="text-muted-foreground mt-1">
          Update video details and AI-generated content
        </p>
      </div>

      <YouTubeVideoEditor videoId={id} />
    </div>
  )
}
