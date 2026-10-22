import { CATEGORY_MAP } from './categories'
import { daysAgo, fmtDay } from './format'
import type { CategoryId, Order, Product } from './types'

export const isRevenue = (o: Order) => o.status === 'pago' || o.status === 'entregue'

export const orderCost = (o: Order) => o.items.reduce((s, it) => s + it.qty * it.cost, 0)
/** receita de mercadoria (sem frete) */
export const orderNet = (o: Order) => o.subtotal - o.discount

export function ordersInRange(orders: Order[], from: Date, to = new Date(8.64e15)) {
  const f = from.getTime()
  const t = to.getTime()
  return orders.filter((o) => {
    const d = new Date(o.date).getTime()
    return d >= f && d < t
  })
}

export function summarize(orders: Order[]) {
  const paid = orders.filter(isRevenue)
  const revenue = paid.reduce((s, o) => s + orderNet(o), 0)
  const cogs = paid.reduce((s, o) => s + orderCost(o), 0)
  const delivery = paid.reduce((s, o) => s + o.deliveryFee, 0)
  const discount = paid.reduce((s, o) => s + o.discount, 0)
  const units = paid.reduce((s, o) => s + o.items.reduce((a, it) => a + it.qty, 0), 0)
  const profit = revenue - cogs
  return {
    count: paid.length,
    revenue,
    cogs,
    profit,
    delivery,
    discount,
    units,
    margin: revenue ? profit / revenue : 0,
    ticket: paid.length ? (revenue + delivery) / paid.length : 0,
  }
}

export const delta = (cur: number, prev: number) => (prev ? (cur - prev) / prev : 0)

export function dailySeries(orders: Order[], days: number) {
  const rows = Array.from({ length: days }, (_, i) => {
    const d = daysAgo(days - 1 - i)
    return { key: d.toDateString(), dia: fmtDay(d), receita: 0, lucro: 0, pedidos: 0 }
  })
  const idx = new Map(rows.map((r, i) => [r.key, i]))
  for (const o of orders) {
    if (!isRevenue(o)) continue
    const i = idx.get(new Date(o.date).toDateString())
    if (i === undefined) continue
    rows[i].receita += orderNet(o)
    rows[i].lucro += orderNet(o) - orderCost(o)
    rows[i].pedidos += 1
  }
  return rows.map((r) => ({ ...r, receita: Math.round(r.receita), lucro: Math.round(r.lucro) }))
}

export interface ProductRank {
  productId: string
  name: string
  category: CategoryId
  qty: number
  revenue: number
  cogs: number
  profit: number
  margin: number
  share: number
  abc: 'A' | 'B' | 'C'
}

export function productRanking(orders: Order[], products: Product[]): ProductRank[] {
  const byId = new Map<string, ProductRank>()
  const pmap = new Map(products.map((p) => [p.id, p]))
  for (const o of orders) {
    if (!isRevenue(o)) continue
    const factor = o.subtotal ? (o.subtotal - o.discount) / o.subtotal : 1
    for (const it of o.items) {
      const p = pmap.get(it.productId)
      let r = byId.get(it.productId)
      if (!r) {
        r = { productId: it.productId, name: p?.name ?? it.name, category: p?.category ?? 'acessorios', qty: 0, revenue: 0, cogs: 0, profit: 0, margin: 0, share: 0, abc: 'C' }
        byId.set(it.productId, r)
      }
      r.qty += it.qty
      r.revenue += it.qty * it.price * factor
      r.cogs += it.qty * it.cost
    }
  }
  const list = [...byId.values()].sort((a, b) => b.revenue - a.revenue)
  const total = list.reduce((s, r) => s + r.revenue, 0)
  let acc = 0
  for (const r of list) {
    r.profit = r.revenue - r.cogs
    r.margin = r.revenue ? r.profit / r.revenue : 0
    r.share = total ? r.revenue / total : 0
    acc += r.share
    r.abc = acc <= 0.8 ? 'A' : acc <= 0.95 ? 'B' : 'C'
  }
  return list
}

export function byCategory(ranking: ProductRank[]) {
  const map = new Map<CategoryId, { id: CategoryId; name: string; color: string; revenue: number; profit: number; qty: number }>()
  for (const r of ranking) {
    const c = CATEGORY_MAP[r.category]
    const row = map.get(r.category) ?? { id: r.category, name: c.name, color: c.color, revenue: 0, profit: 0, qty: 0 }
    row.revenue += r.revenue
    row.profit += r.profit
    row.qty += r.qty
    map.set(r.category, row)
  }
  return [...map.values()]
    .map((r) => ({ ...r, margin: r.revenue ? r.profit / r.revenue : 0 }))
    .sort((a, b) => b.revenue - a.revenue)
}

/** unidades vendidas por produto nos últimos N dias */
export function soldLastDays(orders: Order[], days: number) {
  const from = daysAgo(days).getTime()
  const map = new Map<string, number>()
  for (const o of orders) {
    if (!isRevenue(o) || new Date(o.date).getTime() < from) continue
    for (const it of o.items) map.set(it.productId, (map.get(it.productId) ?? 0) + it.qty)
  }
  return map
}

export const productMargin = (p: Pick<Product, 'cost' | 'price'>) => (p.price ? (p.price - p.cost) / p.price : 0)
export const productMarkup = (p: Pick<Product, 'cost' | 'price'>) => (p.cost ? p.price / p.cost : 0)
