import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getMonthDateRange } from '@/lib/utils'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')

  if (!month) return NextResponse.json({ error: 'Month required' }, { status: 400 })

  const monthRange = getMonthDateRange(month)

  // Fetch expenses, allowances, and bill savings progress in parallel
  const [expensesRes, allowancesRes, billProgressRes, budgetsRes] = await Promise.all([
    supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', monthRange.start)
      .lte('date', monthRange.end)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false }),
    
    supabase
      .from('allowances')
      .select('*')
      .eq('user_id', user.id)
      .gte('week_start', monthRange.start)
      .lte('week_start', monthRange.end),

    supabase
      .from('bill_savings_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month),

    supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
  ])

  if (expensesRes.error) return NextResponse.json({ error: expensesRes.error.message }, { status: 500 })
  if (allowancesRes.error) return NextResponse.json({ error: allowancesRes.error.message }, { status: 500 })
  if (billProgressRes.error) return NextResponse.json({ error: billProgressRes.error.message }, { status: 500 })
  if (budgetsRes.error) return NextResponse.json({ error: budgetsRes.error.message }, { status: 500 })

  return NextResponse.json({
    expenses: expensesRes.data ?? [],
    allowances: allowancesRes.data ?? [],
    billProgress: billProgressRes.data ?? [],
    budgets: budgetsRes.data ?? []
  })
}

// POST /api/expenses — create a new expense
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const amount = parseFloat(body?.amount)
    const category = body?.category?.trim()
    const note = body?.note?.trim() || null
    const date = body?.date
    let tags = body?.tags || null
    if (typeof tags === 'string') {
      tags = tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      if (tags.length === 0) tags = null
    }

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount > 0 is required' }, { status: 400 })
    }
    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        amount,
        category,
        note,
        date,
        tags
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
