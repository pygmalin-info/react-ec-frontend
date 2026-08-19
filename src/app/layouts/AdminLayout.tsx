import { Link, Outlet } from 'react-router-dom'
import { useCurrentUser } from '@/entities/user'
import { SignOutButton } from '@/features/sign-out'
import { routes } from '@/shared/config/routes'

/**
 * 管理者向けのレイアウト（PDF Q3 / Q11）。
 *
 * ■ ヘッダーのメールアドレスはどこから来ているか（PDF Q11）
 *   useCurrentUser() → useQuery(['currentUser']) → GET /auth/me
 *
 *   ログイン時のレスポンスにもメールアドレスは含まれているが、
 *   それを Context やグローバル state に保存して使い回してはいない。
 *   保存すると、リロードで消える／古くなる／どこで更新するのかが分からなくなる。
 *   Server State として扱えば、必要な画面が必要なときに聞くだけで済む。
 */
export function AdminLayout() {
  const currentUserQuery = useCurrentUser()

  return (
    <>
      <header className="layout__header layout__header--admin">
        <Link to={routes.admin.products}>
          <strong>Training EC 管理</strong>
        </Link>

        <nav className="layout__nav">
          <Link to={routes.products}>ショップを見る</Link>

          {/* 読み込み中は何も出さない。ここで「読み込み中…」を出すと画面がちらつく */}
          {currentUserQuery.data ? <span>{currentUserQuery.data.email}</span> : null}

          <SignOutButton />
        </nav>
      </header>

      <main className="layout__main">
        <Outlet />
      </main>
    </>
  )
}
