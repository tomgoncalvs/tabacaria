import { BadgePercent, PackageX, TriangleAlert, Trophy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ProductArt } from '../components/ProductArt'
import { Badge, Card, CardHeader, Empty, PageHeader, Segmented, Stat, cx, td, th } from '../components/ui'
import { CATEGORY_MAP } from '../lib/categories'
import { brl, daysAgo, pct } from '../lib/format'
import { byCategory, ordersInRange, productMargin, productRanking, soldLastDays, summarize } from '../lib/metrics'
import { useStore } from '../lib/store'
import { chartTheme } from './shared'

type SortKey = 'revenue' | 'qty' | 'profit' | 'margin'

export default function Relatorios() {
  const orders = useStore((s) => s.orders)
  const products = useStore((s) => s.products)
  const target = useStore((s) => s.settings.targetMargin)
  const [days, setDays] = useState(30)
  const [sort, setSort] = useState<SortKey>('revenue')

  const { ranking, cats, s } = useMemo(() => {
    const cur = ordersInRange(orders, daysAgo(days - 1))
    const ranking = productRanking(cur, products)
    return { ranking, cats: byCategory(ranking), s: summarize(cur) }
  }, [orders, products, days])

  const sorted = useMemo(() => [...ranking].sort((a, b) => b[sort] - a[sort]), [ranking, sort])
  const pmap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  const lowMargin = products.filter((p) => p.active && productMargin(p) < target).sort((a, b) => productMargin(a) - productMargin(b))
  const sold30 = useMemo(() => soldLastDays(orders, 30), [orders])
  const stale = products.filter((p) => p.active && p.stock > 0 && !sold30.get(p.id))
  const abcCount = { A: 0, B: 0, C: 0 }
  ranking.forEach((r) => abcCount[r.abc]++)

  return (
    <>
      <PageHeader
        title="Margem e ranking"
        subtitle="Quem vende mais, quem dá mais lucro e onde a margem está apertada"
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

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Margem bruta realizada" value={pct(s.margin)} icon={BadgePercent} tone="violet" hint={`meta ${pct(target, 0)}`} />
        <Stat label="Lucro bruto" value={brl(s.profit)} tone="green" hint={`sobre ${brl(s.revenue)}`} />
        <Stat label="Curva A" value={`${abcCount.A} produtos`} icon={Trophy} hint="= 80% do faturamento" />
        <Stat label="Abaixo da meta de margem" value={lowMargin.length} icon={TriangleAlert} tone="red" hint="produtos no preço de tabela" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Ranking de produtos"
            subtitle="Classificação ABC por faturamento"
            action={
              <Segmented
                value={sort}
                onChange={setSort}
                options={[
                  { value: 'revenue', label: 'Receita' },
                  { value: 'qty', label: 'Qtd' },
                  { value: 'profit', label: 'Lucro' },
                  { value: 'margin', label: 'Margem' },
                ]}
              />
            }
          />
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-zinc-900">
                <tr className="border-y border-white/5">
                  <th className={th}>#</th>
                  <th className={th}>Produto</th>
                  <th className={cx(th, 'text-right')}>Qtd</th>
                  <th className={cx(th, 'text-right')}>Receita</th>
                  <th className={cx(th, 'text-right')}>Lucro</th>
                  <th className={cx(th, 'text-right')}>Margem</th>
                  <th className={cx(th, 'text-center')}>ABC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {sorted.map((r, i) => {
                  const p = pmap.get(r.productId)
                  return (
                    <tr key={r.productId} className="hover:bg-white/[0.03]">
                      <td className={cx(td, 'text-stone-500')}>{i + 1}</td>
                      <td className={td}>
                        <div className="flex items-center gap-3">
                          {p && <ProductArt product={p} className="size-8 shrink-0 rounded-lg" iconSize="size-4" />}
                          <div className="min-w-0">
                            <p className="max-w-56 truncate text-stone-100">{r.name}</p>
                            <p className="text-xs text-stone-500">
                              {CATEGORY_MAP[r.category].name} · {pct(r.share)} do total
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={cx(td, 'text-right tabular-nums')}>{r.qty}</td>
                      <td className={cx(td, 'text-right tabular-nums text-stone-100')}>{brl(r.revenue)}</td>
                      <td className={cx(td, 'text-right tabular-nums text-emerald-300')}>{brl(r.profit)}</td>
                      <td className={cx(td, 'text-right')}>
                        <Badge tone={r.margin >= target ? 'green' : r.margin >= target - 0.1 ? 'amber' : 'red'}>{pct(r.margin)}</Badge>
                      </td>
                      <td className={cx(td, 'text-center')}>
                        <Badge tone={r.abc === 'A' ? 'amber' : r.abc === 'B' ? 'blue' : 'neutral'}>{r.abc}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Margem por categoria" />
            <div className="h-64 px-2 pb-3">
              <ResponsiveContainer>
                <BarChart data={cats} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid stroke={chartTheme.grid} horizontal={false} />
                  <XAxis type="number" tick={chartTheme.axis} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v * 100)}%`} domain={[0, 0.7]} />
                  <YAxis type="category" dataKey="name" tick={chartTheme.axis} axisLine={false} tickLine={false} width={104} />
                  <Tooltip {...chartTheme.tooltip} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: number) => pct(v)} />
                  <Bar dataKey="margin" name="Margem" radius={[0, 6, 6, 0]}>
                    {cats.map((c) => (
                      <Cell key={c.id} fill={c.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHeader title="Margem abaixo da meta" subtitle="Revise preço ou negocie custo" />
            <div className="max-h-56 space-y-2 overflow-y-auto px-5 pb-5">
              {lowMargin.length === 0 ? (
                <Empty icon={BadgePercent} title="Todos na meta" />
              ) : (
                lowMargin.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-stone-300">{p.name}</span>
                    <span className="shrink-0 text-xs text-stone-500">
                      {brl(p.cost)} → {brl(p.price)} <Badge tone="red">{pct(productMargin(p))}</Badge>
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Produtos parados" subtitle="Com estoque e sem venda há 30 dias" />
            <div className="max-h-56 space-y-2 overflow-y-auto px-5 pb-5">
              {stale.length === 0 ? (
                <Empty icon={PackageX} title="Nenhum produto parado" />
              ) : (
                stale.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-stone-300">{p.name}</span>
                    <span className="shrink-0 text-xs text-stone-500">
                      {p.stock} un · {brl(p.stock * p.cost)} parado
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
