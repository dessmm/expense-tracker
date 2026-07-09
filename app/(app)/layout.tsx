import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { OfflineSyncProvider } from '@/components/shared/OfflineSyncProvider'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] dark:bg-[#1a1c1e]">
      <OfflineSyncProvider />
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-[260px] min-h-screen pb-16 md:pb-0">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-8">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
