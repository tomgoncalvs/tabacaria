import {
  ArrowLeftRight,
  Boxes,
  ChartColumn,
  ClipboardCheck,
  ExternalLink,
  Flame,
  LayoutDashboard,
  Menu,
  Package,
  Receipt,
  ScanBarcode,
  Settings,
  Wallet,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { cx } from '../components/ui'
import { useStore } from '../lib/store'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/vendas', label: 'Vendas', icon: Receipt, badge: true },
  { to: '/admin/pdv', label: 'Venda balcão', icon: ScanBarcode },
  { section: 'Estoque' },
  { to: '/admin/produtos', label: 'Produtos', icon: Package },
  { to: '/admin/estoque', label: 'Estoque', icon: Boxes },
  { to: '/admin/movimentacoes', label: 'Entradas e saídas', icon: ArrowLeftRight },
  { to: '/admin/balanco', label: 'Balanço', icon: ClipboardCheck },
  { section: 'Gestão' },
  { to: '/admin/financeiro', label: 'Financeiro', icon: Wallet },
  { to: '/admin/relatorios', label: 'Margem e ranking', icon: ChartColumn },
  { to: '/admin/configuracoes', label: 'Configurações', icon: Settings },
] as const

export default function AdminLayout() {
  const storeName = useStore((s) => s.settings.storeName)
  const pending = useStore((s) => s.orders.filter((o) => o.status === 'aguardando').length)
  const [open, setOpen] = useState(false)
  const loc = useLocation()

  useEffect(() => {
    setOpen(false)
    window.scrollTo(0, 0)
  }, [loc.pathname])

  const nav = (
    <nav className="flex flex-col gap-0.5 p-3">
      {NAV.map((item, i) =>
        'section' in item ? (
          <p key={i} className="mt-5 px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-stone-600">
            {item.section}
          </p>
        ) : (
          <NavLink
            key={item.to}
            to={item.to}
            end={'end' in item}
            className={({ isActive }) =>
              cx(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition',
                isActive ? 'bg-amber-500/10 text-amber-300' : 'text-stone-400 hover:bg-white/5 hover:text-stone-100',
              )
            }
          >
            <item.icon className="size-4" />
            <span className="flex-1">{item.label}</span>
            {'badge' in item && pending > 0 && (
              <span className="grid min-w-5 place-items-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-stone-950">{pending}</span>
            )}
          </NavLink>
        ),
      )}
    </nav>
  )

  const brand = (
    <div className="flex h-16 items-center gap-2.5 border-b border-white/5 px-5">
      <span className="grid size-8 place-items-center rounded-lg bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
        <Flame className="size-4" />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-stone-100">{storeName}</p>
        <p className="text-[11px] text-stone-500">Painel de gestão</p>
      </div>
    </div>
  )

  const footer = (
    <div className="border-t border-white/5 p-3">
      <a href="#/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-stone-400 hover:bg-white/5 hover:text-stone-100">
        <ExternalLink className="size-4" /> Ver loja
      </a>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-stone-200">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/5 bg-zinc-950 lg:flex">
        {brand}
        <div className="flex-1 overflow-y-auto">{nav}</div>
        {footer}
      </aside>

      {/* mobile */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/5 bg-zinc-950/90 px-4 backdrop-blur lg:hidden">
        <button onClick={() => setOpen(true)} className="rounded-lg p-1.5 text-stone-300 hover:bg-white/5" aria-label="Menu">
          <Menu className="size-5" />
        </button>
        <span className="text-sm font-semibold">{storeName}</span>
        {pending > 0 && (
          <NavLink to="/admin/vendas" className="ml-auto rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-stone-950">
            {pending} aguardando
          </NavLink>
        )}
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <aside className="animate-rise absolute inset-y-0 left-0 flex w-72 flex-col bg-zinc-950">
            <div className="relative">
              {brand}
              <button onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-stone-400" aria-label="Fechar menu">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{nav}</div>
            {footer}
          </aside>
        </div>
      )}

      <main className="lg:pl-60">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
