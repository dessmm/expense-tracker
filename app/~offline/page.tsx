'use client'

import { WifiOff, RotateCw, Home } from 'lucide-react'

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#1a1c1e] flex items-center justify-center px-4">
      <div className="w-full max-w-[480px] text-center">
        {/* Animated Offline Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#ffdad6] dark:bg-[#2d1919] flex items-center justify-center border border-[#ffb4ab] dark:border-[#ffb4ab]/30">
            <WifiOff className="w-10 h-10 text-[#ba1a1a] dark:text-[#ffb4ab] animate-pulse" />
          </div>
        </div>

        {/* Text Details */}
        <h1 className="text-3xl font-bold text-[#191c1d] dark:text-[#e2e4e5] tracking-tight mb-3">
          You're offline
        </h1>
        
        <p className="text-[15px] text-[#6f7881] dark:text-[#9ea7b0] leading-relaxed mb-8">
          We couldn't load this page because your device is not connected to the internet. 
          However, your personal expense tools and cached records are available! 
          You can queue expenses or check your dashboards while offline.
        </p>

        {/* Actions Card */}
        <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleRetry}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#006492] hover:bg-[#004b6f] text-white text-[14px] font-semibold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <RotateCw className="w-4 h-4 animate-spin-slow" />
            Try Again
          </button>
          
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#f3f4f5] hover:bg-[#e2e4e5] dark:bg-[#1a1c1e] dark:hover:bg-[#2d3135] text-[#191c1d] dark:text-[#e2e4e5] border border-[#bec7d1] dark:border-[#3a3d40] text-[14px] font-semibold rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </button>
        </div>

        <p className="text-center text-[12px] text-[#6f7881] dark:text-[#9ea7b0]/60 mt-8 font-mono">
          Zenith Ledger • Offline Mode Active
        </p>
      </div>
    </div>
  )
}
