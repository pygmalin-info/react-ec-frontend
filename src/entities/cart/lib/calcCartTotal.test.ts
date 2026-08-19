import { describe, expect, it } from 'vitest'
import type { Product, ProductId } from '@/entities/product'
import type { Cart, CartItemId } from '../model/cart'
import { calcCartTotal, calcLineSubtotal } from './calcCartTotal'

function product(price: number): Product {
  return {
    id: 'p_01' as ProductId,
    name: 'テスト商品',
    description: '',
    price,
    imageUrl: 'http://localhost/images/p_01.svg',
    stock: 10,
    category: { id: 'c_01', name: 'テスト' },
    isPublished: true,
    publishedAt: new Date('2026-01-01'),
  }
}

function cart(lines: { price: number; quantity: number }[]): Cart {
  return {
    lines: lines.map((line, index) => ({
      id: `ci_${index}` as CartItemId,
      product: product(line.price),
      quantity: line.quantity,
    })),
  }
}

/**
 * ドメインの計算は純粋関数にしてあるので、React も API も使わずに検証できる。
 * これが「合計金額をコンポーネントの中で計算しない」ことの実利。
 */
describe('calcCartTotal', () => {
  it('空のカートは0点・0円', () => {
    expect(calcCartTotal(cart([]))).toEqual({ totalQuantity: 0, totalAmount: 0 })
  })

  it('数量を掛けた金額を合計する', () => {
    expect(calcCartTotal(cart([{ price: 1980, quantity: 2 }]))).toEqual({
      totalQuantity: 2,
      totalAmount: 3960,
    })
  })

  it('複数行を合算する', () => {
    const total = calcCartTotal(
      cart([
        { price: 1980, quantity: 2 },
        { price: 680, quantity: 3 },
      ]),
    )

    expect(total).toEqual({ totalQuantity: 5, totalAmount: 3960 + 2040 })
  })
})

describe('calcLineSubtotal', () => {
  it('単価×数量を返す', () => {
    const [line] = cart([{ price: 680, quantity: 3 }]).lines
    expect(line).toBeDefined()
    expect(calcLineSubtotal(line!)).toBe(2040)
  })
})
