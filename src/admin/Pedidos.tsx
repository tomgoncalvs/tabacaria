import { Receipt, ScanBarcode, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, Empty, Input, PageHeader, Select, Stat, cx, td, th } from '../components/ui'
import { brl, daysAgo, fmtDateTime, pct } from '../lib/format'
import { orderCost, orderNet, ordersInRange, summarize } from '../lib/metrics'
import { useStore } from '../lib/store'
import type { OrderStatus } from '../lib/types'
import { OrderDrawer, PAY, STATUS, StatusBadge } from './shared'

const PAGE = 40

export default function Pedidos() {
  const orders = useStore((s) => s.orders)
  const [status, setStatus] = useState<OrderStatus | 'todos'>('todos')
  const [channel, setChannel] = useState<'todos' | 'site' | 'balcao'>('todos')
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const [selected, setSelected] = useState<string | null>(null)

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: orders.length }
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1
    return c
  }, [orders])

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    return orders.filter(
      (o) =>
        (status === 'todos' || o.status === status) &&
        (channel === 'todos' || o.channel === channel) &&
        (!term || String(o.number).includes(term) || o.customer.name.toLowerCase().includes(term)),
    )
  }, [orders, status, channel, q])

  const month = summarize(ordersInRange(orders, daysAgo(29)))
  const selectedOrder = orders.find((o) => o.id === selected) ?? null

  return (
    <>
      <PageHeader
        title="Vendas"
        subtitle="Pedidos do site (finalizados no WhatsApp) e vendas de balcão"
        actions={
          <Link to="/admin/pdv">
            <Button variant="primary" icon={ScanBarcode}>
              Nova venda balcão
            </Button>
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Aguardando Pix" value={counts.aguardando ?? 0} hint="confirme pelo comprovante" />
        <Stat label="Pagos p/ separar" value={counts.pago ?? 0} tone="blue" hint="entregar ou liberar retirada" />
        <Stat label="Faturamento 30 dias" value={brl(month.revenue)} tone="green" hint={`${month.count} vendas`} />
        <Stat label="Ticket médio 30 dias" value={brl(month.ticket)} tone="violet" hint={`margem ${pct(month.margin)}`} />
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-white/5 p-4 lg:flex-row lg:items-center">
          <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
            {(['todos', 'aguardando', 'pago', 'entregue', 'cancelado'] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatus(s)
                  setLimit(PAGE)
                }}
                className={cx(
                  'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition',
                  status === s ? 'bg-white/10 text-white' : 'text-stone-400 hover:text-stone-100',
                )}
              >
                {s === 'todos' ? 'Todos' : STATUS[s].label} <span className="ml-1 text-stone-500">{counts[s] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2 lg:ml-auto">
            <Select value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)} className="!h-9 w-36 text-xs">
              <option value="todos">Todos canais</option>
              <option value="site">Site</option>
              <option value="balcao">Balcão</option>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-500" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nº ou cliente" className="!h-9 w-44 pl-9 text-xs" />
            </div>
          </div>
        </div>

        {list.length === 0 ? (
          <Empty icon={Receipt} title="Nenhuma venda encontrada" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className={th}>Pedido</th>
                  <th className={th}>Data</th>
                  <th className={th}>Cliente</th>
                  <th className={th}>Canal</th>
                  <th className={cx(th, 'text-right')}>Itens</th>
                  <th className={cx(th, 'text-right')}>Total</th>
                  <th className={cx(th, 'text-right')}>Margem</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {list.slice(0, limit).map((o) => {
                  const net = orderNet(o)
                  const m = net ? (net - orderCost(o)) / net : 0
                  return (
                    <tr key={o.id} onClick={() => setSelected(o.id)} className={cx('cursor-pointer hover:bg-white/[0.03]', o.status === 'aguardando' && 'bg-amber-500/[0.04]')}>
                      <td className={cx(td, 'font-medium text-stone-100')}>#{o.number}</td>
                      <td className={td}>{fmtDateTime(o.date)}</td>
                      <td className={cx(td, 'max-w-48 truncate')}>{o.customer.name}</td>
                      <td className={td}>
                        <Badge tone={o.channel === 'site' ? 'violet' : 'neutral'}>{o.channel === 'site' ? 'Site' : 'Balcão'}</Badge>
                        <span className="ml-2 text-xs text-stone-500">{PAY[o.payment]}</span>
                      </td>
                      <td className={cx(td, 'text-right tabular-nums')}>{o.items.reduce((s, it) => s + it.qty, 0)}</td>
                      <td className={cx(td, 'text-right font-medium tabular-nums text-stone-100')}>{brl(o.total)}</td>
                      <td className={cx(td, 'text-right tabular-nums', m < 0.35 ? 'text-amber-300' : 'text-emerald-300')}>{pct(m)}</td>
                      <td className={td}>
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {list.length > limit && (
          <div className="border-t border-white/5 p-3 text-center">
            <Button variant="ghost" size="sm" onClick={() => setLimit((l) => l + PAGE)}>
              Carregar mais ({list.length - limit} restantes)
            </Button>
          </div>
        )}
      </Card>

      <OrderDrawer order={selectedOrder} onClose={() => setSelected(null)} />
    </>
  )
}
