import { ArrowDownCircle, ArrowUpCircle, Plus, Scale, Trash2, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge, Button, Card, CardHeader, Field, Input, Modal, PageHeader, Select, Stat, cx, td, th, toast } from '../components/ui'
import { brl, fmtDate, fmtMonth, monthKey, pct } from '../lib/format'
import { isRevenue, orderCost } from '../lib/metrics'
import { useStore } from '../lib/store'
import type { ExpenseCategory, PayMethod } from '../lib/types'
import { PAY, chartTheme } from './shared'

const EXP_CAT: Record<ExpenseCategory, string> = {
  aluguel: 'Aluguel',
  pessoal: 'Pessoal',
  contas: 'Contas de consumo',
  marketing: 'Marketing',
  outros: 'Outros',
}

export default function Financeiro() {
  const orders = useStore((s) => s.orders)
  const movements = useStore((s) => s.movements)
  const expenses = useStore((s) => s.expenses)
  const removeExpense = useStore((s) => s.removeExpense)
  const [adding, setAdding] = useState(false)

  const months = useMemo(() => {
    const set = new Set(orders.map((o) => monthKey(o.date)))
    return [...set].sort().reverse()
  }, [orders])
  const [month, setMonth] = useState(months[0])

  const byMonth = useMemo(() => {
    const map = new Map<string, { receita: number; cmv: number; frete: number; desconto: number; compras: number; despesas: number; byPay: Record<PayMethod, number>; byExp: Record<string, number> }>()
    const get = (k: string) => {
      let r = map.get(k)
      if (!r) {
        r = { receita: 0, cmv: 0, frete: 0, desconto: 0, compras: 0, despesas: 0, byPay: { pix: 0, cartao: 0, dinheiro: 0 }, byExp: {} }
        map.set(k, r)
      }
      return r
    }
    for (const o of orders) {
      if (!isRevenue(o)) continue
      const r = get(monthKey(o.date))
      r.receita += o.subtotal
      r.desconto += o.discount
      r.frete += o.deliveryFee
      r.cmv += orderCost(o)
      r.byPay[o.payment] += o.total
    }
    for (const m of movements) if (m.type === 'entrada') get(monthKey(m.date)).compras += m.qty * m.unitCost
    for (const e of expenses) {
      const r = get(monthKey(e.date))
      r.despesas += e.amount
      r.byExp[e.category] = (r.byExp[e.category] ?? 0) + e.amount
    }
    return map
  }, [orders, movements, expenses])

  const cur = byMonth.get(month)
  const entradas = cur ? cur.receita - cur.desconto + cur.frete : 0
  const saidas = cur ? cur.compras + cur.despesas : 0
  const liquida = cur ? cur.receita - cur.desconto : 0
  const lucroBruto = cur ? liquida - cur.cmv : 0
  const resultado = cur ? lucroBruto + cur.frete - cur.despesas : 0

  const chart = [...months]
    .reverse()
    .map((k) => {
      const r = byMonth.get(k)!
      return { mes: fmtMonth(k).split(' ')[0].slice(0, 3), Entradas: Math.round(r.receita - r.desconto + r.frete), Saídas: Math.round(r.compras + r.despesas) }
    })

  const ledger = useMemo(() => {
    const rows: { date: string; desc: string; tag: string; tone: 'green' | 'red' | 'amber'; value: number; expenseId?: string }[] = []
    const days = new Map<string, { total: number; n: number }>()
    for (const o of orders) {
      if (!isRevenue(o) || monthKey(o.date) !== month) continue
      const k = o.date.slice(0, 10)
      const d = days.get(k) ?? { total: 0, n: 0 }
      d.total += o.total
      d.n += 1
      days.set(k, d)
    }
    days.forEach((d, k) => rows.push({ date: `${k}T23:59:00`, desc: `Vendas do dia (${d.n} pedidos)`, tag: 'Vendas', tone: 'green', value: d.total }))
    const buys = new Map<string, number>()
    for (const m of movements) {
      if (m.type !== 'entrada' || monthKey(m.date) !== month) continue
      const k = `${m.date.slice(0, 10)}|${m.supplier ?? 'Fornecedor'}`
      buys.set(k, (buys.get(k) ?? 0) + m.qty * m.unitCost)
    }
    buys.forEach((v, k) => {
      const [d, sup] = k.split('|')
      rows.push({ date: `${d}T12:00:00`, desc: `Compra de mercadoria · ${sup}`, tag: 'Compras', tone: 'amber', value: -v })
    })
    for (const e of expenses) if (monthKey(e.date) === month) rows.push({ date: e.date, desc: e.description, tag: EXP_CAT[e.category], tone: 'red', value: -e.amount, expenseId: e.id })
    return rows.sort((a, b) => b.date.localeCompare(a.date))
  }, [orders, movements, expenses, month])

  return (
    <>
      <PageHeader
        title="Financeiro"
        subtitle="Fluxo de caixa e resultado (DRE simplificada) do mês"
        actions={
          <>
            <Select value={month} onChange={(e) => setMonth(e.target.value)} className="w-48">
              {months.map((m) => (
                <option key={m} value={m}>
                  {fmtMonth(m)}
                </option>
              ))}
            </Select>
            <Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>
              Nova despesa
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Entradas" value={brl(entradas)} icon={ArrowDownCircle} tone="green" hint="vendas recebidas + frete" />
        <Stat label="Saídas" value={brl(saidas)} icon={ArrowUpCircle} tone="red" hint="compras + despesas" />
        <Stat label="Saldo de caixa" value={brl(entradas - saidas)} icon={Wallet} tone={entradas - saidas >= 0 ? 'blue' : 'red'} hint="entradas − saídas" />
        <Stat label="Resultado do mês" value={brl(resultado)} icon={Scale} tone="violet" hint={`margem líquida ${pct(liquida ? resultado / liquida : 0)}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader title="DRE simplificada" subtitle={fmtMonth(month)} />
          {cur && (
            <div className="space-y-1 px-5 pb-5 text-sm">
              <DreRow label="Receita bruta de vendas" value={cur.receita} />
              <DreRow label="(−) Descontos" value={-cur.desconto} muted />
              <DreRow label="(=) Receita líquida" value={liquida} strong />
              <DreRow label="(−) Custo das mercadorias vendidas" value={-cur.cmv} muted />
              <DreRow label="(=) Lucro bruto" value={lucroBruto} strong extra={pct(liquida ? lucroBruto / liquida : 0)} />
              <DreRow label="(+) Taxas de entrega" value={cur.frete} muted />
              {(Object.keys(EXP_CAT) as ExpenseCategory[]).map((k) => (cur.byExp[k] ? <DreRow key={k} label={`(−) ${EXP_CAT[k]}`} value={-cur.byExp[k]} muted /> : null))}
              <div className="my-2 border-t border-white/10" />
              <DreRow label="(=) Resultado operacional" value={resultado} strong highlight extra={pct(liquida ? resultado / liquida : 0)} />
              <p className="pt-3 text-[11px] text-stone-500">Não considera impostos e taxas de cartão — entram quando o backend for integrado ao fiscal.</p>
            </div>
          )}
        </Card>

        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardHeader title="Entradas x saídas por mês" />
            <div className="h-56 px-2 pb-4">
              <ResponsiveContainer>
                <BarChart data={chart} margin={{ left: 0, right: 12 }}>
                  <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                  <XAxis dataKey="mes" tick={chartTheme.axis} axisLine={false} tickLine={false} />
                  <YAxis tick={chartTheme.axis} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip {...chartTheme.tooltip} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: number) => brl(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Entradas" fill="#34d399" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Saídas" fill="#fb7185" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          {cur && (
            <Card className="p-5">
              <p className="mb-3 text-sm font-semibold">Recebimentos por forma de pagamento</p>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(PAY) as PayMethod[]).map((k) => (
                  <div key={k} className="rounded-xl bg-white/[0.03] p-3">
                    <p className="text-xs text-stone-500">{PAY[k]}</p>
                    <p className="mt-1 font-semibold tabular-nums">{brl(cur.byPay[k])}</p>
                    <p className="text-[11px] text-stone-500">{pct(cur.byPay[k] / (entradas || 1), 0)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader title="Lançamentos" subtitle="Vendas agrupadas por dia, compras por fornecedor e despesas" />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-y border-white/5">
                <th className={th}>Data</th>
                <th className={th}>Descrição</th>
                <th className={th}>Categoria</th>
                <th className={cx(th, 'text-right')}>Valor</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {ledger.map((r, i) => (
                <tr key={i} className="hover:bg-white/[0.03]">
                  <td className={td}>{fmtDate(r.date)}</td>
                  <td className={cx(td, 'text-stone-100')}>{r.desc}</td>
                  <td className={td}>
                    <Badge tone={r.tone}>{r.tag}</Badge>
                  </td>
                  <td className={cx(td, 'text-right font-medium tabular-nums', r.value >= 0 ? 'text-emerald-300' : 'text-rose-300')}>{brl(r.value)}</td>
                  <td className={td}>
                    {r.expenseId && (
                      <button
                        className="text-stone-500 hover:text-rose-400"
                        aria-label="Excluir despesa"
                        onClick={() => {
                          if (confirm('Excluir esta despesa?')) removeExpense(r.expenseId!)
                        }}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {adding && <ExpenseModal onClose={() => setAdding(false)} />}
    </>
  )
}

function DreRow({ label, value, strong, muted, highlight, extra }: { label: string; value: number; strong?: boolean; muted?: boolean; highlight?: boolean; extra?: string }) {
  return (
    <div className={cx('flex items-baseline justify-between gap-3 py-0.5', strong && 'font-semibold text-stone-100', muted && 'text-stone-400', highlight && 'text-base')}>
      <span>{label}</span>
      <span className={cx('tabular-nums', highlight && (value >= 0 ? 'text-emerald-300' : 'text-rose-300'))}>
        {brl(value)}
        {extra && <span className="ml-2 text-xs font-normal text-stone-500">{extra}</span>}
      </span>
    </div>
  )
}

function ExpenseModal({ onClose }: { onClose: () => void }) {
  const addExpense = useStore((s) => s.addExpense)
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('outros')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const v = Number(amount.replace(',', '.'))
  const valid = desc.trim() && v > 0
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Nova despesa"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            disabled={!valid}
            onClick={() => {
              addExpense({ description: desc.trim(), amount: v, category, date: new Date(`${date}T12:00:00`).toISOString() })
              toast('Despesa lançada')
              onClose()
            }}
          >
            Lançar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Descrição">
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex.: Conta de água" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor (R$)">
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Data">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Categoria">
          <Select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
            {(Object.keys(EXP_CAT) as ExpenseCategory[]).map((k) => (
              <option key={k} value={k}>
                {EXP_CAT[k]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  )
}

