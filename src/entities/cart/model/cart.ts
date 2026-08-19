import type { Product } from '@/entities/product'

declare const cartItemIdBrand: unique symbol

/** カート行のID。商品IDとは別物なので、取り違えを型で防ぐ */
export type CartItemId = string & { readonly [cartItemIdBrand]: true }

export function toCartItemId(value: string): CartItemId {
  return value as CartItemId
}

/**
 * カートの1行。
 *
 * ■ なぜ entities/cart が entities/product を import しているのか
 *   ESLint では原則として entity 同士の参照を禁止している。
 *   ただし「カートは商品を含む」というのはこのECサイトのドメインそのもので、
 *   これを避けようとすると Product の項目をカート側に写した劣化コピーが生まれる。
 *   そこで cart → product の1方向だけを、eslint.config.js で明示的に許可している。
 *   逆方向（product → cart）は許可していない。商品はカートを知らなくてよいから。
 *
 * ■ 小計をプロパティに持たない理由
 *   price × quantity で常に導出できる値をデータとして持つと、
 *   数量を変えたときに更新し忘れた小計が残る。導出は lib/calcCartTotal.ts の関数で行う。
 */
export type CartLine = {
  id: CartItemId
  product: Product
  quantity: number
}

export type Cart = {
  lines: CartLine[]
}
