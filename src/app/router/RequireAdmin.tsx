import { isAdmin, useCurrentUser } from '@/entities/user'
import { ApiErrorMessage } from '@/shared/ui/ApiErrorMessage'
import { Alert } from '@/shared/ui/Alert'

/**
 * 管理者だけが入れる画面を守る。
 *
 * ■ なぜ権限だけ RequireAuth と分けているのか
 *   トークンの有無は同期的に分かるが、権限はサーバーに聞かないと分からない。
 *   判定にかかる時間が違うものを1つにまとめると、
 *   「トークンはあるのに全画面が読み込み中」になってしまう。
 *
 * ■ なぜ role をトークンや localStorage に持たないのか
 *   フロントに持たせた権限は、利用者が書き換えられる。
 *   ここでの判定はあくまで「画面を出すかどうか」の話で、
 *   本当の防御はサーバー側の 403 が担当している。
 *   （管理者APIを直接叩けば、フロントの判定に関係なく 403 が返る）
 */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const currentUserQuery = useCurrentUser()

  if (currentUserQuery.isPending) {
    return <p className="status-text">読み込み中…</p>
  }

  if (currentUserQuery.isError) {
    return <ApiErrorMessage error={currentUserQuery.error} />
  }

  if (!isAdmin(currentUserQuery.data)) {
    return <Alert>この画面を表示する権限がありません。</Alert>
  }

  return children
}
