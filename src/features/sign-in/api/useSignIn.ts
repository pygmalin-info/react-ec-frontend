import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authToken } from '@/shared/api/authToken'
import { signIn, userKeys, type SignInResult } from '@/entities/user'

/**
 * ログイン（PDF Q2）。
 *
 * データの流れ:
 *   SignInForm
 *     → useSignIn()            ← ここ
 *       → signIn()             ← entities/user/api/userApi.ts
 *         → httpClient.post()  ← shared/api/httpClient.ts
 *           → バックエンド
 *
 * 成功したあとに何が起きるか:
 *   1. authToken.set() で localStorage に保存する
 *      → useAuthToken を購読しているコンポーネントが再レンダリングされる
 *      → useCurrentUser / useCart の enabled が true になり、取得が始まる
 *   2. setQueryData でユーザー情報をキャッシュに入れる
 *      → 直後に /auth/me を叩かなくて済む
 *
 * ■ なぜ invalidateQueries ではなく setQueryData なのか
 *   ログインのレスポンスに、これから欲しいユーザー情報がそのまま入っているから。
 *   invalidate すると「持っているのにもう一度取りに行く」ことになる。
 *   逆に、レスポンスに含まれない情報（カートなど）は invalidate で取り直すのが正しい。
 */
export function useSignIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: signIn,
    onSuccess: (result: SignInResult) => {
      authToken.set(result.token)
      queryClient.setQueryData(userKeys.me, result.user)
    },
  })
}
