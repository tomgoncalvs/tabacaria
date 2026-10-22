// Estado da demo. Sem backend: tudo fica no localStorage do navegador,
// então um pedido feito na loja aparece na hora no painel.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { round2, uid } from './format'
import { buildSeed, type SeedData } from './seed'
import type {
  Expense,
  Movement,
  Order,
  OrderItem,
  PayMethod,
  Product,
  Settings,
  StockCount,
} from './types'

export type NewMovement = {
  productId: string
  type: 'entrada' | 'saida'
  qty: number
  unitCost?: number
  note?: string
  supplier?: string
}

interface Actions {
  saveProduct: (p: Omit<Product, 'id' | 'createdAt' | 'stock'> & { id?: string }, initialStock?: number) => void
  addMovement: (m: NewMovement) => void
  placeOrder: (o: Omit<Order, 'id' | 'number' | 'date' | 'status' | 'channel' | 'payment'>) => Order
  confirmOrder: (id: string) => void
  deliverOrder: (id: string) => void
  cancelOrder: (id: string) => void
  counterSale: (o: { items: OrderItem[]; discount: number; payment: PayMethod; customer: string }) => Order
  addExpense: (e: Omit<Expense, 'id'>) => void
  removeExpense: (id: string) => void
  startCount: () => string
  setCounted: (countId: string, productId: string, counted: number | null) => void
  finishCount: (countId: string) => void
  discardCount: (countId: string) => void
  updateSettings: (s: Partial<Settings>) => void
  resetDemo: () => void
}

type State = SeedData & Actions

/** aplica movimentos de venda/estorno ao estoque */
function stockMoves(order: Order, type: 'venda' | 'estorno', products: Product[]) {
  const sign = type === 'venda' ? -1 : 1
  const date = new Date().toISOString()
  const moves: Movement[] = order.items.map((it) => ({
    id: uid('m'),
    productId: it.productId,
    type,
    qty: sign * it.qty,
    unitCost: it.cost,
    date,
    ref: `#${order.number}`,
  }))
  const next = products.map((p) => {
    const delta = moves.filter((m) => m.productId === p.id).reduce((s, m) => s + m.qty, 0)
    return delta ? { ...p, stock: p.stock + delta } : p
  })
  return { moves, products: next }
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...buildSeed(),

      saveProduct: (input, initialStock = 0) => {
        if (input.id) {
          set((s) => ({ products: s.products.map((p) => (p.id === input.id ? { ...p, ...input } : p)) }))
          return
        }
        const p: Product = { ...input, id: uid('p'), stock: 0, createdAt: new Date().toISOString() }
        set((s) => ({ products: [p, ...s.products] }))
        if (initialStock > 0) {
          get().addMovement({ productId: p.id, type: 'entrada', qty: initialStock, unitCost: p.cost, note: 'Estoque inicial' })
        }
      },

      addMovement: ({ productId, type, qty, unitCost, note, supplier }) => {
        set((s) => {
          const p = s.products.find((x) => x.id === productId)
          if (!p || qty <= 0) return s
          const signed = type === 'entrada' ? qty : -qty
          const cost = type === 'entrada' ? (unitCost ?? p.cost) : p.cost
          const newStock = p.stock + signed
          // custo médio ponderado só muda em entradas
          const newCost =
            type === 'entrada' && newStock > 0
              ? round2((Math.max(p.stock, 0) * p.cost + qty * cost) / (Math.max(p.stock, 0) + qty))
              : p.cost
          const m: Movement = { id: uid('m'), productId, type, qty: signed, unitCost: cost, date: new Date().toISOString(), note, supplier }
          return {
            movements: [m, ...s.movements],
            products: s.products.map((x) => (x.id === productId ? { ...x, stock: newStock, cost: newCost } : x)),
          }
        })
      },

      placeOrder: (input) => {
        const s = get()
        const order: Order = {
          ...input,
          id: uid('o'),
          number: s.nextOrder,
          date: new Date().toISOString(),
          status: 'aguardando',
          channel: 'site',
          payment: 'pix',
        }
        set({ orders: [order, ...s.orders], nextOrder: s.nextOrder + 1 })
        return order
      },

      confirmOrder: (id) =>
        set((s) => {
          const o = s.orders.find((x) => x.id === id)
          if (!o || o.status !== 'aguardando') return s
          // custo congelado no momento da confirmação
          const items = o.items.map((it) => ({ ...it, cost: s.products.find((p) => p.id === it.productId)?.cost ?? it.cost }))
          const updated: Order = { ...o, items, status: 'pago', paidAt: new Date().toISOString() }
          const { moves, products } = stockMoves(updated, 'venda', s.products)
          return {
            orders: s.orders.map((x) => (x.id === id ? updated : x)),
            movements: [...moves, ...s.movements],
            products,
          }
        }),

      deliverOrder: (id) =>
        set((s) => ({ orders: s.orders.map((o) => (o.id === id && o.status === 'pago' ? { ...o, status: 'entregue' } : o)) })),

      cancelOrder: (id) =>
        set((s) => {
          const o = s.orders.find((x) => x.id === id)
          if (!o || o.status === 'cancelado') return s
          const orders = s.orders.map((x) => (x.id === id ? { ...x, status: 'cancelado' as const } : x))
          if (o.status === 'aguardando') return { orders }
          const { moves, products } = stockMoves(o, 'estorno', s.products)
          return { orders, products, movements: [...moves, ...s.movements] }
        }),

      counterSale: ({ items, discount, payment, customer }) => {
        const s = get()
        const subtotal = round2(items.reduce((a, it) => a + it.qty * it.price, 0))
        const now = new Date().toISOString()
        const order: Order = {
          id: uid('o'),
          number: s.nextOrder,
          date: now,
          paidAt: now,
          customer: { name: customer.trim() || 'Cliente balcão', phone: '' },
          delivery: 'retirada',
          items,
          subtotal,
          deliveryFee: 0,
          discount,
          total: round2(subtotal - discount),
          status: 'entregue',
          channel: 'balcao',
          payment,
        }
        const { moves, products } = stockMoves(order, 'venda', s.products)
        set({ orders: [order, ...s.orders], movements: [...moves, ...s.movements], products, nextOrder: s.nextOrder + 1 })
        return order
      },

      addExpense: (e) => set((s) => ({ expenses: [{ ...e, id: uid('e') }, ...s.expenses].sort((a, b) => b.date.localeCompare(a.date)) })),
      removeExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      startCount: () => {
        const s = get()
        const open = s.counts.find((c) => c.status === 'aberto')
        if (open) return open.id
        const count: StockCount = {
          id: `BAL-${s.counts.length + 1}`,
          date: new Date().toISOString(),
          status: 'aberto',
          items: s.products.filter((p) => p.active).map((p) => ({ productId: p.id, system: p.stock, counted: null, cost: p.cost })),
        }
        set({ counts: [count, ...s.counts] })
        return count.id
      },

      setCounted: (countId, productId, counted) =>
        set((s) => ({
          counts: s.counts.map((c) =>
            c.id === countId ? { ...c, items: c.items.map((it) => (it.productId === productId ? { ...it, counted } : it)) } : c,
          ),
        })),

      finishCount: (countId) =>
        set((s) => {
          const c = s.counts.find((x) => x.id === countId)
          if (!c || c.status !== 'aberto') return s
          const now = new Date().toISOString()
          // itens não contados mantêm o saldo do sistema
          const items = c.items.map((it) => ({ ...it, counted: it.counted ?? it.system }))
          const moves: Movement[] = items
            .filter((it) => it.counted !== it.system)
            .map((it) => ({
              id: uid('m'),
              productId: it.productId,
              type: 'ajuste',
              qty: it.counted - it.system,
              unitCost: it.cost,
              date: now,
              note: 'Ajuste de balanço',
              ref: c.id,
            }))
          const products = s.products.map((p) => {
            const d = moves.find((m) => m.productId === p.id)
            return d ? { ...p, stock: p.stock + d.qty } : p
          })
          return {
            counts: s.counts.map((x) => (x.id === countId ? { ...x, items, status: 'finalizado', finishedAt: now } : x)),
            movements: [...moves, ...s.movements],
            products,
          }
        }),

      discardCount: (countId) => set((s) => ({ counts: s.counts.filter((c) => c.id !== countId) })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      resetDemo: () => set({ ...buildSeed() }),
    }),
    { name: 'brasa-demo', version: 1 },
  ),
)

// ---------- carrinho ----------

export interface CartLine {
  productId: string
  qty: number
}

interface CartState {
  lines: CartLine[]
  open: boolean
  add: (productId: string, qty?: number) => void
  setQty: (productId: string, qty: number) => void
  remove: (productId: string) => void
  clear: () => void
  setOpen: (open: boolean) => void
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,
      add: (productId, qty = 1) =>
        set((s) => {
          const found = s.lines.find((l) => l.productId === productId)
          const lines = found
            ? s.lines.map((l) => (l.productId === productId ? { ...l, qty: l.qty + qty } : l))
            : [...s.lines, { productId, qty }]
          return { lines }
        }),
      setQty: (productId, qty) =>
        set((s) => ({
          lines: qty <= 0 ? s.lines.filter((l) => l.productId !== productId) : s.lines.map((l) => (l.productId === productId ? { ...l, qty } : l)),
        })),
      remove: (productId) => set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId) })),
      clear: () => set({ lines: [] }),
      setOpen: (open) => set({ open }),
    }),
    { name: 'brasa-cart', partialize: (s) => ({ lines: s.lines }) },
  ),
)
