import { useState } from 'react'
import { ProductCard, isPurchasable, useProducts } from '@/entities/product'
import { AddToCartButton } from '@/features/add-to-cart'
import { useAuthToken } from '@/shared/api/useAuthToken'
import { ApiErrorMessage } from '@/shared/ui/ApiErrorMessage'
import { TextField } from '@/shared/ui/fields'

/**
 * 商品一覧（PDF Q4）。
 *
 * ■ このページが持っている state は1つだけ
 *   検索キーワード。これは「利用者が今どう絞り込んでいるか」という
 *   サーバーが知らない情報なので Client State。
 *   一方、検索結果は Server State なので useProducts が持つ。
 *   キーワードが変わると queryKey が変わり、TanStack Query が自動で取り直す。
 *
 * ■ 3つの状態を明示的に分けている理由
 *   - 読み込み中     : まだ分からない
 *   - エラー         : 取得できなかった
 *   - 0件            : 取得できたが、該当が無い
 *   「エラー」と「0件」を同じ扱いにすると、
 *   通信が失敗したのに「商品がありません」と表示してしまう。
 */
export function ProductListPage() {
  const [keyword, setKeyword] = useState('')
  const productsQuery = useProducts({ keyword })
  const isSignedIn = useAuthToken() !== null

  return (
    <>
      <h1>商品一覧</h1>

      <TextField
        label="商品名で検索"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder="例: マグカップ"
      />

      {productsQuery.isPending ? <p className="status-text">読み込み中…</p> : null}

      {productsQuery.isError ? (
        <ApiErrorMessage error={productsQuery.error} onRetry={() => void productsQuery.refetch()} />
      ) : null}

      {productsQuery.isSuccess && productsQuery.data.items.length === 0 ? (
        <p className="empty-state">該当する商品がありません。</p>
      ) : null}

      {productsQuery.isSuccess && productsQuery.data.items.length > 0 ? (
        <ul className="product-grid">
          {productsQuery.data.items.map((product) => (
            <li key={product.id}>
              <ProductCard
                product={product}
                /*
                  カート追加ボタンは ProductCard の中には無い。
                  「商品の見た目」（entity）と「商品に対する操作」（feature）を分けているため、
                  ここで差し込んでいる。
                  未ログインのときは表示しない（押しても 401 になるだけなので）。
                */
                action={
                  isSignedIn ? (
                    <AddToCartButton productId={product.id} disabled={!isPurchasable(product)} />
                  ) : undefined
                }
              />
            </li>
          ))}
        </ul>
      ) : null}
    </>
  )
}
