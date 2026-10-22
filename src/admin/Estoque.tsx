import { ArrowDownToLine, ArrowUpFromLine, Boxes, PackageX, Search, TriangleAlert, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ProductArt } from '../components/ProductArt'
import { Badge, Button, Card, Empty, Input, PageHeader, Segmented, Stat, cx, td, th } from '../components/ui'
import { brl, num } from '../lib/format'
import { soldLastDays } from '../lib/metrics'
import { useStore } from '../lib/store'
import { MovementModal } from './shared'

type Filter = 'todos' | 'baixo' | 'zerado'

export default function Estoque() {
  const products = useStore((s) => s.products)
  const orders = useStore((s) => s.orders)
  const [filter, setFilter] = useState<Filter>('todos')
  const [q, setQ] = useState('')
  const [move, setMove] = useState<{ type: 'entrada' | 'saida'; productId?: string } | null>(null)

  const sold30 = useMemo(() => soldLastDays(orders, 30), [orders])
  const active = useMemo(() => products.filter((p) => p.active), [products])
  const totals = useMemo(
    () => ({
      units: active.reduce((s, p) => s + p.stock, 0),
      cost: active.reduce((s, p) => s + p.stock * p.cost, 0),
      sale: active.reduce((s, p) => s + p.stock * p.price, 0),
      low: active.filter((p) => p.stock > 0 && p.stock <= p.minStock).length,
      zero: active.filter((p) => p.stock <= 0).length,
    }),
    [active],
  )

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase()
    return active
      .filter((p) => (filter === 'todos' ? true : filter === 'zerado' ? p.stock <= 0 : p.stock <= p.minStock) && (!t || `${p.name} ${p.sku}`.toLowerCase().includes(t)))
      .map((p) => {
        const sold = sold30.get(p.id) ?? 0
        const perDay = sold / 30
        return { p, sold, cover: perDay ? p.stock / perDay : Infinity, suggest: Math.max(0, Math.ceil(perDay * 21) - p.stock) }
      })
      .sort((a, b) => a.cover - b.cover)
  }, [active, filter, q, sold30])

  return (
    <>
      <PageHeader
        title="Estoque"
        subtitle="Posição atual, cobertura em dias e sugestão de compra"
        actions={
          <>
            <Button variant="secondary" icon={ArrowUpFromLine} onClick={() => setMove({ type: 'saida' })}>
              Saída
            </Button>
            <Button variant="success" icon={ArrowDownToLine} onClick={() => setMove({ type: 'entrada' })}>
              Entrada
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Unidades em estoque" value={num(totals.units)} icon={Boxes} hint={`${active.length} produtos ativos`} />
        <Stat label="Valor em custo" value={brl(totals.cost)} icon={Wallet} tone="blue" hint="capital parado" />
        <Stat label="Valor de venda" value={brl(totals.sale)} tone="green" hint={`lucro potencial ${brl(totals.sale - totals.cost)}`} />
        <Stat label="Repor" value={`${totals.low + totals.zero}`} icon={TriangleAlert} tone="red" hint={`${totals.zero} zerados · ${totals.low} baixos`} />
      </div>

      <Card>
        <div className="flex flex-col gap-2 border-b border-white/5 p-4 sm:flex-row sm:items-center">
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'baixo', label: `Abaixo do mínimo (${totals.low + totals.zero})` },
              { value: 'zerado', label: `Zerados (${totals.zero})` },
            ]}
          />
          <div className="relative sm:ml-auto sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-500" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto" className="!h-9 pl-9 text-xs" />
          </div>
        </div>
        {rows.length === 0 ? (
          <Empty icon={PackageX} title="Nada por aqui" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className={th}>Produto</th>
                  <th className={th}>Nível</th>
                  <th className={cx(th, 'text-right')}>Vendidos 30d</th>
                  <th className={cx(th, 'text-right')}>Cobertura</th>
                  <th className={cx(th, 'text-right')}>Valor custo</th>
                  <th className={cx(th, 'text-right')}>Sugestão compra</th>
                  <th className={th}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {rows.map(({ p, sold, cover, suggest }) => {
                  const ratio = Math.min(1, p.stock / (p.minStock * 3 || 1))
                  const tone = p.stock <= 0 ? 'bg-rose-500' : p.stock <= p.minStock ? 'bg-amber-500' : 'bg-emerald-500'
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.03]">
                      <td className={td}>
                        <div className="flex items-center gap-3">
                          <ProductArt product={p} className="size-9 shrink-0 rounded-lg" iconSize="size-4" />
                          <div>
                            <p className="font-medium text-stone-100">{p.name}</p>
                            <p className="text-xs text-stone-500">{p.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className={td}>
                        <div className="flex items-center gap-3">
                          <span className="w-16 text-sm tabular-nums">
                            <b className="text-stone-100">{p.stock}</b> <span className="text-xs text-stone-500">/ {p.minStock}</span>
                          </span>
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5">
                            <div className={cx('h-full rounded-full', tone)} style={{ width: `${Math.max(4, ratio * 100)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className={cx(td, 'text-right tabular-nums')}>{sold}</td>
                      <td className={cx(td, 'text-right')}>
                        {cover === Infinity ? (
                          <span className="text-xs text-stone-500">sem giro</span>
                        ) : (
                          <Badge tone={cover < 7 ? 'red' : cover < 15 ? 'amber' : 'green'}>{Math.floor(cover)} dias</Badge>
                        )}
                      </td>
                      <td className={cx(td, 'text-right tabular-nums')}>{brl(p.stock * p.cost)}</td>
                      <td className={cx(td, 'text-right tabular-nums')}>{suggest > 0 ? <span className="text-amber-300">{suggest} un</span> : <span className="text-stone-600">—</span>}</td>
                      <td className={td}>
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" icon={ArrowDownToLine} onClick={() => setMove({ type: 'entrada', productId: p.id })} title="Entrada" />
                          <Button size="sm" variant="ghost" icon={ArrowUpFromLine} onClick={() => setMove({ type: 'saida', productId: p.id })} title="Saída" disabled={p.stock <= 0} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-white/5 px-4 py-3 text-[11px] text-stone-500">Cobertura = quantos dias o estoque atual dura no ritmo de vendas dos últimos 30 dias. Sugestão de compra cobre 21 dias.</p>
      </Card>

      <MovementModal key={`${move?.type}-${move?.productId}`} open={!!move} type={move?.type ?? 'entrada'} productId={move?.productId} onClose={() => setMove(null)} />
    </>
  )
}
