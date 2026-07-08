import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/savings_goals — fetch all savings goals for the current user, ordered by priority
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('user_id', user.id)
    .order('priority', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/savings_goals — create a new savings goal
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const name = body?.name?.trim()
  const target_amount = parseFloat(body?.target_amount)
  const target_date = body?.target_date

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (isNaN(target_amount) || target_amount <= 0) return NextResponse.json({ error: 'Valid target amount > 0 is required' }, { status: 400 })
  if (!target_date || !/^\d{4}-\d{2}-\d{2}$/.test(target_date)) {
    return NextResponse.json({ error: 'Valid target date (YYYY-MM-DD) is required' }, { status: 400 })
  }

  // New goals get priority 1 (top), existing goals get pushed down
  // First shift all existing priorities up by 1
  const { data: existingGoals } = await supabase
    .from('savings_goals')
    .select('id, priority')
    .eq('user_id', user.id)

  if (existingGoals && existingGoals.length > 0) {
    // Batch update: increment all priorities
    for (const g of existingGoals) {
      await supabase
        .from('savings_goals')
        .update({ priority: (g.priority ?? 0) + 1 })
        .eq('id', g.id)
        .eq('user_id', user.id)
    }
  }

  const { data, error } = await supabase
    .from('savings_goals')
    .insert({ user_id: user.id, name, target_amount, target_date, amount_saved: 0, priority: 1 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH /api/savings_goals — update a savings goal or add to savings
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const id = body?.id
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const updates: any = {}
  if (body?.name !== undefined) updates.name = body.name.trim()
  if (body?.target_amount !== undefined) {
    const amt = parseFloat(body.target_amount)
    if (isNaN(amt) || amt <= 0) return NextResponse.json({ error: 'Valid target amount > 0 is required' }, { status: 400 })
    updates.target_amount = amt
  }
  if (body?.target_date !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.target_date)) {
      return NextResponse.json({ error: 'Valid target date (YYYY-MM-DD) is required' }, { status: 400 })
    }
    updates.target_date = body.target_date
  }
  if (body?.amount_saved !== undefined) {
    const saved = parseFloat(body.amount_saved)
    if (isNaN(saved) || saved < 0) return NextResponse.json({ error: 'Valid amount saved >= 0 is required' }, { status: 400 })
    updates.amount_saved = saved
  }
  if (body?.priority !== undefined) {
    const prio = parseInt(body.priority, 10)
    if (isNaN(prio) || prio < 1) return NextResponse.json({ error: 'Valid priority >= 1 is required' }, { status: 400 })
    updates.priority = prio
  }

  const { data, error } = await supabase
    .from('savings_goals')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Savings goal not found' }, { status: 404 })
  return NextResponse.json(data)
}

// PUT /api/savings_goals — bulk reorder goals (accepts array of {id, priority})
export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates: Array<{ id: string; priority: number }> = body?.updates

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: 'updates array is required' }, { status: 400 })
  }

  // Apply each priority update in parallel
  const results = await Promise.all(
    updates.map(({ id, priority }) =>
      supabase
        .from('savings_goals')
        .update({ priority })
        .eq('id', id)
        .eq('user_id', user.id)
    )
  )

  const firstError = results.find(r => r.error)?.error
  if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

// DELETE /api/savings_goals — delete a savings goal
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

  const { error } = await supabase
    .from('savings_goals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
