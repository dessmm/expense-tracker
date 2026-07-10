import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If env vars are not configured yet, allow /login through and block everything else
  if (!url || !key || url === 'your-supabase-project-url' || !url.startsWith('http')) {
    if (request.nextUrl.pathname.startsWith('/login')) {
      return NextResponse.next()
    }
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  try {
    return await updateSession(request)
  } catch {
    // If session update fails for any reason, redirect to login
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|sw\\.js|manifest\\.webmanifest|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
