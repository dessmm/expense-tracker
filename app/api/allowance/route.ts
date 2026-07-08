import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentWeekRange } from '@/lib/utils'

function isValidMonday(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d, 12, 0, 0)
  return date.getDay() === 1
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const rawWeekStart = searchParams.get('week_start')

  let weekStart: string
  if (rawWeekStart) {
    if (!isValidMonday(rawWeekStart)) {
      return NextResponse.json({ error: 'week_start must be a YYYY-MM-DD date that falls on a Monday' }, { status: 400 })
    }
    weekStart = rawWeekStart
  } else {
    weekStart = getCurrentWeekRange().weekStart
  }

  const { data, error } = await supabase
    .from('allowances')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? null)
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const amount = parseFloat(body?.amount)

  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
  }

  let weekStart: string
  if (body?.week_start) {
    if (!isValidMonday(body.week_start)) {
      return NextResponse.json({ error: 'week_start must be a YYYY-MM-DD date that falls on a Monday' }, { status: 400 })
    }
    weekStart = body.week_start
  } else {
    weekStart = getCurrentWeekRange().weekStart
  }

  const { data, error } = await supabase
    .from('allowances')
    .upsert(
      { user_id: user.id, amount, week_start: weekStart },
      { onConflict: 'user_id,week_start' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const week_start = body?.week_start

  if (!week_start || !/^\d{4}-\d{2}-\d{2}$/.test(week_start)) {
    return NextResponse.json({ error: 'week_start must be a valid YYYY-MM-DD date' }, { status: 400 })
  }

  const { data: existing, error: findError } = await supabase
    .from('allowances')
    .select('id')
    .eq('user_id', user.id)
    .eq('week_start', week_start)
    .maybeSingle()

  if (findError) return NextResponse.json({ error: findError.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'Allowance not found' }, { status: 404 })

  const { error } = await supabase
    .from('allowances')
    .delete()
    .eq('user_id', user.id)
    .eq('week_start', week_start)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
