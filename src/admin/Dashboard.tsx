import { ArrowRight, BadgePercent, CircleCheck, Clock, DollarSign, Receipt, TrendingUp, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ProductArt } from '../components/ProductArt'
import { Badge, Button, Card, CardHeader, Empty, PageHeader, Segmented, Stat, toast } from '../components/ui'
import { brl, daysAgo, fmtDateTime, num, pct } from '../lib/format'
import { byCategory, dailySeries, delta, ordersInRange, productRanking, summarize } from '../lib/metrics'
import { useStore } from '../lib/store'
import type { Order } from '../lib/types'
import { OrderDrawer, chartTheme } from './shared'

export default function Dashboard() {
  const orders = useStore((s) => s.orders)
  const products = useStore((s) => s.products)
  const confirmOrder = useStore((s) => s.confirmOrder)
  const [days, setDays] = useState(30)
  const [selected, setSelected] = useState<string | null>(null)

  const data = useMemo(() => {
    const cur = ordersInRange(orders, daysAgo(days - 1))
    const prev = ordersInRange(orders, daysAgo(days * 2 - 1), daysAgo(days - 1))
    const s = summarize(cur)
    const p = summarize(prev)
    const ranking = productRanking(cur, products)
    return {
      s,
      p,
      series: dailySeries(cur, days),
      top: ranking.slice(0, 6),
      cats: byCategory(ranking),
      site: cur.filter((o) => o.channel === 'site' && o.status !== 'cancelado').length,
      balcao: cur.filter((o) => o.channel === 'balcao' && o.status !== 'cancelado').length,
    }
  }, [orders, products, days])

  const pending = orders.filter((o) => o.status === 'aguardando')
  const low = products.filter((p) => p.active && p.stock <= p.minStock).sort((a, b) => a.stock / a.minStock - b.stock / b.minStock)
  const today = summarize(ordersInRange(orders, daysAgo(0)))
  const selectedOrder = orders.find((o) => o.id === selected) ?? null

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Hoje: ${brl(today.revenue)} em ${today.count} vendas · lucro bruto ${brl(today.profit)}`}
        actions={
          <Segmented
            value={days}
            onChange={setDays}
            options={[
              { value: 7, label: '7 dias' },
              { value: 30, label: '30 dias' },
              { value: 90, label: '90 dias' },
            ]}
          />
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Stat label="Faturamento" value={brl(data.s.revenue)} icon={DollarSign} change={delta(data.s.revenue, data.p.revenue)} hint="vs. período anterior" />
        <Stat label="Lucro bruto" value={brl(data.s.profit)} icon={TrendingUp} tone="green" change={delta(data.s.profit, data.p.profit)} hint="receita − custo" />
        <Stat label="Margem bruta" value={pct(data.s.margin)} icon={BadgePercent} tone="violet" hint={`antes: ${pct(data.p.margin)}`} />
        <Stat label="Vendas" value={num(data.s.count)} icon={Receipt} tone="blue" change={delta(data.s.count, data.p.count)} hint={`ticket ${brl(data.s.ticket)}`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Faturamento x lucro" subtitle={`Últimos ${days} dias`} />
          <div className="h-72 px-2 pb-4">
            <ResponsiveContainer>
              <AreaChart data={data.series} margin={{ left: 0, right: 12, top: 8 }}>
                <defs>
                  <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gLuc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="dia" tick={chartTheme.axis} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis tick={chartTheme.axis} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => `R$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
                <Tooltip {...chartTheme.tooltip} formatter={(v: number, n: string) => [brl(v), n === 'receita' ? 'Faturamento' : 'Lucro bruto']} />
                <Area type="monotone" dataKey="receita" stroke="#f59e0b" strokeWidth={2} fill="url(#gRec)" />
                <Area type="monotone" dataKey="lucro" stroke="#34d399" strokeWidth={2} fill="url(#gLuc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Clock className="size-4 text-amber-400" /> Aguardando confirmação do Pix
              </span>
            }
            subtitle="Confira o comprovante no WhatsApp e confirme"
          />
          <div className="max-h-72 space-y-2 overflow-y-auto px-5 pb-5">
            {pending.length === 0 ? (
              <Empty icon={CircleCheck} title="Tudo em dia" text="Nenhum pedido aguardando pagamento." />
            ) : (
              pending.map((o) => <PendingRow key={o.id} order={o} onOpen={() => setSelected(o.id)} onConfirm={() => { confirmOrder(o.id); toast(`Pagamento do #${o.number} confirmado`) }} />)
            )}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Mais vendidos" subtitle="Por faturamento no período" action={<Link to="/admin/relatorios" className="text-xs text-amber-400 hover:underline">Ranking completo</Link>} />
          <div className="space-y-3 px-5 pb-5">
            {data.top.map((r, i) => {
              const p = products.find((x) => x.id === r.productId)
              return (
                <div key={r.productId} className="flex items-center gap-3">
                  <span className="w-4 text-xs text-stone-500">{i + 1}</span>
                  {p && <ProductArt product={p} className="size-9 shrink-0 rounded-lg" iconSize="size-4" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-stone-200">{r.name}</p>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: `${(r.revenue / data.top[0].revenue) * 100}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums">{brl(r.revenue)}</p>
                    <p className="text-[11px] text-stone-500">{r.qty} un · {pct(r.margin, 0)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Vendas por categoria" subtitle={`Site ${data.site} pedidos · Balcão ${data.balcao}`} />
          <div className="flex items-center gap-4 px-5 pb-5">
            <div className="size-36 shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={data.cats} dataKey="revenue" nameKey="name" innerRadius="62%" outerRadius="100%" stroke="none" paddingAngle={2}>
                    {data.cats.map((c) => (
                      <Cell key={c.id} fill={c.color} />
                    ))}
                  </Pie>
                  <Tooltip {...chartTheme.tooltip} formatter={(v: number) => brl(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="min-w-0 flex-1 space-y-1.5 text-xs">
              {data.cats.slice(0, 7).map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: c.color }} />
                  <span className="flex-1 truncate text-stone-300">{c.name}</span>
                  <span className="text-stone-500 tabular-nums">{pct(c.revenue / (data.s.revenue || 1), 0)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <TriangleAlert className="size-4 text-rose-400" /> Estoque baixo
              </span>
            }
            subtitle={`${low.length} produtos no mínimo ou abaixo`}
            action={<Link to="/admin/estoque" className="text-xs text-amber-400 hover:underline">Ver estoque</Link>}
          />
          <div className="max-h-64 space-y-2 overflow-y-auto px-5 pb-5">
            {low.length === 0 ? (
              <Empty icon={CircleCheck} title="Estoque saudável" />
            ) : (
              low.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-stone-300">{p.name}</span>
                  <Badge tone={p.stock === 0 ? 'red' : 'amber'}>
                    {p.stock} / mín {p.minStock}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <OrderDrawer order={selectedOrder} onClose={() => setSelected(null)} />
    </>
  )
}

function PendingRow({ order, onOpen, onConfirm }: { order: Order; onOpen: () => void; onConfirm: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm text-stone-100">
          #{order.number} · {order.customer.name}
        </p>
        <p className="text-xs text-stone-500">
          {fmtDateTime(order.date)} · <span className="text-amber-300">{brl(order.total)}</span>
        </p>
      </button>
      <Button size="sm" variant="success" onClick={onConfirm}>
        Confirmar
      </Button>
      <button onClick={onOpen} className="text-stone-500 hover:text-white" aria-label="Detalhes">
        <ArrowRight className="size-4" />
      </button>
    </div>
  )
}
