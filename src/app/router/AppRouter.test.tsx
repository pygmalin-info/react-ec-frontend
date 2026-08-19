import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import { signInAsAdmin, signInAsUser } from '@/test/auth'
import { AppRouter } from './AppRouter'

/**
 * 管理画面の保護（2段のガード）。
 *
 * 「ログインしていない人」と「権限が無い人」では、出すべき画面が違う。
 *   未ログイン → ログイン画面へ送る（ログインすれば解決するため）
 *   権限なし   → その場でメッセージ（ログインし直しても解決しないため）
 *
 * この2つが正しい順番で重なっていることを検証している。
 * 順番が入れ替わると、未ログインのときに「権限をサーバーに問い合わせる」ほうが先に動き、
 * 問い合わせが始まらないまま画面が止まる。
 */
describe('管理画面のルート保護', () => {
  it('未ログインで管理画面を開くと、ログイン画面に送られる', async () => {
    renderWithProviders(<AppRouter />, { route: '/admin/products' })

    expect(await screen.findByRole('heading', { name: 'ログイン' })).toBeInTheDocument()
  })

  it('一般ユーザーで管理画面を開くと、権限エラーが表示される', async () => {
    signInAsUser()

    renderWithProviders(<AppRouter />, { route: '/admin/products' })

    expect(await screen.findByText('この画面を表示する権限がありません。')).toBeInTheDocument()
  })

  it('管理者なら管理画面が表示される', async () => {
    signInAsAdmin()

    renderWithProviders(<AppRouter />, { route: '/admin/products' })

    expect(await screen.findByRole('heading', { name: '商品管理' })).toBeInTheDocument()
  })
})
