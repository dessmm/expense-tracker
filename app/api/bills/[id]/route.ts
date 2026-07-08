import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PUT /api/bills/[id] — update an existing recurring bill
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const body = await request.json()
  const name = body?.name?.trim()
  const amount = parseFloat(body?.amount)
  const due_day = parseInt(body?.due_day)

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (isNaN(amount) || amount <= 0) return NextResponse.json({ error: 'Valid amount > 0 is required' }, { status: 400 })
  if (isNaN(due_day) || due_day < 1 || due_day > 31) return NextResponse.json({ error: 'Due day must be between 1 and 31' }, { status: 400 })

  const { data, error } = await supabase
    .from('recurring_bills')
    .update({ name, amount, due_day })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Bill not found' }, { status: 404 })

  return NextResponse.json(data)
}

// DELETE /api/bills/[id] — delete a recurring bill (bill_savings_progress cascades via FK)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { error } = await supabase
    .from('recurring_bills')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
