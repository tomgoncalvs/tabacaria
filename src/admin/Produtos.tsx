import { Package, Pencil, Plus, Search, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ProductArt } from '../components/ProductArt'
import { Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Select, Textarea, cx, td, th, toast } from '../components/ui'
import { CATEGORIES, CATEGORY_MAP } from '../lib/categories'
import { brl, pct, round2 } from '../lib/format'
import { productMargin, productMarkup } from '../lib/metrics'
import { useStore } from '../lib/store'
import type { CategoryId, Product } from '../lib/types'

export default function Produtos() {
  const products = useStore((s) => s.products)
  const target = useStore((s) => s.settings.targetMargin)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<CategoryId | 'todos'>('todos')
  const [editing, setEditing] = useState<Product | 'new' | null>(null)

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return products
      .filter((p) => (cat === 'todos' || p.category === cat) && (!t || `${p.name} ${p.sku} ${p.brand}`.toLowerCase().includes(t)))
      .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name))
  }, [products, q, cat])

  const avgMargin = useMemo(() => {
    const act = products.filter((p) => p.active)
    return act.reduce((s, p) => s + productMargin(p), 0) / (act.length || 1)
  }, [products])

  return (
    <>
      <PageHeader
        title="Produtos"
        subtitle={`${products.filter((p) => p.active).length} ativos · margem média de tabela ${pct(avgMargin)} · meta ${pct(target, 0)}`}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing('new')}>
            Novo produto
          </Button>
        }
      />
      <Card>
        <div className="flex flex-col gap-2 border-b border-white/5 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-500" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, marca ou SKU" className="pl-9" />
          </div>
          <Select value={cat} onChange={(e) => setCat(e.target.value as CategoryId | 'todos')} className="sm:w-56">
            <option value="todos">Todas as categorias</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        {list.length === 0 ? (
          <Empty icon={Package} title="Nenhum produto" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className={th}>Produto</th>
                  <th className={th}>Categoria</th>
                  <th className={cx(th, 'text-right')}>Custo médio</th>
                  <th className={cx(th, 'text-right')}>Preço</th>
                  <th className={cx(th, 'text-right')}>Lucro un.</th>
                  <th className={cx(th, 'text-right')}>Margem</th>
                  <th className={cx(th, 'text-right')}>Markup</th>
                  <th className={cx(th, 'text-right')}>Estoque</th>
                  <th className={th}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {list.map((p) => {
                  const m = productMargin(p)
                  return (
                    <tr key={p.id} className={cx('hover:bg-white/[0.03]', !p.active && 'opacity-50')}>
                      <td className={td}>
                        <div className="flex items-center gap-3">
                          <ProductArt product={p} className="size-10 shrink-0 rounded-lg" iconSize="size-4" />
                          <div>
                            <p className="font-medium text-stone-100">{p.name}</p>
                            <p className="text-xs text-stone-500">
                              {p.sku} · {p.brand} {!p.active && '· inativo'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={td}>{CATEGORY_MAP[p.category].name}</td>
                      <td className={cx(td, 'text-right tabular-nums')}>{brl(p.cost)}</td>
                      <td className={cx(td, 'text-right font-medium tabular-nums text-stone-100')}>{brl(p.price)}</td>
                      <td className={cx(td, 'text-right tabular-nums')}>{brl(p.price - p.cost)}</td>
                      <td className={cx(td, 'text-right')}>
                        <Badge tone={m >= target ? 'green' : m >= target - 0.1 ? 'amber' : 'red'}>{pct(m)}</Badge>
                      </td>
                      <td className={cx(td, 'text-right tabular-nums')}>{productMarkup(p).toFixed(2).replace('.', ',')}×</td>
                      <td className={cx(td, 'text-right tabular-nums', p.stock <= p.minStock && 'text-rose-300')}>{p.stock}</td>
                      <td className={td}>
                        <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing(p)}>
                          Editar
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {editing && <ProductForm product={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function ProductForm({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const saveProduct = useStore((s) => s.saveProduct)
  const target = useStore((s) => s.settings.targetMargin)
  const [f, setF] = useState({
    name: product?.name ?? '',
    brand: product?.brand ?? '',
    sku: product?.sku ?? '',
    category: product?.category ?? ('essencias' as CategoryId),
    description: product?.description ?? '',
    cost: String(product?.cost ?? ''),
    price: String(product?.price ?? ''),
    minStock: String(product?.minStock ?? 5),
    initialStock: '',
    active: product?.active ?? true,
    featured: product?.featured ?? false,
    image: product?.image ?? '',
  })
  const [targetPct, setTargetPct] = useState(String(Math.round(target * 100)))
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))

  const cost = Number(f.cost.replace(',', '.')) || 0
  const price = Number(f.price.replace(',', '.')) || 0
  const margin = price ? (price - cost) / price : 0
  const valid = f.name.trim().length > 2 && price > 0

  const suggest = () => {
    const m = Number(targetPct) / 100
    if (!(m > 0 && m < 1 && cost > 0)) return
    // preço "psicológico" terminado em ,90 que ainda atinge a margem desejada
    const raw = cost / (1 - m)
    const charm = Math.ceil(raw) - 0.1
    set('price', String(round2(charm >= raw ? charm : Math.ceil(raw) + 0.9)))
  }

  const save = () => {
    saveProduct(
      {
        id: product?.id,
        name: f.name.trim(),
        brand: f.brand.trim(),
        sku: f.sku.trim() || `SKU-${Date.now().toString().slice(-5)}`,
        category: f.category,
        description: f.description.trim(),
        cost: round2(cost),
        price: round2(price),
        minStock: Number(f.minStock) || 0,
        active: f.active,
        featured: f.featured,
        image: f.image.trim() || undefined,
      },
      Number(f.initialStock) || 0,
    )
    toast(product ? 'Produto atualizado' : 'Produto cadastrado')
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={product ? 'Editar produto' : 'Novo produto'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" disabled={!valid} onClick={save}>
            Salvar
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" className="sm:col-span-2">
          <Input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex.: Essência Zomo Menta 50g" />
        </Field>
        <Field label="Marca">
          <Input value={f.brand} onChange={(e) => set('brand', e.target.value)} />
        </Field>
        <Field label="Código (SKU)">
          <Input value={f.sku} onChange={(e) => set('sku', e.target.value)} placeholder="Gerado se vazio" />
        </Field>
        <Field label="Categoria">
          <Select value={f.category} onChange={(e) => set('category', e.target.value as CategoryId)}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Estoque mínimo" hint="Abaixo disso o produto entra no alerta de reposição">
          <Input type="number" min={0} value={f.minStock} onChange={(e) => set('minStock', e.target.value)} />
        </Field>
        <Field label="Descrição" className="sm:col-span-2">
          <Textarea rows={2} value={f.description} onChange={(e) => set('description', e.target.value)} />
        </Field>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:col-span-2">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-stone-500">Preço e margem</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Custo (R$)" hint={product ? 'Custo médio, atualizado nas entradas' : undefined}>
              <Input type="number" step="0.01" min={0} value={f.cost} onChange={(e) => set('cost', e.target.value)} />
            </Field>
            <Field label="Preço de venda (R$)">
              <Input type="number" step="0.01" min={0} value={f.price} onChange={(e) => set('price', e.target.value)} />
            </Field>
            <Field label="Margem desejada (%)">
              <div className="flex gap-2">
                <Input type="number" value={targetPct} onChange={(e) => setTargetPct(e.target.value)} />
                <Button variant="secondary" icon={Sparkles} onClick={suggest} title="Sugerir preço" />
              </div>
            </Field>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Metric label="Lucro por unidade" value={brl(price - cost)} />
            <Metric label="Margem" value={pct(margin)} tone={margin >= target ? 'text-emerald-300' : margin >= target - 0.1 ? 'text-amber-300' : 'text-rose-300'} />
            <Metric label="Markup" value={`${cost ? (price / cost).toFixed(2).replace('.', ',') : '—'}×`} />
          </div>
        </div>

        {!product && (
          <Field label="Estoque inicial" hint="Gera uma entrada no estoque com o custo informado">
            <Input type="number" min={0} value={f.initialStock} onChange={(e) => set('initialStock', e.target.value)} placeholder="0" />
          </Field>
        )}
        <Field label="URL da foto (opcional)" className={product ? 'sm:col-span-2' : ''}>
          <Input value={f.image} onChange={(e) => set('image', e.target.value)} placeholder="https://…" />
        </Field>
        <div className="flex gap-6 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm text-stone-300">
            <input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} className="accent-amber-500" /> Ativo na loja
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-300">
            <input type="checkbox" checked={f.featured} onChange={(e) => set('featured', e.target.checked)} className="accent-amber-500" /> Destaque
          </label>
        </div>
      </div>
    </Modal>
  )
}

const Metric = ({ label, value, tone = 'text-stone-100' }: { label: string; value: string; tone?: string }) => (
  <div className="rounded-xl bg-zinc-950/50 p-2">
    <p className="text-[11px] text-stone-500">{label}</p>
    <p className={cx('mt-0.5 text-sm font-semibold', tone)}>{value}</p>
  </div>
)
