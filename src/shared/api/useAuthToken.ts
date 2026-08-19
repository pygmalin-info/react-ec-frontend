import { useSyncExternalStore } from 'react'
import { authToken } from './authToken'

/**
 * localStorage にあるトークンを React から「購読」する。
 *
 * ■ なぜ Context を使っていないのか
 *   Context は「React ツリーの中で値を配る」仕組み。
 *   ここで配りたい値は React の外（localStorage）にあり、
 *   React の外（axios の interceptor）からも書き換えられる。
 *   useSyncExternalStore は、まさにその「React の外の状態」を購読するための API。
 *
 *   Context を挟むと、
 *     localStorage → Context の state → 画面
 *   と真実が2段になり、interceptor が localStorage を書き換えたときに
 *   Context 側を更新する仕掛けが別途必要になる。
 *   購読にしておけば、どこから書き換えられても画面は必ず追従する。
 *
 * ■ この hook が返すもの
 *   トークン文字列そのもの。「ログイン中のユーザーが誰か」はここでは分からない。
 *   それはサーバーに聞く（entities/user の useCurrentUser）。
 */
export function useAuthToken(): string | null {
  return useSyncExternalStore(authToken.subscribe, authToken.getSnapshot, () => null)
}
