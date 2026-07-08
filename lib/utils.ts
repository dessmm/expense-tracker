import type { Category } from './types'

/**
 * Format a number as PHP Peso currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a date string (YYYY-MM-DD) to a human-readable format
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

/**
 * Format a date string as a short month+day label
 */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

/**
 * Get the current month as 'YYYY-MM'
 */
export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Safe calculation of a month's start and end date (handles leap years and month lengths)
 */
export function getMonthDateRange(monthStr: string): { start: string; end: string } {
  const [year, month] = monthStr.split('-').map(Number)
  // month is 1-indexed. new Date(year, month, 0) gives the last day of the month.
  const lastDayObj = new Date(year, month, 0)
  const lastDay = String(lastDayObj.getDate()).padStart(2, '0')
  return {
    start: `${monthStr}-01`,
    end: `${monthStr}-${lastDay}`
  }
}


/**
 * Get today's date as 'YYYY-MM-DD'
 */
export function getTodayDate(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/**
 * The timezone used for all week/date calculations.
 * Philippines Standard Time = UTC+8, no DST.
 */
const PHT_TZ = 'Asia/Manila'

/**
 * Return today's YYYY-MM-DD string in PHT.
 * Using Intl.DateTimeFormat ensures correctness regardless of where
 * the code runs (server UTC, browser local, etc.).
 */
export function getTodayPHTDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PHT_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()) // returns 'YYYY-MM-DD' via en-CA locale
}

/**
 * Given a YYYY-MM-DD string, return a Date object at midnight PHT
 * expressed as a plain local Date (safe for arithmetic).
 */
function parsePHTDate(yyyymmdd: string): Date {
  const [y, m, d] = yyyymmdd.split('-').map(Number)
  // Construct as a local-noon date so DST can't shift the day
  return new Date(y, m - 1, d, 12, 0, 0)
}

/**
 * Add `days` to a YYYY-MM-DD string and return the new YYYY-MM-DD.
 */
function addDays(yyyymmdd: string, days: number): string {
  const d = parsePHTDate(yyyymmdd)
  d.setDate(d.getDate() + days)
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

/**
 * Get the Monday and Sunday of the current calendar week in PHT.
 * Week definition: Monday = day 1, Sunday = day 0 (JS).
 *
 * @returns { weekStart: 'YYYY-MM-DD', weekEnd: 'YYYY-MM-DD' }
 */
export function getCurrentWeekRange(): { weekStart: string; weekEnd: string } {
  const today = getTodayPHTDate()
  const d = parsePHTDate(today)
  // JS getDay(): 0=Sun, 1=Mon … 6=Sat
  // Days since Monday: (getDay() + 6) % 7  → Mon=0, Tue=1 … Sun=6
  const daysSinceMonday = (d.getDay() + 6) % 7
  const weekStart = addDays(today, -daysSinceMonday)
  const weekEnd   = addDays(weekStart, 6)
  return { weekStart, weekEnd }
}

/**
 * Get the Monday and Sunday of the *previous* calendar week in PHT.
 */
export function getLastWeekRange(): { weekStart: string; weekEnd: string } {
  const { weekStart } = getCurrentWeekRange()
  const lastWeekStart = addDays(weekStart, -7)
  const lastWeekEnd   = addDays(lastWeekStart, 6)
  return { weekStart: lastWeekStart, weekEnd: lastWeekEnd }
}

/**
 * Get the Monday and Sunday of the week *before* last week in PHT.
 */
export function getTwoWeeksAgoRange(): { weekStart: string; weekEnd: string } {
  const { weekStart: lastWeekStart } = getLastWeekRange()
  const twoWeeksAgoStart = addDays(lastWeekStart, -7)
  const twoWeeksAgoEnd   = addDays(twoWeeksAgoStart, 6)
  return { weekStart: twoWeeksAgoStart, weekEnd: twoWeeksAgoEnd }
}

/**
 * Navigate to previous/next month
 */
export function navigateMonth(month: string, direction: 'prev' | 'next'): string {
  const [year, mon] = month.split('-').map(Number)
  const date = new Date(year, mon - 1 + (direction === 'next' ? 1 : -1))
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Format a 'YYYY-MM' month string to a readable label
 */
export function formatMonthLabel(month: string): string {
  const [year, mon] = month.split('-').map(Number)
  const date = new Date(year, mon - 1)
  return new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(date)
}

/**
 * Group expenses by date
 */
export function groupByDate<T extends { date: string }>(items: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = item.date
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(item)
  }
  return groups
}

/**
 * Category display labels and colors
 */
export const CATEGORY_COLORS: Record<Category, string> = {
  Food:      '#2D9CDB',
  Transport: '#835400',
  Bills:     '#006492',
  Shopping:  '#5e5e5e',
  Health:    '#27AE60',
  Other:     '#9B59B6',
}

export const CATEGORY_BG: Record<Category, string> = {
  Food:      'bg-[#e8f4fb]  text-[#006492]',
  Transport: 'bg-[#fff3e0] text-[#835400]',
  Bills:     'bg-[#e0f0fa] text-[#006492]',
  Shopping:  'bg-[#eeeeee] text-[#3e3e3e]',
  Health:    'bg-[#e8f8ef]  text-[#1a7a3c]',
  Other:     'bg-[#f3eafa]  text-[#6a3a8c]',
}

/**
 * Returns all Mondays (week starts) falling within a specific month 'YYYY-MM'.
 */
export function getWeekStartsInMonth(monthStr: string): string[] {
  const [year, mon] = monthStr.split('-').map(Number)
  const dates: string[] = []
  
  // Last day of the month
  const lastDay = new Date(year, mon, 0).getDate()
  
  for (let day = 1; day <= lastDay; day++) {
    // Construct local-noon date to avoid shifting
    const d = new Date(year, mon - 1, day, 12, 0, 0)
    // 1 = Monday
    if (d.getDay() === 1) {
      dates.push(`${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
    }
  }
  return dates
}

/**
 * Format the given date in Manila Time (PHT, UTC+8)
 * e.g. "Mon, Jul 6 · 2:45 PM"
 */
export function formatManilaTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date).replace(',', ' ·')
}

/**
 * Calculates the next timezone-correct (Asia/Manila) due date for a bill
 * given its start_date (YYYY-MM-DD).
 * - If today is before start_date, the next due date is start_date itself.
 * - If today is on or after start_date, the next due date is calculated matching
 *   the day-of-month of start_date, rolling over to next month if already passed.
 */
export function getBillDueDate(startDateStr: string): Date {
  const todayStr = getTodayPHTDate()
  const [todayYear, todayMonth, todayDay] = todayStr.split('-').map(Number)
  const todayDate = new Date(todayYear, todayMonth - 1, todayDay, 12, 0, 0)
  
  const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number)
  const startDate = new Date(startYear, startMonth - 1, startDay, 12, 0, 0)

  // 1. If today is before start_date, the next due date is start_date itself.
  if (todayDate < startDate) {
    return startDate
  }

  // 2. Today is on or after start_date. Calculate next occurrence
  const dueDay = startDay
  let dueYear = todayYear
  let dueMonthIdx = todayMonth - 1 // 0-indexed
  
  // Handle shorter months safely
  const maxDaysInCandidate = new Date(dueYear, dueMonthIdx + 1, 0).getDate()
  const candidateDay = Math.min(dueDay, maxDaysInCandidate)
  const candidateDate = new Date(dueYear, dueMonthIdx, candidateDay, 12, 0, 0)
  
  if (candidateDate < todayDate) {
    dueMonthIdx += 1
    if (dueMonthIdx > 11) {
      dueMonthIdx = 0
      dueYear += 1
    }
    const maxDaysInNext = new Date(dueYear, dueMonthIdx + 1, 0).getDate()
    const nextMonthDay = Math.min(dueDay, maxDaysInNext)
    return new Date(dueYear, dueMonthIdx, nextMonthDay, 12, 0, 0)
  }
  
  return candidateDate
}

/**
 * Calculate weeks remaining until a given due date from today (Asia/Manila).
 */
export function getWeeksRemaining(dueDate: Date): number {
  const todayStr = getTodayPHTDate()
  const [year, month, day] = todayStr.split('-').map(Number)
  const todayDate = new Date(year, month - 1, day, 12, 0, 0)
  
  const msDiff = dueDate.getTime() - todayDate.getTime()
  const daysDiff = Math.round(msDiff / (1000 * 60 * 60 * 24))
  
  const weeks = Math.ceil(daysDiff / 7)
  return Math.max(1, weeks)
}

/**
 * Export an array of expenses to a CSV file and trigger a browser download.
 * Columns: Date, Category, Note, Amount
 *
 * @param expenses - The list of expenses to export
 * @param filename - The filename for the downloaded file (e.g. 'expenses-2025-07.csv')
 */
export function exportToCSV(expenses: import('./types').Expense[], filename: string): void {
  const header = ['Date', 'Category', 'Note', 'Amount']
  const rows = expenses.map(e => [
    e.date,
    e.category,
    `"${(e.note ?? '').replace(/"/g, '""')}"`,
    e.amount.toFixed(2),
  ])

  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
