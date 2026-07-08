'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Eye, EyeOff, TrendingUp } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#1a1c1e] flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-[#2D9CDB] flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold text-[#191c1d] dark:text-[#e2e4e5] tracking-tight">
            Zenith Ledger
          </h1>
          <p className="text-sm text-[#6f7881] mt-1">
            Personal expense tracker
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-2xl p-8">
          <h2 className="text-[15px] font-semibold text-[#191c1d] dark:text-[#e2e4e5] mb-6">
            Sign in to your account
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-mono font-medium uppercase tracking-widest text-[#6f7881] mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 text-[14px] bg-[#f3f4f5] dark:bg-[#1a1c1e] border border-[#bec7d1] dark:border-[#3a3d40] rounded-lg text-[#191c1d] dark:text-[#e2e4e5] placeholder-[#6f7881] outline-none focus:border-[#2D9CDB] focus:ring-2 focus:ring-[#2D9CDB]/15 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-mono font-medium uppercase tracking-widest text-[#6f7881] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 text-[14px] bg-[#f3f4f5] dark:bg-[#1a1c1e] border border-[#bec7d1] dark:border-[#3a3d40] rounded-lg text-[#191c1d] dark:text-[#e2e4e5] placeholder-[#6f7881] outline-none focus:border-[#2D9CDB] focus:ring-2 focus:ring-[#2D9CDB]/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6f7881] hover:text-[#3f4850] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                    : <Eye className="w-4 h-4" strokeWidth={1.5} />
                  }
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="text-[13px] text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-[#006492] hover:bg-[#004b6f] text-white text-[14px] font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-[#6f7881] mt-6">
          Personal tool — contact your admin for access.
        </p>
      </div>
    </div>
  )
}
