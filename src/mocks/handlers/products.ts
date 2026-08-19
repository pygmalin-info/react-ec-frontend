import { http, HttpResponse } from 'msw'
import { env } from '@/shared/config/env'
import { db, type MockProduct } from '../db'
import { currentUser, errorResponse, forbidden, notFound, unauthorized, validationError } from '../respond'

const base = env.apiBaseUrl

type ProductRequestBody = {
  name?: unknown
  description?: unknown
  priceInclTax?: unknown
  stock?: unknown
  categoryId?: unknown
  imagePath?: unknown
  isPublished?: unknown
}

function toProductResponse(item: MockProduct) {
  const category = db.categories.find((c) => c.id === item.categoryId)
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    priceInclTax: item.priceInclTax,
    imagePath: item.imagePath,
    stock: item.stock,
    categoryId: item.categoryId,
    categoryName: category?.name ?? '未分類',
    isPublished: item.isPublished,
    publishedAt: item.publishedAt,
    updatedAt: item.updatedAt,
  }
}

/** サーバー側バリデーション。フロントの Zod と同じ制約を「最後の砦」として持つ */
function validate(body: ProductRequestBody) {
  const fieldErrors: { field: string; message: string }[] = []

  if (typeof body.name !== 'string' || body.name.trim().length === 0) {
    fieldErrors.push({ field: 'name', message: '商品名は必須です' })
  } else if (body.name.length > 100) {
    fieldErrors.push({ field: 'name', message: '商品名は100文字以内で入力してください' })
  }

  if (typeof body.description === 'string' && body.description.length > 1000) {
    fieldErrors.push({ field: 'description', message: '説明は1000文字以内で入力してください' })
  }

  if (typeof body.priceInclTax !== 'number' || !Number.isInteger(body.priceInclTax) || body.priceInclTax < 0) {
    fieldErrors.push({ field: 'price', message: '価格は0以上の整数で入力してください' })
  }

  if (typeof body.stock !== 'number' || !Number.isInteger(body.stock) || body.stock < 0) {
    fieldErrors.push({ field: 'stock', message: '在庫数は0以上の整数で入力してください' })
  }

  if (typeof body.categoryId !== 'string' || !db.categories.some((c) => c.id === body.categoryId)) {
    fieldErrors.push({ field: 'categoryId', message: 'カテゴリを選択してください' })
  }

  return fieldErrors
}

function toMockInput(
  body: ProductRequestBody,
  currentImagePath?: string,
): Omit<MockProduct, 'id' | 'publishedAt' | 'updatedAt'> {
  return {
    name: body.name as string,
    description: typeof body.description === 'string' ? body.description : '',
    priceInclTax: body.priceInclTax as number,
    stock: body.stock as number,
    categoryId: body.categoryId as string,
    // 画像アップロードはこの教材の対象外。更新時は既存の画像を維持する
    imagePath: currentImagePath ?? '/images/placeholder.svg',
    isPublished: body.isPublished !== false,
  }
}

/** 管理者専用エンドポイントの共通ガード */
function requireAdmin(request: Request) {
  const user = currentUser(request)
  if (user === undefined) return unauthorized()
  if (user.role !== 'ADMIN') return forbidden()
  return null
}

export const productHandlers = [
  http.get(`${base}/products`, ({ request }) => {
    const url = new URL(request.url)
    const keyword = url.searchParams.get('keyword')?.trim() ?? ''
    const page = Number(url.searchParams.get('page') ?? '1')
    const size = Number(url.searchParams.get('size') ?? '20')

    const filtered = keyword ? db.products.filter((item) => item.name.includes(keyword)) : db.products

    const start = (page - 1) * size
    return HttpResponse.json({
      items: filtered.slice(start, start + size).map(toProductResponse),
      page,
      size,
      totalCount: filtered.length,
    })
  }),

  http.get(`${base}/products/:productId`, ({ params }) => {
    const product = db.findProduct(String(params.productId))
    if (product === undefined) return notFound()

    return HttpResponse.json(toProductResponse(product))
  }),

  http.post(`${base}/products`, async ({ request }) => {
    const denied = requireAdmin(request)
    if (denied) return denied

    const body = (await request.json()) as ProductRequestBody
    const fieldErrors = validate(body)
    if (fieldErrors.length > 0) return validationError(fieldErrors)

    return HttpResponse.json(toProductResponse(db.createProduct(toMockInput(body))), { status: 201 })
  }),

  http.put(`${base}/products/:productId`, async ({ request, params }) => {
    const denied = requireAdmin(request)
    if (denied) return denied

    const body = (await request.json()) as ProductRequestBody
    const fieldErrors = validate(body)
    if (fieldErrors.length > 0) return validationError(fieldErrors)

    const current = db.findProduct(String(params.productId))
    if (current === undefined) return notFound()

    const updated = db.updateProduct(String(params.productId), toMockInput(body, current.imagePath))
    if (updated === undefined) return notFound()

    return HttpResponse.json(toProductResponse(updated))
  }),

  http.delete(`${base}/products/:productId`, ({ request, params }) => {
    const denied = requireAdmin(request)
    if (denied) return denied

    const productId = String(params.productId)
    if (db.findProduct(productId) === undefined) return notFound()

    // 入力フォームが無いのにエラーが起きる例。
    // フィールドに紐付かない「業務エラー」をどう画面に出すかが読みどころ。
    if (db.isProductInAnyCart(productId)) {
      return errorResponse(409, 'PRODUCT_IN_CART', 'カートに入っている商品は削除できません。')
    }

    db.deleteProduct(productId)
    return new HttpResponse(null, { status: 204 })
  }),
]
