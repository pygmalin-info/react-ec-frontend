import { http, HttpResponse } from 'msw'
import { env } from '@/shared/config/env'
import { db, type MockCartItem } from '../db'
import { currentUser, errorResponse, notFound, unauthorized, validationError } from '../respond'

const base = env.apiBaseUrl

function toCartItemResponse(item: MockCartItem) {
  const product = db.findProduct(item.productId)
  const category = db.categories.find((c) => c.id === product?.categoryId)

  return {
    id: item.id,
    quantity: item.quantity,
    // 商品情報をネストして返す。
    // こうしておかないと、カート画面が商品ごとに GET /products/:id を叩くことになる。
    product: {
      id: product?.id ?? item.productId,
      name: product?.name ?? '（削除された商品）',
      description: product?.description ?? '',
      priceInclTax: product?.priceInclTax ?? 0,
      imagePath: product?.imagePath ?? '/images/placeholder.svg',
      stock: product?.stock ?? 0,
      categoryId: product?.categoryId ?? '',
      categoryName: category?.name ?? '未分類',
      isPublished: product?.isPublished ?? false,
      publishedAt: product?.publishedAt ?? '1970-01-01T00:00:00.000Z',
      updatedAt: product?.updatedAt ?? '1970-01-01T00:00:00.000Z',
    },
  }
}

export const cartHandlers = [
  http.get(`${base}/cart`, ({ request }) => {
    const user = currentUser(request)
    if (user === undefined) return unauthorized()

    // 合計金額も合計点数も返さない。フロント側で導出する。
    return HttpResponse.json({ items: db.listCartItems(user.id).map(toCartItemResponse) })
  }),

  http.post(`${base}/cart/items`, async ({ request }) => {
    const user = currentUser(request)
    if (user === undefined) return unauthorized()

    const body = (await request.json()) as { productId?: unknown; quantity?: unknown }
    const quantity = typeof body.quantity === 'number' ? body.quantity : 1

    if (typeof body.productId !== 'string') {
      return validationError([{ field: 'productId', message: '商品を指定してください' }])
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return validationError([{ field: 'quantity', message: '数量は1以上の整数で入力してください' }])
    }

    const product = db.findProduct(body.productId)
    if (product === undefined) return notFound()

    const alreadyInCart = db.findCartItem(user.id, product.id)?.quantity ?? 0
    if (alreadyInCart + quantity > product.stock) {
      return errorResponse(400, 'OUT_OF_STOCK', `在庫が不足しています（残り ${product.stock - alreadyInCart} 点）。`)
    }

    // 同じ商品なら行を増やさず数量を加算する（PDF Q9）
    const item = db.addCartItem(user.id, product.id, quantity)
    return HttpResponse.json(toCartItemResponse(item), { status: 201 })
  }),

  http.patch(`${base}/cart/items/:cartItemId`, async ({ request, params }) => {
    const user = currentUser(request)
    if (user === undefined) return unauthorized()

    const item = db.findCartItemById(user.id, String(params.cartItemId))
    if (item === undefined) return notFound()

    const body = (await request.json()) as { quantity?: unknown }
    const quantity = body.quantity
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) {
      return validationError([{ field: 'quantity', message: '数量は1以上の整数で入力してください' }])
    }

    const product = db.findProduct(item.productId)
    if (product && quantity > product.stock) {
      return errorResponse(400, 'OUT_OF_STOCK', `在庫が不足しています（残り ${product.stock} 点）。`)
    }

    return HttpResponse.json(toCartItemResponse(db.updateCartItemQuantity(item, quantity)))
  }),

  http.delete(`${base}/cart/items/:cartItemId`, ({ request, params }) => {
    const user = currentUser(request)
    if (user === undefined) return unauthorized()

    const item = db.findCartItemById(user.id, String(params.cartItemId))
    if (item === undefined) return notFound()

    db.removeCartItem(item.id)
    return new HttpResponse(null, { status: 204 })
  }),
]
