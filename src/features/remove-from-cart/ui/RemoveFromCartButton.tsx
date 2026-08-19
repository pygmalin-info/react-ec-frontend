import type { CartItemId } from '@/entities/cart'
import { ApiErrorMessage } from '@/shared/ui/ApiErrorMessage'
import { Button } from '@/shared/ui/Button'
import { useRemoveFromCart } from '../api/useRemoveFromCart'

type RemoveFromCartButtonProps = {
  cartItemId: CartItemId
  productName: string
}

export function RemoveFromCartButton({ cartItemId, productName }: RemoveFromCartButtonProps) {
  const removeFromCart = useRemoveFromCart()

  return (
    <div>
      <Button
        variant="secondary"
        isLoading={removeFromCart.isPending}
        onClick={() => removeFromCart.mutate(cartItemId)}
        aria-label={`${productName}をカートから削除`}
      >
        削除
      </Button>

      {removeFromCart.error ? <ApiErrorMessage error={removeFromCart.error} /> : null}
    </div>
  )
}
