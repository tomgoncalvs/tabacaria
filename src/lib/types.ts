export type CategoryId =
  | 'essencias'
  | 'carvao'
  | 'narguiles'
  | 'acessorios-narguile'
  | 'sedas'
  | 'tabacos'
  | 'charutos'
  | 'isqueiros'
  | 'acessorios'

export interface Product {
  id: string
  sku: string
  name: string
  brand: string
  category: CategoryId
  description: string
  /** custo médio ponderado */
  cost: number
  price: number
  stock: number
  minStock: number
  active: boolean
  featured?: boolean
  image?: string
  createdAt: string
}

export type MovementType = 'entrada' | 'saida' | 'venda' | 'ajuste' | 'estorno'

export interface Movement {
  id: string
  productId: string
  type: MovementType
  /** positivo entra, negativo sai */
  qty: number
  unitCost: number
  date: string
  note?: string
  ref?: string
  supplier?: string
}

export type OrderStatus = 'aguardando' | 'pago' | 'entregue' | 'cancelado'
export type Channel = 'site' | 'balcao'
export type PayMethod = 'pix' | 'dinheiro' | 'cartao'

export interface OrderItem {
  productId: string
  name: string
  qty: number
  price: number
  cost: number
}

export interface Order {
  id: string
  number: number
  date: string
  customer: { name: string; phone: string }
  delivery: 'retirada' | 'entrega'
  address?: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  status: OrderStatus
  channel: Channel
  payment: PayMethod
  notes?: string
  paidAt?: string
}

export type ExpenseCategory = 'aluguel' | 'pessoal' | 'contas' | 'marketing' | 'outros'

export interface Expense {
  id: string
  date: string
  description: string
  category: ExpenseCategory
  amount: number
}

export interface StockCountItem {
  productId: string
  system: number
  counted: number | null
  cost: number
}

export interface StockCount {
  id: string
  date: string
  status: 'aberto' | 'finalizado'
  items: StockCountItem[]
  finishedAt?: string
  note?: string
}

export interface Settings {
  storeName: string
  tagline: string
  whatsapp: string
  pixKey: string
  pixName: string
  pixCity: string
  deliveryFee: number
  freeDeliveryFrom: number
  address: string
  hours: string
  targetMargin: number
}
