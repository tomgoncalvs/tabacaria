import { CATEGORY_MAP } from '../lib/categories'
import type { Product } from '../lib/types'
import { cx } from './ui'

export function ProductArt({ product, className, iconSize = 'size-10' }: { product: Pick<Product, 'category' | 'image' | 'name' | 'brand'>; className?: string; iconSize?: string }) {
  const cat = CATEGORY_MAP[product.category]
  const Icon = cat.icon
  if (product.image) {
    return <img src={product.image} alt={product.name} className={cx('object-cover', className)} />
  }
  return (
    <div className={cx('relative grid place-items-center overflow-hidden bg-gradient-to-br', cat.art, className)}>
      <div className="absolute -right-6 -top-6 size-24 rounded-full bg-white/5 blur-2xl" />
      <Icon className={cx('relative text-white/80 drop-shadow', iconSize)} strokeWidth={1.4} />
    </div>
  )
}
