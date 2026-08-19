import { Link, Outlet } from 'react-router-dom'
import { useCartItemCount } from '@/entities/cart'
import { isAdmin, useCurrentUser } from '@/entities/user'
import { SignOutButton } from '@/features/sign-out'
import { useAuthToken } from '@/shared/api/useAuthToken'
import { routes } from '@/shared/config/routes'

/**
 * 利用者向けのレイアウト（PDF Q3）。
 *
 * ■ ユーザー側と管理者側でヘッダーが違うことをどう表現しているか
 *   1つのヘッダーの中で if 分岐するのではなく、レイアウトを2つ作り、
 *   ルーティングでどちらを使うかを決めている（app/router/AppRouter.tsx を参照）。
 *   分岐で書くと「管理者のときだけ出す」「利用者のときだけ出す」が増え続け、
 *   最終的にどちらの画面の話をしているのか読めなくなる。
 */
export function ShopLayout() {
  const token = useAuthToken()
  const currentUserQuery = useCurrentUser()
  const cartItemCountQuery = useCartItemCount()

  const isSignedIn = token !== null

  return (
    <>
      <header className="layout__header">
        <Link to={routes.products}>
          <strong>Training EC</strong>
        </Link>

        <nav className="layout__nav">
          <Link to={routes.products}>商品一覧</Link>

          {isSignedIn ? (
            <Link to={routes.cart}>
              カート
              {/*
                バッジの数字はどこから来ているか（PDF Q5）:
                  useCartItemCount()
                    → useQuery(queryKey: cartKeys.all, select: 合計点数)
                      → GET /cart
                カート追加後にこの数字が変わる理由は
                features/add-to-cart/api/useAddToCart.ts の invalidateQueries にある。
              */}
              {cartItemCountQuery.data !== undefined && cartItemCountQuery.data > 0 ? (
                <span className="cart-badge" aria-label={`カートに${cartItemCountQuery.data}点`}>
                  {cartItemCountQuery.data}
                </span>
              ) : null}
            </Link>
          ) : null}

          {currentUserQuery.data && isAdmin(currentUserQuery.data) ? (
            <Link to={routes.admin.products}>管理画面</Link>
          ) : null}

          {isSignedIn ? <SignOutButton /> : <Link to={routes.signIn}>ログイン</Link>}
        </nav>
      </header>

      <main className="layout__main">
        <Outlet />
      </main>
    </>
  )
}
