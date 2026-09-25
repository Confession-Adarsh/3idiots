export default function SkeletonCard() {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full skeleton-shimmer flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-48 rounded skeleton-shimmer" />
          <div className="h-4 w-72 rounded skeleton-shimmer" />
          <div className="h-3 w-full rounded skeleton-shimmer" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 w-16 rounded-md skeleton-shimmer" />
            <div className="h-5 w-20 rounded-md skeleton-shimmer" />
            <div className="h-5 w-14 rounded-md skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  )
}
