import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cartKeys, removeCartItem } from '@/entities/cart'

export function useRemoveFromCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeCartItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.all }),
  })
}
