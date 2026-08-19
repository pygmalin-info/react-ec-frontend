import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productKeys, updateProduct, type Product, type ProductId, type ProductInput } from '@/entities/product'

/**
 * 商品の編集（PDF Q13）。
 *
 * ■ 更新後のキャッシュの扱いを2種類使い分けている
 *   - 詳細（productKeys.detail）: setQueryData
 *       更新のレスポンスに最新の商品がそのまま入っているので、取り直す必要がない。
 *   - 一覧（productKeys.lists）: invalidateQueries
 *       一覧は検索条件やページによって複数のキャッシュがあり、
 *       どのページにこの商品が現れるかはサーバーしか知らない。だから取り直す。
 *
 *   「レスポンスで確定できるものは setQueryData、確定できないものは invalidate」
 *   が判断基準になる。
 */
export function useUpdateProduct(productId: ProductId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ProductInput) => updateProduct(productId, input),
    onSuccess: (updated: Product) => {
      queryClient.setQueryData(productKeys.detail(productId), updated)
      return queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}
