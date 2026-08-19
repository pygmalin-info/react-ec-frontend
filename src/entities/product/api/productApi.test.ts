import { describe, expect, it } from 'vitest'
import { toProduct, type ProductResponse } from './productApi'

const response: ProductResponse = {
  id: 'p_01',
  name: 'ステンレスマグカップ',
  description: '保温・保冷に優れた二重構造のマグカップです。',
  priceInclTax: 1980,
  imagePath: '/images/p_01.svg',
  stock: 12,
  categoryId: 'c_01',
  categoryName: 'キッチン',
  isPublished: true,
  publishedAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-20T09:30:00.000Z',
}

/**
 * Mapper のテスト。
 *
 * ここが守っているのは「バックエンドのレスポンス形式が変わっても、
 * 画面側の Product は変わらない」という約束。
 * レスポンスの形が変わったときに最初に落ちるのがこのテストになる。
 */
describe('toProduct', () => {
  it('相対パスの画像を絶対URLに変換する', () => {
    expect(toProduct(response).imageUrl).toBe(`${window.location.origin}/images/p_01.svg`)
  })

  it('フラットなカテゴリ項目を1つのまとまりにする', () => {
    expect(toProduct(response).category).toEqual({ id: 'c_01', name: 'キッチン' })
  })

  it('日時の文字列を Date に変換する', () => {
    expect(toProduct(response).publishedAt).toBeInstanceOf(Date)
    expect(toProduct(response).publishedAt.toISOString()).toBe('2026-07-01T00:00:00.000Z')
  })

  it('バックエンド都合の項目名をフロントの言葉に置き換える', () => {
    expect(toProduct(response).price).toBe(1980)
  })

  it('変換の必要がない項目はそのまま渡す', () => {
    const product = toProduct(response)
    expect(product.stock).toBe(12)
    expect(product.isPublished).toBe(true)
    expect(product.name).toBe('ステンレスマグカップ')
  })
})
