/**
 * バグ改修演習で仕込むバグの定義。
 *
 * 使い方は npm run bug -- help を参照。
 * 症状・ヒント・ねらいは docs/DEBUG_EXERCISES.md に、解答は docs/DEBUG_ANSWERS.md にあります。
 *
 * ここに書いてある `from` / `to` は「答え」そのものなので、
 * 研修生はこのファイルを開かずに取り組んでください。
 */

export const bugs = [
  {
    id: '01',
    level: 1,
    title: 'カートに追加してもヘッダの数字が増えない',
    changes: [
      {
        file: 'src/features/add-to-cart/api/useAddToCart.ts',
        from: `    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.all }),`,
        to: `    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...cartKeys.all, 'items'] }),`,
      },
    ],
  },

  {
    id: '02',
    level: 1,
    title: '商品を削除しても一覧から消えない',
    changes: [
      {
        file: 'src/features/delete-product/api/useDeleteProduct.ts',
        from: `      queryClient.removeQueries({ queryKey: productKeys.detail(productId) })
      return queryClient.invalidateQueries({ queryKey: productKeys.lists() })`,
        to: `      queryClient.removeQueries({ queryKey: productKeys.detail(productId) })`,
      },
    ],
  },

  {
    id: '03',
    level: 1,
    title: 'カテゴリ名が「c_01」のように表示される',
    changes: [
      {
        file: 'src/entities/product/api/productApi.ts',
        from: `    category: { id: response.categoryId, name: response.categoryName },`,
        to: `    category: { id: response.categoryId, name: response.categoryId },`,
      },
    ],
  },

  {
    id: '04',
    level: 1,
    title: 'ヘッダのカート数が常に 0 のまま',
    changes: [
      {
        file: 'src/app/layouts/ShopLayout.tsx',
        from: `import { Link, Outlet } from 'react-router-dom'`,
        to: `import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'`,
      },
      {
        file: 'src/app/layouts/ShopLayout.tsx',
        from: `  const isSignedIn = token !== null`,
        to: `  const [cartItemCount] = useState(cartItemCountQuery.data ?? 0)

  const isSignedIn = token !== null`,
      },
      {
        file: 'src/app/layouts/ShopLayout.tsx',
        from: `              {cartItemCountQuery.data !== undefined && cartItemCountQuery.data > 0 ? (
                <span className="cart-badge" aria-label={\`カートに\${cartItemCountQuery.data}点\`}>
                  {cartItemCountQuery.data}
                </span>
              ) : null}`,
        to: `              {cartItemCount > 0 ? (
                <span className="cart-badge" aria-label={\`カートに\${cartItemCount}点\`}>
                  {cartItemCount}
                </span>
              ) : null}`,
      },
    ],
  },

  {
    id: '05',
    level: 2,
    title: '通信に失敗したのに「該当する商品がありません」と表示される',
    changes: [
      {
        file: 'src/pages/ProductListPage.tsx',
        from: `      {productsQuery.isSuccess && productsQuery.data.items.length === 0 ? (`,
        to: `      {!productsQuery.isPending && (productsQuery.data?.items.length ?? 0) === 0 ? (`,
      },
    ],
  },

  {
    id: '06',
    level: 2,
    title: '正しい価格を入力しているのに、サーバーに弾かれて商品を登録できない',
    changes: [
      {
        file: 'src/entities/product/model/productFields.ts',
        from: `    .transform(Number)
    .refine((value) => value <= max, \`\${label}は\${max.toLocaleString('ja-JP')}以下で入力してください\`)`,
        to: `    .refine((value) => Number(value) <= max, \`\${label}は\${max.toLocaleString('ja-JP')}以下で入力してください\`)`,
      },
    ],
  },

  {
    id: '07',
    level: 2,
    title: '会員登録でメールアドレスが重複しても、画面に何も表示されない',
    changes: [
      {
        file: 'src/features/sign-up/ui/SignUpForm.tsx',
        from: `import { applyServerFieldErrors } from '@/shared/lib/applyServerFieldErrors'
import { ApiErrorMessage } from '@/shared/ui/ApiErrorMessage'`,
        to: `import { ApiErrorMessage } from '@/shared/ui/ApiErrorMessage'`,
      },
      {
        file: 'src/features/sign-up/ui/SignUpForm.tsx',
        from: `      onError: (error) => applyServerFieldErrors(setError, error),`,
        to: `      onError: (error) => setError('root', { message: error.message }),`,
      },
    ],
  },

  {
    id: '08',
    level: 2,
    title: 'ログアウトを押してもヘッダが変わらず、カートを開くと突然ログイン画面に飛ぶ',
    changes: [
      {
        file: 'src/features/sign-out/api/useSignOut.ts',
        from: `import { authToken } from '@/shared/api/authToken'
import { signOut } from '@/entities/user'`,
        to: `import { signOut } from '@/entities/user'`,
      },
      {
        file: 'src/features/sign-out/api/useSignOut.ts',
        from: `    onSettled: () => {
      authToken.clear()
      queryClient.clear()
    },`,
        to: `    onSettled: () => {
      queryClient.clear()
    },`,
      },
    ],
  },

  {
    id: '09',
    level: 3,
    title: '別のアカウントでログインすると、前のユーザーのカートや商品一覧が表示される',
    changes: [
      {
        file: 'src/features/sign-out/api/useSignOut.ts',
        from: `      queryClient.clear()`,
        to: `      void queryClient.cancelQueries()`,
      },
    ],
  },

  {
    id: '10',
    level: 3,
    title: 'localStorage のトークンを書き換えると、エラーが出続けてログイン画面に戻れない',
    changes: [
      {
        file: 'src/shared/api/httpClient.ts',
        from: `    if (apiError.kind === 'unauthorized' && apiError.code !== 'INVALID_CREDENTIALS') {
      authToken.clear()`,
        to: `    if (apiError.kind === 'unauthorized' && apiError.code !== 'INVALID_CREDENTIALS') {
      console.warn('認証エラーが発生しました')`,
      },
    ],
  },

  {
    id: '11',
    level: 3,
    title: '未ログインで管理画面のURLを直接開くと「読み込み中…」から進まない',
    changes: [
      {
        file: 'src/app/router/AppRouter.tsx',
        from: `          <RequireAuth>
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          </RequireAuth>`,
        to: `          <RequireAdmin>
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          </RequireAdmin>`,
      },
    ],
  },

  {
    id: '12',
    level: 3,
    title: '在庫を超える数量を選ぶとエラーが出るのに、選択された数字は変わったまま',
    changes: [
      {
        file: 'src/features/update-cart-item-quantity/ui/CartItemQuantitySelect.tsx',
        from: `import type { CartItemId } from '@/entities/cart'`,
        to: `import { useState } from 'react'
import type { CartItemId } from '@/entities/cart'`,
      },
      {
        file: 'src/features/update-cart-item-quantity/ui/CartItemQuantitySelect.tsx',
        from: `  const updateQuantity = useUpdateCartItemQuantity()`,
        to: `  const [selected, setSelected] = useState(quantity)
  const updateQuantity = useUpdateCartItemQuantity()`,
      },
      {
        file: 'src/features/update-cart-item-quantity/ui/CartItemQuantitySelect.tsx',
        from: `          value={quantity}`,
        to: `          value={selected}`,
      },
      {
        file: 'src/features/update-cart-item-quantity/ui/CartItemQuantitySelect.tsx',
        from: `            updateQuantity.mutate({ cartItemId, quantity: Number(event.target.value) })`,
        to: `            setSelected(Number(event.target.value))
            updateQuantity.mutate({ cartItemId, quantity: Number(event.target.value) })`,
      },
    ],
  },
]
