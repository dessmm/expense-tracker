import { formatCurrency } from '@/lib/utils'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import { CATEGORY_BG } from '@/lib/utils'
import type { CategoryBreakdown, Category, CategoryBudget } from '@/lib/types'

interface CategoryBreakdownWidgetProps {
  data: CategoryBreakdown[]
  total: number
  budgets: CategoryBudget[]
}

export function CategoryBreakdownWidget({ data, total, budgets }: CategoryBreakdownWidgetProps) {
  return (
    <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl p-5">
      <h3 className="text-[13px] font-semibold text-[#191c1d] dark:text-[#e2e4e5] mb-4">
        Category Breakdown
      </h3>

      {data.length === 0 ? (
        <p className="text-[13px] text-[#6f7881] text-center py-6">No data yet</p>
      ) : (
        <div className="space-y-3">
          {data.map(({ category, amount, percentage }) => {
            const Icon = CATEGORY_ICONS[category as Category]
            const bgClass = CATEGORY_BG[category as Category]
            const budget = budgets.find(b => b.category === category)
            const cap = budget?.monthly_cap

            return (
              <div key={category} className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${bgClass}`}>
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium text-[#191c1d] dark:text-[#e2e4e5]">
                        {category}
                      </span>
                      <span className="font-mono text-[12px] text-[#3f4850] dark:text-[#9aacb5] tabular-nums">
                        {cap !== undefined ? `${formatCurrency(amount)} / ${formatCurrency(cap)}` : formatCurrency(amount)}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1 bg-[#edeeef] dark:bg-[#2e3132] rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#2D9CDB] transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Total */}
          <div className="pt-3 mt-3 border-t border-[#e1e3e4] dark:border-[#3a3d40] flex justify-between items-center">
            <span className="label-caps text-[#6f7881]">Total</span>
            <span className="font-mono text-[14px] font-semibold text-[#191c1d] dark:text-[#e2e4e5] tabular-nums">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
