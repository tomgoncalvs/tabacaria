import {
  Cherry,
  Cigarette,
  Flame,
  FlameKindling,
  Leaf,
  Package,
  ScrollText,
  Wind,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { CategoryId } from './types'

export interface CategoryInfo {
  id: CategoryId
  name: string
  icon: LucideIcon
  /** classes de gradiente usadas na arte do produto */
  art: string
  color: string
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'essencias', name: 'Essências', icon: Cherry, art: 'from-rose-500/40 via-fuchsia-600/20 to-stone-900', color: '#f43f5e' },
  { id: 'narguiles', name: 'Narguilés', icon: Wind, art: 'from-sky-500/40 via-indigo-600/20 to-stone-900', color: '#38bdf8' },
  { id: 'carvao', name: 'Carvão', icon: Flame, art: 'from-orange-500/40 via-red-700/20 to-stone-900', color: '#f97316' },
  { id: 'acessorios-narguile', name: 'Peças p/ Narguilé', icon: Wrench, art: 'from-teal-500/40 via-cyan-700/20 to-stone-900', color: '#14b8a6' },
  { id: 'sedas', name: 'Sedas & Piteiras', icon: ScrollText, art: 'from-amber-200/40 via-yellow-700/20 to-stone-900', color: '#fde68a' },
  { id: 'tabacos', name: 'Tabacos', icon: Leaf, art: 'from-lime-500/40 via-emerald-700/20 to-stone-900', color: '#84cc16' },
  { id: 'charutos', name: 'Charutos', icon: Cigarette, art: 'from-amber-700/50 via-orange-900/30 to-stone-900', color: '#b45309' },
  { id: 'isqueiros', name: 'Isqueiros', icon: FlameKindling, art: 'from-yellow-400/40 via-amber-600/20 to-stone-900', color: '#facc15' },
  { id: 'acessorios', name: 'Acessórios', icon: Package, art: 'from-violet-500/40 via-purple-700/20 to-stone-900', color: '#a78bfa' },
]

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<
  CategoryId,
  CategoryInfo
>
