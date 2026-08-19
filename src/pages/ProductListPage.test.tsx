import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { env } from '@/shared/config/env'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ProductListPage } from './ProductListPage'

/**
 * 一覧画面の「取得できた」「0件だった」「失敗した」を検証する（PDF Q4）。
 *
 * 3つを別々のテストにしているのは、実装でも3つを別々に扱っているから。
 * 「0件」と「失敗」を1つの分岐で書いていると、
 * 通信エラーのときに「商品がありません」と表示してしまう。
 */
describe('ProductListPage', () => {
  it('取得できた商品を表示する', async () => {
    renderWithProviders(<ProductListPage />)

    expect(await screen.findByText('ステンレスマグカップ')).toBeInTheDocument()
    expect(screen.getByText('￥1,980')).toBeInTheDocument()
  })

  it('0件のときは「該当する商品がありません」を表示する', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/products`, () =>
        HttpResponse.json({ items: [], page: 1, size: 20, totalCount: 0 }),
      ),
    )

    renderWithProviders(<ProductListPage />)

    expect(await screen.findByText('該当する商品がありません。')).toBeInTheDocument()
  })

  it('取得に失敗したときはエラーを表示し、「商品がありません」とは表示しない', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/products`, () =>
        HttpResponse.json({ code: 'INTERNAL_ERROR', message: 'boom' }, { status: 500 }),
      ),
    )

    renderWithProviders(<ProductListPage />)

    expect(await screen.findByText(/予期しないエラーが発生しました/)).toBeInTheDocument()
    expect(screen.queryByText('該当する商品がありません。')).not.toBeInTheDocument()
  })
})
