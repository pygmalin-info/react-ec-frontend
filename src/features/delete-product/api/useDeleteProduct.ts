import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteProduct, productKeys, type ProductId } from '@/entities/product'

/**
 * 商品の削除（PDF Q14）。
 *
 * ■ removeQueries と invalidateQueries を使い分けている
 *   削除された商品の詳細キャッシュは、取り直しても 404 になるだけなので捨てる（removeQueries）。
 *   一覧は取り直す（invalidateQueries）。
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: (_result, productId: ProductId) => {
      queryClient.removeQueries({ queryKey: productKeys.detail(productId) })
      return queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}
