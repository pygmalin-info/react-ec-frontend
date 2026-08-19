import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthToken } from '@/shared/api/useAuthToken'

/**
 * トークンが失われたときに、Query キャッシュを捨てる。
 *
 * ■ なぜこれが必要なのか（PDF Q15）
 *   トークンを消したり書き換えたりして API を叩くと、サーバーは 401 を返す。
 *   その 401 を受け取った shared/api/httpClient.ts の interceptor は
 *   authToken.clear() を呼ぶが、それ以上のことはしない。
 *   React の外にいる interceptor が、画面遷移やキャッシュ操作まで始めると、
 *   「なぜ画面が飛んだのか」を追うのが一気に難しくなるため。
 *
 *   代わりに、トークンの変化を「購読」しているこのコンポーネントが後始末をする。
 *      interceptor : トークンを捨てる（React の外の仕事）
 *      ここ        : キャッシュを捨てる（React の中の仕事）
 *      RequireAuth : ログイン画面へ送る（ルーティングの仕事）
 *   3つに分かれているが、きっかけはすべて「トークンが null になったこと」1つ。
 *
 * ■ なぜ Context を提供していないのに Provider という名前なのか
 *   配る値は無く、副作用だけを担当しているため、実体は「配線」に近い。
 *   トークンが欲しいコンポーネントは useAuthToken() を直接呼べばよく、
 *   Context を経由する必要がない。
 */
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthToken()
  const queryClient = useQueryClient()
  const previousToken = useRef(token)

  useEffect(() => {
    // 「ログイン済みだったのにトークンが消えた」ときだけキャッシュを捨てる
    if (previousToken.current !== null && token === null) {
      queryClient.clear()
    }
    previousToken.current = token
  }, [token, queryClient])

  return children
}
