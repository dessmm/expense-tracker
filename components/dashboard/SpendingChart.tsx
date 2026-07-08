'use client'

import { useMemo } from 'react'
import { getTodayPHTDate, formatMonthLabel, formatCurrency } from '@/lib/utils'
import type { Expense } from '@/lib/types'

interface SpendingChartProps {
  expenses: Expense[]
  month: string
}

/**
 * Pure SVG daily spending bar chart for the current month.
 * No external chart libraries — minimal bundle impact.
 * Responsive via viewBox scaling.
 */
export function SpendingChart({ expenses, month }: SpendingChartProps) {
  const todayStr = getTodayPHTDate()

  const { dailyTotals, maxAmount, daysInMonth } = useMemo(() => {
    // Get number of days in the month
    const [year, mon] = month.split('-').map(Number)
    const days = new Date(year, mon, 0).getDate()

    // Build a map of day → total spent
    const map = new Map<number, number>()
    for (const e of expenses) {
      if (!e.date.startsWith(month)) continue
      const day = parseInt(e.date.split('-')[2])
      map.set(day, (map.get(day) ?? 0) + e.amount)
    }

    const totals: number[] = []
    for (let d = 1; d <= days; d++) {
      totals.push(map.get(d) ?? 0)
    }

    const max = Math.max(...totals, 1) // at least 1 to avoid division by 0

    return { dailyTotals: totals, maxAmount: max, daysInMonth: days }
  }, [expenses, month])

  // Determine which day today is (for highlighting)
  const todayDay = todayStr.startsWith(month) ? parseInt(todayStr.split('-')[2]) : -1

  const hasData = dailyTotals.some(t => t > 0)

  // Chart dimensions
  const paddingLeft = 44
  const paddingRight = 12
  const paddingTop = 16
  const paddingBottom = 28
  const chartWidth = 760
  const chartHeight = 120
  const innerWidth = chartWidth - paddingLeft - paddingRight
  const innerHeight = chartHeight - paddingTop - paddingBottom

  const barWidth = Math.max(4, Math.floor(innerWidth / daysInMonth) - 2)

  // Y-axis labels: 0 and max
  const yLabels = [0, Math.round(maxAmount / 2), Math.round(maxAmount)]

  return (
    <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl p-5 mb-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[13px] font-semibold text-[#191c1d] dark:text-[#e2e4e5]">
          Daily Spending — {formatMonthLabel(month)}
        </h2>
        {hasData && (
          <span className="label-caps text-[#6f7881]">
            Max: {formatCurrency(maxAmount)}
          </span>
        )}
      </div>

      {!hasData ? (
        <div className="flex items-center justify-center h-[80px] text-[13px] text-[#bec7d1]">
          No spending recorded for this month yet
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <div className="min-w-[640px] h-[120px]">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-full overflow-visible"
              aria-label={`Daily spending chart for ${formatMonthLabel(month)}`}
            >
              {/* Y-axis gridlines and labels */}
              {yLabels.map((val, i) => {
                const y = paddingTop + innerHeight - (val / maxAmount) * innerHeight
                return (
                  <g key={i}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={chartWidth - paddingRight}
                      y2={y}
                      stroke="#e1e3e4"
                      strokeWidth={1}
                      strokeDasharray={i === 0 ? 'none' : '3,3'}
                    />
                    <text
                      x={paddingLeft - 4}
                      y={y + 4}
                      textAnchor="end"
                      fontSize={9}
                      fill="#6f7881"
                      fontFamily="monospace"
                    >
                      {val === 0 ? '0' : val >= 1000 ? `${(val / 1000).toFixed(1)}k` : String(val)}
                    </text>
                  </g>
                )
              })}

              {/* Bars */}
              {dailyTotals.map((amount, idx) => {
                const day = idx + 1
                const barHeight = amount > 0 ? Math.max(3, (amount / maxAmount) * innerHeight) : 0
                const x = paddingLeft + (idx / daysInMonth) * innerWidth + (innerWidth / daysInMonth - barWidth) / 2
                const y = paddingTop + innerHeight - barHeight

                const isToday = day === todayDay
                const isFuture = day > todayDay && todayDay > 0
                const fill = isFuture ? '#edeeef' : isToday ? '#006492' : '#2D9CDB'

                return (
                  <g key={day}>
                    {amount > 0 && (
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={fill}
                        rx={2}
                        className="transition-all duration-200"
                        opacity={isFuture ? 0.4 : 1}
                      >
                        <title>{`Day ${day}: ${formatCurrency(amount)}`}</title>
                      </rect>
                    )}

                    {/* X-axis label: show every 5th day or day 1 */}
                    {(day === 1 || day % 5 === 0) && (
                      <text
                        x={x + barWidth / 2}
                        y={chartHeight - 4}
                        textAnchor="middle"
                        fontSize={9}
                        fill={isToday ? '#006492' : '#6f7881'}
                        fontWeight={isToday ? 600 : 400}
                        fontFamily="monospace"
                      >
                        {day}
                      </text>
                    )}

                    {/* Highlight dot for today */}
                    {isToday && (
                      <circle
                        cx={x + barWidth / 2}
                        cy={paddingTop + innerHeight + 14}
                        r={2.5}
                        fill="#006492"
                      />
                    )}
                  </g>
                )
              })}

              {/* X-axis baseline */}
              <line
                x1={paddingLeft}
                y1={paddingTop + innerHeight}
                x2={chartWidth - paddingRight}
                y2={paddingTop + innerHeight}
                stroke="#bec7d1"
                strokeWidth={1}
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}
