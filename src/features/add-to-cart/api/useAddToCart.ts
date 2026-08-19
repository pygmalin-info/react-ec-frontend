import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addCartItem, cartKeys } from '@/entities/cart'

/**
 * カートに追加する（PDF Q5 / Q7 / Q9）。
 *
 * ■ 「なぜ Mutation のあとに画面が更新されるのか」の答えがここ
 *
 *   ユーザーがボタンを押す
 *     → mutationFn: addCartItem()  → POST /cart/items → バックエンド
 *     → 成功
 *     → invalidateQueries({ queryKey: cartKeys.all })
 *         ＝「cartKeys.all のキャッシュはもう古い」と宣言する
 *     → その瞬間、画面に表示されている useCart / useCartItemCount が GET /cart をやり直す
 *     → ヘッダのバッジとカート画面が同時に新しい値になる
 *
 *   ヘッダとカート画面は互いを知らないのに、両方が更新される。
 *   これは「同じ queryKey を見ている＝同じキャッシュを共有している」から。
 *   props でも Context でもなく Query Cache を選んだ理由がこれ。
 *
 * ■ なぜ Optimistic Update を使っていないのか
 *   使えば体感は速くなるが、
 *     - 失敗したときに元に戻す処理
 *     - サーバー側の数量集約（同じ商品なら加算）をフロントでも再現する処理
 *   が必要になり、「なぜこの数字になったのか」を追うのが一気に難しくなる。
 *   教材としては、上の一本道が読めることを優先している。
 *   （演習として書き換えてみる価値はある。docs/ARCHITECTURE.md の演習を参照）
 */
export function useAddToCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addCartItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.all }),
  })
}
