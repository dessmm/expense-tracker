import React from 'react'

export default function Loading() {
  return (
    <div className="w-full space-y-6 animate-pulse p-1">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-[#edeeef] dark:bg-[#2e3132] rounded-lg"></div>
        <div className="h-4 w-72 bg-[#edeeef]/65 dark:bg-[#2e3132]/65 rounded-md"></div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="h-[120px] bg-[#edeeef] dark:bg-[#2e3132] rounded-2xl"></div>
        <div className="h-[120px] bg-[#edeeef] dark:bg-[#2e3132] rounded-2xl"></div>
        <div className="h-[120px] bg-[#edeeef] dark:bg-[#2e3132] rounded-2xl"></div>
      </div>

      {/* Body Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[400px] bg-[#edeeef] dark:bg-[#2e3132] rounded-2xl"></div>
        <div className="h-[400px] bg-[#edeeef] dark:bg-[#2e3132] rounded-2xl"></div>
      </div>
    </div>
  )
}
