import { useQuery } from '@tanstack/react-query'
import { useAuthToken } from '@/shared/api/useAuthToken'
import { fetchCurrentUser } from './userApi'

export const userKeys = {
  me: ['currentUser'] as const,
}

/**
 * ログイン中のユーザーを取得する（PDF Q11 / Q17）。
 *
 * ■ なぜ Server State なのか
 *   「今ログインしているのが誰か」を決めているのはサーバー。
 *   ログイン時のレスポンスをフロントに保存しておくこともできるが、
 *   そうすると権限変更や退会がフロントに伝わらない。
 *
 * ■ リロードしたときに何が起きるか
 *   React の状態は全部消えるが、トークンは localStorage に残っている。
 *   → useAuthToken がトークンを拾う
 *   → enabled が true になり、この Query が /auth/me を叩く
 *   → ユーザー情報が復元される
 *   トークンが無効なら 401 が返り、interceptor がトークンを捨て、ログイン画面へ戻る。
 *
 * ■ staleTime を長めにしている理由
 *   ユーザー情報は画面遷移のたびに変わるものではない。
 *   ヘッダが再マウントされるたびに /auth/me を叩くのは無駄。
 */
export function useCurrentUser() {
  const token = useAuthToken()

  return useQuery({
    queryKey: userKeys.me,
    queryFn: fetchCurrentUser,
    enabled: token !== null,
    staleTime: 5 * 60 * 1000,
    // 401 のときに再試行しても結果は変わらない
    retry: false,
  })
}
