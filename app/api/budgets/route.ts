import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/budgets — fetch all category budgets for the specified month
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')
  if (!month) return NextResponse.json({ error: 'Month required' }, { status: 400 })

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .eq('month', month)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// PUT /api/budgets — log or update a category's budget cap for a given month
export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const category = body?.category
  const monthly_cap = parseFloat(body?.monthly_cap)
  const month = body?.month

  if (!category) return NextResponse.json({ error: 'Category is required' }, { status: 400 })
  if (isNaN(monthly_cap) || monthly_cap <= 0) return NextResponse.json({ error: 'Valid monthly_cap > 0 is required' }, { status: 400 })
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: 'Valid month (YYYY-MM) is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('budgets')
    .upsert(
      { user_id: user.id, category, month, monthly_cap },
      { onConflict: 'user_id,category,month' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/budgets — delete a category's budget cap
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Budget ID is required' }, { status: 400 })

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
