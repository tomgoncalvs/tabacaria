import { Check, CircleCheck, Copy, MapPin, QrCode, Store } from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useMemo, useState } from 'react'
import { Button, Field, Input, Modal, Textarea, cx } from '../components/ui'
import { brl, onlyDigits, round2 } from '../lib/format'
import { pixPayload } from '../lib/pix'
import { useCart, useStore } from '../lib/store'
import type { Order } from '../lib/types'
import { orderMessage, waLink } from '../lib/whatsapp'
import { useCartDetails } from './CartDrawer'
import { WhatsIcon } from './WhatsIcon'

type Step = 'dados' | 'pix' | 'enviado'

const STEPS: { id: Step; label: string }[] = [
  { id: 'dados', label: 'Seus dados' },
  { id: 'pix', label: 'Pagamento Pix' },
  { id: 'enviado', label: 'Comprovante' },
]

export function CheckoutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useStore((s) => s.settings)
  const nextOrder = useStore((s) => s.nextOrder)
  const placeOrder = useStore((s) => s.placeOrder)
  const clearCart = useCart((s) => s.clear)
  const { items, subtotal } = useCartDetails()

  const [step, setStep] = useState<Step>('dados')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [delivery, setDelivery] = useState<'retirada' | 'entrega'>('entrega')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [touched, setTouched] = useState(false)
  const [placed, setPlaced] = useState<Order | null>(null)
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)

  const deliveryFee = delivery === 'entrega' && subtotal < settings.freeDeliveryFrom ? settings.deliveryFee : 0
  const total = round2(subtotal + deliveryFee)
  const orderNumber = placed?.number ?? nextOrder

  const payload = useMemo(
    () => pixPayload({ key: settings.pixKey, name: settings.pixName, city: settings.pixCity, amount: placed?.total ?? total, txid: `PED${orderNumber}` }),
    [settings, total, orderNumber, placed],
  )

  useEffect(() => {
    if (step !== 'pix') return
    QRCode.toDataURL(payload, { margin: 1, width: 440, color: { dark: '#0c0a09', light: '#ffffff' } }).then(setQr)
  }, [payload, step])

  const reset = () => {
    setStep('dados')
    setPlaced(null)
    setTouched(false)
    setCopied(false)
  }
  const close = () => {
    if (step === 'enviado') reset()
    onClose()
  }

  const errors = {
    name: name.trim().length < 3,
    phone: onlyDigits(phone).length < 10,
    address: delivery === 'entrega' && address.trim().length < 8,
  }
  const valid = !errors.name && !errors.phone && !errors.address

  const goPix = () => {
    setTouched(true)
    if (valid) setStep('pix')
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payload)
    } catch {
      /* sem permissão de clipboard: o campo continua selecionável */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendWhatsapp = () => {
    const digits = onlyDigits(phone)
    const order = placeOrder({
      customer: { name: name.trim(), phone: digits.length <= 11 ? `55${digits}` : digits },
      delivery,
      address: delivery === 'entrega' ? address.trim() : undefined,
      notes: notes.trim() || undefined,
      items: items.map(({ line, product }) => ({ productId: product.id, name: product.name, qty: line.qty, price: product.price, cost: product.cost })),
      subtotal: round2(subtotal),
      deliveryFee,
      discount: 0,
      total,
    })
    setPlaced(order)
    clearCart()
    window.open(waLink(settings.whatsapp, orderMessage(order, settings)), '_blank')
    setStep('enviado')
  }

  const stepIdx = STEPS.findIndex((s) => s.id === step)

  return (
    <Modal open={open} onClose={close} size="lg" title={`Pedido #${orderNumber}`}>
      {/* steps */}
      <ol className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <li key={s.id} className="flex flex-1 items-center gap-2">
            <span
              className={cx(
                'grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold',
                i < stepIdx ? 'bg-emerald-500 text-emerald-950' : i === stepIdx ? 'bg-amber-500 text-stone-950' : 'bg-white/10 text-stone-400',
              )}
            >
              {i < stepIdx ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={cx('hidden text-xs sm:block', i === stepIdx ? 'text-stone-100' : 'text-stone-500')}>{s.label}</span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-white/10" />}
          </li>
        ))}
      </ol>

      {step === 'dados' && (
        <div className="grid gap-6 md:grid-cols-[1fr_220px]">
          <div className="space-y-4">
            <Field label="Nome completo">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como podemos te chamar?" className={cx(touched && errors.name && 'border-rose-500/60')} />
            </Field>
            <Field label="WhatsApp" hint="Usaremos para confirmar seu pedido.">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 98888-7777" inputMode="tel" className={cx(touched && errors.phone && 'border-rose-500/60')} />
            </Field>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-stone-400">Como prefere receber?</span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['entrega', MapPin, 'Entrega', subtotal >= settings.freeDeliveryFrom ? 'Grátis' : brl(settings.deliveryFee)],
                    ['retirada', Store, 'Retirar na loja', 'Sem custo'],
                  ] as const
                ).map(([id, Icon, label, sub]) => (
                  <button
                    key={id}
                    onClick={() => setDelivery(id)}
                    className={cx(
                      'flex items-center gap-3 rounded-xl border p-3 text-left transition',
                      delivery === id ? 'border-amber-500/60 bg-amber-500/10' : 'border-white/10 hover:border-white/20',
                    )}
                  >
                    <Icon className={cx('size-5', delivery === id ? 'text-amber-400' : 'text-stone-500')} />
                    <span>
                      <span className="block text-sm font-medium text-stone-100">{label}</span>
                      <span className="block text-xs text-stone-500">{sub}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {delivery === 'entrega' ? (
              <Field label="Endereço de entrega">
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, complemento e bairro" className={cx(touched && errors.address && 'border-rose-500/60')} />
              </Field>
            ) : (
              <p className="rounded-xl bg-white/5 p-3 text-xs text-stone-400">
                <b className="text-stone-200">Retirada:</b> {settings.address}
                <br />
                {settings.hours}
              </p>
            )}
            <Field label="Observações (opcional)">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: sabor alternativo se faltar, ponto de referência…" rows={2} />
            </Field>
            {touched && !valid && <p className="text-xs text-rose-400">Preencha nome, WhatsApp{delivery === 'entrega' ? ' e endereço' : ''} para continuar.</p>}
          </div>
          <Summary items={items.map((x) => ({ name: x.product.name, qty: x.line.qty, price: x.product.price }))} subtotal={subtotal} deliveryFee={deliveryFee} delivery={delivery} total={total}>
            <Button variant="primary" size="lg" className="w-full" icon={QrCode} onClick={goPix} disabled={!items.length}>
              Pagar com Pix
            </Button>
          </Summary>
        </div>
      )}

      {step === 'pix' && (
        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <div className="text-center">
            <div className="mx-auto aspect-square w-full max-w-[240px] overflow-hidden rounded-2xl bg-white p-3">
              {qr && <img src={qr} alt="QR Code Pix" className="size-full" />}
            </div>
            <p className="mt-3 text-xs text-stone-500">Valor a pagar</p>
            <p className="text-3xl font-semibold text-amber-400">{brl(total)}</p>
          </div>
          <div className="space-y-4">
            <div>
              <span className="mb-1.5 block text-xs font-medium text-stone-400">Pix copia e cola</span>
              <div className="flex gap-2">
                <Input readOnly value={payload} onFocus={(e) => e.target.select()} className="font-mono text-xs" />
                <Button variant={copied ? 'success' : 'secondary'} icon={copied ? Check : Copy} onClick={copy}>
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
              <p className="mt-1.5 text-[11px] text-stone-500">
                Recebedor: {settings.pixName} · Chave: {settings.pixKey}
              </p>
            </div>
            <ol className="space-y-2.5 rounded-2xl bg-white/[0.03] p-4 text-sm text-stone-300">
              {[
                'Abra o app do seu banco e pague o Pix (QR Code ou copia e cola).',
                'Salve ou tire um print do comprovante.',
                'Toque no botão abaixo: o pedido vai pronto para o nosso WhatsApp.',
                'Anexe a foto do comprovante na conversa e pronto!',
              ].map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-amber-500/15 text-[11px] font-semibold text-amber-300">{i + 1}</span>
                  {t}
                </li>
              ))}
            </ol>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button variant="ghost" onClick={() => setStep('dados')}>
                Voltar
              </Button>
              <Button variant="whatsapp" size="lg" className="flex-1" onClick={sendWhatsapp}>
                <WhatsIcon className="size-5" /> Já paguei, enviar pedido
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 'enviado' && placed && (
        <div className="py-4 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
            <CircleCheck className="size-8" />
          </span>
          <h3 className="mt-4 text-xl font-semibold text-stone-50">Pedido #{placed.number} enviado!</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-stone-400">
            Agora é só <b className="text-stone-200">anexar a foto do comprovante</b> na conversa do WhatsApp. Assim que confirmarmos o pagamento,
            seu pedido será separado {placed.delivery === 'entrega' ? 'e sairá para entrega' : 'para retirada'}.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <a href={waLink(settings.whatsapp, orderMessage(placed, settings))} target="_blank" rel="noreferrer">
              <Button variant="whatsapp" className="w-full">
                <WhatsIcon /> Abrir WhatsApp novamente
              </Button>
            </a>
            <Button variant="secondary" onClick={close}>
              Voltar à loja
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function Summary({
  items,
  subtotal,
  deliveryFee,
  delivery,
  total,
  children,
}: {
  items: { name: string; qty: number; price: number }[]
  subtotal: number
  deliveryFee: number
  delivery: string
  total: number
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col rounded-2xl bg-white/[0.03] p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-stone-500">Resumo</p>
      <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-xs">
        {items.map((it) => (
          <li key={it.name} className="flex justify-between gap-2">
            <span className="text-stone-300">
              {it.qty}× {it.name}
            </span>
            <span className="text-stone-400 tabular-nums">{brl(it.qty * it.price)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-1 border-t border-white/5 pt-3 text-xs">
        <div className="flex justify-between text-stone-400">
          <span>Subtotal</span>
          <span>{brl(subtotal)}</span>
        </div>
        {delivery === 'entrega' && (
          <div className="flex justify-between text-stone-400">
            <span>Entrega</span>
            <span>{deliveryFee ? brl(deliveryFee) : 'Grátis'}</span>
          </div>
        )}
        <div className="flex justify-between pt-1 text-base font-semibold text-stone-50">
          <span>Total</span>
          <span>{brl(total)}</span>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  )
}
