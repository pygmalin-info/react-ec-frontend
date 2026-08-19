import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement, ReactNode } from 'react'

/**
 * テスト用のレンダリング。
 *
 * ■ retry を切っている理由
 *   本番の設定では通信エラーを2回まで再試行する。
 *   テストでそれをやると、失敗系のテストが再試行の分だけ遅くなる。
 *   「本番と同じ設定にする」より「検証したい振る舞いだけを残す」を優先している。
 *
 * ■ QueryClient をテストごとに作る理由
 *   使い回すと、前のテストで取得したキャッシュが次のテストに残る。
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

type Options = Omit<RenderOptions, 'wrapper'> & {
  route?: string
  queryClient?: QueryClient
}

export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const { route = '/', queryClient = createTestQueryClient(), ...renderOptions } = options

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }

  return { queryClient, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}
