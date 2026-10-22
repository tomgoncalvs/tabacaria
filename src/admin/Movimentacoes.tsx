import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, Empty, Input, PageHeader, Segmented, Select, Stat, cx, td, th } from '../components/ui'
import { brl, daysAgo, fmtDateTime, num } from '../lib/format'
import { useStore } from '../lib/store'
import type { MovementType } from '../lib/types'
import { MOVE, MovementModal } from './shared'

const PAGE = 60

export default function Movimentacoes() {
  const movements = useStore((s) => s.movements)
  const products = useStore((s) => s.products)
  const [days, setDays] = useState(30)
  const [type, setType] = useState<MovementType | 'todos'>('todos')
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const [modal, setModal] = useState<'entrada' | 'saida' | null>(null)

  const pmap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  const inPeriod = useMemo(() => {
    const from = daysAgo(days - 1).toISOString()
    return movements.filter((m) => m.date >= from)
  }, [movements, days])

  const kpi = useMemo(() => {
    const sum = (t: MovementType) => inPeriod.filter((m) => m.type === t)
    const val = (arr: typeof inPeriod) => arr.reduce((s, m) => s + Math.abs(m.qty) * m.unitCost, 0)
    const units = (arr: typeof inPeriod) => arr.reduce((s, m) => s + Math.abs(m.qty), 0)
    const e = sum('entrada')
    const v = sum('venda')
    const s = sum('saida')
    const a = sum('ajuste')
    return {
      entradaUn: units(e),
      entradaVal: val(e),
      vendaUn: units(v),
      vendaVal: val(v),
      perdaUn: units(s) + a.filter((m) => m.qty < 0).reduce((x, m) => x - m.qty, 0),
      perdaVal: val(s) + val(a.filter((m) => m.qty < 0)),
    }
  }, [inPeriod])

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return inPeriod.filter((m) => (type === 'todos' || m.type === type) && (!t || (pmap.get(m.productId)?.name.toLowerCase().includes(t) ?? false) || (m.ref ?? '').toLowerCase().includes(t)))
  }, [inPeriod, type, q, pmap])

  return (
    <>
      <PageHeader
        title="Entradas e saídas"
        subtitle="Histórico completo do que entrou e saiu do estoque"
        actions={
          <>
            <Button variant="secondary" icon={ArrowUpFromLine} onClick={() => setModal('saida')}>
              Registrar saída
            </Button>
            <Button variant="success" icon={ArrowDownToLine} onClick={() => setModal('entrada')}>
              Registrar entrada
            </Button>
          </>
        }
      />

      <div className="mb-4 flex justify-end">
        <Segmented
          value={days}
          onChange={(d) => {
            setDays(d)
            setLimit(PAGE)
          }}
          options={[
            { value: 7, label: '7 dias' },
            { value: 30, label: '30 dias' },
            { value: 90, label: '90 dias' },
          ]}
        />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Entradas (compras)" value={`${num(kpi.entradaUn)} un`} icon={ArrowDownToLine} tone="green" hint={`${brl(kpi.entradaVal)} em mercadoria`} />
        <Stat label="Saídas por venda" value={`${num(kpi.vendaUn)} un`} icon={ArrowUpFromLine} tone="blue" hint={`${brl(kpi.vendaVal)} de custo (CMV)`} />
        <Stat label="Perdas e ajustes" value={`${num(kpi.perdaUn)} un`} icon={ArrowLeftRight} tone="red" hint={`${brl(kpi.perdaVal)} de prejuízo`} />
      </div>

      <Card>
        <div className="flex flex-col gap-2 border-b border-white/5 p-4 sm:flex-row">
          <Select value={type} onChange={(e) => setType(e.target.value as MovementType | 'todos')} className="!h-9 text-xs sm:w-48">
            <option value="todos">Todos os tipos</option>
            {(Object.keys(MOVE) as MovementType[]).map((t) => (
              <option key={t} value={t}>
                {MOVE[t].label}
              </option>
            ))}
          </Select>
          <div className="relative sm:ml-auto sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-500" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Produto ou nº do pedido" className="!h-9 pl-9 text-xs" />
          </div>
        </div>
        {list.length === 0 ? (
          <Empty icon={ArrowLeftRight} title="Nenhuma movimentação no período" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className={th}>Data</th>
                  <th className={th}>Tipo</th>
                  <th className={th}>Produto</th>
                  <th className={cx(th, 'text-right')}>Qtd</th>
                  <th className={cx(th, 'text-right')}>Custo un.</th>
                  <th className={cx(th, 'text-right')}>Total</th>
                  <th className={th}>Origem / obs.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {list.slice(0, limit).map((m) => (
                  <tr key={m.id} className="hover:bg-white/[0.03]">
                    <td className={td}>{fmtDateTime(m.date)}</td>
                    <td className={td}>
                      <Badge tone={MOVE[m.type].tone}>{MOVE[m.type].label}</Badge>
                    </td>
                    <td className={cx(td, 'max-w-64 truncate text-stone-100')}>{pmap.get(m.productId)?.name ?? '—'}</td>
                    <td className={cx(td, 'text-right font-medium tabular-nums', m.qty > 0 ? 'text-emerald-300' : 'text-rose-300')}>
                      {m.qty > 0 ? '+' : ''}
                      {m.qty}
                    </td>
                    <td className={cx(td, 'text-right tabular-nums')}>{brl(m.unitCost)}</td>
                    <td className={cx(td, 'text-right tabular-nums')}>{brl(Math.abs(m.qty) * m.unitCost)}</td>
                    <td className={cx(td, 'max-w-64 truncate text-xs text-stone-500')}>{[m.ref && `Pedido ${m.ref}`.replace('Pedido BAL', 'Balanço BAL'), m.supplier, m.note].filter(Boolean).join(' · ')}</td>
                  </tr>
                ))}
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

      <MovementModal key={modal ?? 'none'} open={!!modal} type={modal ?? 'entrada'} onClose={() => setModal(null)} />
    </>
  )
}
