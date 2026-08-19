declare const productIdBrand: unique symbol

/**
 * 商品ID専用の型。
 *
 * ■ なぜただの string にしないのか
 *   `fetchProduct(userId)` のような取り違えを、実行するまで気付けないのは危険。
 *   ブランド型にしておくと、string をそのまま渡した時点でコンパイルエラーになる。
 *
 * ■ なぜ全部の ID をブランド型にしないのか
 *   取り違えが起きうる組み合わせにだけ意味がある。
 *   このアプリでは ProductId と CartItemId が URL・API 両方に登場して紛らわしいので、
 *   その2つだけに導入している。「型を増やすこと」自体が目的ではない。
 */
export type ProductId = string & { readonly [productIdBrand]: true }

/** URL パラメータや API レスポンスの string を ProductId に変換する境界 */
export function toProductId(value: string): ProductId {
  return value as ProductId
}

/**
 * フロントエンドが扱う商品。
 *
 * バックエンドの ProductResponse とは別物であることが重要。
 * 対応関係は entities/product/api/productApi.ts の toProduct() を読むと分かる。
 */
export type Product = {
  id: ProductId
  name: string
  description: string
  /** 税込・円 */
  price: number
  /** そのまま <img src> に渡せる絶対URL */
  imageUrl: string
  stock: number
  /**
   * 商品に紐づくカテゴリの要約。
   * カテゴリの一覧そのものは entities/category が持っている。
   * ここで entities/category の型を import しないのは、entity 同士を結合させないため。
   */
  category: { id: string; name: string }
  isPublished: boolean
  publishedAt: Date
}
