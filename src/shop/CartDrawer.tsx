import { Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react'
import { ProductArt } from '../components/ProductArt'
import { Button, Drawer, Empty } from '../components/ui'
import { brl } from '../lib/format'
import { useCart, useStore } from '../lib/store'

export function useCartDetails() {
  const lines = useCart((s) => s.lines)
  const products = useStore((s) => s.products)
  const items = lines
    .map((l) => ({ line: l, product: products.find((p) => p.id === l.productId) }))
    .filter((x): x is { line: typeof x.line; product: NonNullable<typeof x.product> } => !!x.product && x.product.active)
  const subtotal = items.reduce((s, x) => s + x.line.qty * x.product.price, 0)
  const count = items.reduce((s, x) => s + x.line.qty, 0)
  return { items, subtotal, count }
}

export function CartDrawer({ onCheckout }: { onCheckout: () => void }) {
  const { open, setOpen, setQty, remove } = useCart()
  const settings = useStore((s) => s.settings)
  const { items, subtotal, count } = useCartDetails()
  const missing = Math.max(0, settings.freeDeliveryFrom - subtotal)

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      title={
        <span className="flex items-center gap-2">
          <ShoppingBag className="size-5 text-amber-400" /> Seu carrinho
          {count > 0 && <span className="text-sm font-normal text-stone-400">({count} itens)</span>}
        </span>
      }
      footer={
        items.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-stone-400">Subtotal</span>
              <span className="text-xl font-semibold text-stone-50">{brl(subtotal)}</span>
            </div>
            <Button variant="primary" size="lg" className="w-full" onClick={onCheckout}>
              Finalizar pedido
            </Button>
            <p className="text-center text-[11px] text-stone-500">Pagamento via Pix · confirmação pelo WhatsApp</p>
          </div>
        )
      }
    >
      {items.length === 0 ? (
        <Empty icon={ShoppingBag} title="Seu carrinho está vazio" text="Adicione produtos para montar seu pedido." />
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <Truck className="size-4" />
              {missing > 0 ? (
                <span>
                  Faltam <b>{brl(missing)}</b> para frete grátis na entrega
                </span>
              ) : (
                <span>Você ganhou frete grátis! 🎉</span>
              )}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${Math.min(100, (subtotal / settings.freeDeliveryFrom) * 100)}%` }} />
            </div>
          </div>
          {items.map(({ line, product }) => (
            <div key={product.id} className="flex gap-3">
              <ProductArt product={product} className="size-16 shrink-0 rounded-xl" iconSize="size-6" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-100">{product.name}</p>
                <p className="text-xs text-stone-500">{brl(product.price)} un.</p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-white/10">
                    <button className="p-1.5 text-stone-400 hover:text-white" onClick={() => setQty(product.id, line.qty - 1)} aria-label="Diminuir">
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-7 text-center text-sm tabular-nums">{line.qty}</span>
                    <button
                      className="p-1.5 text-stone-400 hover:text-white disabled:opacity-30"
                      disabled={line.qty >= product.stock}
                      onClick={() => setQty(product.id, line.qty + 1)}
                      aria-label="Aumentar"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-stone-100">{brl(line.qty * product.price)}</span>
                </div>
              </div>
              <button className="self-start p-1 text-stone-500 hover:text-rose-400" onClick={() => remove(product.id)} aria-label="Remover">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  )
}
