import type { CartItemId } from '@/entities/cart'
import { ApiErrorMessage } from '@/shared/ui/ApiErrorMessage'
import { useUpdateCartItemQuantity } from '../api/useUpdateCartItemQuantity'

type CartItemQuantitySelectProps = {
  cartItemId: CartItemId
  quantity: number
  max: number
}

const MAX_SELECTABLE = 10

/**
 * カート内の数量変更。
 *
 * ■ なぜ useState を使っていないのか
 *   選択されている数量の「正解」を持っているのはサーバー。
 *   ここで useState にコピーすると、
 *     - 別タブで数量を変えた
 *     - 更新に失敗した
 *   ときに、画面の数字とサーバーの数字が食い違う。
 *   value はサーバーから来た値をそのまま使い、変更は mutation で伝えて、
 *   結果は invalidate による再取得で受け取る。
 *
 *   ※「入力途中の値」を持ちたいフォーム（商品編集など）は事情が違う。
 *     そちらは React Hook Form が Client State として持っている。
 *     同じ「入力」でも、確定操作があるかどうかで所有者が変わる。
 */
export function CartItemQuantitySelect({ cartItemId, quantity, max }: CartItemQuantitySelectProps) {
  const updateQuantity = useUpdateCartItemQuantity()
  const options = Array.from({ length: Math.min(Math.max(max, 1), MAX_SELECTABLE) }, (_, index) => index + 1)

  return (
    <div>
      <label>
        数量
        <select
          value={quantity}
          disabled={updateQuantity.isPending}
          onChange={(event) => {
            updateQuantity.mutate({ cartItemId, quantity: Number(event.target.value) })
          }}
        >
          {options.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      {updateQuantity.error ? <ApiErrorMessage error={updateQuantity.error} /> : null}
    </div>
  )
}
