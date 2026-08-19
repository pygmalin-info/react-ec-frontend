import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authToken } from '@/shared/api/authToken'
import { signOut } from '@/entities/user'

/**
 * ログアウト（PDF Q10）。
 *
 * ■ なぜ onSuccess ではなく onSettled なのか
 *   onSettled は成功でも失敗でも実行される。
 *   ログアウトAPIが 500 を返したとき、画面に「ログアウトできませんでした」と出して
 *   ログイン状態のままにするのは、ユーザーの意図に反する。
 *   サーバー側のセッション削除に失敗しても、この端末からトークンを消すことはできる。
 *
 * ■ なぜ queryClient.clear() が必要なのか
 *   これを忘れると、次に別のアカウントでログインしたときに
 *   前のユーザーのカートや商品一覧が一瞬表示される。
 *   キャッシュは「誰のものか」を知らないので、明示的に捨てる必要がある。
 */
export function useSignOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: signOut,
    onSettled: () => {
      authToken.clear()
      queryClient.clear()
    },
  })
}
