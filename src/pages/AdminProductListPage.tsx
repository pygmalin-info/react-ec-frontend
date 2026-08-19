import { Link } from 'react-router-dom'
import { useProducts } from '@/entities/product'
import { DeleteProductButton } from '@/features/delete-product'
import { routes } from '@/shared/config/routes'
import { formatYen } from '@/shared/lib/format'
import { ApiErrorMessage } from '@/shared/ui/ApiErrorMessage'

/**
 * 管理者の商品一覧。
 *
 * ■ 利用者向けの一覧（ProductListPage）と同じ useProducts を使っている
 *   取得の仕方が同じなら、同じ hook を使う。
 *   違うのは「表示の仕方」と「並んでいる操作」だけなので、そこだけ別に書く。
 *   ページごとに取得処理をコピーすると、キーの付け方が少しずつズレていく。
 */
export function AdminProductListPage() {
  const productsQuery = useProducts({})

  return (
    <>
      <h1>商品管理</h1>

      <p>
        <Link to={routes.admin.productNew}>新規登録</Link>
      </p>

      {productsQuery.isPending ? <p className="status-text">読み込み中…</p> : null}

      {productsQuery.isError ? (
        <ApiErrorMessage error={productsQuery.error} onRetry={() => void productsQuery.refetch()} />
      ) : null}

      {productsQuery.isSuccess && productsQuery.data.items.length === 0 ? (
        <p className="empty-state">商品が登録されていません。</p>
      ) : null}

      {productsQuery.isSuccess && productsQuery.data.items.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>商品名</th>
              <th>カテゴリ</th>
              <th>価格</th>
              <th>在庫</th>
              <th>公開</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {productsQuery.data.items.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.category.name}</td>
                <td>{formatYen(product.price)}</td>
                <td>{product.stock}</td>
                <td>{product.isPublished ? '公開' : '非公開'}</td>
                <td>
                  <Link to={routes.admin.productEdit(product.id)}>編集</Link>{' '}
                  <DeleteProductButton productId={product.id} productName={product.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </>
  )
}
