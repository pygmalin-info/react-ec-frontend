import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProduct, productKeys } from '@/entities/product'

/**
 * 商品の新規登録（PDF Q12）。
 *
 * ■ なぜ productKeys.lists() だけを invalidate するのか
 *   新しく作った商品の詳細キャッシュはまだ存在しないので、詳細を無効化する意味がない。
 *   productKeys.all を無効化すると、開いている商品詳細まで再取得が走る。
 *   「何が古くなったのか」を正確に宣言することが、無駄な通信を防ぐ。
 */
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.lists() }),
  })
}
