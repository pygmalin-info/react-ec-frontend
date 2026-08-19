import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cartKeys, updateCartItemQuantity } from '@/entities/cart'

export function useUpdateCartItemQuantity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCartItemQuantity,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.all }),
  })
}
