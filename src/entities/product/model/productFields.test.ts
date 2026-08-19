import { describe, expect, it } from 'vitest'
import { productWritableSchema } from './productFields'

const valid = {
  name: 'ステンレスマグカップ',
  description: '説明',
  price: '1980',
  stock: '12',
  categoryId: 'c_01',
  isPublished: true,
}

/**
 * Zod schema のテスト。
 *
 * 検証しているのは2つ:
 *   1. 不正な入力を弾けること
 *   2. 通過したあとに「型が変わっている」こと（string → number）
 * 2 はこの設計の要になっている部分なので、テストで固定しておく。
 */
describe('productWritableSchema', () => {
  it('正しい入力を通し、価格と在庫を数値に変換する', () => {
    const result = productWritableSchema.parse(valid)

    expect(result.price).toBe(1980)
    expect(result.stock).toBe(12)
    expect(typeof result.price).toBe('number')
  })

  it('商品名が空なら弾く', () => {
    const result = productWritableSchema.safeParse({ ...valid, name: '   ' })

    expect(result.success).toBe(false)
    expect(result.error?.issues.some((issue) => issue.path[0] === 'name')).toBe(true)
  })

  it('価格が整数でなければ弾く', () => {
    expect(productWritableSchema.safeParse({ ...valid, price: '1980.5' }).success).toBe(false)
    expect(productWritableSchema.safeParse({ ...valid, price: '-100' }).success).toBe(false)
    expect(productWritableSchema.safeParse({ ...valid, price: 'abc' }).success).toBe(false)
  })

  it('価格の上限を超えたら弾く', () => {
    expect(productWritableSchema.safeParse({ ...valid, price: '10000001' }).success).toBe(false)
  })

  it('カテゴリ未選択なら弾く', () => {
    const result = productWritableSchema.safeParse({ ...valid, categoryId: '' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('カテゴリを選択してください')
  })
})
