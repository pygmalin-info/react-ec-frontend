import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useCartItemCount } from '@/entities/cart'
import { toProductId } from '@/entities/product'
import { renderWithProviders } from '@/test/renderWithProviders'
import { signInAsUser } from '@/test/auth'
import { AddToCartButton } from './AddToCartButton'

/**
 * ヘッダのカートバッジの代わり。
 * AddToCartButton とは親子関係になく、props も Context も共有していない。
 * 共有しているのは queryKey（＝Query Cache）だけ。
 */
function CartBadgeProbe() {
  const cartItemCount = useCartItemCount()
  return <span data-testid="cart-count">{cartItemCount.data ?? 0}</span>
}

describe('AddToCartButton', () => {
  it('カートに追加すると、離れた場所にあるカート個数の表示も更新される', async () => {
    signInAsUser()

    renderWithProviders(
      <>
        <CartBadgeProbe />
        <AddToCartButton productId={toProductId('p_01')} />
      </>,
    )

    await waitFor(() => expect(screen.getByTestId('cart-count')).toHaveTextContent('0'))

    await userEvent.click(screen.getByRole('button', { name: 'カートに追加' }))

    // ボタンは「カートを追加した」としか言っていない。
    // それでもバッジが更新されるのは、useAddToCart の onSuccess が
    // cartKeys.all を invalidate し、同じキーを見ている useCartItemCount が取り直すから。
    await waitFor(() => expect(screen.getByTestId('cart-count')).toHaveTextContent('1'))
  })

  it('同じ商品をもう一度追加しても行は増えず、個数だけが増える（サーバー側で集約）', async () => {
    signInAsUser()

    renderWithProviders(
      <>
        <CartBadgeProbe />
        <AddToCartButton productId={toProductId('p_01')} />
      </>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'カートに追加' }))
    await waitFor(() => expect(screen.getByTestId('cart-count')).toHaveTextContent('1'))

    await userEvent.click(screen.getByRole('button', { name: 'カートに追加' }))
    await waitFor(() => expect(screen.getByTestId('cart-count')).toHaveTextContent('2'))
  })

  it('在庫切れの商品を追加しようとすると、業務エラーが表示される', async () => {
    signInAsUser()

    // p_03 は在庫0の商品（src/mocks/db.ts 参照）
    renderWithProviders(<AddToCartButton productId={toProductId('p_03')} />)

    await userEvent.click(screen.getByRole('button', { name: 'カートに追加' }))

    expect(await screen.findByText(/在庫が不足しています/)).toBeInTheDocument()
  })

  it('未ログインで追加すると、認証エラーが表示される', async () => {
    renderWithProviders(<AddToCartButton productId={toProductId('p_01')} />)

    await userEvent.click(screen.getByRole('button', { name: 'カートに追加' }))

    expect(await screen.findByText('ログイン画面へ')).toBeInTheDocument()
  })
})
