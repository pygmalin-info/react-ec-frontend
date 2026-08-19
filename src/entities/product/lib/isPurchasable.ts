import type { Product } from '../model/product'

/**
 * 「買える商品かどうか」の判定。
 *
 * ■ なぜ Product のプロパティにしないのか
 *   在庫や公開状態から導出できる値をデータとして持つと、元の値と食い違う可能性が生まれる。
 *   関数にしておけば、常に最新の product から計算される。
 *
 * ■ なぜ shared ではないのか
 *   「在庫があって公開されていれば買える」は、このECサイトの商品に関する知識だから。
 */
export function isPurchasable(product: Product): boolean {
  return product.isPublished && product.stock > 0
}
