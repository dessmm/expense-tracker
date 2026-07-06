import type { Category } from '@/lib/types'
import {
  UtensilsCrossed,
  Car,
  Zap,
  ShoppingBag,
  Heart,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react'

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  Food:      UtensilsCrossed,
  Transport: Car,
  Bills:     Zap,
  Shopping:  ShoppingBag,
  Health:    Heart,
  Other:     MoreHorizontal,
}
