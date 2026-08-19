import type { Product } from '../model/product'
import type { ProductFormValues } from '../model/productFields'

/**
 * Product → フォームの初期値。
 *
 * ■ なぜ変換が必要なのか
 *   Product の price / stock は number、フォームの値は string。
 *   <input> は文字列しか扱えないので、ここで型が変わる。
 *   （逆方向の string → number は productWritableSchema の transform が担当している）
 *
 * ■ なぜ features ではなく entities にあるのか
 *   商品の項目とフォーム項目の対応関係は、新規登録でも編集でも同じ。
 *   実際に使うのは編集フォームだけだが、
 *   「商品をフォームの形にする」という知識は商品側にあるほうが自然。
 */
export function toProductFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    description: product.description,
    price: String(product.price),
    stock: String(product.stock),
    categoryId: product.category.id,
    isPublished: product.isPublished,
  }
}
