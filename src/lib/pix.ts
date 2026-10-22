// Gera o "Pix Copia e Cola" (BR Code estático) seguindo o padrão EMV do Banco Central.

const tlv = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`

const clean = (s: string, max: number) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .toUpperCase()
    .trim()
    .slice(0, max)

function crc16(payload: string) {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function pixPayload(opts: {
  key: string
  name: string
  city: string
  amount: number
  txid: string
}) {
  const account = tlv('00', 'br.gov.bcb.pix') + tlv('01', opts.key.trim())
  const txid = opts.txid.replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***'
  const payload =
    tlv('00', '01') +
    tlv('26', account) +
    tlv('52', '0000') +
    tlv('53', '986') +
    tlv('54', opts.amount.toFixed(2)) +
    tlv('58', 'BR') +
    tlv('59', clean(opts.name, 25)) +
    tlv('60', clean(opts.city, 15)) +
    tlv('62', tlv('05', txid)) +
    '6304'
  return payload + crc16(payload)
}
