import { QrCode, RotateCcw, Save } from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { Button, Card, CardHeader, Field, Input, PageHeader, toast } from '../components/ui'
import { pixPayload } from '../lib/pix'
import { useStore } from '../lib/store'
import type { Settings } from '../lib/types'

export default function Config() {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const resetDemo = useStore((s) => s.resetDemo)
  const [f, setF] = useState<Settings>(settings)
  const [qr, setQr] = useState('')
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setF((x) => ({ ...x, [k]: v }))

  useEffect(() => setF(settings), [settings])
  useEffect(() => {
    QRCode.toDataURL(pixPayload({ key: f.pixKey, name: f.pixName, city: f.pixCity, amount: 1, txid: 'TESTE' }), { margin: 1, width: 280 }).then(setQr)
  }, [f.pixKey, f.pixName, f.pixCity])

  const save = () => {
    updateSettings({ ...f, deliveryFee: Number(f.deliveryFee) || 0, freeDeliveryFrom: Number(f.freeDeliveryFrom) || 0, targetMargin: Number(f.targetMargin) || 0 })
    toast('Configurações salvas')
  }

  return (
    <>
      <PageHeader
        title="Configurações"
        subtitle="Dados da loja, WhatsApp de pedidos e chave Pix"
        actions={
          <Button variant="primary" icon={Save} onClick={save}>
            Salvar
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Loja" />
          <div className="grid gap-4 px-5 pb-5">
            <Field label="Nome da loja">
              <Input value={f.storeName} onChange={(e) => set('storeName', e.target.value)} />
            </Field>
            <Field label="Slogan">
              <Input value={f.tagline} onChange={(e) => set('tagline', e.target.value)} />
            </Field>
            <Field label="Endereço">
              <Input value={f.address} onChange={(e) => set('address', e.target.value)} />
            </Field>
            <Field label="Horário de funcionamento">
              <Input value={f.hours} onChange={(e) => set('hours', e.target.value)} />
            </Field>
            <Field label="WhatsApp que recebe os pedidos" hint="Com DDI e DDD, só números. Ex.: 5511999999999">
              <Input value={f.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} inputMode="tel" />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="Pix" subtitle="Usado para gerar o QR Code e o copia e cola de cada pedido" />
          <div className="grid gap-4 px-5 pb-5 sm:grid-cols-[1fr_140px]">
            <div className="grid gap-4">
              <Field label="Chave Pix" hint="CPF/CNPJ, e-mail, telefone (+55…) ou chave aleatória">
                <Input value={f.pixKey} onChange={(e) => set('pixKey', e.target.value)} />
              </Field>
              <Field label="Nome do recebedor">
                <Input value={f.pixName} onChange={(e) => set('pixName', e.target.value)} />
              </Field>
              <Field label="Cidade">
                <Input value={f.pixCity} onChange={(e) => set('pixCity', e.target.value)} />
              </Field>
            </div>
            <div className="text-center">
              <div className="rounded-xl bg-white p-2">{qr ? <img src={qr} alt="QR de teste" /> : <QrCode className="size-full text-stone-400" />}</div>
              <p className="mt-2 text-[11px] text-stone-500">QR de teste (R$ 1,00) — escaneie no app do banco para validar a chave.</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Entrega e margem" />
          <div className="grid gap-4 px-5 pb-5 sm:grid-cols-3">
            <Field label="Taxa de entrega (R$)">
              <Input type="number" step="0.5" value={f.deliveryFee} onChange={(e) => set('deliveryFee', Number(e.target.value))} />
            </Field>
            <Field label="Frete grátis a partir de (R$)">
              <Input type="number" value={f.freeDeliveryFrom} onChange={(e) => set('freeDeliveryFrom', Number(e.target.value))} />
            </Field>
            <Field label="Meta de margem (%)">
              <Input type="number" value={Math.round(f.targetMargin * 100)} onChange={(e) => set('targetMargin', Number(e.target.value) / 100)} />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="Dados de demonstração" subtitle="Esta versão roda só no navegador, sem servidor" />
          <div className="px-5 pb-5">
            <p className="text-sm text-stone-400">
              Pedidos, produtos e movimentações ficam salvos neste navegador. Restaurar gera novamente 90 dias de operação fictícia e apaga o que foi feito
              aqui.
            </p>
            <Button
              variant="danger"
              icon={RotateCcw}
              className="mt-4"
              onClick={() => {
                if (confirm('Restaurar os dados de demonstração? Tudo que foi feito será perdido.')) {
                  resetDemo()
                  toast('Dados de demonstração restaurados')
                }
              }}
            >
              Restaurar dados de demonstração
            </Button>
          </div>
        </Card>
      </div>
    </>
  )
}
