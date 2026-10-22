import { brl, onlyDigits } from './format'
import type { Order, Settings } from './types'

export const waLink = (phone: string, text?: string) =>
  `https://wa.me/${onlyDigits(phone)}${text ? `?text=${encodeURIComponent(text)}` : ''}`

export function orderMessage(order: Order, settings: Settings) {
  const lines = [
    `*Novo pedido #${order.number}* — ${settings.storeName}`,
    '',
    `*Cliente:* ${order.customer.name}`,
    `*WhatsApp:* ${order.customer.phone}`,
    order.delivery === 'entrega' ? `*Entrega em:* ${order.address}` : '*Retirada na loja*',
    '',
    '*Itens:*',
    ...order.items.map((it) => `• ${it.qty}x ${it.name} — ${brl(it.qty * it.price)}`),
    '',
    `Subtotal: ${brl(order.subtotal)}`,
  ]
  if (order.delivery === 'entrega') lines.push(`Entrega: ${order.deliveryFee ? brl(order.deliveryFee) : 'Grátis'}`)
  lines.push(`*Total: ${brl(order.total)}*`, '', '💸 Pagamento via *Pix* realizado.')
  if (order.notes) lines.push(`Obs.: ${order.notes}`)
  lines.push('', '📎 Segue a foto do comprovante:')
  return lines.join('\n')
}
