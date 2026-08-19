import { useParams } from 'react-router-dom'
import { isPurchasable, toProductId, useProduct } from '@/entities/product'
import { AddToCartButton } from '@/features/add-to-cart'
import { useAuthToken } from '@/shared/api/useAuthToken'
import { formatYen } from '@/shared/lib/format'
import { ApiErrorMessage } from '@/shared/ui/ApiErrorMessage'

/**
 * 商品詳細（PDF Q6 / Q7）。
 *
 * ■ URL パラメータの扱い
 *   useParams が返すのは string | undefined。
 *   それを toProductId で ProductId に変換してから使う。
 *   この1行が「外から来た文字列」と「アプリが信頼する ID」の境界になっている。
 */
export function ProductDetailPage() {
  const params = useParams<{ productId: string }>()
  const productQuery = useProduct(toProductId(params.productId ?? ''))
  const isSignedIn = useAuthToken() !== null

  if (productQuery.isPending) return <p className="status-text">読み込み中…</p>

  if (productQuery.isError) {
    return <ApiErrorMessage error={productQuery.error} onRetry={() => void productQuery.refetch()} />
  }

  const product = productQuery.data

  return (
    <article>
      <img className="product-card__image" src={product.imageUrl} alt="" style={{ maxWidth: 360 }} />
      <h1>{product.name}</h1>
      <p className="product-card__meta">{product.category.name}</p>
      <p className="product-card__price">{formatYen(product.price)}</p>
      <p>{product.description}</p>
      <p className="product-card__meta">在庫: {product.stock} 点</p>

      {isSignedIn ? (
        <AddToCartButton productId={product.id} disabled={!isPurchasable(product)} />
      ) : (
        <p className="status-text">カートに追加するにはログインしてください。</p>
      )}
    </article>
  )
}
