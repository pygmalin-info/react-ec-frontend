import { httpClient } from '@/shared/api/httpClient'
import { toProduct, type ProductId, type ProductResponse } from '@/entities/product'
import { toCartItemId, type Cart, type CartLine } from '../model/cart'

type CartItemResponse = {
  id: string
  quantity: number
  /** 商品情報がネストして返ってくる。カート画面が商品を個別に取りに行かなくて済む */
  product: ProductResponse
}

type CartResponse = {
  items: CartItemResponse[]
}

/**
 * CartResponse → Cart の変換。
 *
 * ネストした product には、商品側の Mapper（toProduct）をそのまま使う。
 * Mapper が小さな関数になっていると、こうして組み合わせられる。
 */
export function toCart(response: CartResponse): Cart {
  return {
    lines: response.items.map(
      (item): CartLine => ({
        id: toCartItemId(item.id),
        product: toProduct(item.product),
        quantity: item.quantity,
      }),
    ),
  }
}

export async function fetchCart(): Promise<Cart> {
  const { data } = await httpClient.get<CartResponse>('/cart')
  return toCart(data)
}

/**
 * カートに商品を追加する。
 *
 * 同じ商品が既に入っている場合に数量を加算するのはサーバー側の責務。
 * フロントは「追加した」とだけ伝え、結果はカートを取り直して知る。
 */
export async function addCartItem(params: { productId: ProductId; quantity: number }): Promise<void> {
  await httpClient.post('/cart/items', { productId: params.productId, quantity: params.quantity })
}

export async function updateCartItemQuantity(params: { cartItemId: string; quantity: number }): Promise<void> {
  await httpClient.patch(`/cart/items/${params.cartItemId}`, { quantity: params.quantity })
}

export async function removeCartItem(cartItemId: string): Promise<void> {
  await httpClient.delete(`/cart/items/${cartItemId}`)
}
