import { queryOptions, useQuery } from '@tanstack/react-query'
import { useAuthToken } from '@/shared/api/useAuthToken'
import { calcCartTotal } from '../lib/calcCartTotal'
import { fetchCart } from './cartApi'

export const cartKeys = {
  all: ['cart'] as const,
}

/**
 * カート取得の設定を1つにまとめる。
 *
 * useCart と useCartItemCount が同じ queryKey を使うことが重要。
 * キーが同じなら、TanStack Query は同じキャッシュを共有する。
 * つまりヘッダのバッジとカート画面は「同じ1つのデータ」を見ていることになり、
 * 片方だけ古い、という状態が構造的に起きない。
 */
function cartQueryOptions(isSignedIn: boolean) {
  return queryOptions({
    queryKey: cartKeys.all,
    queryFn: fetchCart,
    // 未ログインで叩くと必ず 401 になる。呼ばないほうが正しい。
    enabled: isSignedIn,
  })
}

export function useCart() {
  const token = useAuthToken()
  return useQuery(cartQueryOptions(token !== null))
}

/**
 * ヘッダのカートバッジ用（PDF Q5）。
 *
 * ■ なぜ「カートの個数」を useState で持たないのか
 *   持った瞬間、真実が2つになる。
 *   カート画面で数量を変えたときにバッジを更新する処理を別途書く必要があり、
 *   書き忘れると「カート画面は3個なのにバッジは1個」になる。
 *
 * ■ なぜ select を使うのか
 *   select はキャッシュされたデータから表示に必要な値だけを取り出す仕組み。
 *   合計点数が変わらない限り、このコンポーネントは再レンダリングされない。
 *   （商品名だけが変わってもバッジは再描画されない）
 */
export function useCartItemCount() {
  const token = useAuthToken()
  return useQuery({
    ...cartQueryOptions(token !== null),
    select: (cart) => calcCartTotal(cart).totalQuantity,
  })
}
