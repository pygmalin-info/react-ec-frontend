import { httpClient } from '@/shared/api/httpClient'
import { toProductId, type Product, type ProductId } from '../model/product'
import type { ProductInput } from '../model/productFields'

/**
 * バックエンドが返す商品の形。
 *
 * ■ なぜ Product と別に定義するのか
 *   この型は「バックエンドの都合」で決まっていて、こちらから変えられない。
 *   画面が直接この形に依存すると、バックエンドの命名変更が全画面に波及する。
 *   ここで受け止めて Product に変換しておけば、影響範囲はこのファイルだけになる。
 */
export type ProductResponse = {
  id: string
  name: string
  description: string
  priceInclTax: number
  imagePath: string
  stock: number
  categoryId: string
  categoryName: string
  isPublished: boolean
  publishedAt: string
  updatedAt: string
}

type ProductListResponse = {
  items: ProductResponse[]
  page: number
  size: number
  totalCount: number
}

/**
 * ProductResponse → Product の変換。
 *
 * 変換しているのは、そうする理由があるものだけ:
 *   - imagePath（相対）→ imageUrl（絶対）  … <img src> にそのまま渡せるようにする
 *   - categoryId + categoryName → category  … 2つのフラットな項目を1つのまとまりにする
 *   - publishedAt（文字列）→ Date            … 画面で日付として扱えるようにする
 *   - priceInclTax → price                  … バックエンド都合の名前をフロントの言葉にする
 * stock や isPublished はそのまま。「全部変換する」のは目的ではない。
 */
export function toProduct(response: ProductResponse): Product {
  return {
    id: toProductId(response.id),
    name: response.name,
    description: response.description,
    price: response.priceInclTax,
    imageUrl: new URL(response.imagePath, window.location.origin).toString(),
    stock: response.stock,
    category: { id: response.categoryId, name: response.categoryName },
    isPublished: response.isPublished,
    publishedAt: new Date(response.publishedAt),
  }
}

/** ProductInput → 送信ボディ。項目名がフロントとバックエンドで違うのでここで合わせる */
function toRequestBody(input: ProductInput) {
  return {
    name: input.name,
    description: input.description,
    priceInclTax: input.price,
    stock: input.stock,
    categoryId: input.categoryId,
    isPublished: input.isPublished,
  }
}

export type ProductListParams = {
  keyword?: string
  page?: number
}

export type ProductList = {
  items: Product[]
  totalCount: number
}

export async function fetchProducts(params: ProductListParams): Promise<ProductList> {
  const { data } = await httpClient.get<ProductListResponse>('/products', {
    params: { keyword: params.keyword || undefined, page: params.page ?? 1 },
  })
  return { items: data.items.map(toProduct), totalCount: data.totalCount }
}

export async function fetchProduct(productId: ProductId): Promise<Product> {
  const { data } = await httpClient.get<ProductResponse>(`/products/${productId}`)
  return toProduct(data)
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data } = await httpClient.post<ProductResponse>('/products', toRequestBody(input))
  return toProduct(data)
}

export async function updateProduct(productId: ProductId, input: ProductInput): Promise<Product> {
  const { data } = await httpClient.put<ProductResponse>(`/products/${productId}`, toRequestBody(input))
  return toProduct(data)
}

export async function deleteProduct(productId: ProductId): Promise<void> {
  await httpClient.delete(`/products/${productId}`)
}
