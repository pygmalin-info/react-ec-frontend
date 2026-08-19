import { useQuery } from '@tanstack/react-query'
import type { ProductId } from '../model/product'
import { fetchProduct, fetchProducts, type ProductListParams } from './productApi'

/**
 * Query Key を1箇所で組み立てる。
 *
 * ■ なぜ文字列を直接書かないのか
 *   invalidateQueries に渡すキーと、useQuery に渡すキーがズレると、
 *   「更新したのに画面が変わらない」という最も原因を追いにくいバグになる。
 *   キーの作り方を1箇所に集めることで、そのズレが起きないようにしている。
 *
 * ■ 階層構造にしている理由
 *   productKeys.all を invalidate すれば一覧も詳細もまとめて無効化できる。
 *   一覧だけ無効化したいときは productKeys.lists() を使う、という使い分けができる。
 */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params: ProductListParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (productId: ProductId) => [...productKeys.details(), productId] as const,
}

/**
 * ■ なぜ useQuery をそのままコンポーネントに書かずに hook にしたのか
 *   商品一覧は「一覧画面」と「管理者の商品一覧画面」の2箇所で使う。
 *   キーと取得関数の組み合わせを覚えておく場所が2箇所あると必ずズレる。
 *   逆に、1箇所でしか使わない取得まで機械的に hook にはしていない。
 */
export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => fetchProducts(params),
  })
}

export function useProduct(productId: ProductId) {
  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => fetchProduct(productId),
  })
}
