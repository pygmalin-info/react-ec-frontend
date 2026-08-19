import { useParams } from 'react-router-dom'
import { toProductId, useProduct } from '@/entities/product'
import { ProductEditForm } from '@/features/update-product'
import { ApiErrorMessage } from '@/shared/ui/ApiErrorMessage'

/**
 * 商品編集（PDF Q13）。
 *
 * ■ 取得はページ、編集は feature
 *   「読み込み中」「見つからない」の分岐をページ側で片付けてから、
 *   取得できた Product だけを ProductEditForm に渡している。
 *   こうするとフォーム側は「商品は必ず存在する」前提で書けて、中身が単純になる。
 */
export function AdminProductEditPage() {
  const params = useParams<{ productId: string }>()
  const productQuery = useProduct(toProductId(params.productId ?? ''))

  if (productQuery.isPending) return <p className="status-text">読み込み中…</p>

  if (productQuery.isError) {
    return <ApiErrorMessage error={productQuery.error} onRetry={() => void productQuery.refetch()} />
  }

  return (
    <>
      <h1>商品の編集</h1>
      {/* key を付けて、別の商品に切り替わったときにフォームの初期値を作り直す */}
      <ProductEditForm key={productQuery.data.id} product={productQuery.data} />
    </>
  )
}
