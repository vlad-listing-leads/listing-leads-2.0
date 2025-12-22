'use client'

import { use } from 'react'
import { ShortVideoEditor } from '@/components/admin/ShortVideoEditor'

interface EditShortVideoPageProps {
  params: Promise<{ id: string }>
}

export default function EditShortVideoPage({ params }: EditShortVideoPageProps) {
  const { id } = use(params)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Short Video</h1>
      <ShortVideoEditor videoId={id} />
    </div>
  )
}
