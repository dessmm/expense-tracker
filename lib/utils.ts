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
 * Get today's date as 'YYYY-MM-DD'
 */
export function getTodayDate(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
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
