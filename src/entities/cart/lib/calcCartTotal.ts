import type { Cart, CartLine } from '../model/cart'

/** 1行の小計 */
export function calcLineSubtotal(line: CartLine): number {
  return line.product.price * line.quantity
}

export type CartTotal = {
  /** 合計点数。ヘッダのカートバッジに表示する数字 */
  totalQuantity: number
  /** 合計金額（税込・円） */
  totalAmount: number
}

/**
 * カートの合計を求める。
 *
 * ■ なぜサーバーから合計金額をもらわないのか
 *   もらってもよいが、この教材では「同じ数字を2箇所が持たない」ことを優先した。
 *   カートの行データがあれば合計は必ず導出できるので、
 *   合計を別の state やサーバー応答として持つと、行と合計がズレる余地が生まれる。
 *
 * ■ なぜ純粋関数なのか
 *   React にも API にも依存しないので、テストが3行で書ける。
 *   ドメインの計算をコンポーネントの中に書いてしまうと、
 *   画面をレンダリングしないと計算の正しさを確認できなくなる。
 *
 * ■ なぜ shared/lib ではないのか
 *   Cart という、このECサイト固有の概念を知っているから。
 */
export function calcCartTotal(cart: Cart): CartTotal {
  return cart.lines.reduce<CartTotal>(
    (total, line) => ({
      totalQuantity: total.totalQuantity + line.quantity,
      totalAmount: total.totalAmount + calcLineSubtotal(line),
    }),
    { totalQuantity: 0, totalAmount: 0 },
  )
}
