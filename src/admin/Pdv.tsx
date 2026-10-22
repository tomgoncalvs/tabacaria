import { Banknote, CreditCard, Minus, Plus, QrCode, ScanBarcode, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ProductArt } from '../components/ProductArt'
import { Button, Card, Empty, Field, Input, PageHeader, cx, toast } from '../components/ui'
import { CATEGORIES } from '../lib/categories'
import { brl, pct, round2 } from '../lib/format'
import { useStore } from '../lib/store'
import type { CategoryId, PayMethod } from '../lib/types'

export default function Pdv() {
  const products = useStore((s) => s.products)
  const counterSale = useStore((s) => s.counterSale)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<CategoryId | 'todos'>('todos')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [discount, setDiscount] = useState('')
  const [payment, setPayment] = useState<PayMethod>('pix')
  const [customer, setCustomer] = useState('')

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return products
      .filter((p) => p.active && (cat === 'todos' || p.category === cat) && (!t || `${p.name} ${p.sku} ${p.brand}`.toLowerCase().includes(t)))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [products, q, cat])

  const lines = Object.entries(cart)
    .map(([id, qty]) => ({ p: products.find((x) => x.id === id)!, qty }))
    .filter((l) => l.p)
  const subtotal = lines.reduce((s, l) => s + l.qty * l.p.price, 0)
  const cost = lines.reduce((s, l) => s + l.qty * l.p.cost, 0)
  const disc = Math.min(subtotal, Number(discount.replace(',', '.')) || 0)
  const total = round2(subtotal - disc)

  const add = (id: string, d = 1) => {
    const p = products.find((x) => x.id === id)!
    setCart((c) => {
      const qty = Math.min(p.stock, (c[id] ?? 0) + d)
      const next = { ...c }
      if (qty <= 0) delete next[id]
      else next[id] = qty
      return next
    })
  }

  const finish = () => {
    const order = counterSale({
      items: lines.map((l) => ({ productId: l.p.id, name: l.p.name, qty: l.qty, price: l.p.price, cost: l.p.cost })),
      discount: disc,
      payment,
      customer,
    })
    toast(`Venda #${order.number} registrada · ${brl(order.total)}`)
    setCart({})
    setDiscount('')
    setCustomer('')
  }

  return (
    <>
      <PageHeader title="Venda balcão" subtitle="PDV rápido: a venda já entra paga e baixa o estoque na hora" />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-500" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, marca ou código (SKU)" className="pl-9" autoFocus />
          </div>
          <div className="-mx-1 mt-3 flex gap-1 overflow-x-auto px-1 pb-1">
            {[{ id: 'todos' as const, name: 'Todos' }, ...CATEGORIES].map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={cx('shrink-0 rounded-lg px-3 py-1.5 text-xs', cat === c.id ? 'bg-amber-500 font-medium text-stone-950' : 'bg-white/5 text-stone-400 hover:text-white')}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            {list.map((p) => (
              <button
                key={p.id}
                disabled={p.stock <= (cart[p.id] ?? 0)}
                onClick={() => add(p.id)}
                className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-2 text-left transition hover:border-amber-500/40 disabled:opacity-40"
              >
                <ProductArt product={p} className="size-10 shrink-0 rounded-lg" iconSize="size-4" />
                <span className="min-w-0">
                  <span className="line-clamp-2 text-xs leading-tight text-stone-200">{p.name}</span>
                  <span className="mt-0.5 block text-xs font-semibold text-amber-300">
                    {brl(p.price)} <span className="font-normal text-stone-500">· {p.stock} un</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col lg:sticky lg:top-6 lg:self-start">
          <div className="border-b border-white/5 p-4">
            <p className="text-sm font-semibold">Cupom</p>
          </div>
          <div className="max-h-[40vh] min-h-32 flex-1 overflow-y-auto p-4">
            {lines.length === 0 ? (
              <Empty icon={ScanBarcode} title="Nenhum item" text="Toque nos produtos para adicionar." />
            ) : (
              <div className="space-y-3">
                {lines.map(({ p, qty }) => (
                  <div key={p.id} className="flex items-center gap-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-stone-200">{p.name}</p>
                      <p className="text-xs text-stone-500">{brl(p.price)}</p>
                    </div>
                    <div className="flex items-center rounded-lg border border-white/10">
                      <button className="p-1 text-stone-400 hover:text-white" onClick={() => add(p.id, -1)} aria-label="Diminuir">
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-6 text-center tabular-nums">{qty}</span>
                      <button className="p-1 text-stone-400 hover:text-white" onClick={() => add(p.id)} aria-label="Aumentar">
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <span className="w-20 text-right tabular-nums">{brl(qty * p.price)}</span>
                    <button className="text-stone-500 hover:text-rose-400" onClick={() => add(p.id, -qty)} aria-label="Remover">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-3 border-t border-white/5 p-4">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Cliente (opcional)">
                <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Nome" className="!h-9 text-xs" />
              </Field>
              <Field label="Desconto (R$)">
                <Input type="number" min={0} step="0.5" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0,00" className="!h-9 text-xs" />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ['pix', QrCode, 'Pix'],
                  ['cartao', CreditCard, 'Cartão'],
                  ['dinheiro', Banknote, 'Dinheiro'],
                ] as const
              ).map(([id, Icon, label]) => (
                <button
                  key={id}
                  onClick={() => setPayment(id)}
                  className={cx(
                    'flex flex-col items-center gap-1 rounded-xl border py-2 text-xs transition',
                    payment === id ? 'border-amber-500/60 bg-amber-500/10 text-amber-200' : 'border-white/10 text-stone-400 hover:text-white',
                  )}
                >
                  <Icon className="size-4" /> {label}
                </button>
              ))}
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-stone-400">
                <span>Subtotal</span>
                <span>{brl(subtotal)}</span>
              </div>
              {disc > 0 && (
                <div className="flex justify-between text-stone-400">
                  <span>Desconto</span>
                  <span>− {brl(disc)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-stone-500">
                <span>Margem desta venda</span>
                <span className={total && (total - cost) / total < 0.3 ? 'text-amber-300' : 'text-emerald-300'}>{pct(total ? (total - cost) / total : 0)}</span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="font-medium">Total</span>
                <span className="text-2xl font-semibold text-amber-400">{brl(total)}</span>
              </div>
            </div>
            <Button variant="primary" size="lg" className="w-full" disabled={!lines.length} onClick={finish}>
              Finalizar venda
            </Button>
          </div>
        </Card>
      </div>
    </>
  )
}
