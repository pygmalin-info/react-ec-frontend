import type { ProductId } from '@/entities/product'
import { ApiErrorMessage } from '@/shared/ui/ApiErrorMessage'
import { Button } from '@/shared/ui/Button'
import { useAddToCart } from '../api/useAddToCart'

type AddToCartButtonProps = {
  productId: ProductId
  /** 在庫切れ・未公開のときに押せなくする。判定は呼び出し側（商品を知っている側）が行う */
  disabled?: boolean
}

/**
 * カート追加ボタン（PDF Q7）。
 *
 * ■ なぜ ProductCard の中ではなく feature にあるのか
 *   これは「商品の見た目」ではなく「ユーザーが行う操作」だから。
 *   entities/product に置くと、商品を表示したいだけの画面（管理者一覧など）にも
 *   カートの都合が入り込む。
 *
 * ■ なぜ product 全体ではなく productId だけを受け取るのか
 *   カートに追加するのに必要な情報は ID と数量だけ。
 *   Product 全体を受け取ると「価格が変わったらどうする？」のような
 *   本来関係のない話に巻き込まれる。props は必要な分だけ受け取る。
 */
export function AddToCartButton({ productId, disabled = false }: AddToCartButtonProps) {
  const addToCart = useAddToCart()

  return (
    <div>
      <Button
        onClick={() => addToCart.mutate({ productId, quantity: 1 })}
        isLoading={addToCart.isPending}
        disabled={disabled}
      >
        カートに追加
      </Button>

      {/* 在庫不足（400 OUT_OF_STOCK）や未ログイン（401）はここに出る */}
      {addToCart.error ? <ApiErrorMessage error={addToCart.error} /> : null}

      {addToCart.isSuccess ? <p className="status-text">カートに追加しました。</p> : null}
    </div>
  )
}
