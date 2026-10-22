import { ArrowLeft, ClipboardCheck, ClipboardList, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ProductArt } from '../components/ProductArt'
import { Badge, Button, Card, Empty, Input, PageHeader, Segmented, Select, Stat, cx, td, th, toast } from '../components/ui'
import { CATEGORIES } from '../lib/categories'
import { brl, fmtDateTime, pct } from '../lib/format'
import { useStore } from '../lib/store'
import type { CategoryId, StockCount } from '../lib/types'

function countStats(c: StockCount) {
  const counted = c.items.filter((i) => i.counted !== null)
  const diffs = counted.filter((i) => i.counted !== i.system)
  const value = diffs.reduce((s, i) => s + ((i.counted ?? 0) - i.system) * i.cost, 0)
  const units = diffs.reduce((s, i) => s + ((i.counted ?? 0) - i.system), 0)
  return {
    total: c.items.length,
    counted: counted.length,
    diffs: diffs.length,
    units,
    value,
    accuracy: counted.length ? (counted.length - diffs.length) / counted.length : 1,
  }
}

export default function Balanco() {
  const counts = useStore((s) => s.counts)
  const startCount = useStore((s) => s.startCount)
  const [viewing, setViewing] = useState<string | null>(null)
  const open = counts.find((c) => c.status === 'aberto')
  const current = counts.find((c) => c.id === viewing)

  if (current) return <CountView count={current} onBack={() => setViewing(null)} />

  return (
    <>
      <PageHeader
        title="Balanço de estoque"
        subtitle="Conte o físico, compare com o sistema e ajuste as diferenças"
        actions={
          <Button variant="primary" icon={ClipboardList} onClick={() => setViewing(startCount())}>
            {open ? 'Continuar balanço aberto' : 'Iniciar novo balanço'}
          </Button>
        }
      />
      <Card>
        {counts.length === 0 ? (
          <Empty icon={ClipboardCheck} title="Nenhum balanço ainda" text="Faça o primeiro para conferir o estoque físico." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className={th}>Balanço</th>
                  <th className={th}>Iniciado</th>
                  <th className={th}>Status</th>
                  <th className={cx(th, 'text-right')}>Contados</th>
                  <th className={cx(th, 'text-right')}>Divergências</th>
                  <th className={cx(th, 'text-right')}>Diferença (R$)</th>
                  <th className={cx(th, 'text-right')}>Acurácia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {counts.map((c) => {
                  const s = countStats(c)
                  return (
                    <tr key={c.id} onClick={() => setViewing(c.id)} className="cursor-pointer hover:bg-white/[0.03]">
                      <td className={cx(td, 'font-medium text-stone-100')}>
                        {c.id} {c.note && <span className="ml-1 text-xs font-normal text-stone-500">{c.note}</span>}
                      </td>
                      <td className={td}>{fmtDateTime(c.date)}</td>
                      <td className={td}>{c.status === 'aberto' ? <Badge tone="amber">Em andamento</Badge> : <Badge tone="green">Finalizado</Badge>}</td>
                      <td className={cx(td, 'text-right tabular-nums')}>
                        {s.counted}/{s.total}
                      </td>
                      <td className={cx(td, 'text-right tabular-nums')}>{s.diffs}</td>
                      <td className={cx(td, 'text-right tabular-nums', s.value < 0 ? 'text-rose-300' : s.value > 0 ? 'text-emerald-300' : '')}>{brl(s.value)}</td>
                      <td className={cx(td, 'text-right tabular-nums')}>{pct(s.accuracy)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}

function CountView({ count, onBack }: { count: StockCount; onBack: () => void }) {
  const products = useStore((s) => s.products)
  const { setCounted, finishCount, discardCount } = useStore()
  const [cat, setCat] = useState<CategoryId | 'todos'>('todos')
  const [show, setShow] = useState<'todos' | 'pendentes' | 'divergentes'>('todos')
  const [q, setQ] = useState('')
  const editable = count.status === 'aberto'
  const pmap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  const s = countStats(count)

  const rows = count.items.filter((it) => {
    const p = pmap.get(it.productId)
    if (!p) return false
    if (cat !== 'todos' && p.category !== cat) return false
    if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false
    if (show === 'pendentes') return it.counted === null
    if (show === 'divergentes') return it.counted !== null && it.counted !== it.system
    return true
  })

  const finish = () => {
    const pending = s.total - s.counted
    const msg = `Finalizar ${count.id}? ${s.diffs} divergência(s) serão ajustadas no estoque (${brl(s.value)}).${pending ? ` ${pending} item(ns) não contado(s) manterão o saldo do sistema.` : ''}`
    if (!confirm(msg)) return
    finishCount(count.id)
    toast('Balanço finalizado e estoque ajustado')
  }

  return (
    <>
      <button onClick={onBack} className="mb-3 flex items-center gap-1 text-sm text-stone-400 hover:text-white">
        <ArrowLeft className="size-4" /> Balanços
      </button>
      <PageHeader
        title={`${count.id} · ${editable ? 'contagem em andamento' : 'finalizado'}`}
        subtitle={`Iniciado em ${fmtDateTime(count.date)} · saldo do sistema congelado no início`}
        actions={
          editable && (
            <>
              <Button
                variant="danger"
                icon={Trash2}
                onClick={() => {
                  if (confirm('Descartar este balanço? Nada será ajustado.')) {
                    discardCount(count.id)
                    onBack()
                  }
                }}
              >
                Descartar
              </Button>
              <Button variant="primary" icon={ClipboardCheck} onClick={finish}>
                Finalizar e ajustar estoque
              </Button>
            </>
          )
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Progresso" value={`${s.counted}/${s.total}`} hint={pct(s.counted / (s.total || 1), 0)} />
        <Stat label="Divergências" value={s.diffs} tone="red" hint={`${s.units > 0 ? '+' : ''}${s.units} unidades`} />
        <Stat label="Impacto financeiro" value={brl(s.value)} tone={s.value < 0 ? 'red' : 'green'} hint="a preço de custo" />
        <Stat label="Acurácia" value={pct(s.accuracy)} tone="violet" hint="itens sem diferença" />
      </div>

      <Card>
        <div className="flex flex-col gap-2 border-b border-white/5 p-4 lg:flex-row lg:items-center">
          <Segmented
            value={show}
            onChange={setShow}
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'pendentes', label: `Pendentes (${s.total - s.counted})` },
              { value: 'divergentes', label: `Divergentes (${s.diffs})` },
            ]}
          />
          <div className="flex gap-2 lg:ml-auto">
            <Select value={cat} onChange={(e) => setCat(e.target.value as CategoryId | 'todos')} className="!h-9 w-44 text-xs">
              <option value="todos">Todas categorias</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-500" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Produto" className="!h-9 w-44 pl-9 text-xs" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className={th}>Produto</th>
                <th className={cx(th, 'text-right')}>Sistema</th>
                <th className={cx(th, 'text-center')}>Contado</th>
                <th className={cx(th, 'text-right')}>Diferença</th>
                <th className={cx(th, 'text-right')}>Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {rows.map((it) => {
                const p = pmap.get(it.productId)!
                const diff = it.counted === null ? null : it.counted - it.system
                return (
                  <tr key={it.productId} className={cx(diff ? 'bg-rose-500/[0.03]' : '')}>
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <ProductArt product={p} className="size-9 shrink-0 rounded-lg" iconSize="size-4" />
                        <div>
                          <p className="text-stone-100">{p.name}</p>
                          <p className="text-xs text-stone-500">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className={cx(td, 'text-right tabular-nums')}>{it.system}</td>
                    <td className={cx(td, 'text-center')}>
                      {editable ? (
                        <input
                          type="number"
                          min={0}
                          value={it.counted ?? ''}
                          placeholder="—"
                          onChange={(e) => setCounted(count.id, it.productId, e.target.value === '' ? null : Math.max(0, Number(e.target.value)))}
                          className="h-9 w-20 rounded-lg border border-white/10 bg-zinc-950/60 text-center text-sm tabular-nums outline-none focus:border-amber-500/60"
                        />
                      ) : (
                        <span className="tabular-nums">{it.counted}</span>
                      )}
                    </td>
                    <td className={cx(td, 'text-right font-medium tabular-nums', diff ? (diff < 0 ? 'text-rose-300' : 'text-emerald-300') : 'text-stone-500')}>
                      {diff === null ? '—' : diff > 0 ? `+${diff}` : diff}
                    </td>
                    <td className={cx(td, 'text-right tabular-nums')}>{diff ? brl(diff * it.cost) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
