import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/bills — fetch all recurring bills & savings progress for the specified month
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')
  if (!month) return NextResponse.json({ error: 'Month required' }, { status: 400 })

  const [billsRes, progressRes] = await Promise.all([
    supabase
      .from('recurring_bills')
      .select('*')
      .eq('user_id', user.id),
    supabase
      .from('bill_savings_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
  ])

  if (billsRes.error) return NextResponse.json({ error: billsRes.error.message }, { status: 500 })
  if (progressRes.error) return NextResponse.json({ error: progressRes.error.message }, { status: 500 })

  return NextResponse.json({
    bills: billsRes.data ?? [],
    progress: progressRes.data ?? []
  })
}

// POST /api/bills — add a new recurring bill
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const name = body?.name?.trim()
  const amount = parseFloat(body?.amount)
  const start_date = body?.start_date

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (isNaN(amount) || amount <= 0) return NextResponse.json({ error: 'Valid amount > 0 is required' }, { status: 400 })
  if (!start_date || !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
    return NextResponse.json({ error: 'Valid start_date (YYYY-MM-DD) is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('recurring_bills')
    .insert({ user_id: user.id, name, amount, start_date })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PUT /api/bills — log or update savings progress for a bill in a given month
export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const bill_id = body?.bill_id
  const amount_saved = parseFloat(body?.amount_saved)
  const month = body?.month

  if (!bill_id) return NextResponse.json({ error: 'bill_id is required' }, { status: 400 })
  if (isNaN(amount_saved) || amount_saved < 0) return NextResponse.json({ error: 'Valid amount_saved >= 0 is required' }, { status: 400 })
  if (!month) return NextResponse.json({ error: 'Month is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('bill_savings_progress')
    .upsert(
      { user_id: user.id, bill_id, month, amount_saved },
      { onConflict: 'user_id,bill_id,month' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH /api/bills — edit an existing recurring bill (name, amount, start_date)
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const id = body?.id
  const name = body?.name?.trim()
  const amount = parseFloat(body?.amount)
  const start_date = body?.start_date

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (isNaN(amount) || amount <= 0) return NextResponse.json({ error: 'Valid amount > 0 is required' }, { status: 400 })
  if (!start_date || !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
    return NextResponse.json({ error: 'Valid start_date (YYYY-MM-DD) is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('recurring_bills')
    .update({ name, amount, start_date })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
  return NextResponse.json(data)
}

// DELETE /api/bills — delete a recurring bill
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Bill ID is required' }, { status: 400 })

  const { error } = await supabase
    .from('recurring_bills')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
