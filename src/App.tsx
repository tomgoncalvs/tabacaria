import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './admin/AdminLayout'
import Balanco from './admin/Balanco'
import Config from './admin/Config'
import Dashboard from './admin/Dashboard'
import Estoque from './admin/Estoque'
import Financeiro from './admin/Financeiro'
import Movimentacoes from './admin/Movimentacoes'
import Pdv from './admin/Pdv'
import Pedidos from './admin/Pedidos'
import Produtos from './admin/Produtos'
import Relatorios from './admin/Relatorios'
import { Toaster } from './components/ui'
import ShopHome from './shop/ShopHome'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<ShopHome />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="vendas" element={<Pedidos />} />
          <Route path="pdv" element={<Pdv />} />
          <Route path="produtos" element={<Produtos />} />
          <Route path="estoque" element={<Estoque />} />
          <Route path="movimentacoes" element={<Movimentacoes />} />
          <Route path="balanco" element={<Balanco />} />
          <Route path="financeiro" element={<Financeiro />} />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="configuracoes" element={<Config />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  )
}
