import { ArrowDownToLine, ArrowUpFromLine, Ban, Check, CircleCheck, Truck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ProductArt } from '../components/ProductArt'
import { Badge, Button, Drawer, Field, Input, Modal, Select, Textarea, cx, toast } from '../components/ui'
import { brl, fmtDateTime, fmtPhone, pct } from '../lib/format'
import { orderCost, orderNet } from '../lib/metrics'
import { useStore } from '../lib/store'
import type { MovementType, Order, OrderStatus, PayMethod } from '../lib/types'
import { waLink } from '../lib/whatsapp'
import { WhatsIcon } from '../shop/WhatsIcon'

export const STATUS: Record<OrderStatus, { label: string; tone: 'amber' | 'blue' | 'green' | 'red' }> = {
  aguardando: { label: 'Aguardando Pix', tone: 'amber' },
  pago: { label: 'Pago · separar', tone: 'blue' },
  entregue: { label: 'Concluído', tone: 'green' },
  cancelado: { label: 'Cancelado', tone: 'red' },
}

export const PAY: Record<PayMethod, string> = { pix: 'Pix', dinheiro: 'Dinheiro', cartao: 'Cartão' }

export const MOVE: Record<MovementType, { label: string; tone: 'green' | 'red' | 'blue' | 'violet' | 'amber' }> = {
  entrada: { label: 'Entrada', tone: 'green' },
  saida: { label: 'Saída', tone: 'red' },
  venda: { label: 'Venda', tone: 'blue' },
  ajuste: { label: 'Ajuste balanço', tone: 'violet' },
  estorno: { label: 'Estorno', tone: 'amber' },
}

export const StatusBadge = ({ status }: { status: OrderStatus }) => <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>

export const chartTheme = {
  grid: 'rgba(255,255,255,0.05)',
  axis: { fill: '#78716c', fontSize: 11 },
  tooltip: {
    contentStyle: { background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 },
    labelStyle: { color: '#d6d3d1' },
    itemStyle: { color: '#e7e5e4' },
  },
}

export function OrderDrawer({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const { confirmOrder, deliverOrder, cancelOrder } = useStore()
  const products = useStore((s) => s.products)
  if (!order) return null
  const cost = orderCost(order)
  const net = orderNet(order)
  const shortage = order.status === 'aguardando' ? order.items.filter((it) => (products.find((p) => p.id === it.productId)?.stock ?? 0) < it.qty) : []

  const act = (fn: (id: string) => void, msg: string) => {
    fn(order.id)
    toast(msg)
  }

  return (
    <Drawer
      open
      onClose={onClose}
      width="max-w-lg"
      title={
        <span className="flex items-center gap-3">
          Pedido #{order.number} <StatusBadge status={order.status} />
        </span>
      }
      footer={
        <div className="flex flex-wrap gap-2">
          {order.status === 'aguardando' && (
            <Button variant="success" icon={CircleCheck} className="flex-1" onClick={() => act(confirmOrder, `Pagamento do #${order.number} confirmado · estoque baixado`)}>
              Confirmar pagamento
            </Button>
          )}
          {order.status === 'pago' && (
            <Button variant="primary" icon={Truck} className="flex-1" onClick={() => act(deliverOrder, `Pedido #${order.number} concluído`)}>
              {order.delivery === 'entrega' ? 'Marcar como entregue' : 'Marcar como retirado'}
            </Button>
          )}
          {order.status !== 'cancelado' && (
            <Button
              variant="danger"
              icon={Ban}
              onClick={() => {
                if (confirm(`Cancelar o pedido #${order.number}?${order.status !== 'aguardando' ? ' Os itens voltarão para o estoque.' : ''}`)) act(cancelOrder, `Pedido #${order.number} cancelado`)
              }}
            >
              Cancelar
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        {order.status === 'aguardando' && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200">
            Confira o comprovante recebido no WhatsApp antes de confirmar. Ao confirmar, os itens saem do estoque.
            {shortage.length > 0 && <p className="mt-1 font-medium text-rose-300">Atenção: estoque insuficiente para {shortage.map((s) => s.name).join(', ')}.</p>}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Cliente" value={order.customer.name} />
          <Info label="Data" value={fmtDateTime(order.date)} />
          <Info label="Canal" value={order.channel === 'site' ? 'Site + WhatsApp' : 'Balcão'} />
          <Info label="Pagamento" value={PAY[order.payment]} />
          <Info label="Recebimento" value={order.delivery === 'entrega' ? 'Entrega' : 'Retirada'} />
          {order.paidAt && <Info label="Pago em" value={fmtDateTime(order.paidAt)} />}
          {order.address && <Info label="Endereço" value={order.address} className="col-span-2" />}
          {order.notes && <Info label="Observações" value={order.notes} className="col-span-2" />}
        </div>
        {order.customer.phone && (
          <a href={waLink(order.customer.phone, `Olá ${order.customer.name.split(' ')[0]}! Sobre o seu pedido #${order.number}…`)} target="_blank" rel="noreferrer">
            <Button variant="whatsapp" size="sm" className="w-full">
              <WhatsIcon /> Conversar com o cliente · {fmtPhone(order.customer.phone)}
            </Button>
          </a>
        )}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-500">Itens</p>
          <div className="divide-y divide-white/5 rounded-xl border border-white/5">
            {order.items.map((it) => {
              const p = products.find((x) => x.id === it.productId)
              return (
                <div key={it.productId} className="flex items-center gap-3 p-3">
                  {p && <ProductArt product={p} className="size-10 shrink-0 rounded-lg" iconSize="size-4" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-stone-100">{it.name}</p>
                    <p className="text-xs text-stone-500">
                      {it.qty} × {brl(it.price)} · custo {brl(it.cost)}
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">{brl(it.qty * it.price)}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="space-y-1.5 rounded-xl bg-white/[0.03] p-4 text-sm">
          <Row label="Subtotal" value={brl(order.subtotal)} />
          {order.discount > 0 && <Row label="Desconto" value={`− ${brl(order.discount)}`} />}
          {order.deliveryFee > 0 && <Row label="Entrega" value={brl(order.deliveryFee)} />}
          <Row label="Total" value={brl(order.total)} strong />
          <div className="my-2 border-t border-white/5" />
          <Row label="Custo da mercadoria" value={brl(cost)} />
          <Row label="Lucro bruto" value={`${brl(net - cost)} · ${pct(net ? (net - cost) / net : 0)}`} accent />
        </div>
      </div>
    </Drawer>
  )
}

const Info = ({ label, value, className }: { label: string; value: string; className?: string }) => (
  <div className={className}>
    <p className="text-[11px] text-stone-500">{label}</p>
    <p className="text-stone-200">{value}</p>
  </div>
)

const Row = ({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: boolean }) => (
  <div className={cx('flex justify-between', strong ? 'text-base font-semibold text-stone-50' : 'text-stone-400', accent && 'text-emerald-300')}>
    <span>{label}</span>
    <span className="tabular-nums">{value}</span>
  </div>
)

const SAIDA_MOTIVOS = ['Avaria / produto danificado', 'Vencido', 'Uso interno / degustação', 'Brinde', 'Devolução ao fornecedor', 'Furto / extravio']

export function MovementModal({ open, onClose, type, productId }: { open: boolean; onClose: () => void; type: 'entrada' | 'saida'; productId?: string }) {
  if (!open) return null
  return <MovementForm {...{ onClose, type, productId }} />
}

function MovementForm({ onClose, type, productId }: { onClose: () => void; type: 'entrada' | 'saida'; productId?: string }) {
  const products = useStore((s) => s.products)
  const addMovement = useStore((s) => s.addMovement)
  const sorted = useMemo(() => products.filter((p) => p.active).sort((a, b) => a.name.localeCompare(b.name)), [products])
  const [pid, setPid] = useState(productId ?? sorted[0]?.id ?? '')
  const p = products.find((x) => x.id === pid)
  const [qty, setQty] = useState('')
  const [cost, setCost] = useState(p ? String(p.cost) : '')
  const [supplier, setSupplier] = useState('')
  const [note, setNote] = useState(type === 'saida' ? SAIDA_MOTIVOS[0] : '')

  const q = Number(qty)
  const c = Number(cost.replace(',', '.'))
  const valid = p && q > 0 && (type === 'saida' ? q <= p.stock : c >= 0)
  const newAvg = p && type === 'entrada' && q > 0 ? (Math.max(p.stock, 0) * p.cost + q * c) / (Math.max(p.stock, 0) + q) : null

  const save = () => {
    if (!valid || !p) return
    addMovement({ productId: p.id, type, qty: q, unitCost: type === 'entrada' ? c : undefined, supplier: supplier || undefined, note: note || undefined })
    toast(`${type === 'entrada' ? 'Entrada' : 'Saída'} de ${q} un. registrada`)
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          {type === 'entrada' ? <ArrowDownToLine className="size-5 text-emerald-400" /> : <ArrowUpFromLine className="size-5 text-rose-400" />}
          {type === 'entrada' ? 'Registrar entrada (compra)' : 'Registrar saída avulsa'}
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant={type === 'entrada' ? 'success' : 'primary'} icon={Check} disabled={!valid} onClick={save}>
            Registrar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Produto">
          <Select
            value={pid}
            onChange={(e) => {
              setPid(e.target.value)
              const np = products.find((x) => x.id === e.target.value)
              if (np) setCost(String(np.cost))
            }}
          >
            {sorted.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} — {x.stock} em estoque
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantidade" hint={p && type === 'saida' ? `Disponível: ${p.stock}` : undefined}>
            <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" autoFocus />
          </Field>
          {type === 'entrada' ? (
            <Field label="Custo unitário (R$)" hint={p ? `Custo médio atual: ${brl(p.cost)}` : undefined}>
              <Input type="number" step="0.01" min={0} value={cost} onChange={(e) => setCost(e.target.value)} />
            </Field>
          ) : (
            <Field label="Motivo">
              <Select value={note} onChange={(e) => setNote(e.target.value)}>
                {SAIDA_MOTIVOS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </Select>
            </Field>
          )}
        </div>
        {type === 'entrada' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fornecedor">
                <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Ex.: Distribuidora Nuvem" />
              </Field>
              <Field label="Nota fiscal / obs.">
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="NF 12345" />
              </Field>
            </div>
            {p && q > 0 && newAvg !== null && (
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-white/[0.03] p-3 text-center text-xs">
                <div>
                  <p className="text-stone-500">Total da compra</p>
                  <p className="mt-0.5 font-semibold text-stone-100">{brl(q * c)}</p>
                </div>
                <div>
                  <p className="text-stone-500">Novo custo médio</p>
                  <p className={cx('mt-0.5 font-semibold', newAvg > p.cost ? 'text-rose-300' : 'text-emerald-300')}>{brl(newAvg)}</p>
                </div>
                <div>
                  <p className="text-stone-500">Nova margem</p>
                  <p className="mt-0.5 font-semibold text-stone-100">{pct((p.price - newAvg) / p.price)}</p>
                </div>
              </div>
            )}
          </>
        )}
        {type === 'saida' && p && q > 0 && (
          <p className="rounded-xl bg-rose-500/5 p-3 text-xs text-rose-200">
            Impacto: {brl(q * p.cost)} em custo de mercadoria baixado do estoque.
          </p>
        )}
        {type === 'saida' && <Textarea placeholder="Detalhes (opcional)" rows={2} onChange={(e) => setNote(`${note.split(' — ')[0]}${e.target.value ? ` — ${e.target.value}` : ''}`)} />}
      </div>
    </Modal>
  )
}
