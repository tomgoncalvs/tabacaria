// Gera ~90 dias de operação fictícia e coerente (compras, vendas, balanço, despesas)
// para a demonstração parecer uma loja real. Tudo é determinístico (seed fixa),
// mas as datas são relativas ao dia em que a demo é aberta.
import { round2 } from './format'
import type {
  CategoryId,
  Expense,
  Movement,
  Order,
  OrderItem,
  Product,
  Settings,
  StockCount,
} from './types'

type CatalogEntry = [
  sku: string,
  name: string,
  brand: string,
  category: CategoryId,
  cost: number,
  price: number,
  minStock: number,
  popularity: number,
  description: string,
]

const CATALOG: CatalogEntry[] = [
  ['ESS-001', 'Essência Zomo Menta 50g', 'Zomo', 'essencias', 9.5, 18, 15, 10, 'Clássica menta refrescante, ideal para misturas.'],
  ['ESS-002', 'Essência Zomo Uva Ice 50g', 'Zomo', 'essencias', 9.5, 18, 15, 9, 'Uva com toque gelado. Uma das mais pedidas.'],
  ['ESS-003', 'Essência Ziggy Love 66 50g', 'Ziggy', 'essencias', 11, 22, 12, 8, 'Melancia, maracujá, melão e menta.'],
  ['ESS-004', 'Essência Adalya Lady Killer 50g', 'Adalya', 'essencias', 16, 32, 8, 5, 'Manga, melão, frutas vermelhas e menta.'],
  ['ESS-005', 'Essência Al Fakher Duas Maçãs 50g', 'Al Fakher', 'essencias', 14, 28, 8, 5, 'Maçã verde e vermelha com anis.'],
  ['ESS-006', 'Essência Sarada Blueberry 50g', 'Sarada', 'essencias', 8, 16, 10, 6, 'Mirtilo doce e encorpado.'],
  ['CAR-001', 'Carvão de Coco Cocoloco 1kg', 'Cocoloco', 'carvao', 22, 39, 12, 9, 'Carvão de coco prensado, queima longa e sem cheiro.'],
  ['CAR-002', 'Carvão Hookah King 1kg', 'Hookah King', 'carvao', 18, 34, 10, 6, 'Cubos 25mm, baixa cinza.'],
  ['CAR-003', 'Carvão Hexagonal 500g', 'Brasa', 'carvao', 12, 24, 8, 4, 'Formato hexagonal que acende rápido.'],
  ['NAR-001', 'Narguilé Zenith Mini', 'Zenith', 'narguiles', 140, 259, 3, 1.2, 'Compacto, ideal para levar. Acompanha mangueira.'],
  ['NAR-002', 'Narguilé Triton Médio', 'Triton', 'narguiles', 230, 429, 2, 0.8, 'Inox, vaso de vidro lapidado, 55cm.'],
  ['NAR-003', 'Narguilé Amor Grande', 'Amor', 'narguiles', 380, 699, 1, 0.35, 'Peça de 72cm em aço inox e vaso soprado.'],
  ['ACN-001', 'Rosh Cerâmica Vortex', 'Brasa', 'acessorios-narguile', 18, 39, 5, 2.5, 'Rosh vortex de cerâmica, melhor aproveitamento.'],
  ['ACN-002', 'Mangueira Silicone Lavável', 'Brasa', 'acessorios-narguile', 15, 35, 5, 2.5, 'Silicone atóxico com piteira de alumínio.'],
  ['ACN-003', 'Papel Alumínio Narguilé (rolo)', 'Brasa', 'acessorios-narguile', 5, 12, 12, 6, 'Rolo de alumínio grosso, 30cm.'],
  ['ACN-004', 'Pegador de Carvão Inox', 'Brasa', 'acessorios-narguile', 6, 15, 5, 2, 'Pinça de inox com ponta curva.'],
  ['SED-001', 'Seda Smoking Brown King Size', 'Smoking', 'sedas', 3.2, 7, 40, 10, 'Papel não branqueado, 33 folhas.'],
  ['SED-002', 'Seda Zomo Perfect Paper', 'Zomo', 'sedas', 2.5, 6, 40, 8, 'Seda ultrafina King Size Slim.'],
  ['SED-003', 'Seda Bem Bolado Brown', 'Bem Bolado', 'sedas', 3, 7.5, 40, 9, 'Papel orgânico com queima lenta.'],
  ['SED-004', 'Piteira de Vidro Reutilizável', 'Brasa', 'sedas', 8, 20, 8, 3, 'Vidro borossilicato, lavável.'],
  ['SED-005', 'Filtro Slim (pacote 120)', 'Smoking', 'sedas', 4, 10, 20, 6, 'Filtros de acetato 6mm.'],
  ['TAB-001', 'Tabaco p/ Enrolar Virginia 25g', 'Acrema', 'tabacos', 10, 19, 15, 5, 'Corte fino, sabor suave.'],
  ['TAB-002', 'Tabaco p/ Enrolar Burley 25g', 'Acrema', 'tabacos', 10, 19, 10, 3, 'Corte médio, sabor encorpado.'],
  ['TAB-003', 'Cigarro de Palha (maço c/ 20)', 'Paulistinha', 'tabacos', 7, 14, 15, 4, 'Palha de milho, fumo goiano.'],
  ['CHA-001', 'Charuto Dona Flor Petit Corona', 'Dona Flor', 'charutos', 18, 35, 6, 1.5, 'Charuto baiano, unidade.'],
  ['CHA-002', 'Cigarrilha Baunilha (cx 10)', 'Talvis', 'charutos', 22, 45, 5, 1.5, 'Cigarrilhas aromatizadas com ponteira.'],
  ['ISQ-001', 'Isqueiro BIC Maxi', 'BIC', 'isqueiros', 5, 10, 25, 7, 'O clássico, cores sortidas.'],
  ['ISQ-002', 'Isqueiro Zippo Classic', 'Zippo', 'isqueiros', 140, 279, 2, 0.4, 'Original, garantia vitalícia.'],
  ['ISQ-003', 'Isqueiro Maçarico Jet', 'Brasa', 'isqueiros', 25, 55, 5, 1.8, 'Chama turbo à prova de vento. Ótimo para carvão.'],
  ['ACE-001', 'Dichavador Metal 4 partes', 'Brasa', 'acessorios', 18, 45, 5, 2.5, 'Alumínio aeronáutico, 55mm.'],
  ['ACE-002', 'Bandeja Bolada Média', 'Bem Bolado', 'acessorios', 14, 35, 4, 1.8, 'Bandeja metálica estampada.'],
  ['ACE-003', 'Cinzeiro de Vidro', 'Brasa', 'acessorios', 10, 25, 4, 1.2, 'Vidro grosso, 12cm.'],
  ['ACE-004', 'Case Porta-Seda Couro', 'Brasa', 'acessorios', 12, 30, 4, 1, 'Organizador de seda, filtro e isqueiro.'],
]

const SUPPLIERS: Record<CategoryId, string> = {
  essencias: 'Distribuidora Nuvem',
  carvao: 'CocoBrasil Atacado',
  narguiles: 'Hookah Import',
  'acessorios-narguile': 'Hookah Import',
  sedas: 'Bolado Distribuição',
  tabacos: 'Fumo Sul Atacado',
  charutos: 'Charutaria Recôncavo',
  isqueiros: 'Bolado Distribuição',
  acessorios: 'Bolado Distribuição',
}

const FIRST = ['Lucas', 'Gabriel', 'Rafael', 'Bruna', 'Camila', 'Pedro', 'Mateus', 'Juliana', 'Thiago', 'Larissa', 'Felipe', 'Amanda', 'Diego', 'Vinícius', 'Letícia', 'Rodrigo', 'Marina', 'Caio', 'Beatriz', 'Gustavo', 'Renata', 'André', 'Natália', 'Henrique']
const LAST = ['Silva', 'Souza', 'Oliveira', 'Santos', 'Lima', 'Costa', 'Pereira', 'Almeida', 'Rocha', 'Ferreira', 'Ribeiro', 'Carvalho', 'Gomes', 'Martins']
const STREETS = ['Rua Augusta', 'Rua Teodoro Sampaio', 'Av. Paulista', 'Rua dos Pinheiros', 'Rua Harmonia', 'Rua Fradique Coutinho', 'Rua Cardeal Arcoverde', 'Rua Girassol', 'Rua Wisard', 'Rua Aspicuelta']

export const DEFAULT_SETTINGS: Settings = {
  storeName: 'Brasa Tabacaria',
  tagline: 'Narguilé, essências e acessórios com entrega rápida',
  whatsapp: '5511999999999',
  pixKey: 'pix@brasatabacaria.com.br',
  pixName: 'Brasa Tabacaria LTDA',
  pixCity: 'Sao Paulo',
  deliveryFee: 8,
  freeDeliveryFrom: 150,
  address: 'Rua dos Pinheiros, 1234 — Pinheiros, São Paulo/SP',
  hours: 'Seg a Sáb, 10h às 22h · Dom, 14h às 20h',
  targetMargin: 0.45,
}

export interface SeedData {
  settings: Settings
  products: Product[]
  movements: Movement[]
  orders: Order[]
  expenses: Expense[]
  counts: StockCount[]
  nextOrder: number
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function buildSeed(): SeedData {
  const rnd = mulberry32(20261022)
  const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)]

  const DAYS = 90
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayAt = (d: number, hour: number, min = 0) => {
    const x = new Date(today)
    x.setDate(x.getDate() - d)
    x.setHours(hour, min, int(0, 59))
    return x
  }

  const products: Product[] = CATALOG.map(([sku, name, brand, category, cost, price, minStock, , description], i) => ({
    id: `p${i + 1}`,
    sku,
    name,
    brand,
    category,
    description,
    cost,
    price,
    stock: 0,
    minStock,
    active: true,
    featured: i % 4 === 0,
    createdAt: dayAt(DAYS + 5, 9).toISOString(),
  }))
  const popularity = CATALOG.map((c) => c[7])
  const target = products.map((p) => p.minStock * 3 + 2)

  const movements: Movement[] = []
  const orders: Order[] = []
  const expenses: Expense[] = []
  const counts: StockCount[] = []
  let mid = 0
  let orderNo = 1001

  const entry = (p: Product, qty: number, unitCost: number, date: Date, note?: string) => {
    const total = p.stock * p.cost + qty * unitCost
    p.stock += qty
    p.cost = round2(total / p.stock)
    movements.push({
      id: `m${++mid}`,
      productId: p.id,
      type: 'entrada',
      qty,
      unitCost,
      date: date.toISOString(),
      supplier: SUPPLIERS[p.category],
      note,
    })
  }

  const totalPop = popularity.reduce((a, b) => a + b, 0)
  const pickProduct = () => {
    let r = rnd() * totalPop
    for (let i = 0; i < products.length; i++) {
      r -= popularity[i]
      if (r <= 0) return i
    }
    return products.length - 1
  }

  for (let d = DAYS; d >= 0; d--) {
    const date = dayAt(d, 9)
    const weekday = date.getDay()

    // Compra inicial e reposições semanais (segundas)
    if (d === DAYS) {
      products.forEach((p, i) => entry(p, target[i], p.cost, dayAt(d, 9, 30), `NF ${int(10000, 99999)}`))
    } else if (weekday === 1) {
      const nf = `NF ${int(10000, 99999)}`
      products.forEach((p, i) => {
        // na última semana alguns itens ficam sem reposição para a demo ter alertas
        if (p.stock <= p.minStock * 1.4 && !(d < 7 && [3, 9, 17, 20, 27].includes(i))) {
          const base = CATALOG[i][4]
          const unit = round2(base * (0.96 + rnd() * 0.12))
          entry(p, target[i] - p.stock, unit, dayAt(d, 10, 15), nf)
        }
      })
    }

    // Balanço de 30 dias atrás com pequenas perdas
    if (d === 30) {
      const cdate = dayAt(d, 8)
      const items = products.map((p) => ({ productId: p.id, system: p.stock, counted: p.stock as number | null, cost: p.cost }))
      ;[0, 16, 26, 14].forEach((idx, k) => {
        const diff = k === 3 ? 1 : -int(1, 2)
        const it = items[idx]
        it.counted = Math.max(0, it.system + diff)
        const delta = it.counted - it.system
        products[idx].stock += delta
        movements.push({
          id: `m${++mid}`,
          productId: products[idx].id,
          type: 'ajuste',
          qty: delta,
          unitCost: products[idx].cost,
          date: dayAt(d, 9).toISOString(),
          note: 'Ajuste de balanço',
          ref: 'BAL-1',
        })
      })
      counts.push({ id: 'BAL-1', date: cdate.toISOString(), status: 'finalizado', items, finishedAt: dayAt(d, 9).toISOString(), note: 'Balanço mensal' })
    }

    // Vendas do dia
    const growth = 1 + ((DAYS - d) / DAYS) * 0.35
    const weekend = weekday === 5 || weekday === 6 ? 4 : weekday === 0 ? 1 : 0
    let nOrders = Math.round((5 + weekend + int(-2, 3)) * growth)
    const lastHour = d === 0 ? Math.min(22, now.getHours()) : 22
    if (d === 0) nOrders = Math.max(4, Math.round(nOrders * Math.max(0.35, (lastHour - 10) / 12)))

    for (let n = 0; n < nOrders; n++) {
      const nItems = rnd() < 0.42 ? 1 : rnd() < 0.55 ? 2 : rnd() < 0.7 ? 3 : 4
      const items: OrderItem[] = []
      for (let k = 0; k < nItems; k++) {
        const idx = pickProduct()
        const p = products[idx]
        if (items.some((it) => it.productId === p.id)) continue
        const qty = p.price < 30 ? int(1, 3) : 1
        if (p.stock < qty) continue
        items.push({ productId: p.id, name: p.name, qty, price: p.price, cost: p.cost })
      }
      if (!items.length) continue

      const channel = rnd() < 0.58 ? 'site' : 'balcao'
      const subtotal = round2(items.reduce((s, it) => s + it.qty * it.price, 0))
      const delivery = channel === 'site' && rnd() < 0.55 ? 'entrega' : 'retirada'
      const deliveryFee = delivery === 'entrega' && subtotal < DEFAULT_SETTINGS.freeDeliveryFrom ? DEFAULT_SETTINGS.deliveryFee : 0
      const discount = channel === 'balcao' && subtotal > 100 && rnd() < 0.3 ? round2(subtotal * 0.05) : 0
      const hour = Math.max(10, Math.min(lastHour, int(10, 22)))
      const odate = dayAt(d, hour, int(0, 59))

      let status: Order['status'] = 'entregue'
      if (rnd() < 0.035) status = 'cancelado'
      else if (d === 0 && channel === 'site') status = n >= nOrders - 3 ? 'aguardando' : rnd() < 0.6 ? 'pago' : 'entregue'
      else if (d === 1 && channel === 'site' && rnd() < 0.3) status = 'pago'

      const payment = channel === 'site' ? 'pix' : pick(['pix', 'pix', 'cartao', 'cartao', 'dinheiro'] as const)
      const name = `${pick(FIRST)} ${pick(LAST)}`
      const order: Order = {
        id: `o${orderNo}`,
        number: orderNo++,
        date: odate.toISOString(),
        customer: { name: channel === 'balcao' && rnd() < 0.5 ? 'Cliente balcão' : name, phone: `55119${int(1000, 9999)}${int(1000, 9999)}` },
        delivery,
        address: delivery === 'entrega' ? `${pick(STREETS)}, ${int(10, 2400)} — São Paulo` : undefined,
        items,
        subtotal,
        deliveryFee,
        discount,
        total: round2(subtotal + deliveryFee - discount),
        status,
        channel,
        payment,
        paidAt: status === 'pago' || status === 'entregue' ? new Date(odate.getTime() + int(3, 25) * 60000).toISOString() : undefined,
      }
      orders.push(order)

      if (status === 'pago' || status === 'entregue') {
        for (const it of items) {
          const p = products.find((x) => x.id === it.productId)!
          p.stock -= it.qty
          movements.push({
            id: `m${++mid}`,
            productId: p.id,
            type: 'venda',
            qty: -it.qty,
            unitCost: it.cost,
            date: (order.paidAt ?? order.date),
            ref: `#${order.number}`,
          })
        }
      }
    }

    // Saídas avulsas (avaria / uso interno) de vez em quando
    if (d % 17 === 5) {
      const p = products[pick([0, 6, 14, 16])]
      if (p.stock > 2) {
        p.stock -= 1
        movements.push({ id: `m${++mid}`, productId: p.id, type: 'saida', qty: -1, unitCost: p.cost, date: dayAt(d, 18).toISOString(), note: pick(['Avaria', 'Uso interno (degustação)', 'Embalagem danificada']) })
      }
    }

    // Despesas fixas no dia 5 de cada mês
    if (date.getDate() === 5) {
      const m = date
      const at = (h: number) => new Date(m.getFullYear(), m.getMonth(), 5, h).toISOString()
      expenses.push(
        { id: `e${expenses.length + 1}`, date: at(9), description: 'Aluguel da loja', category: 'aluguel', amount: 2800 },
        { id: `e${expenses.length + 2}`, date: at(9), description: 'Salário atendente', category: 'pessoal', amount: 2200 },
        { id: `e${expenses.length + 3}`, date: at(10), description: 'Energia elétrica', category: 'contas', amount: round2(330 + rnd() * 120) },
        { id: `e${expenses.length + 4}`, date: at(10), description: 'Internet + telefone', category: 'contas', amount: 129.9 },
        { id: `e${expenses.length + 5}`, date: at(11), description: 'Anúncios Instagram', category: 'marketing', amount: 300 },
        { id: `e${expenses.length + 6}`, date: at(11), description: 'Embalagens e sacolas', category: 'outros', amount: round2(120 + rnd() * 80) },
      )
    }
  }

  movements.sort((a, b) => b.date.localeCompare(a.date))
  orders.sort((a, b) => b.date.localeCompare(a.date))
  expenses.sort((a, b) => b.date.localeCompare(a.date))

  return { settings: { ...DEFAULT_SETTINGS }, products, movements, orders, expenses, counts, nextOrder: orderNo }
}
