'use client'

import { use } from 'react'
import { KickoffEditor } from '@/components/admin/KickoffEditor'

interface EditKickoffPageProps {
  params: Promise<{ id: string }>
}

export default function EditKickoffPage({ params }: EditKickoffPageProps) {
  const { id } = use(params)
  return <KickoffEditor kickoffId={id} />
}
