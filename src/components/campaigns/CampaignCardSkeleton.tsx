import { Skeleton } from '@/components/ui/skeleton'

export function CampaignCardSkeleton() {
  return (
    <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border">
      {/* Thumbnail skeleton */}
      <Skeleton className="aspect-[4/3] rounded-none" />

      {/* Content skeleton */}
      <div className="p-3">
        {/* Category badge */}
        <Skeleton className="h-5 w-24 rounded-full" />

        {/* Title */}
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-3/4" />

        {/* Description */}
        <Skeleton className="mt-2 h-3 w-full" />
        <Skeleton className="mt-1 h-3 w-2/3" />
      </div>
    </div>
  )
}

interface CampaignGridSkeletonProps {
  count?: number
}

export function CampaignGridSkeleton({ count = 8 }: CampaignGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CampaignCardSkeleton key={i} />
      ))}
    </div>
  )
}
