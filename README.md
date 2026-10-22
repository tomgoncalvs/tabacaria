# Brasa Tabacaria — protótipo (front-end)

Loja + painel de gestão para tabacaria. **Só front-end**: os dados ficam no `localStorage` do navegador, então um pedido feito na loja aparece na hora no painel. Serve para demonstrar o produto antes de montar o backend.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/ (estático, roda em qualquer hospedagem)
```

## Loja (`/#/`)
- Confirmação de maioridade (+18) e advertência do Ministério da Saúde
- Catálogo com busca, categorias e ordenação; carrinho com barra de frete grátis
- Checkout em 3 passos: dados → **Pix (QR Code + copia e cola gerados com o valor do pedido)** → mensagem pronta no **WhatsApp** para o cliente enviar com a foto do comprovante
- Nada é cobrado no site: o pedido entra no painel como "Aguardando Pix"

## Painel (`/#/admin`)
| Tela | O que faz |
|---|---|
| Dashboard | Faturamento, lucro, margem, ticket, gráfico diário, pedidos aguardando Pix, top produtos, estoque baixo |
| Vendas | Todos os pedidos; confirmar pagamento (baixa estoque), concluir entrega, cancelar (estorna estoque) |
| Venda balcão | PDV rápido com desconto e forma de pagamento |
| Produtos | Cadastro com custo, preço, margem, markup e sugestão de preço pela margem desejada |
| Estoque | Posição, valor parado, cobertura em dias e sugestão de compra |
| Entradas e saídas | Compras (atualizam custo médio ponderado), perdas/avarias e histórico completo |
| Balanço | Contagem física x sistema, divergências em R$ e ajuste automático |
| Financeiro | Fluxo de caixa, DRE simplificada, despesas e recebimentos por forma de pagamento |
| Margem e ranking | Curva ABC, margem por categoria, produtos abaixo da meta e produtos parados |
| Configurações | Nome, WhatsApp, chave Pix, frete, meta de margem e restaurar dados da demo |

## Para o backend
O contrato de dados está em `src/lib/types.ts` e todas as regras de negócio (baixa de estoque, custo médio, estorno, balanço) estão em `src/lib/store.ts` — é o que vira API.
