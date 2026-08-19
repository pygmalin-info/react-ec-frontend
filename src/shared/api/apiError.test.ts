import { describe, expect, it } from 'vitest'
import { normalizeApiError } from './apiError'

/**
 * エラー分類のテスト。
 *
 * このアプリで最も分岐が多い場所であり、
 * 画面のエラー表示・再試行するかどうか・自動ログアウトするかどうかが
 * すべてこの kind に従って決まる。
 * axios に依存しない形にしてあるので、こうして素朴なオブジェクトで検証できる。
 */
describe('normalizeApiError', () => {
  it('レスポンスが無い場合は network', () => {
    expect(normalizeApiError(null).kind).toBe('network')
  })

  it('401 は unauthorized として、code も保持する', () => {
    const error = normalizeApiError({
      status: 401,
      body: { code: 'INVALID_CREDENTIALS', message: 'メールアドレスまたはパスワードが正しくありません。' },
    })

    expect(error.kind).toBe('unauthorized')
    // httpClient はこの code を見て「自動ログアウトするかどうか」を分けている
    expect(error.code).toBe('INVALID_CREDENTIALS')
    expect(error.message).toBe('メールアドレスまたはパスワードが正しくありません。')
  })

  it('403 は forbidden', () => {
    expect(normalizeApiError({ status: 403, body: { code: 'FORBIDDEN' } }).kind).toBe('forbidden')
  })

  it('fieldErrors がある 400 は validation として、項目ごとの形に変換する', () => {
    const error = normalizeApiError({
      status: 400,
      body: {
        code: 'VALIDATION_ERROR',
        message: '入力内容を確認してください。',
        fieldErrors: [
          { field: 'name', message: '商品名は必須です' },
          { field: 'price', message: '価格は0以上の整数で入力してください' },
        ],
      },
    })

    expect(error.kind).toBe('validation')
    expect(error.fieldErrors).toEqual({
      name: '商品名は必須です',
      price: '価格は0以上の整数で入力してください',
    })
  })

  it('fieldErrors が無い 400 は業務エラーとして扱う', () => {
    const error = normalizeApiError({
      status: 400,
      body: { code: 'OUT_OF_STOCK', message: '在庫が不足しています（残り 2 点）。' },
    })

    expect(error.kind).toBe('business')
    expect(error.message).toBe('在庫が不足しています（残り 2 点）。')
  })

  it('500 は unexpected とし、サーバーのメッセージは画面に出さない', () => {
    const error = normalizeApiError({
      status: 500,
      body: { code: 'INTERNAL_ERROR', message: 'NullPointerException at ProductService.java:42' },
    })

    expect(error.kind).toBe('unexpected')
    expect(error.message).not.toContain('NullPointerException')
  })

  it('同じ項目に複数のエラーが来たら最初の1件を使う', () => {
    const error = normalizeApiError({
      status: 400,
      body: {
        fieldErrors: [
          { field: 'name', message: '必須です' },
          { field: 'name', message: '100文字以内です' },
        ],
      },
    })

    expect(error.fieldErrors).toEqual({ name: '必須です' })
  })
})
