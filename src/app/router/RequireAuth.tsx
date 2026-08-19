import { Navigate, useLocation } from 'react-router-dom'
import { useAuthToken } from '@/shared/api/useAuthToken'
import { routes } from '@/shared/config/routes'

/**
 * ログインしていないと入れない画面を守る（PDF Q2 / Q15 / Q17）。
 *
 * ■ なぜトークンの有無だけで判定しているのか
 *   ここで /auth/me を待つと、全ページの表示が1リクエスト分遅くなる。
 *   トークンが無ければ確実に未ログインなので、その場で弾ける。
 *   トークンが「あるが無効」な場合は、画面に入ったあと最初のAPI呼び出しが 401 を返し、
 *   interceptor がトークンを捨て、その変化を購読しているここが再び弾く。
 *
 * ■ state に元の場所を積んでいる理由
 *   ログイン後に、見ようとしていた画面へ戻すため。
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthToken()
  const location = useLocation()

  if (token === null) {
    return <Navigate to={routes.signIn} state={{ from: location.pathname }} replace />
  }

  return children
}
