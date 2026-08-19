import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminProductEditPage } from '@/pages/AdminProductEditPage'
import { AdminProductListPage } from '@/pages/AdminProductListPage'
import { AdminProductNewPage } from '@/pages/AdminProductNewPage'
import { CartPage } from '@/pages/CartPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProductDetailPage } from '@/pages/ProductDetailPage'
import { ProductListPage } from '@/pages/ProductListPage'
import { SignInPage } from '@/pages/SignInPage'
import { SignUpPage } from '@/pages/SignUpPage'
import { routes } from '@/shared/config/routes'
import { AdminLayout } from '../layouts/AdminLayout'
import { ShopLayout } from '../layouts/ShopLayout'
import { RequireAdmin } from './RequireAdmin'
import { RequireAuth } from './RequireAuth'

/**
 * ルーティング（PDF Q18）。
 *
 * ■ この1ファイルを読めば、アプリの全体像が分かるようにしている
 *   - どんな画面があるか
 *   - どの画面がどちらのレイアウトを使うか（PDF Q3）
 *   - どの画面がログイン必須か、管理者専用か
 *
 * ■ 保護の仕方を2段にしている理由
 *   RequireAuth  : トークンの有無だけで即座に判定できる
 *   RequireAdmin : サーバーに聞かないと分からない
 *   管理画面は両方で包む。「ログインしていない人」と「権限が無い人」では、
 *   出すべき画面（ログイン画面 / 権限エラー）が違うため。
 */
export function AppRouter() {
  return (
    <Routes>
      {/* 利用者向け */}
      <Route element={<ShopLayout />}>
        <Route path="/" element={<Navigate to={routes.products} replace />} />
        <Route path={routes.signIn} element={<SignInPage />} />
        <Route path={routes.signUp} element={<SignUpPage />} />
        <Route path={routes.products} element={<ProductListPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route
          path={routes.cart}
          element={
            <RequireAuth>
              <CartPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* 管理者向け。レイアウトそのものが違う */}
      <Route
        element={
          <RequireAuth>
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          </RequireAuth>
        }
      >
        <Route path={routes.admin.products} element={<AdminProductListPage />} />
        <Route path={routes.admin.productNew} element={<AdminProductNewPage />} />
        <Route path="/admin/products/:productId/edit" element={<AdminProductEditPage />} />
      </Route>
    </Routes>
  )
}
