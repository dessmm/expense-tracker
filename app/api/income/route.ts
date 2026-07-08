import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getMonthDateRange } from '@/lib/utils'

// GET /api/income?month=YYYY-MM — Fetch all incomes for the specified month
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')

  if (!month) return NextResponse.json({ error: 'Month required' }, { status: 400 })

  const monthRange = getMonthDateRange(month)

  const { data, error } = await supabase
    .from('income')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', monthRange.start)
    .lte('date', monthRange.end)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/income — Create a new income entry
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const amount = parseFloat(body?.amount)
    const source = body?.source?.trim()
    const date = body?.date
    const note = body?.note?.trim() || null

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount > 0 is required' }, { status: 400 })
    }
    if (!source) {
      return NextResponse.json({ error: 'Source is required' }, { status: 400 })
    }
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('income')
      .insert({
        user_id: user.id,
        amount,
        source,
        date,
        note
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid body format' }, { status: 400 })
  }
}

// PATCH /api/income — Edit an existing income entry
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const id = body?.id
    const amount = parseFloat(body?.amount)
    const source = body?.source?.trim()
    const date = body?.date
    const note = body?.note?.trim() || null

    if (!id) {
      return NextResponse.json({ error: 'Income ID is required' }, { status: 400 })
    }
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount > 0 is required' }, { status: 400 })
    }
    if (!source) {
      return NextResponse.json({ error: 'Source is required' }, { status: 400 })
    }
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('income')
      .update({
        amount,
        source,
        date,
        note
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid body format' }, { status: 400 })
  }
}

// DELETE /api/income — Delete an income entry
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Income ID required' }, { status: 400 })

  const { error } = await supabase
    .from('income')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
