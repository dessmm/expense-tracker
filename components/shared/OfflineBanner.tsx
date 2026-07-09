'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

interface OfflineBannerProps {
  isCachedData?: boolean;
}

export function OfflineBanner({ isCachedData = false }: OfflineBannerProps) {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine)

      const handleOnline = () => setIsOffline(false)
      const handleOffline = () => setIsOffline(true)

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  if (!isOffline && !isCachedData) return null

  return (
    <div className="bg-[#fff9db] dark:bg-[#2d2919] border border-[#ffe066] dark:border-[#f59f00] text-[#856404] dark:text-[#ffd43b] px-4 py-3 rounded-lg flex items-center gap-3 mb-6 shadow-sm">
      <WifiOff className="w-5 h-5 flex-shrink-0 text-[#f59f00]" />
      <div>
        <p className="text-[13px] font-semibold leading-tight">
          Offline — showing last saved data
        </p>
        <p className="text-[11px] opacity-80 mt-1 leading-normal">
          {isOffline 
            ? 'Connection lost. Any new expenses will be queued and synced when connection is restored.'
            : 'Displaying the last successfully fetched data.'}
        </p>
      </div>
    </div>
  )
}
