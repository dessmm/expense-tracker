import type { Expense, ExpenseTemplate } from '@/lib/types'

/** A detected recurring expense pattern */
export interface RecurringPattern {
  /** The expense note (display label) */
  note: string
  /** Category all occurrences share */
  category: string
  /** How many times it appeared */
  count: number
  /** Median amount — used as the template's preset amount */
  medianAmount: number
  /** Stable key for localStorage dismissal: note__category */
  dismissKey: string
}

/** ±10% tolerance band check */
function withinTolerance(a: number, b: number, tolerance = 0.10): boolean {
  if (b === 0) return a === 0
  return Math.abs(a - b) / b <= tolerance
}

/** Return the median of a numeric array */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

/**
 * Scan a flat list of expenses and return patterns that:
 * - Have a non-empty note
 * - Share the same note + category
 * - Have amounts all within ±10% of each other
 * - Appeared 3 or more times in the window
 * - Do NOT already have a matching template (same label + category)
 * - Are NOT already dismissed in localStorage
 */
export function detectRecurringPatterns(
  expenses: Expense[],
  templates: ExpenseTemplate[],
  dismissedKeys: Set<string>
): RecurringPattern[] {
  // Group by note (trimmed, lowercased for grouping) + category
  const groups = new Map<string, Expense[]>()

  for (const exp of expenses) {
    const note = (exp.note ?? '').trim()
    if (!note) continue // skip expenses without a note
    const key = `${note.toLowerCase()}__${exp.category}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(exp)
  }

  const results: RecurringPattern[] = []

  for (const [, group] of groups) {
    if (group.length < 3) continue

    const amounts = group.map(e => e.amount)
    const med = median(amounts)

    // All amounts must be within ±10% of the median
    if (!amounts.every(a => withinTolerance(a, med))) continue

    const note = (group[0].note ?? '').trim()
    const category = group[0].category
    const dismissKey = `${note}__${category}`

    // Skip if already dismissed
    if (dismissedKeys.has(dismissKey)) continue

    // Skip if a matching template already exists
    const alreadyTemplated = templates.some(
      t => t.label.trim().toLowerCase() === note.toLowerCase() && t.category === category
    )
    if (alreadyTemplated) continue

    results.push({
      note,
      category,
      count: group.length,
      medianAmount: Math.round(med * 100) / 100,
      dismissKey
    })
  }

  // Show highest-frequency patterns first
  return results.sort((a, b) => b.count - a.count)
}

/** LocalStorage key for the set of dismissed pattern keys */
export const DISMISSED_PATTERNS_KEY = 'zl_dismissed_recurring_patterns'

export function loadDismissedPatterns(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(DISMISSED_PATTERNS_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

export function savePatternDismissal(dismissKey: string): Set<string> {
  const current = loadDismissedPatterns()
  current.add(dismissKey)
  try {
    localStorage.setItem(DISMISSED_PATTERNS_KEY, JSON.stringify([...current]))
  } catch { /* ignore */ }
  return current
}
