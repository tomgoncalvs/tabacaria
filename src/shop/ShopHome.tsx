import { Clock, Flame, LayoutDashboard, MapPin, Plus, QrCode, Search, ShoppingBag, Truck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProductArt } from '../components/ProductArt'
import { Badge, Button, Empty, Select, cx, toast } from '../components/ui'
import { CATEGORIES, CATEGORY_MAP } from '../lib/categories'
import { brl, fmtPhone } from '../lib/format'
import { useCart, useStore } from '../lib/store'
import type { CategoryId, Product } from '../lib/types'
import { waLink } from '../lib/whatsapp'
import { AgeGate } from './AgeGate'
import { CartDrawer, useCartDetails } from './CartDrawer'
import { CheckoutModal } from './CheckoutModal'
import { WhatsIcon } from './WhatsIcon'

type Sort = 'destaques' | 'menor' | 'maior' | 'az'

export default function ShopHome() {
  const settings = useStore((s) => s.settings)
  const products = useStore((s) => s.products)
  const { setOpen } = useCart()
  const { count } = useCartDetails()
  const [cat, setCat] = useState<CategoryId | 'todos'>('todos')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<Sort>('destaques')
  const [checkout, setCheckout] = useState(false)

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    const r = products.filter(
      (p) => p.active && (cat === 'todos' || p.category === cat) && (!term || `${p.name} ${p.brand}`.toLowerCase().includes(term)),
    )
    const inStock = (p: Product) => (p.stock > 0 ? 0 : 1)
    return r.sort((a, b) => {
      if (inStock(a) !== inStock(b)) return inStock(a) - inStock(b)
      if (sort === 'menor') return a.price - b.price
      if (sort === 'maior') return b.price - a.price
      if (sort === 'az') return a.name.localeCompare(b.name)
      return Number(!!b.featured) - Number(!!a.featured)
    })
  }, [products, cat, q, sort])

  const openCheckout = () => {
    setOpen(false)
    setCheckout(true)
  }

  return (
    <div className="min-h-screen bg-stone-950">
      <AgeGate storeName={settings.storeName} />

      <div className="bg-amber-500 px-4 py-1.5 text-center text-[11px] font-medium text-stone-950">
        Entrega rápida na região · Frete grátis acima de {brl(settings.freeDeliveryFrom)} · Pague no Pix
      </div>

      <header className="sticky top-0 z-30 border-b border-white/5 bg-stone-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <a href="#" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
              <Flame className="size-5" />
            </span>
            <span className="font-display text-xl text-stone-50">{settings.storeName}</span>
          </a>
          <div className="relative ml-auto hidden max-w-xs flex-1 md:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar essência, seda, carvão…"
              className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-stone-100 placeholder:text-stone-500 outline-none focus:border-amber-500/50"
            />
          </div>
          <Link to="/admin" className="ml-auto md:ml-0" title="Painel do lojista">
            <Button variant="ghost" size="sm" icon={LayoutDashboard}>
              <span className="hidden sm:inline">Painel</span>
            </Button>
          </Link>
          <button onClick={() => setOpen(true)} className="relative grid size-10 place-items-center rounded-xl bg-white/5 text-stone-100 hover:bg-white/10" aria-label="Abrir carrinho">
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-stone-950">{count}</span>
            )}
          </button>
        </div>
      </header>

      {/* hero */}
      <section className="smoke relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[1.2fr_1fr] md:py-20">
          <div>
            <Badge tone="amber">🔥 Nova linha de essências chegou</Badge>
            <h1 className="mt-4 font-display text-4xl leading-tight text-stone-50 md:text-6xl">
              Sua sessão
              <br />
              começa <span className="text-amber-400">aqui.</span>
            </h1>
            <p className="mt-4 max-w-md text-stone-400">{settings.tagline}. Escolha, pague no Pix e finalize pelo WhatsApp em menos de 1 minuto.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#produtos">
                <Button variant="primary" size="lg">
                  Ver produtos
                </Button>
              </a>
              <a href={waLink(settings.whatsapp, 'Olá! Tenho uma dúvida sobre um produto.')} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="lg">
                  <WhatsIcon /> Falar com a gente
                </Button>
              </a>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-stone-900/70 p-6 backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-wider text-stone-500">Como funciona</p>
            <ul className="mt-4 space-y-4">
              {[
                [ShoppingBag, 'Monte seu carrinho', 'Escolha os produtos aqui no site.'],
                [QrCode, 'Pague no Pix', 'QR Code ou copia e cola, na hora.'],
                [WhatsIconWrap, 'Envie no WhatsApp', 'Pedido pronto + foto do comprovante.'],
                [Truck, 'Receba ou retire', 'Separamos assim que o Pix cair.'],
              ].map(([Icon, t, d], i) => {
                const I = Icon as typeof ShoppingBag
                return (
                  <li key={i} className="flex gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-400">
                      <I className="size-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-stone-100">{t as string}</span>
                      <span className="block text-xs text-stone-500">{d as string}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* catálogo */}
      <main id="produtos" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 pt-6">
        <div className="relative mb-4 md:hidden">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar produtos…"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm outline-none focus:border-amber-500/50"
          />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
          {[{ id: 'todos' as const, name: 'Todos' }, ...CATEGORIES].map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={cx(
                'shrink-0 rounded-full border px-4 py-2 text-sm transition',
                cat === c.id ? 'border-amber-500 bg-amber-500 text-stone-950 font-medium' : 'border-white/10 text-stone-300 hover:border-white/25',
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="whitespace-nowrap text-sm text-stone-500">{list.length} produtos</p>
          <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="!h-9 !w-auto text-xs">
            <option value="destaques">Destaques</option>
            <option value="menor">Menor preço</option>
            <option value="maior">Maior preço</option>
            <option value="az">A–Z</option>
          </Select>
        </div>

        {list.length === 0 ? (
          <Empty icon={Search} title="Nada encontrado" text="Tente outro termo ou categoria." />
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 bg-black/30">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm md:grid-cols-3">
          <div>
            <p className="font-display text-lg text-stone-100">{settings.storeName}</p>
            <p className="mt-2 text-stone-500">{settings.tagline}.</p>
          </div>
          <div className="space-y-2 text-stone-400">
            <p className="flex gap-2"><MapPin className="size-4 shrink-0 text-amber-400" /> {settings.address}</p>
            <p className="flex gap-2"><Clock className="size-4 shrink-0 text-amber-400" /> {settings.hours}</p>
            <p className="flex gap-2"><WhatsIcon className="size-4 shrink-0 text-amber-400" /> {fmtPhone(settings.whatsapp)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 p-4 text-xs leading-relaxed text-stone-400">
            <b className="text-stone-200">Venda proibida para menores de 18 anos.</b>
            <br />O Ministério da Saúde adverte: fumar causa câncer e outras doenças graves.
          </div>
        </div>
      </footer>

      <CartDrawer onCheckout={openCheckout} />
      <CheckoutModal open={checkout} onClose={() => setCheckout(false)} />
    </div>
  )
}

function WhatsIconWrap({ className }: { className?: string }) {
  return <WhatsIcon className={className} />
}

function ProductCard({ product: p }: { product: Product }) {
  const add = useCart((s) => s.add)
  const inCart = useCart((s) => s.lines.find((l) => l.productId === p.id)?.qty ?? 0)
  const out = p.stock <= 0
  const canAdd = !out && inCart < p.stock
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-stone-900/60 transition hover:border-amber-500/30">
      <div className="relative">
        <ProductArt product={p} className={cx('aspect-[4/3] w-full transition duration-500 group-hover:scale-[1.03]', out && 'opacity-40 grayscale')} />
        <div className="absolute left-2 top-2 flex gap-1">
          {out ? <Badge tone="neutral">Esgotado</Badge> : p.stock <= Math.max(2, p.minStock / 2) ? <Badge tone="red">Últimas unidades</Badge> : p.featured ? <Badge tone="amber">Destaque</Badge> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="text-[11px] uppercase tracking-wider text-stone-500">{CATEGORY_MAP[p.category].name}</p>
        <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-stone-100">{p.name}</p>
        <p className="mt-1 hidden line-clamp-2 text-xs text-stone-500 sm:block">{p.description}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <p className="text-lg font-semibold text-stone-50">{brl(p.price)}</p>
          <button
            disabled={!canAdd}
            onClick={() => {
              add(p.id)
              toast(`${p.name} no carrinho`)
            }}
            className="grid size-9 place-items-center rounded-xl bg-amber-500 text-stone-950 transition hover:bg-amber-400 disabled:bg-white/10 disabled:text-stone-500"
            aria-label={`Adicionar ${p.name}`}
          >
            <Plus className="size-5" />
          </button>
        </div>
        {inCart > 0 && <p className="mt-1 text-[11px] text-amber-400">{inCart} no carrinho</p>}
      </div>
    </div>
  )
}
