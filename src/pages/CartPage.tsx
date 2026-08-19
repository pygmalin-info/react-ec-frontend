import { CartLineItem, calcCartTotal, useCart } from '@/entities/cart'
import { RemoveFromCartButton } from '@/features/remove-from-cart'
import { CartItemQuantitySelect } from '@/features/update-cart-item-quantity'
import { formatYen } from '@/shared/lib/format'
import { ApiErrorMessage } from '@/shared/ui/ApiErrorMessage'

/**
 * カート一覧（PDF Q8 / Q9）。
 *
 * ■ 合計金額はどこで計算されているか（PDF Q8）
 *   calcCartTotal(cart) — entities/cart/lib/calcCartTotal.ts の純粋関数。
 *   サーバーは合計を返さず、state にも保存していない。
 *   カートの行データから毎回計算しているので、行と合計がズレることがない。
 *
 * ■ 同じ商品を2回カートに入れたときに行が増えない理由（PDF Q9）
 *   サーバーが数量を加算して1行にまとめているから。
 *   このページには、そのための処理が一切無い。
 *   （どこでまとめているかは src/mocks/db.ts の addCartItem を見ると分かる）
 */
export function CartPage() {
  const cartQuery = useCart()

  if (cartQuery.isPending) return <p className="status-text">読み込み中…</p>

  if (cartQuery.isError) {
    return <ApiErrorMessage error={cartQuery.error} onRetry={() => void cartQuery.refetch()} />
  }

  const cart = cartQuery.data
  const total = calcCartTotal(cart)

  if (cart.lines.length === 0) {
    return (
      <>
        <h1>カート</h1>
        <p className="empty-state">カートに商品がありません。</p>
      </>
    )
  }

  return (
    <>
      <h1>カート</h1>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {cart.lines.map((line) => (
          <CartLineItem
            key={line.id}
            line={line}
            actions={
              <>
                <CartItemQuantitySelect
                  cartItemId={line.id}
                  quantity={line.quantity}
                  max={line.product.stock}
                />
                <RemoveFromCartButton cartItemId={line.id} productName={line.product.name} />
              </>
            }
          />
        ))}
      </ul>

      <div className="cart-total">
        <span>合計（{total.totalQuantity} 点）</span>
        <span>{formatYen(total.totalAmount)}</span>
      </div>
    </>
  )
}
